"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Loader2,
  Trash2,
  Eye,
  ShoppingCart,
  ArrowLeft,
  Building,
  DollarSign,
  Scale,
  Check,
  Tag,
  Receipt,
  Edit,
  UserCheck,
  Users,
  FileText,
  Printer,
  Download,
  Percent,
  CheckCircle2,
  Building2,
  Calendar,
  ShieldCheck,
  X,
  Lock,
  MessageSquare,
  AlertCircle,
  Clock,
  Ban,
  RotateCcw,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import domToImage from "dom-to-image";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import { DualOrderChatDialog } from "@/components/dual-order-chat-dialog";
import { useUser } from "@/contexts/user-context";

export default function CancelledOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_orders_cancelled", "view") || hasPermission("clients_orders_active", "view");

  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);
  const [reopeningOrder, setReopeningOrder] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState<any>(null);

  // Progress / Timeline States
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Proforma & Final Invoice Preview States
  const [isProformaPreviewOpen, setIsProformaPreviewOpen] = useState(false);
  const [isFinalInvoicePreviewOpen, setIsFinalInvoicePreviewOpen] = useState(false);
  const [proformaPercent, setProformaPercent] = useState<number>(70);
  const [tempPercent, setTempPercent] = useState<string>("70");
  const [tempAmount, setTempAmount] = useState<string>("");
  const [isPph21, setIsPph21] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingFinalPdf, setDownloadingFinalPdf] = useState(false);

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItemExpansion = (key: string) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Authorization Check & Redirect
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to access Cancelled Orders.");
      if (hasPermission("clients_my", "view")) {
        router.replace("/business/assigned-orders");
      } else {
        router.replace("/business/dashboard");
      }
    }
  }, [userLoading, canView, hasPermission, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    if (userLoading || !canView) return;

    try {
      setLoading(true);
      const [ordRes, cliRes, compRes, serRes, empRes, teamRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, {
      credentials: "include", })
      ]);

      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(Array.isArray(ordData) ? ordData : []);
      } else {
        setOrders([]);
      }
      if (cliRes.ok) setClients(await cliRes.json());
      if (compRes.ok) setCompanies(await compRes.json());
      if (serRes.ok) setServices(await serRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (teamRes.ok) setTeams(await teamRes.json());
    } catch (err) {
      console.error("Error fetching cancelled orders data:", err);
      toast.error("Error fetching cancelled orders data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && canView) {
      fetchData();
    }
    if (typeof window !== "undefined" && !(window as any).html2pdf) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      document.head.appendChild(script);
    }
  }, [userLoading, canView]);

  // Lock body scroll when overlays are active
  useEffect(() => {
    if (isViewOpen || isChatOpen || isProformaPreviewOpen || isFinalInvoicePreviewOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isViewOpen, isChatOpen, isProformaPreviewOpen, isFinalInvoicePreviewOpen]);

  const fetchProgressUpdates = async (orderNum: string) => {

    setLoadingProgress(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNum}/progress`, {
      credentials: "include",
        });
      if (res.ok) {
        setProgressUpdates(await res.json());
      }
    } catch (err) {
      console.error("Error loading progress updates:", err);
    } finally {
      setLoadingProgress(false);
    }
  };

  // Group raw rows by order_number
  const groupedOrdersMap = new Map<string, any>();
  (Array.isArray(orders) ? orders : []).forEach((ord) => {
    const key = ord.order_number || `SINGLE-${ord.id}`;
    if (!groupedOrdersMap.has(key)) {
      groupedOrdersMap.set(key, {
        order_number: ord.order_number,
        client_name: ord.client_name,
        company_name: ord.company_name,
        company_id: ord.company_id,
        billing_company_name: ord.billing_company_name || ord.company_name,
        billing_company_id: ord.billing_company_id || ord.company_id,
        company: ord.company,
        billing_company: ord.billing_company,
        created_at: ord.created_at,
        status: ord.status || "CANCELLED",
        payment_status: ord.payment_status || "UNPAID",
        invoice_number: ord.invoice_number || null,
        consultant_ids: ord.consultant_ids || [],
        consultants: ord.consultants || [],
        notes: ord.notes || "",
        total_amount: 0,
        total_notary_fee: 0,
        items: [],
        is_proforma_finalized: ord.is_proforma_finalized || false,
        proforma_stage_percent: ord.proforma_stage_percent || 50,
        proforma_paid_amount: ord.proforma_paid_amount != null ? ord.proforma_paid_amount : null,
        is_final_invoice_finalized: ord.is_final_invoice_finalized || false
      });
    }
    const group = groupedOrdersMap.get(key);
    group.items.push(ord);
    group.total_amount += ord.unit_price || ord.total_amount || 0;
    group.total_notary_fee += ord.notary_fee || 0;

    if (ord.is_proforma_finalized) {
      group.is_proforma_finalized = true;
    }
    if (ord.proforma_stage_percent) {
      group.proforma_stage_percent = ord.proforma_stage_percent;
    }
    if (ord.proforma_paid_amount != null) {
      group.proforma_paid_amount = ord.proforma_paid_amount;
    }
    if (ord.is_final_invoice_finalized) {
      group.is_final_invoice_finalized = true;
    }

    if (ord.consultants && ord.consultants.length > 0) {
      const existingIds = new Set(group.consultants.map((c: any) => c.id));
      ord.consultants.forEach((c: any) => {
        if (!existingIds.has(c.id)) group.consultants.push(c);
      });
    }
    if (ord.consultant_ids && ord.consultant_ids.length > 0) {
      group.consultant_ids = Array.from(new Set([...group.consultant_ids, ...ord.consultant_ids]));
    }
  });

  const groupedOrders = Array.from(groupedOrdersMap.values());

  // Filter ONLY Cancelled orders
  const allCancelledOrders = groupedOrders.filter((ord) => (ord.status || "").toUpperCase() === "CANCELLED");

  // Auto-open chat or view from URL query parameter (for notifications / deep links)
  useEffect(() => {
    if (allCancelledOrders.length === 0) return;

    const checkParams = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const orderNum = params.get("order");
      const openChat = params.get("chat");
      if (orderNum) {
        const matched = allCancelledOrders.find((o) => o.order_number === orderNum);
        if (matched) {
          setSelectedOrderGroup(matched);
          if (openChat === "true") {
            setIsChatOpen(true);
            fetchProgressUpdates(orderNum);
          } else {
            setIsViewOpen(true);
            fetchProgressUpdates(orderNum);
          }
          const url = new URL(window.location.href);
          url.searchParams.delete("order");
          url.searchParams.delete("chat");
          window.history.replaceState({}, "", url.pathname + url.search);
        }
      }
    };

    checkParams();
  }, [allCancelledOrders]);

  const filteredOrders = allCancelledOrders.filter((ord) => {
    const term = searchTerm.toLowerCase();
    const orderNum = (ord.order_number || "").toLowerCase();
    const clientName = (ord.client_name || "").toLowerCase();
    const compName = (ord.company_name || "").toLowerCase();
    const itemsStr = (ord.items || []).map((i: any) => `${i.job_title} ${i.job_id}`).join(" ").toLowerCase();
    const consultantsStr = (ord.consultants || []).map((c: any) => c.name).join(" ").toLowerCase();
    return orderNum.includes(term) || clientName.includes(term) || compName.includes(term) || itemsStr.includes(term) || consultantsStr.includes(term);
  });

  const totalPages = Math.ceil(filteredOrders.length / 10) || 1;
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Metrics
  const totalOrdersCount = allCancelledOrders.length;
  const totalRevenue = allCancelledOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const totalVendorFees = allCancelledOrders.reduce((acc, curr) => acc + (curr.total_notary_fee || 0), 0);
  const totalActualEarnings = totalRevenue - totalVendorFees;

  const allocatedStaffSet = new Set<number>();
  allCancelledOrders.forEach((o) => {
    if (Array.isArray(o.consultant_ids)) {
      o.consultant_ids.forEach((id: any) => {
        if (typeof id === "number") allocatedStaffSet.add(id);
        else if (typeof id === "string" && !isNaN(parseInt(id))) allocatedStaffSet.add(parseInt(id));
      });
    }
  });
  const allocatedStaffCount = allocatedStaffSet.size;

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const formatInvoiceDescription = (desc: string, isSmallText: boolean = false) => {
    if (!desc) return null;

    let processed = desc;
    processed = processed.replace(/\s+([a-zA-Z]|\d+)\.\s+/g, "\n$1. ");
    processed = processed.replace(/\s+([•\-\*])\s+/g, "\n$1 ");

    const lines = processed.split("\n").map((line) => line.trim()).filter(Boolean);

    if (lines.length <= 1) {
      return <div className="whitespace-pre-wrap">{desc}</div>;
    }

    return (
      <div className={`space-y-1 mt-1 leading-relaxed ${isSmallText ? "text-[10px]" : "text-xs"} text-slate-550`}>
        {lines.map((line, idx) => {
          const isMarker = /^[a-zA-Z0-9]+\.\s+/.test(line) || /^[•\-\*]\s+/.test(line);
          if (isMarker) {
            return (
              <div key={idx} className="pl-4 -indent-4">
                {line}
              </div>
            );
          }
          return (
            <div key={idx} className="font-semibold text-slate-800 mb-1">
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  const renderVendorBadge = (item: any) => {
    if (!item || !item.notary) return null;
    const notary = item.notary;
    const matchedService = services?.find((s: any) => s.id === item.service_id);
    const isGov = notary.vendor_type === "GOVERNMENT_OFFICER" || notary.is_gov_officer || Boolean(matchedService?.needs_gov_officer);
    const isOther = notary.vendor_type === "OTHER_VENDORS" || notary.is_other_vendor || Boolean(matchedService?.needs_other_vendors);

    const prefix = isGov ? "Govt Body" : isOther ? "Vendor" : "Notary";
    const baseColor = isGov
      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
      : isOther
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";

    const vStatus = notary.validation_status;
    const isPending = vStatus === "PENDING_VALIDATION" || !vStatus;
    const isRevision = vStatus === "NEEDS_REVISION";

    return (
      <div className="inline-flex items-center gap-1 flex-wrap">
        <Badge variant="outline" className={`text-[9px] font-bold py-0 px-1.5 ${baseColor} shrink-0`}>
          {prefix}: {notary.name}
        </Badge>
        {isPending && (
          <Badge variant="outline" className="text-[8px] font-bold py-0 px-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 shrink-0 flex items-center gap-0.5" title="Vendor pending admin validation">
            <Clock className="h-2 w-2" /> Pending Validation
          </Badge>
        )}
        {isRevision && (
          <Badge variant="outline" className="text-[8px] font-bold py-0 px-1 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 shrink-0 flex items-center gap-0.5" title="Vendor needs revision">
            <AlertCircle className="h-2 w-2" /> Revision Needed
          </Badge>
        )}
      </div>
    );
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
      case "CANCELLED": return "bg-destructive/15 text-destructive border-destructive/30";
      case "CONFIRMED": return "bg-purple-500/15 text-purple-600 border-purple-500/30";
      case "DRAFT": return "bg-zinc-500/15 text-zinc-600 border-zinc-500/30";
      default: return "bg-destructive/15 text-destructive border-destructive/30";
    }
  };

  const getPaymentStatusColor = (pStatus: string) => {
    switch (pStatus) {
      case "PAID": return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
      case "PARTIALLY_PAID": return "bg-amber-500/15 text-amber-600 border-amber-500/30";
      default: return "bg-red-500/15 text-red-600 border-red-500/30";
    }
  };

  // Reopen Cancelled Order back to Active (DRAFT)
  const handleReopenOrderSubmit = async () => {
    if (!selectedOrderGroup) return;

    setReopeningOrder(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/group/${selectedOrderGroup.order_number}/reopen`, {
      credentials: "include",
        method: "POST",
        });

      if (res.ok) {
        toast.success(`Order #${selectedOrderGroup.order_number} has been reopened and restored to Active Orders.`);
        setIsReopenOpen(false);
        setIsViewOpen(false);
        setSelectedOrderGroup(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to reopen order");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error reopening order");
    } finally {
      setReopeningOrder(false);
    }
  };

  // Delete Order Group
  const handleDeleteOrderSubmit = async () => {
    if (!selectedOrderGroup) return;

    setDeletingOrder(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/group/${selectedOrderGroup.order_number}`, {
      credentials: "include",
        method: "DELETE",
        });

      if (res.ok) {
        toast.success(`Order #${selectedOrderGroup.order_number} deleted successfully.`);
        setIsDeleteOpen(false);
        setSelectedOrderGroup(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to delete order");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error deleting order");
    } finally {
      setDeletingOrder(false);
    }
  };

  // Direct PDF File Downloader
  const handleDownloadPDF = async () => {
    const element = document.getElementById("cancelled-proforma-invoice-doc");
    if (!element) return;
    setDownloadingPdf(true);

    const company = selectedOrderGroup?.company_name || "Client";
    const contractRef = selectedOrderGroup?.order_number || "Proforma_Invoice";
    const rawFileName = `${company}_${contractRef}_Cancelled_Proforma`;
    const cleanFileName = rawFileName.replace(/[/\\?%*:|"<> ]/g, "_");
    const fileName = `${cleanFileName}.pdf`;

    try {
      const imgData = await domToImage.toJpeg(element, {
        quality: 0.98,
        bgcolor: "#ffffff"
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 190;
      const imgHeight = (element.clientHeight * imgWidth) / element.clientWidth;

      pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);
      pdf.save(fileName);

      toast.success(`Downloaded ${fileName} successfully!`);
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to generate PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadFinalPDF = async () => {
    const element = document.getElementById("cancelled-final-invoice-doc");
    if (!element || !selectedOrderGroup) return;
    setDownloadingFinalPdf(true);

    const company = selectedOrderGroup.company_name || "Client";
    const contractRef = selectedOrderGroup.order_number || "Invoice";
    const rawFileName = `${company}_${contractRef}_Cancelled_Invoice`;
    const cleanFileName = rawFileName.replace(/[/\\?%*:|"<> ]/g, "_");
    const fileName = `${cleanFileName}.pdf`;

    try {
      const imgData = await domToImage.toJpeg(element, {
        quality: 0.98,
        bgcolor: "#ffffff"
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 190;
      const imgHeight = (element.clientHeight * imgWidth) / element.clientWidth;

      pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);
      pdf.save(fileName);

      toast.success(`Downloaded ${fileName} successfully!`);
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to generate PDF.");
    } finally {
      setDownloadingFinalPdf(false);
    }
  };

  if (userLoading || (!canView && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Verifying cancelled orders permissions...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading cancelled orders archive...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-none pb-12">

        {/* Minimalist Metrics Strip & Quick Links Row */}
        <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
          {/* Minimalist Metric Strip - Expanded Horizontally */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
            
            {/* Total Cancelled */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1.5 md:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
                <Ban className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Voided Orders</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalOrdersCount}</p>
              </div>
            </div>

            {/* Voided Value */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1.5 md:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Voided Value</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>

            {/* Net Voided */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1.5 md:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Net Impact</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(totalActualEarnings)}</p>
              </div>
            </div>

            {/* Vendor Saved */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1.5 md:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                <Scale className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Vendor Relieved</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(totalVendorFees)}</p>
              </div>
            </div>

            {/* Staff Disengaged */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1.5 md:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Staff Released</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{allocatedStaffCount}</p>
              </div>
            </div>
          </div>

          {/* Quick Nav Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/business/clients/orders" className="flex-1 md:flex-initial flex items-stretch">
              <Button variant="outline" className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-4 text-xs">
                <Clock className="h-4 w-4" /> Active Orders
              </Button>
            </Link>
            <Link href="/business/clients/orders/completed" className="flex-1 md:flex-initial flex items-stretch">
              <Button variant="outline" className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-4 text-xs">
                <Receipt className="h-4 w-4" /> Completed
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Orders Table */}
        <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
          <div className="p-4 bg-muted/10 border-b border-border/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Order ID, Company..."
                className="pl-8 h-9 text-xs rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
              Showing {paginatedOrders.length} of {filteredOrders.length} entries
            </span>
          </div>

          <CardContent className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Ban className="h-10 w-10 text-muted-foreground/35" />
                <span className="text-sm font-semibold">No Cancelled Orders Found</span>
                <p className="text-xs max-w-sm">
                  {searchTerm
                    ? `No cancelled orders match your search "${searchTerm}".`
                    : "There are currently no cancelled orders in the archive. All active and completed orders are running smoothly."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                        <th className="p-4 w-12 text-center">No.</th>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Company Entity</th>
                        <th className="p-4">Service Package</th>
                        <th className="p-4">Assigned Consultants</th>
                        <th className="p-4 text-right">Total Amount</th>
                        <th className="p-4 text-right">Vendor Fee</th>
                        <th className="p-4 text-right">Net Voided</th>
                        <th className="p-4 text-center">Payment</th>
                        <th className="p-4 text-center">Lifecycle Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedOrders.map((ord, index) => (
                        <tr key={ord.order_number || index} className="hover:bg-muted/30 transition-colors border-b last:border-0">
                          <td className="p-4 text-center font-mono font-medium text-muted-foreground align-top pt-5">
                            #{startIndex + index + 1}
                          </td>
                          <td className="p-4 align-top pt-5">
                            {ord.company_id ? (
                              <Link href={`/business/clients/documents/${ord.company_id}?from=orders`}>
                                <Badge
                                  variant="outline"
                                  className="font-mono font-bold text-xs bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400 cursor-pointer transition-colors"
                                  title="Go to Company Documents Folder"
                                >
                                  {ord.order_number}
                                </Badge>
                              </Link>
                            ) : (
                              <Badge variant="outline" className="font-mono font-bold text-xs bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400">
                                {ord.order_number}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 font-bold text-foreground text-sm align-top pt-5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{ord.company_name || "Personal Client Account"}</span>
                              {(() => {
                                const comp = companies.find((c: any) => c.id === (ord.company_id || ord.company?.id)) || ord.company;
                                if (!comp) return null;
                                const vStatus = comp.validation_status;
                                if (vStatus === "PENDING_VALIDATION" || (!vStatus && ord.company_id)) {
                                  return (
                                    <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-0.5" title="Company pending admin validation">
                                      <Clock className="h-2.5 w-2.5" /> Pending Company
                                    </Badge>
                                  );
                                }
                                if (vStatus === "NEEDS_REVISION") {
                                  return (
                                    <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 flex items-center gap-0.5" title="Company needs revision">
                                      <AlertCircle className="h-2.5 w-2.5" /> Revision Required
                                    </Badge>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div className="text-xs font-normal text-muted-foreground flex items-center gap-1 mt-1">
                              <Building className="h-3 w-3 text-muted-foreground" /> {ord.client_name || "Representative"}
                            </div>
                          </td>
                          <td className="p-4 align-top pt-5">
                            {ord.items && ord.items.length > 0 ? (
                              <div className="space-y-1.5 max-w-sm">
                                {ord.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex flex-wrap items-center gap-1.5 border-b border-border/10 last:border-0 pb-1.5 last:pb-0">
                                    <span className="font-semibold text-foreground text-xs leading-normal break-words line-through opacity-70">
                                      {item.job_title}
                                    </span>
                                    {item.job_id && (
                                      <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 bg-primary/5 text-primary border-primary/20 shrink-0">
                                        {item.job_id}
                                      </Badge>
                                    )}
                                    {renderVendorBadge(item)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">-</span>
                            )}
                          </td>
                          <td className="p-4 align-top pt-5">
                            {ord.consultants && ord.consultants.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {ord.consultants.map((c: any) => (
                                  <Badge key={c.id} variant="outline" className="text-[10px] bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20 font-medium flex items-center gap-1">
                                    <UserCheck className="h-3 w-3 text-zinc-500" />
                                    {c.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">No consultant assigned</span>
                            )}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-sm text-muted-foreground line-through align-top pt-5">
                            {formatCurrency(ord.total_amount)}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-sm text-amber-600/70 dark:text-amber-400/70 line-through align-top pt-5">
                            {formatCurrency(ord.total_notary_fee || 0)}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-sm text-rose-600 dark:text-rose-400 line-through align-top pt-5">
                            {formatCurrency((ord.total_amount || 0) - (ord.total_notary_fee || 0))}
                          </td>
                          <td className="p-4 text-center align-top pt-5">
                            <Badge className={`${getPaymentStatusColor(ord.payment_status)} font-bold font-mono border text-[11px]`}>
                              {ord.payment_status || "UNPAID"}
                            </Badge>
                          </td>
                          <td className="p-4 text-center align-top pt-5">
                            <Badge className={`${getOrderStatusColor(ord.status)} font-bold border text-[11px] flex items-center gap-1 justify-center mx-auto`}>
                              <Ban className="h-3 w-3" />
                              {ord.status || "CANCELLED"}
                            </Badge>
                          </td>
                          <td className="p-4 text-right space-x-1 align-top pt-5 whitespace-nowrap">
                            {/* Restore Order */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-bold gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/40 shadow-xs inline-flex items-center"
                              title="Reopen Order back to Active stream"
                              onClick={() => {
                                setSelectedOrderGroup(ord);
                                setIsReopenOpen(true);
                              }}
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </Button>
                            {/* View Details */}
                            <Button
                              size="icon"
                              variant="ghost"
                              title="View Order Details"
                              onClick={() => {
                                setSelectedOrderGroup(ord);
                                const pct = ord.proforma_stage_percent || 70;
                                setProformaPercent(pct);
                                setTempPercent(String(pct));
                                if (ord.proforma_paid_amount != null && ord.proforma_paid_amount > 0) {
                                  setTempAmount(String(Math.round(ord.proforma_paid_amount)));
                                } else {
                                  setTempAmount(String(Math.round((ord.total_amount || 0) * pct / 100)));
                                }
                                setIsPph21(false);
                                setIsViewOpen(true);
                                fetchProgressUpdates(ord.order_number);
                              }}
                            >
                              <Eye className="h-4 w-4 text-slate-500 hover:text-foreground" />
                            </Button>
                            {/* Order Chat */}
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Order Chat"
                              onClick={() => {
                                setSelectedOrderGroup(ord);
                                setIsChatOpen(true);
                                fetchProgressUpdates(ord.order_number);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 text-emerald-600 hover:text-emerald-700" />
                            </Button>
                            {/* Delete (Admin only) */}
                            {isAdmin && (
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Delete Cancelled Order"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                onClick={() => {
                                  setSelectedOrderGroup(ord);
                                  setIsDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
                    <div className="text-xs text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                      <span className="font-medium text-foreground">{Math.min(filteredOrders.length, endIndex)}</span> of{" "}
                      <span className="font-medium text-foreground">{filteredOrders.length}</span> entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

      </div>

      {/* VIEW ORDER DETAILS INLINE SLIDING PANEL (CLEAN NO-SCROLL 2-COLUMN LAYOUT) */}
      <AnimatePresence>
        {isViewOpen && selectedOrderGroup && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[calc(100vw-260px)] bg-white text-zinc-900 flex flex-col overflow-hidden pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 lg:pt-6 lg:px-8 lg:pb-6 shadow-2xl border-l border-zinc-200"
          >
            <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col overflow-hidden min-h-0 text-zinc-900">

              {/* Header with Back Button */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsViewOpen(false)}
                    className="gap-2 font-bold shadow-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Cancelled Orders
                  </Button>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                    <Receipt className="h-6 w-6 text-zinc-600" /> Cancelled Order Summary &amp; Audit Trail
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs font-bold px-3 py-1 bg-destructive/10 text-destructive border border-destructive/30 rounded-lg">
                    {selectedOrderGroup.order_number} (CANCELLED)
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setIsViewOpen(false)} className="rounded-full h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 w-full overflow-y-auto pr-1 min-h-0 space-y-6 pt-4 text-zinc-900">

                {/* 2-Column Responsive Layout Utilizing Horizontal Whitespace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* Left Column (Metadata & Consultants) - 4 cols */}
                  <div className="lg:col-span-4 space-y-4">

                    {/* Cancellation Status Banner */}
                    <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/5 space-y-2">
                      <div className="flex items-center gap-2 text-destructive font-bold text-sm">
                        <Ban className="h-4 w-4" /> Order is Cancelled
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        This order was moved to the Cancelled Archive. You can restore it back to the active workflow anytime.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setIsReopenOpen(true)}
                        className="w-full mt-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
                      >
                        <RotateCcw className="h-4 w-4" /> Restore to Active Orders
                      </Button>
                    </div>

                    {/* Entity & Rep Details */}
                    <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
                      <div className="flex justify-between items-start pb-3 border-b border-zinc-100">
                        <div className="space-y-1">
                          <span className="text-zinc-500 block font-bold uppercase text-[10px] tracking-wider">Target Company Entity</span>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <span className="font-bold text-lg text-zinc-900 block">{selectedOrderGroup.company_name || "Individual Account"}</span>
                            {(() => {
                              const comp = companies.find((c: any) => c.id === (selectedOrderGroup.company_id || selectedOrderGroup.company?.id)) || selectedOrderGroup.company;
                              if (!comp) return null;
                              const vStatus = comp.validation_status;
                              if (vStatus === "PENDING_VALIDATION" || (!vStatus && selectedOrderGroup.company_id)) {
                                return (
                                  <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-300 flex items-center gap-1 rounded-full">
                                    <Clock className="h-3 w-3" /> Pending Validation
                                  </Badge>
                                );
                              }
                              if (vStatus === "NEEDS_REVISION") {
                                return (
                                  <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 bg-red-50 text-red-700 border-red-300 flex items-center gap-1 rounded-full">
                                    <AlertCircle className="h-3 w-3" /> Revision Required
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {selectedOrderGroup.billing_company_id && selectedOrderGroup.billing_company_id !== selectedOrderGroup.company_id && (
                            <div className="pt-1.5 mt-1 border-t border-zinc-100">
                              <span className="text-zinc-500 block font-bold uppercase text-[9px] tracking-wider">Billed To (Invoice Recipient)</span>
                              <span className="font-semibold text-xs text-zinc-800 block">{selectedOrderGroup.billing_company_name || selectedOrderGroup.company_name}</span>
                            </div>
                          )}
                        </div>
                        <Badge className={`${getPaymentStatusColor(selectedOrderGroup.payment_status)} font-mono font-bold text-xs uppercase px-2.5 py-1 rounded-lg`}>
                          {selectedOrderGroup.payment_status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-zinc-500 block font-bold uppercase text-[10px] tracking-wider">Client Representative</span>
                          <span className="font-semibold text-sm text-zinc-900 block mt-0.5">{selectedOrderGroup.client_name || "-"}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block font-bold uppercase text-[10px] tracking-wider">Order Date</span>
                          <span className="font-mono font-semibold text-sm text-zinc-900 block mt-0.5">{formatDate(selectedOrderGroup.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Consultants */}
                    <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-2.5">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 pb-2 border-b border-zinc-100">
                        <Users className="h-3.5 w-3.5 text-zinc-500" /> Assigned Consulting Team
                      </span>
                      {selectedOrderGroup.consultants && selectedOrderGroup.consultants.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          {selectedOrderGroup.consultants.map((c: any) => (
                            <div key={c.id} className="flex items-center gap-2 py-2 px-2.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-all duration-150">
                              <div className="h-7 w-7 rounded-full bg-zinc-200 text-zinc-800 font-bold flex items-center justify-center text-xs shrink-0 border border-zinc-300">
                                {c.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-zinc-900 block truncate text-xs">{c.name}</span>
                                <span className="text-[10px] text-zinc-500 block truncate">{c.job_title || "Consultant"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic text-xs block py-1">No consultants assigned to this order</span>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="space-y-2.5">
                      <Button
                        type="button"
                        onClick={() => setIsProformaPreviewOpen(true)}
                        className="w-full gap-2 font-semibold h-11 text-sm bg-zinc-900 hover:bg-zinc-800 text-white"
                      >
                        <FileText className="h-4 w-4 shrink-0" /> View Proforma Invoice ({proformaPercent || 70}%)
                      </Button>

                      {selectedOrderGroup?.is_final_invoice_finalized && (
                        <Button
                          type="button"
                          onClick={() => setIsFinalInvoicePreviewOpen(true)}
                          className="w-full gap-2 font-semibold h-11 text-sm bg-zinc-900 hover:bg-zinc-800 text-white"
                        >
                          <FileText className="h-4 w-4 shrink-0" /> View Final Invoice
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsChatOpen(true);
                          fetchProgressUpdates(selectedOrderGroup.order_number);
                        }}
                        className="w-full gap-2 font-semibold h-11 text-sm border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-900"
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 text-emerald-600" /> Order Chat &amp; History
                      </Button>
                    </div>

                  </div>

                  {/* Right Column (Line Items & Totals) - 8 cols */}
                  <div className="lg:col-span-8 space-y-4">

                    {/* Service Items Table */}
                    <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                            <th className="p-4">Voided Service Package</th>
                            <th className="p-4 text-right w-36">Voided Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {(selectedOrderGroup.items || []).map((item: any, idx: number) => {
                            const itemKey = `order-cancelled-${selectedOrderGroup.order_number}-${idx}`;
                            const isExpanded = !!expandedItems[itemKey];
                            return (
                              <tr key={item.id || idx} className="hover:bg-zinc-50/60 transition-colors">
                                <td className="p-4 align-top">
                                  <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 shadow-none space-y-1.5 transition-all duration-200 max-w-xl">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-bold text-zinc-950 text-xs leading-normal break-words line-through opacity-75">
                                        {item.job_title}
                                      </span>
                                      {item.job_id && (
                                        <Badge variant="outline" className="text-[9px] font-mono py-0 px-1.5 bg-white text-zinc-700 border-zinc-200 shrink-0">
                                          {item.job_id}
                                        </Badge>
                                      )}
                                      {item.branch_name && (
                                        <Badge variant="outline" className="text-[9px] font-medium py-0 px-1.5 bg-white text-zinc-700 border-zinc-200 shrink-0">
                                          {item.branch_name}
                                        </Badge>
                                      )}
                                      {item.pricing_tier && (
                                        <Badge variant="secondary" className="text-[9px] py-0 px-1.5 font-medium capitalize shrink-0 bg-white text-zinc-600 border border-zinc-200">
                                          {item.pricing_tier.toLowerCase().replace("_", " ")}
                                        </Badge>
                                      )}
                                      {renderVendorBadge(item)}
                                    </div>
                                    {(() => {
                                      const matchedService = services.find((s) => s.id === item.service_id);
                                      const desc = item.description || matchedService?.description;
                                      if (!desc) return null;
                                      return (
                                        <div className="space-y-1">
                                          {isExpanded && (
                                            <div className="mt-1 border-l-2 border-zinc-300 pl-2 py-0.5 text-xs text-zinc-700">
                                              {formatInvoiceDescription(desc, true)}
                                            </div>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => toggleItemExpansion(itemKey)}
                                            className="text-[10px] text-zinc-500 hover:text-zinc-900 font-semibold hover:underline block"
                                          >
                                            {isExpanded ? "Hide details" : "Show details"}
                                          </button>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-sm text-zinc-400 line-through align-top pt-6">
                                  {item.pricing_tier === "PARTNER_A3"
                                    ? item.custom_price_text || "Custom"
                                    : formatCurrency(item.unit_price)
                                  }
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial Summary Breakdown Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">Voided Contract Value</span>
                        <span className="text-xl font-bold font-mono text-zinc-950 block">{formatCurrency(selectedOrderGroup.total_amount)}</span>
                      </div>
                      <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">Vendor Cost Avoided</span>
                        <span className="text-xl font-bold font-mono text-amber-600 block">{formatCurrency(selectedOrderGroup.total_notary_fee || 0)}</span>
                      </div>
                      <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">Net Voided Value</span>
                        <span className="text-xl font-bold font-mono text-rose-600 block">
                          {formatCurrency((selectedOrderGroup.total_amount || 0) - (selectedOrderGroup.total_notary_fee || 0))}
                        </span>
                      </div>
                    </div>

                    {/* Audit Progress & Activity Trail */}
                    <div className="border border-zinc-200 rounded-2xl p-5 bg-white shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                        <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-zinc-500" /> Order History &amp; Audit Logs
                        </h3>
                        <Badge variant="outline" className="text-xs font-mono font-medium text-zinc-600">
                          {progressUpdates.length} Updates
                        </Badge>
                      </div>

                      {loadingProgress ? (
                        <div className="py-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading timeline...
                        </div>
                      ) : progressUpdates.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic py-3 text-center">No logged timeline updates for this order.</p>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {progressUpdates.map((update: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-zinc-800">
                                  {update.user_name || update.created_by_name || "System"}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  {formatDate(update.created_at)}
                                </span>
                              </div>
                              <p className="text-zinc-600 leading-relaxed">{update.message || update.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>
              {/* End of Scrollable Content Body */}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DUAL ORDER CHAT DIALOG */}
      <DualOrderChatDialog
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        orderNumber={selectedOrderGroup?.order_number || null}
        orderTitle={selectedOrderGroup?.items?.[0]?.job_title}
        companyName={selectedOrderGroup?.company_name}
        clientName={selectedOrderGroup?.client_name}
        orderStatus={selectedOrderGroup?.status}
      />

      {/* PROFORMA INVOICE FULLSCREEN VIEW */}
      <AnimatePresence>
        {isProformaPreviewOpen && selectedOrderGroup && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm p-4 sm:p-6 flex flex-col items-center justify-between overflow-hidden"
          >
            <div className="max-w-7xl w-full h-full flex flex-col justify-between space-y-4">

              {/* Top Navigation & Action Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0 print:hidden w-full">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsProformaPreviewOpen(false)}
                    className="gap-2 font-bold shadow-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-black dark:hover:bg-zinc-900 dark:text-white dark:border-white/60 dark:hover:border-white h-8 text-xs transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Order Summary
                  </Button>
                  <div className="h-4 w-px bg-border hidden sm:block" />
                  <span className="font-bold text-xs sm:text-sm flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4 text-emerald-500" /> Cancelled Proforma Invoice Record ({proformaPercent}%)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-destructive/15 text-destructive border border-destructive/30 gap-1.5 px-3 py-1.5 text-xs font-bold font-mono">
                    <Ban className="h-3.5 w-3.5" /> Order Cancelled
                  </Badge>
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    size="sm"
                    className="gap-2 font-bold shadow-sm text-xs h-8 px-4"
                  >
                    {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsProformaPreviewOpen(false)}
                    className="text-muted-foreground hover:text-foreground rounded-full h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Document Container */}
              <div className="flex-1 w-full overflow-y-auto pr-1">
                <div className="p-6 sm:p-8 bg-white text-slate-900 print-area w-full min-h-full flex flex-col justify-between" id="cancelled-proforma-invoice-doc">

                  <div className="space-y-3.5 w-full">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 gap-6">
                      <div>
                        <img
                          src="/logo.png"
                          alt="MCS Consulting Logo"
                          className="h-14 sm:h-16 w-auto object-contain shrink-0 mb-1"
                        />
                        <p className="text-[11px] text-slate-600 leading-tight max-w-md">
                          Springhill Office Tower Lantai 9 Unit 9C, Jalan Benyamin Suaeb Blok D7-Kemayoran, Jakarta Utara 14410<br />
                          Tel: +62 878-7796-7799 | Email: admin@mcsc.co.id | www.mcsc.co.id
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="inline-block px-3 py-1 bg-red-600 text-white font-black font-mono text-[11px] rounded uppercase tracking-wider mb-1">
                          PROFORMA INVOICE (CANCELLED)
                        </div>
                        <h3 className="font-mono text-lg font-black text-slate-900">
                          PI-{selectedOrderGroup.order_number}-{proformaPercent}
                        </h3>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                          Issue Date: <span className="font-mono text-slate-900 font-bold">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </p>
                      </div>
                    </div>

                    {/* Billed To */}
                    <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">BILLED TO (CLIENT ENTITY)</span>
                        <h4 className="text-base font-bold text-slate-900">{selectedOrderGroup.billing_company_name || selectedOrderGroup.company_name || "Client Entity"}</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">Reference Contract #: <span className="font-mono font-bold text-slate-800">{selectedOrderGroup.order_number}</span></p>
                      </div>

                      <div className="text-right border-l border-slate-200 pl-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">STATUS</span>
                        <p className="font-bold text-sm text-red-600">VOIDED / CANCELLED</p>
                      </div>
                    </div>

                    {/* Services Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs !mt-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <th className="p-2 w-12 text-center">#</th>
                            <th className="p-2">Service Line Item</th>
                            <th className="p-2 w-32">Branch / Reference</th>
                            <th className="p-2 w-28">Pricing Tier</th>
                            <th className="p-2 text-right">Contract Price</th>
                            <th className="p-2 text-right text-red-600 font-extrabold">Proforma Amount ({proformaPercent}%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {(selectedOrderGroup.items || []).map((item: any, idx: number) => {
                            const lineFullPrice = item.unit_price || 0;
                            const lineProformaPrice = (lineFullPrice * proformaPercent) / 100;
                            return (
                              <tr key={item.id || idx} className="hover:bg-slate-50/60">
                                <td className="p-2 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                                <td className="p-2">
                                  <span className="font-bold text-slate-900 text-sm leading-tight line-through">{item.job_title}</span>
                                </td>
                                <td className="p-2 text-xs font-semibold text-slate-700 w-32">
                                  {item.branch_name || "-"}
                                </td>
                                <td className="p-2 font-mono font-semibold text-slate-600 w-28">{item.pricing_tier}</td>
                                <td className="p-2 text-right font-mono font-bold text-slate-400 line-through">{formatCurrency(lineFullPrice)}</td>
                                <td className="p-2 text-right font-mono font-bold text-red-600 line-through bg-red-50/30">
                                  {formatCurrency(lineProformaPrice)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Total Calculations */}
                    <div className="flex justify-end pt-2">
                      <div className="w-full sm:w-96 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                          <span>Total Contract Value:</span>
                          <span className="font-bold text-slate-900 line-through">{formatCurrency(selectedOrderGroup.total_amount)}</span>
                        </div>
                        <div className="flex justify-between py-2.5 px-3 rounded-lg bg-red-600 text-white text-sm font-bold shadow-sm">
                          <span>Voided Balance:</span>
                          <span>{formatCurrency((selectedOrderGroup.total_amount * proformaPercent) / 100)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs mt-auto w-full">
                    <p className="text-slate-400 text-[11px]">Notice: This proforma record is archived and voided.</p>
                    <p className="font-bold text-slate-900 text-sm">PT Mandiri Cipta Solusi</p>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FINAL INVOICE FULLSCREEN VIEW */}
      <AnimatePresence>
        {isFinalInvoicePreviewOpen && selectedOrderGroup && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm p-4 sm:p-6 flex flex-col items-center justify-between overflow-hidden"
          >
            <div className="max-w-7xl w-full h-full flex flex-col justify-between space-y-4">

              {/* Top Navigation & Action Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0 print:hidden w-full">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFinalInvoicePreviewOpen(false)}
                    className="gap-2 font-bold text-xs h-8"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Order Summary
                  </Button>
                  <div className="h-4 w-px bg-border hidden sm:block" />
                  <span className="font-bold text-xs sm:text-sm flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4 text-blue-500" /> Cancelled Final Invoice Record
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-destructive/15 text-destructive border border-destructive/30 gap-1.5 px-3 py-1.5 text-xs font-bold font-mono">
                    <Ban className="h-3.5 w-3.5" /> Order Cancelled
                  </Badge>
                  <Button
                    onClick={handleDownloadFinalPDF}
                    disabled={downloadingFinalPdf}
                    size="sm"
                    className="gap-2 font-bold shadow-sm text-xs h-8 px-4"
                  >
                    {downloadingFinalPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download PDF
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFinalInvoicePreviewOpen(false)}
                    className="text-muted-foreground hover:text-foreground rounded-full h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Document Container */}
              <div className="flex-1 w-full overflow-y-auto pr-1">
                <div className="p-6 sm:p-8 bg-white text-slate-900 print-area w-full min-h-full flex flex-col justify-between" id="cancelled-final-invoice-doc">
                  <div className="space-y-3.5 w-full">
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 gap-6">
                      <div>
                        <img
                          src="/logo.png"
                          alt="MCS Consulting Logo"
                          className="h-14 sm:h-16 w-auto object-contain shrink-0 mb-1"
                        />
                        <p className="text-[11px] text-slate-600 leading-tight max-w-md">
                          Springhill Office Tower Lantai 9 Unit 9C, Jalan Benyamin Suaeb Blok D7-Kemayoran, Jakarta Utara 14410<br />
                          Tel: +62 878-7796-7799 | Email: admin@mcsc.co.id | www.mcsc.co.id
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="inline-block px-3 py-1 bg-red-600 text-white font-black font-mono text-[11px] rounded uppercase tracking-wider mb-1">
                          FINAL INVOICE (CANCELLED)
                        </div>
                        <h3 className="font-mono text-lg font-black text-slate-900">
                          INV-{selectedOrderGroup.order_number}
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">BILLED TO</span>
                        <h4 className="text-base font-bold text-slate-900">{selectedOrderGroup.billing_company_name || selectedOrderGroup.company_name || "Client Entity"}</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">Order #: {selectedOrderGroup.order_number}</p>
                      </div>
                      <div className="text-right border-l border-slate-200 pl-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">STATUS</span>
                        <p className="font-bold text-sm text-red-600">VOIDED</p>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs !mt-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <th className="p-2 w-12 text-center">#</th>
                            <th className="p-2">Service Line Item</th>
                            <th className="p-2 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {(selectedOrderGroup.items || []).map((item: any, idx: number) => (
                            <tr key={idx}>
                              <td className="p-2 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-2 font-bold text-slate-900 line-through">{item.job_title}</td>
                              <td className="p-2 text-right font-mono font-bold text-slate-400 line-through">{formatCurrency(item.unit_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs mt-auto w-full">
                    <p className="text-slate-400 text-[11px]">Notice: This invoice is voided.</p>
                    <p className="font-bold text-slate-900 text-sm">PT Mandiri Cipta Solusi</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REOPEN CONFIRMATION MODAL */}
      <Dialog open={isReopenOpen} onOpenChange={setIsReopenOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <RotateCcw className="h-5 w-5 text-emerald-600" /> Restore Cancelled Order
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to restore Order <span className="font-mono font-bold text-foreground">#{selectedOrderGroup?.order_number}</span> back to Active Orders?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1 my-2">
            <p className="font-semibold flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> What will happen:
            </p>
            <ul className="list-disc pl-4 text-[11px] space-y-0.5 opacity-90">
              <li>Order status will be set back to <strong>DRAFT</strong>.</li>
              <li>Order will reappear in the <strong>Active Orders</strong> list.</li>
              <li>A timeline event will record that this order was restored.</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsReopenOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleReopenOrderSubmit}
              disabled={reopeningOrder}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
            >
              {reopeningOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Yes, Restore Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE ORDER MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Permanently Delete Order
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to permanently delete Order <span className="font-mono font-bold text-foreground">#{selectedOrderGroup?.order_number}</span>?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1 my-2">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Caution:
            </p>
            <p className="text-[11px] opacity-90">
              This action cannot be undone. All line items, chat messages, and document associations for this order will be permanently purged.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteOrderSubmit}
              disabled={deletingOrder}
              className="font-semibold gap-1.5"
            >
              {deletingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
