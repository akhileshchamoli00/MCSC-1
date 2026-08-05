from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/profile",
    tags=["profile"],
    dependencies=[Depends(auth.get_current_user)]
)

class ProfileUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    profile_photo: Optional[str] = None

@router.get("", response_model=schemas.EmployeeResponse)
def get_my_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return employee

@router.put("", response_model=schemas.EmployeeResponse)
def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    update_data = profile_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(employee, key, value)
        
    db.commit()
    db.refresh(employee)
    return employee

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.put("/change-password")
def change_my_password(
    password_data: PasswordChangeRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    if not auth.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
        
    auth.validate_password_strength(password_data.new_password)
    
    hashed_pw = auth.get_password_hash(password_data.new_password)
    current_user.hashed_password = hashed_pw
    db.commit()
    auth.clear_user_cache(current_user.email)
    return {"message": "Password changed successfully"}

