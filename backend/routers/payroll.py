from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from typing import List
from io import BytesIO
import calendar
import datetime
from pydantic import BaseModel
import os

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors

import models, schemas, auth, database
from notification_manager import manager
from utils.password_service import generate_payslip_password, encrypt_password, decrypt_password
from utils.pdf_service import generate_payslip_pdf_buffer, encrypt_pdf
from utils.email_service import send_payslip_password_email, send_payslip_attachment_email
from fastapi import Request

router = APIRouter(
    prefix="/api/payroll",
    tags=["payroll"],
    dependencies=[Depends(auth.get_current_user)]
)

def calculate_payroll(payroll: models.Payroll):
    # Calculate meal and work support dynamically based on days_worked and employee's per-day defaults
    meal_rate = 40000.0
    work_support_rate = 30000.0
    if payroll.employee:
        if payroll.employee.meal_allowance_per_day is not None:
            meal_rate = payroll.employee.meal_allowance_per_day
        if payroll.employee.work_support_allowance_per_day is not None:
            work_support_rate = payroll.employee.work_support_allowance_per_day

    payroll.meal_allowance = float((payroll.days_worked or 0.0) * meal_rate)
    payroll.work_support_allowance = float((payroll.days_worked or 0.0) * work_support_rate)

    gross = (
        (payroll.basic_salary or 0.0) +
        (payroll.meal_allowance or 0.0) +
        (payroll.work_support_allowance or 0.0) +
        (payroll.attendance_allowance or 0.0) +
        (payroll.thr_allowance or 0.0) +
        (payroll.functional_allowance or 0.0) +
        (payroll.bonus or 0.0)
    )
    
    taxable_income = (
        gross +
        (payroll.bpjs_tk_jkk or 0.0) +
        (payroll.bpjs_tk_jkm or 0.0) +
        (payroll.bpjs_kesehatan or 0.0) +
        (payroll.bpjs_kesehatan_tambahan or 0.0) +
        (payroll.additional_insurance or 0.0)
    )
    
    # Auto-calculate tax percentage if tax_category is present on the employee
    if payroll.employee and payroll.employee.tax_category:
        from utils.tax_calculator import TAX_CATEGORY_TO_CODE, get_tax_percentage
        category_code = TAX_CATEGORY_TO_CODE.get(payroll.employee.tax_category)
        if category_code:
            calculated_rate = get_tax_percentage(category_code, taxable_income)
            payroll.tax_percentage = calculated_rate
            # Update the employee's default setting in the database
            payroll.employee.tax_percentage = calculated_rate

    wht_21 = taxable_income * ((payroll.tax_percentage or 0.0) / 100.0)
    
    deductions = (
        (payroll.bpjs_tk_jht or 0.0) +
        (payroll.jaminan_pensiun_karyawan or 0.0) +
        (payroll.bpjs_kes_karyawan or 0.0) +
        (payroll.leave_deduction or 0.0) +
        (payroll.other_deductions or 0.0) +
        wht_21
    )
    
    total_comp = (
        gross +
        (payroll.bpjs_tk_jkk or 0.0) +
        (payroll.bpjs_tk_jkm or 0.0) +
        (payroll.bpjs_kesehatan or 0.0) +
        (payroll.bpjs_kesehatan_tambahan or 0.0) +
        (payroll.additional_insurance or 0.0) +
        (payroll.bpjs_tk_jht_company or 0.0) +
        (payroll.jaminan_pensiun_jp or 0.0) +
        (payroll.additional_coverage or 0.0)
    )
    
    payroll.gross_salary = float(round(gross))
    payroll.taxable_income = float(round(taxable_income))
    payroll.wht_21 = float(round(wht_21))
    
    # Recalculate deductions using rounded wht_21 to ensure consistency
    deductions = (
        (payroll.bpjs_tk_jht or 0.0) +
        (payroll.jaminan_pensiun_karyawan or 0.0) +
        (payroll.bpjs_kes_karyawan or 0.0) +
        (payroll.leave_deduction or 0.0) +
        (payroll.other_deductions or 0.0) +
        payroll.wht_21
    )
    
    payroll.total_deductions = float(round(deductions))
    payroll.total_compensation = float(round(total_comp))
    payroll.net_salary = float(round(payroll.gross_salary - payroll.total_deductions))

@router.get("/me", response_model=List[schemas.PayrollResponse])
def get_my_payrolls(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        return []
    return db.query(models.Payroll).filter(
        models.Payroll.employee_id == current_user.employee.id,
        models.Payroll.status == "Paid"
    ).order_by(models.Payroll.payroll_year.desc(), models.Payroll.payroll_month.desc()).offset(skip).limit(limit).all()

@router.get("", response_model=List[schemas.PayrollResponse])
def get_payrolls(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    is_admin = auth.has_permission(current_user, "payroll_management", "view", db)
    if is_admin:
        return db.query(models.Payroll).join(models.Employee).order_by(models.Employee.first_name, models.Employee.last_name).offset(skip).limit(limit).all()
    else:
        if not current_user.employee:
            return []
        return db.query(models.Payroll).filter(
            models.Payroll.employee_id == current_user.employee.id,
            models.Payroll.status == "Paid"
        ).order_by(models.Payroll.payroll_year.desc(), models.Payroll.payroll_month.desc()).offset(skip).limit(limit).all()


class GeneratePayrollRequest(BaseModel):
    month: int
    year: int
    overwrite: bool = False

def is_payslip_generation_restricted(payroll_month: int, payroll_year: int) -> bool:
    import datetime
    today = datetime.date.today()
    if payroll_year > today.year:
        return True
    if payroll_year == today.year:
        if payroll_month > today.month:
            return True
        if payroll_month == today.month and today.day < 27:
            return True
    return False

@router.post("/generate")
def generate_monthly_payroll(req: GeneratePayrollRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not auth.has_permission(current_user, "payroll_management", "create", db):
        raise HTTPException(status_code=403, detail="Access denied. Required permission 'payroll_management:create' not granted.")
        
    if is_payslip_generation_restricted(req.month, req.year):
        raise HTTPException(
            status_code=400,
            detail="Payroll generation for the current month is restricted until the 27th of the month."
        )

    if req.overwrite:
        db.query(models.Payroll).filter(
            models.Payroll.payroll_month == req.month,
            models.Payroll.payroll_year == req.year
        ).delete()
        db.commit()
        
    active_employees = db.query(models.Employee).filter(models.Employee.status == models.EmploymentStatus.ACTIVE).all()
    
    from routers.leave import is_public_holiday
    import datetime
    
    if req.month == 1:
        prev_month = 12
        prev_year = req.year - 1
    else:
        prev_month = req.month - 1
        prev_year = req.year

    start_date = datetime.date(prev_year, prev_month, 27)
    end_date = datetime.date(req.year, req.month, 26)
    num_days = (end_date - start_date).days + 1
    total_weekends = 0
    total_public_holidays = 0
    
    curr_dt = start_date
    while curr_dt <= end_date:
        if curr_dt.weekday() >= 5:
            total_weekends += 1
        else:
            if is_public_holiday(db, curr_dt):
                total_public_holidays += 1
        curr_dt += datetime.timedelta(days=1)
                
    total_working_days = num_days - total_weekends - total_public_holidays
    
    generated_count = 0
    payrolls_to_notify = []
    
    for emp in active_employees:
        if emp.base_salary is None:
            continue
            
        existing = db.query(models.Payroll).filter(
            models.Payroll.employee_id == emp.id,
            models.Payroll.payroll_month == req.month,
            models.Payroll.payroll_year == req.year
        ).first()
        
        if existing:
            continue
            # --- calculate leaves overlapping this period ---
        
        requests = db.query(models.LeaveRequest).filter(
            models.LeaveRequest.employee_id == emp.id,
            models.LeaveRequest.status == "APPROVED",
            models.LeaveRequest.start_date <= end_date,
            models.LeaveRequest.end_date >= start_date
        ).all()
        
        annual_days = 0.0
        sick_days = 0.0
        unpaid_days = 0.0
        emergency_days = 0.0
        maternity_days = 0.0
        
        for leave_req in requests:
            # If the request is entirely within the period, use days_requested directly
            if leave_req.start_date >= start_date and leave_req.end_date <= end_date:
                days_in_month = leave_req.days_requested
            else:
                # Spans across months: count working days within this period
                days_in_month = 0.0
                curr = max(start_date, leave_req.start_date)
                limit_date = min(end_date, leave_req.end_date)
                while curr <= limit_date:
                    if curr.weekday() < 5 and not is_public_holiday(db, curr):
                        days_in_month += 1.0
                    curr += datetime.timedelta(days=1)
                days_in_month = min(days_in_month, leave_req.days_requested)
                
            if leave_req.leave_type == "Annual Leave":
                annual_days += days_in_month
            elif leave_req.leave_type == "Sick Leave":
                sick_days += days_in_month
            elif leave_req.leave_type == "Unpaid Leave":
                unpaid_days += days_in_month
            elif leave_req.leave_type == "Emergency Leave":
                emergency_days += days_in_month
            elif leave_req.leave_type == "Maternity Leave":
                maternity_days += days_in_month
                
        # --- update days worked ---
        days_worked = max(0.0, float(total_working_days) - (annual_days + sick_days + unpaid_days + emergency_days + maternity_days))
        payable_working_days = max(0.0, float(total_working_days) - unpaid_days)
        
        # Calculate leave deduction for unpaid leaves
        calculated_leave_deduction = 0.0
        if total_working_days > 0 and unpaid_days > 0:
            calculated_leave_deduction = (emp.base_salary / total_working_days) * unpaid_days
            
        payroll = models.Payroll(
            employee_id=emp.id,
            employee=emp,
            payroll_month=req.month,
            payroll_year=req.year,
            total_calendar_days=num_days,
            total_weekends=total_weekends,
            total_public_holidays=total_public_holidays,
            total_working_days=total_working_days,
            annual_leave_days=annual_days,
            sick_leave_days=sick_days,
            unpaid_leave_days=unpaid_days,
            emergency_leave_days=emergency_days,
            maternity_leave_days=maternity_days,
            days_worked=days_worked,
            payable_working_days=payable_working_days,
            basic_salary=emp.base_salary or 0.0,
            tax_percentage=emp.tax_percentage or 0.0,
            work_support_allowance=0.0,
            attendance_allowance=0.0 if (emergency_days > 0 or maternity_days > 0 or sick_days > 0 or unpaid_days > 0) else (emp.attendance_allowance or 0.0),
            thr_allowance=emp.thr_allowance or 0.0,
            functional_allowance=emp.functional_allowance or 0.0,
            bonus=emp.bonus or 0.0,
            bpjs_tk_jht=emp.bpjs_tk_jht or 0.0,
            jaminan_pensiun_karyawan=emp.jaminan_pensiun_karyawan or 0.0,
            bpjs_kes_karyawan=emp.bpjs_kes_karyawan or 0.0,
            leave_deduction=calculated_leave_deduction,
            other_deductions=emp.other_deductions or 0.0,
            bpjs_tk_jkk=emp.bpjs_tk_jkk or 0.0,
            bpjs_tk_jkm=emp.bpjs_tk_jkm or 0.0,
            bpjs_kesehatan=emp.bpjs_kesehatan or 0.0,
            bpjs_kesehatan_tambahan=emp.bpjs_kesehatan_tambahan or 0.0,
            additional_insurance=emp.additional_insurance or 0.0,
            bpjs_tk_jht_company=emp.bpjs_tk_jht_company or 0.0,
            jaminan_pensiun_jp=emp.jaminan_pensiun_jp or 0.0,
            additional_coverage=emp.additional_coverage or 0.0,
            status="Draft",
            meal_allowance=0.0,
        )
        calculate_payroll(payroll)
        db.add(payroll)
        
        generated_count += 1
        
    db.commit()
        
    return {"message": f"Successfully created {generated_count} draft payroll records."}

@router.post("/{id}/generate-payslip")
def generate_single_payslip(id: int, request: Request, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Admin access required")
        
    payroll = db.query(models.Payroll).filter(models.Payroll.id == id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
        
    if payroll.status != "Draft":
        raise HTTPException(status_code=400, detail="Payslip already generated")

    if is_payslip_generation_restricted(payroll.payroll_month, payroll.payroll_year):
        raise HTTPException(
            status_code=400,
            detail="Payslip generation for the current month is restricted until the 27th of the month."
        )

    # Use custom payslip password if set on employee profile, otherwise generate random
    if payroll.employee and payroll.employee.payslip_password:
        plain_password = payroll.employee.payslip_password
    else:
        plain_password = generate_payslip_password()
    encrypted_pwd = encrypt_password(plain_password)
    
    payroll.encrypted_pdf_password = encrypted_pwd
    payroll.status = "Paid"
    payroll.generated_at = datetime.datetime.utcnow()
    payroll.generated_by = current_user.id
    
    # Audit log
    audit_log = models.PayrollAuditLog(
        payroll_id=payroll.id,
        action="Paid",
        ip_address=request.client.host if request.client else "Unknown",
        user_agent=request.headers.get("user-agent", "Unknown"),
        details="Admin generated payslip"
    )
    db.add(audit_log)
    db.commit()
    
    # Send Email
    if payroll.employee and payroll.employee.user:
        month_name = calendar.month_name[payroll.payroll_month]
        
        # Generate encrypted PDF for attachment
        pdf_buf = generate_payslip_pdf_buffer(payroll)
        encrypted_pdf_buf = encrypt_pdf(pdf_buf, plain_password)
        pdf_bytes = encrypted_pdf_buf.getvalue()
        pdf_filename = f"payslip_{payroll.payroll_month}_{payroll.payroll_year}.pdf"
        
        # Send separate password and attachment emails
        send_payslip_password_email(
            employee_email=payroll.employee.user.email,
            employee_name=f"{payroll.employee.first_name} {payroll.employee.last_name}",
            month_year=f"{month_name} {payroll.payroll_year}",
            password=plain_password
        )
        send_payslip_attachment_email(
            employee_email=payroll.employee.user.email,
            employee_name=f"{payroll.employee.first_name} {payroll.employee.last_name}",
            month_year=f"{month_name} {payroll.payroll_year}",
            pdf_content=pdf_bytes,
            pdf_filename=pdf_filename
        )
        payroll.password_sent_at = datetime.datetime.utcnow()
        db.commit()
        
        # Also notify via web UI
        manager.notify_user_sync(
            db=db,
            user_id=payroll.employee.user_id,
            title="Payslip Generated",
            message=f"Your payslip for {month_name} {payroll.payroll_year} is now available.",
            type="payroll_generated",
            module="Payroll",
            reference_id=payroll.id,
            action_url="/my-payroll"
        )
        
    return {"message": "Payslip generated and password sent."}

class GenerateAllPayslipsRequest(BaseModel):
    month: int
    year: int

@router.post("/generate-all-payslips")
def generate_all_payslips(req: GenerateAllPayslipsRequest, request: Request, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Admin access required")
        
    if is_payslip_generation_restricted(req.month, req.year):
        raise HTTPException(
            status_code=400,
            detail="Payslip generation for the current month is restricted until the 27th of the month."
        )
        
    drafts = db.query(models.Payroll).filter(
        models.Payroll.status.in_(["Draft", "Generated"]),
        models.Payroll.payroll_month == req.month,
        models.Payroll.payroll_year == req.year
    ).all()
    
    if not drafts:
        return {"message": "No draft or generated payslips found for this month."}
        
    generated_count = 0
    
    for payroll in drafts:
        if payroll.employee and payroll.employee.payslip_password:
            plain_password = payroll.employee.payslip_password
        else:
            plain_password = generate_payslip_password()
        encrypted_pwd = encrypt_password(plain_password)
        
        payroll.encrypted_pdf_password = encrypted_pwd
        payroll.status = "Paid"
        payroll.generated_at = datetime.datetime.utcnow()
        payroll.generated_by = current_user.id
        
        audit_log = models.PayrollAuditLog(
            payroll_id=payroll.id,
            action="Paid",
            ip_address=request.client.host if request.client else "Unknown",
            user_agent=request.headers.get("user-agent", "Unknown"),
            details="Admin generated payslip via bulk action"
        )
        db.add(audit_log)
        
        if payroll.employee and payroll.employee.user:
            month_name = calendar.month_name[payroll.payroll_month]
            
            # Generate encrypted PDF for attachment
            pdf_buf = generate_payslip_pdf_buffer(payroll)
            encrypted_pdf_buf = encrypt_pdf(pdf_buf, plain_password)
            pdf_bytes = encrypted_pdf_buf.getvalue()
            pdf_filename = f"payslip_{payroll.payroll_month}_{payroll.payroll_year}.pdf"
            
            # Send separate password and attachment emails
            send_payslip_password_email(
                employee_email=payroll.employee.user.email,
                employee_name=f"{payroll.employee.first_name} {payroll.employee.last_name}",
                month_year=f"{month_name} {payroll.payroll_year}",
                password=plain_password
            )
            send_payslip_attachment_email(
                employee_email=payroll.employee.user.email,
                employee_name=f"{payroll.employee.first_name} {payroll.employee.last_name}",
                month_year=f"{month_name} {payroll.payroll_year}",
                pdf_content=pdf_bytes,
                pdf_filename=pdf_filename
            )
            payroll.password_sent_at = datetime.datetime.utcnow()
            
            manager.notify_user_sync(
                db=db,
                user_id=payroll.employee.user_id,
                title="Payslip Generated",
                message=f"Your payslip for {month_name} {payroll.payroll_year} is now available.",
                type="payroll_generated",
                module="Payroll",
                reference_id=payroll.id,
                action_url="/my-payroll"
            )
            
        generated_count += 1
        
    db.commit()
    return {"message": f"Successfully locked and sent {generated_count} payslips."}

@router.get("/{id}", response_model=schemas.PayrollResponse)
def get_payroll(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    payroll = db.query(models.Payroll).filter(models.Payroll.id == id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
        
    is_admin = current_user.role and "ADMIN" in current_user.role.name.upper()
    if not is_admin:
        if not current_user.employee or payroll.employee_id != current_user.employee.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if payroll.status != "Paid":
            raise HTTPException(status_code=403, detail="Not authorized")
        
    return payroll

@router.put("/{id}", response_model=schemas.PayrollResponse)
def update_payroll(id: int, payroll_update: schemas.PayrollUpdate, request: Request, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Admin access required")
        
    payroll = db.query(models.Payroll).filter(models.Payroll.id == id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
        
    old_status = payroll.status
    update_data = payroll_update.model_dump(exclude_unset=True) if hasattr(payroll_update, "model_dump") else payroll_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(payroll, key, value)
        
    calculate_payroll(payroll)
    
    new_status = update_data.get("status")
    if old_status != "Paid" and new_status == "Paid":
        if is_payslip_generation_restricted(payroll.payroll_month, payroll.payroll_year):
            raise HTTPException(
                status_code=400,
                detail="Payslip generation for the current month is restricted until the 27th of the month."
            )
        # Use custom payslip password if set on employee profile, otherwise generate random
        if payroll.employee and payroll.employee.payslip_password:
            plain_password = payroll.employee.payslip_password
        else:
            plain_password = generate_payslip_password()
        encrypted_pwd = encrypt_password(plain_password)
        
        payroll.encrypted_pdf_password = encrypted_pwd
        payroll.generated_at = datetime.datetime.utcnow()
        payroll.generated_by = current_user.id
        
        # Audit log
        audit_log = models.PayrollAuditLog(
            payroll_id=payroll.id,
            action="Paid",
            ip_address=request.client.host if request.client else "Unknown",
            user_agent=request.headers.get("user-agent", "Unknown"),
            details="Admin marked payroll as Paid via details update"
        )
        db.add(audit_log)
        
        # Send Email
        if payroll.employee and payroll.employee.user:
            month_name = calendar.month_name[payroll.payroll_month]
            
            # Generate encrypted PDF for attachment
            pdf_buf = generate_payslip_pdf_buffer(payroll)
            encrypted_pdf_buf = encrypt_pdf(pdf_buf, plain_password)
            pdf_bytes = encrypted_pdf_buf.getvalue()
            pdf_filename = f"payslip_{payroll.payroll_month}_{payroll.payroll_year}.pdf"
            
            # Send separate password and attachment emails
            send_payslip_password_email(
                employee_email=payroll.employee.user.email,
                employee_name=f"{payroll.employee.first_name} {payroll.employee.last_name}",
                month_year=f"{month_name} {payroll.payroll_year}",
                password=plain_password
            )
            send_payslip_attachment_email(
                employee_email=payroll.employee.user.email,
                employee_name=f"{payroll.employee.first_name} {payroll.employee.last_name}",
                month_year=f"{month_name} {payroll.payroll_year}",
                pdf_content=pdf_bytes,
                pdf_filename=pdf_filename
            )
            payroll.password_sent_at = datetime.datetime.utcnow()
            
            # Also notify via web UI
            manager.notify_user_sync(
                db=db,
                user_id=payroll.employee.user_id,
                title="Payslip Generated",
                message=f"Your payslip for {month_name} {payroll.payroll_year} is now available.",
                type="payroll_generated",
                module="Payroll",
                reference_id=payroll.id,
                action_url="/my-payroll"
            )
            
    db.commit()
    db.refresh(payroll)
    return payroll

@router.get("/{id}/download")
def download_payslip(id: int, request: Request, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    payroll = db.query(models.Payroll).filter(models.Payroll.id == id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
        
    is_admin = current_user.role and "ADMIN" in current_user.role.name.upper()
    if not is_admin:
        if not current_user.employee or payroll.employee_id != current_user.employee.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        if payroll.status != "Paid":
            raise HTTPException(status_code=400, detail="Cannot download this payslip")

    # Generate PDF on the fly
    pdf_buffer = generate_payslip_pdf_buffer(payroll)
        
    is_own_payslip = current_user.employee and payroll.employee_id == current_user.employee.id

    if is_admin and not is_own_payslip:
        final_pdf_buffer = pdf_buffer
    else:
        # Enforce PDF encryption with a password
        if not payroll.encrypted_pdf_password:
            if payroll.employee and payroll.employee.payslip_password:
                plain_password = payroll.employee.payslip_password
            else:
                plain_password = generate_payslip_password()
            payroll.encrypted_pdf_password = encrypt_password(plain_password)
            db.commit()
            
        plain_password = decrypt_password(payroll.encrypted_pdf_password)
        final_pdf_buffer = encrypt_pdf(pdf_buffer, plain_password)
    
    # Update audits
    payroll.download_count = (payroll.download_count or 0) + 1
    payroll.last_downloaded_at = datetime.datetime.utcnow()
    
    audit_log = models.PayrollAuditLog(
        payroll_id=payroll.id,
        action="Downloaded",
        ip_address=request.client.host if request.client else "Unknown",
        user_agent=request.headers.get("user-agent", "Unknown"),
        details="Admin viewed unencrypted payslip" if is_admin else "User downloaded payslip"
    )
    db.add(audit_log)
    db.commit()
    
    return Response(
        content=final_pdf_buffer.getvalue(), 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=payslip_{payroll.payroll_month}_{payroll.payroll_year}.pdf"}
    )

@router.post("/{id}/resend-password")
def resend_payslip_password(id: int, request: Request, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    payroll = db.query(models.Payroll).filter(models.Payroll.id == id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
        
    is_admin = current_user.role and "ADMIN" in current_user.role.name.upper()
    if not is_admin and (not current_user.employee or payroll.employee_id != current_user.employee.id):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if payroll.status != "Paid":
        raise HTTPException(status_code=400, detail="Payslip is not in Paid status")
        
    # Generate NEW random password
    new_plain_password = generate_payslip_password()
    new_encrypted_pwd = encrypt_password(new_plain_password)
    
    payroll.encrypted_pdf_password = new_encrypted_pwd
    
    # Audit log
    audit_log = models.PayrollAuditLog(
        payroll_id=payroll.id,
        action="Password Resent",
        ip_address=request.client.host if request.client else "Unknown",
        user_agent=request.headers.get("user-agent", "Unknown"),
        details="User requested new password"
    )
    db.add(audit_log)
    db.commit()
    
    # Send Email
    if payroll.employee and payroll.employee.user:
        month_name = calendar.month_name[payroll.payroll_month]
        
        # Generate encrypted PDF for attachment
        pdf_buf = generate_payslip_pdf_buffer(payroll)
        encrypted_pdf_buf = encrypt_pdf(pdf_buf, new_plain_password)
        pdf_bytes = encrypted_pdf_buf.getvalue()
        pdf_filename = f"payslip_{payroll.payroll_month}_{payroll.payroll_year}.pdf"
        
        # Send separate password and attachment emails
        send_payslip_password_email(
            employee_email=payroll.employee.user.email,
            employee_name=f"{payroll.employee.first_name} {payroll.employee.last_name}",
            month_year=f"{month_name} {payroll.payroll_year}",
            password=new_plain_password
        )
        send_payslip_attachment_email(
            employee_email=payroll.employee.user.email,
            employee_name=f"{payroll.employee.first_name} {payroll.employee.last_name}",
            month_year=f"{month_name} {payroll.payroll_year}",
            pdf_content=pdf_bytes,
            pdf_filename=pdf_filename
        )
        payroll.password_sent_at = datetime.datetime.utcnow()
        db.commit()
        
    return {"message": "New password generated and sent to email."}

@router.post("/{id}/regenerate")
def regenerate_single_payroll(id: int, request: Request, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Admin access required")
        
    payroll = db.query(models.Payroll).filter(models.Payroll.id == id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")
        
    if payroll.status == "Paid":
        payroll.status = "Generated"
        
    # Recalculate leaves
    from routers.leave import is_public_holiday
    import datetime
    import calendar
    
    emp = payroll.employee
    req_month = payroll.payroll_month
    req_year = payroll.payroll_year
    
    if req_month == 1:
        prev_month = 12
        prev_year = req_year - 1
    else:
        prev_month = req_month - 1
        prev_year = req_year

    start_date = datetime.date(prev_year, prev_month, 27)
    end_date = datetime.date(req_year, req_month, 26)
    num_days = (end_date - start_date).days + 1
    total_weekends = 0
    total_public_holidays = 0
    
    curr_dt = start_date
    while curr_dt <= end_date:
        if curr_dt.weekday() >= 5:
            total_weekends += 1
        else:
            if is_public_holiday(db, curr_dt):
                total_public_holidays += 1
        curr_dt += datetime.timedelta(days=1)
                
    total_working_days = num_days - total_weekends - total_public_holidays
    
    requests = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.employee_id == emp.id,
        models.LeaveRequest.status == "APPROVED",
        models.LeaveRequest.start_date <= end_date,
        models.LeaveRequest.end_date >= start_date
    ).all()
    
    annual_days = 0.0
    sick_days = 0.0
    unpaid_days = 0.0
    emergency_days = 0.0
    maternity_days = 0.0
    
    for leave_req in requests:
        # If the request is entirely within the period, use days_requested directly
        if leave_req.start_date >= start_date and leave_req.end_date <= end_date:
            days_in_month = leave_req.days_requested
        else:
            # Spans across months: count working days within this period
            days_in_month = 0.0
            curr = max(start_date, leave_req.start_date)
            limit_date = min(end_date, leave_req.end_date)
            while curr <= limit_date:
                if curr.weekday() < 5 and not is_public_holiday(db, curr):
                    days_in_month += 1.0
                curr += datetime.timedelta(days=1)
            days_in_month = min(days_in_month, leave_req.days_requested)
            
        if leave_req.leave_type == "Annual Leave":
            annual_days += days_in_month
        elif leave_req.leave_type == "Sick Leave":
            sick_days += days_in_month
        elif leave_req.leave_type == "Unpaid Leave":
            unpaid_days += days_in_month
        elif leave_req.leave_type == "Emergency Leave":
            emergency_days += days_in_month
        elif leave_req.leave_type == "Maternity Leave":
            maternity_days += days_in_month
            
    days_worked = max(0.0, float(total_working_days) - (annual_days + sick_days + unpaid_days + emergency_days + maternity_days))
    payable_working_days = max(0.0, float(total_working_days) - unpaid_days)
    
    calculated_leave_deduction = 0.0
    if total_working_days > 0 and unpaid_days > 0:
        calculated_leave_deduction = (emp.base_salary / total_working_days) * unpaid_days
        
    payroll.total_calendar_days = num_days
    payroll.total_weekends = total_weekends
    payroll.total_public_holidays = total_public_holidays
    payroll.total_working_days = total_working_days
    payroll.annual_leave_days = annual_days
    payroll.sick_leave_days = sick_days
    payroll.unpaid_leave_days = unpaid_days
    payroll.emergency_leave_days = emergency_days
    payroll.maternity_leave_days = maternity_days
    payroll.days_worked = days_worked
    payroll.payable_working_days = payable_working_days
    payroll.leave_deduction = calculated_leave_deduction
    
    # Pull latest financial settings from employee profile
    payroll.basic_salary = emp.base_salary or 0.0
    payroll.tax_percentage = emp.tax_percentage or 0.0
    payroll.attendance_allowance = 0.0 if (emergency_days > 0 or maternity_days > 0 or sick_days > 0 or unpaid_days > 0) else (emp.attendance_allowance or 0.0)
    payroll.thr_allowance = emp.thr_allowance or 0.0
    payroll.functional_allowance = emp.functional_allowance or 0.0
    payroll.bonus = emp.bonus or 0.0
    payroll.bpjs_tk_jht = emp.bpjs_tk_jht or 0.0
    payroll.jaminan_pensiun_karyawan = emp.jaminan_pensiun_karyawan or 0.0
    payroll.bpjs_kes_karyawan = emp.bpjs_kes_karyawan or 0.0
    payroll.other_deductions = emp.other_deductions or 0.0
    payroll.bpjs_tk_jkk = emp.bpjs_tk_jkk or 0.0
    payroll.bpjs_tk_jkm = emp.bpjs_tk_jkm or 0.0
    payroll.bpjs_kesehatan = emp.bpjs_kesehatan or 0.0
    payroll.bpjs_kesehatan_tambahan = emp.bpjs_kesehatan_tambahan or 0.0
    payroll.additional_insurance = emp.additional_insurance or 0.0
    payroll.bpjs_tk_jht_company = emp.bpjs_tk_jht_company or 0.0
    payroll.jaminan_pensiun_jp = emp.jaminan_pensiun_jp or 0.0
    payroll.additional_coverage = emp.additional_coverage or 0.0
    
    calculate_payroll(payroll)
    
    # Audit log
    audit_log = models.PayrollAuditLog(
        payroll_id=payroll.id,
        action="Regenerate",
        ip_address=request.client.host if request.client else "Unknown",
        user_agent=request.headers.get("user-agent", "Unknown"),
        details="Admin recalculated leave requests and basic deductions"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Payroll recalculated successfully"}
