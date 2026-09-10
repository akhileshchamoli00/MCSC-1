from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

import models, schemas, auth, database
from utils.xendit_client import XenditClient
from routers.clients import validate_and_clean_email, validate_and_clean_phone

router = APIRouter(
    dependencies=[Depends(auth.get_current_user)]
)

def is_authorized_admin(user: models.User, db: Session) -> bool:
    if not user:
        return False
    if auth.is_super_admin(user):
        return True
    if not user.role_id:
        return False
    db_role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
    if not db_role:
        return False
    return db_role.name.upper() in ["ADMIN", "HR ADMIN", "MANAGEMENT", "HR", "SUPER ADMIN", "SUPERADMIN", "SYSTEM ADMIN"]

def format_notary_response(notary: models.Notary, db: Session) -> dict:
    v_type = notary.vendor_type or ("GOVERNMENT_OFFICER" if notary.is_gov_officer else ("OTHER_VENDORS" if notary.is_other_vendor else "NOTARY"))
    is_notary = (v_type == "NOTARY") or bool(notary.is_notary)
    is_gov = (v_type == "GOVERNMENT_OFFICER") or bool(notary.is_gov_officer)
    is_other = (v_type == "OTHER_VENDORS") or bool(notary.is_other_vendor)

    fees = []
    for sf in notary.service_fees:
        if sf.service and sf.fee > 0:
            svc_needs_notary = bool(getattr(sf.service, "needs_notary", False))
            svc_needs_gov = bool(getattr(sf.service, "needs_gov_officer", False))
            svc_needs_other = bool(getattr(sf.service, "needs_other_vendors", False))

            is_valid = (
                (is_notary and svc_needs_notary) or
                (is_gov and svc_needs_gov) or
                (is_other and (svc_needs_other or (not svc_needs_notary and not svc_needs_gov)))
            )
            if is_valid:
                title = sf.service.job_title if sf.service else "Unknown Service"
                fees.append({
                    "id": sf.id,
                    "notary_id": sf.notary_id,
                    "service_id": sf.service_id,
                    "fee": sf.fee,
                    "service_title": title
                })
    
    is_bank_configured = bool(
        notary.bank_name and 
        notary.bank_account_number and 
        notary.bank_account_holder_name
    )

    return {
        "id": notary.id,
        "name": notary.name,
        "email": notary.email,
        "phone": notary.phone,
        "address": notary.address,
        "city": notary.city,
        "status": notary.status,
        "notes": notary.notes,
        "vendor_type": v_type,
        "is_notary": is_notary,
        "is_gov_officer": is_gov,
        "is_other_vendor": is_other,
        "validation_status": notary.validation_status or "PENDING_VALIDATION",
        "created_by_user_id": notary.created_by_user_id,
        "validated_by_user_id": notary.validated_by_user_id,
        "validated_at": notary.validated_at,
        "validation_notes": notary.validation_notes,
        "creator": notary.creator,
        "validator": notary.validator,
        "bank_name": notary.bank_name,
        "bank_account_number": notary.bank_account_number,
        "bank_account_holder_name": notary.bank_account_holder_name,
        "bank_branch": notary.bank_branch,
        "bank_swift_code": notary.bank_swift_code,
        "is_bank_configured": is_bank_configured,
        "created_at": notary.created_at,
        "updated_at": notary.updated_at,
        "service_fees": fees
    }

@router.get("", response_model=List[schemas.NotaryResponse])
def get_all_notaries(db: Session = Depends(database.get_db)):
    """
    Retrieve all registered notaries / vendors.
    """
    notaries = db.query(models.Notary).options(
        joinedload(models.Notary.creator).joinedload(models.User.employee),
        joinedload(models.Notary.validator).joinedload(models.User.employee),
        joinedload(models.Notary.service_fees).joinedload(models.NotaryServiceFee.service)
    ).order_by(models.Notary.id.desc()).all()
    return [format_notary_response(n, db) for n in notaries]

@router.get("/{notary_id}", response_model=schemas.NotaryResponse)
def get_notary_by_id(notary_id: int, db: Session = Depends(database.get_db)):
    """
    Retrieve a specific notary / vendor by ID.
    """
    notary = db.query(models.Notary).options(
        joinedload(models.Notary.creator).joinedload(models.User.employee),
        joinedload(models.Notary.validator).joinedload(models.User.employee),
        joinedload(models.Notary.service_fees).joinedload(models.NotaryServiceFee.service)
    ).filter(models.Notary.id == notary_id).first()
    if not notary:
        raise HTTPException(status_code=404, detail="Vendor / Notary public not found.")
    return format_notary_response(notary, db)

@router.post("", response_model=schemas.NotaryResponse)
def create_notary(
    notary_in: schemas.NotaryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Register a new vendor / notary public.
    """
    v_type = notary_in.vendor_type or ("GOVERNMENT_OFFICER" if notary_in.is_gov_officer else ("OTHER_VENDORS" if notary_in.is_other_vendor else "NOTARY"))
    is_notary = (v_type == "NOTARY")
    is_gov = (v_type == "GOVERNMENT_OFFICER")
    is_other = (v_type == "OTHER_VENDORS")

    clean_email = validate_and_clean_email(notary_in.email, "Vendor Email", required=False) if notary_in.email else None
    clean_phone = validate_and_clean_phone(notary_in.phone, "Vendor Phone", required=False) if notary_in.phone else None

    db_notary = models.Notary(
        name=notary_in.name,
        email=clean_email,
        phone=clean_phone,
        address=notary_in.address,
        city=notary_in.city,
        status=notary_in.status,
        notes=notary_in.notes,
        vendor_type=v_type,
        is_notary=is_notary,
        is_gov_officer=is_gov,
        is_other_vendor=is_other,
        validation_status="PENDING_VALIDATION",
        created_by_user_id=current_user.id,
        bank_name=notary_in.bank_name,
        bank_account_number=notary_in.bank_account_number,
        bank_account_holder_name=notary_in.bank_account_holder_name,
        bank_branch=notary_in.bank_branch,
        bank_swift_code=notary_in.bank_swift_code
    )
    db.add(db_notary)
    db.flush()

    from sqlalchemy import or_, and_
    service_query = db.query(models.ClientService.id)
    if is_notary:
        service_query = service_query.filter(models.ClientService.needs_notary == True)
    elif is_gov:
        service_query = service_query.filter(models.ClientService.needs_gov_officer == True)
    elif is_other:
        service_query = service_query.filter(
            or_(
                models.ClientService.needs_other_vendors == True,
                and_(
                    or_(models.ClientService.needs_notary == False, models.ClientService.needs_notary == None),
                    or_(models.ClientService.needs_gov_officer == False, models.ClientService.needs_gov_officer == None)
                )
            )
        )
    valid_service_ids = {s.id for s in service_query.all()}

    if notary_in.service_fees:
        for sf_in in notary_in.service_fees:
            if sf_in.service_id in valid_service_ids and sf_in.fee > 0:
                db_fee = models.NotaryServiceFee(
                    notary_id=db_notary.id,
                    service_id=sf_in.service_id,
                    fee=sf_in.fee
                )
                db.add(db_fee)

    db.commit()
    db.refresh(db_notary)
    return format_notary_response(db_notary, db)

@router.put("/{notary_id}", response_model=schemas.NotaryResponse)
def update_notary(
    notary_id: int,
    notary_in: schemas.NotaryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Update a vendor / notary record. (Admin only)
    """
    if not is_authorized_admin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators or management can update vendor records."
        )

    db_notary = db.query(models.Notary).filter(models.Notary.id == notary_id).first()
    if not db_notary:
        raise HTTPException(
            status_code=404,
            detail="Vendor record not found."
        )

    dump_data = notary_in.model_dump(exclude={"service_fees"})
    if "email" in dump_data and dump_data["email"]:
        dump_data["email"] = validate_and_clean_email(dump_data["email"], "Vendor Email", required=False)
    if "phone" in dump_data and dump_data["phone"]:
        dump_data["phone"] = validate_and_clean_phone(dump_data["phone"], "Vendor Phone", required=False)

    for field, val in dump_data.items():
        setattr(db_notary, field, val)

    v_type = db_notary.vendor_type or "NOTARY"
    db_notary.vendor_type = v_type
    db_notary.is_notary = (v_type == "NOTARY")
    db_notary.is_gov_officer = (v_type == "GOVERNMENT_OFFICER")
    db_notary.is_other_vendor = (v_type == "OTHER_VENDORS")

    # Clear old service fees and recreate them for valid vendor services only
    db.query(models.NotaryServiceFee).filter(models.NotaryServiceFee.notary_id == notary_id).delete()
    
    from sqlalchemy import or_, and_
    service_query = db.query(models.ClientService.id)
    if db_notary.is_notary:
        service_query = service_query.filter(models.ClientService.needs_notary == True)
    elif db_notary.is_gov_officer:
        service_query = service_query.filter(models.ClientService.needs_gov_officer == True)
    elif db_notary.is_other_vendor:
        service_query = service_query.filter(
            or_(
                models.ClientService.needs_other_vendors == True,
                and_(
                    or_(models.ClientService.needs_notary == False, models.ClientService.needs_notary == None),
                    or_(models.ClientService.needs_gov_officer == False, models.ClientService.needs_gov_officer == None)
                )
            )
        )
    valid_service_ids = {s.id for s in service_query.all()}

    if notary_in.service_fees:
        for sf_in in notary_in.service_fees:
            if sf_in.service_id in valid_service_ids and sf_in.fee > 0:
                db_fee = models.NotaryServiceFee(
                    notary_id=notary_id,
                    service_id=sf_in.service_id,
                    fee=sf_in.fee
                )
                db.add(db_fee)

    db.commit()
    db.refresh(db_notary)
    return format_notary_response(db_notary, db)

@router.put("/{notary_id}/validate", response_model=schemas.NotaryResponse)
def validate_notary(
    notary_id: int,
    val_data: schemas.CompanyValidationRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Validate or request revision on a vendor / notary profile. (Admin only)
    """
    if not is_authorized_admin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators or management can validate vendor profiles."
        )

    db_notary = db.query(models.Notary).options(
        joinedload(models.Notary.creator).joinedload(models.User.employee),
        joinedload(models.Notary.validator).joinedload(models.User.employee),
        joinedload(models.Notary.service_fees).joinedload(models.NotaryServiceFee.service)
    ).filter(models.Notary.id == notary_id).first()
    if not db_notary:
        raise HTTPException(status_code=404, detail="Vendor not found.")

    status_upper = (val_data.status or "").strip().upper()
    if status_upper not in ["VALIDATED", "NEEDS_REVISION", "PENDING_VALIDATION"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be VALIDATED, NEEDS_REVISION, or PENDING_VALIDATION")

    db_notary.validation_status = status_upper
    db_notary.validation_notes = val_data.notes or None
    db_notary.validated_by_user_id = current_user.id
    db_notary.validated_at = datetime.now()
    db_notary.updated_at = datetime.now()

    db.commit()
    db.refresh(db_notary)

    return format_notary_response(db_notary, db)

@router.delete("/{notary_id}")
def delete_notary(
    notary_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Delete a notary public record. (Admin only)
    """
    if not is_authorized_admin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators or management can delete notary records."
        )

    db_notary = db.query(models.Notary).filter(models.Notary.id == notary_id).first()
    if not db_notary:
        raise HTTPException(
            status_code=404,
            detail="Notary public not found."
        )

    db.delete(db_notary)
    db.commit()
    return {"detail": "Notary record deleted successfully."}

@router.get("/payments/summary")
def get_notary_payments_summary(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Get a summary of payments for all notaries.
    """
    notaries = db.query(models.Notary).all()
    results = []
    
    for n in notaries:
        jobs = db.query(models.ClientOrder).filter(models.ClientOrder.notary_id == n.id).all()
        
        total_jobs = len(jobs)
        total_unpaid_jobs = len([j for j in jobs if j.notary_payment_status != "PAID"])
        total_earned = sum([j.notary_fee or 0.0 for j in jobs])
        total_paid = sum([j.notary_fee or 0.0 for j in jobs if j.notary_payment_status == "PAID"])
        total_outstanding = total_earned - total_paid
        
        is_bank_configured = bool(n.bank_name and n.bank_account_number and n.bank_account_holder_name)
        v_type = n.vendor_type or ("GOVERNMENT_OFFICER" if n.is_gov_officer else ("OTHER_VENDORS" if n.is_other_vendor else "NOTARY"))

        results.append({
            "notary_id": n.id,
            "notary_name": n.name,
            "vendor_type": v_type,
            "is_notary": n.is_notary,
            "is_gov_officer": n.is_gov_officer,
            "is_other_vendor": n.is_other_vendor,
            "city": n.city,
            "status": n.status,
            "bank_name": n.bank_name,
            "bank_account_number": n.bank_account_number,
            "bank_account_holder_name": n.bank_account_holder_name,
            "bank_branch": n.bank_branch,
            "bank_swift_code": n.bank_swift_code,
            "is_bank_configured": is_bank_configured,
            "total_jobs": total_jobs,
            "total_unpaid_jobs": total_unpaid_jobs,
            "total_earned": total_earned,
            "total_paid": total_paid,
            "total_outstanding": total_outstanding
        })
        
    return results

@router.get("/payments/{notary_id}/history")
def get_notary_payment_history(notary_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Get detailed job history and payment records for a specific notary.
    """
    notary = db.query(models.Notary).filter(models.Notary.id == notary_id).first()
    if not notary:
        raise HTTPException(status_code=404, detail="Notary not found")
        
    jobs = db.query(models.ClientOrder).filter(models.ClientOrder.notary_id == notary_id).order_by(models.ClientOrder.id.desc()).all()
    
    formatted_jobs = []
    for j in jobs:
        comp_name = "Personal Client Account"
        if j.company:
            comp_name = j.company.company_name
        elif j.client and j.client.companies:
            comp_name = j.client.companies[0].company_name
            
        formatted_jobs.append({
            "id": j.id,
            "order_number": j.order_number,
            "job_title": j.job_title,
            "company_name": comp_name,
            "status": j.status,
            "unit_price": j.unit_price,
            "notary_fee": j.notary_fee or 0.0,
            "notary_payment_status": j.notary_payment_status or "UNPAID",
            "notary_payment_date": j.notary_payment_date.isoformat() if j.notary_payment_date else None,
            "notary_payment_ref": j.notary_payment_ref,
            "notary_payout_id": j.notary_payout_id,
            "created_at": j.created_at.isoformat() if j.created_at else None
        })
        
    is_bank_configured = bool(notary.bank_name and notary.bank_account_number and notary.bank_account_holder_name)
    v_type = notary.vendor_type or ("GOVERNMENT_OFFICER" if notary.is_gov_officer else ("OTHER_VENDORS" if notary.is_other_vendor else "NOTARY"))

    return {
        "notary": {
            "id": notary.id,
            "name": notary.name,
            "vendor_type": v_type,
            "is_notary": notary.is_notary,
            "is_gov_officer": notary.is_gov_officer,
            "is_other_vendor": notary.is_other_vendor,
            "email": notary.email,
            "phone": notary.phone,
            "city": notary.city,
            "address": notary.address,
            "bank_name": notary.bank_name,
            "bank_account_number": notary.bank_account_number,
            "bank_account_holder_name": notary.bank_account_holder_name,
            "bank_branch": notary.bank_branch,
            "bank_swift_code": notary.bank_swift_code,
            "is_bank_configured": is_bank_configured
        },
        "jobs": formatted_jobs
    }

@router.post("/payments/{order_item_id}/disburse")
def disburse_notary_payment(
    order_item_id: int,
    req: schemas.NotaryDisbursementRequest = schemas.NotaryDisbursementRequest(),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Directly execute an automated Xendit Payout / Disbursement to the assigned notary's bank account. (Admin only)
    """
    if not is_authorized_admin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators or management can execute disbursements."
        )

    job = db.query(models.ClientOrder).filter(models.ClientOrder.id == order_item_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Order item not found")

    if not job.notary_id:
        raise HTTPException(status_code=400, detail="This order item does not have a notary assigned.")

    notary = db.query(models.Notary).filter(models.Notary.id == job.notary_id).first()
    if not notary:
        raise HTTPException(status_code=404, detail="Assigned notary not found.")

    # 1. Validate Bank Details
    missing_fields = []
    if not notary.bank_name:
        missing_fields.append("Bank Name")
    if not notary.bank_account_number:
        missing_fields.append("Account Number")
    if not notary.bank_account_holder_name:
        missing_fields.append("Account Holder Name")

    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot disburse payout: Notary bank details are incomplete. Missing: {', '.join(missing_fields)}. Please update the notary's profile first."
        )

    # 2. Validate Amount
    amount = job.notary_fee or 0.0
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot disburse payout: Notary fee amount must be greater than IDR 0."
        )

    # 3. Call Xendit Payouts
    try:
        xendit_client = XenditClient()
        masked_key = f"{xendit_client.secret_key[:16]}...{xendit_client.secret_key[-4:]}" if len(xendit_client.secret_key) > 20 else "EMPTY"
        print(f"[XENDIT_PAYOUT] Processing payout for order_item_id={job.id} with key {masked_key}")
        external_id = f"notary-payout-{job.id}-{int(datetime.now().timestamp())}"
        payout_desc = req.description or f"Notary Fee ORD-{job.order_number} {job.job_title[:20]}"
        
        disb_response = xendit_client.create_disbursement(
            external_id=external_id,
            bank_code=notary.bank_name,
            account_holder_name=notary.bank_account_holder_name,
            account_number=notary.bank_account_number,
            amount=amount,
            description=payout_desc[:50]
        )
    except Exception as e:
        print(f"[XENDIT_DISBURSE_ERROR] order_item_id={order_item_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Xendit Disbursement failed: {str(e)}"
        )

    # 4. Update ClientOrder Record
    disbursement_id = disb_response.get("id", "")
    job.notary_payment_status = "PAID"
    job.notary_payment_date = date.today()
    job.notary_payment_ref = f"Xendit ID: {disbursement_id}"
    job.notary_payout_id = disbursement_id

    db.commit()

    return {
        "detail": "Disbursement successfully submitted via Xendit!",
        "disbursement_id": disbursement_id,
        "status": disb_response.get("status", "PENDING"),
        "amount": amount,
        "bank_code": disb_response.get("bank_code"),
        "account_number": disb_response.get("account_number")
    }

@router.put("/payments/{order_item_id}/pay")
def pay_notary_job(
    order_item_id: int,
    req: schemas.NotaryPaymentRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Mark a specific notary job item as paid manually (offline transfer/cash). (Admin only)
    """
    if not is_authorized_admin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators or management can update payment records."
        )
        
    job = db.query(models.ClientOrder).filter(models.ClientOrder.id == order_item_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Order item not found")
        
    if not job.notary_id:
        raise HTTPException(status_code=400, detail="This order item does not have a notary assigned")
        
    job.notary_payment_status = "PAID"
    
    pay_date = date.today()
    if req.payment_date:
        try:
            pay_date = datetime.strptime(req.payment_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")
            
    job.notary_payment_date = pay_date
    job.notary_payment_ref = req.payment_ref or "Manual Payment"
    
    db.commit()
    return {"detail": "Payment registered successfully"}

@router.put("/payments/{order_item_id}/unpay")
def unpay_notary_job(
    order_item_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Revert a specific notary job item to unpaid. (Admin only)
    """
    if not is_authorized_admin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators or management can update payment records."
        )
        
    job = db.query(models.ClientOrder).filter(models.ClientOrder.id == order_item_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Order item not found")
        
    job.notary_payment_status = "UNPAID"
    job.notary_payment_date = None
    job.notary_payment_ref = None
    job.notary_payout_id = None
    
    db.commit()
    return {"detail": "Payment reverted to unpaid successfully"}


class SendNotaryVoucherEmailRequest(schemas.BaseModel):
    recipient_email: Optional[str] = None
    custom_message: Optional[str] = None
    pdf_base64: Optional[str] = None
    pdf_filename: Optional[str] = None


@router.post("/payments/{order_item_id}/send-voucher-email")
def send_notary_voucher_email(
    order_item_id: int,
    req: SendNotaryVoucherEmailRequest = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Send an official Payment Voucher (Remittance Advice) email to the notary for a settled order item.
    """
    if not is_authorized_admin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators or management can dispatch payment vouchers."
        )

    job = db.query(models.ClientOrder).filter(models.ClientOrder.id == order_item_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Order item not found")

    if not job.notary_id:
        raise HTTPException(status_code=400, detail="No notary assigned to this order item")

    if job.notary_payment_status != "PAID":
        raise HTTPException(status_code=400, detail="Cannot send payment voucher for an unpaid or unsettled notary job.")

    notary = db.query(models.Notary).filter(models.Notary.id == job.notary_id).first()
    if not notary:
        raise HTTPException(status_code=404, detail="Notary record not found")

    target_email = (req.recipient_email if req and req.recipient_email else "").strip() or (notary.email or "")
    if not target_email:
        raise HTTPException(status_code=400, detail="No recipient email specified and notary does not have an email on file.")

    from utils.email_service import send_notary_payment_voucher_email

    company_name = "Personal Client Account"
    if job.company and job.company.company_name:
        company_name = job.company.company_name
    elif job.client and job.client.companies:
        company_name = job.client.companies[0].company_name
    elif job.client and job.client.contact_person:
        company_name = job.client.contact_person

    pay_date_str = str(job.notary_payment_date or date.today())
    payout_ref_str = job.notary_payment_ref or (f"Xendit ID: {job.notary_payout_id}" if job.notary_payout_id else "Settled")

    # Decode PDF base64 if provided
    pdf_bytes = None
    if req and req.pdf_base64:
        import base64
        try:
            raw_b64 = req.pdf_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
            pdf_bytes = base64.b64decode(raw_b64)
        except Exception as b64_err:
            print("Failed to decode PDF base64 payload:", b64_err)

    pdf_filename = (req.pdf_filename if req and req.pdf_filename else f"PV-{job.order_number}.pdf").strip()

    success = send_notary_payment_voucher_email(
        notary_email=target_email,
        notary_name=notary.name,
        order_number=job.order_number,
        company_name=company_name,
        job_title=job.job_title,
        amount=job.notary_fee or 0.0,
        bank_name=notary.bank_name or "-",
        bank_account_number=notary.bank_account_number or "-",
        bank_account_holder_name=notary.bank_account_holder_name or notary.name,
        payment_date=pay_date_str,
        payout_ref=payout_ref_str,
        custom_message=req.custom_message if req else None,
        pdf_content=pdf_bytes,
        pdf_filename=pdf_filename
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email. Please verify server email credentials.")

    return {"detail": f"Payment voucher successfully emailed to {target_email}!"}


