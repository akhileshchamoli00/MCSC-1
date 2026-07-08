from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime, timedelta

import models, schemas, auth, database
from notification_manager import manager

# TEMPORARY TOGGLE: Set to False to prevent users from applying for annual leave when balance is negative.
ALLOW_NEGATIVE_ANNUAL_LEAVE = True

router = APIRouter(
    prefix="/api/leave",
    tags=["leave"],
    dependencies=[Depends(auth.get_current_user)]
)

def is_public_holiday(db: Session, check_date: datetime.date):
    from sqlalchemy import extract, or_
    holiday = db.query(models.PublicHoliday).filter(
        or_(
            models.PublicHoliday.holiday_date == check_date,
            (models.PublicHoliday.recurring == True) & 
            (extract('month', models.PublicHoliday.holiday_date) == check_date.month) & 
            (extract('day', models.PublicHoliday.holiday_date) == check_date.day)
        )
    ).first()
    return holiday is not None

def calculate_working_days(start_date, end_date, db: Session = None):
    days = 0
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() < 5: # 0-4 are Monday-Friday
            if db:
                if not is_public_holiday(db, current_date):
                    days += 1
            else:
                days += 1
        current_date += timedelta(days=1)
    return days

# ==========================================
# ADMIN ENDPOINTS
# ==========================================

@router.get("/balances", response_model=List[schemas.LeaveBalanceResponse])
def get_all_leave_balances(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Admin access required")
    balances = db.query(models.LeaveBalance).join(models.Employee).order_by(models.Employee.first_name, models.Employee.last_name).offset(skip).limit(limit).all()
    for balance in balances:
        allocations = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.employee_id == balance.employee_id,
            models.LeaveRequest.leave_type == "Leave Allocation",
            models.LeaveRequest.status == "APPROVED"
        ).all()
        balance.bonus_allocated = sum(req.days_requested for req in allocations)
    return balances

@router.put("/balances/{employee_id}", response_model=schemas.LeaveBalanceResponse)
def update_leave_balance(employee_id: int, payload: schemas.LeaveBalanceUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Admin access required")
        
    balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == employee_id).first()
    if not balance:
        raise HTTPException(status_code=404, detail="Leave balance not found for this employee")

    bonus_allocated = getattr(payload, 'bonus_allocated', None)
    if bonus_allocated is not None and (bonus_allocated * 2) % 1 != 0:
        raise HTTPException(status_code=400, detail="Bonus allocated days must be in increments of 0.5 (half-day or full-day).")

    # Create Audit Log
    audit = models.LeaveBalanceAudit(
        employee_id=employee_id,
        old_annual_balance=balance.annual_leave_balance,
        new_annual_balance=payload.annual_leave_balance,
        old_sick_balance=balance.sick_leave_balance,
        new_sick_balance=payload.sick_leave_balance,
        old_annual_taken=balance.annual_leave_taken,
        new_annual_taken=payload.annual_leave_taken,
        old_sick_taken=balance.sick_leave_taken,
        new_sick_taken=payload.sick_leave_taken,
        reason=payload.reason,
        updated_by=current_user.id
    )
    db.add(audit)

    # Update Balance
    balance.annual_leave_balance = payload.annual_leave_balance
    balance.sick_leave_balance = payload.sick_leave_balance
    balance.annual_leave_taken = payload.annual_leave_taken
    balance.sick_leave_taken = payload.sick_leave_taken
    balance.updated_by = current_user.id
    balance.updated_at = datetime.now()

    db.commit()
    db.refresh(balance)
    return balance

@router.post("/allocate", response_model=schemas.LeaveBalanceResponse)
def allocate_leave(payload: schemas.LeaveAllocationRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Admin access required")
        
    balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == payload.employee_id).first()
    if not balance:
        raise HTTPException(status_code=404, detail="Leave balance not found for this employee")

    if (payload.amount * 2) % 1 != 0:
        raise HTTPException(status_code=400, detail="Leave days must be in increments of 0.5 (half-day or full-day).")

    # Record old balance
    old_annual = balance.annual_leave_balance

    # Update Balance
    balance.annual_leave_balance += payload.amount
    balance.updated_by = current_user.id
    balance.updated_at = datetime.now()

    # Create Audit Log
    audit = models.LeaveBalanceAudit(
        employee_id=payload.employee_id,
        old_annual_balance=old_annual,
        new_annual_balance=balance.annual_leave_balance,
        old_sick_balance=balance.sick_leave_balance,
        new_sick_balance=balance.sick_leave_balance,
        old_annual_taken=balance.annual_leave_taken,
        new_annual_taken=balance.annual_leave_taken,
        old_sick_taken=balance.sick_leave_taken,
        new_sick_taken=balance.sick_leave_taken,
        reason=payload.reason,
        updated_by=current_user.id
    )
    db.add(audit)

    # Create Leave Request Addition Entry
    allocation_date = datetime.now().date()
    leave_req = models.LeaveRequest(
        employee_id=payload.employee_id,
        start_date=allocation_date,
        end_date=allocation_date,
        leave_type="Leave Allocation",
        days_requested=payload.amount,
        reason=payload.reason,
        status=models.LeaveStatus.APPROVED,
        approved_by=current_user.id,
        approved_at=datetime.now()
    )
    db.add(leave_req)

    db.commit()
    db.refresh(balance)

    # Notify Employee
    try:
        manager.notify_user_sync(
            db=db,
            user_id=balance.employee.user_id,
            title="Leave Balance Allocated",
            message=f"{payload.amount} days of annual leave have been allocated to your balance.",
            type="leave_allocated",
            module="Leave",
            reference_id=leave_req.id,
            action_url="/apply-leave"
        )
    except Exception as e:
        print(f"Failed to notify employee: {e}")

    # Compute bonus_allocated
    allocations = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.employee_id == balance.employee_id,
        models.LeaveRequest.leave_type == "Leave Allocation",
        models.LeaveRequest.status == "APPROVED"
    ).all()
    balance.bonus_allocated = sum(req.days_requested for req in allocations)

    return balance

@router.get("/requests", response_model=List[schemas.LeaveRequestResponse])
def get_all_leave_requests(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(models.LeaveRequest).order_by(desc(models.LeaveRequest.created_at)).offset(skip).limit(limit).all()

@router.put("/requests/{request_id}/approve", response_model=schemas.LeaveRequestResponse)
def approve_leave_request(request_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Admin access required")
        
    leave_req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == request_id).first()
    if not leave_req:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    if leave_req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")

    balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == leave_req.employee_id).first()
    if not balance:
        raise HTTPException(status_code=404, detail="Employee balance not found")

    # Deduct Balance
    if leave_req.leave_type in ["Annual Leave", "Emergency Leave"]:
        if not ALLOW_NEGATIVE_ANNUAL_LEAVE and balance.annual_leave_balance < leave_req.days_requested:
            raise HTTPException(status_code=400, detail="Insufficient Annual Leave balance")
        balance.annual_leave_balance -= leave_req.days_requested
    elif leave_req.leave_type == "Sick Leave":
        if balance.sick_leave_balance < leave_req.days_requested:
            raise HTTPException(status_code=400, detail="Insufficient Sick Leave balance")
        balance.sick_leave_balance -= leave_req.days_requested

    # Update Request
    leave_req.status = "APPROVED"
    leave_req.approved_by = current_user.id
    leave_req.approved_at = datetime.now()

    db.commit()
    db.refresh(leave_req)
    
    manager.notify_user_sync(
        db=db,
        user_id=leave_req.employee.user_id,
        title="Leave Request Approved",
        message=f"Your {leave_req.leave_type} request for {leave_req.days_requested} days has been approved.",
        type="leave_approved",
        module="Leave",
        reference_id=leave_req.id,
        action_url="/apply-leave"
    )
    
    return leave_req

@router.put("/requests/{request_id}/reject", response_model=schemas.LeaveRequestResponse)
def reject_leave_request(request_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Admin access required")
        
    leave_req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == request_id).first()
    if not leave_req:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    if leave_req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")

    # Update Request (No balance deduction)
    leave_req.status = "REJECTED"
    leave_req.approved_by = current_user.id
    leave_req.approved_at = datetime.now()

    db.commit()
    db.refresh(leave_req)
    
    manager.notify_user_sync(
        db=db,
        user_id=leave_req.employee.user_id,
        title="Leave Request Rejected",
        message=f"Your {leave_req.leave_type} request for {leave_req.days_requested} days has been rejected.",
        type="leave_rejected",
        module="Leave",
        reference_id=leave_req.id,
        action_url="/apply-leave"
    )
    
    return leave_req

# ==========================================
# EMPLOYEE ENDPOINTS
# ==========================================

@router.get("/my-balances")
def get_my_leave_balances(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User is not linked to an employee profile")
        
    balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == current_user.employee.id).first()
    if not balance:
        # Auto-create if it somehow doesn't exist
        balance = models.LeaveBalance(
            employee_id=current_user.employee.id, 
            annual_leave_balance=14.0, 
            sick_leave_balance=0.0,
            annual_leave_taken=0.0,
            sick_leave_taken=0.0
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)
    
    # Calculate Used Leaves
    approved_requests = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.employee_id == current_user.employee.id,
        models.LeaveRequest.status == "APPROVED"
    ).all()
    
    used_annual = sum(req.days_requested for req in approved_requests if req.leave_type == "Annual Leave") + (balance.annual_leave_taken or 0.0)
    used_sick = sum(req.days_requested for req in approved_requests if req.leave_type == "Sick Leave") + (balance.sick_leave_taken or 0.0)
    used_unpaid = sum(req.days_requested for req in approved_requests if req.leave_type == "Unpaid Leave")
    used_emergency = sum(req.days_requested for req in approved_requests if req.leave_type == "Emergency Leave")
    used_maternity = sum(req.days_requested for req in approved_requests if req.leave_type == "Maternity Leave")
    allocated_additions = sum(req.days_requested for req in approved_requests if req.leave_type == "Leave Allocation")

    return {
        "annual_leave": {
            "allocated": balance.annual_leave_balance + used_annual + used_emergency - (balance.annual_leave_taken or 0.0) - allocated_additions,
            "additions": allocated_additions,
            "used": used_annual,
            "remaining": balance.annual_leave_balance
        },
        "sick_leave": {
            "allocated": balance.sick_leave_balance + used_sick - (balance.sick_leave_taken or 0.0),
            "used": used_sick,
            "remaining": balance.sick_leave_balance
        },
        "unpaid_leave": {
            "allocated": "N/A",
            "used": used_unpaid,
            "remaining": "N/A"
        },
        "emergency_leave": {
            "allocated": "-",
            "used": used_emergency,
            "remaining": "-"
        },
        "maternity_leave": {
            "allocated": "N/A",
            "used": used_maternity,
            "remaining": "N/A"
        }
    }

@router.get("/my-requests", response_model=List[schemas.LeaveRequestResponse])
def get_my_leave_requests(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User is not linked to an employee profile")
        
    return db.query(models.LeaveRequest).filter(models.LeaveRequest.employee_id == current_user.employee.id).order_by(desc(models.LeaveRequest.created_at)).offset(skip).limit(limit).all()

@router.post("/request", response_model=schemas.LeaveRequestResponse)
def apply_for_leave(leave: schemas.LeaveRequestCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User is not linked to an employee profile")

    if leave.leave_type in ["Annual Leave", "Emergency Leave"]:
        balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == current_user.employee.id).first()
        annual_balance = balance.annual_leave_balance if balance else 14.0
        if not ALLOW_NEGATIVE_ANNUAL_LEAVE and annual_balance <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient Annual Leave balance. You cannot apply for Annual Leave or Emergency Leave with a balance of 0 or less."
            )

    if leave.end_date < leave.start_date:
        raise HTTPException(status_code=400, detail="End date must be after or equal to start date")

    is_half = getattr(leave, 'is_half_day', False)
    if is_half and leave.start_date != leave.end_date:
        raise HTTPException(status_code=400, detail="Half day leave must be on a single date")

    # Check for overlapping leaves
    overlapping = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.employee_id == current_user.employee.id,
        models.LeaveRequest.status.in_(["APPROVED", "PENDING"]),
        models.LeaveRequest.start_date <= leave.end_date,
        models.LeaveRequest.end_date >= leave.start_date
    ).all()
    
    days_requested = 0.0
    current_date = leave.start_date
    
    skipped_weekend = 0
    skipped_holiday = 0
    skipped_existing = 0
    
    while current_date <= leave.end_date:
        if current_date.weekday() >= 5:
            skipped_weekend += 1
        elif is_public_holiday(db, current_date):
            skipped_holiday += 1
        else:
            # Calculate existing weight for this date
            existing_weight = 0.0
            for req in overlapping:
                if req.start_date <= current_date <= req.end_date:
                    if req.days_requested == 0.5 and req.start_date == req.end_date:
                        existing_weight += 0.5
                    else:
                        existing_weight += 1.0
            
            if is_half:
                # Explicit half day request
                if existing_weight + 0.5 > 1.0:
                    formatted_date = current_date.strftime('%B %d, %Y')
                    if existing_weight >= 1.0:
                        msg = f"Unable to process request: You already have a full day of leave scheduled on {formatted_date}."
                    else:
                        msg = f"Unable to process request: You have a half-day leave scheduled on {formatted_date}. This request exceeds the maximum allowance of 1 full day."
                    raise HTTPException(status_code=400, detail=msg)
                days_requested += 0.5
            else:
                # Automatically calculate remaining available time for the day
                available_for_day = max(0.0, 1.0 - existing_weight)
                if available_for_day == 0:
                    skipped_existing += 1
                days_requested += available_for_day
                
        current_date += timedelta(days=1)
        
    if days_requested <= 0:
        total_days = (leave.end_date - leave.start_date).days + 1
        if total_days == 1:
            if skipped_holiday > 0:
                raise HTTPException(status_code=400, detail="The requested date is a public holiday. You do not need to apply for leave.")
            elif skipped_weekend > 0:
                raise HTTPException(status_code=400, detail="The requested date falls on a weekend.")
            elif skipped_existing > 0:
                raise HTTPException(status_code=400, detail="You already have a leave scheduled for this date.")
            else:
                raise HTTPException(status_code=400, detail="Requested period contains no available working days.")
        else:
            if skipped_holiday > 0 and skipped_existing == 0 and skipped_weekend == 0:
                raise HTTPException(status_code=400, detail="The requested period only contains public holidays. You do not need to apply for leave.")
            elif skipped_weekend > 0 and skipped_holiday == 0 and skipped_existing == 0:
                raise HTTPException(status_code=400, detail="The requested period only contains weekends.")
            else:
                raise HTTPException(status_code=400, detail="Requested period contains no available working days. The dates fall on weekends, public holidays, or you already have leaves booked.")

    data = leave.model_dump() if hasattr(leave, "model_dump") else leave.dict()
    data.pop("is_half_day", None) # Remove from model dump as it's not in LeaveRequest
    data["employee_id"] = current_user.employee.id
    data["days_requested"] = days_requested
    data["status"] = "PENDING"
    
    db_leave = models.LeaveRequest(**data)
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)
    
    # Notify admins
    admins = db.query(models.User).join(models.Role).filter(models.Role.name.ilike("%ADMIN%")).all()
    for admin in admins:
        manager.notify_user_sync(
            db=db,
            user_id=admin.id,
            title="New Leave Request Submitted",
            message=f"{current_user.employee.first_name} has requested {days_requested} days of {leave.leave_type}.",
            type="leave_request",
            module="Leave",
            reference_id=db_leave.id,
            action_url="/leave-approval"
        )
        
    return db_leave

@router.put("/request/{request_id}", response_model=schemas.LeaveRequestResponse)
def update_my_leave_request(request_id: int, leave_update: schemas.LeaveRequestUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User is not linked to an employee profile")
        
    leave_req = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.id == request_id,
        models.LeaveRequest.employee_id == current_user.employee.id
    ).first()
    
    if not leave_req:
        raise HTTPException(status_code=404, detail="Leave request not found or not owned by user")

    if leave_req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Only pending leave requests can be updated")
        
    if leave_req.leave_type == "Emergency Leave":
        raise HTTPException(status_code=400, detail="Emergency leave requests cannot be updated")

    if leave_update.leave_type in ["Annual Leave", "Emergency Leave"]:
        balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == current_user.employee.id).first()
        annual_balance = balance.annual_leave_balance if balance else 14.0
        if not ALLOW_NEGATIVE_ANNUAL_LEAVE and annual_balance <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient Annual Leave balance. You cannot apply for Annual Leave or Emergency Leave with a balance of 0 or less."
            )

    if leave_update.end_date < leave_update.start_date:
        raise HTTPException(status_code=400, detail="End date must be after or equal to start date")

    is_half = getattr(leave_update, 'is_half_day', False)
    if is_half and leave_update.start_date != leave_update.end_date:
        raise HTTPException(status_code=400, detail="Half day leave must be on a single date")

    # Check for overlapping leaves, excluding the current request
    overlapping = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.employee_id == current_user.employee.id,
        models.LeaveRequest.status.in_(["APPROVED", "PENDING"]),
        models.LeaveRequest.id != request_id,
        models.LeaveRequest.start_date <= leave_update.end_date,
        models.LeaveRequest.end_date >= leave_update.start_date
    ).all()
    
    days_requested = 0.0
    current_date = leave_update.start_date
    
    skipped_weekend = 0
    skipped_holiday = 0
    skipped_existing = 0
    
    while current_date <= leave_update.end_date:
        if current_date.weekday() >= 5:
            skipped_weekend += 1
        elif is_public_holiday(db, current_date):
            skipped_holiday += 1
        else:
            # Calculate existing weight for this date
            existing_weight = 0.0
            for req in overlapping:
                if req.start_date <= current_date <= req.end_date:
                    if req.days_requested == 0.5 and req.start_date == req.end_date:
                        existing_weight += 0.5
                    else:
                        existing_weight += 1.0
            
            if is_half:
                if existing_weight + 0.5 > 1.0:
                    formatted_date = current_date.strftime('%B %d, %Y')
                    if existing_weight >= 1.0:
                        msg = f"Unable to process request: You already have a full day of leave scheduled on {formatted_date}."
                    else:
                        msg = f"Unable to process request: You have a half-day leave scheduled on {formatted_date}. This request exceeds the maximum allowance of 1 full day."
                    raise HTTPException(status_code=400, detail=msg)
                days_requested += 0.5
            else:
                available_for_day = max(0.0, 1.0 - existing_weight)
                if available_for_day == 0:
                    skipped_existing += 1
                days_requested += available_for_day
                
        current_date += timedelta(days=1)
        
    if days_requested <= 0:
        total_days = (leave_update.end_date - leave_update.start_date).days + 1
        if total_days == 1:
            if skipped_holiday > 0:
                raise HTTPException(status_code=400, detail="The requested date is a public holiday. You do not need to apply for leave.")
            elif skipped_weekend > 0:
                raise HTTPException(status_code=400, detail="The requested date falls on a weekend.")
            elif skipped_existing > 0:
                raise HTTPException(status_code=400, detail="You already have a leave scheduled for this date.")
            else:
                raise HTTPException(status_code=400, detail="Requested period contains no available working days.")
        else:
            if skipped_holiday > 0 and skipped_existing == 0 and skipped_weekend == 0:
                raise HTTPException(status_code=400, detail="The requested period only contains public holidays. You do not need to apply for leave.")
            elif skipped_weekend > 0 and skipped_holiday == 0 and skipped_existing == 0:
                raise HTTPException(status_code=400, detail="The requested period only contains weekends.")
            else:
                raise HTTPException(status_code=400, detail="Requested period contains no available working days. The dates fall on weekends, public holidays, or you already have leaves booked.")

    # Update fields
    leave_req.start_date = leave_update.start_date
    leave_req.end_date = leave_update.end_date
    leave_req.leave_type = leave_update.leave_type
    leave_req.reason = leave_update.reason
    leave_req.days_requested = days_requested
    
    db.commit()
    db.refresh(leave_req)
    
    # Notify admins
    admins = db.query(models.User).join(models.Role).filter(models.Role.name.ilike("%ADMIN%")).all()
    for admin in admins:
        manager.notify_user_sync(
            db=db,
            user_id=admin.id,
            title="Leave Request Updated",
            message=f"{current_user.employee.first_name} has updated their pending {leave_req.leave_type} request to {days_requested} days.",
            type="leave_request",
            module="Leave",
            reference_id=leave_req.id,
            action_url="/leave-approval"
        )
        
    return leave_req

@router.put("/requests/{request_id}/allocation", response_model=schemas.LeaveRequestResponse)
def update_leave_allocation(request_id: int, payload: schemas.LeaveAllocationUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Admin access required")
    
    leave_req = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == request_id).first()
    if not leave_req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if leave_req.leave_type != "Leave Allocation":
        raise HTTPException(status_code=400, detail="Only Leave Allocation requests can be edited via this endpoint")

    if (payload.days_requested * 2) % 1 != 0:
        raise HTTPException(status_code=400, detail="Leave days must be in increments of 0.5 (half-day or full-day).")

    # Calculate delta
    old_days = leave_req.days_requested
    delta = payload.days_requested - old_days
    
    # Update LeaveRequest
    leave_req.days_requested = payload.days_requested
    leave_req.reason = payload.reason
    leave_req.approved_by = current_user.id
    leave_req.approved_at = datetime.now()
    
    # Update Employee Balance
    balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == leave_req.employee_id).first()
    if balance:
        old_annual = balance.annual_leave_balance
        balance.annual_leave_balance += delta
        balance.updated_by = current_user.id
        balance.updated_at = datetime.now()
        
        # Create Audit Log
        audit = models.LeaveBalanceAudit(
            employee_id=leave_req.employee_id,
            old_annual_balance=old_annual,
            new_annual_balance=balance.annual_leave_balance,
            old_sick_balance=balance.sick_leave_balance,
            new_sick_balance=balance.sick_leave_balance,
            old_annual_taken=balance.annual_leave_taken,
            new_annual_taken=balance.annual_leave_taken,
            old_sick_taken=balance.sick_leave_taken,
            new_sick_taken=balance.sick_leave_taken,
            reason=f"Revised Leave Allocation: {payload.reason}",
            updated_by=current_user.id
        )
        db.add(audit)
        
    db.commit()
    db.refresh(leave_req)
    return leave_req

from fastapi import UploadFile, File
import os
import shutil
import uuid

@router.post("/request/{id}/upload-attachment")
async def upload_leave_attachment(id: int, file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=403, detail="Not an employee")
    
    leave_req = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.id == id,
        models.LeaveRequest.employee_id == current_user.employee.id
    ).first()
    
    if not leave_req:
        raise HTTPException(status_code=404, detail="Leave request not found or not owned by user")
    
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Only PNG and JPEG images are allowed")
        
    from storage import upload_file_to_supabase
    file_bytes = await file.read()
    
    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds the 10 MB limit")
        
    file_url = upload_file_to_supabase(file_bytes, file.filename, "hrms-documents")
    
    leave_req.attachment_url = file_url
    db.commit()
    
    return {"message": "Attachment uploaded successfully", "attachment_url": leave_req.attachment_url}
