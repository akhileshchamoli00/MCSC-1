from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/companies",
    tags=["companies"],
    dependencies=[Depends(auth.get_current_user)]
)

@router.get("", response_model=List[schemas.CompanyResponse])
def get_companies(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    companies = db.query(models.Company).order_by(models.Company.name).offset(skip).limit(limit).all()
    return companies

@router.post("", response_model=schemas.CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(company: schemas.CompanyCreate, db: Session = Depends(database.get_db)):
    db_company = db.query(models.Company).filter(models.Company.name == company.name).first()
    if db_company:
        raise HTTPException(status_code=400, detail="Company already exists")
    
    new_company = models.Company(name=company.name, description=company.description)
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company
