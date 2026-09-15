"use client";
// Force Next.js rebuild: totalOrdersCount defined and checked
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
  MailCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PhoneInput, isValidPhoneNumber, isValidEmail } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";
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
  }, [searchTerm]);

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

  // Auto-open chat from URL query parameter (for notifications)
  useEffect(() => {
    if (orders.length === 0) return;

    const checkParams = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const orderNum = params.get("order");
      const openChat = params.get("chat");
      if (orderNum) {
        // Find order in list
        const matched = orders.find(o => o.order_number === orderNum);
        if (matched) {
          setSelectedOrderGroup(matched);
          if (openChat === "true") {
            setIsChatOpen(true);
            fetchProgressUpdates(orderNum);
          } else {
            setIsViewOpen(true);
          }
          // Clean up search params
          const url = new URL(window.location.href);
          url.searchParams.delete("order");
          url.searchParams.delete("chat");
          window.history.replaceState({}, "", url.pathname + url.search);
        }
      }
    };

    checkParams();
    const interval = setInterval(checkParams, 500);
    return () => clearInterval(interval);
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

    if (ord.proforma_sent_at) group.proforma_sent_at = ord.proforma_sent_at;
    if (ord.proforma_sent_to) group.proforma_sent_to = ord.proforma_sent_to;
    if (ord.final_invoice_sent_at) group.final_invoice_sent_at = ord.final_invoice_sent_at;
    if (ord.final_invoice_sent_to) group.final_invoice_sent_to = ord.final_invoice_sent_to;
    if (ord.last_invoice_sent_at) group.last_invoice_sent_at = ord.last_invoice_sent_at;
    if (ord.last_invoice_sent_to) group.last_invoice_sent_to = ord.last_invoice_sent_to;
    if (ord.invoice_delivery_channel) group.invoice_delivery_channel = ord.invoice_delivery_channel;
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

  // Active Orders: Exclude completed & paid orders from Active Orders Management, exclude PIPELINE orders, and exclude CANCELLED orders
  const activeOrders = groupedOrders.filter((ord) => {
    const isCompletedAndPaid = ord.status === "COMPLETED" && ord.payment_status === "PAID";
    const isPipeline = (ord.status || "").toUpperCase() === "PIPELINE";
    const isCancelled = (ord.status || "").toUpperCase() === "CANCELLED";
    return !isCompletedAndPaid && !isPipeline && !isCancelled;
  });

  const filteredOrders = activeOrders.filter((ord) => {
    const term = searchTerm.toLowerCase();
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
      case "REVIEW_DOCS": return "bg-teal-500/15 text-teal-600 border-teal-500/30";
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
  const [fetchingDocsLoading, setFetchingDocsLoading] = useState(false);
  const [sendingDocsLoading, setSendingDocsLoading] = useState(false);

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
          const err = await res.json();
          errMsg = err.detail
            ? (typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail))
            : JSON.stringify(err);
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

    if (isEmailActive) {
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
        // Refresh full list
        fetchData();

        // Post automated update to order chat
        try {
          const isResend = emailConfirmType === 'proforma'
            ? (selectedOrderGroup.status && !['DRAFT', 'PROFORMA_GENERATED'].includes(selectedOrderGroup.status))
            : (selectedOrderGroup.status && ['WAITING_FOR_FINAL_PAYMENT', 'FINAL_PAYMENT_COMPLETED', 'SOFT_COPY_DELIVERED', 'HARD_COPY_DELIVERED', 'COMPLETED'].includes(selectedOrderGroup.status));

          const chatVerb = isResend ? "re-sent" : "sent";
          const chatMsg = emailConfirmType === 'proforma'
            ? `Proforma invoice has been ${chatVerb} to the client ${channelLabel}`
            : `Final invoice has been ${chatVerb} to the client ${channelLabel}`;

          const chatRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/progress`, {
      credentials: "include",
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: chatMsg })
          });
          if (chatRes.ok) {
            const newUpdate = await chatRes.json();
            setProgressUpdates(prev => [...prev, newUpdate]);
          }
        } catch (chatErr) {
          console.error("Error posting automated email notification to chat:", chatErr);
        }
        fetchProgressUpdates(selectedOrderGroup.order_number);
      } else {
        const err = await res.json();
        toast.error(err.detail || `Failed to send ${emailConfirmType} invoice`);
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
    setIsSendDocsModalOpen(true);

    // Initial email resolution from cached companies & clients
    const billingCompanyId = orderGroup.billing_company_id || orderGroup.company_id;
    const companyObj = companies.find((c: any) => c.id === billingCompanyId);
    const targetCompanyObj = companies.find((c: any) => c.id === orderGroup.company_id);
    const clientObj = clients.find((c: any) => c.id === (companyObj?.client_id || orderGroup.client_id) || c.contact_person === orderGroup.client_name);

    const initialEmail = companyObj?.key_contact_email || targetCompanyObj?.key_contact_email || clientObj?.email || "";
    const initialName = companyObj?.key_contact_person || targetCompanyObj?.key_contact_person || clientObj?.contact_person || orderGroup.company_name || "";

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
          additional_recipients: additionalRecipients
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
          const err = await res.json();
          errMsg = err.detail
            ? (typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail))
            : JSON.stringify(err);
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
        <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
          {/* Minimalist Metric Strip - Expanded Horizontally */}
          <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">

            {/* Total Orders */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Orders</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalOrdersCount}</p>
              </div>
            </div>

            {/* Confirmed Value */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Confirmed Value</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>

            {/* Pending Collection */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                <Receipt className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Pending Collection</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{pendingCollectionCount}</p>
              </div>
            </div>

            {/* Staff Allocated */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
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
            <Button className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm">
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
                        <th className="p-4 w-12 text-center">No.</th>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Company Entity</th>
                        <th className="p-4">Service Package</th>
                        <th className="p-4">Assigned Consultants</th>
                        <th className="p-4 text-right">Total Amount</th>
                        <th className="p-4 text-center">Payment</th>
                        <th className="p-4 text-center">Lifecycle Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {paginatedOrders.map((ord, index) => (
                        <tr key={ord.order_number || index} className="hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0">
                          <td className="p-4 text-center font-mono font-medium text-muted-foreground align-top pt-5">
                            #{startIndex + index + 1}
                          </td>
                          <td className="p-4 align-top pt-5">
                            {ord.company_id ? (
                              <Link href={`/business/clients/documents/${ord.company_id}?from=orders`}>
                                <Badge
                                  variant="outline"
                                  className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2.5 py-0.5 rounded-md hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                                  title="Go to Company Documents Folder"
                                >
                                  {ord.order_number}
                                </Badge>
                              </Link>
                            ) : (
                              <Badge variant="outline" className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2.5 py-0.5 rounded-md">
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
                                    <span className="font-semibold text-foreground text-xs leading-normal break-words">
                                      {item.job_title}
                                    </span>
                                    {item.job_id && (
                                      <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 bg-primary/5 text-primary border-primary/20 shrink-0">
                                        {item.job_id}
                                      </Badge>
                                    )}
                                    {item.branch_name && (
                                      <Badge variant="outline" className="text-[9px] font-medium py-0 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 shrink-0">
                                        {item.branch_name}
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
                                  <Badge key={c.id} variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium flex items-center gap-1">
                                    <UserCheck className="h-3 w-3 text-emerald-600" />
                                    {c.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">No consultant assigned</span>
                            )}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-sm text-foreground align-top pt-5">
                            {formatCurrency(ord.total_amount)}
                          </td>
                          <td className="p-4 text-center align-top pt-5">
                            <div className="flex flex-col items-center gap-1.5 justify-center">
                              <Badge className={`${getPaymentStatusColor(ord.payment_status)} font-bold font-mono border text-[11px]`}>
                                {ord.payment_status || "UNPAID"}
                              </Badge>

                              {/* Accurate Online Live Status Badge */}
                              {(() => {
                                const accStatus = ord.accurate_sync_status;
                                if (accStatus === "PAID") {
                                  return (
                                    <Badge variant="outline" className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 mt-0.5" title={`Accurate Receipt: ${ord.accurate_receipt_no || 'Paid'}`}>
                                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> AOL: {ord.accurate_receipt_no || "Paid"}
                                    </Badge>
                                  );
                                }
                                if (accStatus === "INV_CREATED") {
                                  return (
                                    <Badge variant="outline" className="text-[9px] font-mono font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 flex items-center gap-1 mt-0.5" title={`Accurate Invoice: ${ord.accurate_inv_no}`}>
                                      <Receipt className="h-2.5 w-2.5 text-blue-600" /> AOL: {ord.accurate_inv_no || "Invoice"}
                                    </Badge>
                                  );
                                }
                                if (accStatus === "SO_CREATED") {
                                  return (
                                    <Badge variant="outline" className="text-[9px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 flex items-center gap-1 mt-0.5" title={`Accurate Sales Order: ${ord.accurate_so_no}`}>
                                      <Zap className="h-2.5 w-2.5 text-purple-600" /> AOL: {ord.accurate_so_no || "SO Active"}
                                    </Badge>
                                  );
                                }
                                if (accStatus === "FAILED") {
                                  return (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Badge variant="outline" className="text-[9px] font-mono font-bold bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 flex items-center gap-0.5" title={ord.accurate_sync_error || "Accurate sync failed"}>
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
                                    className="text-[9px] font-mono font-semibold text-muted-foreground hover:text-foreground flex items-center gap-0.5 mt-0.5 transition-colors opacity-60 hover:opacity-100"
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
                                  className="text-[9px] font-mono font-medium bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 flex items-center gap-1 mt-0.5"
                                  title={`Invoice dispatched ${ord.invoice_delivery_channel === 'BOTH' ? 'via Email & WhatsApp' : ord.invoice_delivery_channel === 'WHATSAPP' ? 'via WhatsApp' : 'via Email'} on ${formatDate(ord.last_invoice_sent_at)} to ${ord.last_invoice_sent_to || 'client'}`}
                                >
                                  <MailCheck className="h-2.5 w-2.5 text-sky-600 dark:text-sky-400" />
                                  <span>{ord.final_invoice_sent_at ? "Final Inv Sent" : "Proforma Sent"}</span>
                                </Badge>
                              ) : (ord.is_proforma_finalized || ord.is_final_invoice_finalized) ? (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 flex items-center gap-1 mt-0.5"
                                  title="Invoice PDF finalized in storage, but email has not yet been sent to client"
                                >
                                  <Clock className="h-2.5 w-2.5 text-amber-600" />
                                  <span>Inv Unsent</span>
                                </Badge>
                              ) : null}

                              {/* Deliverables Dispatched Indicator */}
                              {ord.deliverables_sent_at && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 mt-0.5"
                                  title={`Final documents delivered to ${ord.deliverables_sent_to || 'client'} on ${formatDate(ord.deliverables_sent_at)}`}
                                >
                                  <FileCheck className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Docs Sent</span>
                                </Badge>
                              )}

                              {isPaymentActionVisible(ord) && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-[10px] gap-1 font-bold shadow-xs"
                                    onClick={async () => {
                                      if (ord.payment_link) {
                                        navigator.clipboard.writeText(ord.payment_link);
                                        toast.success("Payment link copied to clipboard!");
                                        return;
                                      }
                                      const toastId = toast.loading("Generating secure payment link...");
                                      try {
                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${ord.order_number}/payment-link`, {
      credentials: "include",
                                          method: "POST",
                                          });
                                        if (res.ok) {
                                          const data = await res.json();
                                          toast.success("Payment link generated and copied to clipboard!", { id: toastId });
                                          setOrders(prev => prev.map(o => o.order_number === ord.order_number ? { ...o, payment_link: data.payment_link } : o));
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
                                    <Link2 className="h-3 w-3" /> Copy Link
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-[10px] gap-1 font-bold shadow-xs"
                                    onClick={async () => {
                                      const toastId = toast.loading("Verifying payment with Xendit...");
                                      try {
                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${ord.order_number}/sync-payment`, {
      credentials: "include",
                                          method: "POST",
                                          });
                                        const data = await res.json();
                                        if (res.ok && data.status === "success") {
                                          toast.success(data.message || "Payment verified and updated!", { id: toastId });
                                          fetchData();
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
                                    <RefreshCw className="h-3 w-3" /> Check Payment
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center align-top pt-5">
                            <Badge className={`${getOrderStatusColor(ord.status)} font-bold border text-[11px]`}>
                              {ord.status || "CONFIRMED"}
                            </Badge>
                          </td>
                          <td className="p-4 text-right space-x-1 align-top pt-5">
                            {(['FINAL_PAYMENT_COMPLETED', 'SOFT_COPY_DELIVERED', 'HARD_COPY_DELIVERED', 'COMPLETED'].includes(ord.status) || ord.payment_status === "PAID") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-xs font-bold gap-1.5 shadow-xs inline-flex items-center"
                                title="Send final documents to client email"
                                onClick={() => handleOpenSendDocs(ord)}
                              >
                                <Send className="h-3.5 w-3.5" /> Send Docs
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Edit Order & Consultants"
                              onClick={() => router.push(`/business/clients/orders/${ord.order_number}/edit`)}
                            >
                              <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
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
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Delete Order"
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

                      {(['FINAL_PAYMENT_COMPLETED', 'SOFT_COPY_DELIVERED', 'HARD_COPY_DELIVERED', 'COMPLETED'].includes(selectedOrderGroup?.status) || selectedOrderGroup?.payment_status === "PAID") && (
                        <Button
                          type="button"
                          onClick={() => handleOpenSendDocs(selectedOrderGroup)}
                          className="w-full gap-2 font-semibold h-11 text-sm"
                        >
                          <Send className="h-4 w-4 shrink-0" /> Send Final Documents to Client
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
                                  </div>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-sm text-zinc-950 align-top pt-6">
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
                            <th className="p-3 w-36">Branch / Reference</th>
                            <th className="p-3 w-28">Pricing Tier</th>
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
                                <td className="p-3 text-xs font-semibold text-slate-700 w-36">
                                  {item.branch_name ? (
                                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-bold">
                                      {item.branch_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-mono text-xs">-</span>
                                  )}
                                </td>
                                <td className="p-3 font-mono font-semibold text-slate-600 w-28">{item.pricing_tier}</td>
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
                            <th className="p-3 w-36">Branch / Reference</th>
                            <th className="p-3 w-28">Pricing Tier</th>
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
                                <td className="p-3 text-xs font-semibold text-slate-700 w-36">
                                  {item.branch_name ? (
                                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] font-bold">
                                      {item.branch_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-mono text-xs">-</span>
                                  )}
                                </td>
                                <td className="p-3 font-mono font-semibold text-slate-600 w-28">{item.pricing_tier}</td>
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
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Confirm Order Deletion
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Are you sure you want to delete order <span className="font-mono font-bold text-foreground">{selectedOrderGroup?.order_number}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-black dark:hover:bg-zinc-900 dark:text-white dark:border-white/60 dark:hover:border-white transition-colors"
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={saving} onClick={handleDeleteSubmit} className="shadow-xs font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EMAIL & WHATSAPP CONFIRMATION DIALOG */}
      <Dialog open={isEmailConfirmOpen} onOpenChange={setIsEmailConfirmOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl w-[94vw] p-0 bg-background border border-border text-foreground rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`p-6 sm:p-7 pb-5 border-b border-border/60 ${emailConfirmType === 'final'
            ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-950/50 dark:via-emerald-950/20'
            : 'bg-gradient-to-r from-primary/15 via-primary/5 to-transparent dark:from-primary/30 dark:via-primary/10'
            }`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <DialogTitle className={`text-xl sm:text-2xl font-bold flex items-center gap-3 ${emailConfirmType === 'final' ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
                }`}>
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border shadow-xs shrink-0 ${emailConfirmType === 'final'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-primary/15 border-primary/30 text-primary'
                  }`}>
                  <Mail className="h-5 w-5" />
                </div>
                <span>Dispatch {emailConfirmType === 'final' ? 'Final Tax' : 'Proforma'} Invoice</span>
              </DialogTitle>
              {selectedOrderGroup && (
                <Badge variant="outline" className={`font-mono text-xs sm:text-sm font-bold px-3 py-1 ${emailConfirmType === 'final'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-primary/10 border-primary/30 text-primary'
                  }`}>
                  {selectedOrderGroup.order_number}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
              Dispatches the official PDF invoice directly to the client's verified email and mobile phone with secure instant payment link.
            </DialogDescription>

            {/* Entity & Amount Summary Card */}
            {selectedOrderGroup && (
              <div className="mt-4 p-4 rounded-2xl bg-background/90 dark:bg-zinc-900/90 border border-border/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-foreground text-sm block truncate">
                      {selectedOrderGroup.company_name || selectedOrderGroup.client_name || "Client Entity"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Billing & Invoicing Entity
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs text-muted-foreground block font-medium">
                    {emailConfirmType === 'final' ? 'Final Invoice Total' : `Proforma Amount (${proformaPercent}%)`}
                  </span>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <span className="font-mono font-bold text-base sm:text-lg text-foreground">
                      {emailConfirmType === 'final'
                        ? `Rp ${(selectedOrderGroup.total_amount || 0).toLocaleString("id-ID")}`
                        : `Rp ${((selectedOrderGroup.total_amount || 0) * (proformaPercent / 100)).toLocaleString("id-ID")}`
                      }
                    </span>
                    <Badge variant="secondary" className="text-[10px] py-0.5 px-2 font-semibold">
                      {emailConfirmType === 'final' ? '100% Full Total' : `Stage ${proformaPercent}%`}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Delivery Channel Selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Delivery Channel Selection
                </span>
                <span className="text-xs text-muted-foreground/80 font-normal">Choose delivery method</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setInvoiceDeliveryChannel('both')}
                  className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer select-none gap-1.5 ${invoiceDeliveryChannel === 'both'
                    ? 'bg-primary text-primary-foreground border-primary font-bold shadow-md ring-2 ring-primary/40'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-black dark:border-white/40 dark:text-white dark:hover:bg-zinc-900 dark:hover:border-white font-medium'
                    }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    <span className="text-xs font-bold">+</span>
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="text-xs sm:text-sm leading-tight font-bold">Email & WhatsApp</span>
                  <span className="text-[10px] opacity-80 leading-tight">Both Channels</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInvoiceDeliveryChannel('email')}
                  className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer select-none gap-1.5 ${invoiceDeliveryChannel === 'email'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-md ring-2 ring-sky-500/40 dark:bg-sky-600 dark:text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-black dark:border-white/40 dark:text-white dark:hover:bg-zinc-900 dark:hover:border-white font-medium'
                    }`}
                >
                  <Mail className="h-4 w-4 mb-0.5" />
                  <span className="text-xs sm:text-sm leading-tight font-bold">Email Only</span>
                  <span className="text-[10px] opacity-80 leading-tight">PDF Attachment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInvoiceDeliveryChannel('whatsapp')}
                  className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer select-none gap-1.5 ${invoiceDeliveryChannel === 'whatsapp'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-md ring-2 ring-emerald-500/40 dark:bg-emerald-600 dark:text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-black dark:border-white/40 dark:text-white dark:hover:bg-zinc-900 dark:hover:border-white font-medium'
                    }`}
                >
                  <Phone className="h-4 w-4 mb-0.5" />
                  <span className="text-xs sm:text-sm leading-tight font-bold">WhatsApp Only</span>
                  <span className="text-[10px] opacity-80 leading-tight">Meta Cloud API</span>
                </button>
              </div>
            </div>

            {/* Email Recipients Section (Only for Email or Both) */}
            {(invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'email') && selectedOrderGroup && (
              <StakeholderRecipientsSelector
                companyId={selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id}
                selectedEmails={selectedInvoiceEmails}
                onChange={(emails) => setSelectedInvoiceEmails(emails)}
                fallbackContact={{
                  name: companies.find((c: any) => c.id === (selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id))?.key_contact_person || selectedOrderGroup.client_name,
                  email: companies.find((c: any) => c.id === (selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id))?.key_contact_email,
                  phone: companies.find((c: any) => c.id === (selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id))?.key_contact_phone,
                  role: "Primary Contact"
                }}
                accentColor={emailConfirmType === 'final' ? 'emerald' : 'primary'}
                title="Invoice Email Recipients"
                subtitle="The invoice PDF will be emailed directly to the selected registered company contacts."
              />
            )}

            {/* WhatsApp Mobile Number Field (Only for WhatsApp or Both) */}
            {(invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'whatsapp') && (
              <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border border-border/60">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    WhatsApp Mobile Number <span className="text-destructive">*</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    Meta Cloud API
                  </span>
                </label>
                <PhoneInput
                  placeholder="812 3456 789"
                  value={emailConfirmPhone}
                  required
                  onChange={(val) => setEmailConfirmPhone(val)}
                />
                <p className="text-[11px] text-muted-foreground">
                  The client will receive an automated WhatsApp notification with invoice PDF attachment and payment link.
                </p>
              </div>
            )}

            {/* Channel Info Card */}
            <div className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm transition-colors ${invoiceDeliveryChannel === 'both'
              ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 text-foreground'
              : invoiceDeliveryChannel === 'email'
                ? 'border-sky-500/30 bg-sky-500/10 dark:bg-sky-950/20 text-sky-950 dark:text-sky-200'
                : 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200'
              }`}>
              <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm mb-1">
                {invoiceDeliveryChannel === 'both' ? (
                  <>
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <span>Dispatches via Email & WhatsApp Meta Cloud API</span>
                  </>
                ) : invoiceDeliveryChannel === 'email' ? (
                  <>
                    <Mail className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>Dispatches PDF invoice attachment to client's email</span>
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Dispatches official WhatsApp message with PDF & payment link</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {invoiceDeliveryChannel === 'both'
                  ? 'Client will receive the PDF invoice attachment by email and an interactive WhatsApp notification with secure payment link.'
                  : invoiceDeliveryChannel === 'email'
                    ? 'Official PDF invoice with itemized breakdown and bank details will be delivered straight to client inbox.'
                    : 'Official WhatsApp direct message with attached PDF invoice and instant payment link will be sent.'}
              </p>
            </div>
          </div>

          <DialogFooter className="p-5 sm:p-6 px-6 sm:px-8 border-t border-border/60 bg-muted/10 gap-3 shrink-0 flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEmailConfirmOpen(false);
                setEmailConfirmType(null);
                setSelectedInvoiceEmails([]);
                setEmailConfirmPhone("");
                setInvoiceDeliveryChannel('both');
              }}
              className="text-xs sm:text-sm font-semibold h-10 sm:h-11 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-black dark:hover:bg-zinc-900 dark:text-white dark:border-white/60 dark:hover:border-white rounded-xl transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={executeSendInvoiceEmail}
              disabled={
                sendingEmail ||
                ((invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'email') && selectedInvoiceEmails.length === 0) ||
                ((invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'whatsapp') && (!emailConfirmPhone.trim() || !isValidPhoneNumber(emailConfirmPhone)))
              }
              className={`text-xs sm:text-sm font-bold h-10 sm:h-11 px-6 shadow-md gap-2 rounded-xl transition-all ${emailConfirmType === 'final'
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
            >
              {sendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {invoiceDeliveryChannel === 'both'
                ? "Send via Email & WhatsApp"
                : invoiceDeliveryChannel === 'email'
                  ? "Send via Email"
                  : "Send via WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SEND FINAL DOCUMENTS CONFIRMATION DIALOG */}
      <Dialog open={isSendDocsModalOpen} onOpenChange={setIsSendDocsModalOpen}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl w-[95vw] p-0 bg-background border border-border text-foreground rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-7 pb-5 border-b border-border/60 bg-gradient-to-r from-sky-500/15 via-sky-500/5 to-transparent dark:from-sky-950/50 dark:via-sky-950/20">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-sky-600 dark:text-sky-400">
                <div className="h-10 w-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs shrink-0">
                  <Send className="h-5 w-5" />
                </div>
                <span>Send Final Deliverable Documents</span>
              </DialogTitle>
              {sendDocsOrder && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs sm:text-sm font-bold bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400 px-3 py-1">
                    {sendDocsOrder.order_number}
                  </Badge>
                  <Badge variant="secondary" className="text-xs sm:text-sm font-semibold px-2.5 py-1">
                    {sendDocsDocuments.length} files attached
                  </Badge>
                </div>
              )}
            </div>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Dispatch official deliverables directly from the Dropbox order folder to the client as an AES-256 password-protected ZIP archive.
            </DialogDescription>

            {/* Entity Summary */}
            {sendDocsOrder && (
              <div className="mt-4 p-4 rounded-2xl bg-background/90 dark:bg-zinc-900/90 border border-border/80 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-foreground text-sm block truncate">
                      {sendDocsOrder.company_name || sendDocsOrder.client_name || "Individual Client"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Client Entity & Organization
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono bg-muted/50 px-3 py-1">
                  Dropbox Cloud Synced
                </Badge>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Stakeholder Recipients Selection */}
            {sendDocsOrder && (
              <StakeholderRecipientsSelector
                companyId={sendDocsOrder.billing_company_id || sendDocsOrder.company_id}
                selectedEmails={selectedDocsEmails}
                onChange={(emails, primaryStk) => {
                  setSelectedDocsEmails(emails);
                  if (primaryStk?.name) {
                    setSendDocsRecipientName(primaryStk.name);
                  }
                }}
                fallbackContact={{
                  name: companies.find((c: any) => c.id === (sendDocsOrder.billing_company_id || sendDocsOrder.company_id))?.key_contact_person || sendDocsOrder.client_name,
                  email: companies.find((c: any) => c.id === (sendDocsOrder.billing_company_id || sendDocsOrder.company_id))?.key_contact_email,
                  phone: companies.find((c: any) => c.id === (sendDocsOrder.billing_company_id || sendDocsOrder.company_id))?.key_contact_phone,
                  role: "Primary Contact"
                }}
                accentColor="sky"
                title="Deliverables Email Recipients"
                subtitle="Password-protected final documents will be dispatched exclusively to the selected registered company contacts."
              />
            )}

            {/* Optional Custom Message Note */}
            <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border border-border/60">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                Optional Delivery Note / Custom Message
              </label>
              <Input
                type="text"
                placeholder="e.g. Please find the legalized articles of association and official deed documents attached..."
                value={sendDocsCustomMessage}
                onChange={(e) => setSendDocsCustomMessage(e.target.value)}
                className="h-10 text-xs sm:text-sm bg-background border-zinc-300 dark:border-zinc-700 rounded-xl"
              />
            </div>

            {/* Security & Password-Protected ZIP Details Card */}
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 text-xs sm:text-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                <span className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
                  Password-Protected AES-256 ZIP Archive
                </span>
                <Badge variant="outline" className="font-mono text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/20 border-emerald-500/30 px-2.5 py-0.5">
                  Auto-Encrypted
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All deliverable files will be compressed into a secure encrypted ZIP archive (<span className="font-mono font-semibold text-foreground">{sendDocsZipInfo?.zip_filename || "Documents.zip"}</span>).
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                <span className="text-muted-foreground font-sans font-medium">ZIP Extraction Password:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-background/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  {sendDocsZipInfo?.zip_password || "NPWP + Company Code"}
                </span>
                <span className="text-[11px] text-muted-foreground italic font-sans">
                  (NPWP: {sendDocsZipInfo?.target_tax_number || "N/A"} • Company Code: {sendDocsZipInfo?.target_company_code || "N/A"})
                </span>
              </div>
            </div>

            {/* Final Documents Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-sky-600" /> Deliverables from Dropbox ({sendDocsDocuments.length})
                </label>
                <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2.5 py-0.5 rounded">
                  /Final Documents
                </span>
              </div>

              {fetchingDocsLoading ? (
                <div className="p-8 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
                  <span className="text-sm font-medium">Scanning Dropbox order folder for final documents...</span>
                </div>
              ) : sendDocsDocuments.length === 0 ? (
                <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs sm:text-sm space-y-1.5">
                  <div className="font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    No Deliverables Found in Final Documents Folder
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Please upload the completed final documents in the Company Documents section or Dropbox folder before sending.
                  </p>
                </div>
              ) : (
                <div className="border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/40 bg-card">
                  {sendDocsDocuments.map((doc, idx) => (
                    <div key={idx} className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-foreground block truncate">{doc.file_name}</span>
                          <span className="text-xs text-muted-foreground font-mono block mt-0.5">
                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB • ` : ""}{doc.document_type || "Final Document"}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono font-semibold text-emerald-600 bg-emerald-500/10 border-emerald-500/20 px-2.5 py-0.5 shrink-0">
                        Ready
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-5 sm:p-6 px-6 sm:px-8 border-t border-border/60 bg-muted/10 gap-3 shrink-0 flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSendDocsModalOpen(false)}
              className="text-xs sm:text-sm font-semibold h-10 sm:h-11 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-black dark:hover:bg-zinc-900 dark:text-white dark:border-white/60 dark:hover:border-white rounded-xl transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={executeSendFinalDocs}
              disabled={sendingDocsLoading || fetchingDocsLoading || selectedDocsEmails.length === 0 || sendDocsDocuments.length === 0}
              className="text-xs sm:text-sm font-bold h-10 sm:h-11 px-6 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white shadow-md gap-2 rounded-xl disabled:opacity-40 transition-all"
            >
              {sendingDocsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Confirm & Send Documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW TEAM MEMBERS DIALOG */}
      <Dialog open={!!viewingTeam} onOpenChange={(open) => !open && setViewingTeam(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/10 shrink-0">
            <DialogTitle className="text-lg font-bold flex items-center gap-2" style={{ color: viewingTeam?.color || "inherit" }}>
              <Users className="h-5 w-5" /> {viewingTeam?.name} ({viewingTeam?.code})
            </DialogTitle>
            <DialogDescription className="mt-1">
              {viewingTeam?.description || "No description provided for this team."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Team Leader */}
            <div className="flex items-center gap-2.5 bg-muted/40 p-3 rounded-xl border border-border/30">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0 border border-primary/20">
                {viewingTeam?.leader ? `${viewingTeam.leader.first_name[0]}${viewingTeam.leader.last_name[0]}` : "TL"}
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground/60 block font-bold uppercase tracking-wider">Team Leader</span>
                <span className="text-xs font-semibold text-foreground">
                  {viewingTeam?.leader ? `${viewingTeam.leader.first_name} ${viewingTeam.leader.last_name}` : "Unassigned"}
                </span>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Team Members ({viewingTeam?.members?.length || 0})</h4>
              {(!viewingTeam?.members || viewingTeam.members.length === 0) ? (
                <p className="text-xs text-muted-foreground italic">No members assigned to this team.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {viewingTeam.members.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-2.5 p-2 hover:bg-muted/30 rounded-lg transition-colors border border-border/20 bg-background/50">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary shrink-0 border border-primary/15">
                        {member.first_name?.[0] || ""}{member.last_name?.[0] || ""}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-foreground block truncate">{member.first_name} {member.last_name}</span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {member.job_title || "Consultant"} • {member.department?.name || "General"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-muted/5 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setViewingTeam(null)} className="w-full sm:w-auto font-semibold">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
