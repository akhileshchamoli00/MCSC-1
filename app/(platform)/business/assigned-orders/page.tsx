"use client";

import React, { useEffect, useState } from "react";
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
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function AssignedOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
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
    if (!newProgressMessage.trim() || !selectedGroup) return;
    const activeToken = localStorage.getItem("hrms_token");
    if (!activeToken) return;
    setPostingProgress(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedGroup.order_number}/progress`, {
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

  const fetchAssignedOrders = async () => {
    const activeToken = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;
    if (!activeToken) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/my-assigned`, {
        headers: { "Authorization": `Bearer ${activeToken}` }
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
    const activeToken = localStorage.getItem("hrms_token");
    if (!activeToken) return;
    try {
      const [empRes, teamRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { headers: { "Authorization": `Bearer ${activeToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, { headers: { "Authorization": `Bearer ${activeToken}` } })
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (teamRes.ok) setTeams(await teamRes.json());
    } catch (err) {
      console.error("Error fetching chat metadata:", err);
    }
  };

  useEffect(() => {
    fetchAssignedOrders();
    fetchMetaData();
  }, []);

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
        consultants: ord.consultants || [],
        notes: ord.notes || "",
        items: []
      });
    }
    const group = groupedOrdersMap.get(key);
    group.items.push(ord);
    
    if (ord.consultants && ord.consultants.length > 0) {
      const existingIds = new Set(group.consultants.map((c: any) => c.id));
      ord.consultants.forEach((c: any) => {
        if (!existingIds.has(c.id)) group.consultants.push(c);
      });
    }
  });

  const groupedOrders = Array.from(groupedOrdersMap.values());

  const handleUpdateStatus = async (group: any, newStatus: string) => {
    if (newStatus === "COMPLETED") {
      setPendingConfirmGroup(group);
      setPendingConfirmStatus(newStatus);
      setIsConfirmOpen(true);
      return;
    }
    await executeUpdateStatus(group, newStatus);
  };

  const executeUpdateStatus = async (group: any, newStatus: string) => {
    const activeToken = localStorage.getItem("hrms_token");
    if (!activeToken || !group || !group.items) return;
    setSavingStatus(true);
    try {
      await Promise.all(
        group.items.map((itemRow: any) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${itemRow.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${activeToken}`
            },
            body: JSON.stringify({ status: newStatus })
          })
        )
      );
      toast.success(`Order ${group.order_number} status updated to ${newStatus}`);
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
    }
  };

  const filteredOrders = groupedOrders.filter(ord => {
    const term = searchTerm.toLowerCase();
    const orderNum = (ord.order_number || "").toLowerCase();
    const clientName = (ord.client_name || "").toLowerCase();
    const compName = (ord.company_name || "").toLowerCase();
    const itemsStr = (ord.items || []).map((i: any) => `${i.job_title} ${i.job_id}`).join(" ").toLowerCase();
    return orderNum.includes(term) || clientName.includes(term) || compName.includes(term) || itemsStr.includes(term);
  });

  const totalPages = Math.ceil(filteredOrders.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

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
      case "SOFT_COPY_DELIVERED": return "bg-sky-500/15 text-sky-600 border-sky-500/30";
      case "HARD_COPY_DELIVERED": return "bg-violet-500/15 text-violet-600 border-violet-500/30";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const totalOrdersCount = groupedOrders.length;
  const inProgressOrdersCount = groupedOrders.filter(o => o.status === "IN_PROGRESS").length;
  const completedOrdersCount = groupedOrders.filter(o => o.status === "COMPLETED").length;
  const confirmedOrdersCount = groupedOrders.filter(o => o.status === "CONFIRMED").length;

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
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm shrink-0 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assigned Client Orders</h1>
            <p className="text-muted-foreground text-sm">
              Service orders allocated to you for execution and consulting support. Update job status as work progresses.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Total Assigned Orders */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 shrink-0">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Total Assigned</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{totalOrdersCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Confirmed Orders */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <Receipt className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Confirmed Jobs</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{confirmedOrdersCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* In Progress Orders */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">In Progress</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{inProgressOrdersCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Completed Orders */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Completed Jobs</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{completedOrdersCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assigned orders..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      </div>

      {/* Orders List Card */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-2xl bg-muted/30">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/35 mb-3" />
          <h3 className="font-bold text-lg">No Assigned Orders</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {searchTerm ? "No results match your search query." : "You do not have any orders assigned to you currently."}
          </p>
        </div>
      ) : (
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                  <th className="p-4 w-12 text-center">No.</th>
                  <th className="p-4 w-32">Order ID</th>
                  <th className="p-4">Client & Company</th>
                  <th className="p-4">Service Scope</th>
                  <th className="p-4">Assigned Team</th>
                  <th className="p-4 w-32">Created Date</th>
                  <th className="p-4 w-40 text-center">Execution Stage</th>
                  <th className="p-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedOrders.map((ord, idx) => (
                  <tr key={ord.order_number} className="hover:bg-muted/30 transition-colors border-b last:border-0">
                    <td className="p-4 text-center font-mono font-medium text-muted-foreground align-top pt-5">
                      #{startIndex + idx + 1}
                    </td>
                    <td className="p-4 align-top pt-5">
                      {ord.company_id ? (
                        <Link href={`/business/clients/documents/${ord.company_id}?from=assigned-orders`}>
                          <Badge 
                            variant="outline" 
                            className="font-mono font-bold text-xs bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary cursor-pointer transition-colors"
                            title="Navigate to Company Documents Folder"
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
                      <div className="text-foreground font-semibold text-sm">
                        {ord.company_name || "Personal Client"}
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
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">-</span>
                      )}
                    </td>
                    <td className="p-4 align-top pt-5">
                      {ord.consultants && ord.consultants.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {ord.consultants.map((c: any) => (
                            <Badge key={c.id} variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium flex items-center gap-0.5 py-0.5 px-1.5">
                              <UserCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[80px]">{c.name}</span>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">No team assigned</span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-medium text-muted-foreground align-top pt-5">
                      {formatDate(ord.created_at)}
                    </td>
                    <td className="p-4 text-center align-top pt-5">
                      <select
                        value={ord.status}
                        disabled={savingStatus}
                        onChange={(e) => handleUpdateStatus(ord, e.target.value)}
                        className={`h-8 px-2.5 py-1 text-xs font-bold rounded-md border shadow-xs bg-background transition-colors cursor-pointer ${getOrderStatusColor(ord.status)}`}
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="PROFORMA_GENERATED">PROFORMA GENERATED</option>
                        <option value="WAITING_ON_CLIENT">WAITING ON CLIENT</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="ORDER_ASSIGNED">ORDER ASSIGNED</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="REVIEW_DOCS">REVIEW DOCS</option>
                        <option value="FINAL_DOCUMENT_PREPARATION">FINAL DOCUMENT PREPARATION</option>
                        <option value="FINAL_DOC_READY">FINAL DOC READY</option>
                        <option value="INVOICE_GENERATED">INVOICE GENERATED</option>
                        <option value="SOFT_COPY_DELIVERED">SOFT COPY DELIVERED</option>
                        <option value="HARD_COPY_DELIVERED">HARD copy DELIVERED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
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
        </Card>
      )}
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
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column: Status updates, Assigned Team & Logs (1/3 width) */}
                <div className="space-y-6">
                  
                  {/* Execution Status Selector */}
                  <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
                    <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px] block">Execution Stage</span>
                    <select
                      value={selectedGroup.status}
                      disabled={savingStatus}
                      onChange={(e) => handleUpdateStatus(selectedGroup, e.target.value)}
                      className={`h-9 w-full px-3 text-xs font-bold rounded-lg border shadow-xs bg-background transition-colors cursor-pointer ${getOrderStatusColor(selectedGroup.status)}`}
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PROFORMA_GENERATED">PROFORMA GENERATED</option>
                      <option value="WAITING_ON_CLIENT">WAITING ON CLIENT</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="ORDER_ASSIGNED">ORDER ASSIGNED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
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

      {/* CONFIRMATION DIALOG FOR COMPLETION */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xl bg-background dark:bg-zinc-950">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-pulse" />
              Complete Assigned Order?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Please read the notice below carefully before proceeding.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3">
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
              <span className="font-bold block text-sm mb-1 text-amber-800 dark:text-amber-300">Notice:</span>
              Please ensure the final documents are uploaded before completing the assigned order. Once completed the job will be assigned to the Finance team for further processing.
            </div>
          </div>
          
          <DialogFooter className="flex justify-end gap-2.5 pt-3 border-t border-border/40">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsConfirmOpen(false);
                setPendingConfirmGroup(null);
                setPendingConfirmStatus("");
              }}
              className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 transition-colors"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={async () => {
                setIsConfirmOpen(false);
                if (pendingConfirmGroup) {
                  await executeUpdateStatus(pendingConfirmGroup, pendingConfirmStatus);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ORDER CHAT SLIDING PANEL */}
      <AnimatePresence>
        {isChatOpen && selectedGroup && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="fixed inset-y-0 right-0 z-[70] w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/60 flex items-center justify-between shrink-0 bg-muted/20">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" /> Order Chat
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  Order #{selectedGroup.order_number} ({selectedGroup.company_name})
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
                      className="flex flex-col gap-1 p-3.5 rounded-2xl border border-border bg-card shadow-xs relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-xs">{upd.sender_name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(upd.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                    className="rounded-xl font-bold h-9 px-4 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={postingProgress}
                    className="px-4 font-bold shadow-md rounded-xl h-9 bg-zinc-900 hover:bg-zinc-100 text-zinc-50 hover:text-zinc-900 border border-zinc-900 dark:bg-zinc-100 dark:hover:bg-zinc-900 dark:text-zinc-950 dark:hover:text-zinc-100 dark:border-zinc-100 transition-all duration-200"
                  >
                    {postingProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Update"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
