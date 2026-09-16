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

import datetime

@router.get("", response_model=schemas.EmployeeResponse)
@router.get("/", response_model=schemas.EmployeeResponse)
def get_my_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    
    if not employee:
        # Check if user is an external client, customer, or member - DO NOT auto-create Employee profile
        user_role_name = (current_user.role.name if current_user.role else "").upper()
        if user_role_name in ["CLIENT", "CUSTOMER", "MEMBER"] or current_user.client or current_user.customer or current_user.member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee profile not applicable for external customer/client/member accounts"
            )

        # 1. Check if an unlinked employee exists with a matching name from email
        email_prefix = (current_user.email or "user").split("@")[0]
        name_parts = [word.capitalize() for word in email_prefix.replace(".", " ").replace("_", " ").replace("-", " ").split()]
        first_name = name_parts[0] if name_parts else "User"
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        # 2. Auto-create a linked employee record so the user has a complete profile
        last_emp = db.query(models.Employee).filter(
            models.Employee.employee_id_custom.like('MCS%')
        ).order_by(models.Employee.employee_id_custom.desc()).first()
        
        custom_id = "MCS0001"
        if last_emp and last_emp.employee_id_custom:
            try:
                num = int(last_emp.employee_id_custom[3:])
                custom_id = f"MCS{num+1:04d}"
            except ValueError:
                custom_id = f"MCS{current_user.id:04d}"
        else:
            custom_id = f"MCS{current_user.id:04d}"

        role_title = current_user.role.name if current_user.role else "Staff"
        if auth.is_super_admin(current_user):
            role_title = "Administrator"

        employee = models.Employee(
            user_id=current_user.id,
            employee_id_custom=custom_id,
            first_name=first_name,
            last_name=last_name or "Profile",
            job_title=role_title,
            company_name="MCS Consulting",
            hire_date=datetime.date.today(),
            status=models.EmploymentStatus.ACTIVE
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)

        # Create default leave balance
        leave_bal = models.LeaveBalance(
            employee_id=employee.id,
            annual_leave_balance=14,
            sick_leave_balance=0
        )
        db.add(leave_bal)
        db.commit()

    return employee

@router.put("", response_model=schemas.EmployeeResponse)
@router.put("/", response_model=schemas.EmployeeResponse)
def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        employee = get_my_profile(current_user=current_user, db=db)
    
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

