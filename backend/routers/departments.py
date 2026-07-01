from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/departments",
    tags=["departments"],
    dependencies=[Depends(auth.get_current_user)]
)

@router.get("", response_model=List[schemas.DepartmentResponse])
def get_departments(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    departments = db.query(models.Department).order_by(models.Department.name).offset(skip).limit(limit).all()
    return departments

@router.get("/{department_id}", response_model=schemas.DepartmentResponse)
def get_department(department_id: int, db: Session = Depends(database.get_db)):
    department = db.query(models.Department).filter(models.Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department

@router.post("", response_model=schemas.DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(department: schemas.DepartmentCreate, db: Session = Depends(database.get_db)):
    db_department = db.query(models.Department).filter(models.Department.name == department.name).first()
    if db_department:
        raise HTTPException(status_code=400, detail="Department already exists")
    
    # Support both pydantic v1 and v2
    data = department.model_dump() if hasattr(department, "model_dump") else department.dict()
    new_department = models.Department(**data)
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    return new_department
