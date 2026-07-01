from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/timesheets", tags=["timesheets"])

@router.get("/projects", response_model=List[schemas.ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Project).filter(models.Project.status == "ACTIVE").order_by(models.Project.project_name).all()

@router.get("/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(project_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Task)
    if project_id:
        query = query.filter(models.Task.project_id == project_id)
    return query.order_by(models.Task.task_name).all()

@router.get("", response_model=List[schemas.TimesheetResponse])
def get_my_timesheets(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User is not an employee")
        
    timesheets = db.query(models.Timesheet).filter(
        models.Timesheet.employee_id == current_user.employee.id
    ).order_by(models.Timesheet.week_start.desc()).all()
    
    return timesheets

@router.post("", response_model=schemas.TimesheetResponse)
def create_timesheet(timesheet: schemas.TimesheetCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User is not an employee")
        
    db_timesheet = models.Timesheet(
        employee_id=current_user.employee.id,
        week_start=timesheet.week_start,
        week_end=timesheet.week_end,
        total_hours=timesheet.total_hours,
        overtime_hours=timesheet.overtime_hours,
        status=timesheet.status,
        comments=timesheet.comments
    )
    db.add(db_timesheet)
    db.commit()
    db.refresh(db_timesheet)
    return db_timesheet

@router.post("/{timesheet_id}/entries", response_model=schemas.TimesheetEntryResponse)
def add_timesheet_entry(timesheet_id: int, entry: schemas.TimesheetEntryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User is not an employee")
        
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id, models.Timesheet.employee_id == current_user.employee.id).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
        
    if timesheet.status != "DRAFT" and timesheet.status != "REJECTED":
        raise HTTPException(status_code=400, detail="Cannot add entries to a submitted timesheet")

    project_id = entry.project_id
    if entry.project_name:
        project = db.query(models.Project).filter(models.Project.project_name == entry.project_name).first()
        if not project:
            # Create a short project code from the name
            base_code = entry.project_name[:3].upper()
            base_code = "".join(c for c in base_code if c.isalnum())
            if not base_code:
                base_code = "PRJ"
            
            suffix = 1
            code = f"{base_code}{suffix:02d}"
            while db.query(models.Project).filter(models.Project.project_code == code).first() is not None:
                suffix += 1
                code = f"{base_code}{suffix:02d}"

            project = models.Project(project_name=entry.project_name, project_code=code)
            db.add(project)
            db.commit()
            db.refresh(project)
        project_id = project.id

    task_id = entry.task_id
    if entry.task_name and project_id:
        task = db.query(models.Task).filter(models.Task.task_name == entry.task_name, models.Task.project_id == project_id).first()
        if not task:
            task = models.Task(task_name=entry.task_name, project_id=project_id)
            db.add(task)
            db.commit()
            db.refresh(task)
        task_id = task.id

    db_entry = models.TimesheetEntry(
        timesheet_id=timesheet.id,
        date=entry.date,
        project_id=project_id,
        task_id=task_id,
        description=entry.description,
        start_time=entry.start_time,
        end_time=entry.end_time,
        break_duration=entry.break_duration,
        total_hours=entry.total_hours
    )
    db.add(db_entry)
    
    # Update total hours
    current_total = timesheet.total_hours if timesheet.total_hours is not None else 0.0
    timesheet.total_hours = current_total + entry.total_hours
    if timesheet.total_hours > 40:
        timesheet.overtime_hours = timesheet.total_hours - 40
    else:
        timesheet.overtime_hours = 0.0
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.put("/{timesheet_id}/submit", response_model=schemas.TimesheetResponse)
def submit_timesheet(timesheet_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id, models.Timesheet.employee_id == current_user.employee.id).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
        
    timesheet.status = models.TimesheetStatus.SUBMITTED
    
    # Notify Admins
    admins = db.query(models.User).join(models.Role).filter(models.Role.name.ilike("%ADMIN%")).all()
    for admin in admins:
        db.add(models.Notification(
            user_id=admin.id,
            title="Timesheet Submitted",
            message=f"{current_user.employee.first_name} {current_user.employee.last_name} submitted a timesheet.",
            type="info",
            module="Timesheets",
            reference_id=timesheet.id,
            action_url="/timesheets"
        ))
        
    db.commit()
    db.refresh(timesheet)
    return timesheet

# Admin/Manager Endpoints
@router.get("/all", response_model=List[schemas.TimesheetResponse])
def get_all_timesheets(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    is_admin = current_user.role and "ADMIN" in current_user.role.name.upper()
    if not is_admin and current_user.email != "admin@mcs-consulting.com" and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return db.query(models.Timesheet).order_by(models.Timesheet.week_start.desc()).all()

@router.put("/{timesheet_id}/approve", response_model=schemas.TimesheetResponse)
def approve_timesheet(timesheet_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    is_admin = current_user.role and "ADMIN" in current_user.role.name.upper()
    if not is_admin and current_user.email != "admin@mcs-consulting.com" and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
        
    timesheet.status = models.TimesheetStatus.APPROVED
    timesheet.approved_by = current_user.id
    timesheet.approved_at = datetime.utcnow()
    
    # Notify Employee
    if timesheet.employee and timesheet.employee.user_id:
        db.add(models.Notification(
            user_id=timesheet.employee.user_id,
            title="Timesheet Approved",
            message=f"Your timesheet for week starting {timesheet.week_start} was approved.",
            type="success",
            module="Timesheets",
            reference_id=timesheet.id,
            action_url="/my-timesheets"
        ))
        
    db.commit()
    db.refresh(timesheet)
    return timesheet

@router.put("/{timesheet_id}/reject", response_model=schemas.TimesheetResponse)
def reject_timesheet(timesheet_id: int, comment: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    is_admin = current_user.role and "ADMIN" in current_user.role.name.upper()
    if not is_admin and current_user.email != "admin@mcs-consulting.com" and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    timesheet = db.query(models.Timesheet).filter(models.Timesheet.id == timesheet_id).first()
    if not timesheet:
        raise HTTPException(status_code=404, detail="Timesheet not found")
        
    timesheet.status = models.TimesheetStatus.REJECTED
    timesheet.comments = comment
    
    # Notify Employee
    if timesheet.employee and timesheet.employee.user_id:
        db.add(models.Notification(
            user_id=timesheet.employee.user_id,
            title="Timesheet Rejected",
            message=f"Your timesheet for week starting {timesheet.week_start} was rejected. Reason: {comment}",
            type="error",
            module="Timesheets",
            reference_id=timesheet.id,
            action_url="/my-timesheets"
        ))
        
    db.commit()
    db.refresh(timesheet)
    return timesheet
