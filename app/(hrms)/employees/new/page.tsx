"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Briefcase, Wallet, Landmark, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    profile_photo: "",
    first_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    nationality: "",
    marital_status: "",
    email: "",
    phone: "",
    address: "",
    emergency_contact: "",
    
    employee_id_custom: "",
    hire_date: "",
    department_id: "",
    manager_id: "",
    employment_type: "",
    status: "ACTIVE",
    role_id: "", // Access Level
    job_title: "", // Designation
    company_name: "PT Citra Selaras Solusi",
    
    base_salary: "",
    tax_percentage: "",
    attendance_allowance: "",
    thr_allowance: "",
    functional_allowance: "",
    bonus: "",
    bpjs_tk_jht: "",
    jaminan_pensiun_karyawan: "",
    bpjs_kes_karyawan: "",
    other_deductions: "",
    bpjs_tk_jkk: "",
    bpjs_tk_jkm: "",
    bpjs_kesehatan: "",
    bpjs_kesehatan_tambahan: "",
    additional_insurance: "",
    bpjs_tk_jht_company: "",
    jaminan_pensiun_jp: "",
    additional_coverage: "",
    tax_category: "",
    
    bank_name: "",
    bank_account_number: "",
    
    annual_leave: "14",
    payslip_password: "",
    meal_allowance_per_day: "40000",
    work_support_allowance_per_day: "30000",
    has_calendar_access: false
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      const token = localStorage.getItem("hrms_token");
      if (!token) return;
      try {
        const [deptRes, empRes, roleRes, companyRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (deptRes.ok) setDepartments(await deptRes.json());
        if (empRes.ok) setManagers(await empRes.json());
        if (roleRes.ok) setRoles(await roleRes.json());
        if (companyRes.ok) setCompanies(await companyRes.json());
      } catch (err) {
        console.error("Failed to fetch dropdown data", err);
      }
    };
    fetchDropdownData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value === "none" ? "" : value }));
  };

  const handleCheckedChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!formData.role_id) {
      setError("Designation (Role) is required.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("hrms_token");
      if (!token) throw new Error("Authentication token not found.");

      // 1. Create User account first
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: "McsTempPassword123!",
          role_id: parseInt(formData.role_id)
        })
      });

      if (!userResponse.ok) {
        const err = await userResponse.json();
        throw new Error(`User Creation Failed: ${err.detail || "Unknown error"}`);
      }

      const userData = await userResponse.json();

      // 2. Create Employee Profile
      const employeePayload: any = {
        user_id: userData.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        hire_date: formData.hire_date,
        status: formData.status
      };

      if (formData.profile_photo) employeePayload.profile_photo = formData.profile_photo;
      if (formData.gender) employeePayload.gender = formData.gender;
      if (formData.date_of_birth) employeePayload.date_of_birth = formData.date_of_birth;
      if (formData.nationality) employeePayload.nationality = formData.nationality;
      if (formData.marital_status) employeePayload.marital_status = formData.marital_status;
      if (formData.phone) employeePayload.phone = formData.phone;
      if (formData.address) employeePayload.address = formData.address;
      if (formData.emergency_contact) employeePayload.emergency_contact = formData.emergency_contact;
      if (formData.employee_id_custom) employeePayload.employee_id_custom = formData.employee_id_custom;
      if (formData.department_id) employeePayload.department_id = parseInt(formData.department_id);
      if (formData.manager_id) employeePayload.manager_id = parseInt(formData.manager_id);
      if (formData.employment_type) employeePayload.employment_type = formData.employment_type;
      if (formData.company_name) employeePayload.company_name = formData.company_name;
      if (formData.job_title) employeePayload.job_title = formData.job_title;
      employeePayload.has_calendar_access = formData.has_calendar_access;
      
      if (formData.annual_leave) employeePayload.annual_leave_balance = parseInt(formData.annual_leave);
      
      if (formData.base_salary) employeePayload.base_salary = parseFloat(formData.base_salary);
      if (formData.tax_percentage) employeePayload.tax_percentage = parseFloat(formData.tax_percentage);
      if (formData.tax_category) employeePayload.tax_category = formData.tax_category;
      if (formData.payslip_password) employeePayload.payslip_password = formData.payslip_password;
      if (formData.meal_allowance_per_day) employeePayload.meal_allowance_per_day = parseFloat(formData.meal_allowance_per_day);
      if (formData.work_support_allowance_per_day) employeePayload.work_support_allowance_per_day = parseFloat(formData.work_support_allowance_per_day);
      if (formData.attendance_allowance) employeePayload.attendance_allowance = parseFloat(formData.attendance_allowance);
      if (formData.thr_allowance) employeePayload.thr_allowance = parseFloat(formData.thr_allowance);
      if (formData.functional_allowance) employeePayload.functional_allowance = parseFloat(formData.functional_allowance);
      if (formData.bonus) employeePayload.bonus = parseFloat(formData.bonus);
      
      if (formData.bpjs_tk_jht) employeePayload.bpjs_tk_jht = parseFloat(formData.bpjs_tk_jht);
      if (formData.jaminan_pensiun_karyawan) employeePayload.jaminan_pensiun_karyawan = parseFloat(formData.jaminan_pensiun_karyawan);
      if (formData.bpjs_kes_karyawan) employeePayload.bpjs_kes_karyawan = parseFloat(formData.bpjs_kes_karyawan);
      if (formData.other_deductions) employeePayload.other_deductions = parseFloat(formData.other_deductions);
      
      if (formData.bpjs_tk_jkk) employeePayload.bpjs_tk_jkk = parseFloat(formData.bpjs_tk_jkk);
      if (formData.bpjs_tk_jkm) employeePayload.bpjs_tk_jkm = parseFloat(formData.bpjs_tk_jkm);
      if (formData.bpjs_kesehatan) employeePayload.bpjs_kesehatan = parseFloat(formData.bpjs_kesehatan);
      if (formData.bpjs_kesehatan_tambahan) employeePayload.bpjs_kesehatan_tambahan = parseFloat(formData.bpjs_kesehatan_tambahan);
      if (formData.additional_insurance) employeePayload.additional_insurance = parseFloat(formData.additional_insurance);
      if (formData.bpjs_tk_jht_company) employeePayload.bpjs_tk_jht_company = parseFloat(formData.bpjs_tk_jht_company);
      if (formData.jaminan_pensiun_jp) employeePayload.jaminan_pensiun_jp = parseFloat(formData.jaminan_pensiun_jp);
      if (formData.additional_coverage) employeePayload.additional_coverage = parseFloat(formData.additional_coverage);
      
      if (formData.bank_name) employeePayload.bank_name = formData.bank_name;
      if (formData.bank_account_number) employeePayload.bank_account_number = formData.bank_account_number;

      const empResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(employeePayload)
      });

      if (!empResponse.ok) {
        const err = await empResponse.json();
        throw new Error(`Profile Creation Failed: ${err.detail || "Unknown error"}`);
      }

      const empData = await empResponse.json();
      
      // Redirect to the new profile page where Documents and Assets can be assigned!
      router.push(`/employees/${empData.id}`);
      
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-10">
      <div className="flex items-start gap-4">
        <Link href="/employees" className="mt-1">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Employee</h1>
          <p className="text-muted-foreground mt-1">Fill out the information below to create a new record.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-4 h-auto sm:h-12 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="personal" className="h-full gap-2 text-sm">
              <User className="h-4 w-4" /> <span className="hidden md:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="employment" className="h-full gap-2 text-sm">
              <Briefcase className="h-4 w-4" /> <span className="hidden md:inline">Employment</span>
            </TabsTrigger>
            <TabsTrigger value="payroll" className="h-full gap-2 text-sm">
              <Wallet className="h-4 w-4" /> <span className="hidden md:inline">Payroll</span>
            </TabsTrigger>
            <TabsTrigger value="bank" className="h-full gap-2 text-sm">
              <Landmark className="h-4 w-4" /> <span className="hidden md:inline">Bank</span>
            </TabsTrigger>
            <TabsTrigger value="leave" className="h-full gap-2 text-sm">
              <CalendarIcon className="h-4 w-4" /> <span className="hidden md:inline">Leaves</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
                <CardDescription>Basic information and contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name *</label>
                    <Input name="first_name" value={formData.first_name} onChange={handleInputChange} required placeholder="e.g. John" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name *</label>
                    <Input name="last_name" value={formData.last_name} onChange={handleInputChange} required placeholder="e.g. Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address *</label>
                    <Input name="email" value={formData.email} onChange={handleInputChange} required type="email" placeholder="john.doe@company.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="+1 234 567 8900" />
                  </div>
                   <div className="space-y-2">
                    <label className="text-sm font-medium">Gender</label>
                    <Select value={formData.gender || "none"} onValueChange={(val) => handleSelectChange("gender", val)}>
                      <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                        <SelectValue placeholder="Select gender..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="none" disabled>Select gender...</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date of Birth</label>
                    <Input name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} type="date" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nationality</label>
                    <Input name="nationality" value={formData.nationality} onChange={handleInputChange} placeholder="e.g. Indonesian" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Marital Status</label>
                    <Select value={formData.marital_status || "none"} onValueChange={(val) => handleSelectChange("marital_status", val)}>
                      <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="none" disabled>Select status...</SelectItem>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <textarea 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Full residential address..."
                  ></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emergency Contact</label>
                  <Input name="emergency_contact" value={formData.emergency_contact} onChange={handleInputChange} placeholder="Name and phone number" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>Role, department, and company access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Join Date *</label>
                    <Input name="hire_date" value={formData.hire_date} onChange={handleInputChange} required type="date" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Designation (Job Title) *</label>
                    <Input name="job_title" value={formData.job_title} onChange={handleInputChange} required placeholder="e.g. Software Engineer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">System Role (Access Level) *</label>
                    <Select value={formData.role_id || "none"} onValueChange={(val) => handleSelectChange("role_id", val)}>
                      <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                        <SelectValue placeholder="Select access level..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="none" disabled>Select access level...</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Selecting "ADMIN" grants full system access.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department</label>
                    <Select value={formData.department_id || "none"} onValueChange={(val) => handleSelectChange("department_id", val)}>
                      <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="none">Select department...</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Manager</label>
                    <Select value={formData.manager_id || "none"} onValueChange={(val) => handleSelectChange("manager_id", val)}>
                      <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                        <SelectValue placeholder="Select manager..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="none">Select manager...</SelectItem>
                        {managers.map((mgr) => (
                          <SelectItem key={mgr.id} value={mgr.id.toString()}>{mgr.first_name} {mgr.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employment Type</label>
                    <Select value={formData.employment_type || "none"} onValueChange={(val) => handleSelectChange("employment_type", val)}>
                      <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="none" disabled>Select type...</SelectItem>
                        <SelectItem value="Full-Time">Full-Time</SelectItem>
                        <SelectItem value="Part-Time">Part-Time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                        <SelectItem value="Permanent">Permanent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <Select value={formData.company_name || "none"} onValueChange={(val) => handleSelectChange("company_name", val)}>
                      <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                        <SelectValue placeholder="Select company..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="none" disabled>Select company...</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.name}>{company.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={formData.status || "ACTIVE"} onValueChange={(val) => handleSelectChange("status", val)}>
                      <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PROBATION">Probation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex flex-col justify-center">
                    <label className="text-sm font-medium mb-3">Calendar Access</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="has_calendar_access"
                        name="has_calendar_access"
                        checked={formData.has_calendar_access} 
                        onChange={(e) => handleCheckedChange("has_calendar_access", e.target.checked)} 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="has_calendar_access" className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Allow access to Google Booking Calendar
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Payroll & Statutory Defaults</CardTitle>
                <CardDescription>Configure base compensation, allowances, deductions, and company contributions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Payslip Password */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary border-b pb-1">Payslip Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payslip PDF Password</label>
                      <Input name="payslip_password" value={formData.payslip_password} onChange={handleInputChange} type="text" placeholder="Custom payslip password" />
                      <p className="text-xs text-muted-foreground">If set, this password will be used to encrypt the employee's payslip PDFs instead of generating a random one.</p>
                    </div>
                  </div>
                </div>

                {/* 1. Base Compensation */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary border-b pb-1">1. Base Compensation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Base Salary *</label>
                      <Input name="base_salary" value={formData.base_salary} onChange={handleInputChange} required type="number" placeholder="e.g. 5000000" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tax Category</label>
                      <Select value={formData.tax_category || "none"} onValueChange={(val) => handleSelectChange("tax_category", val)}>
                        <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                          <SelectValue placeholder="Select tax category..." />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="none">Select tax category...</SelectItem>
                          <SelectItem value="TK0">TK0</SelectItem>
                          <SelectItem value="TK1">TK1</SelectItem>
                          <SelectItem value="TK2">TK2</SelectItem>
                          <SelectItem value="TK3">TK3</SelectItem>
                          <SelectItem value="K0">K0</SelectItem>
                          <SelectItem value="K1">K1</SelectItem>
                          <SelectItem value="K2">K2</SelectItem>
                          <SelectItem value="K3">K3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tax Percentage (%) *</label>
                      <Input name="tax_percentage" value={formData.tax_percentage} onChange={handleInputChange} required type="number" placeholder="e.g. 5" min="0" max="100" step="any" />
                    </div>
                  </div>
                </div>
                
                 {/* 2. Allowances (Earnings) */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h3 className="text-sm font-semibold text-primary border-b pb-1">2. Allowances (Earnings)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Attendance Allowance (Hardship)</label>
                      <Input name="attendance_allowance" value={formData.attendance_allowance} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Year Allowance (THR)</label>
                      <Input name="thr_allowance" value={formData.thr_allowance} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Functional Allowance</label>
                      <Input name="functional_allowance" value={formData.functional_allowance} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bonus</label>
                      <Input name="bonus" value={formData.bonus} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Meal Allowance per day</label>
                      <Input name="meal_allowance_per_day" value={formData.meal_allowance_per_day} onChange={handleInputChange} type="number" placeholder="e.g. 40000" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Work Support Allowance per day</label>
                      <Input name="work_support_allowance_per_day" value={formData.work_support_allowance_per_day} onChange={handleInputChange} type="number" placeholder="e.g. 30000" min="0" />
                    </div>
                  </div>
                </div>

                {/* 3. Deductions */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h3 className="text-sm font-semibold text-primary border-b pb-1">3. Deductions (Employee Contributions)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">BPJS TK-JHT (Employee)</label>
                      <Input name="bpjs_tk_jht" value={formData.bpjs_tk_jht} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Jaminan Pensiun Karyawan</label>
                      <Input name="jaminan_pensiun_karyawan" value={formData.jaminan_pensiun_karyawan} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">BPJS Kes-Karyawan</label>
                      <Input name="bpjs_kes_karyawan" value={formData.bpjs_kes_karyawan} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Other Deductions</label>
                      <Input name="other_deductions" value={formData.other_deductions} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                  </div>
                </div>

                {/* 4. Covered by Company */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <h3 className="text-sm font-semibold text-primary border-b pb-1">4. Covered by Company (Company Contributions)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">BPJS TK-JKK (Company)</label>
                      <Input name="bpjs_tk_jkk" value={formData.bpjs_tk_jkk} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">BPJS TK-JKM (Company)</label>
                      <Input name="bpjs_tk_jkm" value={formData.bpjs_tk_jkm} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">BPJS Kesehatan (Company)</label>
                      <Input name="bpjs_kesehatan" value={formData.bpjs_kesehatan} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">BPJS Kesehatan (Additional)</label>
                      <Input name="bpjs_kesehatan_tambahan" value={formData.bpjs_kesehatan_tambahan} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Additional Insurance</label>
                      <Input name="additional_insurance" value={formData.additional_insurance} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">BPJS TK-JHT (Company)</label>
                      <Input name="bpjs_tk_jht_company" value={formData.bpjs_tk_jht_company} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Jaminan Pensiun JP (Company)</label>
                      <Input name="jaminan_pensiun_jp" value={formData.jaminan_pensiun_jp} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Additional Coverage</label>
                      <Input name="additional_coverage" value={formData.additional_coverage} onChange={handleInputChange} type="number" placeholder="0" min="0" />
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>Account information for payroll disbursement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bank Name</label>
                    <Input name="bank_name" value={formData.bank_name} onChange={handleInputChange} placeholder="e.g. BCA, Mandiri, Citibank" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Number</label>
                    <Input name="bank_account_number" value={formData.bank_account_number} onChange={handleInputChange} type="text" placeholder="e.g. 1234567890" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Leave Balances</CardTitle>
                <CardDescription>Initial leave quotas assigned upon account creation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Annual Leave Balance (Days)</label>
                    <Input name="annual_leave" value={formData.annual_leave} onChange={handleInputChange} type="number" min="0" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">These balances can be adjusted later from the Employee Profile view.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 pt-6 mt-8 border-t border-border/50">
          <Link href="/employees">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="px-8">
            {loading ? "Creating Profile..." : "Save Employee"}
          </Button>
        </div>
      </form>
    </div>
  );
}
