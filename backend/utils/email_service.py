import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

def send_welcome_email(employee_email: str, employee_name: str, password: str):
    """
    Send welcome email to a new employee with their login credentials.
    """
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("WARNING: GMAIL_USER or GMAIL_APP_PASSWORD not set in .env. Email won't be sent.")
        return

    subject = "Welcome to MCS Consulting HRMS"
    
    frontend_url = os.getenv("FRONTEND_URL", "https://www.mcsc.co.id")
    
    body = f"""Dear {employee_name},

Welcome to MCS Consulting! Your HRMS employee portal account has been created.

Please log in to your dashboard to complete your profile and view your employment details.

URL: {frontend_url}/login
Username: {employee_email}
Password: {password}

For security reasons, we strongly recommend changing your password after your first login.

Regards,
MCS Consulting HRMS
"""

    msg = MIMEMultipart()
    msg['From'] = GMAIL_USER
    msg['To'] = employee_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.send_message(msg)
        print(f"Successfully sent welcome email to {employee_email}")
    except Exception as e:
        print(f"Failed to send email to {employee_email}: {str(e)}")


def send_payslip_password_email(employee_email: str, employee_name: str, month_year: str, password: str):
    """
    Send the payslip password to the employee's email in a separate email.
    """
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("WARNING: GMAIL_USER or GMAIL_APP_PASSWORD not set in .env. Email won't be sent.")
        print(f"Would have sent to {employee_email}: Password is {password}")
        return

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
    msg['From'] = GMAIL_USER
    msg['To'] = employee_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.send_message(msg)
        print(f"Successfully sent password email to {employee_email}")
    except Exception as e:
        print(f"Failed to send password email to {employee_email}: {str(e)}")


def send_payslip_attachment_email(employee_email: str, employee_name: str, month_year: str, pdf_content: bytes, pdf_filename: str):
    """
    Send the encrypted PDF payslip over the email as an attachment.
    """
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("WARNING: GMAIL_USER or GMAIL_APP_PASSWORD not set in .env. Email won't be sent.")
        return

    subject = f"Your Payslip Attachment - {month_year}"
    
    body = f"""Dear {employee_name},

Please find attached your encrypted PDF payslip for {month_year}.

For security reasons, the PDF is password-protected. The password to open this file has been sent to you in a separate email.

Regards,
MCS Consulting HRMS
"""

    msg = MIMEMultipart()
    msg['From'] = GMAIL_USER
    msg['To'] = employee_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    if pdf_content:
        from email.mime.application import MIMEApplication
        part = MIMEApplication(pdf_content, Name=pdf_filename or "payslip.pdf")
        part['Content-Disposition'] = f'attachment; filename="{pdf_filename or "payslip.pdf"}"'
        msg.attach(part)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.send_message(msg)
        print(f"Successfully sent attachment email to {employee_email}")
    except Exception as e:
        print(f"Failed to send attachment email to {employee_email}: {str(e)}")

def send_password_reset_email(employee_email: str, reset_link: str):
    """
    Send the password reset link to the employee's email.
    """
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("WARNING: GMAIL_USER or GMAIL_APP_PASSWORD not set in .env. Email won't be sent.")
        print(f"Would have sent reset link to {employee_email}: {reset_link}")
        return

    subject = "Reset Your Password - MCS Consulting HRMS"
    
    body = f"""Hello,

We received a request to reset your password for your HRMS account.

You can reset your password by clicking the link below:
{reset_link}

This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.

Regards,
MCS Consulting HRMS
"""

    msg = MIMEMultipart()
    msg['From'] = GMAIL_USER
    msg['To'] = employee_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.send_message(msg)
        print(f"Successfully sent password reset email to {employee_email}")
    except Exception as e:
        print(f"Failed to send email to {employee_email}: {str(e)}")


def send_invoice_attachment_email(recipient_email: str, recipient_name: str, invoice_type: str, pdf_content: bytes, pdf_filename: str):
    """
    Send finalized proforma or final invoice attachment to a client.
    """
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("WARNING: GMAIL_USER or GMAIL_APP_PASSWORD not set in .env. Email won't be sent.")
        return

    subject = f"PT Mandiri Cipta Solusi - {invoice_type.title()} Invoice"
    
    body = f"""Dear {recipient_name},

Please find attached our official {invoice_type} invoice for your review and payment process.

If you have any questions or require further assistance, please feel free to reach out to us.

Regards,
PT Mandiri Cipta Solusi (MCS Consulting)
"""

    msg = MIMEMultipart()
    msg['From'] = GMAIL_USER
    msg['To'] = recipient_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    if pdf_content:
        from email.mime.application import MIMEApplication
        part = MIMEApplication(pdf_content, Name=pdf_filename)
        part['Content-Disposition'] = f'attachment; filename="{pdf_filename}"'
        msg.attach(part)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.send_message(msg)
        print(f"Successfully sent {invoice_type} invoice email to {recipient_email}")
    except Exception as e:
        print(f"Failed to send {invoice_type} invoice email to {recipient_email}: {str(e)}")

