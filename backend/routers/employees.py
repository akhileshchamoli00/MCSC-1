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
async def upload_employee_document(
    employee_id: int, 
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    from storage import upload_file_to_supabase
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    import datetime
    import re
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    emp_name = f"{employee.first_name}_{employee.last_name or ''}".strip()
    emp_name_clean = re.sub(r'[^a-zA-Z0-9_]', '', emp_name.replace(" ", "_"))
    
    file_ext = file.filename.split(".")[-1] if "." in file.filename else ""
    orig_name = file.filename.rsplit(".", 1)[0]
    orig_name_clean = re.sub(r'[^a-zA-Z0-9_]', '_', orig_name)
    
    new_filename = f"{emp_name_clean}_{timestamp}_{orig_name_clean}.{file_ext}" if file_ext else f"{emp_name_clean}_{timestamp}_{orig_name_clean}"

    file_bytes = await file.read()
    file_url = upload_file_to_supabase(file_bytes, new_filename, "hrms-documents")
    
    new_doc = models.EmployeeDocument(
        employee_id=employee_id,
        document_type=document_type,
        file_name=new_filename,
        file_url=file_url
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.post("/{employee_id}/photo", response_model=schemas.EmployeeResponse)
async def upload_employee_photo(
    employee_id: int, 
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    from storage import upload_public_file_to_supabase
    from utils.file_sanitizer import validate_and_sanitize_file

    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    file_bytes = await file.read()
    sanitized_bytes, secure_filename = validate_and_sanitize_file(
        file_bytes=file_bytes,
        original_filename=file.filename or "photo.jpg",
        allowed_types=["jpeg", "png"],
        strip_exif=True
    )
    
    file_url = upload_public_file_to_supabase(sanitized_bytes, f"photo_{secure_filename}", "profile-photos")
    employee.profile_photo = file_url
    
    db.commit()
    db.refresh(employee)
    return employee

@router.delete("/{employee_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee_document(employee_id: int, document_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.has_permission(current_user, "employees_all", "delete", db) or auth.is_super_admin(current_user)):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    doc = db.query(models.EmployeeDocument).filter(
        models.EmployeeDocument.id == document_id, 
        models.EmployeeDocument.employee_id == employee_id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    from storage import delete_file_from_supabase
    if doc.file_url:
        delete_file_from_supabase(doc.file_url, "hrms-documents")
        
    db.delete(doc)
    db.commit()
    return None
