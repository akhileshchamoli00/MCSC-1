import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from dotenv import load_dotenv

root_env = Path(__file__).resolve().parent.parent.parent / ".env.local"
backend_env = Path(__file__).resolve().parent.parent / ".env"

if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=True)
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=True)
load_dotenv(override=True)

from typing import Optional, List, Union

def send_smtp_email(msg: MIMEMultipart, recipient_email: str, description: str = "email", cc_emails: Optional[List[str]] = None) -> bool:
    """
    Sends an outbound email via configured SMTP (Amazon SES or Gmail / Custom SMTP).
    Reads SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SENDER_EMAIL from environment.
    Supports optional CC recipients.
    """
    if root_env.exists():
        load_dotenv(dotenv_path=root_env, override=True)
    if backend_env.exists():
        load_dotenv(dotenv_path=backend_env, override=True)

    sender_email = os.getenv("SENDER_EMAIL") or os.getenv("SMTP_USER") or os.getenv("GMAIL_USER") or "admin@mcsc.co.id"
    sender_name = os.getenv("SENDER_NAME", "PT Mandiri Cipta Solusi")

    if not msg.get("From"):
        msg["From"] = f"{sender_name} <{sender_email}>"

    msg["To"] = recipient_email

    clean_cc_list = []
    if cc_emails:
        for cc in cc_emails:
            if not cc or not str(cc).strip():
                continue
            cleaned = str(cc).strip()
            if cleaned.lower() != recipient_email.strip().lower() and cleaned.lower() not in [c.lower() for c in clean_cc_list]:
                clean_cc_list.append(cleaned)
        if clean_cc_list:
            msg["Cc"] = ", ".join(clean_cc_list)

    host = os.getenv("SMTP_HOST") or os.getenv("SES_SMTP_HOST") or "smtp.gmail.com"
    port = int(os.getenv("SMTP_PORT") or os.getenv("SES_SMTP_PORT") or "587")
    user = os.getenv("SMTP_USER") or os.getenv("SES_SMTP_USER") or os.getenv("GMAIL_USER")
    password = (os.getenv("SMTP_PASSWORD") or os.getenv("SES_SMTP_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD") or "").replace(" ", "")

    if not host or not user or not password:
        print(f"WARNING: SMTP credentials (SMTP_USER / SMTP_PASSWORD or GMAIL_USER / GMAIL_APP_PASSWORD) not found. Failed to send {description} to {recipient_email}.")
        return False

    is_ses = "amazonaws.com" in host.lower()
    provider_label = "Amazon SES" if is_ses else f"SMTP ({host})"

    cc_log = f" (CC: {', '.join(clean_cc_list)})" if clean_cc_list else ""
    try:
        print(f"[{provider_label} ({host}:{port})] Sending {description} to {recipient_email}{cc_log} from {sender_email}...")
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=90) as server:
                server.login(user, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=90) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(user, password)
                server.send_message(msg)

        print(f"[{provider_label}] SUCCESS: Successfully delivered {description} to {recipient_email}{cc_log}")
        return True
    except Exception as e:
        print(f"[{provider_label}] FAILED to send {description} to {recipient_email}{cc_log}: {str(e)}")
        return False

def get_frontend_url(request=None) -> str:
    """
    Returns the real public frontend URL (origin).
    - If request headers indicate production (e.g. Origin/Referer/Host containing 'mcsc.co.id'), returns 'https://www.mcsc.co.id'.
    - If request is provided, inspects Origin, Referer, X-Forwarded-Host.
    - If FRONTEND_URL is explicitly set to a production/custom domain, uses that.
    - Defaults to 'https://www.mcsc.co.id' in production, never leaking 'localhost' to external emails unless specifically running on localhost with local requests.
    """
    if request:
        origin = request.headers.get("origin")
        if origin and origin not in ("null", "undefined", ""):
            if "mcsc.co.id" in origin:
                return "https://www.mcsc.co.id"
            if "localhost" in origin or "127.0.0.1" in origin:
                return origin.rstrip("/").replace(":8000", ":3000")
            return origin.rstrip("/")
            
        referer = request.headers.get("referer")
        if referer:
            from urllib.parse import urlparse
            parsed = urlparse(referer)
            if parsed.netloc:
                if "mcsc.co.id" in parsed.netloc:
                    return "https://www.mcsc.co.id"
                if "localhost" in parsed.netloc or "127.0.0.1" in parsed.netloc:
                    return f"{parsed.scheme or 'http'}://{parsed.netloc.replace(':8000', ':3000')}"
                return f"{parsed.scheme or 'https'}://{parsed.netloc}"
                
        host = request.headers.get("x-forwarded-host") or request.headers.get("host")
        if host:
            if "mcsc.co.id" in host:
                return "https://www.mcsc.co.id"
            proto = request.headers.get("x-forwarded-proto", "http" if ("localhost" in host or "127.0.0.1" in host) else "https")
            return f"{proto}://{host.replace(':8000', ':3000')}"

    env_url = os.getenv("FRONTEND_URL", "").strip()
    if env_url and "localhost" not in env_url and "127.0.0.1" not in env_url:
        return env_url.rstrip("/")

    # Default to production domain
    return "https://www.mcsc.co.id"

def send_welcome_email(employee_email: str, employee_name: str, password: str, frontend_url: Optional[str] = None):
    """
    Send welcome email to a new employee with their login credentials.
    """
    subject = "Welcome to MCS Consulting HRMS"
    base_url = frontend_url or get_frontend_url()
    
    body = f"""Dear {employee_name},

Welcome to MCS Consulting! Your HRMS employee portal account has been created.

Please log in to your dashboard to complete your profile and view your employment details.

URL: {base_url}/login
Username: {employee_email}
Password: {password}

For security reasons, we strongly recommend changing your password after your first login.

Regards,
MCS Consulting HRMS
"""

    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    return send_smtp_email(msg, employee_email, "welcome email")


def send_payslip_password_email(employee_email: str, employee_name: str, month_year: str, password: str):
    """
    Send the payslip password to the employee's email in a separate email.
    """
    subject = f"Your Payslip Password - {month_year}"
    
    body = f"""Dear {employee_name},

Your payslip for {month_year} has been generated successfully and is now available in the employee portal or attached to a separate email.

For security reasons, your PDF payslip is password protected. 

Payslip Password:
{password}

Please use this password to decrypt your payslip PDF.

Regards,
MCS Consulting HRMS
"""

    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    return send_smtp_email(msg, employee_email, "payslip password email")


def send_payslip_attachment_email(employee_email: str, employee_name: str, month_year: str, pdf_content: bytes, pdf_filename: str):
    """
    Send the encrypted PDF payslip over the email as an attachment.
    """
    subject = f"Your Payslip Attachment - {month_year}"
    
    body = f"""Dear {employee_name},

Please find attached your encrypted PDF payslip for {month_year}.

For security reasons, the PDF is password-protected. The password to open this file has been sent to you in a separate email.

Regards,
MCS Consulting HRMS
"""

    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    if pdf_content:
        from email.mime.application import MIMEApplication
        part = MIMEApplication(pdf_content, Name=pdf_filename or "payslip.pdf")
        part['Content-Disposition'] = f'attachment; filename="{pdf_filename or "payslip.pdf"}"'
        msg.attach(part)

    return send_smtp_email(msg, employee_email, "payslip attachment email")


def send_password_reset_email(employee_email: str, reset_link: str):
    """
    Send the password reset link with a premium responsive HTML email template.
    """
    subject = "Reset Your Password - MCS Consulting Portal"
    logo_url = "https://www.mcsc.co.id/logo.png"
    
    plain_text = f"""Hello,

We received a request to reset the password for your MCS Consulting account ({employee_email}).

You can reset your password by clicking the link below:
{reset_link}

This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.

Best regards,
MCS Consulting
https://www.mcsc.co.id
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - MCS Consulting</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }}
    .container {{
      max-width: 580px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }}
    .header {{
      background: #ffffff;
      padding: 32px 40px 24px;
      text-align: center;
      border-bottom: 1px solid #f1f5f9;
    }}
    .header img {{
      display: block;
      margin: 0 auto;
      max-width: 190px;
      width: 190px;
      height: auto;
    }}
    .content {{
      padding: 36px 40px;
    }}
    .greeting {{
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }}
    .message {{
      font-size: 14px;
      color: #475569;
      margin-bottom: 28px;
    }}
    .btn-container {{
      text-align: center;
      margin: 30px 0;
    }}
    .btn {{
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: 0.2px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }}
    .link-box {{
      background: #f1f5f9;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      word-break: break-all;
      color: #64748b;
      margin-top: 24px;
      border: 1px solid #e2e8f0;
    }}
    .notice {{
      font-size: 12px;
      color: #94a3b8;
      margin-top: 24px;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }}
    .footer {{
      background: #f8fafc;
      padding: 20px 40px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{logo_url}" alt="MCS Consulting" width="190" border="0" />
    </div>
    <div class="content">
      <div class="greeting">Password Reset Request</div>
      <div class="message">
        We received a request to reset the password for your account associated with <strong>{employee_email}</strong>. Click the button below to set a new password:
      </div>
      <div class="btn-container">
        <a href="{reset_link}" class="btn" target="_blank">Reset Password</a>
      </div>
      <div class="link-box">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="{reset_link}" style="color: #2563eb;">{reset_link}</a>
      </div>
      <div class="notice">
        <strong>Security Notice:</strong> This link will expire in <strong>1 hour</strong>. If you did not request this password reset, please ignore this email or contact support if you have concerns.
      </div>
    </div>
    <div class="footer">
      &copy; MCS Consulting. All rights reserved.<br>
      Jakarta, Indonesia &bull; <a href="https://www.mcsc.co.id" style="color: #64748b; text-decoration: none;">www.mcsc.co.id</a>
    </div>
  </div>
</body>
</html>
"""

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg.attach(MIMEText(plain_text, 'plain'))
    msg.attach(MIMEText(html_content, 'html'))

    return send_smtp_email(msg, employee_email, "password reset email")


def send_invoice_attachment_email(recipient_email: str, recipient_name: str, invoice_type: str, pdf_content: bytes, pdf_filename: str, payment_url: str = None, cc_emails: Optional[List[str]] = None):
    """
    Send finalized proforma or final invoice attachment to a client, with an optional payment checkout URL and CC recipients.
    """


    subject = f"PT Mandiri Cipta Solusi - {invoice_type.title()} Invoice"
    
    from datetime import datetime
    transmission_id = datetime.now().strftime("%Y%m%d%H%M%S%f")
    
    # 1. Plain Text Fallback Body
    text_body = f"Dear {recipient_name},\n\nPlease find attached our official {invoice_type} invoice ({pdf_filename}) for your review and payment processing."
    if payment_url:
        text_body += f"\n\nYou can pay online via secure Bank Transfer (Virtual Account) using the link below:\n{payment_url}\n\nSecure checkout powered by Xendit (PCI-DSS Certified Encryption)."
    text_body += "\n\nIf you have any questions or require further assistance, please feel free to reach out to us.\n\nRegards,\nPT Mandiri Cipta Solusi (MCS Consulting)\n"

    # 2. Professional HTML Body
    payment_section_html = ""
    if payment_url:
        payment_section_html = f"""
        <div class="details-card">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Billing Entity:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">PT Mandiri Cipta Solusi</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Invoice Type:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">{invoice_type.title()} Invoice</td>
            </tr>
            <tr>
              <td class="details-label">Attachment:</td>
              <td class="details-value" style="text-align: right;">{pdf_filename}</td>
            </tr>
          </table>
        </div>
        
        <div class="cta-container">
          <a href="{payment_url}" class="btn" target="_blank">Proceed to Secure Payment</a>
          <div class="security-note">
            &#128274; <strong>Secure checkout powered by Xendit</strong><br>
            PCI-DSS Certified Encryption. Virtual Accounts supported.
          </div>
        </div>
        """
    else:
        payment_section_html = f"""
        <div class="details-card" style="margin-bottom: 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Billing Entity:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">PT Mandiri Cipta Solusi</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Invoice Type:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">{invoice_type.title()} Invoice</td>
            </tr>
            <tr>
              <td class="details-label">Attachment:</td>
              <td class="details-value" style="text-align: right;">{pdf_filename}</td>
            </tr>
          </table>
        </div>
        """

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f8fafc;
      padding: 30px 10px;
    }}
    .container {{
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }}
    .header {{
      background-color: #ffffff;
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }}
    .header h1 {{
      color: #0f172a;
      font-size: 20px;
      margin: 0;
      font-weight: 700;
      letter-spacing: 0.5px;
    }}
    .header p {{
      color: #64748b;
      font-size: 13px;
      margin: 5px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }}
    .content {{
      padding: 40px 30px;
    }}
    .greeting {{
      font-size: 16px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 20px;
    }}
    .message {{
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 30px;
    }}
    .details-card {{
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      border: 1px solid #e2e8f0;
    }}
    .details-label {{
      color: #64748b;
      font-weight: 550;
      font-size: 14px;
    }}
    .details-value {{
      color: #0f172a;
      font-weight: 600;
      font-size: 14px;
    }}
    .cta-container {{
      text-align: center;
      margin: 35px 0;
    }}
    .btn {{
      display: inline-block;
      background-color: #0284c7;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2), 0 2px 4px -2px rgba(2, 132, 199, 0.2);
    }}
    .security-note {{
      font-size: 12px;
      color: #64748b;
      text-align: center;
      margin-top: 15px;
      line-height: 1.5;
    }}
    .footer {{
      background-color: #f8fafc;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }}
    .footer a {{
      color: #64748b;
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="cid:msc_logo" alt="MCSC Logo" style="height: 50px; width: auto; display: block; margin: 0 auto;">
      </div>
      <div class="content">
        <div class="greeting">Dear {recipient_name},</div>
        <div class="message">
          Please find attached our official <strong>{invoice_type} invoice</strong> for your review and payment processing.
        </div>
        
        {payment_section_html}
        
        <div class="message" style="margin-bottom: 0; margin-top: 20px;">
          If you have any questions or require further assistance, please feel free to reply directly to this email.
        </div>
      </div>
      <div class="footer">
        This is an automated invoice transmission from PT Mandiri Cipta Solusi.<br>
        Office: Springhill Office Tower, Lantai 9 Unit 9C, Jakarta, Indonesia | <a href="https://www.mcsc.co.id">www.mcsc.co.id</a>
      </div>
      <div style="display:none !important; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        Transmission ID: {transmission_id}
      </div>
    </div>
  </div>
</body>
</html>
"""

    msg = MIMEMultipart("mixed")
    msg['Subject'] = subject

    # Create the alternative part for text/html
    alt_part = MIMEMultipart("alternative")
    alt_part.attach(MIMEText(text_body, 'plain'))
    alt_part.attach(MIMEText(html_body, 'html'))
    msg.attach(alt_part)

    # Attach MCSC Logo if it exists
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    logo_path = os.path.join(base_dir, "public", "logo.png")
    if os.path.exists(logo_path):
        from email.mime.image import MIMEImage
        try:
            with open(logo_path, "rb") as f:
                logo_data = f.read()
                msg_image = MIMEImage(logo_data)
                msg_image.add_header('Content-ID', '<msc_logo>')
                msg_image.add_header('Content-Disposition', 'inline')
                msg.attach(msg_image)
        except Exception as img_err:
            print("Failed to attach logo inline:", img_err)

    if pdf_content:
        from email.mime.application import MIMEApplication
        part = MIMEApplication(pdf_content, Name=pdf_filename)
        part['Content-Disposition'] = f'attachment; filename="{pdf_filename}"'
        msg.attach(part)

    return send_smtp_email(msg, recipient_email, f"{invoice_type} invoice email", cc_emails=cc_emails)


def send_notary_payment_voucher_email(
    notary_email: str,
    notary_name: str,
    order_number: str,
    company_name: str,
    job_title: str,
    amount: float,
    bank_name: str,
    bank_account_number: str,
    bank_account_holder_name: str,
    payment_date: str,
    payout_ref: str,
    custom_message: str = None,
    pdf_content: bytes = None,
    pdf_filename: str = None
):
    """
    Send an official Payment Voucher / Remittance Advice email to the Notary after disbursement,
    following the standard invoice email template with embedded MCS logo in header and attached PDF.
    """


    voucher_no = f"PV-{order_number}"
    formatted_amount = f"IDR {int(amount):,}".replace(",", ".")
    subject = f"PT Mandiri Cipta Solusi - Payment Voucher ({voucher_no})"
    attachment_name = pdf_filename or f"{voucher_no}.pdf"

    from datetime import datetime
    transmission_id = datetime.now().strftime("%Y%m%d%H%M%S%f")

    # 1. Plain Text Fallback Body
    text_body = f"""Dear {notary_name},

Please find attached our official Payment Voucher & Remittance Advice ({attachment_name}) for your review and records.

PAYMENT VOUCHER DETAILS:
- Billing Entity: PT Mandiri Cipta Solusi
- Document Type: Payment Voucher & Remittance Advice
- Voucher No: {voucher_no}
- Order Reference: ORD-{order_number}
- Service / Deed: {job_title}
- Settled Amount: {formatted_amount}
- Payment Date: {payment_date}
- Status: Settled
- Attachment: {attachment_name}

{f"Note: {custom_message}" if custom_message else ""}

If you have any questions or require further assistance, please feel free to reply directly to this email.

Regards,
PT Mandiri Cipta Solusi (MCS Consulting)
"""

    # 2. Clean, Simple HTML Body matching Proforma Invoice template
    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f8fafc;
      padding: 30px 10px;
    }}
    .container {{
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }}
    .header {{
      background-color: #ffffff;
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }}
    .content {{
      padding: 40px 30px;
    }}
    .greeting {{
      font-size: 16px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 20px;
    }}
    .message {{
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 30px;
    }}
    .details-card {{
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      border: 1px solid #e2e8f0;
    }}
    .details-label {{
      color: #64748b;
      font-weight: 550;
      font-size: 14px;
    }}
    .details-value {{
      color: #0f172a;
      font-weight: 600;
      font-size: 14px;
    }}
    .footer {{
      background-color: #f8fafc;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }}
    .footer a {{
      color: #64748b;
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="cid:msc_logo" alt="MCSC Logo" style="height: 50px; width: auto; display: block; margin: 0 auto;">
      </div>
      <div class="content">
        <div class="greeting">Dear {notary_name},</div>
        <div class="message">
          Please find attached our official <strong>Payment Voucher &amp; Remittance Advice</strong> ({attachment_name}) for your review and records.
        </div>
        
        <div class="details-card" style="margin-bottom: 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Billing Entity:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">PT Mandiri Cipta Solusi</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Document Type:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">Payment Voucher &amp; Remittance Advice</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Voucher No:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right; font-family: monospace;">{voucher_no}</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Order Reference:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right; font-family: monospace;">ORD-{order_number}</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Service / Deed:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">{job_title}</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Settled Amount:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right; font-weight: 700; color: #047857;">{formatted_amount}</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Payment Date:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">{payment_date}</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Status:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right; color: #059669; font-weight: 700;">Settled</td>
            </tr>
            <tr>
              <td class="details-label">Attachment:</td>
              <td class="details-value" style="text-align: right; color: #0284c7;">&#128206; {attachment_name}</td>
            </tr>
          </table>
        </div>
        
        {f'''
        <div class="details-card" style="margin-top: 15px; margin-bottom: 0; font-size: 13px; color: #475569; font-style: italic;">
          <strong style="font-style: normal; color: #0f172a;">Note:</strong> {custom_message}
        </div>
        ''' if custom_message else ''}

        <div class="message" style="margin-bottom: 0; margin-top: 20px;">
          If you have any questions or require further assistance, please feel free to reply directly to this email.
        </div>
      </div>
      <div class="footer">
        This is an automated payment remittance transmission from PT Mandiri Cipta Solusi.<br>
        Office: Springhill Office Tower, Lantai 9 Unit 9C, Jakarta, Indonesia | <a href="https://www.mcsc.co.id">www.mcsc.co.id</a>
      </div>
      <div style="display:none !important; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        Transmission ID: {transmission_id}
      </div>
    </div>
  </div>
</body>
</html>
"""

    msg = MIMEMultipart("mixed")
    msg['Subject'] = subject

    # Create the alternative part for text/html
    alt_part = MIMEMultipart("alternative")
    alt_part.attach(MIMEText(text_body, 'plain'))
    alt_part.attach(MIMEText(html_body, 'html'))
    msg.attach(alt_part)

    # Attach MCSC Logo inline
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    logo_path = os.path.join(base_dir, "public", "logo.png")
    if os.path.exists(logo_path):
        from email.mime.image import MIMEImage
        try:
            with open(logo_path, "rb") as f:
                logo_data = f.read()
                msg_image = MIMEImage(logo_data)
                msg_image.add_header('Content-ID', '<msc_logo>')
                msg_image.add_header('Content-Disposition', 'inline')
                msg.attach(msg_image)
        except Exception as img_err:
            print("Failed to attach logo inline:", img_err)

    # Attach PDF Voucher if provided
    if pdf_content:
        from email.mime.application import MIMEApplication
        part = MIMEApplication(pdf_content, Name=attachment_name)
        part['Content-Disposition'] = f'attachment; filename="{attachment_name}"'
        msg.attach(part)

    return send_smtp_email(msg, notary_email, f"payment voucher email ({voucher_no})")


def create_password_protected_zip(attachments: list, password: str = None) -> bytes:
    """
    Creates a universally compatible password-protected ZIP archive using standard
    PKWARE ZipCrypto encryption and Deflate compression (ZIP 2.0 specification).
    
    This ensures native, error-free extraction directly in Windows File Explorer,
    macOS Archive Utility, 7-Zip, WinRAR, Linux, iOS, and Android file managers.
    """
    import io
    import zlib
    import struct
    import time
    import os
    import zipfile

    if not attachments:
        return b""

    clean_attachments = []
    for item in attachments:
        if isinstance(item, (tuple, list)):
            fn, data = item[0], item[1]
        elif isinstance(item, dict):
            fn, data = item.get("filename", "document.pdf"), item.get("content", b"")
        else:
            continue
            
        if not data:
            continue
        if isinstance(data, str):
            data = data.encode("utf-8")
        clean_attachments.append((str(fn), data))

    if not clean_attachments:
        return b""

    # If no password provided, return standard ZIP archive
    if not password:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
            for fn, data in clean_attachments:
                zf.writestr(fn, data)
        return buf.getvalue()

    pwd_bytes = str(password).encode("utf-8")
    
    # Precompute CRC table
    crctable = []
    for i in range(256):
        c = i
        for _ in range(8):
            if c & 1:
                c = (c >> 1) ^ 0xEDB88320
            else:
                c >>= 1
        crctable.append(c)

    def crc32_byte(b, crc):
        return (crc >> 8) ^ crctable[(crc ^ b) & 0xFF]

    def create_encrypter():
        k0 = 305419896
        k1 = 591751049
        k2 = 878082192

        def update(b):
            nonlocal k0, k1, k2
            k0 = crc32_byte(b, k0)
            k1 = (k1 + (k0 & 0xFF)) & 0xFFFFFFFF
            k1 = (k1 * 134775813 + 1) & 0xFFFFFFFF
            k2 = crc32_byte((k1 >> 24) & 0xFF, k2)

        for p in pwd_bytes:
            update(p)

        def encrypt_bytes(data):
            res = bytearray()
            for b in data:
                k = k2 | 2
                keystream = ((k * (k ^ 1)) >> 8) & 0xFF
                update(b)
                res.append(b ^ keystream)
            return bytes(res)

        return encrypt_bytes

    buf = io.BytesIO()
    cd_records = []
    
    now = time.localtime()
    dos_time = (now.tm_hour << 11) | (now.tm_min << 5) | (now.tm_sec // 2)
    dos_date = ((now.tm_year - 1980) << 9) | (now.tm_mon << 5) | now.tm_mday

    for filename, raw_bytes in clean_attachments:
        clean_fn = filename.replace('\\', '/').strip('/')
        fn_bytes = clean_fn.encode("utf-8")
        file_crc = zlib.crc32(raw_bytes) & 0xFFFFFFFF
        uncompressed_size = len(raw_bytes)
        
        # Deflate compression (raw stream without zlib wrapper)
        compressor = zlib.compressobj(level=9, method=zlib.DEFLATED, wbits=-15, memLevel=8, strategy=zlib.Z_DEFAULT_STRATEGY)
        deflated_data = compressor.compress(raw_bytes) + compressor.flush()
        
        # 12-byte encryption header: 11 pseudo-random bytes + 1 byte matching (file_crc >> 24) & 0xFF
        rand_bytes = os.urandom(11)
        check_byte = bytes([(file_crc >> 24) & 0xFF])
        header_plain = rand_bytes + check_byte
        
        encrypter = create_encrypter()
        encrypted_header = encrypter(header_plain)
        encrypted_data = encrypter(deflated_data)
        
        payload = encrypted_header + encrypted_data
        compressed_size = len(payload)
        
        local_header_offset = buf.tell()
        flag_bits = 0x801  # Bit 0 = Encrypted, Bit 11 = UTF-8 string encoding
        
        local_header = struct.pack(
            '<4sHHHHHIIIHH',
            b'PK\x03\x04',
            20,             # version needed: 2.0
            flag_bits,
            8,              # compression: Deflate
            dos_time,
            dos_date,
            file_crc,
            compressed_size,
            uncompressed_size,
            len(fn_bytes),
            0
        ) + fn_bytes
        
        buf.write(local_header)
        buf.write(payload)
        
        cd_records.append((
            flag_bits,
            dos_time,
            dos_date,
            file_crc,
            compressed_size,
            uncompressed_size,
            fn_bytes,
            local_header_offset
        ))

    cd_start_offset = buf.tell()
    
    for flag_bits, dos_time, dos_date, file_crc, compressed_size, uncompressed_size, fn_bytes, local_header_offset in cd_records:
        cd_header = struct.pack(
            '<4sHHHHHHIIIHHHHHII',
            b'PK\x01\x02',
            20,                 # version made by (2.0)
            20,                 # version needed to extract (2.0)
            flag_bits,
            8,                  # Deflate
            dos_time,
            dos_date,
            file_crc,
            compressed_size,
            uncompressed_size,
            len(fn_bytes),
            0,                  # extra field length
            0,                  # comment length
            0,                  # disk number
            0,                  # internal attributes
            0x81B60020,         # external attributes
            local_header_offset
        ) + fn_bytes
        buf.write(cd_header)
        
    cd_end_offset = buf.tell()
    cd_size = cd_end_offset - cd_start_offset
    total_entries = len(cd_records)
    
    eocd = struct.pack(
        '<4sHHHHIIH',
        b'PK\x05\x06',
        0,
        0,
        total_entries,
        total_entries,
        cd_size,
        cd_start_offset,
        0
    )
    buf.write(eocd)
    
    return buf.getvalue()


def send_final_documents_email(
    recipient_email: str,
    recipient_name: str,
    order_number: str,
    company_name: str,
    attachments: list,
    custom_message: str = None,
    company_code: str = None,
    tax_number: str = None,
    zip_password: str = None,
    zip_filename: str = None,
    cc_emails: Optional[List[str]] = None,
    disable_zip: bool = False
):
    """
    Send official delivery email with all final deliverable documents.
    If disable_zip is False (default), packages into an encrypted password-protected ZIP archive.
    If disable_zip is True, attaches the files directly without encryption.
    """
    import io
    import re
    from datetime import datetime

    subject = f"PT Mandiri Cipta Solusi - Delivery of Final Documents (Order {order_number})"
    transmission_id = datetime.now().strftime("%Y%m%d%H%M%S%f")
    delivery_date = datetime.now().strftime("%d %B %Y")

    # Normalize attachments list
    normalized_attachments = []
    for item in attachments:
        if isinstance(item, tuple) or isinstance(item, list):
            normalized_attachments.append((item[0], item[1]))
        elif isinstance(item, dict):
            normalized_attachments.append((item.get("filename", "document.pdf"), item.get("content", b"")))

    doc_names = [fn for fn, _ in normalized_attachments]
    doc_count = len(normalized_attachments)

    zip_bytes = None
    zip_size_kb = 0
    final_zip_name = ""

    if not disable_zip:
        # Resolve ZIP password
        effective_code = (company_code or "").strip()
        order_num = (order_number or "").strip()
        effective_password = zip_password or f"{effective_code}{order_num}" or "MCSC2026"
        
        # Resolve ZIP file name
        clean_company = re.sub(r'[/\\?%*:|"<> ]', '_', company_name or "Client")
        final_zip_name = zip_filename or f"{clean_company}_{order_number}_Final_Documents.zip"

        # Build simple, universal Password-Protected ZIP Archive
        zip_bytes = create_password_protected_zip(normalized_attachments, effective_password)
        zip_size_kb = round(len(zip_bytes) / 1024, 1) if zip_bytes else 0

    # 1. Plain Text Fallback Body
    doc_list_text = "\n".join([f"- {fn}" for fn in doc_names])
    
    if disable_zip:
        text_body = f"""Dear {recipient_name or 'Valued Client'},

We are pleased to deliver the completed final documents for your service order reference {order_number}.

DELIVERY DETAILS:
- Company Entity: {company_name or 'N/A'}
- Order Reference: {order_number}
- Delivery Date: {delivery_date}
- Number of Delivered Documents: {doc_count} document(s) (Direct File Attachments)

DELIVERED DOCUMENTS:
{doc_list_text if doc_list_text else '- (Documents attached)'}

{f"Note: {custom_message}" if custom_message else ""}

Please find the deliverable document files attached directly to this email for your corporate filing and records.

Regards,
PT Mandiri Cipta Solusi (MCS Consulting)
Springhill Office Tower, Lantai 9 Unit 9C, Jakarta, Indonesia
www.mcsc.co.id
"""
    else:
        text_body = f"""Dear {recipient_name or 'Valued Client'},

We are pleased to deliver the completed final documents for your service order reference {order_number}.

DELIVERY DETAILS:
- Company Entity: {company_name or 'N/A'}
- Order Reference: {order_number}
- Delivery Date: {delivery_date}
- Encrypted Delivery Archive: {final_zip_name} ({zip_size_kb} KB)
- Number of Archived Documents: {doc_count}

PASSWORD PROTECTION INSTRUCTIONS:
For your privacy and corporate confidentiality, all documents are packaged in a password-protected ZIP archive attached to this email.

To unlock and extract the documents:
- ZIP Archive Password:
  Formula: [Company Code] + [Order ID]
  Example: If Company Code = A261226 and Order ID = MCSX-260015, the password is A261226MCSX-260015

DOCUMENTS INCLUDED IN ARCHIVE:
{doc_list_text if doc_list_text else '- (Final documents included in ZIP archive)'}

{f"Note: {custom_message}" if custom_message else ""}

Please find the password-protected ZIP file attached to this email. You can open and extract it using any standard archive utility (Windows File Explorer, macOS Archive Utility, 7-Zip, or WinRAR).

Regards,
PT Mandiri Cipta Solusi (MCS Consulting)
Springhill Office Tower, Lantai 9 Unit 9C, Jakarta, Indonesia
www.mcsc.co.id
"""

    # 2. HTML Table for included files
    status_label = "Attached" if disable_zip else "Protected in ZIP"
    docs_rows_html = ""
    for idx, fn in enumerate(doc_names, 1):
        docs_rows_html += f"""
        <tr>
          <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; font-family: monospace;">
            &#128196; <strong>{fn}</strong>
          </td>
          <td style="padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #0284c7; text-align: right; font-weight: 600; text-transform: uppercase;">
            {status_label}
          </td>
        </tr>
        """

    # 3. Professional HTML Body
    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f8fafc;
      padding: 30px 10px;
    }}
    .container {{
      max-width: 740px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }}
    .header {{
      background-color: #ffffff;
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }}
    .content {{
      padding: 35px 30px;
    }}
    .greeting {{
      font-size: 16px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 18px;
    }}
    .message {{
      font-size: 14.5px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 22px;
    }}
    .details-card {{
      background-color: #f8fafc;
      border-radius: 10px;
      padding: 18px 20px;
      margin-bottom: 22px;
      border: 1px solid #e2e8f0;
    }}
    .details-label {{
      color: #64748b;
      font-weight: 550;
      font-size: 13px;
    }}
    .details-value {{
      color: #0f172a;
      font-weight: 600;
      font-size: 13px;
    }}
    .security-box {{
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1.5px solid #7dd3fc;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
    }}
    .security-title {{
      color: #0369a1;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .password-badge {{
      display: inline-block;
      background-color: #ffffff;
      border: 1.5px dashed #0284c7;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 16px;
      font-weight: 700;
      color: #0369a1;
      letter-spacing: 1px;
      margin-top: 8px;
    }}
    .docs-table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }}
    .footer {{
      background-color: #f8fafc;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }}
    .footer a {{
      color: #64748b;
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="cid:msc_logo" alt="MCSC Logo" style="height: 50px; width: auto; display: block; margin: 0 auto;">
      </div>
      <div class="content">
        <div class="greeting">Dear {recipient_name or 'Valued Client'},</div>
        
        <div class="message">
          We are pleased to deliver the completed final documents for your service order reference <strong>{order_number}</strong> ({company_name or 'Client Entity'}).
        </div>

        {f'''<!-- SECURITY & PASSWORD CARD -->
        <div class="security-box">
          <div class="security-title">
            &#128274; Password-Protected Deliverables Archive Attached
          </div>
          <div style="font-size: 13px; color: #1e293b; line-height: 1.55;">
            To ensure the highest standard of data privacy and corporate confidentiality, all deliverable documents are encrypted inside the attached file <strong>{final_zip_name}</strong>.
          </div>
          
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #bae6fd; font-size: 12.5px; color: #334155;">
            <div style="font-weight: 700; color: #0369a1; margin-bottom: 4px;">ZIP Archive Password:</div>
            <div style="color: #475569; font-size: 12.5px; margin-bottom: 4px;">
              Formula: <strong>[Company Code]</strong> + <strong>[Order ID]</strong>
            </div>
            <div style="color: #64748b; font-size: 11.5px; font-style: italic;">
              Example: If Company Code = A261226 and Order ID = MCSX-260015, the password is <span style="font-family: monospace; font-weight: 600; color: #0369a1;">A261226MCSX-260015</span>
            </div>
          </div>
        </div>''' if not disable_zip else ''}

        <!-- DETAILS CARD -->
        <div class="details-card">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Order Reference:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right; font-family: monospace;">{order_number}</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Company Entity:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">{company_name or 'Client Entity'}</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Delivery Date:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">{delivery_date}</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Attached Documents:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right; color: #0284c7; font-family: monospace;">{f"{final_zip_name} ({zip_size_kb} KB)" if not disable_zip else f"{doc_count} document(s) (Direct Attachments)"}</td>
            </tr>
          </table>

          {f'''
          <table class="docs-table">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="padding: 7px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: left;">Archived Document File</th>
                <th style="padding: 7px 12px; font-size: 11px; text-transform: uppercase; color: #64748b; text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody>
              {docs_rows_html}
            </tbody>
          </table>
          ''' if doc_names else ''}
        </div>
        
        {f'''
        <div class="details-card" style="margin-top: 15px; margin-bottom: 25px; font-size: 13px; color: #475569; font-style: italic;">
          <strong style="font-style: normal; color: #0f172a;">Delivery Note:</strong> {custom_message}
        </div>
        ''' if custom_message else ''}

        <div class="message" style="margin-bottom: 0;">
          {f"Please download and unlock the attached ZIP archive for your corporate filing and records." if not disable_zip else "Please find the attached final deliverable documents for your corporate filing and records."}
        </div>
      </div>
      <div class="footer">
        This is an official document transmission from PT Mandiri Cipta Solusi.<br>
        Office: Springhill Office Tower, Lantai 9 Unit 9C, Jakarta, Indonesia | <a href="https://www.mcsc.co.id">www.mcsc.co.id</a>
      </div>
      <div style="display:none !important; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        Transmission ID: {transmission_id}
      </div>
    </div>
  </div>
</body>
</html>
"""

    msg = MIMEMultipart("mixed")
    msg['Subject'] = subject

    # Create the alternative part for text/html
    alt_part = MIMEMultipart("alternative")
    alt_part.attach(MIMEText(text_body, 'plain'))
    alt_part.attach(MIMEText(html_body, 'html'))
    msg.attach(alt_part)

    # Attach MCSC Logo inline
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    logo_path = os.path.join(base_dir, "public", "logo.png")
    if os.path.exists(logo_path):
        from email.mime.image import MIMEImage
        try:
            with open(logo_path, "rb") as f:
                logo_data = f.read()
                msg_image = MIMEImage(logo_data)
                msg_image.add_header('Content-ID', '<msc_logo>')
                msg_image.add_header('Content-Disposition', 'inline')
                msg.attach(msg_image)
        except Exception as img_err:
            print("Failed to attach logo inline:", img_err)

    # Attach files: either direct attachments or single encrypted ZIP
    from email.mime.application import MIMEApplication
    if disable_zip:
        for fn, ct in normalized_attachments:
            if ct:
                file_part = MIMEApplication(ct, Name=fn)
                file_part.add_header('Content-Disposition', 'attachment', filename=fn)
                msg.attach(file_part)
    elif zip_bytes:
        zip_part = MIMEApplication(zip_bytes, Name=final_zip_name)
        zip_part.add_header('Content-Disposition', 'attachment', filename=final_zip_name)
        msg.attach(zip_part)

    dispatch_desc = f"final documents ({doc_count} files, {'direct attachments' if disable_zip else 'encrypted ZIP'}) for order {order_number}"
    return send_smtp_email(msg, recipient_email, dispatch_desc, cc_emails=cc_emails)


def send_signed_documents_for_signature_email(
    recipient_email: str,
    recipient_name: str,
    order_number: str,
    company_name: str,
    attachments: list,
    custom_message: str = None,
    company_code: str = None,
    tax_number: str = None,
    zip_password: str = None,
    zip_filename: str = None,
    cc_emails: Optional[List[str]] = None,
    disable_zip: bool = False
):
    """
    Send official pre-documents for signature email to the client.
    If disable_zip is False (default), packages into a password-protected ZIP archive.
    If disable_zip is True, sends direct unencrypted attachments without ZIP.
    """
    import io
    import re
    from datetime import datetime
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from email.mime.application import MIMEApplication

    subject = f"PT Mandiri Cipta Solusi - Documents for Signature (Order {order_number})"
    transmission_id = datetime.now().strftime("%Y%m%d%H%M%S%f")
    delivery_date = datetime.now().strftime("%d %B %Y")

    # Normalize attachments list and extract descriptions
    normalized_attachments = []
    for item in attachments:
        if isinstance(item, tuple) or isinstance(item, list):
            fn = item[0]
            ct = item[1]
            desc = item[2] if len(item) > 2 else ""
            normalized_attachments.append((fn, ct, desc))
        elif isinstance(item, dict):
            fn = item.get("filename") or item.get("file_name", "document.pdf")
            ct = item.get("content", b"")
            desc = item.get("description", "")
            normalized_attachments.append((fn, ct, desc))

    doc_count = len(normalized_attachments)

    zip_bytes = None
    zip_size_kb = 0
    final_zip_name = ""

    if not disable_zip:
        # Resolve ZIP password
        effective_code = (company_code or "").strip()
        order_num = (order_number or "").strip()
        effective_password = zip_password or f"{effective_code}{order_num}" or "MCSC2026"
        
        # Resolve ZIP file name
        clean_company = re.sub(r'[/\\?%*:|"<> ]', '_', company_name or "Client")
        final_zip_name = zip_filename or f"{clean_company}_{order_number}_Pre_Documents.zip"

        # Build Password-Protected ZIP Archive
        zip_bytes = create_password_protected_zip([(fn, ct) for fn, ct, _ in normalized_attachments], effective_password)
        zip_size_kb = round(len(zip_bytes) / 1024, 1) if zip_bytes else 0

    def format_signature_instruction_html(desc: str) -> str:
        if not desc or not desc.strip():
            return ''
        text = desc.strip()
        # Break on sequence numbers (e.g., " 1. ", " 2. ", " 1) ", " 2) ", " • ", " - ")
        formatted = re.sub(r'(?<=\S)\s+(?=(?:\d+[\.\)]|[-•*])\s+)', '\n', text)
        lines = [line.strip() for line in formatted.split('\n') if line.strip()]
        if len(lines) <= 1:
            return f'<div style="background-color: #ffffff; border: 1px solid #bae6fd; border-radius: 6px; padding: 7px 10px; line-height: 1.5; color: #0f172a; font-size: 12px; font-weight: 500;">{text}</div>'
        html_items = [f'<div style="margin-bottom: 4px; line-height: 1.45; color: #0f172a;">{l}</div>' for l in lines]
        return f'<div style="background-color: #ffffff; border: 1px solid #bae6fd; border-radius: 6px; padding: 7px 10px; font-size: 12px; font-weight: 500;">{"".join(html_items)}</div>'

    def format_signature_instruction_text(desc: str, indent: str = "    ") -> str:
        if not desc or not desc.strip():
            return ""
        formatted = re.sub(r'(?<=\S)\s+(?=(?:\d+[\.\)]|[-•*])\s+)', '\n', desc.strip())
        lines = [line.strip() for line in formatted.split('\n') if line.strip()]
        return "\n".join([f"{indent}{l}" for l in lines])

    docs_rows_html = "".join([
        f"""<tr style="background-color: #f8fbfe;">
            <td style="padding: 11px 14px; font-size: 12.5px; color: #0284c7; border-bottom: 1px solid #e0f2fe; font-family: monospace; font-weight: 700; vertical-align: top; width: 42%;">
              📄 {fn}
            </td>
            <td style="padding: 9px 12px; font-size: 12.5px; color: #334155; border-bottom: 1px solid #e0f2fe; line-height: 1.5; vertical-align: top; width: 58%;">
              {format_signature_instruction_html(desc)}
            </td>
          </tr>"""
        for fn, _, desc in normalized_attachments
    ])

    doc_table_text = "\n".join([
        f"• Document: {fn}" + (f"\n  Instructions:\n{format_signature_instruction_text(desc, '    ')}" if desc and desc.strip() else "")
        for fn, _, desc in normalized_attachments
    ])

    if disable_zip:
        text_body = f"""Dear {recipient_name or 'Valued Client'},

Please find attached the documents prepared for your signature and review regarding service order reference {order_number}.

ORDER & TRANSMISSION DETAILS:
- Company Entity: {company_name or 'N/A'}
- Order Reference: {order_number}
- Date: {delivery_date}
- Number of Documents for Signature: {doc_count} document(s) (Direct File Attachments)

DOCUMENTS AND INSTRUCTIONS:
{doc_table_text if doc_table_text else '- (Documents attached)'}

INSTRUCTIONS:
Please review and sign the attached documents at your earliest convenience. Once signed, you may send them back via reply email or upload them directly to your order workspace on the MCSC portal.

{f'Special Instructions: {custom_message}' if custom_message else ''}

Please find the document files attached directly to this email.

Best regards,
PT Mandiri Cipta Solusi (MCS Consulting)
Springhill Office Tower, Lantai 9 Unit 9C, Jakarta, Indonesia
www.mcsc.co.id
"""
    else:
        text_body = f"""Dear {recipient_name or 'Valued Client'},

Please find attached the documents prepared for your signature and review regarding service order reference {order_number}.

ORDER & TRANSMISSION DETAILS:
- Company Entity: {company_name or 'N/A'}
- Order Reference: {order_number}
- Date: {delivery_date}
- Encrypted Delivery Archive: {final_zip_name} ({zip_size_kb} KB)
- Number of Documents for Signature: {doc_count}

PASSWORD PROTECTION INSTRUCTIONS:
For your privacy and corporate confidentiality, all documents are packaged in a password-protected ZIP archive attached to this email.

To unlock and extract the documents:
- ZIP Archive Password:
  Formula: [Company Code] + [Order ID]
  Example: If Company Code = A261226 and Order ID = MCSX-260015, the password is A261226MCSX-260015

DOCUMENTS AND INSTRUCTIONS:
{doc_table_text if doc_table_text else '- (Documents included in ZIP archive)'}

INSTRUCTIONS:
Please review and sign the attached documents at your earliest convenience. Once signed, you may send them back via reply email or upload them directly to your order workspace on the MCSC portal.

{f'Special Instructions: {custom_message}' if custom_message else ''}

Please find the password-protected ZIP file attached to this email. You can open and extract it using standard archive utilities (Windows Explorer, macOS Archive Utility, 7-Zip, or WinRAR).

Best regards,
PT Mandiri Cipta Solusi (MCS Consulting)
Springhill Office Tower, Lantai 9 Unit 9C, Jakarta, Indonesia
www.mcsc.co.id
"""

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documents for Signature - Order {order_number}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f8fafc;
      padding: 30px 15px;
    }}
    .container {{
      max-width: 740px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }}
    .header {{
      background-color: #ffffff;
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }}
    .content {{
      padding: 35px 30px;
    }}
    .greeting {{
      font-size: 16px;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 18px;
    }}
    .message {{
      font-size: 14.5px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 22px;
    }}
    .details-card {{
      background-color: #f8fafc;
      border-radius: 10px;
      padding: 18px 20px;
      margin-bottom: 22px;
      border: 1px solid #e2e8f0;
    }}
    .details-label {{
      color: #64748b;
      font-weight: 550;
      font-size: 13px;
    }}
    .details-value {{
      color: #0f172a;
      font-weight: 600;
      font-size: 13px;
    }}
    .security-box {{
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1.5px solid #7dd3fc;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
    }}
    .security-title {{
      color: #0369a1;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .docs-table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      background-color: #f0f9ff;
      border-radius: 8px;
      overflow: hidden;
      border: 1.5px solid #bae6fd;
    }}
    .footer {{
      background-color: #f8fafc;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.5;
    }}
    .footer a {{
      color: #64748b;
      text-decoration: underline;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="cid:msc_logo" alt="PT Mandiri Cipta Solusi" style="max-height: 48px; width: auto; margin-bottom: 12px;">
        <h2 style="margin: 0; color: #0f172a; font-size: 19px; font-weight: 700; letter-spacing: -0.3px;">Documents Prepared for Signature</h2>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 500;">Order #{order_number}</div>
      </div>
      <div class="content">
        <div class="greeting">Dear {recipient_name or 'Valued Client'},</div>
        <div class="message">
          Our team has completed the preparation and review of the documents for your service order <strong>{order_number}</strong> ({company_name or 'Client Entity'}). Please find the documents attached below for your review and signature.
        </div>

        {f'''<!-- SECURITY & PASSWORD CARD -->
        <div class="security-box">
          <div class="security-title">
            &#128274; Password-Protected Signature Documents Archive Attached
          </div>
          <div style="font-size: 13px; color: #1e293b; line-height: 1.55;">
            To ensure the highest standard of data privacy and confidentiality, all documents requiring signature are encrypted inside the attached archive <strong>{final_zip_name}</strong>.
          </div>
          
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #bae6fd; font-size: 12.5px; color: #334155;">
            <div style="font-weight: 700; color: #0369a1; margin-bottom: 4px;">ZIP Archive Password:</div>
            <div style="color: #475569; font-size: 12.5px; margin-bottom: 4px;">
              Formula: <strong>[Company Code]</strong> + <strong>[Order ID]</strong>
            </div>
            <div style="color: #64748b; font-size: 11.5px; font-style: italic;">
              Example: If Company Code = A261226 and Order ID = MCSX-260015, the password is <span style="font-family: monospace; font-weight: 600; color: #0369a1;">A261226MCSX-260015</span>
            </div>
          </div>
        </div>''' if not disable_zip else ''}

        <div class="details-card">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Company Entity:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">{company_name or 'N/A'}</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Order Reference:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right; color: #0284c7; font-family: monospace;">#{order_number}</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Dispatch Date:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right;">{delivery_date}</td>
            </tr>
            <tr>
              <td class="details-label" style="padding-bottom: 8px;">Attached Documents:</td>
              <td class="details-value" style="padding-bottom: 8px; text-align: right; color: #0284c7; font-family: monospace;">{f"{final_zip_name} ({zip_size_kb} KB)" if not disable_zip else f"{doc_count} document(s) (Direct Attachments)"}</td>
            </tr>
          </table>

          {f'''
          <table class="docs-table">
            <thead>
              <tr style="background-color: #e0f2fe; border-bottom: 1.5px solid #bae6fd;">
                <th style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #0369a1; text-align: left; font-weight: 700; width: 42%; letter-spacing: 0.5px;">Document Name</th>
                <th style="padding: 10px 14px; font-size: 11px; text-transform: uppercase; color: #0369a1; text-align: left; font-weight: 700; width: 58%; letter-spacing: 0.5px;">Instructions / Description</th>
              </tr>
            </thead>
            <tbody>
              {docs_rows_html}
            </tbody>
          </table>
          ''' if normalized_attachments else ''}
        </div>
        
        {f'''
        <div class="details-card" style="margin-top: 15px; margin-bottom: 10px; font-size: 13px; color: #475569; font-style: italic;">
          <strong style="font-style: normal; color: #0f172a;">Special Note:</strong> {custom_message}
        </div>
        ''' if custom_message else ''}
      </div>
      <div class="footer">
        This is an official document transmission from PT Mandiri Cipta Solusi.<br>
        Office: Springhill Office Tower, Lantai 9 Unit 9C, Jakarta, Indonesia | <a href="https://www.mcsc.co.id">www.mcsc.co.id</a>
      </div>
      <div style="display:none !important; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        Transmission ID: {transmission_id}
      </div>
    </div>
  </div>
</body>
</html>
"""

    msg = MIMEMultipart("mixed")
    msg['Subject'] = subject

    alt_part = MIMEMultipart("alternative")
    alt_part.attach(MIMEText(text_body, 'plain'))
    alt_part.attach(MIMEText(html_body, 'html'))
    msg.attach(alt_part)

    # Attach MCSC Logo inline
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    logo_path = os.path.join(base_dir, "public", "logo.png")
    if os.path.exists(logo_path):
        from email.mime.image import MIMEImage
        try:
            with open(logo_path, "rb") as f:
                logo_data = f.read()
                msg_image = MIMEImage(logo_data)
                msg_image.add_header('Content-ID', '<msc_logo>')
                msg_image.add_header('Content-Disposition', 'inline')
                msg.attach(msg_image)
        except Exception as img_err:
            print("Failed to attach logo inline:", img_err)

    # Attach files: either direct attachments or single encrypted ZIP
    if disable_zip:
        for fn, ct, _ in normalized_attachments:
            if ct:
                file_part = MIMEApplication(ct, Name=fn)
                file_part.add_header('Content-Disposition', 'attachment', filename=fn)
                msg.attach(file_part)
    elif zip_bytes:
        zip_part = MIMEApplication(zip_bytes, Name=final_zip_name)
        zip_part.add_header('Content-Disposition', 'attachment', filename=final_zip_name)
        msg.attach(zip_part)

    dispatch_desc = f"pre-documents for signature ({doc_count} files, {'direct attachments' if disable_zip else 'encrypted ZIP'}) for order {order_number}"
    return send_smtp_email(msg, recipient_email, dispatch_desc, cc_emails=cc_emails)


def send_company_welcome_verified_email(
    recipient_email: str,
    recipient_name: str,
    company_name: str,
    company_code: str,
    tax_number: str = None,
    industry: str = None,
    address: str = None,
    key_contact_phone: str = None,
    portal_url: str = None
) -> bool:
    """
    Send an official welcome & verification email to a newly verified company with an embedded
    unique MCS Corporate ID Card, highlighting the unique Company Code (e.g., A260001) and
    emphasizing its permanent importance for order tracking, client portal access, and consultant chat.
    """
    from datetime import datetime
    import os

    effective_code = (company_code or "").strip().upper()
    effective_name = (company_name or "Valued Client").strip()
    effective_recipient = (recipient_name or "Company Representative").strip()
    effective_tax = (tax_number or "N/A").strip()
    effective_industry = (industry or "Corporate Advisory & Business Licensing").strip()
    effective_address = (address or "Indonesia").strip()
    
    frontend_url = portal_url or os.getenv("FRONTEND_URL", "https://www.mcsc.co.id")
    login_url = f"{frontend_url}/login"
    track_url = f"{frontend_url}/en/track-order"
    
    issued_date = datetime.now().strftime("%d %B %Y")
    member_since = datetime.now().strftime("%m/%y")
    transmission_id = datetime.now().strftime("%Y%m%d%H%M%S%f")

    subject = f"Welcome to MCS Group - Official Company Registration & Verified ID [{effective_code}]"

    # 1. Plain Text Fallback Body
    text_body = f"""Dear {effective_recipient},

Welcome to the MCS Consulting Group!

We are pleased to inform you that your company, {effective_name}, has been officially verified and onboarded into the MCS corporate consulting system.

===================================================================
MCS CORPORATE IDENTITY - OFFICIAL CLIENT ID CARD
===================================================================
Company Entity: {effective_name}
PERMANENT COMPANY ID: {effective_code}
Authorized Contact: {effective_recipient}
Industry: {effective_industry}
Member Since: {member_since} ({issued_date})
Status: VERIFIED & ACTIVE
===================================================================

*** YOUR PERMANENT COMPANY ID [{effective_code}] ***
Your unique Company ID ({effective_code}) safely links all your corporate records and orders. Please retain this code in your records for:

1. Live Order Tracking & Milestone Updates (at {track_url})
2. Unified & Secure Data Storage for all your company documents and files
3. Fast Consultant Assistance whenever you need support

ACCESS YOUR PORTAL:
You can log in to your dedicated corporate workspace anytime at:
{login_url}

If you need any assistance, our consulting team is available at:
- Email: admin@mcsc.co.id
- WhatsApp: +62-878-7796-7799
- Office: Springhill Office Tower, Lantai 9 Unit 9C, Jakarta Utara, Indonesia

Warm regards,
PT Mandiri Cipta Solusi (MCS Consulting)
Corporate Advisory, Licensing & Compliance Services
www.mcsc.co.id
"""

    # 2. Luxury Responsive HTML Email Body with Amex Platinum Look & Feel
    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 10px;
    }}
    .container {{
      max-width: 640px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      border: 1px solid #e2e8f0;
    }}
    .header {{
      background-color: #ffffff;
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }}
    .content {{
      padding: 36px 32px;
    }}
    .greeting {{
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 14px;
      letter-spacing: -0.3px;
    }}
    .message {{
      font-size: 14px;
      line-height: 1.65;
      color: #475569;
      margin-bottom: 24px;
    }}
    
    /* ==========================================================================
       LUXURY EXECUTIVE MIDNIGHT TITANIUM CARD (FRESH & ELEGANT)
       ========================================================================== */
    .titanium-card-outer {{
      margin: 30px 0;
    }}
    .titanium-card {{
      background: #0d1527;
      background: 
        radial-gradient(circle at 18% 18%, rgba(2, 132, 199, 0.32) 0%, transparent 48%),
        radial-gradient(circle at 82% 82%, rgba(245, 158, 11, 0.22) 0%, transparent 45%),
        radial-gradient(circle at 50% 50%, rgba(22, 163, 74, 0.15) 0%, transparent 55%),
        linear-gradient(145deg, #0b1120 0%, #131c31 45%, #080d1a 100%);
      border: 1.5px solid rgba(255, 255, 255, 0.22);
      border-radius: 20px;
      padding: 38px 36px 30px;
      color: #ffffff;
      box-shadow: 
        inset 0 1px 2px rgba(255, 255, 255, 0.4), 
        inset 0 -1px 2px rgba(0, 0, 0, 0.8), 
        0 24px 50px -10px rgba(11, 17, 32, 0.55),
        0 8px 24px -4px rgba(2, 132, 199, 0.25);
      position: relative;
      overflow: hidden;
    }}
    .card-emblem-wrap {{
      text-align: center;
      margin-bottom: 16px;
    }}
    .card-emblem-img {{
      height: 72px;
      width: auto;
      max-width: 110px;
      display: inline-block;
      filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.5));
    }}
    .card-wing-table {{
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 24px;
    }}
    .card-wing-line {{
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }}
    .card-wing-text {{
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #f8fafc;
      text-shadow: 0 1px 3px #000000, 0 0 14px rgba(255, 255, 255, 0.45);
      text-align: center;
      white-space: nowrap;
      padding: 0 14px;
    }}
    .card-number-section {{
      margin: 22px 0 26px;
      text-align: center;
    }}
    .card-number-label {{
      font-size: 8.5px;
      font-weight: 800;
      color: #93c5fd;
      text-transform: uppercase;
      letter-spacing: 3.5px;
      margin-bottom: 6px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }}
    .card-number-val {{
      font-size: 34px;
      font-weight: 900;
      letter-spacing: 9px;
      color: #ffffff;
      font-family: 'Courier New', 'OCR A Extended', monospace;
      margin: 0;
      line-height: 1.1;
      text-shadow: 0 1px 0 #ffffff, 0 -1px 0 #0f172a, 1px 2px 4px rgba(0, 0, 0, 0.95), 2px 4px 10px rgba(0, 0, 0, 0.9), 0 0 18px rgba(255, 255, 255, 0.7), 0 0 32px rgba(56, 189, 248, 0.45);
    }}

    /* Card Details Grid */
    .card-bottom-table {{
      width: 100%;
      border-collapse: collapse;
      border-top: 1px solid rgba(255, 255, 255, 0.16);
      box-shadow: 0 -1px 0 rgba(0, 0, 0, 0.6);
      padding-top: 16px;
      margin-top: 18px;
    }}
    .card-detail-label {{
      font-size: 8px;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 2px;
      line-height: 1;
      margin-bottom: 3px;
    }}
    .card-detail-val {{
      font-size: 13.5px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: 0.5px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 260px;
    }}
    .card-detail-val-sub {{
      font-size: 11.5px;
      font-weight: 700;
      color: #cbd5e1;
    }}

    /* Comforting Member Privileges & Benefits Box */
    .privilege-box {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: 3.5px solid #0284c7;
      border-radius: 14px;
      padding: 24px 26px;
      margin: 28px 0;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
    }}
    .privilege-title {{
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .privilege-intro {{
      font-size: 13.5px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 14px;
    }}
    .privilege-list {{
      margin: 0;
      padding: 0;
      list-style: none;
    }}
    .privilege-item {{
      font-size: 13px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 10px;
      padding-left: 24px;
      position: relative;
    }}
    .privilege-item::before {{
      content: "✓";
      position: absolute;
      left: 0;
      top: 0;
      color: #0284c7;
      font-weight: 800;
      font-size: 14px;
    }}
    .privilege-tip {{
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-top: 16px;
      font-size: 12.5px;
      line-height: 1.5;
      color: #475569;
    }}

    /* Action Buttons */
    .cta-container {{
      text-align: center;
      margin: 32px 0 16px;
    }}
    .btn-action-primary {{
      display: block;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 18px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.3px;
      text-align: center;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
      box-sizing: border-box;
      width: 100%;
    }}
    .btn-action-secondary {{
      display: block;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff !important;
      border: 1px solid #334155;
      text-decoration: none;
      padding: 13px 18px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.3px;
      text-align: center;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);
      box-sizing: border-box;
      width: 100%;
    }}

    /* Footer */
    .footer {{
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 30px;
      text-align: center;
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.6;
    }}
    .footer a {{
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      
      <!-- Top Branding Header -->
      <div class="header">
        <img src="cid:msc_logo" alt="MCSC Logo" style="height: 50px; width: auto; display: block; margin: 0 auto;">
      </div>

      <div class="content">
        <h1 class="greeting">Welcome to the MCS Group, {effective_recipient}!</h1>
        
        <div class="message">
          We are pleased to inform you that <strong>{effective_name}</strong> has been successfully registered, verified, and officially onboarded into the MCS corporate network.
        </div>

        <!-- ================================================================ -->
        <!-- MATTE BLACK METAL CARD WITH WHITE LASER ENGRAVINGS               -->
        <!-- ================================================================ -->
        <div class="titanium-card-outer">
          <div class="titanium-card">
            
            <!-- Centered Prominent MCS Logo Header -->
            <div class="card-emblem-wrap">
              <img src="cid:msc_icon_logo" alt="MCS Logo" class="card-emblem-img">
            </div>

            <!-- Wing Lines with Centered Corporate Identity Card Subtitle -->
            <table class="card-wing-table" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 16%; vertical-align: middle;">
                  <div class="card-wing-line"></div>
                </td>
                <td class="card-wing-text" style="vertical-align: middle;">
                  CORPORATE IDENTITY CARD
                </td>
                <td style="width: 16%; vertical-align: middle;">
                  <div class="card-wing-line"></div>
                </td>
              </tr>
            </table>

            <!-- Stamped Laser-Engraved Permanent Company ID -->
            <div class="card-number-section">
              <div class="card-number-label">Permanent Company ID</div>
              <div class="card-number-val">{effective_code}</div>
            </div>

            <!-- Card Bottom Metadata (White Laser-Etched on Black Metal) -->
            <table class="card-bottom-table" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <!-- Left: Corporate Entity & Authorized Contact -->
                <td style="text-align: left; vertical-align: bottom; width: 65%; padding-top: 10px;">
                  <div class="card-detail-label">Corporate Entity</div>
                  <div class="card-detail-val">{effective_name}</div>
                  <div style="margin-top: 4px;">
                    <span style="font-size: 8px; letter-spacing: 1.5px; color: #94a3b8; font-weight: 800;">AUTH:</span>
                    <span class="card-detail-val-sub">{effective_recipient}</span>
                  </div>
                </td>

                <!-- Right: Member Since -->
                <td style="text-align: right; vertical-align: bottom; width: 35%; padding-top: 10px;">
                  <div class="card-detail-label">Member Since</div>
                  <div class="card-detail-val" style="font-size: 13.5px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px;">{member_since}</div>
                </td>
              </tr>
            </table>

          </div>
        </div>

        <!-- COMFORTING MEMBER PRIVILEGES & KEY ACCESS -->
        <div class="privilege-box">
          <div class="privilege-title">
            <span style="font-size: 16px;">✨</span> <strong>Your Permanent Company ID &amp; Order Tracking</strong>
          </div>
          <div class="privilege-intro">
            Your permanent Company ID (<strong>{effective_code}</strong>) keeps all your corporate records and orders unified, secure, and easily accessible:
          </div>
          <ul class="privilege-list">
            <li class="privilege-item"><strong>Live Order Tracking:</strong> Track real-time progress and milestone updates for your ongoing orders anytime.</li>
            <li class="privilege-item"><strong>Unified &amp; Secure Data:</strong> All your company information and order history are safely stored under your permanent ID.</li>
            <li class="privilege-item"><strong>Fast Consultant Assistance:</strong> Simply share your Company ID so our consultants can instantly look up your orders and assist you.</li>
          </ul>
          <div class="privilege-tip">
            💡 <strong>Helpful Tip:</strong> Save your order tracking link or Company ID (<strong>{effective_code}</strong>) so you can easily check your order status or contact our team whenever needed.
          </div>
        </div>

        <!-- Call To Action (Equal Size Buttons) -->
        <div class="cta-container">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; margin: 0 auto;">
            <tr>
              <td style="width: 50%; padding: 0 6px; vertical-align: middle;">
                <a href="{track_url}" class="btn-action-primary" target="_blank">Track Order Status &rarr;</a>
              </td>
              <td style="width: 50%; padding: 0 6px; vertical-align: middle;">
                <a href="https://www.mcsc.co.id" class="btn-action-secondary" target="_blank">Visit Our Website &rarr;</a>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <strong>PT Mandiri Cipta Solusi (MCS Consulting)</strong><br>
        Springhill Office Tower, Lantai 9 Unit 9C, Jl. Benyamin Sueb Blok D7, Kemayoran, Jakarta Utara 14410<br>
        WhatsApp: +62-878-7796-7799 &bull; Email: <a href="mailto:admin@mcsc.co.id">admin@mcsc.co.id</a> &bull; Web: <a href="https://www.mcsc.co.id">www.mcsc.co.id</a>
      </div>
      
      <div style="display:none !important; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
        Transmission ID: {transmission_id} | Ref: {effective_code}
      </div>
    </div>
  </div>
</body>
</html>
"""

    msg = MIMEMultipart("mixed")
    msg['Subject'] = subject

    # Create the alternative part for text/html
    alt_part = MIMEMultipart("alternative")
    alt_part.attach(MIMEText(text_body, 'plain'))
    alt_part.attach(MIMEText(html_body, 'html'))
    msg.attach(alt_part)

    # Attach MCSC Header Logo inline (<msc_logo>)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    logo_path = os.path.join(base_dir, "public", "logo.png")
    if os.path.exists(logo_path):
        from email.mime.image import MIMEImage
        try:
            with open(logo_path, "rb") as f:
                logo_data = f.read()
                msg_image = MIMEImage(logo_data)
                msg_image.add_header('Content-ID', '<msc_logo>')
                msg_image.add_header('Content-Disposition', 'inline')
                msg.attach(msg_image)
        except Exception as img_err:
            print("Failed to attach logo inline:", img_err)

    # Attach MCSC Monogram Icon inline (<msc_icon_logo>)
    icon_path = os.path.join(base_dir, "public", "icon.png")
    if os.path.exists(icon_path):
        from email.mime.image import MIMEImage
        try:
            with open(icon_path, "rb") as f:
                icon_data = f.read()
                msg_icon_image = MIMEImage(icon_data)
                msg_icon_image.add_header('Content-ID', '<msc_icon_logo>')
                msg_icon_image.add_header('Content-Disposition', 'inline')
                msg.attach(msg_icon_image)
        except Exception as img_err:
            print("Failed to attach icon inline:", img_err)

    return send_smtp_email(msg, recipient_email, f"company welcome & verified ID card email for {effective_name} ({effective_code})")


def send_contact_lead_email(name: str, email: str, phone: str, message: str) -> bool:
    """
    Sends a new contact inquiry notification email to admin@mcsc.co.id with customer reply-to.
    """
    msg = MIMEMultipart("alternative")
    sender_name = os.getenv("SENDER_NAME", "MCS Consulting")
    sender_email = os.getenv("SENDER_EMAIL", "admin@mcsc.co.id")

    msg["Subject"] = f"🔥 New Contact Lead from {name}"
    msg["From"] = f"{sender_name} Lead Form <{sender_email}>"
    msg["Reply-To"] = email

    html_content = f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">MCS CONSULTING</h2>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">New Website Lead Notification</p>
      </div>
      
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #475569; width: 100px; font-size: 14px;">Name:</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px; font-weight: 700;">{name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #475569; font-size: 14px;">Email:</td>
            <td style="padding: 6px 0; color: #3b82f6; font-size: 14px;"><a href="mailto:{email}" style="color: #3b82f6; text-decoration: none;">{email}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #475569; font-size: 14px;">Phone:</td>
            <td style="padding: 6px 0; color: #0f172a; font-size: 14px;"><a href="tel:{phone}" style="color: #0f172a; text-decoration: none; font-weight: 600;">{phone}</a></td>
          </tr>
        </table>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; border-left: 4px solid #3b82f6;">
        <p style="font-weight: 700; margin: 0 0 8px 0; color: #1e293b; font-size: 14px;">Message Details:</p>
        <p style="color: #334155; line-height: 1.6; white-space: pre-wrap; margin: 0; font-size: 14px;">{message}</p>
      </div>

      <p style="font-size: 11px; color: #94a3b8; margin-top: 32px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.5;">
        This lead was securely generated from the MCS Consulting Contact page.<br/>
        Delivered via MCS Mail Dispatcher (Amazon SES).
      </p>
    </div>
    """
    msg.attach(MIMEText(html_content, "html"))
    return send_smtp_email(msg, "admin@mcsc.co.id", f"contact lead inquiry from {name} ({email})")


def send_trademark_query_email(brand_name: str, owner_name: str, email: str, app_no: str, reg_no: str) -> bool:
    """
    Sends a new trademark status check inquiry notification email to admin@mcsc.co.id.
    """
    msg = MIMEMultipart("alternative")
    sender_name = os.getenv("SENDER_NAME", "MCS Consulting")
    sender_email = os.getenv("SENDER_EMAIL", "admin@mcsc.co.id")

    msg["Subject"] = f"🔍 New Trademark Status Query: {brand_name or 'No Brand Name'}"
    msg["From"] = f"{sender_name} Status Check <{sender_email}>"
    msg["Reply-To"] = email if email else sender_email

    html_content = f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">MCS CONSULTING</h2>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">New Trademark Status Query</p>
      </div>
      
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 160px; color: #475569; border-bottom: 1px solid #f1f5f9;">Brand Name:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 800; font-size: 15px; border-bottom: 1px solid #f1f5f9;">{brand_name or '-'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Owner Name:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9;">{owner_name or '-'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Email Address:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9;">
              <a href="mailto:{email}" style="color: #2563eb; text-decoration: none;">{email or '-'}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">Application Number:</td>
            <td style="padding: 8px 0; color: #0f172a; border-bottom: 1px solid #f1f5f9;">{app_no or '-'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #475569;">Registration Number:</td>
            <td style="padding: 8px 0; color: #0f172a;">{reg_no or '-'}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 11px; color: #94a3b8; margin-top: 32px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.5;">
        This request was securely generated from the MCS Consulting Status Check page.<br/>
        Delivered via MCS Mail Dispatcher (Amazon SES).
      </p>
    </div>
    """
    msg.attach(MIMEText(html_content, "html"))
    return send_smtp_email(msg, "admin@mcsc.co.id", f"trademark query for {brand_name} ({email})")


def send_leave_application_reminder_email(
    employee_email: str,
    employee_name: str,
    department_name: Optional[str] = None,
    leave_type: Optional[str] = None,
    approximate_dates: Optional[str] = None,
    custom_note: Optional[str] = None,
    cc_emails: Optional[List[str]] = None,
    frontend_url: Optional[str] = None
) -> bool:
    """
    Sends an ultra-professional, branded email reminder to an employee to submit their official leave request.
    """
    if not employee_email or not employee_email.strip():
        print("WARNING: Cannot send leave reminder email without a valid recipient email address.")
        return False

    # Ensure email links always point to the production HR portal and never localhost
    base_url = "https://www.mcsc.co.id"
    if frontend_url and "localhost" not in frontend_url and "127.0.0.1" not in frontend_url:
        base_url = frontend_url.rstrip("/")
    else:
        env_url = (os.getenv("PROD_FRONTEND_URL") or os.getenv("FRONTEND_URL") or "").strip()
        if env_url and "localhost" not in env_url and "127.0.0.1" not in env_url:
            base_url = env_url.rstrip("/")

    apply_leave_url = f"{base_url}/hrms/apply-leave"

    dept_display = department_name.strip() if (department_name and department_name.strip()) else "General Operations"

    subject = f"Action Required: Please Submit Your Leave Request - MCS Consulting HR Portal"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    sender_email = os.getenv("SENDER_EMAIL") or os.getenv("SMTP_USER") or "admin@mcsc.co.id"
    sender_name = os.getenv("SENDER_NAME", "PT Mandiri Cipta Solusi - HR")
    msg["From"] = f"{sender_name} <{sender_email}>"
    msg["To"] = employee_email

    custom_note_text = f"\nManager / HR Note:\n\"{custom_note.strip()}\"\n" if (custom_note and custom_note.strip()) else ""

    plain_text = f"""Dear {employee_name},

Our attendance records indicate that you have taken leave / time off this month, but an official leave request has not yet been submitted in the HR Portal.

Details:
- Employee Name: {employee_name}
- Department: {dept_display}
- Action Required: Submit Formal Leave Application
- Portal Link: {apply_leave_url}{custom_note_text}

Please log in to the HR portal and submit your leave request as soon as possible:
{apply_leave_url}

IMPORTANT HR POLICY NOTICE:
Please make sure not to forget applying for your leave. In accordance with company policy, all absences and leaves must be officially recorded and approved through the portal to maintain accurate attendance records and ensure seamless payroll processing.

Best regards,
People Operations & Human Resources
PT Mandiri Cipta Solusi
{base_url}
"""
    msg.attach(MIMEText(plain_text, "plain"))

    custom_note_html = f"""
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; font-weight: 700; color: #b45309;">Note from HR / Management:</p>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #78350f; font-style: italic;">"{custom_note.strip()}"</p>
    </div>
    """ if (custom_note and custom_note.strip()) else ""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f1f5f9; margin: 0; padding: 24px 12px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border: 1px solid #e2e8f0;">
    
    <!-- Top Brand Header Banner -->
    <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px 36px; text-align: center;">
      <div style="background-color: #ffffff; display: inline-block; padding: 8px 18px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
        <img src="https://www.mcsc.co.id/logo.png" alt="MCS Logo" style="height: 36px; width: auto; display: block;" />
      </div>
    </div>

    <!-- Main Content Area -->
    <div style="padding: 36px 36px 28px;">
      
      <!-- Greeting & Notice Badge -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 18px; font-weight: 700;">Dear {employee_name},</h2>
      </div>

      <p style="color: #334155; font-size: 15px; margin: 0 0 20px 0; line-height: 1.6;">
        Our attendance records indicate that you have taken leave / time off this month, but an official leave request has not yet been submitted in the HR portal.
      </p>

      <!-- Details Summary Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Employee Name:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">{employee_name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Department:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{dept_display}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Action Required:</td>
            <td style="padding: 6px 0; color: #0284c7; font-weight: 700;">Submit Leave Request</td>
          </tr>
        </table>
      </div>

      {custom_note_html}

      <p style="color: #334155; font-size: 14px; margin: 0 0 24px 0;">
        Please take a moment to submit your formal leave application via the link below so your supervisor can review and approve it:
      </p>

      <!-- Action Button -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="{apply_leave_url}" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
          Submit Leave Request in Portal &rarr;
        </a>
      </div>

      <!-- Compliance & Policy Callout -->
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin-top: 28px;">
        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 6px;">
          📋 Official HR Policy Reminder:
        </p>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #15803d; line-height: 1.5;">
          Please make sure not to forget applying for your leave. In accordance with company policy, all absences and leaves must be formally recorded and approved through the portal to maintain accurate attendance records and ensure smooth payroll processing.
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 36px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600;">
        PT Mandiri Cipta Solusi • People Operations Department
      </p>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
        This automated notification was generated from the MCS Consulting HR Portal.
      </p>
    </div>

  </div>
</body>
</html>
"""
    msg.attach(MIMEText(html_content, "html"))
    return send_smtp_email(msg, employee_email, f"leave reminder to {employee_name} ({employee_email})", cc_emails=cc_emails)








