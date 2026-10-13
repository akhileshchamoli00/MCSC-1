"use client";

import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/pagination";
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
  Banknote,
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
  XCircle,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import domToImage from "dom-to-image";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import { DualOrderChatDialog } from "@/components/dual-order-chat-dialog";
import { useUser } from "@/contexts/user-context";

const FILTERS_STORAGE_KEY = "mcsc_cancelled_orders_filters";

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
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Column Header Sorting State
  const [sortColumn, setSortColumn] = useState<string | null>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn === columnKey) {
      return sortDirection === "asc" ? (
        <ArrowUp className="h-3 w-3 text-primary shrink-0" />
      ) : (
        <ArrowDown className="h-3 w-3 text-primary shrink-0" />
      );
    }
    return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover/th:opacity-80 transition-opacity shrink-0" />;
  };

  // Column-Specific Filters State
  const [colFilterOrderId, setColFilterOrderId] = useState("");
  const [colFilterCompany, setColFilterCompany] = useState("");
  const [colFilterService, setColFilterService] = useState("");
  const [colFilterConsultant, setColFilterConsultant] = useState("");
  const [colFilterAmount, setColFilterAmount] = useState("");
  const [colFilterPayment, setColFilterPayment] = useState("ALL");
  const [showColumnFilters, setShowColumnFilters] = useState(true);

  const isRestoredRef = useRef(false);

  const activeColFilterCount = useMemo(() => {
    return [
      colFilterOrderId.trim(),
      colFilterCompany.trim(),
      colFilterService.trim(),
      colFilterConsultant.trim(),
      colFilterAmount.trim(),
      colFilterPayment !== "ALL" ? colFilterPayment : "",
    ].filter(Boolean).length;
  }, [
    colFilterOrderId,
    colFilterCompany,
    colFilterService,
    colFilterConsultant,
    colFilterAmount,
    colFilterPayment,
  ]);

  const saveCurrentFilters = () => {
    if (typeof window === "undefined") return;
    try {
      const dataToSave = {
        searchTerm,
        colFilterOrderId,
        colFilterCompany,
        colFilterService,
        colFilterConsultant,
        colFilterAmount,
        colFilterPayment,
        showColumnFilters,
        sortColumn,
        sortDirection,
        currentPage,
        pageSize,
      };
      sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(dataToSave));
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Error saving filters:", e);
    }
  };

  // Restore saved search and filter parameters on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(FILTERS_STORAGE_KEY) || localStorage.getItem(FILTERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.searchTerm === "string") setSearchTerm(parsed.searchTerm);
        if (typeof parsed.colFilterOrderId === "string") setColFilterOrderId(parsed.colFilterOrderId);
        if (typeof parsed.colFilterCompany === "string") setColFilterCompany(parsed.colFilterCompany);
        if (typeof parsed.colFilterService === "string") setColFilterService(parsed.colFilterService);
        if (typeof parsed.colFilterConsultant === "string") setColFilterConsultant(parsed.colFilterConsultant);
        if (typeof parsed.colFilterAmount === "string") setColFilterAmount(parsed.colFilterAmount);
        if (typeof parsed.colFilterPayment === "string") setColFilterPayment(parsed.colFilterPayment);
        if (typeof parsed.showColumnFilters === "boolean") setShowColumnFilters(parsed.showColumnFilters);
        if (typeof parsed.sortColumn === "string") setSortColumn(parsed.sortColumn);
        if (parsed.sortDirection === "asc" || parsed.sortDirection === "desc") setSortDirection(parsed.sortDirection);
        if (typeof parsed.currentPage === "number" && parsed.currentPage > 0) setCurrentPage(parsed.currentPage);
        if (typeof parsed.pageSize === "number" && [15, 25, 50, 100].includes(parsed.pageSize)) {
          setPageSize(parsed.pageSize);
        }
      }
    } catch (e) {
      console.error("Error reading saved filters:", e);
    } finally {
      setTimeout(() => {
        isRestoredRef.current = true;
      }, 100);
    }
  }, []);

  // Save search and filter parameters whenever they change AFTER initial restoration
  useEffect(() => {
    if (!isRestoredRef.current || typeof window === "undefined") return;
    saveCurrentFilters();
  }, [
    searchTerm,
    colFilterOrderId,
    colFilterCompany,
    colFilterService,
    colFilterConsultant,
    colFilterAmount,
    colFilterPayment,
    showColumnFilters,
    sortColumn,
    sortDirection,
    currentPage,
    pageSize,
  ]);

  const handleClearAllFilters = () => {
    setSearchTerm("");
    setColFilterOrderId("");
    setColFilterCompany("");
    setColFilterService("");
    setColFilterConsultant("");
    setColFilterAmount("");
    setColFilterPayment("ALL");
    setCurrentPage(1);
    try {
      sessionStorage.removeItem(FILTERS_STORAGE_KEY);
      localStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch (e) {}
  };

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
  const [isPph23, setIsPph23] = useState<boolean>(false);
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
        reviewer_id: ord.reviewer_id || null,
        reviewer: ord.reviewer || null,
        reviewer_ids: ord.reviewer_ids || (ord.reviewer_id ? [ord.reviewer_id] : []),
        reviewers: ord.reviewers || (ord.reviewer ? [ord.reviewer] : []),
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

    if (ord.reviewer_id) group.reviewer_id = ord.reviewer_id;
    if (ord.reviewer) group.reviewer = ord.reviewer;
    if (ord.reviewer_ids && Array.isArray(ord.reviewer_ids)) {
      group.reviewer_ids = Array.from(new Set([...(group.reviewer_ids || []), ...ord.reviewer_ids]));
    }
    if (ord.reviewers && Array.isArray(ord.reviewers)) {
      const existingIds = new Set((group.reviewers || []).map((r: any) => r.id));
      for (const r of ord.reviewers) {
        if (!existingIds.has(r.id)) {
          group.reviewers.push(r);
          existingIds.add(r.id);
        }
      }
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

  // Filter ONLY Cancelled orders (sorted reverse-chronologically so latest cancelled order is at top)
  const allCancelledOrders = useMemo(() => {
    return groupedOrders
      .filter((ord) => (ord.status || "").toUpperCase() === "CANCELLED")
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
  }, [groupedOrders]);

  const [highlightedOrderNum, setHighlightedOrderNum] = useState<string | null>(null);

  const openOrderDirectly = (orderNum: string, openChat: boolean = true) => {
    if (!orderNum || allCancelledOrders.length === 0) return;

    const matched = allCancelledOrders.find((o) => o.order_number?.toUpperCase() === orderNum.toUpperCase());
    if (matched) {
      setSearchTerm("");
      const orderIdx = allCancelledOrders.findIndex(o => o.order_number?.toUpperCase() === orderNum.toUpperCase());
      if (orderIdx !== -1) {
        const targetPage = Math.floor(orderIdx / 10) + 1;
        setCurrentPage(targetPage);
      }
      setSelectedOrderGroup(matched);
      if (openChat) {
        setIsChatOpen(true);
        fetchProgressUpdates(matched.order_number);
      } else {
        setIsViewOpen(true);
        fetchProgressUpdates(matched.order_number);
      }

      setHighlightedOrderNum(matched.order_number);
      setTimeout(() => {
        const el = document.getElementById(`order-row-${matched.order_number}`);
        const scrollParent = el?.closest('main') || document.querySelector('main');
        if (el && scrollParent) {
          const parentRect = scrollParent.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          if (elRect.top < parentRect.top || elRect.bottom > parentRect.bottom) {
            const relativeTop = elRect.top - parentRect.top + scrollParent.scrollTop;
            scrollParent.scrollTo({ top: Math.max(0, relativeTop - 120), behavior: "smooth" });
          }
        }
        if (typeof window !== "undefined") {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      }, 300);

      setTimeout(() => {
        setHighlightedOrderNum(null);
      }, 4000);
    }
  };

  // Auto-open chat or view from URL query parameter (for notifications / deep links)
  useEffect(() => {
    if (allCancelledOrders.length === 0) return;

    const checkParams = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const orderNum = params.get("order");
      const openChat = params.get("chat");
      if (orderNum) {
        openOrderDirectly(orderNum, openChat === "true" || openChat === null);
        const url = new URL(window.location.href);
        url.searchParams.delete("order");
        url.searchParams.delete("chat");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    };

    checkParams();

    const handleCustomOpen = (e: any) => {
      if (e.detail?.orderNumber) {
        openOrderDirectly(e.detail.orderNumber, e.detail.chat ?? true);
      }
    };
    window.addEventListener("open-order-chat", handleCustomOpen);

    return () => {
      window.removeEventListener("open-order-chat", handleCustomOpen);
    };
  }, [allCancelledOrders]);

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

  const filteredOrders = allCancelledOrders.filter((ord) => {
    // 1. Global Search
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      const orderNum = (ord.order_number || "").toLowerCase();
      const clientName = (ord.client_name || "").toLowerCase();
      const compName = (ord.company_name || "").toLowerCase();
      const itemsStr = (ord.items || []).map((i: any) => `${i.job_title} ${i.job_id} ${i.branch_name || ""}`).join(" ").toLowerCase();
      const consultantsStr = (ord.consultants || []).map((c: any) => c.name).join(" ").toLowerCase();
      const dateStr = ord.created_at ? formatDate(ord.created_at).toLowerCase() : "";
      if (!orderNum.includes(term) && !clientName.includes(term) && !compName.includes(term) && !itemsStr.includes(term) && !consultantsStr.includes(term) && !dateStr.includes(term)) {
        return false;
      }
    }

    // 2. Column: Order ID & Date
    if (colFilterOrderId.trim()) {
      const q = colFilterOrderId.trim().toLowerCase();
      const orderNum = (ord.order_number || "").toLowerCase();
      const dateStr = ord.created_at ? formatDate(ord.created_at).toLowerCase() : "";
      if (!orderNum.includes(q) && !dateStr.includes(q)) return false;
    }

    // 3. Column: Company Entity / Client
    if (colFilterCompany.trim()) {
      const q = colFilterCompany.trim().toLowerCase();
      const compName = (ord.company_name || "").toLowerCase();
      const clientName = (ord.client_name || "").toLowerCase();
      if (!compName.includes(q) && !clientName.includes(q)) return false;
    }

    // 4. Column: Service Package / Memo
    if (colFilterService.trim()) {
      const q = colFilterService.trim().toLowerCase();
      const itemsStr = (ord.items || []).map((i: any) => `${i.job_title} ${i.job_id} ${i.branch_name || ""}`).join(" ").toLowerCase();
      if (!itemsStr.includes(q)) return false;
    }

    // 5. Column: Assigned Consultants
    if (colFilterConsultant.trim()) {
      const q = colFilterConsultant.trim().toLowerCase();
      const consultantsStr = (ord.consultants || []).map((c: any) => c.name).join(" ").toLowerCase();
      const reviewerStr = ord.reviewer?.name?.toLowerCase() || "";
      const reviewersStr = (ord.reviewers || []).map((r: any) => r.name).join(" ").toLowerCase();
      if (!consultantsStr.includes(q) && !reviewerStr.includes(q) && !reviewersStr.includes(q)) return false;
    }

    // 6. Column: Total Amount
    if (colFilterAmount.trim()) {
      const q = colFilterAmount.trim().replace(/,/g, "");
      const total = ord.total_amount || 0;
      if (q.startsWith(">=")) {
        const val = parseFloat(q.slice(2));
        if (!isNaN(val) && total < val) return false;
      } else if (q.startsWith("<=")) {
        const val = parseFloat(q.slice(2));
        if (!isNaN(val) && total > val) return false;
      } else if (q.startsWith(">")) {
        const val = parseFloat(q.slice(1));
        if (!isNaN(val) && total <= val) return false;
      } else if (q.startsWith("<")) {
        const val = parseFloat(q.slice(1));
        if (!isNaN(val) && total >= val) return false;
      } else {
        const val = parseFloat(q);
        if (!isNaN(val)) {
          if (!String(Math.round(total)).includes(q) && Math.abs(total - val) > 1) return false;
        } else {
          if (!String(Math.round(total)).includes(q)) return false;
        }
      }
    }

    // 7. Column: Payment Status
    if (colFilterPayment !== "ALL") {
      if ((ord.payment_status || "UNPAID").toUpperCase() !== colFilterPayment.toUpperCase()) return false;
    }

    return true;
  });

  const sortedOrders = useMemo(() => {
    if (!sortColumn) return filteredOrders;

    return [...filteredOrders].sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      switch (sortColumn) {
        case "id":
          aVal = a.id || 0;
          bVal = b.id || 0;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;

        case "order_number":
          aVal = a.order_number || "";
          bVal = b.order_number || "";
          return sortDirection === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));

        case "created_at":
          aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
          bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;

        case "company_name":
          aVal = a.company_name || a.client_name || "";
          bVal = b.company_name || b.client_name || "";
          return sortDirection === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));

        case "service":
          aVal = a.items?.[0]?.job_title || "";
          bVal = b.items?.[0]?.job_title || "";
          return sortDirection === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));

        case "consultants":
          aVal = (a.consultants || []).map((c: any) => c.name).join(", ") || a.reviewer?.name || "";
          bVal = (b.consultants || []).map((c: any) => c.name).join(", ") || b.reviewer?.name || "";
          return sortDirection === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));

        case "total_amount":
          aVal = Number(a.total_amount) || 0;
          bVal = Number(b.total_amount) || 0;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;

        case "total_notary_fee":
          aVal = Number(a.total_notary_fee) || 0;
          bVal = Number(b.total_notary_fee) || 0;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;

        case "net_voided":
          aVal = (Number(a.total_amount) || 0) - (Number(a.total_notary_fee) || 0);
          bVal = (Number(b.total_amount) || 0) - (Number(b.total_notary_fee) || 0);
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;

        case "payment_status":
          aVal = a.payment_status || "UNPAID";
          bVal = b.payment_status || "UNPAID";
          return sortDirection === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));

        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          return sortDirection === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));

        default:
          return 0;
      }
    });
  }, [filteredOrders, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedOrders.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

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
      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 orders-badge-info"
      : isOther
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 orders-badge-teal"
        : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 orders-badge-indigo";

    const vStatus = notary.validation_status;
    const isPending = vStatus === "PENDING_VALIDATION" || !vStatus;
    const isRevision = vStatus === "NEEDS_REVISION";

    return (
      <div className="inline-flex items-center gap-1 flex-wrap">
        <Badge variant="outline" className={`text-[9px] font-medium py-0 px-1.5 ${baseColor} shrink-0`}>
          {prefix}: {notary.name}
        </Badge>
        {isPending && (
          <Badge variant="outline" className="text-[8px] font-medium py-0 px-1 orders-badge-warning shrink-0 flex items-center gap-0.5" title="Vendor pending admin validation">
            <Clock className="h-2 w-2" /> Pending Validation
          </Badge>
        )}
        {isRevision && (
          <Badge variant="outline" className="text-[8px] font-medium py-0 px-1 orders-badge-danger shrink-0 flex items-center gap-0.5" title="Vendor needs revision">
            <AlertCircle className="h-2 w-2" /> Revision Needed
          </Badge>
        )}
      </div>
    );
  };

  const getStatusDisplayLabel = (status: string) => {
    if (!status) return "Cancelled";
    const map: Record<string, string> = {
      IN_PROGRESS: "In progress",
      ORDER_ASSIGNED: "Order assigned",
      REVIEW_DOCS: "Review docs",
      DOCUMENTS_REVIEWED: "Docs reviewed",
      PRE_DOC_SENT_FOR_SIGNATURE: "Pre-doc for signature",
      PRE_DOCS_SENT: "Pre-docs sent",
      AWAITING_SIGNING_NOTARIZATION: "Awaiting signing",
      FINAL_DOCUMENT_PREPARATION: "Final doc prep",
      FINAL_DOC_READY: "Final doc ready",
      AWAITING_DOCUMENT_RETURN: "Awaiting doc return",
      AWAITING_THIRD_PARTY_RESPONSE: "Third-party response",
      WAITING_ON_CLIENT: "Waiting on client",
      WAITING_FOR_FINAL_PAYMENT: "Waiting final payment",
      WAITING_ON_FINAL_PAYMENT: "Waiting final payment",
      FINAL_PAYMENT_COMPLETED: "Final payment done",
      SOFT_COPY_DELIVERED: "Soft copy delivered",
      HARD_COPY_DELIVERED: "Hard copy delivered",
      ON_HOLD: "On hold",
      CONFIRMED: "Confirmed",
      DRAFT: "Draft",
      PROFORMA_GENERATED: "Proforma generated",
      INVOICE_GENERATED: "Invoice generated",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    if (map[status]) return map[status];
    return status
      .toLowerCase()
      .split("_")
      .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(" ");
  };

  const getPaymentDisplayLabel = (pStatus: string) => {
    if (!pStatus) return "Unpaid";
    const upper = pStatus.toUpperCase();
    if (upper === "PAID") return "Paid";
    if (upper === "PARTIALLY_PAID" || upper === "PARTIAL") return "Partial";
    if (upper === "UNPAID") return "Unpaid";
    return pStatus.charAt(0).toUpperCase() + pStatus.slice(1).toLowerCase();
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "FINAL_DOC_READY":
      case "FINAL_PAYMENT_COMPLETED":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 orders-badge-success font-medium";
      case "IN_PROGRESS":
      case "ORDER_ASSIGNED":
      case "REVIEW_DOCS":
      case "DOCUMENTS_REVIEWED":
      case "FINAL_DOCUMENT_PREPARATION":
      case "CONFIRMED":
        return "bg-sky-500/10 text-sky-700 border-sky-500/25 orders-badge-info font-medium";
      case "WAITING_ON_CLIENT":
      case "WAITING_FOR_FINAL_PAYMENT":
      case "WAITING_ON_FINAL_PAYMENT":
      case "AWAITING_DOCUMENT_RETURN":
      case "AWAITING_THIRD_PARTY_RESPONSE":
      case "AWAITING_SIGNING_NOTARIZATION":
      case "ON_HOLD":
        return "bg-amber-500/10 text-amber-700 border-amber-500/25 orders-badge-warning font-medium";
      case "PRE_DOC_SENT_FOR_SIGNATURE":
      case "PRE_DOCS_SENT":
      case "SOFT_COPY_DELIVERED":
      case "HARD_COPY_DELIVERED":
        return "bg-violet-500/10 text-violet-700 border-violet-500/25 orders-badge-purple font-medium";
      case "DRAFT":
      case "PROFORMA_GENERATED":
      case "INVOICE_GENERATED":
        return "bg-zinc-500/10 text-zinc-700 border-zinc-500/25 orders-badge-neutral font-medium";
      case "CANCELLED":
      default:
        return "bg-rose-500/10 text-rose-700 border-rose-500/25 orders-badge-danger font-medium";
    }
  };

  const getPaymentStatusColor = (pStatus: string) => {
    switch (pStatus) {
      case "PAID":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 orders-badge-success font-medium";
      case "PARTIALLY_PAID":
        return "bg-amber-500/10 text-amber-700 border-amber-500/25 orders-badge-warning font-medium";
      default:
        return "bg-rose-500/10 text-rose-700 border-rose-500/25 orders-badge-danger font-medium";
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
      <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-none pb-12 orders-page-shell">

        {/* Minimalist Metrics Strip & Quick Links Row */}
        <div className="flex flex-col xl:flex-row items-stretch gap-3 w-full">
          {/* Minimalist Metric Strip - Expanded Horizontally */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-xs flex-1 gap-3 sm:gap-4 orders-table-card">
            
            {/* Total Cancelled */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
                <Ban className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Voided Orders</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalOrdersCount}</p>
              </div>
            </div>

            {/* Voided Value */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
                <Banknote className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Voided Value</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>

            {/* Net Voided */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Net Impact</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(totalActualEarnings)}</p>
              </div>
            </div>

            {/* Vendor Saved */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                <Scale className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Vendor Relieved</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(totalVendorFees)}</p>
              </div>
            </div>

            {/* Staff Disengaged */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
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
            <Link href="/business/clients/orders" className="flex-1 xl:flex-initial flex items-stretch">
              <Button variant="outline" className="w-full xl:w-auto gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-4 text-xs">
                <Clock className="h-4 w-4" /> Active Orders
              </Button>
            </Link>
            <Link href="/business/clients/orders/completed" className="flex-1 xl:flex-initial flex items-stretch">
              <Button variant="outline" className="w-full xl:w-auto gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-4 text-xs">
                <Receipt className="h-4 w-4" /> Completed
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Orders Table */}
        <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl orders-table-card">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border/50">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search across all fields..."
                  className="pl-8 h-9 text-xs rounded-xl bg-background/70 border-border/50 orders-control"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant={showColumnFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowColumnFilters(!showColumnFilters)}
                className="h-9 px-3 rounded-xl text-xs font-semibold gap-1.5 shrink-0 orders-control"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Column Filters</span>
                {activeColFilterCount > 0 && (
                  <Badge variant="default" className="h-4 px-1.5 text-[9px] font-bold rounded-full ml-0.5">
                    {activeColFilterCount}
                  </Badge>
                )}
              </Button>
              {(searchTerm || activeColFilterCount > 0) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="h-9 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1 shrink-0"
                >
                  <X className="h-3.5 w-3.5" /> Clear Filters
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground orders-text-secondary">
                <span className="text-[11px] font-medium orders-text-secondary">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="h-8 px-2 py-0.5 text-xs font-semibold rounded-lg bg-background border border-border/60 text-foreground cursor-pointer hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-primary transition-colors shadow-2xs orders-control"
                  aria-label="Select orders per page"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-[11px] font-medium orders-text-secondary">per page</span>
              </div>
              <span className="text-xs font-normal text-muted-foreground orders-text-secondary hidden sm:inline">
                Showing {sortedOrders.length === 0 ? 0 : startIndex + 1} to {Math.min(sortedOrders.length, endIndex)} of {sortedOrders.length} orders
              </span>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-30">
                      <tr className="border-b border-border/60 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                        <th 
                          onClick={() => handleSort("id")}
                          className="sticky top-0 z-30 py-2.5 px-2 w-8 text-center bg-zinc-100 dark:bg-zinc-900 border-b border-border/70 shadow-2xs cursor-pointer select-none group/th hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors orders-th"
                          title="Click to sort by Sequence #"
                        >
                          <div className="flex items-center justify-center gap-0.5">
                            <span>No.</span>
                            {renderSortIcon("id")}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("order_number")}
                          className="sticky top-0 z-30 py-2.5 px-2 whitespace-nowrap w-24 bg-zinc-100 dark:bg-zinc-900 border-b border-border/70 shadow-2xs cursor-pointer select-none group/th hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors orders-th"
                          title="Click to sort by Order ID & Date"
                        >
                          <div className="flex items-center gap-1">
                            <span>Order ID</span>
                            {renderSortIcon("order_number")}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("company_name")}
                          className="sticky top-0 z-30 py-2.5 px-2 min-w-[120px] max-w-[160px] bg-zinc-100 dark:bg-zinc-900 border-b border-border/70 shadow-2xs cursor-pointer select-none group/th hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors orders-th"
                          title="Click to sort by Company Entity"
                        >
                          <div className="flex items-center gap-1">
                            <span>Company Entity</span>
                            {renderSortIcon("company_name")}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("service")}
                          className="sticky top-0 z-30 py-2.5 px-2.5 min-w-[220px] max-w-[320px] bg-zinc-100 dark:bg-zinc-900 border-b border-border/70 shadow-2xs cursor-pointer select-none group/th hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors orders-th"
                          title="Click to sort by Service Package"
                        >
                          <div className="flex items-center gap-1">
                            <span>Service Package</span>
                            {renderSortIcon("service")}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("consultants")}
                          className="sticky top-0 z-30 py-2.5 px-3 w-36 min-w-[145px] max-w-[170px] whitespace-nowrap text-left bg-zinc-100 dark:bg-zinc-900 border-b border-border/70 shadow-2xs cursor-pointer select-none group/th hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors orders-th"
                          title="Click to sort by Assigned Consultants"
                        >
                          <div className="flex items-center gap-1">
                            <span>Assigned Consultants</span>
                            {renderSortIcon("consultants")}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("total_amount")}
                          className="sticky top-0 z-30 py-2.5 px-2.5 text-right whitespace-nowrap bg-zinc-100 dark:bg-zinc-900 border-b border-border/70 shadow-2xs cursor-pointer select-none group/th hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors orders-th"
                          title="Click to sort by Total Amount"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Total Amount</span>
                            {renderSortIcon("total_amount")}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("total_notary_fee")}
                          className="sticky top-0 z-30 py-2.5 px-2.5 text-right whitespace-nowrap bg-zinc-100 dark:bg-zinc-900 border-b border-border/70 shadow-2xs cursor-pointer select-none group/th hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors orders-th"
                          title="Click to sort by Vendor Fee"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Vendor Fee</span>
                            {renderSortIcon("total_notary_fee")}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("net_voided")}
                          className="sticky top-0 z-30 py-2.5 px-2.5 text-right whitespace-nowrap bg-zinc-100 dark:bg-zinc-900 border-b border-border/70 shadow-2xs cursor-pointer select-none group/th hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors orders-th"
                          title="Click to sort by Net Voided"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Net Voided</span>
                            {renderSortIcon("net_voided")}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("payment_status")}
                          className="sticky top-0 z-30 py-2.5 px-2 text-center whitespace-nowrap min-w-[85px] bg-zinc-100 dark:bg-zinc-900 border-b border-border/70 shadow-2xs cursor-pointer select-none group/th hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors orders-th"
                          title="Click to sort by Payment"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Payment</span>
                            {renderSortIcon("payment_status")}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("status")}
                          className="sticky top-0 z-30 py-2.5 px-2 text-left whitespace-nowrap min-w-[130px] max-w-[155px] bg-zinc-100 dark:bg-zinc-900 border-b border-border/70 shadow-2xs cursor-pointer select-none group/th hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors orders-th"
                          title="Click to sort by Lifecycle Status"
                        >
                          <div className="flex items-center gap-1">
                            <span>Lifecycle Status</span>
                            {renderSortIcon("status")}
                          </div>
                        </th>
                        <th className="sticky top-0 right-0 z-40 py-2.5 px-2 text-right whitespace-nowrap bg-zinc-100 dark:bg-zinc-900 border-b border-border/70 shadow-2xs border-l border-border/40 orders-th orders-col-actions w-32 min-w-[120px] max-w-[135px]">
                          Actions
                        </th>
                      </tr>
                      {showColumnFilters && (
                        <tr className="bg-muted/15 dark:bg-zinc-900/60 border-b border-border/50 dark:border-zinc-800 text-xs orders-filter-row">
                          {/* 1. No. */}
                          <th className="py-1.5 px-1 text-center align-middle">
                            {activeColFilterCount > 0 ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAllFilters}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mx-auto orders-action-btn is-delete"
                                title="Reset all column filters"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/40 dark:text-zinc-600 font-mono orders-text-secondary">#</span>
                            )}
                          </th>
                          {/* 2. Order ID */}
                          <th className="py-1.5 px-1.5">
                            <Input
                              placeholder="ID / date..."
                              value={colFilterOrderId}
                              onChange={(e) => setColFilterOrderId(e.target.value)}
                              className="h-7 text-[11px] px-1.5 rounded-md bg-background/80 dark:bg-zinc-900 border-border/60 dark:border-zinc-700/60 font-mono text-foreground dark:text-zinc-100 placeholder:text-muted-foreground/50 dark:placeholder:text-zinc-500 w-full orders-control"
                            />
                          </th>
                          {/* 3. Company Entity */}
                          <th className="py-1.5 px-1.5">
                            <Input
                              placeholder="Company / client..."
                              value={colFilterCompany}
                              onChange={(e) => setColFilterCompany(e.target.value)}
                              className="h-7 text-[11px] px-2 rounded-md bg-background/80 dark:bg-zinc-900 border-border/60 dark:border-zinc-700/60 text-foreground dark:text-zinc-100 placeholder:text-muted-foreground/50 dark:placeholder:text-zinc-500 w-full orders-control"
                            />
                          </th>
                          {/* 4. Service Package */}
                          <th className="py-1.5 px-1.5">
                            <Input
                              placeholder="Service / code / memo..."
                              value={colFilterService}
                              onChange={(e) => setColFilterService(e.target.value)}
                              className="h-7 text-[11px] px-2 rounded-md bg-background/80 dark:bg-zinc-900 border-border/60 dark:border-zinc-700/60 text-foreground dark:text-zinc-100 placeholder:text-muted-foreground/50 dark:placeholder:text-zinc-500 w-full orders-control"
                            />
                          </th>
                          {/* 5. Assigned Consultants */}
                          <th className="py-1.5 px-1.5">
                            <Input
                              placeholder="Consultant / reviewer..."
                              value={colFilterConsultant}
                              onChange={(e) => setColFilterConsultant(e.target.value)}
                              className="h-7 text-[11px] px-2 rounded-md bg-background/80 dark:bg-zinc-900 border-border/60 dark:border-zinc-700/60 text-foreground dark:text-zinc-100 placeholder:text-muted-foreground/50 dark:placeholder:text-zinc-500 w-full orders-control"
                            />
                          </th>
                          {/* 6. Total Amount */}
                          <th className="py-1.5 px-1.5">
                            <Input
                              placeholder="e.g. >5M"
                              value={colFilterAmount}
                              onChange={(e) => setColFilterAmount(e.target.value)}
                              className="h-7 text-[11px] px-2 rounded-md bg-background/80 dark:bg-zinc-900 border-border/60 dark:border-zinc-700/60 font-mono text-right text-foreground dark:text-zinc-100 placeholder:text-muted-foreground/50 dark:placeholder:text-zinc-500 w-full orders-control"
                            />
                          </th>
                          {/* 7. Vendor Fee */}
                          <th className="py-1.5 px-1.5"></th>
                          {/* 8. Net Voided */}
                          <th className="py-1.5 px-1.5"></th>
                          {/* 9. Payment */}
                          <th className="py-1.5 px-1.5">
                            <select
                              value={colFilterPayment}
                              onChange={(e) => setColFilterPayment(e.target.value)}
                              className="h-7 w-full text-[11px] px-1 rounded-md bg-background/80 dark:bg-zinc-900 border border-border/60 dark:border-zinc-700/60 font-bold text-foreground dark:text-zinc-200 text-center orders-control"
                            >
                              <option value="ALL">All Payments</option>
                              <option value="PAID">PAID</option>
                              <option value="PARTIALLY_PAID">PARTIAL</option>
                              <option value="UNPAID">UNPAID</option>
                            </select>
                          </th>
                          {/* 10. Lifecycle Status */}
                          <th className="py-1.5 px-1.5"></th>
                          {/* 11. Actions */}
                          <th className="py-1.5 px-2 text-right"></th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {paginatedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-14 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center gap-2.5">
                              <Ban className="h-10 w-10 text-muted-foreground/30 stroke-[1.5]" />
                              <span className="text-sm font-semibold text-foreground/80">No Cancelled Orders Found</span>
                              <p className="text-xs max-w-sm text-muted-foreground">
                                {searchTerm || activeColFilterCount > 0
                                  ? "No cancelled orders match the specified filter or search criteria. You can clear your filters above."
                                  : "There are currently no cancelled orders in the archive. All active and completed orders are running smoothly."}
                              </p>
                              {(searchTerm || activeColFilterCount > 0) && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleClearAllFilters}
                                  className="mt-1 text-xs font-semibold h-8 px-3"
                                >
                                  Clear Filters
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedOrders.map((ord, index) => {
                        const isHighlighted = highlightedOrderNum === ord.order_number;
                        return (
                        <tr 
                          key={ord.order_number || index} 
                          id={`order-row-${ord.order_number}`} 
                          className={`transition-all duration-300 border-b border-border/30 last:border-0 orders-row ${
                            isHighlighted 
                              ? "bg-emerald-500/20 dark:bg-emerald-500/25 ring-2 ring-emerald-500 ring-inset shadow-md" 
                              : "hover:bg-muted/40"
                          }`}
                        >
                          <td className="py-2 px-2 text-center font-mono font-medium text-muted-foreground orders-text-secondary align-top pt-2.5 text-xs">
                            #{orderSeqMap.get(ord.order_number || `SINGLE-${ord.id}`) ?? (sortedOrders.length - (startIndex + index))}
                          </td>
                          <td className="py-2 px-2 align-top pt-2.5 whitespace-nowrap">
                            {ord.company_id ? (
                              <Link href={`/business/clients/documents/${ord.company_id}?from=orders`}>
                                <Badge
                                  variant="outline"
                                  className="font-mono font-medium text-xs bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400 orders-badge-danger cursor-pointer transition-colors px-2 py-0.5 rounded"
                                  title="Go to Company Documents Folder"
                                >
                                  {ord.order_number}
                                </Badge>
                              </Link>
                            ) : (
                              <Badge variant="outline" className="font-mono font-medium text-xs bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 orders-badge-danger px-2 py-0.5 rounded">
                                {ord.order_number}
                              </Badge>
                            )}
                          </td>
                          <td className="py-2 px-2 font-bold text-foreground align-top pt-2.5 min-w-[120px] max-w-[160px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-semibold leading-snug break-words orders-text-primary">{ord.company_name || "Personal Client Account"}</span>
                              {(() => {
                                const comp = companies.find((c: any) => c.id === (ord.company_id || ord.company?.id)) || ord.company;
                                if (!comp) return null;
                                const vStatus = comp.validation_status;
                                if (vStatus === "PENDING_VALIDATION" || (!vStatus && ord.company_id)) {
                                  return (
                                    <Badge variant="outline" className="text-[9px] font-medium px-1.5 py-0 orders-badge-warning flex items-center gap-0.5" title="Company pending admin validation">
                                      <Clock className="h-2.5 w-2.5" /> Pending
                                    </Badge>
                                  );
                                }
                                if (vStatus === "NEEDS_REVISION") {
                                  return (
                                    <Badge variant="outline" className="text-[9px] font-medium px-1.5 py-0 orders-badge-danger flex items-center gap-0.5" title="Company needs revision">
                                      <AlertCircle className="h-2.5 w-2.5" /> Revision
                                    </Badge>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div className="text-xs font-normal text-muted-foreground orders-text-secondary flex items-center gap-1 mt-1 truncate">
                              <Building className="h-3 w-3 text-muted-foreground shrink-0" /> <span className="truncate">{ord.client_name || "Representative"}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2.5 align-top pt-2.5 min-w-[220px] max-w-[320px]">
                            {ord.items && ord.items.length > 0 ? (
                              <div className="p-1 rounded-md orders-service-card space-y-1.5 w-full">
                                {ord.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex flex-wrap items-center gap-1.5 border-b border-border/10 last:border-0 pb-1.5 last:pb-0">
                                    <span className="font-medium text-foreground orders-text-primary text-xs leading-normal break-words line-through opacity-70">
                                      {item.job_title}
                                    </span>
                                    {item.job_id && (
                                      <Badge variant="outline" className="text-[9px] font-mono py-0 px-1.5 orders-badge-info shrink-0">
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
                          <td className="py-2 px-3 align-top pt-2.5 w-36 min-w-[145px] max-w-[170px]">
                            <div className="flex flex-col items-start gap-1 w-full">
                              {(() => {
                                const revs = ord.reviewers && ord.reviewers.length > 0 ? ord.reviewers : (ord.reviewer ? [ord.reviewer] : []);
                                return revs.map((r: any) => (
                                  <Badge
                                    key={r.id}
                                    variant="outline"
                                    className="text-[9px] orders-badge-purple font-medium flex items-center gap-1 py-0.5 px-1.5 max-w-full truncate shadow-none"
                                    title={`Reviewer: ${r.name}`}
                                  >
                                    <ShieldCheck className="h-2.5 w-2.5 text-purple-600 shrink-0" />
                                    <span className="truncate"><span className="text-[8px] font-bold uppercase opacity-80 mr-0.5">Rev:</span>{r.name}</span>
                                  </Badge>
                                ));
                              })()}
                              {ord.consultants && ord.consultants.length > 0 ? (
                                ord.consultants.map((c: any) => (
                                  <Badge key={c.id} variant="outline" className="text-[9.5px] orders-badge-neutral font-medium flex items-center gap-1 py-0.5 px-1.5 max-w-full truncate shadow-none">
                                    <UserCheck className="h-2.5 w-2.5 text-zinc-500 shrink-0" />
                                    <span className="truncate">{c.name}</span>
                                  </Badge>
                                ))
                              ) : (!ord.reviewers || ord.reviewers.length === 0) && !ord.reviewer ? (
                                <span className="text-muted-foreground italic text-xs">Unassigned</span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-2 px-2.5 text-right font-sans font-semibold text-sm tabular-nums orders-amount line-through align-top pt-2.5 whitespace-nowrap">
                            {formatCurrency(ord.total_amount)}
                          </td>
                          <td className="py-2 px-2.5 text-right font-sans font-medium text-sm tabular-nums text-amber-600/70 dark:text-amber-400/70 orders-badge-warning line-through align-top pt-2.5 whitespace-nowrap">
                            {formatCurrency(ord.total_notary_fee || 0)}
                          </td>
                          <td className="py-2 px-2.5 text-right font-sans font-semibold text-sm tabular-nums text-rose-600 dark:text-rose-400 orders-badge-danger line-through align-top pt-2.5 whitespace-nowrap">
                            {formatCurrency((ord.total_amount || 0) - (ord.total_notary_fee || 0))}
                          </td>
                          <td className="py-2 px-2 text-center align-top pt-2.5 whitespace-nowrap min-w-[85px]">
                            <Badge className={`${getPaymentStatusColor(ord.payment_status)} font-medium border text-xs px-2 py-0.5 rounded font-sans`}>
                              {getPaymentDisplayLabel(ord.payment_status)}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 text-left align-top pt-2.5 whitespace-nowrap min-w-[130px] max-w-[155px]">
                            <Badge className={`${getOrderStatusColor(ord.status)} font-medium border text-xs px-2 py-0.5 rounded font-sans inline-flex items-center gap-1`}>
                              <Ban className="h-2.5 w-2.5" />
                              {getStatusDisplayLabel(ord.status)}
                            </Badge>
                          </td>
                          <td className="p-3 text-right align-top pt-4 whitespace-nowrap orders-col-actions w-32 min-w-[120px] max-w-[135px]">
                            <div className="flex flex-col items-end gap-1.5">
                              {/* Top row: Utility icon buttons */}
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 rounded p-0 orders-action-btn"
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
                                    setIsPph23(false);
                                    setIsViewOpen(true);
                                    fetchProgressUpdates(ord.order_number);
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 rounded p-0 orders-action-btn"
                                  title="Order Chat"
                                  onClick={() => {
                                    setSelectedOrderGroup(ord);
                                    setIsChatOpen(true);
                                    fetchProgressUpdates(ord.order_number);
                                  }}
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600 hover:text-emerald-700" />
                                </Button>
                                {isAdmin && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 rounded p-0 orders-action-btn is-delete text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    title="Delete Cancelled Order"
                                    onClick={() => {
                                      setSelectedOrderGroup(ord);
                                      setIsDeleteOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                              {/* Bottom row: Stacked workflow action */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-5 px-1.5 text-[8.5px] font-semibold gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/40 shadow-none inline-flex items-center rounded whitespace-nowrap"
                                title="Reopen Order back to Active stream"
                                onClick={() => {
                                  setSelectedOrderGroup(ord);
                                  setIsReopenOpen(true);
                                }}
                              >
                                <RotateCcw className="h-2.5 w-2.5" /> Restore
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {sortedOrders.length > 0 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalEntries={sortedOrders.length}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                />
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

                    {/* Designated Order Reviewers */}
                    {(() => {
                      const revList = selectedOrderGroup.reviewers && selectedOrderGroup.reviewers.length > 0
                        ? selectedOrderGroup.reviewers
                        : (selectedOrderGroup.reviewer ? [selectedOrderGroup.reviewer] : []);
                      if (revList.length === 0) return null;
                      return (
                        <div className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/40 shadow-xs space-y-2">
                          <span className="text-purple-800 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 pb-1.5 border-b border-purple-100">
                            <ShieldCheck className="h-3.5 w-3.5 text-purple-600" /> Designated Order Reviewer{revList.length > 1 ? "s" : ""}
                          </span>
                          <div className="space-y-1.5 pt-0.5">
                            {revList.map((rev: any) => (
                              <div key={rev.id} className="flex items-center gap-2.5 py-1 px-1">
                                <div className="h-8 w-8 rounded-full bg-purple-200 text-purple-900 font-bold flex items-center justify-center text-xs shrink-0 border border-purple-300">
                                  {rev.name?.substring(0, 2).toUpperCase() || "RV"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold text-purple-950 block truncate text-xs">{rev.name}</span>
                                  <span className="text-[10px] text-purple-700 block truncate">{rev.job_title || "Order Reviewer"}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

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
                                  {formatCurrency(item.unit_price)}
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
                            <th className="p-2 w-60">Memo</th>
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
                                <td className="p-2 text-xs font-semibold text-slate-700 w-60">
                                  {item.branch_name ? (
                                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[10px] font-medium whitespace-normal break-words max-w-full">
                                      {item.branch_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-mono text-xs">-</span>
                                  )}
                                </td>
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
