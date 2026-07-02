from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_
from typing import List, Optional
import datetime
import calendar

import models, auth, database
from database import get_db

router = APIRouter(
    prefix="/api/calendar",
    tags=["Calendar"],
    dependencies=[Depends(auth.get_current_user)]
)

@router.get("/monthly-overview")
def get_monthly_overview(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    department_id: Optional[int] = Query(None),
    manager_id: Optional[int] = Query(None),
    leave_type: Optional[str] = Query(None),
    leave_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Detect admin role or email
    is_admin = (
        (current_user.role and "ADMIN" in current_user.role.name.upper()) or 
        current_user.email == "admin@mcs-consulting.com" or 
        current_user.role_id == 1
    )
    
    # Filter by user's company if not an admin and company_name is assigned
    user_company = None
    if not is_admin and current_user.employee and current_user.employee.company_name:
        user_company = current_user.employee.company_name

    # Overlap range for leaves in this month
    start_date = datetime.date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = datetime.date(year, month, last_day)

    # Base query for leaves
    query = db.query(models.LeaveRequest).join(
        models.Employee, models.LeaveRequest.employee_id == models.Employee.id
    ).filter(
        models.LeaveRequest.leave_type != "Leave Allocation"
    )
    if user_company:
        query = query.filter(models.Employee.company_name == user_company)

    # Date overlap filter
    query = query.filter(
        and_(
            models.LeaveRequest.start_date <= end_date,
            models.LeaveRequest.end_date >= start_date
        )
    )

    # Apply filters
    if department_id is not None:
        query = query.filter(models.Employee.department_id == department_id)
    if manager_id is not None:
        query = query.filter(models.Employee.manager_id == manager_id)
    if leave_type:
        query = query.filter(models.LeaveRequest.leave_type == leave_type)
    if leave_status:
        query = query.filter(models.LeaveRequest.status == leave_status)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Employee.first_name.ilike(search_filter),
                models.Employee.last_name.ilike(search_filter)
            )
        )

    leaves = query.all()

    # Query public holidays in this month
    holidays = db.query(models.PublicHoliday).filter(
        or_(
            and_(
                models.PublicHoliday.recurring == True,
                extract('month', models.PublicHoliday.holiday_date) == month
            ),
            and_(
                models.PublicHoliday.recurring == False,
                extract('year', models.PublicHoliday.holiday_date) == year,
                extract('month', models.PublicHoliday.holiday_date) == month
            )
        )
    ).all()

    # Resolve actual dates for holidays in the requested year
    resolved_holidays = []
    for h in holidays:
        holiday_dt = h.holiday_date
        if h.recurring:
            try:
                holiday_dt = datetime.date(year, h.holiday_date.month, h.holiday_date.day)
            except ValueError:
                if h.holiday_date.month == 2 and h.holiday_date.day == 29:
                    # Non-leap year fallback
                    holiday_dt = datetime.date(year, 2, 28)
        
        resolved_holidays.append({
            "id": h.id,
            "holiday_name": h.holiday_name,
            "holiday_date": holiday_dt.strftime("%Y-%m-%d"),
            "holiday_type": h.holiday_type,
            "recurring": h.recurring,
            "description": h.description
        })

    # Stats logic
    today = datetime.date.today()
    on_leave_today_count = db.query(models.LeaveRequest).filter(
        and_(
            models.LeaveRequest.status == models.LeaveStatus.APPROVED,
            models.LeaveRequest.leave_type != "Leave Allocation",
            models.LeaveRequest.start_date <= today,
            models.LeaveRequest.end_date >= today
        )
    ).count()

    pending_leaves_count = db.query(models.LeaveRequest).filter(
        and_(
            models.LeaveRequest.status == models.LeaveStatus.PENDING,
            models.LeaveRequest.leave_type != "Leave Allocation"
        )
    ).count()

    total_active_employees = db.query(models.Employee).filter(
        models.Employee.status == models.EmploymentStatus.ACTIVE
    ).count()

    availability_pct = 100.0
    if total_active_employees > 0:
        availability_pct = round(((total_active_employees - on_leave_today_count) / total_active_employees) * 100, 1)

    # Next holiday countdown
    all_holidays = db.query(models.PublicHoliday).all()
    upcoming_holidays = []
    for h in all_holidays:
        dt = h.holiday_date
        if h.recurring:
            try:
                dt = datetime.date(today.year, h.holiday_date.month, h.holiday_date.day)
            except ValueError:
                if h.holiday_date.month == 2 and h.holiday_date.day == 29 and not calendar.isleap(today.year):
                    dt = datetime.date(today.year, 2, 28)
            
            if dt < today:
                try:
                    dt = datetime.date(today.year + 1, h.holiday_date.month, h.holiday_date.day)
                except ValueError:
                    if h.holiday_date.month == 2 and h.holiday_date.day == 29 and not calendar.isleap(today.year + 1):
                        dt = datetime.date(today.year + 1, 2, 28)
        
        if dt >= today:
            upcoming_holidays.append({
                "holiday_name": h.holiday_name,
                "holiday_date": dt,
                "holiday_type": h.holiday_type,
                "days_away": (dt - today).days
            })

    upcoming_holidays.sort(key=lambda x: x["days_away"])
    next_holiday = None
    if upcoming_holidays:
        next_h = upcoming_holidays[0]
        next_holiday = {
            "holiday_name": next_h["holiday_name"],
            "holiday_date": next_h["holiday_date"].strftime("%Y-%m-%d"),
            "holiday_type": next_h["holiday_type"],
            "days_away": next_h["days_away"]
        }

    # Filters data
    departments = db.query(models.Department).all()
    
    # Unique manager employees
    manager_ids = [r[0] for r in db.query(models.Employee.manager_id).distinct().all() if r[0] is not None]
    managers = db.query(models.Employee).filter(models.Employee.id.in_(manager_ids)).all()

    serialized_leaves = []
    for leave in leaves:
        serialized_leaves.append({
            "id": leave.id,
            "employee_id": leave.employee_id,
            "employee_name": f"{leave.employee.first_name} {leave.employee.last_name or ''}".strip(),
            "profile_photo": leave.employee.profile_photo,
            "department_name": leave.employee.department.name if leave.employee.department else "N/A",
            "department_id": leave.employee.department_id,
            "manager_name": f"{leave.employee.manager.first_name} {leave.employee.manager.last_name or ''}".strip() if leave.employee.manager else "N/A",
            "manager_id": leave.employee.manager_id,
            "start_date": leave.start_date.strftime("%Y-%m-%d"),
            "end_date": leave.end_date.strftime("%Y-%m-%d"),
            "leave_type": leave.leave_type,
            "days_requested": leave.days_requested,
            "status": leave.status.value if hasattr(leave.status, 'value') else str(leave.status),
            "reason": leave.reason if leave.status == models.LeaveStatus.APPROVED else None # mask reasons for unapproved leaves or keep basic info
        })

    return {
        "leaves": serialized_leaves,
        "holidays": resolved_holidays,
        "stats": {
            "on_leave_today": on_leave_today_count,
            "pending_leaves": pending_leaves_count,
            "total_active_employees": total_active_employees,
            "team_availability_pct": availability_pct,
            "next_holiday": next_holiday
        },
        "filters": {
            "departments": [{"id": d.id, "name": d.name} for d in departments],
            "managers": [{"id": m.id, "name": f"{m.first_name} {m.last_name or ''}".strip()} for m in managers]
        }
    }

@router.get("/upcoming-leaves")
def get_upcoming_leaves(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    is_admin = (
        (current_user.role and "ADMIN" in current_user.role.name.upper()) or 
        current_user.email == "admin@mcs-consulting.com" or 
        current_user.role_id == 1
    )
    
    user_company = None
    if not is_admin and current_user.employee and current_user.employee.company_name:
        user_company = current_user.employee.company_name

    today = datetime.date.today()
    query = db.query(models.LeaveRequest).join(
        models.Employee, models.LeaveRequest.employee_id == models.Employee.id
    ).filter(
        and_(
            models.LeaveRequest.status == models.LeaveStatus.APPROVED,
            models.LeaveRequest.leave_type != "Leave Allocation",
            models.LeaveRequest.end_date >= today
        )
    )
    if user_company:
        query = query.filter(models.Employee.company_name == user_company)
        
    leaves = query.order_by(models.LeaveRequest.start_date).limit(10).all()

    return [{
        "id": l.id,
        "employee_name": f"{l.employee.first_name} {l.employee.last_name or ''}".strip(),
        "leave_type": l.leave_type,
        "start_date": l.start_date.strftime("%Y-%m-%d"),
        "end_date": l.end_date.strftime("%Y-%m-%d"),
        "days": l.days_requested,
        "status": l.status.value if hasattr(l.status, 'value') else str(l.status)
    } for l in leaves]

@router.get("/public-holidays")
def get_calendar_public_holidays(year: Optional[int] = None, db: Session = Depends(get_db)):
    if not year:
        year = datetime.date.today().year

    holidays = db.query(models.PublicHoliday).all()
    resolved = []
    for h in holidays:
        dt = h.holiday_date
        if h.recurring:
            try:
                dt = datetime.date(year, h.holiday_date.month, h.holiday_date.day)
            except ValueError:
                if h.holiday_date.month == 2 and h.holiday_date.day == 29:
                    dt = datetime.date(year, 2, 28)
        
        resolved.append({
            "id": h.id,
            "holiday_name": h.holiday_name,
            "holiday_date": dt.strftime("%Y-%m-%d"),
            "holiday_type": h.holiday_type,
            "recurring": h.recurring,
            "description": h.description
        })
    
    resolved.sort(key=lambda x: x["holiday_date"])
    return resolved
