"""
Amazon SES / SMTP Configuration & Test Script
Usage:
    python test_ses.py [recipient@example.com]
"""

import os
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from dotenv import load_dotenv

# Load environments
root_env = Path(__file__).resolve().parent.parent / ".env.local"
backend_env = Path(__file__).resolve().parent / ".env"

if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=True)
if backend_env.exists():
    load_dotenv(dotenv_path=backend_env, override=True)
load_dotenv(override=True)

def mask(val: str, show_start: int = 4, show_end: int = 4) -> str:
    if not val:
        return "<not set>"
    if len(val) <= (show_start + show_end):
        return "***"
    return f"{val[:show_start]}...{val[-show_end:]}"

def run_test(recipient: str = "admin@mcsc.co.id"):
    host = os.getenv("SMTP_HOST") or os.getenv("SES_SMTP_HOST") or "email-smtp.ap-southeast-5.amazonaws.com"
    port = int(os.getenv("SMTP_PORT") or os.getenv("SES_SMTP_PORT") or "587")
    user = os.getenv("SMTP_USER") or os.getenv("SES_SMTP_USER") or os.getenv("GMAIL_USER") or ""
    password = (os.getenv("SMTP_PASSWORD") or os.getenv("SES_SMTP_PASSWORD") or os.getenv("GMAIL_APP_PASSWORD") or "").replace(" ", "")
    sender_email = os.getenv("SENDER_EMAIL") or os.getenv("SMTP_USER") or "admin@mcsc.co.id"
    sender_name = os.getenv("SENDER_NAME", "PT Mandiri Cipta Solusi")

    print("\n==========================================")
    print("  Amazon SES / SMTP Diagnostic & Test")
    print("==========================================")
    print(f"  SMTP Host:     {host}")
    print(f"  SMTP Port:     {port}")
    print(f"  SMTP Username: {mask(user, 6, 4)}")
    print(f"  SMTP Password: {mask(password, 4, 4)}")
    print(f"  Sender Email:  {sender_email}")
    print(f"  Sender Name:   {sender_name}")
    print(f"  Target To:     {recipient}")
    print("==========================================\n")

    if not user or not password:
        print("❌ Error: Missing SMTP credentials in .env.local or backend/.env.")
        print("Please configure SMTP_USER and SMTP_PASSWORD.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "✅ Amazon SES Production Test - PT Mandiri Cipta Solusi"
    msg["From"] = f"{sender_name} <{sender_email}>"
    msg["To"] = recipient

    text_content = f"""
Hello,

This is an automated test email confirming that Amazon SES (Asia Pacific - Malaysia, ap-southeast-5) is connected and operating in Production mode for PT Mandiri Cipta Solusi.

Sender: {sender_email}
Host: {host}:{port}
    """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #1e3a8a; margin: 0;">PT Mandiri Cipta Solusi</h2>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0;">Amazon SES Email Verification</p>
        </div>
        <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h4 style="color: #065f46; margin: 0 0 6px 0; font-size: 16px;">🎉 Amazon SES Connected Successfully!</h4>
          <p style="color: #047857; margin: 0; font-size: 13px;">Your application can now send transactional emails, invoices, client notices, payslips, and leads through Amazon SES Production.</p>
        </div>
        <table style="width: 100%; font-size: 13px; color: #334155; margin-bottom: 20px;">
          <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Region:</td><td>Asia Pacific (Malaysia) [ap-southeast-5]</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">SMTP Host:</td><td><code>{host}:{port}</code></td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Sender Identity:</td><td>{sender_email}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Recipient:</td><td>{recipient}</td></tr>
        </table>
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          Sent from PT Mandiri Cipta Solusi Core System
        </p>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        print(f"Connecting to {host}:{port}...")
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=25) as server:
                print("Authenticating...")
                server.login(user, password)
                print("Sending test message...")
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=25) as server:
                server.ehlo()
                print("Initiating STARTTLS...")
                server.starttls()
                server.ehlo()
                print("Authenticating...")
                server.login(user, password)
                print("Sending test message...")
                server.send_message(msg)

        print("\n[SUCCESS] Test email successfully sent!\n")
        return True
    except Exception as e:
        print(f"\n[FAILED] {str(e)}\n")
        return False

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "admin@mcsc.co.id"
    run_test(target)
