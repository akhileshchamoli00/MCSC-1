from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, time, timedelta
import math
import pytz

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/attendance",
    tags=["attendance"],
    dependencies=[Depends(auth.get_current_user)]
)

local_tz = pytz.timezone('Asia/Jakarta')

def get_local_now():
    return datetime.now(local_tz)

def get_local_today():
    return get_local_now().date()

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # radius of Earth in meters
    phi_1 = math.radians(lat1)
    phi_2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi_1) * math.cos(phi_2) * math.sin(delta_lambda / 2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_settings(db: Session):
    settings = db.query(models.AttendanceSettings).first()
    if not settings:
        settings = models.AttendanceSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def recalculate_attendance(attendance: models.Attendance):
    if attendance.clock_in_time:
        start_time = local_tz.localize(datetime.combine(attendance.attendance_date, time(9, 0)))
        clock_in_local = attendance.clock_in_time.astimezone(local_tz) if attendance.clock_in_time.tzinfo else local_tz.localize(attendance.clock_in_time)
        if clock_in_local > start_time:
            late_diff = clock_in_local - start_time
            late_minutes = int(late_diff.total_seconds() / 60)
            attendance.late_minutes = late_minutes
            attendance.status = "Late"
        else:
            attendance.late_minutes = 0
            attendance.status = "Present"
            
    if attendance.clock_in_time and attendance.clock_out_time:
        diff = attendance.clock_out_time - attendance.clock_in_time
        hours = diff.total_seconds() / 3600.0
        attendance.working_hours = round(hours, 2)
        if hours < 4.0:
            attendance.status = "Half Day"

# ==========================================
# EMPLOYEE ENDPOINTS
# ==========================================

def get_client_ip(request: Request) -> str:
    """
    Extracts the genuine client public IP address through multiple reverse proxy hops (Nginx, Next.js).
    Filters out internal loopback/proxy IPs (127.0.0.1, ::1).
    """
    # 1. Check X-Real-IP first
    real_ip = request.headers.get("X-Real-IP")
    if real_ip and real_ip.strip():
        ip = real_ip.strip().replace("::ffff:", "")
        if ip not in ("127.0.0.1", "::1", "localhost"):
            return ip

    # 2. Check X-Forwarded-For (comma-separated list of proxy hops)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ips = [i.strip().replace("::ffff:", "") for i in forwarded.split(",") if i.strip()]
        for ip in ips:
            if ip not in ("127.0.0.1", "::1", "localhost"):
                return ip
        # If all were loopback, return the first one
        if ips:
            return ips[0]

    # 3. Direct client host fallback
    if request.client and request.client.host:
        ip = request.client.host.replace("::ffff:", "")
        if ip == "::1":
            return "127.0.0.1"
        return ip

    return "127.0.0.1"


def validate_ip(request: Request, settings):
    if settings.allowed_ip_address and settings.allowed_ip_address.strip():
        client_ip = get_client_ip(request)

        allowed_ips = [ip.strip() for ip in settings.allowed_ip_address.split(",") if ip.strip()]
        
        # If localhost is explicitly allowed or 127.0.0.1 is in list
        if client_ip in ("127.0.0.1", "localhost") and any(ip in ["127.0.0.1", "localhost", "0.0.0.0"] for ip in allowed_ips):
            return

        is_allowed = False
        import ipaddress
        try:
            client_ip_obj = ipaddress.ip_address(client_ip)
            for allowed in allowed_ips:
                if '/' in allowed:
                    if client_ip_obj in ipaddress.ip_network(allowed, strict=False):
                        is_allowed = True
                        break
                else:
                    norm_allowed = allowed.replace("::ffff:", "")
                    if norm_allowed in ("::1", "localhost"):
                        norm_allowed = "127.0.0.1"
                    if client_ip == norm_allowed:
                        is_allowed = True
                        break
        except ValueError:
            # Fallback to simple string match if parsing fails
            if client_ip in allowed_ips:
                is_allowed = True
                
        if not is_allowed:
            raise HTTPException(
                status_code=403, 
                detail=f"Network Access Denied: You must be connected to the Office Wi-Fi to clock in/out. (Detected IP: {client_ip})"
            )

@router.post("/clock-in", response_model=schemas.AttendanceResponse)
def clock_in(request: Request, req: schemas.AttendanceClockInRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User is not linked to an employee profile")
    
    settings = get_settings(db)
    
    distance = haversine(req.latitude, req.longitude, settings.latitude, settings.longitude)
    if distance > settings.radius_meters:
        raise HTTPException(status_code=400, detail=f"You are outside the allowed office attendance zone (Distance: {int(distance)}m). Move within {settings.radius_meters} meters.")
        
    validate_ip(request, settings)
        
    today = get_local_today()
    now = get_local_now()
    
    from routers.leave import is_public_holiday
    if is_public_holiday(db, today):
        raise HTTPException(status_code=400, detail="Today is a Public Holiday. Clock-in is disabled.")
    
    existing = db.query(models.Attendance).filter(
        models.Attendance.employee_id == current_user.employee.id,
        models.Attendance.attendance_date == today
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already clocked in today.")
        
    # Calculate Late
    late_minutes = 0
    start_time = local_tz.localize(datetime.combine(today, time(9, 0)))
    if now > start_time:
        diff = now - start_time
        late_minutes = int(diff.total_seconds() / 60)
        
    status = "Late" if late_minutes > 0 else "Present"
    
    attendance = models.Attendance(
        employee_id=current_user.employee.id,
        attendance_date=today,
        clock_in_time=now,
        clock_in_latitude=req.latitude,
        clock_in_longitude=req.longitude,
        status=status,
        late_minutes=late_minutes
    )
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance

@router.post("/clock-out", response_model=schemas.AttendanceResponse)
def clock_out(request: Request, req: schemas.AttendanceClockOutRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User is not linked to an employee profile")
        
    settings = get_settings(db)
    distance = haversine(req.latitude, req.longitude, settings.latitude, settings.longitude)
    if distance > settings.radius_meters:
        raise HTTPException(status_code=400, detail=f"You are outside the allowed office attendance zone (Distance: {int(distance)}m). Move within {settings.radius_meters} meters.")
        
    validate_ip(request, settings)
        
    today = get_local_today()
    now = get_local_now()
    
    attendance = db.query(models.Attendance).filter(
        models.Attendance.employee_id == current_user.employee.id,
        models.Attendance.attendance_date == today
    ).first()
    
    if not attendance:
        raise HTTPException(status_code=400, detail="You must clock in first.")
        
    if attendance.clock_out_time:
        raise HTTPException(status_code=400, detail="You have already clocked out today.")
        
    attendance.clock_out_time = now
    attendance.clock_out_latitude = req.latitude
    attendance.clock_out_longitude = req.longitude
    
    # Calculate working hours
    diff = now - attendance.clock_in_time
    hours = diff.total_seconds() / 3600.0
    attendance.working_hours = round(hours, 2)
    
    if hours < 4.0:
        attendance.status = "Half Day"
        
    db.commit()
    db.refresh(attendance)
    return attendance

@router.get("/my-history", response_model=List[schemas.AttendanceResponse])
def get_my_history(skip: int = 0, limit: int = 30, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        return []
        
    return db.query(models.Attendance).options(
        joinedload(models.Attendance.employee).joinedload(models.Employee.department)
    ).filter(
        models.Attendance.employee_id == current_user.employee.id
    ).order_by(desc(models.Attendance.attendance_date)).offset(skip).limit(limit).all()

@router.post("/correction-request", response_model=schemas.AttendanceCorrectionResponse)
def request_correction(req: schemas.AttendanceCorrectionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User is not linked to an employee profile")
        
    attendance = db.query(models.Attendance).filter(
        models.Attendance.id == req.attendance_id,
        models.Attendance.employee_id == current_user.employee.id
    ).first()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    correction = models.AttendanceCorrection(
        employee_id=current_user.employee.id,
        attendance_id=attendance.id,
        requested_clock_in=req.requested_clock_in,
        requested_clock_out=req.requested_clock_out,
        reason=req.reason
    )
    db.add(correction)
    db.commit()
    db.refresh(correction)
    return correction

# ==========================================
# ADMIN ENDPOINTS
# ==========================================

def is_admin_or_hr(user: models.User, db: Session, perm: str = "view") -> bool:
    if not user:
        return False
    if auth.is_super_admin(user):
        return True
    if auth.has_permission(user, "attendance_management", perm, db) or auth.has_permission(user, "reports_attendance", perm, db):
        return True
    if not user.role:
        return False
    r_name = str(user.role.name).strip().upper()
    return "ADMIN" in r_name or "HR" in r_name

@router.get("/settings", response_model=schemas.AttendanceSettingsResponse)
def get_admin_settings(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user, db):
        raise HTTPException(status_code=403, detail="Admin access required")
    return get_settings(db)

@router.put("/settings", response_model=schemas.AttendanceSettingsResponse)
def update_admin_settings(req: schemas.AttendanceSettingsBase, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user, db, "edit"):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    settings = get_settings(db)
    settings.office_name = req.office_name
    settings.latitude = req.latitude
    settings.longitude = req.longitude
    settings.radius_meters = req.radius_meters
    settings.allowed_ip_address = req.allowed_ip_address
    
    db.commit()
    db.refresh(settings)
    return settings

@router.get("/today-summary")
def get_today_summary(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user, db):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    today = get_local_today()
    total_employees = db.query(models.Employee).count()
    
    attendances = db.query(models.Attendance).filter(models.Attendance.attendance_date == today).all()
    
    present = 0
    late = 0
    half_day = 0
    
    for a in attendances:
        if a.status == "Present":
            present += 1
        elif a.status == "Late":
            late += 1
            present += 1 # late still counts as present physically
        elif a.status == "Half Day":
            half_day += 1
            present += 1
            
    absent = total_employees - present
    perc = round((present / total_employees) * 100) if total_employees > 0 else 0
    
    return {
        "total_employees": total_employees,
        "present": present,
        "absent": absent,
        "late": late,
        "half_day": half_day,
        "percentage": perc
    }

@router.get("", response_model=List[schemas.AttendanceResponse])
def get_all_attendance(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user, db):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    return db.query(models.Attendance).options(
        joinedload(models.Attendance.employee).joinedload(models.Employee.department)
    ).order_by(desc(models.Attendance.attendance_date)).offset(skip).limit(limit).all()

@router.post("/manual", response_model=schemas.AttendanceResponse)
def create_attendance_manual(
    req: schemas.AttendanceCreateAdmin,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not (is_admin_or_hr(current_user, db, "create") or is_admin_or_hr(current_user, db, "edit")):
        raise HTTPException(status_code=403, detail="Admin access required to record manual attendance")

    # 1. Validate employee exists
    employee = db.query(models.Employee).filter(models.Employee.id == req.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    emp_name = f"{employee.first_name or ''} {employee.last_name or ''}".strip() or f"Employee #{employee.id}"

    # 2. Strict Duplicate Check
    existing = db.query(models.Attendance).filter(
        models.Attendance.employee_id == req.employee_id,
        models.Attendance.attendance_date == req.attendance_date
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An attendance record already exists for {emp_name} on {req.attendance_date}."
        )

    # 3. Create new attendance entry
    attendance = models.Attendance(
        employee_id=req.employee_id,
        attendance_date=req.attendance_date,
        clock_in_time=req.clock_in_time,
        clock_out_time=req.clock_out_time,
        status="Present"
    )

    recalculate_attendance(attendance)

    # If explicit status was specified and not 'Auto', allow override
    if req.status and req.status.strip() and req.status.lower() != "auto":
        attendance.status = req.status.strip()

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    attendance_full = db.query(models.Attendance).options(
        joinedload(models.Attendance.employee).joinedload(models.Employee.department)
    ).filter(models.Attendance.id == attendance.id).first()

    return attendance_full or attendance

@router.put("/{attendance_id}", response_model=schemas.AttendanceResponse)
def update_attendance_admin(attendance_id: int, req: schemas.AttendanceUpdateAdmin, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user, db, "edit"):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    if req.clock_in_time is not None:
        attendance.clock_in_time = req.clock_in_time
    if req.clock_out_time is not None:
        attendance.clock_out_time = req.clock_out_time
        
    recalculate_attendance(attendance)

    if req.status and req.status.strip() and req.status.lower() != "auto":
        attendance.status = req.status.strip()
            
    db.commit()
    db.refresh(attendance)
    return attendance

@router.get("/corrections", response_model=List[schemas.AttendanceCorrectionResponse])
def get_all_corrections(status: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user, db):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    query = db.query(models.AttendanceCorrection).options(
        joinedload(models.AttendanceCorrection.employee).joinedload(models.Employee.department)
    )
    if status:
        query = query.filter(models.AttendanceCorrection.status == status)
    return query.order_by(desc(models.AttendanceCorrection.created_at)).all()

@router.put("/correction/{correction_id}/approve")
def approve_correction(correction_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (is_admin_or_hr(current_user, db, "approve") or is_admin_or_hr(current_user, db, "edit")):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    correction = db.query(models.AttendanceCorrection).filter(models.AttendanceCorrection.id == correction_id).first()
    if not correction:
        raise HTTPException(status_code=404, detail="Correction not found")
        
    correction.status = "APPROVED"
    correction.approved_by = current_user.id
    correction.approved_at = get_local_now()
    
    attendance = correction.attendance
    if correction.requested_clock_in:
        attendance.clock_in_time = correction.requested_clock_in
    if correction.requested_clock_out:
        attendance.clock_out_time = correction.requested_clock_out
        
    recalculate_attendance(attendance)
        
    db.commit()
    return {"message": "Correction approved"}

@router.put("/correction/{correction_id}/reject")
def reject_correction(correction_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not (is_admin_or_hr(current_user, db, "approve") or is_admin_or_hr(current_user, db, "edit")):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    correction = db.query(models.AttendanceCorrection).filter(models.AttendanceCorrection.id == correction_id).first()
    if not correction:
        raise HTTPException(status_code=404, detail="Correction not found")
        
    correction.status = "REJECTED"
    correction.approved_by = current_user.id
    correction.approved_at = get_local_now()
    db.commit()
    return {"message": "Correction rejected"}

@router.get("/monthly-report")
def get_monthly_report(
    year: int,
    month: int,
    department_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    import calendar
    from datetime import date, timedelta
    from sqlalchemy.orm import joinedload
    
    if not is_admin_or_hr(current_user, db):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    try:
        first_day = date(year, month, 1)
        num_days = calendar.monthrange(year, month)[1]
        last_day = date(year, month, num_days)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid year or month")
        
    # Get active/on_leave employees
    emp_query = db.query(models.Employee).options(
        joinedload(models.Employee.department)
    ).filter(
        models.Employee.status != models.EmploymentStatus.TERMINATED
    )
    if department_id:
        emp_query = emp_query.filter(models.Employee.department_id == department_id)
        
    employees = emp_query.all()
    
    # Filter out System Admin, Akhi Dev, and John Wick from the report
    exclude_names = {
        ("System", "Admin"),
        ("Akhi", "Dev"),
        ("John", "Wick")
    }
    employees = [
        emp for emp in employees 
        if (emp.first_name, emp.last_name) not in exclude_names
    ]
    
    # Get attendance records for this month
    attendance_records = db.query(models.Attendance).filter(
        models.Attendance.attendance_date.between(first_day, last_day)
    ).all()
    
    # Group attendance by employee and date
    attendance_map = {}
    for att in attendance_records:
        if att.employee_id not in attendance_map:
            attendance_map[att.employee_id] = {}
        attendance_map[att.employee_id][att.attendance_date] = att
        
    # Get approved leaves for this month
    leave_requests = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.status == "APPROVED",
        models.LeaveRequest.start_date <= last_day,
        models.LeaveRequest.end_date >= first_day
    ).all()
    
    # Group leaves by employee and date
    leave_map = {}
    for req in leave_requests:
        if req.employee_id not in leave_map:
            leave_map[req.employee_id] = {}
        
        curr = max(req.start_date, first_day)
        end = min(req.end_date, last_day)
        while curr <= end:
            leave_map[req.employee_id][curr] = req.leave_type or "Leave"
            curr += timedelta(days=1)
            
    # Get public holidays
    holidays = db.query(models.PublicHoliday).filter(
        models.PublicHoliday.holiday_date.between(first_day, last_day)
    ).all()
    holiday_map = {h.holiday_date: h.holiday_name for h in holidays}
    
    today_local = get_local_today()
    
    employee_reports = []
    for emp in employees:
        days_data = []
        summary = {
            "present": 0,
            "late": 0,
            "half_day": 0,
            "absent": 0,
            "leave": 0,
            "holiday": 0,
            "weekend": 0
        }
        
        for day_num in range(1, num_days + 1):
            curr_date = date(year, month, day_num)
            day_status = None
            clock_in = None
            clock_out = None
            working_hours = 0.0
            late_minutes = 0
            leave_type = None
            
            # Check attendance first
            att = attendance_map.get(emp.id, {}).get(curr_date)
            if att:
                day_status = att.status # Present, Late, Half Day
                clock_in = att.clock_in_time.isoformat() if att.clock_in_time else None
                clock_out = att.clock_out_time.isoformat() if att.clock_out_time else None
                working_hours = att.working_hours or 0.0
                late_minutes = att.late_minutes or 0
                
                # Update summary
                if day_status == "Present":
                    summary["present"] += 1
                elif day_status == "Late":
                    summary["late"] += 1
                elif day_status == "Half Day":
                    summary["half_day"] += 1
            else:
                # No attendance record
                # Check leave
                leave_type = leave_map.get(emp.id, {}).get(curr_date)
                if leave_type:
                    day_status = "Leave"
                    summary["leave"] += 1
                # Check holiday
                elif curr_date in holiday_map:
                    day_status = "Holiday"
                    summary["holiday"] += 1
                # Check weekend
                elif curr_date.weekday() >= 5:
                    day_status = "Weekend"
                    summary["weekend"] += 1
                # Check absent (past days)
                elif curr_date < today_local:
                    day_status = "Absent"
                    summary["absent"] += 1
                else:
                    # Today or future day where they haven't clocked in yet
                    day_status = None
                    
            days_data.append({
                "day": day_num,
                "date": curr_date.isoformat(),
                "status": day_status,
                "clock_in": clock_in,
                "clock_out": clock_out,
                "working_hours": working_hours,
                "late_minutes": late_minutes,
                "holiday_name": holiday_map.get(curr_date) if curr_date in holiday_map else None,
                "leave_type": leave_type
            })
            
        employee_reports.append({
            "id": emp.id,
            "employee_id_custom": emp.employee_id_custom,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "job_title": emp.job_title,
            "department": emp.department.name if emp.department else "Unassigned",
            "summary": summary,
            "days": days_data
        })
        
    return {
        "year": year,
        "month": month,
        "days_in_month": num_days,
        "holidays": {d.isoformat(): name for d, name in holiday_map.items()},
        "employees": employee_reports
    }

