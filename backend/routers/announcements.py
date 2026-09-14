from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import re

import models, schemas, auth, database
from storage import upload_file

router = APIRouter(
    prefix="/api/announcements",
    tags=["announcements"],
    dependencies=[Depends(auth.get_current_user)]
)

def is_staff_or_admin(user: models.User, action: str = "view", db: Session = None) -> bool:
    if not user:
        return False
    if auth.is_super_admin(user):
        return True
    if db:
        if auth.has_permission(user, "hrms_announcements", action, db) or auth.has_permission(user, "clients_announcements", action, db):
            return True
    if user.role:
        name = user.role.name.upper()
        if name in ["ADMIN", "SUPER ADMIN", "HR", "MANAGEMENT", "DIRECTOR", "OPERATIONS", "LEGAL", "CONSULTANT"]:
            return True
    if hasattr(user, "employee") and user.employee is not None:
        if action == "view":
            return True
    return False

@router.get("", response_model=List[schemas.AnnouncementResponse])
def get_announcements(
    status: Optional[str] = None,
    target_role: Optional[str] = None,
    category: Optional[str] = None,
    scope: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    role_name = current_user.role.name.upper() if current_user.role else ""
    query = db.query(models.Announcement)
    
    if role_name == "CLIENT":
        # Clients only see published bulletins targeting CLIENT or ALL
        query = query.filter(
            models.Announcement.target_role.in_(["ALL", "CLIENT"]),
            models.Announcement.status == "PUBLISHED"
        )
        if category and category != "ALL":
            query = query.filter(models.Announcement.category == category)
    elif is_staff_or_admin(current_user, "view", db) and (scope == "management" or status is not None):
        # Staff/Admins in management studio can filter by status, target_role, and category
        if status and status != "ALL":
            query = query.filter(models.Announcement.status == status)
        if target_role and target_role != "ALL":
            query = query.filter(models.Announcement.target_role == target_role)
        if category and category != "ALL":
            query = query.filter(models.Announcement.category == category)
    else:
        # Standard HRMS / Employee feed: ALWAYS only show PUBLISHED bulletins!
        query = query.filter(
            models.Announcement.target_role.in_(["ALL", "EMPLOYEE"]),
            models.Announcement.status == "PUBLISHED"
        )
        if category and category != "ALL":
            query = query.filter(models.Announcement.category == category)
        
    return query.order_by(
        models.Announcement.is_pinned.desc(),
        models.Announcement.created_at.desc()
    ).all()

@router.get("/{id}", response_model=schemas.AnnouncementResponse)
def get_announcement(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    announcement = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    role_name = current_user.role.name.upper() if current_user.role else ""
    
    if is_staff_or_admin(current_user, "view", db):
        return announcement
    elif role_name == "CLIENT":
        if announcement.status == "PUBLISHED" and announcement.target_role in ["ALL", "CLIENT"]:
            return announcement
    elif announcement.status == "PUBLISHED" and announcement.target_role in ["ALL", "EMPLOYEE"]:
        return announcement
        
    raise HTTPException(status_code=403, detail="Not authorized to view this announcement")

def broadcast_announcement_notification(db: Session, announcement: models.Announcement):
    """
    Broadcasts real-time WebSocket and DB notification to all users matching the target audience.
    - target_role == 'CLIENT': Notifies client users with action_url='/client/announcements'
    - target_role == 'EMPLOYEE': Notifies internal staff / employees with action_url='/hrms/announcements'
    - target_role == 'ALL': Notifies clients (-> /client/announcements) and internal staff (-> /hrms/announcements)
    """
    try:
        from notification_manager import manager
        
        # Clean up any prior notifications for this announcement ID
        manager.remove_notifications_by_reference_sync(db, announcement.id, module="announcements", notif_type="ANNOUNCEMENT")
        
        if announcement.status != "PUBLISHED":
            return
            
        target = (announcement.target_role or "ALL").upper()
        all_users = db.query(models.User).all()
        
        title_text = f"📢 New Bulletin: {announcement.title}"
        body_text = announcement.content[:140] + ("..." if len(announcement.content) > 140 else "")
        
        for u in all_users:
            role_name = (u.role.name.upper() if u.role else "")
            is_client = "CLIENT" in role_name
            is_member = "MEMBER" in role_name
            
            should_notify = False
            action_url = "/hrms/announcements"
            
            if target == "ALL":
                should_notify = True
                action_url = "/client/announcements" if is_client else "/hrms/announcements"
            elif target == "CLIENT" and is_client:
                should_notify = True
                action_url = "/client/announcements"
            elif target == "EMPLOYEE" and not is_client and not is_member:
                should_notify = True
                action_url = "/hrms/announcements"
                
            if should_notify:
                try:
                    manager.notify_user_sync(
                        db=db,
                        user_id=u.id,
                        title=title_text,
                        message=body_text,
                        type="ANNOUNCEMENT",
                        module="announcements",
                        reference_id=announcement.id,
                        action_url=action_url
                    )
                except Exception as user_err:
                    print(f"Failed sending notification to user {u.id}: {user_err}")
    except Exception as broadcast_err:
        print(f"Failed to broadcast announcement notification: {broadcast_err}")

@router.post("", response_model=schemas.AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    announcement_data: schemas.AnnouncementCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not is_staff_or_admin(current_user, "create", db):
        raise HTTPException(status_code=403, detail="Only authorized staff or management can create announcements")
        
    ann_status = (announcement_data.status or "PUBLISHED").upper()
    pub_at = announcement_data.published_at or (datetime.now() if ann_status == "PUBLISHED" else None)
    
    db_announcement = models.Announcement(
        title=announcement_data.title.strip(),
        content=announcement_data.content.strip(),
        target_role=(announcement_data.target_role or "ALL").upper(),
        status=ann_status,
        category=(announcement_data.category or "GENERAL").upper(),
        priority=(announcement_data.priority or "NORMAL").upper(),
        is_pinned=bool(announcement_data.is_pinned),
        attachment_url=announcement_data.attachment_url,
        attachment_name=announcement_data.attachment_name,
        published_at=pub_at,
        expires_at=announcement_data.expires_at,
        created_by=current_user.id
    )
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)

    # Broadcast notification to the target audience if published
    if ann_status == "PUBLISHED":
        broadcast_announcement_notification(db, db_announcement)

    return db_announcement

@router.put("/{id}", response_model=schemas.AnnouncementResponse)
def update_announcement(
    id: int, 
    announcement_update: schemas.AnnouncementUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if not is_staff_or_admin(current_user, "edit", db):
        raise HTTPException(status_code=403, detail="Only authorized staff can update announcements")
        
    db_announcement = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    update_data = announcement_update.model_dump(exclude_unset=True) if hasattr(announcement_update, "model_dump") else announcement_update.dict(exclude_unset=True)
    
    old_status = db_announcement.status
    for key, value in update_data.items():
        if key in ["target_role", "status", "category", "priority"] and value:
            setattr(db_announcement, key, value.upper())
        else:
            setattr(db_announcement, key, value)
            
    if db_announcement.status == "PUBLISHED" and not db_announcement.published_at:
        db_announcement.published_at = datetime.now()
        
    db.commit()
    db.refresh(db_announcement)

    # Handle notifications based on status change:
    if old_status == "PUBLISHED" and db_announcement.status != "PUBLISHED":
        # Changed from PUBLISHED to DRAFT / ARCHIVED: clear notifications immediately!
        from notification_manager import manager
        manager.remove_notifications_by_reference_sync(db, db_announcement.id, module="announcements", notif_type="ANNOUNCEMENT")
    elif db_announcement.status == "PUBLISHED":
        # Broadcast/update notifications if published
        broadcast_announcement_notification(db, db_announcement)

    return db_announcement

@router.patch("/{id}/toggle-pin", response_model=schemas.AnnouncementResponse)
def toggle_pin_announcement(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_staff_or_admin(current_user, "edit", db):
        raise HTTPException(status_code=403, detail="Only authorized staff can pin announcements")
        
    db_announcement = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    db_announcement.is_pinned = not db_announcement.is_pinned
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

@router.patch("/{id}/publish", response_model=schemas.AnnouncementResponse)
def publish_announcement(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_staff_or_admin(current_user, "edit", db):
        raise HTTPException(status_code=403, detail="Only authorized staff can publish announcements")
        
    db_announcement = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    db_announcement.status = "PUBLISHED"
    if not db_announcement.published_at:
        db_announcement.published_at = datetime.now()
        
    db.commit()
    db.refresh(db_announcement)

    # Broadcast notification to the target audience
    broadcast_announcement_notification(db, db_announcement)

    return db_announcement

@router.post("/upload-attachment")
async def upload_announcement_attachment(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not is_staff_or_admin(current_user, "create", db):
        raise HTTPException(status_code=403, detail="Only authorized staff can upload attachments")
        
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    orig_name = file.filename or "attachment.pdf"
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', orig_name)
    stored_filename = f"announcement_{timestamp}_{clean_name}"
    
    file_bytes = await file.read()
    file_url = upload_file(file_bytes, stored_filename, "hrms-documents")
    
    return {
        "file_url": file_url,
        "file_name": orig_name
    }

@router.delete("/{id}")
def delete_announcement(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not is_staff_or_admin(current_user, "delete", db):
        raise HTTPException(status_code=403, detail="Only authorized staff can delete announcements")
        
    db_announcement = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
        
    from notification_manager import manager
    manager.remove_notifications_by_reference_sync(db, db_announcement.id, module="announcements", notif_type="ANNOUNCEMENT")
    
    db.delete(db_announcement)
    db.commit()
    return {"message": "Announcement deleted successfully"}
