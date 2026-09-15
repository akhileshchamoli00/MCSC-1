import os
import time
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from typing import Optional
from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
import models

# In-memory fast cache: IP -> list of failed attempt timestamps
FAILED_LOGIN_ATTEMPTS = defaultdict(list)

def get_client_ip(request: Request) -> str:
    """
    Extracts client IP address safely.
    Only trusts proxy headers (CF-Connecting-IP, X-Real-IP, X-Forwarded-For) if explicitly
    configured via TRUST_PROXY_HEADERS=true or running in production behind a verified proxy.
    Otherwise defaults strictly to the direct socket connection host (request.client.host).
    """
    trust_proxy = (
        os.getenv("TRUST_PROXY_HEADERS", "false").lower() == "true" or
        os.getenv("ENV", "development").lower() == "production"
    )
    
    if trust_proxy:
        # Cloudflare connecting IP
        cf_ip = request.headers.get("CF-Connecting-IP")
        if cf_ip:
            return cf_ip.strip()
            
        # NGINX / ALB Real IP
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()

        # Standard Forwarded header (take last untrusted hop or first client)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
            
    return request.client.host if request.client else "127.0.0.1"


def check_login_rate_limit(
    request: Request, 
    max_attempts: int = 5, 
    window_seconds: int = 300,
    db: Optional[Session] = None
):
    """
    Enforces rate limiting on login attempts across single or multi-worker deployments.
    Uses PostgreSQL database records when db Session is supplied; falls back to in-memory window.
    """
    client_ip = get_client_ip(request)
    now = time.time()
    
    # 1. Database-backed multi-worker check
    if db is not None:
        try:
            window_start = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
            recent_failed_count = db.query(models.LoginAttempt).filter(
                models.LoginAttempt.ip_address == client_ip,
                models.LoginAttempt.is_successful == False,
                models.LoginAttempt.created_at >= window_start
            ).count()
            
            if recent_failed_count >= max_attempts:
                # Find oldest attempt in window to calculate remaining cooldown
                oldest = db.query(models.LoginAttempt).filter(
                    models.LoginAttempt.ip_address == client_ip,
                    models.LoginAttempt.is_successful == False,
                    models.LoginAttempt.created_at >= window_start
                ).order_by(models.LoginAttempt.created_at.asc()).first()
                
                retry_after = window_seconds
                if oldest and oldest.created_at:
                    elapsed = (datetime.now(timezone.utc) - oldest.created_at.replace(tzinfo=timezone.utc)).total_seconds()
                    retry_after = max(1, int(window_seconds - elapsed))

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many failed login attempts. Please wait {retry_after} seconds before trying again.",
                    headers={"Retry-After": str(retry_after)}
                )
            return
        except HTTPException:
            raise
        except Exception as e:
            # Fall back to in-memory on DB connection glitches
            print(f"Warning: DB rate limit query error: {e}")

    # 2. In-memory sliding window fallback
    FAILED_LOGIN_ATTEMPTS[client_ip] = [
        ts for ts in FAILED_LOGIN_ATTEMPTS[client_ip] if now - ts < window_seconds
    ]
    
    if len(FAILED_LOGIN_ATTEMPTS[client_ip]) >= max_attempts:
        oldest_ts = FAILED_LOGIN_ATTEMPTS[client_ip][0]
        retry_after = max(1, int(window_seconds - (now - oldest_ts)))
        
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please wait {retry_after} seconds before trying again.",
            headers={"Retry-After": str(retry_after)}
        )


def record_failed_attempt(
    request: Request, 
    attempted_email: Optional[str] = None,
    db: Optional[Session] = None
):
    """
    Records a failed login attempt in both memory and the database audit table.
    """
    client_ip = get_client_ip(request)
    FAILED_LOGIN_ATTEMPTS[client_ip].append(time.time())
    
    if db is not None:
        try:
            user_agent = request.headers.get("User-Agent", "")[:255]
            attempt = models.LoginAttempt(
                ip_address=client_ip,
                attempted_email=(attempted_email or "").strip().lower()[:255],
                is_successful=False,
                user_agent=user_agent
            )
            db.add(attempt)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Warning: Failed to record login attempt to DB: {e}")


def clear_failed_attempts(
    request: Request, 
    attempted_email: Optional[str] = None,
    db: Optional[Session] = None
):
    """
    Clears recorded failed attempts upon successful authentication.
    """
    client_ip = get_client_ip(request)
    if client_ip in FAILED_LOGIN_ATTEMPTS:
        del FAILED_LOGIN_ATTEMPTS[client_ip]
        
    if db is not None:
        try:
            # Log successful login event
            user_agent = request.headers.get("User-Agent", "")[:255]
            attempt = models.LoginAttempt(
                ip_address=client_ip,
                attempted_email=(attempted_email or "").strip().lower()[:255],
                is_successful=True,
                user_agent=user_agent
            )
            db.add(attempt)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Warning: Failed to log successful login to DB: {e}")
