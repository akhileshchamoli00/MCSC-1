from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, database

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
        title = sf.service.job_title if sf.service else "Unknown Service"
        fees.append({
            "id": sf.id,
            "notary_id": sf.notary_id,
            "service_id": sf.service_id,
            "fee": sf.fee,
            "service_title": title
        })
    return {
        "id": notary.id,
        "name": notary.name,
        "email": notary.email,
        "phone": notary.phone,
        "address": notary.address,
        "city": notary.city,
        "status": notary.status,
        "notes": notary.notes,
        "created_at": notary.created_at,
        "updated_at": notary.updated_at,
        "service_fees": fees
    }

@router.get("", response_model=List[schemas.NotaryResponse])
def get_all_notaries(db: Session = Depends(database.get_db)):
    """
    Retrieve all registered notaries.
    """
    notaries = db.query(models.Notary).all()
    return [format_notary_response(n, db) for n in notaries]

@router.post("", response_model=schemas.NotaryResponse)
def create_notary(
    notary_in: schemas.NotaryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Register a new notary public. (Admin only)
    """
    # Check if user is admin
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
        notes=notary_in.notes
    )
    db.add(db_notary)
    db.flush()

    if notary_in.service_fees:
        for sf_in in notary_in.service_fees:
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

    # Clear old service fees and recreate them
    db.query(models.NotaryServiceFee).filter(models.NotaryServiceFee.notary_id == notary_id).delete()
    if notary_in.service_fees:
        for sf_in in notary_in.service_fees:
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

from datetime import datetime, date

@router.get("/payments/summary")
def get_notary_payments_summary(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Get a summary of payments for all notaries.
    """
    notaries = db.query(models.Notary).all()
    results = []
    
    for n in notaries:
        # Fetch all orders assigned to this notary
        jobs = db.query(models.ClientOrder).filter(models.ClientOrder.notary_id == n.id).all()
        
        total_jobs = len(jobs)
        total_unpaid_jobs = len([j for j in jobs if j.notary_payment_status != "PAID"])
        total_earned = sum([j.notary_fee or 0.0 for j in jobs])
        total_paid = sum([j.notary_fee or 0.0 for j in jobs if j.notary_payment_status == "PAID"])
        total_outstanding = total_earned - total_paid
        
        results.append({
            "notary_id": n.id,
            "notary_name": n.name,
            "city": n.city,
            "status": n.status,
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
            "created_at": j.created_at.isoformat() if j.created_at else None
        })
        
    return {
        "notary": {
            "id": notary.id,
            "name": notary.name,
            "city": notary.city
        },
        "jobs": formatted_jobs
    }

@router.put("/payments/{order_item_id}/pay")
def pay_notary_job(
    order_item_id: int,
    req: schemas.NotaryPaymentRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Mark a specific notary job item as paid. (Admin only)
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
    job.notary_payment_ref = req.payment_ref
    
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
    
    db.commit()
    return {"detail": "Payment reverted to unpaid successfully"}
