"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  GitBranch, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  Building, 
  UserCheck, 
  Users, 
  ArrowLeft, 
  Eye, 
  Banknote, 
  Loader2, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ArrowRightCircle,
  FileText,
  Briefcase,
  Layers,
  Scale,
  ShieldCheck,
  Printer,
  Download,
  X,
  Calendar,
  Copy,
  Check
} from "lucide-react";
import domToImage from "dom-to-image";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";

export default function PipelineOrdersPage() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_orders_pipeline", "view");

  const [orders, setOrders] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);

  // Authorization Check & Redirect
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to access Pipeline Orders.");
      if (hasPermission("clients_my", "view")) {
        router.replace("/business/assigned-orders");
      } else {
        router.replace("/business/dashboard");
      }
    }
  }, [userLoading, canView, hasPermission, router]);

  // Modals
  const [selectedOrderGroup, setSelectedOrderGroup] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMoveToActiveOpen, setIsMoveToActiveOpen] = useState(false);
  const [movingOrder, setMovingOrder] = useState(false);

  // Lock body scroll when overlays are active
  useEffect(() => {
    if (isViewOpen || isQuotationOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isViewOpen, isQuotationOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleCopyOrderNumber = (e: React.MouseEvent, orderNum: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!orderNum) return;
    navigator.clipboard.writeText(orderNum);
    setCopiedOrderNumber(orderNum);
    toast.success(`Copied Order ID "${orderNum}" to clipboard`);
    setTimeout(() => {
      setCopiedOrderNumber((prev) => (prev === orderNum ? null : prev));
    }, 2000);
  };

  const fetchData = async () => {
    if (userLoading || !canView) return;

    try {
      setLoading(true);
      const [ordersRes, compRes, clientRes, servicesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
          credentials: "include",
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, {
          credentials: "include",
        }).catch(() => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies`, { credentials: "include" })),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
          credentials: "include",
        }).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, {
          credentials: "include",
        }).catch(() => null),
      ]);

      if (ordersRes && ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data);
      }
      if (compRes && compRes.ok) {
        const compData = await compRes.json();
        setCompanies(compData);
      }
      if (clientRes && clientRes.ok) {
        const clientData = await clientRes.json();
        setClients(clientData);
      }
      if (servicesRes && servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }
    } catch (err) {
      console.error("Error fetching pipeline orders:", err);
      toast.error("Failed to load pipeline orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && canView) {
      fetchData();
    }
  }, [userLoading, canView]);

  // Group raw rows by order_number
  const groupedOrdersMap = new Map<string, any>();
  (Array.isArray(orders) ? orders : []).forEach((ord) => {
    const key = ord.order_number || `SINGLE-${ord.id}`;
    if (!groupedOrdersMap.has(key)) {
      groupedOrdersMap.set(key, {
        order_number: ord.order_number,
        client_id: ord.client_id,
        client_name: ord.client_name,
        company_id: ord.company_id,
        company_name: ord.company_name,
        company: ord.company,
        billing_company_id: ord.billing_company_id,
        billing_company_name: ord.billing_company_name,
        status: ord.status,
        payment_status: ord.payment_status,
        consultant_ids: ord.consultant_ids || [],
        consultants: ord.consultants || [],
        reviewer_id: ord.reviewer_id || null,
        reviewer: ord.reviewer || null,
        reviewer_ids: ord.reviewer_ids || (ord.reviewer_id ? [ord.reviewer_id] : []),
        reviewers: ord.reviewers || (ord.reviewer ? [ord.reviewer] : []),
        total_amount: 0,
        notes: ord.notes,
        created_at: ord.created_at,
        items: []
      });
    }

    const group = groupedOrdersMap.get(key);
    group.total_amount += ord.total_amount || 0;
    group.items.push(ord);

    // Keep most recent status
    group.status = ord.status;
    group.payment_status = ord.payment_status;
    if (ord.company) group.company = ord.company;
    if (ord.company_name) group.company_name = ord.company_name;
    if (ord.client_name) group.client_name = ord.client_name;
    if (ord.notes) group.notes = ord.notes;
    if (ord.created_at) group.created_at = ord.created_at;
    if (ord.reviewer_id) group.reviewer_id = ord.reviewer_id;
    if (ord.reviewer) group.reviewer = ord.reviewer;
    if (ord.reviewer_ids && ord.reviewer_ids.length > 0) {
      group.reviewer_ids = Array.from(new Set([...(group.reviewer_ids || []), ...ord.reviewer_ids]));
    }
    if (ord.reviewers && ord.reviewers.length > 0) {
      const existingRevIds = new Set((group.reviewers || []).map((r: any) => r.id));
      ord.reviewers.forEach((r: any) => {
        if (!existingRevIds.has(r.id)) (group.reviewers || []).push(r);
      });
    }

    if (Array.isArray(ord.consultants) && ord.consultants.length > 0) {
      const existingIds = new Set(group.consultants.map((c: any) => c.id));
      ord.consultants.forEach((c: any) => {
        if (!existingIds.has(c.id)) {
          group.consultants.push(c);
          existingIds.add(c.id);
        }
      });
    }
  });

  const groupedOrders = Array.from(groupedOrdersMap.values());

  // Map of order_number -> running chronological sequence number (1, 2, ..., N)
  // Oldest order = 1, latest order = N
  const orderSeqMap = useMemo(() => {
    const map = new Map<string, number>();
    const sorted = [...groupedOrders].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return (a.id || 0) - (b.id || 0);
    });
    sorted.forEach((ord, index) => {
      const key = ord.order_number || `SINGLE-${ord.id}`;
      map.set(key, index + 1);
    });
    return map;
  }, [groupedOrders]);

  // Filter ONLY PIPELINE orders (sorted reverse-chronologically so latest pipeline order is at top)
  const pipelineOrders = useMemo(() => {
    return groupedOrders
      .filter((ord) => (ord.status || "").toUpperCase() === "PIPELINE")
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
  }, [groupedOrders]);

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "-";
    }
  };

  const formatInvoiceDescription = (desc?: string, isSmallText: boolean = false) => {
    if (!desc) return null;

    let processed = desc;
    processed = processed.replace(/\s+([a-zA-Z]|\d+)\.\s+/g, '\n$1. ');
    processed = processed.replace(/\s+([•\-\*])\s+/g, '\n$1 ');

    const lines = processed.split('\n').map(line => line.trim()).filter(Boolean);

    if (lines.length <= 1) {
      return <div className="whitespace-pre-wrap">{desc}</div>;
    }

    return (
      <div className={`space-y-1 mt-1 leading-relaxed ${isSmallText ? 'text-[10px]' : 'text-xs'} text-slate-500`}>
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

  const filteredOrders = pipelineOrders.filter((ord) => {
    const term = searchTerm.toLowerCase();
    const orderNum = (ord.order_number || "").toLowerCase();
    const clientName = (ord.client_name || "").toLowerCase();
    const compName = (ord.company_name || "").toLowerCase();
    const itemsStr = (ord.items || []).map((i: any) => `${i.job_title} ${i.job_id} ${i.branch_name || ""}`).join(" ").toLowerCase();
    const consultantsStr = (ord.consultants || []).map((c: any) => c.name).join(" ").toLowerCase();
    const dateStr = ord.created_at ? formatDate(ord.created_at).toLowerCase() : "";
    return orderNum.includes(term) || clientName.includes(term) || compName.includes(term) || itemsStr.includes(term) || consultantsStr.includes(term) || dateStr.includes(term);
  });

  const totalPages = Math.ceil(filteredOrders.length / 10) || 1;
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Metrics
  const totalOrdersCount = pipelineOrders.length;
  const totalEstimatedValue = pipelineOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const uniqueEntitiesCount = new Set(pipelineOrders.map((o) => o.company_id || o.company_name || o.client_id)).size;
  const totalServicesCount = pipelineOrders.reduce((acc, curr) => acc + (curr.items?.length || 1), 0);

  // Direct PDF File Downloader using domToImage + jsPDF
  const handleDownloadPDF = async () => {
    const element = document.getElementById("quotation-doc");
    if (!element) return;
    setDownloadingPdf(true);

    const company = selectedOrderGroup?.company_name || selectedOrderGroup?.client_name || "Client";
    const contractRef = selectedOrderGroup?.order_number || "Pipeline_Order";
    const rawFileName = `${company}_Quotation_${contractRef}`;
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
      toast.error("Failed to generate PDF. Falling back to print...");
      handlePrintInPage();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrintInPage = () => {
    const docElem = document.getElementById("quotation-doc");
    const originalTitle = document.title;
    const titleNode = document.head.querySelector("title");
    const originalHeadTitle = titleNode ? titleNode.textContent : "";

    const company = selectedOrderGroup?.company_name || selectedOrderGroup?.client_name || "Client";
    const contractRef = selectedOrderGroup?.order_number || "Pipeline_Order";
    const rawFileName = `${company}_Quotation_${contractRef}`;
    const cleanFileName = rawFileName.replace(/[/\\?%*:|"<> ]/g, "_");

    document.title = cleanFileName;
    if (titleNode) {
      titleNode.textContent = cleanFileName;
    } else {
      const newTitle = document.createElement("title");
      newTitle.textContent = cleanFileName;
      document.head.appendChild(newTitle);
    }

    const restoreTitle = () => {
      document.title = originalTitle;
      const tNode = document.head.querySelector("title");
      if (tNode && originalHeadTitle) {
        tNode.textContent = originalHeadTitle;
      }
    };

    if (!docElem) {
      window.print();
      window.addEventListener("afterprint", restoreTitle, { once: true });
      setTimeout(restoreTitle, 5000);
      return;
    }

    const printMount = document.createElement("div");
    printMount.id = "print-mount-point";
    printMount.innerHTML = `<title>${cleanFileName}</title>` + docElem.innerHTML;

    const styleElem = document.createElement("style");
    styleElem.id = "print-mount-styles";
    styleElem.innerHTML = `
      @media print {
        @page {
          margin: 0;
        }
        body > *:not(#print-mount-point) {
          display: none !important;
        }
        #print-mount-point {
          display: block !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 15mm !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-family: inherit !important;
        }
      }
      @media screen {
        #print-mount-point {
          display: none !important;
        }
      }
    `;

    document.body.appendChild(styleElem);
    document.body.appendChild(printMount);

    const cleanup = () => {
      restoreTitle();
      printMount.remove();
      styleElem.remove();
    };

    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 5000);
  };

  const handleDeleteSubmit = async () => {

    if (!selectedOrderGroup) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/group/${selectedOrderGroup.order_number}`, {
      credentials: "include",
        method: "DELETE",
        });
      if (res.ok) {
        toast.success(`Pipeline order ${selectedOrderGroup.order_number} deleted successfully`);
        setIsDeleteOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to delete order");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting pipeline order");
    } finally {
      setSaving(false);
    }
  };

  const handleMoveToActiveSubmit = async () => {

    if (!selectedOrderGroup) return;
    setMovingOrder(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/move-to-active`, {
      credentials: "include",
        method: "POST",
        });
      if (res.ok) {
        toast.success(`Order ${selectedOrderGroup.order_number} moved to Active Orders!`);
        setIsMoveToActiveOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to move order to active");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error moving order to active");
    } finally {
      setMovingOrder(false);
    }
  };

  const renderVendorBadge = (item: any) => {
    if (!item.notary && !item.notary_id) return null;
    const vendorName = item.notary?.name || "Assigned Vendor";
    const vType = item.notary?.vendor_type || (item.notary?.is_gov_officer ? "GOVERNMENT_OFFICER" : item.notary?.is_other_vendor ? "OTHER_VENDORS" : "NOTARY");
    
    let badgeStyle = "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30";
    let typeLabel = "Notary";
    if (vType === "GOVERNMENT_OFFICER") {
      badgeStyle = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      typeLabel = "Gov Officer";
    } else if (vType === "OTHER_VENDORS") {
      badgeStyle = "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30";
      typeLabel = "Vendor";
    }

    return (
      <Badge variant="outline" className={`text-[9px] font-medium py-0 px-1.5 flex items-center gap-1 shrink-0 ${badgeStyle}`} title={`${typeLabel}: ${vendorName}`}>
        <Scale className="h-2.5 w-2.5" />
        <span className="truncate max-w-[110px]">{vendorName}</span>
      </Badge>
    );
  };

  if (userLoading || (!canView && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Verifying pipeline order permissions...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading pipeline orders...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-none pb-12">
        
        {/* Minimalist Metrics Strip & Action Button Row */}
        <div className="flex flex-col xl:flex-row items-stretch gap-3 w-full">
          {/* Minimalist Metric Strip - Expanded Horizontally */}
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-xs flex-1 gap-3 sm:gap-4">
            
            {/* Pipeline Orders */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
                <GitBranch className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Pipeline Deals</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalOrdersCount}</p>
              </div>
            </div>

            {/* Est. Pipeline Value */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <Banknote className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Est. Pipeline Value</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(totalEstimatedValue)}</p>
              </div>
            </div>

            {/* Corporate Entities */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Corporate Entities</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{uniqueEntitiesCount}</p>
              </div>
            </div>

            {/* Scope Line Items */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                <Briefcase className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Scope Line Items</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalServicesCount}</p>
              </div>
            </div>
          </div>

          {/* Create Pipeline Order Button */}
          <Link href="/business/clients/orders/new?type=pipeline" className="shrink-0 flex items-stretch">
            <Button className="w-full sm:w-auto gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm">
              <Plus className="h-4 w-4" /> Create Pipeline Order
            </Button>
          </Link>
        </div>

        {/* Main Orders Table */}
        <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
          <div className="p-4 bg-muted/10 border-b border-border/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Order ID, Company, Service..."
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
                <GitBranch className="h-10 w-10 text-muted-foreground/35" />
                <span className="text-sm font-semibold">No Pipeline Orders Found</span>
                <p className="text-xs max-w-sm">
                  {searchTerm ? "No pipeline orders match your search criteria." : 'Click "Create Pipeline Order" above to input a new prospective sales order.'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                        <th className="p-4 w-12 text-center">No.</th>
                        <th className="p-4 whitespace-nowrap">Order ID & Date</th>
                        <th className="p-4">Company Entity</th>
                        <th className="p-4">Service Package</th>
                        <th className="p-4 text-right">Total Amount</th>
                        <th className="p-4 text-center">Stage</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedOrders.map((ord, index) => (
                        <tr key={ord.order_number || index} className="hover:bg-muted/30 transition-colors border-b last:border-0">
                          <td className="p-4 text-center font-mono font-medium text-muted-foreground align-top pt-5">
                            #{orderSeqMap.get(ord.order_number || `SINGLE-${ord.id}`) ?? (filteredOrders.length - (startIndex + index))}
                          </td>
                          <td className="p-4 align-top pt-5 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 group/copy">
                              {ord.company_id ? (
                                <Link href={`/business/clients/documents/${ord.company_id}?from=pipeline`}>
                                  <Badge
                                    variant="outline"
                                    className="font-mono font-bold text-xs bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 cursor-pointer transition-colors px-2 py-0.5 rounded"
                                    title="Go to Company Documents Folder"
                                  >
                                    {ord.order_number}
                                  </Badge>
                                </Link>
                              ) : (
                                <Badge variant="outline" className="font-mono font-bold text-xs bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded">
                                  {ord.order_number}
                                </Badge>
                              )}
                              {ord.order_number && (
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyOrderNumber(e, ord.order_number)}
                                  className="h-5 w-5 inline-flex items-center justify-center rounded border border-transparent hover:border-border/60 hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all cursor-pointer opacity-50 group-hover/copy:opacity-100 hover:!opacity-100"
                                  title="Copy Order ID"
                                  aria-label="Copy Order ID"
                                >
                                  {copiedOrderNumber === ord.order_number ? (
                                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                            {ord.created_at && (
                              <div
                                className="text-[10.5px] text-muted-foreground font-medium flex items-center gap-1 mt-1 tracking-tight"
                                title={`Order Created: ${new Date(ord.created_at).toLocaleString()}`}
                              >
                                <Calendar className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                                <span>{formatDate(ord.created_at)}</span>
                              </div>
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
                                    <div key={idx} className="space-y-1 border-b border-border/10 last:border-0 pb-1.5 last:pb-0">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-semibold text-foreground text-xs leading-normal break-words">
                                          {item.job_title}
                                        </span>
                                        {item.job_id && (
                                          <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 bg-primary/5 text-primary border-primary/20 shrink-0">
                                            {item.job_id}
                                          </Badge>
                                        )}
                                        {renderVendorBadge(item)}
                                      </div>
                                      {item.branch_name && (
                                        <div className="flex items-center">
                                          <Badge 
                                            variant="outline" 
                                            className="text-[9px] font-medium py-0.5 px-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/30 max-w-[240px] inline-flex items-center gap-1 overflow-hidden"
                                            title={`Memo: ${item.branch_name}`}
                                          >
                                            <span className="font-bold uppercase tracking-wider text-[8px] opacity-75 shrink-0">Memo:</span>
                                            <span className="truncate min-w-0">{item.branch_name}</span>
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">-</span>
                            )}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-sm text-foreground align-top pt-5">
                            {formatCurrency(ord.total_amount)}
                          </td>
                          <td className="p-4 text-center align-top pt-5">
                            <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-bold border text-[11px]">
                              PIPELINE
                            </Badge>
                          </td>
                          <td className="p-4 text-right space-x-1.5 align-top pt-5 whitespace-nowrap">
                            {/* Quotation Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-bold gap-1.5 shadow-xs inline-flex items-center border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 transition-all hover:scale-[1.02]"
                              title="Open Official Quotation"
                              onClick={() => {
                                setSelectedOrderGroup(ord);
                                setIsQuotationOpen(true);
                              }}
                            >
                              <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Quotation
                            </Button>

                            {/* Move to Active Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-bold gap-1.5 shadow-xs inline-flex items-center"
                              title="Move to Active Orders"
                              onClick={() => {
                                setSelectedOrderGroup(ord);
                                setIsMoveToActiveOpen(true);
                              }}
                            >
                              <ArrowRightCircle className="h-3.5 w-3.5" /> Move to Active
                            </Button>

                            {/* Edit Button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Edit Pipeline Order"
                              onClick={() => router.push(`/business/clients/orders/${ord.order_number}/edit?type=pipeline`)}
                            >
                              <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>

                            {/* View Details Button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              title="View Order Details"
                              onClick={() => {
                                setSelectedOrderGroup(ord);
                                setIsViewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 text-slate-500 hover:text-foreground" />
                            </Button>

                            {/* Delete Button */}
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Delete Pipeline Order"
                              onClick={() => {
                                setSelectedOrderGroup(ord);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalEntries={filteredOrders.length}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Move to Active Modal */}
      <Dialog open={isMoveToActiveOpen} onOpenChange={setIsMoveToActiveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <ArrowRightCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Move Order to Active</DialogTitle>
                <DialogDescription className="text-xs">
                  Transition this pipeline order into active execution.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-foreground leading-relaxed">
              Are you sure you want to move order <span className="font-mono font-bold text-primary">{selectedOrderGroup?.order_number}</span> to Active Orders?
            </p>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/40 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Company:</span>
                <span className="font-bold text-foreground">{selectedOrderGroup?.company_name || "Individual"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Value:</span>
                <span className="font-mono font-bold text-foreground">{formatCurrency(selectedOrderGroup?.total_amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Line Items:</span>
                <span className="font-bold text-foreground">{selectedOrderGroup?.items?.length || 0} service(s)</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Once moved, the order will receive status <span className="font-bold text-foreground">DRAFT</span> and appear in the Active Orders board for consultant assignment and billing.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsMoveToActiveOpen(false)}
              className="font-semibold text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMoveToActiveSubmit}
              disabled={movingOrder}
              className="font-bold text-xs h-9 gap-1.5"
            >
              {movingOrder ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {movingOrder ? "Moving..." : "Confirm & Move to Active"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Delete Pipeline Order</DialogTitle>
                <DialogDescription className="text-xs">
                  Permanently remove this prospect order from the pipeline.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-2 text-xs space-y-2">
            <p className="text-foreground leading-relaxed">
              Are you sure you want to delete order <span className="font-mono font-bold text-destructive">{selectedOrderGroup?.order_number}</span>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="font-semibold text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={saving}
              className="font-bold text-xs h-9 gap-1.5"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {saving ? "Deleting..." : "Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <span>Order {selectedOrderGroup?.order_number}</span>
                  <Badge variant="outline" className="font-mono text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30">
                    PIPELINE
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Prospect scope, corporate entity, and pricing breakdown.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedOrderGroup && (
            <div className="space-y-4 py-2 text-xs">
              {/* Entity Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/40">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Target Company</span>
                  <span className="font-bold text-foreground text-sm">{selectedOrderGroup.company_name || "Personal Client"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Representative</span>
                  <span className="font-semibold text-foreground">{selectedOrderGroup.client_name || "-"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Created Date</span>
                  <span className="font-medium text-foreground">{formatDate(selectedOrderGroup.created_at)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Estimated Total</span>
                  <span className="font-mono font-bold text-foreground text-sm">{formatCurrency(selectedOrderGroup.total_amount)}</span>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="font-bold text-xs text-foreground mb-2 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary" /> Service Catalog Line Items
                </h4>
                <div className="space-y-2 border rounded-xl p-2 bg-background">
                  {selectedOrderGroup.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-muted/20 border border-border/30 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">{item.job_title}</span>
                          {item.job_id && (
                            <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 bg-primary/5 text-primary border-primary/20">
                              {item.job_id}
                            </Badge>
                          )}
                          {item.branch_name && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                              {item.branch_name}
                            </Badge>
                          )}
                          {renderVendorBadge(item)}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
                        )}
                        {item.service_instructions && (
                          <div className="mt-1 p-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-0.5">
                            <span className="font-bold text-[10px] text-amber-700 dark:text-amber-400 block">Service Instructions:</span>
                            <p className="text-[11px] font-medium leading-relaxed whitespace-pre-wrap text-foreground">{item.service_instructions}</p>
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-muted-foreground">
                          Tier: <span className="font-semibold text-foreground">{item.pricing_tier}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-foreground">{formatCurrency(item.unit_price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Designated Reviewers (if any) */}
              {(() => {
                const revList = selectedOrderGroup.reviewers && selectedOrderGroup.reviewers.length > 0
                  ? selectedOrderGroup.reviewers
                  : (selectedOrderGroup.reviewer ? [selectedOrderGroup.reviewer] : []);
                if (revList.length === 0) return null;
                return (
                  <div>
                    <h4 className="font-bold text-xs text-foreground mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Designated Order Reviewer{revList.length > 1 ? "s" : ""}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {revList.map((rev: any) => (
                        <Badge key={rev.id} variant="outline" className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold flex items-center gap-1.5 py-1 px-2.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                          {rev.name}
                          <span className="text-[10px] text-muted-foreground ml-1">({rev.job_title || "Reviewer"})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Consultants Allocation (if any) */}
              {selectedOrderGroup.consultants && selectedOrderGroup.consultants.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs text-foreground mb-1.5 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" /> Assigned Consultants
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOrderGroup.consultants.map((c: any) => (
                      <Badge key={c.id} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium flex items-center gap-1 py-1 px-2">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Notes / Instructions */}
              {selectedOrderGroup.notes && (
                <div>
                  <h4 className="font-bold text-xs text-foreground mb-1 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Internal Instructions / Notes
                  </h4>
                  <p className="p-2.5 rounded-lg bg-muted/20 border border-border/40 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedOrderGroup.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsViewOpen(false)}
              className="font-semibold text-xs h-9"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewOpen(false);
                setIsQuotationOpen(true);
              }}
              className="font-bold text-xs h-9 gap-1.5 border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20"
            >
              <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Open Quotation
            </Button>
            <Button
              onClick={() => {
                setIsViewOpen(false);
                router.push(`/business/clients/orders/${selectedOrderGroup?.order_number}/edit?type=pipeline`);
              }}
              className="font-bold text-xs h-9 gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" /> Edit Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUOTATION FULL-PAGE SLIDING VIEW (PROFESSIONAL WIDESCREEN PANEL) */}
      <AnimatePresence>
        {isQuotationOpen && selectedOrderGroup && (() => {
          const billingCompanyId = selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id;
          const companyObj = companies.find((c: any) => c.id === billingCompanyId);
          const targetCompanyObj = companies.find((c: any) => c.id === selectedOrderGroup.company_id);
          const clientObj = clients.find((c: any) => c.id === (companyObj?.client_id || selectedOrderGroup.client_id) || c.contact_person === selectedOrderGroup.client_name);

          const clientEmail = companyObj?.key_contact_email || targetCompanyObj?.key_contact_email || clientObj?.email || "";
          const clientPhone = companyObj?.key_contact_phone || targetCompanyObj?.key_contact_phone || clientObj?.phone || clientObj?.phone_number || "";
          const clientAddress = companyObj?.address || targetCompanyObj?.address || clientObj?.address || "";

          const validUntilDate = selectedOrderGroup.created_at
            ? new Date(new Date(selectedOrderGroup.created_at).getTime() + 14 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

          return (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              className="fixed inset-y-0 right-0 z-[60] w-full md:w-[calc(100vw-260px)] bg-background/95 backdrop-blur-sm p-4 sm:p-6 flex flex-col items-center justify-between overflow-hidden shadow-2xl border-l border-border"
            >
              <div className="max-w-7xl w-full h-full flex flex-col justify-between space-y-4">

                {/* Top Navigation & Action Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0 print:hidden w-full">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQuotationOpen(false)}
                      className="gap-2 font-bold shadow-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-black dark:hover:bg-zinc-900 dark:text-white dark:border-white/60 dark:hover:border-white h-8 text-xs transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Pipeline Orders
                    </Button>
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <span className="font-bold text-xs sm:text-sm flex items-center gap-2 text-foreground">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Official Quotation (QT-{selectedOrderGroup.order_number})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 gap-1.5 px-3 py-1.5 text-xs font-bold font-mono">
                      <GitBranch className="h-3.5 w-3.5" /> Pipeline Prospect
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
                      variant="outline"
                      onClick={handlePrintInPage}
                      size="sm"
                      className="gap-2 font-bold text-xs h-8 px-4"
                    >
                      <Printer className="h-4 w-4" /> Print Quotation
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsQuotationOpen(false)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 rounded-full h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Scrollable Container for the Quotation Card */}
                <div className="flex-1 w-full overflow-y-auto pr-1">
                  <div className="p-8 sm:p-10 bg-white text-slate-900 print-area w-full min-h-full flex flex-col justify-between" id="quotation-doc">

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
                          <div className="inline-block px-3.5 py-1.5 bg-blue-700 text-white font-black font-mono text-xs rounded uppercase tracking-wider mb-1">
                            OFFICIAL SERVICE QUOTATION
                          </div>
                          <h3 className="font-mono text-xl font-black text-slate-900">
                            QT-{selectedOrderGroup.order_number}
                          </h3>
                          <p className="text-xs text-slate-600 font-semibold mt-1">
                            Issue Date: <span className="font-mono text-slate-900 font-bold">{formatDate(selectedOrderGroup.created_at || new Date().toISOString())}</span>
                          </p>
                          <p className="text-xs text-slate-600 font-semibold">
                            Valid Until: <span className="font-mono text-slate-900 font-bold">{formatDate(validUntilDate.toISOString())}</span>
                          </p>
                        </div>
                      </div>

                      {/* Prepared For & Proposal Overview */}
                      <div className="grid grid-cols-2 gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                        <div className="space-y-1">
                          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-1">PREPARED FOR (PROSPECT CLIENT)</span>
                          <h4 className="text-lg font-bold text-slate-900">{selectedOrderGroup.company_name || selectedOrderGroup.billing_company_name || "Prospective Client Entity"}</h4>
                          <p className="text-xs text-slate-600 font-semibold">
                            Attention: <span className="font-bold text-slate-800">{selectedOrderGroup.client_name || "Authorized Representative"}</span>
                          </p>
                          {(clientEmail || clientPhone) && (
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {clientEmail && <span>Email: {clientEmail}</span>}
                              {clientEmail && clientPhone && <span className="mx-1.5">•</span>}
                              {clientPhone && <span>Phone: {clientPhone}</span>}
                            </p>
                          )}
                          {clientAddress && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Address: {clientAddress}</p>
                          )}
                          <p className="text-slate-500 text-xs mt-1">Reference Order #: <span className="font-mono font-bold text-slate-800">{selectedOrderGroup.order_number}</span></p>
                        </div>

                        <div className="text-right border-l border-slate-200 pl-6 space-y-1">
                          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-1">PROPOSAL CONDITIONS</span>
                          <p className="font-bold text-base text-blue-700">14-Day Price Guarantee</p>
                          <p className="text-slate-600 text-xs">Standard Milestone Billing (50% Down Payment on Confirmation)</p>
                          <p className="text-slate-500 text-xs">Status: <span className="font-black text-indigo-600">PIPELINE PROSPECT</span></p>
                        </div>
                      </div>

                      {/* Services Table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-sm !mt-2">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-wider">
                              <th className="p-3 w-12 text-center">#</th>
                              <th className="p-3">Service Line Item & Scope</th>
                              <th className="p-3 w-56">Memo / Reference</th>
                              <th className="p-3 w-28 text-center">Pricing Tier</th>
                              <th className="p-3 text-right">Unit Price</th>
                              <th className="p-3 text-right text-blue-700 font-extrabold">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {(selectedOrderGroup.items || []).map((item: any, idx: number) => {
                              const linePrice = item.unit_price || item.total_amount || 0;
                              const matchedService = services.find((s: any) => s.id === item.service_id);
                              const desc = item.description || matchedService?.description;

                              return (
                                <tr key={item.id || idx} className="hover:bg-slate-50/60">
                                  <td className="p-3 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                                  <td className="p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-extrabold text-slate-900 text-base leading-tight">{item.job_title}</span>
                                      {item.job_id && (
                                        <span className="text-[10px] font-mono font-bold text-slate-500 border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded shrink-0">
                                          {item.job_id}
                                        </span>
                                      )}
                                      {renderVendorBadge(item)}
                                    </div>
                                    {formatInvoiceDescription(desc)}
                                    {item.service_instructions && (
                                      <div className="mt-1 p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                                        <span className="font-bold text-[10px] uppercase text-amber-800 block">Specific Instructions:</span>
                                        {item.service_instructions}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-xs font-semibold text-slate-700 w-56">
                                    {item.branch_name ? (
                                      <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-medium whitespace-normal break-words max-w-full">
                                        {item.branch_name}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-mono text-xs">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center font-mono font-semibold text-xs text-slate-600">
                                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 uppercase text-[10px]">
                                      {item.pricing_tier || "STANDARD"}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-slate-700">{formatCurrency(linePrice)}</td>
                                  <td className="p-3 text-right font-mono font-bold text-blue-700 bg-blue-50/40">
                                    {formatCurrency(linePrice)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Calculation Summary & Bank Wire Details */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-3 gap-6">

                        {/* Bank Wire Details */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1.5 max-w-sm">
                          <span className="font-extrabold uppercase tracking-wider text-xs text-slate-500 flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Official Bank Transfer Account
                          </span>
                          <p className="text-slate-700 font-semibold">Bank Name: <span className="font-bold text-slate-900">Bank Central Asia (BCA)</span></p>
                          <p className="text-slate-700 font-semibold">Account Name: <span className="font-bold text-slate-900">PT MANDIRI CIPTA SOLUSI</span></p>
                          <p className="text-slate-700 font-semibold">Account Number: <span className="font-mono font-bold text-slate-900">591-011-2998</span></p>
                          <p className="text-slate-700 font-semibold">SWIFT Code: <span className="font-mono font-bold text-slate-900">CENAIDJA</span></p>
                        </div>

                        {/* Total Calculations */}
                        <div className="w-full sm:w-96 space-y-2 text-sm font-mono">
                          <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                            <span>Total Proposed Value:</span>
                            <span className="font-bold text-slate-900">{formatCurrency(selectedOrderGroup.total_amount)}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600 text-xs">
                            <span>Quotation Validity:</span>
                            <span className="font-bold text-blue-700">14 Calendar Days</span>
                          </div>
                          <div className="flex justify-between items-center py-2 bg-blue-50 border-y-2 border-blue-600 px-3 rounded text-blue-900 font-bold text-base">
                            <span>GRAND TOTAL:</span>
                            <span className="text-xl font-black text-blue-800">{formatCurrency(selectedOrderGroup.total_amount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quotation Terms & Conditions */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                        <span className="font-bold uppercase tracking-wider text-slate-700 block mb-1">TERMS & CONDITIONS:</span>
                        <p>1. <strong>Validity:</strong> This quotation is valid for 14 calendar days from the issuance date stated above.</p>
                        <p>2. <strong>Payment Schedule:</strong> Standard payment milestone requires a 50% down payment upon order confirmation prior to commencement of work, unless mutually agreed otherwise.</p>
                        <p>3. <strong>Disbursements & Government Fees:</strong> Quoted fees encompass the standard professional services outlined above. Non-standard government levies or client-directed amendments will be notified prior to billing.</p>
                        <p>4. <strong>Confirmation:</strong> To accept this quotation, please sign below or confirm via email/WhatsApp to initialize operational execution.</p>
                      </div>

                      {/* Signatures Block */}
                      <div className="grid grid-cols-2 gap-12 pt-6 pb-2 text-xs">
                        <div className="space-y-12">
                          <p className="font-bold text-slate-700">Prepared by:</p>
                          <div>
                            <div className="border-b border-slate-400 w-48 mb-1" />
                            <p className="font-bold text-slate-900">PT MANDIRI CIPTA SOLUSI</p>
                            <p className="text-slate-500">Corporate & Legal Advisory</p>
                          </div>
                        </div>

                        <div className="space-y-12 text-right">
                          <p className="font-bold text-slate-700">Accepted & Confirmed by Client:</p>
                          <div className="flex flex-col items-end">
                            <div className="border-b border-slate-400 w-48 mb-1" />
                            <p className="font-bold text-slate-900">{selectedOrderGroup.client_name || selectedOrderGroup.company_name || "Authorized Signature"}</p>
                            <p className="text-slate-500">Date: ____________________</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 1.6cm !important;
          }
          body > *:not([role="dialog"]) {
            display: none !important;
          }
          [role="dialog"] {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          #quotation-doc {
            visibility: visible !important;
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
        }
      `}</style>
    </>
  );
}
