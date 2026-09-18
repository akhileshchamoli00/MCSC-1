import os
import re
import httpx
from dotenv import load_dotenv
from pathlib import Path

root_env = Path(__file__).resolve().parent.parent.parent / ".env.local"
backend_env = Path(__file__).resolve().parent.parent / ".env"

if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=True)
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=True)
load_dotenv(override=True)

def get_whatsapp_config():
    if root_env.exists():
        load_dotenv(dotenv_path=root_env, override=True)
    if backend_env.exists():
        load_dotenv(dotenv_path=backend_env, override=True)
    token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    version = os.getenv("WHATSAPP_API_VERSION", "v21.0")
    return token, phone_id, version

def sanitize_phone_number(phone: str) -> str:
    """
    Sanitizes phone numbers into international E.164 digits without '+' or symbols.
    For Indonesia (08... -> 628...).
    """
    if not phone:
        return ""
    cleaned = re.sub(r'[^0-9]', '', str(phone).strip())
    if cleaned.startswith("0"):
        cleaned = "62" + cleaned[1:]
    elif cleaned.startswith("8"):
        cleaned = "62" + cleaned
    return cleaned

def send_whatsapp_text(recipient_phone: str, message: str) -> dict:
    """
    Sends a direct text message via Meta WhatsApp Cloud API.
    """
    token, phone_id, version = get_whatsapp_config()

    if not token or not phone_id:
        print("WARNING: WhatsApp Cloud API credentials (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID) not configured.")
        return {"success": False, "error": "WhatsApp credentials not configured in environment"}

    target = sanitize_phone_number(recipient_phone)
    if not target:
        return {"success": False, "error": "Invalid recipient phone number"}

    url = f"https://graph.facebook.com/{version}/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": target,
        "type": "text",
        "text": {
            "preview_url": True,
            "body": message
        }
    }

    try:
        with httpx.Client(timeout=20.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            data = resp.json()
            if resp.status_code in [200, 201]:
                print(f"Successfully sent WhatsApp message to {target}: {data}")
                return {"success": True, "data": data}
            else:
                error_msg = data.get("error", {}).get("message", resp.text)
                print(f"Failed to send WhatsApp message to {target}: {resp.status_code} - {error_msg}")
                return {"success": False, "error": error_msg, "status_code": resp.status_code, "raw": data}
    except Exception as e:
        print(f"Exception sending WhatsApp message: {str(e)}")
        return {"success": False, "error": str(e)}

def send_whatsapp_template(recipient_phone: str, template_name: str = "hello_world", language_code: str = "en_US") -> dict:
    """
    Sends a pre-approved template message via Meta WhatsApp Cloud API (e.g. hello_world sandbox test).
    """
    token, phone_id, version = get_whatsapp_config()

    if not token or not phone_id:
        return {"success": False, "error": "WhatsApp credentials not configured"}

    target = sanitize_phone_number(recipient_phone)
    url = f"https://graph.facebook.com/{version}/{phone_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": target,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {
                "code": language_code
            }
        }
    }

    try:
        with httpx.Client(timeout=20.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            data = resp.json()
            if resp.status_code in [200, 201]:
                return {"success": True, "data": data}
            else:
                error_msg = data.get("error", {}).get("message", resp.text)
                return {"success": False, "error": error_msg, "status_code": resp.status_code, "raw": data}
    except Exception as e:
        return {"success": False, "error": str(e)}

def send_whatsapp_document(
    recipient_phone: str,
    file_bytes: bytes,
    filename: str,
    caption: str = "",
    mime_type: str = "application/pdf"
) -> dict:
    """
    Uploads a binary document (PDF) to Meta Media API and dispatches it as a document message.
    """
    token, phone_id, version = get_whatsapp_config()

    if not token or not phone_id:
        return {"success": False, "error": "WhatsApp credentials not configured"}

    target = sanitize_phone_number(recipient_phone)
    if not target:
        return {"success": False, "error": "Invalid recipient phone number"}

    upload_url = f"https://graph.facebook.com/{version}/{phone_id}/media"
    upload_headers = {"Authorization": f"Bearer {token}"}
    files = {
        "file": (filename or "document.pdf", file_bytes, mime_type)
    }
    data = {
        "messaging_product": "whatsapp",
        "type": mime_type
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            upload_resp = client.post(upload_url, headers=upload_headers, files=files, data=data)
            upload_data = upload_resp.json()
            if upload_resp.status_code not in [200, 201] or "id" not in upload_data:
                err = upload_data.get("error", {}).get("message", upload_resp.text)
                print(f"Failed to upload document to WhatsApp Media API: {upload_resp.status_code} - {err}")
                return {"success": False, "error": err, "raw": upload_data}

            media_id = upload_data["id"]

            # Dispatch document message
            msg_url = f"https://graph.facebook.com/{version}/{phone_id}/messages"
            msg_headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            msg_payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": target,
                "type": "document",
                "document": {
                    "id": media_id,
                    "caption": caption or f"📄 {filename}",
                    "filename": filename or "Invoice.pdf"
                }
            }

            msg_resp = client.post(msg_url, headers=msg_headers, json=msg_payload)
            msg_data = msg_resp.json()
            if msg_resp.status_code in [200, 201]:
                print(f"Successfully sent WhatsApp document ({filename}) to {target}: {msg_data}")
                return {"success": True, "data": msg_data, "media_id": media_id}
            else:
                err = msg_data.get("error", {}).get("message", msg_resp.text)
                print(f"Failed to send WhatsApp document to {target}: {msg_resp.status_code} - {err}")
                return {"success": False, "error": err, "raw": msg_data}

    except Exception as e:
        print(f"Exception sending WhatsApp document: {str(e)}")
        return {"success": False, "error": str(e)}

def send_whatsapp_invoice_notification(
    recipient_phone: str,
    recipient_name: str,
    company_name: str,
    order_number: str,
    invoice_type: str,
    amount_formatted: str,
    payment_url: str = None,
    pdf_content: bytes = None,
    pdf_filename: str = None
) -> dict:
    """
    Formats and delivers an official invoice notification to the client on WhatsApp,
    including the text summary, payment link, and the actual PDF document.
    """
    inv_title = f"{invoice_type.title()} Invoice"

    message = f"""*PT MANDIRI CIPTA SOLUSI (MCS CONSULTING)*
Official Billing & Invoice Notification

Dear *{recipient_name or company_name or 'Valued Client'}*,

Your *{inv_title}* for order *{order_number}* ({company_name or 'Client Entity'}) has been finalized and issued.

📋 *Invoice Details:*
• *Order Reference:* {order_number}
• *Billing Entity:* PT Mandiri Cipta Solusi
• *Invoice Type:* {inv_title}
• *Amount Due:* {amount_formatted}

💳 *Secure Online Payment (Virtual Account / QRIS / Bank Transfer):*
{payment_url if payment_url else 'Please refer to the invoice attachment for transfer instructions.'}

📄 *Official Invoice PDF:*
Attached below and also delivered to your registered email address.

If you have already processed this payment or need further assistance, please reply directly to this message.

Thank you,
*PT Mandiri Cipta Solusi*
Springhill Office Tower, Jakarta
www.mcsc.co.id"""

    text_res = send_whatsapp_text(recipient_phone, message)
    if not text_res.get("success"):
        # Fallback to template if outside 24h conversation window
        if "template" in str(text_res.get("error", "")).lower() or text_res.get("status_code") == 400:
            print("Notice: Attempting fallback to hello_world template...")
            tpl_res = send_whatsapp_template(recipient_phone, "hello_world")
            if tpl_res.get("success"):
                text_res = {"success": True, "note": "Sent via template", "data": tpl_res.get("data")}

    # If PDF bytes are supplied, send the actual PDF file as a WhatsApp document
    doc_res = None
    if pdf_content:
        clean_filename = pdf_filename or f"MCSC_{invoice_type.title()}_Invoice_{order_number}.pdf"
        caption = f"📄 {inv_title} - {order_number} ({company_name or 'PT Mandiri Cipta Solusi'})"
        doc_res = send_whatsapp_document(
            recipient_phone=recipient_phone,
            file_bytes=pdf_content,
            filename=clean_filename,
            caption=caption
        )

    return {
        "success": text_res.get("success") or (doc_res and doc_res.get("success", False)),
        "text_result": text_res,
        "doc_result": doc_res
    }

