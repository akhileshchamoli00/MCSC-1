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

kl_tz = pytz.timezone('Asia/Kuala_Lumpur')

def get_kl_now():
    return datetime.now(kl_tz)

def get_kl_today():
    return get_kl_now().date()

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
        start_time = kl_tz.localize(datetime.combine(attendance.attendance_date, time(9, 0)))
        clock_in_kl = attendance.clock_in_time.astimezone(kl_tz) if attendance.clock_in_time.tzinfo else kl_tz.localize(attendance.clock_in_time)
        if clock_in_kl > start_time:
            late_diff = clock_in_kl - start_time
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

def validate_ip(request: Request, settings):
    if settings.allowed_ip_address and settings.allowed_ip_address.strip():
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host
            
        print(f"DEBUG IP VALIDATION: Headers={request.headers}, client_ip={client_ip}, allowed={settings.allowed_ip_address}")
        
        allowed_ips = [ip.strip() for ip in settings.allowed_ip_address.split(",") if ip.strip()]
        
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
                    if client_ip == allowed:
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
        
    today = get_kl_today()
    now = get_kl_now()
    
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
    start_time = kl_tz.localize(datetime.combine(today, time(9, 0)))
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
        
    today = get_kl_today()
    now = get_kl_now()
    
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

def is_admin_or_hr(user, db: Session = None) -> bool:
    if not user:
        return False
    return True

@router.get("/settings", response_model=schemas.AttendanceSettingsResponse)
def get_admin_settings(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user, db):
        raise HTTPException(status_code=403, detail="Admin access required")
    return get_settings(db)

@router.put("/settings", response_model=schemas.AttendanceSettingsResponse)
def update_admin_settings(req: schemas.AttendanceSettingsBase, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user, db):
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
        
    today = get_kl_today()
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

@router.put("/{attendance_id}", response_model=schemas.AttendanceResponse)
def update_attendance_admin(attendance_id: int, req: schemas.AttendanceUpdateAdmin, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user, db):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    attendance = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    if req.clock_in_time is not None:
        attendance.clock_in_time = req.clock_in_time
    if req.clock_out_time is not None:
        attendance.clock_out_time = req.clock_out_time
        
    recalculate_attendance(attendance)
            
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
    if not is_admin_or_hr(current_user, db):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    correction = db.query(models.AttendanceCorrection).filter(models.AttendanceCorrection.id == correction_id).first()
    if not correction:
        raise HTTPException(status_code=404, detail="Correction not found")
        
    correction.status = "APPROVED"
    correction.approved_by = current_user.id
    correction.approved_at = get_kl_now()
    
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
    if not is_admin_or_hr(current_user, db):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    correction = db.query(models.AttendanceCorrection).filter(models.AttendanceCorrection.id == correction_id).first()
    if not correction:
        raise HTTPException(status_code=404, detail="Correction not found")
        
    correction.status = "REJECTED"
    correction.approved_by = current_user.id
    correction.approved_at = get_kl_now()
    db.commit()
    return {"message": "Correction rejected"}
