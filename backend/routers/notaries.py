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

@router.get("", response_model=List[schemas.NotaryResponse])
def get_all_notaries(db: Session = Depends(database.get_db)):
    """
    Retrieve all registered notaries.
    """
    return db.query(models.Notary).all()

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
        service_fee=notary_in.service_fee,
        status=notary_in.status,
        notes=notary_in.notes
    )
    db.add(db_notary)
    db.commit()
    db.refresh(db_notary)
    return db_notary

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

    for field, val in notary_in.model_dump().items():
        setattr(db_notary, field, val)

    db.commit()
    db.refresh(db_notary)
    return db_notary

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
