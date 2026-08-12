from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import uuid
import json
from datetime import datetime
from jose import JWTError, jwt

import models, schemas, auth, database
from auth import SECRET_KEY, ALGORITHM

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"]
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

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        # Maps user_id -> List[WebSocket]
        self.active_connections: dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"User {user_id} connected. Active connections for user: {len(self.active_connections[user_id])}")

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            print(f"User {user_id} disconnected.")

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast_to_conversation(self, message: dict, conversation: models.Conversation, db: Session):
        # Find user IDs of the participants
        recipient_user_ids = []
        
        # 1. Client User ID (accessed through company -> client)
        if conversation.company and conversation.company.client and conversation.company.client.user_id:
            recipient_user_ids.append(conversation.company.client.user_id)
            
        # 2. Employee User ID
        if conversation.employee and conversation.employee.user_id:
            recipient_user_ids.append(conversation.employee.user_id)
            
        # 3. Add active Admin/HR users who are monitoring
        for uid in list(self.active_connections.keys()):
            if uid in recipient_user_ids:
                continue
            user = db.query(models.User).filter(models.User.id == uid).first()
            if is_admin_or_hr(user):
                recipient_user_ids.append(uid)
                
        # Send to everyone in the list
        for uid in recipient_user_ids:
            await self.send_personal_message(message, uid)

manager = ConnectionManager()

# Helper to authenticate WebSocket connections via query token
async def get_ws_user(token: str, db: Session) -> models.User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        user = db.query(models.User).filter(models.User.email == email).first()
        if user and user.is_active:
            return user
    except JWTError:
        pass
    return None

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = None):
    if not token:
        # Check query params
        token = websocket.query_params.get("token")
        
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    db = database.SessionLocal()
    try:
        current_user = await get_ws_user(token, db)
        if not current_user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = current_user.id
        role_name = current_user.role.name.upper() if current_user.role else ""
        employee_id = current_user.employee.id if current_user.employee else None
        client_id = current_user.client.id if current_user.client else None
    finally:
        db.close()

    await manager.connect(user_id, websocket)
    
    try:
        while True:
            # We wait for message JSON from the client
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                conversation_id = message_data.get("conversation_id")
                message_text = message_data.get("message")
                attachment_url = message_data.get("attachment")
                
                if not conversation_id:
                    continue
                    
                # Verify conversation exists and user has access using a short-lived session
                db_trans = database.SessionLocal()
                try:
                    conversation = db_trans.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
                    if not conversation:
                        continue
                        
                    # Check authorization
                    is_authorized = False
                    if is_admin_or_hr(current_user):
                        is_authorized = True
                    elif is_employee_role(current_user) and employee_id and conversation.employee_id == employee_id:
                        is_authorized = True
                    elif role_name == "CLIENT" and client_id and conversation.company and conversation.company.client_id == client_id:
                        is_authorized = True
                        
                    if not is_authorized:
                        continue
                        
                    # Create and save message
                    sender_role = role_name
                    db_message = models.Message(
                        conversation_id=conversation_id,
                        sender_id=user_id,
                        sender_role=sender_role,
                        message=message_text,
                        attachment=attachment_url,
                        is_read=False
                    )
                    db_trans.add(db_message)
                    db_trans.commit()
                    db_trans.refresh(db_message)
                    
                    # Prepare message schema for broadcast
                    broadcast_data = {
                        "id": db_message.id,
                        "conversation_id": db_message.conversation_id,
                        "sender_id": db_message.sender_id,
                        "sender_role": db_message.sender_role,
                        "message": db_message.message,
                        "attachment": db_message.attachment,
                        "is_read": db_message.is_read,
                        "created_at": db_message.created_at.isoformat() if db_message.created_at else datetime.now().isoformat()
                    }
                    
                    await manager.broadcast_to_conversation(broadcast_data, conversation, db_trans)
                finally:
                    db_trans.close()
                
            except json.JSONDecodeError:
                pass
            except Exception as e:
                print(f"Error handling WebSocket message: {e}")
                
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)


@router.get("/conversations", response_model=List[schemas.ConversationResponse])
def get_conversations(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    role_name = current_user.role.name.upper() if current_user.role else ""
    
    if is_admin_or_hr(current_user):
        return db.query(models.Conversation).all()
        
    elif is_employee_role(current_user):
        if not current_user.employee:
            return []
        return db.query(models.Conversation).filter(
            models.Conversation.employee_id == current_user.employee.id
        ).all()
        
    elif role_name == "CLIENT":
        if not current_user.client:
            return []
        company_ids = [c.id for c in current_user.client.companies]
        return db.query(models.Conversation).filter(
            models.Conversation.company_id.in_(company_ids)
        ).all()
        
    else:
        raise HTTPException(status_code=403, detail="Not authorized to access conversations")


@router.get("/conversations/{id}/messages", response_model=List[schemas.MessageResponse])
def get_conversation_messages(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    # Permission check
    role_name = current_user.role.name.upper() if current_user.role else ""
    is_authorized = False
    
    if is_admin_or_hr(current_user):
        is_authorized = True
    elif is_employee_role(current_user) and current_user.employee and conversation.employee_id == current_user.employee.id:
        is_authorized = True
    elif role_name == "CLIENT" and current_user.client and conversation.company and conversation.company.client_id == current_user.client.id:
        is_authorized = True
        
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to view messages in this conversation")
        
    # Mark messages as read if the recipient is loading them
    unread_messages = db.query(models.Message).filter(
        models.Message.conversation_id == id,
        models.Message.sender_id != current_user.id,
        models.Message.is_read == False
    ).all()
    
    for msg in unread_messages:
        msg.is_read = True
    if unread_messages:
        db.commit()
        
    return db.query(models.Message).filter(models.Message.conversation_id == id).order_by(models.Message.created_at.asc()).all()


@router.post("/conversations", response_model=schemas.ConversationResponse)
def get_or_create_conversation(payload: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    company_id = payload.get("company_id")
    employee_id = payload.get("employee_id")
    
    if not company_id or not employee_id:
        raise HTTPException(status_code=400, detail="company_id and employee_id are required")
        
    # Check permissions: Admin, HR, the Employee themselves, or the Client themselves
    role_name = current_user.role.name.upper() if current_user.role else ""
    is_authorized = False
    
    if is_admin_or_hr(current_user):
        is_authorized = True
    elif is_employee_role(current_user) and current_user.employee and current_user.employee.id == employee_id:
        is_authorized = True
    elif role_name == "CLIENT" and current_user.client:
        company = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
        if company and company.client_id == current_user.client.id:
            is_authorized = True
        
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to create this conversation")
        
    # Check if conversation already exists
    conversation = db.query(models.Conversation).filter(
        models.Conversation.company_id == company_id,
        models.Conversation.employee_id == employee_id
    ).first()
    
    if not conversation:
        conversation = models.Conversation(
            company_id=company_id,
            employee_id=employee_id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
    return conversation


@router.post("/upload")
async def upload_chat_attachment(file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    from storage import upload_file_to_supabase
    
    file_bytes = await file.read()
    file_url = upload_file_to_supabase(file_bytes, file.filename, "hrms-documents")
        
    return {"attachment_url": file_url, "filename": file.filename}
