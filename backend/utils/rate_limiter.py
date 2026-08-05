import time
from collections import defaultdict
from fastapi import Request, HTTPException, status

# Sliding window rate limiter: IP -> list of failed attempt timestamps
FAILED_LOGIN_ATTEMPTS = defaultdict(list)

def check_login_rate_limit(request: Request, max_attempts: int = 5, window_seconds: int = 300):
    """
    Enforces IP-based rate limiting on login attempts.
    If 5 failed attempts occur within 5 minutes (300s), raises HTTP 429 Too Many Requests.
    """
    client_ip = get_client_ip(request)
    now = time.time()
    
    # Filter timestamps within sliding window
    FAILED_LOGIN_ATTEMPTS[client_ip] = [
        ts for ts in FAILED_LOGIN_ATTEMPTS[client_ip] if now - ts < window_seconds
    ]
    
    if len(FAILED_LOGIN_ATTEMPTS[client_ip]) >= max_attempts:
        oldest_ts = FAILED_LOGIN_ATTEMPTS[client_ip][0]
        retry_after = max(1, int(window_seconds - (now - oldest_ts)))
        
        mins = retry_after // 60
        secs = retry_after % 60
        if mins > 0:
            time_str = f"{mins} minute{'s' if mins > 1 else ''} and {secs} second{'s' if secs != 1 else ''}"
        else:
            time_str = f"{secs} second{'s' if secs != 1 else ''}"

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please wait {retry_after} seconds before trying again.",
            headers={"Retry-After": str(retry_after)}
        )

def record_failed_attempt(request: Request):
    """
    Records a failed login attempt for the client IP.
    """
    client_ip = get_client_ip(request)
    FAILED_LOGIN_ATTEMPTS[client_ip].append(time.time())

def clear_failed_attempts(request: Request):
    """
    Clears recorded failed attempts upon successful authentication.
    """
    client_ip = get_client_ip(request)
    if client_ip in FAILED_LOGIN_ATTEMPTS:
        del FAILED_LOGIN_ATTEMPTS[client_ip]

def get_client_ip(request: Request) -> str:
    """
    Extracts true client IP address accounting for proxies/load balancers.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"
