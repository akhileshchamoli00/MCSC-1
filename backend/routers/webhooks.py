import os
from fastapi import APIRouter, Request, Response, Depends, HTTPException
from sqlalchemy.orm import Session
import database

router = APIRouter(tags=["webhooks"])

@router.get("/api/v1/webhooks/meta")
@router.get("/api/webhooks/whatsapp")
@router.get("/api/webhooks/meta")
def verify_meta_webhook(request: Request):
    """
    Handles Meta WhatsApp Cloud API webhook challenge verification.
    """
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    verify_token = os.getenv("WHATSAPP_VERIFY_TOKEN", "mcsc_whatsapp_verify_token")

    if mode == "subscribe" and token == verify_token:
        print(f"Meta webhook verification successful!")
        return Response(content=challenge, media_type="text/plain")
    elif mode == "subscribe":
        # Accept if token is not strictly enforced during initial dev testing
        return Response(content=challenge, media_type="text/plain")
        
    return Response(content="Verification token mismatch", status_code=403)


@router.post("/api/v1/webhooks/meta")
@router.post("/api/webhooks/whatsapp")
@router.post("/api/webhooks/meta")
async def receive_meta_webhook(request: Request, db: Session = Depends(database.get_db)):
    """
    Receives incoming WhatsApp Cloud API events (delivery status receipts, client replies).
    """
    try:
        body = await request.json()
        
        # Parse status updates
        entry_list = body.get("entry", [])
        for entry in entry_list:
            changes = entry.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                
                # Check for message statuses (sent, delivered, read, failed)
                statuses = value.get("statuses", [])
                for status_item in statuses:
                    msg_id = status_item.get("id")
                    status_val = status_item.get("status")
                    recipient_id = status_item.get("recipient_id")
                    print(f"[WhatsApp Status] Msg: {msg_id} -> {status_val} (Recipient: {recipient_id})")

                # Check for incoming messages from clients
                messages = value.get("messages", [])
                for msg in messages:
                    from_phone = msg.get("from")
                    text_body = msg.get("text", {}).get("body", "")
                    print(f"[WhatsApp Inbound] From: {from_phone} -> Text: {text_body}")

        return {"status": "success"}
    except Exception as e:
        print(f"Error handling Meta webhook event: {e}")
        return {"status": "error", "detail": str(e)}
