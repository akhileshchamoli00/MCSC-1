"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Save, Download, FileText, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PayrollDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);
  const [payroll, setPayroll] = useState<any>(null);

  const isPayslipGenerationRestricted = (month: number, year: number) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-indexed
    const currentDay = today.getDate();

    if (year > currentYear) return true;
    if (year === currentYear) {
      if (month > currentMonth) return true;
      if (month === currentMonth && currentDay < 27) return true;
    }
    return false;
  };
  
  // Form State
  const [form, setForm] = useState({
    tax_percentage: 0,
    meal_allowance: 0,
    work_support_allowance: 0,
    attendance_allowance: 0,
    thr_allowance: 0,
    functional_allowance: 0,
    bonus: 0,
    
    bpjs_tk_jht: 0,
    jaminan_pensiun_karyawan: 0,
    bpjs_kes_karyawan: 0,
    leave_deduction: 0,
    other_deductions: 0,
    wht_21: 0,
    
    bpjs_tk_jkk: 0,
    bpjs_tk_jkm: 0,
    bpjs_kesehatan: 0,
    bpjs_kesehatan_tambahan: 0,
    additional_insurance: 0,
    bpjs_tk_jht_company: 0,
    jaminan_pensiun_jp: 0,
    additional_coverage: 0,
    
    status: "Draft"
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("hrms_token");
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/${params.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setPayroll(data);
        setForm({
          tax_percentage: data.tax_percentage || 0,
          meal_allowance: data.meal_allowance || 0,
          work_support_allowance: data.work_support_allowance || 0,
          attendance_allowance: data.attendance_allowance || 0,
          thr_allowance: data.thr_allowance || 0,
          functional_allowance: data.functional_allowance || 0,
          bonus: data.bonus || 0,
          
          bpjs_tk_jht: data.bpjs_tk_jht || 0,
          jaminan_pensiun_karyawan: data.jaminan_pensiun_karyawan || 0,
          bpjs_kes_karyawan: data.bpjs_kes_karyawan || 0,
          leave_deduction: data.leave_deduction || 0,
          other_deductions: data.other_deductions || 0,
          wht_21: data.wht_21 || 0,
          
          bpjs_tk_jkk: data.bpjs_tk_jkk || 0,
          bpjs_tk_jkm: data.bpjs_tk_jkm || 0,
          bpjs_kesehatan: data.bpjs_kesehatan || 0,
          bpjs_kesehatan_tambahan: data.bpjs_kesehatan_tambahan || 0,
          additional_insurance: data.additional_insurance || 0,
          bpjs_tk_jht_company: data.bpjs_tk_jht_company || 0,
          jaminan_pensiun_jp: data.jaminan_pensiun_jp || 0,
          additional_coverage: data.additional_coverage || 0,
          
          status: data.status
        });
      } else {
        router.push("/payroll");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/${params.id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        toast.success("Payroll details updated successfully.");
        fetchData();
      } else {
        toast.error("Failed to update payroll.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving payroll.");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = () => {
    setRegenerateConfirmOpen(true);
  };

  const confirmRegenerate = async () => {
    setRegenerateConfirmOpen(false);
    setRegenerating(true);
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/${params.id}/regenerate`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success("Payroll recalculated successfully.");
        fetchData();
      } else {
        toast.error("Failed to recalculate payroll.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error recalculating payroll.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownload = () => {
    const token = localStorage.getItem("hrms_token");
    const toastId = toast.loading("Downloading PDF...");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/${params.id}/download`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Download failed" }));
        throw new Error(err.detail || "Failed to download PDF");
      }
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const formattedMonth = payroll.payroll_month.toString().padStart(2, '0');
      const empId = payroll.employee?.employee_id_custom || payroll.employee_id || `EMP00${payroll.employee?.id || ''}`;
      a.download = `${formattedMonth}${payroll.payroll_year}_${empId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download complete", { id: toastId });
    })
    .catch(err => {
      toast.error(err.message, { id: toastId });
    });
  };

  const getMonthName = (month: number) => {
    const date = new Date();
    date.setMonth(month - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  if (loading || !payroll) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isReadOnly = false;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto px-4 w-full">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/payroll")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Details</h1>
          <p className="text-muted-foreground mt-1">Review and update payroll records for the selected month.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Employee Info Card */}
        <Card className="col-span-1 border-border/50 shadow-sm">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Employee Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Employee Name</p>
              <p className="font-medium text-base">{payroll.employee?.first_name} {payroll.employee?.last_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Employee ID</p>
              <p className="font-medium">{payroll.employee?.employee_id_custom || `EMP${payroll.employee_id}`}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Company Name</p>
              <p className="font-medium">{payroll.employee?.company_name || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Department</p>
              <p className="font-medium">{payroll.employee?.department?.name || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Designation</p>
              <p className="font-medium">{payroll.employee?.job_title || "-"}</p>
            </div>
            <div className="pt-4 border-t border-border/50">
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Bank Account</p>
              <p className="font-medium">
                {payroll.employee?.bank_name ? `${payroll.employee.bank_name} - ${payroll.employee.bank_account_number || ''}` : "-"}
              </p>
            </div>
            <div className="pt-4 border-t border-border/50">
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Payroll Period</p>
              <p className="font-semibold text-lg text-primary">{getMonthName(payroll.payroll_month)} {payroll.payroll_year}</p>
              <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700">{payroll.status}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Card */}
        <Card className="col-span-1 md:col-span-3 border-border/50 shadow-sm">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Salary Breakdown</CardTitle>
            <Button size="sm" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" /> Download PDF Payslip
            </Button>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* Leave Data Section */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-blue-700 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Leave Data
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                <div className="bg-muted/30 p-3 rounded-md border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 h-8 flex items-center justify-center text-center">Working Days</p>
                  <p className="text-xl font-bold">{payroll.total_working_days || 0}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-md border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 h-8 flex items-center justify-center text-center">Annual Leave</p>
                  <p className="text-xl font-bold">{payroll.annual_leave_days || 0}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-md border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 h-8 flex items-center justify-center text-center">Sick Leave</p>
                  <p className="text-xl font-bold">{payroll.sick_leave_days || 0}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-md border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 h-8 flex items-center justify-center text-center">Unpaid Leave</p>
                  <p className="text-xl font-bold text-orange-600">{payroll.unpaid_leave_days || 0}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-md border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 h-8 flex items-center justify-center text-center">Emergency Leave</p>
                  <p className="text-xl font-bold text-amber-600">{payroll.emergency_leave_days || 0}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-md border border-border/50 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 h-8 flex items-center justify-center text-center">Maternity Leave</p>
                  <p className="text-xl font-bold text-pink-600">{payroll.maternity_leave_days || 0}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-md border border-primary/20 bg-primary/5 text-center">
                  <p className="text-xs text-primary uppercase tracking-wider mb-1 h-8 flex items-center justify-center text-center">Days Worked</p>
                  <p className="text-xl font-bold text-primary">{payroll.days_worked || 0}</p>
                </div>
              </div>
            </div>

            {/* Base Compensation */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-slate-800 border-b pb-2">
                1. Base Compensation
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Basic Salary</label>
                  <Input type="number" value={payroll.basic_salary} disabled className="bg-muted/50 font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tax Percentage (%)</label>
                  <Input type="number" value={form.tax_percentage} disabled={isReadOnly} step="0.1" onChange={(e) => setForm({...form, tax_percentage: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
            </div>

            {/* Earnings Section */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-green-700 border-b pb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> 2. Allowances (Earnings)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Meal Allowance</label>
                  <Input type="number" value={form.meal_allowance} disabled className="bg-muted/50 font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Work Support Allowance</label>
                  <Input type="number" value={form.work_support_allowance} disabled className="bg-muted/50 font-semibold" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Attendance Allowance (Hardship)</label>
                  <Input type="number" value={form.attendance_allowance} disabled={isReadOnly} onChange={(e) => setForm({...form, attendance_allowance: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">New Year Allowance (THR)</label>
                  <Input type="number" value={form.thr_allowance} disabled={isReadOnly} onChange={(e) => setForm({...form, thr_allowance: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Functional Allowance</label>
                  <Input type="number" value={form.functional_allowance} disabled={isReadOnly} onChange={(e) => setForm({...form, functional_allowance: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Bonus</label>
                  <Input type="number" value={form.bonus} disabled={isReadOnly} onChange={(e) => setForm({...form, bonus: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded border border-border/50 flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Gross Salary (Earnings)</span>
                <span className="font-normal text-foreground text-lg">IDR {payroll.gross_salary.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            {/* Deductions Section */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-red-700 border-b pb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> 3. Deductions (Employee Contributions)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">BPJS TK-JHT (Employee)</label>
                  <Input type="number" value={form.bpjs_tk_jht} disabled={isReadOnly} onChange={(e) => setForm({...form, bpjs_tk_jht: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Jaminan Pensiun Karyawan</label>
                  <Input type="number" value={form.jaminan_pensiun_karyawan} disabled={isReadOnly} onChange={(e) => setForm({...form, jaminan_pensiun_karyawan: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">BPJS Kes-Karyawan</label>
                  <Input type="number" value={form.bpjs_kes_karyawan} disabled={isReadOnly} onChange={(e) => setForm({...form, bpjs_kes_karyawan: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Unpaid Leave Deduction</label>
                  <Input type="number" value={form.leave_deduction} disabled={isReadOnly} onChange={(e) => setForm({...form, leave_deduction: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Other Deductions</label>
                  <Input type="number" value={form.other_deductions} disabled={isReadOnly} onChange={(e) => setForm({...form, other_deductions: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">WHT 21 (Calculated Tax)</label>
                  <Input type="number" value={form.wht_21} disabled className="bg-muted/50 font-semibold" />
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded border border-border/50 flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Total Deductions</span>
                <span className="font-normal text-foreground text-lg">IDR {payroll.total_deductions.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            {/* Covered by Company Section */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-blue-700 border-b pb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> 4. Covered by Company (Company Contributions)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">BPJS TK-JKK (Company)</label>
                  <Input type="number" value={form.bpjs_tk_jkk} disabled={isReadOnly} onChange={(e) => setForm({...form, bpjs_tk_jkk: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">BPJS TK-JKM (Company)</label>
                  <Input type="number" value={form.bpjs_tk_jkm} disabled={isReadOnly} onChange={(e) => setForm({...form, bpjs_tk_jkm: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">BPJS Kesehatan (Company)</label>
                  <Input type="number" value={form.bpjs_kesehatan} disabled={isReadOnly} onChange={(e) => setForm({...form, bpjs_kesehatan: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">BPJS Kesehatan (Additional)</label>
                  <Input type="number" value={form.bpjs_kesehatan_tambahan} disabled={isReadOnly} onChange={(e) => setForm({...form, bpjs_kesehatan_tambahan: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Additional Insurance</label>
                  <Input type="number" value={form.additional_insurance} disabled={isReadOnly} onChange={(e) => setForm({...form, additional_insurance: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">BPJS TK-JHT (Company)</label>
                  <Input type="number" value={form.bpjs_tk_jht_company} disabled={isReadOnly} onChange={(e) => setForm({...form, bpjs_tk_jht_company: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Jaminan Pensiun JP (Company)</label>
                  <Input type="number" value={form.jaminan_pensiun_jp} disabled={isReadOnly} onChange={(e) => setForm({...form, jaminan_pensiun_jp: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Additional Coverage</label>
                  <Input type="number" value={form.additional_coverage} disabled={isReadOnly} onChange={(e) => setForm({...form, additional_coverage: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded border border-border/50 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Taxable Income (Gross + Company BPJS/Ins)</span>
                  <span className="font-normal text-foreground">IDR {(payroll.taxable_income || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border/30 pt-2">
                  <span className="font-semibold text-muted-foreground">Total Company Cost (Gross + Company Contributions)</span>
                  <span className="font-normal text-foreground text-lg">IDR {(payroll.total_compensation || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>

            {/* Summary & Save */}
            <div className="pt-6 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="space-y-2 flex-1 w-full max-w-xs">
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={form.status} 
                  disabled={isReadOnly && form.status === "Paid"} 
                  onValueChange={(val) => setForm({...form, status: val})}
                >
                  <SelectTrigger className="w-full h-10 border border-input bg-background px-3 py-2 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Generated">Generated (Visible to Admin Only)</SelectItem>
                    {!isPayslipGenerationRestricted(payroll.payroll_month, payroll.payroll_year) && (
                      <SelectItem value="Paid">Paid (Visible to Employee)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {isPayslipGenerationRestricted(payroll.payroll_month, payroll.payroll_year) && (
                  <p className="text-xs text-amber-600 font-medium">
                    "Paid" status is locked for the current month until the 27th of the month.
                  </p>
                )}
              </div>

              <div className="bg-emerald-500/10 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 dark:border-emerald-500/15 flex flex-col items-end flex-1 w-full max-w-sm">
                <span className="text-sm text-emerald-800 dark:text-emerald-300 uppercase tracking-widest font-semibold mb-1">Net Salary</span>
                <span className="text-3xl font-normal text-emerald-800 dark:text-emerald-200">IDR {payroll.net_salary.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            {!isReadOnly && (
              <div className="flex justify-end pt-4 gap-3">
                <Button size="lg" onClick={handleRegenerate} disabled={regenerating || saving} className="px-6">
                  {regenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />} Regenerate Calculations
                </Button>
                <Button size="lg" onClick={handleSave} disabled={saving || regenerating} className="px-8">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />} Save Changes & Recalculate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Regenerate Confirmation Modal */}
      <Dialog open={regenerateConfirmOpen} onOpenChange={setRegenerateConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-orange-600">
              <AlertCircle className="h-5 w-5" /> Regenerate Calculations
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to recalculate this payslip?
              <br /><br />
              This will pull the latest leave requests and reset basic calculations. <strong>Manual adjustments might be overwritten.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setRegenerateConfirmOpen(false)} disabled={regenerating}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmRegenerate} disabled={regenerating}>
              {regenerating ? "Recalculating..." : "Yes, Recalculate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
