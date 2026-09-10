"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, Wallet, Lock, Mail, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function MyPayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchMyPayroll = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        if (!token) return;
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Backend already filters for the current employee and non-draft status
          setPayrolls(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyPayroll();
  }, []);

  const totalPages = Math.ceil(payrolls.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedPayrolls = payrolls.slice(startIndex, endIndex);

  const getMonthName = (month: number) => {
    const date = new Date();
    date.setDate(1); // Set day to 1 to prevent monthly overflow rollovers (e.g., Feb 31st -> March)
    date.setMonth(month - 1);
    return date.toLocaleString('default', { month: 'long' });
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
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => {
      toast.error("Download Error", { description: err.message });
    });
  };

  const handleEmailPayslip = async (id: number) => {
    const token = localStorage.getItem("hrms_token");
    const toastId = toast.loading("Emailing your payslip...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/${id}/resend-password`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Payslip Emailed", {
          id: toastId,
          description: "Your password-protected payslip and access password have been sent to your email."
        });
      } else {
        toast.error("Failed to email payslip", {
          id: toastId,
          description: "Please try again later."
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error emailing payslip", {
        id: toastId,
        description: "Please check your network connection."
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs shadow-sm backdrop-blur-sm">
        <div className="h-8 w-8 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
          <Lock className="h-4 w-4" />
        </div>
        <div>
          <strong className="text-foreground text-sm">Password Protected PDF</strong>
          <p className="text-muted-foreground mt-0.5 leading-relaxed">
            Your payslip PDF is encrypted for security. The decryption password has been emailed to your registered address.
          </p>
        </div>
      </div>

      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Wallet className="h-4 w-4 text-emerald-500" /> Salary History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Payroll Period</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-12 text-center text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                      <p className="text-xs">No payroll records available yet.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedPayrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {getMonthName(payroll.payroll_month)} {payroll.payroll_year}
                      </td>
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-lg" onClick={() => handleEmailPayslip(payroll.id)}>
                          <Mail className="h-3.5 w-3.5" /> Email Payslip
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
                <span className="font-medium text-foreground">{Math.min(payrolls.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{payrolls.length}</span> entries
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
    </div>
  );
}
