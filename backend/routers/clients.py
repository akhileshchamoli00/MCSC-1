from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid
from datetime import datetime

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/clients",
    tags=["clients"],
    dependencies=[Depends(auth.get_current_user)]
)

def is_admin_or_hr(user: models.User) -> bool:
    if not user.role:
        return False
    role_name = user.role.name.upper()
    return "ADMIN" in role_name or role_name == "HR"

def is_assigned_employee_to_company(user: models.User, company_id: int, db: Session) -> bool:
    if user.role is not None and user.role.name.upper() == "EMPLOYEE" and user.employee:
        assignment = db.query(models.ClientConsultant).filter(
            models.ClientConsultant.company_id == company_id,
            models.ClientConsultant.employee_id == user.employee.id
        ).first()
        return assignment is not None
    return False

def is_client_themselves(user: models.User, client_id: int) -> bool:
    return user.role is not None and user.role.name.upper() == "CLIENT" and user.client and user.client.id == client_id

def is_client_themselves_for_company(user: models.User, company_id: int, db: Session) -> bool:
    if user.role is not None and user.role.name.upper() == "CLIENT" and user.client:
        company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
        if company and company.client_id == user.client.id:
            return True
    return False

@router.get("", response_model=List[schemas.ClientResponse])
def get_clients(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    role_name = current_user.role.name.upper() if current_user.role else ""
    
    if "ADMIN" in role_name or role_name == "HR":
        return db.query(models.Client).order_by(models.Client.contact_person).all()
    elif role_name == "EMPLOYEE":
        if not current_user.employee:
            return []
        # Find clients whose companies this employee is assigned to
        assigned_companies = db.query(models.ClientCompany).join(models.ClientConsultant).filter(
            models.ClientConsultant.employee_id == current_user.employee.id
        ).all()
        client_ids = list(set([c.client_id for c in assigned_companies]))
        return db.query(models.Client).filter(models.Client.id.in_(client_ids)).order_by(models.Client.contact_person).all()
    elif role_name == "CLIENT":
        if not current_user.client:
            return []
        return [current_user.client]
    else:
        raise HTTPException(status_code=403, detail="Not authorized to access clients")

@router.get("/{id}", response_model=schemas.ClientResponse)
def get_client(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    client = db.query(models.Client).filter(models.Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    role_name = current_user.role.name.upper() if current_user.role else ""
    if is_admin_or_hr(current_user) or is_client_themselves(current_user, id):
        return client
    elif role_name == "EMPLOYEE" and current_user.employee:
        # Check if employee is assigned to any company under this client
        company_ids = [c.id for c in client.companies]
        assignment = db.query(models.ClientConsultant).filter(
            models.ClientConsultant.company_id.in_(company_ids),
            models.ClientConsultant.employee_id == current_user.employee.id
        ).first()
        if assignment:
            return client
            
    raise HTTPException(status_code=403, detail="Not authorized to view this client")

@router.post("", response_model=schemas.ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(client_data: schemas.ClientCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can create clients")
        
    existing_user = db.query(models.User).filter(models.User.email == client_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    if client_data.company_code:
        existing_company_code = db.query(models.ClientCompany).filter(models.ClientCompany.company_code == client_data.company_code).first()
        if existing_company_code:
            raise HTTPException(status_code=400, detail="Company code already exists")
        
    client_role = db.query(models.Role).filter(models.Role.name == "CLIENT").first()
    if not client_role:
        client_role = models.Role(name="CLIENT", description="Client Representative Portal Role")
        db.add(client_role)
        db.commit()
        db.refresh(client_role)
        
    hashed_pw = auth.get_password_hash(client_data.password)
    new_user = models.User(
        email=client_data.email,
        hashed_password=hashed_pw,
        is_active=True,
        role_id=client_role.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    db_client = models.Client(
        contact_person=client_data.contact_person,
        email=client_data.email,
        phone=client_data.phone,
        status=client_data.status,
        notes=client_data.notes,
        user_id=new_user.id,
        date_of_birth=client_data.date_of_birth,
        nationality=client_data.nationality,
        gender=client_data.gender,
        identification_number=client_data.identification_number,
        personal_address=client_data.personal_address
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    
    if client_data.company_name and client_data.company_code:
        db_company = models.ClientCompany(
            client_id=db_client.id,
            company_name=client_data.company_name,
            company_code=client_data.company_code,
            address=client_data.address,
            tax_number=client_data.tax_number,
            industry=client_data.industry,
            key_contact_person=client_data.key_contact_person or client_data.contact_person,
            key_contact_email=client_data.key_contact_email or client_data.email,
            key_contact_phone=client_data.key_contact_phone or client_data.phone
        )
        db.add(db_company)
        db.commit()
    db.refresh(db_client) # Refresh to load companies
    
    return db_client

@router.put("/{id}", response_model=schemas.ClientResponse)
def update_client(id: int, client_update: schemas.ClientBase, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_client = db.query(models.Client).filter(models.Client.id == id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    if not (is_admin_or_hr(current_user) or is_client_themselves(current_user, id)):
        raise HTTPException(status_code=403, detail="Not authorized to update this client")
        
    update_data = client_update.model_dump(exclude_unset=True) if hasattr(client_update, "model_dump") else client_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_client, key, value)
        
    if db_client.user and db_client.user.email != client_update.email:
        email_taken = db.query(models.User).filter(
            models.User.email == client_update.email,
            models.User.id != db_client.user_id
        ).first()
        if email_taken:
            raise HTTPException(status_code=400, detail="Email is already in use by another account")
        db_client.user.email = client_update.email

    db_client.updated_at = datetime.now()
    db.commit()
    db.refresh(db_client)
    return db_client

@router.put("/{id}/status", response_model=schemas.ClientResponse)
def update_client_status(id: int, status_str: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can change client status")
        
    db_client = db.query(models.Client).filter(models.Client.id == id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    status_str = status_str.upper()
    if status_str not in ["ACTIVE", "DISABLED"]:
        raise HTTPException(status_code=400, detail="Status must be ACTIVE or DISABLED")
        
    db_client.status = status_str
    if db_client.user:
        db_client.user.is_active = (status_str == "ACTIVE")
        
    db_client.updated_at = datetime.now()
    db.commit()
    db.refresh(db_client)
    return db_client

@router.put("/{id}/password")
def reset_client_password(id: int, password_data: schemas.ClientPasswordReset, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can reset client passwords")
        
    db_client = db.query(models.Client).filter(models.Client.id == id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    if not db_client.user:
        raise HTTPException(status_code=400, detail="Client does not have a linked user account")
        
    hashed_pw = auth.get_password_hash(password_data.new_password)
    db_client.user.hashed_password = hashed_pw
    db_client.updated_at = datetime.now()
    db.commit()
    
    return {"message": "Client password updated successfully"}

# COMPANY ENDPOINTS

@router.post("/{id}/companies", response_model=schemas.ClientCompanyResponse)
def create_client_company(id: int, company_data: schemas.ClientCompanyCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (is_admin_or_hr(current_user) or is_client_themselves(current_user, id)):
        raise HTTPException(status_code=403, detail="Not authorized to create companies for this client")
        
    db_client = db.query(models.Client).filter(models.Client.id == id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    existing_company_code = db.query(models.ClientCompany).filter(models.ClientCompany.company_code == company_data.company_code).first()
    if existing_company_code:
        raise HTTPException(status_code=400, detail="Company code already exists")
        
    db_company = models.ClientCompany(
        **company_data.model_dump() if hasattr(company_data, "model_dump") else company_data.dict(),
        client_id=id
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

@router.put("/companies/{company_id}", response_model=schemas.ClientCompanyResponse)
def update_client_company(company_id: int, company_update: schemas.ClientCompanyBase, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not (is_admin_or_hr(current_user) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to update this company")
        
    existing_code = db.query(models.ClientCompany).filter(
        models.ClientCompany.company_code == company_update.company_code,
        models.ClientCompany.id != company_id
    ).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Company code already exists")
        
    update_data = company_update.model_dump() if hasattr(company_update, "model_dump") else company_update.dict()
    for key, value in update_data.items():
        setattr(db_company, key, value)
        
    db_company.updated_at = datetime.now()
    db.commit()
    db.refresh(db_company)
    return db_company

@router.post("/companies/{company_id}/logo", response_model=schemas.ClientCompanyResponse)
def upload_company_logo(company_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not (is_admin_or_hr(current_user) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to change logo")
        
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Only PNG and JPEG images are allowed")
        
    os.makedirs(os.path.join("uploads", "logos"), exist_ok=True)
    ext = file.filename.split(".")[-1]
    filename = f"company_logo_{db_company.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join("uploads", "logos", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_company.logo_url = f"/uploads/logos/{filename}"
    db_company.updated_at = datetime.now()
    db.commit()
    db.refresh(db_company)
    
    return db_company

@router.post("/companies/{company_id}/assign")
def assign_consultants(company_id: int, payload: schemas.AssignConsultantsRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can assign consultants")
        
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    db.query(models.ClientConsultant).filter(models.ClientConsultant.company_id == company_id).delete()
    
    for emp_id in payload.employee_ids:
        employee = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
        if not employee:
            raise HTTPException(status_code=400, detail=f"Employee with ID {emp_id} does not exist")
            
        is_primary = (emp_id == payload.primary_employee_id)
        
        assignment = models.ClientConsultant(
            company_id=company_id,
            employee_id=emp_id,
            is_primary=is_primary
        )
        db.add(assignment)
        
    db.commit()
    return {"message": "Consultants assigned successfully"}

@router.get("/companies/{company_id}/consultants")
def get_company_consultants(company_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not (is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to view consultants for this company")
        
    assignments = db.query(models.ClientConsultant).filter(models.ClientConsultant.company_id == company_id).all()
    
    result = []
    for ass in assignments:
        emp = ass.employee
        if emp:
            result.append({
                "id": emp.id,
                "first_name": emp.first_name,
                "last_name": emp.last_name,
                "job_title": emp.job_title,
                "email": emp.user.email if emp.user else None,
                "phone": emp.phone,
                "profile_photo": emp.profile_photo,
                "is_primary": ass.is_primary
            })
            
    return result

@router.post("/companies/{company_id}/documents", response_model=schemas.ClientDocumentResponse)
def upload_client_document(company_id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not (is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to upload documents for this company")
        
    os.makedirs(os.path.join("uploads", "client_documents"), exist_ok=True)
    ext = file.filename.split(".")[-1]
    base_name = os.path.basename(file.filename)
    filename = f"doc_{company.id}_{uuid.uuid4().hex[:8]}_{base_name}"
    filepath = os.path.join("uploads", "client_documents", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_doc = models.ClientDocument(
        company_id=company_id,
        file_name=file.filename,
        file_url=f"/uploads/client_documents/{filename}",
        uploaded_by=current_user.id
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    return db_doc

@router.get("/companies/{company_id}/documents", response_model=List[schemas.ClientDocumentResponse])
def get_client_documents(company_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not (is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to view documents for this company")
        
    return db.query(models.ClientDocument).filter(models.ClientDocument.company_id == company_id).all()
