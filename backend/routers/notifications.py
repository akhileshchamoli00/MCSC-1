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
from sqlalchemy import or_, func

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
        query = query.filter(models.Notification.system_area == area)

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
        query = query.filter(models.Notification.system_area == area)

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

@router.put("/{notification_id}/unread", response_model=schemas.NotificationResponse)
def mark_as_unread(
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
        
    notif.is_read = False
    db.commit()
    db.refresh(notif)
    
    if hasattr(manager, 'loop') and manager.loop:
        import asyncio
        asyncio.run_coroutine_threadsafe(manager.send_personal_message({
            "action": "REFRESH_NOTIFICATIONS",
            "notification_id": notification_id,
            "is_read": False
        }, current_user.id), manager.loop)
        
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
        query = query.filter(models.Notification.system_area == area)

    query.update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}

@router.put("/order/{order_number}/read")
def mark_order_notifications_as_read(
    order_number: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    clean_no = (order_number or "").strip().upper()
    order_records = db.query(models.ClientOrder.id).filter(
        func.upper(models.ClientOrder.order_number) == clean_no
    ).all()
    order_ids = [o.id for o in order_records]

    notif_filters = [
        models.Notification.action_url.ilike(f"%order={clean_no}%"),
        models.Notification.action_url.ilike(f"%order%3D{clean_no}%"),
        models.Notification.title.ilike(f"%#{clean_no}%"),
        models.Notification.message.ilike(f"%#{clean_no}%"),
    ]
    if order_ids:
        notif_filters.append(models.Notification.reference_id.in_(order_ids))

    updated_count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False,
        or_(*notif_filters)
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()

    if updated_count > 0:
        if hasattr(manager, 'loop') and manager.loop:
            import asyncio
            asyncio.run_coroutine_threadsafe(manager.send_personal_message({
                "action": "REFRESH_NOTIFICATIONS",
                "order_number": clean_no
            }, current_user.id), manager.loop)

    return {"message": f"{updated_count} notifications marked as read", "updated_count": updated_count}

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
