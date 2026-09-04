from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, database
from utils.xendit_client import XenditClient

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
    fees = []
    for sf in notary.service_fees:
        if sf.service and getattr(sf.service, "needs_notary", False) and sf.fee > 0:
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
    Retrieve all registered notaries.
    """
    notaries = db.query(models.Notary).order_by(models.Notary.id.desc()).all()
    return [format_notary_response(n, db) for n in notaries]

@router.get("/{notary_id}", response_model=schemas.NotaryResponse)
def get_notary_by_id(notary_id: int, db: Session = Depends(database.get_db)):
    """
    Retrieve a specific notary public by ID.
    """
    notary = db.query(models.Notary).filter(models.Notary.id == notary_id).first()
    if not notary:
        raise HTTPException(status_code=404, detail="Notary public not found.")
    return format_notary_response(notary, db)

@router.post("", response_model=schemas.NotaryResponse)
def create_notary(
    notary_in: schemas.NotaryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Register a new notary public. (Admin only)
    """
    if not is_authorized_admin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators or management can register notaries."
        )

    db_notary = models.Notary(
        name=notary_in.name,
        email=notary_in.email,
        phone=notary_in.phone,
        address=notary_in.address,
        city=notary_in.city,
        status=notary_in.status,
        notes=notary_in.notes,
        bank_name=notary_in.bank_name,
        bank_account_number=notary_in.bank_account_number,
        bank_account_holder_name=notary_in.bank_account_holder_name,
        bank_branch=notary_in.bank_branch,
        bank_swift_code=notary_in.bank_swift_code
    )
    db.add(db_notary)
    db.flush()

    valid_service_ids = {
        s.id for s in db.query(models.ClientService.id).filter(models.ClientService.needs_notary == True).all()
    }

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
    Update a notary public record. (Admin only)
    """
    if not is_authorized_admin(current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators or management can update notary records."
        )

    db_notary = db.query(models.Notary).filter(models.Notary.id == notary_id).first()
    if not db_notary:
        raise HTTPException(
            status_code=404,
            detail="Notary public not found."
        )

    for field, val in notary_in.model_dump(exclude={"service_fees"}).items():
        setattr(db_notary, field, val)

    # Clear old service fees and recreate them for valid notary services only
    db.query(models.NotaryServiceFee).filter(models.NotaryServiceFee.notary_id == notary_id).delete()
    
    valid_service_ids = {
        s.id for s in db.query(models.ClientService.id).filter(models.ClientService.needs_notary == True).all()
    }

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

        results.append({
            "notary_id": n.id,
            "notary_name": n.name,
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

    return {
        "notary": {
            "id": notary.id,
            "name": notary.name,
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

