import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

import schemas, models, database

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey-change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days for MVP

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

class CachedUser:
    def __init__(self, user_dict):
        self.id = user_dict["id"]
        self.email = user_dict["email"]
        self.hashed_password = user_dict.get("hashed_password")
        self.is_active = user_dict["is_active"]
        self.role_id = user_dict["role_id"]
        self.created_at = user_dict["created_at"]
        
        class CachedRole:
            def __init__(self, role_id, name, description):
                self.id = role_id
                self.name = name
                self.description = description
        self.role = CachedRole(
            user_dict["role_id_db"],
            user_dict["role_name"],
            user_dict["role_description"]
        ) if user_dict["role_name"] else None
        
        class CachedEmployee:
            def __init__(self, emp_dict):
                self.__dict__.update(emp_dict)
        self.employee = CachedEmployee(user_dict["employee"]) if user_dict["employee"] else None

        class CachedClient:
            def __init__(self, client_dict):
                self.__dict__.update(client_dict)
        self.client = CachedClient(user_dict["client"]) if user_dict.get("client") else None

# In-memory authentication cache: email -> (user_dict, expiry_timestamp)
_user_cache = {}
CACHE_TTL_SECONDS = 30

def get_cached_user(db: Session, email: str):
    import time
    from sqlalchemy.orm import joinedload
    from sqlalchemy import inspect
    now = time.time()
    if email in _user_cache:
        user_dict, expiry = _user_cache[email]
        if now < expiry:
            return CachedUser(user_dict)
            
    # Eagerly load user, role, and employee relationships
    db_user = db.query(models.User).options(
        joinedload(models.User.role),
        joinedload(models.User.employee),
        joinedload(models.User.client)
    ).filter(models.User.email == email).first()
    
    if not db_user:
        return None
        
    db_employee = db_user.employee
    employee_dict = None
    if db_employee:
        employee_dict = {}
        mapper = inspect(db_employee.__class__)
        for col in mapper.columns:
            employee_dict[col.key] = getattr(db_employee, col.key)
            
    db_client = db_user.client
    client_dict = None
    if db_client:
        client_dict = {}
        mapper = inspect(db_client.__class__)
        for col in mapper.columns:
            client_dict[col.key] = getattr(db_client, col.key)
        
    user_dict = {
        "id": db_user.id,
        "email": db_user.email,
        "hashed_password": db_user.hashed_password,
        "is_active": db_user.is_active,
        "role_id": db_user.role_id,
        "created_at": db_user.created_at,
        "role_name": db_user.role.name if db_user.role else None,
        "role_description": db_user.role.description if db_user.role else None,
        "role_id_db": db_user.role.id if db_user.role else None,
        "employee": employee_dict,
        "client": client_dict
    }
    
    _user_cache[email] = (user_dict, now + CACHE_TTL_SECONDS)
    return db_user

def clear_user_cache(email: str):
    """
    Clears cached user data to force immediate re-authentication.
    """
    if email in _user_cache:
        del _user_cache[email]

def get_user_by_email(db: Session, email: str):
    return get_cached_user(db, email)

async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Attempt to extract the token from the HttpOnly cookie
    cookie_token = request.cookies.get("hrms_token")
    actual_token = cookie_token if cookie_token else token
    
    if not actual_token or actual_token == "cookie_based_session_active":
        raise credentials_exception
    
    try:
        payload = jwt.decode(actual_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
        
    user = get_user_by_email(db, email=token_data.email)
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def is_super_admin(user) -> bool:
    if not user:
        return False
    if getattr(user, "email", None) == "admin@mcs-consulting.com":
        return True
    if getattr(user, "role_id", None) == 1:
        return True
    role_obj = getattr(user, "role", None)
    if role_obj and getattr(role_obj, "name", None):
        name_upper = str(role_obj.name).strip().upper()
        if name_upper in ["ADMIN", "SUPER ADMIN", "SUPERADMIN", "SYSTEM ADMIN"]:
            return True
    return False

def check_permission(module_code: str, permission_code: str):
    def dependency(
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(database.get_db)
    ):
        # Admin override (only for Super Admin / primary admin role)
        if is_super_admin(current_user):
            return current_user
            
        if not current_user.role_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. No role assigned."
            )
            
        # Check permissions in db
        has_perm = db.query(models.RolePermission)\
            .join(models.Module, models.RolePermission.module_id == models.Module.id)\
            .join(models.Permission, models.RolePermission.permission_id == models.Permission.id)\
            .filter(
                models.RolePermission.role_id == current_user.role_id,
                models.Module.code == module_code,
                models.Permission.code == permission_code
            ).first()
            
        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required permission '{module_code}:{permission_code}' not granted."
            )
        return current_user
    return dependency


def has_permission(current_user: models.User, module_code: str, permission_code: str, db: Session) -> bool:
    if is_super_admin(current_user):
        return True
    if not current_user.role_id:
        return False
    has_perm = db.query(models.RolePermission)\
        .join(models.Module, models.RolePermission.module_id == models.Module.id)\
        .join(models.Permission, models.RolePermission.permission_id == models.Permission.id)\
        .filter(
            models.RolePermission.role_id == current_user.role_id,
            models.Module.code == module_code,
            models.Permission.code == permission_code
        ).first()
    return has_perm is not None


def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not any(c.isupper() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter."
        )
    if not any(c.islower() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter."
        )
    if not any(c.isdigit() for c in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one numeric digit."
        )


