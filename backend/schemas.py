from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime, date

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role_id: Optional[int] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    role_id: Optional[int] = None
    role: Optional['RoleResponse'] = None
    created_at: datetime
    permissions: List[str] = []

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase):
    id: int

    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int

    class Config:
        from_attributes = True

from models import EmploymentStatus
from datetime import date

class EmployeeBase(BaseModel):
    employee_id_custom: Optional[str] = None
    first_name: str
    last_name: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    nationality: Optional[str] = None
    marital_status: Optional[str] = None
    employment_type: Optional[str] = None
    company_name: Optional[str] = "MCS Consulting"
    job_title: Optional[str] = None
    base_salary: Optional[float] = 0.0
    tax_percentage: Optional[float] = 0.0
    tax_category: Optional[str] = None
    meal_allowance_per_day: Optional[float] = 40000.0
    work_support_allowance_per_day: Optional[float] = 30000.0
    attendance_allowance: Optional[float] = 0.0
    thr_allowance: Optional[float] = 0.0
    functional_allowance: Optional[float] = 0.0
    bpjs_tk_jht: Optional[float] = 0.0
    jaminan_pensiun_karyawan: Optional[float] = 0.0
    bpjs_kes_karyawan: Optional[float] = 0.0
    bpjs_tk_jkk: Optional[float] = 0.0
    bpjs_tk_jkm: Optional[float] = 0.0
    bpjs_kesehatan: Optional[float] = 0.0
    bpjs_kesehatan_tambahan: Optional[float] = 0.0
    additional_insurance: Optional[float] = 0.0
    bpjs_tk_jht_company: Optional[float] = 0.0
    jaminan_pensiun_jp: Optional[float] = 0.0
    additional_coverage: Optional[float] = 0.0
    
    bonus: Optional[float] = 0.0
    other_deductions: Optional[float] = 0.0
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    hire_date: date
    status: Optional[str] = "ACTIVE"
    profile_photo: Optional[str] = None
    payslip_password: Optional[str] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    role_id: Optional[int] = None
    has_calendar_access: Optional[bool] = False

class EmployeeCreate(EmployeeBase):
    user_id: int
    annual_leave_balance: Optional[int] = 14
    sick_leave_balance: Optional[int] = 0

class EmployeeSummary(BaseModel):
    id: int
    employee_id_custom: Optional[str] = None
    first_name: str
    last_name: str
    email: Optional[str] = None
    job_title: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    company_name: Optional[str] = None
    department: Optional[DepartmentResponse] = None
    
    class Config:
        from_attributes = True

class EmployeeResponse(EmployeeBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    department: Optional[DepartmentResponse] = None
    user: Optional[UserResponse] = None
    manager: Optional[EmployeeSummary] = None

    class Config:
        from_attributes = True

    @field_validator("profile_photo", mode="after")
    @classmethod
    def convert_profile_photo_url(cls, v: Optional[str]) -> Optional[str]:
        if v:
            if "/profile-photos/" in v or v.startswith("/uploads/"):
                return v
            from storage import get_signed_file_url
            return get_signed_file_url(v, bucket_name="hrms-documents")
        return v

class EmployeeDocumentBase(BaseModel):
    document_type: str
    file_name: str
    file_url: str

class EmployeeDocumentCreate(EmployeeDocumentBase):
    employee_id: int

class EmployeeDocumentResponse(EmployeeDocumentBase):
    id: int
    employee_id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

    @field_validator("file_url", mode="after")
    @classmethod
    def convert_employee_doc_url(cls, v: Optional[str]) -> Optional[str]:
        if v:
            from storage import get_signed_file_url
            return get_signed_file_url(v, bucket_name="hrms-documents")
        return v

class AttendanceSettingsBase(BaseModel):
    office_name: str
    latitude: float
    longitude: float
    radius_meters: int
    allowed_ip_address: Optional[str] = None

class AttendanceSettingsResponse(AttendanceSettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    attendance_date: date
    clock_in_time: Optional[datetime] = None
    clock_out_time: Optional[datetime] = None
    clock_in_latitude: Optional[float] = None
    clock_in_longitude: Optional[float] = None
    clock_out_latitude: Optional[float] = None
    clock_out_longitude: Optional[float] = None
    working_hours: float = 0.0
    status: Optional[str] = None
    late_minutes: int = 0

class AttendanceResponse(AttendanceBase):
    id: int
    employee_id: int
    employee: Optional[EmployeeSummary] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AttendanceClockInRequest(BaseModel):
    latitude: float
    longitude: float

class AttendanceUpdateAdmin(BaseModel):
    clock_in_time: Optional[datetime] = None
    clock_out_time: Optional[datetime] = None

class AttendanceClockOutRequest(BaseModel):
    latitude: float
    longitude: float

class AttendanceCorrectionBase(BaseModel):
    requested_clock_in: Optional[datetime] = None
    requested_clock_out: Optional[datetime] = None
    reason: str

class AttendanceCorrectionCreate(AttendanceCorrectionBase):
    attendance_id: int

class AttendanceCorrectionResponse(AttendanceCorrectionBase):
    id: int
    employee_id: int
    attendance_id: int
    status: str
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    employee: Optional[EmployeeSummary] = None

    class Config:
        from_attributes = True

class LeaveRequestBase(BaseModel):
    start_date: date
    end_date: date
    leave_type: str
    allocation_date: Optional[date] = None
    days_requested: Optional[float] = 0.0
    reason: Optional[str] = None
    attachment_url: Optional[str] = None
    status: str = "PENDING"

class LeaveRequestCreate(LeaveRequestBase):
    employee_id: Optional[int] = None
    is_half_day: Optional[bool] = False
    reason: Optional[str] = Field(None, max_length=100)

class LeaveRequestUpdate(BaseModel):
    start_date: date
    end_date: date
    leave_type: str
    reason: Optional[str] = Field(None, max_length=100)
    is_half_day: Optional[bool] = False

class LeaveRequestResponse(LeaveRequestBase):
    id: int
    employee_id: int
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    employee: Optional[EmployeeSummary] = None

    class Config:
        from_attributes = True

    @field_validator("attachment_url", mode="after")
    @classmethod
    def convert_leave_attachment_url(cls, v: Optional[str]) -> Optional[str]:
        if v:
            from storage import get_signed_file_url
            return get_signed_file_url(v, bucket_name="hrms-documents")
        return v

class LeaveBalanceBase(BaseModel):
    annual_leave_balance: float = 14.0
    sick_leave_balance: float = 0.0
    annual_leave_taken: float = 0.0
    sick_leave_taken: float = 0.0

class LeaveBalanceResponse(LeaveBalanceBase):
    id: int
    employee_id: int
    updated_by: Optional[int] = None
    updated_at: Optional[datetime] = None
    employee: Optional[EmployeeSummary] = None
    bonus_allocated: Optional[float] = 0.0

    class Config:
        from_attributes = True

class LeaveBalanceUpdate(BaseModel):
    annual_leave_balance: float
    sick_leave_balance: float
    annual_leave_taken: float
    sick_leave_taken: float
    reason: str

class LeaveAllocationRequest(BaseModel):
    employee_id: int
    amount: float
    reason: str
    allocation_date: date

class LeaveAllocationUpdate(BaseModel):
    days_requested: float
    reason: str
    allocation_date: Optional[date] = None

class LeaveBalanceAuditResponse(BaseModel):
    id: int
    employee_id: int
    old_annual_balance: float
    new_annual_balance: float
    old_sick_balance: float
    new_sick_balance: float
    old_annual_taken: float
    new_annual_taken: float
    old_sick_taken: float
    new_sick_taken: float
    reason: str
    updated_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class PayrollBase(BaseModel):
    payroll_month: int
    payroll_year: int
    
    total_calendar_days: int = 0
    total_weekends: int = 0
    total_public_holidays: int = 0
    total_working_days: int = 0
    
    annual_leave_days: Optional[float] = 0.0
    sick_leave_days: Optional[float] = 0.0
    unpaid_leave_days: Optional[float] = 0.0
    emergency_leave_days: Optional[float] = 0.0
    maternity_leave_days: Optional[float] = 0.0
    
    days_worked: float = 0.0
    payable_working_days: float = 0.0
    
    basic_salary: float = 0.0
    tax_percentage: float = 0.0
    work_support_allowance: float = 0.0
    attendance_allowance: float = 0.0
    thr_allowance: float = 0.0
    functional_allowance: float = 0.0
    bpjs_tk_jht: float = 0.0
    jaminan_pensiun_karyawan: float = 0.0
    bpjs_kes_karyawan: float = 0.0
    wht_21: float = 0.0
    bpjs_tk_jkk: float = 0.0
    bpjs_tk_jkm: float = 0.0
    bpjs_kesehatan: float = 0.0
    bpjs_kesehatan_tambahan: float = 0.0
    additional_insurance: float = 0.0
    bpjs_tk_jht_company: float = 0.0
    jaminan_pensiun_jp: float = 0.0
    additional_coverage: float = 0.0
    taxable_income: float = 0.0
    total_compensation: float = 0.0
    
    meal_allowance: float = 0.0
    bonus: float = 0.0
    gross_salary: float = 0.0
    leave_deduction: float = 0.0
    other_deductions: float = 0.0
    total_deductions: float = 0.0
    
    net_salary: float = 0.0
    status: str = "Draft"

class PayrollCreate(PayrollBase):
    employee_id: int

class PayrollUpdate(BaseModel):
    tax_percentage: Optional[float] = None
    work_support_allowance: Optional[float] = None
    attendance_allowance: Optional[float] = None
    thr_allowance: Optional[float] = None
    functional_allowance: Optional[float] = None
    bpjs_tk_jht: Optional[float] = None
    jaminan_pensiun_karyawan: Optional[float] = None
    bpjs_kes_karyawan: Optional[float] = None
    wht_21: Optional[float] = None
    bpjs_tk_jkk: Optional[float] = None
    bpjs_tk_jkm: Optional[float] = None
    bpjs_kesehatan: Optional[float] = None
    bpjs_kesehatan_tambahan: Optional[float] = None
    additional_insurance: Optional[float] = None
    bpjs_tk_jht_company: Optional[float] = None
    jaminan_pensiun_jp: Optional[float] = None
    additional_coverage: Optional[float] = None

    meal_allowance: Optional[float] = None
    bonus: Optional[float] = None
    leave_deduction: Optional[float] = None
    other_deductions: Optional[float] = None
    emergency_leave_days: Optional[float] = None
    maternity_leave_days: Optional[float] = None
    
    status: Optional[str] = None

class PayrollResponse(PayrollBase):
    id: int
    employee_id: int
    employee: Optional[EmployeeSummary] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Performance Review Module Schemas ---

class ReviewCycleBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    department_id: Optional[int] = None
    status: str = "Draft"

class ReviewCycleCreate(ReviewCycleBase):
    pass

class ReviewCycleResponse(ReviewCycleBase):
    id: int
    
    class Config:
        from_attributes = True

class EmployeeReviewBase(BaseModel):
    review_cycle_id: int
    employee_id: int
    overall_rating: Optional[str] = None  # Excellent, Good, Average, Needs Improvement, Poor
    key_strengths: Optional[str] = None
    improvement_areas: Optional[str] = None
    goals_achieved: Optional[str] = None
    new_goals: Optional[str] = None
    comments: Optional[str] = None
    development_plan: Optional[str] = None
    promotion_readiness: Optional[str] = None
    training_recommendation: Optional[str] = None
    status: str = "Draft"

class EmployeeReviewCreate(EmployeeReviewBase):
    reviewer_id: int

class EmployeeReviewUpdate(BaseModel):
    overall_rating: Optional[str] = None
    key_strengths: Optional[str] = None
    improvement_areas: Optional[str] = None
    goals_achieved: Optional[str] = None
    new_goals: Optional[str] = None
    comments: Optional[str] = None
    development_plan: Optional[str] = None
    promotion_readiness: Optional[str] = None
    training_recommendation: Optional[str] = None
    status: Optional[str] = None

class EmployeeReviewResponse(EmployeeReviewBase):
    id: int
    reviewer_id: int
    created_at: datetime
    updated_at: datetime
    
    employee: Optional["EmployeeResponse"] = None
    reviewer: Optional["UserResponse"] = None
    cycle: Optional[ReviewCycleResponse] = None
    
    class Config:
        from_attributes = True

class ReviewGoalBase(BaseModel):
    employee_id: int
    review_cycle_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    target_date: Optional[date] = None
    priority: Optional[str] = "Medium"  # Low, Medium, High
    status: Optional[str] = "Not Started"  # Not Started, In Progress, Completed, Delayed
    progress_pct: Optional[int] = 0

class ReviewGoalCreate(ReviewGoalBase):
    pass

class ReviewGoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    progress_pct: Optional[int] = None

class ReviewGoalResponse(ReviewGoalBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SelfReviewBase(BaseModel):
    review_cycle_id: int
    employee_id: int
    achievements: Optional[str] = None
    challenges: Optional[str] = None
    support_needed: Optional[str] = None
    skills_to_improve: Optional[str] = None
    self_rating: Optional[str] = None

class SelfReviewCreate(SelfReviewBase):
    pass

class SelfReviewResponse(SelfReviewBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReviewCommentBase(BaseModel):
    review_id: int
    comment: str

class ReviewCommentCreate(ReviewCommentBase):
    pass

class ReviewCommentResponse(ReviewCommentBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReviewTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    fields_schema: Optional[str] = None

class ReviewTemplateCreate(ReviewTemplateBase):
    pass

class ReviewTemplateResponse(ReviewTemplateBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Alias for backwards compatibility
PerformanceReviewBase = EmployeeReviewBase
PerformanceReviewCreate = EmployeeReviewCreate
PerformanceReviewResponse = EmployeeReviewResponse

class AssetBase(BaseModel):
    asset_type: str
    brand: str
    model: str
    asset_tag: str
    serial_number: str
    condition: str
    status: str = "AVAILABLE"
    remarks: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(AssetBase):
    pass

class AssetResponse(AssetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AssetAssignmentBase(BaseModel):
    assigned_date: date
    returned_date: Optional[date] = None
    status: str = "ACTIVE"

class AssetAssignmentCreate(AssetAssignmentBase):
    asset_id: int
    employee_id: int

class AssetAssignmentResponse(AssetAssignmentBase):
    id: int
    asset_id: int
    employee_id: int
    assigned_by: int
    asset: Optional[AssetResponse] = None

    class Config:
        from_attributes = True

class AssetHistoryResponse(BaseModel):
    id: int
    asset_id: int
    action: str
    description: str
    performed_by: int
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class BulkAssetAssignmentCreate(BaseModel):
    employee_id: int
    assigned_date: date
    assets: List[AssetCreate]

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    module: str
    reference_id: Optional[int] = None
    action_url: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    project_name: str
    project_code: str
    client_name: Optional[str] = None
    status: str = "ACTIVE"
    company_id: Optional[int] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PublicHolidayBase(BaseModel):
    holiday_name: str
    holiday_date: date
    holiday_type: str
    recurring: bool = False
    description: Optional[str] = None

class PublicHolidayCreate(PublicHolidayBase):
    pass

class PublicHolidayUpdate(BaseModel):
    holiday_name: Optional[str] = None
    holiday_date: Optional[date] = None
    holiday_type: Optional[str] = None
    recurring: Optional[bool] = None
    description: Optional[str] = None

class PublicHolidayResponse(PublicHolidayBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    task_name: str
    description: Optional[str] = None

class TaskCreate(TaskBase):
    project_id: int

class TaskResponse(TaskBase):
    id: int
    project_id: int

    class Config:
        from_attributes = True

class TimesheetEntryBase(BaseModel):
    date: date
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    break_duration: int = 60
    total_hours: float = 0.0

class TimesheetEntryCreate(TimesheetEntryBase):
    project_name: Optional[str] = None
    task_name: Optional[str] = None

class TimesheetEntryResponse(TimesheetEntryBase):
    id: int
    timesheet_id: int
    created_at: datetime
    updated_at: datetime
    project: Optional[ProjectResponse] = None
    task: Optional[TaskResponse] = None

    class Config:
        from_attributes = True

class TimesheetBase(BaseModel):
    week_start: date
    week_end: date
    total_hours: float = 0.0
    overtime_hours: float = 0.0
    status: str = "DRAFT"
    comments: Optional[str] = None

class TimesheetCreate(TimesheetBase):
    employee_id: Optional[int] = None

class TimesheetResponse(TimesheetBase):
    id: int
    employee_id: int
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    employee: Optional[EmployeeSummary] = None
    entries: List[TimesheetEntryResponse] = []

    class Config:
        from_attributes = True


class ClientCompanyBase(BaseModel):
    company_name: str
    company_code: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    industry: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    key_contact_person: Optional[str] = None
    key_contact_email: Optional[str] = None
    key_contact_phone: Optional[str] = None
    director_name: Optional[str] = None
    director_email: Optional[str] = None
    director_contact: Optional[str] = None
    notes: Optional[str] = None
    client_id: Optional[int] = None

class ClientCompanyCreate(ClientCompanyBase):
    pass

class ClientMin(BaseModel):
    id: int
    contact_person: str
    email: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True

class ClientCompanyResponse(ClientCompanyBase):
    id: int
    logo_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    client: Optional[ClientMin] = None

    class Config:
        from_attributes = True

class ClientBase(BaseModel):
    contact_person: str
    email: str
    phone: Optional[str] = None
    client_code: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    notes: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    identification_number: Optional[str] = None
    personal_address: Optional[str] = None

class ClientOrderItemCreate(BaseModel):
    service_id: Optional[int] = None
    job_id: Optional[str] = None
    job_title: str
    branch_name: Optional[str] = None
    description: Optional[str] = None
    pricing_tier: str = "BASE"
    unit_price: float = 0.0
    custom_price_text: Optional[str] = None
    notary_id: Optional[int] = None
    notary_fee: Optional[float] = None

class ClientOrderCreateRequest(BaseModel):
    client_id: Optional[int] = None
    company_id: Optional[int] = None
    billing_company_id: Optional[int] = None
    items: List[ClientOrderItemCreate]
    consultant_ids: Optional[List[int]] = []
    notes: Optional[str] = None
    order_number: Optional[str] = None

class ClientOrderItemResponse(BaseModel):
    id: int
    order_id: int
    service_id: Optional[int] = None
    job_id: Optional[str] = None
    job_title: str
    branch_name: Optional[str] = None
    description: Optional[str] = None
    pricing_tier: str
    unit_price: float
    custom_price_text: Optional[str] = None
    notary_id: Optional[int] = None
    notary_fee: Optional[float] = 0.0
    notary_payment_status: Optional[str] = "UNPAID"
    notary_payment_date: Optional[date] = None
    notary_payment_ref: Optional[str] = None

    class Config:
        from_attributes = True

class ClientOrderResponse(BaseModel):
    id: int
    order_number: Optional[str] = None
    client_id: int
    company_id: Optional[int] = None
    billing_company_id: Optional[int] = None
    service_id: Optional[int] = None
    job_id: Optional[str] = None
    job_title: Optional[str] = "Service Package"
    branch_name: Optional[str] = None
    description: Optional[str] = None
    pricing_tier: Optional[str] = "BASE"
    unit_price: Optional[float] = 0.0
    total_amount: Optional[float] = 0.0
    custom_price_text: Optional[str] = None
    status: Optional[str] = "CONFIRMED"
    payment_status: Optional[str] = "UNPAID"
    invoice_number: Optional[str] = None
    is_proforma_finalized: Optional[bool] = False
    proforma_stage_percent: Optional[int] = 50
    proforma_paid_amount: Optional[float] = None
    is_final_invoice_finalized: Optional[bool] = False
    consultant_ids: Optional[List[int]] = []
    consultants: Optional[List[dict]] = []
    notes: Optional[str] = None
    payment_link: Optional[str] = None
    xendit_invoice_id: Optional[str] = None
    payment_link_created_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    client_name: Optional[str] = None
    company_name: Optional[str] = None
    billing_company_name: Optional[str] = None
    company: Optional['ClientCompanyResponse'] = None
    billing_company: Optional['ClientCompanyResponse'] = None
    notary_id: Optional[int] = None
    notary: Optional['NotaryResponse'] = None
    notary_fee: Optional[float] = 0.0
    notary_payment_status: Optional[str] = "UNPAID"
    notary_payment_date: Optional[date] = None
    notary_payment_ref: Optional[str] = None

    class Config:
        from_attributes = True

class NotaryPaymentRequest(BaseModel):
    payment_date: Optional[str] = None # YYYY-MM-DD
    payment_ref: Optional[str] = None

class ClientCreate(ClientBase):
    create_portal_account: Optional[bool] = False
    password: Optional[str] = None
    company_name: Optional[str] = None
    company_code: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    industry: Optional[str] = None
    key_contact_person: Optional[str] = None
    key_contact_email: Optional[str] = None
    key_contact_phone: Optional[str] = None
    director_name: Optional[str] = None
    director_email: Optional[str] = None
    director_contact: Optional[str] = None
    company_notes: Optional[str] = None
    order_items: Optional[List[ClientOrderItemCreate]] = []

class ClientResponse(ClientBase):
    id: int
    user_id: Optional[int] = None
    companies: List[ClientCompanyResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AssignConsultantsRequest(BaseModel):
    employee_ids: List[int]
    primary_employee_id: Optional[int] = None

class ClientPasswordReset(BaseModel):
    new_password: str

class ConversationResponse(BaseModel):
    id: int
    company_id: Optional[int] = None
    employee_id: Optional[int] = None
    created_at: datetime
    company: Optional[ClientCompanyResponse] = None
    employee: Optional[EmployeeSummary] = None

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    conversation_id: int
    message: Optional[str] = None
    attachment: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_role: str
    message: Optional[str] = None
    attachment: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

    @field_validator("attachment", mode="after")
    @classmethod
    def convert_chat_attachment_url(cls, v: Optional[str]) -> Optional[str]:
        if v:
            from storage import get_signed_file_url
            return get_signed_file_url(v, bucket_name="hrms-documents")
        return v

class AnnouncementBase(BaseModel):
    title: str
    content: str
    target_role: Optional[str] = "ALL"

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    created_at: datetime
    created_by: int

    class Config:
        from_attributes = True

class ClientOrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    billing_company_id: Optional[int] = None
    invoice_number: Optional[str] = None
    consultant_ids: Optional[List[int]] = None
    notes: Optional[str] = None
    service_id: Optional[int] = None
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    branch_name: Optional[str] = None
    description: Optional[str] = None
    pricing_tier: Optional[str] = None
    unit_price: Optional[float] = None
    custom_price_text: Optional[str] = None
    is_proforma_finalized: Optional[bool] = None
    proforma_stage_percent: Optional[int] = None
    proforma_paid_amount: Optional[float] = None
    is_final_invoice_finalized: Optional[bool] = None
    payment_link: Optional[str] = None
    xendit_invoice_id: Optional[str] = None
    notary_id: Optional[int] = None

class CompanyStakeholderCreate(BaseModel):
    name: str
    role: str
    share_percentage: Optional[float] = 0.0
    identification_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_key_contact: Optional[bool] = False

class CompanyStakeholderResponse(BaseModel):
    id: int
    company_id: int
    name: str
    role: str
    share_percentage: float
    identification_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_key_contact: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ClientActivityLogResponse(BaseModel):
    id: int
    client_id: Optional[int] = None
    company_id: Optional[int] = None
    user_id: Optional[int] = None
    action_type: str
    description: str
    performed_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ClientDocumentUpdate(BaseModel):
    document_type: Optional[str] = None
    description: Optional[str] = None
    document_path: Optional[str] = None
    order_number: Optional[str] = None
    document_date: Optional[date] = None
    expiry_date: Optional[date] = None

class ClientDocumentResponse(BaseModel):
    id: int
    company_id: int
    file_name: str
    file_url: str
    document_type: Optional[str] = None
    description: Optional[str] = None
    document_path: Optional[str] = None
    order_number: Optional[str] = None
    document_date: Optional[date] = None
    expiry_date: Optional[date] = None
    uploaded_at: datetime
    uploaded_by: int

    class Config:
        from_attributes = True

    @field_validator("file_url", mode="after")
    @classmethod
    def convert_client_doc_url(cls, v: Optional[str]) -> Optional[str]:
        if v:
            if v.startswith("/Clients/"):
                # Optimize: return raw Dropbox path to avoid slow synchronous HTTP queries in document list retrieval
                # Check first if it is actually stored locally (local fallback)
                local_rel = v.replace("/Clients/", "", 1)
                import os
                local_path = os.path.join("uploads", local_rel)
                if os.path.exists(local_path):
                    return f"/uploads/{local_rel}".replace("\\", "/")
                
                # Check old local path fallback
                parts = local_rel.split("/")
                if len(parts) >= 4:
                    old_rel = f"{parts[0]}/{parts[2]}/{parts[3]}"
                    old_path = os.path.join("uploads", old_rel)
                    if os.path.exists(old_path):
                        return f"/uploads/{old_rel}".replace("\\", "/")
                
                return v
            if v.startswith("/uploads/") or v.startswith("http://") or v.startswith("https://") or v == "#":
                return v
            from storage import get_signed_file_url
            return get_signed_file_url(v, bucket_name="client-documents")
        return v


class ClientServiceBase(BaseModel):
    job_id: Optional[str] = None
    job_title: str
    description: Optional[str] = None
    base_price: float = 0.0
    partner_a_discount: Optional[float] = 20.0
    partner_a1_discount: Optional[float] = 40.0
    partner_a2_discount: Optional[float] = 50.0
    partner_a3_price: Optional[str] = None
    needs_notary: Optional[bool] = False

class ClientServiceCreate(ClientServiceBase):
    pass

class ClientServiceUpdate(BaseModel):
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[float] = None
    partner_a_discount: Optional[float] = None
    partner_a1_discount: Optional[float] = None
    partner_a2_discount: Optional[float] = None
    partner_a3_price: Optional[str] = None
    needs_notary: Optional[bool] = None

class ClientServiceResponse(ClientServiceBase):
    id: int
    partner_a_price: Optional[float] = None
    partner_a1_price: Optional[float] = None
    partner_a2_price: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PermissionBase(BaseModel):
    name: str
    code: str


class PermissionResponse(PermissionBase):
    id: int

    class Config:
        from_attributes = True


class ModuleBase(BaseModel):
    name: str
    code: str
    parent_id: Optional[int] = None


class ModuleResponse(ModuleBase):
    id: int
    sub_modules: List['ModuleResponse'] = []

    class Config:
        from_attributes = True


class RolePermissionBase(BaseModel):
    role_id: int
    module_id: int
    permission_id: int


class RolePermissionResponse(RolePermissionBase):
    id: int

    class Config:
        from_attributes = True


class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyResponse(CompanyBase):
    id: int

    class Config:
        from_attributes = True


class ClientOrderProgressCreate(BaseModel):
    message: str


class ClientOrderProgressResponse(BaseModel):
    id: int
    order_number: str
    user_id: Optional[int] = None
    message: str
    created_at: datetime
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True


class NotaryServiceFeeCreate(BaseModel):
    service_id: int
    fee: float

class NotaryServiceFeeResponse(BaseModel):
    id: int
    notary_id: int
    service_id: int
    fee: float
    service_title: Optional[str] = None

    class Config:
        from_attributes = True

class NotaryBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: str
    status: str = "ACTIVE"
    notes: Optional[str] = None
    
    # Bank & Payout Information
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_holder_name: Optional[str] = None
    bank_branch: Optional[str] = None
    bank_swift_code: Optional[str] = None


class NotaryCreate(NotaryBase):
    service_fees: Optional[List[NotaryServiceFeeCreate]] = None


class NotaryResponse(NotaryBase):
    id: int
    created_at: datetime
    updated_at: datetime
    service_fees: List[NotaryServiceFeeResponse] = []
    is_bank_configured: bool = False

    class Config:
        from_attributes = True


class NotaryDisbursementRequest(BaseModel):
    description: Optional[str] = None


class TeamBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    leader_id: Optional[int] = None
    color: Optional[str] = "#10b981"
    is_active: Optional[bool] = True


class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    leader_id: Optional[int] = None
    color: Optional[str] = "#10b981"
    is_active: Optional[bool] = True


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    leader_id: Optional[int] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None


class TeamMemberAssign(BaseModel):
    employee_ids: List[int]


class TeamResponse(TeamBase):
    id: int
    created_at: datetime
    updated_at: datetime
    leader: Optional[EmployeeSummary] = None
    members: List[EmployeeSummary] = []

    class Config:
        from_attributes = True





