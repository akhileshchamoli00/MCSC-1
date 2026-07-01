from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/roles",
    tags=["roles"],
    dependencies=[Depends(auth.get_current_user)]
)

@router.get("", response_model=List[schemas.RoleResponse])
def get_roles(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    roles = db.query(models.Role).order_by(models.Role.name).offset(skip).limit(limit).all()
    return roles

@router.get("/{role_id}", response_model=schemas.RoleResponse)
def get_role(role_id: int, db: Session = Depends(database.get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role

@router.post("", response_model=schemas.RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(role: schemas.RoleCreate, db: Session = Depends(database.get_db)):
    db_role = db.query(models.Role).filter(models.Role.name == role.name).first()
    if db_role:
        raise HTTPException(status_code=400, detail="Role already exists")
    
    data = role.model_dump() if hasattr(role, "model_dump") else role.dict()
    new_role = models.Role(**data)
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

@router.put("/{role_id}", response_model=schemas.RoleResponse)
def update_role(role_id: int, role_update: schemas.RoleBase, db: Session = Depends(database.get_db)):
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    update_data = role_update.model_dump() if hasattr(role_update, "model_dump") else role_update.dict()
    for key, value in update_data.items():
        setattr(db_role, key, value)
        
    db.commit()
    db.refresh(db_role)
    return db_role

@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: int, db: Session = Depends(database.get_db)):
    db_role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    db.delete(db_role)
    db.commit()
    return
