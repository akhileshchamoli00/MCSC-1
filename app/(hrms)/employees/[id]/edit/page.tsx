"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    profile_photo: "",
    first_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    email: "", // Read-only for edit
    phone: "",
    address: "",
    emergency_contact: "",
    employee_id_custom: "",
    bank_name: "",
    bank_account_number: "",
    hire_date: "",
    job_title: "",
    company_name: "",
    department_id: "",
    manager_id: "",
    employment_type: "",
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
    status: "ACTIVE",
    role_id: "", // Read-only for edit
    payslip_password: "",
    meal_allowance_per_day: "40000",
    work_support_allowance_per_day: "30000"
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("hrms_token");
      if (!token) return;
      try {
        const [deptRes, empRes, employeeRes, companyRes, roleRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (deptRes.ok) setDepartments(await deptRes.json());
        if (empRes.ok) setManagers(await empRes.json());
        if (companyRes.ok) setCompanies(await companyRes.json());
        if (roleRes.ok) setRoles(await roleRes.json());
        
        if (employeeRes.ok) {
          const empData = await employeeRes.json();
          setFormData({
            profile_photo: empData.profile_photo || "",
            first_name: empData.first_name || "",
            last_name: empData.last_name || "",
            gender: empData.gender || "",
            date_of_birth: empData.date_of_birth ? empData.date_of_birth.split("T")[0] : "",
            email: empData.user?.email || "",
            phone: empData.phone || "",
            address: empData.address || "",
            emergency_contact: empData.emergency_contact || "",
            employee_id_custom: empData.employee_id_custom || "",
            bank_name: empData.bank_name || "",
            bank_account_number: empData.bank_account_number || "",
            hire_date: empData.hire_date ? empData.hire_date.split("T")[0] : "",
            job_title: empData.job_title || "",
            company_name: empData.company_name || "",
            department_id: empData.department_id?.toString() || "",
            manager_id: empData.manager_id?.toString() || "",
            employment_type: empData.employment_type || "",
            base_salary: empData.base_salary?.toString() || "",
            tax_percentage: empData.tax_percentage?.toString() || "",
            attendance_allowance: empData.attendance_allowance?.toString() || "",
            thr_allowance: empData.thr_allowance?.toString() || "",
            functional_allowance: empData.functional_allowance?.toString() || "",
            bonus: empData.bonus?.toString() || "",
            bpjs_tk_jht: empData.bpjs_tk_jht?.toString() || "",
            jaminan_pensiun_karyawan: empData.jaminan_pensiun_karyawan?.toString() || "",
            bpjs_kes_karyawan: empData.bpjs_kes_karyawan?.toString() || "",
            other_deductions: empData.other_deductions?.toString() || "",
            bpjs_tk_jkk: empData.bpjs_tk_jkk?.toString() || "",
            bpjs_tk_jkm: empData.bpjs_tk_jkm?.toString() || "",
            bpjs_kesehatan: empData.bpjs_kesehatan?.toString() || "",
            bpjs_kesehatan_tambahan: empData.bpjs_kesehatan_tambahan?.toString() || "",
            additional_insurance: empData.additional_insurance?.toString() || "",
            bpjs_tk_jht_company: empData.bpjs_tk_jht_company?.toString() || "",
            jaminan_pensiun_jp: empData.jaminan_pensiun_jp?.toString() || "",
            additional_coverage: empData.additional_coverage?.toString() || "",
            tax_category: empData.tax_category || "",
            status: empData.status || "ACTIVE",
            role_id: empData.user?.role_id?.toString() || "",
            payslip_password: empData.payslip_password || "",
            meal_allowance_per_day: empData.meal_allowance_per_day?.toString() || "40000",
            work_support_allowance_per_day: empData.work_support_allowance_per_day?.toString() || "30000"
          });
        } else {
          setError("Failed to load employee data");
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
        setError("Network error occurred while loading data");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [employeeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value === "none" ? "" : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("hrms_token");
      if (!token) throw new Error("Authentication token not found. Please log in again.");

      // For edit, we update the employee profile and optionally the User account role.
      const employeePayload: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        job_title: formData.job_title,
        company_name: formData.company_name,
        hire_date: formData.hire_date,
        status: formData.status
      };

      if (formData.role_id) employeePayload.role_id = parseInt(formData.role_id);

      if (formData.profile_photo) employeePayload.profile_photo = formData.profile_photo;
      if (formData.gender) employeePayload.gender = formData.gender;
      if (formData.date_of_birth) employeePayload.date_of_birth = formData.date_of_birth;
      if (formData.phone) employeePayload.phone = formData.phone;
      if (formData.address) employeePayload.address = formData.address;
      if (formData.emergency_contact) employeePayload.emergency_contact = formData.emergency_contact;
      if (formData.employee_id_custom) employeePayload.employee_id_custom = formData.employee_id_custom;
      if (formData.bank_name) employeePayload.bank_name = formData.bank_name;
      if (formData.bank_account_number) employeePayload.bank_account_number = formData.bank_account_number;
      if (formData.department_id) employeePayload.department_id = parseInt(formData.department_id);
      if (formData.manager_id) employeePayload.manager_id = parseInt(formData.manager_id);
      if (formData.employment_type) employeePayload.employment_type = formData.employment_type;
      if (formData.base_salary !== "") employeePayload.base_salary = parseFloat(formData.base_salary);
      if (formData.tax_percentage !== "") employeePayload.tax_percentage = parseFloat(formData.tax_percentage);
      employeePayload.tax_category = formData.tax_category || null;
      employeePayload.payslip_password = formData.payslip_password || null;
      if (formData.meal_allowance_per_day !== "") employeePayload.meal_allowance_per_day = parseFloat(formData.meal_allowance_per_day);
      if (formData.work_support_allowance_per_day !== "") employeePayload.work_support_allowance_per_day = parseFloat(formData.work_support_allowance_per_day);
      if (formData.attendance_allowance !== "") employeePayload.attendance_allowance = parseFloat(formData.attendance_allowance);
      if (formData.thr_allowance !== "") employeePayload.thr_allowance = parseFloat(formData.thr_allowance);
      if (formData.functional_allowance !== "") employeePayload.functional_allowance = parseFloat(formData.functional_allowance);
      if (formData.bonus !== "") employeePayload.bonus = parseFloat(formData.bonus);
      
      if (formData.bpjs_tk_jht !== "") employeePayload.bpjs_tk_jht = parseFloat(formData.bpjs_tk_jht);
      if (formData.jaminan_pensiun_karyawan !== "") employeePayload.jaminan_pensiun_karyawan = parseFloat(formData.jaminan_pensiun_karyawan);
      if (formData.bpjs_kes_karyawan !== "") employeePayload.bpjs_kes_karyawan = parseFloat(formData.bpjs_kes_karyawan);
      if (formData.other_deductions !== "") employeePayload.other_deductions = parseFloat(formData.other_deductions);
      
      if (formData.bpjs_tk_jkk !== "") employeePayload.bpjs_tk_jkk = parseFloat(formData.bpjs_tk_jkk);
      if (formData.bpjs_tk_jkm !== "") employeePayload.bpjs_tk_jkm = parseFloat(formData.bpjs_tk_jkm);
      if (formData.bpjs_kesehatan !== "") employeePayload.bpjs_kesehatan = parseFloat(formData.bpjs_kesehatan);
      if (formData.bpjs_kesehatan_tambahan !== "") employeePayload.bpjs_kesehatan_tambahan = parseFloat(formData.bpjs_kesehatan_tambahan);
      if (formData.additional_insurance !== "") employeePayload.additional_insurance = parseFloat(formData.additional_insurance);
      if (formData.bpjs_tk_jht_company !== "") employeePayload.bpjs_tk_jht_company = parseFloat(formData.bpjs_tk_jht_company);
      if (formData.jaminan_pensiun_jp !== "") employeePayload.jaminan_pensiun_jp = parseFloat(formData.jaminan_pensiun_jp);
      if (formData.additional_coverage !== "") employeePayload.additional_coverage = parseFloat(formData.additional_coverage);

      const empResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(employeePayload)
      });

      if (!empResponse.ok) {
        const err = await empResponse.json();
        throw new Error(`Profile Update Failed: ${err.detail || "Unknown error"}`);
      }

      router.push("/employees");
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading employee data...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Employee Profile</h1>
          <p className="text-muted-foreground mt-1">Update information for {formData.first_name} {formData.last_name}.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Details */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
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
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input disabled name="email" value={formData.email} onChange={handleInputChange} required type="email" placeholder="john.doe@mcs-consulting.com" className="bg-muted" title="Email cannot be changed here" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="+62 812 3456 7890" />
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

        {/* Bank Details */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bank Name</label>
                <Input name="bank_name" value={formData.bank_name} onChange={handleInputChange} placeholder="e.g. BCA, Mandiri" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Number</label>
                <Input name="bank_account_number" value={formData.bank_account_number} onChange={handleInputChange} placeholder="Account number" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee ID</label>
                <Input name="employee_id_custom" value={formData.employee_id_custom} onChange={handleInputChange} placeholder="e.g. EMP-001" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Join Date *</label>
                <Input name="hire_date" value={formData.hire_date} onChange={handleInputChange} required type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Designation (Job Title) *</label>
                <Input name="job_title" value={formData.job_title} onChange={handleInputChange} required placeholder="e.g. Software Engineer" />
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
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Details */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Payroll & Statutory Defaults (Recurring)</CardTitle>
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
                  <label className="text-sm font-medium">Base Salary</label>
                  <Input name="base_salary" value={formData.base_salary} onChange={handleInputChange} type="number" placeholder="e.g. 5000000" min="0" />
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
                  <label className="text-sm font-medium">Tax Percentage (%)</label>
                  <Input name="tax_percentage" value={formData.tax_percentage} onChange={handleInputChange} type="number" placeholder="e.g. 5" min="0" max="100" step="any" />
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

        <div className="pt-2 flex justify-end gap-3 sticky bottom-4">
          <Link href="/employees">
            <Button variant="outline" type="button" className="bg-background">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="px-8 shadow-md">
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
