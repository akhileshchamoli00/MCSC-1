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
                
    async def notify_user(self, db: Session, user_id: int, title: str, message: str, type: str, module: str, reference_id: int = None, action_url: str = None):
        # 1. Save to DB
        notif = models.Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            module=module,
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
                "reference_id": notif.reference_id,
                "is_read": notif.is_read,
                "action_url": notif.action_url,
                "created_at": notif.created_at.isoformat() if notif.created_at else None
            }, user_id), self.loop)
        
        return notif

    def notify_user_sync(self, db: Session, user_id: int, title: str, message: str, type: str, module: str, reference_id: int = None, action_url: str = None):
        # 1. Save to DB
        notif = models.Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            module=module,
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
                "reference_id": notif.reference_id,
                "is_read": notif.is_read,
                "action_url": notif.action_url,
                "created_at": notif.created_at.isoformat() if notif.created_at else None
            }, user_id), self.loop)
        
        return notif

manager = NotificationManager()
