from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, database
import os
import shutil
from utils.email_service import send_welcome_email

router = APIRouter(
    prefix="/api/employees",
    tags=["employees"],
    dependencies=[Depends(auth.get_current_user)]
)

@router.get("", response_model=List[schemas.EmployeeResponse])
def get_employees(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    employees = db.query(models.Employee).order_by(models.Employee.first_name, models.Employee.last_name).offset(skip).limit(limit).all()
    return employees

@router.get("/{employee_id}", response_model=schemas.EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(database.get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.post("", response_model=schemas.EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(employee: schemas.EmployeeCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    db_employee = db.query(models.Employee).filter(models.Employee.user_id == employee.user_id).first()
    if db_employee:
        raise HTTPException(status_code=400, detail="Employee record already exists for this user")
    
    data = employee.model_dump() if hasattr(employee, "model_dump") else employee.dict()
    
    annual_leave = data.pop("annual_leave_balance", 14)
    sick_leave = data.pop("sick_leave_balance", 0)
    role_id = data.pop("role_id", None)
    
    # Auto-calculate tax percentage if tax_category is set
    if data.get("tax_category"):
        from utils.tax_calculator import calculate_employee_tax_percentage
        data["tax_percentage"] = calculate_employee_tax_percentage(data)
    
    # Auto-generate employee_id_custom if not provided
    if not data.get("employee_id_custom"):
        last_emp = db.query(models.Employee).filter(
            models.Employee.employee_id_custom.like('MCS%')
        ).order_by(models.Employee.employee_id_custom.desc()).first()
        
        if last_emp and last_emp.employee_id_custom:
            try:
                num = int(last_emp.employee_id_custom[3:])
                data["employee_id_custom"] = f"MCS{num+1:04d}"
            except ValueError:
                data["employee_id_custom"] = "MCS0001"
        else:
            data["employee_id_custom"] = "MCS0001"
            
    new_employee = models.Employee(**data)
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    # Auto-create default leave balance
    initial_balance = models.LeaveBalance(
        employee_id=new_employee.id,
        annual_leave_balance=annual_leave,
        sick_leave_balance=sick_leave
    )
    db.add(initial_balance)
    
    if new_employee.status == models.EmploymentStatus.TERMINATED or new_employee.status == "TERMINATED":
        if new_employee.user:
            new_employee.user.is_active = False
            
    if role_id is not None:
        if new_employee.user:
            new_employee.user.role_id = role_id
            
    db.commit()

    # Trigger welcome email
    if new_employee.user_id:
        user = db.query(models.User).filter(models.User.id == new_employee.user_id).first()
        if user and user.email:
            name = f"{new_employee.first_name} {new_employee.last_name or ''}".strip()
            # The default password used in the frontend registration
            background_tasks.add_task(send_welcome_email, user.email, name, "McsTempPassword123!")

    return new_employee

@router.put("/{employee_id}", response_model=schemas.EmployeeResponse)
def update_employee(employee_id: int, employee_update: schemas.EmployeeBase, db: Session = Depends(database.get_db)):
    db_employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    update_data = employee_update.model_dump() if hasattr(employee_update, "model_dump") else employee_update.dict()
    
    # Auto-calculate tax percentage if tax_category is set
    if update_data.get("tax_category"):
        from utils.tax_calculator import calculate_employee_tax_percentage
        update_data["tax_percentage"] = calculate_employee_tax_percentage(update_data)
    
    # role_id is updated on the User model, not Employee
    role_id = update_data.pop("role_id", None)
    
    for key, value in update_data.items():
        setattr(db_employee, key, value)
        
    if role_id is not None:
        if db_employee.user:
            db_employee.user.role_id = role_id
        
    # If the employee status is changed to TERMINATED, deactivate their login user account
    if db_employee.status == models.EmploymentStatus.TERMINATED or db_employee.status == "TERMINATED":
        if db_employee.user:
            db_employee.user.is_active = False
    elif db_employee.status == models.EmploymentStatus.ACTIVE or db_employee.status == "ACTIVE":
        if db_employee.user:
            db_employee.user.is_active = True

    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(database.get_db)):
    db_employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(db_employee)
    db.commit()
    return

@router.get("/{employee_id}/documents", response_model=List[schemas.EmployeeDocumentResponse])
def get_employee_documents(employee_id: int, db: Session = Depends(database.get_db)):
    documents = db.query(models.EmployeeDocument).filter(models.EmployeeDocument.employee_id == employee_id).all()
    return documents

@router.post("/{employee_id}/documents", response_model=schemas.EmployeeDocumentResponse)
def upload_employee_document(
    employee_id: int, 
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    upload_dir = os.path.join("uploads", "documents")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"emp_{employee_id}_{document_type.replace(' ', '_')}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"/uploads/documents/{safe_filename}"
    
    new_doc = models.EmployeeDocument(
        employee_id=employee_id,
        document_type=document_type,
        file_name=file.filename,
        file_url=file_url
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.post("/{employee_id}/photo", response_model=schemas.EmployeeResponse)
def upload_employee_photo(
    employee_id: int, 
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    upload_dir = os.path.join("uploads", "profiles")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    safe_filename = f"emp_{employee_id}_photo{file_extension}"
    file_path = os.path.join(upload_dir, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"/uploads/profiles/{safe_filename}"
    employee.profile_photo = file_url
    
    db.commit()
    db.refresh(employee)
    return employee

