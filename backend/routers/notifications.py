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
async def websocket_endpoint(websocket: WebSocket, token: str):
    db = database.SessionLocal()
    try:
        # Validate token manually since Depends(auth.get_current_user) doesn't work out of the box with WS in the same way
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
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

@router.get("", response_model=List[schemas.NotificationResponse])
def get_notifications(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    notifications = db.query(models.Notification)\
        .filter(models.Notification.user_id == current_user.id)\
        .order_by(models.Notification.created_at.desc())\
        .offset(skip).limit(limit).all()
    return notifications

@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    count = db.query(models.Notification)\
        .filter(models.Notification.user_id == current_user.id, models.Notification.is_read == False)\
        .count()
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
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    
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
