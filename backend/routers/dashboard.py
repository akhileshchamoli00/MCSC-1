from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract, and_
from typing import List, Optional
import datetime
import calendar

import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/admin")
def get_admin_kpis(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Not authorized")
    
    today = datetime.date.today()
    current_month = today.month
    current_year = today.year
    
    # 1. Total Employees
    total_employees = db.query(models.Employee).filter(models.Employee.status == "ACTIVE").count()
    
    # 2. Present Today
    present_today = db.query(models.Attendance).filter(
        func.date(models.Attendance.attendance_date) == today,
        models.Attendance.status == "Present"
    ).count()
    
    # 3. Employees on Leave
    on_leave = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.status == "APPROVED",
        models.LeaveRequest.start_date <= today,
        models.LeaveRequest.end_date >= today
    ).count()
    
    # 4. Pending Leave Requests
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "PENDING").count()
    
    # 5. Monthly Payroll Cost
    # We use payrolls where status != Draft, for the current month
    payroll_cost = db.query(func.sum(models.Payroll.net_salary)).filter(
        models.Payroll.payroll_month == current_month,
        models.Payroll.payroll_year == current_year,
        models.Payroll.status != "Draft"
    ).scalar() or 0.0
    
    # 6. Assigned Assets
    assigned_assets = db.query(models.AssetAssignment).filter(models.AssetAssignment.status == "ACTIVE").count()
    
    # 7. Pending Timesheets
    pending_timesheets_count = db.query(models.Timesheet).filter(models.Timesheet.status == "SUBMITTED").count()
    
    return {
        "total_employees": total_employees,
        "present_today": present_today,
        "on_leave": on_leave,
        "pending_leaves": pending_leaves,
        "monthly_payroll": payroll_cost,
        "assigned_assets": assigned_assets,
        "pending_timesheets_count": pending_timesheets_count
    }

@router.get("/employee-growth")
def get_employee_growth(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from collections import Counter
    
    # Query all hire dates (excluding nulls) ordered by hire_date
    hire_dates = db.query(models.Employee.hire_date).filter(
        models.Employee.hire_date.isnot(None)
    ).order_by(models.Employee.hire_date).all()
    
    # Format dates to YYYY-MM and count occurrences
    months = [row[0].strftime("%Y-%m") for row in hire_dates if row[0]]
    counts = Counter(months)
    
    # Compute cumulative employee count
    data = []
    cumulative = 0
    sorted_months = sorted(list(set(months)))
    for m in sorted_months:
        cumulative += counts[m]
        data.append({"month": m, "count": cumulative})
        
    return data

@router.get("/attendance-trend")
def get_attendance_trend(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Get last 30 days of attendance %
    # Total active employees per day (simplification: total employees right now)
    total_employees = db.query(models.Employee).filter(models.Employee.status == "ACTIVE").count()
    if total_employees == 0:
        return []
        
    results = db.query(
        models.Attendance.attendance_date,
        func.count(models.Attendance.id)
    ).filter(
        models.Attendance.status == "Present"
    ).group_by(models.Attendance.attendance_date).order_by(models.Attendance.attendance_date.desc()).limit(30).all()
    
    data = []
    for r in reversed(results):
        pct = (r[1] / total_employees) * 100
        data.append({
            "date": r[0].strftime("%Y-%m-%d"),
            "percentage": round(pct, 1)
        })
    return data

@router.get("/leave-distribution")
def get_leave_distribution(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    results = db.query(
        models.LeaveRequest.leave_type,
        func.count(models.LeaveRequest.id)
    ).filter(
        models.LeaveRequest.status == "APPROVED"
    ).group_by(models.LeaveRequest.leave_type).all()
    
    return [{"name": r[0], "value": r[1]} for r in results]

@router.get("/department-headcount")
def get_department_headcount(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    results = db.query(
        models.Department.name,
        func.count(models.Employee.id)
    ).join(models.Employee, models.Department.id == models.Employee.department_id).group_by(models.Department.name).all()
    
    return [{"name": r[0], "value": r[1]} for r in results]

@router.get("/recent-leaves")
def get_recent_leaves(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    leaves = db.query(models.LeaveRequest).options(joinedload(models.LeaveRequest.employee)).order_by(models.LeaveRequest.created_at.desc()).limit(10).all()
    data = []
    for l in leaves:
        data.append({
            "id": l.id,
            "employee_name": f"{l.employee.first_name} {l.employee.last_name}",
            "leave_type": l.leave_type,
            "days": l.days_requested,
            "status": l.status,
            "applied_date": l.created_at.strftime("%Y-%m-%d") if l.created_at else None
        })
    return data

@router.get("/pending-timesheets")
def get_pending_timesheets(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    timesheets = db.query(models.Timesheet).options(joinedload(models.Timesheet.employee)).filter(
        models.Timesheet.status == "SUBMITTED"
    ).order_by(models.Timesheet.updated_at.desc()).limit(10).all()
    
    data = []
    for ts in timesheets:
        data.append({
            "id": ts.id,
            "employee_name": f"{ts.employee.first_name} {ts.employee.last_name}",
            "week_start": ts.week_start.strftime("%Y-%m-%d"),
            "total_hours": ts.total_hours,
            "status": ts.status,
            "submitted_date": ts.updated_at.strftime("%Y-%m-%d") if ts.updated_at else None
        })
    return data

@router.get("/recent-activities")
def get_recent_activities(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    logs = db.query(models.AuditLog).options(joinedload(models.AuditLog.employee)).order_by(models.AuditLog.created_at.desc()).limit(15).all()
    data = []
    for log in logs:
        emp_name = f"{log.employee.first_name} {log.employee.last_name}" if log.employee else "System"
        data.append({
            "id": log.id,
            "employee_name": emp_name,
            "activity": log.activity,
            "date_time": log.created_at.strftime("%Y-%m-%d %H:%M") if log.created_at else None
        })
    return data

@router.get("/employee")
def get_employee_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    employee = current_user.employee
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
        
    today = datetime.date.today()
    current_month = today.month
    current_year = today.year
    
    # Leave Balances
    leave_balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == employee.id).first()
    ann_leave = leave_balance.annual_leave_balance if leave_balance else 0
    sick_leave = leave_balance.sick_leave_balance if leave_balance else 0
    
    # Attendance This Month
    # Count working days passed in this month vs present days
    present_days = db.query(models.Attendance).filter(
        models.Attendance.employee_id == employee.id,
        func.extract('month', models.Attendance.attendance_date) == current_month,
        func.extract('year', models.Attendance.attendance_date) == current_year,
        models.Attendance.status == "Present"
    ).count()
    
    # simple estimate: 20 working days a month
    attendance_pct = (present_days / 20) * 100 if present_days > 0 else 0
    if attendance_pct > 100: attendance_pct = 100
    
    # Pending Leave Requests
    pending_leaves = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.employee_id == employee.id,
        models.LeaveRequest.status == "PENDING"
    ).count()
    
    # Assigned Assets
    assets = db.query(models.AssetAssignment).filter(
        models.AssetAssignment.employee_id == employee.id,
        models.AssetAssignment.status == "ACTIVE"
    ).all()
    assigned_assets = [a.asset.asset_type for a in assets]
    
    # Leave History
    leave_history_q = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.employee_id == employee.id
    ).order_by(models.LeaveRequest.created_at.desc()).limit(5).all()
    
    leave_history = []
    for l in leave_history_q:
        leave_history.append({
            "type": l.leave_type,
            "days": l.days_requested,
            "status": l.status
        })
        
    # Latest Payslip
    payslip = db.query(models.Payroll).filter(
        models.Payroll.employee_id == employee.id,
        models.Payroll.status == "Paid"
    ).order_by(models.Payroll.payroll_year.desc(), models.Payroll.payroll_month.desc()).first()
    
    payslip_data = None
    if payslip:
        payslip_data = {
            "month": calendar.month_name[payslip.payroll_month] + f" {payslip.payroll_year}",
            "net_salary": payslip.net_salary,
            "id": payslip.id
        }
        
    # Recent Timesheets
    timesheets_q = db.query(models.Timesheet).filter(
        models.Timesheet.employee_id == employee.id
    ).order_by(models.Timesheet.week_start.desc()).limit(5).all()
    
    recent_timesheets = []
    for ts in timesheets_q:
        recent_timesheets.append({
            "id": ts.id,
            "week_start": ts.week_start.strftime("%Y-%m-%d"),
            "total_hours": ts.total_hours,
            "status": ts.status
        })
        
    return {
        "leave_balances": {
            "annual": ann_leave,
            "sick": sick_leave
        },
        "attendance_pct": round(attendance_pct, 1),
        "pending_leaves": pending_leaves,
        "assigned_assets": assigned_assets,
        "leave_history": leave_history,
        "latest_payslip": payslip_data,
        "recent_timesheets": recent_timesheets
    }

@router.get("/upcoming-holidays")
def get_upcoming_holidays(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    today = datetime.date.today()
    current_year = today.year
    
    holidays = db.query(models.PublicHoliday).all()
    upcoming = []
    
    for h in holidays:
        # Resolve actual date for this year
        dt = h.holiday_date
        if h.recurring:
            try:
                dt = datetime.date(current_year, h.holiday_date.month, h.holiday_date.day)
            except ValueError:
                # leap year handling (Feb 29)
                if h.holiday_date.month == 2 and h.holiday_date.day == 29 and not calendar.isleap(current_year):
                    dt = datetime.date(current_year, 2, 28)
            
            # If it already passed this year, show next year
            if dt < today:
                try:
                    dt = datetime.date(current_year + 1, h.holiday_date.month, h.holiday_date.day)
                except ValueError:
                    if h.holiday_date.month == 2 and h.holiday_date.day == 29 and not calendar.isleap(current_year + 1):
                        dt = datetime.date(current_year + 1, 2, 28)
                        
        if dt >= today:
            upcoming.append({
                "id": h.id,
                "holiday_name": h.holiday_name,
                "holiday_date": dt.strftime("%Y-%m-%d"),
                "holiday_type": h.holiday_type,
                "days_away": (dt - today).days
            })
            
    # Sort by days away
    upcoming.sort(key=lambda x: x["days_away"])
    return upcoming[:5]

@router.get("/admin-summary")
def get_admin_dashboard_summary(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Not authorized")
        
    today = datetime.date.today()
    current_month = today.month
    current_year = today.year
    
    # 1. KPIs
    total_employees = db.query(models.Employee).filter(models.Employee.status == "ACTIVE").count()
    present_today = db.query(models.Attendance).filter(
        func.date(models.Attendance.attendance_date) == today,
        models.Attendance.status == "Present"
    ).count()
    on_leave = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.status == "APPROVED",
        models.LeaveRequest.start_date <= today,
        models.LeaveRequest.end_date >= today
    ).count()
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "PENDING").count()
    payroll_cost = db.query(func.sum(models.Payroll.net_salary)).filter(
        models.Payroll.payroll_month == current_month,
        models.Payroll.payroll_year == current_year,
        models.Payroll.status != "Draft"
    ).scalar() or 0.0
    assigned_assets = db.query(models.AssetAssignment).filter(models.AssetAssignment.status == "ACTIVE").count()
    pending_timesheets_count = db.query(models.Timesheet).filter(models.Timesheet.status == "SUBMITTED").count()
    
    kpis = {
        "total_employees": total_employees,
        "present_today": present_today,
        "on_leave": on_leave,
        "pending_leaves": pending_leaves,
        "monthly_payroll": payroll_cost,
        "assigned_assets": assigned_assets,
        "pending_timesheets_count": pending_timesheets_count
    }

    # 2. Employee Growth
    from collections import Counter
    hire_dates = db.query(models.Employee.hire_date).filter(
        models.Employee.hire_date.isnot(None)
    ).order_by(models.Employee.hire_date).all()
    months = [row[0].strftime("%Y-%m") for row in hire_dates if row[0]]
    counts = Counter(months)
    growth_data = []
    cumulative = 0
    sorted_months = sorted(list(set(months)))
    for m in sorted_months:
        cumulative += counts[m]
        growth_data.append({"month": m, "count": cumulative})

    # 3. Attendance Trend
    attendance_trend = []
    if total_employees > 0:
        results = db.query(
            models.Attendance.attendance_date,
            func.count(models.Attendance.id)
        ).filter(
            models.Attendance.status == "Present"
        ).group_by(models.Attendance.attendance_date).order_by(models.Attendance.attendance_date.desc()).limit(30).all()
        for r in reversed(results):
            pct = (r[1] / total_employees) * 100
            attendance_trend.append({
                "date": r[0].strftime("%Y-%m-%d"),
                "percentage": round(pct, 1)
            })

    # 4. Leave Distribution
    leave_dist_results = db.query(
        models.LeaveRequest.leave_type,
        func.count(models.LeaveRequest.id)
    ).filter(
        models.LeaveRequest.status == "APPROVED"
    ).group_by(models.LeaveRequest.leave_type).all()
    leave_distribution = [{"name": r[0], "value": r[1]} for r in leave_dist_results]

    # 5. Department Headcount
    dept_results = db.query(
        models.Department.name,
        func.count(models.Employee.id)
    ).join(models.Employee, models.Department.id == models.Employee.department_id).group_by(models.Department.name).all()
    department_headcount = [{"name": r[0], "value": r[1]} for r in dept_results]

    # 6. Recent Leaves
    recent_leaves_query = db.query(models.LeaveRequest).options(joinedload(models.LeaveRequest.employee)).order_by(models.LeaveRequest.created_at.desc()).limit(10).all()
    recent_leaves = []
    for l in recent_leaves_query:
        recent_leaves.append({
            "id": l.id,
            "employee_name": f"{l.employee.first_name} {l.employee.last_name}",
            "leave_type": l.leave_type,
            "days": l.days_requested,
            "status": l.status,
            "applied_date": l.created_at.strftime("%Y-%m-%d") if l.created_at else None
        })

    # 7. Pending Timesheets
    pending_ts_query = db.query(models.Timesheet).options(joinedload(models.Timesheet.employee)).filter(
        models.Timesheet.status == "SUBMITTED"
    ).order_by(models.Timesheet.updated_at.desc()).limit(10).all()
    pending_timesheets = []
    for ts in pending_ts_query:
        pending_timesheets.append({
            "id": ts.id,
            "employee_name": f"{ts.employee.first_name} {ts.employee.last_name}",
            "week_start": ts.week_start.strftime("%Y-%m-%d"),
            "total_hours": ts.total_hours,
            "status": ts.status,
            "submitted_date": ts.updated_at.strftime("%Y-%m-%d") if ts.updated_at else None
        })

    # 8. Upcoming Holidays
    all_holidays = db.query(models.PublicHoliday).all()
    upcoming = []
    for h in all_holidays:
        dt = h.holiday_date
        if h.recurring:
            try:
                dt = datetime.date(current_year, h.holiday_date.month, h.holiday_date.day)
            except ValueError:
                if h.holiday_date.month == 2 and h.holiday_date.day == 29 and not calendar.isleap(current_year):
                    dt = datetime.date(current_year, 2, 28)
            if dt < today:
                try:
                    dt = datetime.date(current_year + 1, h.holiday_date.month, h.holiday_date.day)
                except ValueError:
                    if h.holiday_date.month == 2 and h.holiday_date.day == 29 and not calendar.isleap(current_year + 1):
                        dt = datetime.date(current_year + 1, 2, 28)
        if dt >= today:
            upcoming.append({
                "id": h.id,
                "holiday_name": h.holiday_name,
                "holiday_date": dt.strftime("%Y-%m-%d"),
                "holiday_type": h.holiday_type,
                "days_away": (dt - today).days
            })
    upcoming.sort(key=lambda x: x["days_away"])
    upcoming_holidays = upcoming[:5]

    # 9. Performance Stats
    reviews_query = db.query(models.EmployeeReview)
    goals_query = db.query(models.ReviewGoal)
    total_reviews = reviews_query.count()
    pending_reviews = reviews_query.filter(models.EmployeeReview.status == "Draft").count()
    completed_reviews = reviews_query.filter(models.EmployeeReview.status == "Submitted").count()
    needing_improvement = reviews_query.filter(
        models.EmployeeReview.status == "Submitted",
        models.EmployeeReview.overall_rating.in_(["Needs Improvement", "Poor"])
    ).count()
    top_performers = reviews_query.filter(
        models.EmployeeReview.status == "Submitted",
        models.EmployeeReview.overall_rating.in_(["Excellent", "Good"])
    ).count()
    
    upcoming_goals_query = goals_query.options(joinedload(models.ReviewGoal.employee)).filter(
        models.ReviewGoal.status.in_(["Not Started", "In Progress"]),
        models.ReviewGoal.target_date >= today
    ).order_by(models.ReviewGoal.target_date.asc()).limit(5).all()
    upcoming_goals_list = []
    for g in upcoming_goals_query:
        upcoming_goals_list.append({
            "id": g.id,
            "title": g.title,
            "target_date": g.target_date.strftime("%Y-%m-%d") if g.target_date else None,
            "progress_pct": g.progress_pct,
            "employee_name": f"{g.employee.first_name} {g.employee.last_name}" if g.employee else "Unknown"
        })
        
    dept_summary = []
    departments = db.query(models.Department).all()
    for dept in departments:
        reviews_count = db.query(models.EmployeeReview).join(
            models.Employee, models.EmployeeReview.employee_id == models.Employee.id
        ).filter(
            models.Employee.department_id == dept.id,
            models.EmployeeReview.status == "Submitted"
        ).count()
        dept_summary.append({
            "department_name": dept.name,
            "completed_reviews": reviews_count
        })

    ratings_dist = []
    for r_type in ["Excellent", "Good", "Average", "Needs Improvement", "Poor"]:
        cnt = reviews_query.filter(
            models.EmployeeReview.status == "Submitted",
            models.EmployeeReview.overall_rating == r_type
        ).count()
        ratings_dist.append({"name": r_type, "value": cnt})

    goals_dist = []
    for g_status in ["Not Started", "In Progress", "Completed"]:
        cnt = goals_query.filter(models.ReviewGoal.status == g_status).count()
        goals_dist.append({"name": g_status, "value": cnt})

    performance_stats = {
        "pending_reviews": pending_reviews,
        "completed_reviews": completed_reviews,
        "needing_improvement": needing_improvement,
        "top_performers": top_performers,
        "upcoming_goals": upcoming_goals_list,
        "department_summary": dept_summary,
        "ratings_distribution": ratings_dist,
        "goals_status_distribution": goals_dist
    }

    return {
        "kpis": kpis,
        "employee_growth": growth_data,
        "attendance_trend": attendance_trend,
        "leave_distribution": leave_distribution,
        "department_headcount": department_headcount,
        "recent_leaves": recent_leaves,
        "pending_timesheets": pending_timesheets,
        "upcoming_holidays": upcoming_holidays,
        "performance_stats": performance_stats
    }
