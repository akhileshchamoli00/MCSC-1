from io import BytesIO
import calendar
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from pypdf import PdfReader, PdfWriter

def generate_payslip_pdf_buffer(payroll) -> BytesIO:
    """
    Generate the payslip PDF completely in memory and return the BytesIO buffer.
    """
    pdf_buffer = BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=A4)
    width, height = A4
    
    # Define color palette
    c_primary = colors.HexColor("#1e3a8a")     # Deep blue
    c_slate_dark = colors.HexColor("#0f172a")  # Slate 900
    c_slate_medium = colors.HexColor("#475569")# Slate 600
    c_slate_light = colors.HexColor("#94a3b8") # Slate 400
    c_border = colors.HexColor("#cbd5e1")      # Slate 300 (Clean light border)
    c_bg_light = colors.HexColor("#f8fafc")    # Slate 50 (Very light gray fill)
    c_bg_highlight = colors.HexColor("#f1f5f9")# Slate 100 (Slightly darker gray for summaries)
    
    # 1. Company Header
    logo_path = os.path.join(os.path.dirname(__file__), "..", "..", "public", "logo.png")
    if os.path.exists(logo_path):
        try:
            c.drawImage(ImageReader(logo_path), 40, height - 70, width=160, height=45, preserveAspectRatio=True, mask='auto')
        except Exception:
            c.setFont("Helvetica-Bold", 16)
            c.setFillColor(c_primary)
            c.drawString(40, height - 50, "MCS CONSULTING")
    else:
        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(c_primary)
        c.drawString(40, height - 50, "MCS CONSULTING")
        
    # 2. Document Title (Right side)
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(c_primary)
    c.drawRightString(width - 40, height - 45, "OFFICIAL PAYSLIP")
    
    c.setFillColor(c_slate_medium)
    c.setFont("Helvetica", 10)
    month_name = calendar.month_name[payroll.payroll_month]
    c.drawRightString(width - 40, height - 65, f"{month_name} {payroll.payroll_year}")
    
    # 3. Employee Info Box
    emp = payroll.employee
    emp_name = f"{emp.first_name} {emp.last_name}" if emp else "Unknown"
    emp_id = emp.employee_id_custom if emp and emp.employee_id_custom else f"EMP{emp.id:03d}" if emp else "UNKNOWN"
    dept = emp.department.name if emp and emp.department else "N/A"
    designation = getattr(emp, "job_title", emp.employment_type if emp else "N/A")
    bank = f"{emp.bank_name or 'N/A'} - {emp.bank_account_number or 'N/A'}" if emp else "N/A"
    joining_date = emp.hire_date.strftime("%d %b %Y") if emp and getattr(emp, 'hire_date', None) else "N/A"
    
    y_emp_start = height - 177
    
    # Border & Fill
    c.setStrokeColor(c_border)
    c.setLineWidth(0.75)
    c.setFillColor(c_bg_light)
    c.roundRect(40, y_emp_start, width - 80, 95, radius=6, stroke=1, fill=1)
    
    # Title
    c.setFillColor(c_primary)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(55, y_emp_start + 75, "EMPLOYEE DETAILS")
    
    # Metadata labels & values
    c.setFont("Helvetica", 9)
    # Left Column
    c.setFillColor(c_slate_medium)
    c.drawString(55, y_emp_start + 50, "Employee Name")
    c.setFillColor(c_slate_dark)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(150, y_emp_start + 50, f": {emp_name}")
    
    c.setFont("Helvetica", 9)
    c.setFillColor(c_slate_medium)
    c.drawString(55, y_emp_start + 30, "Employee ID")
    c.setFillColor(c_slate_dark)
    c.drawString(150, y_emp_start + 30, f": {emp_id}")
    
    c.setFillColor(c_slate_medium)
    c.drawString(55, y_emp_start + 10, "Department")
    c.setFillColor(c_slate_dark)
    c.drawString(150, y_emp_start + 10, f": {dept}")
    
    # Right Column
    c.setFillColor(c_slate_medium)
    c.drawString(320, y_emp_start + 50, "Designation")
    c.setFillColor(c_slate_dark)
    c.drawString(410, y_emp_start + 50, f": {designation}")
    
    c.setFillColor(c_slate_medium)
    c.drawString(320, y_emp_start + 30, "Bank Account")
    c.setFillColor(c_slate_dark)
    c.drawString(410, y_emp_start + 30, f": {bank}")
    
    c.setFillColor(c_slate_medium)
    c.drawString(320, y_emp_start + 10, "Joining Date")
    c.setFillColor(c_slate_dark)
    c.drawString(410, y_emp_start + 10, f": {joining_date}")
    
    # 4. Leave Data Box
    y_leave_start = y_emp_start - 94
    c.setStrokeColor(c_border)
    c.setFillColor(colors.HexColor("#f0fdf4")) # Very light green background
    c.roundRect(40, y_leave_start, width - 80, 82, radius=6, stroke=1, fill=1)
    
    c.setFillColor(colors.HexColor("#166534")) # Dark green for text
    c.setFont("Helvetica-Bold", 10)
    c.drawString(55, y_leave_start + 62, "LEAVE & ATTENDANCE DATA")
    
    # Row 1 (Annual, Sick, Unpaid)
    c.setFont("Helvetica", 9)
    c.setFillColor(c_slate_medium)
    c.drawString(55, y_leave_start + 42, "Annual Leave")
    c.setFillColor(c_slate_dark)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(140, y_leave_start + 42, f": {payroll.annual_leave_days or 0.0}")
    
    c.setFont("Helvetica", 9)
    c.setFillColor(c_slate_medium)
    c.drawString(220, y_leave_start + 42, "Sick Leave")
    c.setFillColor(c_slate_dark)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(305, y_leave_start + 42, f": {payroll.sick_leave_days or 0.0}")
    
    c.setFont("Helvetica", 9)
    c.setFillColor(c_slate_medium)
    c.drawString(385, y_leave_start + 42, "Unpaid Leave")
    c.setFillColor(colors.HexColor("#b45309")) # Amber/Orange for unpaid leave warning
    c.setFont("Helvetica-Bold", 9)
    c.drawString(480, y_leave_start + 42, f": {payroll.unpaid_leave_days or 0.0}")
    
    # Row 2 (Emergency Leave, Maternity Leave)
    c.setFont("Helvetica", 9)
    c.setFillColor(c_slate_medium)
    c.drawString(55, y_leave_start + 25, "Emergency Leave")
    c.setFillColor(c_slate_dark)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(140, y_leave_start + 25, f": {getattr(payroll, 'emergency_leave_days', 0.0) or 0.0}")
    
    c.setFont("Helvetica", 9)
    c.setFillColor(c_slate_medium)
    c.drawString(220, y_leave_start + 25, "Maternity Leave")
    c.setFillColor(c_slate_dark)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(305, y_leave_start + 25, f": {getattr(payroll, 'maternity_leave_days', 0.0) or 0.0}")

    # Row 3 (Working Days, Days Worked)
    c.setFont("Helvetica", 9)
    c.setFillColor(c_slate_medium)
    c.drawString(55, y_leave_start + 8, "Working Days")
    c.setFillColor(c_slate_dark)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(140, y_leave_start + 8, f": {payroll.total_working_days}")
    
    c.setFont("Helvetica", 9)
    c.setFillColor(c_slate_medium)
    c.drawString(220, y_leave_start + 8, "Days Worked")
    c.setFillColor(c_primary) # blue highlight for days worked
    c.setFont("Helvetica-Bold", 9)
    c.drawString(305, y_leave_start + 8, f": {payroll.days_worked or 0.0}")
    
    # 5. Earnings & Deductions Box
    y_salary_start = y_leave_start - 232
    c.setStrokeColor(c_border)
    c.setFillColor(colors.white)
    c.roundRect(40, y_salary_start, width - 80, 220, radius=6, stroke=1, fill=1)
    
    # Box Headers
    c.setFillColor(c_primary)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(55, y_salary_start + 200, "EARNINGS & ALLOWANCES")
    c.drawString(320, y_salary_start + 200, "DEDUCTIONS")
    
    # Subtle column line
    c.setStrokeColor(colors.HexColor("#e2e8f0"))
    c.line(width/2.0, y_salary_start, width/2.0, y_salary_start + 190)
    
    # Left Column (Earnings Items)
    c.setFont("Helvetica", 8.5)
    y_earn = y_salary_start + 175
    earnings_items = [
        ("Basic Salary", payroll.basic_salary),
        ("Meal Allowance", payroll.meal_allowance),
        ("Work Support Allowance", payroll.work_support_allowance),
        ("Attendance Allowance (Hardship)", payroll.attendance_allowance),
        ("New Year Allowance - THR", payroll.thr_allowance),
        ("Functional Allowance", payroll.functional_allowance),
        ("Bonus", payroll.bonus)
    ]
    
    for item_name, val in earnings_items:
        safe_val = val if val is not None else 0.0
        c.setFillColor(c_slate_medium)
        c.drawString(55, y_earn, item_name)
        c.setFillColor(c_slate_dark)
        c.drawRightString(width/2.0 - 20, y_earn, f"{int(round(safe_val)):,}")
        y_earn -= 15
        
    # Draw Gross Earnings block
    y_earn_summary = y_salary_start + 45
    c.setStrokeColor(c_slate_light)
    c.setLineWidth(0.5)
    c.line(55, y_earn_summary + 12, width/2.0 - 20, y_earn_summary + 12)
    c.setFillColor(c_slate_dark)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(55, y_earn_summary, "Gross Earnings")
    c.drawRightString(width/2.0 - 20, y_earn_summary, f"{int(round(payroll.gross_salary)):,}")
    c.line(55, y_earn_summary - 4, width/2.0 - 20, y_earn_summary - 4)
    
    # Right Column (Deductions Items)
    c.setFont("Helvetica", 8.5)
    y_ded = y_salary_start + 175
    deductions_items = [
        ("BPJS TK-JHT", payroll.bpjs_tk_jht),
        ("Jaminan Pensiun Karyawan", payroll.jaminan_pensiun_karyawan),
        ("BPJS Kes-Karyawan", payroll.bpjs_kes_karyawan),
        ("Unpaid Leave", payroll.leave_deduction),
        ("Other Deduction", payroll.other_deductions),
        ("WHT 21", payroll.wht_21)
    ]
    
    for item_name, val in deductions_items:
        safe_val = val if val is not None else 0.0
        c.setFillColor(c_slate_medium)
        c.drawString(320, y_ded, item_name)
        c.setFillColor(c_slate_dark)
        c.drawRightString(width - 55, y_ded, f"{int(round(safe_val)):,}")
        y_ded -= 15
        
    # Draw Total Deductions block
    y_ded_summary = y_salary_start + 45
    c.line(320, y_ded_summary + 12, width - 55, y_ded_summary + 12)
    c.setFillColor(c_slate_dark)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(320, y_ded_summary, "Total Deductions")
    c.drawRightString(width - 55, y_ded_summary, f"{int(round(payroll.total_deductions)):,}")
    c.line(320, y_ded_summary - 4, width - 55, y_ded_summary - 4)
    
    # Single line above Net Salary Highlight Box
    c.setStrokeColor(c_primary)
    c.setLineWidth(0.5)
    c.line(320, y_salary_start + 35, width - 55, y_salary_start + 35)

    # Net Salary Highlight Box (Makes Net Pay stand out clearly)
    c.setFillColor(c_bg_highlight)
    c.roundRect(320, y_salary_start + 10, width - 375, 24, radius=4, stroke=0, fill=1)
    c.setFillColor(c_primary)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(330, y_salary_start + 18, "Net Salary")
    c.drawRightString(width - 65, y_salary_start + 18, f"IDR {int(round(payroll.net_salary)):,}")
    
    # Double lines for accounting detail on Net Salary
    c.setStrokeColor(c_primary)
    c.line(320, y_salary_start + 9, width - 55, y_salary_start + 9)
    c.line(320, y_salary_start + 7, width - 55, y_salary_start + 7)
    
    # 6. Covered by Company Box
    y_company_start = y_salary_start - 177
    c.setStrokeColor(c_border)
    c.setFillColor(colors.white)
    c.roundRect(40, y_company_start, width - 80, 165, radius=6, stroke=1, fill=1)
    
    # Box Headers
    c.setFillColor(c_primary)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(55, y_company_start + 145, "Company Contributions")
    
    # Left Column (Company Covered)
    c.setFont("Helvetica", 8.5)
    y_company = y_company_start + 120
    company_items = [
        ("BPJS TK-JKK", payroll.bpjs_tk_jkk),
        ("BPJS TK-JKM", payroll.bpjs_tk_jkm),
        ("BPJS Kesehatan", payroll.bpjs_kesehatan),
        ("BPJS Kesehatan (Additional)", payroll.bpjs_kesehatan_tambahan),
        ("Additional Insurance", payroll.additional_insurance)
    ]
    
    for item_name, val in company_items:
        safe_val = val if val is not None else 0.0
        c.setFillColor(c_slate_medium)
        c.drawString(55, y_company, item_name)
        c.setFillColor(c_slate_dark)
        c.drawRightString(width/2.0 - 20, y_company, f"{int(round(safe_val)):,}")
        y_company -= 15
        
    # Draw Taxable Income block
    y_tax_summary = y_company_start + 35
    c.setStrokeColor(c_slate_light)
    c.line(55, y_tax_summary + 12, width/2.0 - 20, y_tax_summary + 12)
    c.setFillColor(c_slate_dark)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(55, y_tax_summary, "Taxable Income")
    taxable_val = payroll.taxable_income if payroll.taxable_income is not None else 0.0
    c.drawRightString(width/2.0 - 20, y_tax_summary, f"{int(round(taxable_val)):,}")
    c.line(55, y_tax_summary - 4, width/2.0 - 20, y_tax_summary - 4)
    
    # Right Column (Company Covered JP/JHT)
    c.setFont("Helvetica", 8.5)
    y_comp_right = y_company_start + 120
    company_right_items = [
        ("BPJS TK-JHT (Company)", payroll.bpjs_tk_jht_company),
        ("Jaminan Pensiun (JP)", payroll.jaminan_pensiun_jp),
        ("Additional Coverage", payroll.additional_coverage)
    ]
    
    for item_name, val in company_right_items:
        safe_val = val if val is not None else 0.0
        c.setFillColor(c_slate_medium)
        c.drawString(320, y_comp_right, item_name)
        c.setFillColor(c_slate_dark)
        c.drawRightString(width - 55, y_comp_right, f"{int(round(safe_val)):,}")
        y_comp_right -= 15
        
    # Single line above Total Compensation Highlight Box
    c.setStrokeColor(c_slate_dark)
    c.setLineWidth(0.5)
    c.line(320, y_company_start + 55, width - 55, y_company_start + 55)

    # Draw TOTAL COMPENSATION block Highlight
    c.setFillColor(c_bg_highlight)
    c.roundRect(320, y_company_start + 30, width - 375, 24, radius=4, stroke=0, fill=1)
    c.setFillColor(c_slate_dark)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(330, y_company_start + 38, "Total Company Cost")
    comp_val = payroll.total_compensation if payroll.total_compensation is not None else 0.0
    c.drawRightString(width - 65, y_company_start + 38, f"IDR {int(round(comp_val)):,}")
    
    # Double lines for accounting detail on Total Compensation
    c.setStrokeColor(c_slate_dark)
    c.line(320, y_company_start + 29, width - 55, y_company_start + 29)
    c.line(320, y_company_start + 27, width - 55, y_company_start + 27)
    
    # Footer
    c.setFillColor(c_slate_medium)
    c.setFont("Helvetica-Oblique", 8)
    c.drawCentredString(width / 2.0, 25, "This is a computer generated document. No signature is required.")
    
    # Draw Company Name under the disclaimer
    company_name = "MCS Consulting"
    if payroll.employee and payroll.employee.company_name:
        company_name = payroll.employee.company_name
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(width / 2.0, 14, company_name)
    
    c.save()
    pdf_buffer.seek(0)
    return pdf_buffer

def encrypt_pdf(pdf_buffer: BytesIO, user_password: str) -> BytesIO:
    """
    Encrypt the PDF with the given user_password and return the encrypted BytesIO buffer.
    """
    reader = PdfReader(pdf_buffer)
    writer = PdfWriter()
    
    for page in reader.pages:
        writer.add_page(page)
        
    writer.encrypt(user_password=user_password, owner_password=os.getenv("PDF_OWNER_PASSWORD", "MCS-ADMIN-999"), algorithm="AES-256")
    
    encrypted_buffer = BytesIO()
    writer.write(encrypted_buffer)
    encrypted_buffer.seek(0)
    return encrypted_buffer
