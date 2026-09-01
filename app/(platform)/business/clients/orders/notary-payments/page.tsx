"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Scale, 
  Search, 
  Loader2, 
  ArrowLeft, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Calendar, 
  CreditCard, 
  History 
} from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/kpi-card";

export default function NotaryPaymentsPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selected Notary details / history state
  const [selectedNotary, setSelectedNotary] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [jobFilter, setJobFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");

  // Payment registration modal state
  const [payingJob, setPayingJob] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    payment_ref: ""
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Fetch summaries
  const fetchSummaries = async () => {
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/payments/summary`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setSummaries(await res.json());
      }
    } catch (err) {
      console.error("Failed to load summaries", err);
      toast.error("Failed to fetch notary payments summary");
    } finally {
      setLoading(false);
    }
  };

  // Fetch details for selected notary
  const fetchNotaryHistory = async (notaryId: number) => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/payments/${notaryId}/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedNotary(data.notary);
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error("Failed to load history", err);
      toast.error("Failed to load notary job history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaries();
  }, []);

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  // Handle Mark as Paid
  const handleMarkAsPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingJob) return;
    setSubmittingPayment(true);
    const toastId = toast.loading("Registering payment...");
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/payments/${payingJob.id}/pay`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(paymentForm)
      });
      if (res.ok) {
        toast.success("Payment registered successfully!", { id: toastId });
        setPayingJob(null);
        setPaymentForm({
          payment_date: new Date().toISOString().split("T")[0],
          payment_ref: ""
        });
        // Reload summary & details
        fetchSummaries();
        if (selectedNotary) {
          fetchNotaryHistory(selectedNotary.id);
        }
      } else {
        const errData = await res.json();
        toast.error(errData.detail || "Failed to register payment", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.", { id: toastId });
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle Mark as Unpaid
  const handleMarkAsUnpaid = async (jobId: number) => {
    const toastId = toast.loading("Reverting payment status...");
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/payments/${jobId}/unpay`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Payment status reverted to unpaid", { id: toastId });
        fetchSummaries();
        if (selectedNotary) {
          fetchNotaryHistory(selectedNotary.id);
        }
      } else {
        const errData = await res.json();
        toast.error(errData.detail || "Failed to revert payment", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.", { id: toastId });
    }
  };

  // KPI calculations
  const totalCost = summaries.reduce((sum, s) => sum + s.total_earned, 0);
  const totalPaid = summaries.reduce((sum, s) => sum + s.total_paid, 0);
  const totalOutstanding = summaries.reduce((sum, s) => sum + s.total_outstanding, 0);
  const activeNotariesCount = summaries.length;

  const filteredSummaries = summaries.filter(s => 
    s.notary_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(j => {
    if (jobFilter === "PAID") return j.notary_payment_status === "PAID";
    if (jobFilter === "UNPAID") return j.notary_payment_status !== "PAID";
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading Notary Payments Summary...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            {selectedNotary && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full border border-border/50 bg-background mr-1"
                onClick={() => setSelectedNotary(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedNotary ? `Payment History - ${selectedNotary.name}` : "Notary Payments"}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {selectedNotary 
              ? `Manage and audit payment registry records for ${selectedNotary.name} (${selectedNotary.city}).` 
              : "Audit job counts, calculate fees owed, and register payments made to notaries."}
          </p>
        </div>
      </div>

      {/* DYNAMIC KPI SUMMARY CARDS */}
      {!selectedNotary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard title="Total Notary Cost" value={formatCurrency(totalCost)} icon={DollarSign} colorTheme="sky" />
          <KpiCard title="Paid Amount" value={formatCurrency(totalPaid)} icon={CheckCircle} colorTheme="emerald" />
          <KpiCard title="Outstanding Balance" value={formatCurrency(totalOutstanding)} icon={Clock} colorTheme="amber" />
          <KpiCard title="Notaries Panel" value={activeNotariesCount} icon={Scale} colorTheme="indigo" />
        </div>
      )}

      {selectedNotary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard 
            title="Total Earned" 
            value={formatCurrency(summaries.find(s => s.notary_id === selectedNotary.id)?.total_earned)} 
            icon={DollarSign} 
            colorTheme="sky" 
          />
          <KpiCard 
            title="Total Paid" 
            value={formatCurrency(summaries.find(s => s.notary_id === selectedNotary.id)?.total_paid)} 
            icon={CheckCircle} 
            colorTheme="emerald" 
          />
          <KpiCard 
            title="Outstanding" 
            value={formatCurrency(summaries.find(s => s.notary_id === selectedNotary.id)?.total_outstanding)} 
            icon={Clock} 
            colorTheme="amber" 
          />
          <KpiCard 
            title="Total Assigned Jobs" 
            value={jobs.length} 
            icon={Scale} 
            colorTheme="purple" 
          />
        </div>
      )}

      {/* DASHBOARD DETAILS VIEWS */}
      {!selectedNotary ? (
        <div className="glass-card rounded-xl overflow-hidden">
          
          {/* Filtering bar */}
          <div className="p-4 border-b border-border/30 bg-muted/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by notary name or location..."
                className="pl-9 h-9 text-xs bg-background shadow-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
              Showing {filteredSummaries.length} entries
            </span>
          </div>

          {/* Summaries list */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50 font-semibold tracking-wider">
                <tr>
                  <th className="p-4">Notary Public</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-center">Total Jobs</th>
                  <th className="p-4 text-center">Unpaid Jobs</th>
                  <th className="p-4 text-right">Total Owed</th>
                  <th className="p-4 text-right">Total Paid</th>
                  <th className="p-4 text-right text-amber-600 dark:text-amber-400">Outstanding</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No notary payment records found matching search query.
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((s) => (
                    <tr key={s.notary_id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold text-foreground flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground shrink-0" />
                        {s.notary_name}
                      </td>
                      <td className="p-4 font-medium text-muted-foreground">{s.city}</td>
                      <td className="p-4 text-center font-semibold">{s.total_jobs}</td>
                      <td className="p-4 text-center">
                        {s.total_unpaid_jobs > 0 ? (
                          <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 py-0 px-2 font-mono">
                            {s.total_unpaid_jobs} unpaid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 py-0 px-2">
                            Clean
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono font-medium">{formatCurrency(s.total_earned)}</td>
                      <td className="p-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(s.total_paid)}</td>
                      <td className="p-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">{formatCurrency(s.total_outstanding)}</td>
                      <td className="p-4 text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="font-bold text-xs h-8"
                          onClick={() => fetchNotaryHistory(s.notary_id)}
                        >
                          <History className="h-3.5 w-3.5 mr-1 text-primary" /> Manage Payments
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden animate-in fade-in duration-300">
          
          {/* Header Action / Filter controls */}
          <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 shadow-xs font-bold"
                onClick={() => setSelectedNotary(null)}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Summary
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Show:</span>
              <div className="flex rounded-lg border border-border/60 p-0.5 bg-background shadow-xs">
                {(["ALL", "UNPAID", "PAID"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setJobFilter(mode)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      jobFilter === mode 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode === "ALL" ? "All Jobs" : mode === "PAID" ? "Paid" : "Owed/Unpaid"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Job List */}
          {historyLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Loading job history...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50 font-semibold tracking-wider">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Client Company</th>
                    <th className="p-4">Service Description</th>
                    <th className="p-4 text-right">Notary Fee</th>
                    <th className="p-4 text-center">Lifecycle</th>
                    <th className="p-4 text-center">Payout Status</th>
                    <th className="p-4">Paid Reference</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No jobs found matching active filter category.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((j) => (
                      <tr key={j.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4 font-mono font-bold text-xs">{j.order_number}</td>
                        <td className="p-4 font-medium text-foreground">{j.company_name}</td>
                        <td className="p-4">
                          <div className="font-semibold text-foreground text-xs leading-normal">{j.job_title}</div>
                        </td>
                        <td className="p-4 text-right font-mono font-bold">{formatCurrency(j.notary_fee)}</td>
                        <td className="p-4 text-center">
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0.5 px-2">
                            {j.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          {j.notary_payment_status === "PAID" ? (
                            <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 py-0.5 px-2 font-semibold">
                              PAID
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 py-0.5 px-2 font-semibold">
                              UNPAID
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-xs">
                          {j.notary_payment_status === "PAID" ? (
                            <div className="space-y-0.5 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{j.notary_payment_date}</span>
                              </div>
                              {j.notary_payment_ref && (
                                <div className="flex items-center gap-1 font-mono text-[10px]">
                                  <CreditCard className="h-3 w-3" />
                                  <span>{j.notary_payment_ref}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30 font-medium italic">-</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {j.notary_payment_status === "PAID" ? (
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm" 
                              className="font-bold text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              onClick={() => handleMarkAsUnpaid(j.id)}
                            >
                              Reset Unpaid
                            </Button>
                          ) : (
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm" 
                              className="font-bold text-xs h-8 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500/20 shadow-xs"
                              onClick={() => setPayingJob(j)}
                            >
                              Register Payout
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REGISTER PAYOUT DIALOG MODAL */}
      <Dialog open={payingJob !== null} onOpenChange={(open) => !open && setPayingJob(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleMarkAsPaid}>
            <DialogHeader>
              <DialogTitle className="font-bold text-lg">Register Notary Payout</DialogTitle>
              <DialogDescription>
                Register payment made for job <strong>{payingJob?.job_title}</strong> (Order <strong>{payingJob?.order_number}</strong>). This updates accounting tracking history.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/20 border rounded-lg flex items-center justify-between font-mono text-xs">
                <span className="text-muted-foreground font-semibold">Total Owed:</span>
                <span className="font-extrabold text-sm text-foreground">{formatCurrency(payingJob?.notary_fee)}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date"
                    required
                    className="pl-9 bg-background"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Reference / Notes</label>
                <Input 
                  placeholder="e.g. Bank Transfer ID, Receipt Code, check number..."
                  className="bg-background"
                  value={paymentForm.payment_ref}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_ref: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayingJob(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingPayment} className="font-bold">
                {submittingPayment ? "Registering..." : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
