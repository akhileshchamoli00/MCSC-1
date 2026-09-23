"use client";
// Force Next.js rebuild: totalOrdersCount defined and checked
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/pagination";
import {
  TeamViewDialog,
  DeleteOrderDialog,
  OrderEmailDispatchDialog,
  OrderDeliverablesDialog,
} from "@/components/orders";
import { useDebounce } from "@/hooks/use-debounce";
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
  Plus,
  Search,
  Loader2,
  Trash2,
  Eye,
  ShoppingCart,
  ArrowLeft,
  Building,
  DollarSign,
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
  Unlock,
  Phone,
  Mail,
  MessageSquare,
  Link2,
  RefreshCw,
  Send,
  FileCheck,
  Paperclip,
  AlertCircle,
  Clock,
  Zap,
  MailCheck,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { PhoneInput, isValidPhoneNumber, isValidEmail } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";
import { Checkbox } from "@/components/ui/checkbox";
import domToImage from "dom-to-image";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import { DualOrderChatDialog } from "@/components/dual-order-chat-dialog";
import { StakeholderRecipientsSelector } from "@/components/stakeholder-recipients-selector";
import { useUser } from "@/contexts/user-context";

export default function ClientOrdersPage() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_orders_active", "view");

  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const [currentPage, setCurrentPage] = useState(1);

  // Authorization Check & Redirect
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to access Active Orders.");
      if (hasPermission("clients_my", "view")) {
        router.replace("/business/assigned-orders");
      } else {
        router.replace("/business/dashboard");
      }
    }
  }, [userLoading, canView, hasPermission, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Modal States
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [newProgressMessage, setNewProgressMessage] = useState("");

  // Mentions / Tagging States
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionSearch, setSuggestionSearch] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [viewingTeam, setViewingTeam] = useState<any | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItemExpansion = (key: string) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatInvoiceDescription = (desc: string, isSmallText: boolean = false) => {
    if (!desc) return null;

    let processed = desc;
    processed = processed.replace(/\s+([a-zA-Z]|\d+)\.\s+/g, '\n$1. ');
    processed = processed.replace(/\s+([•\-\*])\s+/g, '\n$1 ');

    const lines = processed.split('\n').map(line => line.trim()).filter(Boolean);

    if (lines.length <= 1) {
      return <div className="whitespace-pre-wrap">{desc}</div>;
    }

    return (
      <div className={`space-y-1 mt-1 leading-relaxed ${isSmallText ? 'text-[10px]' : 'text-xs'} text-slate-550`}>
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

  const handleTextChange = (val: string, selectionStart: number) => {
    setNewProgressMessage(val);

    // Look back from current cursor to find if we're typing a mention
    const textBeforeCursor = val.slice(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1 && !textBeforeCursor.slice(lastAtIdx).includes(" ")) {
      const query = textBeforeCursor.slice(lastAtIdx + 1).toLowerCase();
      setSuggestionSearch(query);

      // Find the Licensing Team members
      const licensingTeam = (teams || []).find((t: any) => t.name.toLowerCase() === "licensing team");
      const licensingMemberIds = licensingTeam ? (licensingTeam.members || []).map((m: any) => m.id) : [];

      // Filter employees: strictly limit to members of the Licensing Team
      const filteredEmps = (employees || []).filter((emp: any) => {
        const isLicensingMember = licensingMemberIds.includes(emp.id);
        if (!isLicensingMember) return false;

        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
        return fullName.includes(query);
      }).map(emp => ({ ...emp, type: "employee" }));

      // Also filter active teams (include Licensing Team in suggestions)
      const filteredTeams = (teams || []).filter((t: any) =>
        t.is_active && t.name.toLowerCase() === "licensing team" && t.name.toLowerCase().includes(query)
      ).map(t => ({ ...t, type: "team" }));

      const merged = [...filteredEmps, ...filteredTeams];
      setFilteredEmployees(merged);
      setShowSuggestions(merged.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (item: any) => {
    const textarea = document.getElementById("chat-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const val = newProgressMessage;
    const start = textarea.selectionStart;
    const textBeforeCursor = val.slice(0, start);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      const beforeMention = val.slice(0, lastAtIdx);
      const afterMention = val.slice(start);
      const displayName = item.type === "team" ? item.name : `${item.first_name} ${item.last_name}`;
      const insertText = `@${displayName} `;

      const newText = beforeMention + insertText + afterMention;
      setNewProgressMessage(newText);
      setShowSuggestions(false);

      // Focus back and set cursor position after the insert
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = lastAtIdx + insertText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const renderMessageContent = (msg: string) => {
    if (!msg) return null;

    // Create mapping of name/team -> color/type
    const teamMap = new Map();
    (teams || []).forEach((t: any) => {
      teamMap.set(t.name.toLowerCase(), t);
    });

    const namePatterns = (employees || [])
      .map((emp: any) => `${emp.first_name} ${emp.last_name}`)
      .filter(Boolean);

    const teamPatterns = (teams || [])
      .map((t: any) => t.name)
      .filter(Boolean);

    const allPatterns = [...namePatterns, ...teamPatterns]
      .map((name: string) => name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

    if (allPatterns.length === 0) {
      const parts = msg.split(/(@[^\s,.:;!?]+)/g);
      return parts.map((part, index) => {
        if (part.startsWith("@")) {
          return (
            <span key={index} className="bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/25 text-[10px] inline-block">
              {part}
            </span>
          );
        }
        return part;
      });
    }

    const escapedNamesPattern = allPatterns.join('|');
    const emailPattern = '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+';
    const pattern = new RegExp(`(@(?:${escapedNamesPattern}|${emailPattern}))`, 'g');

    const parts = msg.split(pattern);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const entityName = part.slice(1);
        const matchedTeam = teamMap.get(entityName.toLowerCase());

        if (matchedTeam) {
          const tColor = matchedTeam.color || "#10b981";
          return (
            <button
              key={index}
              type="button"
              onClick={() => setViewingTeam(matchedTeam)}
              className="font-bold px-1.5 py-0.5 rounded-md border text-[10px] inline-flex items-center gap-1 transition-transform hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: `${tColor}1a`,
                color: tColor,
                borderColor: `${tColor}40`
              }}
            >
              <Users className="h-3 w-3 shrink-0" /> {part}
            </button>
          );
        }

        return (
          <span key={index} className="bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/25 text-[10px] inline-block">
            {part}
          </span>
        );
      }
      return part;
    });
  };
  const [postingProgress, setPostingProgress] = useState(false);

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

  const handlePostProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgressMessage.trim() || !selectedOrderGroup) return;
    setPostingProgress(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/progress`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: newProgressMessage })
      });
      if (res.ok) {
        const newUpdate = await res.json();
        setProgressUpdates(prev => [...prev, newUpdate]);
        setNewProgressMessage("");
        toast.success("Progress update posted successfully!");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to post progress update");
      }
    } catch (err) {
      console.error("Error posting progress update:", err);
      toast.error("Error posting progress update");
    } finally {
      setPostingProgress(false);
    }
  };
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Proforma Invoice States
  const [isProformaPromptOpen, setIsProformaPromptOpen] = useState(false);
  const [isProformaPreviewOpen, setIsProformaPreviewOpen] = useState(false);
  const [isFinalInvoicePreviewOpen, setIsFinalInvoicePreviewOpen] = useState(false);
  const [proformaPercent, setProformaPercent] = useState<number>(70);
  const [tempPercent, setTempPercent] = useState<string>("70");
  const [tempAmount, setTempAmount] = useState<string>("");
  const [isPph21, setIsPph21] = useState<boolean>(false);





  const fetchData = async () => {
    if (userLoading || !canView) return;
    try {
      setLoading(true);

      // 1. Fetch Orders and unblock the UI spinner immediately
      const fetchOrdersPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
        credentials: "include",
      })
        .then(async res => {
          if (res.ok) {
            const ordData = await res.json();
            setOrders(Array.isArray(ordData) ? ordData : []);
          } else {
            setOrders([]);
          }
        })
        .catch(err => {
          console.error("Error fetching orders:", err);
          setOrders([]);
        })
        .finally(() => {
          setLoading(false); // Unblock table render immediately!
        });

      // 2. Fetch auxiliary lookups concurrently in background without blocking table view
      const fetchAuxPromise = Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, { credentials: "include" })
          .then(r => (r.ok ? r.json() : []))
          .then(setClients),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { credentials: "include" })
          .then(r => (r.ok ? r.json() : []))
          .then(setCompanies),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, { credentials: "include" })
          .then(r => (r.ok ? r.json() : []))
          .then(setServices),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { credentials: "include" })
          .then(r => (r.ok ? r.json() : []))
          .then(setEmployees),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, { credentials: "include" })
          .then(r => (r.ok ? r.json() : []))
          .then(setTeams)
      ]).catch(err => {
        console.error("Error loading auxiliary lookups:", err);
      });

      await Promise.all([fetchOrdersPromise, fetchAuxPromise]);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Error fetching orders data");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAccurate = async (orderIdentifier: any) => {
    if (!orderIdentifier || String(orderIdentifier).trim().toLowerCase() === "undefined") {
      toast.error("Invalid order identifier for Accurate synchronization");
      return;
    }
    const toastId = toast.loading("Syncing order with Accurate Online...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accurate/sync-order/${orderIdentifier}`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sync_type: "AUTO" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Accurate sync successful!", { id: toastId });
        fetchData();
      } else {
        toast.error(data.message || data.error || "Accurate sync failed", { id: toastId });
      }
    } catch (err) {
      toast.error("Error connecting to Accurate Online", { id: toastId });
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

  // Lock body scroll when overlays are active to avoid double scrollbars and empty spaces
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

  const [highlightedOrderNum, setHighlightedOrderNum] = useState<string | null>(null);

  const openOrderDirectly = (orderNum: string, openChat: boolean = true) => {
    if (!orderNum || orders.length === 0) return;

    const matched = groupedOrdersMap.get(orderNum) || Array.from(groupedOrdersMap.values()).find(g => g.order_number?.toUpperCase() === orderNum.toUpperCase());
    if (matched) {
      setSearchTerm("");
      const orderIdx = Array.from(groupedOrdersMap.values()).findIndex(o => o.order_number?.toUpperCase() === orderNum.toUpperCase());
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

  // Auto-open chat from URL query parameter (for notifications) & custom event
  useEffect(() => {
    if (orders.length === 0) return;

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
  }, [orders]);

  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);

  // Group raw rows by order_number
  const groupedOrdersMap = new Map<string, any>();
  (Array.isArray(orders) ? orders : []).forEach((ord) => {
    const key = ord.order_number || `SINGLE-${ord.id}`;
    if (!groupedOrdersMap.has(key)) {
      groupedOrdersMap.set(key, {
        id: ord.id,
        order_number: ord.order_number,
        client_name: ord.client_name,
        client_id: ord.client_id,
        company_name: ord.company_name,
        company_id: ord.company_id,
        billing_company_name: ord.billing_company_name || ord.company_name,
        billing_company_id: ord.billing_company_id || ord.company_id,
        company: ord.company,
        billing_company: ord.billing_company,
        created_at: ord.created_at,
        status: ord.status || "CONFIRMED",
        payment_status: ord.payment_status || "UNPAID",
        payment_link: ord.payment_link || null,
        invoice_number: ord.invoice_number || null,
        consultant_ids: ord.consultant_ids || [],
        consultants: ord.consultants || [],
        reviewer_id: ord.reviewer_id || null,
        reviewer: ord.reviewer || null,
        reviewer_ids: ord.reviewer_ids || (ord.reviewer_id ? [ord.reviewer_id] : []),
        reviewers: ord.reviewers || (ord.reviewer ? [ord.reviewer] : []),
        notes: ord.notes || "",
        total_amount: 0,
        items: [],
        is_proforma_finalized: ord.is_proforma_finalized || false,
        proforma_stage_percent: ord.proforma_stage_percent || 50,
        proforma_paid_amount: ord.proforma_paid_amount != null ? ord.proforma_paid_amount : null,
        is_final_invoice_finalized: ord.is_final_invoice_finalized || false,
        accurate_so_id: ord.accurate_so_id || null,
        accurate_so_no: ord.accurate_so_no || null,
        accurate_inv_id: ord.accurate_inv_id || null,
        accurate_inv_no: ord.accurate_inv_no || null,
        accurate_receipt_no: ord.accurate_receipt_no || null,
        accurate_sync_status: ord.accurate_sync_status || "NOT_SYNCED",
        accurate_sync_error: ord.accurate_sync_error || null,
        accurate_last_synced_at: ord.accurate_last_synced_at || null,
        proforma_sent_at: ord.proforma_sent_at || null,
        proforma_sent_to: ord.proforma_sent_to || null,
        final_invoice_sent_at: ord.final_invoice_sent_at || null,
        final_invoice_sent_to: ord.final_invoice_sent_to || null,
        last_invoice_sent_at: ord.last_invoice_sent_at || null,
        last_invoice_sent_to: ord.last_invoice_sent_to || null,
        invoice_delivery_channel: ord.invoice_delivery_channel || null,
        signed_docs_sent_at: ord.signed_docs_sent_at || null,
        signed_docs_sent_to: ord.signed_docs_sent_to || null,
        deliverables_sent_at: ord.deliverables_sent_at || null,
        deliverables_sent_to: ord.deliverables_sent_to || null
      });
    }
    const group = groupedOrdersMap.get(key);
    if (!group.id && ord.id) group.id = ord.id;
    group.items.push(ord);
    group.total_amount += ord.unit_price || ord.total_amount || 0;

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
    if (ord.reviewer_ids && ord.reviewer_ids.length > 0) {
      group.reviewer_ids = Array.from(new Set([...(group.reviewer_ids || []), ...ord.reviewer_ids]));
    }
    if (ord.reviewers && ord.reviewers.length > 0) {
      const existingRevIds = new Set((group.reviewers || []).map((r: any) => r.id));
      ord.reviewers.forEach((r: any) => {
        if (!existingRevIds.has(r.id)) (group.reviewers || []).push(r);
      });
    }

    if (ord.proforma_sent_at) group.proforma_sent_at = ord.proforma_sent_at;
    if (ord.proforma_sent_to) group.proforma_sent_to = ord.proforma_sent_to;
    if (ord.final_invoice_sent_at) group.final_invoice_sent_at = ord.final_invoice_sent_at;
    if (ord.final_invoice_sent_to) group.final_invoice_sent_to = ord.final_invoice_sent_to;
    if (ord.last_invoice_sent_at) group.last_invoice_sent_at = ord.last_invoice_sent_at;
    if (ord.last_invoice_sent_to) group.last_invoice_sent_to = ord.last_invoice_sent_to;
    if (ord.invoice_delivery_channel) group.invoice_delivery_channel = ord.invoice_delivery_channel;
    if (ord.signed_docs_sent_at) group.signed_docs_sent_at = ord.signed_docs_sent_at;
    if (ord.signed_docs_sent_to) group.signed_docs_sent_to = ord.signed_docs_sent_to;
    if (ord.deliverables_sent_at) group.deliverables_sent_at = ord.deliverables_sent_at;
    if (ord.deliverables_sent_to) group.deliverables_sent_to = ord.deliverables_sent_to;

    if (ord.accurate_so_no) group.accurate_so_no = ord.accurate_so_no;
    if (ord.accurate_so_id) group.accurate_so_id = ord.accurate_so_id;
    if (ord.accurate_inv_no) group.accurate_inv_no = ord.accurate_inv_no;
    if (ord.accurate_inv_id) group.accurate_inv_id = ord.accurate_inv_id;
    if (ord.accurate_receipt_no) group.accurate_receipt_no = ord.accurate_receipt_no;
    if (ord.accurate_sync_status && ord.accurate_sync_status !== "NOT_SYNCED") {
      group.accurate_sync_status = ord.accurate_sync_status;
    }
    if (ord.accurate_sync_error) group.accurate_sync_error = ord.accurate_sync_error;
    if (ord.payment_link) group.payment_link = ord.payment_link;

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

  const handlePctChange = (valStr: string) => {
    setTempPercent(valStr);
    const pct = Number(valStr) || 0;
    if (selectedOrderGroup?.total_amount) {
      const amt = Math.round((selectedOrderGroup.total_amount * pct) / 100);
      setTempAmount(String(amt));
    }
    setProformaPercent(pct);
  };

  const handleAmtChange = (valStr: string) => {
    setTempAmount(valStr);
    const amt = Number(valStr) || 0;
    if (selectedOrderGroup?.total_amount) {
      const pct = Number(((amt / selectedOrderGroup.total_amount) * 100).toFixed(2)) || 0;
      setTempPercent(String(pct));
      setProformaPercent(pct);
    }
  };

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleDeleteSubmit = async () => {
    if (!selectedOrderGroup) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/group/${selectedOrderGroup.order_number}`, {
        credentials: "include",
        method: "DELETE",
      });
      if (!res.ok && selectedOrderGroup.items) {
        await Promise.all(
          selectedOrderGroup.items.map((itemRow: any) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${itemRow.id}`, {
              credentials: "include",
              method: "DELETE",
            })
          )
        );
      }
      toast.success("Order deleted successfully");
      setIsDeleteOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting order");
    } finally {
      setSaving(false);
    }
  };

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

  // Active Orders: Exclude completed & paid orders from Active Orders Management, exclude PIPELINE orders, and exclude CANCELLED orders
  // Sorted reverse-chronologically (newest first) so the latest order is at the top of the list
  const activeOrders = useMemo(() => {
    return groupedOrders
      .filter((ord) => {
        const isCompletedAndPaid = ord.status === "COMPLETED" && ord.payment_status === "PAID";
        const isPipeline = (ord.status || "").toUpperCase() === "PIPELINE";
        const isCancelled = (ord.status || "").toUpperCase() === "CANCELLED";
        return !isCompletedAndPaid && !isPipeline && !isCancelled;
      })
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
  }, [groupedOrders]);

  const filteredOrders = activeOrders.filter((ord) => {
    const term = debouncedSearchTerm.toLowerCase();
    const orderNum = (ord.order_number || "").toLowerCase();
    const clientName = (ord.client_name || "").toLowerCase();
    const compName = (ord.company_name || "").toLowerCase();
    const itemsStr = (ord.items || []).map((i: any) => `${i.job_title} ${i.job_id}`).join(" ").toLowerCase();
    const consultantsStr = (ord.consultants || []).map((c: any) => c.name).join(" ").toLowerCase();
    return orderNum.includes(term) || clientName.includes(term) || compName.includes(term) || itemsStr.includes(term) || consultantsStr.includes(term);
  });

  const totalPages = Math.ceil(filteredOrders.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const totalOrdersCount = activeOrders.length;
  const totalRevenue = activeOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const pendingCollectionCount = activeOrders.filter(o => o.payment_status !== "PAID").length;

  const allocatedStaffSet = new Set<number>();
  activeOrders.forEach(o => {
    if (Array.isArray(o.consultant_ids)) {
      o.consultant_ids.forEach((id: any) => {
        if (typeof id === 'number') allocatedStaffSet.add(id);
        else if (typeof id === 'string' && !isNaN(parseInt(id))) allocatedStaffSet.add(parseInt(id));
      });
    }
  });
  const allocatedStaffCount = allocatedStaffSet.size;

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
      case "CONFIRMED": return "bg-purple-500/15 text-purple-600 border-purple-500/30";
      case "DRAFT": return "bg-zinc-500/15 text-zinc-600 border-zinc-500/30";
      case "CANCELLED": return "bg-destructive/15 text-destructive border-destructive/30";
      case "PROFORMA_GENERATED": return "bg-cyan-500/15 text-cyan-600 border-cyan-500/30";
      case "WAITING_ON_CLIENT": return "bg-amber-500/15 text-amber-600 border-amber-500/30";
      case "ORDER_ASSIGNED": return "bg-indigo-500/15 text-indigo-600 border-indigo-500/30";
      case "IN_PROGRESS": return "bg-blue-500/15 text-blue-600 border-blue-500/30";
      case "ON_HOLD": return "bg-amber-500/15 text-amber-600 border-amber-500/30 font-bold";
      case "REVIEW_DOCS": return "bg-teal-500/15 text-teal-600 border-teal-500/30";
      case "DOCUMENTS_REVIEWED": return "bg-indigo-500/15 text-indigo-600 border-indigo-500/30 font-bold";
      case "PRE_DOC_SENT_FOR_SIGNATURE": return "bg-purple-500/15 text-purple-600 border-purple-500/30 font-bold";
      case "PRE_DOCS_SENT": return "bg-purple-500/15 text-purple-600 border-purple-500/30 font-bold";
      case "FINAL_DOCUMENT_PREPARATION": return "bg-orange-500/15 text-orange-600 border-orange-500/30";
      case "FINAL_DOC_READY": return "bg-lime-500/15 text-lime-600 border-lime-500/30";
      case "INVOICE_GENERATED": return "bg-pink-500/15 text-pink-600 border-pink-500/30";
      case "WAITING_FOR_FINAL_PAYMENT": return "bg-pink-500/15 text-pink-600 border-pink-500/30";
      case "FINAL_PAYMENT_COMPLETED": return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
      case "SOFT_COPY_DELIVERED": return "bg-sky-500/15 text-sky-600 border-sky-500/30";
      case "HARD_COPY_DELIVERED": return "bg-violet-500/15 text-violet-600 border-violet-500/30";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const getPaymentStatusColor = (pStatus: string) => {
    switch (pStatus) {
      case "PAID": return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
      case "PARTIALLY_PAID": return "bg-amber-500/15 text-amber-600 border-amber-500/30";
      default: return "bg-red-500/15 text-red-600 border-red-500/30";
    }
  };

  const isPaymentActionVisible = (ord: any) => {
    if (!ord || ord.payment_status === "PAID") return false;
    const st = (ord.status || "").toUpperCase();
    return st === "WAITING_ON_CLIENT" || st === "WAITING_FOR_FINAL_PAYMENT" || st === "WAITING_ON_FINAL_PAYMENT";
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingFinalPdf, setDownloadingFinalPdf] = useState(false);
  const [finalizingInvoice, setFinalizingInvoice] = useState(false);
  const [finalizingFinalInvoice, setFinalizingFinalInvoice] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Email & WhatsApp Invoice Confirmation Modal State
  const [isEmailConfirmOpen, setIsEmailConfirmOpen] = useState(false);
  const [emailConfirmType, setEmailConfirmType] = useState<'proforma' | 'final' | null>(null);
  const [emailConfirmPhone, setEmailConfirmPhone] = useState("");
  const [invoiceDeliveryChannel, setInvoiceDeliveryChannel] = useState<'both' | 'email' | 'whatsapp'>('both');
  const [selectedInvoiceEmails, setSelectedInvoiceEmails] = useState<string[]>([]);

  // State for Send Final Documents Modal
  const [isSendDocsModalOpen, setIsSendDocsModalOpen] = useState(false);
  const [sendDocsOrder, setSendDocsOrder] = useState<any>(null);
  const [selectedDocsEmails, setSelectedDocsEmails] = useState<string[]>([]);
  const [sendDocsRecipientName, setSendDocsRecipientName] = useState("");
  const [sendDocsCustomMessage, setSendDocsCustomMessage] = useState("");
  const [sendDocsDocuments, setSendDocsDocuments] = useState<any[]>([]);
  const [sendDocsZipInfo, setSendDocsZipInfo] = useState<any>(null);
  const [sendDocsDisableZip, setSendDocsDisableZip] = useState(false);
  const [fetchingDocsLoading, setFetchingDocsLoading] = useState(false);
  const [sendingDocsLoading, setSendingDocsLoading] = useState(false);

  // State for Send Signed Documents Modal
  const [isSendSignedDocsModalOpen, setIsSendSignedDocsModalOpen] = useState(false);
  const [sendSignedDocsOrder, setSendSignedDocsOrder] = useState<any>(null);
  const [selectedSignedDocsEmails, setSelectedSignedDocsEmails] = useState<string[]>([]);
  const [sendSignedDocsRecipientName, setSendSignedDocsRecipientName] = useState("");
  const [sendSignedDocsCustomMessage, setSendSignedDocsCustomMessage] = useState("");
  const [sendSignedDocsDocuments, setSendSignedDocsDocuments] = useState<any[]>([]);
  const [sendSignedDocsZipInfo, setSendSignedDocsZipInfo] = useState<any>(null);
  const [sendSignedDocsDisableZip, setSendSignedDocsDisableZip] = useState(false);
  const [fetchingSignedDocsLoading, setFetchingSignedDocsLoading] = useState(false);
  const [sendingSignedDocsLoading, setSendingSignedDocsLoading] = useState(false);

  // Helper to convert images to base64 Data URLs for foolproof html2canvas PDF generation
  const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(imageUrl);
        reader.readAsDataURL(blob);
      });
    } catch {
      return imageUrl;
    }
  };

  // Direct PDF File Downloader using domToImage + jsPDF
  const handleDownloadPDF = async () => {
    const element = document.getElementById("proforma-invoice-doc");
    if (!element) return;
    setDownloadingPdf(true);

    const company = selectedOrderGroup?.company_name || "Client";
    const contractRef = selectedOrderGroup?.order_number || "Proforma_Invoice";
    const rawFileName = `${company}_${contractRef}`;
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

  const handleFinalizeInvoice = async () => {
    const element = document.getElementById("proforma-invoice-doc");
    if (!element || !selectedOrderGroup) return;
    setFinalizingInvoice(true);
    const company = selectedOrderGroup.company_name || "Client";
    const contractRef = selectedOrderGroup.order_number || "Proforma_Invoice";
    const rawFileName = `${company}_${contractRef}_Proforma_Invoice_${proformaPercent}percent`;
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

      const pdfBlob = pdf.output("blob");

      // Construct FormData to upload the invoice PDF file to the backend
      const formData = new FormData();
      formData.append("file", pdfBlob, fileName);
      formData.append("proforma_stage_percent", String(proformaPercent));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/finalize-invoice`, {
        credentials: "include",
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        let errMsg = "Failed to finalize invoice";
        try {
          const text = await res.text();
          try {
            const err = JSON.parse(text);
            errMsg = err.detail
              ? (typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail))
              : JSON.stringify(err);
          } catch {
            errMsg = text || `Error ${res.status}: ${res.statusText}`;
          }
        } catch (e) {
          errMsg = `Error ${res.status}: ${res.statusText}`;
        }
        throw new Error(errMsg);
      }

      const updatedOrders = await res.json();
      toast.success("Proforma invoice successfully finalized and saved to Dropbox!");

      // Update selectedOrderGroup and main orders state
      setSelectedOrderGroup((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          is_proforma_finalized: true,
          proforma_stage_percent: proformaPercent
        };
      });

      // Update main orders state
      setOrders(prev => prev.map(ord => {
        const matched = updatedOrders.find((u: any) => u.id === ord.id);
        return matched ? matched : ord;
      }));

      // Refresh chat progress to show automated message
      fetchProgressUpdates(selectedOrderGroup.order_number);

    } catch (err: any) {
      console.error("Finalize Invoice Error:", err);
      toast.error(err.message || "Failed to finalize invoice");
    } finally {
      setFinalizingInvoice(false);
    }
  };

  const handleSendInvoiceEmail = (invoiceType: 'proforma' | 'final') => {
    if (!selectedOrderGroup) return;

    // Find billing company & client email (prioritizing the billing company if different from target company)
    const billingCompanyId = selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id;
    const companyObj = companies.find((c: any) => c.id === billingCompanyId);
    const targetCompanyObj = companies.find((c: any) => c.id === selectedOrderGroup.company_id);
    const clientObj = clients.find((c: any) => c.id === (companyObj?.client_id || selectedOrderGroup.client_id) || c.contact_person === selectedOrderGroup.client_name);

    const targetEmail = companyObj?.key_contact_email || targetCompanyObj?.key_contact_email || clientObj?.email || "";
    const targetPhone = companyObj?.key_contact_phone || targetCompanyObj?.key_contact_phone || clientObj?.phone || clientObj?.phone_number || "";

    setEmailConfirmType(invoiceType);
    setSelectedInvoiceEmails(targetEmail ? [targetEmail.trim()] : []);
    setEmailConfirmPhone(targetPhone);
    setInvoiceDeliveryChannel('both');
    setIsEmailConfirmOpen(true);
  };

  const executeSendInvoiceEmail = async () => {
    if (!selectedOrderGroup || !emailConfirmType) return;

    const isEmailActive = invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'email';
    const isWhatsAppActive = invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'whatsapp';

    const billingCompanyId = selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id;
    const companyObj = companies.find((c: any) => c.id === billingCompanyId);
    const targetCompanyObj = companies.find((c: any) => c.id === selectedOrderGroup.company_id);
    const effectiveCompany = companyObj || targetCompanyObj;
    const isCompanyVerified = effectiveCompany ? (effectiveCompany.validation_status === 'VALIDATED' || effectiveCompany.validation_status === 'VERIFIED') : true;
    const companyValStatus = effectiveCompany?.validation_status || 'PENDING_VALIDATION';

    if (isEmailActive) {
      if (!isCompanyVerified) {
        toast.error(`Cannot send email invoice: Company '${effectiveCompany?.company_name || selectedOrderGroup.company_name}' has not been verified (Current status: ${companyValStatus}). Please validate and verify the company profile first.`);
        return;
      }
      if (selectedInvoiceEmails.length === 0) {
        toast.error("Please select at least one registered recipient email address from the contacts list.");
        return;
      }
    }

    if (isWhatsAppActive) {
      if (!emailConfirmPhone.trim()) {
        toast.error("Please enter a WhatsApp mobile number to send WhatsApp notification.");
        return;
      }
      if (!isValidPhoneNumber(emailConfirmPhone)) {
        toast.error("Please enter a valid WhatsApp mobile number (6 to 15 digits).");
        return;
      }
    }

    setSendingEmail(true);
    setIsEmailConfirmOpen(false);
    try {
      const primaryEmail = selectedInvoiceEmails[0] || "";
      const additionalEmails = selectedInvoiceEmails.slice(1);

      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/send-invoice-email?invoice_type=${emailConfirmType}&recipient_email=${encodeURIComponent(primaryEmail.trim())}&recipient_phone=${encodeURIComponent(emailConfirmPhone.trim())}&send_email=${isEmailActive}&send_whatsapp=${isWhatsAppActive}`;
      if (isEmailActive && additionalEmails.length > 0) {
        url += `&additional_recipients=${encodeURIComponent(additionalEmails.join(","))}`;
      }

      const res = await fetch(url, {
        credentials: "include",
        method: "POST",
      });
      if (res.ok) {
        const updatedOrders = await res.json();
        const channelLabel = invoiceDeliveryChannel === 'both'
          ? "via Email & WhatsApp"
          : (invoiceDeliveryChannel === 'email' ? "via Email" : "via WhatsApp");

        toast.success(`Successfully dispatched ${emailConfirmType} invoice ${channelLabel}!`);

        // Update selectedOrderGroup and orders state with the actual status returned from the backend
        if (updatedOrders && updatedOrders.length > 0) {
          const firstUpdated = updatedOrders[0];
          setSelectedOrderGroup((prev: any) => prev ? { ...prev, ...firstUpdated, status: firstUpdated.status } : null);
          setOrders(prev => prev.map(ord => ord.order_number === selectedOrderGroup.order_number ? { ...ord, ...firstUpdated, status: firstUpdated.status } : ord));
        }
        // Refresh full list & chat progress updates (backend records system milestone)
        fetchData();
        fetchProgressUpdates(selectedOrderGroup.order_number);
      } else {
        let errMsg = `Failed to send ${emailConfirmType} invoice`;
        try {
          const err = await res.json();
          errMsg = err.detail || err.message || errMsg;
        } catch {
          errMsg = `Server returned status ${res.status}: ${res.statusText || "Internal Server Error"}`;
        }
        toast.error(errMsg);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error sending invoice");
    } finally {
      setSendingEmail(false);
      setEmailConfirmType(null);
      setSelectedInvoiceEmails([]);
      setEmailConfirmPhone("");
      setInvoiceDeliveryChannel('both');
    }
  };

  const handleOpenSendDocs = async (orderGroup: any) => {
    if (!orderGroup) return;
    setSendDocsOrder(orderGroup);
    setSendDocsCustomMessage("");
    setSendDocsDisableZip(false);
    setIsSendDocsModalOpen(true);

    // Initial email resolution from cached companies & clients
    const billingCompanyId = orderGroup.billing_company_id || orderGroup.company_id;
    const companyObj = companies.find((c: any) => c.id === billingCompanyId);
    const targetCompanyObj = companies.find((c: any) => c.id === orderGroup.company_id);
    const clientObj = clients.find((c: any) => c.id === (companyObj?.client_id || orderGroup.client_id) || c.contact_person === orderGroup.client_name);

    const initialEmail = companyObj?.key_contact_email || targetCompanyObj?.key_contact_email || clientObj?.email || "";
    const initialName = companyObj?.key_contact_person || targetCompanyObj?.key_contact_person || clientObj?.contact_person || orderGroup.company_name || "";

    const initialVerified = (companyObj?.validation_status === 'VALIDATED' || companyObj?.validation_status === 'VERIFIED') || (targetCompanyObj?.validation_status === 'VALIDATED' || targetCompanyObj?.validation_status === 'VERIFIED');
    const initialStatus = companyObj?.validation_status || targetCompanyObj?.validation_status || "PENDING_VALIDATION";

    setSendDocsZipInfo({
      target_company_name: targetCompanyObj?.company_name || companyObj?.company_name || orderGroup.company_name,
      target_company_code: targetCompanyObj?.company_code || companyObj?.company_code || "",
      target_tax_number: targetCompanyObj?.tax_number || companyObj?.tax_number || "",
      is_company_verified: initialVerified,
      company_validation_status: initialStatus,
    });

    setSelectedDocsEmails(initialEmail ? [initialEmail.trim()] : []);
    setSendDocsRecipientName(initialName);
    setSendDocsDocuments([]);
    setFetchingDocsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderGroup.order_number}/final-documents`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSendDocsDocuments(data.documents || []);
        setSendDocsZipInfo({
          zip_password: data.zip_password,
          zip_filename: data.zip_filename,
          target_company_code: data.target_company_code,
          target_tax_number: data.target_tax_number,
          is_company_verified: data.is_company_verified !== undefined ? data.is_company_verified : initialVerified,
          company_validation_status: data.company_validation_status || initialStatus,
        });
        if (data.recipient_email && !initialEmail) {
          setSelectedDocsEmails([data.recipient_email.trim()]);
        }
        if (data.recipient_name && !initialName) {
          setSendDocsRecipientName(data.recipient_name);
        }
      }
    } catch (err) {
      console.error("Failed to fetch order final documents:", err);
    } finally {
      setFetchingDocsLoading(false);
    }
  };

  const executeSendFinalDocs = async () => {
    if (!sendDocsOrder || selectedDocsEmails.length === 0) {
      toast.error("Please select at least one registered company contact email recipient.");
      return;
    }

    const finalDocsBillingComp = companies.find((c: any) => c.id === (sendDocsOrder.billing_company_id || sendDocsOrder.company_id));
    const finalDocsTargetComp = companies.find((c: any) => c.id === sendDocsOrder.company_id);
    const effFinalDocsComp = finalDocsBillingComp || finalDocsTargetComp;
    const isFinalDocsVerified = sendDocsZipInfo?.is_company_verified !== undefined
      ? sendDocsZipInfo.is_company_verified
      : (effFinalDocsComp ? (effFinalDocsComp.validation_status === 'VALIDATED' || effFinalDocsComp.validation_status === 'VERIFIED') : true);
    const finalDocsStatus = sendDocsZipInfo?.company_validation_status || effFinalDocsComp?.validation_status || 'PENDING_VALIDATION';

    if (!isFinalDocsVerified) {
      toast.error(`Cannot send final documents: Company '${sendDocsOrder.company_name}' has not been verified (Current status: ${finalDocsStatus}). Please validate and verify the company profile first.`);
      return;
    }

    setSendingDocsLoading(true);
    const primaryEmail = selectedDocsEmails[0];
    const additionalRecipients = selectedDocsEmails.slice(1);
    const toastId = toast.loading(`Dispatching final documents to ${primaryEmail}...`);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${sendDocsOrder.order_number}/send-final-documents`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipient_email: primaryEmail.trim(),
          recipient_name: sendDocsRecipientName.trim() || sendDocsOrder.company_name || "Valued Client",
          custom_message: sendDocsCustomMessage.trim(),
          additional_recipients: additionalRecipients,
          disable_zip: sendDocsDisableZip
        })
      });

      if (res.ok) {
        let updatedDocsOrders = null;
        try {
          updatedDocsOrders = await res.json();
        } catch (jsonErr) {
          console.warn("Could not parse response JSON:", jsonErr);
        }
        toast.success(`Final documents successfully delivered to ${primaryEmail}!`, { id: toastId });
        setIsSendDocsModalOpen(false);

        // Update local state with the actual status returned from the backend
        if (updatedDocsOrders && updatedDocsOrders.length > 0) {
          const firstDocsUpdated = updatedDocsOrders[0];
          setOrders(prev => prev.map(o => o.order_number === sendDocsOrder.order_number ? { ...o, ...firstDocsUpdated, status: firstDocsUpdated.status } : o));
          setSelectedOrderGroup((prev: any) => prev && prev.order_number === sendDocsOrder.order_number ? { ...prev, ...firstDocsUpdated, status: firstDocsUpdated.status } : prev);
        }

        fetchData();
        fetchProgressUpdates(sendDocsOrder.order_number);
      } else {
        let errMsg = "Failed to send final documents.";
        try {
          const err = await res.json();
          errMsg = err.detail || err.message || errMsg;
        } catch {
          errMsg = `Server returned status ${res.status}: ${res.statusText || "Internal Server Error"}`;
        }
        toast.error(errMsg, { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error sending final documents.", { id: toastId });
    } finally {
      setSendingDocsLoading(false);
    }
  };

  const handleOpenSendSignedDocs = async (orderGroup: any) => {
    if (!orderGroup) return;
    setSendSignedDocsOrder(orderGroup);
    setSendSignedDocsCustomMessage("");
    setSendSignedDocsDisableZip(false);
    setIsSendSignedDocsModalOpen(true);

    // Initial email resolution from cached companies & clients
    const billingCompanyId = orderGroup.billing_company_id || orderGroup.company_id;
    const companyObj = companies.find((c: any) => c.id === billingCompanyId);
    const targetCompanyObj = companies.find((c: any) => c.id === orderGroup.company_id);
    const clientObj = clients.find((c: any) => c.id === (companyObj?.client_id || orderGroup.client_id) || c.contact_person === orderGroup.client_name);

    const initialEmail = companyObj?.key_contact_email || targetCompanyObj?.key_contact_email || clientObj?.email || "";
    const initialName = companyObj?.key_contact_person || targetCompanyObj?.key_contact_person || clientObj?.contact_person || orderGroup.company_name || "";
    const initialTaxNumber = targetCompanyObj?.tax_number || companyObj?.tax_number || "";
    const initialCompCode = targetCompanyObj?.company_code || companyObj?.company_code || "";
    const defaultPass = initialCompCode ? `${initialCompCode}${orderGroup.order_number}` : orderGroup.order_number;
    const cleanCompName = (targetCompanyObj?.company_name || companyObj?.company_name || orderGroup.company_name || "Client").replace(/[/\\?%*:|"<> ]/g, "_");

    const initialVerified = (companyObj?.validation_status === 'VALIDATED' || companyObj?.validation_status === 'VERIFIED') || (targetCompanyObj?.validation_status === 'VALIDATED' || targetCompanyObj?.validation_status === 'VERIFIED');
    const initialStatus = companyObj?.validation_status || targetCompanyObj?.validation_status || "PENDING_VALIDATION";

    setSendSignedDocsZipInfo({
      target_company_name: targetCompanyObj?.company_name || companyObj?.company_name || orderGroup.company_name,
      target_company_code: initialCompCode,
      target_tax_number: initialTaxNumber,
      zip_password: defaultPass || "Company Code + Order ID",
      zip_filename: `${cleanCompName}_${orderGroup.order_number}_Pre_Documents.zip`,
      is_company_verified: initialVerified,
      company_validation_status: initialStatus,
    });

    setSelectedSignedDocsEmails(initialEmail ? [initialEmail.trim()] : []);
    setSendSignedDocsRecipientName(initialName);
    setSendSignedDocsDocuments([]);
    setFetchingSignedDocsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderGroup.order_number}/signed-documents`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSendSignedDocsDocuments(data.documents || []);
        if (data.recipient_email && !initialEmail) {
          setSelectedSignedDocsEmails([data.recipient_email.trim()]);
        }
        if (data.recipient_name && !initialName) {
          setSendSignedDocsRecipientName(data.recipient_name);
        }
        if (data.zip_password || data.zip_filename || data.is_company_verified !== undefined) {
          setSendSignedDocsZipInfo({
            target_company_name: data.target_company_name,
            target_company_code: data.target_company_code,
            target_tax_number: data.target_tax_number,
            zip_password: data.zip_password,
            zip_filename: data.zip_filename,
            is_company_verified: data.is_company_verified !== undefined ? data.is_company_verified : initialVerified,
            company_validation_status: data.company_validation_status || initialStatus,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch order signed documents:", err);
    } finally {
      setFetchingSignedDocsLoading(false);
    }
  };

  const executeSendSignedDocs = async () => {
    if (!sendSignedDocsOrder || selectedSignedDocsEmails.length === 0) {
      toast.error("Please select at least one registered company contact email recipient.");
      return;
    }

    const signedDocsBillingComp = companies.find((c: any) => c.id === (sendSignedDocsOrder.billing_company_id || sendSignedDocsOrder.company_id));
    const signedDocsTargetComp = companies.find((c: any) => c.id === sendSignedDocsOrder.company_id);
    const effSignedDocsComp = signedDocsBillingComp || signedDocsTargetComp;
    const isSignedDocsVerified = sendSignedDocsZipInfo?.is_company_verified !== undefined
      ? sendSignedDocsZipInfo.is_company_verified
      : (effSignedDocsComp ? (effSignedDocsComp.validation_status === 'VALIDATED' || effSignedDocsComp.validation_status === 'VERIFIED') : true);
    const signedDocsStatus = sendSignedDocsZipInfo?.company_validation_status || effSignedDocsComp?.validation_status || 'PENDING_VALIDATION';

    if (!isSignedDocsVerified) {
      toast.error(`Cannot send documents for signature: Company '${sendSignedDocsOrder.company_name}' has not been verified (Current status: ${signedDocsStatus}). Please validate and verify the company profile first.`);
      return;
    }

    setSendingSignedDocsLoading(true);
    const primaryEmail = selectedSignedDocsEmails[0];
    const additionalRecipients = selectedSignedDocsEmails.slice(1);
    const toastId = toast.loading(`Dispatching documents for signature to ${primaryEmail}...`);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${sendSignedDocsOrder.order_number}/send-signed-documents`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipient_email: primaryEmail.trim(),
          recipient_name: sendSignedDocsRecipientName.trim() || sendSignedDocsOrder.company_name || "Valued Client",
          custom_message: sendSignedDocsCustomMessage.trim(),
          additional_recipients: additionalRecipients,
          disable_zip: sendSignedDocsDisableZip
        })
      });

      if (res.ok) {
        let updatedDocsOrders = null;
        try {
          updatedDocsOrders = await res.json();
        } catch (jsonErr) {
          console.warn("Could not parse response JSON:", jsonErr);
        }
        toast.success(`Documents for signature successfully delivered to ${primaryEmail}!`, { id: toastId });
        setIsSendSignedDocsModalOpen(false);

        // Update local state with the actual status returned from the backend
        if (updatedDocsOrders && updatedDocsOrders.length > 0) {
          const firstDocsUpdated = updatedDocsOrders[0];
          setOrders(prev => prev.map(o => o.order_number === sendSignedDocsOrder.order_number ? { ...o, ...firstDocsUpdated, status: firstDocsUpdated.status } : o));
          setSelectedOrderGroup((prev: any) => prev && prev.order_number === sendSignedDocsOrder.order_number ? { ...prev, ...firstDocsUpdated, status: firstDocsUpdated.status } : prev);
        }

        fetchData();
        fetchProgressUpdates(sendSignedDocsOrder.order_number);
      } else {
        let errMsg = "Failed to send documents for signature.";
        try {
          const err = await res.json();
          errMsg = err.detail || err.message || errMsg;
        } catch {
          errMsg = `Server returned status ${res.status}: ${res.statusText || "Internal Server Error"}`;
        }
        toast.error(errMsg, { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error sending documents for signature.", { id: toastId });
    } finally {
      setSendingSignedDocsLoading(false);
    }
  };

  // Foolproof In-Page Print using direct body mount point
  const handlePrintInPage = () => {
    const docElem = document.getElementById("proforma-invoice-doc");
    const originalTitle = document.title;
    const titleNode = document.head.querySelector("title");
    const originalHeadTitle = titleNode ? titleNode.textContent : "";

    const company = selectedOrderGroup?.company_name || "Client";
    const contractRef = selectedOrderGroup?.order_number || "Proforma_Invoice";
    const rawFileName = `${company}_${contractRef}`;
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
      setTimeout(restoreTitle, 5000); // Fallback if afterprint doesn't fire
      return;
    }

    // Attach temporary mount node directly to document.body
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
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 1.6cm !important;
          background: #ffffff !important;
          color: #0f172a !important;
          z-index: 999999 !important;
        }
        #print-mount-point * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;

    document.body.appendChild(printMount);
    document.head.appendChild(styleElem);

    const cleanupPrint = () => {
      restoreTitle();
      if (document.body.contains(printMount)) {
        document.body.removeChild(printMount);
      }
      if (document.head.contains(styleElem)) {
        document.head.removeChild(styleElem);
      }
      window.removeEventListener("afterprint", cleanupPrint);
    };

    // Use afterprint event to ensure the browser has fully captured the print dialog title
    window.addEventListener("afterprint", cleanupPrint);

    // Give the DOM a tiny bit of time to update the title and styles before calling print
    setTimeout(() => {
      window.print();

      // Fallback cleanup if afterprint doesn't fire (e.g., if print dialog is cancelled in some browsers)
      setTimeout(() => {
        cleanupPrint();
      }, 5000);
    }, 100);
  };

  const handleDownloadFinalPDF = async () => {
    const element = document.getElementById("final-invoice-doc");
    if (!element || !selectedOrderGroup) return;
    setDownloadingFinalPdf(true);

    const company = selectedOrderGroup.company_name || "Client";
    const contractRef = selectedOrderGroup.order_number || "Invoice";
    const rawFileName = `${company}_${contractRef}_Final_Invoice`;
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
      handlePrintFinalInPage();
    } finally {
      setDownloadingFinalPdf(false);
    }
  };

  const handlePrintFinalInPage = () => {
    const docElem = document.getElementById("final-invoice-doc");
    const originalTitle = document.title;
    const titleNode = document.head.querySelector("title");
    const originalHeadTitle = titleNode ? titleNode.textContent : "";

    const company = selectedOrderGroup?.company_name || "Client";
    const contractRef = selectedOrderGroup?.order_number || "Invoice";
    const rawFileName = `${company}_${contractRef}_Final_Invoice`;
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
    printMount.id = "print-mount-point-final";
    printMount.innerHTML = `<title>${cleanFileName}</title>` + docElem.innerHTML;

    const styleElem = document.createElement("style");
    styleElem.id = "print-mount-styles-final";
    styleElem.style.display = "none";
    styleElem.innerHTML = `
      @media print {
        @page {
          margin: 0;
        }
        body > *:not(#print-mount-point-final) {
          display: none !important;
        }
        #print-mount-point-final {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 1.6cm !important;
          background: #ffffff !important;
          color: #0f172a !important;
          z-index: 999999 !important;
        }
        #print-mount-point-final * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;

    document.body.appendChild(printMount);
    document.head.appendChild(styleElem);

    const cleanupPrint = () => {
      restoreTitle();
      if (document.body.contains(printMount)) {
        document.body.removeChild(printMount);
      }
      if (document.head.contains(styleElem)) {
        document.head.removeChild(styleElem);
      }
      window.removeEventListener("afterprint", cleanupPrint);
    };

    window.addEventListener("afterprint", cleanupPrint);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        cleanupPrint();
      }, 5000);
    }, 100);
  };

  const handleFinalizeFinalInvoice = async () => {
    const element = document.getElementById("final-invoice-doc");
    if (!element || !selectedOrderGroup) return;
    setFinalizingFinalInvoice(true);
    const company = selectedOrderGroup.company_name || "Client";
    const contractRef = selectedOrderGroup.order_number || "Invoice";
    const rawFileName = `${company}_${contractRef}_Final_Invoice`;
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

      const pdfBlob = pdf.output("blob");

      // Construct FormData to upload the final invoice PDF file to the backend
      const formData = new FormData();
      formData.append("file", pdfBlob, fileName);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/finalize-final-invoice`, {
        credentials: "include",
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        let errMsg = "Failed to finalize final invoice";
        try {
          const text = await res.text();
          try {
            const err = JSON.parse(text);
            errMsg = err.detail
              ? (typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail))
              : JSON.stringify(err);
          } catch {
            errMsg = text || `Error ${res.status}: ${res.statusText}`;
          }
        } catch (e) {
          errMsg = `Error ${res.status}: ${res.statusText}`;
        }
        throw new Error(errMsg);
      }

      const updatedOrders = await res.json();
      toast.success("Final invoice successfully finalized and saved to Dropbox!");

      // Update selectedOrderGroup and main orders state
      setSelectedOrderGroup((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: "INVOICE_GENERATED",
          is_final_invoice_finalized: true
        };
      });

      // Update main orders state
      setOrders(prev => prev.map(ord => {
        const matched = updatedOrders.find((u: any) => u.id === ord.id);
        return matched ? matched : ord;
      }));

      // Refresh chat progress to show automated message
      fetchProgressUpdates(selectedOrderGroup.order_number);

    } catch (err: any) {
      console.error("Finalize Final Invoice Error:", err);
      toast.error(err.message || "Failed to finalize final invoice");
    } finally {
      setFinalizingFinalInvoice(false);
    }
  };



  if (userLoading || (!canView && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Verifying order permissions...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading client orders database...</p>
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

            {/* Total Orders */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Orders</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalOrdersCount}</p>
              </div>
            </div>

            {/* Confirmed Value */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Confirmed Value</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>

            {/* Pending Collection */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Pending Collection</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{pendingCollectionCount}</p>
              </div>
            </div>

            {/* Staff Allocated */}
            <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Staff Allocated</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{allocatedStaffCount}</p>
              </div>
            </div>
          </div>

          {/* Create New Order Button */}
          <Link href="/business/clients/orders/new" className="shrink-0 flex items-stretch">
            <Button className="w-full sm:w-auto gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm">
              <Plus className="h-4 w-4" /> Create New Order
            </Button>
          </Link>
        </div>

        {/* Main Orders Table */}
        <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
          <div className="p-4 bg-muted/20 border-b border-border/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Order ID, Company..."
                className="pl-8 h-9 text-xs rounded-xl bg-background/70 border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider">
              Showing {paginatedOrders.length} of {filteredOrders.length} entries
            </span>
          </div>

          <CardContent className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/35" />
                <span className="text-sm font-semibold">No Client Orders Found</span>
                <p className="text-xs max-w-sm">Click "Create New Order" above to issue your first service order.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                        <th className="py-2.5 px-2 w-8 text-center">No.</th>
                        <th className="py-2.5 px-2 whitespace-nowrap w-24">Order ID</th>
                        <th className="py-2.5 px-2 min-w-[130px] max-w-[170px]">Company Entity</th>
                        <th className="py-2.5 px-2.5 min-w-[240px] max-w-[340px]">Service Package</th>
                        <th className="py-2.5 px-3 w-36 min-w-[145px] max-w-[170px] whitespace-nowrap text-left">Assigned Consultants</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap w-28 min-w-[105px]">Total Amount</th>
                        <th className="py-2.5 px-2 text-center whitespace-nowrap min-w-[85px]">Payment</th>
                        <th className="py-2.5 px-2 text-left whitespace-nowrap">Lifecycle Status</th>
                        <th className="py-2.5 px-2 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {paginatedOrders.map((ord, index) => {
                        const isHighlighted = highlightedOrderNum === ord.order_number;
                        return (
                          <tr
                            key={ord.order_number || index}
                            id={`order-row-${ord.order_number}`}
                            className={`transition-all duration-300 border-b border-border/30 last:border-0 ${isHighlighted
                                ? "bg-emerald-500/20 dark:bg-emerald-500/25 ring-2 ring-emerald-500 ring-inset shadow-md"
                                : "hover:bg-muted/40"
                              }`}
                          >
                            <td className="py-2 px-2 text-center font-mono font-medium text-muted-foreground align-top pt-2.5 text-xs">
                              #{orderSeqMap.get(ord.order_number || `SINGLE-${ord.id}`) ?? (filteredOrders.length - (startIndex + index))}
                            </td>
                            <td className="py-2 px-2 align-top pt-2.5 whitespace-nowrap">
                              {ord.company_id ? (
                                <Link href={`/business/clients/documents/${ord.company_id}?from=orders`}>
                                  <Badge
                                    variant="outline"
                                    className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2 py-0.5 rounded hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                                    title="Go to Company Documents Folder"
                                  >
                                    {ord.order_number}
                                  </Badge>
                                </Link>
                              ) : (
                                <Badge variant="outline" className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2 py-0.5 rounded">
                                  {ord.order_number}
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 px-2 font-bold text-foreground align-top pt-2.5 min-w-[130px] max-w-[170px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-bold leading-snug break-words">{ord.company_name || "Personal Client Account"}</span>
                                {(() => {
                                  const comp = companies.find((c: any) => c.id === (ord.company_id || ord.company?.id)) || ord.company;
                                  if (!comp) return null;
                                  const vStatus = comp.validation_status;
                                  if (vStatus === "PENDING_VALIDATION" || (!vStatus && ord.company_id)) {
                                    return (
                                      <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-0.5" title="Company pending admin validation">
                                        <Clock className="h-2.5 w-2.5" /> Pending
                                      </Badge>
                                    );
                                  }
                                  if (vStatus === "NEEDS_REVISION") {
                                    return (
                                      <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 flex items-center gap-0.5" title="Company needs revision">
                                        <AlertCircle className="h-2.5 w-2.5" /> Revision
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <div className="text-xs font-normal text-muted-foreground flex items-center gap-1 mt-1 truncate">
                                <Building className="h-3 w-3 text-muted-foreground shrink-0" /> <span className="truncate">{ord.client_name || "Representative"}</span>
                              </div>
                            </td>
                            <td className="py-2 px-2.5 align-top pt-2.5 min-w-[240px] max-w-[340px]">
                              {ord.items && ord.items.length > 0 ? (
                                <div className="space-y-1.5 w-full">
                                  {ord.items.map((item: any, idx: number) => (
                                    <div key={idx} className="space-y-1 border-b border-border/10 last:border-0 pb-1.5 last:pb-0">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-semibold text-foreground text-xs leading-normal break-words">
                                          {item.job_title}
                                        </span>
                                        {item.job_id && (
                                          <Badge variant="outline" className="text-[9px] font-mono py-0 px-1.5 bg-primary/5 text-primary border-primary/20 shrink-0">
                                            {item.job_id}
                                          </Badge>
                                        )}
                                        {renderVendorBadge(item)}
                                      </div>
                                      {item.branch_name && (
                                        <div className="flex items-center">
                                          <Badge 
                                            variant="outline" 
                                            className="text-[9px] font-medium py-0.5 px-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 max-w-[240px] inline-flex items-center gap-1 overflow-hidden"
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
                            <td className="py-2 px-3 align-top pt-2.5 w-36 min-w-[145px] max-w-[170px]">
                              <div className="flex flex-col items-start gap-1 w-full">
                                {(() => {
                                  const revList = ord.reviewers && ord.reviewers.length > 0 ? ord.reviewers : (ord.reviewer ? [ord.reviewer] : []);
                                  return revList.map((rev: any) => (
                                    <Badge
                                      key={rev.id}
                                      variant="outline"
                                      className="text-[9px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 font-semibold flex items-center gap-1 py-0.5 px-1.5 max-w-full truncate shadow-none"
                                      title={`Reviewer: ${rev.name}`}
                                    >
                                      <ShieldCheck className="h-2.5 w-2.5 text-purple-600 shrink-0" />
                                      <span className="truncate"><span className="text-[8px] font-bold uppercase opacity-80 mr-0.5">Rev:</span>{rev.name}</span>
                                    </Badge>
                                  ));
                                })()}
                                {ord.consultants && ord.consultants.length > 0 ? (
                                  ord.consultants.map((c: any) => (
                                    <Badge
                                      key={c.id}
                                      variant="outline"
                                      className="text-[9.5px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium flex items-center gap-1 py-0.5 px-1.5 max-w-full truncate shadow-none"
                                      title={c.name}
                                    >
                                      <UserCheck className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                                      <span className="truncate">{c.name}</span>
                                    </Badge>
                                  ))
                                ) : (!ord.reviewer && (!ord.reviewers || ord.reviewers.length === 0)) ? (
                                  <span className="text-muted-foreground italic text-xs">Unassigned</span>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-sm text-foreground align-top pt-2.5 whitespace-nowrap">
                              {formatCurrency(ord.total_amount)}
                            </td>
                            <td className="py-2 px-2 text-center align-top pt-2.5 whitespace-nowrap min-w-[85px]">
                              <div className="flex flex-col items-center gap-1 justify-center">
                                <Badge className={`${getPaymentStatusColor(ord.payment_status)} font-bold font-mono border text-[10px] px-2 py-0.5`}>
                                  {ord.payment_status || "UNPAID"}
                                </Badge>

                                {/* Accurate Online Live Status Badge */}
                                {(() => {
                                  const accStatus = ord.accurate_sync_status;
                                  if (accStatus === "PAID") {
                                    return (
                                      <Badge variant="outline" className="text-[8.5px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-0.5 py-0.5 px-1.5" title={`Accurate Receipt: ${ord.accurate_receipt_no || 'Paid'}`}>
                                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> AOL: {ord.accurate_receipt_no || "Paid"}
                                      </Badge>
                                    );
                                  }
                                  if (accStatus === "INV_CREATED") {
                                    return (
                                      <Badge variant="outline" className="text-[8.5px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 flex items-center gap-0.5 py-0.5 px-1.5" title={`Accurate Invoice: ${ord.accurate_inv_no}`}>
                                        <Receipt className="h-2.5 w-2.5 text-blue-600" /> AOL: {ord.accurate_inv_no || "Invoice"}
                                      </Badge>
                                    );
                                  }
                                  if (accStatus === "SO_CREATED") {
                                    return (
                                      <Badge variant="outline" className="text-[8.5px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 flex items-center gap-0.5 py-0.5 px-1.5" title={`Accurate Sales Order: ${ord.accurate_so_no}`}>
                                        <Zap className="h-2.5 w-2.5 text-purple-600" /> AOL: {ord.accurate_so_no || "SO Active"}
                                      </Badge>
                                    );
                                  }
                                  if (accStatus === "FAILED") {
                                    return (
                                      <div className="flex items-center gap-0.5">
                                        <Badge variant="outline" className="text-[8.5px] font-mono font-bold bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 flex items-center gap-0.5 py-0.5 px-1.5" title={ord.accurate_sync_error || "Accurate sync failed"}>
                                          <AlertCircle className="h-2.5 w-2.5 text-red-600" /> AOL: Failed
                                        </Badge>
                                        <button
                                          onClick={() => handleSyncAccurate(ord.order_number || ord.id)}
                                          className="h-4 w-4 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-600 transition-colors"
                                          title="Retry Accurate Sync"
                                        >
                                          <RefreshCw className="h-2.5 w-2.5" />
                                        </button>
                                      </div>
                                    );
                                  }
                                  return (
                                    <button
                                      onClick={() => handleSyncAccurate(ord.order_number || ord.id)}
                                      className="text-[8.5px] font-mono font-semibold text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors opacity-60 hover:opacity-100"
                                      title="Sync with Accurate Online"
                                    >
                                      <Zap className="h-2.5 w-2.5 text-purple-500" /> Sync AOL
                                    </button>
                                  );
                                })()}

                                {/* Service Payment / Invoice Email Dispatch Status Marker */}
                                {ord.last_invoice_sent_at ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[8.5px] font-mono font-medium bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 flex items-center gap-1 py-0.5 px-1.5"
                                    title={`Invoice dispatched ${ord.invoice_delivery_channel === 'BOTH' ? 'via Email & WhatsApp' : ord.invoice_delivery_channel === 'WHATSAPP' ? 'via WhatsApp' : 'via Email'} on ${formatDate(ord.last_invoice_sent_at)} to ${ord.last_invoice_sent_to || 'client'}`}
                                  >
                                    <MailCheck className="h-2.5 w-2.5 text-sky-600 dark:text-sky-400" />
                                    <span>{ord.final_invoice_sent_at ? "Final Inv" : "Proforma"}</span>
                                  </Badge>
                                ) : (ord.is_proforma_finalized || ord.is_final_invoice_finalized) ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[8.5px] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 flex items-center gap-1 py-0.5 px-1.5"
                                    title="Invoice PDF finalized in storage, but email has not yet been sent to client"
                                  >
                                    <Clock className="h-2.5 w-2.5 text-amber-600" />
                                    <span>Inv Unsent</span>
                                  </Badge>
                                ) : null}

                                {/* Signature Pre-Docs Dispatched Indicator */}
                                {ord.signed_docs_sent_at && (
                                  <Badge
                                    variant="outline"
                                    className="text-[8.5px] font-mono font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 flex items-center gap-1 py-0.5 px-1.5"
                                    title={`Pre-documents for signature dispatched via Email on ${formatDate(ord.signed_docs_sent_at)} to ${ord.signed_docs_sent_to || 'client'}`}
                                  >
                                    <MailCheck className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>Sign Sent</span>
                                  </Badge>
                                )}

                                {/* Deliverables Dispatched Indicator */}
                                {ord.deliverables_sent_at && (
                                  <Badge
                                    variant="outline"
                                    className="text-[8.5px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 py-0.5 px-1.5"
                                    title={`Final documents delivered to ${ord.deliverables_sent_to || 'client'} on ${formatDate(ord.deliverables_sent_at)}`}
                                  >
                                    <FileCheck className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Docs Sent</span>
                                  </Badge>
                                )}

                                {isPaymentActionVisible(ord) && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-5 px-1.5 text-[8.5px] gap-0.5 font-bold shadow-none"
                                      onClick={async () => {
                                        if (ord.payment_link) {
                                          navigator.clipboard.writeText(ord.payment_link);
                                          toast.success("Payment link copied to clipboard!");
                                          return;
                                        }
                                        const toastId = toast.loading("Generating link...");
                                        try {
                                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${ord.order_number}/payment-link`, {
                                            credentials: "include",
                                            method: "POST",
                                          });
                                          if (res.ok) {
                                            const data = await res.json();
                                            toast.success("Payment link copied!", { id: toastId });
                                            setOrders(prev => prev.map(o => o.order_number === ord.order_number ? { ...o, payment_link: data.payment_link } : o));
                                            navigator.clipboard.writeText(data.payment_link);
                                          } else {
                                            toast.error("Failed link generation", { id: toastId });
                                          }
                                        } catch (err) {
                                          console.error(err);
                                          toast.error("Error generating link", { id: toastId });
                                        }
                                      }}
                                    >
                                      <Link2 className="h-2.5 w-2.5" /> Link
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-5 px-1.5 text-[8.5px] gap-0.5 font-bold shadow-none"
                                      onClick={async () => {
                                        const toastId = toast.loading("Checking...");
                                        try {
                                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${ord.order_number}/sync-payment`, {
                                            credentials: "include",
                                            method: "POST",
                                          });
                                          const data = await res.json();
                                          if (res.ok && data.status === "success") {
                                            toast.success(data.message || "Payment verified!", { id: toastId });
                                            fetchData();
                                          } else if (res.ok && data.status === "received") {
                                            toast.info(`Status: ${data.xendit_status || "PENDING"}`, { id: toastId });
                                          } else {
                                            toast.info(data.detail || data.message || "No payment detected", { id: toastId });
                                          }
                                        } catch (err) {
                                          console.error(err);
                                          toast.error("Error verifying", { id: toastId });
                                        }
                                      }}
                                    >
                                      <RefreshCw className="h-2.5 w-2.5" /> Check
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-left align-top pt-2.5 whitespace-nowrap">
                              <Badge className={`${getOrderStatusColor(ord.status)} font-bold border text-[10px] px-2 py-0.5`}>
                                {ord.status || "CONFIRMED"}
                              </Badge>
                            </td>
                            <td className="py-2 px-2 text-right align-top pt-2.5 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                {['DOCUMENTS_REVIEWED', 'PRE_DOC_SENT_FOR_SIGNATURE', 'PRE_DOCS_SENT'].includes(ord.status) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={`h-6 px-1.5 text-[9.5px] font-bold gap-1 shadow-none inline-flex items-center rounded ${
                                      ord.signed_docs_sent_at
                                        ? "text-indigo-700 border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 dark:text-indigo-300"
                                        : "text-indigo-600 border-indigo-500/30 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-500/40"
                                    }`}
                                    title={ord.signed_docs_sent_at ? `Signature email previously sent to ${ord.signed_docs_sent_to || 'client'} on ${formatDate(ord.signed_docs_sent_at)}. Click to re-send.` : "Send pre-documents for signature to client email"}
                                    onClick={() => handleOpenSendSignedDocs(ord)}
                                  >
                                    <Send className="h-3 w-3" /> {ord.signed_docs_sent_at ? "Re-send Signature" : "Send for Signature"}
                                  </Button>
                                )}
                                {(['FINAL_PAYMENT_COMPLETED', 'SOFT_COPY_DELIVERED', 'HARD_COPY_DELIVERED', 'COMPLETED'].includes(ord.status) || ord.payment_status === "PAID") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-1.5 text-[9.5px] font-bold gap-1 shadow-none inline-flex items-center text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/40 rounded"
                                    title="Send final documents to client email"
                                    onClick={() => handleOpenSendDocs(ord)}
                                  >
                                    <Send className="h-3 w-3" /> Send Final Docs
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 rounded p-0"
                                  title="Edit Order & Consultants"
                                  onClick={() => router.push(`/business/clients/orders/${ord.order_number}/edit`)}
                                >
                                  <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 rounded p-0"
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
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 rounded p-0"
                                  title="Order Chat"
                                  onClick={() => {
                                    setSelectedOrderGroup(ord);
                                    setIsChatOpen(true);
                                    fetchProgressUpdates(ord.order_number);
                                  }}
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600 hover:text-emerald-700" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 rounded p-0"
                                  title="Delete Order"
                                  onClick={() => {
                                    setSelectedOrderGroup(ord);
                                    setIsDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
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
                    <ArrowLeft className="h-4 w-4" /> Back to Orders List
                  </Button>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                    <Receipt className="h-6 w-6 text-zinc-600" /> Order Summary & Consultants
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 font-bold h-8 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm"
                    onClick={() => {
                      setIsChatOpen(true);
                      fetchProgressUpdates(selectedOrderGroup.order_number);
                    }}
                  >
                    <MessageSquare className="h-4 w-4" /> Chat
                  </Button>
                  <Badge variant="outline" className="font-mono text-xs font-bold px-3 py-1 bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-lg">
                    {selectedOrderGroup.order_number}
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
                                    <Clock className="h-3 w-3" /> Pending Admin Validation
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
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge className={`${getPaymentStatusColor(selectedOrderGroup.payment_status)} font-mono font-bold text-xs uppercase px-2.5 py-1 rounded-lg`}>
                            {selectedOrderGroup.payment_status}
                          </Badge>
                          {isPaymentActionVisible(selectedOrderGroup) && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-[11px] gap-1.5 font-semibold border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 shadow-xs transition-colors rounded-lg"
                                onClick={async () => {
                                  if (selectedOrderGroup.payment_link) {
                                    navigator.clipboard.writeText(selectedOrderGroup.payment_link);
                                    toast.success("Payment link copied to clipboard!");
                                    return;
                                  }
                                  const toastId = toast.loading("Generating secure payment link...");
                                  try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/payment-link`, {
                                      credentials: "include",
                                      method: "POST",
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      toast.success("Payment link generated and copied to clipboard!", { id: toastId });
                                      setSelectedOrderGroup((prev: any) => prev ? { ...prev, payment_link: data.payment_link } : null);
                                      setOrders(prev => prev.map(o => o.order_number === selectedOrderGroup.order_number ? { ...o, payment_link: data.payment_link } : o));
                                      navigator.clipboard.writeText(data.payment_link);
                                    } else {
                                      toast.error("Failed to generate payment link", { id: toastId });
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    toast.error("Error generating payment link", { id: toastId });
                                  }
                                }}
                              >
                                <Link2 className="h-3.5 w-3.5 text-zinc-500" /> Copy Link
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-[11px] gap-1.5 font-semibold border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 shadow-xs transition-colors rounded-lg"
                                onClick={async () => {
                                  const toastId = toast.loading("Verifying payment with Xendit...");
                                  try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/sync-payment`, {
                                      credentials: "include",
                                      method: "POST",
                                    });
                                    const data = await res.json();
                                    if (res.ok && data.status === "success") {
                                      toast.success(data.message || "Payment verified and updated!", { id: toastId });
                                      setSelectedOrderGroup((prev: any) => prev ? { ...prev, payment_status: data.payment_status || "PARTIALLY_PAID" } : null);
                                      fetchData();
                                      fetchProgressUpdates(selectedOrderGroup.order_number);
                                    } else if (res.ok && data.status === "received") {
                                      toast.info(`Payment status on Xendit: ${data.xendit_status || "PENDING"}`, { id: toastId });
                                    } else {
                                      toast.info(data.detail || data.message || "No payment detected yet", { id: toastId });
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    toast.error("Error verifying payment", { id: toastId });
                                  }
                                }}
                              >
                                <RefreshCw className="h-3.5 w-3.5 text-zinc-500" /> Check Payment
                              </Button>
                            </div>
                          )}
                        </div>
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

                    {/* Internal Instructions / Notes for Delivery Manager */}
                    {selectedOrderGroup.notes && (
                      <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1.5">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 pb-2 border-b border-zinc-100">
                          <FileText className="h-3.5 w-3.5 text-zinc-500" /> Internal Instructions / Notes
                        </span>
                        <p className="text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium pt-0.5">
                          {selectedOrderGroup.notes}
                        </p>
                      </div>
                    )}

                    {/* Inline Mandatory Proforma Percentage Selector Card */}
                    <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                          <Percent className="h-4 w-4 text-zinc-500" /> Proforma Invoice Stage <span className="text-red-500">*</span>
                        </label>
                        <Badge variant="outline" className="text-xs font-mono font-bold bg-zinc-100 text-zinc-800 border-zinc-300 px-2.5 py-0.5 rounded-full">
                          {proformaPercent}% Selected
                        </Badge>
                      </div>

                      {/* Input & Quick Preset Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Percentage Input */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Percentage</span>
                          <div className="relative">
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              step="0.01"
                              value={tempPercent}
                              onChange={(e) => handlePctChange(e.target.value)}
                              placeholder="70"
                              disabled={selectedOrderGroup.is_proforma_finalized}
                              className="pr-8 font-mono text-sm font-bold bg-zinc-50 border-zinc-300 text-zinc-900 focus-visible:ring-zinc-400 h-10 rounded-xl"
                            />
                            <Percent className="absolute right-3 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
                          </div>
                          {/* PPH 21 Checkbox */}
                          <div className="flex items-center gap-2 pt-1.5">
                            <input
                              type="checkbox"
                              id="pph21-checkbox"
                              checked={isPph21}
                              disabled={selectedOrderGroup.is_proforma_finalized}
                              onChange={(e) => setIsPph21(e.target.checked)}
                              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 cursor-pointer accent-zinc-900 disabled:cursor-not-allowed"
                            />
                            <label htmlFor="pph21-checkbox" className="text-xs font-semibold text-zinc-700 cursor-pointer select-none">
                              Add PPH 21 (2% Tax WHT)
                            </label>
                          </div>
                        </div>

                        {/* Direct Amount Input */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 block">Amount (IDR)</span>
                          <Input
                            type="number"
                            value={tempAmount}
                            onChange={(e) => handleAmtChange(e.target.value)}
                            placeholder="e.g. 7000000"
                            disabled={selectedOrderGroup.is_proforma_finalized}
                            className="font-mono text-sm font-bold bg-zinc-50 border-zinc-300 text-zinc-900 focus-visible:ring-zinc-400 h-10 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Locked Message */}
                      {selectedOrderGroup.is_proforma_finalized && (
                        <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium flex items-center gap-2">
                          <Lock className="h-4 w-4 text-zinc-500 shrink-0" />
                          <span>Proforma invoice is finalized. Stage percentage is locked.</span>
                        </div>
                      )}

                      {/* Calculated Proforma Due Preview */}
                      {proformaPercent > 0 && selectedOrderGroup && (
                        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-zinc-500">
                            <span>Proforma Subtotal:</span>
                            <span className="font-semibold font-mono text-zinc-900">
                              {formatCurrency((selectedOrderGroup.total_amount * proformaPercent) / 100)}
                            </span>
                          </div>
                          {isPph21 && (
                            <div className="flex justify-between items-center text-red-600 font-semibold">
                              <span>WHT PPh 21 (2%):</span>
                              <span className="font-mono">
                                -{formatCurrency(((selectedOrderGroup.total_amount * proformaPercent) / 100) * 0.02)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                            <span className="text-zinc-900 font-bold">Proforma Amount Due:</span>
                            <span className="font-extrabold font-mono text-zinc-950 text-base">
                              {formatCurrency(
                                isPph21
                                  ? ((selectedOrderGroup.total_amount * proformaPercent) / 100) * 0.98
                                  : (selectedOrderGroup.total_amount * proformaPercent) / 100
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Recorded Manual Proforma Paid Amount Notice */}
                      {selectedOrderGroup.proforma_paid_amount != null && selectedOrderGroup.proforma_paid_amount > 0 && (
                        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
                              <DollarSign className="h-4 w-4 text-zinc-500" /> Recorded Proforma Paid:
                            </span>
                            <Badge variant="outline" className="font-mono font-bold bg-zinc-200 text-zinc-900 border-zinc-300 rounded-md">
                              {formatCurrency(selectedOrderGroup.proforma_paid_amount)}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-zinc-500 flex justify-between pt-1 border-t border-zinc-200 font-mono">
                            <span>Remaining Final Balance:</span>
                            <span className="font-bold text-zinc-900">
                              {formatCurrency(Math.max(0, selectedOrderGroup.total_amount - selectedOrderGroup.proforma_paid_amount))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="space-y-2.5">
                      <Button
                        type="button"
                        disabled={!proformaPercent || proformaPercent <= 0}
                        onClick={() => setIsProformaPreviewOpen(true)}
                        className="w-full gap-2 font-semibold h-11 text-sm"
                      >
                        <FileText className="h-4 w-4 shrink-0" /> {selectedOrderGroup.is_proforma_finalized ? "View" : "Generate"} Proforma Invoice ({proformaPercent || 0}%)
                      </Button>

                      <Button
                        type="button"
                        disabled={(!selectedOrderGroup?.is_proforma_finalized || selectedOrderGroup?.status !== "FINAL_DOC_READY") && !selectedOrderGroup?.is_final_invoice_finalized}
                        onClick={() => setIsFinalInvoicePreviewOpen(true)}
                        className="w-full gap-2 font-semibold h-11 text-sm"
                      >
                        <FileText className="h-4 w-4 shrink-0" /> {selectedOrderGroup?.is_final_invoice_finalized ? "View" : "Generate"} Final Invoice
                      </Button>
                      {(!selectedOrderGroup?.is_proforma_finalized || selectedOrderGroup?.status !== "FINAL_DOC_READY") && !selectedOrderGroup?.is_final_invoice_finalized && (
                        <p className="text-[11px] text-zinc-400 text-center italic">
                          Requires finalized proforma invoice & final doc ready lifecycle status.
                        </p>
                      )}

                      {['DOCUMENTS_REVIEWED', 'PRE_DOC_SENT_FOR_SIGNATURE', 'PRE_DOCS_SENT'].includes(selectedOrderGroup?.status) && (
                        <div className="space-y-1.5">
                          <Button
                            type="button"
                            onClick={() => handleOpenSendSignedDocs(selectedOrderGroup)}
                            className="w-full gap-2 font-semibold h-11 text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                          >
                            <Send className="h-4 w-4 shrink-0" /> {selectedOrderGroup?.signed_docs_sent_at ? "Re-send Documents for Signature" : "Send Documents for Signature to Client"}
                          </Button>
                          {selectedOrderGroup?.signed_docs_sent_at && (
                            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 text-center font-mono flex items-center justify-center gap-1">
                              <MailCheck className="h-3.5 w-3.5" /> Emailed to {selectedOrderGroup.signed_docs_sent_to || 'client'} on {formatDate(selectedOrderGroup.signed_docs_sent_at)}
                            </p>
                          )}
                        </div>
                      )}

                      {(['FINAL_PAYMENT_COMPLETED', 'SOFT_COPY_DELIVERED', 'HARD_COPY_DELIVERED', 'COMPLETED'].includes(selectedOrderGroup?.status) || selectedOrderGroup?.payment_status === "PAID") && (
                        <Button
                          type="button"
                          onClick={() => handleOpenSendDocs(selectedOrderGroup)}
                          className="w-full gap-2 font-semibold h-11 text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                          <Send className="h-4 w-4 shrink-0" /> Send Final Docs
                        </Button>
                      )}
                    </div>

                  </div>

                  {/* Right Column (Line Items & Totals) - 8 cols */}
                  <div className="lg:col-span-8 space-y-4">

                    {/* Service Items Table */}
                    <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-xs bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
                            <th className="p-4">Service Package</th>
                            <th className="p-4 text-right w-36">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {(selectedOrderGroup.items || []).map((item: any, idx: number) => {
                            const itemKey = `order-summary-${selectedOrderGroup.order_number}-${idx}`;
                            const isExpanded = !!expandedItems[itemKey];
                            return (
                              <tr key={item.id || idx} className="hover:bg-zinc-50/60 transition-colors">
                                <td className="p-4 align-top">
                                  <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 shadow-none space-y-1.5 transition-all duration-200 max-w-xl">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-bold text-zinc-950 text-xs leading-normal break-words">
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
                                          {item.pricing_tier.toLowerCase().replace('_', ' ')}
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

                                    {item.service_instructions && (
                                      <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-0.5">
                                        <div className="flex items-center gap-1.5 font-bold text-[10px] text-amber-700">
                                          <FileText className="h-3 w-3 shrink-0" />
                                          <span>Service Instructions:</span>
                                        </div>
                                        <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap text-zinc-900">
                                          {item.service_instructions}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-sm text-zinc-950 align-top pt-6">
                                  {formatCurrency(item.unit_price)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial Summary Breakdown Cards */}
                    {(() => {
                      const isFinalized = !!selectedOrderGroup.is_proforma_finalized;
                      const isRecorded = selectedOrderGroup.proforma_paid_amount != null && selectedOrderGroup.proforma_paid_amount > 0;
                      const hasProformaStage = isFinalized || isRecorded;

                      const actualPaid = isRecorded
                        ? selectedOrderGroup.proforma_paid_amount
                        : isFinalized
                          ? (selectedOrderGroup.total_amount * (selectedOrderGroup.proforma_stage_percent || proformaPercent)) / 100
                          : 0;

                      const remainingDue = hasProformaStage
                        ? Math.max(0, selectedOrderGroup.total_amount - actualPaid)
                        : null;

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">Agreed Contract Value</span>
                            <span className="text-xl font-bold font-mono text-zinc-950 block">{formatCurrency(selectedOrderGroup.total_amount)}</span>
                          </div>
                          <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">
                              {isRecorded
                                ? "Proforma Paid (Recorded)"
                                : isFinalized
                                  ? `Proforma Due (${selectedOrderGroup.proforma_stage_percent}%)`
                                  : "Proforma Due"}
                            </span>
                            <span className="text-xl font-bold font-mono text-zinc-950 block">
                              {hasProformaStage ? (
                                formatCurrency(actualPaid)
                              ) : (
                                <span className="text-zinc-400 text-base font-normal font-sans">—</span>
                              )}
                            </span>
                          </div>
                          <div className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs space-y-1">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider">Remaining Final Balance</span>
                            <span className="text-xl font-bold font-mono text-zinc-950 block">
                              {remainingDue != null ? (
                                formatCurrency(remainingDue)
                              ) : (
                                <span className="text-zinc-400 text-base font-normal font-sans">—</span>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                  </div>

                </div>

              </div>
              {/* End of Scrollable Content Body */}

            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* PROFORMA INVOICE FULL-PAGE VIEW (MAX WIDESCREEN - ZERO SCROLLBAR) */}
      <AnimatePresence>
        {isProformaPreviewOpen && selectedOrderGroup && (
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
                    onClick={() => setIsProformaPreviewOpen(false)}
                    className="gap-2 font-bold shadow-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-black dark:hover:bg-zinc-900 dark:text-white dark:border-white/60 dark:hover:border-white h-8 text-xs transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Order Summary
                  </Button>
                  <div className="h-4 w-px bg-border hidden sm:block" />
                  <span className="font-bold text-xs sm:text-sm flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4 text-emerald-500" /> Proforma Invoice ({proformaPercent}%)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {selectedOrderGroup.is_proforma_finalized ? (
                    <Badge className="bg-amber-500/20 text-amber-500 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/40 gap-1.5 px-3 py-1.5 text-xs font-bold font-mono">
                      <Lock className="h-3.5 w-3.5" /> Finalized & Saved
                    </Badge>
                  ) : (
                    <Button
                      onClick={handleFinalizeInvoice}
                      disabled={finalizingInvoice}
                      size="sm"
                      variant="outline"
                      className="gap-2 font-bold text-xs h-8 px-4"
                    >
                      {finalizingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Finalize Invoice
                    </Button>
                  )}
                  {selectedOrderGroup.proforma_sent_at && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 gap-1.5 px-3 py-1.5 text-xs font-bold font-mono" title={`Proforma invoice dispatched on ${formatDate(selectedOrderGroup.proforma_sent_at)} to ${selectedOrderGroup.proforma_sent_to || 'client'}`}>
                      <MailCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Dispatched {formatDate(selectedOrderGroup.proforma_sent_at)}
                    </Badge>
                  )}
                  {selectedOrderGroup.is_proforma_finalized && (
                    <Button
                      onClick={() => handleSendInvoiceEmail('proforma')}
                      disabled={sendingEmail}
                      size="sm"
                      variant="outline"
                      className={`gap-2 font-bold text-xs h-8 px-4 ${selectedOrderGroup.proforma_sent_at ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20" : ""
                        }`}
                    >
                      {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : selectedOrderGroup.proforma_sent_at ? <MailCheck className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      {selectedOrderGroup.proforma_sent_at ? "Resend Proforma" : "Send Proforma"}
                    </Button>
                  )}
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    size="sm"
                    className="gap-2 font-bold shadow-sm text-xs h-8 px-4"
                  >
                    {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download PDF File
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrintInPage}
                    size="sm"
                    className="gap-2 font-bold text-xs h-8 px-4"
                  >
                    <Printer className="h-4 w-4" /> Print Document
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsProformaPreviewOpen(false)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 rounded-full h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Scrollable Container for the Invoice Card */}
              <div className="flex-1 w-full overflow-y-auto pr-1">
                <div className="p-8 sm:p-10 bg-white text-slate-900 print-area w-full min-h-full flex flex-col justify-between" id="proforma-invoice-doc">

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
                          PROFORMA INVOICE
                        </div>
                        <h3 className="font-mono text-xl font-black text-slate-900">
                          PI-{selectedOrderGroup.order_number}-{proformaPercent}
                        </h3>
                        <p className="text-xs text-slate-650 font-semibold mt-1">
                          Issue Date: <span className="font-mono text-slate-900 font-bold">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </p>
                        <p className="text-xs text-slate-655 font-semibold">
                          Valid Until: <span className="font-mono text-slate-900 font-bold">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </p>
                      </div>
                    </div>

                    {/* Billed To & Contract Details */}
                    <div className="grid grid-cols-2 gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-1">BILLED TO (CLIENT ENTITY)</span>
                        <h4 className="text-lg font-bold text-slate-900">{selectedOrderGroup.billing_company_name || selectedOrderGroup.company_name || "Client Entity"}</h4>
                        {selectedOrderGroup.billing_company_id && selectedOrderGroup.billing_company_id !== selectedOrderGroup.company_id && (
                          <p className="text-xs text-slate-500 font-semibold">
                            Target Company Entity: <span className="font-bold text-slate-700">{selectedOrderGroup.company_name}</span>
                          </p>
                        )}
                        <p className="text-slate-500 text-xs mt-1">Reference Contract #: <span className="font-mono font-bold text-slate-800">{selectedOrderGroup.order_number}</span></p>
                      </div>

                      <div className="text-right border-l border-slate-200 pl-6 space-y-1">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-1">PROFORMA PAYMENT TERMS</span>
                        <p className="font-bold text-base text-emerald-700">{proformaPercent}% Down Payment / Milestone Billing</p>
                        <p className="text-slate-550 text-xs">Status: <span className="font-black text-amber-600">PROFORMA ISSUED</span></p>
                      </div>
                    </div>

                    {/* Services Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-sm !mt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-wider">
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3">Service Line Item</th>
                            <th className="p-3 w-64">Memo</th>
                            <th className="p-3 text-right">Contract Price</th>
                            <th className="p-3 text-right text-emerald-700 font-extrabold">Proforma Amount ({proformaPercent}%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {(selectedOrderGroup.items || []).map((item: any, idx: number) => {
                            const lineFullPrice = item.unit_price || 0;
                            const lineProformaPrice = (lineFullPrice * proformaPercent) / 100;
                            return (
                              <tr key={item.id || idx} className="hover:bg-slate-50/60">
                                <td className="p-3 text-center font-mono font-bold text-slate-450">{idx + 1}</td>
                                <td className="p-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-extrabold text-slate-900 text-base leading-tight">{item.job_title}</span>
                                    {item.job_id && (
                                      <span className="text-[10px] font-mono font-bold text-slate-550 border border-slate-200 bg-slate-50/50 px-1.5 py-0.5 rounded shrink-0">
                                        {item.job_id}
                                      </span>
                                    )}
                                  </div>
                                  {(() => {
                                    const matchedService = services.find((s) => s.id === item.service_id);
                                    const desc = item.description || matchedService?.description;
                                    return formatInvoiceDescription(desc);
                                  })()}
                                </td>
                                <td className="p-3 text-xs font-semibold text-slate-700 w-64">
                                  {item.branch_name ? (
                                    <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-medium whitespace-normal break-words max-w-full">
                                      {item.branch_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-mono text-xs">-</span>
                                  )}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-700">{formatCurrency(lineFullPrice)}</td>
                                <td className="p-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/50">
                                  {formatCurrency(lineProformaPrice)}
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
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-650">
                          <span>Total Contract Value:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(selectedOrderGroup.total_amount)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-650">
                          <span>Proforma Percentage:</span>
                          <span className="font-bold text-slate-900">{proformaPercent}%</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-650">
                          <span>Proforma Subtotal:</span>
                          <span className="font-bold text-slate-900">{formatCurrency((selectedOrderGroup.total_amount * proformaPercent) / 100)}</span>
                        </div>
                        {isPph21 && (
                          <div className="flex justify-between py-1 border-b border-slate-200 text-red-600 font-bold">
                            <span>WHT PPh 21 (2% Deduction):</span>
                            <span>-{formatCurrency(((selectedOrderGroup.total_amount * proformaPercent) / 100) * 0.02)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-3 px-4 rounded-lg bg-emerald-600 text-white text-base font-extrabold shadow-sm">
                          <span>Total Amount Due:</span>
                          <span>
                            {formatCurrency(
                              isPph21
                                ? ((selectedOrderGroup.total_amount * proformaPercent) / 100) * 0.98
                                : (selectedOrderGroup.total_amount * proformaPercent) / 100
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Spacer to push signature down and ensure a clear gap */}
                  <div className="h-12 sm:h-16 shrink-0" />

                  {/* Signature Box at bottom */}
                  <div className="pt-5 border-t border-slate-200 flex justify-between items-end text-sm mt-auto w-full">
                    <div className="text-slate-550 text-xs leading-normal max-w-sm">
                      <p className="font-extrabold text-slate-700">Notice:</p>
                      <p>This Proforma Invoice is issued for milestone payment processing.</p>
                      <p>Tax invoice (Faktur Pajak) will be provided upon full payment receipt.</p>
                    </div>
                    <div className="text-center w-60 space-y-8">
                      <p className="text-slate-500 font-extrabold text-xs">Authorized Signature</p>
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

      {/* FINAL INVOICE FULL-PAGE VIEW (MAX WIDESCREEN - ZERO SCROLLBAR) */}
      <AnimatePresence>
        {isFinalInvoicePreviewOpen && selectedOrderGroup && (
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
                    onClick={() => setIsFinalInvoicePreviewOpen(false)}
                    className="gap-2 font-bold shadow-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-black dark:hover:bg-zinc-900 dark:text-white dark:border-white/60 dark:hover:border-white h-8 text-xs transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Order Summary
                  </Button>
                  <div className="h-4 w-px bg-border hidden sm:block" />
                  <span className="font-bold text-xs sm:text-sm flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4 text-blue-500" /> Final Invoice
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {selectedOrderGroup.is_final_invoice_finalized ? (
                    <Badge className="bg-amber-500/20 text-amber-500 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/40 gap-1.5 px-3 py-1.5 text-xs font-bold font-mono">
                      <Lock className="h-3.5 w-3.5" /> Finalized & Saved
                    </Badge>
                  ) : (
                    <Button
                      onClick={handleFinalizeFinalInvoice}
                      disabled={finalizingFinalInvoice}
                      size="sm"
                      variant="outline"
                      className="gap-2 font-bold text-xs h-8 px-4"
                    >
                      {finalizingFinalInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Finalize Invoice
                    </Button>
                  )}
                  {selectedOrderGroup.final_invoice_sent_at && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 gap-1.5 px-3 py-1.5 text-xs font-bold font-mono" title={`Final invoice dispatched on ${formatDate(selectedOrderGroup.final_invoice_sent_at)} to ${selectedOrderGroup.final_invoice_sent_to || 'client'}`}>
                      <MailCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Dispatched {formatDate(selectedOrderGroup.final_invoice_sent_at)}
                    </Badge>
                  )}
                  {selectedOrderGroup.is_final_invoice_finalized && (
                    <Button
                      onClick={() => handleSendInvoiceEmail('final')}
                      disabled={sendingEmail}
                      size="sm"
                      variant="outline"
                      className={`gap-2 font-bold text-xs h-8 px-4 ${selectedOrderGroup.final_invoice_sent_at ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20" : ""
                        }`}
                    >
                      {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : selectedOrderGroup.final_invoice_sent_at ? <MailCheck className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      {selectedOrderGroup.final_invoice_sent_at ? "Resend Invoice" : "Send Invoice"}
                    </Button>
                  )}
                  <Button
                    onClick={handleDownloadFinalPDF}
                    disabled={downloadingFinalPdf}
                    size="sm"
                    className="gap-2 font-bold shadow-sm text-xs h-8 px-4"
                  >
                    {downloadingFinalPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download PDF File
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrintFinalInPage}
                    size="sm"
                    className="gap-2 font-bold text-xs h-8 px-4"
                  >
                    <Printer className="h-4 w-4" /> Print Document
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFinalInvoicePreviewOpen(false)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-zinc-800 rounded-full h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Scrollable Container for the Invoice Card */}
              <div className="flex-1 w-full overflow-y-auto pr-1">
                <div className="p-8 sm:p-10 bg-white text-slate-900 print-area w-full min-h-full flex flex-col justify-between" id="final-invoice-doc">

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
                          FINAL TAX INVOICE
                        </div>
                        <h3 className="font-mono text-xl font-black text-slate-900">
                          INV-{selectedOrderGroup.order_number}
                        </h3>
                        <p className="text-xs text-slate-650 font-semibold mt-1">
                          Issue Date: <span className="font-mono text-slate-900 font-bold">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </p>
                        <p className="text-xs text-slate-655 font-semibold">
                          Due Date: <span className="font-mono text-slate-900 font-bold">{new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </p>
                      </div>
                    </div>

                    {/* Billed To & Contract Details */}
                    <div className="grid grid-cols-2 gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-1">BILLED TO (CLIENT ENTITY)</span>
                        <h4 className="text-lg font-bold text-slate-900">{selectedOrderGroup.billing_company_name || selectedOrderGroup.company_name || "Client Entity"}</h4>
                        {selectedOrderGroup.billing_company_id && selectedOrderGroup.billing_company_id !== selectedOrderGroup.company_id && (
                          <p className="text-xs text-slate-500 font-semibold">
                            Target Company Entity: <span className="font-bold text-slate-700">{selectedOrderGroup.company_name}</span>
                          </p>
                        )}
                        <p className="text-slate-500 text-xs mt-1">Reference Contract #: <span className="font-mono font-bold text-slate-800">{selectedOrderGroup.order_number}</span></p>
                      </div>

                      <div className="text-right border-l border-slate-200 pl-6 space-y-1">
                        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-1">PAYMENT TERMS</span>
                        <p className="font-bold text-base text-blue-750">Final Settlement Invoice</p>
                        <p className="text-slate-550 text-xs">Status: <span className="font-black text-emerald-600">DELIVERED & COMPLETED</span></p>
                      </div>
                    </div>

                    {/* Services Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-sm !mt-2">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-wider">
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3">Service Line Item</th>
                            <th className="p-3 w-64">Memo</th>
                            <th className="p-3 text-right">Contract Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {(selectedOrderGroup.items || []).map((item: any, idx: number) => {
                            const lineFullPrice = item.unit_price || 0;
                            return (
                              <tr key={item.id || idx} className="hover:bg-slate-50/60">
                                <td className="p-3 text-center font-mono font-bold text-slate-450">{idx + 1}</td>
                                <td className="p-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-extrabold text-slate-900 text-base leading-tight">{item.job_title}</span>
                                    {item.job_id && (
                                      <span className="text-[10px] font-mono font-bold text-slate-550 border border-slate-200 bg-slate-50/50 px-1.5 py-0.5 rounded shrink-0">
                                        {item.job_id}
                                      </span>
                                    )}
                                  </div>
                                  {(() => {
                                    const matchedService = services.find((s) => s.id === item.service_id);
                                    const desc = item.description || matchedService?.description;
                                    return formatInvoiceDescription(desc);
                                  })()}
                                </td>
                                <td className="p-3 text-xs font-semibold text-slate-700 w-64">
                                  {item.branch_name ? (
                                    <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-medium whitespace-normal break-words max-w-full">
                                      {item.branch_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-mono text-xs">-</span>
                                  )}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-700">{formatCurrency(lineFullPrice)}</td>
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
                      {(() => {
                        const proformaDeduction = (selectedOrderGroup.proforma_paid_amount !== undefined && selectedOrderGroup.proforma_paid_amount !== null && selectedOrderGroup.proforma_paid_amount > 0)
                          ? selectedOrderGroup.proforma_paid_amount
                          : ((selectedOrderGroup.total_amount * (selectedOrderGroup.proforma_stage_percent || proformaPercent)) / 100);
                        const isCustomProforma = (selectedOrderGroup.proforma_paid_amount !== undefined && selectedOrderGroup.proforma_paid_amount !== null && selectedOrderGroup.proforma_paid_amount > 0);
                        const subtotalAfterDeduction = Math.max(0, selectedOrderGroup.total_amount - proformaDeduction);
                        const pph21Val = isPph21 ? subtotalAfterDeduction * 0.02 : 0;
                        const finalDue = subtotalAfterDeduction - pph21Val;

                        return (
                          <div className="w-full sm:w-96 space-y-2 text-sm font-mono">
                            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-650">
                              <span>Total Contract Value:</span>
                              <span className="font-bold text-slate-900">{formatCurrency(selectedOrderGroup.total_amount)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-650">
                              <span>Less: Proforma Paid {isCustomProforma ? "(Custom Received)" : `(${selectedOrderGroup.proforma_stage_percent || proformaPercent}%)`}:</span>
                              <span className="font-bold text-amber-600">-{formatCurrency(proformaDeduction)}</span>
                            </div>
                            {isPph21 && (
                              <div className="flex justify-between py-1 border-b border-slate-200 text-red-650 font-bold">
                                <span>WHT PPh 21 (2% Deduction):</span>
                                <span>-{formatCurrency(pph21Val)}</span>
                              </div>
                            )}
                            <div className="flex justify-between py-3 px-4 rounded-lg bg-blue-600 text-white text-base font-extrabold shadow-sm">
                              <span>Total Amount Due:</span>
                              <span>{formatCurrency(finalDue)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                  </div>

                  {/* Spacer to push signature down and ensure a clear gap */}
                  <div className="h-12 sm:h-16 shrink-0" />

                  {/* Signature Box at bottom */}
                  <div className="pt-5 border-t border-slate-200 flex justify-between items-end text-sm mt-auto w-full">
                    <div className="text-slate-550 text-xs leading-normal max-w-sm">
                      <p className="font-extrabold text-slate-700">Notice:</p>
                      <p>This Final Invoice is issued for completed service deliverables.</p>
                      <p>Tax invoice (Faktur Pajak) will be provided upon full payment receipt.</p>
                    </div>
                    <div className="text-center w-60 space-y-8">
                      <p className="text-slate-500 font-extrabold text-xs">Authorized Signature</p>
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

      {/* DELETE CONFIRMATION DIALOG */}
      <DeleteOrderDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        orderNumber={selectedOrderGroup?.order_number}
        isDeleting={saving}
        onConfirmDelete={handleDeleteSubmit}
      />

      {/* EMAIL & WHATSAPP CONFIRMATION DIALOG */}
      <OrderEmailDispatchDialog
        open={isEmailConfirmOpen}
        onOpenChange={setIsEmailConfirmOpen}
        emailConfirmType={emailConfirmType}
        setEmailConfirmType={setEmailConfirmType}
        selectedOrderGroup={selectedOrderGroup}
        companies={companies}
        proformaPercent={proformaPercent}
        invoiceDeliveryChannel={invoiceDeliveryChannel}
        setInvoiceDeliveryChannel={setInvoiceDeliveryChannel}
        selectedInvoiceEmails={selectedInvoiceEmails}
        setSelectedInvoiceEmails={setSelectedInvoiceEmails}
        emailConfirmPhone={emailConfirmPhone}
        setEmailConfirmPhone={setEmailConfirmPhone}
        sendingEmail={sendingEmail}
        onSend={executeSendInvoiceEmail}
        onCancel={() => {
          setIsEmailConfirmOpen(false);
          setEmailConfirmType(null);
          setSelectedInvoiceEmails([]);
          setEmailConfirmPhone("");
          setInvoiceDeliveryChannel('both');
        }}
      />

      {/* SEND FINAL DOCUMENTS CONFIRMATION DIALOG */}
      <OrderDeliverablesDialog
        open={isSendDocsModalOpen}
        onOpenChange={setIsSendDocsModalOpen}
        sendDocsOrder={sendDocsOrder}
        companies={companies}
        selectedDocsEmails={selectedDocsEmails}
        setSelectedDocsEmails={setSelectedDocsEmails}
        setSendDocsRecipientName={setSendDocsRecipientName}
        sendDocsCustomMessage={sendDocsCustomMessage}
        setSendDocsCustomMessage={setSendDocsCustomMessage}
        sendDocsDisableZip={sendDocsDisableZip}
        setSendDocsDisableZip={setSendDocsDisableZip}
        sendDocsZipInfo={sendDocsZipInfo}
        sendDocsDocuments={sendDocsDocuments}
        fetchingDocsLoading={fetchingDocsLoading}
        sendingDocsLoading={sendingDocsLoading}
        onSend={executeSendFinalDocs}
        onCancel={() => setIsSendDocsModalOpen(false)}
      />

      {/* SEND SIGNED / PRE-DOCS FOR SIGNATURE CONFIRMATION DIALOG */}
      <Dialog open={isSendSignedDocsModalOpen} onOpenChange={setIsSendSignedDocsModalOpen}>
        <DialogContent className="sm:max-w-5xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl w-[96vw] max-h-[88vh] h-[88vh] md:h-auto md:max-h-[86vh] p-0 !gap-0 bg-background border border-border text-foreground rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 pb-3 border-b border-border/60 bg-gradient-to-r from-sky-500/15 via-sky-500/5 to-transparent dark:from-sky-950/50 dark:via-sky-950/20 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5 text-sky-600 dark:text-sky-400">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs shrink-0">
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <span>Send Documents for Client Signature</span>
              </DialogTitle>
              {sendSignedDocsOrder && (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs font-bold bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400 px-2.5 py-0.5">
                    {sendSignedDocsOrder.order_number}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                    {sendSignedDocsDocuments.length} files
                  </Badge>
                  <span className="text-xs font-bold text-foreground flex items-center gap-1 bg-background/80 px-2.5 py-0.5 rounded-lg border border-border/70 truncate max-w-[220px]">
                    <Building2 className="h-3 w-3 text-sky-600 shrink-0" />
                    <span className="truncate">{sendSignedDocsOrder.company_name || sendSignedDocsOrder.client_name || "Client"}</span>
                  </span>
                </div>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-normal">
              Dispatch official documents for signature directly from the Dropbox Pre Docs folder to the client as an AES-256 password-protected ZIP archive. Status will be updated to <span className="font-semibold text-foreground">Pre Doc sent for Signature</span>.
            </DialogDescription>
            {sendSignedDocsOrder?.signed_docs_sent_at && (
              <div className="mt-2 p-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300 text-xs flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <MailCheck className="h-4 w-4 text-sky-600 shrink-0" />
                  Previously emailed on {formatDate(sendSignedDocsOrder.signed_docs_sent_at)} to <strong>{sendSignedDocsOrder.signed_docs_sent_to}</strong>
                </span>
                <Badge variant="outline" className="text-[10px] font-mono bg-sky-500/20 text-sky-700 border-sky-500/30">
                  Re-dispatch
                </Badge>
              </div>
            )}
          </div>

          {/* Body: 2-Column Horizontal Layout */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-start">
              {/* Left Column (7 cols): Stakeholders, Custom Message & Encryption Details */}
              <div className="md:col-span-6 lg:col-span-7 space-y-3">
                {/* Unverified Company Warning for Signature Pre-Docs */}
                {sendSignedDocsOrder && (() => {
                  const signedDocsBillingComp = companies.find((c: any) => c.id === (sendSignedDocsOrder.billing_company_id || sendSignedDocsOrder.company_id));
                  const signedDocsTargetComp = companies.find((c: any) => c.id === sendSignedDocsOrder.company_id);
                  const effSignedDocsComp = signedDocsBillingComp || signedDocsTargetComp;
                  const isSignedDocsVerified = sendSignedDocsZipInfo?.is_company_verified !== undefined
                    ? sendSignedDocsZipInfo.is_company_verified
                    : (effSignedDocsComp ? (effSignedDocsComp.validation_status === 'VALIDATED' || effSignedDocsComp.validation_status === 'VERIFIED') : true);
                  const signedDocsStatus = sendSignedDocsZipInfo?.company_validation_status || effSignedDocsComp?.validation_status || 'PENDING_VALIDATION';

                  if (!isSignedDocsVerified) {
                    return (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" /> Company Profile Not Verified
                        </p>
                        <p className="leading-relaxed text-[11px]">
                          Documents for signature cannot be emailed because company <strong>{sendSignedDocsOrder.company_name}</strong> has not been verified (Current status: <strong>{signedDocsStatus}</strong>). Please validate and verify the company profile first.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {sendSignedDocsOrder && (
                  <StakeholderRecipientsSelector
                    companyId={sendSignedDocsOrder.billing_company_id || sendSignedDocsOrder.company_id}
                    selectedEmails={selectedSignedDocsEmails}
                    onChange={(emails, primaryStk) => {
                      setSelectedSignedDocsEmails(emails);
                      if (primaryStk?.name) {
                        setSendSignedDocsRecipientName(primaryStk.name);
                      }
                    }}
                    fallbackContact={{
                      name: companies.find((c: any) => c.id === (sendSignedDocsOrder.billing_company_id || sendSignedDocsOrder.company_id))?.key_contact_person || sendSignedDocsOrder.client_name,
                      email: companies.find((c: any) => c.id === (sendSignedDocsOrder.billing_company_id || sendSignedDocsOrder.company_id))?.key_contact_email,
                      phone: companies.find((c: any) => c.id === (sendSignedDocsOrder.billing_company_id || sendSignedDocsOrder.company_id))?.key_contact_phone,
                      role: "Primary Contact"
                    }}
                    accentColor="sky"
                    title="Signature Recipients"
                    subtitle="Documents requiring signature will be dispatched to selected registered contacts."
                    compact={true}
                  />
                )}

                {/* Optional Custom Message Note */}
                <div className="space-y-1 bg-muted/30 p-2.5 sm:p-3 rounded-xl border border-border/60">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    Optional Delivery Note / Custom Message
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Please sign and stamp the attached documents and return a scanned copy..."
                    value={sendSignedDocsCustomMessage}
                    onChange={(e) => setSendSignedDocsCustomMessage(e.target.value)}
                    className="h-8 sm:h-9 text-xs bg-background border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                </div>

                {/* Delivery Mode: Direct Attachments vs Encrypted ZIP Checkbox */}
                <div className="flex items-start space-x-2.5 bg-muted/30 p-2.5 sm:p-3 rounded-xl border border-border/60">
                  <Checkbox
                    id="send-signed-docs-disable-zip"
                    checked={sendSignedDocsDisableZip}
                    onCheckedChange={(checked) => setSendSignedDocsDisableZip(!!checked)}
                    className="mt-0.5 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                  />
                  <div className="grid gap-0.5 leading-none cursor-pointer" onClick={() => setSendSignedDocsDisableZip(!sendSignedDocsDisableZip)}>
                    <label
                      htmlFor="send-signed-docs-disable-zip"
                      className="text-xs font-bold text-foreground cursor-pointer select-none"
                    >
                      Send as direct attachments (No ZIP & No password protection)
                    </label>
                    <p className="text-[11px] text-muted-foreground select-none">
                      When checked, documents for signature will be sent as standard individual email attachments without ZIP encryption.
                    </p>
                  </div>
                </div>

                {/* Security & Password-Protected ZIP Details Card or Direct Attachment Notice */}
                {!sendSignedDocsDisableZip ? (
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        AES-256 ZIP ({sendSignedDocsZipInfo?.zip_filename || "Pre_Documents.zip"})
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/20 border-emerald-500/30 px-2 py-0.5">
                        Auto-Encrypted
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 font-mono text-xs">
                      <span className="text-muted-foreground font-sans font-medium text-[11px]">ZIP Password:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-background/80 px-2 py-0.5 rounded border border-emerald-500/30 text-xs">
                        {sendSignedDocsZipInfo?.zip_password || "Company Code + Order ID"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 dark:bg-sky-950/20 text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-sky-800 dark:text-sky-300">
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        <Paperclip className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        Direct Document Attachments ({sendSignedDocsDocuments.length} files)
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px] text-sky-700 dark:text-sky-400 bg-sky-500/20 border-sky-500/30 px-2 py-0.5">
                        Unencrypted
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-0.5">
                      All pre-documents for signature will be attached directly to the email without password protection.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column (5 cols): Documents Breakdown */}
              <div className="md:col-span-6 lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-sky-600" /> Documents from Pre Docs ({sendSignedDocsDocuments.length})
                  </label>
                  <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded">
                    /Pre Docs
                  </span>
                </div>

                {fetchingSignedDocsLoading ? (
                  <div className="p-8 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                    <span className="text-xs font-medium">Scanning Dropbox Pre Docs folder...</span>
                  </div>
                ) : sendSignedDocsDocuments.length === 0 ? (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      No Documents Found in Pre Docs Folder
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Please upload the documents to be signed into the &quot;Pre Docs&quot; category or Dropbox folder before sending.
                    </p>
                  </div>
                ) : (
                  <div className="border border-border/60 rounded-xl overflow-hidden bg-card max-h-[360px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          <th className="py-2 px-3 w-1/2">Document Name</th>
                          <th className="py-2 px-3 w-1/2">Instructions / Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {sendSignedDocsDocuments.map((doc, idx) => (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-3 align-top">
                              <div className="flex items-start gap-2 min-w-0">
                                <div className="h-6 w-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0 mt-0.5">
                                  <Paperclip className="h-3 w-3" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-foreground text-xs block break-words" title={doc.file_name}>
                                    {doc.file_name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono block">
                                    {doc.size ? `${(doc.size / 1024).toFixed(1)} KB • ` : ""}{doc.document_type || "Pre Document"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-top">
                              {doc.description ? (
                                <div className="space-y-1 bg-sky-500/5 dark:bg-sky-950/20 p-2 rounded-lg border border-sky-500/20">
                                  {doc.description
                                    .replace(/(?<=\S)\s+(?=(?:\d+[\.\)]|[-•*])\s+)/g, '\n')
                                    .split('\n')
                                    .map((l: string) => l.trim())
                                    .filter(Boolean)
                                    .map((line: string, lineIdx: number) => (
                                      <div key={lineIdx} className="text-xs text-foreground font-medium leading-snug">
                                        {line}
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-3 sm:p-3.5 px-4 sm:px-6 border-t border-border/60 bg-muted/10 gap-2 shrink-0 flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSendSignedDocsModalOpen(false)}
              className="text-xs font-semibold h-8 sm:h-9 px-3.5 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={executeSendSignedDocs}
              disabled={
                sendingSignedDocsLoading ||
                fetchingSignedDocsLoading ||
                sendSignedDocsZipInfo?.is_company_verified === false ||
                selectedSignedDocsEmails.length === 0 ||
                sendSignedDocsDocuments.length === 0
              }
              className="text-xs font-bold h-8 sm:h-9 px-4 sm:px-5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white shadow-sm gap-1.5 rounded-lg disabled:opacity-40 transition-all"
            >
              {sendingSignedDocsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Confirm & Send for Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW TEAM MEMBERS DIALOG */}
      <TeamViewDialog
        viewingTeam={viewingTeam}
        onClose={() => setViewingTeam(null)}
      />

      {/* DUAL ORDER CHAT DIALOG (SIDE-BY-SIDE CLIENT & INTERNAL CHAT) */}
      <DualOrderChatDialog
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        orderNumber={selectedOrderGroup?.order_number || null}
        orderTitle={selectedOrderGroup?.items?.[0]?.job_title || selectedOrderGroup?.job_title}
        companyName={selectedOrderGroup?.company_name}
        clientName={selectedOrderGroup?.client_name}
        orderStatus={selectedOrderGroup?.status}
      />

      {/* GLOBAL PRINT MEDIA CSS */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
          }
          header, footer, nav, sidebar, aside, .print\:hidden {
            display: none !important;
          }
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
          #proforma-invoice-doc, #final-invoice-doc {
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
