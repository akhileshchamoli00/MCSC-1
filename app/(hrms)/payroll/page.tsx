"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Wallet, Loader2, Eye, PlusCircle, Users, CheckCircle, Clock, Download, Send, AlertCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
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
      const token = localStorage.getItem("hrms_token");
      if (!token) return;

      const canView = contextIsAdmin || hasPermission("payroll_management", "view");
      if (!canView) {
        router.push("/my-payroll");
        return;
      }
      setIsAdmin(true);

      const payrollRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/`, {
        headers: { "Authorization": `Bearer ${token}` }
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
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/generate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
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
    const token = localStorage.getItem("hrms_token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/${id}/download`, {
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
    const token = localStorage.getItem("hrms_token");
    const toastId = toast.loading("Finalizing payslip and encrypting PDF...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/${id}/generate-payslip`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
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
    const token = localStorage.getItem("hrms_token");
    setGeneratingAll(true);
    const toastId = toast.loading(`Finalizing all draft payslips for ${getMonthName(searchMonth)} ${searchYear}...`);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/generate-all-payslips`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground mt-1">Manage employee salaries and generate payslips.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={searchMonth.toString()}
            onValueChange={(val) => setSearchMonth(parseInt(val))}
          >
            <SelectTrigger className="h-9 w-32 bg-background border border-input text-sm shadow-sm font-medium">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent position="popper">
              {[...Array(12)].map((_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {getMonthName(i + 1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={searchYear}
            onChange={(e) => setSearchYear(parseInt(e.target.value))}
            className="w-24 h-9"
          />
          <Button onClick={handleOpenGenerateModal} className="h-9 shadow-md ml-1">
            <PlusCircle className="h-4 w-4 mr-2" /> Generate Monthly Drafts
          </Button>
        </div>
      </div>

      {isPayslipGenerationRestricted(searchMonth, searchYear) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3 text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Payroll Period Incomplete / Generation Restricted</h4>
            <p className="text-sm opacity-90 mt-0.5">
              The payroll period for {getMonthName(searchMonth)} {searchYear} is not yet complete (runs from the 27th of the last month to the 26th of the current month). Payroll generation and payslip locking are restricted until the 27th of the month.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        <Card className="border border-border/50 bg-card shadow-sm">
          <div className="py-0.5 px-3 flex items-center justify-between w-full">
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Total Employees</p>
              <p className="text-lg md:text-xl font-bold text-foreground tracking-tight">{totalEmployees}</p>
            </div>
            <Users className="w-5 h-5 text-muted-foreground/30" />
          </div>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <div className="py-0.5 px-3 flex items-center justify-between w-full">
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Payslips Generated</p>
              <p className="text-lg md:text-xl font-bold text-foreground tracking-tight">{generatedCount}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-muted-foreground/30" />
          </div>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <div className="py-0.5 px-3 flex items-center justify-between w-full">
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Pending Payroll</p>
              <p className="text-lg md:text-xl font-bold text-foreground tracking-tight">{pendingCount}</p>
            </div>
            <Clock className="w-5 h-5 text-muted-foreground/30" />
          </div>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <div className="py-0.5 px-3 flex items-center justify-between w-full">
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Current Month Payroll</p>
              <p className="text-lg md:text-xl font-bold text-foreground tracking-tight">IDR {currentMonthCost.toLocaleString()}</p>
            </div>
            <Wallet className="w-5 h-5 text-muted-foreground/30" />
          </div>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <div className="py-0.5 px-3 flex items-center justify-between w-full">
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Previous Month Payroll</p>
              <p className="text-lg md:text-xl font-bold text-foreground tracking-tight">IDR {prevMonthCost.toLocaleString()}</p>
            </div>
            <Wallet className="w-5 h-5 text-muted-foreground/30" />
          </div>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
            <CardTitle className="text-xl">Payroll Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          <Button
            onClick={() => setConfirmSendAllOpen(true)}
            className="h-9 shadow-sm shrink-0 w-full sm:w-auto"
            disabled={isPayslipGenerationRestricted(searchMonth, searchYear)}
          >
            <Send className="h-4 w-4 mr-2" /> Lock & Send All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee ID</th>
                  <th className="px-4 py-3 font-medium">Employee Name</th>
                  <th className="px-4 py-3 font-medium">Company Name</th>
                  <th className="px-4 py-3 font-medium">Month</th>
                  <th className="px-4 py-3 font-medium">Basic Salary</th>
                  <th className="px-4 py-3 font-medium">Net Salary</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      No payroll records found for {getMonthName(searchMonth)} {searchYear}.
                    </td>
                  </tr>
                ) : (
                  paginatedPayrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {payroll.employee?.employee_id_custom || `EMP${payroll.employee_id}`}
                      </td>
                      <td className="px-4 py-3">
                        {payroll.employee ? `${payroll.employee.first_name} ${payroll.employee.last_name}` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {payroll.employee?.company_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {getMonthName(payroll.payroll_month)} {payroll.payroll_year}
                      </td>
                      <td className="px-4 py-3">
                        IDR {payroll.basic_salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 font-bold text-green-600">
                        IDR {payroll.net_salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`
                          ${payroll.status === 'Draft' ? 'bg-orange-50 text-orange-600 border-orange-200' : ''}
                          ${payroll.status === 'Generated' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                          ${payroll.status === 'Paid' ? 'bg-green-50 text-green-600 border-green-200' : ''}
                        `}>
                          {payroll.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        {payroll.status === "Draft" ? (
                          <Button
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => handleSendPayslip(payroll.id)}
                            disabled={isPayslipGenerationRestricted(payroll.payroll_month, payroll.payroll_year)}
                          >
                            <Send className="h-3 w-3" /> Lock & Send
                          </Button>
                        ) : (
                          <Button size="icon" className="h-7 w-7" onClick={() => handleDownload(payroll.id, payroll.payroll_month, payroll.payroll_year, payroll.employee?.employee_id_custom || payroll.employee_id || `EMP00${payroll.employee?.id || ''}`)} title="Download Encrypted PDF">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => router.push(`/payroll/${payroll.id}`)}>
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/50 bg-transparent mt-4">
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
                  className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
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
                  className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-blue-700">
              <Send className="h-5 w-5" /> Lock & Send All Payslips
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to finalize and lock ALL Draft and Generated payslips for <strong>{getMonthName(searchMonth)} {searchYear}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            This will:
            <ul className="list-disc list-inside mt-2 text-sm space-y-1">
              <li>Generate a secure random password for each employee</li>
              <li>Encrypt all PDF payslips</li>
              <li>Send an email to each employee with their password</li>
              <li>Make the payslip visible and downloadable in their Employee Portal</li>
            </ul>
          </div>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmSendAllOpen(false)} disabled={generatingAll}>
              Cancel
            </Button>
            <Button onClick={handleSendAllPayslips} disabled={generatingAll}>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-destructive">
              <AlertCircle className="h-5 w-5" /> Payroll Generation Restricted
            </DialogTitle>
            <DialogDescription className="text-foreground pt-2">
              Payroll generation for the current month is restricted until the 27th of the month.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            The salary calculation period runs from the 27th of last month to the 26th of the current month. To prevent discrepancies, you cannot generate payroll records for the current month prior to the 27th.
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" onClick={() => setRestrictedPromptOpen(false)}>
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
