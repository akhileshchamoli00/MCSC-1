from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/announcements",
    tags=["announcements"],
    dependencies=[Depends(auth.get_current_user)]
)

def is_admin_or_hr(user: models.User) -> bool:
    if not user or not user.role:
        return False
    if auth.is_super_admin(user):
        return True
    return user.role.name.upper() == "HR"

def is_employee_role(user: models.User) -> bool:
    if not user:
        return False
    if hasattr(user, "employee") and user.employee is not None:
        return True
    if user.role:
        name = user.role.name.upper()
        if "EMPLOYEE" in name or name in ["TEAM LEAD", "LICENSE CONSULTANT", "PROJECT MANAGER", "HR EXECUTIVE"]:
            return True
    return False

@router.get("", response_model=List[schemas.AnnouncementResponse])
def get_announcements(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    role_name = current_user.role.name.upper() if current_user.role else ""
    
    if is_admin_or_hr(current_user):
        return db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()
    elif is_employee_role(current_user):
        return db.query(models.Announcement).filter(
            models.Announcement.target_role.in_(["ALL", "EMPLOYEE"])
        ).order_by(models.Announcement.created_at.desc()).all()
    elif role_name == "CLIENT":
        return db.query(models.Announcement).filter(
            models.Announcement.target_role.in_(["ALL", "CLIENT"])
        ).order_by(models.Announcement.created_at.desc()).all()
    else:
        raise HTTPException(status_code=403, detail="Not authorized to access announcements")

@router.get("/{id}", response_model=schemas.AnnouncementResponse)
def get_announcement(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    announcement = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    role_name = current_user.role.name.upper() if current_user.role else ""
    
    # Check permissions
    if is_admin_or_hr(current_user):
        return announcement
    elif is_employee_role(current_user) and announcement.target_role in ["ALL", "EMPLOYEE"]:
        return announcement
    elif role_name == "CLIENT" and announcement.target_role in ["ALL", "CLIENT"]:
        return announcement
        
    raise HTTPException(status_code=403, detail="Not authorized to view this announcement")

@router.post("", response_model=schemas.AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(announcement_data: schemas.AnnouncementCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can create announcements")
        
    db_announcement = models.Announcement(
        title=announcement_data.title,
        content=announcement_data.content,
        target_role=announcement_data.target_role.upper() if announcement_data.target_role else "ALL",
        created_by=current_user.id
    )
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

@router.put("/{id}", response_model=schemas.AnnouncementResponse)
def update_announcement(id: int, announcement_update: schemas.AnnouncementCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can update announcements")
        
    db_announcement = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    db_announcement.title = announcement_update.title
    db_announcement.content = announcement_update.content
    db_announcement.target_role = announcement_update.target_role.upper() if announcement_update.target_role else "ALL"
    
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

@router.delete("/{id}")
def delete_announcement(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_admin_or_hr(current_user):
        raise HTTPException(status_code=403, detail="Only Admin or HR can delete announcements")
        
    db_announcement = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    db.delete(db_announcement)
    db.commit()
    return {"message": "Announcement deleted successfully"}
