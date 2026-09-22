from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request, Query, Response
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional, Any
from pydantic import BaseModel
import os
import re
import json
import shutil
import uuid
import threading
from datetime import datetime, timedelta, timezone
from collections import defaultdict

import models, schemas, auth, database
from storage import upload_file, delete_file

from sqlalchemy import func, or_, and_

router = APIRouter(
    prefix="/api/clients",
    tags=["clients"],
    dependencies=[Depends(auth.get_current_user)]
)

status_lock = threading.Lock()

def get_user_display_name(user: Optional[models.User]) -> str:
    if not user:
        return "System"
    if getattr(user, "employee", None):
        parts = [p for p in [user.employee.first_name, user.employee.last_name] if p]
        if parts:
            return " ".join(parts)
    return getattr(user, "email", None) or f"User #{getattr(user, 'id', '')}"

def generate_company_code(db: Session, company_name: str = None) -> str:
    """
    Auto-generates company code in format: A[Year2Digits][4RandomDigits]
    Example for 2026: 'A262675'
    Example for 2027: 'A274584'
    Ensures no two companies can have the same identity (uniqueness guaranteed).
    """
    import datetime, random
    year_str = datetime.datetime.now().strftime("%y")
    
    while True:
        rand_digits = f"{random.randint(0, 9999):04d}"
        code = f"A{year_str}{rand_digits}"
        existing = db.query(models.ClientCompany).filter(models.ClientCompany.company_code == code).first()
        if not existing:
            return code

def generate_client_code(db: Session) -> str:
    """
    Auto-generates client/partner code in format: X[Year2Digits][4DigitSequence]
    Example for 2026: 'X260001'
    Guarantees monotonic incrementing so deleted client codes are never reused.
    """
    import re
    year_str = datetime.now().strftime("%y")
    prefix = f"X{year_str}"
    pattern = re.compile(rf"X{year_str}(\d+)", re.IGNORECASE)

    max_seq = 0

    # 1. Check Partner table
    partner_codes = db.query(models.Partner.client_code).filter(
        models.Partner.client_code.ilike(f"{prefix}%")
    ).all()
    for (c,) in partner_codes:
        if c:
            m = pattern.search(c)
            if m:
                try:
                    max_seq = max(max_seq, int(m.group(1)))
                except ValueError:
                    pass

    # 2. Check Client table
    client_codes = db.query(models.Client.customer_code).filter(
        models.Client.customer_code.ilike(f"{prefix}%")
    ).all()
    for (c,) in client_codes:
        if c:
            m = pattern.search(c)
            if m:
                try:
                    max_seq = max(max_seq, int(m.group(1)))
                except ValueError:
                    pass

    next_seq = max_seq + 1
    code = f"{prefix}{next_seq:04d}"

    while db.query(models.Partner).filter(func.upper(models.Partner.client_code) == code.upper()).first() or \
          db.query(models.Client).filter(func.upper(models.Client.customer_code) == code.upper()).first():
        next_seq += 1
        code = f"{prefix}{next_seq:04d}"

    return code

def validate_and_clean_email(email_str: Optional[str], field_name: str = "Email", required: bool = True) -> Optional[str]:
    import re
    if not email_str or not str(email_str).strip():
        if required:
            raise HTTPException(status_code=400, detail=f"{field_name} is mandatory")
        return None
    cleaned = str(email_str).strip().lower()
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_regex, cleaned):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid {field_name} format. Please provide a valid email address (e.g. contact@example.com)."
        )
    return cleaned

def validate_and_clean_phone(phone_str: Optional[str], field_name: str = "Phone Number", required: bool = True) -> Optional[str]:
    import re
    if not phone_str or not str(phone_str).strip():
        if required:
            raise HTTPException(status_code=400, detail=f"{field_name} is mandatory")
        return None
    cleaned = str(phone_str).strip()
    digits_only = re.sub(r"\D", "", cleaned)
    if len(digits_only) < 6 or len(digits_only) > 16:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid {field_name}. Please provide a valid phone number with 6 to 15 digits."
        )
    return cleaned

def update_order_group_status(
    db: Session, 
    orders: List[models.ClientOrder], 
    new_status: str, 
    user_id: Optional[int] = None,
    hold_reason: Optional[str] = None,
    hold_channel: Optional[str] = "CLIENT"
):
    if not orders:
        return
        
    with status_lock:
        first_order = orders[0]
        
        # Ensure we have fresh status from database
        try:
            db.refresh(first_order)
        except Exception:
            pass
            
        old_status = first_order.status
        
        # Update status for all orders in group
        for order in orders:
            order.status = new_status
            
        # If the status actually changed, log a single progress message in the order chat
        if old_status != new_status or (new_status == "ON_HOLD" and hold_reason):
            status_label = new_status.replace("_", " ").upper()
            if new_status == "ON_HOLD" and hold_reason:
                msg = f"⏸️ Order placed ON HOLD. Reason: {hold_reason.strip()}"
            else:
                msg = f"Order execution status has been updated to {status_label}."
            
            target_channel = hold_channel if (new_status == "ON_HOLD" and hold_channel in ["CLIENT", "INTERNAL"]) else "CLIENT"
            
            # Prevent duplicate status change entries in concurrent requests (within last 5 seconds)
            five_sec_ago = datetime.utcnow() - timedelta(seconds=5)
            existing = db.query(models.ClientOrderProgress).filter(
                models.ClientOrderProgress.order_number == first_order.order_number,
                models.ClientOrderProgress.message == msg,
                models.ClientOrderProgress.created_at >= five_sec_ago
            ).first()
            
            if not existing:
                progress = models.ClientOrderProgress(
                    order_number=first_order.order_number,
                    message=msg,
                    user_id=None,
                    channel=target_channel
                )
                db.add(progress)

        try:
            db.commit()  # Always commit status updates and any progress entry
        except Exception:
            db.rollback()

        # Automatically notify assigned consultants & reviewers if moving to ORDER_ASSIGNED
        if new_status == "ORDER_ASSIGNED" and old_status != "ORDER_ASSIGNED":
            try:
                c_ids = parse_consultant_ids(first_order.consultant_ids)
                r_ids = parse_consultant_ids(getattr(first_order, "reviewer_ids", None))
                if first_order.reviewer_id and first_order.reviewer_id not in r_ids:
                    r_ids.append(first_order.reviewer_id)
                if c_ids or r_ids:
                    comp_name = first_order.company.company_name if first_order.company else None
                    svc_names = [o.job_title for o in orders if o.job_title]
                    send_order_assignment_notifications(
                        db=db,
                        order_number=first_order.order_number,
                        consultant_employee_ids=c_ids,
                        reviewer_employee_ids=r_ids,
                        company_name=comp_name,
                        service_names=svc_names,
                        order_id=first_order.id,
                        is_status_transition=True
                    )
            except Exception as notif_err:
                print("Warning: order assigned status transition notification failed:", notif_err)

        # Automatically update Dropbox archive on completion / final delivery
        if new_status in ["COMPLETED", "SOFT_COPY_DELIVERED", "HARD_COPY_DELIVERED"]:
            try:
                save_order_chat_to_dropbox(first_order.order_number, db)
            except Exception as e:
                print(f"Warning: Auto-archiving completed order chat to Dropbox failed: {e}")

def replicate_key_contact_to_stakeholder(db: Session, db_company: models.ClientCompany):
    if not db_company or not db_company.id:
        return

    # 1. Operational Key Contact Person Sync (Mandatory)
    if db_company.key_contact_person and db_company.key_contact_person.strip():
        kc_name = db_company.key_contact_person.strip()
        existing_kc = db.query(models.CompanyStakeholder).filter(
            models.CompanyStakeholder.company_id == db_company.id,
            (models.CompanyStakeholder.is_key_contact == True) | (models.CompanyStakeholder.name == kc_name)
        ).first()
        if not existing_kc:
            stakeholder = models.CompanyStakeholder(
                company_id=db_company.id,
                name=kc_name,
                role="Key Contact Person",
                share_percentage=0.0,
                phone=db_company.key_contact_phone,
                email=db_company.key_contact_email,
                is_key_contact=True
            )
            db.add(stakeholder)
            db.commit()
        else:
            existing_kc.name = kc_name
            existing_kc.phone = db_company.key_contact_phone
            existing_kc.email = db_company.key_contact_email
            existing_kc.is_key_contact = True
            db.commit()

    # 2. Director Sync (Optional)
    if db_company.director_name and db_company.director_name.strip():
        dir_name = db_company.director_name.strip()
        existing_dir = db.query(models.CompanyStakeholder).filter(
            models.CompanyStakeholder.company_id == db_company.id,
            (models.CompanyStakeholder.role == "Director") | (models.CompanyStakeholder.name == dir_name)
        ).first()
        if not existing_dir:
            dir_stk = models.CompanyStakeholder(
                company_id=db_company.id,
                name=dir_name,
                role="Director",
                share_percentage=0.0,
                phone=db_company.director_contact,
                email=db_company.director_email,
                is_key_contact=False
            )
            db.add(dir_stk)
            db.commit()
        else:
            existing_dir.name = dir_name
            existing_dir.email = db_company.director_email
            existing_dir.phone = db_company.director_contact
            existing_dir.role = "Director"
            db.commit()


def sync_company_update_to_stakeholder(db: Session, db_company: models.ClientCompany):
    if not db_company:
        return
    replicate_key_contact_to_stakeholder(db, db_company)

def is_admin_or_hr(user: models.User) -> bool:
    if not user:
        return False
    if auth.is_super_admin(user):
        return True
    if not user.role:
        return False
    role_name = str(user.role.name).strip().upper()
    if "ADMIN" in role_name or "HR" in role_name or "DIRECTOR" in role_name:
        return True
    return role_name in ["HR", "HR ADMIN", "HR EXECUTIVE", "ADMIN", "SUPER ADMIN", "SUPERADMIN", "SYSTEM ADMIN"]

def is_employee_role(user: models.User) -> bool:
    if not user:
        return False
    if auth.is_super_admin(user) or is_admin_or_hr(user):
        return True
    if user.role and user.role.name.upper() in ["CLIENT", "MEMBER"]:
        return False
    if hasattr(user, "employee") and user.employee is not None:
        return True
    if user.role:
        name = user.role.name.upper()
        if "EMPLOYEE" in name or name in ["TEAM LEAD", "LICENSE CONSULTANT", "PROJECT MANAGER", "HR EXECUTIVE", "CONSULTANT", "STAFF", "MANAGER", "PAYROLL MANAGER", "DEPARTMENT MANAGER"]:
            return True
    return False

def parse_consultant_ids(c_ids: Any) -> List[int]:
    if not c_ids:
        return []
    if isinstance(c_ids, str):
        try:
            parsed = json.loads(c_ids)
        except Exception:
            parsed = [int(x.strip()) for x in c_ids.split(",") if x.strip().isdigit()]
    elif isinstance(c_ids, list):
        parsed = c_ids
    else:
        return []
    return [int(x) for x in parsed if str(x).isdigit()]

def is_assigned_employee_to_company(user: models.User, company_id: int, db: Session) -> bool:
    if is_employee_role(user) and getattr(user, "employee", None):
        # 1. Check direct company consultant assignment
        assignment = db.query(models.ClientConsultant).filter(
            models.ClientConsultant.company_id == company_id,
            models.ClientConsultant.employee_id == user.employee.id
        ).first()
        if assignment is not None:
            return True

        # 2. Check assignment to any order belonging to this company
        company_orders = db.query(models.ClientOrder).filter(models.ClientOrder.company_id == company_id).all()
        for ord_obj in company_orders:
            c_ids = parse_consultant_ids(ord_obj.consultant_ids)
            if user.employee.id in c_ids:
                return True
    return False

def is_client_themselves(user: models.User, client_id: int, db: Optional[Session] = None) -> bool:
    if user.role is not None and user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"]:
        if user.client and hasattr(user.client, "id") and user.client.id == client_id:
            return True
        if user.partner and hasattr(user.partner, "id") and user.partner.id == client_id:
            return True
        if db:
            c = db.query(models.Partner).filter(models.Partner.user_id == user.id).first()
            if c and c.id == client_id:
                return True
            cust = db.query(models.Client).filter(models.Client.user_id == user.id).first()
            if cust and cust.id == client_id:
                return True
    return False

def is_client_themselves_for_company(user: models.User, company_id: int, db: Session) -> bool:
    if user.role is not None and user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"]:
        # 1. Check via Client entity
        client_id = user.client.id if user.client and hasattr(user.client, "id") else None
        if not client_id:
            cust = db.query(models.Client).filter(models.Client.user_id == user.id).first()
            if cust:
                client_id = cust.id
        if client_id:
            company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
            if company and (company.customer_id == client_id or getattr(user.client, "company_id", None) == company_id):
                return True

        # 2. Check via Partner entity
        partner_id = user.partner.id if user.partner and hasattr(user.partner, "id") else None
        if not partner_id:
            p = db.query(models.Partner).filter(models.Partner.user_id == user.id).first()
            if p:
                partner_id = p.id
        if partner_id:
            company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
            if company and company.client_id == partner_id:
                return True
    return False

@router.get("", response_model=List[schemas.ClientResponse])
def get_clients(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    role_name = current_user.role.name.upper() if current_user.role else ""
    base_query = db.query(models.Partner).options(
        joinedload(models.Partner.companies),
        joinedload(models.Partner.user)
    )
    
    if auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_all", "view", db) or is_admin_or_hr(current_user):
        return base_query.order_by(models.Partner.contact_person).all()
    elif role_name in ["CLIENT", "CUSTOMER", "MEMBER"]:
        # 1. Check if user is a Partner
        partner_obj = db.query(models.Partner).options(
            joinedload(models.Partner.companies),
            joinedload(models.Partner.user)
        ).filter(
            or_(
                models.Partner.user_id == current_user.id,
                func.lower(models.Partner.email) == current_user.email.strip().lower() if current_user.email else False
            )
        ).first()

        if partner_obj:
            if not partner_obj.user_id:
                partner_obj.user_id = current_user.id
                db.commit()
                db.refresh(partner_obj)
            return base_query.filter(models.Partner.id == partner_obj.id).all()

        # 2. Check if user is a Client (table: clients)
        client_obj = db.query(models.Client).options(
            joinedload(models.Client.companies),
            joinedload(models.Client.company),
            joinedload(models.Client.user)
        ).filter(
            or_(
                models.Client.user_id == current_user.id,
                func.lower(models.Client.email) == current_user.email.strip().lower() if current_user.email else False
            )
        ).first()

        if client_obj:
            if not client_obj.user_id:
                client_obj.user_id = current_user.id
                db.commit()
                db.refresh(client_obj)

            # Explicitly load all companies associated with this client
            all_comps = db.query(models.ClientCompany).filter(
                or_(
                    models.ClientCompany.customer_id == client_obj.id,
                    models.ClientCompany.id == client_obj.company_id if client_obj.company_id else False
                )
            ).order_by(models.ClientCompany.company_name.asc()).all()

            # Build ClientResponse compatible model
            return [schemas.ClientResponse(
                id=client_obj.id,
                client_code=client_obj.customer_code,
                contact_person=client_obj.full_name,
                email=client_obj.email,
                phone=client_obj.phone,
                status=client_obj.status or "ACTIVE",
                notes=client_obj.notes,
                date_of_birth=client_obj.date_of_birth,
                nationality=client_obj.nationality,
                gender=client_obj.gender,
                identification_number=client_obj.identification_number,
                personal_address=client_obj.address,
                user_id=client_obj.user_id,
                companies=[schemas.ClientCompanyResponse.model_validate(c) for c in all_comps],
                created_at=client_obj.created_at or datetime.now(timezone.utc),
                updated_at=client_obj.updated_at
            )]

        # 3. Auto-create client profile and default company for this client user if neither exists
        new_code = generate_client_code(db)
        client_name = current_user.name or (current_user.email.split("@")[0].capitalize() if current_user.email else "Client")
        partner_obj = models.Partner(
            user_id=current_user.id,
            contact_person=client_name,
            email=current_user.email,
            phone="",
            client_code=new_code,
        )
        db.add(partner_obj)
        db.commit()
        db.refresh(partner_obj)
        
        # Also create default company
        new_comp_code = generate_company_code(db, f"{client_name} Entity")
        comp = models.ClientCompany(
            client_id=partner_obj.id,
            company_name=f"{client_name} Entity",
            company_code=new_comp_code,
            key_contact_person=partner_obj.contact_person,
            key_contact_email=partner_obj.email,
            status="ACTIVE"
        )
        db.add(comp)
        db.commit()
        db.refresh(comp)
        replicate_key_contact_to_stakeholder(db, comp)
        return base_query.filter(models.Partner.id == partner_obj.id).all()

    elif is_employee_role(current_user):
        if not current_user.employee:
            return []
        # Find clients whose companies this employee is assigned to
        assigned_companies = db.query(models.ClientCompany).join(models.ClientConsultant).filter(
            models.ClientConsultant.employee_id == current_user.employee.id
        ).all()
        client_ids = list(set([c.client_id for c in assigned_companies if c.client_id]))
        return base_query.filter(models.Partner.id.in_(client_ids)).order_by(models.Partner.contact_person).all()
    return []


def build_consultants_cache(db: Session, orders: List[models.ClientOrder]) -> dict:
    all_emp_ids = set()
    for o in orders:
        for cid in parse_consultant_ids(o.consultant_ids):
            all_emp_ids.add(cid)
        for rid in parse_consultant_ids(getattr(o, "reviewer_ids", None)):
            all_emp_ids.add(rid)
        if getattr(o, "reviewer_id", None):
            all_emp_ids.add(o.reviewer_id)
            
    if not all_emp_ids:
        return {}
        
    employees = db.query(models.Employee).options(
        joinedload(models.Employee.user),
        joinedload(models.Employee.department)
    ).filter(models.Employee.id.in_(list(all_emp_ids))).all()
    
    cache = {}
    for emp in employees:
        full_name = f"{emp.first_name or ''} {emp.last_name or ''}".strip()
        cache[emp.id] = {
            "id": emp.id,
            "name": full_name or "Consultant",
            "job_title": emp.job_title or "Consultant",
            "email": emp.user.email if emp.user else None,
            "department": emp.department.name if emp.department else None,
            "profile_photo": emp.profile_photo if hasattr(emp, "profile_photo") else None,
            "phone": emp.phone_number if hasattr(emp, "phone_number") else None
        }
    return cache

def build_doc_counts_cache(db: Session, orders: list) -> dict:
    order_nums = list({ord_obj.order_number.strip() for ord_obj in orders if getattr(ord_obj, "order_number", None) and ord_obj.order_number.strip()})
    if not order_nums:
        return {}
    try:
        counts = db.query(models.ClientDocument.order_number, func.count(models.ClientDocument.id)).filter(
            models.ClientDocument.order_number.in_(order_nums)
        ).group_by(models.ClientDocument.order_number).all()
        doc_counts = {}
        for ord_num, cnt in counts:
            if ord_num:
                doc_counts[ord_num.strip().upper()] = cnt
        return doc_counts
    except Exception as e:
        print("build_doc_counts_cache error:", e)
        return {}

def format_order_response(ord_obj: models.ClientOrder, consultants_cache: dict, doc_counts_cache: Optional[dict] = None) -> schemas.ClientOrderResponse:
    res = schemas.ClientOrderResponse.model_validate(ord_obj) if hasattr(schemas.ClientOrderResponse, "model_validate") else schemas.ClientOrderResponse.from_orm(ord_obj)
    if ord_obj.client:
        res.client_name = ord_obj.client.contact_person
    if ord_obj.company:
        res.company_name = ord_obj.company.company_name
    elif ord_obj.client and ord_obj.client.companies:
        res.company_name = ord_obj.client.companies[0].company_name
        
    if ord_obj.billing_company:
        res.billing_company_name = ord_obj.billing_company.company_name
    elif ord_obj.company:
        res.billing_company_name = ord_obj.company.company_name
    elif ord_obj.client and ord_obj.client.companies:
        res.billing_company_name = ord_obj.client.companies[0].company_name

    parsed_cids = parse_consultant_ids(ord_obj.consultant_ids)
    res.consultants = [consultants_cache[cid] for cid in parsed_cids if cid in consultants_cache]
    res.consultant_ids = parsed_cids

    parsed_rids = parse_consultant_ids(getattr(ord_obj, "reviewer_ids", None))
    if not parsed_rids and ord_obj.reviewer_id:
        parsed_rids = [ord_obj.reviewer_id]
    res.reviewer_ids = parsed_rids
    res.reviewers = [consultants_cache[rid] for rid in parsed_rids if rid in consultants_cache]

    if ord_obj.reviewer_id:
        res.reviewer_id = ord_obj.reviewer_id
        res.reviewer = consultants_cache.get(ord_obj.reviewer_id)
    elif parsed_rids:
        res.reviewer_id = parsed_rids[0]
        res.reviewer = consultants_cache.get(parsed_rids[0])
    else:
        res.reviewer_id = None
        res.reviewer = None

    svc_title = ""
    if ord_obj.service and getattr(ord_obj.service, "job_title", None):
        svc_title = ord_obj.service.job_title
    elif ord_obj.job_title:
        svc_title = ord_obj.job_title
    res.service_name = svc_title or "Service Package"
    if not res.job_title:
        res.job_title = res.service_name

    if doc_counts_cache and ord_obj.order_number:
        res.document_count = doc_counts_cache.get(ord_obj.order_number.strip().upper(), 0)
    else:
        res.document_count = getattr(res, "document_count", 0) or 0
    return res

def get_consultants_data(db: Session, c_ids: Any) -> List[dict]:
    parsed_ids = parse_consultant_ids(c_ids)
    if not parsed_ids:
        return []
    try:
        employees = db.query(models.Employee).options(
            joinedload(models.Employee.user),
            joinedload(models.Employee.department)
        ).filter(models.Employee.id.in_(parsed_ids)).all()
        results = []
        for emp in employees:
            full_name = f"{emp.first_name or ''} {emp.last_name or ''}".strip()
            results.append({
                "id": emp.id,
                "name": full_name or "Consultant",
                "job_title": emp.job_title or "Consultant",
                "email": emp.user.email if emp.user else None,
                "department": emp.department.name if emp.department else None,
                "profile_photo": emp.profile_photo if hasattr(emp, "profile_photo") else None,
                "phone": emp.phone_number if hasattr(emp, "phone_number") else None
            })
        return results
    except Exception as e:
        print("get_consultants_data error:", e)
        return []

def send_order_assignment_notifications(
    db: Session,
    order_number: str,
    consultant_employee_ids: List[int],
    reviewer_employee_ids: List[int],
    company_name: Optional[str] = None,
    service_names: Optional[List[str]] = None,
    order_id: Optional[int] = None,
    is_status_transition: bool = False
):
    """
    Dispatches in-app bell icon notifications and WebSocket push to assigned consultants and reviewers.
    """
    try:
        from notification_manager import manager

        if not company_name or not order_id or not service_names:
            orders = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
            if orders:
                first_o = orders[0]
                if not order_id:
                    order_id = first_o.id
                if not company_name:
                    if first_o.company:
                        company_name = first_o.company.company_name
                    elif first_o.client and first_o.client.companies:
                        company_name = first_o.client.companies[0].company_name
                    elif first_o.client:
                        company_name = first_o.client.contact_person
                if not service_names:
                    service_names = [o.job_title for o in orders if o.job_title]

        company_info = f" for {company_name}" if company_name else ""
        services_info = f" ({', '.join(service_names[:2])})" if service_names else ""
        one_min_ago = datetime.utcnow() - timedelta(minutes=1)

        consultant_set = set(consultant_employee_ids or [])
        reviewer_set = set(reviewer_employee_ids or [])
        all_emp_ids = list(consultant_set | reviewer_set)

        emp_map = {}
        recent_notif_set = set()
        if all_emp_ids:
            employees = db.query(models.Employee).filter(models.Employee.id.in_(all_emp_ids)).all()
            emp_map = {e.id: e for e in employees if e.user_id}
            user_ids = [e.user_id for e in emp_map.values()]
            if user_ids:
                recent_notifs = db.query(models.Notification.user_id, models.Notification.type).filter(
                    models.Notification.user_id.in_(user_ids),
                    models.Notification.reference_id == order_id,
                    models.Notification.type.in_(["order_assignment", "order_review_assignment"]),
                    models.Notification.created_at >= one_min_ago
                ).all()
                recent_notif_set = {(n[0], n[1]) for n in recent_notifs}

        # 1. Notify Assigned Consultants
        for emp_id in consultant_set:
            emp = emp_map.get(emp_id)
            if not emp:
                continue

            notif_type = "order_assignment"
            if (emp.user_id, notif_type) in recent_notif_set:
                continue

            if is_status_transition:
                title = f"Order #{order_number} Assigned for Execution"
                message = f"Order #{order_number}{company_info}{services_info} has been placed in active execution."
            else:
                title = f"Assigned as Consultant - Order #{order_number}"
                message = f"You have been assigned as an executing consultant on Order #{order_number}{company_info}{services_info}."

            manager.notify_user_sync(
                db=db,
                user_id=emp.user_id,
                title=title,
                message=message,
                type=notif_type,
                module="orders",
                system_area="shared",
                reference_id=order_id,
                action_url=f"/business/assigned-orders?order={order_number}&chat=false"
            )

        # 2. Notify Assigned Reviewers
        for emp_id in reviewer_set:
            emp = emp_map.get(emp_id)
            if not emp:
                continue

            notif_type = "order_review_assignment"
            if (emp.user_id, notif_type) in recent_notif_set:
                continue

            if is_status_transition:
                title = f"Order #{order_number} Ready for Review"
                message = f"Order #{order_number}{company_info}{services_info} is now assigned and active for your review."
            else:
                title = f"Assigned as Reviewer - Order #{order_number}"
                message = f"You have been assigned as a designated reviewer on Order #{order_number}{company_info}{services_info}."

            manager.notify_user_sync(
                db=db,
                user_id=emp.user_id,
                title=title,
                message=message,
                type=notif_type,
                module="orders",
                system_area="shared",
                reference_id=order_id,
                action_url=f"/business/assigned-orders?order={order_number}&chat=false"
            )
    except Exception as e:
        print(f"Warning: Failed to dispatch order assignment notifications for {order_number}: {e}")

@router.get("/orders/my-assigned", response_model=List[schemas.ClientOrderResponse])
def get_my_assigned_orders(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Returns ONLY orders allocated/assigned to the currently logged in user/employee.
    """
    all_orders = db.query(models.ClientOrder).options(
        joinedload(models.ClientOrder.partner).joinedload(models.Partner.companies),
        joinedload(models.ClientOrder.company),
        joinedload(models.ClientOrder.billing_company),
        joinedload(models.ClientOrder.service),
        joinedload(models.ClientOrder.notary)
    ).order_by(models.ClientOrder.id.desc()).all()
    
    target_emp_id = current_user.employee.id if current_user.employee else None
    
    ALLOWED_ASSIGNED_STATUSES = [
        "CONFIRMED",
        "ORDER_ASSIGNED",
        "IN_PROGRESS",
        "ON_HOLD",
        "REVIEW_DOCS",
        "DOCUMENTS_REVIEWED",
        "PRE_DOC_SENT_FOR_SIGNATURE",
        "PRE_DOCS_SENT",
        "FINAL_DOCUMENT_PREPARATION",
        "FINAL_DOC_READY",
        "WAITING_FOR_FINAL_PAYMENT",
        "FINAL_PAYMENT_COMPLETED",
        "SOFT_COPY_DELIVERED",
        "HARD_COPY_DELIVERED",
        "COMPLETED"
    ]

    is_admin = is_admin_or_hr(current_user) or auth.is_super_admin(current_user)
    filtered_orders = []
    for ord_obj in all_orders:
        c_ids = parse_consultant_ids(ord_obj.consultant_ids)
        r_ids = parse_consultant_ids(getattr(ord_obj, "reviewer_ids", None))
        if ord_obj.reviewer_id and ord_obj.reviewer_id not in r_ids:
            r_ids.append(ord_obj.reviewer_id)
        is_assigned = is_admin or bool(target_emp_id and (target_emp_id in c_ids or target_emp_id in r_ids or ord_obj.reviewer_id == target_emp_id))
            
        if is_assigned and (ord_obj.status or "").upper() in ALLOWED_ASSIGNED_STATUSES:
            filtered_orders.append(ord_obj)
            
    consultants_cache = build_consultants_cache(db, filtered_orders)
    doc_counts_cache = build_doc_counts_cache(db, filtered_orders)
    return [format_order_response(ord_obj, consultants_cache, doc_counts_cache) for ord_obj in filtered_orders]

@router.get("/orders/workload-matrix")
def get_order_workload_matrix(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns an assignment and capacity matrix of all employees,
    including their counts as Executing Consultant and Designated Reviewer,
    workload distribution across lifecycle stages, and the list of assigned orders.
    """
    if not (
        auth.is_super_admin(current_user) 
        or is_admin_or_hr(current_user) 
        or auth.has_permission(current_user, "clients_orders_active", "view", db)
        or auth.has_permission(current_user, "clients_orders", "view", db)
        or auth.has_permission(current_user, "clients_my", "view", db)
    ):
        raise HTTPException(status_code=403, detail="Not authorized to view workload matrix")

    # Fetch all orders
    all_orders = db.query(models.ClientOrder).options(
        joinedload(models.ClientOrder.company),
        joinedload(models.ClientOrder.client),
        joinedload(models.ClientOrder.service)
    ).order_by(models.ClientOrder.id.desc()).all()

    # Group by order_number
    orders_by_num = defaultdict(list)
    for o in all_orders:
        if o.order_number:
            orders_by_num[o.order_number].append(o)

    # Fetch all active employees
    all_employees = db.query(models.Employee).options(
        joinedload(models.Employee.user),
        joinedload(models.Employee.department)
    ).filter(models.Employee.status == models.EmploymentStatus.ACTIVE).all()

    emp_map = {e.id: e for e in all_employees}

    # Pre-calculate assigned sets and order objects
    consultant_orders_map = defaultdict(dict)  # emp_id -> {order_num: order_data}
    reviewer_orders_map = defaultdict(dict)    # emp_id -> {order_num: order_data}
    
    total_active_orders = 0
    unassigned_orders = 0

    for order_num, items in orders_by_num.items():
        first_item = items[0]
        status = (first_item.status or "DRAFT").upper()
        is_active = status not in ["COMPLETED", "CANCELLED"]
        if is_active:
            total_active_orders += 1

        # Company name
        comp_name = None
        if first_item.company:
            comp_name = first_item.company.company_name
        elif first_item.client and getattr(first_item.client, "companies", None):
            comp_name = first_item.client.companies[0].company_name
        elif first_item.client:
            comp_name = first_item.client.contact_person

        # Collect unique consultant and reviewer IDs
        c_ids = set()
        r_ids = set()
        total_group_amount = 0.0
        services = []

        for item in items:
            c_ids.update(parse_consultant_ids(item.consultant_ids))
            r_list = parse_consultant_ids(getattr(item, "reviewer_ids", None))
            if item.reviewer_id and item.reviewer_id not in r_list:
                r_list.append(item.reviewer_id)
            r_ids.update(r_list)
            total_group_amount += float(item.unit_price or item.total_amount or 0.0)
            if item.job_title:
                services.append(item.job_title)

        if is_active and not c_ids and not r_ids:
            unassigned_orders += 1

        # Build order summary payload for drill-down
        order_summary = {
            "order_number": order_num,
            "id": first_item.id,
            "status": status,
            "payment_status": first_item.payment_status or "UNPAID",
            "company_name": comp_name or "Individual Client",
            "client_name": first_item.client.contact_person if first_item.client else None,
            "services": services[:3],
            "services_count": len(services),
            "total_amount": total_group_amount,
            "created_at": first_item.created_at.isoformat() if first_item.created_at else None,
            "is_active": is_active,
            "consultant_ids": list(c_ids),
            "reviewer_ids": list(r_ids)
        }

        # Populate consultant map
        for cid in c_ids:
            consultant_orders_map[cid][order_num] = {
                **order_summary,
                "role": "CONSULTANT"
            }

        # Populate reviewer map
        for rid in r_ids:
            reviewer_orders_map[rid][order_num] = {
                **order_summary,
                "role": "REVIEWER"
            }

    # Also include any inactive employees who happen to have assignments
    all_assigned_emp_ids = set(consultant_orders_map.keys()) | set(reviewer_orders_map.keys())
    missing_emp_ids = [eid for eid in all_assigned_emp_ids if eid not in emp_map]
    if missing_emp_ids:
        missing_emps = db.query(models.Employee).options(
            joinedload(models.Employee.user),
            joinedload(models.Employee.department)
        ).filter(models.Employee.id.in_(missing_emp_ids)).all()
        for me in missing_emps:
            emp_map[me.id] = me

    # Build response list for Legal team and assigned staff only
    matrix_rows = []
    total_consultants_engaged = 0
    total_reviewers_engaged = 0

    # Filter to Legal team employees or anyone with order assignments
    legal_team_emp_ids = [
        eid for eid, emp in emp_map.items()
        if (emp.department and "legal" in emp.department.name.lower()) or eid in all_assigned_emp_ids
    ]

    for emp_id in legal_team_emp_ids:
        emp = emp_map[emp_id]
        c_orders_dict = consultant_orders_map.get(emp_id, {})
        r_orders_dict = reviewer_orders_map.get(emp_id, {})

        c_orders_list = list(c_orders_dict.values())
        r_orders_list = list(r_orders_dict.values())

        c_active = [o for o in c_orders_list if o["is_active"]]
        r_active = [o for o in r_orders_list if o["is_active"]]

        # Combined unique active orders
        active_order_nums = set(o["order_number"] for o in c_active) | set(o["order_number"] for o in r_active)
        all_order_nums = set(o["order_number"] for o in c_orders_list) | set(o["order_number"] for o in r_orders_list)

        if len(c_active) > 0:
            total_consultants_engaged += 1
        if len(r_active) > 0:
            total_reviewers_engaged += 1

        # Status breakdown of active orders for this employee
        status_counts = defaultdict(int)
        for o in c_active:
            status_counts[o["status"]] += 1
        for o in r_active:
            status_counts[o["status"]] += 1

        # Workload capacity evaluation
        total_active_count = len(active_order_nums)
        if total_active_count == 0:
            capacity_status = "AVAILABLE"
        elif total_active_count <= 5:
            capacity_status = "LIGHT"
        elif total_active_count <= 15:
            capacity_status = "OPTIMAL"
        else:
            capacity_status = "HEAVY"

        full_name = f"{emp.first_name or ''} {emp.last_name or ''}".strip()
        phone_val = getattr(emp, "phone", None) or getattr(emp, "phone_number", None) or getattr(emp, "mobile_number", None)

        # Merge orders list for drilldown
        merged_orders = {}
        for o in c_orders_list:
            merged_orders[o["order_number"]] = {**o, "assigned_as": "CONSULTANT"}
        for o in r_orders_list:
            if o["order_number"] in merged_orders:
                merged_orders[o["order_number"]]["assigned_as"] = "BOTH"
            else:
                merged_orders[o["order_number"]] = {**o, "assigned_as": "REVIEWER"}

        # Enrich orders with names of team members
        final_orders_list = list(merged_orders.values())
        for fo in final_orders_list:
            fo["co_consultants"] = [
                f"{emp_map[cid].first_name} {emp_map[cid].last_name}".strip() 
                for cid in fo.get("consultant_ids", []) if cid in emp_map and cid != emp_id
            ]
            fo["reviewers_names"] = [
                f"{emp_map[rid].first_name} {emp_map[rid].last_name}".strip() 
                for rid in fo.get("reviewer_ids", []) if rid in emp_map
            ]

        matrix_rows.append({
            "employee_id": emp.id,
            "user_id": emp.user_id,
            "name": full_name or "Staff Member",
            "job_title": emp.job_title or "Staff",
            "department": emp.department.name if emp.department else None,
            "email": emp.user.email if emp.user else (emp.email if hasattr(emp, "email") else None),
            "phone": phone_val,
            "profile_photo": getattr(emp, "profile_photo", None),
            "consultant_active_count": len(c_active),
            "consultant_total_count": len(c_orders_list),
            "reviewer_active_count": len(r_active),
            "reviewer_total_count": len(r_orders_list),
            "total_active_load": total_active_count,
            "total_all_load": len(all_order_nums),
            "capacity_status": capacity_status,
            "status_breakdown": dict(status_counts),
            "orders": final_orders_list
        })

    # Sort matrix rows: highest active load first, then alphabetically
    matrix_rows.sort(key=lambda r: (-r["total_active_load"], -r["total_all_load"], r["name"]))

    avg_c_load = round(sum(r["consultant_active_count"] for r in matrix_rows) / max(total_consultants_engaged, 1), 1)
    avg_r_load = round(sum(r["reviewer_active_count"] for r in matrix_rows) / max(total_reviewers_engaged, 1), 1)

    return {
        "summary": {
            "total_active_orders": total_active_orders,
            "total_order_groups": len(orders_by_num),
            "total_consultants_engaged": total_consultants_engaged,
            "total_reviewers_engaged": total_reviewers_engaged,
            "unassigned_orders_count": unassigned_orders,
            "avg_consultant_load": avg_c_load,
            "avg_reviewer_load": avg_r_load
        },
        "team_workload": matrix_rows
    }

@router.get("/orders", response_model=List[schemas.ClientOrderResponse])
def get_client_orders(
    response: Response,
    limit: Optional[int] = Query(None, ge=1, le=500),
    offset: Optional[int] = Query(0, ge=0),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    role_name = current_user.role.name.upper() if current_user.role else ""
    orders_query = db.query(models.ClientOrder).options(
        joinedload(models.ClientOrder.partner).joinedload(models.Partner.companies),
        joinedload(models.ClientOrder.company),
        joinedload(models.ClientOrder.billing_company),
        joinedload(models.ClientOrder.service),
        joinedload(models.ClientOrder.notary)
    ).order_by(models.ClientOrder.id.desc())

    if status:
        orders_query = orders_query.filter(models.ClientOrder.status == status)

    if search and search.strip():
        term = f"%{search.strip()}%"
        orders_query = orders_query.filter(
            or_(
                models.ClientOrder.order_number.ilike(term),
                models.ClientOrder.job_title.ilike(term)
            )
        )
    
    if is_admin_or_hr(current_user):
        orders = orders_query.all()
    elif role_name in ["CLIENT", "CUSTOMER", "MEMBER"]:
        conditions = []
        company_ids = set()

        # 1. Partner match
        partner_id = current_user.partner.id if current_user.partner else None
        if not partner_id:
            p = db.query(models.Partner).filter(models.Partner.user_id == current_user.id).first()
            if p:
                partner_id = p.id
        if partner_id:
            conditions.append(models.ClientOrder.client_id == partner_id)
            p_comps = db.query(models.ClientCompany.id).filter(models.ClientCompany.client_id == partner_id).all()
            for c in p_comps:
                company_ids.add(c[0])

        # 2. Client match (table: clients)
        cust_id = current_user.client.id if current_user.client else None
        if not cust_id:
            cust = db.query(models.Client).filter(models.Client.user_id == current_user.id).first()
            if cust:
                cust_id = cust.id
        if cust_id:
            conditions.append(models.ClientOrder.customer_id == cust_id)
            c_comps = db.query(models.ClientCompany.id).filter(
                or_(
                    models.ClientCompany.customer_id == cust_id,
                    models.ClientCompany.id == (current_user.client.company_id if current_user.client else None)
                )
            ).all()
            for c in c_comps:
                company_ids.add(c[0])

        if company_ids:
            conditions.append(models.ClientOrder.company_id.in_(list(company_ids)))

        if conditions:
            orders = orders_query.filter(or_(*conditions)).all()
        else:
            orders = []
    elif is_employee_role(current_user):
        can_view_active = auth.has_permission(current_user, "clients_orders_active", "view", db)
        can_view_completed = auth.has_permission(current_user, "clients_orders_completed", "view", db)
        can_view_cancelled = auth.has_permission(current_user, "clients_orders_cancelled", "view", db)
        can_view_pipeline = auth.has_permission(current_user, "clients_orders_pipeline", "view", db)
        can_view_notary_payments = auth.has_permission(current_user, "clients_orders_notary_payments", "view", db)
        can_view_assigned = auth.has_permission(current_user, "clients_my", "view", db)
        
        if not (can_view_active or can_view_completed or can_view_cancelled or can_view_pipeline or can_view_notary_payments or can_view_assigned):
            raise HTTPException(status_code=403, detail="Access denied. You do not have permission to view orders.")
            
        all_orders = orders_query.all()
        emp_id = current_user.employee.id if current_user.employee else None
        
        filtered = []
        for ord_obj in all_orders:
            c_ids = parse_consultant_ids(ord_obj.consultant_ids)
            r_ids = parse_consultant_ids(getattr(ord_obj, "reviewer_ids", None))
            if ord_obj.reviewer_id and ord_obj.reviewer_id not in r_ids:
                r_ids.append(ord_obj.reviewer_id)
            is_assigned = emp_id is not None and (emp_id in c_ids or emp_id in r_ids or ord_obj.reviewer_id == emp_id)
            
            # If user has access to active orders and order is active
            if can_view_active and ord_obj.status not in ["COMPLETED", "CANCELLED", "PROSPECT", "PIPELINE"]:
                filtered.append(ord_obj)
            # If user has access to completed orders and order is completed
            elif can_view_completed and ord_obj.status == "COMPLETED":
                filtered.append(ord_obj)
            # If user has access to cancelled orders and order is cancelled
            elif can_view_cancelled and ord_obj.status == "CANCELLED":
                filtered.append(ord_obj)
            # If user has access to pipeline orders and order is pipeline
            elif can_view_pipeline and ord_obj.status in ["PROSPECT", "PIPELINE"]:
                filtered.append(ord_obj)
            # If user has access to notary payments and order has notary
            elif can_view_notary_payments and ord_obj.notary_id:
                filtered.append(ord_obj)
            # If user has access to assigned orders and is assigned to this order
            elif can_view_assigned and is_assigned:
                filtered.append(ord_obj)
                
        orders = filtered
    else:
        raise HTTPException(status_code=403, detail="Access denied. You do not have permission to view orders.")

    total_count = len(orders)
    if limit is not None:
        orders = orders[offset : offset + limit]
        response.headers["X-Total-Count"] = str(total_count)
        response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"

    consultants_cache = build_consultants_cache(db, orders)
    doc_counts_cache = build_doc_counts_cache(db, orders)
    return [format_order_response(ord_obj, consultants_cache, doc_counts_cache) for ord_obj in orders]

@router.get("/orders/next-number")
def get_next_order_number(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Returns the next guaranteed unique, sequential Order ID (e.g. MCSX-260017).
    """
    return {"order_number": generate_order_number(db)}

@router.get("/orders/check-number")
def check_order_number_availability(order_number: str = Query(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Validates whether an order number is unique and available.
    """
    cleaned = (order_number or "").strip().upper()
    if not cleaned:
        return {"available": False, "reason": "Order Reference ID cannot be blank."}
    
    # Auto-correct typo prefix
    normalized = cleaned
    if normalized.startswith("MSCX-"):
        normalized = "MCSX-" + normalized[5:]
    elif normalized.startswith("MCS-"):
        normalized = "MCSX-" + normalized[4:]
        
    alt_prefix = normalized.replace("MCSX-", "MSCX-") if normalized.startswith("MCSX-") else normalized.replace("MSCX-", "MCSX-")

    existing = db.query(models.ClientOrder).filter(
        or_(
            func.upper(models.ClientOrder.order_number) == cleaned,
            func.upper(models.ClientOrder.order_number) == normalized,
            func.upper(models.ClientOrder.order_number) == alt_prefix
        )
    ).first()

    if existing:
        return {
            "available": False,
            "order_number": cleaned,
            "normalized": normalized,
            "reason": f"Order ID '{existing.order_number}' is already registered in the system."
        }

    return {
        "available": True,
        "order_number": cleaned,
        "normalized": normalized,
        "message": f"Order ID '{normalized}' is available."
    }

@router.post("/orders", response_model=List[schemas.ClientOrderResponse], status_code=status.HTTP_201_CREATED)
def create_standalone_client_order(order_req: schemas.ClientOrderCreateRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_orders", "create", db) or auth.has_permission(current_user, "clients_orders_pipeline", "create", db) or auth.has_permission(current_user, "clients_orders_active", "create", db) or is_admin_or_hr(current_user) or is_employee_role(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to create client orders")
        
    target_client_id = order_req.client_id
    target_company_id = order_req.company_id
    target_billing_company_id = order_req.billing_company_id or target_company_id
    if not target_client_id and target_company_id:
        comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == target_company_id).first()
        if comp:
            target_client_id = comp.client_id
            
    if not target_client_id:
        first_c = db.query(models.Partner).first()
        if not first_c:
            raise HTTPException(status_code=400, detail="No valid client found to attach this order to")
        target_client_id = first_c.id
        
    if not order_req.order_number or not order_req.order_number.strip():
        order_num = generate_order_number(db)
    else:
        order_num = order_req.order_number.strip().upper()
        # Normalize common typo prefixes
        if order_num.startswith("MSCX-"):
            order_num = "MCSX-" + order_num[5:]
        elif order_num.startswith("MCS-"):
            order_num = "MCSX-" + order_num[4:]
        
    # Check if order number already exists in active/completed/cancelled/pipeline orders (including typo permutations)
    alt_num = order_num.replace("MCSX-", "MSCX-") if order_num.startswith("MCSX-") else order_num.replace("MSCX-", "MCSX-")
    existing_item = db.query(models.ClientOrder).filter(
        or_(
            func.upper(models.ClientOrder.order_number) == order_num.upper(),
            func.upper(models.ClientOrder.order_number) == alt_num.upper()
        )
    ).first()
    if existing_item and not order_req.allow_append:
        raise HTTPException(status_code=400, detail=f"Order ID '{order_num}' already exists in the system (Order: {existing_item.order_number}). Please enter a unique Order ID.")

    # Determine effective reviewer IDs (from reviewer_ids list or fallback to reviewer_id)
    req_reviewer_ids = list(order_req.reviewer_ids or [])
    if order_req.reviewer_id and order_req.reviewer_id not in req_reviewer_ids:
        req_reviewer_ids.append(order_req.reviewer_id)
    req_consultant_ids = list(order_req.consultant_ids or [])

    # Mutual exclusion check: same person cannot be consultant and reviewer
    if req_reviewer_ids and req_consultant_ids:
        overlap = set(req_reviewer_ids).intersection(set(req_consultant_ids))
        if overlap:
            raise HTTPException(
                status_code=400,
                detail="The same person cannot be allocated as both an executing consultant and an order reviewer."
            )

    # Purge any lingering progress records for this order number to ensure clean state ONLY for brand new orders
    if not existing_item:
        db.query(models.ClientOrderProgress).filter(models.ClientOrderProgress.order_number == order_num).delete(synchronize_session=False)
        db.commit()

    order_status = order_req.status or (existing_item.status if existing_item else "DRAFT")
    payment_status = (existing_item.payment_status if existing_item else "UNPAID")

    created_rows = []
    
    # Batch lookup notary fees if not explicitly provided
    needed_notary_pairs = [
        (item.notary_id, item.service_id)
        for item in order_req.items
        if item.notary_id and getattr(item, "notary_fee", None) is None
    ]
    notary_fee_cache = {}
    if needed_notary_pairs:
        notary_ids = list({p[0] for p in needed_notary_pairs})
        service_ids = list({p[1] for p in needed_notary_pairs})
        fee_records = db.query(models.NotaryServiceFee).filter(
            models.NotaryServiceFee.notary_id.in_(notary_ids),
            models.NotaryServiceFee.service_id.in_(service_ids)
        ).all()
        for fr in fee_records:
            notary_fee_cache[(fr.notary_id, fr.service_id)] = fr.fee or 0.0

    for item in order_req.items:
        # Determine notary fee if notary is selected
        fee = 0.0
        if item.notary_id:
            if getattr(item, "notary_fee", None) is not None:
                fee = item.notary_fee
            else:
                fee = notary_fee_cache.get((item.notary_id, item.service_id), 0.0)

        service_inst = getattr(item, 'service_instructions', None)
        order_internal_notes = getattr(order_req, 'internal_notes', None) or getattr(order_req, 'notes', None)

        db_order = models.ClientOrder(
            order_number=order_num,
            client_id=target_client_id,
            company_id=target_company_id,
            billing_company_id=target_billing_company_id,
            service_id=item.service_id,
            job_id=item.job_id,
            job_title=item.job_title,
            branch_name=item.branch_name,
            description=item.description,
            pricing_tier=item.pricing_tier,
            unit_price=item.unit_price,
            total_amount=item.unit_price,
            custom_price_text=item.custom_price_text,
            status=order_status,
            payment_status=payment_status,
            consultant_ids=req_consultant_ids,
            reviewer_id=req_reviewer_ids[0] if req_reviewer_ids else None,
            reviewer_ids=req_reviewer_ids,
            service_instructions=service_inst.strip() if (service_inst and service_inst.strip()) else None,
            notes=order_internal_notes.strip() if (order_internal_notes and order_internal_notes.strip()) else None,
            notary_id=item.notary_id,
            notary_fee=fee
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

        if db_order.billing_company:
            res.billing_company_name = db_order.billing_company.company_name
        elif db_order.company:
            res.billing_company_name = db_order.company.company_name
        elif db_order.client and db_order.client.companies:
            res.billing_company_name = db_order.client.companies[0].company_name
            
        res.consultants = get_consultants_data(db, db_order.consultant_ids)
        res.consultant_ids = db_order.consultant_ids or []
        res.reviewer_ids = db_order.reviewer_ids or []
        res.reviewers = get_consultants_data(db, db_order.reviewer_ids or [])
        res.reviewer_id = db_order.reviewer_id
        if db_order.reviewer_id:
            rev_data = get_consultants_data(db, [db_order.reviewer_id])
            res.reviewer = rev_data[0] if rev_data else None
        elif res.reviewers:
            res.reviewer = res.reviewers[0]
            res.reviewer_id = res.reviewers[0]["id"]
        created_rows.append(res)
        
    # Dispatch bell notifications to assigned consultants and reviewers
    try:
        first_row = created_rows[0] if created_rows else None
        first_comp_name = getattr(first_row, "company_name", None) if first_row else None
        svc_names = [item.job_title for item in order_req.items if getattr(item, "job_title", None)]
        first_id = getattr(first_row, "id", None) if first_row else None
        if req_consultant_ids or req_reviewer_ids:
            send_order_assignment_notifications(
                db=db,
                order_number=order_num,
                consultant_employee_ids=req_consultant_ids,
                reviewer_employee_ids=req_reviewer_ids,
                company_name=first_comp_name,
                service_names=svc_names,
                order_id=first_id,
                is_status_transition=False
            )
    except Exception as notif_create_err:
        print("Warning: Failed to dispatch assignment notifications on order create:", notif_create_err)

    return created_rows

@router.post("/orders/group/{order_number}/move-to-active")
@router.post("/orders/{order_number}/move-to-active")
def move_pipeline_order_to_active(order_number: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_orders_pipeline", "edit", db) or auth.has_permission(current_user, "clients_orders_active", "create", db) or auth.has_permission(current_user, "clients_orders", "edit", db) or is_admin_or_hr(current_user) or is_employee_role(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to move pipeline orders to active")
        
    orders = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    if not orders:
        raise HTTPException(status_code=404, detail="Order not found")
        
    for ord_obj in orders:
        ord_obj.status = "DRAFT"
        
    db.commit()
    
    # Log progress message
    msg = "Pipeline order has been moved to Active Orders (DRAFT)."
    five_sec_ago = datetime.utcnow() - timedelta(seconds=5)
    recent_prog = db.query(models.ClientOrderProgress).filter(
        models.ClientOrderProgress.order_number == order_number,
        models.ClientOrderProgress.message == msg,
        models.ClientOrderProgress.created_at >= five_sec_ago
    ).first()
    if not recent_prog:
        progress = models.ClientOrderProgress(
            order_number=order_number,
            message=msg,
            user_id=None,
            channel="CLIENT"
        )
        db.add(progress)
    db.commit()
    
    log_activity(db, "ORDER_MOVED_TO_ACTIVE", f"Pipeline order {order_number} moved to Active Orders (DRAFT)", user_id=current_user.id)
    return {"message": "Order moved to active successfully", "order_number": order_number}

@router.post("/orders/group/{order_number}/cancel")
@router.post("/orders/{order_number}/cancel")
def cancel_order_group(
    order_number: str,
    payload: dict = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_orders_cancelled", "edit", db) or auth.has_permission(current_user, "clients_orders_active", "edit", db) or auth.has_permission(current_user, "clients_orders", "edit", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to cancel orders")
        
    orders = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    if not orders:
        raise HTTPException(status_code=404, detail="Order not found")
        
    reason = (payload.get("reason") if payload else "") or "Order was marked as CANCELLED."
    for ord_obj in orders:
        ord_obj.status = "CANCELLED"
        
    db.commit()
    
    # Log progress message
    msg = f"Order #{order_number} has been marked as CANCELLED. Reason/Notes: {reason}"
    five_sec_ago = datetime.utcnow() - timedelta(seconds=5)
    recent_cancel = db.query(models.ClientOrderProgress).filter(
        models.ClientOrderProgress.order_number == order_number,
        models.ClientOrderProgress.message == msg,
        models.ClientOrderProgress.created_at >= five_sec_ago
    ).first()
    if not recent_cancel:
        progress = models.ClientOrderProgress(
            order_number=order_number,
            message=msg,
            user_id=None,
            channel="CLIENT"
        )
        db.add(progress)
    db.commit()

    # Auto-archive conversation to Dropbox on cancellation
    try:
        save_order_chat_to_dropbox(order_number, db)
    except Exception as e:
        print(f"Warning: Failed to save cancelled order chat to Dropbox for order {order_number}: {e}")
    
    log_activity(db, "ORDER_CANCELLED", f"Order {order_number} marked as CANCELLED ({reason})", user_id=current_user.id)
    return {"message": "Order cancelled successfully", "order_number": order_number}

@router.post("/orders/group/{order_number}/reopen")
@router.post("/orders/{order_number}/reopen")
def reopen_order_group(
    order_number: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_orders_active", "edit", db) or auth.has_permission(current_user, "clients_orders", "edit", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to reopen cancelled orders")
        
    orders = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    if not orders:
        raise HTTPException(status_code=404, detail="Order not found")
        
    for ord_obj in orders:
        ord_obj.status = "DRAFT"
        
    db.commit()
    
    # Log progress message
    msg = f"Cancelled order #{order_number} has been reopened and moved back to Active Orders (DRAFT)."
    five_sec_ago = datetime.utcnow() - timedelta(seconds=5)
    recent_reopen = db.query(models.ClientOrderProgress).filter(
        models.ClientOrderProgress.order_number == order_number,
        models.ClientOrderProgress.message == msg,
        models.ClientOrderProgress.created_at >= five_sec_ago
    ).first()
    if not recent_reopen:
        progress = models.ClientOrderProgress(
            order_number=order_number,
            message=msg,
            user_id=None,
            channel="CLIENT"
        )
        db.add(progress)
    db.commit()

    # Update Dropbox transcript with the reopened status
    try:
        save_order_chat_to_dropbox(order_number, db)
    except Exception as e:
        print(f"Warning: Failed to update Dropbox chat archive for reopened order {order_number}: {e}")
    
    log_activity(db, "ORDER_REOPENED", f"Cancelled order {order_number} reopened to Active Orders (DRAFT)", user_id=current_user.id)
    return {"message": "Order reopened successfully", "order_number": order_number}

@router.delete("/orders/group/{order_number}")
def delete_order_group(order_number: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_orders", "delete", db) or auth.has_permission(current_user, "clients_orders_pipeline", "delete", db) or auth.has_permission(current_user, "clients_orders_active", "delete", db) or auth.has_permission(current_user, "clients_orders_completed", "delete", db) or auth.has_permission(current_user, "clients_orders_cancelled", "delete", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to delete orders")

    clean_no = (order_number or "").strip().upper()

    # 1. Auto-archive complete conversation to Dropbox before deletion
    try:
        save_order_chat_to_dropbox(clean_no, db)
    except Exception as e:
        print(f"Warning: Failed to auto-archive chat history to Dropbox for order {clean_no}: {e}")
        
    orders = db.query(models.ClientOrder).filter(func.upper(models.ClientOrder.order_number) == clean_no).all()
    if not orders:
        # Also ensure any dangling chat history, reactions and read receipts for this order_number are deleted
        progress_ids = [p.id for p in db.query(models.ClientOrderProgress.id).filter(func.upper(models.ClientOrderProgress.order_number) == clean_no).all()]
        if progress_ids:
            db.query(models.ClientOrderProgressReaction).filter(models.ClientOrderProgressReaction.progress_id.in_(progress_ids)).delete(synchronize_session=False)
        db.query(models.ClientOrderProgress).filter(func.upper(models.ClientOrderProgress.order_number) == clean_no).delete(synchronize_session=False)
        db.query(models.ClientOrderUserRead).filter(func.upper(models.ClientOrderUserRead.order_number) == clean_no).delete(synchronize_session=False)
        db.commit()
        return {"message": "Order group and chat history deleted"}
        
    for ord_obj in orders:
        db.delete(ord_obj)
        
    # Delete associated chat history, reactions and read receipts
    progress_ids = [p.id for p in db.query(models.ClientOrderProgress.id).filter(func.upper(models.ClientOrderProgress.order_number) == clean_no).all()]
    if progress_ids:
        db.query(models.ClientOrderProgressReaction).filter(models.ClientOrderProgressReaction.progress_id.in_(progress_ids)).delete(synchronize_session=False)
    db.query(models.ClientOrderProgress).filter(func.upper(models.ClientOrderProgress.order_number) == clean_no).delete(synchronize_session=False)
    db.query(models.ClientOrderUserRead).filter(func.upper(models.ClientOrderUserRead.order_number) == clean_no).delete(synchronize_session=False)
    db.commit()
    
    log_activity(db, "ORDER_DELETED", f"Order {order_number} and associated chat history archived and deleted", user_id=current_user.id)
    return {"message": "Order group and chat history deleted successfully"}

@router.delete("/orders/{id:int}")
def delete_client_order(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_orders", "delete", db) or auth.has_permission(current_user, "clients_orders_pipeline", "delete", db) or auth.has_permission(current_user, "clients_orders_active", "delete", db) or auth.has_permission(current_user, "clients_orders_completed", "delete", db) or auth.has_permission(current_user, "clients_orders_cancelled", "delete", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to delete orders")
        
    db_order = db.query(models.ClientOrder).filter(models.ClientOrder.id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order_number = db_order.order_number
    clean_no = (order_number or "").strip().upper()
    db.delete(db_order)
    db.commit()
    
    # Check if there are any remaining items in this order group
    remaining = db.query(models.ClientOrder).filter(func.upper(models.ClientOrder.order_number) == clean_no).count()
    if remaining == 0:
        # Auto-archive conversation to Dropbox before purging progress records
        try:
            save_order_chat_to_dropbox(clean_no, db)
        except Exception as e:
            print(f"Warning: Failed to auto-archive chat history to Dropbox for order {clean_no}: {e}")

        # Delete progress logs, reactions and read receipts
        progress_ids = [p.id for p in db.query(models.ClientOrderProgress.id).filter(func.upper(models.ClientOrderProgress.order_number) == clean_no).all()]
        if progress_ids:
            db.query(models.ClientOrderProgressReaction).filter(models.ClientOrderProgressReaction.progress_id.in_(progress_ids)).delete(synchronize_session=False)
        db.query(models.ClientOrderProgress).filter(func.upper(models.ClientOrderProgress.order_number) == clean_no).delete(synchronize_session=False)
        db.query(models.ClientOrderUserRead).filter(func.upper(models.ClientOrderUserRead.order_number) == clean_no).delete(synchronize_session=False)
        db.commit()
        
    return {"message": "Order deleted successfully"}

@router.get("/{id:int}", response_model=schemas.ClientResponse)
def get_client(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    client = db.query(models.Partner).filter(models.Partner.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    role_name = current_user.role.name.upper() if current_user.role else ""
    if auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_all", "view", db) or is_admin_or_hr(current_user) or is_client_themselves(current_user, id):
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
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_all", "create", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to create clients")

    client_email = validate_and_clean_email(client_data.email, "Personal Email", required=True)
    client_phone = validate_and_clean_phone(client_data.phone, "Personal Phone", required=False)
        
    new_user_id = None
    if client_data.create_portal_account:
        existing_user = db.query(models.User).filter(models.User.email == client_email).first()
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
            email=client_email,
            hashed_password=hashed_pw,
            is_active=True,
            role_id=client_role.id
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        new_user_id = new_user.id
    
    db_client = models.Partner(
        contact_person=client_data.contact_person,
        email=client_email,
        phone=client_phone,
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
        db.query(models.ClientOrderProgress).filter(models.ClientOrderProgress.order_number == order_num).delete(synchronize_session=False)
        db.commit()
        target_company_id = db_company.id if 'db_company' in locals() and db_company else None
        
        for item in client_data.order_items:
            service_inst = getattr(item, 'service_instructions', None)
            db_order = models.ClientOrder(
                order_number=order_num,
                client_id=db_client.id,
                company_id=target_company_id,
                service_id=item.service_id,
                job_id=item.job_id,
                job_title=item.job_title,
                branch_name=getattr(item, 'branch_name', None),
                description=item.description,
                pricing_tier=item.pricing_tier,
                unit_price=item.unit_price,
                total_amount=item.unit_price,
                custom_price_text=item.custom_price_text,
                status="CONFIRMED",
                service_instructions=service_inst.strip() if (service_inst and service_inst.strip()) else None,
                notes=client_data.company_notes
            )
            db.add(db_order)
        db.commit()

    db.refresh(db_client) # Refresh to load companies
    return db_client

def generate_order_number(db: Session) -> str:
    """
    Generates a monotonically increasing, non-recyclable order number:
    Format: MCSX-[Year2Digits][4DigitSequence] (e.g. MCSX-260001, MCSX-260002)
    Guarantees order numbers are strictly unique and never reused, even after order deletions.
    """
    import re
    curr_year_2digit = str(datetime.now().year)[-2:]
    prefix = f"MCSX-{curr_year_2digit}"
    pattern = re.compile(rf"(?:MCSX|MSCX|MCS)-{curr_year_2digit}(\d+)", re.IGNORECASE)

    max_seq = 0

    # 1. Check existing ClientOrders
    order_nums = db.query(models.ClientOrder.order_number).all()
    for (num,) in order_nums:
        if num:
            match = pattern.search(num)
            if match:
                try:
                    max_seq = max(max_seq, int(match.group(1)))
                except ValueError:
                    pass

    # 2. Check ClientDocuments
    doc_nums = db.query(models.ClientDocument.order_number).all()
    for (num,) in doc_nums:
        if num:
            match = pattern.search(num)
            if match:
                try:
                    max_seq = max(max_seq, int(match.group(1)))
                except ValueError:
                    pass

    # 3. Check ClientActivityLog for any past orders that were deleted
    activity_logs = db.query(models.ClientActivityLog.description).all()
    for (desc,) in activity_logs:
        if desc:
            for match in pattern.finditer(desc):
                try:
                    max_seq = max(max_seq, int(match.group(1)))
                except ValueError:
                    pass

    next_seq = max_seq + 1
    order_num = f"{prefix}{next_seq:04d}"

    # Fallback collision check
    while db.query(models.ClientOrder).filter(
        or_(
            func.upper(models.ClientOrder.order_number) == order_num.upper(),
            func.upper(models.ClientOrder.order_number) == f"MSCX-{curr_year_2digit}{next_seq:04d}"
        )
    ).first():
        next_seq += 1
        order_num = f"{prefix}{next_seq:04d}"

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
    
    # Query the entire order group to update them together and prevent duplicate progress entries
    orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == db_order.order_number).all()
    
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
        
    if db_order.status == "COMPLETED" and not is_admin_hr:
        raise HTTPException(status_code=400, detail="This order is completed and its status is locked.")

    # Mutual exclusion check: same person cannot be consultant and reviewer
    fields_set = getattr(order_update, '__fields_set__', None) or getattr(order_update, 'model_fields_set', set())
    old_consultant_ids = set(parse_consultant_ids(db_order.consultant_ids))
    old_reviewer_ids = set(parse_consultant_ids(getattr(db_order, "reviewer_ids", None)))
    if not old_reviewer_ids and db_order.reviewer_id:
        old_reviewer_ids.add(db_order.reviewer_id)
    old_status = db_order.status

    if "reviewer_ids" in fields_set and order_update.reviewer_ids is not None:
        effective_reviewer_ids = list(order_update.reviewer_ids)
    elif "reviewer_id" in fields_set or order_update.reviewer_id is not None:
        effective_reviewer_ids = [order_update.reviewer_id] if order_update.reviewer_id else []
    else:
        effective_reviewer_ids = parse_consultant_ids(getattr(db_order, "reviewer_ids", None))
        if not effective_reviewer_ids and db_order.reviewer_id:
            effective_reviewer_ids = [db_order.reviewer_id]

    effective_consultant_ids = order_update.consultant_ids if order_update.consultant_ids is not None else parse_consultant_ids(db_order.consultant_ids)
    if effective_reviewer_ids and effective_consultant_ids:
        overlap = set(effective_reviewer_ids).intersection(set(effective_consultant_ids))
        if overlap:
            raise HTTPException(
                status_code=400,
                detail="The same person cannot be allocated as both an executing consultant and an order reviewer."
            )

    if order_update.status:
        update_order_group_status(
            db, 
            orders_in_group, 
            order_update.status, 
            current_user.id,
            hold_reason=order_update.hold_reason,
            hold_channel=order_update.hold_channel
        )
        
    can_manage_finance = is_admin_hr or auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_orders_active", "edit", db) or auth.has_permission(current_user, "clients_orders", "edit", db)
    if can_manage_finance:
        if order_update.payment_status:
            old_pay_status = db_order.payment_status
            for ord_item in orders_in_group:
                ord_item.payment_status = order_update.payment_status
            if order_update.payment_status in ["PARTIALLY_PAID", "PAID"]:
                if db_order.status in ["DRAFT", "PROFORMA_GENERATED", "WAITING_ON_CLIENT"]:
                    target_status = "CONFIRMED"
                    if db_order.consultant_ids and len(db_order.consultant_ids) > 0:
                        target_status = "ORDER_ASSIGNED"
                    update_order_group_status(db, orders_in_group, target_status, current_user.id)
                
                # Accurate Online Sales Receipt sync trigger
                if old_pay_status != order_update.payment_status or any(o.accurate_sync_status != "PROFORMA_PAID" for o in orders_in_group):
                    try:
                        from utils.accurate_client import AccurateClient
                        acc_client = AccurateClient(db)
                        if acc_client.config and acc_client.config.auto_sync_on_payment:
                            group_total = sum((float(o.total_amount) if o.total_amount is not None else 0.0) for o in orders_in_group)
                            proforma_pct = db_order.proforma_stage_percent or 50
                            pay_amt = group_total if order_update.payment_status == "PAID" else round((group_total * proforma_pct) / 100.0)
                            acc_client.create_sales_receipt(db_order, payment_amount=pay_amt, payment_method="Manual / Bank Transfer")
                    except Exception as acc_e:
                        print(f"Warning: Accurate payment sync trigger error: {acc_e}")
        fields_set = getattr(order_update, '__fields_set__', None) or getattr(order_update, 'model_fields_set', set())
        if "invoice_number" in fields_set:
            db_order.invoice_number = order_update.invoice_number
        if order_update.consultant_ids is not None:
            db_order.consultant_ids = order_update.consultant_ids
            for o_item in orders_in_group:
                o_item.consultant_ids = order_update.consultant_ids
        if "reviewer_ids" in fields_set or order_update.reviewer_ids is not None:
            r_ids = order_update.reviewer_ids or []
            primary_r_id = r_ids[0] if r_ids else None
            db_order.reviewer_ids = r_ids
            db_order.reviewer_id = primary_r_id
            for o_item in orders_in_group:
                o_item.reviewer_ids = r_ids
                o_item.reviewer_id = primary_r_id
        elif "reviewer_id" in fields_set or order_update.reviewer_id is not None:
            r_ids = [order_update.reviewer_id] if order_update.reviewer_id else []
            db_order.reviewer_id = order_update.reviewer_id
            db_order.reviewer_ids = r_ids
            for o_item in orders_in_group:
                o_item.reviewer_id = order_update.reviewer_id
                o_item.reviewer_ids = r_ids
        if order_update.service_id is not None:
            db_order.service_id = order_update.service_id
        if order_update.job_id is not None:
            db_order.job_id = order_update.job_id
        if order_update.job_title is not None:
            db_order.job_title = order_update.job_title
        if "branch_name" in fields_set:
            db_order.branch_name = order_update.branch_name
        if "description" in fields_set:
            db_order.description = order_update.description
        if order_update.pricing_tier is not None:
            db_order.pricing_tier = order_update.pricing_tier
        if order_update.unit_price is not None:
            db_order.unit_price = order_update.unit_price
            db_order.total_amount = order_update.unit_price
        if "custom_price_text" in fields_set:
            db_order.custom_price_text = order_update.custom_price_text
        if order_update.notary_id is not None:
            db_order.notary_id = order_update.notary_id
            if order_update.notary_id:
                notary_fee_rec = db.query(models.NotaryServiceFee).filter(
                    models.NotaryServiceFee.notary_id == order_update.notary_id,
                    models.NotaryServiceFee.service_id == db_order.service_id
                ).first()
                if notary_fee_rec:
                    db_order.notary_fee = notary_fee_rec.fee or 0.0
                else:
                    db_order.notary_fee = 0.0
            else:
                db_order.notary_fee = 0.0
        if order_update.is_proforma_finalized is not None:
            db_order.is_proforma_finalized = order_update.is_proforma_finalized
            for o_item in orders_in_group:
                o_item.is_proforma_finalized = order_update.is_proforma_finalized
                if not order_update.is_proforma_finalized:
                    o_item.is_final_invoice_finalized = False
        if order_update.proforma_stage_percent is not None:
            db_order.proforma_stage_percent = order_update.proforma_stage_percent
            for o_item in orders_in_group:
                o_item.proforma_stage_percent = order_update.proforma_stage_percent
        if order_update.proforma_paid_amount is not None:
            with status_lock:
                old_val = db_order.proforma_paid_amount
                new_val = order_update.proforma_paid_amount
                db_order.proforma_paid_amount = new_val
                for o_item in orders_in_group:
                    o_item.proforma_paid_amount = new_val

                # Post progress update to order chat if the value changed
                if old_val != new_val:
                    chat_msg = "Amount Received / Proforma Paid manually updated."
                    # Check recent messages to avoid duplicate logs from concurrent calls
                    recent_progress = db.query(models.ClientOrderProgress).filter(
                        models.ClientOrderProgress.order_number == db_order.order_number,
                        models.ClientOrderProgress.message == chat_msg
                    ).order_by(models.ClientOrderProgress.id.desc()).first()
                    
                    is_duplicate = False
                    if recent_progress and recent_progress.created_at:
                        prog_time = recent_progress.created_at
                        now_compare = datetime.utcnow() if prog_time.tzinfo is None else datetime.now(timezone.utc)
                        if (now_compare - prog_time).total_seconds() < 15:
                            is_duplicate = True

                    if not is_duplicate:
                        db_progress = models.ClientOrderProgress(
                            order_number=db_order.order_number,
                            user_id=current_user.id,
                            message=chat_msg,
                            channel="CLIENT"
                        )
                        db.add(db_progress)

            # If an active proforma payment link existed on Xendit, expire it to prevent accidental double-payment by client
            if db_order.xendit_invoice_id and not db_order.is_final_invoice_finalized:
                try:
                    from utils.xendit_client import XenditClient
                    xendit = XenditClient()
                    xendit.expire_invoice(db_order.xendit_invoice_id)
                except Exception as e:
                    print("Note: Could not expire previous Xendit invoice:", e)
                # Clear proforma link so a clean dedicated link will be created for the final invoice
                for o_item in orders_in_group:
                    o_item.payment_link = None
                    o_item.xendit_invoice_id = None
        if order_update.company_id is not None:
            db_order.company_id = order_update.company_id
            comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == order_update.company_id).first()
            if comp and comp.client_id:
                db_order.client_id = comp.client_id
            for o_item in orders_in_group:
                o_item.company_id = order_update.company_id
                if comp and comp.client_id:
                    o_item.client_id = comp.client_id
        elif order_update.client_id is not None:
            db_order.client_id = order_update.client_id
            for o_item in orders_in_group:
                o_item.client_id = order_update.client_id
        if order_update.billing_company_id is not None:
            db_order.billing_company_id = order_update.billing_company_id
            for o_item in orders_in_group:
                o_item.billing_company_id = order_update.billing_company_id
        if order_update.is_final_invoice_finalized is not None:
            # Only allow setting to True if proforma is already finalized
            if order_update.is_final_invoice_finalized and not db_order.is_proforma_finalized:
                db_order.is_final_invoice_finalized = False
            else:
                db_order.is_final_invoice_finalized = order_update.is_final_invoice_finalized

    fields_set = getattr(order_update, '__fields_set__', None) or getattr(order_update, 'model_fields_set', set())
    if "service_instructions" in fields_set:
        db_order.service_instructions = order_update.service_instructions.strip() if (order_update.service_instructions and order_update.service_instructions.strip()) else None
    elif hasattr(order_update, 'service_instructions') and order_update.service_instructions is not None:
        db_order.service_instructions = order_update.service_instructions.strip() if order_update.service_instructions.strip() else None

    if "notes" in fields_set or "internal_notes" in fields_set:
        raw_n = order_update.notes if "notes" in fields_set else order_update.internal_notes
        notes_val = raw_n.strip() if (raw_n and raw_n.strip()) else None
        db_order.notes = notes_val
        for o_item in orders_in_group:
            o_item.notes = notes_val
    elif order_update.notes is not None:
        notes_val = order_update.notes.strip() if order_update.notes.strip() else None
        db_order.notes = notes_val
        for o_item in orders_in_group:
            o_item.notes = notes_val
        
    db.commit()
    db.refresh(db_order)

    # Check for newly added consultants or reviewers, or assignment status transition
    try:
        new_cids = [cid for cid in (effective_consultant_ids or []) if cid not in old_consultant_ids]
        new_rids = [rid for rid in (effective_reviewer_ids or []) if rid not in old_reviewer_ids]
        comp_name = db_order.company.company_name if db_order.company else (db_order.client.contact_person if db_order.client else None)
        svc_names = [o.job_title for o in orders_in_group if o.job_title]

        if new_cids or new_rids:
            send_order_assignment_notifications(
                db=db,
                order_number=db_order.order_number,
                consultant_employee_ids=new_cids,
                reviewer_employee_ids=new_rids,
                company_name=comp_name,
                service_names=svc_names,
                order_id=db_order.id,
                is_status_transition=False
            )
        elif order_update.status == "ORDER_ASSIGNED" and old_status != "ORDER_ASSIGNED":
            send_order_assignment_notifications(
                db=db,
                order_number=db_order.order_number,
                consultant_employee_ids=effective_consultant_ids or [],
                reviewer_employee_ids=effective_reviewer_ids or [],
                company_name=comp_name,
                service_names=svc_names,
                order_id=db_order.id,
                is_status_transition=True
            )
    except Exception as notif_e:
        print(f"Warning: Failed to dispatch assignment notifications on update: {notif_e}")

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
    res.reviewer_ids = getattr(db_order, "reviewer_ids", None) or ([db_order.reviewer_id] if db_order.reviewer_id else [])
    res.reviewers = get_consultants_data(db, res.reviewer_ids)
    res.reviewer_id = db_order.reviewer_id or (res.reviewer_ids[0] if res.reviewer_ids else None)
    if res.reviewer_id:
        rev_data = get_consultants_data(db, [res.reviewer_id])
        res.reviewer = rev_data[0] if rev_data else None
    elif res.reviewers:
        res.reviewer = res.reviewers[0]
    return res

@router.get("/companies/{company_id}/stakeholders", response_model=List[schemas.CompanyStakeholderResponse])
def get_company_stakeholders(company_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.CompanyStakeholder).filter(models.CompanyStakeholder.company_id == company_id).all()

@router.post("/companies/{company_id}/stakeholders", response_model=schemas.CompanyStakeholderResponse, status_code=status.HTTP_201_CREATED)
def create_company_stakeholder(company_id: int, stakeholder_data: schemas.CompanyStakeholderCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_company", "edit", db) or auth.has_permission(current_user, "clients_documents", "create", db) or is_admin_or_hr(current_user) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to manage company stakeholders")
        
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

    if stakeholder_data.role and stakeholder_data.role.strip().lower() == "director":
        comp.director_name = stakeholder_data.name
        comp.director_email = stakeholder_data.email
        comp.director_contact = stakeholder_data.phone

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
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_company", "delete", db) or auth.has_permission(current_user, "clients_company", "edit", db) or auth.has_permission(current_user, "clients_documents", "delete", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to delete stakeholders")
        
    stk = db.query(models.CompanyStakeholder).filter(models.CompanyStakeholder.id == id).first()
    if not stk:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
        
    comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == stk.company_id).first()
    if comp:
        if stk.is_key_contact:
            comp.key_contact_person = None
            comp.key_contact_email = None
            comp.key_contact_phone = None
        if stk.role and stk.role.strip().lower() == "director":
            # Check if any other director remains
            other_dir = db.query(models.CompanyStakeholder).filter(
                models.CompanyStakeholder.company_id == stk.company_id,
                models.CompanyStakeholder.id != id,
                models.CompanyStakeholder.role == "Director"
            ).first()
            if other_dir:
                comp.director_name = other_dir.name
                comp.director_email = other_dir.email
                comp.director_contact = other_dir.phone
            else:
                comp.director_name = None
                comp.director_email = None
                comp.director_contact = None

    db.delete(stk)
    db.commit()
    return {"message": "Stakeholder deleted successfully"}

@router.put("/companies/stakeholders/{id}", response_model=schemas.CompanyStakeholderResponse)
def update_company_stakeholder(id: int, stakeholder_data: schemas.CompanyStakeholderCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_company", "edit", db) or auth.has_permission(current_user, "clients_documents", "edit", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to update company stakeholders")
        
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

    if stakeholder_data.role and stakeholder_data.role.strip().lower() == "director":
        comp.director_name = stakeholder_data.name
        comp.director_email = stakeholder_data.email
        comp.director_contact = stakeholder_data.phone

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
        joinedload(models.ClientActivityLog.user).joinedload(models.User.partner),
        joinedload(models.ClientActivityLog.user).joinedload(models.User.client)
    ).filter(models.ClientActivityLog.company_id == company_id).order_by(models.ClientActivityLog.id.desc()).all()

@router.get("/{client_id:int}/activities", response_model=List[schemas.ClientActivityLogResponse])
def get_client_activities(client_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    from sqlalchemy.orm import joinedload
    return db.query(models.ClientActivityLog).options(
        joinedload(models.ClientActivityLog.user).joinedload(models.User.employee),
        joinedload(models.ClientActivityLog.user).joinedload(models.User.partner),
        joinedload(models.ClientActivityLog.user).joinedload(models.User.client)
    ).filter(models.ClientActivityLog.client_id == client_id).order_by(models.ClientActivityLog.id.desc()).all()

@router.put("/{id:int}", response_model=schemas.ClientResponse)
def update_client(id: int, client_update: schemas.ClientBase, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_client = db.query(models.Partner).filter(models.Partner.id == id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_all", "edit", db) or is_admin_or_hr(current_user) or is_client_themselves(current_user, id)):
        raise HTTPException(status_code=403, detail="Not authorized to update this client")
        
    update_data = client_update.model_dump(exclude_unset=True) if hasattr(client_update, "model_dump") else client_update.dict(exclude_unset=True)
    if "email" in update_data and update_data["email"]:
        update_data["email"] = validate_and_clean_email(update_data["email"], "Personal Email", required=True)
    if "phone" in update_data and update_data["phone"]:
        update_data["phone"] = validate_and_clean_phone(update_data["phone"], "Personal Phone", required=False)

    for key, value in update_data.items():
        setattr(db_client, key, value)
        
    if db_client.user and client_update.email and db_client.user.email != db_client.email:
        email_taken = db.query(models.User).filter(
            models.User.email == db_client.email,
            models.User.id != db_client.user_id
        ).first()
        if email_taken:
            raise HTTPException(status_code=400, detail="Email is already in use by another account")
        db_client.user.email = db_client.email

    db_client.updated_at = datetime.now()
    db.commit()
    db.refresh(db_client)
    return db_client

@router.put("/{id:int}/status", response_model=schemas.ClientResponse)
def update_client_status(id: int, status_str: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_all", "edit", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to change client status")
        
    db_client = db.query(models.Partner).filter(models.Partner.id == id).first()
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
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_all", "edit", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to reset client passwords")
        
    db_client = db.query(models.Partner).filter(models.Partner.id == id).first()
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
    return db.query(models.ClientCompany).options(
        joinedload(models.ClientCompany.partner),
        joinedload(models.ClientCompany.creator).joinedload(models.User.employee),
        joinedload(models.ClientCompany.validator).joinedload(models.User.employee),
        joinedload(models.ClientCompany.consultants).joinedload(models.ClientConsultant.employee),
        joinedload(models.ClientCompany.stakeholders)
    ).order_by(models.ClientCompany.company_name).all()

@router.post("/companies/standalone", response_model=schemas.ClientCompanyResponse)
def create_standalone_client_company(company_data: schemas.ClientCompanyCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_company", "create", db) or is_admin_or_hr(current_user) or is_employee_role(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to create standalone companies")
        
    if not company_data.key_contact_person or not str(company_data.key_contact_person).strip():
        raise HTTPException(status_code=400, detail="Key Contact Person Name is mandatory")
        
    clean_email = validate_and_clean_email(company_data.key_contact_email, "Key Contact Email")
    clean_phone = validate_and_clean_phone(company_data.key_contact_phone, "Key Contact Phone")

    target_client_id = company_data.client_id
    if target_client_id:
        db_client = db.query(models.Partner).filter(models.Partner.id == target_client_id).first()
        if not db_client:
            raise HTTPException(status_code=404, detail="Client not found")
    else:
        target_client_id = None

    comp_data_dict = company_data.model_dump() if hasattr(company_data, "model_dump") else company_data.dict()
    comp_data_dict["key_contact_person"] = company_data.key_contact_person.strip()
    comp_data_dict["key_contact_email"] = clean_email
    comp_data_dict["key_contact_phone"] = clean_phone
    comp_data_dict["company_code"] = generate_company_code(db, company_data.company_name)
    comp_data_dict["client_id"] = target_client_id
    comp_data_dict["created_by_user_id"] = current_user.id
    comp_data_dict["validation_status"] = "PENDING_VALIDATION"

    # Optional Director sanitization
    if company_data.director_name and company_data.director_name.strip():
        comp_data_dict["director_name"] = company_data.director_name.strip()
    else:
        comp_data_dict["director_name"] = None

    if company_data.director_email and company_data.director_email.strip():
        comp_data_dict["director_email"] = validate_and_clean_email(company_data.director_email, "Director Email")
    else:
        comp_data_dict["director_email"] = None

    if company_data.director_contact and company_data.director_contact.strip() and company_data.director_contact.strip() != "+62":
        comp_data_dict["director_contact"] = validate_and_clean_phone(company_data.director_contact, "Director Phone")
    else:
        comp_data_dict["director_contact"] = None

    db_company = models.ClientCompany(**comp_data_dict)
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    replicate_key_contact_to_stakeholder(db, db_company)
    
    # Log activity
    log_activity(
        db,
        "COMPANY_CREATED",
        f"Company '{db_company.company_name}' registered by {get_user_display_name(current_user)} (Pending Admin Validation).",
        client_id=db_company.client_id,
        company_id=db_company.id,
        user_id=current_user.id
    )
    
    return db_company

@router.post("/{id:int}/companies", response_model=schemas.ClientCompanyResponse)
def create_client_company(id: int, company_data: schemas.ClientCompanyCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_company", "create", db) or is_admin_or_hr(current_user) or is_employee_role(current_user) or is_client_themselves(current_user, id)):
        raise HTTPException(status_code=403, detail="Not authorized to create companies for this client")

    if not company_data.key_contact_person or not str(company_data.key_contact_person).strip():
        raise HTTPException(status_code=400, detail="Key Contact Person Name is mandatory")
        
    clean_email = validate_and_clean_email(company_data.key_contact_email, "Key Contact Email")
    clean_phone = validate_and_clean_phone(company_data.key_contact_phone, "Key Contact Phone")
        
    db_client = db.query(models.Partner).filter(models.Partner.id == id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    comp_data_dict = company_data.model_dump() if hasattr(company_data, "model_dump") else company_data.dict()
    comp_data_dict["key_contact_person"] = company_data.key_contact_person.strip()
    comp_data_dict["key_contact_email"] = clean_email
    comp_data_dict["key_contact_phone"] = clean_phone
    comp_data_dict["company_code"] = generate_company_code(db, company_data.company_name)
    comp_data_dict["client_id"] = id
    comp_data_dict["created_by_user_id"] = current_user.id
    comp_data_dict["validation_status"] = "PENDING_VALIDATION"
        
    # Optional Director sanitization
    if company_data.director_name and company_data.director_name.strip():
        comp_data_dict["director_name"] = company_data.director_name.strip()
    else:
        comp_data_dict["director_name"] = None

    if company_data.director_email and company_data.director_email.strip():
        comp_data_dict["director_email"] = validate_and_clean_email(company_data.director_email, "Director Email")
    else:
        comp_data_dict["director_email"] = None

    if company_data.director_contact and company_data.director_contact.strip() and company_data.director_contact.strip() != "+62":
        comp_data_dict["director_contact"] = validate_and_clean_phone(company_data.director_contact, "Director Phone")
    else:
        comp_data_dict["director_contact"] = None

    db_company = models.ClientCompany(**comp_data_dict)
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    replicate_key_contact_to_stakeholder(db, db_company)
    
    # Log activity
    log_activity(
        db,
        "COMPANY_CREATED",
        f"Company '{db_company.company_name}' created under client {db_client.contact_person} by {get_user_display_name(current_user)}.",
        client_id=id,
        company_id=db_company.id,
        user_id=current_user.id
    )
    
    return db_company

@router.get("/companies/{company_id}", response_model=schemas.ClientCompanyResponse)
def get_client_company_by_id(company_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_company = db.query(models.ClientCompany).options(
        joinedload(models.ClientCompany.partner),
        joinedload(models.ClientCompany.creator).joinedload(models.User.employee),
        joinedload(models.ClientCompany.validator).joinedload(models.User.employee),
        joinedload(models.ClientCompany.consultants).joinedload(models.ClientConsultant.employee),
        joinedload(models.ClientCompany.stakeholders)
    ).filter(models.ClientCompany.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company

@router.put("/companies/{company_id}/validate", response_model=schemas.ClientCompanyResponse)
def validate_client_company(
    company_id: int,
    val_data: schemas.CompanyValidationRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_company", "approve", db) or auth.has_permission(current_user, "clients_company", "edit", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to validate company profiles")

    db_company = db.query(models.ClientCompany).options(
        joinedload(models.ClientCompany.partner),
        joinedload(models.ClientCompany.creator).joinedload(models.User.employee),
        joinedload(models.ClientCompany.validator).joinedload(models.User.employee)
    ).filter(models.ClientCompany.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")

    status_upper = (val_data.status or "").strip().upper()
    if status_upper not in ["VALIDATED", "NEEDS_REVISION", "PENDING_VALIDATION"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be VALIDATED, NEEDS_REVISION, or PENDING_VALIDATION")

    db_company.validation_status = status_upper
    db_company.validation_notes = val_data.notes or None
    db_company.validated_by_user_id = current_user.id
    db_company.validated_at = datetime.now()
    db_company.updated_at = datetime.now()

    db.commit()
    db.refresh(db_company)

    # Activity log
    act_type = "COMPANY_VALIDATED" if status_upper == "VALIDATED" else ("COMPANY_REVISION_REQUESTED" if status_upper == "NEEDS_REVISION" else "COMPANY_VALIDATION_RESET")
    act_desc = f"Company '{db_company.company_name}' validation marked as '{status_upper}' by {get_user_display_name(current_user)}."
    if val_data.notes:
        act_desc += f" Note: {val_data.notes}"

    log_activity(
        db,
        act_type,
        act_desc,
        client_id=db_company.client_id,
        company_id=db_company.id,
        user_id=current_user.id
    )

    # Automatically send Welcome & Verified ID Card email when company is VALIDATED
    if status_upper == "VALIDATED":
        target_email = db_company.key_contact_email or (db_company.client.email if db_company.client else None) or db_company.director_email
        target_name = db_company.key_contact_person or (db_company.client.contact_person if db_company.client else None) or db_company.director_name or db_company.company_name
        
        if target_email and target_email.strip():
            import threading
            from utils.email_service import send_company_welcome_verified_email
            
            clean_rec_email = target_email.strip()
            clean_rec_name = target_name
            comp_name = db_company.company_name
            comp_code = db_company.company_code
            tax_num = db_company.tax_number
            ind = db_company.industry
            addr = db_company.address
            phone = db_company.key_contact_phone

            def _send_bg_welcome():
                try:
                    send_company_welcome_verified_email(
                        recipient_email=clean_rec_email,
                        recipient_name=clean_rec_name,
                        company_name=comp_name,
                        company_code=comp_code,
                        tax_number=tax_num,
                        industry=ind,
                        address=addr,
                        key_contact_phone=phone
                    )
                except Exception as e:
                    print(f"[ERROR] Failed to send automated welcome email to {clean_rec_email}:", e)

            threading.Thread(target=_send_bg_welcome, daemon=True).start()

            db_company.invitation_sent_at = datetime.now()
            db_company.invitation_sent_to = clean_rec_email
            db.commit()

            log_activity(
                db,
                "COMPANY_WELCOME_EMAIL_SENT",
                f"Automated Invitation & Verified ID Card email sent to {clean_rec_email} (Company Code: {db_company.company_code}).",
                client_id=db_company.client_id,
                company_id=db_company.id,
                user_id=current_user.id
            )

    return db_company

@router.post("/companies/{company_id}/send-welcome-email")
def send_company_welcome_email_manual(
    company_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_company", "edit", db) or auth.has_permission(current_user, "clients_company", "approve", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to send company invitation emails")

    db_company = db.query(models.ClientCompany).options(
        joinedload(models.ClientCompany.partner)
    ).filter(models.ClientCompany.id == company_id).first()
    
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Strict Check: Ensure company is VERIFIED / VALIDATED
    val_status = str(db_company.validation_status or "").strip().upper()
    if val_status not in ["VALIDATED", "VERIFIED"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot send Official Welcome & ID Card email. Company '{db_company.company_name}' has not been verified (Current status: {db_company.validation_status or 'PENDING_VALIDATION'}). Please validate and verify the company profile first."
        )

    target_email = db_company.key_contact_email or (db_company.client.email if db_company.client else None) or db_company.director_email
    target_name = db_company.key_contact_person or (db_company.client.contact_person if db_company.client else None) or db_company.director_name or db_company.company_name

    if not target_email or not str(target_email).strip():
        raise HTTPException(
            status_code=400, 
            detail=f"Company '{db_company.company_name}' does not have a Key Contact Email configured. Please update the company contact details first."
        )

    from utils.email_service import send_company_welcome_verified_email
    clean_target_email = str(target_email).strip()
    
    success = send_company_welcome_verified_email(
        recipient_email=clean_target_email,
        recipient_name=target_name,
        company_name=db_company.company_name,
        company_code=db_company.company_code,
        tax_number=db_company.tax_number,
        industry=db_company.industry,
        address=db_company.address,
        key_contact_phone=db_company.key_contact_phone
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to deliver invitation email via SMTP. Please verify system email credentials.")

    now = datetime.now()
    db_company.invitation_sent_at = now
    db_company.invitation_sent_to = clean_target_email
    db.commit()

    log_activity(
        db,
        "COMPANY_WELCOME_EMAIL_SENT",
        f"Invitation & Verified ID Card email dispatched to {clean_target_email} by {get_user_display_name(current_user)} (Company Code: {db_company.company_code}).",
        client_id=db_company.client_id,
        company_id=db_company.id,
        user_id=current_user.id
    )

    return {
        "success": True,
        "message": f"Invitation & Welcome email successfully sent to {clean_target_email}",
        "recipient_email": clean_target_email,
        "recipient_name": target_name,
        "company_code": db_company.company_code,
        "invitation_sent_at": now.isoformat(),
        "invitation_sent_to": clean_target_email
    }

@router.put("/companies/{company_id}", response_model=schemas.ClientCompanyResponse)
def update_client_company(company_id: int, company_update: schemas.ClientCompanyBase, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_company", "edit", db) or is_admin_or_hr(current_user) or is_employee_role(current_user) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to update this company")
        
    if company_update.company_code:
        existing_code = db.query(models.ClientCompany).filter(
            models.ClientCompany.company_code == company_update.company_code,
            models.ClientCompany.id != company_id
        ).first()
        if existing_code:
            raise HTTPException(status_code=400, detail="Company code already exists")
        
    update_data = company_update.model_dump() if hasattr(company_update, "model_dump") else company_update.dict()
    
    if "key_contact_person" in update_data and update_data["key_contact_person"] is not None:
        person_str = str(update_data["key_contact_person"]).strip()
        if not person_str:
            raise HTTPException(status_code=400, detail="Key Contact Person Name is mandatory")
        update_data["key_contact_person"] = person_str

    if "key_contact_email" in update_data and update_data["key_contact_email"] is not None:
        update_data["key_contact_email"] = validate_and_clean_email(update_data["key_contact_email"], "Key Contact Email")

    if "key_contact_phone" in update_data and update_data["key_contact_phone"] is not None:
        update_data["key_contact_phone"] = validate_and_clean_phone(update_data["key_contact_phone"], "Key Contact Phone")

    if "director_name" in update_data:
        if update_data["director_name"] and str(update_data["director_name"]).strip():
            update_data["director_name"] = str(update_data["director_name"]).strip()
        else:
            update_data["director_name"] = None

    if "director_email" in update_data:
        if update_data["director_email"] and str(update_data["director_email"]).strip():
            update_data["director_email"] = validate_and_clean_email(update_data["director_email"], "Director Email")
        else:
            update_data["director_email"] = None

    if "director_contact" in update_data:
        if update_data["director_contact"] and str(update_data["director_contact"]).strip() and str(update_data["director_contact"]).strip() != "+62":
            update_data["director_contact"] = validate_and_clean_phone(update_data["director_contact"], "Director Phone")
        else:
            update_data["director_contact"] = None

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
        
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_company", "edit", db) or is_admin_or_hr(current_user) or is_employee_role(current_user) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to change logo")
        
    try:
        raw_bytes = file.file.read()
        from utils.file_sanitizer import validate_file_security
        file_bytes, safe_filename = validate_file_security(raw_bytes, file.filename or "logo.png", max_size_mb=10, allowed_category="image")
        unique_filename = f"logos/{uuid.uuid4()}_{safe_filename}"
        public_url = upload_file(file_bytes, unique_filename, "client-documents")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to storage: {str(e)}")
        
    db_company.logo_url = public_url
    db_company.updated_at = datetime.now()
    db.commit()
    db.refresh(db_company)
    
    return db_company

@router.delete("/companies/{company_id}")
def delete_client_company(company_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_company", "delete", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Only Admin or HR can delete companies")
        
    db_company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")

    company_name = db_company.company_name
    company_code = db_company.company_code
    client_id = db_company.client_id

    # 1. Update any orders referencing this company to avoid foreign key violations
    db.query(models.ClientOrder).filter(models.ClientOrder.company_id == company_id).update({"company_id": None}, synchronize_session=False)
    db.query(models.ClientOrder).filter(models.ClientOrder.billing_company_id == company_id).update({"billing_company_id": None}, synchronize_session=False)

    # 2. Delete stakeholders associated with this company
    db.query(models.CompanyStakeholder).filter(models.CompanyStakeholder.company_id == company_id).delete(synchronize_session=False)

    # 3. Delete consultant assignments
    db.query(models.ClientConsultant).filter(models.ClientConsultant.company_id == company_id).delete(synchronize_session=False)

    # 4. Clean up storage files (Dropbox, local, Supabase)
    company_docs = db.query(models.ClientDocument).filter(models.ClientDocument.company_id == company_id).all()
    for doc in company_docs:
        if doc.file_url:
            if doc.file_url.startswith("/uploads/"):
                local_path = doc.file_url.lstrip("/")
                if os.path.exists(local_path):
                    try:
                        os.remove(local_path)
                    except Exception as e:
                        print("Failed to delete local file:", e)
            elif not doc.file_url.startswith("/Clients/"):
                try:
                    delete_file_from_supabase(doc.file_url, "client-documents")
                except Exception as e:
                    print("Failed to delete Supabase file:", e)

    # Delete the company's entire folder in Dropbox (/Clients/{company_code})
    if company_code:
        try:
            from utils.dropbox_client import delete_path
            dropbox_folder_path = f"/Clients/{company_code}"
            delete_path(dropbox_folder_path)
        except Exception as e:
            print(f"Failed to delete Dropbox folder /Clients/{company_code}:", e)

    db.query(models.ClientDocument).filter(models.ClientDocument.company_id == company_id).delete(synchronize_session=False)

    # 5. Delete projects / conversations associated with this company if any
    db.query(models.Project).filter(models.Project.company_id == company_id).delete(synchronize_session=False)
    db.query(models.Conversation).filter(models.Conversation.company_id == company_id).delete(synchronize_session=False)

    # 6. Delete the company entity
    db.delete(db_company)
    db.commit()

    log_activity(db, "COMPANY_DELETED", f"Company '{company_name}' (ID {company_id}) deleted by {get_user_display_name(current_user)}", client_id=client_id, user_id=current_user.id)

    return {"message": f"Company '{company_name}' deleted successfully"}

@router.post("/companies/{company_id}/assign")
def assign_consultants(company_id: int, payload: schemas.AssignConsultantsRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_teams", "edit", db) or auth.has_permission(current_user, "clients_teams", "create", db) or is_admin_or_hr(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to assign consultants")
        
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
        
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_teams", "view", db) or auth.has_permission(current_user, "clients_company", "view", db) or is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
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
        
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_documents", "create", db) or is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to upload documents for this company")
        
    if not file:
        raise HTTPException(status_code=400, detail="A file upload is mandatory.")

    # Security validation & sanitization
    raw_bytes = file.file.read()
    from utils.file_sanitizer import validate_file_security
    file_bytes, filename = validate_file_security(raw_bytes, file.filename or "document.pdf", max_size_mb=50, allowed_category="all")

    # Determine company directory folder name
    company_code = company.company_code or f"comp_{company.id}"
    
    # Sanitize document type to use as folder name
    doc_type_folder = (document_type or "General").strip().replace("/", "_").replace("\\", "_")
    
    # Determine order folder name
    order_folder = (order_number or "No_Order").strip().replace("/", "_").replace("\\", "_")

    # Destination path in Dropbox
    destination_path = f"/Clients/{company_code}/{order_folder}/{doc_type_folder}/{filename}"
    if destination_path.startswith("//"):
        destination_path = destination_path[1:]
        
    try:
        from utils.dropbox_client import upload_file
        res = upload_file(file_bytes, destination_path)
        if not res.get("success"):
            raise HTTPException(status_code=500, detail=f"Failed to upload to Dropbox: {res.get('error')}")
    except HTTPException:
        raise
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
    
    if not actual_token or actual_token in ("cookie_based_session_active", "null", "undefined"):
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
        
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_documents", "view", db) or is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to preview documents for this company")
        
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
            
        order_suffix = f" for order {db_doc.order_number}" if db_doc.order_number else ""
        log_activity(
            db, 
            "DOCUMENT_VIEWED", 
            f"Viewed document '{db_doc.file_name}' ({db_doc.document_type or 'General'}){order_suffix}", 
            client_id=company.client_id, 
            company_id=company_id, 
            user_id=current_user.id
        )

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
        
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_documents", "edit", db) or is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
        raise HTTPException(status_code=403, detail="Not authorized to edit documents for this company")
        
    db_doc = db.query(models.ClientDocument).filter(models.ClientDocument.id == document_id, models.ClientDocument.company_id == company_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if file:
        raw_bytes = file.file.read()
        from utils.file_sanitizer import validate_file_security
        file_bytes, filename = validate_file_security(raw_bytes, file.filename or "document.pdf", max_size_mb=50, allowed_category="all")

        # Determine company directory folder name
        company_code = company.company_code or f"comp_{company.id}"
        
        # Sanitize document type to use as folder name
        doc_type_folder = (document_type or db_doc.document_type or "General").strip().replace("/", "_").replace("\\", "_")
        
        # Determine order folder name
        order_folder = (order_number or db_doc.order_number or "No_Order").strip().replace("/", "_").replace("\\", "_")

        # Destination path in Dropbox
        destination_path = f"/Clients/{company_code}/{order_folder}/{doc_type_folder}/{filename}"
        if destination_path.startswith("//"):
            destination_path = destination_path[1:]
            
        try:
            from utils.dropbox_client import upload_file
            res = upload_file(file_bytes, destination_path)
            if not res.get("success"):
                raise HTTPException(status_code=500, detail=f"Failed to upload to Dropbox: {res.get('error')}")
        except HTTPException:
            raise
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
    
    order_suffix = f" for order {db_doc.order_number}" if db_doc.order_number else ""
    log_activity(
        db, 
        "DOCUMENT_UPDATED", 
        f"Updated document '{db_doc.file_name}' ({db_doc.document_type or 'General'}){order_suffix}", 
        client_id=company.client_id, 
        company_id=company_id, 
        user_id=current_user.id
    )

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
        
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_documents", "delete", db) or is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client_themselves_for_company(current_user, company_id, db)):
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
        
    file_name = db_doc.file_name or "Document"
    doc_type = db_doc.document_type or "General"
    order_suffix = f" from order {db_doc.order_number}" if db_doc.order_number else ""

    db.delete(db_doc)
    db.commit()
    
    log_activity(
        db, 
        "DOCUMENT_DELETED", 
        f"Deleted document '{file_name}' ({doc_type}){order_suffix}", 
        client_id=company.client_id, 
        company_id=company_id, 
        user_id=current_user.id
    )

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
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_services", "create", db)):
        raise HTTPException(status_code=403, detail="Access denied. You do not have permission to create service catalog entries.")
        
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
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_services", "create", db)):
        raise HTTPException(status_code=403, detail="Access denied. You do not have permission to create service catalog entries.")
        
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

@router.get("/services/catalog/{id}", response_model=schemas.ClientServiceResponse)
def get_client_service(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_service = db.query(models.ClientService).filter(models.ClientService.id == id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service entry not found")
        
    p_base = db_service.base_price or 0.0
    res = schemas.ClientServiceResponse.model_validate(db_service) if hasattr(schemas.ClientServiceResponse, "model_validate") else schemas.ClientServiceResponse.from_orm(db_service)
    res.partner_a_price = round(p_base * (1 - ((db_service.partner_a_discount or 20.0) / 100.0)), 2)
    res.partner_a1_price = round(p_base * (1 - ((db_service.partner_a1_discount or 40.0) / 100.0)), 2)
    res.partner_a2_price = round(p_base * (1 - ((db_service.partner_a2_discount or 50.0) / 100.0)), 2)
    return res

@router.put("/services/catalog/{id}", response_model=schemas.ClientServiceResponse)
def update_client_service(id: int, service_update: schemas.ClientServiceUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_services", "edit", db)):
        raise HTTPException(status_code=403, detail="Access denied. You do not have permission to update service catalog entries.")
        
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
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_services", "delete", db)):
        raise HTTPException(status_code=403, detail="Access denied. You do not have permission to delete service catalog entries.")
        
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
        
    is_client = is_client_themselves_for_company(current_user, company_id, db)
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_documents", "view", db) or is_admin_or_hr(current_user) or is_assigned_employee_to_company(current_user, company_id, db) or is_client):
        raise HTTPException(status_code=403, detail="Not authorized to view documents for this company")
        
    query = db.query(models.ClientDocument).filter(models.ClientDocument.company_id == company_id)
    
    can_view_invoices = (
        auth.is_super_admin(current_user) 
        or is_client 
        or auth.has_permission(current_user, "clients_documents_invoices", "view", db)
        or auth.has_permission(current_user, "clients_documents_invoices", "download", db)
    )
    if not can_view_invoices:
        query = query.filter(
            or_(models.ClientDocument.document_type == None, ~models.ClientDocument.document_type.ilike("%invoice%")),
            or_(models.ClientDocument.document_path == None, ~models.ClientDocument.document_path.ilike("%/invoice/%")),
            or_(models.ClientDocument.file_name == None, ~models.ClientDocument.file_name.ilike("%invoice%"))
        )
        
    return query.all()


def check_order_authorization_for_chat(user: models.User, order_number: str, db: Session) -> bool:
    if is_admin_or_hr(user) or auth.is_super_admin(user):
        return True
    
    clean_no = (order_number or "").strip().upper()
    orders_in_group = db.query(models.ClientOrder).filter(func.upper(models.ClientOrder.order_number) == clean_no).all()
    if not orders_in_group:
        return False
        
    # 1. Check if user is the client, customer, or member
    if user.role and user.role.name.upper() in ["MEMBER", "CLIENT", "CUSTOMER"]:
        partner_id = user.partner.id if user.partner else None
        if not partner_id:
            p = db.query(models.Partner).filter(models.Partner.user_id == user.id).first()
            if p:
                partner_id = p.id

        cust_id = user.client.id if user.client else None
        if not cust_id:
            c = db.query(models.Client).filter(models.Client.user_id == user.id).first()
            if c:
                cust_id = c.id

        for o in orders_in_group:
            if partner_id and o.client_id == partner_id:
                return True
            if cust_id and o.customer_id == cust_id:
                return True
            if o.company_id:
                comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == o.company_id).first()
                if comp:
                    if partner_id and comp.client_id == partner_id:
                        return True
                    if cust_id and (comp.customer_id == cust_id or getattr(user.client, "company_id", None) == comp.id):
                        return True
        return False
        
    # 2. Check if user is an employee with RBAC or Assigned Orders permissions
    if is_employee_role(user) and user.employee:
        emp_id = user.employee.id
        is_completed = any(o.status == "COMPLETED" for o in orders_in_group)
        is_pipeline = any(o.status in ["PROSPECT", "PIPELINE"] for o in orders_in_group)
        
        # Check module permission based on order stage
        if is_completed and auth.has_permission(user, "clients_orders_completed", "view", db):
            return True
        if is_pipeline and auth.has_permission(user, "clients_orders_pipeline", "view", db):
            return True
        if not is_completed and not is_pipeline and auth.has_permission(user, "clients_orders_active", "view", db):
            return True

        # Check if user is an assigned consultant and has Assigned Orders permission
        if auth.has_permission(user, "clients_my", "view", db):
            for o in orders_in_group:
                c_ids = parse_consultant_ids(o.consultant_ids)
                r_ids = parse_consultant_ids(getattr(o, "reviewer_ids", None))
                if o.reviewer_id and o.reviewer_id not in r_ids:
                    r_ids.append(o.reviewer_id)
                if emp_id in c_ids or emp_id in r_ids or o.reviewer_id == emp_id:
                    return True

        return False
        
    return False


def is_automated_milestone_message(message: Optional[str]) -> bool:
    if not message:
        return False
    msg = message.strip().lower()
    return (
        msg.startswith("order execution status")
        or "order placed on hold" in msg
        or "⏸️" in msg
        or msg.startswith("pipeline order")
        or msg.startswith("order moved")
        or msg.startswith("payment")
        or msg.startswith("proforma payment")
        or msg.startswith("final invoice payment")
        or msg.startswith("additional payment")
        or msg.startswith("amount received")
        or "invoice has been generated" in msg
        or "invoice has been sent" in msg
        or "invoice has been re-sent" in msg
        or "proforma invoice" in msg
        or "final invoice" in msg
        or "final documents" in msg
        or "uploaded to dropbox" in msg
        or "emailed to client" in msg
        or "dispatched to client" in msg
        or "assigned to review" in msg
        or "consultant is actively" in msg
        or "has been reopened" in msg
        or "reopened and moved back" in msg
        or "marked as cancelled" in msg
        or "order was marked as cancelled" in msg
        or "has been cancelled" in msg
        or "documents for signature" in msg
        or "pre-documents" in msg
        or "pre docs" in msg
        or "documents reviewed" in msg
    )


def format_order_progress_response(
    u: models.ClientOrderProgress, 
    db: Session,
    seen_by: Optional[List[schemas.MessageSeenUser]] = None,
    reactions: Optional[List[schemas.MessageReactionGroup]] = None
) -> schemas.ClientOrderProgressResponse:
    sender_name = "System"
    sender_role = "Milestone"
    sender_avatar = None
    is_client = False
    
    # 1. Check if automated milestone update FIRST (always System / Milestone)
    is_milestone = not u.user_id or is_automated_milestone_message(u.message)
    
    if is_milestone:
        sender_name = "System"
        sender_role = "Milestone"
        is_client = False
        return schemas.ClientOrderProgressResponse(
            id=u.id,
            order_number=u.order_number,
            user_id=u.user_id,
            message=u.message,
            channel=u.channel or "CLIENT",
            attachment_url=u.attachment_url,
            attachment_name=u.attachment_name,
            quoted_message_id=getattr(u, "quoted_message_id", None),
            quoted_message_text=getattr(u, "quoted_message_text", None),
            quoted_sender_name=getattr(u, "quoted_sender_name", None),
            created_at=u.created_at,
            sender_name="System",
            sender_role="Milestone",
            sender_avatar=None,
            is_client=False,
            is_deleted=bool(getattr(u, "is_deleted", False)),
            seen_by=[],
            reactions=[]
        )
    
    # 2. Check if sent by a Client, Customer, or Member user
    if u.user and u.user.role and u.user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"]:
        sender_name = "Client"
        # Try Partner first
        p = db.query(models.Partner).filter(models.Partner.user_id == u.user.id).first()
        if p and p.contact_person:
            sender_name = p.contact_person
        else:
            # Try Client second
            c = db.query(models.Client).filter(models.Client.user_id == u.user.id).first()
            if c and c.full_name:
                sender_name = c.full_name
            elif u.user.name:
                sender_name = u.user.name

        return schemas.ClientOrderProgressResponse(
            id=u.id,
            order_number=u.order_number,
            user_id=u.user_id,
            message=u.message,
            channel="CLIENT",
            attachment_url=u.attachment_url,
            attachment_name=u.attachment_name,
            quoted_message_id=getattr(u, "quoted_message_id", None),
            quoted_message_text=getattr(u, "quoted_message_text", None),
            quoted_sender_name=getattr(u, "quoted_sender_name", None),
            created_at=u.created_at,
            sender_name=sender_name,
            sender_role="Client",
            sender_avatar=None,
            is_client=True,
            is_deleted=bool(getattr(u, "is_deleted", False)),
            seen_by=seen_by or [],
            reactions=reactions or []
        )

    # 3. Staff user
    if u.user:
        if u.user.employee:
            first_name = u.user.employee.first_name or ""
            last_name = u.user.employee.last_name or ""
            full_name = f"{first_name} {last_name}".strip()
            sender_name = full_name if full_name else (u.user.role.name.title() if u.user.role else "Consultant")
            sender_role = u.user.employee.job_title or "Consultant"
            sender_avatar = u.user.employee.profile_photo
        elif u.user.role:
            sender_name = u.user.role.name.title()
            sender_role = u.user.role.name.upper()
        else:
            sender_name = "Staff"
            sender_role = "Team"
    else:
        sender_name = "System"
        sender_role = "Milestone"
        
    return schemas.ClientOrderProgressResponse(
        id=u.id,
        order_number=u.order_number,
        user_id=u.user_id,
        message=u.message,
        channel=u.channel or "INTERNAL",
        attachment_url=u.attachment_url,
        attachment_name=u.attachment_name,
        quoted_message_id=getattr(u, "quoted_message_id", None),
        quoted_message_text=getattr(u, "quoted_message_text", None),
        quoted_sender_name=getattr(u, "quoted_sender_name", None),
        created_at=u.created_at,
        sender_name=sender_name,
        sender_role=sender_role,
        sender_avatar=sender_avatar,
        is_client=is_client,
        is_deleted=bool(getattr(u, "is_deleted", False)),
        seen_by=seen_by or [],
        reactions=reactions or []
    )


@router.get("/orders/{order_number}/summary")
def get_order_summary(
    order_number: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to view order details")

    clean_no = (order_number or "").strip().upper()
    orders = db.query(models.ClientOrder).options(
        joinedload(models.ClientOrder.partner),
        joinedload(models.ClientOrder.company),
        joinedload(models.ClientOrder.billing_company),
        joinedload(models.ClientOrder.service),
        joinedload(models.ClientOrder.notary)
    ).filter(func.upper(models.ClientOrder.order_number) == clean_no).order_by(models.ClientOrder.id.asc()).all()

    if not orders:
        raise HTTPException(status_code=404, detail="Order not found")

    first_order = orders[0]

    # Aggregate all consultant IDs across items in this order
    all_cids = []
    for o in orders:
        all_cids.extend(parse_consultant_ids(o.consultant_ids))
    unique_cids = list(dict.fromkeys(all_cids))
    consultants = get_consultants_data(db, unique_cids)

    all_rids = []
    for o in orders:
        all_rids.extend(parse_consultant_ids(getattr(o, "reviewer_ids", None)))
        if o.reviewer_id and o.reviewer_id not in all_rids:
            all_rids.append(o.reviewer_id)
    unique_rids = list(dict.fromkeys(all_rids))
    reviewers = get_consultants_data(db, unique_rids)
    reviewer_data = reviewers[0] if reviewers else None

    items = []
    total_amount = 0.0
    for o in orders:
        total_amount += float(o.unit_price or 0.0)
        desc = o.description or (o.service.description if o.service and o.service.description else None)
        items.append({
            "id": o.id,
            "service_id": o.service_id,
            "job_id": o.job_id or (f"JOB-{o.service_id}" if o.service_id else None),
            "job_title": o.job_title or (o.service.job_title if o.service else "Corporate Service"),
            "description": desc,
            "service_instructions": o.service_instructions,
            "notes": o.service_instructions,
            "unit_price": o.unit_price,
            "pricing_tier": o.pricing_tier,
            "needs_notary": o.service.needs_notary if o.service else False,
            "needs_gov_officer": o.service.needs_gov_officer if o.service else False,
            "needs_other_vendors": o.service.needs_other_vendors if o.service else False,
            "notary_name": o.notary.name if o.notary else None,
            "notary_fee": o.notary_fee
        })

    company_data = None
    if first_order.company:
        company_data = {
            "id": first_order.company.id,
            "company_name": first_order.company.company_name,
            "company_code": first_order.company.company_code,
            "tax_number": first_order.company.tax_number,
            "address": first_order.company.address,
            "director_name": first_order.company.director_name,
            "key_contact_person": first_order.company.key_contact_person,
            "key_contact_email": first_order.company.key_contact_email,
            "key_contact_phone": first_order.company.key_contact_phone
        }

    client_data = None
    if first_order.partner:
        client_data = {
            "id": first_order.partner.id,
            "client_code": first_order.partner.client_code,
            "contact_person": first_order.partner.contact_person,
            "email": first_order.partner.email,
            "phone": first_order.partner.phone
        }
    elif first_order.customer_id:
        cust = db.query(models.Client).filter(models.Client.id == first_order.customer_id).first()
        if cust:
            client_data = {
                "id": cust.id,
                "client_code": cust.customer_code,
                "contact_person": cust.full_name,
                "email": cust.email,
                "phone": cust.phone
            }

    return {
        "order_number": first_order.order_number,
        "status": first_order.status,
        "payment_status": first_order.payment_status,
        "invoice_number": first_order.invoice_number,
        "accurate_so_no": first_order.accurate_so_no,
        "accurate_inv_no": first_order.accurate_inv_no,
        "created_at": first_order.created_at.isoformat() if first_order.created_at else None,
        "total_amount": total_amount,
        "company": company_data,
        "client": client_data,
        "consultants": consultants,
        "reviewer_id": first_order.reviewer_id or (unique_rids[0] if unique_rids else None),
        "reviewer": reviewer_data,
        "reviewer_ids": unique_rids,
        "reviewers": reviewers,
        "items": items
    }


@router.get("/orders/{order_number}/progress", response_model=List[schemas.ClientOrderProgressResponse])
def get_order_progress(
    order_number: str,
    channel: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to view chat/progress for this order")

    clean_order_no = (order_number or "").strip().upper()

    query = db.query(models.ClientOrderProgress).options(
        joinedload(models.ClientOrderProgress.user).joinedload(models.User.employee),
        joinedload(models.ClientOrderProgress.user).joinedload(models.User.role),
        joinedload(models.ClientOrderProgress.user).joinedload(models.User.client),
        joinedload(models.ClientOrderProgress.user).joinedload(models.User.partner)
    ).filter(func.upper(models.ClientOrderProgress.order_number) == clean_order_no)

    auto_status_filter = (
        (models.ClientOrderProgress.user_id == None) |
        (models.ClientOrderProgress.message.ilike("Order execution status has been updated to%")) |
        (models.ClientOrderProgress.message.ilike("⏸️ Order placed ON HOLD%")) |
        (models.ClientOrderProgress.message.ilike("%Order placed ON HOLD%")) |
        (models.ClientOrderProgress.message.ilike("Pipeline order has been moved to Active Orders%")) |
        (models.ClientOrderProgress.message.ilike("%payment completed successfully via Xendit%")) |
        (models.ClientOrderProgress.message.ilike("Additional payment received via Xendit%")) |
        (models.ClientOrderProgress.message.ilike("%invoice%has been generated%")) |
        (models.ClientOrderProgress.message.ilike("%invoice%has been sent%")) |
        (models.ClientOrderProgress.message.ilike("%invoice%has been re-sent%")) |
        (models.ClientOrderProgress.message.ilike("%final documents%")) |
        (models.ClientOrderProgress.message.ilike("%Pre-documents for signature%")) |
        (models.ClientOrderProgress.message.ilike("Amount Received / Proforma Paid manually updated%")) |
        (models.ClientOrderProgress.message.ilike("%has been reopened%")) |
        (models.ClientOrderProgress.message.ilike("%marked as CANCELLED%")) |
        (models.ClientOrderProgress.message.ilike("%has been cancelled%"))
    )
    
    is_client_user = bool(current_user.role and current_user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"])

    # 1. CLIENT user or channel == "CLIENT" (Client & Consultant Chat)
    if is_client_user or (channel and channel.upper() == "CLIENT"):
        query = query.filter(
            models.ClientOrderProgress.channel != "INTERNAL"
        ).filter(
            (models.ClientOrderProgress.channel == "CLIENT") | (models.ClientOrderProgress.channel == None) | auto_status_filter
        )
    # 2. INTERNAL channel (Internal Team Chat)
    elif channel and channel.upper() == "INTERNAL":
        query = query.filter(
            (models.ClientOrderProgress.channel == "INTERNAL") | (models.ClientOrderProgress.channel == "CLIENT") | auto_status_filter
        )
        
    updates = query.order_by(models.ClientOrderProgress.created_at.asc(), models.ClientOrderProgress.id.asc()).all()
    
    # Query user reads for this order
    all_user_reads = db.query(models.ClientOrderUserRead).options(
        joinedload(models.ClientOrderUserRead.user).joinedload(models.User.employee),
        joinedload(models.ClientOrderUserRead.user).joinedload(models.User.client),
        joinedload(models.ClientOrderUserRead.user).joinedload(models.User.partner),
        joinedload(models.ClientOrderUserRead.user).joinedload(models.User.role)
    ).filter(
        func.upper(models.ClientOrderUserRead.order_number) == clean_order_no
    ).all()

    # Pre-format read records
    formatted_readers = []
    for r in all_user_reads:
        if not r.user:
            continue
        r_user = r.user
        r_is_client = bool(r_user.role and r_user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"])
        
        # Determine display name & role
        if r_is_client:
            r_name = "Client"
            if r_user.partner and r_user.partner.contact_person:
                r_name = r_user.partner.contact_person
            elif r_user.client and r_user.client.full_name:
                r_name = r_user.client.full_name
            elif r_user.name:
                r_name = r_user.name
            r_role = "Client"
            r_avatar = None
        elif r_user.employee:
            fn = r_user.employee.first_name or ""
            ln = r_user.employee.last_name or ""
            r_name = f"{fn} {ln}".strip() or (r_user.role.name.title() if r_user.role else "Consultant")
            r_role = r_user.employee.job_title or (r_user.role.name.title() if r_user.role else "Consultant")
            r_avatar = r_user.employee.profile_photo
        elif r_user.role:
            r_name = r_user.role.name.title()
            r_role = r_user.role.name.upper()
            r_avatar = None
        else:
            r_name = "Staff"
            r_role = "Team"
            r_avatar = None

        formatted_readers.append({
            "user_id": r.user_id,
            "channel": (r.channel or "CLIENT").upper(),
            "last_read_message_id": r.last_read_message_id,
            "read_at": r.read_at,
            "seen_item": schemas.MessageSeenUser(
                user_id=r.user_id,
                name=r_name,
                role=r_role,
                avatar=r_avatar,
                is_client=r_is_client,
                read_at=r.read_at
            )
        })

    # Batch query all reactions for messages in this order
    update_ids = [u.id for u in updates]
    reactions_by_msg = {}
    if update_ids:
        all_reactions = db.query(models.ClientOrderProgressReaction).options(
            joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.employee),
            joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.client),
            joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.partner),
            joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.role)
        ).filter(
            models.ClientOrderProgressReaction.progress_id.in_(update_ids)
        ).order_by(models.ClientOrderProgressReaction.id.asc()).all()

        for r in all_reactions:
            if not r.user:
                continue
            r_user = r.user
            r_is_client = bool(r_user.role and r_user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"])
            if r_is_client:
                r_name = "Client"
                if r_user.partner and r_user.partner.contact_person:
                    r_name = r_user.partner.contact_person
                elif r_user.client and r_user.client.full_name:
                    r_name = r_user.client.full_name
                elif r_user.name:
                    r_name = r_user.name
                r_role = "Client"
                r_avatar = None
            elif r_user.employee:
                fn = r_user.employee.first_name or ""
                ln = r_user.employee.last_name or ""
                r_name = f"{fn} {ln}".strip() or (r_user.role.name.title() if r_user.role else "Consultant")
                r_role = r_user.employee.job_title or (r_user.role.name.title() if r_user.role else "Consultant")
                r_avatar = r_user.employee.profile_photo
            elif r_user.role:
                r_name = r_user.role.name.title()
                r_role = r_user.role.name.upper()
                r_avatar = None
            else:
                r_name = "Staff"
                r_role = "Team"
                r_avatar = None

            user_item = schemas.MessageReactionUser(
                user_id=r.user_id,
                name=r_name,
                role=r_role,
                avatar=r_avatar,
                is_client=r_is_client,
                is_self=(r.user_id == current_user.id)
            )
            if r.progress_id not in reactions_by_msg:
                reactions_by_msg[r.progress_id] = {}
            if r.emoji not in reactions_by_msg[r.progress_id]:
                reactions_by_msg[r.progress_id][r.emoji] = []
            reactions_by_msg[r.progress_id][r.emoji].append(user_item)

    res = []
    last_system_msg_key = None
    last_system_msg_time = None
    for u in updates:
        is_milestone = not u.user_id or is_automated_milestone_message(u.message)

        # For non-milestone messages in internal channel, exclude any client user-typed message
        if channel and channel.upper() == "INTERNAL" and not is_milestone:
            if u.user and u.user.role and u.user.role.name.upper() == "CLIENT":
                continue
            if u.channel == "CLIENT":
                continue

        if is_milestone:
            msg_key = (u.message or "").strip()
            is_immediate_dup = (
                msg_key == last_system_msg_key and
                u.created_at and last_system_msg_time and
                abs((u.created_at - last_system_msg_time).total_seconds()) <= 5
            )
            if is_immediate_dup:
                continue
            last_system_msg_key = msg_key
            last_system_msg_time = u.created_at
            res.append(format_order_progress_response(u, db, seen_by=[], reactions=[]))
            continue
            
        # Match readers
        msg_channel = (u.channel or "CLIENT").upper()
        msg_seen_by = []
        for fr in formatted_readers:
            # Client users should not see internal channel read info
            if is_client_user and fr["channel"] == "INTERNAL":
                continue
            # Match channel and read watermark
            if fr["channel"] == msg_channel and fr["last_read_message_id"] >= u.id and fr["user_id"] != u.user_id:
                msg_seen_by.append(fr["seen_item"])

        # Match reactions
        msg_reactions = []
        if u.id in reactions_by_msg:
            for emoji, users in reactions_by_msg[u.id].items():
                has_reacted = any(usr.user_id == current_user.id for usr in users)
                msg_reactions.append(schemas.MessageReactionGroup(
                    emoji=emoji,
                    count=len(users),
                    has_reacted=has_reacted,
                    users=users
                ))

        res.append(format_order_progress_response(u, db, seen_by=msg_seen_by, reactions=msg_reactions))
    return res


def get_formatted_message_reactions(progress_id: int, current_user_id: int, db: Session) -> List[schemas.MessageReactionGroup]:
    reactions = db.query(models.ClientOrderProgressReaction).options(
        joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.employee),
        joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.client),
        joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.partner),
        joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.role)
    ).filter(
        models.ClientOrderProgressReaction.progress_id == progress_id
    ).order_by(models.ClientOrderProgressReaction.id.asc()).all()

    grouped = {}
    for r in reactions:
        if not r.user:
            continue
        r_user = r.user
        r_is_client = bool(r_user.role and r_user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"])
        if r_is_client:
            r_name = "Client"
            if r_user.partner and r_user.partner.contact_person:
                r_name = r_user.partner.contact_person
            elif r_user.client and r_user.client.full_name:
                r_name = r_user.client.full_name
            elif r_user.name:
                r_name = r_user.name
            r_role = "Client"
            r_avatar = None
        elif r_user.employee:
            fn = r_user.employee.first_name or ""
            ln = r_user.employee.last_name or ""
            r_name = f"{fn} {ln}".strip() or (r_user.role.name.title() if r_user.role else "Consultant")
            r_role = r_user.employee.job_title or (r_user.role.name.title() if r_user.role else "Consultant")
            r_avatar = r_user.employee.profile_photo
        elif r_user.role:
            r_name = r_user.role.name.title()
            r_role = r_user.role.name.upper()
            r_avatar = None
        else:
            r_name = "Staff"
            r_role = "Team"
            r_avatar = None

        user_item = schemas.MessageReactionUser(
            user_id=r.user_id,
            name=r_name,
            role=r_role,
            avatar=r_avatar,
            is_client=r_is_client,
            is_self=(r.user_id == current_user_id)
        )
        if r.emoji not in grouped:
            grouped[r.emoji] = []
        grouped[r.emoji].append(user_item)

    result = []
    for emoji, users in grouped.items():
        has_reacted = any(usr.user_id == current_user_id for usr in users)
        result.append(schemas.MessageReactionGroup(
            emoji=emoji,
            count=len(users),
            has_reacted=has_reacted,
            users=users
        ))
    return result


@router.post("/orders/{order_number}/progress/{progress_id}/reactions")
def toggle_order_chat_reaction(
    order_number: str,
    progress_id: int,
    payload: schemas.MessageReactionToggleRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to access chat for this order")

    clean_no = (order_number or "").strip().upper()
    emoji = (payload.emoji or "").strip()
    if not emoji:
        raise HTTPException(status_code=400, detail="Emoji cannot be empty")

    msg = db.query(models.ClientOrderProgress).filter(
        models.ClientOrderProgress.id == progress_id,
        func.upper(models.ClientOrderProgress.order_number) == clean_no
    ).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    is_client_user = bool(current_user.role and current_user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"])
    if is_client_user and (msg.channel or "").upper() == "INTERNAL":
        raise HTTPException(status_code=403, detail="Client users cannot react to internal messages")

    existing = db.query(models.ClientOrderProgressReaction).filter(
        models.ClientOrderProgressReaction.progress_id == progress_id,
        models.ClientOrderProgressReaction.user_id == current_user.id,
        models.ClientOrderProgressReaction.emoji == emoji
    ).first()

    if existing:
        db.delete(existing)
        action = "removed"
    else:
        new_rxn = models.ClientOrderProgressReaction(
            progress_id=progress_id,
            user_id=current_user.id,
            emoji=emoji
        )
        db.add(new_rxn)
        action = "added"

    db.commit()

    reactions = get_formatted_message_reactions(progress_id, current_user.id, db)
    return {
        "status": "success",
        "action": action,
        "progress_id": progress_id,
        "reactions": reactions
    }


@router.post("/orders/{order_number}/read")
def mark_order_chat_as_read(
    order_number: str,
    payload: schemas.OrderMarkReadRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to access chat for this order")

    clean_no = (order_number or "").strip().upper()
    channel_clean = (payload.channel or "CLIENT").strip().upper()
    if channel_clean not in ["CLIENT", "INTERNAL"]:
        channel_clean = "CLIENT"

    # Client role cannot mark INTERNAL channel as read
    is_client_user = bool(current_user.role and current_user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"])
    if is_client_user and channel_clean == "INTERNAL":
        raise HTTPException(status_code=403, detail="Client users cannot access internal channel")

    read_record = db.query(models.ClientOrderUserRead).filter(
        func.upper(models.ClientOrderUserRead.order_number) == clean_no,
        func.upper(models.ClientOrderUserRead.channel) == channel_clean,
        models.ClientOrderUserRead.user_id == current_user.id
    ).first()

    now = datetime.utcnow()
    if not read_record:
        read_record = models.ClientOrderUserRead(
            order_number=clean_no,
            channel=channel_clean,
            user_id=current_user.id,
            last_read_message_id=payload.last_message_id,
            read_at=now
        )
        db.add(read_record)
    else:
        if payload.last_message_id > read_record.last_read_message_id:
            read_record.last_read_message_id = payload.last_message_id
            read_record.read_at = now

    db.commit()
    return {
        "status": "success",
        "order_number": clean_no,
        "channel": channel_clean,
        "last_read_message_id": read_record.last_read_message_id,
        "read_at": read_record.read_at
    }


def record_sender_read_watermark(order_number: str, channel: str, user_id: int, message_id: int, db: Session):
    if not order_number or not user_id or not message_id:
        return
    try:
        clean_no = (order_number or "").strip().upper()
        target_channel = (channel or "CLIENT").strip().upper()
        read_rec = db.query(models.ClientOrderUserRead).filter(
            func.upper(models.ClientOrderUserRead.order_number) == clean_no,
            func.upper(models.ClientOrderUserRead.channel) == target_channel,
            models.ClientOrderUserRead.user_id == user_id
        ).first()
        now = datetime.utcnow()
        if not read_rec:
            read_rec = models.ClientOrderUserRead(
                order_number=clean_no,
                channel=target_channel,
                user_id=user_id,
                last_read_message_id=message_id,
                read_at=now
            )
            db.add(read_rec)
        else:
            if message_id > read_rec.last_read_message_id:
                read_rec.last_read_message_id = message_id
                read_rec.read_at = now
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Warning: Failed to auto-update sender read watermark: {e}")


def generate_order_chat_transcript(order_number: str, db: Session, user_scope: Optional[str] = "ALL") -> str:
    """
    Generates a structured, offline-secure plain-text transcript of all chat interactions
    (External Client messages, Internal Consultant notes, System milestones, and Reactions)
    for the specified order.
    """
    clean_no = (order_number or "").strip().upper()
    orders = db.query(models.ClientOrder).options(
        joinedload(models.ClientOrder.partner),
        joinedload(models.ClientOrder.company),
        joinedload(models.ClientOrder.billing_company),
        joinedload(models.ClientOrder.service),
        joinedload(models.ClientOrder.notary)
    ).filter(func.upper(models.ClientOrder.order_number) == clean_no).order_by(models.ClientOrder.id.asc()).all()

    first_order = orders[0] if orders else None

    # Company details
    company_name = "N/A"
    company_code = "N/A"
    tax_number = "N/A"
    company_addr = "N/A"
    director = "N/A"
    key_contact = "N/A"
    if first_order and first_order.company:
        company_name = first_order.company.company_name or "N/A"
        company_code = first_order.company.company_code or "N/A"
        tax_number = first_order.company.tax_number or "N/A"
        company_addr = first_order.company.address or "N/A"
        director = first_order.company.director_name or "N/A"
        kc_parts = [p for p in [first_order.company.key_contact_person, first_order.company.key_contact_email, first_order.company.key_contact_phone] if p]
        if kc_parts:
            key_contact = " | ".join(kc_parts)

    # Client/Partner details
    client_name = "N/A"
    client_code = "N/A"
    client_contact_info = "N/A"
    if first_order and first_order.partner:
        client_name = first_order.partner.contact_person or "N/A"
        client_code = first_order.partner.client_code or "N/A"
        c_parts = [p for p in [first_order.partner.email, first_order.partner.phone] if p]
        if c_parts:
            client_contact_info = " | ".join(c_parts)
    elif first_order and first_order.customer_id:
        cust = db.query(models.Client).filter(models.Client.id == first_order.customer_id).first()
        if cust:
            client_name = cust.full_name or "N/A"
            client_code = cust.customer_code or "N/A"
            c_parts = [p for p in [cust.email, cust.phone] if p]
            if c_parts:
                client_contact_info = " | ".join(c_parts)

    # Order meta
    order_status = first_order.status if first_order else "N/A"
    payment_status = first_order.payment_status if first_order else "N/A"
    invoice_no = first_order.invoice_number if first_order and first_order.invoice_number else "N/A"
    so_no = first_order.accurate_so_no if first_order and first_order.accurate_so_no else "N/A"
    created_date = first_order.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if first_order and first_order.created_at else "N/A"

    # Services / Line items
    services_lines = []
    total_amount = 0.0
    all_cids = []
    for o in orders:
        total_amount += float(o.unit_price or 0.0)
        all_cids.extend(parse_consultant_ids(o.consultant_ids))
        job_title = o.job_title or (o.service.job_title if o.service else "Corporate Service")
        job_id = o.job_id or (f"JOB-{o.service_id}" if o.service_id else "N/A")
        price_str = f"IDR {float(o.unit_price or 0.0):,.2f}"
        services_lines.append(f"  • {job_title} ({job_id}) - {price_str}")
        if o.service_instructions:
            services_lines.append(f"    Instructions: {o.service_instructions.strip()}")
        if o.notes:
            services_lines.append(f"    Notes: {o.notes.strip()}")

    # Assigned Consultants
    unique_cids = list(dict.fromkeys(all_cids))
    consultants = get_consultants_data(db, unique_cids)
    consultant_names = [f"{c['name']} ({c['job_title'] or 'Consultant'})" for c in consultants] or ["Unassigned"]

    # Query all progress records
    progress_records = db.query(models.ClientOrderProgress).options(
        joinedload(models.ClientOrderProgress.user).joinedload(models.User.employee),
        joinedload(models.ClientOrderProgress.user).joinedload(models.User.role),
        joinedload(models.ClientOrderProgress.user).joinedload(models.User.client),
        joinedload(models.ClientOrderProgress.user).joinedload(models.User.partner)
    ).filter(func.upper(models.ClientOrderProgress.order_number) == clean_no).order_by(
        models.ClientOrderProgress.created_at.asc(),
        models.ClientOrderProgress.id.asc()
    ).all()

    # Query all reactions
    update_ids = [u.id for u in progress_records]
    reactions_by_msg = {}
    if update_ids:
        all_reactions = db.query(models.ClientOrderProgressReaction).options(
            joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.employee),
            joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.client),
            joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.partner),
            joinedload(models.ClientOrderProgressReaction.user).joinedload(models.User.role)
        ).filter(
            models.ClientOrderProgressReaction.progress_id.in_(update_ids)
        ).order_by(models.ClientOrderProgressReaction.id.asc()).all()

        for r in all_reactions:
            if not r.user:
                continue
            r_user = r.user
            r_is_client = bool(r_user.role and r_user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"])
            if r_is_client:
                r_name = "Client"
                if r_user.partner and r_user.partner.contact_person:
                    r_name = r_user.partner.contact_person
                elif r_user.client and r_user.client.full_name:
                    r_name = r_user.client.full_name
                elif r_user.name:
                    r_name = r_user.name
            elif r_user.employee:
                fn = r_user.employee.first_name or ""
                ln = r_user.employee.last_name or ""
                r_name = f"{fn} {ln}".strip() or (r_user.role.name.title() if r_user.role else "Consultant")
            elif r_user.role:
                r_name = r_user.role.name.title()
            else:
                r_name = "Staff"

            if r.progress_id not in reactions_by_msg:
                reactions_by_msg[r.progress_id] = {}
            if r.emoji not in reactions_by_msg[r.progress_id]:
                reactions_by_msg[r.progress_id][r.emoji] = []
            reactions_by_msg[r.progress_id][r.emoji].append(r_name)

    # Filter messages if client scope
    is_client_scope = user_scope == "CLIENT_ONLY"
    client_msg_count = 0
    internal_msg_count = 0
    system_msg_count = 0

    formatted_messages = []
    last_system_transcript_key = None
    last_system_transcript_time = None

    for u in progress_records:
        is_milestone = not u.user_id or is_automated_milestone_message(u.message)

        if is_milestone:
            msg_key = (u.message or "").strip()
            is_immediate_dup = (
                msg_key == last_system_transcript_key and
                u.created_at and last_system_transcript_time and
                abs((u.created_at - last_system_transcript_time).total_seconds()) <= 5
            )
            if is_immediate_dup:
                continue
            last_system_transcript_key = msg_key
            last_system_transcript_time = u.created_at

            system_msg_count += 1
            channel_tag = "[SYSTEM MILESTONE]"
            sender_str = "System (Automated Event)"
        elif u.user and u.user.role and u.user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"]:
            client_msg_count += 1
            channel_tag = "[CLIENT CHAT]"
            c_name = "Client"
            if u.user.partner and u.user.partner.contact_person:
                c_name = u.user.partner.contact_person
            elif u.user.client and u.user.client.full_name:
                c_name = u.user.client.full_name
            elif u.user.name:
                c_name = u.user.name
            sender_str = f"{c_name} (Client)"
        else:
            # Staff user
            is_internal = (u.channel or "").upper() == "INTERNAL"
            if is_internal:
                if is_client_scope:
                    continue  # Hide internal consultant notes from client-scope export
                internal_msg_count += 1
                channel_tag = "[INTERNAL NOTE]"
            else:
                client_msg_count += 1
                channel_tag = "[CLIENT CHAT]"

            if u.user and u.user.employee:
                fn = u.user.employee.first_name or ""
                ln = u.user.employee.last_name or ""
                st_name = f"{fn} {ln}".strip() or (u.user.role.name.title() if u.user.role else "Consultant")
                st_role = u.user.employee.job_title or (u.user.role.name.title() if u.user.role else "Consultant")
            elif u.user and u.user.role:
                st_name = u.user.role.name.title()
                st_role = u.user.role.name.upper()
            else:
                st_name = "Staff"
                st_role = "Consultant"
            sender_str = f"{st_name} ({st_role})"

        ts = u.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if u.created_at else "N/A"

        # Build message text block
        lines = []
        lines.append(f"[{ts}] {channel_tag} {sender_str}:")
        
        # Quoted reply
        if getattr(u, "quoted_message_text", None):
            q_sender = getattr(u, "quoted_sender_name", None) or "Quoted Message"
            q_text = getattr(u, "quoted_message_text", "").replace("\n", " ")
            lines.append(f"  > In reply to {q_sender}: \"{q_text}\"")

        # Main content
        if getattr(u, "is_deleted", False):
            lines.append("  [Message was deleted by sender]")
        else:
            msg_content = (u.message or "").strip()
            if msg_content:
                for msg_line in msg_content.splitlines():
                    lines.append(f"  {msg_line}")

        # Attachment
        if u.attachment_url or u.attachment_name:
            lines.append(f"  [Attachment: {u.attachment_name or 'Document'} | URL: {u.attachment_url}]")

        # Reactions
        if u.id in reactions_by_msg and reactions_by_msg[u.id]:
            rx_parts = []
            for em, names in reactions_by_msg[u.id].items():
                rx_parts.append(f"{em} ({', '.join(names)})")
            lines.append(f"  [Reactions: {' | '.join(rx_parts)}]")

        formatted_messages.append("\n".join(lines))

    # Build Header
    total_messages_recorded = len(formatted_messages)
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    services_block = "\n".join(services_lines) if services_lines else "  • No service items listed"
    consultants_str = ", ".join(consultant_names)

    header = f"""================================================================================
MCSC ORDER CONVERSATION ARCHIVE & AUDIT TRAIL
================================================================================
Order Number      : {clean_no}
Export Date (UTC) : {now_utc}
Company Name      : {company_name} (Code: {company_code})
Tax Number (NPWP) : {tax_number}
Company Address   : {company_addr}
Director / Rep    : {director}
Key Contact       : {key_contact}
--------------------------------------------------------------------------------
Client / Partner  : {client_name} (Code: {client_code})
Client Contact    : {client_contact_info}
--------------------------------------------------------------------------------
Order Status      : {order_status} | Payment Status: {payment_status}
Invoice / SO No   : Inv: {invoice_no} | SO: {so_no}
Order Created At  : {created_date}
Total Amount      : IDR {total_amount:,.2f}
Assigned Team     : {consultants_str}
--------------------------------------------------------------------------------
Services / Line Items:
{services_block}
================================================================================
CONVERSATION LOG ({total_messages_recorded} Messages | Client: {client_msg_count} | Internal Notes: {internal_msg_count} | System: {system_msg_count})
================================================================================
"""

    body = "\n\n".join(formatted_messages) if formatted_messages else "No chat messages or communication records recorded for this order."

    footer = f"""
================================================================================
END OF ARCHIVE - MCSC SECURE OFFLINE CHAT & ACTIVITY LOG
File Reference: Chat_History_{clean_no}.txt
Generated by PT Multi Corporate Services Consultant (MCSC)
================================================================================
"""

    return header + "\n" + body + "\n" + footer


def save_order_chat_to_dropbox(order_number: str, db: Session) -> dict:
    """
    Saves the complete order chat transcript to Dropbox under:
    /Clients/{company_code}/{order_number}/Chat_History_{order_number}.txt
    """
    clean_no = (order_number or "").strip().upper()
    orders = db.query(models.ClientOrder).options(
        joinedload(models.ClientOrder.company)
    ).filter(func.upper(models.ClientOrder.order_number) == clean_no).all()

    company_code = "General"
    for o in orders:
        if o.company and o.company.company_code:
            company_code = o.company.company_code
            break

    # Order folder
    order_folder = clean_no.replace("/", "_").replace("\\", "_")
    filename = f"Chat_History_{clean_no}.txt"
    dropbox_path = f"/Clients/{company_code}/{order_folder}/{filename}"
    if dropbox_path.startswith("//"):
        dropbox_path = dropbox_path[1:]

    transcript_text = generate_order_chat_transcript(clean_no, db, user_scope="ALL")
    file_bytes = transcript_text.encode("utf-8")

    try:
        from utils.dropbox_client import upload_file
        res = upload_file(file_bytes, dropbox_path)
        if res.get("success"):
            return {
                "success": True,
                "path": res.get("path") or dropbox_path,
                "filename": filename,
                "size_bytes": len(file_bytes)
            }
        else:
            return {
                "success": False,
                "error": res.get("error") or "Unknown Dropbox upload error",
                "path": dropbox_path,
                "filename": filename
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "path": dropbox_path,
            "filename": filename
        }


@router.post("/orders/{order_number}/export-chat-dropbox")
def export_order_chat_to_dropbox(
    order_number: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to export chat for this order")

    clean_no = (order_number or "").strip().upper()
    res = save_order_chat_to_dropbox(clean_no, db)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=f"Failed to save chat to Dropbox: {res.get('error')}")

    log_activity(db, "CHAT_EXPORTED_DROPBOX", f"Chat history for order {clean_no} saved to Dropbox at {res.get('path')}", user_id=current_user.id)
    return {
        "status": "success",
        "message": f"Chat history successfully archived to Dropbox at {res.get('path')}",
        "path": res.get("path"),
        "filename": res.get("filename"),
        "size_bytes": res.get("size_bytes")
    }


@router.get("/orders/{order_number}/download-chat-transcript")
def download_order_chat_transcript(
    order_number: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to download chat transcript for this order")

    clean_no = (order_number or "").strip().upper()
    is_client_user = bool(current_user.role and current_user.role.name.upper() in ["CLIENT", "CUSTOMER", "MEMBER"])
    scope = "CLIENT_ONLY" if is_client_user else "ALL"

    transcript_text = generate_order_chat_transcript(clean_no, db, user_scope=scope)
    filename = f"Chat_History_{clean_no}.txt"

    return Response(
        content=transcript_text,
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )


def get_taggable_users_for_order(order_number: str, db: Session) -> List[models.User]:
    orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    if not orders_in_group:
        return []
        
    is_completed = any(o.status == "COMPLETED" for o in orders_in_group)
    is_pipeline = any(o.status in ["PROSPECT", "PIPELINE"] for o in orders_in_group)
    
    # Consultant and reviewer employee IDs
    consultant_employee_ids = set()
    for o in orders_in_group:
        c_ids = parse_consultant_ids(o.consultant_ids)
        consultant_employee_ids.update(c_ids)
        r_ids = parse_consultant_ids(getattr(o, "reviewer_ids", None))
        consultant_employee_ids.update(r_ids)
        if getattr(o, "reviewer_id", None):
            consultant_employee_ids.add(o.reviewer_id)
        
    active_users = db.query(models.User).options(
        joinedload(models.User.employee),
        joinedload(models.User.role)
    ).filter(models.User.is_active == True).all()
    
    allowed_users = []
    for u in active_users:
        if auth.is_super_admin(u) or is_admin_or_hr(u):
            allowed_users.append(u)
            continue
            
        if is_completed:
            if auth.has_permission(u, "clients_orders_completed", "view", db):
                allowed_users.append(u)
                continue
        elif is_pipeline:
            if auth.has_permission(u, "clients_orders_pipeline", "view", db):
                allowed_users.append(u)
                continue
        else:
            if auth.has_permission(u, "clients_orders_active", "view", db):
                allowed_users.append(u)
                continue
                
        # If assigned consultant and has clients_my permission
        if u.employee and u.employee.id in consultant_employee_ids and auth.has_permission(u, "clients_my", "view", db):
            allowed_users.append(u)
            continue
            
    return allowed_users


@router.get("/orders/{order_number}/taggable-users")
def get_order_taggable_users(
    order_number: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to view taggable users for this order")
    users = get_taggable_users_for_order(order_number, db)
    taggable_list = []
    for u in users:
        emp = u.employee
        name = f"{emp.first_name} {emp.last_name}" if emp else u.email
        taggable_list.append({
            "id": u.id,
            "employee_id": emp.id if emp else None,
            "user_id": u.id,
            "first_name": emp.first_name if emp else "",
            "last_name": emp.last_name if emp else "",
            "displayName": name,
            "email": u.email,
            "job_title": emp.job_title if emp else (u.role.name if u.role else "Staff"),
            "profile_photo": emp.profile_photo if emp else None,
            "type": "employee"
        })
    return taggable_list


@router.post("/orders/{order_number}/progress", response_model=schemas.ClientOrderProgressResponse)
def add_order_progress(
    order_number: str,
    progress_data: schemas.ClientOrderProgressCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    first_order = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).first()
    if not first_order:
        raise HTTPException(status_code=404, detail="Order group not found")
        
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to post chat/progress updates for this order")

    # Determine channel
    target_channel = "INTERNAL"
    if current_user.role and current_user.role.name.upper() == "CLIENT":
        target_channel = "CLIENT"
    elif progress_data.channel and progress_data.channel.upper() in ["CLIENT", "INTERNAL"]:
        target_channel = progress_data.channel.upper()

    db_progress = models.ClientOrderProgress(
        order_number=order_number,
        user_id=current_user.id,
        message=progress_data.message or "",
        channel=target_channel,
        attachment_url=progress_data.attachment_url,
        attachment_name=progress_data.attachment_name,
        quoted_message_id=progress_data.quoted_message_id,
        quoted_message_text=progress_data.quoted_message_text,
        quoted_sender_name=progress_data.quoted_sender_name
    )
    db.add(db_progress)
    db.commit()
    db.refresh(db_progress)

    # Immediately record the sender's read watermark for this channel
    record_sender_read_watermark(order_number, target_channel, current_user.id, db_progress.id, db)
    
    formatted_resp = format_order_progress_response(db_progress, db)
    
    # Tagging and Notifications logic
    message_text = progress_data.message or ""
    
    if target_channel == "INTERNAL":
        tagged_user_ids = set()
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
                        if member.user_id in taggable_user_map:
                            tagged_user_ids.add(member.user_id)

        # Send notifications
        if tagged_user_ids:
            from notification_manager import manager
            
            is_completed = first_order.status == "COMPLETED"
            is_pipeline = first_order.status in ["PROSPECT", "PIPELINE"]
            is_cancelled = first_order.status == "CANCELLED"

            for uid in tagged_user_ids:
                tagged_user = db.query(models.User).filter(models.User.id == uid).first()
                if not tagged_user:
                    continue
                    
                can_view_full_orders = auth.is_super_admin(tagged_user) or is_admin_or_hr(tagged_user)
                if not can_view_full_orders:
                    if is_completed:
                        can_view_full_orders = auth.has_permission(tagged_user, "clients_orders_completed", "view", db)
                    elif is_cancelled:
                        can_view_full_orders = auth.has_permission(tagged_user, "clients_orders_cancelled", "view", db)
                    elif is_pipeline:
                        can_view_full_orders = auth.has_permission(tagged_user, "clients_orders_pipeline", "view", db)
                    else:
                        can_view_full_orders = auth.has_permission(tagged_user, "clients_orders_active", "view", db)
                
                action_url = None
                if can_view_full_orders:
                    if is_completed:
                        base_route = "/business/clients/orders/completed"
                    elif is_cancelled:
                        base_route = "/business/clients/orders/cancelled"
                    elif is_pipeline:
                        base_route = "/business/clients/orders/pipeline"
                    else:
                        base_route = "/business/clients/orders"
                    action_url = f"{base_route}?order={order_number}&chat=true"
                elif auth.has_permission(tagged_user, "clients_my", "view", db):
                    action_url = f"/business/assigned-orders?order={order_number}&chat=true"
                
                if action_url:
                    manager.notify_user_sync(
                        db=db,
                        user_id=uid,
                        title="Tagged in Order Chat",
                        message=f"{formatted_resp.sender_name} tagged you in Order #{order_number}: \"{message_text[:60]}...\"",
                        type="attendance",
                        module="clients",
                        reference_id=first_order.id,
                        action_url=action_url
                    )
    elif target_channel == "CLIENT":
        from notification_manager import manager
        if formatted_resp.is_client:
            # Client sent message -> Notify assigned consultant(s) & Admin
            orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
            consultant_user_ids = set()
            for o in orders_in_group:
                c_ids = parse_consultant_ids(o.consultant_ids)
                for cid in c_ids:
                    emp = db.query(models.Employee).filter(models.Employee.id == cid).first()
                    if emp and emp.user_id:
                        consultant_user_ids.add(emp.user_id)
            
            for uid in consultant_user_ids:
                manager.notify_user_sync(
                    db=db,
                    user_id=uid,
                    title=f"New Client Message - #{order_number}",
                    message=f"Client message on Order #{order_number}: \"{message_text[:60]}...\"",
                    type="attendance",
                    module="clients",
                    reference_id=first_order.id,
                    action_url=f"/business/assigned-orders?order={order_number}&chat=true"
                )
        else:
            # Staff sent message to Client -> Notify Client representative
            client_user_id = None
            if first_order.client and first_order.client.user_id:
                client_user_id = first_order.client.user_id
            if client_user_id and client_user_id != current_user.id:
                manager.notify_user_sync(
                    db=db,
                    user_id=client_user_id,
                    title=f"New Message on Order #{order_number}",
                    message=f"Your consultant posted an update on Order #{order_number}: \"{message_text[:60]}...\"",
                    type="attendance",
                    module="clients",
                    reference_id=first_order.id,
                    action_url=f"/client/chat?order={order_number}"
                )

    return formatted_resp


@router.put("/orders/{order_number}/progress/{progress_id}", response_model=schemas.ClientOrderProgressResponse)
def update_order_progress(
    order_number: str,
    progress_id: int,
    payload: schemas.ClientOrderProgressUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to edit messages for this order")

    clean_no = (order_number or "").strip().upper()
    progress = db.query(models.ClientOrderProgress).filter(
        models.ClientOrderProgress.id == progress_id,
        func.upper(models.ClientOrderProgress.order_number) == clean_no
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Message not found")

    # Automated milestone messages cannot be edited
    if not progress.user_id or is_automated_milestone_message(progress.message):
        raise HTTPException(status_code=400, detail="Automated system milestones cannot be edited")

    # Only author or Admin/Super Admin can edit
    is_author = progress.user_id == current_user.id
    is_admin = is_admin_or_hr(current_user) or auth.is_super_admin(current_user)
    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="You can only edit your own messages")

    new_msg = (payload.message or "").strip()
    if not new_msg:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    progress.message = new_msg
    db.commit()
    db.refresh(progress)

    return format_order_progress_response(progress, db)


@router.delete("/orders/{order_number}/progress/{progress_id}")
def delete_order_progress(
    order_number: str,
    progress_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to delete messages for this order")

    clean_no = (order_number or "").strip().upper()
    progress = db.query(models.ClientOrderProgress).filter(
        models.ClientOrderProgress.id == progress_id,
        func.upper(models.ClientOrderProgress.order_number) == clean_no
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Message not found")

    # Automated milestone messages cannot be deleted
    if not progress.user_id or is_automated_milestone_message(progress.message):
        raise HTTPException(status_code=400, detail="Automated system milestones cannot be deleted")

    # Only author or Admin/Super Admin can delete
    is_author = progress.user_id == current_user.id
    is_admin = is_admin_or_hr(current_user) or auth.is_super_admin(current_user)
    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="You can only delete your own messages")

    # Soft delete: mark as deleted, clear original text and attachment
    progress.is_deleted = True
    progress.message = "This message was deleted"
    progress.attachment_url = None
    progress.attachment_name = None

    # Clear reactions for this deleted message
    db.query(models.ClientOrderProgressReaction).filter(
        models.ClientOrderProgressReaction.progress_id == progress.id
    ).delete()

    db.commit()
    db.refresh(progress)

    return format_order_progress_response(progress, db)


@router.post("/orders/{order_number}/upload-attachment", response_model=schemas.ClientOrderProgressResponse)
async def upload_order_attachment(
    order_number: str,
    file: UploadFile = File(...),
    message: Optional[str] = Form(None),
    quoted_message_id: Optional[int] = Form(None),
    quoted_message_text: Optional[str] = Form(None),
    quoted_sender_name: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Allow client (or authorized user) to upload a document via order chat.
    Stores the document in Dropbox under:
    /Clients/{company_code}/{order_number}/Client Shared Docs/{filename}
    Also saves a local fallback copy, records ClientDocument entry,
    and inserts ClientOrderProgress with the attachment info.
    """
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to upload files for this order")
        
    orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    if not orders_in_group:
        raise HTTPException(status_code=404, detail="Order group not found")
        
    first_order = orders_in_group[0]
    company_id = first_order.company_id
    
    company = None
    if company_id:
        company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
        
    company_code = company.company_code if (company and company.company_code) else (f"comp_{company_id}" if company_id else "General")
    order_folder = (order_number or "No_Order").strip().replace("/", "_").replace("\\", "_")
    
    raw_bytes = await file.read()
    from utils.file_sanitizer import validate_file_security
    file_bytes, sanitized_filename = validate_file_security(raw_bytes, file.filename or "shared_document.pdf", max_size_mb=50, allowed_category="all")
    
    # Destination path: /Clients/{company_code}/{order_number}/Client Shared Docs/{filename}
    destination_path = f"/Clients/{company_code}/{order_folder}/Client Shared Docs/{sanitized_filename}"
    if destination_path.startswith("//"):
        destination_path = destination_path[1:]
        
    # 1. Local disk fallback cache
    local_rel = destination_path.replace("/Clients/", "", 1)
    local_full_path = os.path.join("uploads", local_rel)
    os.makedirs(os.path.dirname(local_full_path), exist_ok=True)
    try:
        with open(local_full_path, "wb") as f_out:
            f_out.write(file_bytes)
    except Exception as local_err:
        print(f"Notice: Failed writing local backup: {local_err}")
        
    # 2. Upload to Dropbox
    try:
        from utils.dropbox_client import upload_file
        res = upload_file(file_bytes, destination_path)
        if not res.get("success"):
            print(f"Notice: Dropbox upload returned: {res.get('error')}")
    except Exception as dbx_err:
        print(f"Notice: Dropbox upload failed, using local disk fallback: {dbx_err}")
        
    # 3. Create ClientDocument record so it appears under legal documents & company docs
    if company_id:
        client_doc = models.ClientDocument(
            company_id=company_id,
            file_name=sanitized_filename,
            file_url=destination_path,
            document_type="Client Shared Docs",
            description=(message.strip() if message and message.strip() else None),
            document_path=destination_path,
            order_number=order_number,
            document_date=datetime.now().date(),
            uploaded_at=datetime.now(),
            uploaded_by=current_user.id
        )
        db.add(client_doc)
        
    # 4. Create ClientOrderProgress chat message
    chat_message = message.strip() if message and message.strip() else f"Uploaded document: {sanitized_filename}"
    db_progress = models.ClientOrderProgress(
        order_number=order_number,
        user_id=current_user.id,
        message=chat_message,
        channel="CLIENT",
        attachment_url=destination_path,
        attachment_name=sanitized_filename,
        quoted_message_id=quoted_message_id,
        quoted_message_text=quoted_message_text,
        quoted_sender_name=quoted_sender_name
    )
    db.add(db_progress)
    db.commit()
    db.refresh(db_progress)

    # Immediately record the sender's read watermark for this channel
    record_sender_read_watermark(order_number, "CLIENT", current_user.id, db_progress.id, db)
    
    formatted_resp = format_order_progress_response(db_progress, db)
    
    # 5. Notify assigned consultants and admins
    from notification_manager import manager
    consultant_user_ids = set()
    for o in orders_in_group:
        c_ids = parse_consultant_ids(o.consultant_ids)
        for cid in c_ids:
            emp = db.query(models.Employee).filter(models.Employee.id == cid).first()
            if emp and emp.user_id:
                consultant_user_ids.add(emp.user_id)
                
    for uid in consultant_user_ids:
        manager.notify_user_sync(
            db=db,
            user_id=uid,
            title=f"New Document Uploaded - #{order_number}",
            message=f"Client uploaded '{sanitized_filename}' on Order #{order_number}",
            type="attendance",
            module="clients",
            reference_id=first_order.id,
            action_url=f"/business/assigned-orders?order={order_number}&chat=true"
        )
        
    return formatted_resp


@router.get("/orders/{order_number}/attachments/preview")
async def preview_order_attachment(
    order_number: str,
    path: str,
    token: Optional[str] = None,
    db: Session = Depends(database.get_db),
    request: Request = None
):
    """
    Securely stream order chat attachment for inline preview by staff/consultants.
    """
    cookie_token = request.cookies.get("hrms_token") if request else None
    header_token = None
    auth_header = request.headers.get("Authorization") if request else None
    if auth_header and auth_header.startswith("Bearer "):
        header_token = auth_header.replace("Bearer ", "", 1)
        
    actual_token = cookie_token or header_token or token
    if not actual_token or actual_token in ("cookie_based_session_active", "null", "undefined"):
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
        
    if not check_order_authorization_for_chat(current_user, order_number, db):
        raise HTTPException(status_code=403, detail="Not authorized to preview attachments for this order")
        
    import mimetypes
    from fastapi.responses import StreamingResponse
    import httpx
    
    # 1. Check local storage
    local_rel = path.replace("/Clients/", "", 1) if path.startswith("/Clients/") else path.replace("/uploads/", "", 1)
    local_path = os.path.join("uploads", local_rel)
    if os.path.exists(local_path):
        mime_type, _ = mimetypes.guess_type(local_path)
        if not mime_type:
            mime_type = "application/octet-stream"
        def iterfile():
            with open(local_path, mode="rb") as f:
                yield from f
        return StreamingResponse(iterfile(), media_type=mime_type)
        
    # 2. Check Dropbox temporary link
    if path.startswith("/Clients/"):
        from utils.dropbox_client import get_temporary_link
        res = get_temporary_link(path)
        if res.get("success") and res.get("link"):
            link = res.get("link")
            async def stream_file():
                async with httpx.AsyncClient() as client:
                    async with client.stream("GET", link) as response:
                        if response.status_code != 200:
                            raise HTTPException(status_code=response.status_code, detail="Dropbox file retrieval failed")
                        async for chunk in response.aiter_bytes():
                            yield chunk
            mime_type, _ = mimetypes.guess_type(os.path.basename(path))
            if not mime_type:
                mime_type = "application/octet-stream"
            return StreamingResponse(stream_file(), media_type=mime_type)
            
    raise HTTPException(status_code=404, detail="Attachment file could not be found")

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
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_orders_pipeline", "edit", db) or auth.has_permission(current_user, "clients_orders_active", "edit", db) or auth.has_permission(current_user, "clients_orders_notary_payments", "edit", db) or is_admin_or_hr(current_user)):
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
    except HTTPException:
        raise
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
        user_id=None,
        message=f"Proforma invoice ({proforma_stage_percent}%) has been generated and saved.",
        channel="CLIENT"
    )
    db.add(db_progress)
    
    # Log activity
    log_activity(db, "INVOICE_FINALIZED", f"Finalized proforma invoice ({proforma_stage_percent}%) for order {order_number} and uploaded to Dropbox", client_id=company.client_id, company_id=company_id, user_id=current_user.id)
    
    db.commit()

    # On-the-fly sync to Accurate Online (Customer + Proforma Sales Order)
    try:
        from utils.accurate_client import AccurateClient
        acc_client = AccurateClient(db)
        if acc_client.config and acc_client.config.auto_sync_on_proforma:
            acc_client.create_sales_order_proforma(first_order)
    except Exception as acc_err:
        print(f"Warning: Accurate proforma sync error: {acc_err}")
    
    # Refresh and return
    for order in orders_in_group:
        db.refresh(order)
        
    consultants_cache = build_consultants_cache(db, orders_in_group)
    return [format_order_response(order, consultants_cache) for order in orders_in_group]

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
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_orders_active", "edit", db) or auth.has_permission(current_user, "clients_orders_completed", "edit", db) or auth.has_permission(current_user, "clients_orders_notary_payments", "edit", db) or is_admin_or_hr(current_user)):
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file to Dropbox: {str(e)}")
        
    # Update orders to INVOICE_GENERATED
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
        user_id=None,
        message="Final invoice has been generated and saved.",
        channel="CLIENT"
    )
    db.add(db_progress)
    
    # Log activity
    log_activity(db, "INVOICE_FINALIZED", f"Finalized final tax invoice for order {order_number} and uploaded to Dropbox", client_id=company.client_id, company_id=company_id, user_id=current_user.id)
    
    db.commit()

    # On-the-fly sync to Accurate Online (Customer + Sales Invoice)
    try:
        from utils.accurate_client import AccurateClient
        acc_client = AccurateClient(db)
        if acc_client.config and acc_client.config.auto_sync_on_final_invoice:
            acc_client.create_sales_invoice(first_order)
    except Exception as acc_err:
        print(f"Warning: Accurate final invoice sync error: {acc_err}")
    
    # Refresh and return
    for order in orders_in_group:
        db.refresh(order)
        
    consultants_cache = build_consultants_cache(db, orders_in_group)
    return [format_order_response(order, consultants_cache) for order in orders_in_group]


@router.get("/documents/expiring")
def get_expiring_documents(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    role_name = current_user.role.name.upper() if current_user.role else ""
    if not (auth.is_super_admin(current_user) or auth.has_permission(current_user, "clients_documents", "view", db) or is_admin_or_hr(current_user) or is_employee_role(current_user)):
        raise HTTPException(status_code=403, detail="Not authorized to view expiring documents")
        
    docs = db.query(models.ClientDocument).options(
        joinedload(models.ClientDocument.company).joinedload(models.ClientCompany.partner)
    ).filter(models.ClientDocument.expiry_date != None).all()
    
    res = []
    for doc in docs:
        if is_employee_role(current_user) and not is_admin_or_hr(current_user):
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


class SendInvoiceEmailPayload(BaseModel):
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None
    send_email: Optional[bool] = True
    send_whatsapp: Optional[bool] = True
    additional_recipients: Optional[List[str]] = None

def parse_additional_recipients(val: Any) -> List[str]:
    if not val:
        return []
    result = []
    if isinstance(val, str):
        for p in val.split(","):
            p_clean = p.strip()
            if p_clean and "@" in p_clean:
                result.append(p_clean)
    elif isinstance(val, (list, tuple, set)):
        for item in val:
            if isinstance(item, str):
                for p in item.split(","):
                    p_clean = p.strip()
                    if p_clean and "@" in p_clean:
                        result.append(p_clean)
    # Remove duplicates preserving order
    return list(dict.fromkeys(result))


@router.post("/orders/{order_number}/send-invoice-email", response_model=List[schemas.ClientOrderResponse])
def send_order_invoice_email(
    order_number: str,
    invoice_type: str,
    payload: Optional[SendInvoiceEmailPayload] = None,
    recipient_email: Optional[str] = Query(None),
    recipient_phone: Optional[str] = Query(None),
    send_email: bool = Query(True),
    send_whatsapp: bool = Query(True),
    additional_recipients: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    eff_send_email = payload.send_email if (payload and payload.send_email is not None) else send_email
    eff_send_whatsapp = payload.send_whatsapp if (payload and payload.send_whatsapp is not None) else send_whatsapp

    if not eff_send_email and not eff_send_whatsapp:
        raise HTTPException(status_code=400, detail="Please select at least one delivery channel (Email or WhatsApp).")

    raw_addl = (payload.additional_recipients if (payload and payload.additional_recipients) else None) or additional_recipients
    cleaned_additional = parse_additional_recipients(raw_addl)

    first_order = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).first()
    if not first_order:
        raise HTTPException(status_code=404, detail="Order group not found")

    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == (first_order.billing_company_id or first_order.company_id)).first()
    if not company:
        raise HTTPException(status_code=404, detail="Billing company not found associated with this order")

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
            with httpx.Client(timeout=30.0) as client:
                response = client.get(link)
                if response.status_code == 200:
                    pdf_content = response.content
                else:
                    raise HTTPException(status_code=500, detail="Failed to download invoice PDF from Dropbox link")
        except HTTPException:
            raise
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

    eff_recipient_email = (payload.recipient_email if payload and payload.recipient_email else recipient_email)
    eff_recipient_phone = (payload.recipient_phone if payload and payload.recipient_phone else recipient_phone)

    final_recipient_email = eff_recipient_email or company.key_contact_email or (company.client.email if company.client else None) or (first_order.client.email if first_order.client else "")
    final_recipient_phone = eff_recipient_phone or company.key_contact_phone or (company.client.phone_number if company.client else None) or (first_order.client.phone_number if first_order.client else "")
    recipient_name = company.key_contact_person or (company.client.contact_person if company.client else None) or (first_order.client.contact_person if first_order.client else "")

    if eff_send_email:
        val_status = str(company.validation_status or "").strip().upper()
        if val_status not in ["VALIDATED", "VERIFIED"]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot send email invoice. Company '{company.company_name}' has not been verified (Current status: {company.validation_status or 'PENDING_VALIDATION'}). Please validate and verify the company profile first."
            )
        if not final_recipient_email or not str(final_recipient_email).strip():
            raise HTTPException(status_code=400, detail="Recipient email address is required when sending email invoice.")
        final_recipient_email = validate_and_clean_email(final_recipient_email, "Recipient Email", required=True)
    elif final_recipient_email:
        final_recipient_email = validate_and_clean_email(final_recipient_email, "Recipient Email", required=False)

    if eff_send_whatsapp:
        if not final_recipient_phone or not str(final_recipient_phone).strip():
            raise HTTPException(status_code=400, detail="Recipient WhatsApp phone number is required when sending WhatsApp notification.")
        final_recipient_phone = validate_and_clean_phone(final_recipient_phone, "Recipient WhatsApp Phone", required=True)
    elif final_recipient_phone:
        final_recipient_phone = validate_and_clean_phone(final_recipient_phone, "Recipient Phone", required=False)

    # Transition order statuses in this group ONLY on initial dispatch (do not change status if already in later/current stage)
    orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    current_status = first_order.status or "DRAFT"
    is_resend = False

    if invoice_type == "proforma":
        # Only transition to WAITING_ON_CLIENT if currently in early initial stage (DRAFT or PROFORMA_GENERATED)
        if current_status in ["DRAFT", "PROFORMA_GENERATED"]:
            update_order_group_status(db, orders_in_group, "WAITING_ON_CLIENT", current_user.id)
        else:
            is_resend = True
    elif invoice_type == "final":
        # Only transition to WAITING_FOR_FINAL_PAYMENT if not already waiting for final payment, final payment completed, or delivered
        if current_status in ["FINAL_DOC_READY", "INVOICE_GENERATED", "FINAL_DOCUMENT_PREPARATION", "REVIEW_DOCS", "IN_PROGRESS", "CONFIRMED", "ORDER_ASSIGNED"]:
            update_order_group_status(db, orders_in_group, "WAITING_FOR_FINAL_PAYMENT", current_user.id)
        else:
            is_resend = True

    # Automatically generate Xendit payment link
    total_amount = sum(item.unit_price for item in orders_in_group)
    proforma_pct = first_order.proforma_stage_percent or 50
    proforma_deduction = first_order.proforma_paid_amount if (first_order.proforma_paid_amount is not None and first_order.proforma_paid_amount > 0) else round((total_amount * proforma_pct) / 100)

    is_group_partially_paid = any(item.payment_status == "PARTIALLY_PAID" for item in orders_in_group) or (first_order.proforma_paid_amount is not None and first_order.proforma_paid_amount > 0)

    if invoice_type == "proforma":
        charge_amount = round((total_amount * proforma_pct) / 100)
    else:
        if is_group_partially_paid:
            charge_amount = max(0, total_amount - proforma_deduction)
        else:
            charge_amount = total_amount

    # Need a new link if final invoice stage or if payment link is not yet created
    needs_new_link = (invoice_type == "final" and is_group_partially_paid) or (not first_order.payment_link)
    payment_url = first_order.payment_link
    if needs_new_link:
        from utils.xendit_client import XenditClient
        xendit = XenditClient()
        try:
            res = xendit.create_invoice(
                external_id=order_number,
                amount=charge_amount,
                payer_email=final_recipient_email or company.key_contact_email or "billing@example.com",
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

    # 1. Send Email with PDF Attachment and CC Recipients
    if eff_send_email and final_recipient_email:
        from utils.email_service import send_invoice_attachment_email
        try:
            email_sent = send_invoice_attachment_email(
                recipient_email=final_recipient_email,
                recipient_name=recipient_name,
                invoice_type=invoice_type,
                pdf_content=pdf_content,
                pdf_filename=doc.file_name,
                payment_url=payment_url,
                cc_emails=cleaned_additional
            )
            if not email_sent:
                print(f"Warning: send_invoice_attachment_email returned False for {final_recipient_email}")
        except Exception as email_err:
            print("Warning: Failed to send invoice attachment email:", email_err)

    # 2. Send WhatsApp Notification & PDF Document via Meta Cloud API
    if eff_send_whatsapp and final_recipient_phone:
        try:
            from utils.whatsapp_service import send_whatsapp_invoice_notification
            formatted_charge = f"IDR {int(charge_amount):,}".replace(",", ".")
            wa_res = send_whatsapp_invoice_notification(
                recipient_phone=final_recipient_phone,
                recipient_name=recipient_name,
                company_name=company.company_name,
                order_number=order_number,
                invoice_type=invoice_type,
                amount_formatted=formatted_charge,
                payment_url=payment_url,
                pdf_content=pdf_content,
                pdf_filename=doc.file_name
            )
            if wa_res.get("success"):
                log_activity(
                    db,
                    "WHATSAPP_SENT",
                    f"{'Re-sent' if is_resend else 'Sent'} WhatsApp {invoice_type} invoice notification & PDF for order {order_number} to {final_recipient_phone}",
                    client_id=company.client_id,
                    company_id=company.id,
                    user_id=current_user.id
                )
        except Exception as wa_err:
            print("Warning: Failed to send WhatsApp invoice notification:", wa_err)

    # Update dispatch tracking on orders in group
    now = datetime.now()
    target_dest = final_recipient_email if eff_send_email else final_recipient_phone
    channel_code = "BOTH" if (eff_send_email and eff_send_whatsapp) else ("EMAIL" if eff_send_email else "WHATSAPP")

    for item in orders_in_group:
        item.last_invoice_sent_at = now
        item.last_invoice_sent_to = target_dest
        item.invoice_delivery_channel = channel_code
        if invoice_type == "proforma":
            item.proforma_sent_at = now
            item.proforma_sent_to = target_dest
        elif invoice_type == "final":
            item.final_invoice_sent_at = now
            item.final_invoice_sent_to = target_dest

    db.commit()

    channel_desc = "Email & WhatsApp" if (eff_send_email and eff_send_whatsapp) else ("Email" if eff_send_email else "WhatsApp")
    details_str = []
    if eff_send_email and final_recipient_email:
        email_str = f"Email: {final_recipient_email}"
        if cleaned_additional:
            email_str += f" (CC: {', '.join(cleaned_additional)})"
        details_str.append(email_str)
    if eff_send_whatsapp and final_recipient_phone:
        details_str.append(f"WhatsApp: {final_recipient_phone}")

    log_activity(
        db, 
        "INVOICE_DISPATCHED", 
        f"{'Re-sent' if is_resend else 'Dispatched'} {invoice_type} invoice for order {order_number} via {channel_desc} ({', '.join(details_str)})", 
        client_id=company.client_id, 
        company_id=company.id, 
        user_id=current_user.id
    )

    # Post automated notification in chat as system milestone
    try:
        inv_label = "Proforma" if invoice_type == "proforma" else "Final"
        delivery_via = f"via {channel_desc}" if channel_desc else ""
        progress_msg = f"{inv_label} invoice has been {'re-sent' if is_resend else 'sent'} to the client {delivery_via}".strip()
        progress_entry = models.ClientOrderProgress(
            order_number=order_number,
            user_id=None,
            message=progress_msg,
            channel="CLIENT"
        )
        db.add(progress_entry)
        db.commit()
    except Exception as chat_err:
        print("Warning: failed to record automated invoice progress entry:", chat_err)

    for ord_obj in orders_in_group:
        db.refresh(ord_obj)
        
    consultants_cache = build_consultants_cache(db, orders_in_group)
    return [format_order_response(ord_obj, consultants_cache) for ord_obj in orders_in_group]


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

    # Determine whether this is proforma or final stage
    proforma_pct = first_order.proforma_stage_percent or 50
    proforma_deduction = first_order.proforma_paid_amount if (first_order.proforma_paid_amount is not None and first_order.proforma_paid_amount > 0) else round((total_amount * proforma_pct) / 100)
    is_final_stage = (first_order.payment_status == "PARTIALLY_PAID" or first_order.is_final_invoice_finalized or first_order.status in ["WAITING_FOR_FINAL_PAYMENT", "FINAL_DOC_READY", "FINAL_DOCUMENT_PREPARATION"])

    if is_final_stage:
        charge_amount = max(0, total_amount - proforma_deduction)
        inv_desc = f"Payment for Service Order {order_number} (Final Invoice)"
    else:
        charge_amount = round((total_amount * proforma_pct) / 100) if first_order.is_proforma_finalized else total_amount
        inv_desc = f"Payment for Service Order {order_number} (Proforma Invoice)"

    if first_order.payment_link and not is_final_stage:
        return {"payment_link": first_order.payment_link}
        
    from utils.xendit_client import XenditClient
    xendit = XenditClient()
    
    billing_company_id = first_order.billing_company_id or first_order.company_id
    billing_company = db.query(models.ClientCompany).filter(models.ClientCompany.id == billing_company_id).first()
    payer_email = (billing_company.key_contact_email if (billing_company and billing_company.key_contact_email) else None) or client.email

    try:
        res = xendit.create_invoice(
            external_id=order_number,
            amount=charge_amount,
            payer_email=payer_email,
            description=inv_desc
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


def process_xendit_invoice_payment(db: Session, payload: dict) -> dict:
    external_id = payload.get("external_id")
    status = (payload.get("status") or "").upper()
    invoice_id = payload.get("id")
    
    if not status:
        return {"status": "ignored", "reason": "missing status in payload"}
        
    # Check if order exists by order_number or xendit_invoice_id
    orders = []
    if external_id:
        orders = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == external_id).all()
    if not orders and invoice_id:
        orders = db.query(models.ClientOrder).filter(models.ClientOrder.xendit_invoice_id == invoice_id).all()
        if orders:
            external_id = orders[0].order_number
            
    if not orders:
        return {"status": "ignored", "reason": "matching order not found"}
        
    if status in ["PAID", "SETTLED"]:
        description = (payload.get("description") or "").lower()
        is_proforma = "proforma" in description
        is_final = "final" in description
        paid_amount_val = payload.get("paid_amount") or payload.get("amount")
        
        total_order_amount = sum(item.unit_price for item in orders)
        first_order = orders[0]

        try:
            parsed_paid_amount = float(paid_amount_val) if paid_amount_val is not None else float(total_order_amount)
        except (ValueError, TypeError):
            parsed_paid_amount = 0.0
        
        # Determine if this payment is specifically for the Final Invoice stage
        is_final_stage = is_final or first_order.status == "WAITING_FOR_FINAL_PAYMENT"

        existing_cash_amount = first_order.proforma_paid_amount or 0.0
        combined_paid = parsed_paid_amount
        is_additional_proforma = False

        if not is_final_stage:
            # Proforma / early payment stage
            if existing_cash_amount > 0 and abs(existing_cash_amount - parsed_paid_amount) > 100:
                combined_paid = existing_cash_amount + parsed_paid_amount
                is_additional_proforma = True

            if combined_paid >= total_order_amount:
                new_payment_status = "PAID"
                # Preserve existing lifecycle status (e.g. IN_PROGRESS) - do not force FINAL_PAYMENT_COMPLETED
                target_lifecycle_status = first_order.status
                message_text = "Additional payment received via Xendit (multiple payments received for this order)."
            else:
                new_payment_status = "PARTIALLY_PAID"
                target_lifecycle_status = "ORDER_ASSIGNED" if (first_order.consultant_ids and len(first_order.consultant_ids) > 0) else "CONFIRMED"
                if is_additional_proforma:
                    message_text = "Additional payment received via Xendit (multiple payments received for this order)."
                else:
                    message_text = "Proforma payment completed successfully via Xendit."
        else:
            # Final invoice payment stage (after deliverables are ready/sent)
            new_payment_status = "PAID"
            target_lifecycle_status = "FINAL_PAYMENT_COMPLETED"
            message_text = "Final Invoice payment completed successfully via Xendit."
            
        # Check if payment status changed
        is_payment_status_changed = any(item.payment_status != new_payment_status for item in orders)

        for item in orders:
            item.payment_status = new_payment_status
            if not is_final_stage and combined_paid > 0:
                item.proforma_paid_amount = combined_paid
            if invoice_id and not item.xendit_invoice_id:
                item.xendit_invoice_id = invoice_id

        # Update lifecycle status strictly when in final invoice stage or when kicking off from draft
        if is_final_stage and first_order.status != "FINAL_PAYMENT_COMPLETED":
            update_order_group_status(db, orders, "FINAL_PAYMENT_COMPLETED", None)
        elif not is_final_stage:
            # Only transition from DRAFT/PROFORMA_GENERATED/WAITING_ON_CLIENT to ORDER_ASSIGNED/CONFIRMED
            transition_orders = [item for item in orders if item.status in ["DRAFT", "PROFORMA_GENERATED", "WAITING_ON_CLIENT"]]
            if transition_orders:
                update_order_group_status(db, transition_orders, target_lifecycle_status, None)

        if is_payment_status_changed:
            existing_progress = db.query(models.ClientOrderProgress).filter(
                models.ClientOrderProgress.order_number == external_id,
                models.ClientOrderProgress.message == message_text
            ).first()

            if not existing_progress:
                progress = models.ClientOrderProgress(
                    order_number=external_id,
                    message=message_text,
                    user_id=None,
                    channel="CLIENT"
                )
                db.add(progress)
            db.commit()

            # On-the-fly sync payment receipt to Accurate Online (idempotent via primeOwing check)
            try:
                from utils.accurate_client import AccurateClient
                acc_client = AccurateClient(db)
                if acc_client.config and acc_client.config.auto_sync_on_payment:
                    acc_client.create_sales_receipt(first_order, payment_amount=parsed_paid_amount, payment_method="Xendit")
            except Exception as acc_err:
                print(f"Warning: Accurate payment receipt sync error: {acc_err}")

            return {
                "status": "success",
                "message": f"Order {external_id} marked as {new_payment_status} (Lifecycle status: {orders[0].status})",
                "payment_status": new_payment_status,
                "lifecycle_status": orders[0].status
            }
        else:
            db.commit()

            # Ensure receipt is recorded only if not already synced to Accurate
            if first_order.accurate_sync_status not in ["PROFORMA_PAID", "PAID"] and not first_order.accurate_receipt_no:
                try:
                    from utils.accurate_client import AccurateClient
                    acc_client = AccurateClient(db)
                    if acc_client.config and acc_client.config.auto_sync_on_payment:
                        acc_client.create_sales_receipt(first_order, payment_amount=parsed_paid_amount, payment_method="Xendit")
                except Exception as acc_err:
                    print(f"Warning: Accurate payment receipt sync error: {acc_err}")

            return {
                "status": "success",
                "message": f"Payment already verified ({new_payment_status}) (Lifecycle status: {orders[0].status})",
                "payment_status": new_payment_status,
                "lifecycle_status": orders[0].status
            }
        
    return {"status": "received", "xendit_status": status}


@router.post("/orders/{orderNumber}/sync-payment")
def sync_order_payment(orderNumber: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    orders = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == orderNumber).all()
    if not orders:
        raise HTTPException(status_code=404, detail="Order not found")
        
    xendit_inv_id = None
    for item in orders:
        if item.xendit_invoice_id:
            xendit_inv_id = item.xendit_invoice_id
            break
            
    if not xendit_inv_id:
        raise HTTPException(status_code=400, detail="No active Xendit invoice is linked to this order.")
        
    from utils.xendit_client import XenditClient
    xendit = XenditClient()
    try:
        inv_data = xendit.get_invoice(xendit_inv_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invoice from Xendit: {str(e)}")
        
    res = process_xendit_invoice_payment(db, inv_data)
    return res


def find_order_signed_documents(db: Session, order_number: str, company: models.ClientCompany):
    """
    Locates pre-docs/signed docs for signature for an order:
    1. Scans DB ClientDocument records for this order tagged with document_type containing 'Pre Docs', 'Pre Doc', 'Signed Docs', 'Signed'
    2. Scans Dropbox folders:
       - /Clients/{company_code}/{order_folder}/Pre Docs
       - /Clients/{company_code}/{order_folder}/Pre-Docs
       - /Clients/{company_code}/{order_folder}/Pre_Docs
       - /Clients/{company_code}/{order_folder}/Pre Documents
       - /Clients/{company_code}/{order_folder}/Signed Docs
       - /Clients/{company_code}/{order_folder}/Signed Documents
       - /Clients/{company_code}/Pre Docs
       - /Clients/{company_code}/No_Order/Pre Docs
    """
    order_folder = order_number.strip()
    
    # Collect all relevant company IDs and codes for this order
    orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_folder).all()
    company_ids = set()
    company_codes = set()
    
    if company:
        if company.id:
            company_ids.add(company.id)
        if company.company_code:
            company_codes.add(company.company_code.strip())
            
    for o in orders_in_group:
        if o.company_id:
            company_ids.add(o.company_id)
        if o.billing_company_id:
            company_ids.add(o.billing_company_id)
        if o.company and o.company.company_code:
            company_codes.add(o.company.company_code.strip())

    # Ensure fallback company_code if empty
    if not company_codes:
        company_codes.add(company.company_code or f"comp_{company.id}")
    
    docs_map = {}
    
    # 1. Check DB documents tagged with order_number or associated with company_ids
    db_query = db.query(models.ClientDocument).filter(
        or_(
            func.upper(models.ClientDocument.order_number) == order_folder.upper(),
            models.ClientDocument.company_id.in_(list(company_ids))
        )
    )
    db_docs = db_query.all()
    
    for d in db_docs:
        fname = d.file_name or (os.path.basename(d.file_url) if d.file_url else "Document")
        dtype = (d.document_type or "").lower()
        furl = (d.file_url or "").lower()
        desc = (d.description or "").lower()
        d_order = (d.order_number or "").strip().upper()
        
        is_signed_or_pre = (
            "pre doc" in dtype or "predoc" in dtype or "pre-doc" in dtype or "pre-signature" in dtype or "pre signature" in dtype or "signed" in dtype or
            "pre doc" in furl or "predoc" in furl or "pre-doc" in furl or "pre-signature" in furl or "signed" in furl or
            "pre doc" in desc or "predoc" in desc or "pre-doc" in desc or "pre-signature" in desc or "signed" in desc or "signature" in desc or
            (d_order == order_folder.upper() and ("pre" in dtype or "sign" in dtype or "pre" in furl or "sign" in furl))
        )
        
        # If explicitly tagged with this order and not invoice
        if d_order == order_folder.upper() and ("invoice" not in dtype and "proforma" not in furl):
            if is_signed_or_pre or "final" not in dtype:
                is_signed_or_pre = True
        
        if is_signed_or_pre and fname:
            key = fname.lower()
            if key not in docs_map:
                clean_desc = d.description or ""
                if clean_desc.strip().lower().startswith("uploaded via"):
                    clean_desc = ""
                docs_map[key] = {
                    "id": d.id,
                    "file_name": fname,
                    "file_url": d.file_url,
                    "document_type": d.document_type or "Pre Document",
                    "description": clean_desc,
                    "source": "database"
                }
                
    # 2. Check Dropbox Pre Docs / Signed Docs folders for all candidate company codes
    try:
        from utils.dropbox_client import list_folder
        candidate_folders = []
        for ccode in company_codes:
            candidate_folders.extend([
                f"/Clients/{ccode}/{order_folder}/Pre-Signature Documents",
                f"/Clients/{ccode}/{order_folder}/Pre-Signature Docs",
                f"/Clients/{ccode}/{order_folder}/Pre Docs",
                f"/Clients/{ccode}/{order_folder}/Pre-Docs",
                f"/Clients/{ccode}/{order_folder}/Pre_Docs",
                f"/Clients/{ccode}/{order_folder}/PreDocs",
                f"/Clients/{ccode}/{order_folder}/Pre Documents",
                f"/Clients/{ccode}/{order_folder}/Signed Documents",
                f"/Clients/{ccode}/{order_folder}/Signed Docs",
                f"/Clients/{ccode}/{order_folder}/Signed-Docs",
                f"/Clients/{ccode}/Pre-Signature Documents",
                f"/Clients/{ccode}/Pre Docs",
                f"/Clients/{ccode}/Signed Documents",
                f"/Clients/{ccode}/Signed Docs",
                f"/Clients/{ccode}/No_Order/Pre-Signature Documents",
                f"/Clients/{ccode}/No_Order/Pre Docs",
                f"/Clients/{ccode}/No_Order/Signed Documents",
                f"/Clients/{ccode}/No_Order/Signed Docs"
            ])
        
        # Deduplicate folder list
        unique_folders = list(dict.fromkeys(candidate_folders))
        for folder_path in unique_folders:
            res = list_folder(folder_path)
            if res.get("success") and res.get("items"):
                for item in res["items"]:
                    if item.get("type") == "file":
                        fname = item.get("name")
                        key = fname.lower()
                        matching_db = next((d for d in db_docs if (d.file_name or "").strip().lower() == fname.strip().lower() or (d.file_url or "").strip().lower().endswith(fname.strip().lower())), None)
                        if key not in docs_map:
                            docs_map[key] = {
                                "id": matching_db.id if matching_db else None,
                                "file_name": fname,
                                "file_url": item.get("path_display") or item.get("path_lower"),
                                "size": item.get("size", 0),
                                "document_type": (matching_db.document_type if matching_db else None) or "Pre Document",
                                "description": (matching_db.description if matching_db else None),
                                "source": "dropbox"
                            }
                        else:
                            if not docs_map[key].get("size") and item.get("size"):
                                docs_map[key]["size"] = item.get("size")
                            if not docs_map[key].get("description") and matching_db and matching_db.description:
                                docs_map[key]["description"] = matching_db.description
    except Exception as e:
        print(f"Warning: Dropbox folder scan for pre/signed docs encountered: {e}")
        
    return list(docs_map.values())


@router.get("/orders/{order_number}/signed-documents")
def get_order_signed_documents(
    order_number: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    first_order = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).first()
    if not first_order:
        raise HTTPException(status_code=404, detail="Order not found")

    company_id = first_order.billing_company_id or first_order.company_id
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    target_company = db.query(models.ClientCompany).filter(models.ClientCompany.id == first_order.company_id).first()
    
    effective_company = company or target_company
    if not effective_company:
        raise HTTPException(status_code=404, detail="Company not found for this order")
        
    recipient_email = (
        (company.key_contact_email if company and company.key_contact_email else None) or
        (target_company.key_contact_email if target_company and target_company.key_contact_email else None) or
        (company.client.email if company and company.client and company.client.email else None) or
        (first_order.client.email if first_order.client else "")
    )
    recipient_name = (
        (company.key_contact_person if company and company.key_contact_person else None) or
        (target_company.key_contact_person if target_company and target_company.key_contact_person else None) or
        (company.client.contact_person if company and company.client else None) or
        (first_order.client.contact_person if first_order.client else "")
    )
    company_name = effective_company.company_name

    docs = find_order_signed_documents(db, order_number, effective_company)

    target_comp = target_company or company
    tax_id = (target_comp.tax_number or "").strip()
    comp_code = (target_comp.company_code or f"comp_{target_comp.id}").strip()
    order_num = order_number.strip()
    zip_password = f"{comp_code}{order_num}"
    
    clean_comp_name = re.sub(r'[/\\?%*:|"<> ]', '_', target_comp.company_name or "Client")
    zip_filename = f"{clean_comp_name}_{order_number}_Pre_Documents.zip"

    comp_val_status = str(effective_company.validation_status or "PENDING_VALIDATION").strip().upper()
    is_comp_verified = comp_val_status in ["VALIDATED", "VERIFIED"]

    return {
        "order_number": order_number,
        "company_name": company_name,
        "company_validation_status": effective_company.validation_status or "PENDING_VALIDATION",
        "is_company_verified": is_comp_verified,
        "target_company_name": target_comp.company_name,
        "target_company_code": comp_code,
        "target_tax_number": tax_id,
        "zip_password": zip_password,
        "zip_filename": zip_filename,
        "recipient_email": recipient_email,
        "recipient_name": recipient_name,
        "documents": docs,
        "total_documents": len(docs)
    }


class SendSignedDocumentsPayload(BaseModel):
    recipient_email: Optional[str] = None
    recipient_name: Optional[str] = None
    custom_message: Optional[str] = None
    additional_recipients: Optional[List[str]] = None
    disable_zip: Optional[bool] = False


@router.post("/orders/{order_number}/send-signed-documents", response_model=List[schemas.ClientOrderResponse])
def send_order_signed_documents(
    order_number: str,
    payload: Optional[SendSignedDocumentsPayload] = None,
    recipient_email: Optional[str] = Query(None),
    recipient_name: Optional[str] = Query(None),
    custom_message: Optional[str] = Query(None),
    additional_recipients: Optional[str] = Query(None),
    disable_zip: Optional[bool] = Query(False),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    final_recipient_email = (payload.recipient_email if payload and payload.recipient_email else recipient_email)
    final_recipient_name = (payload.recipient_name if payload and payload.recipient_name else recipient_name)
    final_custom_message = (payload.custom_message if payload and payload.custom_message else custom_message)
    final_disable_zip = (payload.disable_zip if payload and payload.disable_zip is not None else disable_zip) or False

    raw_addl = (payload.additional_recipients if (payload and payload.additional_recipients) else None) or additional_recipients
    cleaned_additional = parse_additional_recipients(raw_addl)

    orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    if not orders_in_group:
        raise HTTPException(status_code=404, detail="Order group not found")
        
    first_order = orders_in_group[0]
    company_id = first_order.billing_company_id or first_order.company_id
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    target_company = db.query(models.ClientCompany).filter(models.ClientCompany.id == first_order.company_id).first()
    effective_company = company or target_company
    
    if not effective_company:
        raise HTTPException(status_code=404, detail="Company not found for this order")

    # Strict Check: Ensure company is VERIFIED / VALIDATED before sending documents for signature
    val_status = str(effective_company.validation_status or "").strip().upper()
    if val_status not in ["VALIDATED", "VERIFIED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot send documents for signature. Company '{effective_company.company_name}' has not been verified (Current status: {effective_company.validation_status or 'PENDING_VALIDATION'}). Please validate and verify the company profile first."
        )

    if not final_recipient_email or not final_recipient_email.strip():
        final_recipient_email = (
            (company.key_contact_email if company and company.key_contact_email else None) or
            (target_company.key_contact_email if target_company and target_company.key_contact_email else None) or
            (company.client.email if company and company.client and company.client.email else None) or
            (first_order.client.email if first_order.client else "")
        )
        
    if not final_recipient_email or not final_recipient_email.strip():
        raise HTTPException(status_code=400, detail="Recipient email address is required.")

    final_recipient_email = validate_and_clean_email(final_recipient_email, "Recipient Email", required=True)

    if not final_recipient_name:
        final_recipient_name = (
            (company.key_contact_person if company and company.key_contact_person else None) or
            (target_company.key_contact_person if target_company and target_company.key_contact_person else None) or
            (company.client.contact_person if company and company.client else None) or
            effective_company.company_name
        )

    # Locate signed/pre-doc documents from Dropbox / DB
    docs = find_order_signed_documents(db, order_number, effective_company)
    if not docs:
        company_folder_code = effective_company.company_code or f"comp_{effective_company.id}"
        raise HTTPException(
            status_code=400, 
            detail=f"No documents found for order {order_number} in Dropbox folder (/Clients/{company_folder_code}/{order_number}/Pre Docs) or in database. Please upload the documents first."
        )

    # Download document contents
    import httpx
    attachments = []
    
    for doc in docs:
        file_name = doc["file_name"]
        file_url = doc["file_url"]
        content = b""
        
        if file_url.startswith("/Clients/"):
            from utils.dropbox_client import get_temporary_link
            link_res = get_temporary_link(file_url)
            if link_res.get("success") and link_res.get("link"):
                try:
                    with httpx.Client(timeout=45.0) as client:
                        resp = client.get(link_res["link"])
                        if resp.status_code == 200:
                            content = resp.content
                        else:
                            print(f"Warning: Failed to fetch {file_url} (status {resp.status_code})")
                except Exception as dl_err:
                    print(f"Warning: Exception downloading {file_url}: {dl_err}")
            else:
                print(f"Warning: Failed to get temporary link for {file_url}: {link_res.get('error')}")
        elif file_url.startswith("/uploads/"):
            local_path = os.path.join("uploads", file_url.replace("/uploads/", "", 1))
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    content = f.read()
        elif file_url.startswith("http://") or file_url.startswith("https://"):
            try:
                with httpx.Client(timeout=45.0) as client:
                    resp = client.get(file_url)
                    if resp.status_code == 200:
                        content = resp.content
            except Exception as dl_err:
                print(f"Warning: Exception downloading HTTP file {file_url}: {dl_err}")

        if content:
            attachments.append((file_name, content, doc.get("description") or ""))

    if not attachments:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve file contents from storage for signed documents. Please verify the files in Dropbox."
        )

    # Calculate password based on Target Company Entity: [Company Code] + [Order ID] (e.g. A261226MCSX-260015)
    target_comp = target_company or company
    tax_id = (target_comp.tax_number or "").strip()
    comp_code = (target_comp.company_code or f"comp_{target_comp.id}").strip()
    order_num = order_number.strip()
    zip_password = f"{comp_code}{order_num}"
    
    import re
    clean_comp_name = re.sub(r'[/\\?%*:|"<> ]', '_', target_comp.company_name or "Client")
    zip_filename = f"{clean_comp_name}_{order_number}_Pre_Documents.zip"

    # Dispatch email with attachments (direct or password-protected ZIP archive) and CC recipients
    from utils.email_service import send_signed_documents_for_signature_email
    email_sent = send_signed_documents_for_signature_email(
        recipient_email=final_recipient_email.strip(),
        recipient_name=final_recipient_name,
        order_number=order_number,
        company_name=effective_company.company_name,
        attachments=attachments,
        custom_message=final_custom_message,
        company_code=comp_code,
        tax_number=tax_id,
        zip_password=zip_password,
        zip_filename=zip_filename,
        cc_emails=cleaned_additional,
        disable_zip=final_disable_zip
    )

    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to dispatch email. Please check server email/SMTP configuration.")

    # Update lifecycle status to PRE_DOC_SENT_FOR_SIGNATURE
    update_order_group_status(db, orders_in_group, "PRE_DOC_SENT_FOR_SIGNATURE", current_user.id)

    now = datetime.now()
    for item in orders_in_group:
        item.signed_docs_sent_at = now
        item.signed_docs_sent_to = final_recipient_email.strip()

    db.commit()

    # Log activity
    cc_log = f" (CC: {', '.join(cleaned_additional)})" if cleaned_additional else ""
    format_label = "direct unencrypted attachments" if final_disable_zip else "encrypted ZIP archive"
    log_activity(
        db,
        "PRE_DOCS_SENT_FOR_SIGNATURE",
        f"Delivered {len(attachments)} pre-documents for signature ({format_label}) to {final_recipient_email}{cc_log} for order {order_number}",
        client_id=effective_company.client_id,
        company_id=effective_company.id,
        user_id=current_user.id
    )

    # Post automated notification in chat
    try:
        container_desc = "as direct attachments" if final_disable_zip else "in password-protected ZIP archive"
        progress_msg = f"Pre-documents for signature ({len(attachments)} file(s)) {container_desc} have been emailed to client ({final_recipient_email.strip()})"
        progress_entry = models.ClientOrderProgress(
            order_number=order_number,
            user_id=None,
            message=progress_msg,
            channel="CLIENT"
        )
        db.add(progress_entry)
        db.commit()
    except Exception as chat_err:
        print("Warning: failed to record automated progress entry:", chat_err)

    for ord_obj in orders_in_group:
        db.refresh(ord_obj)
        
    consultants_cache = build_consultants_cache(db, orders_in_group)
    return [format_order_response(ord_obj, consultants_cache) for ord_obj in orders_in_group]


def find_order_final_documents(db: Session, order_number: str, company: models.ClientCompany):
    """
    Locates deliverable / final documents for an order by checking:
    1. Database ClientDocument records associated with this order_number (non-invoice, non-chat files).
    2. Dropbox order folders (/Clients/{company_code}/{order_number}/Final Documents/ etc.).
    Returns a list of dicts: [{'file_name': str, 'file_url': str, 'size': int, 'source': str, 'document_type': str}]
    """
    company_code = company.company_code or f"comp_{company.id}"
    order_folder = (order_number or "No_Order").strip().replace("/", "_").replace("\\", "_")
    
    docs_map = {}
    
    # 1. Check DB records
    db_docs = db.query(models.ClientDocument).filter(
        models.ClientDocument.order_number == order_number
    ).all()
    
    for d in db_docs:
        dtype = (d.document_type or "").strip().lower()
        furl = (d.file_url or "").strip().lower()
        desc = (d.description or "").strip().lower()
        fname = d.file_name or ""
        
        # Exclude invoices and internal chat uploads
        is_invoice = "invoice" in dtype or "proforma" in furl or "invoice" in furl
        is_chat_upload = dtype == "chat_upload" or "client shared docs" in dtype
        
        # Match explicit final docs or any deliverable tagged with this order
        is_final = (
            ("final" in dtype or "deliver" in dtype or "/final" in furl or "/deliver" in furl or "final" in desc) or
            (not is_invoice and not is_chat_upload)
        )
        
        if is_final and not is_invoice and fname:
            key = fname.lower()
            if key not in docs_map:
                clean_desc = d.description or ""
                if clean_desc.strip().lower().startswith("uploaded via"):
                    clean_desc = ""
                docs_map[key] = {
                    "id": d.id,
                    "file_name": fname,
                    "file_url": d.file_url,
                    "document_type": d.document_type or "Final Document",
                    "description": clean_desc,
                    "source": "database"
                }

    # 2. Check Dropbox Final Documents folders only if no database records were found
    if not docs_map:
        try:
            from utils.dropbox_client import list_folder
            candidate_folders = [
                f"/Clients/{company_code}/{order_folder}/Final Documents",
                f"/Clients/{company_code}/{order_folder}/Final Docs"
            ]
            
            for folder_path in candidate_folders:
                res = list_folder(folder_path)
                if res.get("success") and res.get("items"):
                    for item in res["items"]:
                        if item.get("type") == "file":
                            fname = item.get("name")
                            key = fname.lower()
                            if key not in docs_map:
                                docs_map[key] = {
                                    "id": None,
                                    "file_name": fname,
                                    "file_url": item.get("path_display") or item.get("path_lower"),
                                    "size": item.get("size", 0),
                                    "document_type": "Final Document",
                                    "source": "dropbox"
                                }
        except Exception as e:
            print(f"Warning: Dropbox folder scan for final docs encountered: {e}")

    return list(docs_map.values())


@router.get("/orders/{order_number}/document-count")
def get_order_document_count(
    order_number: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    clean_ord = (order_number or "").strip()
    if not clean_ord:
        return {"order_number": order_number, "count": 0}
        
    count = db.query(models.ClientDocument).filter(
        func.upper(models.ClientDocument.order_number) == clean_ord.upper()
    ).count()
    
    return {"order_number": clean_ord, "count": count}


@router.get("/orders/{order_number}/final-documents")
def get_order_final_documents(
    order_number: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    first_order = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).first()
    if not first_order:
        raise HTTPException(status_code=404, detail="Order not found")

    company_id = first_order.billing_company_id or first_order.company_id
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    target_company = db.query(models.ClientCompany).filter(models.ClientCompany.id == first_order.company_id).first()
    
    effective_company = company or target_company
    if not effective_company:
        raise HTTPException(status_code=404, detail="Company not found for this order")
        
    recipient_email = (
        (company.key_contact_email if company and company.key_contact_email else None) or
        (target_company.key_contact_email if target_company and target_company.key_contact_email else None) or
        (company.client.email if company and company.client and company.client.email else None) or
        (first_order.client.email if first_order.client else "")
    )
    recipient_name = (
        (company.key_contact_person if company and company.key_contact_person else None) or
        (target_company.key_contact_person if target_company and target_company.key_contact_person else None) or
        (company.client.contact_person if company and company.client else None) or
        (first_order.client.contact_person if first_order.client else "")
    )
    company_name = effective_company.company_name

    docs = find_order_final_documents(db, order_number, effective_company)

    target_comp = target_company or company
    tax_id = (target_comp.tax_number or "").strip()
    comp_code = (target_comp.company_code or f"comp_{target_comp.id}").strip()
    order_num = order_number.strip()
    zip_password = f"{comp_code}{order_num}"
    
    import re
    clean_comp_name = re.sub(r'[/\\?%*:|"<> ]', '_', target_comp.company_name or "Client")
    zip_filename = f"{clean_comp_name}_{order_number}_Final_Documents.zip"

    comp_val_status = str(effective_company.validation_status or "PENDING_VALIDATION").strip().upper()
    is_comp_verified = comp_val_status in ["VALIDATED", "VERIFIED"]

    return {
        "order_number": order_number,
        "company_name": company_name,
        "company_validation_status": effective_company.validation_status or "PENDING_VALIDATION",
        "is_company_verified": is_comp_verified,
        "target_company_name": target_comp.company_name,
        "target_company_code": comp_code,
        "target_tax_number": tax_id,
        "zip_password": zip_password,
        "zip_filename": zip_filename,
        "recipient_email": recipient_email,
        "recipient_name": recipient_name,
        "documents": docs,
        "total_documents": len(docs)
    }


class SendFinalDocumentsPayload(BaseModel):
    recipient_email: Optional[str] = None
    recipient_name: Optional[str] = None
    custom_message: Optional[str] = None
    additional_recipients: Optional[List[str]] = None
    disable_zip: Optional[bool] = False


@router.post("/orders/{order_number}/send-final-documents", response_model=List[schemas.ClientOrderResponse])
def send_order_final_documents(
    order_number: str,
    payload: Optional[SendFinalDocumentsPayload] = None,
    recipient_email: Optional[str] = Query(None),
    recipient_name: Optional[str] = Query(None),
    custom_message: Optional[str] = Query(None),
    additional_recipients: Optional[str] = Query(None),
    disable_zip: Optional[bool] = Query(False),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    final_recipient_email = (payload.recipient_email if payload and payload.recipient_email else recipient_email)
    final_recipient_name = (payload.recipient_name if payload and payload.recipient_name else recipient_name)
    final_custom_message = (payload.custom_message if payload and payload.custom_message else custom_message)
    final_disable_zip = (payload.disable_zip if payload and payload.disable_zip is not None else disable_zip) or False

    raw_addl = (payload.additional_recipients if (payload and payload.additional_recipients) else None) or additional_recipients
    cleaned_additional = parse_additional_recipients(raw_addl)

    orders_in_group = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == order_number).all()
    if not orders_in_group:
        raise HTTPException(status_code=404, detail="Order group not found")
        
    first_order = orders_in_group[0]
    company_id = first_order.billing_company_id or first_order.company_id
    company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    target_company = db.query(models.ClientCompany).filter(models.ClientCompany.id == first_order.company_id).first()
    effective_company = company or target_company
    
    if not effective_company:
        raise HTTPException(status_code=404, detail="Company not found for this order")

    # Strict Check: Ensure company is VERIFIED / VALIDATED before sending final deliverable documents
    val_status = str(effective_company.validation_status or "").strip().upper()
    if val_status not in ["VALIDATED", "VERIFIED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot send final deliverable documents. Company '{effective_company.company_name}' has not been verified (Current status: {effective_company.validation_status or 'PENDING_VALIDATION'}). Please validate and verify the company profile first."
        )

    if not final_recipient_email or not final_recipient_email.strip():
        final_recipient_email = (
            (company.key_contact_email if company and company.key_contact_email else None) or
            (target_company.key_contact_email if target_company and target_company.key_contact_email else None) or
            (company.client.email if company and company.client and company.client.email else None) or
            (first_order.client.email if first_order.client else "")
        )
        
    if not final_recipient_email or not final_recipient_email.strip():
        raise HTTPException(status_code=400, detail="Recipient email address is required.")

    final_recipient_email = validate_and_clean_email(final_recipient_email, "Recipient Email", required=True)

    if not final_recipient_name:
        final_recipient_name = (
            (company.key_contact_person if company and company.key_contact_person else None) or
            (target_company.key_contact_person if target_company and target_company.key_contact_person else None) or
            (company.client.contact_person if company and company.client else None) or
            effective_company.company_name
        )

    # Locate deliverable documents from Dropbox / DB
    docs = find_order_final_documents(db, order_number, effective_company)
    if not docs:
        company_folder_code = effective_company.company_code or f"comp_{effective_company.id}"
        raise HTTPException(
            status_code=400, 
            detail=f"No final documents found for order {order_number} in Dropbox folder (/Clients/{company_folder_code}/{order_number}/Final Documents) or in database. Please upload the final documents first."
        )

    # Download document contents
    import httpx
    attachments = []
    
    for doc in docs:
        file_name = doc["file_name"]
        file_url = doc["file_url"]
        content = b""
        
        if file_url.startswith("/Clients/"):
            from utils.dropbox_client import get_temporary_link
            link_res = get_temporary_link(file_url)
            if link_res.get("success") and link_res.get("link"):
                try:
                    with httpx.Client(timeout=45.0) as client:
                        resp = client.get(link_res["link"])
                        if resp.status_code == 200:
                            content = resp.content
                        else:
                            print(f"Warning: Failed to fetch {file_url} (status {resp.status_code})")
                except Exception as dl_err:
                    print(f"Warning: Exception downloading {file_url}: {dl_err}")
            else:
                print(f"Warning: Failed to get temporary link for {file_url}: {link_res.get('error')}")
        elif file_url.startswith("/uploads/"):
            local_path = os.path.join("uploads", file_url.replace("/uploads/", "", 1))
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    content = f.read()
        elif file_url.startswith("http://") or file_url.startswith("https://"):
            try:
                with httpx.Client(timeout=45.0) as client:
                    resp = client.get(file_url)
                    if resp.status_code == 200:
                        content = resp.content
            except Exception as dl_err:
                print(f"Warning: Exception downloading HTTP file {file_url}: {dl_err}")

        if content:
            attachments.append((file_name, content))

    if not attachments:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve file contents from storage for final documents. Please verify the files in Dropbox."
        )

    # Calculate password based on Target Company Entity: [Company Code] + [Order ID] (e.g. A261226MCSX-260015)
    target_comp = target_company or company
    tax_id = (target_comp.tax_number or "").strip()
    comp_code = (target_comp.company_code or f"comp_{target_comp.id}").strip()
    order_num = order_number.strip()
    zip_password = f"{comp_code}{order_num}"
    
    import re
    clean_comp_name = re.sub(r'[/\\?%*:|"<> ]', '_', target_comp.company_name or "Client")
    zip_filename = f"{clean_comp_name}_{order_number}_Final_Documents.zip"

    # Dispatch email with attachments (direct or password-protected ZIP archive) and CC recipients
    from utils.email_service import send_final_documents_email
    email_sent = send_final_documents_email(
        recipient_email=final_recipient_email.strip(),
        recipient_name=final_recipient_name,
        order_number=order_number,
        company_name=effective_company.company_name,
        attachments=attachments,
        custom_message=final_custom_message,
        company_code=comp_code,
        tax_number=tax_id,
        zip_password=zip_password,
        zip_filename=zip_filename,
        cc_emails=cleaned_additional,
        disable_zip=final_disable_zip
    )

    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to dispatch email. Please check server email/SMTP configuration.")

    # Update lifecycle status to SOFT_COPY_DELIVERED only if not already delivered or completed
    current_status = first_order.status or "FINAL_PAYMENT_COMPLETED"
    is_resend_docs = current_status in ["SOFT_COPY_DELIVERED", "HARD_COPY_DELIVERED", "COMPLETED"]
    
    if not is_resend_docs:
        update_order_group_status(db, orders_in_group, "SOFT_COPY_DELIVERED", current_user.id)

    now = datetime.now()
    for item in orders_in_group:
        item.deliverables_sent_at = now
        item.deliverables_sent_to = final_recipient_email.strip()

    db.commit()

    # Log activity
    cc_log = f" (CC: {', '.join(cleaned_additional)})" if cleaned_additional else ""
    format_label = "direct unencrypted attachments" if final_disable_zip else "encrypted ZIP archive"
    log_activity(
        db,
        "FINAL_DOCUMENTS_DISPATCHED",
        f"Delivered {len(attachments)} final documents ({format_label}) to {final_recipient_email}{cc_log} for order {order_number}",
        client_id=effective_company.client_id,
        company_id=effective_company.id,
        user_id=current_user.id
    )
    log_activity(
        db,
        "DOCUMENTS_SENT",
        f"{'Re-sent' if is_resend_docs else 'Emailed'} {len(attachments)} final document(s) for order {order_number} to {final_recipient_email.strip()}",
        client_id=effective_company.client_id,
        company_id=effective_company.id,
        user_id=current_user.id
    )

    # Post automated notification in chat
    try:
        container_desc = "as direct attachments" if final_disable_zip else "in password-protected ZIP archive"
        progress_msg = f"Final documents ({len(attachments)} file(s)) {container_desc} have been {'re-sent' if is_resend_docs else 'emailed'} to client ({final_recipient_email.strip()})"
        progress_entry = models.ClientOrderProgress(
            order_number=order_number,
            user_id=None,
            message=progress_msg,
            channel="CLIENT"
        )
        db.add(progress_entry)
        db.commit()
    except Exception as chat_err:
        print("Warning: failed to record automated progress entry:", chat_err)

    for ord_obj in orders_in_group:
        db.refresh(ord_obj)
        
    consultants_cache = build_consultants_cache(db, orders_in_group)
    return [format_order_response(ord_obj, consultants_cache) for ord_obj in orders_in_group]


public_router = APIRouter(
    prefix="/api/clients/payments",
    tags=["payments"]
)

@public_router.post("/webhook")
async def xendit_webhook(request: Request, db: Session = Depends(database.get_db)):
    x_token = request.headers.get("x-callback-token")
    env_token = os.getenv("XENDIT_CALLBACK_TOKEN", "").strip()
    is_prod = os.getenv("ENV", "development").lower() == "production"
    
    if not env_token:
        if is_prod:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="XENDIT_CALLBACK_TOKEN is not configured on the server."
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized webhook source: XENDIT_CALLBACK_TOKEN is required."
        )
        
    if not x_token or x_token != env_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized webhook source: Invalid callback token."
        )
        
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
    res = process_xendit_invoice_payment(db, payload)
    return res


public_orders_router = APIRouter(
    prefix="/api/public/orders",
    tags=["public_orders"]
)

@public_orders_router.get("/{order_number}/track", response_model=schemas.PublicOrderTrackResponse)
def track_public_order(
    order_number: str,
    company_id: Optional[str] = Query(None, description="Company ID (Code or Number) for verification"),
    tax_id: Optional[str] = Query(None, description="Legacy Company Tax ID (NPWP) for fallback verification"),
    db: Session = Depends(database.get_db)
):
    import re
    clean_order_no = order_number.strip().upper()
    
    # Accept either company_id or legacy tax_id
    raw_identifier = (company_id or tax_id or "").strip()
    if not raw_identifier:
        raise HTTPException(status_code=400, detail="Company ID is required to track order.")
        
    clean_input = re.sub(r'[^a-zA-Z0-9]', '', raw_identifier).upper()
    if not clean_input:
        raise HTTPException(status_code=400, detail="Invalid Company ID format.")

    orders = db.query(models.ClientOrder).filter(
        func.upper(models.ClientOrder.order_number) == clean_order_no
    ).all()
    if not orders:
        raise HTTPException(status_code=404, detail="Order not found. Please verify your Order ID and Company ID.")
    
    first_order = orders[0]
    
    # Retrieve associated Companies for verification
    associated_companies = []
    if first_order.company:
        associated_companies.append(first_order.company)
    elif first_order.company_id:
        c = db.query(models.ClientCompany).filter(models.ClientCompany.id == first_order.company_id).first()
        if c:
            associated_companies.append(c)

    if first_order.billing_company and first_order.billing_company not in associated_companies:
        associated_companies.append(first_order.billing_company)
    elif first_order.billing_company_id:
        bc = db.query(models.ClientCompany).filter(models.ClientCompany.id == first_order.billing_company_id).first()
        if bc and bc not in associated_companies:
            associated_companies.append(bc)
            
    # Check if input matches any valid identifier of the associated company
    is_verified = False
    for comp in associated_companies:
        comp_id_str = str(comp.id)
        comp_code = (comp.company_code or "").strip().upper()
        clean_comp_code = re.sub(r'[^a-zA-Z0-9]', '', comp_code)
        comp_tax = (comp.tax_number or "").strip().upper()
        clean_comp_tax = re.sub(r'[^a-zA-Z0-9]', '', comp_tax)
        acc_cust = (comp.accurate_customer_no or "").strip().upper()
        clean_acc_cust = re.sub(r'[^a-zA-Z0-9]', '', acc_cust)

        possible_matches = {
            comp_id_str,
            f"COMP_{comp_id_str}",
            f"COMP{comp_id_str}",
            f"CUST_{comp_id_str}",
            f"CUST{comp_id_str}",
            comp_code,
            clean_comp_code,
            comp_tax,
            clean_comp_tax,
            acc_cust,
            clean_acc_cust,
        }
        possible_matches.discard("")

        if clean_input in possible_matches or raw_identifier.upper() in possible_matches:
            is_verified = True
            break

    # Secondary check: verify against client code if client exists
    if not is_verified and first_order.client and first_order.client.client_code:
        client_code_clean = re.sub(r'[^a-zA-Z0-9]', '', (first_order.client.client_code or "").strip()).upper()
        if clean_input == client_code_clean or raw_identifier.upper() == (first_order.client.client_code or "").strip().upper():
            is_verified = True

    if not is_verified:
        raise HTTPException(
            status_code=403, 
            detail="Company ID verification failed. The provided Company ID does not match the company registered to this order."
        )

    service_title = first_order.job_title
    job_id = first_order.job_id
    branch_name = first_order.branch_name or "Headquarters"
    
    company_name = None
    company_code = None
    company_id_val = first_order.company_id or first_order.billing_company_id
    
    if first_order.company:
        company_name = first_order.company.company_name
        company_code = first_order.company.company_code
    elif first_order.billing_company:
        company_name = first_order.billing_company.company_name
        company_code = first_order.billing_company.company_code
        
    client_name = None
    if first_order.client:
        client_name = first_order.client.contact_person
        
    # Calculate progress percentage & milestone stages
    status_upper = (first_order.status or "CONFIRMED").upper()
    
    stage_weights = {
        "DRAFT": 10,
        "PROSPECT": 15,
        "PIPELINE": 20,
        "CONFIRMED": 35,
        "UNDER_REVIEW": 50,
        "IN_PROGRESS": 70,
        "DELIVERABLES_READY": 85,
        "COMPLETED": 100,
        "CANCELLED": 0
    }
    progress_percentage = stage_weights.get(status_upper, 50)
    
    milestones = [
        {"key": "order_placed", "title": "Order Placed", "completed": True},
        {"key": "consultant_assigned", "title": "Consultant Assigned", "completed": progress_percentage >= 35},
        {"key": "in_progress", "title": "In Progress & Processing", "completed": progress_percentage >= 70},
        {"key": "review", "title": "Deliverables & Review", "completed": progress_percentage >= 85},
        {"key": "completed", "title": "Order Completed", "completed": progress_percentage == 100},
    ]
    
    # Fetch client-facing messages & milestones (channel="CLIENT" or is_milestone)
    all_updates = db.query(models.ClientOrderProgress)\
        .filter(func.upper(models.ClientOrderProgress.order_number) == clean_order_no)\
        .order_by(models.ClientOrderProgress.created_at.asc())\
        .all()
        
    client_messages = []
    for u in all_updates:
        is_milestone = not u.user_id or is_automated_milestone_message(u.message)
        # Exclude internal channel non-milestone messages
        if (u.channel or "").upper() == "INTERNAL" and not is_milestone:
            continue
        client_messages.append(format_order_progress_response(u, db))
        
    return schemas.PublicOrderTrackResponse(
        order_number=first_order.order_number,
        job_title=service_title,
        job_id=job_id,
        company_name=company_name,
        company_code=company_code,
        company_id=company_id_val,
        client_name=client_name,
        branch_name=branch_name,
        status=first_order.status,
        payment_status=first_order.payment_status or "UNPAID",
        created_at=first_order.created_at or datetime.utcnow(),
        progress_percentage=progress_percentage,
        milestones=milestones,
        messages=client_messages
    )


@public_orders_router.post("/{order_number}/chat", response_model=schemas.ClientOrderProgressResponse)
def post_public_order_chat(
    order_number: str,
    req: schemas.PublicSendMessageRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    clean_order_no = order_number.strip().upper()
    orders = db.query(models.ClientOrder).filter(
        func.upper(models.ClientOrder.order_number) == clean_order_no
    ).all()
    if not orders:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    first_order = orders[0]
    
    db_progress = models.ClientOrderProgress(
        order_number=first_order.order_number,
        user_id=current_user.id,
        message=req.message.strip(),
        channel="CLIENT",
        attachment_url=req.attachment_url,
        attachment_name=req.attachment_name
    )
    db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    
    # Immediately record the sender's read watermark for this channel
    record_sender_read_watermark(first_order.order_number, "CLIENT", current_user.id, db_progress.id, db)
    
    # Notify assigned consultants
    c_ids = parse_consultant_ids(first_order.consultant_ids)
    sender_display = current_user.name
    try:
        from notification_manager import manager
        for emp_id in c_ids:
            emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
            if emp and emp.user_id:
                manager.notify_user_sync(
                    db=db,
                    user_id=emp.user_id,
                    title=f"New Client Message: {first_order.order_number}",
                    message=f"{sender_display}: {req.message.strip()[:100]}",
                    type="CLIENT_CHAT",
                    module="clients",
                    action_url=f"/business/assigned-orders?order={first_order.order_number}&chat=true"
                )
    except Exception as e:
        print("Warning: failed to dispatch notification:", e)
            
    return format_order_progress_response(db_progress, db)


@public_orders_router.post("/{order_number}/upload-attachment", response_model=schemas.ClientOrderProgressResponse)
async def upload_public_order_attachment(
    order_number: str,
    file: UploadFile = File(...),
    message: Optional[str] = Form(None),
    quoted_message_id: Optional[int] = Form(None),
    quoted_message_text: Optional[str] = Form(None),
    quoted_sender_name: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    clean_order_no = order_number.strip().upper()
    orders_in_group = db.query(models.ClientOrder).filter(
        func.upper(models.ClientOrder.order_number) == clean_order_no
    ).all()
    if not orders_in_group:
        raise HTTPException(status_code=404, detail="Order not found")
        
    first_order = orders_in_group[0]
    company_id = first_order.company_id
    
    company = None
    if company_id:
        company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
        
    company_code = company.company_code if (company and company.company_code) else (f"comp_{company_id}" if company_id else "General")
    order_folder = (first_order.order_number or "No_Order").strip().replace("/", "_").replace("\\", "_")
    
    raw_bytes = await file.read()
    from utils.file_sanitizer import validate_file_security
    file_bytes, sanitized_filename = validate_file_security(raw_bytes, file.filename or "shared_document.pdf", max_size_mb=50, allowed_category="all")
    
    destination_path = f"/Clients/{company_code}/{order_folder}/Client Shared Docs/{sanitized_filename}"
    if destination_path.startswith("//"):
        destination_path = destination_path[1:]
        
    # 1. Local disk fallback cache
    local_rel = destination_path.replace("/Clients/", "", 1)
    local_full_path = os.path.join("uploads", local_rel)
    os.makedirs(os.path.dirname(local_full_path), exist_ok=True)
    try:
        with open(local_full_path, "wb") as f_out:
            f_out.write(file_bytes)
    except Exception as local_err:
        print(f"Notice: Failed writing local backup: {local_err}")
        
    # 2. Upload to Dropbox
    dropbox_url = None
    try:
        from utils.dropbox_client import upload_file, get_shared_link
        res = upload_file(file_bytes, destination_path)
        if res.get("success"):
            link_res = get_shared_link(destination_path)
            if link_res.get("success") and link_res.get("url"):
                dropbox_url = link_res.get("url")
    except Exception as dbx_err:
        print(f"Notice: Dropbox upload failed, using local disk fallback: {dbx_err}")
        
    attachment_url = dropbox_url if dropbox_url else f"/uploads/{local_rel}".replace("\\", "/")
    
    # 3. Create ClientDocument record
    if company_id:
        client_doc = models.ClientDocument(
            company_id=company_id,
            file_name=sanitized_filename,
            file_url=attachment_url,
            document_type="CHAT_UPLOAD",
            description=(message.strip() if (message and message.strip()) else None),
            order_number=first_order.order_number,
            uploaded_by=current_user.id
        )
        db.add(client_doc)
        db.commit()
        
    # 4. Insert ClientOrderProgress record
    chat_text = message.strip() if (message and message.strip()) else f"Uploaded attachment: {sanitized_filename}"
    db_progress = models.ClientOrderProgress(
        order_number=first_order.order_number,
        user_id=current_user.id,
        message=chat_text,
        channel="CLIENT",
        attachment_url=attachment_url,
        attachment_name=sanitized_filename,
        quoted_message_id=quoted_message_id,
        quoted_message_text=quoted_message_text,
        quoted_sender_name=quoted_sender_name
    )
    db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    
    # Immediately record the sender's read watermark for this channel
    record_sender_read_watermark(first_order.order_number, "CLIENT", current_user.id, db_progress.id, db)
    
    # 5. Notify assigned consultants
    c_ids = parse_consultant_ids(first_order.consultant_ids)
    sender_display = current_user.name
    try:
        from notification_manager import manager
        for emp_id in c_ids:
            emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
            if emp and emp.user_id:
                manager.notify_user_sync(
                    db=db,
                    user_id=emp.user_id,
                    title=f"New Document Uploaded: {first_order.order_number}",
                    message=f"{sender_display} uploaded {sanitized_filename}",
                    type="DOCUMENT_UPLOAD",
                    module="clients",
                    action_url=f"/business/assigned-orders?order={first_order.order_number}&chat=true"
                )
    except Exception as e:
        print("Warning: failed to dispatch upload notification:", e)
        
    return format_order_progress_response(db_progress, db)


@public_orders_router.put("/{order_number}/chat/{progress_id}", response_model=schemas.ClientOrderProgressResponse)
def update_public_order_chat(
    order_number: str,
    progress_id: int,
    payload: schemas.ClientOrderProgressUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    clean_order_no = order_number.strip().upper()
    progress = db.query(models.ClientOrderProgress).filter(
        models.ClientOrderProgress.id == progress_id,
        func.upper(models.ClientOrderProgress.order_number) == clean_order_no
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Message not found")

    if not progress.user_id or is_automated_milestone_message(progress.message):
        raise HTTPException(status_code=400, detail="Automated system milestones cannot be edited")

    is_author = progress.user_id == current_user.id
    is_admin = is_admin_or_hr(current_user) or auth.is_super_admin(current_user)
    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="You can only edit your own messages")

    new_msg = (payload.message or "").strip()
    if not new_msg:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")

    progress.message = new_msg
    db.commit()
    db.refresh(progress)
    return format_order_progress_response(progress, db)


@public_orders_router.delete("/{order_number}/chat/{progress_id}")
def delete_public_order_chat(
    order_number: str,
    progress_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    clean_order_no = order_number.strip().upper()
    progress = db.query(models.ClientOrderProgress).filter(
        models.ClientOrderProgress.id == progress_id,
        func.upper(models.ClientOrderProgress.order_number) == clean_order_no
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Message not found")

    if not progress.user_id or is_automated_milestone_message(progress.message):
        raise HTTPException(status_code=400, detail="Automated system milestones cannot be deleted")

    is_author = progress.user_id == current_user.id
    is_admin = is_admin_or_hr(current_user) or auth.is_super_admin(current_user)
    if not (is_author or is_admin):
        raise HTTPException(status_code=403, detail="You can only delete your own messages")

    db.delete(progress)
    db.commit()
    return {"message": "Message deleted successfully", "id": progress_id}


@public_orders_router.post("/{order_number}/chat/{progress_id}/reactions")
def toggle_public_order_chat_reaction(
    order_number: str,
    progress_id: int,
    payload: schemas.MessageReactionToggleRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    clean_order_no = order_number.strip().upper()
    progress = db.query(models.ClientOrderProgress).filter(
        models.ClientOrderProgress.id == progress_id,
        func.upper(models.ClientOrderProgress.order_number) == clean_order_no
    ).first()
    if not progress:
        raise HTTPException(status_code=404, detail="Message not found")

    emoji = (payload.emoji or "").strip()
    if not emoji:
        raise HTTPException(status_code=400, detail="Emoji cannot be empty")

    existing = db.query(models.ClientOrderProgressReaction).filter(
        models.ClientOrderProgressReaction.progress_id == progress_id,
        models.ClientOrderProgressReaction.user_id == current_user.id,
        models.ClientOrderProgressReaction.emoji == emoji
    ).first()

    if existing:
        db.delete(existing)
        action = "removed"
    else:
        new_rxn = models.ClientOrderProgressReaction(
            progress_id=progress_id,
            user_id=current_user.id,
            emoji=emoji
        )
        db.add(new_rxn)
        action = "added"

    db.commit()

    reactions = get_formatted_message_reactions(progress_id, current_user.id, db)
    return {
        "status": "success",
        "action": action,
        "progress_id": progress_id,
        "reactions": reactions
    }







