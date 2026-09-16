import json
from typing import Dict, List
from fastapi import WebSocket
from sqlalchemy.orm import Session
import models

class NotificationManager:
    def __init__(self):
        # Map user_id to a list of active WebSockets
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            except ValueError:
                pass

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    print(f"Error sending to websocket: {e}")
                
    def _resolve_system_area(self, module: str = None, type: str = None, action_url: str = None, system_area: str = None) -> str:
        if system_area and str(system_area).strip():
            return str(system_area).strip().lower()
        mod_lower = (module or "").lower()
        type_lower = (type or "").lower()
        url_lower = (action_url or "").lower()
        if (
            "client" in mod_lower or "order" in mod_lower or "business" in mod_lower or "notar" in mod_lower
            or url_lower.startswith("/business") or url_lower.startswith("/client")
            or "order" in type_lower or "chat" in type_lower or "document" in type_lower
        ):
            return "business"
        elif mod_lower in ["leave", "payroll", "attendance", "timesheet", "timesheets", "asset", "assets", "performance", "employees"]:
            return "hrms"
        return "hrms"

    async def notify_user(self, db: Session, user_id: int, title: str, message: str, type: str, module: str, reference_id: int = None, action_url: str = None, system_area: str = None):
        resolved_area = self._resolve_system_area(module, type, action_url, system_area)
        # 1. Save to DB
        notif = models.Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            module=module,
            system_area=resolved_area,
            reference_id=reference_id,
            action_url=action_url
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        
        # 2. Push to WebSocket
        if hasattr(self, 'loop') and self.loop:
            import asyncio
            asyncio.run_coroutine_threadsafe(self.send_personal_message({
                "id": notif.id,
                "user_id": notif.user_id,
                "title": notif.title,
                "message": notif.message,
                "type": notif.type,
                "module": notif.module,
                "system_area": notif.system_area,
                "reference_id": notif.reference_id,
                "is_read": notif.is_read,
                "action_url": notif.action_url,
                "created_at": notif.created_at.isoformat() if notif.created_at else None
            }, user_id), self.loop)
        
        return notif

    def notify_user_sync(self, db: Session, user_id: int, title: str, message: str, type: str, module: str, reference_id: int = None, action_url: str = None, system_area: str = None):
        resolved_area = self._resolve_system_area(module, type, action_url, system_area)
        # 1. Save to DB
        notif = models.Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            module=module,
            system_area=resolved_area,
            reference_id=reference_id,
            action_url=action_url
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        
        # 2. Push to WebSocket
        if hasattr(self, 'loop') and self.loop:
            import asyncio
            asyncio.run_coroutine_threadsafe(self.send_personal_message({
                "id": notif.id,
                "user_id": notif.user_id,
                "title": notif.title,
                "message": notif.message,
                "type": notif.type,
                "module": notif.module,
                "system_area": notif.system_area,
                "reference_id": notif.reference_id,
                "is_read": notif.is_read,
                "action_url": notif.action_url,
                "created_at": notif.created_at.isoformat() if notif.created_at else None
            }, user_id), self.loop)
        
        return notif

    def remove_notifications_by_reference_sync(self, db: Session, reference_id: int, module: str = "announcements", notif_type: str = "ANNOUNCEMENT"):
        # 1. Find all affected user_ids
        notifs = db.query(models.Notification).filter(
            models.Notification.reference_id == reference_id,
            (models.Notification.module.ilike(f"%{module}%")) | (models.Notification.type == notif_type)
        ).all()
        
        affected_users = set([n.user_id for n in notifs if n.user_id])
        
        # 2. Delete from DB
        db.query(models.Notification).filter(
            models.Notification.reference_id == reference_id,
            (models.Notification.module.ilike(f"%{module}%")) | (models.Notification.type == notif_type)
        ).delete(synchronize_session=False)
        db.commit()
        
        # 3. Push real-time event to affected users so bell icon count updates immediately
        if hasattr(self, 'loop') and self.loop:
            import asyncio
            for uid in affected_users:
                asyncio.run_coroutine_threadsafe(self.send_personal_message({
                    "action": "REFRESH_NOTIFICATIONS",
                    "reference_id": reference_id,
                    "module": module
                }, uid), self.loop)

manager = NotificationManager()
