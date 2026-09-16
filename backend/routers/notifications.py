from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
import database
import models
import schemas
import auth
from notification_manager import manager
from jose import JWTError, jwt

router = APIRouter(
    prefix="/api/notifications",
    tags=["notifications"],
)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    db = database.SessionLocal()
    try:
        # If token is the placeholder from localStorage, grab the real one from HttpOnly cookies
        actual_token = websocket.cookies.get("hrms_token") or token
        if not actual_token or actual_token == "cookie_based_session_active":
            await websocket.close(code=1008)
            return
            
        payload = jwt.decode(actual_token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            await websocket.close(code=1008)
            return
        user = auth.get_user_by_email(db, email=email)
        if not user:
            await websocket.close(code=1008)
            return
            
        user_id = user.id
    except JWTError:
        await websocket.close(code=1008)
        return
    finally:
        db.close()
            
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # We can handle ping/pong or client messages here if needed
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

from typing import List, Optional
from sqlalchemy import or_

@router.get("", response_model=List[schemas.NotificationResponse])
def get_notifications(
    skip: int = 0, 
    limit: int = 50, 
    system_area: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Notification)\
        .filter(models.Notification.user_id == current_user.id)
    
    if system_area and system_area.lower() in ["hrms", "business"]:
        area = system_area.lower()
        query = query.filter(
            or_(
                models.Notification.system_area == area,
                models.Notification.system_area == "shared"
            )
        )

    notifications = query.order_by(models.Notification.created_at.desc())\
        .offset(skip).limit(limit).all()
    return notifications

@router.get("/unread-count")
def get_unread_count(
    system_area: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Notification)\
        .filter(models.Notification.user_id == current_user.id, models.Notification.is_read == False)
    
    if system_area and system_area.lower() in ["hrms", "business"]:
        area = system_area.lower()
        query = query.filter(
            or_(
                models.Notification.system_area == area,
                models.Notification.system_area == "shared"
            )
        )

    count = query.count()
    return {"unread_count": count}

@router.put("/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/read-all")
def mark_all_as_read(
    system_area: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    )

    if system_area and system_area.lower() in ["hrms", "business"]:
        area = system_area.lower()
        query = query.filter(
            or_(
                models.Notification.system_area == area,
                models.Notification.system_area == "shared"
            )
        )

    query.update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted"}
