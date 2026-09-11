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
  AlertCircle,
  FileText,
  Mail,
  Download,
  Send,
  Printer,
  X,
  FileCheck,
  Building,
  FileDown,
  Lock,
  MailCheck
} from "lucide-react";
import { toast } from "sonner";
import { isValidEmail } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";
import { KpiCard } from "@/components/kpi-card";
import { motion, AnimatePresence } from "framer-motion";
import domToImage from "dom-to-image";
import jsPDF from "jspdf";
import { useUser } from "@/contexts/user-context";

function NotaryPaymentsContent() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_orders_notary_payments", "view");

  const searchParams = useSearchParams();
  const notaryIdParam = searchParams.get("notaryId");

  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Authorization Check & Redirect
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to access Vendor Payments.");
      if (hasPermission("clients_my", "view")) {
        router.replace("/business/assigned-orders");
      } else {
        router.replace("/business/dashboard");
      }
    }
  }, [userLoading, canView, hasPermission, router]);

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

  // Payment Voucher drawer & email states
  const [selectedVoucherJob, setSelectedVoucherJob] = useState<any | null>(null);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailCustomNote, setEmailCustomNote] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch summaries
  const fetchSummaries = async () => {
    if (userLoading || !canView) return;
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
      toast.error("Failed to fetch vendor payments summary");
    } finally {
      setLoading(false);
    }
  };

  // Fetch details for selected vendor
  const fetchNotaryHistory = async (notaryId: number) => {
    if (userLoading || !canView) return;
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
      toast.error("Failed to load vendor job history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && canView) {
      fetchSummaries();
    }
  }, [userLoading, canView]);

  // Sync state with URL query parameter (handles browser back/forward and direct links)
  useEffect(() => {
    if (notaryIdParam && !userLoading && canView) {
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

  // Open Payment Voucher Drawer
  const handleOpenVoucher = (job: any) => {
    setSelectedVoucherJob(job);
    setIsVoucherOpen(true);
  };

  // Download Payment Voucher as high-resolution PDF
  const handleDownloadPDF = async () => {
    const element = document.getElementById("notary-payment-voucher-doc");
    if (!element || !selectedVoucherJob) return;
    setDownloadingPdf(true);

    const dateObj = selectedVoucherJob.notary_payment_date
      ? new Date(selectedVoucherJob.notary_payment_date)
      : (selectedVoucherJob.created_at ? new Date(selectedVoucherJob.created_at) : new Date());
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yyyy = dateObj.getFullYear();
    const formattedDate = `${dd}${mm}${yyyy}`;
    
    const rawAdviceNumber = selectedVoucherJob.order_number
      ? `PV-${selectedVoucherJob.order_number}`
      : `PV-${selectedVoucherJob.id}`;
    const cleanAdviceNumber = rawAdviceNumber.replace(/[/\\?%*:|"<> ]/g, "_");
    const fileName = `${cleanAdviceNumber}_${formattedDate}.pdf`;

    try {
      const elWidth = element.scrollWidth || element.offsetWidth || 800;
      const elHeight = element.scrollHeight || element.offsetHeight || 1000;

      const imgData = await domToImage.toJpeg(element, {
        quality: 0.98,
        bgcolor: "#ffffff",
        width: elWidth,
        height: elHeight,
        style: {
          transform: "none",
          margin: "0"
        }
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const printableWidth = 190; // A4 portrait width (210mm) - 2 * 10mm margins
      const printableHeight = (elHeight * printableWidth) / elWidth;

      pdf.addImage(imgData, "JPEG", 10, 10, printableWidth, printableHeight);
      pdf.save(fileName);

      toast.success(`Downloaded ${fileName} successfully!`);
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to generate PDF. You can try printing the document.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Open Email Confirmation Modal
  const handleOpenEmailModal = () => {
    if (!selectedVoucherJob) return;
    const vendorEmail = (selectedNotary?.email || "").trim();
    setEmailRecipient(vendorEmail);
    setEmailCustomNote("");
    setEmailModalOpen(true);
  };

  // Execute Send Email
  const handleSendVoucherEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendorEmail = (selectedNotary?.email || "").trim();
    if (!selectedVoucherJob || !vendorEmail || !isValidEmail(vendorEmail)) {
      toast.error(`Vendor '${selectedNotary?.name || "Selected Vendor"}' does not have a valid registered email address on file. Please update the vendor profile in the Vendors directory.`);
      return;
    }

    setSendingEmail(true);
    const toastId = toast.loading("Generating PDF & dispatching voucher email...");
    try {
      // 1. Generate PDF base64 from the voucher DOM element
      let pdfBase64: string | null = null;
      let pdfFileName: string = `PV-${selectedVoucherJob.order_number || selectedVoucherJob.id}.pdf`;

      const element = document.getElementById("notary-payment-voucher-doc");
      if (element) {
        try {
          const dateObj = selectedVoucherJob.notary_payment_date
            ? new Date(selectedVoucherJob.notary_payment_date)
            : (selectedVoucherJob.created_at ? new Date(selectedVoucherJob.created_at) : new Date());
          const dd = String(dateObj.getDate()).padStart(2, "0");
          const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
          const yyyy = dateObj.getFullYear();
          const formattedDate = `${dd}${mm}${yyyy}`;
          
          const rawAdviceNumber = selectedVoucherJob.order_number
            ? `PV-${selectedVoucherJob.order_number}`
            : `PV-${selectedVoucherJob.id}`;
          const cleanAdviceNumber = rawAdviceNumber.replace(/[/\\?%*:|"<> ]/g, "_");
          pdfFileName = `${cleanAdviceNumber}_${formattedDate}.pdf`;

          const elWidth = element.scrollWidth || element.offsetWidth || 800;
          const elHeight = element.scrollHeight || element.offsetHeight || 1000;

          const imgData = await domToImage.toJpeg(element, {
            quality: 0.98,
            bgcolor: "#ffffff",
            width: elWidth,
            height: elHeight,
            style: {
              transform: "none",
              margin: "0"
            }
          });

          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
          });

          const printableWidth = 190; // A4 portrait width (210mm) - 2 * 10mm margins
          const printableHeight = (elHeight * printableWidth) / elWidth;

          pdf.addImage(imgData, "JPEG", 10, 10, printableWidth, printableHeight);
          
          const dataUri = pdf.output("datauristring");
          if (dataUri && dataUri.includes(",")) {
            pdfBase64 = dataUri.split(",")[1];
          }
        } catch (pdfErr) {
          console.warn("Could not generate PDF attachment for email:", pdfErr);
        }
      }

      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/payments/${selectedVoucherJob.id}/send-voucher-email`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipient_email: emailRecipient,
          custom_message: emailCustomNote,
          pdf_base64: pdfBase64,
          pdf_filename: pdfFileName
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.detail || "Payment voucher email sent successfully!", { id: toastId });
        setEmailModalOpen(false);

        // Update local jobs and selected job with dispatch tracking
        if (data.notary_voucher_sent_at) {
          setSelectedVoucherJob((prev: any) => prev ? {
            ...prev,
            notary_voucher_sent_at: data.notary_voucher_sent_at,
            notary_voucher_sent_to: data.notary_voucher_sent_to || vendorEmail
          } : null);
          setJobs((prev: any[]) => prev.map((j) => j.id === selectedVoucherJob.id ? {
            ...j,
            notary_voucher_sent_at: data.notary_voucher_sent_at,
            notary_voucher_sent_to: data.notary_voucher_sent_to || vendorEmail
          } : j));
        }
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to send payment voucher email", { id: toastId });
      }
    } catch (err) {
      console.error("Email send error:", err);
      toast.error("Error dispatching email to notary", { id: toastId });
    } finally {
      setSendingEmail(false);
    }
  };

  // KPI calculations
  const totalCost = summaries.reduce((sum, s) => sum + s.total_earned, 0);
  const totalPaid = summaries.reduce((sum, s) => sum + s.total_paid, 0);
  const totalOutstanding = summaries.reduce((sum, s) => sum + s.total_outstanding, 0);
  const activeNotariesCount = summaries.length;

  const filteredSummaries = summaries.filter(s => 
    s.notary_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.vendor_type && s.vendor_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredJobs = jobs.filter(j => {
    if (jobFilter === "PAID") return j.notary_payment_status === "PAID";
    if (jobFilter === "UNPAID") return j.notary_payment_status !== "PAID";
    return true;
  });

  if (userLoading || (!canView && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying vendor payment permissions...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading Vendor Payments Summary...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-none pb-12">
      
      {/* HEADER & METRIC RIBBON */}
      {selectedNotary && (
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-xl border border-border/60 hover:bg-muted"
              onClick={() => router.push("/business/clients/orders/notary-payments")}
              title="Back to All Vendors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Settlement History &mdash; {selectedNotary.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage and audit settlement registry records for {selectedNotary.name} ({selectedNotary.city || "Vendor"}).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC MINIMALIST METRIC RIBBON */}
      {!selectedNotary ? (
        <div className="flex flex-col lg:flex-row items-stretch gap-3 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 flex-1 divide-y md:divide-y-0 md:divide-x divide-border/50 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs">
            <div className="flex items-center gap-3 px-3 py-1.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Vendor Cost</p>
                <p className="text-lg font-bold tracking-tight">{formatCurrency(totalCost)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Paid Amount</p>
                <p className="text-lg font-bold tracking-tight">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Outstanding Balance</p>
                <p className="text-lg font-bold tracking-tight">{formatCurrency(totalOutstanding)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Registered Vendors</p>
                <p className="text-lg font-bold tracking-tight">{activeNotariesCount}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-stretch gap-3 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 flex-1 divide-y md:divide-y-0 md:divide-x divide-border/50 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs">
            <div className="flex items-center gap-3 px-3 py-1.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Earned</p>
                <p className="text-lg font-bold tracking-tight">{formatCurrency(summaries.find(s => s.notary_id === selectedNotary.id)?.total_earned)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Paid</p>
                <p className="text-lg font-bold tracking-tight">{formatCurrency(summaries.find(s => s.notary_id === selectedNotary.id)?.total_paid)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Outstanding</p>
                <p className="text-lg font-bold tracking-tight">{formatCurrency(summaries.find(s => s.notary_id === selectedNotary.id)?.total_outstanding)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Assigned Jobs</p>
                <p className="text-lg font-bold tracking-tight">{jobs.length}</p>
              </div>
            </div>
          </div>
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
                placeholder="Search by vendor name, type, or location..."
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
                  <th className="p-4">Vendor Partner</th>
                  <th className="p-4">Type</th>
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
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      No vendor payment records found matching search query.
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((s) => (
                    <tr key={s.notary_id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-indigo-500/80 shrink-0" />
                          <span>{s.notary_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {s.vendor_type === "GOVERNMENT_OFFICER" || s.is_gov_officer ? (
                          <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 text-[9px] py-0 px-1.5 font-bold uppercase">
                            Gov Body
                          </Badge>
                        ) : s.vendor_type === "OTHER_VENDORS" || s.is_other_vendor ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] py-0 px-1.5 font-bold uppercase">
                            Other Vendor
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[9px] py-0 px-1.5 font-bold uppercase">
                            Notary
                          </Badge>
                        )}
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
                          <History className="h-3.5 w-3.5 mr-1" /> Manage Payments
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
          
          {/* VENDOR BANK ACCOUNT PROFILE BANNER */}
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
                  {selectedNotary.vendor_type === "GOVERNMENT_OFFICER" || selectedNotary.is_gov_officer ? (
                    <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 text-[9px] py-0 px-1.5 font-bold uppercase">
                      Gov Body
                    </Badge>
                  ) : selectedNotary.vendor_type === "OTHER_VENDORS" || selectedNotary.is_other_vendor ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] py-0 px-1.5 font-bold uppercase">
                      Other Vendor
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 text-[9px] py-0 px-1.5 font-bold uppercase">
                      Notary
                    </Badge>
                  )}
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
                      <th className="p-4 text-right">Vendor Fee</th>
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
                                {j.notary_voucher_sent_at && (
                                  <Badge
                                    variant="outline"
                                    className="bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 text-[9px] font-mono flex items-center gap-1 mt-1"
                                    title={`Voucher emailed to ${j.notary_voucher_sent_to || 'vendor'} on ${new Date(j.notary_voucher_sent_at).toLocaleDateString()}`}
                                  >
                                    <MailCheck className="h-2.5 w-2.5 text-sky-600 dark:text-sky-400" />
                                    <span>Voucher Sent</span>
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30 font-medium italic">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {j.notary_payment_status === "PAID" ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs select-none border border-emerald-500/20">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Settled</span>
                                </div>
                                <Button 
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs font-bold gap-1.5"
                                  onClick={() => handleOpenVoucher(j)}
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>Voucher</span>
                                </Button>
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
                                  className="font-semibold text-xs h-8 px-2"
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
      </div>

      {/* XENDIT AUTOMATED DISBURSEMENT CONFIRMATION MODAL */}
      <Dialog open={disburseJob !== null} onOpenChange={(open) => !open && setDisburseJob(null)}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleConfirmDisburse}>
            <DialogHeader>
              <DialogTitle className="font-bold text-lg flex items-center gap-2 text-foreground">
                <Zap className="h-5 w-5 text-emerald-600 fill-current" /> Confirm Xendit Automated Payout
              </DialogTitle>
              <DialogDescription>
                Execute direct bank transfer to vendor <strong>{selectedNotary?.name}</strong> using Xendit Payouts.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Payment Summary Box */}
              <div className="p-4 rounded-xl bg-muted/30 border space-y-2.5 text-xs">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground font-semibold">Recipient Vendor:</span>
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
                  placeholder="e.g. Vendor Fee ORD-260001"
                  className="bg-background"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDisburseJob(null)} disabled={disbursing}>
                Cancel
              </Button>
              <Button type="submit" disabled={disbursing} className="font-bold gap-2">
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
              The vendor profile is missing required bank credentials (Bank Name, Account Number, or Account Holder Name).
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
            Please navigate to the Vendors directory, edit the vendor profile, and configure the <strong>Bank Details</strong> tab.
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setMissingBankModalOpen(false)}>
              Close
            </Button>
            <Link href="/business/clients/notaries">
              <Button className="font-bold">
                Go to Vendors Directory
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
              <DialogTitle className="font-bold text-lg">Record Manual Vendor Payout</DialogTitle>
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

    {/* SLIDE-OVER PAYMENT VOUCHER & REMITTANCE FLIER DRAWER */}
      <AnimatePresence>
        {isVoucherOpen && selectedVoucherJob && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[calc(100vw-260px)] bg-background flex flex-col overflow-hidden pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 lg:pt-8 lg:px-8 lg:pb-6 shadow-2xl border-l border-border"
          >
            <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col overflow-hidden min-h-0">
              
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60 shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsVoucherOpen(false)}
                    className="gap-2 font-bold"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to History
                  </Button>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                      <FileText className="h-6 w-6 text-primary" /> Vendor Payment Voucher
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Official Remittance Advice & Bukti Pengeluaran Kas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {selectedVoucherJob?.notary_voucher_sent_at && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 gap-1.5 px-3 py-1.5 text-xs font-bold font-mono" title={`Voucher dispatched on ${new Date(selectedVoucherJob.notary_voucher_sent_at).toLocaleDateString()} to ${selectedVoucherJob.notary_voucher_sent_to || 'vendor'}`}>
                      <MailCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Dispatched {new Date(selectedVoucherJob.notary_voucher_sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    className="font-bold gap-1.5"
                  >
                    {downloadingPdf ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleOpenEmailModal}
                    variant={selectedVoucherJob?.notary_voucher_sent_at ? "outline" : "default"}
                    className={`font-bold gap-1.5 ${
                      selectedVoucherJob?.notary_voucher_sent_at ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20" : ""
                    }`}
                  >
                    {selectedVoucherJob?.notary_voucher_sent_at ? (
                      <MailCheck className="h-4 w-4" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    <span>{selectedVoucherJob?.notary_voucher_sent_at ? "Resend Email" : "Send Email"}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsVoucherOpen(false)}
                    className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground ml-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Document Container */}
              <div className="flex-1 w-full overflow-y-auto pr-1 min-h-0 py-6">
                
                {/* Printable / Renderable Payment Voucher Document */}
                <div
                  id="notary-payment-voucher-doc"
                  className="p-8 sm:p-10 bg-white text-slate-900 print-area w-full min-h-full flex flex-col justify-between max-w-5xl mx-auto rounded-xl shadow-lg border border-slate-200 font-sans"
                >
                  <div className="space-y-4 w-full">

                    {/* Header Section with Official MCS Logo & Address */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 gap-6">
                      <div>
                        <img
                          src="/logo.png"
                          alt="MCS Consulting Logo"
                          className="h-16 sm:h-20 w-auto object-contain shrink-0 mb-2"
                        />
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg">
                          Springhill Office Tower Lantai 9 Unit 9C, Jalan Benyamin Suaeb Blok D7-Kemayoran, Jakarta Utara 14410<br />
                          Tel: +62 878-7796-7799 | Email: admin@mcsc.co.id | www.mcsc.co.id
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="inline-block px-3.5 py-1.5 bg-slate-900 text-white font-black font-mono text-xs rounded uppercase tracking-wider mb-1">
                          OFFICIAL REMITTANCE ADVICE
                        </div>
                        <h3 className="font-mono text-xl font-black text-slate-900">
                          PV-{selectedVoucherJob.order_number || selectedVoucherJob.id}
                        </h3>
                        <p className="text-xs text-slate-650 font-semibold mt-1">
                          Issue Date: <span className="font-mono text-slate-900 font-bold">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </p>
                        <p className="text-xs text-slate-655 font-semibold">
                          Settlement Date: <span className="font-mono text-slate-900 font-bold">{selectedVoucherJob.notary_payment_date ? new Date(selectedVoucherJob.notary_payment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : (selectedVoucherJob.created_at ? new Date(selectedVoucherJob.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-")}</span>
                        </p>
                      </div>
                    </div>

                    {/* Beneficiary Details & Payment Terms (2-Column Grid) */}
                    <div className="grid grid-cols-2 gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200 text-sm overflow-hidden">
                      <div className="space-y-1 min-w-0">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                          BENEFICIARY ({selectedNotary?.vendor_type === "GOVERNMENT_OFFICER" || selectedNotary?.is_gov_officer ? "GOVERNMENT BODY" : selectedNotary?.vendor_type === "OTHER_VENDORS" || selectedNotary?.is_other_vendor ? "VENDOR PARTNER" : "NOTARY PARTNER"})
                        </span>
                        <h4 className="text-lg font-bold text-slate-900 truncate">{selectedNotary?.name || "Vendor Partner"}</h4>
                        {selectedNotary?.city && (
                          <p className="text-xs text-slate-600 font-semibold">
                            Location: <span className="text-slate-800">{selectedNotary.city}</span>
                          </p>
                        )}
                        {selectedNotary?.phone && (
                          <p className="text-xs text-slate-600 font-semibold">
                            Phone: <span className="font-mono text-slate-800">{selectedNotary.phone}</span>
                          </p>
                        )}
                        <p className="text-slate-500 text-xs truncate">
                          Email: <span className="font-medium text-slate-800">{selectedNotary?.email || "-"}</span>
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                          Reference Contract #: <span className="font-mono font-bold text-slate-800">ORD-{selectedVoucherJob.order_number}</span>
                        </p>
                      </div>

                      <div className="text-right border-l border-slate-200 pl-6 space-y-1 min-w-0">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                          PAYMENT TERMS & STATUS
                        </span>
                        <p className="font-bold text-base text-emerald-700">
                          {selectedNotary?.vendor_type === "GOVERNMENT_OFFICER" || selectedNotary?.is_gov_officer 
                            ? "Government Liaison & Processing Fee" 
                            : selectedNotary?.vendor_type === "OTHER_VENDORS" || selectedNotary?.is_other_vendor 
                            ? "Vendor Third-Party Service Fee" 
                            : "Notary Legal Service Honorarium"}
                        </p>
                        <p className="text-slate-550 text-xs truncate">
                          Target Client: <span className="font-bold text-slate-800">{selectedVoucherJob.company_name || "Client Entity"}</span>
                        </p>
                        <p className="text-slate-550 text-xs">
                          Payment Channel: <span className="font-semibold text-slate-800">{selectedVoucherJob.notary_payment_ref?.toLowerCase().startsWith("disb-") ? "Xendit Automated Bank Payout" : "Direct Bank Transfer"}</span>
                        </p>
                        <p className="text-slate-550 text-xs break-all">
                          Payout Reference: <span className="font-mono font-bold text-slate-800 break-all">{selectedVoucherJob.notary_payment_ref || "SETTLED"}</span>
                        </p>
                        <p className="text-slate-550 text-xs mt-1">
                          Status: <span className="font-black text-emerald-600">✓ PAID & SETTLED</span>
                        </p>
                      </div>
                    </div>

                    {/* Services / Line Items Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-sm !mt-2">
                      <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-wider">
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3 w-auto">Service Line Item / Assignment</th>
                            <th className="p-3 w-36 text-center">Order Reference</th>
                            <th className="p-3 w-20 text-center">Currency</th>
                            <th className="p-3 w-36 text-right">Settled Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr className="hover:bg-slate-50/60">
                            <td className="p-3 text-center font-mono font-bold text-slate-450">1</td>
                            <td className="p-3">
                              <span className="font-extrabold text-slate-900 text-base leading-tight block truncate">
                                {selectedVoucherJob.job_title || "Vendor Service Execution & Processing"}
                              </span>
                              <span className="text-xs text-slate-500 mt-0.5 block">
                                Honorarium jasa rekanan untuk penyelesaian pekerjaan dan legalitas perizinan
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-semibold text-slate-700">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-bold">
                                ORD-{selectedVoucherJob.order_number}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-semibold text-slate-600">IDR</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(selectedVoucherJob.notary_fee)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Calculation Summary & Bank Wire Details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-3 gap-6">

                      {/* Bank Wire Details */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1.5 flex-1 min-w-0 max-w-sm">
                        <span className="font-extrabold uppercase tracking-wider text-xs text-slate-500 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Payout Settlement Verification
                        </span>
                        <p className="text-slate-700 font-semibold truncate">Recipient Bank: <span className="font-bold text-slate-900">{selectedNotary?.bank_name || "Direct Bank"}</span></p>
                        <p className="text-slate-700 font-semibold truncate">Account Name: <span className="font-bold text-slate-900">{selectedNotary?.bank_account_holder_name || selectedNotary?.name || "-"}</span></p>
                        <p className="text-slate-700 font-semibold">Account Number: <span className="font-mono font-bold text-slate-900">{selectedNotary?.bank_account_number || "-"}</span></p>
                        {selectedNotary?.bank_branch && (
                          <p className="text-slate-700 font-semibold">Branch: <span className="text-slate-900">{selectedNotary.bank_branch}</span></p>
                        )}
                      </div>

                      {/* Total Calculations */}
                      <div className="w-full sm:w-80 shrink-0 space-y-2 text-sm font-mono">
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-650">
                          <span>Gross Honorarium:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(selectedVoucherJob.notary_fee)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-650">
                          <span>Deductions:</span>
                          <span className="font-bold text-slate-900">IDR 0</span>
                        </div>
                        <div className="flex justify-between py-3 px-4 rounded-lg bg-emerald-600 text-white text-base font-extrabold shadow-sm">
                          <span>Total Settled:</span>
                          <span className="font-mono">{formatCurrency(selectedVoucherJob.notary_fee)}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Spacer to push signature down */}
                  <div className="h-10 sm:h-14 shrink-0" />

                  {/* Signatures Box at bottom */}
                  <div className="pt-5 border-t border-slate-200 flex justify-between items-end text-sm mt-auto w-full">
                    <div className="text-slate-550 text-xs leading-normal max-w-sm">
                      <p className="font-extrabold text-slate-700">Notice:</p>
                      <p>This Remittance Advice certifies that PT Mandiri Cipta Solusi has successfully settled the honorarium fee to the beneficiary vendor account.</p>
                      <p className="font-mono text-[10px] text-slate-400 mt-1">Doc Ref: PV-{selectedVoucherJob.order_number}-{selectedVoucherJob.id}</p>
                    </div>
                    <div className="text-center w-60 space-y-8">
                      <p className="text-slate-500 font-extrabold text-xs">Authorized By</p>
                      <div className="border-b border-slate-400 pb-1">
                        <p className="font-black text-slate-900 text-sm">PT Mandiri Cipta Solusi</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEND EMAIL CONFIRMATION MODAL */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSendVoucherEmail}>
            <DialogHeader>
              <DialogTitle className="font-bold text-lg flex items-center gap-2 text-foreground">
                <Mail className="h-5 w-5 text-primary" /> Send Payment Voucher via Email
              </DialogTitle>
              <DialogDescription>
                Dispatch an official payment remittance notice directly to vendor <strong>{selectedNotary?.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Prior dispatch notice if previously sent */}
              {selectedVoucherJob?.notary_voucher_sent_at && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                  <MailCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    A payment voucher was previously emailed on <strong>{new Date(selectedVoucherJob.notary_voucher_sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong> to <strong>{selectedVoucherJob.notary_voucher_sent_to || selectedNotary?.email}</strong>. Sending now will deliver a fresh copy.
                  </div>
                </div>
              )}

              {/* Locked recipient email display */}
              {selectedNotary?.email ? (
                <div className="p-3.5 bg-muted/40 border border-border/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Locked Recipient Email
                    </span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold py-0 px-2">
                      Registered Vendor Email
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-mono font-bold text-sm text-foreground break-all">
                      {selectedNotary.email}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-0.5">
                    Locked to prevent errors. Payment vouchers can only be dispatched to the verified email address registered on this vendor's profile.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-amber-800 dark:text-amber-300 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    No Registered Email on File
                  </div>
                  <p>
                    Vendor <strong>{selectedNotary?.name}</strong> does not have an email address registered in the system.
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Please add an email address in the Vendors directory before dispatching payment vouchers.
                  </p>
                </div>
              )}

              <div className="p-3 bg-muted/30 border rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Reference:</span>
                  <span className="font-mono font-bold text-foreground">ORD-{selectedVoucherJob?.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Settled Amount:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedVoucherJob?.notary_fee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Destination:</span>
                  <span className="font-semibold text-foreground">{selectedNotary?.bank_name} ({selectedNotary?.bank_account_number})</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/50 text-sky-600 dark:text-sky-400 font-medium">
                  <span className="flex items-center gap-1">
                    <FileDown className="h-3.5 w-3.5" /> PDF Attachment:
                  </span>
                  <span className="font-mono text-[11px]">Auto-attached</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Custom Message / Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={emailCustomNote}
                  onChange={(e) => setEmailCustomNote(e.target.value)}
                  placeholder="e.g. Please find attached remittance details for your review. Thank you for your partnership."
                  className="w-full p-2.5 text-xs rounded-lg border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-ring text-foreground resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEmailModalOpen(false)} disabled={sendingEmail}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={sendingEmail || !selectedNotary?.email} 
                className={`font-bold gap-2 ${selectedVoucherJob?.notary_voucher_sent_at ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : selectedVoucherJob?.notary_voucher_sent_at ? (
                  <>
                    <MailCheck className="h-4 w-4" />
                    Resend Voucher Email
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Voucher Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </>
  );
}

export default function NotaryPaymentsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading Vendor Payments Summary...</p>
      </div>
    }>
      <NotaryPaymentsContent />
    </Suspense>
  );
}
