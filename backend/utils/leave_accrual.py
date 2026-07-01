import calendar
from datetime import date
from sqlalchemy.orm import Session
import models

def run_daily_accruals_if_needed(db: Session, today: date = None):
    if today is None:
        today = date.today()
        
    today_str = today.isoformat()
    
    # 1. Quick look up of the system setting for last check date
    last_check_setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == "last_accrual_check_date").first()
    if last_check_setting and last_check_setting.value == today_str:
        # Already run today, skip
        return

    # 2. Run accruals catch-up sweep
    run_monthly_accruals_sweep(db, today)
    
    # 3. Update or create the system setting
    if not last_check_setting:
        last_check_setting = models.SystemSetting(key="last_accrual_check_date", value=today_str)
        db.add(last_check_setting)
    else:
        last_check_setting.value = today_str
    db.commit()

def run_monthly_accruals_sweep(db: Session, today: date):
    # Start the hire-date based monthly accrual from July 2026
    start_year = 2026
    start_month = 7
    
    if (today.year, today.month) < (start_year, start_month):
        return

    print(f"Running daily hire-date leave accruals check for date: {today}")
    
    # Fetch all active employees
    active_employees = db.query(models.Employee).filter(models.Employee.status == models.EmploymentStatus.ACTIVE).all()
    accrual_count = 0
    
    for emp in active_employees:
        # Determine the hire day. Default to 1st if no hire_date is set.
        hire_date = emp.hire_date
        hire_day = hire_date.day if hire_date else 1
        
        # Start checking from the maximum of July 2026 and the employee's hire month/year
        if hire_date and (hire_date.year, hire_date.month) > (start_year, start_month):
            emp_start_year = hire_date.year
            emp_start_month = hire_date.month
        else:
            emp_start_year = start_year
            emp_start_month = start_month
            
        current_year = emp_start_year
        current_month = emp_start_month
        
        # Iterate from the start month up to the current month
        while (current_year, current_month) <= (today.year, today.month):
            last_day_of_month = calendar.monthrange(current_year, current_month)[1]
            anniversary_day = min(hire_day, last_day_of_month)
            anniversary_date = date(current_year, current_month, anniversary_day)
            
            # If today is on or after the anniversary date, they are eligible for this month's accrual
            if today >= anniversary_date:
                month_name = calendar.month_name[current_month]
                accrual_reason = f"Monthly Accrual (Auto - {month_name} {current_year})"
                
                # Check if this employee already has an audit log for this specific month's accrual
                already_accrued = db.query(models.LeaveBalanceAudit).filter(
                    models.LeaveBalanceAudit.employee_id == emp.id,
                    models.LeaveBalanceAudit.reason == accrual_reason
                ).first()
                
                if not already_accrued:
                    # Fetch or create LeaveBalance
                    balance = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == emp.id).first()
                    if not balance:
                        balance = models.LeaveBalance(
                            employee_id=emp.id,
                            annual_leave_balance=14.0,
                            sick_leave_balance=0.0,
                            annual_leave_taken=0.0,
                            sick_leave_taken=0.0
                        )
                        db.add(balance)
                        db.flush()
                    
                    old_annual = balance.annual_leave_balance
                    balance.annual_leave_balance = (balance.annual_leave_balance or 0.0) + 1.0
                    
                    # Create LeaveBalanceAudit entry
                    audit = models.LeaveBalanceAudit(
                        employee_id=emp.id,
                        old_annual_balance=old_annual,
                        new_annual_balance=balance.annual_leave_balance,
                        old_sick_balance=balance.sick_leave_balance,
                        new_sick_balance=balance.sick_leave_balance,
                        old_annual_taken=balance.annual_leave_taken,
                        new_annual_taken=balance.annual_leave_taken,
                        old_sick_taken=balance.sick_leave_taken,
                        new_sick_taken=balance.sick_leave_taken,
                        reason=accrual_reason,
                        updated_by=None  # System automated action
                    )
                    db.add(audit)
                    db.commit()
                    
                    print(f"Accrued 1.0 day of annual leave for {emp.first_name} {emp.last_name} for {month_name} {current_year} (Anniversary: {anniversary_date})")
                    accrual_count += 1
            
            # Advance to the next month
            if current_month == 12:
                current_month = 1
                current_year += 1
            else:
                current_month += 1
                
    if accrual_count > 0:
        print(f"Completed hire-date based leave accruals for {accrual_count} record(s).")
