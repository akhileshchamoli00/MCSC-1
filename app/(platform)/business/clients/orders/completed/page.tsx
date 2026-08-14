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
  Mail,
  MessageSquare,
  Link2
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import domToImage from "dom-to-image";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleTextChange = (val: string, selectionStart: number) => {
    setNewProgressMessage(val);

    // Look back from current cursor to find if we're typing a mention
    const textBeforeCursor = val.slice(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1 && !textBeforeCursor.slice(lastAtIdx).includes(" ")) {
      const query = textBeforeCursor.slice(lastAtIdx + 1).toLowerCase();
      setSuggestionSearch(query);

      // Filter employees: only include assigned consultants OR Finance department members
      const consultantIds = selectedOrderGroup?.consultant_ids || [];
      const filteredEmps = (employees || []).filter((emp: any) => {
        const isConsultant = consultantIds.includes(emp.id);
        const isFinance = emp.department?.name?.toLowerCase().includes("finance");
        
        if (!isConsultant && !isFinance) return false;
        
        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
        return fullName.includes(query);
      }).map(emp => ({ ...emp, type: "employee" }));

      // Filter active teams
      const filteredTeams = (teams || []).filter((t: any) => 
        t.is_active && t.name.toLowerCase().includes(query)
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
    const activeToken = localStorage.getItem("hrms_token");
    if (!activeToken) return;
    setLoadingProgress(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNum}/progress`, {
        headers: { "Authorization": `Bearer ${activeToken}` }
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
    const activeToken = localStorage.getItem("hrms_token");
    if (!activeToken) return;
    setPostingProgress(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
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
  const [isEditOpen, setIsEditOpen] = useState(false);
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
  const [isEmailConfirmOpen, setIsEmailConfirmOpen] = useState(false);
  const [emailConfirmType, setEmailConfirmType] = useState<'proforma' | 'final' | null>(null);
  const [emailConfirmAddress, setEmailConfirmAddress] = useState("");



  // Edit Form State
  const [editForm, setEditForm] = useState({
    status: "CONFIRMED",
    payment_status: "UNPAID",
    invoice_number: "",
    consultant_ids: [] as number[],
    notes: "",
    items: [] as any[],
    is_proforma_finalized: false,
    is_final_invoice_finalized: false
  });

  const fetchData = async () => {
    const activeToken = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;
    if (!activeToken) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [ordRes, cliRes, compRes, serRes, empRes, teamRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, { headers: { "Authorization": `Bearer ${activeToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, { headers: { "Authorization": `Bearer ${activeToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { headers: { "Authorization": `Bearer ${activeToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, { headers: { "Authorization": `Bearer ${activeToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { headers: { "Authorization": `Bearer ${activeToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, { headers: { "Authorization": `Bearer ${activeToken}` } })
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

  useEffect(() => {
    fetchData();
    if (typeof window !== "undefined" && !(window as any).html2pdf) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      document.head.appendChild(script);
    }
  }, []);

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
        created_at: ord.created_at,
        status: ord.status || "CONFIRMED",
        payment_status: ord.payment_status || "UNPAID",
        invoice_number: ord.invoice_number || null,
        consultant_ids: ord.consultant_ids || [],
        consultants: ord.consultants || [],
        notes: ord.notes || "",
        total_amount: 0,
        items: [],
        is_proforma_finalized: ord.is_proforma_finalized || false,
        proforma_stage_percent: ord.proforma_stage_percent || 50,
        is_final_invoice_finalized: ord.is_final_invoice_finalized || false
      });
    }
    const group = groupedOrdersMap.get(key);
    group.items.push(ord);
    group.total_amount += ord.unit_price || ord.total_amount || 0;

    if (ord.is_proforma_finalized) {
      group.is_proforma_finalized = true;
    }
    if (ord.proforma_stage_percent) {
      group.proforma_stage_percent = ord.proforma_stage_percent;
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



  const toggleEditConsultantSelect = (empId: number) => {
    setEditForm(prev => {
      const current = prev.consultant_ids || [];
      const updated = current.includes(empId) ? current.filter(id => id !== empId) : [...current, empId];
      return { ...prev, consultant_ids: updated };
    });
  };



  const handleOpenEditModal = (group: any) => {
    setSelectedOrderGroup(group);
    const pct = group.proforma_stage_percent || 70;
    setProformaPercent(pct);
    setTempPercent(String(pct));
    setTempAmount(String(Math.round((group.total_amount || 0) * pct / 100)));

    // Map items from group.items to include the _raw_service from services list so options calculate pricing correctly
    const mappedItems = (group.items || []).map((item: any) => {
      const matchedService = services.find((s) => s.id === item.service_id);
      return {
        id: item.id,
        service_id: item.service_id ? String(item.service_id) : "",
        job_id: item.job_id || "",
        job_title: item.job_title || "",
        description: item.description || "",
        pricing_tier: item.pricing_tier || "BASE",
        unit_price: item.unit_price || 0,
        custom_price_text: item.custom_price_text || "",
        _raw_service: matchedService || null
      };
    });

    setEditForm({
      status: group.status || "CONFIRMED",
      payment_status: group.payment_status || "UNPAID",
      invoice_number: group.invoice_number || "",
      consultant_ids: group.consultant_ids || [],
      notes: group.notes || "",
      items: mappedItems,
      is_proforma_finalized: group.is_proforma_finalized || false,
      is_final_invoice_finalized: group.is_final_invoice_finalized || false
    });
    setIsEditOpen(true);
  };

  const handleEditServiceSelect = (index: number, serviceIdStr: string) => {
    const selectedService = services.find((s) => String(s.id) === serviceIdStr);
    if (!selectedService) return;

    setEditForm((prev) => {
      const itemsCopy = [...prev.items];
      const tier = itemsCopy[index].pricing_tier || "BASE";

      let price = selectedService.base_price || 0;
      let customText = "";

      if (tier === "PARTNER_A") {
        price = selectedService.partner_a_price ?? (selectedService.base_price * 0.8);
      } else if (tier === "PARTNER_A1") {
        price = selectedService.partner_a1_price ?? (selectedService.base_price * 0.6);
      } else if (tier === "PARTNER_A2") {
        price = selectedService.partner_a2_price ?? (selectedService.base_price * 0.5);
      } else if (tier === "PARTNER_A3") {
        customText = selectedService.partner_a3_price || "Custom";
        price = 0;
      }

      itemsCopy[index] = {
        ...itemsCopy[index],
        service_id: String(selectedService.id),
        job_id: selectedService.job_id,
        job_title: selectedService.job_title,
        description: selectedService.description || "",
        unit_price: price,
        custom_price_text: customText,
        _raw_service: selectedService
      };
      return { ...prev, items: itemsCopy };
    });
  };

  const handleEditTierSelect = (index: number, tier: string) => {
    setEditForm((prev) => {
      const itemsCopy = [...prev.items];
      const item = itemsCopy[index];
      const s = item._raw_service;

      let price = 0;
      let customText = "";

      if (s) {
        if (tier === "BASE") {
          price = s.base_price || 0;
        } else if (tier === "PARTNER_A") {
          price = s.partner_a_price ?? (s.base_price * 0.8);
        } else if (tier === "PARTNER_A1") {
          price = s.partner_a1_price ?? (s.base_price * 0.6);
        } else if (tier === "PARTNER_A2") {
          price = s.partner_a2_price ?? (s.base_price * 0.5);
        } else if (tier === "PARTNER_A3") {
          customText = s.partner_a3_price || "Custom";
          price = 0;
        }
      }

      itemsCopy[index] = {
        ...item,
        pricing_tier: tier,
        unit_price: price,
        custom_price_text: customText
      };
      return { ...prev, items: itemsCopy };
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeToken = localStorage.getItem("hrms_token");
    if (!activeToken || !selectedOrderGroup || !editForm.items) return;
    setSaving(true);
    try {
      await Promise.all(
        editForm.items.map((item: any) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${item.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${activeToken}`
            },
            body: JSON.stringify({
              status: editForm.status,
              payment_status: editForm.payment_status,
              invoice_number: editForm.invoice_number || null,
              consultant_ids: editForm.consultant_ids,
              notes: editForm.notes || null,
              service_id: item.service_id ? Number(item.service_id) : null,
              job_id: item.job_id || null,
              job_title: item.job_title || null,
              description: item.description || null,
              pricing_tier: item.pricing_tier || null,
              unit_price: item.pricing_tier === "PARTNER_A3" ? 0 : Number(item.unit_price),
              custom_price_text: item.custom_price_text || null,
              is_proforma_finalized: editForm.is_proforma_finalized,
              is_final_invoice_finalized: editForm.is_final_invoice_finalized
            })
          })
        )
      );
      toast.success(`Order ${selectedOrderGroup.order_number} updated successfully!`);
      setIsEditOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Error updating order details");
    } finally {
      setSaving(false);
    }
  };

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
    const activeToken = localStorage.getItem("hrms_token");
    if (!activeToken || !selectedOrderGroup || !selectedOrderGroup.items) return;
    setSaving(true);
    try {
      await Promise.all(
        selectedOrderGroup.items.map((itemRow: any) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${itemRow.id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${activeToken}` }
          })
        )
      );
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

  const filteredOrders = groupedOrders.filter((ord) => {
    // Only include completed & paid orders in Completed Orders History
    const isCompletedAndPaid = ord.status === "COMPLETED" && ord.payment_status === "PAID";
    if (!isCompletedAndPaid) return false;

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

  const totalOrdersCount = groupedOrders.length;
  const totalRevenue = groupedOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const pendingCollectionCount = groupedOrders.filter(o => o.payment_status !== "PAID").length;

  const allocatedStaffSet = new Set<number>();
  groupedOrders.forEach(o => {
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
      case "REVIEW_DOCS": return "bg-teal-500/15 text-teal-600 border-teal-500/30";
      case "FINAL_DOCUMENT_PREPARATION": return "bg-orange-500/15 text-orange-600 border-orange-500/30";
      case "FINAL_DOC_READY": return "bg-lime-500/15 text-lime-600 border-lime-500/30";
      case "INVOICE_GENERATED": return "bg-pink-500/15 text-pink-600 border-pink-500/30";
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

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingFinalPdf, setDownloadingFinalPdf] = useState(false);
  const [finalizingInvoice, setFinalizingInvoice] = useState(false);
  const [finalizingFinalInvoice, setFinalizingFinalInvoice] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

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
    const activeToken = localStorage.getItem("hrms_token");
    if (!activeToken) return;

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
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to finalize invoice");
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

    } catch (err: any) {
      console.error("Finalize Invoice Error:", err);
      toast.error(err.message || "Failed to finalize invoice");
    } finally {
      setFinalizingInvoice(false);
    }
  };

  const handleSendInvoiceEmail = (invoiceType: 'proforma' | 'final') => {
    if (!selectedOrderGroup) return;

    // Find company & client email
    const companyObj = companies.find((c: any) => c.id === selectedOrderGroup.company_id);
    const clientObj = clients.find((c: any) => c.id === selectedOrderGroup.client_id || c.contact_person === selectedOrderGroup.client_name);
    const targetEmail = companyObj?.key_contact_email || clientObj?.email || "";

    if (!targetEmail) {
      toast.error("No recipient email found for this company/client.");
      return;
    }

    setEmailConfirmType(invoiceType);
    setEmailConfirmAddress(targetEmail);
    setIsEmailConfirmOpen(true);
  };

  const executeSendInvoiceEmail = async () => {
    if (!selectedOrderGroup || !emailConfirmType || !emailConfirmAddress) return;

    setSendingEmail(true);
    setIsEmailConfirmOpen(false);
    const activeToken = localStorage.getItem("hrms_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/send-invoice-email?invoice_type=${emailConfirmType}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`
        }
      });
      if (res.ok) {
        toast.success(`Successfully sent ${emailConfirmType} invoice email to ${emailConfirmAddress}!`);
        // Update selectedOrderGroup status in UI
        setSelectedOrderGroup((prev: any) => prev ? { ...prev, status: "WAITING_ON_CLIENT" } : null);
        // Refresh full list
        fetchData();

        // Post automated update to order chat
        try {
          const chatMsg = emailConfirmType === 'proforma'
            ? "Proforma invoice email has been sent to the client"
            : "Final invoice email has been sent to the client";

          const chatRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/progress`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${activeToken}`
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
      } else {
        const err = await res.json();
        toast.error(err.detail || `Failed to send ${emailConfirmType} invoice email`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error sending invoice email");
    } finally {
      setSendingEmail(false);
      setEmailConfirmType(null);
      setEmailConfirmAddress("");
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
    const activeToken = localStorage.getItem("hrms_token");
    if (!activeToken) return;

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
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to finalize final invoice");
      }

      const updatedOrders = await res.json();
      toast.success("Final invoice successfully finalized and saved to Dropbox!");

      // Update selectedOrderGroup and main orders state
      setSelectedOrderGroup((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
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

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/business/clients" className="mt-1">
            <Button variant="ghost" size="icon" title="Back to Clients">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm shrink-0 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Completed Orders</h1>
            <p className="text-muted-foreground text-sm">
              View historical record of all completed and paid client service orders.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Total Orders */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 shrink-0">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Total Orders</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{totalOrdersCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Confirmed Value */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Confirmed Value</p>
              <h3 className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">{formatCurrency(totalRevenue)}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Pending Collection */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <Receipt className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Pending Collection</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{pendingCollectionCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Staff Allocated */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Staff Allocated</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{allocatedStaffCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Order ID, Company..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Orders Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 border-t">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/35" />
              <span className="text-sm font-semibold">No Client Orders Found</span>
              <p className="text-xs max-w-sm">Click "Create New Order" above to issue your first service order.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border-t">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
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
                                className="font-mono font-bold text-xs bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary cursor-pointer transition-colors"
                                title="Go to Company Documents Folder"
                              >
                                {ord.order_number}
                              </Badge>
                            </Link>
                          ) : (
                            <Badge variant="outline" className="font-mono font-bold text-xs bg-primary/10 border-primary/30 text-primary">
                              {ord.order_number}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 font-bold text-foreground text-sm align-top pt-5">
                          <div>{ord.company_name || "Personal Client Account"}</div>
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
                                  {item.pricing_tier && (
                                    <Badge variant="secondary" className="text-[9px] py-0 px-1 font-medium capitalize shrink-0">
                                      {item.pricing_tier.toLowerCase().replace('_', ' ')}
                                    </Badge>
                                  )}
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
                            {ord.payment_status !== "PAID" && ord.is_proforma_finalized && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[10px] gap-1 font-bold border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm"
                                onClick={async () => {
                                  if (ord.payment_link) {
                                    navigator.clipboard.writeText(ord.payment_link);
                                    toast.success("Payment link copied to clipboard!");
                                    return;
                                  }
                                  const activeToken = localStorage.getItem("hrms_token");
                                  const toastId = toast.loading("Generating secure payment link...");
                                  try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${ord.order_number}/payment-link`, {
                                      method: "POST",
                                      headers: {
                                        "Authorization": `Bearer ${activeToken}`
                                      }
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
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center align-top pt-5">
                          <Badge className={`${getOrderStatusColor(ord.status)} font-bold border text-[11px]`}>
                            {ord.status || "CONFIRMED"}
                          </Badge>
                        </td>
                        <td className="p-4 text-right space-x-1 align-top pt-5">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Edit Order & Consultants"
                            onClick={() => handleOpenEditModal(ord)}
                          >
                            <Edit className="h-4 w-4 text-blue-600 hover:text-blue-700" />
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
                              setTempAmount(String(Math.round((ord.total_amount || 0) * pct / 100)));
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



      {/* EDIT ORDER DIALOG (EDIT CONSULTANTS & LIFECYCLE) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl sm:max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl shadow-2xl">
          <DialogHeader className="pb-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Edit className="h-6 w-6 text-blue-600" /> Edit Order Details & Consultants
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Update assigned consultants, order progress lifecycle stage, and payment status for <span className="font-mono font-bold text-foreground">{selectedOrderGroup?.order_number}</span>.
              </DialogDescription>
            </div>
            {selectedOrderGroup && (
              <Badge variant="outline" className="font-mono text-sm font-bold px-3 py-1 bg-primary/10 border-primary/30 text-primary self-start sm:self-auto">
                {selectedOrderGroup.order_number}
              </Badge>
            )}
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-6 pt-4">

            {/* Summary Banner */}
            {selectedOrderGroup && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-border/60 bg-muted/20 text-xs">
                <div>
                  <span className="text-muted-foreground block font-medium">Target Company Entity</span>
                  <span className="font-bold text-sm text-foreground">{selectedOrderGroup.company_name || "Individual Account"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Client Representative</span>
                  <span className="font-semibold text-foreground">{selectedOrderGroup.client_name || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Total Contract Amount</span>
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(selectedOrderGroup.total_amount)}
                  </span>
                </div>
              </div>
            )}

            {/* Finalization / Unlock Status Control (Only shown if currently finalized to allow unlocking) */}
            {selectedOrderGroup?.is_proforma_finalized && (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-500" /> Proforma Invoice Finalized
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    This order's proforma invoice is finalized. Uncheck to unlock and allow edits.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 bg-background/50 p-2.5 rounded-lg border">
                  <input
                    type="checkbox"
                    id="unlock-proforma-checkbox"
                    checked={editForm.is_proforma_finalized}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setEditForm(prev => {
                        const nextForm = { ...prev, is_proforma_finalized: isChecked };
                        if (!isChecked) {
                          nextForm.is_final_invoice_finalized = false;
                          nextForm.status = "DRAFT";
                        }
                        return nextForm;
                      });
                    }}
                    className="h-5 w-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                  />
                  <label htmlFor="unlock-proforma-checkbox" className="text-xs font-bold text-foreground cursor-pointer select-none">
                    {editForm.is_proforma_finalized ? "Finalized (Locked)" : "Unlocked (Editable)"}
                  </label>
                </div>
              </div>
            )}

            {/* Consultant Multi-Select (Spacious Grid) */}
            <div className="space-y-2 p-4 rounded-xl border border-border/70 bg-muted/20">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" /> Assign Consultants to Order (Multiple Consultants Allowed)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-3 bg-background rounded-lg border">
                {(() => {
                  const licensingTeam = (teams || []).find((t: any) => t.name.toLowerCase() === "licensing team");
                  const licensingMemberIds = licensingTeam ? (licensingTeam.members || []).map((m: any) => m.id) : [];

                  const licensingEmployees = employees.filter((emp) => licensingMemberIds.includes(emp.id));

                  if (licensingEmployees.length === 0) {
                    return <span className="text-xs text-muted-foreground col-span-3">No licensing team consultants available</span>;
                  }

                  return licensingEmployees.map((emp) => {
                    const isChecked = (editForm.consultant_ids || []).includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer select-none text-xs transition-colors ${isChecked ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border/60 hover:bg-muted/40"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditConsultantSelect(emp.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                        />
                        <div className="truncate">
                          <div className="font-medium text-foreground truncate">{emp.first_name} {emp.last_name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{emp.job_title || "Consultant"}</div>
                        </div>
                      </label>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Edit Order Items */}
            <div className="space-y-4 p-4 rounded-xl border border-border/77 bg-muted/20">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" /> Edit Order Job Items ({(editForm.items || []).length})
              </label>

              <div className="space-y-4 max-h-96 overflow-y-auto p-1">
                {(editForm.items || []).map((item: any, idx: number) => (
                  <div key={item.id || idx} className="p-4 rounded-xl border border-border/60 bg-background space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <span className="text-xs font-bold text-primary font-mono">Service Item #{idx + 1}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Service Selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Select Service / Job Title *</label>
                        <select
                          value={item.service_id}
                          onChange={(e) => handleEditServiceSelect(idx, e.target.value)}
                          disabled={editForm.is_proforma_finalized}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-80"
                        >
                          <option value="">Choose Service Package...</option>
                          {services.map((s) => (
                            <option key={s.id} value={String(s.id)}>
                              {s.job_title} ({s.job_id})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tier Selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Select Pricing Tier *</label>
                        <select
                          value={item.pricing_tier}
                          onChange={(e) => handleEditTierSelect(idx, e.target.value)}
                          disabled={editForm.is_proforma_finalized}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-80"
                        >
                          <option value="BASE">
                            Base Price {item._raw_service ? `(${formatCurrency(item._raw_service.base_price)})` : ""}
                          </option>
                          <option value="PARTNER_A">
                            Partner A (-{item._raw_service?.partner_a_discount || 20}% {item._raw_service ? `= ${formatCurrency(item._raw_service.partner_a_price ?? (item._raw_service.base_price * 0.8))}` : ""})
                          </option>
                          <option value="PARTNER_A1">
                            Partner A1 (-{item._raw_service?.partner_a1_discount || 40}% {item._raw_service ? `= ${formatCurrency(item._raw_service.partner_a1_price ?? (item._raw_service.base_price * 0.6))}` : ""})
                          </option>
                          <option value="PARTNER_A2">
                            Partner A2 (-{item._raw_service?.partner_a2_discount || 50}% {item._raw_service ? `= ${formatCurrency(item._raw_service.partner_a2_price ?? (item._raw_service.base_price * 0.5))}` : ""})
                          </option>
                          <option value="PARTNER_A3">
                            Partner A3 (Free Text: {item._raw_service?.partner_a3_price || "Custom"})
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Price Text Input (only show if PARTNER_A3 tier is selected) */}
                    {item.pricing_tier === "PARTNER_A3" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Custom Price Text (e.g. Free, Special Rate, Quote Needed) *</label>
                        <Input
                          placeholder="e.g. Special Corporate Waiver"
                          value={item.custom_price_text || ""}
                          disabled={editForm.is_proforma_finalized}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm(prev => {
                              const itemsCopy = [...prev.items];
                              itemsCopy[idx] = { ...itemsCopy[idx], custom_price_text: val };
                              return { ...prev, items: itemsCopy };
                            });
                          }}
                          className="h-10 text-xs"
                          required
                        />
                      </div>
                    )}

                    {/* Reflected Price Bar */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs">
                      <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-primary" /> Active Price:
                      </span>
                      <span className="font-bold text-sm text-foreground">
                        {item.pricing_tier === "PARTNER_A3"
                          ? `Free Text: ${item.custom_price_text || "Custom"}`
                          : formatCurrency(item.unit_price)
                        }
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Status & Payment Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/70 bg-muted/20">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lifecycle Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PROFORMA_GENERATED">PROFORMA GENERATED</option>
                  <option value="WAITING_ON_CLIENT">WAITING ON CLIENT</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="ORDER_ASSIGNED">ORDER ASSIGNED</option>
                  <option value="REVIEW_DOCS">REVIEW DOCS</option>
                  <option value="FINAL_DOCUMENT_PREPARATION">FINAL DOCUMENT PREPARATION</option>
                  <option value="FINAL_DOC_READY">FINAL DOC READY</option>
                  <option value="INVOICE_GENERATED">INVOICE GENERATED</option>
                  <option value="SOFT_COPY_DELIVERED">SOFT COPY DELIVERED</option>
                  <option value="HARD_COPY_DELIVERED">HARD copy DELIVERED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Status</label>
                <select
                  value={editForm.payment_status}
                  onChange={(e) => setEditForm({ ...editForm, payment_status: e.target.value })}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="px-6 font-semibold shadow-md gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Order Changes
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>
      </div>

      {/* VIEW ORDER DETAILS INLINE SLIDING PANEL (CLEAN NO-SCROLL 2-COLUMN LAYOUT) */}
      <AnimatePresence>
        {isViewOpen && selectedOrderGroup && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden pt-4 px-4 pb-4 sm:pt-6 sm:px-6 sm:pb-6 lg:pt-8 lg:px-8 lg:pb-6"
          >
            <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col overflow-hidden min-h-0">

              {/* Header with Back Button */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsViewOpen(false)}
                    className="gap-2 font-bold shadow-xs"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Orders List
                  </Button>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Receipt className="h-6 w-6 text-primary" /> Order Summary & Consultants
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-sm font-bold px-3 py-1 bg-primary/10 border-primary/30 text-primary">
                    {selectedOrderGroup.order_number}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setIsViewOpen(false)} className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 w-full overflow-y-auto pr-1 min-h-0 space-y-5 pt-3">

              {/* 2-Column Responsive Layout Utilizing Horizontal Whitespace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Left Column (Metadata & Consultants) - 5 cols */}
                <div className="lg:col-span-5 space-y-4">

                  {/* Entity & Rep Details */}
                  <div className="p-4 rounded-xl border border-border/60 bg-muted/20 text-xs space-y-3">
                    <div className="flex justify-between items-start pb-2 border-b border-border/40">
                      <div>
                        <span className="text-muted-foreground block font-medium uppercase text-[10px]">Target Company Entity</span>
                        <span className="font-bold text-base text-foreground block mt-0.5">{selectedOrderGroup.company_name || "Individual Account"}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge className={`${getPaymentStatusColor(selectedOrderGroup.payment_status)} font-mono font-bold text-[10px] uppercase`}>
                          {selectedOrderGroup.payment_status}
                        </Badge>
                        {selectedOrderGroup.payment_status !== "PAID" && selectedOrderGroup.is_proforma_finalized && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] gap-1 font-bold border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30"
                            onClick={async () => {
                              if (selectedOrderGroup.payment_link) {
                                navigator.clipboard.writeText(selectedOrderGroup.payment_link);
                                toast.success("Payment link copied to clipboard!");
                                return;
                              }
                              const activeToken = localStorage.getItem("hrms_token");
                              const toastId = toast.loading("Generating secure payment link...");
                              try {
                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.order_number}/payment-link`, {
                                  method: "POST",
                                  headers: {
                                    "Authorization": `Bearer ${activeToken}`
                                  }
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
                              <Link2 className="h-3 w-3" /> Copy Link
                            </Button>
                          )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-muted-foreground block font-medium uppercase text-[10px]">Client Representative</span>
                        <span className="font-semibold text-xs text-foreground block mt-0.5">{selectedOrderGroup.client_name || "-"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block font-medium uppercase text-[10px]">Order Date</span>
                        <span className="font-mono font-bold text-xs text-foreground block mt-0.5">{formatDate(selectedOrderGroup.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Consultants */}
                  <div className="p-4 rounded-xl border border-border/60 bg-background space-y-2 text-xs">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" /> Assigned Consultants
                    </span>
                    {selectedOrderGroup.consultants && selectedOrderGroup.consultants.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedOrderGroup.consultants.map((c: any) => (
                          <Badge key={c.id} variant="secondary" className="font-semibold text-xs py-1 px-2.5 gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{c.name} <span className="text-[10px] opacity-75">({c.job_title})</span></span>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-xs block py-0.5">No consultants assigned to this order</span>
                    )}
                  </div>

                  {/* Inline Mandatory Proforma Percentage Selector Card */}
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-emerald-600" /> Proforma Invoice Stage <span className="text-destructive">*</span>
                      </label>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {proformaPercent}% Selected
                      </span>
                    </div>

                    {/* Input & Quick Preset Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Percentage Input */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-850/80 dark:text-emerald-300/80 block">Percentage</span>
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
                            className="pr-8 font-mono text-xs font-bold bg-background disabled:opacity-85 h-9"
                          />
                          <Percent className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                        {/* PPH 21 Checkbox */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="checkbox"
                            id="pph21-checkbox"
                            checked={isPph21}
                            disabled={selectedOrderGroup.is_proforma_finalized}
                            onChange={(e) => setIsPph21(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
                          />
                          <label htmlFor="pph21-checkbox" className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 cursor-pointer select-none">
                            Add PPH 21 (2% Tax WHT)
                          </label>
                        </div>
                      </div>

                      {/* Direct Amount Input */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-850/80 dark:text-emerald-300/80 block">Amount (IDR)</span>
                        <Input
                          type="number"
                          value={tempAmount}
                          onChange={(e) => handleAmtChange(e.target.value)}
                          placeholder="e.g. 7000000"
                          disabled={selectedOrderGroup.is_proforma_finalized}
                          className="font-mono text-xs font-bold bg-background disabled:opacity-85 h-9"
                        />
                      </div>
                    </div>

                    {/* Locked Message */}
                    {selectedOrderGroup.is_proforma_finalized && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        <span>Proforma invoice is finalized. Stage % is locked.</span>
                      </div>
                    )}

                    {/* Calculated Proforma Due Preview */}
                    {proformaPercent > 0 && selectedOrderGroup && (
                      <div className="space-y-1.5 pt-2 border-t border-emerald-500/20 text-xs font-mono">
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Proforma Stage Subtotal:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-355">
                            {formatCurrency((selectedOrderGroup.total_amount * proformaPercent) / 100)}
                          </span>
                        </div>
                        {isPph21 && (
                          <div className="flex justify-between items-center text-red-650 dark:text-red-400 font-semibold">
                            <span>WHT PPh 21 (2% Deduction):</span>
                            <span>
                              -{formatCurrency(((selectedOrderGroup.total_amount * proformaPercent) / 100) * 0.02)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1 border-t border-dashed border-emerald-500/15">
                          <span className="text-emerald-800 dark:text-emerald-300 font-bold">Proforma Amount Due:</span>
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                            {formatCurrency(
                              isPph21
                                ? ((selectedOrderGroup.total_amount * proformaPercent) / 100) * 0.98
                                : (selectedOrderGroup.total_amount * proformaPercent) / 100
                            )}
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
                      className="w-full gap-2 font-bold py-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-sm disabled:opacity-50"
                    >
                      <FileText className="h-4 w-4" /> {selectedOrderGroup.is_proforma_finalized ? "View" : "Generate"} Proforma Invoice ({proformaPercent || 0}%)
                    </Button>

                    <Button
                      type="button"
                      disabled={(!selectedOrderGroup?.is_proforma_finalized || selectedOrderGroup?.status !== "COMPLETED") && !selectedOrderGroup?.is_final_invoice_finalized}
                      onClick={() => setIsFinalInvoicePreviewOpen(true)}
                      className="w-full gap-2 font-bold py-5 bg-blue-600 hover:bg-blue-700 text-white shadow-md text-sm disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      <FileText className="h-4 w-4" /> {selectedOrderGroup?.is_final_invoice_finalized ? "View" : "Generate"} Final Invoice
                    </Button>
                    {(!selectedOrderGroup?.is_proforma_finalized || selectedOrderGroup?.status !== "COMPLETED") && !selectedOrderGroup?.is_final_invoice_finalized && (
                      <p className="text-[10px] text-muted-foreground text-center italic mt-0.5">
                        Requires finalized proforma invoice & completed order lifecycle status.
                      </p>
                    )}

                  </div>

                 </div>

                {/* Right Column (Line Items & Totals) - 7 cols */}
                <div className="lg:col-span-7 space-y-4">

                  {/* Service Items Table */}
                  <div className="border rounded-xl overflow-hidden text-xs shadow-xs bg-background">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/60 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                          <th className="p-3">Service Package</th>
                          <th className="p-3 text-right w-32">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(selectedOrderGroup.items || []).map((item: any, idx: number) => {
                          const itemKey = `order-completed-${selectedOrderGroup.order_number}-${idx}`;
                          const isExpanded = !!expandedItems[itemKey];
                          return (
                            <tr key={item.id || idx} className="hover:bg-muted/20 transition-colors">
                              <td className="p-3 align-top">
                                <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20 shadow-none space-y-1.5 transition-all duration-200 max-w-xl">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-bold text-foreground text-xs leading-normal break-words">
                                      {item.job_title}
                                    </span>
                                    {item.job_id && (
                                      <Badge variant="outline" className="text-[9px] font-mono py-0 px-1.5 bg-primary/5 text-primary border-primary/20 shrink-0">
                                        {item.job_id}
                                      </Badge>
                                    )}
                                    {item.pricing_tier && (
                                      <Badge variant="secondary" className="text-[9px] py-0 px-1.5 font-medium capitalize shrink-0">
                                        {item.pricing_tier.toLowerCase().replace('_', ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                  {(() => {
                                    const matchedService = services.find((s) => s.id === item.service_id);
                                    const desc = item.description || matchedService?.description;
                                    if (!desc) return null;
                                    return (
                                      <div className="space-y-1">
                                        {isExpanded && (
                                          <div className="mt-1 border-l-2 border-zinc-300 dark:border-zinc-700 pl-2 py-0.5">
                                            {formatInvoiceDescription(desc, true)}
                                          </div>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => toggleItemExpansion(itemKey)}
                                          className="text-[9.5px] text-primary hover:text-primary/80 font-bold hover:underline block"
                                        >
                                          {isExpanded ? "Hide details" : "Show details"}
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-foreground align-top pt-5">
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

                  {/* Grand Total Bar */}
                  <div className="flex justify-between items-center p-4 rounded-xl border border-primary/30 bg-primary/5">
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" /> Total Agreed Contract Value:
                    </span>
                    <span className="text-xl font-bold font-mono text-primary">{formatCurrency(selectedOrderGroup.total_amount)}</span>
                  </div>

                </div>

              </div>

            </div> 
            {/* End of Scrollable Content Body */}

          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* ORDER CHAT SLIDING PANEL */}
      <AnimatePresence>
        {isChatOpen && selectedOrderGroup && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/60 flex items-center justify-between shrink-0 bg-muted/20">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" /> Order Chat
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  Order #{selectedOrderGroup.order_number} ({selectedOrderGroup.company_name})
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              {loadingProgress ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Loading progress chat history...</span>
                </div>
              ) : progressUpdates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground/60 space-y-2">
                  <MessageSquare className="h-10 w-10 opacity-30" />
                  <p className="text-xs italic">No messages or progress logs posted yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {progressUpdates.map((upd) => (
                    <div
                      key={upd.id}
                      className="p-3.5 rounded-2xl bg-card border border-border/50 text-xs space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-xs">{upd.sender_name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(upd.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-xs">
                        {renderMessageContent(upd.message)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Input Area */}
            <div className="p-4 border-t border-border/60 bg-background shrink-0">
              <form onSubmit={handlePostProgress} className="space-y-3">
                <div className="relative">
                  {showSuggestions && filteredEmployees.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 z-50 w-full max-w-[280px] bg-background border border-border rounded-xl shadow-xl max-h-40 overflow-y-auto divide-y divide-border/40">
                      {filteredEmployees.map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          type="button"
                          onClick={() => selectSuggestion(item)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors"
                        >
                          {item.type === "team" ? (
                            <div 
                              className="h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border"
                              style={{ 
                                backgroundColor: `${item.color || "#10b981"}15`,
                                color: item.color || "#10b981",
                                borderColor: `${item.color || "#10b981"}40`
                              }}
                            >
                              <Users className="h-3 w-3" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary shrink-0 border border-primary/20">
                              {item.first_name?.[0] || ""}{item.last_name?.[0] || ""}
                            </div>
                          )}
                          <div className="truncate">
                            <span className="font-semibold text-foreground">
                              {item.type === "team" ? item.name : `${item.first_name} ${item.last_name}`}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {item.type === "team" ? `${item.code} • Work Team` : (item.department?.name || "Finance")}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    id="chat-textarea"
                    value={newProgressMessage}
                    onChange={(e) => handleTextChange(e.target.value, e.target.selectionStart)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && showSuggestions && filteredEmployees.length > 0) {
                        e.preventDefault();
                        selectSuggestion(filteredEmployees[0]);
                      }
                    }}
                    rows={3}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    placeholder="Write a progress update or tag team members using @..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChatOpen(false)}
                    className="font-semibold text-xs h-9 px-4"
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={postingProgress}
                    className="font-semibold text-xs gap-1.5 h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {postingProgress ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Send Message
                  </Button>
                </div>
              </form>
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
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm p-4 sm:p-6 flex flex-col items-center justify-between overflow-hidden"
          >
            <div className="max-w-7xl w-full h-full flex flex-col justify-between space-y-4">

              {/* Top Navigation & Action Header */}
              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900 text-white shadow-lg print:hidden w-full shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsProformaPreviewOpen(false)}
                    className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800 font-semibold h-8 text-xs"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Order Summary
                  </Button>
                  <div className="h-4 w-px bg-slate-700 hidden sm:block" />
                  <span className="font-bold text-xs sm:text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" /> Proforma Invoice ({proformaPercent}%)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {selectedOrderGroup.is_proforma_finalized ? (
                    <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 gap-1.5 px-3 py-1.5 text-xs font-bold font-mono">
                      <Lock className="h-3.5 w-3.5" /> Finalized & Saved
                    </Badge>
                  ) : (
                    <Button
                      onClick={handleFinalizeInvoice}
                      disabled={finalizingInvoice}
                      size="sm"
                      className="gap-2 font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm text-xs h-8 px-4"
                    >
                      {finalizingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Finalize Invoice
                    </Button>
                  )}
                  {selectedOrderGroup.is_proforma_finalized && (
                    <Button
                      onClick={() => handleSendInvoiceEmail('proforma')}
                      disabled={sendingEmail}
                      size="sm"
                      className="gap-2 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs h-8 px-4"
                    >
                      {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      Email Proforma
                    </Button>
                  )}
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    size="sm"
                    className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs h-8 px-4"
                  >
                    {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download PDF File
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrintInPage}
                    size="sm"
                    className="gap-2 font-bold bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs h-8 px-4"
                  >
                    <Printer className="h-4 w-4" /> Print Document
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsProformaPreviewOpen(false)}
                    className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-full h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Container for the Invoice Card */}
              <div className="flex-1 w-full overflow-y-auto pr-1">
                <div className="p-6 sm:p-8 bg-white text-slate-900 print-area w-full min-h-full flex flex-col justify-between" id="proforma-invoice-doc">

                  <div className="space-y-3.5 w-full">

                    {/* Header Section with Official MCS Logo & Address */}
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
                        <div className="inline-block px-3 py-1 bg-slate-900 text-white font-black font-mono text-[11px] rounded uppercase tracking-wider mb-1">
                          PROFORMA INVOICE
                        </div>
                        <h3 className="font-mono text-lg font-black text-slate-900">
                          PI-{selectedOrderGroup.order_number}-{proformaPercent}
                        </h3>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                          Issue Date: <span className="font-mono text-slate-900 font-bold">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </p>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Valid Until: <span className="font-mono text-slate-900 font-bold">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </p>
                      </div>
                    </div>

                    {/* Billed To & Contract Details */}
                    <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">BILLED TO (CLIENT ENTITY)</span>
                        <h4 className="text-base font-bold text-slate-900">{selectedOrderGroup.company_name || "Client Entity"}</h4>
                        <p className="text-slate-600 font-medium mt-0.5">
                          Attention: <span className="font-semibold text-slate-800">{selectedOrderGroup.client_name || "Key Representative"}</span>
                        </p>
                        <p className="text-slate-500 text-[11px]">Reference Contract #: <span className="font-mono font-bold text-slate-800">{selectedOrderGroup.order_number}</span></p>
                      </div>

                      <div className="text-right border-l border-slate-200 pl-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">PROFORMA PAYMENT TERMS</span>
                        <p className="font-bold text-sm text-emerald-700">{proformaPercent}% Down Payment / Milestone Billing</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Status: <span className="font-bold text-amber-600">PROFORMA ISSUED</span></p>
                      </div>
                    </div>

                    {/* Services Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs !mt-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <th className="p-2 w-12 text-center">#</th>
                            <th className="p-2 w-28">Pricing Tier</th>
                            <th className="p-2">Service Line Item</th>
                            <th className="p-2 text-right">Contract Price</th>
                            <th className="p-2 text-right text-emerald-700 font-extrabold">Proforma Amount ({proformaPercent}%)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {(selectedOrderGroup.items || []).map((item: any, idx: number) => {
                            const lineFullPrice = item.unit_price || 0;
                            const lineProformaPrice = (lineFullPrice * proformaPercent) / 100;
                            return (
                              <tr key={item.id || idx} className="hover:bg-slate-50/60">
                                <td className="p-2 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                                <td className="p-2 font-mono font-semibold text-slate-600 w-28">{item.pricing_tier}</td>
                                <td className="p-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm leading-tight">{item.job_title}</span>
                                    {item.job_id && (
                                      <span className="text-[9px] font-mono font-bold text-slate-550 border border-slate-200 bg-slate-50/50 px-1.5 py-0.5 rounded shrink-0">
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
                                <td className="p-2 text-right font-mono font-bold text-slate-700">{formatCurrency(lineFullPrice)}</td>
                                <td className="p-2 text-right font-mono font-bold text-emerald-700 bg-emerald-50/50">
                                  {formatCurrency(lineProformaPrice)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Calculation Summary & Bank Wire Details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-2 gap-6">

                      {/* Bank Wire Details */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 max-w-sm">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Official Bank Transfer Account
                        </span>
                        <p className="text-slate-700 font-semibold">Bank Name: <span className="font-bold text-slate-900">Bank Central Asia (BCA)</span></p>
                        <p className="text-slate-700 font-semibold">Account Name: <span className="font-bold text-slate-900">PT Mandiri Cipta Solusi</span></p>
                        <p className="text-slate-700 font-semibold">Account Number: <span className="font-mono font-bold text-slate-900">884-0192-3841</span></p>
                      </div>

                      {/* Total Calculations */}
                      <div className="w-full sm:w-96 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                          <span>Total Contract Value:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(selectedOrderGroup.total_amount)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                          <span>Proforma Percentage:</span>
                          <span className="font-bold text-slate-900">{proformaPercent}%</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                          <span>Proforma Subtotal:</span>
                          <span className="font-bold text-slate-900">{formatCurrency((selectedOrderGroup.total_amount * proformaPercent) / 100)}</span>
                        </div>
                        {isPph21 && (
                          <div className="flex justify-between py-1 border-b border-slate-200 text-red-600 font-semibold">
                            <span>WHT PPh 21 (2% Deduction):</span>
                            <span>-{formatCurrency(((selectedOrderGroup.total_amount * proformaPercent) / 100) * 0.02)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2.5 px-3 rounded-lg bg-emerald-600 text-white text-sm font-bold shadow-sm">
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
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs mt-auto w-full">
                    <div className="text-slate-500 text-[11px] leading-tight max-w-sm">
                      <p className="font-bold text-slate-700">Notice:</p>
                      <p>This Proforma Invoice is issued for milestone payment processing.</p>
                      <p>Tax invoice (Faktur Pajak) will be provided upon full payment receipt.</p>
                    </div>
                    <div className="text-center w-56 space-y-6">
                      <p className="text-slate-500 font-semibold text-[11px]">Authorized Signature</p>
                      <div className="border-b border-slate-400 pb-1">
                        <p className="font-bold text-slate-900 text-sm">PT Mandiri Cipta Solusi</p>
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
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm p-4 sm:p-6 flex flex-col items-center justify-between overflow-hidden"
          >
            <div className="max-w-7xl w-full h-full flex flex-col justify-between space-y-4">

              {/* Top Navigation & Action Header */}
              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900 text-white shadow-lg print:hidden w-full shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFinalInvoicePreviewOpen(false)}
                    className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800 font-semibold h-8 text-xs"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Order Summary
                  </Button>
                  <div className="h-4 w-px bg-slate-700 hidden sm:block" />
                  <span className="font-bold text-xs sm:text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-400" /> Final Invoice
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {selectedOrderGroup.is_final_invoice_finalized ? (
                    <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 gap-1.5 px-3 py-1.5 text-xs font-bold font-mono">
                      <Lock className="h-3.5 w-3.5" /> Finalized & Saved
                    </Badge>
                  ) : (
                    <Button
                      onClick={handleFinalizeFinalInvoice}
                      disabled={finalizingFinalInvoice}
                      size="sm"
                      className="gap-2 font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm text-xs h-8 px-4"
                    >
                      {finalizingFinalInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Finalize Invoice
                    </Button>
                  )}
                  {selectedOrderGroup.is_final_invoice_finalized && (
                    <Button
                      onClick={() => handleSendInvoiceEmail('final')}
                      disabled={sendingEmail}
                      size="sm"
                      className="gap-2 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs h-8 px-4"
                    >
                      {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      Email Final
                    </Button>
                  )}
                  <Button
                    onClick={handleDownloadFinalPDF}
                    disabled={downloadingFinalPdf}
                    size="sm"
                    className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs h-8 px-4"
                  >
                    {downloadingFinalPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download PDF File
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrintFinalInPage}
                    size="sm"
                    className="gap-2 font-bold bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs h-8 px-4"
                  >
                    <Printer className="h-4 w-4" /> Print Document
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFinalInvoicePreviewOpen(false)}
                    className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-full h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Container for the Invoice Card */}
              <div className="flex-1 w-full overflow-y-auto pr-1">
                <div className="p-6 sm:p-8 bg-white text-slate-900 print-area w-full min-h-full flex flex-col justify-between" id="final-invoice-doc">

                  <div className="space-y-3.5 w-full">

                    {/* Header Section with Official MCS Logo & Address */}
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
                        <div className="inline-block px-3 py-1 bg-slate-900 text-white font-black font-mono text-[11px] rounded uppercase tracking-wider mb-1">
                          FINAL TAX INVOICE
                        </div>
                        <h3 className="font-mono text-lg font-black text-slate-900">
                          INV-{selectedOrderGroup.order_number}
                        </h3>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                          Issue Date: <span className="font-mono text-slate-900 font-bold">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </p>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Due Date: <span className="font-mono text-slate-900 font-bold">{new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </p>
                      </div>
                    </div>

                    {/* Billed To & Contract Details */}
                    <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">BILLED TO (CLIENT ENTITY)</span>
                        <h4 className="text-base font-bold text-slate-900">{selectedOrderGroup.company_name || "Client Entity"}</h4>
                        <p className="text-slate-600 font-medium mt-0.5">
                          Attention: <span className="font-semibold text-slate-800">{selectedOrderGroup.client_name || "Key Representative"}</span>
                        </p>
                        <p className="text-slate-500 text-[11px]">Reference Contract #: <span className="font-mono font-bold text-slate-800">{selectedOrderGroup.order_number}</span></p>
                      </div>

                      <div className="text-right border-l border-slate-200 pl-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">PAYMENT TERMS</span>
                        <p className="font-bold text-sm text-blue-700">Final Settlement Invoice</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Status: <span className="font-bold text-emerald-600">DELIVERED & COMPLETED</span></p>
                      </div>
                    </div>

                    {/* Services Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs !mt-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <th className="p-2.5 w-12 text-center">#</th>
                            <th className="p-2.5 w-28">Pricing Tier</th>
                            <th className="p-2.5">Service Line Item</th>
                            <th className="p-2.5 text-right">Contract Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {(selectedOrderGroup.items || []).map((item: any, idx: number) => {
                            const lineFullPrice = item.unit_price || 0;
                            return (
                              <tr key={item.id || idx} className="hover:bg-slate-50/60">
                                <td className="p-2.5 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                                <td className="p-2.5 font-mono font-semibold text-slate-600 w-28">{item.pricing_tier}</td>
                                <td className="p-2.5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm leading-tight">{item.job_title}</span>
                                    {item.job_id && (
                                      <span className="text-[9px] font-mono font-bold text-slate-550 border border-slate-200 bg-slate-50/50 px-1.5 py-0.5 rounded shrink-0">
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
                                <td className="p-2.5 text-right font-mono font-bold text-slate-700">{formatCurrency(lineFullPrice)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Calculation Summary & Bank Wire Details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-2 gap-6">

                      {/* Bank Wire Details */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 max-w-sm">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Official Bank Transfer Account
                        </span>
                        <p className="text-slate-700 font-semibold">Bank Name: <span className="font-bold text-slate-900">Bank Central Asia (BCA)</span></p>
                        <p className="text-slate-700 font-semibold">Account Name: <span className="font-bold text-slate-900">PT Mandiri Cipta Solusi</span></p>
                        <p className="text-slate-700 font-semibold">Account Number: <span className="font-mono font-bold text-slate-900">884-0192-3841</span></p>
                      </div>

                      {/* Total Calculations */}
                      <div className="w-full sm:w-96 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                          <span>Total Contract Value:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(selectedOrderGroup.total_amount)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200 text-slate-600">
                          <span>Less: Proforma Paid ({selectedOrderGroup.proforma_stage_percent || proformaPercent}%):</span>
                          <span className="font-bold text-amber-600">-{formatCurrency((selectedOrderGroup.total_amount * (selectedOrderGroup.proforma_stage_percent || proformaPercent)) / 100)}</span>
                        </div>
                        <div className="flex justify-between py-2.5 px-3 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-sm">
                          <span>Total Amount Due:</span>
                          <span>{formatCurrency(selectedOrderGroup.total_amount - ((selectedOrderGroup.total_amount * (selectedOrderGroup.proforma_stage_percent || proformaPercent)) / 100))}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Spacer to push signature down and ensure a clear gap */}
                  <div className="h-12 sm:h-16 shrink-0" />

                  {/* Signature Box at bottom */}
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs mt-auto w-full">
                    <div className="text-slate-500 text-[11px] leading-tight max-w-sm">
                      <p className="font-bold text-slate-700">Notice:</p>
                      <p>This Final Invoice is issued for completed service deliverables.</p>
                      <p>Tax invoice (Faktur Pajak) will be provided upon full payment receipt.</p>
                    </div>
                    <div className="text-center w-56 space-y-6">
                      <p className="text-slate-500 font-semibold text-[11px]">Authorized Signature</p>
                      <div className="border-b border-slate-400 pb-1">
                        <p className="font-bold text-slate-900 text-sm">PT Mandiri Cipta Solusi</p>
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
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={saving} onClick={handleDeleteSubmit}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EMAIL CONFIRMATION DIALOG */}
      <Dialog open={isEmailConfirmOpen} onOpenChange={setIsEmailConfirmOpen}>
        <DialogContent className="max-w-md p-6 bg-background border border-border text-foreground rounded-xl shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
              <Mail className="h-5 w-5 text-primary" /> Confirm Email Dispatch
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1 leading-relaxed">
              Please confirm the email address to be sent is:
              <span className="block mt-2 p-3 bg-muted/60 border border-border rounded-lg font-mono font-bold text-foreground text-center break-all select-all shadow-inner">
                {emailConfirmAddress}
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 border-t border-border/40 gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEmailConfirmOpen(false);
                setEmailConfirmType(null);
                setEmailConfirmAddress("");
              }}
              className="text-xs font-semibold h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={executeSendInvoiceEmail}
              disabled={sendingEmail}
              className="text-xs font-bold h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-1.5"
            >
              {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send Invoice Email
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
