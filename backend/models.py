from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date, Enum, Float, JSON, Table
import enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    role = relationship("Role")
    employee = relationship("Employee", back_populates="user", uselist=False)
    client = relationship("Client", back_populates="user", uselist=False)

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    
    employees = relationship("Employee", back_populates="department")

class EmploymentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ON_LEAVE = "ON_LEAVE"
    TERMINATED = "TERMINATED"

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id_custom = Column(String, unique=True, index=True, nullable=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    gender = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    nationality = Column(String, nullable=True)
    marital_status = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)
    company_name = Column(String, nullable=True, default="MCS Consulting")
    job_title = Column(String, nullable=True)
    base_salary = Column(Float, default=0.0)
    tax_percentage = Column(Float, default=0.0)
    tax_category = Column(String, nullable=True)
    meal_allowance_per_day = Column(Float, default=40000.0)
    work_support_allowance_per_day = Column(Float, default=30000.0)
    attendance_allowance = Column(Float, default=0.0)
    thr_allowance = Column(Float, default=0.0)
    functional_allowance = Column(Float, default=0.0)
    bpjs_tk_jht = Column(Float, default=0.0)
    jaminan_pensiun_karyawan = Column(Float, default=0.0)
    bpjs_kes_karyawan = Column(Float, default=0.0)
    bpjs_tk_jkk = Column(Float, default=0.0)
    bpjs_tk_jkm = Column(Float, default=0.0)
    bpjs_kesehatan = Column(Float, default=0.0)
    bpjs_kesehatan_tambahan = Column(Float, default=0.0)
    additional_insurance = Column(Float, default=0.0)
    bpjs_tk_jht_company = Column(Float, default=0.0)
    jaminan_pensiun_jp = Column(Float, default=0.0)
    additional_coverage = Column(Float, default=0.0)
    
    bonus = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    
    bank_name = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)
    hire_date = Column(Date)
    status = Column(Enum(EmploymentStatus), default=EmploymentStatus.ACTIVE)
    profile_photo = Column(String, nullable=True)
    payslip_password = Column(String, nullable=True)
    has_calendar_access = Column(Boolean, default=False)
    
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    user = relationship("User", back_populates="employee")
    department = relationship("Department", back_populates="employees")
    manager = relationship("Employee", remote_side=[id])
    client_assignments = relationship("ClientConsultant", back_populates="employee", cascade="all, delete-orphan")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class EmployeeDocument(Base):
    __tablename__ = "employee_documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"))
    document_type = Column(String)
    file_name = Column(String)
    file_url = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee")

class AttendanceSettings(Base):
    __tablename__ = "attendance_settings"

    id = Column(Integer, primary_key=True, index=True)
    office_name = Column(String, default="Main Office")
    latitude = Column(Float, default=3.073800)
    longitude = Column(Float, default=101.518300)
    radius_meters = Column(Integer, default=500)
    allowed_ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    attendance_date = Column(Date, index=True)
    clock_in_time = Column(DateTime(timezone=True), nullable=True)
    clock_out_time = Column(DateTime(timezone=True), nullable=True)
    
    clock_in_latitude = Column(Float, nullable=True)
    clock_in_longitude = Column(Float, nullable=True)
    clock_out_latitude = Column(Float, nullable=True)
    clock_out_longitude = Column(Float, nullable=True)
    
    working_hours = Column(Float, default=0.0)
    status = Column(String) # Present, Absent, Late, Half Day
    late_minutes = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    employee = relationship("Employee")

class AttendanceCorrection(Base):
    __tablename__ = "attendance_corrections"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    attendance_id = Column(Integer, ForeignKey("attendance.id", ondelete="CASCADE"), index=True)
    requested_clock_in = Column(DateTime(timezone=True), nullable=True)
    requested_clock_out = Column(DateTime(timezone=True), nullable=True)
    reason = Column(String)
    status = Column(String, default="PENDING", index=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee")
    attendance = relationship("Attendance")
    approver = relationship("User", foreign_keys=[approved_by])

class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    start_date = Column(Date)
    end_date = Column(Date)
    leave_type = Column(String)
    allocation_date = Column(Date, nullable=True)
    days_requested = Column(Float, default=0.0)
    reason = Column(String, nullable=True)
    attachment_url = Column(String, nullable=True)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    employee = relationship("Employee")
    approver = relationship("User", foreign_keys=[approved_by])

class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True)
    annual_leave_balance = Column(Float, default=14.0)
    sick_leave_balance = Column(Float, default=0.0)
    annual_leave_taken = Column(Float, default=0.0)
    sick_leave_taken = Column(Float, default=0.0)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    employee = relationship("Employee")
    updater = relationship("User", foreign_keys=[updated_by])

class LeaveBalanceAudit(Base):
    __tablename__ = "leave_balance_audit"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    old_annual_balance = Column(Float)
    new_annual_balance = Column(Float)
    old_sick_balance = Column(Float)
    new_sick_balance = Column(Float)
    old_annual_taken = Column(Float, default=0.0)
    new_annual_taken = Column(Float, default=0.0)
    old_sick_taken = Column(Float, default=0.0)
    new_sick_taken = Column(Float, default=0.0)
    reason = Column(String)
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee")
    updater = relationship("User", foreign_keys=[updated_by])

class PublicHoliday(Base):
    __tablename__ = "public_holidays"

    id = Column(Integer, primary_key=True, index=True)
    holiday_name = Column(String, index=True)
    holiday_date = Column(Date, index=True)
    holiday_type = Column(String) # National Holiday, Company Holiday
    recurring = Column(Boolean, default=False)
    description = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User")

class Payroll(Base):
    __tablename__ = "payrolls"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    
    payroll_month = Column(Integer)
    payroll_year = Column(Integer)
    
    total_calendar_days = Column(Integer, default=0)
    total_weekends = Column(Integer, default=0)
    total_public_holidays = Column(Integer, default=0)
    total_working_days = Column(Integer, default=0)
    
    annual_leave_days = Column(Float, default=0.0)
    sick_leave_days = Column(Float, default=0.0)
    unpaid_leave_days = Column(Float, default=0.0)
    emergency_leave_days = Column(Float, default=0.0)
    maternity_leave_days = Column(Float, default=0.0)
    
    days_worked = Column(Float, default=0.0)
    payable_working_days = Column(Float, default=0.0)
    
    basic_salary = Column(Float, default=0.0)
    tax_percentage = Column(Float, default=0.0)
    work_support_allowance = Column(Float, default=0.0)
    attendance_allowance = Column(Float, default=0.0)
    thr_allowance = Column(Float, default=0.0)
    functional_allowance = Column(Float, default=0.0)
    bpjs_tk_jht = Column(Float, default=0.0)
    jaminan_pensiun_karyawan = Column(Float, default=0.0)
    bpjs_kes_karyawan = Column(Float, default=0.0)
    wht_21 = Column(Float, default=0.0)
    bpjs_tk_jkk = Column(Float, default=0.0)
    bpjs_tk_jkm = Column(Float, default=0.0)
    bpjs_kesehatan = Column(Float, default=0.0)
    bpjs_kesehatan_tambahan = Column(Float, default=0.0)
    additional_insurance = Column(Float, default=0.0)
    bpjs_tk_jht_company = Column(Float, default=0.0)
    jaminan_pensiun_jp = Column(Float, default=0.0)
    additional_coverage = Column(Float, default=0.0)
    taxable_income = Column(Float, default=0.0)
    total_compensation = Column(Float, default=0.0)
    
    meal_allowance = Column(Float, default=0.0)
    bonus = Column(Float, default=0.0)
    gross_salary = Column(Float, default=0.0)
    leave_deduction = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    
    total_deductions = Column(Float, default=0.0)
    
    net_salary = Column(Float, default=0.0)
    
    status = Column(String, default="Draft") # Draft, Generated, Paid
    
    # Secure Payslip Fields
    encrypted_pdf_password = Column(String, nullable=True)
    password_sent_at = Column(DateTime(timezone=True), nullable=True)
    download_count = Column(Integer, default=0)
    last_downloaded_at = Column(DateTime(timezone=True), nullable=True)
    generated_at = Column(DateTime(timezone=True), nullable=True)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    employee = relationship("Employee")
    generator = relationship("User", foreign_keys=[generated_by])

class PayrollAuditLog(Base):
    __tablename__ = "payroll_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    payroll_id = Column(Integer, ForeignKey("payrolls.id", ondelete="CASCADE"))
    action = Column(String) # Generated, Downloaded, Password Resent
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    details = Column(String, nullable=True)

    payroll = relationship("Payroll")

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    review_date = Column(Date)
    rating = Column(Integer)
    comments = Column(String, nullable=True)
    
    employee = relationship("Employee")
    reviewer = relationship("User")

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_type = Column(String)
    brand = Column(String)
    model = Column(String)
    asset_tag = Column(String, unique=True, index=True)
    serial_number = Column(String, unique=True, index=True)
    condition = Column(String)
    status = Column(String, default="AVAILABLE")
    remarks = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AssetAssignment(Base):
    __tablename__ = "asset_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"))
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"))
    assigned_date = Column(Date)
    returned_date = Column(Date, nullable=True)
    assigned_by = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="ACTIVE")
    
    asset = relationship("Asset")
    employee = relationship("Employee")
    assigner = relationship("User")

class AssetHistory(Base):
    __tablename__ = "asset_history"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"))
    action = Column(String)
    description = Column(String)
    performed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    asset = relationship("Asset")
    user = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=True)
    activity = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title = Column(String)
    message = Column(String)
    type = Column(String)
    module = Column(String)
    reference_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String, index=True)
    project_code = Column(String, unique=True, index=True)
    client_name = Column(String, nullable=True) # Maybe we should remove this or rename it? Let's keep it for now as a denormalized field or just to avoid breaking too much
    status = Column(String, default="ACTIVE")
    company_id = Column(Integer, ForeignKey("client_companies.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    tasks = relationship("Task", back_populates="project")
    company = relationship("ClientCompany", back_populates="projects")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    task_name = Column(String)
    description = Column(String, nullable=True)
    
    project = relationship("Project", back_populates="tasks")

class TimesheetStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Timesheet(Base):
    __tablename__ = "timesheets"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"))
    week_start = Column(Date)
    week_end = Column(Date)
    total_hours = Column(Float, default=0.0)
    overtime_hours = Column(Float, default=0.0)
    status = Column(Enum(TimesheetStatus), default=TimesheetStatus.DRAFT)
    comments = Column(String, nullable=True)
    
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    employee = relationship("Employee")
    approver = relationship("User")
    entries = relationship("TimesheetEntry", back_populates="timesheet", cascade="all, delete-orphan")

class TimesheetEntry(Base):
    __tablename__ = "timesheet_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    timesheet_id = Column(Integer, ForeignKey("timesheets.id", ondelete="CASCADE"))
    date = Column(Date)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    description = Column(String, nullable=True)
    
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    break_duration = Column(Integer, default=60) # in minutes
    total_hours = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    timesheet = relationship("Timesheet", back_populates="entries")
    project = relationship("Project")
    task = relationship("Task")


class ClientCompany(Base):
    __tablename__ = "client_companies"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), index=True, nullable=True)
    company_name = Column(String, index=True)
    company_code = Column(String, unique=True, index=True)
    address = Column(String, nullable=True)
    tax_number = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")
    key_contact_person = Column(String, nullable=True)
    key_contact_email = Column(String, nullable=True)
    key_contact_phone = Column(String, nullable=True)
    director_name = Column(String, nullable=True)
    director_email = Column(String, nullable=True)
    director_contact = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    client = relationship("Client", back_populates="companies")
    consultants = relationship("ClientConsultant", back_populates="company", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="company")
    conversations = relationship("Conversation", back_populates="company")
    documents = relationship("ClientDocument", back_populates="company")


class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String, nullable=True)
    client_code = Column(String, unique=True, index=True, nullable=True)
    status = Column(String, default="ACTIVE") # ACTIVE, DISABLED
    notes = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    # Client Personal Details
    date_of_birth = Column(Date, nullable=True)
    nationality = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    identification_number = Column(String, nullable=True)
    personal_address = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="client")
    companies = relationship("ClientCompany", back_populates="client", cascade="all, delete-orphan")


class ClientConsultant(Base):
    __tablename__ = "client_consultants"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("client_companies.id", ondelete="CASCADE"), index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    is_primary = Column(Boolean, default=False)
    consultant_role = Column(String, default="Consultant")
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    company = relationship("ClientCompany", back_populates="consultants")
    employee = relationship("Employee", back_populates="client_assignments")


class CompanyStakeholder(Base):
    __tablename__ = "company_stakeholders"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("client_companies.id", ondelete="CASCADE"), index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False) # Director, Commissioner, Shareholder, Authorized Signer
    share_percentage = Column(Float, default=0.0)
    identification_number = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    is_key_contact = Column(Boolean, default=False, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("ClientCompany", backref="stakeholders")


class ClientActivityLog(Base):
    __tablename__ = "client_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), index=True, nullable=True)
    company_id = Column(Integer, ForeignKey("client_companies.id", ondelete="CASCADE"), index=True, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String, nullable=False) # ORDER_CREATED, DOCUMENT_UPLOADED, CONSULTANT_ASSIGNED, STAKEHOLDER_ADDED
    description = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Client", backref="activities")
    company = relationship("ClientCompany")
    user = relationship("User")

    @property
    def performed_by(self) -> str:
        if not self.user:
            return "System"
        if self.user.employee:
            return f"{self.user.employee.first_name} {self.user.employee.last_name}"
        if self.user.client:
            return self.user.client.contact_person
        return self.user.email

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("client_companies.id", ondelete="CASCADE"), index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    company = relationship("ClientCompany", back_populates="conversations")
    employee = relationship("Employee", backref="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    sender_role = Column(String) # "CLIENT", "EMPLOYEE", "ADMIN", "HR"
    message = Column(String, nullable=True)
    attachment = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")


class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    target_role = Column(String, default="ALL") # "ALL", "EMPLOYEE", "CLIENT"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    
    creator = relationship("User")


class ClientDocument(Base):
    __tablename__ = "client_documents"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("client_companies.id", ondelete="CASCADE"), index=True)
    file_name = Column(String)
    file_url = Column(String)
    document_type = Column(String, nullable=True)
    description = Column(String, nullable=True)
    document_path = Column(String, nullable=True)
    order_number = Column(String, nullable=True)
    document_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    
    company = relationship("ClientCompany", back_populates="documents")
    uploader = relationship("User")


class ClientService(Base):
    __tablename__ = "client_services"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True)
    job_title = Column(String, index=True)
    description = Column(String, nullable=True)
    base_price = Column(Float, default=0.0)
    partner_a_discount = Column(Float, default=20.0)
    partner_a1_discount = Column(Float, default=40.0)
    partner_a2_discount = Column(Float, default=50.0)
    partner_a3_price = Column(String, nullable=True) # Free text pricing for Partner A3
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ClientOrder(Base):
    __tablename__ = "client_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, index=True) # e.g. MCSX-260001
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    company_id = Column(Integer, ForeignKey("client_companies.id", ondelete="SET NULL"), nullable=True)
    service_id = Column(Integer, ForeignKey("client_services.id", ondelete="SET NULL"), nullable=True)
    job_id = Column(String, nullable=True) # e.g. OA-001
    job_title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    pricing_tier = Column(String, default="BASE") # BASE, PARTNER_A, PARTNER_A1, PARTNER_A2, PARTNER_A3
    unit_price = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    custom_price_text = Column(String, nullable=True)
    status = Column(String, default="CONFIRMED") # DRAFT, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    payment_status = Column(String, default="UNPAID") # UNPAID, PARTIALLY_PAID, PAID
    invoice_number = Column(String, nullable=True) # e.g. INV-260001
    is_proforma_finalized = Column(Boolean, default=False)
    proforma_stage_percent = Column(Integer, default=50)
    is_final_invoice_finalized = Column(Boolean, default=False)
    consultant_ids = Column(JSON, nullable=True, default=list) # List of assigned employee/consultant IDs
    notes = Column(String, nullable=True)
    payment_link = Column(String, nullable=True)
    xendit_invoice_id = Column(String, nullable=True)
    payment_link_created_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    client = relationship("Client", backref="orders")
    company = relationship("ClientCompany")
    service = relationship("ClientService")


class ClientOrderProgress(Base):
    __tablename__ = "client_order_progress"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")


class Module(Base):
    __tablename__ = "modules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, unique=True, index=True)
    parent_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), nullable=True)
    system_area = Column(String, default="shared", nullable=True)
    
    parent = relationship("Module", remote_side=[id], backref="sub_modules")


class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, unique=True, index=True)


class RolePermission(Base):
    __tablename__ = "role_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), index=True)
    
    role = relationship("Role", backref="role_permissions")
    module = relationship("Module")
    permission = relationship("Permission")


class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(String)


class ReviewCycle(Base):
    __tablename__ = "review_cycles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="Draft") # Draft, Active, Closed
    
    department = relationship("Department")


class EmployeeReview(Base):
    __tablename__ = "employee_reviews"
    id = Column(Integer, primary_key=True, index=True)
    review_cycle_id = Column(Integer, ForeignKey("review_cycles.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    overall_rating = Column(String, nullable=True) # Excellent, Good, Average, Needs Improvement, Poor
    key_strengths = Column(String, nullable=True)
    improvement_areas = Column(String, nullable=True)
    goals_achieved = Column(String, nullable=True)
    new_goals = Column(String, nullable=True)
    comments = Column(String, nullable=True)
    development_plan = Column(String, nullable=True)
    promotion_readiness = Column(String, nullable=True)
    training_recommendation = Column(String, nullable=True)
    status = Column(String, default="Draft") # Draft, Submitted
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    cycle = relationship("ReviewCycle", backref="reviews")
    employee = relationship("Employee", foreign_keys=[employee_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])


class ReviewGoal(Base):
    __tablename__ = "review_goals"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    review_cycle_id = Column(Integer, ForeignKey("review_cycles.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    target_date = Column(Date, nullable=True)
    priority = Column(String, nullable=True) # Low, Medium, High
    status = Column(String, default="Not Started") # Not Started, In Progress, Completed, Delayed
    progress_pct = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    employee = relationship("Employee")
    creator = relationship("User")


class SelfReview(Base):
    __tablename__ = "self_reviews"
    id = Column(Integer, primary_key=True, index=True)
    review_cycle_id = Column(Integer, ForeignKey("review_cycles.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    achievements = Column(String, nullable=True)
    challenges = Column(String, nullable=True)
    support_needed = Column(String, nullable=True)
    skills_to_improve = Column(String, nullable=True)
    self_rating = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    cycle = relationship("ReviewCycle")
    employee = relationship("Employee")


class ReviewComment(Base):
    __tablename__ = "review_comments"
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("employee_reviews.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(String, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    review = relationship("EmployeeReview", backref="discussion_comments")
    user = relationship("User")


class ReviewTemplate(Base):
    __tablename__ = "review_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    fields_schema = Column(String, nullable=True) # Storing JSON string representation
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notary(Base):
    __tablename__ = "notaries"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, index=True, nullable=False)
    service_fee = Column(Float, default=0.0)
    status = Column(String, default="ACTIVE")
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# Association Table for Team Members (Junction)
team_members = Table(
    "team_members",
    Base.metadata,
    Column("team_id", Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
    Column("employee_id", Integer, ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True)
)


class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    leader_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    color = Column(String, nullable=True, default="#10b981")
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    leader = relationship("Employee", foreign_keys=[leader_id])
    members = relationship("Employee", secondary=team_members, backref="teams")




