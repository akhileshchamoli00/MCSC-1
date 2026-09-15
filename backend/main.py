import os
from pathlib import Path
from dotenv import load_dotenv

# Load root .env.local as the single source of truth for all backend services
root_env_path = Path(__file__).resolve().parent.parent / ".env.local"
if root_env_path.exists():
    load_dotenv(dotenv_path=root_env_path, override=True)

from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta

import models, schemas, auth, database
from database import engine

# Note: We rely on Alembic for migrations, so we don't strictly need create_all
# models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MCSC HRMS API")

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: blob: https://*.google.com; "
        "frame-src 'self' https://calendar.google.com https://*.google.com https://*.google.co.id; "
        "connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 https://*; "
        "frame-ancestors 'self'; "
        "object-src 'none'; "
        "base-uri 'self';"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "0"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

from routers import departments, employees, attendance, leave, payroll, assets, timesheets, performance, roles, profile, dashboard, notifications, holidays, calendar as calendar_router, clients, chat, announcements, access_control, companies, dropbox, notaries, teams, webhooks, accurate
app.include_router(departments.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(leave.router)
app.include_router(payroll.router)
app.include_router(assets.router)
app.include_router(timesheets.router)
app.include_router(performance.router)
app.include_router(roles.router)
app.include_router(profile.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(holidays.router)
app.include_router(calendar_router.router)
app.include_router(notaries.router, prefix="/api/clients/notaries", tags=["notaries"])
app.include_router(clients.router)
app.include_router(clients.public_router)
app.include_router(clients.public_orders_router)
app.include_router(chat.router)
app.include_router(announcements.router)
app.include_router(access_control.router)
app.include_router(companies.router)
app.include_router(dropbox.router)
app.include_router(teams.router)
app.include_router(webhooks.router)
app.include_router(accurate.router)

# Persistent uploads directory (located outside git code directory on AWS)
import os
from storage import UPLOAD_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)

from fastapi.responses import FileResponse
from jose import jwt, JWTError

PUBLIC_UPLOAD_SUBFOLDERS = {"profile-photos", "logos", "public"}

@app.get("/uploads/{subfolder}/{file_path:path}")
async def get_uploaded_file(
    subfolder: str,
    file_path: str,
    request: Request,
    db: Session = Depends(database.get_db)
):
    """
    Secure file streaming endpoint.
    - Public assets (profile-photos, logos) are served immediately.
    - Protected documents (hrms-documents, client-documents, chat_attachments) require authentication & RBAC.
    """
    clean_subfolder = os.path.basename(subfolder.replace("\\", "/").strip())
    clean_file_path = file_path.replace("\\", "/").lstrip("/")
    
    base_dir = os.path.abspath(UPLOAD_DIR)
    target_path = os.path.abspath(os.path.join(base_dir, clean_subfolder, clean_file_path))
    
    # Path traversal protection
    if not target_path.startswith(base_dir) or not os.path.exists(target_path) or not os.path.isfile(target_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    # 1. Public assets: served immediately
    if clean_subfolder in PUBLIC_UPLOAD_SUBFOLDERS:
        return FileResponse(
            target_path,
            headers={
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "public, max-age=86400"
            }
        )
        
    # 2. Protected files: require valid session token (cookie, Authorization header, or query param)
    token = request.cookies.get("hrms_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
    if not token:
        token = request.query_params.get("token")
        
    if not token or token == "cookie_based_session_active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access protected documents",
            headers={"WWW-Authenticate": "Bearer"}
        )
        
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid session token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")
        
    current_user = auth.get_user_by_email(db, email=email)
    if not current_user or not current_user.is_active:
        raise HTTPException(status_code=401, detail="User account inactive or not found")
        
    # 3. RBAC & Multi-Tenant Authorization Checks
    if not auth.is_super_admin(current_user):
        role_name = (current_user.role.name if current_user.role else "").strip().upper()
        
        if clean_subfolder in ("client-documents", "client_documents"):
            has_staff_perm = (
                auth.has_permission(current_user, "clients_documents", "view", db) or
                auth.has_permission(current_user, "clients_company", "view", db) or
                auth.has_permission(current_user, "clients_all", "view", db)
            )
            if not has_staff_perm:
                user_company_codes = []
                if current_user.client:
                    for c in current_user.client.companies:
                        if c.company_code:
                            user_company_codes.append(c.company_code.lower())
                        user_company_codes.append(f"comp_{c.id}".lower())
                        user_company_codes.append(f"company_{c.id}".lower())
                
                path_lower = clean_file_path.lower()
                is_authorized_client = any(
                    path_lower.startswith(f"{code}/") or f"/{code}/" in path_lower or path_lower.startswith(f"{code}_") or f"_{code}_" in path_lower
                    for code in user_company_codes
                )
                if not is_authorized_client:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied. You do not have permission to view this client document."
                    )
                    
        elif clean_subfolder == "hrms-documents":
            has_hrms_perm = (
                auth.has_permission(current_user, "employees_all", "view", db) or
                auth.has_permission(current_user, "announcements", "view", db) or
                auth.has_permission(current_user, "leave_requests", "view", db) or
                (role_name not in ("CLIENT", "MEMBER") and not clean_file_path.lower().startswith("contract_"))
            )
            if not has_hrms_perm:
                emp = current_user.employee
                is_own = False
                if emp:
                    emp_code = (emp.employee_id_custom or "").lower()
                    emp_name = f"{emp.first_name}_{emp.last_name or ''}".strip().lower()
                    if (emp_code and emp_code in clean_file_path.lower()) or (emp_name and emp_name in clean_file_path.lower()):
                        is_own = True
                if not is_own:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Access denied. You do not have permission to view this HR document."
                    )
                    
        elif clean_subfolder == "chat_attachments":
            # Active authenticated users can access chat attachments
            pass
            
    return FileResponse(
        target_path,
        headers={
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-cache"
        }
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
        "https://www.mcsc.co.id",
        "https://hrms-backend-979749601379.asia-southeast1.run.app",
        os.getenv("FRONTEND_URL", "https://www.mcsc.co.id"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def run_daily_accrual_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        from database import SessionLocal
        from utils.leave_accrual import run_daily_accruals_if_needed
        db = SessionLocal()
        try:
            run_daily_accruals_if_needed(db)
        except Exception as e:
            print(f"Error running daily leave accruals: {e}")
        finally:
            db.close()
    return await call_next(request)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

@app.on_event("startup")
async def startup_event():
    import asyncio
    from notification_manager import manager
    manager.loop = asyncio.get_running_loop()
    
    # Run migrations check and RBAC seed on startup
    from utils.apply_migrations import run_migrations
    try:
        run_migrations()
    except Exception as e:
        print(f"Error running database schema updates: {e}")

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = auth.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password,
        role_id=user.role_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/api/auth/member-register")
def register_member(
    req: schemas.MemberRegisterRequest,
    response: Response,
    db: Session = Depends(database.get_db)
):
    from routers.clients import validate_and_clean_email, validate_and_clean_phone
    
    clean_email = validate_and_clean_email(req.email, "Email Address", required=True)
    clean_phone = validate_and_clean_phone(req.phone, "Mobile Number", required=False) if req.phone else None

    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
    existing_user = auth.get_user_by_email(db, email=clean_email)
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")
        
    # Get or create MEMBER role
    member_role = db.query(models.Role).filter(models.Role.name == "MEMBER").first()
    if not member_role:
        member_role = models.Role(name="MEMBER", description="Public Registered Member Role")
        db.add(member_role)
        db.commit()
        db.refresh(member_role)
        
    # Create User
    hashed_password = auth.get_password_hash(req.password)
    new_user = models.User(
        email=clean_email,
        hashed_password=hashed_password,
        role_id=member_role.id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create Member record
    new_member = models.Member(
        user_id=new_user.id,
        full_name=req.name.strip(),
        email=clean_email,
        phone=clean_phone,
        date_of_birth=req.date_of_birth,
        status="ACTIVE"
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    # Generate Access Token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="hrms_token",
        value=access_token,
        httponly=True,
        secure=os.getenv("ENV", "development") == "production" or os.getenv("SECURE_COOKIES", "false").lower() == "true",
        samesite="lax",
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_member.full_name,
            "role": "MEMBER",
            "phone": new_member.phone,
            "date_of_birth": str(new_member.date_of_birth) if new_member.date_of_birth else None
        }
    }


from utils.rate_limiter import check_login_rate_limit, record_failed_attempt, clear_failed_attempts

@app.post("/api/auth/member-login")
def login_member(
    req: schemas.MemberLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(database.get_db)
):
    check_login_rate_limit(request, max_attempts=5, window_seconds=300, db=db)
    
    clean_email = req.email.lower().strip()
    user = auth.get_user_by_email(db, email=clean_email)
    if not user or not user.is_active or not auth.verify_password(req.password, user.hashed_password):
        record_failed_attempt(request, attempted_email=clean_email, db=db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
        
    clear_failed_attempts(request, attempted_email=clean_email, db=db)
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="hrms_token",
        value=access_token,
        httponly=True,
        secure=os.getenv("ENV", "development") == "production" or os.getenv("SECURE_COOKIES", "false").lower() == "true",
        samesite="lax",
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    user_name = user.name
    if user.member:
        user_name = user.member.full_name
        
    role_name = user.role.name if user.role else "MEMBER"
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user_name,
            "role": role_name
        }
    }

@app.post("/api/auth/login", response_model=schemas.Token)
def login_for_access_token(
    request: Request, 
    response: Response, 
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(database.get_db)
):
    check_login_rate_limit(request, max_attempts=5, window_seconds=300, db=db)
    
    clean_email = (form_data.username or "").strip().lower()
    user = auth.get_user_by_email(db, email=clean_email)
    if not user or not user.is_active or not auth.verify_password(form_data.password, user.hashed_password):
        record_failed_attempt(request, attempted_email=clean_email, db=db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    clear_failed_attempts(request, attempted_email=clean_email, db=db)
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Set the real JWT token in a secure HttpOnly cookie
    response.set_cookie(
        key="hrms_token",
        value=access_token,
        httponly=True,
        secure=os.getenv("ENV", "development") == "production" or os.getenv("SECURE_COOKIES", "false").lower() == "true",
        samesite="lax",
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    # Return the real JWT token in the JSON response to support WebSocket authentication
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/logout")
def logout_user(response: Response):
    response.delete_cookie(
        key="hrms_token",
        httponly=True,
        secure=os.getenv("ENV", "development") == "production" or os.getenv("SECURE_COOKIES", "false").lower() == "true",
        samesite="lax"
    )
    return {"message": "Logged out successfully"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    user_response = schemas.UserResponse.model_validate(current_user)
    
    if auth.is_super_admin(current_user):
        user_response.permissions = ["*:*"]
    else:
        role_perms = db.query(models.RolePermission)\
            .join(models.Module, models.RolePermission.module_id == models.Module.id)\
            .join(models.Permission, models.RolePermission.permission_id == models.Permission.id)\
            .filter(models.RolePermission.role_id == current_user.role_id).all()
        user_response.permissions = [f"{rp.module.code}:{rp.permission.code}" for rp in role_perms]
        
    return user_response

@app.post("/api/auth/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, request: Request, db: Session = Depends(database.get_db)):
    user = auth.get_user_by_email(db, email=req.email)
    if not user:
        # To prevent email enumeration, we just return success anyway
        return {"message": "If that email is registered, a password reset link has been sent."}
        
    # Generate a secure reset token that expires in 1 hour
    from datetime import timedelta
    reset_token = auth.create_access_token(
        data={"sub": user.email, "type": "password_reset"}, 
        expires_delta=timedelta(hours=1)
    )
    
    # Send email
    from utils.email_service import send_password_reset_email
    
    # Try to get FRONTEND_URL from environment first
    origin = os.getenv("FRONTEND_URL")
    
    # Next, try to get the origin from the request headers
    if not origin:
        origin = request.headers.get("origin")
        
    if not origin:
        # Fallback to the host header if origin is missing
        host = request.headers.get("x-forwarded-host") or request.headers.get("host", "www.mcsc.co.id")
        protocol = request.headers.get("x-forwarded-proto", "http" if "localhost" in host else "https")
        
        if "hrms-backend-979749601379.asia-southeast1.run.app" in host:
            origin = "https://hrms-backend-979749601379.asia-southeast1.run.app"
        elif "mcsc.co.id" in host:
            origin = "https://www.mcsc.co.id"
        elif "127.0.0.1" in host or "localhost" in host:
            origin = "http://localhost:3000"
        else:
            origin = f"{protocol}://{host}"
        
    reset_link = f"{origin}/reset-password?token={reset_token}"
    send_password_reset_email(user.email, reset_link)
    
    return {"message": "If that email is registered, a password reset link has been sent."}

@app.post("/api/auth/reset-password")
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    from jose import JWTError, jwt
    try:
        payload = jwt.decode(req.token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid token")
            
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = auth.get_user_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Update password
    auth.validate_password_strength(req.new_password)
    user.hashed_password = hashed_password
    db.commit()
    
    return {"message": "Password successfully reset."}

@app.post("/api/contact")
async def submit_contact_form(request: Request):
    """
    Public endpoint for processing website contact leads and dispatching notification emails.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    name = payload.get("name", "").strip()
    email = payload.get("email", "").strip()
    phone = payload.get("phone", "").strip()
    message = payload.get("message", "").strip()

    if not name or not email or not message:
        raise HTTPException(status_code=400, detail="Name, email, and message are required.")

    from utils.email_service import send_contact_lead_email
    success = send_contact_lead_email(name=name, email=email, phone=phone, message=message)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to dispatch contact inquiry email. Please verify SMTP settings.")

    return {"success": True, "message": "Message sent successfully!"}

@app.post("/api/status-check")
async def submit_trademark_status_query(request: Request):
    """
    Public endpoint for processing website trademark status queries and dispatching notification emails.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    brand_name = payload.get("brandInput", "").strip()
    owner_name = payload.get("ownerInput", "").strip()
    email = payload.get("emailInput", "").strip()
    app_no = payload.get("appNoInput", "").strip()
    reg_no = payload.get("regNoInput", "").strip()

    from utils.email_service import send_trademark_query_email
    success = send_trademark_query_email(
        brand_name=brand_name,
        owner_name=owner_name,
        email=email,
        app_no=app_no,
        reg_no=reg_no
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to dispatch trademark query email.")

    return {"success": True, "message": "Trademark status query submitted successfully!"}

