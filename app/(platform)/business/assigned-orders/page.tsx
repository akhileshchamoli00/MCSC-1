"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Building,
  Search,
  Loader2,
  ShoppingCart,
  UserCheck,
  Eye,
  Receipt,
  CheckCircle2,
  Clock,
  Users,
  MessageSquare,
  Lock,
  AlertCircle,
  X,
  FileText,
  Folder,
  FolderOpen,
  FolderCheck,
  FolderClock,
  FolderKanban,
  ChevronRight,
  PauseCircle,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DualOrderChatDialog } from "@/components/dual-order-chat-dialog";
import { useUser } from "@/contexts/user-context";
import { cn } from "@/lib/utils";

export default function AssignedOrdersPage() {
  const router = useRouter();
  const { profile, isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_my", "view");

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ASSIGNED" | "IN_PROGRESS" | "REVIEW_ORDER" | "ON_HOLD" | "COMPLETED">("IN_PROGRESS");
  const [currentPage, setCurrentPage] = useState(1);

  // Restore active tab from URL query parameter or sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    const savedTab = sessionStorage.getItem("assigned_orders_active_tab");
    const targetTab = tabParam || savedTab;
    if (targetTab && ["ASSIGNED", "IN_PROGRESS", "REVIEW_ORDER", "ON_HOLD", "COMPLETED"].includes(targetTab.toUpperCase())) {
      setActiveTab(targetTab.toUpperCase() as any);
    }
  }, []);

  // Save active tab in sessionStorage whenever it changes and keep URL param in sync
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("assigned_orders_active_tab", activeTab);
      const url = new URL(window.location.href);
      if (url.searchParams.get("tab") !== activeTab) {
        url.searchParams.set("tab", activeTab);
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, [activeTab]);

  // Authorization Check & Redirect
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to access Assigned Orders.");
      router.replace("/business/dashboard");
    }
  }, [userLoading, canView, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [newProgressMessage, setNewProgressMessage] = useState("");
  const [postingProgress, setPostingProgress] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItemExpansion = (key: string) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Real-time Chat & Tagging States
  const [employees, setEmployees] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [viewingTeam, setViewingTeam] = useState<any | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [suggestionSearch, setSuggestionSearch] = useState("");

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
    const textarea = (document.getElementById("chat-textarea") || document.getElementById("chat-textarea-scope")) as HTMLTextAreaElement;
    if (!textarea) return;

    const val = newProgressMessage;
    const selectionStart = textarea.selectionStart;
    const textBeforeCursor = val.slice(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      const mentionText = item.type === "team" ? `@${item.name}` : `@${item.first_name} ${item.last_name}`;
      const before = val.slice(0, lastAtIdx);
      const after = val.slice(selectionStart);

      const newVal = `${before}${mentionText} ${after}`;
      setNewProgressMessage(newVal);
      setShowSuggestions(false);

      // Put focus back and position cursor after inserted mention + trailing space
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = lastAtIdx + mentionText.length + 1;
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

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingConfirmGroup, setPendingConfirmGroup] = useState<any>(null);
  const [pendingConfirmStatus, setPendingConfirmStatus] = useState<string>("");
  const [pendingDocCount, setPendingDocCount] = useState<number | null>(null);
  const [loadingDocCount, setLoadingDocCount] = useState<boolean>(false);

  // ON HOLD Modal States
  const [isOnHoldDialogOpen, setIsOnHoldDialogOpen] = useState(false);
  const [pendingHoldGroup, setPendingHoldGroup] = useState<any>(null);
  const [holdReason, setHoldReason] = useState("");
  const [holdChannel, setHoldChannel] = useState<"CLIENT" | "INTERNAL">("CLIENT");
  const [submittingHold, setSubmittingHold] = useState(false);

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
    if (!newProgressMessage.trim() || !selectedGroup) return;
    setPostingProgress(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedGroup.order_number}/progress`, {
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

  const fetchAssignedOrders = async () => {
    if (userLoading || !canView) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/my-assigned`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading assigned orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetaData = async () => {
    if (userLoading || !canView) return;
    try {
      const [empRes, teamRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, {
          credentials: "include",
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, {
          credentials: "include",
        })
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (teamRes.ok) setTeams(await teamRes.json());
    } catch (err) {
      console.error("Error fetching chat metadata:", err);
    }
  };

  useEffect(() => {
    if (!userLoading && canView) {
      fetchAssignedOrders();
      fetchMetaData();
    }
  }, [userLoading, canView]);

  // Group raw rows by order_number (Memoized to prevent unnecessary re-renders)
  const groupedOrders = useMemo(() => {
    const groupedOrdersMap = new Map<string, any>();
    (Array.isArray(orders) ? orders : []).forEach((ord) => {
      const key = ord.order_number || `SINGLE-${ord.id}`;
      if (!groupedOrdersMap.has(key)) {
        groupedOrdersMap.set(key, {
          order_number: ord.order_number,
          client_name: ord.client_name,
          company_name: ord.company_name,
          company_id: ord.company_id,
          company: ord.company,
          created_at: ord.created_at,
          status: ord.status || "CONFIRMED",
          payment_status: ord.payment_status || "UNPAID",
          consultants: ord.consultants ? [...ord.consultants] : [],
          consultant_ids: ord.consultant_ids ? [...ord.consultant_ids] : [],
          reviewer_id: ord.reviewer_id || null,
          reviewer: ord.reviewer || null,
          notes: ord.notes || "",
          document_count: ord.document_count || 0,
          items: []
        });
      }
      const group = groupedOrdersMap.get(key);
      group.items.push(ord);
      if (typeof ord.document_count === "number" && ord.document_count > (group.document_count || 0)) {
        group.document_count = ord.document_count;
      }

      if (ord.reviewer_id && !group.reviewer_id) {
        group.reviewer_id = ord.reviewer_id;
      }
      if (ord.reviewer && !group.reviewer) {
        group.reviewer = ord.reviewer;
      }
      if (ord.consultants && ord.consultants.length > 0) {
        const existingIds = new Set(group.consultants.map((c: any) => c.id));
        ord.consultants.forEach((c: any) => {
          if (!existingIds.has(c.id)) group.consultants.push(c);
        });
      }
      if (ord.consultant_ids && Array.isArray(ord.consultant_ids)) {
        const existingCids = new Set(group.consultant_ids);
        ord.consultant_ids.forEach((cid: number) => existingCids.add(cid));
        group.consultant_ids = Array.from(existingCids);
      }
    });

    return Array.from(groupedOrdersMap.values()).map((group) => {
      // Enrich reviewer from employees list if missing
      if (group.reviewer_id && !group.reviewer && employees.length > 0) {
        const emp = employees.find((e: any) => e.id === group.reviewer_id);
        if (emp) {
          group.reviewer = {
            id: emp.id,
            name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
            job_title: emp.job_title || "Designated Reviewer"
          };
        }
      }
      // Enrich consultants from employees list if missing
      if (group.consultant_ids && group.consultant_ids.length > 0 && (!group.consultants || group.consultants.length === 0) && employees.length > 0) {
        group.consultants = group.consultant_ids.map((cid: number) => {
          const emp = employees.find((e: any) => e.id === cid);
          return emp ? {
            id: emp.id,
            name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
            job_title: emp.job_title || "Consultant"
          } : null;
        }).filter(Boolean);
      }
      return group;
    });
  }, [orders, employees]);

  const handleUpdateStatus = async (group: any, newStatus: string) => {
    if (!group || !newStatus || newStatus === group.status) return;

    const orderNum = group.order_number;
    setPendingDocCount(group.document_count ?? 0);
    setLoadingDocCount(true);

    if (newStatus === "ON_HOLD") {
      setPendingHoldGroup(group);
      setHoldReason("");
      setHoldChannel("CLIENT");
      setIsOnHoldDialogOpen(true);

      if (orderNum) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(orderNum)}/document-count`, { credentials: "include" })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && typeof data.count === "number") {
              setPendingDocCount(data.count);
            }
          })
          .catch(err => console.error("Error fetching doc count:", err))
          .finally(() => setLoadingDocCount(false));
      } else {
        setLoadingDocCount(false);
      }
      return;
    }

    setPendingConfirmGroup(group);
    setPendingConfirmStatus(newStatus);
    setIsConfirmOpen(true);

    if (orderNum) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(orderNum)}/document-count`, { credentials: "include" })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && typeof data.count === "number") {
            setPendingDocCount(data.count);
          }
        })
        .catch(err => console.error("Error fetching doc count:", err))
        .finally(() => setLoadingDocCount(false));
    } else {
      setLoadingDocCount(false);
    }
  };

  const handleConfirmOnHold = async () => {
    if (!pendingHoldGroup || !holdReason.trim()) {
      toast.error("Please provide a reason for placing this order on hold.");
      return;
    }
    setSubmittingHold(true);
    try {
      const cleanedReason = holdReason.trim();
      await Promise.all(
        pendingHoldGroup.items.map((itemRow: any) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${itemRow.id}`, {
            credentials: "include",
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              status: "ON_HOLD",
              hold_reason: cleanedReason,
              hold_channel: holdChannel
            })
          })
        )
      );

      toast.success(`Order ${pendingHoldGroup.order_number} status updated to ON HOLD`);
      setIsOnHoldDialogOpen(false);
      setPendingHoldGroup(null);
      setHoldReason("");
      fetchAssignedOrders();
      if (selectedGroup && selectedGroup.order_number === pendingHoldGroup.order_number) {
        setSelectedGroup({ ...selectedGroup, status: "ON_HOLD" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to put order on hold");
    } finally {
      setSubmittingHold(false);
    }
  };

  const executeUpdateStatus = async (group: any, newStatus: string) => {
    if (!group || !group.items) return;
    setSavingStatus(true);
    try {
      await Promise.all(
        group.items.map((itemRow: any) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${itemRow.id}`, {
            credentials: "include",
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus })
          })
        )
      );
      if (newStatus === "FINAL_DOC_READY") {
        toast.success(`Order ${group.order_number} marked as Final Docs Ready and moved to Completed Orders`);
      } else {
        toast.success(`Order ${group.order_number} status updated to ${newStatus.replace(/_/g, " ")}`);
      }
      setIsConfirmOpen(false);
      fetchAssignedOrders();
      if (selectedGroup && selectedGroup.order_number === group.order_number) {
        setSelectedGroup({ ...selectedGroup, status: newStatus });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    } finally {
      setSavingStatus(false);
      setPendingConfirmGroup(null);
      setPendingConfirmStatus("");
      setPendingDocCount(null);
    }
  };

  const ALLOWED_EXECUTION_STATUSES = [
    "CONFIRMED",
    "ORDER_ASSIGNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "REVIEW_DOCS",
    "DOCUMENTS_REVIEWED",
    "PRE_DOC_SENT_FOR_SIGNATURE",
    "PRE_DOCS_SENT",
    "FINAL_DOCUMENT_PREPARATION",
    "FINAL_DOC_READY",
    "WAITING_FOR_FINAL_PAYMENT",
    "FINAL_PAYMENT_COMPLETED",
    "SOFT_COPY_DELIVERED",
    "HARD_COPY_DELIVERED",
    "COMPLETED"
  ];

  // 1. Newly Assigned Category (Initial allocated queue before work starts)
  const ASSIGNED_STATUSES = [
    "CONFIRMED",
    "ORDER_ASSIGNED"
  ];

  // 2. In-Progress Category (Active execution, review, document prep & payments)
  const IN_PROGRESS_STATUSES = [
    "IN_PROGRESS",
    "REVIEW_DOCS",
    "DOCUMENTS_REVIEWED",
    "PRE_DOC_SENT_FOR_SIGNATURE",
    "PRE_DOCS_SENT",
    "FINAL_DOCUMENT_PREPARATION",
    "WAITING_FOR_FINAL_PAYMENT",
    "FINAL_PAYMENT_COMPLETED"
  ];

  // 3. On-Hold Category (Paused orders with documented reasons)
  const ON_HOLD_STATUSES = [
    "ON_HOLD"
  ];

  // 4. Completed Category (Concluded, Final Docs Ready, delivered soft/hard copies)
  const COMPLETED_STATUSES = [
    "FINAL_DOC_READY",
    "COMPLETED",
    "SOFT_COPY_DELIVERED",
    "HARD_COPY_DELIVERED"
  ];

  const CONSULTANT_EDITABLE_STATUSES = [
    "ORDER_ASSIGNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "REVIEW_DOCS",
    "DOCUMENTS_REVIEWED",
    "PRE_DOC_SENT_FOR_SIGNATURE",
    "PRE_DOCS_SENT",
    "FINAL_DOCUMENT_PREPARATION",
    "FINAL_DOC_READY"
  ];

  const myEmpId = profile?.id || null;

  // Checks if user is designated reviewer on the order
  const checkIsReviewer = (ord: any) => {
    if (!myEmpId && isAdmin) {
      return Boolean(ord.reviewer_id || ord.reviewer);
    }
    return Boolean(
      myEmpId && (ord.reviewer_id === myEmpId || ord.reviewer?.id === myEmpId)
    );
  };

  // Checks if user is an allocated executing consultant on the order
  const checkIsExecuting = (ord: any) => {
    if (!myEmpId && isAdmin) {
      return true;
    }
    return Boolean(
      myEmpId && (
        (ord.consultant_ids || []).includes(myEmpId) ||
        (ord.consultants || []).some((c: any) => c.id === myEmpId)
      )
    );
  };

  // True if user is ONLY a reviewer on this order (not the executing consultant)
  const checkIsReviewOnly = (ord: any) => {
    if (!myEmpId && isAdmin) {
      return false;
    }
    return checkIsReviewer(ord) && !checkIsExecuting(ord);
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

  const filteredOrders = useMemo(() => {
    return groupedOrders
      .filter((ord) => {
        const status = (ord.status || "").toUpperCase();
        if (!ALLOWED_EXECUTION_STATUSES.includes(status)) return false;

        const isReviewOnly = checkIsReviewOnly(ord);
        const isExecuting = checkIsExecuting(ord);
        const isReviewer = checkIsReviewer(ord);

        // 1. Newly Assigned Orders: Followed by allocated consultant / admin
        if (activeTab === "ASSIGNED") {
          if (isReviewOnly || !isExecuting || !ASSIGNED_STATUSES.includes(status)) return false;
        }
        // 2. In-Progress Orders: Followed by allocated consultant / admin through execution lifecycle
        if (activeTab === "IN_PROGRESS") {
          if (isReviewOnly || !isExecuting || !IN_PROGRESS_STATUSES.includes(status)) return false;
        }
        // 3. Review Order: Stays in Review Order card throughout entire active lifecycle until completed or cancelled
        if (activeTab === "REVIEW_ORDER") {
          if (!isReviewer || COMPLETED_STATUSES.includes(status) || status === "CANCELLED") return false;
        }
        // 4. On-Hold Orders: Followed by allocated consultant / admin
        if (activeTab === "ON_HOLD") {
          if (isReviewOnly || !isExecuting || !ON_HOLD_STATUSES.includes(status)) return false;
        }
        // 5. Completed Orders: Concluded archive for executing consultants / admins
        if (activeTab === "COMPLETED") {
          if (isReviewOnly || !isExecuting || !COMPLETED_STATUSES.includes(status)) return false;
        }

        const term = searchTerm.toLowerCase();
        const orderNum = (ord.order_number || "").toLowerCase();
        const clientName = (ord.client_name || "").toLowerCase();
        const compName = (ord.company_name || "").toLowerCase();
        const itemsStr = (ord.items || []).map((i: any) => `${i.job_title} ${i.job_id}`).join(" ").toLowerCase();
        return orderNum.includes(term) || clientName.includes(term) || compName.includes(term) || itemsStr.includes(term);
      })
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
  }, [groupedOrders, activeTab, searchTerm, myEmpId, isAdmin]);

  const totalPages = Math.ceil(filteredOrders.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const [highlightedOrderNum, setHighlightedOrderNum] = useState<string | null>(null);

  const openOrderDirectly = (orderNum: string, openChat: boolean = true) => {
    if (!orderNum || orders.length === 0) return;

    // Find in grouped orders
    const matched = groupedOrders.find(g => g.order_number?.toUpperCase() === orderNum.toUpperCase());
    if (!matched) return;

    const st = (matched.status || "").toUpperCase();
    const isRevOnly = checkIsReviewOnly(matched);
    const isRev = checkIsReviewer(matched);

    let targetTab: "ASSIGNED" | "IN_PROGRESS" | "REVIEW_ORDER" | "ON_HOLD" | "COMPLETED" = "ASSIGNED";
    if (isRevOnly) {
      if (!COMPLETED_STATUSES.includes(st) && st !== "CANCELLED") {
        targetTab = "REVIEW_ORDER";
      } else {
        targetTab = "COMPLETED";
      }
    } else {
      if (ON_HOLD_STATUSES.includes(st)) {
        targetTab = "ON_HOLD";
      } else if (COMPLETED_STATUSES.includes(st)) {
        targetTab = "COMPLETED";
      } else if (IN_PROGRESS_STATUSES.includes(st)) {
        targetTab = "IN_PROGRESS";
      } else {
        targetTab = "ASSIGNED";
      }
    }

    setActiveTab(targetTab);
    setSearchTerm("");

    // Calculate index within targetTab
    const tabOrders = groupedOrders.filter(ord => {
      const ost = (ord.status || "").toUpperCase();
      if (!ALLOWED_EXECUTION_STATUSES.includes(ost)) return false;
      const oRevOnly = checkIsReviewOnly(ord);
      const oExecuting = checkIsExecuting(ord);
      const oReviewer = checkIsReviewer(ord);

      if (targetTab === "ASSIGNED" && (oRevOnly || !oExecuting || !ASSIGNED_STATUSES.includes(ost))) return false;
      if (targetTab === "IN_PROGRESS" && (oRevOnly || !oExecuting || !IN_PROGRESS_STATUSES.includes(ost))) return false;
      if (targetTab === "REVIEW_ORDER" && (!oReviewer || COMPLETED_STATUSES.includes(ost) || ost === "CANCELLED")) return false;
      if (targetTab === "ON_HOLD" && (oRevOnly || !oExecuting || !ON_HOLD_STATUSES.includes(ost))) return false;
      if (targetTab === "COMPLETED" && (oRevOnly || !oExecuting || !COMPLETED_STATUSES.includes(ost))) return false;
      return true;
    });

    const orderIdx = tabOrders.findIndex(o => o.order_number?.toUpperCase() === orderNum.toUpperCase());
    if (orderIdx !== -1) {
      const targetPage = Math.floor(orderIdx / 10) + 1;
      setCurrentPage(targetPage);
    }

    setSelectedGroup(matched);
    if (openChat) {
      setIsChatOpen(true);
      fetchProgressUpdates(matched.order_number);
    }

    setHighlightedOrderNum(matched.order_number);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("assigned_orders_highlighted_order", matched.order_number);
    }
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
  };

  const hasProcessedUrlOrder = useRef(false);

  // URL Query Params initial handler
  useEffect(() => {
    if (orders.length === 0 || hasProcessedUrlOrder.current) return;

    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const orderNum = params.get("order") || sessionStorage.getItem("assigned_orders_highlighted_order");
    const openChat = params.get("chat");

    if (orderNum) {
      hasProcessedUrlOrder.current = true;
      openOrderDirectly(orderNum, openChat === "true");
      const url = new URL(window.location.href);
      if (url.searchParams.has("order") || url.searchParams.has("chat")) {
        url.searchParams.delete("order");
        url.searchParams.delete("chat");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }, [orders, groupedOrders]);

  // Notification Event Listener
  useEffect(() => {
    const handleCustomOpen = (e: any) => {
      if (e.detail?.orderNumber) {
        openOrderDirectly(e.detail.orderNumber, e.detail.chat ?? true);
      }
    };
    window.addEventListener("open-order-chat", handleCustomOpen);

    return () => {
      window.removeEventListener("open-order-chat", handleCustomOpen);
    };
  }, [orders, groupedOrders]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold";
      case "CONFIRMED": return "bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold";
      case "DRAFT": return "bg-zinc-500/10 dark:bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 font-bold";
      case "CANCELLED": return "bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold";
      case "PROFORMA_GENERATED": return "bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 font-bold";
      case "WAITING_ON_CLIENT": return "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold";
      case "ORDER_ASSIGNED": return "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold";
      case "IN_PROGRESS": return "bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20 font-bold";
      case "ON_HOLD": return "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold";
      case "REVIEW_DOCS": return "bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20 font-bold";
      case "DOCUMENTS_REVIEWED": return "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold";
      case "PRE_DOC_SENT_FOR_SIGNATURE": return "bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold";
      case "PRE_DOCS_SENT": return "bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold";
      case "FINAL_DOCUMENT_PREPARATION": return "bg-orange-500/10 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20 font-bold";
      case "FINAL_DOC_READY": return "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold";
      case "INVOICE_GENERATED": return "bg-pink-500/10 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/20 font-bold";
      case "WAITING_FOR_FINAL_PAYMENT": return "bg-pink-500/10 dark:bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/20 font-bold";
      case "FINAL_PAYMENT_COMPLETED": return "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold";
      case "SOFT_COPY_DELIVERED": return "bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20 font-bold";
      case "HARD_COPY_DELIVERED": return "bg-violet-500/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20 font-bold";
      default: return "bg-primary/10 text-primary border-primary/20 font-bold";
    }
  };

  // Mutually Exclusive Counts Across All Folders
  const assignedOrdersCount = groupedOrders.filter(o => {
    const st = (o.status || "").toUpperCase();
    return ASSIGNED_STATUSES.includes(st) && !checkIsReviewOnly(o) && checkIsExecuting(o);
  }).length;

  const inProgressOrdersCount = groupedOrders.filter(o => {
    const st = (o.status || "").toUpperCase();
    return IN_PROGRESS_STATUSES.includes(st) && !checkIsReviewOnly(o) && checkIsExecuting(o);
  }).length;

  const reviewOrdersCount = groupedOrders.filter(o => {
    const st = (o.status || "").toUpperCase();
    return checkIsReviewer(o) && !COMPLETED_STATUSES.includes(st) && st !== "CANCELLED";
  }).length;

  const onHoldOrdersCount = groupedOrders.filter(o => {
    const st = (o.status || "").toUpperCase();
    return ON_HOLD_STATUSES.includes(st) && !checkIsReviewOnly(o) && checkIsExecuting(o);
  }).length;

  const completedOrdersCount = groupedOrders.filter(o => {
    const st = (o.status || "").toUpperCase();
    return COMPLETED_STATUSES.includes(st) && !checkIsReviewOnly(o) && checkIsExecuting(o);
  }).length;

  const reviewPrepOrdersCount = groupedOrders.filter(o => {
    const st = (o.status || "").toUpperCase();
    return !checkIsReviewOnly(o) && checkIsExecuting(o) && ["REVIEW_DOCS", "DOCUMENTS_REVIEWED", "PRE_DOC_SENT_FOR_SIGNATURE", "PRE_DOCS_SENT", "FINAL_DOCUMENT_PREPARATION"].includes(st);
  }).length;

  const totalAllocatedCount = groupedOrders.filter(o => {
    const st = (o.status || "").toUpperCase();
    if (!ALLOWED_EXECUTION_STATUSES.includes(st) || COMPLETED_STATUSES.includes(st) || st === "CANCELLED") return false;
    if (!myEmpId && isAdmin) return true;
    return !checkIsReviewOnly(o) && checkIsExecuting(o);
  }).length;

  if (userLoading || (!canView && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Verifying allocated order permissions...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading your allocated orders...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-none pb-12">

        {/* 📁 WORKSPACE FOLDERS OVERVIEW (ABOVE SEARCH) */}
        <div className="space-y-4">
          {/* Header Title & Global Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <FolderKanban className="h-6 w-6 text-primary" />
                Allocated Orders Workspace
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a workflow folder below to inspect queue items, monitor execution progress, and access client documents.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge variant="outline" className="text-xs font-mono font-semibold px-2.5 py-1 bg-muted/40 border-border/60 flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{totalAllocatedCount} Total Orders Allocated</span>
              </Badge>
            </div>
          </div>

          {/* 5 Interactive Workflow Folders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">

            {/* FOLDER 1: NEWLY ASSIGNED */}
            <div
              onClick={() => setActiveTab("ASSIGNED")}
              className={cn(
                "group relative rounded-2xl border p-4.5 transition-all duration-200 cursor-pointer text-left select-none overflow-hidden",
                "bg-card/70 dark:bg-zinc-900/70 backdrop-blur-md",
                activeTab === "ASSIGNED"
                  ? "border-purple-500/60 ring-2 ring-purple-500/20 bg-gradient-to-br from-purple-500/10 via-purple-500/[0.03] to-card dark:to-zinc-900 shadow-md shadow-purple-500/5 -translate-y-0.5"
                  : "border-border/60 hover:border-purple-500/40 hover:bg-muted/40 hover:-translate-y-0.5 shadow-xs"
              )}
            >
              {/* Top Ear Tab Accent */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl transition-all duration-200 shrink-0",
                    activeTab === "ASSIGNED"
                      ? "bg-purple-600 text-white shadow-xs scale-105"
                      : "bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20"
                  )}>
                    {activeTab === "ASSIGNED" ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm tracking-tight text-foreground">
                        Assigned Orders
                      </h3>
                      {activeTab === "ASSIGNED" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Newly assigned orders pending execution</p>
                  </div>
                </div>
                <Badge
                  variant={activeTab === "ASSIGNED" ? "default" : "secondary"}
                  className={cn(
                    "font-mono text-xs font-bold px-2.5 py-0.5 shrink-0",
                    activeTab === "ASSIGNED" ? "bg-purple-600 text-white hover:bg-purple-600" : "bg-muted text-muted-foreground"
                  )}
                >
                  {assignedOrdersCount}
                </Badge>
              </div>

              {/* Folder Footer Metadata */}
              <div className="pt-2.5 mt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-400 font-semibold">
                  <ShoppingCart className="h-3 w-3" /> New Queue
                </span>
                <span className="font-medium text-foreground/80">{assignedOrdersCount} {assignedOrdersCount === 1 ? "order" : "orders"}</span>
              </div>
            </div>

            {/* FOLDER 2: IN PROGRESS */}
            <div
              onClick={() => setActiveTab("IN_PROGRESS")}
              className={cn(
                "group relative rounded-2xl border p-4.5 transition-all duration-200 cursor-pointer text-left select-none overflow-hidden",
                "bg-card/70 dark:bg-zinc-900/70 backdrop-blur-md",
                activeTab === "IN_PROGRESS"
                  ? "border-sky-500/60 ring-2 ring-sky-500/20 bg-gradient-to-br from-sky-500/10 via-sky-500/[0.03] to-card dark:to-zinc-900 shadow-md shadow-sky-500/5 -translate-y-0.5"
                  : "border-border/60 hover:border-sky-500/40 hover:bg-muted/40 hover:-translate-y-0.5 shadow-xs"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl transition-all duration-200 shrink-0",
                    activeTab === "IN_PROGRESS"
                      ? "bg-sky-600 text-white shadow-xs scale-105"
                      : "bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500/20"
                  )}>
                    {activeTab === "IN_PROGRESS" ? <FolderClock className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm tracking-tight text-foreground">
                        In-Progress
                      </h3>
                      {activeTab === "IN_PROGRESS" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Execution, prep & payment stages</p>
                  </div>
                </div>
                <Badge
                  variant={activeTab === "IN_PROGRESS" ? "default" : "secondary"}
                  className={cn(
                    "font-mono text-xs font-bold px-2.5 py-0.5 shrink-0",
                    activeTab === "IN_PROGRESS" ? "bg-sky-600 text-white hover:bg-sky-600" : "bg-muted text-muted-foreground"
                  )}
                >
                  {inProgressOrdersCount}
                </Badge>
              </div>

              <div className="pt-2.5 mt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-sky-600 dark:text-sky-400 font-semibold">
                  <Clock className="h-3 w-3" /> {reviewPrepOrdersCount} In Review/Prep
                </span>
                <span className="font-medium text-foreground/80">{inProgressOrdersCount} active</span>
              </div>
            </div>

            {/* FOLDER 3: REVIEW ORDER */}
            <div
              onClick={() => setActiveTab("REVIEW_ORDER")}
              className={cn(
                "group relative rounded-2xl border p-4.5 transition-all duration-200 cursor-pointer text-left select-none overflow-hidden",
                "bg-card/70 dark:bg-zinc-900/70 backdrop-blur-md",
                activeTab === "REVIEW_ORDER"
                  ? "border-indigo-500/60 ring-2 ring-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-indigo-500/[0.03] to-card dark:to-zinc-900 shadow-md shadow-indigo-500/5 -translate-y-0.5"
                  : "border-border/60 hover:border-indigo-500/40 hover:bg-muted/40 hover:-translate-y-0.5 shadow-xs"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl transition-all duration-200 shrink-0",
                    activeTab === "REVIEW_ORDER"
                      ? "bg-indigo-600 text-white shadow-xs scale-105"
                      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/20"
                  )}>
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm tracking-tight text-foreground">
                        Review Order
                      </h3>
                      {activeTab === "REVIEW_ORDER" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Continuous review throughout order lifecycle</p>
                  </div>
                </div>
                <Badge
                  variant={activeTab === "REVIEW_ORDER" ? "default" : "secondary"}
                  className={cn(
                    "font-mono text-xs font-bold px-2.5 py-0.5 shrink-0",
                    activeTab === "REVIEW_ORDER" ? "bg-indigo-600 text-white hover:bg-indigo-600" : "bg-muted text-muted-foreground"
                  )}
                >
                  {reviewOrdersCount}
                </Badge>
              </div>

              <div className="pt-2.5 mt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
                  <ShieldCheck className="h-3 w-3" /> Continuous Review
                </span>
                <span className="font-medium text-foreground/80">{reviewOrdersCount} active {reviewOrdersCount === 1 ? "review" : "reviews"}</span>
              </div>
            </div>

            {/* FOLDER 4: ON-HOLD ORDERS */}
            <div
              onClick={() => setActiveTab("ON_HOLD")}
              className={cn(
                "group relative rounded-2xl border p-4.5 transition-all duration-200 cursor-pointer text-left select-none overflow-hidden",
                "bg-card/70 dark:bg-zinc-900/70 backdrop-blur-md",
                activeTab === "ON_HOLD"
                  ? "border-amber-500/60 ring-2 ring-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/[0.03] to-card dark:to-zinc-900 shadow-md shadow-amber-500/5 -translate-y-0.5"
                  : "border-border/60 hover:border-amber-500/40 hover:bg-muted/40 hover:-translate-y-0.5 shadow-xs"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl transition-all duration-200 shrink-0",
                    activeTab === "ON_HOLD"
                      ? "bg-amber-600 text-white shadow-xs scale-105"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20"
                  )}>
                    {activeTab === "ON_HOLD" ? <PauseCircle className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm tracking-tight text-foreground">
                        On-Hold Orders
                      </h3>
                      {activeTab === "ON_HOLD" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Paused orders with documented reasons</p>
                  </div>
                </div>
                <Badge
                  variant={activeTab === "ON_HOLD" ? "default" : "secondary"}
                  className={cn(
                    "font-mono text-xs font-bold px-2.5 py-0.5 shrink-0",
                    activeTab === "ON_HOLD" ? "bg-amber-600 text-white hover:bg-amber-600" : "bg-muted text-muted-foreground"
                  )}
                >
                  {onHoldOrdersCount}
                </Badge>
              </div>

              <div className="pt-2.5 mt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">
                  <AlertTriangle className="h-3 w-3" /> Awaiting Action
                </span>
                <span className="font-medium text-foreground/80">{onHoldOrdersCount} {onHoldOrdersCount === 1 ? "order" : "orders"}</span>
              </div>
            </div>

            {/* FOLDER 5: COMPLETED ORDERS */}
            <div
              onClick={() => setActiveTab("COMPLETED")}
              className={cn(
                "group relative rounded-2xl border p-4.5 transition-all duration-200 cursor-pointer text-left select-none overflow-hidden",
                "bg-card/70 dark:bg-zinc-900/70 backdrop-blur-md",
                activeTab === "COMPLETED"
                  ? "border-emerald-500/60 ring-2 ring-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/[0.03] to-card dark:to-zinc-900 shadow-md shadow-emerald-500/5 -translate-y-0.5"
                  : "border-border/60 hover:border-emerald-500/40 hover:bg-muted/40 hover:-translate-y-0.5 shadow-xs"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl transition-all duration-200 shrink-0",
                    activeTab === "COMPLETED"
                      ? "bg-emerald-600 text-white shadow-xs scale-105"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20"
                  )}>
                    {activeTab === "COMPLETED" ? <FolderCheck className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm tracking-tight text-foreground">
                        Completed Orders
                      </h3>
                      {activeTab === "COMPLETED" && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Delivered & finalized orders archive</p>
                  </div>
                </div>
                <Badge
                  variant={activeTab === "COMPLETED" ? "default" : "secondary"}
                  className={cn(
                    "font-mono text-xs font-bold px-2.5 py-0.5 shrink-0",
                    activeTab === "COMPLETED" ? "bg-emerald-600 text-white hover:bg-emerald-600" : "bg-muted text-muted-foreground"
                  )}
                >
                  {completedOrdersCount}
                </Badge>
              </div>

              <div className="pt-2.5 mt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> 100% Concluded
                </span>
                <span className="font-medium text-foreground/80">{completedOrdersCount} archived</span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List Card with Folder Breadcrumbs & Search Toolbar */}
        <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
          <div className="p-4 bg-muted/10 border-b border-border/30 flex flex-col sm:flex-row gap-3 items-center justify-between">

            {/* Active Folder Directory Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto">
              <div className="flex items-center gap-2 font-semibold text-foreground bg-card/90 dark:bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-border/60 shadow-2xs">
                {activeTab === "ASSIGNED" && (
                  <>
                    <FolderOpen className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>Assigned Orders Folder</span>
                  </>
                )}
                {activeTab === "IN_PROGRESS" && (
                  <>
                    <FolderClock className="h-4 w-4 text-sky-500 shrink-0" />
                    <span>In-Progress Orders Folder</span>
                  </>
                )}
                {activeTab === "REVIEW_ORDER" && (
                  <>
                    <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>Review Orders Folder</span>
                  </>
                )}
                {activeTab === "ON_HOLD" && (
                  <>
                    <PauseCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>On-Hold Orders Folder</span>
                  </>
                )}
                {activeTab === "COMPLETED" && (
                  <>
                    <FolderCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Completed Orders Folder</span>
                  </>
                )}
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <span className="text-[11px] font-mono text-muted-foreground font-medium">
                {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} listed
              </span>
            </div>

            {/* Search bar & Filter actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search inside ${activeTab === "ASSIGNED" ? "assigned orders" : activeTab === "IN_PROGRESS" ? "in-progress orders" : activeTab === "REVIEW_ORDER" ? "review orders" : activeTab === "ON_HOLD" ? "on-hold orders" : "completed orders"}...`}
                  className="pl-8 h-9 text-xs rounded-lg bg-background/80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <CardContent className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/35 mb-3" />
                <h3 className="font-bold text-lg">
                  {activeTab === "ASSIGNED" ? "No Newly Assigned Orders" : activeTab === "IN_PROGRESS" ? "No In-Progress Orders" : activeTab === "REVIEW_ORDER" ? "No Review Orders" : activeTab === "ON_HOLD" ? "No On-Hold Orders" : "No Completed Orders"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  {searchTerm
                    ? "No results match your search query."
                    : activeTab === "ASSIGNED"
                      ? "There are currently no new unstarted orders waiting in the assigned queue."
                      : activeTab === "IN_PROGRESS"
                        ? "There are currently no orders in active progress in your queue."
                        : activeTab === "REVIEW_ORDER"
                          ? "There are currently no active orders allocated to you for continuous lifecycle review."
                          : activeTab === "ON_HOLD"
                            ? "There are currently no paused orders placed on hold."
                            : "There are currently no completed orders in your archive."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                        <th className="p-4 w-10 text-center">No.</th>
                        <th className="p-4 w-28 whitespace-nowrap">Order ID</th>
                        <th className="p-4 min-w-[170px]">Client & Company</th>
                        <th className="p-4 min-w-[260px] lg:min-w-[320px]">Service Scope</th>
                        <th className="p-4 w-44 min-w-[150px]">Consultant & Reviewer</th>
                        <th className="p-4 w-32 whitespace-nowrap">Created Date</th>
                        <th className="p-4 w-40 text-center whitespace-nowrap">Execution Stage</th>
                        <th className="p-4 w-28 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedOrders.map((ord, idx) => {
                        const isHighlighted = highlightedOrderNum === ord.order_number;
                        return (
                          <tr
                            key={ord.order_number}
                            id={`order-row-${ord.order_number}`}
                            onClick={() => {
                              setHighlightedOrderNum(ord.order_number);
                              if (typeof window !== "undefined") {
                                sessionStorage.setItem("assigned_orders_highlighted_order", ord.order_number);
                              }
                            }}
                            className={`transition-all duration-300 border-b last:border-0 ${isHighlighted
                                ? "bg-blue-500/15 dark:bg-blue-500/20 ring-2 ring-blue-500 ring-inset shadow-md"
                                : "hover:bg-muted/30 cursor-pointer"
                              }`}
                          >
                            <td className="p-4 text-center font-mono font-medium text-muted-foreground align-top pt-5">
                              #{orderSeqMap.get(ord.order_number || `SINGLE-${ord.id}`) ?? (filteredOrders.length - (startIndex + idx))}
                            </td>
                            <td className="p-4 align-top pt-5">
                              {ord.company_id ? (
                                <Link
                                  href={`/business/clients/documents/${ord.company_id}?order=${ord.order_number}&from=assigned-orders&tab=${activeTab}`}
                                  onClick={() => {
                                    setHighlightedOrderNum(ord.order_number);
                                    if (typeof window !== "undefined") {
                                      sessionStorage.setItem("assigned_orders_highlighted_order", ord.order_number);
                                    }
                                  }}
                                >
                                  <Badge
                                    variant="outline"
                                    className="font-mono font-bold text-xs bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary cursor-pointer transition-colors"
                                    title="Navigate to Company Documents Folder for this Order"
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
                            <td className="p-4 text-muted-foreground space-y-1 align-top pt-5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-foreground font-semibold text-sm">{ord.company_name || "Personal Client"}</span>
                                {(() => {
                                  const vStatus = ord.company?.validation_status;
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
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                <Building className="h-3.5 w-3.5 shrink-0" />
                                <span>{ord.client_name || "Representative"}</span>
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground align-top">
                              {ord.items && ord.items.length > 0 ? (
                                <div className="space-y-2.5 max-w-md my-1">
                                  {ord.items.map((item: any, idx: number) => {
                                    const itemKey = `${ord.order_number}-${idx}`;
                                    const isExpanded = !!expandedItems[itemKey];
                                    return (
                                      <div
                                        key={idx}
                                        className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/20 shadow-none space-y-1.5 transition-all duration-200"
                                      >
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
                                        {item.description && (
                                          <div className="space-y-1">
                                            {isExpanded && (
                                              <div className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap transition-all duration-200 mt-1 border-l-2 border-zinc-300 dark:border-zinc-700 pl-2 py-0.5">
                                                {item.description}
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
                                        )}

                                        {item.service_instructions && (
                                          <div className="mt-1.5 p-2 rounded-md bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-0.5">
                                            <div className="flex items-center gap-1.5 font-bold text-[10px] text-amber-700 dark:text-amber-400">
                                              <FileText className="h-3 w-3 shrink-0" />
                                              <span>Service Instructions:</span>
                                            </div>
                                            <p className="text-[11px] font-medium leading-relaxed whitespace-pre-wrap text-foreground/90">
                                              {item.service_instructions}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-muted-foreground italic text-xs">-</span>
                              )}
                            </td>
                            <td className="p-4 align-top pt-5 w-44 min-w-[150px]">
                              <div className="flex flex-col items-start gap-1.5 w-full">
                                {ord.consultants && ord.consultants.length > 0 ? (
                                  ord.consultants.map((c: any) => (
                                    <Badge
                                      key={c.id}
                                      variant="outline"
                                      className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-semibold flex items-center gap-1.5 py-0.5 px-2 max-w-full truncate shadow-none"
                                      title={`Assigned Consultant: ${c.name}`}
                                    >
                                      <UserCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                                      <span className="truncate">{c.name}</span>
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                                )}
                                {ord.reviewer && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/25 font-semibold flex items-center gap-1.5 py-0.5 px-2 max-w-full truncate shadow-none"
                                    title={`Designated Reviewer: ${ord.reviewer.name}`}
                                  >
                                    <ShieldCheck className="h-3 w-3 text-purple-600 dark:text-purple-400 shrink-0" />
                                    <span className="truncate">Rev: {ord.reviewer.name}</span>
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-mono font-medium text-muted-foreground align-top pt-5">
                              {formatDate(ord.created_at)}
                            </td>
                            <td className="p-4 text-center align-top pt-5">
                              {CONSULTANT_EDITABLE_STATUSES.includes((ord.status || "").toUpperCase()) ? (
                                <select
                                  value={ord.status}
                                  disabled={savingStatus}
                                  onChange={(e) => handleUpdateStatus(ord, e.target.value)}
                                  className={`h-8 px-2.5 py-1 text-xs font-bold rounded-md border shadow-xs bg-background transition-colors cursor-pointer ${getOrderStatusColor(ord.status)}`}
                                >
                                  <option value="ORDER_ASSIGNED">ORDER ASSIGNED</option>
                                  <option value="IN_PROGRESS">IN PROGRESS</option>
                                  <option value="REVIEW_DOCS">REVIEW DOCS</option>
                                  <option value="DOCUMENTS_REVIEWED">DOCUMENTS REVIEWED</option>
                                  <option value="PRE_DOC_SENT_FOR_SIGNATURE">PRE DOC SENT FOR SIGNATURE</option>
                                  <option value="FINAL_DOCUMENT_PREPARATION">FINAL DOCUMENT PREPARATION</option>
                                  <option value="FINAL_DOC_READY">FINAL DOC READY</option>
                                  <option value="ON_HOLD">ON HOLD</option>
                                </select>
                              ) : ord.status === "COMPLETED" ? (
                                <Badge variant="outline" className="text-xs font-bold py-1 px-2.5 uppercase shadow-xs whitespace-nowrap bg-emerald-500/15 text-emerald-600 border-emerald-500/30 flex items-center justify-center gap-1 mx-auto">
                                  <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
                                  COMPLETED
                                </Badge>
                              ) : (
                                <Badge variant="outline" className={`text-xs font-bold py-1 px-2.5 uppercase shadow-xs whitespace-nowrap ${getOrderStatusColor(ord.status)}`}>
                                  {(ord.status || "").replace(/_/g, " ")}
                                </Badge>
                              )}
                            </td>
                            <td className="p-4 text-right align-top pt-5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 font-bold border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm"
                                onClick={() => {
                                  setSelectedGroup(ord);
                                  setIsChatOpen(true);
                                  fetchProgressUpdates(ord.order_number);
                                }}
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Chat
                              </Button>
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

      {/* VIEW SCOPE DIALOG */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[88vw] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl shadow-2xl bg-background border border-border">

          <DialogHeader className="p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" /> Order Scope & Deliverables
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Detailed service items, deliverables, and team assignments.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 font-bold h-8 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm animate-in fade-in"
                onClick={() => {
                  setIsChatOpen(true);
                  fetchProgressUpdates(selectedGroup.order_number);
                }}
              >
                <MessageSquare className="h-4 w-4" /> Chat
              </Button>
              {selectedGroup && (
                <Badge variant="outline" className="font-mono text-xs font-bold px-3 py-1 bg-primary/10 border-primary/30 text-primary">
                  {selectedGroup.order_number}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Scrollable Body Content */}
          {selectedGroup && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Client Details & Service Items (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Client Entity & Rep Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-border/60 bg-muted/20 text-xs">
                    <div>
                      <span className="text-muted-foreground block font-semibold mb-0.5">Company Entity</span>
                      <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-primary shrink-0" />
                        {selectedGroup.company_name || "Individual Client"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-semibold mb-0.5">Client Representative</span>
                      <span className="font-semibold text-foreground text-sm">{selectedGroup.client_name || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-semibold mb-0.5">Order Creation Date</span>
                      <span className="font-mono font-bold text-sm text-foreground">{formatDate(selectedGroup.created_at)}</span>
                    </div>
                  </div>

                  {/* Service List Scope Items */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShoppingCart className="h-3.5 w-3.5 text-primary" /> Service Packages & Scope Details
                    </h4>

                    <div className="space-y-3">
                      {(selectedGroup.items || []).map((item: any) => (
                        <div key={item.id} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2.5">
                          <div className="flex items-center justify-between border-b border-border/30 pb-2">
                            <span className="font-bold text-foreground text-sm flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-primary" />
                              {item.job_title}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="font-mono font-bold text-xs bg-primary/5 border-primary/20 text-primary">
                                {item.job_id || "-"}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] font-mono font-bold uppercase px-2 py-0.5">
                                Tier: {item.pricing_tier}
                              </Badge>
                            </div>
                          </div>
                          {item.description ? (
                            <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap pl-4 border-l-2 border-primary/30 py-1">
                              {item.description}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic pl-4 block">No scope description provided.</span>
                          )}

                          {item.service_instructions && (
                            <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-[10px] text-amber-700 dark:text-amber-400">
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                <span>Service Instructions:</span>
                              </div>
                              <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap text-foreground/90">
                                {item.service_instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column: Status updates, Assigned Team & Logs (1/3 width) */}
                <div className="space-y-6">

                  {/* Execution Status Selector */}
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px] block">Execution Stage</span>
                      {!CONSULTANT_EDITABLE_STATUSES.includes((selectedGroup.status || "").toUpperCase()) && (
                        <span className="text-[10px] font-mono text-muted-foreground italic">View-only Stage</span>
                      )}
                    </div>
                    {CONSULTANT_EDITABLE_STATUSES.includes((selectedGroup.status || "").toUpperCase()) ? (
                      <select
                        value={selectedGroup.status}
                        disabled={savingStatus}
                        onChange={(e) => handleUpdateStatus(selectedGroup, e.target.value)}
                        className={`h-9 w-full px-3 text-xs font-bold rounded-lg border shadow-xs bg-background transition-colors cursor-pointer ${getOrderStatusColor(selectedGroup.status)}`}
                      >
                        <option value="ORDER_ASSIGNED">ORDER ASSIGNED</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="REVIEW_DOCS">REVIEW DOCS</option>
                        <option value="DOCUMENTS_REVIEWED">DOCUMENTS REVIEWED</option>
                        <option value="PRE_DOC_SENT_FOR_SIGNATURE">PRE DOC SENT FOR SIGNATURE</option>
                        <option value="FINAL_DOCUMENT_PREPARATION">FINAL DOCUMENT PREPARATION</option>
                        <option value="FINAL_DOC_READY">FINAL DOC READY</option>
                        <option value="ON_HOLD">ON HOLD</option>
                      </select>
                    ) : selectedGroup.status === "COMPLETED" ? (
                      <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 uppercase tracking-wide">
                        <Lock className="h-3.5 w-3.5" />
                        COMPLETED (LOCKED)
                      </div>
                    ) : (
                      <div className={`p-2.5 rounded-lg border text-xs font-bold text-center uppercase tracking-wide ${getOrderStatusColor(selectedGroup.status)}`}>
                        {(selectedGroup.status || "").replace(/_/g, " ")}
                      </div>
                    )}
                  </div>

                  {/* Team Roster */}
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3 text-xs">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px] block">Assigned Consulting Team</span>
                    {selectedGroup.consultants && selectedGroup.consultants.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {selectedGroup.consultants.map((c: any) => (
                          <div key={c.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
                            <div className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                              {c.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-foreground block truncate text-[11px]">{c.name}</span>
                              <span className="text-[9px] text-muted-foreground block truncate">{c.job_title || "Consultant"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic block">No team assigned</span>
                    )}

                    {selectedGroup.reviewer && (
                      <div className="pt-2.5 mt-2 border-t border-border/40 space-y-2">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Designated Order Reviewer
                        </span>
                        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40">
                          <div className="h-7 w-7 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {selectedGroup.reviewer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-foreground block truncate text-[11px]">{selectedGroup.reviewer.name}</span>
                            <span className="text-[9px] text-muted-foreground block truncate">{selectedGroup.reviewer.job_title || "Designated Reviewer"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Logs Stream */}
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-4">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Progress Update Log
                    </span>

                    {loadingProgress ? (
                      <div className="flex justify-center py-6 text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs">Loading updates...</span>
                      </div>
                    ) : progressUpdates.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-4 bg-muted/20 border border-dashed rounded-lg text-center">
                        No progress updates posted yet. Record the first progress status update below.
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {progressUpdates.map((upd) => (
                          <div key={upd.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-border/40 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground text-[11px]">{upd.sender_name}</span>
                              <span className="text-[8px] text-muted-foreground font-mono">{new Date(upd.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-[10px]">
                              {renderMessageContent(upd.message)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handlePostProgress} className="space-y-2 border-t border-border/40 pt-3">
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
                          id="chat-textarea-scope"
                          value={newProgressMessage}
                          onChange={(e) => handleTextChange(e.target.value, e.target.selectionStart)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && showSuggestions && filteredEmployees.length > 0) {
                              e.preventDefault();
                              selectSuggestion(filteredEmployees[0]);
                            }
                          }}
                          rows={2}
                          className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                          placeholder="Type progress updates or tag team members using @..."
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" size="sm" disabled={postingProgress} className="font-semibold text-xs gap-1.5">
                          {postingProgress ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                          Post Update
                        </Button>
                      </div>
                    </form>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* Fixed Footer */}
          <div className="flex justify-end p-4 border-t border-border/40 shrink-0 bg-muted/10">
            <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>
              Close Scope
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG FOR ALL STATUS CHANGES */}
      <Dialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !savingStatus) {
            setIsConfirmOpen(false);
            setPendingConfirmGroup(null);
            setPendingConfirmStatus("");
            setPendingDocCount(null);
          }
        }}
      >
        <DialogContent className="max-w-md p-6 rounded-2xl border border-border shadow-2xl bg-background">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Confirm Status Change
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Please review the order details and confirm the stage transition.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3.5">
            {/* Order and Company Info */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Order ID:</span>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15 font-mono font-bold text-xs px-2.5 py-0.5 border border-primary/25">
                  {pendingConfirmGroup?.order_number || "ORDER"}
                </Badge>
              </div>

              {pendingConfirmGroup?.company_name && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] font-semibold text-muted-foreground">Company:</span>
                  <span className="font-semibold text-foreground truncate max-w-[230px] text-right">{pendingConfirmGroup.company_name}</span>
                </div>
              )}

              {/* Status Transition Badges */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground">Stage Update:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <Badge variant="outline" className={`text-[10px] py-0.5 px-2 ${getOrderStatusColor(pendingConfirmGroup?.status)}`}>
                    {(pendingConfirmGroup?.status || "").replace(/_/g, " ")}
                  </Badge>
                  <span className="text-muted-foreground">➔</span>
                  <Badge variant="outline" className={`text-[10px] py-0.5 px-2 ${getOrderStatusColor(pendingConfirmStatus)}`}>
                    {(pendingConfirmStatus || "").replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>

              {/* Service Scope in Confirmation Box */}
              {pendingConfirmGroup?.items && pendingConfirmGroup.items.length > 0 && (
                <div className="pt-2 border-t border-border/40 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Service Scope:</span>
                  <div className="flex flex-wrap gap-1">
                    {pendingConfirmGroup.items.map((item: any, i: number) => {
                      const svc = item.job_title || item.service_name || item.name || "Service Package";
                      return (
                        <Badge key={i} variant="secondary" className="text-[10px] py-0.5 px-2 font-medium">
                          {svc}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded Documents Count Box */}
            <div className="p-3 rounded-xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Uploaded Documents</p>
                  <p className="text-[11px] text-muted-foreground">Documents uploaded for this order</p>
                </div>
              </div>
              <div>
                {loadingDocCount ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Badge variant="outline" className={cn(
                    "text-xs font-bold font-mono px-2.5 py-0.5 border",
                    (pendingDocCount || 0) > 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  )}>
                    {pendingDocCount ?? 0} {(pendingDocCount ?? 0) === 1 ? "document" : "documents"}
                  </Badge>
                )}
              </div>
            </div>

            {/* Confirmation Messages & Contextual Notices */}
            {pendingConfirmStatus === "COMPLETED" ? (
              <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                <span className="font-bold block text-xs mb-1 text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Order Completion Notice:
                </span>
                Please ensure all final documents are uploaded before completing the assigned order. Once completed, the order will be locked and assigned to the Finance team for final billing and reconciliation.
              </div>
            ) : pendingConfirmStatus === "FINAL_DOC_READY" ? (
              <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                <span className="font-bold block text-xs mb-1 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Final Document Readiness:
                </span>
                Marking this order as Final Docs Ready indicates that legal final documents are available in the repository and the order will move to Completed.
              </div>
            ) : (pendingDocCount === 0 && ["DOCUMENTS_REVIEWED", "FINAL_DOCUMENT_PREPARATION"].includes(pendingConfirmStatus)) ? (
              <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                <span className="font-bold block text-xs mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Document Notice:
                </span>
                There are currently 0 documents uploaded for this order. You can still proceed if documents are being verified externally.
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-border/60 bg-muted/30 text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to change the status of order <span className="font-bold text-foreground">{pendingConfirmGroup?.order_number}</span> to <span className="font-bold text-foreground">{(pendingConfirmStatus || "").replace(/_/g, " ")}</span>?
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end gap-2.5 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              disabled={savingStatus}
              onClick={() => {
                setIsConfirmOpen(false);
                setPendingConfirmGroup(null);
                setPendingConfirmStatus("");
                setPendingDocCount(null);
              }}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={savingStatus}
              onClick={async () => {
                if (pendingConfirmGroup) {
                  await executeUpdateStatus(pendingConfirmGroup, pendingConfirmStatus);
                }
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5"
            >
              {savingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POP-UP DIALOG FOR PLACING ORDER ON HOLD */}
      <Dialog
        open={isOnHoldDialogOpen}
        onOpenChange={(open) => {
          if (!open && !submittingHold) {
            setIsOnHoldDialogOpen(false);
            setPendingHoldGroup(null);
            setHoldReason("");
            setPendingDocCount(null);
          }
        }}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-amber-500/30 shadow-2xl bg-background dark:bg-zinc-950">
          <div className="p-6 pb-4 border-b border-border/60 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <PauseCircle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                    Place Order On Hold
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {pendingHoldGroup?.company_name || pendingHoldGroup?.client_name || "Assigned Order"}
                  </DialogDescription>
                </div>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/30 font-mono text-xs font-bold px-2.5 py-0.5">
                {pendingHoldGroup?.order_number || "ORDER"}
              </Badge>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Uploaded Documents Counter Box */}
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <FileText className="h-3.5 w-3.5 text-primary" /> Uploaded Documents:
              </span>
              <Badge variant="outline" className="text-xs font-mono font-bold bg-background">
                {loadingDocCount ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  `${pendingDocCount ?? (pendingHoldGroup?.document_count || 0)} ${(pendingDocCount ?? (pendingHoldGroup?.document_count || 0)) === 1 ? "document" : "documents"} uploaded`
                )}
              </Badge>
            </div>

            {/* Warning Banner */}
            <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold block">Order Execution Will Be Paused</span>
                The status will change to <span className="font-bold underline decoration-amber-500">ON HOLD</span> in the processing pipeline and your reason will be posted into the order activity log and chat stream.
              </div>
            </div>

            {/* Quick Reason Chips */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Select Quick Reason</span>
                <span className="text-[10px] font-normal lowercase text-muted-foreground/80">(click to autofill)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Waiting for Client Documents",
                  "Awaiting Client Confirmation / Approval",
                  "Pending Client Payment",
                  "Government / OSS System Revision",
                  "Legal / Notary Verification Pending",
                  "Technical Clarification Required"
                ].map((reasonChip) => (
                  <button
                    key={reasonChip}
                    type="button"
                    onClick={() => setHoldReason(reasonChip)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-lg border transition-all text-left font-medium",
                      holdReason === reasonChip
                        ? "bg-amber-500 text-white border-amber-500 font-semibold shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60"
                    )}
                  >
                    {reasonChip}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="on-hold-reason-input" className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Reason for Hold <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {holdReason.length} characters
                </span>
              </div>
              <Textarea
                id="on-hold-reason-input"
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                rows={3}
                placeholder="Detail why this order is being put on hold (e.g. Missing signed articles of association, waiting on response from client)..."
                className="text-xs resize-none rounded-xl border-border/80 focus-visible:ring-amber-500"
                disabled={submittingHold}
              />
            </div>

            {/* Chat Target Channel Toggle */}
            <div className="space-y-2 pt-1 border-t border-border/40">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Broadcast Reason To Chat
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHoldChannel("CLIENT")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all flex flex-col gap-1",
                    holdChannel === "CLIENT"
                      ? "border-amber-500/60 bg-amber-500/10 text-foreground ring-1 ring-amber-500/40"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                    <span>Client & Team Chat</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Client & internal staff both see this reason in chat
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setHoldChannel("INTERNAL")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all flex flex-col gap-1",
                    holdChannel === "INTERNAL"
                      ? "border-amber-500/60 bg-amber-500/10 text-foreground ring-1 ring-amber-500/40"
                      : "border-border/60 bg-muted/20 hover:bg-muted/40 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                    <span>Internal Staff Only</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    Private note logged only for processing consultants
                  </span>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-border/60 bg-muted/10 shrink-0 flex items-center justify-between sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submittingHold}
              onClick={() => {
                setIsOnHoldDialogOpen(false);
                setPendingHoldGroup(null);
                setHoldReason("");
              }}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submittingHold || !holdReason.trim()}
              onClick={handleConfirmOnHold}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
            >
              {submittingHold ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Placing on Hold...
                </>
              ) : (
                <>
                  <PauseCircle className="h-3.5 w-3.5" />
                  Put Order On Hold
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DUAL ORDER CHAT DIALOG (SIDE-BY-SIDE CLIENT & INTERNAL CHAT) */}
      <DualOrderChatDialog
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        orderNumber={selectedGroup?.order_number || null}
        orderTitle={selectedGroup?.items?.[0]?.job_title}
        companyName={selectedGroup?.company_name}
        clientName={selectedGroup?.client_name}
        orderStatus={selectedGroup?.status}
      />

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

    </>
  );
}
