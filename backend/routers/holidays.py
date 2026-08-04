from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import models, schemas, auth, database
from datetime import date, datetime

router = APIRouter(
    prefix="/api/public-holidays",
    tags=["public-holidays"],
    dependencies=[Depends(auth.get_current_user)]
)

@router.get("", response_model=List[schemas.PublicHolidayResponse])
def get_public_holidays(
    year: Optional[int] = None, 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.PublicHoliday)
    if year:
        from sqlalchemy import extract, or_
        query = query.filter(
            or_(
                extract('year', models.PublicHoliday.holiday_date) == year,
                models.PublicHoliday.recurring == True
            )
        )
    return query.order_by(models.PublicHoliday.holiday_date).all()

@router.get("/{id}", response_model=schemas.PublicHolidayResponse)
def get_public_holiday(id: int, db: Session = Depends(database.get_db)):
    holiday = db.query(models.PublicHoliday).filter(models.PublicHoliday.id == id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Public Holiday not found")
    return holiday

@router.post("", response_model=schemas.PublicHolidayResponse)
def create_public_holiday(
    holiday: schemas.PublicHolidayCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Only Admin or HR
    is_admin = auth.is_super_admin(current_user)
    is_hr = current_user.role and current_user.role.name.upper() == "HR"
    if not (is_admin or is_hr):
        raise HTTPException(status_code=403, detail="Not authorized")

    existing = db.query(models.PublicHoliday).filter(models.PublicHoliday.holiday_date == holiday.holiday_date).first()
    if existing:
        raise HTTPException(status_code=400, detail="A holiday on this date already exists.")

    db_holiday = models.PublicHoliday(
        **holiday.model_dump() if hasattr(holiday, "model_dump") else holiday.dict(),
        created_by=current_user.id
    )
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)

    # Handle Forced Leave
    if db_holiday.holiday_type == "Forced Leave":
        active_employees = db.query(models.Employee).filter(models.Employee.status == models.EmploymentStatus.ACTIVE).all()
        for emp in active_employees:
            # Check if there is already an overlapping leave request
            existing_leave = db.query(models.LeaveRequest).filter(
                models.LeaveRequest.employee_id == emp.id,
                models.LeaveRequest.status.in_([models.LeaveStatus.APPROVED, models.LeaveStatus.PENDING]),
                models.LeaveRequest.start_date <= db_holiday.holiday_date,
                models.LeaveRequest.end_date >= db_holiday.holiday_date
            ).first()
            
            if not existing_leave:
                # Get or create LeaveBalance
                balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == emp.id).first()
                if not balance:
                    balance = models.LeaveBalance(employee_id=emp.id, annual_leave_balance=14.0, sick_leave_balance=0.0)
                    db.add(balance)
                    db.flush()
                
                # Deduct balance
                balance.annual_leave_balance = (balance.annual_leave_balance or 0.0) - 1.0
                
                # Auto-create approved leave request
                new_leave = models.LeaveRequest(
                    employee_id=emp.id,
                    start_date=db_holiday.holiday_date,
                    end_date=db_holiday.holiday_date,
                    leave_type="Annual Leave",
                    days_requested=1.0,
                    reason="Forced Leave",
                    status=models.LeaveStatus.APPROVED,
                    approved_by=current_user.id,
                    approved_at=datetime.now()
                )
                db.add(new_leave)
        db.commit()

    return db_holiday

@router.put("/{id}", response_model=schemas.PublicHolidayResponse)
def update_public_holiday(
    id: int, 
    holiday_update: schemas.PublicHolidayUpdate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Only Admin or HR
    is_admin = auth.is_super_admin(current_user)
    is_hr = current_user.role and current_user.role.name.upper() == "HR"
    if not (is_admin or is_hr):
        raise HTTPException(status_code=403, detail="Not authorized")

    db_holiday = db.query(models.PublicHoliday).filter(models.PublicHoliday.id == id).first()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Public Holiday not found")

    if holiday_update.holiday_date and holiday_update.holiday_date != db_holiday.holiday_date:
        existing = db.query(models.PublicHoliday).filter(models.PublicHoliday.holiday_date == holiday_update.holiday_date).first()
        if existing:
            raise HTTPException(status_code=400, detail="A holiday on this new date already exists.")

    old_date = db_holiday.holiday_date
    old_type = db_holiday.holiday_type
    old_name = db_holiday.holiday_name

    update_data = holiday_update.model_dump(exclude_unset=True) if hasattr(holiday_update, "model_dump") else holiday_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_holiday, key, value)

    db.commit()
    db.refresh(db_holiday)

    type_changed = old_type != db_holiday.holiday_type
    date_or_name_changed = (old_date != db_holiday.holiday_date) or (old_name != db_holiday.holiday_name)

    # 1. Revert old forced leaves if it was a forced leave and either its type changed or date/name changed
    if old_type == "Forced Leave" and (type_changed or date_or_name_changed):
        leaves_to_revert = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.start_date == old_date,
            models.LeaveRequest.end_date == old_date,
            models.LeaveRequest.leave_type == "Annual Leave",
            models.LeaveRequest.status == models.LeaveStatus.APPROVED,
            models.LeaveRequest.reason == "Forced Leave"
        ).all()
        
        for req in leaves_to_revert:
            balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == req.employee_id).first()
            if balance:
                balance.annual_leave_balance = (balance.annual_leave_balance or 0.0) + 1.0
            db.delete(req)
        db.commit()

    # 2. Generate new forced leaves if it is a forced leave and either its type changed or date/name changed
    if db_holiday.holiday_type == "Forced Leave" and (type_changed or date_or_name_changed):
        active_employees = db.query(models.Employee).filter(models.Employee.status == models.EmploymentStatus.ACTIVE).all()
        for emp in active_employees:
            # Check if there is already an overlapping leave request
            existing_leave = db.query(models.LeaveRequest).filter(
                models.LeaveRequest.employee_id == emp.id,
                models.LeaveRequest.status.in_([models.LeaveStatus.APPROVED, models.LeaveStatus.PENDING]),
                models.LeaveRequest.start_date <= db_holiday.holiday_date,
                models.LeaveRequest.end_date >= db_holiday.holiday_date
            ).first()
            
            if not existing_leave:
                # Get or create LeaveBalance
                balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == emp.id).first()
                if not balance:
                    balance = models.LeaveBalance(employee_id=emp.id, annual_leave_balance=14.0, sick_leave_balance=0.0)
                    db.add(balance)
                    db.flush()
                
                # Deduct balance
                balance.annual_leave_balance = (balance.annual_leave_balance or 0.0) - 1.0
                
                # Auto-create approved leave request
                new_leave = models.LeaveRequest(
                    employee_id=emp.id,
                    start_date=db_holiday.holiday_date,
                    end_date=db_holiday.holiday_date,
                    leave_type="Annual Leave",
                    days_requested=1.0,
                    reason="Forced Leave",
                    status=models.LeaveStatus.APPROVED,
                    approved_by=current_user.id,
                    approved_at=datetime.now()
                )
                db.add(new_leave)
        db.commit()

    return db_holiday

@router.delete("/{id}")
def delete_public_holiday(
    id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Only Admin or HR
    is_admin = auth.is_super_admin(current_user)
    is_hr = current_user.role and current_user.role.name.upper() == "HR"
    if not (is_admin or is_hr):
        raise HTTPException(status_code=403, detail="Not authorized")

    db_holiday = db.query(models.PublicHoliday).filter(models.PublicHoliday.id == id).first()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Public Holiday not found")

    # If it is a forced leave, revert the leave requests and restore balances
    if db_holiday.holiday_type == "Forced Leave":
        leaves_to_revert = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.start_date == db_holiday.holiday_date,
            models.LeaveRequest.end_date == db_holiday.holiday_date,
            models.LeaveRequest.leave_type == "Annual Leave",
            models.LeaveRequest.status == models.LeaveStatus.APPROVED,
            models.LeaveRequest.reason == "Forced Leave"
        ).all()
        
        for req in leaves_to_revert:
            balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == req.employee_id).first()
            if balance:
                balance.annual_leave_balance = (balance.annual_leave_balance or 0.0) + 1.0
            db.delete(req)

    db.delete(db_holiday)
    db.commit()
    return {"message": "Public Holiday successfully deleted"}
