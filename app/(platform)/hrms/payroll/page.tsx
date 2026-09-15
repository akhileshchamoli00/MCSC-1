"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { FileText, Wallet, Loader2, Eye, PlusCircle, Users, CheckCircle, Clock, Download, Send, AlertCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProvider, useUser } from "@/contexts/user-context";

export default function AdminPayrollPage() {
  const router = useRouter();
  const { hasPermission, isAdmin: contextIsAdmin } = useUser();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmSendAllOpen, setConfirmSendAllOpen] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [restrictedPromptOpen, setRestrictedPromptOpen] = useState(false);

  // Search State
  const [searchMonth, setSearchMonth] = useState(() => {
    const today = new Date();
    return today.getDate() < 27 ? (today.getMonth() === 0 ? 12 : today.getMonth()) : today.getMonth() + 1;
  });
  const [searchYear, setSearchYear] = useState(() => {
    const today = new Date();
    return (today.getDate() < 27 && today.getMonth() === 0) ? today.getFullYear() - 1 : today.getFullYear();
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchMonth, searchYear]);

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

  const handleOpenGenerateModal = () => {
    if (isPayslipGenerationRestricted(searchMonth, searchYear)) {
      setRestrictedPromptOpen(true);
      return;
    }
    handleGeneratePayroll(false);
  };

  // Publish/Generate State
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const canView = contextIsAdmin || hasPermission("payroll_management", "view");
      if (!canView) {
        router.push("/my-payroll");
        return;
      }
      setIsAdmin(true);

      const payrollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/`, {
      credentials: "include",
        });
      if (payrollRes.ok) {
        setPayrolls(await payrollRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch payroll", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMonthName = (month: number) => {
    const date = new Date();
    date.setDate(1); // Set day to 1 to prevent monthly overflow rollovers (e.g., Feb 31st -> March)
    date.setMonth(month - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const handleGeneratePayroll = async (overwrite: boolean = false) => {
    if (isPayslipGenerationRestricted(searchMonth, searchYear)) {
      setRestrictedPromptOpen(true);
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("Generating monthly payroll drafts...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/generate`, {
      credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          month: searchMonth,
          year: searchYear,
          overwrite: overwrite
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Generation Complete", {
          id: toastId,
          description: data.message || "Payroll drafts generated successfully."
        });
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error("Failed to generate payroll", {
          id: toastId,
          description: errorData.detail || "An error occurred."
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", {
        id: toastId,
        description: "Error generating payroll. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (id: number, month: number, year: number, empId: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/${id}/download`, {
      credentials: "include",
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
        const formattedMonth = month.toString().padStart(2, '0');
        a.download = `${formattedMonth}${year}_${empId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        toast.error("Download Error", { description: err.message });
      });
  };

  const handleSendPayslip = async (id: number) => {
    const toastId = toast.loading("Finalizing payslip and encrypting PDF...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/${id}/generate-payslip`, {
      credentials: "include",
        method: "POST",
        });
      if (res.ok) {
        toast.success("Payslip finalized", {
          id: toastId,
          description: "Password has been securely generated and emailed to the employee."
        });
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error("Failed to finalize payslip", {
          id: toastId,
          description: errorData.detail || "An error occurred."
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error finalizing payslip", {
        id: toastId,
        description: "Please check your network connection and try again."
      });
    }
  };

  const handleSendAllPayslips = async () => {
    setGeneratingAll(true);
    const toastId = toast.loading(`Finalizing all draft payslips for ${getMonthName(searchMonth)} ${searchYear}...`);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/generate-all-payslips`, {
      credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ month: searchMonth, year: searchYear })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Bulk Generate Complete", {
          id: toastId,
          description: data.message
        });
        setConfirmSendAllOpen(false);
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error("Failed to process", {
          id: toastId,
          description: errorData.detail || "An error occurred during bulk processing."
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error", {
        id: toastId,
        description: "Please check your network connection and try again."
      });
    } finally {
      setGeneratingAll(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) return null; // Wait for redirect

  // Calculate Summary Data
  const currentMonthPayrolls = payrolls.filter(p => p.payroll_month === searchMonth && p.payroll_year === searchYear);
  const filteredPayrolls = currentMonthPayrolls.filter((payroll) => {
    const empName = `${payroll.employee?.first_name} ${payroll.employee?.last_name || ""}`.trim();
    const empId = payroll.employee?.employee_id_custom || "";
    const companyName = payroll.employee?.company_name || "";
    return `${empName} ${empId} ${companyName}`.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const totalPages = Math.ceil(filteredPayrolls.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedPayrolls = filteredPayrolls.slice(startIndex, endIndex);
  const totalEmployees = currentMonthPayrolls.length;
  const currentMonthCost = currentMonthPayrolls.reduce((sum, p) => sum + p.net_salary, 0);
  const generatedCount = currentMonthPayrolls.filter(p => p.status === "Paid").length;
  const pendingCount = currentMonthPayrolls.filter(p => p.status === "Draft" || p.status === "Generated").length;

  // Previous Month Cost Calculation
  const prevMonth = searchMonth === 1 ? 12 : searchMonth - 1;
  const prevYear = searchMonth === 1 ? searchYear - 1 : searchYear;
  const prevMonthPayrolls = payrolls.filter(p => p.payroll_month === prevMonth && p.payroll_year === prevYear);
  const prevMonthCost = prevMonthPayrolls.reduce((sum, p) => sum + p.net_salary, 0);

  return (
    <div className="space-y-6">
      {/* MINIMALIST METRIC RIBBON & ACTION CONTROLS */}
      <div className="flex flex-col lg:flex-row items-stretch gap-3 w-full">
        {/* 5-Column Minimalist Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Staff */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Staff</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalEmployees}</p>
            </div>
          </div>

          {/* Paid / Generated */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Paid / Generated</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{generatedCount}</p>
            </div>
          </div>

          {/* Pending */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Pending</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{pendingCount}</p>
            </div>
          </div>

          {/* Current Cost */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Current Cost</p>
              <p className="text-sm sm:text-base font-bold text-foreground leading-tight truncate">IDR {currentMonthCost.toLocaleString()}</p>
            </div>
          </div>

          {/* Prev Month */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Prev Month</p>
              <p className="text-sm sm:text-base font-bold text-foreground leading-tight truncate">IDR {prevMonthCost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Aligned Period Controls & Generate Button */}
        <div className="flex items-center gap-2 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-1.5 px-3 shadow-xs shrink-0 flex-wrap sm:flex-nowrap min-h-[48px]">
          <Select
            value={searchMonth.toString()}
            onValueChange={(val) => setSearchMonth(parseInt(val))}
          >
            <SelectTrigger className="h-9 w-32 rounded-xl bg-background/80 border-border/50 text-xs font-semibold">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent position="popper" className="rounded-xl">
              {[...Array(12)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()} className="text-xs">
                  {getMonthName(i + 1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={searchYear}
            onChange={(e) => setSearchYear(parseInt(e.target.value))}
            className="w-20 h-9 rounded-xl bg-background/80 border-border/50 text-xs font-semibold"
          />
          <Button 
            onClick={handleOpenGenerateModal} 
            className="h-9 gap-2 font-bold shadow-sm rounded-xl px-4 text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all shrink-0 cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" /> Generate Drafts
          </Button>
        </div>
      </div>

      {isPayslipGenerationRestricted(searchMonth, searchYear) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <h4 className="font-bold text-xs">Payroll Period Incomplete / Generation Restricted</h4>
            <p className="text-xs opacity-90 mt-0.5">
              The payroll period for {getMonthName(searchMonth)} {searchYear} is not yet complete (runs from the 27th of the last month to the 26th of the current month). Payroll generation and payslip locking are restricted until the 27th of the month.
            </p>
          </div>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employee name, ID, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
          />
        </div>
        <Button
          onClick={() => setConfirmSendAllOpen(true)}
          className="h-10 gap-2 font-bold shadow-sm rounded-xl px-4 text-xs shrink-0"
          disabled={isPayslipGenerationRestricted(searchMonth, searchYear)}
        >
          <Send className="h-3.5 w-3.5" /> Lock & Send All
        </Button>
      </div>

      {/* Payroll Table Card */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee ID</th>
                  <th className="px-5 py-3.5">Employee Name</th>
                  <th className="px-5 py-3.5">Company Name</th>
                  <th className="px-5 py-3.5">Month</th>
                  <th className="px-5 py-3.5">Basic Salary</th>
                  <th className="px-5 py-3.5">Net Salary</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                      <p className="text-xs">No payroll records found for {getMonthName(searchMonth)} {searchYear}.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedPayrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4">
                        <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2.5 py-0.5 rounded-md inline-block">
                          {payroll.employee?.employee_id_custom || `EMP${payroll.employee_id}`}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {payroll.employee ? `${payroll.employee.first_name} ${payroll.employee.last_name}` : "-"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs font-medium">
                        {payroll.employee?.company_name || "-"}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {getMonthName(payroll.payroll_month)} {payroll.payroll_year}
                      </td>
                      <td className="px-5 py-4 font-medium text-muted-foreground text-xs">
                        IDR {payroll.basic_salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        IDR {payroll.net_salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4">
                        {payroll.status === 'Draft' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Draft
                          </span>
                        )}
                        {payroll.status === 'Generated' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Generated
                          </span>
                        )}
                        {payroll.status === 'Paid' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {payroll.status === "Draft" ? (
                          <Button
                            size="sm"
                            className="h-8 gap-1.5 text-xs font-semibold rounded-lg"
                            onClick={() => handleSendPayslip(payroll.id)}
                            disabled={isPayslipGenerationRestricted(payroll.payroll_month, payroll.payroll_year)}
                          >
                            <Send className="h-3 w-3" /> Lock & Send
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => handleDownload(payroll.id, payroll.payroll_month, payroll.payroll_year, payroll.employee?.employee_id_custom || payroll.employee_id || `EMP00${payroll.employee?.id || ''}`)} title="Download Encrypted PDF">
                            <Download className="h-3.5 w-3.5 text-foreground" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-lg" onClick={() => router.push(`/payroll/${payroll.id}`)}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border/40 bg-muted/10">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(filteredPayrolls.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{filteredPayrolls.length}</span> entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs rounded-lg border-border/50"
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 text-xs rounded-lg border-border/50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lock & Send All Modal */}
      <Dialog open={confirmSendAllOpen} onOpenChange={setConfirmSendAllOpen}>
        <DialogContent className="sm:max-w-md border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Send className="h-5 w-5 text-emerald-500" /> Lock & Send All Payslips
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Are you sure you want to finalize and lock ALL Draft and Generated payslips for <strong>{getMonthName(searchMonth)} {searchYear}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 text-xs text-muted-foreground">
            This will:
            <ul className="list-disc list-inside mt-2 text-xs space-y-1 text-foreground font-medium">
              <li>Generate a secure random password for each employee</li>
              <li>Encrypt all PDF payslips</li>
              <li>Send an email to each employee with their password</li>
              <li>Make the payslip visible and downloadable in their Employee Portal</li>
            </ul>
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 mt-2 flex gap-2 sm:justify-end">
            <Button variant="outline" className="rounded-xl" onClick={() => setConfirmSendAllOpen(false)} disabled={generatingAll}>
              Cancel
            </Button>
            <Button className="rounded-xl font-bold" onClick={handleSendAllPayslips} disabled={generatingAll}>
              {generatingAll ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                "Confirm & Send All"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restricted Generation Prompt Modal */}
      <Dialog open={restrictedPromptOpen} onOpenChange={setRestrictedPromptOpen}>
        <DialogContent className="sm:max-w-md border border-rose-200 dark:border-rose-950/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-destructive">
              <AlertCircle className="h-5 w-5 text-rose-500" /> Payroll Generation Restricted
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground pt-2 font-medium">
              Payroll generation for the current month is restricted until the 27th of the month.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 text-xs text-muted-foreground leading-relaxed">
            The salary calculation period runs from the 27th of last month to the 26th of the current month. To prevent discrepancies, you cannot generate payroll records for the current month prior to the 27th.
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 mt-2">
            <Button type="button" className="rounded-xl" onClick={() => setRestrictedPromptOpen(false)}>
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
