"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  History,
  Landmark,
  Zap,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/kpi-card";

function NotaryPaymentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notaryIdParam = searchParams.get("notaryId");

  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selected Notary details / history state
  const [selectedNotary, setSelectedNotary] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [jobFilter, setJobFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");

  // Manual payment registration modal state
  const [payingJob, setPayingJob] = useState<any | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    payment_ref: ""
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Xendit automated disbursement modal state
  const [disburseJob, setDisburseJob] = useState<any | null>(null);
  const [disburseNotes, setDisburseNotes] = useState("");
  const [disbursing, setDisbursing] = useState(false);
  const [missingBankModalOpen, setMissingBankModalOpen] = useState(false);

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

  // Sync state with URL query parameter (handles browser back/forward and direct links)
  useEffect(() => {
    if (notaryIdParam) {
      fetchNotaryHistory(parseInt(notaryIdParam));
    } else {
      setSelectedNotary(null);
      setJobs([]);
    }
  }, [notaryIdParam]);

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  // Handle Initiating Xendit Payout
  const handleInitiateDisburse = (job: any) => {
    if (!selectedNotary?.is_bank_configured && (!selectedNotary?.bank_name || !selectedNotary?.bank_account_number || !selectedNotary?.bank_account_holder_name)) {
      setMissingBankModalOpen(true);
      return;
    }
    setDisburseJob(job);
    setDisburseNotes(`Notary Fee ORD-${job.order_number} ${job.job_title?.slice(0, 20)}`);
  };

  // Execute Xendit Disbursement API call
  const handleConfirmDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseJob) return;
    setDisbursing(true);
    const toastId = toast.loading("Processing automated disbursement via Xendit...");
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/payments/${disburseJob.id}/disburse`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ description: disburseNotes })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(
          `Disbursement submitted! Payout ID: ${data.disbursement_id || "Completed"}`,
          { id: toastId, duration: 5000 }
        );
        setDisburseJob(null);
        fetchSummaries();
        if (selectedNotary) {
          fetchNotaryHistory(selectedNotary.id);
        }
      } else {
        const errData = await res.json();
        toast.error(errData.detail || "Disbursement failed", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "An error occurred during disbursement.", { id: toastId });
    } finally {
      setDisbursing(false);
    }
  };

  // Handle Mark as Paid (Manual)
  const handleMarkAsPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingJob) return;
    setSubmittingPayment(true);
    const toastId = toast.loading("Registering manual payment...");
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
        toast.success("Manual payment registered successfully!", { id: toastId });
        setPayingJob(null);
        setPaymentForm({
          payment_date: new Date().toISOString().split("T")[0],
          payment_ref: ""
        });
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
            {selectedNotary ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full border border-border/50 bg-background mr-1"
                onClick={() => router.push("/business/clients/orders/notary-payments")}
                title="Back to All Notaries"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Link href="/business/clients/orders">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full border border-border/50 bg-background mr-1"
                  title="Back to Active Orders"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
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
                  <th className="p-4">Bank Payout Info</th>
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
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No notary payment records found matching search query.
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((s) => (
                    <tr key={s.notary_id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{s.notary_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs">
                        {s.bank_name && s.bank_account_number ? (
                          <div>
                            <div className="flex items-center gap-1 font-semibold text-foreground">
                              <Landmark className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{s.bank_name}</span>
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] py-0 px-1 font-bold">
                                Ready
                              </Badge>
                            </div>
                            <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                              {s.bank_account_number}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] py-0.5 px-2">
                            Missing Bank Info
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 font-medium text-muted-foreground">{s.city}</td>
                      <td className="p-4 text-center font-semibold">{s.total_jobs}</td>
                      <td className="p-4 text-center">
                        {s.total_unpaid_jobs > 0 ? (
                          <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 py-0 px-2 font-mono font-bold">
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
                          onClick={() => router.push(`/business/clients/orders/notary-payments?notaryId=${s.notary_id}`)}
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
        <div className="space-y-4">
          
          {/* NOTARY BANK ACCOUNT PROFILE BANNER */}
          <div className="p-5 rounded-xl border border-border/60 bg-card/60 backdrop-blur-md shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                <Landmark className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    {selectedNotary.name} Payout Destination Account
                  </h3>
                  {selectedNotary.bank_name && selectedNotary.bank_account_number && selectedNotary.bank_account_holder_name ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] py-0.5 px-2 font-bold">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Configured for Xendit
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] py-0.5 px-2 font-bold">
                      <AlertCircle className="h-3 w-3 mr-1" /> Incomplete Bank Details
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <div>
                    <span className="font-semibold text-foreground/80">Bank:</span>{" "}
                    <span className="font-bold text-foreground">{selectedNotary.bank_name || "-"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground/80">Account No:</span>{" "}
                    <span className="font-mono font-bold text-foreground">{selectedNotary.bank_account_number || "-"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-foreground/80">Holder Name:</span>{" "}
                    <span className="font-bold text-foreground">{selectedNotary.bank_account_holder_name || "-"}</span>
                  </div>
                  {selectedNotary.bank_branch && (
                    <div>
                      <span className="font-semibold text-foreground/80">Branch:</span>{" "}
                      <span>{selectedNotary.bank_branch}</span>
                    </div>
                  )}
                  {selectedNotary.bank_swift_code && (
                    <div>
                      <span className="font-semibold text-foreground/80">SWIFT:</span>{" "}
                      <span className="font-mono uppercase">{selectedNotary.bank_swift_code}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Link href="/business/clients/notaries">
              <Button variant="outline" size="sm" className="h-9 text-xs font-bold shrink-0">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Edit Bank Details
              </Button>
            </Link>
          </div>

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
                              <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs select-none border border-emerald-500/20">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Settled</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                <Button 
                                  type="button"
                                  size="sm" 
                                  className="font-bold text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                  onClick={() => handleInitiateDisburse(j)}
                                >
                                  <Zap className="h-3.5 w-3.5 mr-1 fill-current" /> Pay via Xendit
                                </Button>
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="sm" 
                                  title="Record Manual Offline Transfer"
                                  className="font-semibold text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
                                  onClick={() => setPayingJob(j)}
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                </Button>
                              </div>
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
        </div>
      )}

      {/* XENDIT AUTOMATED DISBURSEMENT CONFIRMATION MODAL */}
      <Dialog open={disburseJob !== null} onOpenChange={(open) => !open && setDisburseJob(null)}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleConfirmDisburse}>
            <DialogHeader>
              <DialogTitle className="font-bold text-lg flex items-center gap-2 text-foreground">
                <Zap className="h-5 w-5 text-emerald-600 fill-current" /> Confirm Xendit Automated Payout
              </DialogTitle>
              <DialogDescription>
                Execute direct bank transfer to notary <strong>{selectedNotary?.name}</strong> using Xendit Payouts.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Payment Summary Box */}
              <div className="p-4 rounded-xl bg-muted/30 border space-y-2.5 text-xs">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground font-semibold">Recipient Notary:</span>
                  <span className="font-bold text-foreground">{selectedNotary?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground font-semibold">Destination Bank:</span>
                  <span className="font-bold text-foreground">{selectedNotary?.bank_name}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground font-semibold">Account Number:</span>
                  <span className="font-mono font-bold text-foreground">{selectedNotary?.bank_account_number}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground font-semibold">Account Holder Name:</span>
                  <span className="font-bold text-foreground">{selectedNotary?.bank_account_holder_name}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground font-semibold">Order / Job:</span>
                  <span className="font-semibold text-foreground">
                    {disburseJob?.job_title} ({disburseJob?.order_number})
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground font-bold text-sm">Disbursement Amount:</span>
                  <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(disburseJob?.notary_fee)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Disbursement Description / Memo
                </label>
                <Input 
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  placeholder="e.g. Notary Fee ORD-260001"
                  className="bg-background"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDisburseJob(null)} disabled={disbursing}>
                Cancel
              </Button>
              <Button type="submit" disabled={disbursing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                {disbursing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing via Xendit...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-current" />
                    Send Payout via Xendit
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MISSING BANK DETAILS ALERT MODAL */}
      <Dialog open={missingBankModalOpen} onOpenChange={setMissingBankModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Bank Information Missing
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Cannot initiate automated disbursement for <strong>{selectedNotary?.name}</strong>. 
              The notary profile is missing required bank credentials (Bank Name, Account Number, or Account Holder Name).
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
            Please navigate to the Notaries directory, edit the notary profile, and configure the <strong>Bank Details</strong> tab.
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setMissingBankModalOpen(false)}>
              Close
            </Button>
            <Link href="/business/clients/notaries">
              <Button className="font-bold">
                Go to Notaries Directory
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MANUAL REGISTER PAYOUT DIALOG MODAL */}
      <Dialog open={payingJob !== null} onOpenChange={(open) => !open && setPayingJob(null)}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleMarkAsPaid}>
            <DialogHeader>
              <DialogTitle className="font-bold text-lg">Record Manual Notary Payout</DialogTitle>
              <DialogDescription>
                Register an offline payment (cash / manual bank transfer) made for job <strong>{payingJob?.job_title}</strong> (Order <strong>{payingJob?.order_number}</strong>).
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
                  placeholder="e.g. Manual Bank Transfer ID, Receipt Code..."
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
                {submittingPayment ? "Registering..." : "Confirm Manual Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default function NotaryPaymentsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading Notary Payments Summary...</p>
      </div>
    }>
      <NotaryPaymentsContent />
    </Suspense>
  );
}
