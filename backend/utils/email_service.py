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


def send_invoice_attachment_email(recipient_email: str, recipient_name: str, invoice_type: str, pdf_content: bytes, pdf_filename: str, payment_url: str = None):
    """
    Send finalized proforma or final invoice attachment to a client, with an optional payment checkout URL.
    """
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("WARNING: GMAIL_USER or GMAIL_APP_PASSWORD not set in .env. Email won't be sent.")
        return

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
    msg['From'] = GMAIL_USER
    msg['To'] = recipient_email
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
                msg_image.add_header('Content-Disposition', 'inline', filename="logo.png")
                msg.attach(msg_image)
        except Exception as img_err:
            print("Failed to attach logo inline:", img_err)

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
