from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Any
import os
import shutil
import uuid
from datetime import datetime

import models, schemas, auth, database
from storage import upload_file_to_supabase, delete_file_from_supabase

from sqlalchemy import func

router = APIRouter(
    prefix="/api/clients",
    tags=["clients"],
    dependencies=[Depends(auth.get_current_user)]
)

def generate_company_code(db: Session, company_name: str) -> str:
    """
    Auto-generates company code in format: [FirstChar][Year2Digits][4DigitSequence]
    Example for 'AKI' in 2026: 'A260001'
    """
    import datetime, re
    clean_name = re.sub(r'[^a-zA-Z]', '', (company_name or "").strip()).upper()
    first_char = clean_name[0] if clean_name else "C"
    
    year_str = datetime.datetime.now().strftime("%y")
    total_companies = db.query(func.count(models.ClientCompany.id)).scalar() or 0
    seq_num = total_companies + 1
    
    code = f"{first_char}{year_str}{seq_num:04d}"
    
    existing = db.query(models.ClientCompany).filter(models.ClientCompany.company_code == code).first()
    while existing:
        seq_num += 1
        code = f"{first_char}{year_str}{seq_num:04d}"
        existing = db.query(models.ClientCompany).filter(models.ClientCompany.company_code == code).first()
        
    return code

def generate_client_code(db: Session) -> str:
    """
    Auto-generates client/partner code in format: X[Year2Digits][4DigitSequence]
    Example for 2026: 'X260001'
    """
    import datetime
    year_str = datetime.datetime.now().strftime("%y")
    total_clients = db.query(func.count(models.Client.id)).scalar() or 0
    seq_num = total_clients + 1
    
    code = f"X{year_str}{seq_num:04d}"
    
    existing = db.query(models.Client).filter(models.Client.client_code == code).first()
    while existing:
        seq_num += 1
        code = f"X{year_str}{seq_num:04d}"
        existing = db.query(models.Client).filter(models.Client.client_code == code).first()
        
    return code

def update_order_group_status(db: Session, orders: List[models.ClientOrder], new_status: str, user_id: Optional[int] = None):
    if not orders:
        return
        
    first_order = orders[0]
    old_status = first_order.status
    
    # Update status for all orders in group
    for order in orders:
        order.status = new_status
        
    # If the status actually changed, log a single progress message in the order chat
    if old_status != new_status:
        status_label = new_status.replace("_", " ").title()
        progress = models.ClientOrderProgress(
            order_number=first_order.order_number,
            message=f"Order execution status has been updated to {status_label}.",
            user_id=user_id
        )
        db.add(progress)

def replicate_key_contact_to_stakeholder(db: Session, db_company: models.ClientCompany):
    if db_company and db_company.key_contact_person:
        # Check if they are already in the stakeholders table for this company
        existing = db.query(models.CompanyStakeholder).filter(
            models.CompanyStakeholder.company_id == db_company.id,
            models.CompanyStakeholder.name == db_company.key_contact_person
        ).first()
        if not existing:
            stakeholder = models.CompanyStakeholder(
                company_id=db_company.id,
                name=db_company.key_contact_person,
                role="Key Contact Person",
                share_percentage=0.0,
                phone=db_company.key_contact_phone,
                email=db_company.key_contact_email,
                is_key_contact=True
            )
            db.add(stakeholder)
            db.commit()

def sync_company_update_to_stakeholder(db: Session, db_company: models.ClientCompany):
    if not db_company:
        return
    # Find the current key contact stakeholder
    key_stk = db.query(models.CompanyStakeholder).filter(
        models.CompanyStakeholder.company_id == db_company.id,
        models.CompanyStakeholder.is_key_contact == True
    ).first()
    
    if key_stk:
        # Update the existing key contact stakeholder details
        key_stk.name = db_company.key_contact_person or key_stk.name
        key_stk.email = db_company.key_contact_email
        key_stk.phone = db_company.key_contact_phone
        db.commit()
    else:
        # No stakeholder marked as key contact yet, try to replicate
        replicate_key_contact_to_stakeholder(db, db_company)

def is_admin_or_hr(user: models.User) -> bool:
    if not user or not user.role:
        return False
    if auth.is_super_admin(user):
        return True
    return user.role.name.upper() == "HR"

def is_employee_role(user: models.User) -> bool:
    if not user:
        return False
    if hasattr(user, "employee") and user.employee is not None:
        return True
    if user.role:
        name = user.role.name.upper()
        if "EMPLOYEE" in name or name in ["TEAM LEAD", "LICENSE CONSULTANT", "PROJECT MANAGER", "HR EXECUTIVE"]:
            return True
    return False

def is_assigned_employee_to_company(user: models.User, company_id: int, db: Session) -> bool:
    if is_employee_role(user):
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
    
    if is_admin_or_hr(current_user):
        return db.query(models.Client).order_by(models.Client.contact_person).all()
    elif is_employee_role(current_user):
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
def get_consultants_data(db: Session, c_ids: Any) -> List[dict]:
    if not c_ids:
        return []
    import json
    parsed_ids = []
    if isinstance(c_ids, str):
        try:
            parsed_ids = json.loads(c_ids)
        except Exception:
            parsed_ids = [int(x.strip()) for x in c_ids.split(",") if x.strip().isdigit()]
    elif isinstance(c_ids, list):
        parsed_ids = c_ids

    if not parsed_ids:
        return []

    try:
        int_ids = [int(x) for x in parsed_ids if str(x).isdigit()]
        employees = db.query(models.Employee).filter(models.Employee.id.in_(int_ids)).all()
        results = []
        for emp in employees:
            full_name = f"{emp.first_name or ''} {emp.last_name or ''}".strip()
            results.append({
                "id": emp.id,
                "name": full_name or "Consultant",
                "job_title": emp.job_title or "Consultant",
                "email": emp.user.email if emp.user else None,
                "department": emp.department.name if emp.department else None
            })
        return results
    except Exception as e:
        print("get_consultants_data error:", e)
        return []

@router.get("/orders/my-assigned", response_model=List[schemas.ClientOrderResponse])
def get_my_assigned_orders(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Returns ONLY orders allocated/assigned to the currently logged in user/employee.
    """
    all_orders = db.query(models.ClientOrder).order_by(models.ClientOrder.id.desc()).all()
    
    target_emp_id = current_user.employee.id if current_user.employee else None
    
    filtered_orders = []
    for ord_obj in all_orders:
        c_ids = ord_obj.consultant_ids or []
        if isinstance(c_ids, str):
            try:
                c_ids = json.loads(c_ids)
            except Exception:
                c_ids = [int(x.strip()) for x in c_ids.split(",") if x.strip().isdigit()]
                
        is_assigned = False
        if target_emp_id and isinstance(c_ids, list) and target_emp_id in c_ids:
            is_assigned = True
            
        if is_assigned and ord_obj.status != "DRAFT":
            filtered_orders.append(ord_obj)
            
    results = []
    for ord_obj in filtered_orders:
        res = schemas.ClientOrderResponse.model_validate(ord_obj) if hasattr(schemas.ClientOrderResponse, "model_validate") else schemas.ClientOrderResponse.from_orm(ord_obj)
        if ord_obj.client:
            res.client_name = ord_obj.client.contact_person
        if ord_obj.company:
            res.company_name = ord_obj.company.company_name
        elif ord_obj.client and ord_obj.client.companies:
            res.company_name = ord_obj.client.companies[0].company_name
        res.consultants = get_consultants_data(db, ord_obj.consultant_ids)
        res.consultant_ids = ord_obj.consultant_ids or []
        results.append(res)
    return results

@router.get("/orders", response_model=List[schemas.ClientOrderResponse])
def get_client_orders(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    role_name = current_user.role.name.upper() if current_user.role else ""
    orders_query = db.query(models.ClientOrder).order_by(models.ClientOrder.id.desc())
    
    if not is_admin_or_hr(current_user):
        if is_employee_role(current_user):
            emp_id = current_user.employee.id
            all_orders = orders_query.all()
            filtered = []
            for ord_obj in all_orders:
                c_ids = ord_obj.consultant_ids or []
                if isinstance(c_ids, str):
                    try:
                        c_ids = json.loads(c_ids)
                    except Exception:
                        c_ids = [int(x.strip()) for x in c_ids.split(",") if x.strip().isdigit()]
                if isinstance(c_ids, list) and emp_id in c_ids and ord_obj.status != "DRAFT":
                    filtered.append(ord_obj)
            orders = filtered
        elif role_name == "CLIENT" and current_user.client:
            orders = orders_query.filter(models.ClientOrder.client_id == current_user.client.id).all()
        else:
            orders = []
    else:
        orders = orders_query.all()

    results = []
    for ord_obj in orders:
        res = schemas.ClientOrderResponse.model_validate(ord_obj) if hasattr(schemas.ClientOrderResponse, "model_validate") else schemas.ClientOrderResponse.from_orm(ord_obj)
        if ord_obj.client:
            res.client_name = ord_obj.client.contact_person
        if ord_obj.company:
            res.company_name = ord_obj.company.company_name
        elif ord_obj.client and ord_obj.client.companies:
            res.company_name = ord_obj.client.companies[0].company_name
        res.consultants = get_consultants_data(db, ord_obj.consultant_ids)
        res.consultant_ids = ord_obj.consultant_ids or []
        results.append(res)
    return results

@router.post("/orders", response_model=List[schemas.ClientOrderResponse], status_code=status.HTTP_201_CREATED)
def create_standalone_client_order(order_req: schemas.ClientOrderCreateRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can create client orders")
        
    target_client_id = order_req.client_id
    target_company_id = order_req.company_id
    if not target_client_id and target_company_id:
        comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == target_company_id).first()
        if comp:
            target_client_id = comp.client_id
            
    if not target_client_id:
        first_c = db.query(models.Client).first()
        if not first_c:
            raise HTTPException(status_code=400, detail="No valid client found to attach this order to")
        target_client_id = first_c.id
        
    order_num = order_req.order_number or generate_order_number(db)
    
    order_status = "DRAFT"
    payment_status = "UNPAID"
    if order_req.order_number:
        existing_item = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_req.order_number).first()
        if existing_item:
            order_status = existing_item.status
            payment_status = existing_item.payment_status

    created_rows = []
    
    for item in order_req.items:
        db_order = models.ClientOrder(
            order_number=order_num,
            client_id=target_client_id,
            company_id=target_company_id,
            service_id=item.service_id,
            job_id=item.job_id,
            job_title=item.job_title,
            description=item.description,
            pricing_tier=item.pricing_tier,
            unit_price=item.unit_price,
            total_amount=item.unit_price,
            custom_price_text=item.custom_price_text,
            status=order_status,
            payment_status=payment_status,
            consultant_ids=order_req.consultant_ids or [],
            notes=order_req.notes
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        
        res = schemas.ClientOrderResponse.model_validate(db_order) if hasattr(schemas.ClientOrderResponse, "model_validate") else schemas.ClientOrderResponse.from_orm(db_order)
        if db_order.client:
            res.client_name = db_order.client.contact_person
        if db_order.company:
            res.company_name = db_order.company.company_name
        elif db_order.client and db_order.client.companies:
            res.company_name = db_order.client.companies[0].company_name
            
        res.consultants = get_consultants_data(db, db_order.consultant_ids)
        res.consultant_ids = db_order.consultant_ids or []
        created_rows.append(res)
        
    return created_rows

@router.delete("/orders/{id:int}")
def delete_client_order(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can delete orders")
        
    db_order = db.query(models.ClientOrder).filter(models.ClientOrder.id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order_number = db_order.order_number
    db.delete(db_order)
    db.flush()
    
    # Check if there are any remaining items in this order group
    remaining = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).count()
    if remaining == 0:
        # Delete progress logs (this includes both system and user messages in the order chat)
        db.query(models.ClientOrderProgress).filter(models.ClientOrderProgress.order_number == order_number).delete()
        
    db.commit()
    return {"message": "Order deleted successfully"}

@router.get("/{id:int}", response_model=schemas.ClientResponse)
def get_client(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    client = db.query(models.Client).filter(models.Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    role_name = current_user.role.name.upper() if current_user.role else ""
    if is_admin_or_hr(current_user) or is_client_themselves(current_user, id):
        return client
    elif is_employee_role(current_user):
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
        
    new_user_id = None
    if client_data.create_portal_account:
        existing_user = db.query(models.User).filter(models.User.email == client_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email is already registered for a user account")
            
        client_role = db.query(models.Role).filter(models.Role.name == "CLIENT").first()
        if not client_role:
            client_role = models.Role(name="CLIENT", description="Client Representative Portal Role")
            db.add(client_role)
            db.commit()
            db.refresh(client_role)
            
        password_to_use = client_data.password or "Password123!"
        hashed_pw = auth.get_password_hash(password_to_use)
        new_user = models.User(
            email=client_data.email,
            hashed_password=hashed_pw,
            is_active=True,
            role_id=client_role.id
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        new_user_id = new_user.id
    
    db_client = models.Client(
        contact_person=client_data.contact_person,
        email=client_data.email,
        phone=client_data.phone,
        client_code=generate_client_code(db),
        status=client_data.status,
        notes=client_data.notes,
        user_id=new_user_id,
        date_of_birth=client_data.date_of_birth,
        nationality=client_data.nationality,
        gender=client_data.gender,
        identification_number=client_data.identification_number,
        personal_address=client_data.personal_address
    )
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    
    company_name_str = (client_data.company_name or "").strip()

    if company_name_str:
        company_code_str = generate_company_code(db, company_name_str)

        db_company = models.ClientCompany(
            client_id=db_client.id,
            company_name=company_name_str,
            company_code=company_code_str,
            address=client_data.address,
            tax_number=client_data.tax_number,
            industry=client_data.industry,
            key_contact_person=client_data.key_contact_person or client_data.contact_person,
            key_contact_email=client_data.key_contact_email or client_data.email,
            key_contact_phone=client_data.key_contact_phone or client_data.phone,
            director_name=client_data.director_name,
            director_email=client_data.director_email,
            director_contact=client_data.director_contact,
            notes=client_data.company_notes
        )
        db.add(db_company)
        db.commit()
        db.refresh(db_company)
        replicate_key_contact_to_stakeholder(db, db_company)

    if client_data.order_items and len(client_data.order_items) > 0:
        order_num = generate_order_number(db)
        target_company_id = db_company.id if 'db_company' in locals() and db_company else None
        
        for item in client_data.order_items:
            db_order = models.ClientOrder(
                order_number=order_num,
                client_id=db_client.id,
                company_id=target_company_id,
                service_id=item.service_id,
                job_id=item.job_id,
                job_title=item.job_title,
                description=item.description,
                pricing_tier=item.pricing_tier,
                unit_price=item.unit_price,
                total_amount=item.unit_price,
                custom_price_text=item.custom_price_text,
                status="CONFIRMED"
            )
            db.add(db_order)
        db.commit()

    db.refresh(db_client) # Refresh to load companies
    return db_client

def generate_order_number(db: Session) -> str:
    curr_year_2digit = str(datetime.now().year)[-2:] # e.g. '26'
    total_orders = db.query(func.count(models.ClientOrder.id)).scalar() or 0
    seq = total_orders + 1
    order_num = f"MCSX-{curr_year_2digit}{seq:04d}" # e.g. MCSX-260001
    
    existing = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_num).first()
    while existing:
        seq += 1
        order_num = f"MCSX-{curr_year_2digit}{seq:04d}"
        existing = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_num).first()
        
    return order_num

def log_activity(db: Session, action_type: str, description: str, client_id: Optional[int] = None, company_id: Optional[int] = None, user_id: Optional[int] = None):
    try:
        log_entry = models.ClientActivityLog(
            client_id=client_id,
            company_id=company_id,
            user_id=user_id,
            action_type=action_type,
            description=description
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print("Failed to log activity:", e)

@router.put("/orders/{id}", response_model=schemas.ClientOrderResponse)
def update_client_order(id: int, order_update: schemas.ClientOrderUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_order = db.query(models.ClientOrder).filter(models.ClientOrder.id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_admin_hr = is_admin_or_hr(current_user)
    
    c_ids = db_order.consultant_ids or []
    if isinstance(c_ids, str):
        try:
            c_ids = json.loads(c_ids)
        except Exception:
            c_ids = [int(x.strip()) for x in c_ids.split(",") if x.strip().isdigit()]
            
    is_assigned_consultant = False
    if current_user.employee and isinstance(c_ids, list) and current_user.employee.id in c_ids:
        is_assigned_consultant = True

    if not is_admin_hr and not is_assigned_consultant:
        raise HTTPException(status_code=403, detail="You do not have permission to update this order")
        
    if order_update.status:
        update_order_group_status(db, [db_order], order_update.status, current_user.id)
        
    if is_admin_hr:
        if order_update.payment_status:
            db_order.payment_status = order_update.payment_status
            if order_update.payment_status in ["PARTIALLY_PAID", "PAID"]:
                if db_order.status in ["DRAFT", "PROFORMA_GENERATED", "WAITING_ON_CLIENT"]:
                    target_status = "CONFIRMED"
                    if db_order.consultant_ids and len(db_order.consultant_ids) > 0:
                        target_status = "ORDER_ASSIGNED"
                    update_order_group_status(db, [db_order], target_status, current_user.id)
        if order_update.invoice_number is not None:
            db_order.invoice_number = order_update.invoice_number
        if order_update.consultant_ids is not None:
            db_order.consultant_ids = order_update.consultant_ids
        if order_update.service_id is not None:
            db_order.service_id = order_update.service_id
        if order_update.job_id is not None:
            db_order.job_id = order_update.job_id
        if order_update.job_title is not None:
            db_order.job_title = order_update.job_title
        if order_update.description is not None:
            db_order.description = order_update.description
        if order_update.pricing_tier is not None:
            db_order.pricing_tier = order_update.pricing_tier
        if order_update.unit_price is not None:
            db_order.unit_price = order_update.unit_price
            db_order.total_amount = order_update.unit_price
        if order_update.custom_price_text is not None:
            db_order.custom_price_text = order_update.custom_price_text
        if order_update.is_proforma_finalized is not None:
            db_order.is_proforma_finalized = order_update.is_proforma_finalized
            if not order_update.is_proforma_finalized:
                db_order.is_final_invoice_finalized = False
                update_order_group_status(db, [db_order], "DRAFT", current_user.id)
        if order_update.proforma_stage_percent is not None:
            db_order.proforma_stage_percent = order_update.proforma_stage_percent
        if order_update.is_final_invoice_finalized is not None:
            # Only allow setting to True if proforma is already finalized
            if order_update.is_final_invoice_finalized and not db_order.is_proforma_finalized:
                db_order.is_final_invoice_finalized = False
            else:
                db_order.is_final_invoice_finalized = order_update.is_final_invoice_finalized

    if order_update.notes is not None:
        db_order.notes = order_update.notes
        
    db.commit()
    db.refresh(db_order)
    
    log_activity(db, "ORDER_UPDATED", f"Order {db_order.order_number} status updated: {db_order.status}", client_id=db_order.client_id, company_id=db_order.company_id, user_id=current_user.id)
    
    res = schemas.ClientOrderResponse.model_validate(db_order) if hasattr(schemas.ClientOrderResponse, "model_validate") else schemas.ClientOrderResponse.from_orm(db_order)
    if db_order.client:
        res.client_name = db_order.client.contact_person
    if db_order.company:
        res.company_name = db_order.company.company_name
    elif db_order.client and db_order.client.companies:
        res.company_name = db_order.client.companies[0].company_name
    res.consultants = get_consultants_data(db, db_order.consultant_ids)
    res.consultant_ids = db_order.consultant_ids or []
    return res

@router.get("/companies/{company_id}/stakeholders", response_model=List[schemas.CompanyStakeholderResponse])
def get_company_stakeholders(company_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.CompanyStakeholder).filter(models.CompanyStakeholder.company_id == company_id).all()

@router.post("/companies/{company_id}/stakeholders", response_model=schemas.CompanyStakeholderResponse, status_code=status.HTTP_201_CREATED)
def create_company_stakeholder(company_id: int, stakeholder_data: schemas.CompanyStakeholderCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can manage company stakeholders")
        
    comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if stakeholder_data.is_key_contact:
        db.query(models.CompanyStakeholder).filter(
            models.CompanyStakeholder.company_id == company_id
        ).update({"is_key_contact": False})
        
        comp.key_contact_person = stakeholder_data.name
        comp.key_contact_email = stakeholder_data.email
        comp.key_contact_phone = stakeholder_data.phone

    db_stakeholder = models.CompanyStakeholder(
        company_id=company_id,
        name=stakeholder_data.name,
        role=stakeholder_data.role,
        share_percentage=stakeholder_data.share_percentage or 0.0,
        identification_number=stakeholder_data.identification_number,
        phone=stakeholder_data.phone,
        email=stakeholder_data.email,
        is_key_contact=stakeholder_data.is_key_contact or False
    )
    db.add(db_stakeholder)
    db.commit()
    db.refresh(db_stakeholder)
    
    log_activity(db, "STAKEHOLDER_ADDED", f"Added stakeholder {db_stakeholder.name} ({db_stakeholder.role})", client_id=comp.client_id, company_id=company_id, user_id=current_user.id)
    return db_stakeholder

@router.delete("/companies/stakeholders/{id}")
def delete_company_stakeholder(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can delete stakeholders")
        
    stk = db.query(models.CompanyStakeholder).filter(models.CompanyStakeholder.id == id).first()
    if not stk:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
        
    db.delete(stk)
    db.commit()
    return {"message": "Stakeholder deleted successfully"}

@router.put("/companies/stakeholders/{id}", response_model=schemas.CompanyStakeholderResponse)
def update_company_stakeholder(id: int, stakeholder_data: schemas.CompanyStakeholderCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can update company stakeholders")
        
    stk = db.query(models.CompanyStakeholder).filter(models.CompanyStakeholder.id == id).first()
    if not stk:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
        
    comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == stk.company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    if stakeholder_data.is_key_contact:
        db.query(models.CompanyStakeholder).filter(
            models.CompanyStakeholder.company_id == stk.company_id,
            models.CompanyStakeholder.id != id
        ).update({"is_key_contact": False})
        
        comp.key_contact_person = stakeholder_data.name
        comp.key_contact_email = stakeholder_data.email
        comp.key_contact_phone = stakeholder_data.phone
    elif stk.is_key_contact and not stakeholder_data.is_key_contact:
        comp.key_contact_person = None
        comp.key_contact_email = None
        comp.key_contact_phone = None

    stk.name = stakeholder_data.name
    stk.role = stakeholder_data.role
    if stakeholder_data.share_percentage is not None:
        stk.share_percentage = stakeholder_data.share_percentage
    if stakeholder_data.identification_number is not None:
        stk.identification_number = stakeholder_data.identification_number
    stk.phone = stakeholder_data.phone
    stk.email = stakeholder_data.email
    stk.is_key_contact = stakeholder_data.is_key_contact or False
    
    db.commit()
    db.refresh(stk)
    
    log_activity(db, "STAKEHOLDER_UPDATED", f"Updated stakeholder {stk.name} ({stk.role})", client_id=comp.client_id, company_id=stk.company_id, user_id=current_user.id)
    return stk

@router.get("/companies/{company_id}/activities", response_model=List[schemas.ClientActivityLogResponse])
def get_company_activities(company_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    from sqlalchemy.orm import joinedload
    return db.query(models.ClientActivityLog).options(
        joinedload(models.ClientActivityLog.user).joinedload(models.User.employee),
        joinedload(models.ClientActivityLog.user).joinedload(models.User.client)
    ).filter(models.ClientActivityLog.company_id == company_id).order_by(models.ClientActivityLog.id.desc()).all()

@router.get("/{client_id:int}/activities", response_model=List[schemas.ClientActivityLogResponse])
def get_client_activities(client_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    from sqlalchemy.orm import joinedload
    return db.query(models.ClientActivityLog).options(
        joinedload(models.ClientActivityLog.user).joinedload(models.User.employee),
        joinedload(models.ClientActivityLog.user).joinedload(models.User.client)
    ).filter(models.ClientActivityLog.client_id == client_id).order_by(models.ClientActivityLog.id.desc()).all()

@router.put("/{id:int}", response_model=schemas.ClientResponse)
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

@router.put("/{id:int}/status", response_model=schemas.ClientResponse)
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

@router.put("/{id:int}/password")
def reset_client_password(id: int, password_data: schemas.ClientPasswordReset, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can reset client passwords")
        
    db_client = db.query(models.Client).filter(models.Client.id == id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    if not db_client.user:
        existing_user = db.query(models.User).filter(models.User.email == db_client.email).first()
        if existing_user:
            db_client.user_id = existing_user.id
            db_client.updated_at = datetime.now()
            db.commit()
        else:
            client_role = db.query(models.Role).filter(models.Role.name == "CLIENT").first()
            if not client_role:
                client_role = models.Role(name="CLIENT", description="Client Representative Portal Role")
                db.add(client_role)
                db.commit()
                db.refresh(client_role)
                
            hashed_pw = auth.get_password_hash(password_data.new_password)
            new_user = models.User(
                email=db_client.email,
                hashed_password=hashed_pw,
                is_active=True,
                role_id=client_role.id
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            db_client.user_id = new_user.id
            db_client.updated_at = datetime.now()
            db.commit()
            return {"message": "Portal account created and password set successfully"}
        
    hashed_pw = auth.get_password_hash(password_data.new_password)
    db_client.user.hashed_password = hashed_pw
    db_client.updated_at = datetime.now()
    db.commit()
    
    return {"message": "Client portal password updated successfully"}

# COMPANY ENDPOINTS

@router.get("/companies", response_model=List[schemas.ClientCompanyResponse])
@router.get("/companies/all", response_model=List[schemas.ClientCompanyResponse])
def get_all_client_companies(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.ClientCompany).order_by(models.ClientCompany.company_name).all()

@router.post("/companies/standalone", response_model=schemas.ClientCompanyResponse)
def create_standalone_client_company(company_data: schemas.ClientCompanyCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to create standalone companies")
        
    if company_data.client_id:
        db_client = db.query(models.Client).filter(models.Client.id == company_data.client_id).first()
        if not db_client:
            raise HTTPException(status_code=404, detail="Client not found")

    comp_data_dict = company_data.model_dump() if hasattr(company_data, "model_dump") else company_data.dict()
    comp_data_dict["company_code"] = generate_company_code(db, company_data.company_name)

    db_company = models.ClientCompany(**comp_data_dict)
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    replicate_key_contact_to_stakeholder(db, db_company)
    return db_company

@router.post("/{id:int}/companies", response_model=schemas.ClientCompanyResponse)
def create_client_company(id: int, company_data: schemas.ClientCompanyCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (is_admin_or_hr(current_user) or is_client_themselves(current_user, id)):
        raise HTTPException(status_code=403, detail="Not authorized to create companies for this client")
        
    db_client = db.query(models.Client).filter(models.Client.id == id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    comp_data_dict = company_data.model_dump() if hasattr(company_data, "model_dump") else company_data.dict()
    comp_data_dict["company_code"] = generate_company_code(db, company_data.company_name)
    comp_data_dict["client_id"] = id
        
    db_company = models.ClientCompany(**comp_data_dict)
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    replicate_key_contact_to_stakeholder(db, db_company)
    return db_company

@router.get("/companies/{company_id}", response_model=schemas.ClientCompanyResponse)
def get_client_company_by_id(company_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company

@router.put("/companies/{company_id}", response_model=schemas.ClientCompanyResponse)
def update_client_company(company_id: int, company_update: schemas.ClientCompanyBase, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not (is_admin_or_hr(current_user) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to update this company")
        
    if company_update.company_code:
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
    sync_company_update_to_stakeholder(db, db_company)
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
        
    try:
        file_bytes = file.file.read()
        unique_filename = f"logos/{uuid.uuid4()}_{file.filename}"
        public_url = upload_file_to_supabase(file_bytes, unique_filename, "client-documents")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to storage: {str(e)}")
        
    db_company.logo_url = public_url
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
def upload_client_document(
    company_id: int, 
    file: Optional[UploadFile] = File(None), 
    document_type: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    document_path: Optional[str] = Form(None),
    order_number: Optional[str] = Form(None),
    document_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not (is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to upload documents for this company")
        
    if not file:
        raise HTTPException(status_code=400, detail="A file upload is mandatory.")

    # Determine company directory folder name
    company_code = company.company_code or f"comp_{company.id}"
    
    # Sanitize document type to use as folder name
    doc_type_folder = (document_type or "General").strip().replace("/", "_").replace("\\", "_")
    
    filename = file.filename
    # Prevent path traversal in filename
    filename = os.path.basename(filename)
    
    # Determine order folder name
    order_folder = (order_number or "No_Order").strip().replace("/", "_").replace("\\", "_")

    # Destination path in Dropbox
    destination_path = f"/Clients/{company_code}/{order_folder}/{doc_type_folder}/{filename}"
    if destination_path.startswith("//"):
        destination_path = destination_path[1:]
        
    try:
        file_bytes = file.file.read()
        from utils.dropbox_client import upload_file
        res = upload_file(file_bytes, destination_path)
        if not res.get("success"):
            raise HTTPException(status_code=500, detail=f"Failed to upload to Dropbox: {res.get('error')}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file to Dropbox: {str(e)}")
        
    public_url = destination_path
        
    parsed_date = None
    if document_date:
        try:
            parsed_date = datetime.strptime(document_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    parsed_expiry_date = None
    if expiry_date:
        try:
            parsed_expiry_date = datetime.strptime(expiry_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid expiry date format, expected YYYY-MM-DD")

    db_doc = models.ClientDocument(
        company_id=company_id,
        file_name=filename,
        file_url=public_url,
        document_type=document_type,
        description=description,
        document_path=destination_path,
        order_number=order_number,
        document_date=parsed_date,
        expiry_date=parsed_expiry_date,
        uploaded_at=datetime.now(),
        uploaded_by=current_user.id
    )
    db.add(db_doc)
    try:
        db.commit()
        db.refresh(db_doc)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    log_activity(db, "DOCUMENT_UPLOADED", f"Uploaded document {filename} ({document_type or 'General'}) for order {order_number or 'N/A'}", client_id=company.client_id, company_id=company_id, user_id=current_user.id)
    
    return db_doc

@router.get("/companies/{company_id}/documents/{document_id}/preview")
async def preview_client_document(
    company_id: int,
    document_id: int,
    token: Optional[str] = None,
    db: Session = Depends(database.get_db),
    request: Request = None
):
    """Securely stream client document from Dropbox or local disk for inline preview."""
    # Retrieve actual token from cookie, header, or query param
    cookie_token = request.cookies.get("hrms_token") if request else None
    header_token = None
    auth_header = request.headers.get("Authorization") if request else None
    if auth_header and auth_header.startswith("Bearer "):
        header_token = auth_header.replace("Bearer ", "", 1)
        
    actual_token = cookie_token or header_token or token
    
    if not actual_token or actual_token == "cookie_based_session_active":
        raise HTTPException(status_code=401, detail="Unauthorized access")
        
    from jose import jwt, JWTError
    from auth import SECRET_KEY, ALGORITHM, get_user_by_email
    try:
        payload = jwt.decode(actual_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token session")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    current_user = get_user_by_email(db, email=email)
    if not current_user or not current_user.is_active:
        raise HTTPException(status_code=401, detail="User account is inactive or not found")

    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    db_doc = db.query(models.ClientDocument).filter(
        models.ClientDocument.id == document_id, 
        models.ClientDocument.company_id == company_id
    ).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if not db_doc.file_url:
        raise HTTPException(status_code=400, detail="No file URL associated with this record")
        
    import mimetypes
    from fastapi.responses import StreamingResponse
    import httpx
    
    # 1. Local storage case
    if db_doc.file_url.startswith("/uploads/"):
        import os
        local_path = os.path.join("uploads", db_doc.file_url.replace("/uploads/", "", 1))
        if os.path.exists(local_path):
            mime_type, _ = mimetypes.guess_type(local_path)
            if not mime_type:
                mime_type = "application/octet-stream"
            
            def iterfile():
                with open(local_path, mode="rb") as f:
                    yield from f
            return StreamingResponse(iterfile(), media_type=mime_type)
        raise HTTPException(status_code=404, detail="Local file could not be resolved on disk")
        
    # 2. Dropbox path case
    if db_doc.file_url.startswith("/Clients/"):
        # Check first if it actually exists locally (local fallback)
        local_rel = db_doc.file_url.replace("/Clients/", "", 1)
        import os
        local_path = os.path.join("uploads", local_rel)
        if os.path.exists(local_path):
            mime_type, _ = mimetypes.guess_type(local_path)
            if not mime_type:
                mime_type = "application/octet-stream"
            def iterfile():
                with open(local_path, mode="rb") as f:
                    yield from f
            return StreamingResponse(iterfile(), media_type=mime_type)
            
        # Check old local path fallback
        parts = local_rel.split("/")
        if len(parts) >= 4:
            old_rel = f"{parts[0]}/{parts[2]}/{parts[3]}"
            old_path = os.path.join("uploads", old_rel)
            if os.path.exists(old_path):
                mime_type, _ = mimetypes.guess_type(old_path)
                if not mime_type:
                    mime_type = "application/octet-stream"
                def iterfile():
                    with open(old_path, mode="rb") as f:
                        yield from f
                return StreamingResponse(iterfile(), media_type=mime_type)
                
        # Resolve Dropbox temporary link
        from utils.dropbox_client import get_temporary_link
        res = get_temporary_link(db_doc.file_url)
        if not res.get("success"):
            raise HTTPException(status_code=400, detail=f"Failed to query Dropbox file link: {res.get('error')}")
            
        link = res.get("link")
        
        async def stream_file():
            async with httpx.AsyncClient() as client:
                async with client.stream("GET", link) as response:
                    if response.status_code != 200:
                        raise HTTPException(status_code=response.status_code, detail="Dropbox file retrieval failed")
                    async for chunk in response.aiter_bytes():
                        yield chunk
                        
        mime_type, _ = mimetypes.guess_type(db_doc.file_name or "")
        if not mime_type:
            mime_type = "application/octet-stream"
            
        return StreamingResponse(stream_file(), media_type=mime_type)
        
    raise HTTPException(status_code=400, detail="Document URL format is invalid")

@router.patch("/companies/{company_id}/documents/{document_id}", response_model=schemas.ClientDocumentResponse)
def update_client_document(
    company_id: int, 
    document_id: int, 
    file: Optional[UploadFile] = File(None), 
    document_type: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    order_number: Optional[str] = Form(None),
    document_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not (is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to edit documents for this company")
        
    db_doc = db.query(models.ClientDocument).filter(models.ClientDocument.id == document_id, models.ClientDocument.company_id == company_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if file:
        # Determine company directory folder name
        company_code = company.company_code or f"comp_{company.id}"
        
        # Sanitize document type to use as folder name
        doc_type_folder = (document_type or db_doc.document_type or "General").strip().replace("/", "_").replace("\\", "_")
        
        filename = file.filename
        # Prevent path traversal in filename
        filename = os.path.basename(filename)
        
        # Determine order folder name
        order_folder = (order_number or db_doc.order_number or "No_Order").strip().replace("/", "_").replace("\\", "_")

        # Destination path in Dropbox
        destination_path = f"/Clients/{company_code}/{order_folder}/{doc_type_folder}/{filename}"
        if destination_path.startswith("//"):
            destination_path = destination_path[1:]
            
        try:
            file_bytes = file.file.read()
            from utils.dropbox_client import upload_file
            res = upload_file(file_bytes, destination_path)
            if not res.get("success"):
                raise HTTPException(status_code=500, detail=f"Failed to upload to Dropbox: {res.get('error')}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file to Dropbox: {str(e)}")
            
        db_doc.file_name = filename
        db_doc.file_url = destination_path
        db_doc.document_path = destination_path

    if document_type is not None:
        db_doc.document_type = document_type
    if description is not None:
        db_doc.description = description
    if order_number is not None:
        db_doc.order_number = order_number

    if document_date is not None:
        if document_date.strip() == "":
            db_doc.document_date = None
        else:
            try:
                db_doc.document_date = datetime.strptime(document_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format, expected YYYY-MM-DD")

    if expiry_date is not None:
        if expiry_date.strip() == "":
            db_doc.expiry_date = None
        else:
            try:
                db_doc.expiry_date = datetime.strptime(expiry_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid expiry date format, expected YYYY-MM-DD")

    db.commit()
    db.refresh(db_doc)
    
    return db_doc

@router.delete("/companies/{company_id}/documents/{document_id}")
def delete_client_document(
    company_id: int, 
    document_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    from storage import delete_file_from_supabase
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not (is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to delete documents for this company")
        
    db_doc = db.query(models.ClientDocument).filter(models.ClientDocument.id == document_id, models.ClientDocument.company_id == company_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if db_doc.file_url:
        if db_doc.file_url.startswith("/Clients/"):
            try:
                from utils.dropbox_client import delete_path
                delete_path(db_doc.file_url)
            except Exception as e:
                print("Failed to delete from Dropbox:", e)
        elif db_doc.file_url.startswith("/uploads/"):
            local_path = db_doc.file_url.lstrip("/")
            if os.path.exists(local_path):
                try:
                    os.remove(local_path)
                except Exception as e:
                    print("Failed to delete local file:", e)
        else:
            try:
                delete_file_from_supabase(db_doc.file_url, "client-documents")
            except Exception as e:
                print("Failed to delete Supabase file:", e)
        
    db.delete(db_doc)
    db.commit()
    
    return {"message": "Document deleted successfully"}

# CLIENT SERVICES & PRICE LIST ENDPOINTS

@router.get("/services/catalog", response_model=List[schemas.ClientServiceResponse])
def get_client_services(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    services = db.query(models.ClientService).order_by(models.ClientService.id.asc()).all()
    results = []
    for s in services:
        p_base = s.base_price or 0.0
        disc_a = s.partner_a_discount if s.partner_a_discount is not None else 20.0
        disc_a1 = s.partner_a1_discount if s.partner_a1_discount is not None else 40.0
        disc_a2 = s.partner_a2_discount if s.partner_a2_discount is not None else 50.0
        
        p_a = round(p_base * (1 - (disc_a / 100.0)), 2)
        p_a1 = round(p_base * (1 - (disc_a1 / 100.0)), 2)
        p_a2 = round(p_base * (1 - (disc_a2 / 100.0)), 2)
        
        res = schemas.ClientServiceResponse.model_validate(s) if hasattr(schemas.ClientServiceResponse, "model_validate") else schemas.ClientServiceResponse.from_orm(s)
        res.partner_a_price = p_a
        res.partner_a1_price = p_a1
        res.partner_a2_price = p_a2
        results.append(res)
    return results

@router.post("/services/catalog", response_model=schemas.ClientServiceResponse, status_code=status.HTTP_201_CREATED)
def create_client_service(service_data: schemas.ClientServiceCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can create service pricing catalog entries")
        
    job_id_str = (service_data.job_id or "").strip()
    if not job_id_str:
        total_services = db.query(func.count(models.ClientService.id)).scalar() or 0
        seq = total_services + 1
        job_id_str = f"OA-{seq:03d}"
        existing = db.query(models.ClientService).filter(models.ClientService.job_id == job_id_str).first()
        while existing:
            seq += 1
            job_id_str = f"OA-{seq:03d}"
            existing = db.query(models.ClientService).filter(models.ClientService.job_id == job_id_str).first()
            
    s_dict = service_data.model_dump() if hasattr(service_data, "model_dump") else service_data.dict()
    s_dict["job_id"] = job_id_str
    
    db_service = models.ClientService(**s_dict)
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    
    p_base = db_service.base_price or 0.0
    res = schemas.ClientServiceResponse.model_validate(db_service) if hasattr(schemas.ClientServiceResponse, "model_validate") else schemas.ClientServiceResponse.from_orm(db_service)
    res.partner_a_price = round(p_base * (1 - ((db_service.partner_a_discount or 20.0) / 100.0)), 2)
    res.partner_a1_price = round(p_base * (1 - ((db_service.partner_a1_discount or 40.0) / 100.0)), 2)
    res.partner_a2_price = round(p_base * (1 - ((db_service.partner_a2_discount or 50.0) / 100.0)), 2)
    return res

@router.post("/services/catalog/bulk", response_model=List[schemas.ClientServiceResponse], status_code=status.HTTP_201_CREATED)
def create_bulk_client_services(services_data: List[schemas.ClientServiceCreate], db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can create service pricing catalog entries")
        
    created_services = []
    total_services = db.query(func.count(models.ClientService.id)).scalar() or 0
    seq = total_services + 1
    
    for item in services_data:
        job_id_str = (item.job_id or "").strip()
        if not job_id_str:
            job_id_str = f"OA-{seq:03d}"
            existing = db.query(models.ClientService).filter(models.ClientService.job_id == job_id_str).first()
            while existing:
                seq += 1
                job_id_str = f"OA-{seq:03d}"
                existing = db.query(models.ClientService).filter(models.ClientService.job_id == job_id_str).first()
            seq += 1
            
        s_dict = item.model_dump() if hasattr(item, "model_dump") else item.dict()
        s_dict["job_id"] = job_id_str
        
        db_service = models.ClientService(**s_dict)
        db.add(db_service)
        db.commit()
        db.refresh(db_service)
        
        p_base = db_service.base_price or 0.0
        res = schemas.ClientServiceResponse.model_validate(db_service) if hasattr(schemas.ClientServiceResponse, "model_validate") else schemas.ClientServiceResponse.from_orm(db_service)
        res.partner_a_price = round(p_base * (1 - ((db_service.partner_a_discount or 20.0) / 100.0)), 2)
        res.partner_a1_price = round(p_base * (1 - ((db_service.partner_a1_discount or 40.0) / 100.0)), 2)
        res.partner_a2_price = round(p_base * (1 - ((db_service.partner_a2_discount or 50.0) / 100.0)), 2)
        created_services.append(res)
        
    return created_services

@router.put("/services/catalog/{id}", response_model=schemas.ClientServiceResponse)
def update_client_service(id: int, service_update: schemas.ClientServiceUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can update service pricing catalog entries")
        
    db_service = db.query(models.ClientService).filter(models.ClientService.id == id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service entry not found")
        
    up_dict = service_update.model_dump(exclude_unset=True) if hasattr(service_update, "model_dump") else service_update.dict(exclude_unset=True)
    for k, v in up_dict.items():
        if v is not None:
            setattr(db_service, k, v)
            
    db.commit()
    db.refresh(db_service)
    
    p_base = db_service.base_price or 0.0
    res = schemas.ClientServiceResponse.model_validate(db_service) if hasattr(schemas.ClientServiceResponse, "model_validate") else schemas.ClientServiceResponse.from_orm(db_service)
    res.partner_a_price = round(p_base * (1 - ((db_service.partner_a_discount or 20.0) / 100.0)), 2)
    res.partner_a1_price = round(p_base * (1 - ((db_service.partner_a1_discount or 40.0) / 100.0)), 2)
    res.partner_a2_price = round(p_base * (1 - ((db_service.partner_a2_discount or 50.0) / 100.0)), 2)
    return res

@router.delete("/services/catalog/{id}")
def delete_client_service(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can delete service catalog entries")
        
    db_service = db.query(models.ClientService).filter(models.ClientService.id == id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service entry not found")
        
    db.delete(db_service)
    db.commit()
    return {"message": "Service entry deleted successfully"}

@router.get("/companies/{company_id}/documents", response_model=List[schemas.ClientDocumentResponse])
def get_client_documents(company_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not (is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to view documents for this company")
        
    return db.query(models.ClientDocument).filter(models.ClientDocument.company_id == company_id).all()


@router.get("/orders/{order_number}/progress", response_model=List[schemas.ClientOrderProgressResponse])
def get_order_progress(order_number: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    first_order = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).first()
    if not first_order:
        raise HTTPException(status_code=404, detail="Order group not found")
        
    role_name = current_user.role.name.upper() if current_user.role else ""
    if not (is_admin_or_hr(current_user) or is_client_themselves(current_user, first_order.client_id)):
        is_assigned = False
        if is_employee_role(current_user):
            orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
            for o in orders_in_group:
                c_ids = o.consultant_ids or []
                if current_user.employee.id in c_ids:
                    is_assigned = True
                    break
        if not is_assigned:
            raise HTTPException(status_code=403, detail="Not authorized to view progress for this order")

    updates = db.query(models.ClientOrderProgress).filter(models.ClientOrderProgress.order_number == order_number).order_by(models.ClientOrderProgress.created_at.asc()).all()
    
    res = []
    for u in updates:
        sender_name = "System"
        if u.user:
            if u.user.role and u.user.role.name.upper() in ["ADMIN", "HR"]:
                sender_name = f"{u.user.role.name.title()} ({u.user.email})"
            else:
                emp = db.query(models.Employee).filter(models.Employee.user_id == u.user_id).first()
                if emp:
                    sender_name = f"{emp.first_name} {emp.last_name}"
                else:
                    sender_name = u.user.email
        
        res.append(schemas.ClientOrderProgressResponse(
            id=u.id,
            order_number=u.order_number,
            user_id=u.user_id,
            message=u.message,
            created_at=u.created_at,
            sender_name=sender_name
        ))
    return res


def get_taggable_users_for_order(order_number: str, db: Session) -> List[models.User]:
    # 1. Get the orders in this group
    orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    if not orders_in_group:
        return []
    
    # Check if this order group is completed
    is_completed = any(o.status == "COMPLETED" for o in orders_in_group)
    
    if not is_completed:
        # Active Orders: only allow tagging between members of the Licensing Team
        licensing_team = db.query(models.Team).filter(models.Team.name.ilike("Licensing Team")).first()
        if licensing_team:
            allowed_user_ids = {emp.user_id for emp in licensing_team.members if emp.user_id is not None}
            return db.query(models.User).filter(models.User.id.in_(list(allowed_user_ids))).all()
        else:
            return []
            
    # 2. Extract consultant employee IDs (for completed orders)
    consultant_employee_ids = set()
    for o in orders_in_group:
        if o.consultant_ids:
            for cid in o.consultant_ids:
                try:
                    consultant_employee_ids.add(int(cid))
                except (ValueError, TypeError):
                    pass
                    
    # 3. Query Finance department ID
    finance_dept = db.query(models.Department).filter(models.Department.name.ilike("%finance%")).first()
    finance_dept_id = finance_dept.id if finance_dept else None

    # 4. Fetch matching employees (assigned consultant OR in Finance department)
    allowed_employees = db.query(models.Employee).filter(
        (models.Employee.id.in_(list(consultant_employee_ids))) |
        (models.Employee.department_id == finance_dept_id)
    ).all()
    
    # 5. Gather their user IDs
    allowed_user_ids = {emp.user_id for emp in allowed_employees if emp.user_id is not None}
    
    # 6. Include all Admins and HR users
    admin_hr_roles = db.query(models.Role).filter(models.Role.name.in_(["ADMIN", "HR", "admin", "hr"])).all()
    admin_hr_role_ids = [role.id for role in admin_hr_roles]
    admin_hr_users = db.query(models.User).filter(models.User.role_id.in_(admin_hr_role_ids)).all()
    for u in admin_hr_users:
        allowed_user_ids.add(u.id)
        
    # Return all allowed User objects
    return db.query(models.User).filter(models.User.id.in_(list(allowed_user_ids))).all()


@router.post("/orders/{order_number}/progress", response_model=schemas.ClientOrderProgressResponse)
def add_order_progress(order_number: str, progress_data: schemas.ClientOrderProgressCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    first_order = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).first()
    if not first_order:
        raise HTTPException(status_code=404, detail="Order group not found")
        
    role_name = current_user.role.name.upper() if current_user.role else ""
    if not is_admin_or_hr(current_user):
        is_assigned = False
        if is_employee_role(current_user):
            orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
            for o in orders_in_group:
                c_ids = o.consultant_ids or []
                if current_user.employee.id in c_ids:
                    is_assigned = True
                    break
        if not is_assigned:
            raise HTTPException(status_code=403, detail="Not authorized to post progress updates for this order")

    db_progress = models.ClientOrderProgress(
        order_number=order_number,
        user_id=current_user.id,
        message=progress_data.message
    )
    db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    
    sender_name = "System"
    if current_user.role and current_user.role.name.upper() in ["ADMIN", "HR"]:
        sender_name = f"{current_user.role.name.title()} ({current_user.email})"
    else:
        emp = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if emp:
            sender_name = f"{emp.first_name} {emp.last_name}"
        else:
            sender_name = current_user.email

    # Tagging and Notifications logic
    message_text = progress_data.message
    tagged_user_ids = set()

    # Get allowed taggable users
    taggable_users = get_taggable_users_for_order(order_number, db)
    taggable_user_map = {u.id: u for u in taggable_users}

    # 1. Match @email patterns
    import re
    emails = re.findall(r'@([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', message_text)
    for email in emails:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user and user.id in taggable_user_map and user.id != current_user.id:
            tagged_user_ids.add(user.id)

    # 2. Match @First Last employee names
    taggable_user_ids_list = list(taggable_user_map.keys())
    allowed_employees = db.query(models.Employee).filter(
        models.Employee.user_id.in_(taggable_user_ids_list)
    ).all()
    
    for emp in allowed_employees:
        full_name = f"{emp.first_name} {emp.last_name}"
        if f"@{full_name}".lower() in message_text.lower():
            if emp.user_id != current_user.id:
                tagged_user_ids.add(emp.user_id)

    # 3. Match @Team Name for active teams
    active_teams = db.query(models.Team).filter(models.Team.is_active == True).all()
    for team in active_teams:
        if f"@{team.name}".lower() in message_text.lower():
            for member in team.members:
                if member.status == models.EmploymentStatus.ACTIVE and member.user_id and member.user_id != current_user.id:
                    tagged_user_ids.add(member.user_id)

    # Send notifications
    if tagged_user_ids:
        from notification_manager import manager
        
        is_completed = first_order.status == "COMPLETED"
        base_route = "/business/clients/orders/completed" if is_completed else "/business/clients/orders"
        action_url = f"{base_route}?order={order_number}&chat=true"

        for uid in tagged_user_ids:
            manager.notify_user_sync(
                db=db,
                user_id=uid,
                title="Tagged in Order Chat",
                message=f"{sender_name} tagged you in Order #{order_number}: \"{message_text[:60]}...\"",
                type="attendance",
                module="clients",
                reference_id=first_order.id,
                action_url=action_url
            )
            
    return schemas.ClientOrderProgressResponse(
        id=db_progress.id,
        order_number=db_progress.order_number,
        user_id=db_progress.user_id,
        message=db_progress.message,
        created_at=db_progress.created_at,
        sender_name=sender_name
    )

def generate_unique_invoice_filename(db, order_number, base_filename):
    name_part, ext_part = os.path.splitext(base_filename)
    existing_count = db.query(models.ClientDocument).filter(
        models.ClientDocument.order_number == order_number,
        models.ClientDocument.file_name == base_filename
    ).count()
    if existing_count == 0:
        return base_filename
    idx = 1
    while True:
        candidate = f"{name_part}_{idx}{ext_part}"
        dup_count = db.query(models.ClientDocument).filter(
            models.ClientDocument.order_number == order_number,
            models.ClientDocument.file_name == candidate
        ).count()
        if dup_count == 0:
            return candidate
        idx += 1

@router.post("/orders/{order_number}/finalize-invoice", response_model=List[schemas.ClientOrderResponse])
def finalize_order_invoice(
    order_number: str,
    file: UploadFile = File(...),
    proforma_stage_percent: int = Form(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    if not orders_in_group:
        raise HTTPException(status_code=404, detail="No orders found for this order number")
        
    first_order = orders_in_group[0]
    company_id = first_order.company_id
    
    # Locate the company
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found for these orders")
        
    # Check permissions
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to finalize invoices for this order")
        
    company_code = company.company_code or f"comp_{company.id}"
    filename = file.filename
    filename = os.path.basename(filename)
    filename = generate_unique_invoice_filename(db, order_number, filename)
    
    # Target path: /Clients/{company_code}/{order_number}/Invoice/{filename}
    destination_path = f"/Clients/{company_code}/{order_number}/Invoice/{filename}"
    if destination_path.startswith("//"):
        destination_path = destination_path[1:]
        
    # Upload the invoice PDF file to Dropbox
    try:
        file_bytes = file.file.read()
        from utils.dropbox_client import upload_file
        res = upload_file(file_bytes, destination_path)
        if not res.get("success"):
            raise HTTPException(status_code=500, detail=f"Failed to upload to Dropbox: {res.get('error')}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file to Dropbox: {str(e)}")
        
    # Update orders
    update_order_group_status(db, orders_in_group, "PROFORMA_GENERATED", current_user.id)
    for order in orders_in_group:
        order.is_proforma_finalized = True
        order.proforma_stage_percent = proforma_stage_percent
        
    # Register as ClientDocument so it is visible in the client workspace
    db_doc = models.ClientDocument(
        company_id=company_id,
        file_name=filename,
        file_url=destination_path,
        document_type="Invoice",
        description=f"Finalized Proforma Invoice ({proforma_stage_percent}%) for Order {order_number}",
        document_path=destination_path,
        order_number=order_number,
        document_date=datetime.now().date(),
        uploaded_at=datetime.now(),
        uploaded_by=current_user.id
    )
    db.add(db_doc)
    
    # Post progress update in the chat
    db_progress = models.ClientOrderProgress(
        order_number=order_number,
        user_id=current_user.id,
        message=f"Proforma invoice ({proforma_stage_percent}%) has been generated and saved."
    )
    db.add(db_progress)
    
    # Log activity
    log_activity(db, "INVOICE_FINALIZED", f"Finalized proforma invoice ({proforma_stage_percent}%) for order {order_number} and uploaded to Dropbox", client_id=company.client_id, company_id=company_id, user_id=current_user.id)
    
    db.commit()
    
    # Refresh and return
    for order in orders_in_group:
        db.refresh(order)
        
    res_list = []
    for ord_obj in orders_in_group:
        res = schemas.ClientOrderResponse.model_validate(ord_obj) if hasattr(schemas.ClientOrderResponse, "model_validate") else schemas.ClientOrderResponse.from_orm(ord_obj)
        if ord_obj.client:
            res.client_name = ord_obj.client.contact_person
        if ord_obj.company:
            res.company_name = ord_obj.company.company_name
        res_list.append(res)
        
    return res_list

@router.post("/orders/{order_number}/finalize-final-invoice", response_model=List[schemas.ClientOrderResponse])
def finalize_order_final_invoice(
    order_number: str,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    if not orders_in_group:
        raise HTTPException(status_code=404, detail="No orders found for this order number")
        
    first_order = orders_in_group[0]
    company_id = first_order.company_id
    
    # Locate the company
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found for these orders")
        
    # Check permissions
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Not authorized to finalize invoices for this order")
        
    company_code = company.company_code or f"comp_{company.id}"
    filename = file.filename
    filename = os.path.basename(filename)
    filename = generate_unique_invoice_filename(db, order_number, filename)
    
    # Target path: /Clients/{company_code}/{order_number}/Invoice/{filename}
    destination_path = f"/Clients/{company_code}/{order_number}/Invoice/{filename}"
    if destination_path.startswith("//"):
        destination_path = destination_path[1:]
        
    # Upload the invoice PDF file to Dropbox
    try:
        file_bytes = file.file.read()
        from utils.dropbox_client import upload_file
        res = upload_file(file_bytes, destination_path)
        if not res.get("success"):
            raise HTTPException(status_code=500, detail=f"Failed to upload to Dropbox: {res.get('error')}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file to Dropbox: {str(e)}")
        
    # Update orders
    update_order_group_status(db, orders_in_group, "INVOICE_GENERATED", current_user.id)
    for order in orders_in_group:
        order.is_final_invoice_finalized = True
        
    # Register as ClientDocument so it is visible in the client workspace
    db_doc = models.ClientDocument(
        company_id=company_id,
        file_name=filename,
        file_url=destination_path,
        document_type="Invoice",
        description=f"Final Tax Invoice for Order {order_number}",
        document_path=destination_path,
        order_number=order_number,
        document_date=datetime.now().date(),
        uploaded_at=datetime.now(),
        uploaded_by=current_user.id
    )
    db.add(db_doc)
    
    # Post progress update in the chat
    db_progress = models.ClientOrderProgress(
        order_number=order_number,
        user_id=current_user.id,
        message="Final invoice has been generated and saved."
    )
    db.add(db_progress)
    
    # Log activity
    log_activity(db, "INVOICE_FINALIZED", f"Finalized final tax invoice for order {order_number} and uploaded to Dropbox", client_id=company.client_id, company_id=company_id, user_id=current_user.id)
    
    db.commit()
    
    # Refresh and return
    for order in orders_in_group:
      db.refresh(order)
        
    res_list = []
    for ord_obj in orders_in_group:
        res = schemas.ClientOrderResponse.model_validate(ord_obj) if hasattr(schemas.ClientOrderResponse, "model_validate") else schemas.ClientOrderResponse.from_orm(ord_obj)
        if ord_obj.client:
            res.client_name = ord_obj.client.contact_person
        if ord_obj.company:
            res.company_name = ord_obj.company.company_name
        res_list.append(res)
        
    return res_list


@router.get("/documents/expiring")
def get_expiring_documents(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    role_name = current_user.role.name.upper() if current_user.role else ""
    if not (is_admin_or_hr(current_user) or is_employee_role(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to view expiring documents")
        
    docs = db.query(models.ClientDocument).filter(models.ClientDocument.expiry_date != None).all()
    
    res = []
    for doc in docs:
        if is_employee_role(current_user):
            if not is_assigned_employee_to_company(current_user, doc.company_id, db):
                continue
                
        partner_name = doc.company.client.contact_person if (doc.company and doc.company.client) else None
        company_name = doc.company.company_name if doc.company else "Unknown Company"
        
        res.append({
            "id": doc.id,
            "company_id": doc.company_id,
            "file_name": doc.file_name,
            "document_type": doc.document_type or "General",
            "description": doc.description,
            "expiry_date": doc.expiry_date.isoformat() if doc.expiry_date else None,
            "company_name": company_name,
            "partner_name": partner_name,
        })
    return res


@router.post("/orders/{order_number}/send-invoice-email", response_model=List[schemas.ClientOrderResponse])
def send_order_invoice_email(
    order_number: str,
    invoice_type: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    first_order = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).first()
    if not first_order:
        raise HTTPException(status_code=404, detail="Order group not found")

    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == first_order.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found associated with this order")

    # Locate the finalized invoice document for this order
    desc_keyword = "Proforma" if invoice_type == "proforma" else "Final"
    doc = db.query(models.ClientDocument).filter(
        models.ClientDocument.order_number == order_number,
        models.ClientDocument.document_type == "Invoice",
        models.ClientDocument.description.like(f"%{desc_keyword}%")
    ).order_by(models.ClientDocument.id.desc()).first()

    if not doc:
        raise HTTPException(status_code=400, detail=f"No finalized {invoice_type} invoice found for this order. Please finalize it first.")

    # Retrieve file from Dropbox or local storage
    import httpx
    import os
    pdf_content = b""
    if doc.file_url.startswith("/Clients/"):
        from utils.dropbox_client import get_temporary_link
        link_res = get_temporary_link(doc.file_url)
        if not link_res.get("success"):
            raise HTTPException(status_code=500, detail=f"Failed to get Dropbox link: {link_res.get('error')}")
        
        link = link_res.get("link")
        try:
            with httpx.Client() as client:
                response = client.get(link)
                if response.status_code == 200:
                    pdf_content = response.content
                else:
                    raise HTTPException(status_code=500, detail="Failed to download invoice PDF from Dropbox link")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error downloading invoice PDF: {str(e)}")
    elif doc.file_url.startswith("/uploads/"):
        local_path = os.path.join("uploads", doc.file_url.replace("/uploads/", "", 1))
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                pdf_content = f.read()
        else:
            raise HTTPException(status_code=404, detail="Local PDF file not found on disk")
    else:
        raise HTTPException(status_code=400, detail="Invoice URL format is unsupported")

    recipient_email = company.key_contact_email if company.key_contact_email else first_order.client.email
    recipient_name = company.key_contact_person if company.key_contact_person else first_order.client.contact_person

    # Transition order statuses in this group to WAITING_ON_CLIENT
    orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    update_order_group_status(db, orders_in_group, "WAITING_ON_CLIENT", current_user.id)

    # Automatically generate Xendit payment link if not already generated
    total_amount = sum(item.unit_price for item in orders_in_group)
    if invoice_type == "proforma" and first_order.proforma_stage_percent:
        total_amount = round((total_amount * first_order.proforma_stage_percent) / 100)

    payment_url = first_order.payment_link
    if not payment_url:
        from utils.xendit_client import XenditClient
        xendit = XenditClient()
        try:
            res = xendit.create_invoice(
                external_id=order_number,
                amount=total_amount,
                payer_email=recipient_email,
                description=f"Payment for Service Order {order_number} ({invoice_type.capitalize()} Invoice)"
            )
            payment_url = res.get("invoice_url")
            inv_id = res.get("id")
            for item in orders_in_group:
                item.payment_link = payment_url
                item.xendit_invoice_id = inv_id
                item.payment_link_created_at = datetime.now()
        except Exception as e:
            print("Failed to auto-generate Xendit link:", e)

    db.commit()

    from utils.email_service import send_invoice_attachment_email
    send_invoice_attachment_email(
        recipient_email=recipient_email,
        recipient_name=recipient_name,
        invoice_type=invoice_type,
        pdf_content=pdf_content,
        pdf_filename=doc.file_name,
        payment_url=payment_url
    )

    # Log activity
    log_activity(
        db, 
        "INVOICE_EMAILED", 
        f"Emailed {invoice_type} invoice for order {order_number} to {recipient_email}", 
        client_id=company.client_id, 
        company_id=company.id, 
        user_id=current_user.id
    )

    res_list = []
    for ord_obj in orders_in_group:
        db.refresh(ord_obj)
        res = schemas.ClientOrderResponse.model_validate(ord_obj) if hasattr(schemas.ClientOrderResponse, "model_validate") else schemas.ClientOrderResponse.from_orm(ord_obj)
        if ord_obj.client:
            res.client_name = ord_obj.client.contact_person
        if ord_obj.company:
            res.company_name = ord_obj.company.company_name
        res_list.append(res)
        
    return res_list


@router.post("/orders/{order_number}/payment-link")
def generate_order_payment_link(
    order_number: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    orders = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    if not orders:
        raise HTTPException(status_code=404, detail="Order not found")
        
    first_order = orders[0]
    
    # Calculate amount
    total_amount = sum(item.unit_price for item in orders)
    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid order total amount")
        
    client = first_order.client
    if not client:
        raise HTTPException(status_code=400, detail="Client not attached to order")
        
    if first_order.payment_link:
        return {"payment_link": first_order.payment_link}
        
    from utils.xendit_client import XenditClient
    xendit = XenditClient()
    
    try:
        res = xendit.create_invoice(
            external_id=order_number,
            amount=total_amount,
            payer_email=client.email,
            description=f"Payment for Service Order {order_number}"
        )
        pay_url = res.get("invoice_url")
        inv_id = res.get("id")
        
        for item in orders:
            item.payment_link = pay_url
            item.xendit_invoice_id = inv_id
            item.payment_link_created_at = datetime.now()
            
        db.commit()
        return {"payment_link": pay_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


public_router = APIRouter(
    prefix="/api/clients/payments",
    tags=["payments"]
)

@public_router.post("/webhook")
async def xendit_webhook(request: Request, db: Session = Depends(database.get_db)):
    x_token = request.headers.get("x-callback-token")
    env_token = os.getenv("XENDIT_CALLBACK_TOKEN", "")
    if not env_token or x_token != env_token:
        raise HTTPException(status_code=401, detail="Unauthorized webhook source")
        
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
    external_id = payload.get("external_id")
    status = payload.get("status")
    
    if not external_id or not status:
        return {"status": "ignored", "reason": "missing required fields"}
        
    # Check if order exists
    orders = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == external_id).all()
    if not orders:
        return {"status": "ignored", "reason": "matching order not found"}
        
    if status == "PAID":
        description = payload.get("description", "").lower()
        is_proforma = "proforma" in description
        is_final = "final" in description
        paid_amount_val = payload.get("paid_amount") or payload.get("amount")
        
        # Calculate total amount of the order
        total_order_amount = sum(item.unit_price for item in orders)
        
        # Parse paid_amount to float for formatting
        try:
            parsed_paid_amount = float(paid_amount_val) if paid_amount_val is not None else float(total_order_amount)
        except ValueError:
            parsed_paid_amount = 0.0
            
        formatted_paid = f"IDR {parsed_paid_amount:,.0f}"
        
        if is_proforma or (paid_amount_val and float(paid_amount_val) < total_order_amount and not is_final):
            new_payment_status = "PARTIALLY_PAID"
            message_text = f"Proforma payment of {formatted_paid} completed successfully via Xendit bank transfer."
        else:
            new_payment_status = "PAID"
            message_text = f"Full payment of {formatted_paid} completed successfully via Xendit bank transfer."
            
        # Transition execution status conditionally and log to chat
        transition_orders = [item for item in orders if item.status in ["DRAFT", "PROFORMA_GENERATED", "WAITING_ON_CLIENT"]]
        if transition_orders:
            target_status = "CONFIRMED"
            first_trans = transition_orders[0]
            if first_trans.consultant_ids and len(first_trans.consultant_ids) > 0:
                target_status = "ORDER_ASSIGNED"
            update_order_group_status(db, transition_orders, target_status, None)
            
        for item in orders:
            item.payment_status = new_payment_status
        
        # Log to ClientOrderProgress
        progress = models.ClientOrderProgress(
            order_number=external_id,
            message=message_text,
            user_id=None
        )
        db.add(progress)
        db.commit()
        return {"status": "success", "message": f"Order {external_id} marked as {new_payment_status}"}
        
    return {"status": "received"}



