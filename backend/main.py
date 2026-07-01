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

from routers import departments, employees, attendance, leave, payroll, assets, timesheets, performance, roles, profile, dashboard, notifications, holidays, calendar as calendar_router, clients, chat, announcements, access_control, companies
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
app.include_router(clients.router)
app.include_router(chat.router)
app.include_router(announcements.router)
app.include_router(access_control.router)
app.include_router(companies.router)

# Mount uploads directory
import os
os.makedirs("uploads/documents", exist_ok=True)
os.makedirs("uploads/logos", exist_ok=True)
os.makedirs("uploads/client_documents", exist_ok=True)
os.makedirs("uploads/chat_attachments", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
        "https://hrms.indotax.co.id",
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
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

@app.on_event("startup")
async def startup_event():
    import asyncio
    from notification_manager import manager
    manager.loop = asyncio.get_running_loop()
    
    # Run migrations check on startup
    from scratch.apply_migrations import run_migrations
    try:
        run_migrations()
    except Exception as e:
        print(f"Error running database schema updates: {e}")


    # Seed RBAC tables on startup
    from database import SessionLocal
    from utils.seed_rbac import seed_rbac_data
    db = SessionLocal()
    try:
        seed_rbac_data(db)
    except Exception as e:
        print(f"Error seeding RBAC data: {e}")
    finally:
        db.close()

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

@app.post("/api/auth/login", response_model=schemas.Token)
def login_for_access_token(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = auth.get_user_by_email(db, email=form_data.username)
    if not user or not user.is_active or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password, or your account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
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
    
    # Return a client-accessible dummy token to satisfy frontend routing
    return {"access_token": "cookie_based_session_active", "token_type": "bearer"}

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
    
    if current_user.email == "admin@mcs-consulting.com" or (current_user.role and "ADMIN" in current_user.role.name.upper()):
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
    
    # Get the origin from the request headers to build a dynamic link
    origin = request.headers.get("origin")
    if not origin:
        # Fallback to the host header if origin is missing
        host = request.headers.get("host", "hrms.indotax.co.id")
        protocol = request.headers.get("x-forwarded-proto", "http" if "localhost" in host else "https")
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
    hashed_password = auth.get_password_hash(req.new_password)
    user.hashed_password = hashed_password
    db.commit()
    
    return {"message": "Password successfully reset."}
