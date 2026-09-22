"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Layers,
  ArrowUpDown,
  ExternalLink,
  MessageSquare,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  TrendingUp,
  Activity,
  Phone,
  Mail,
  FolderKanban,
  CheckCircle2,
  BarChart3,
  SlidersHorizontal,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TablePagination } from "@/components/ui/pagination";
import { DualOrderChatDialog } from "@/components/dual-order-chat-dialog";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";

interface OrderSummaryItem {
  order_number: string;
  id: number;
  status: string;
  payment_status: string;
  company_name: string;
  client_name?: string | null;
  services: string[];
  services_count: number;
  total_amount: number;
  created_at: string | null;
  is_active: boolean;
  assigned_as: "CONSULTANT" | "REVIEWER" | "BOTH";
  co_consultants: string[];
  reviewers_names: string[];
}

interface TeamMemberWorkload {
  employee_id: number;
  user_id?: number | null;
  name: string;
  job_title: string;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_photo?: string | null;
  consultant_active_count: number;
  consultant_total_count: number;
  reviewer_active_count: number;
  reviewer_total_count: number;
  total_active_load: number;
  total_all_load: number;
  capacity_status: "AVAILABLE" | "LIGHT" | "OPTIMAL" | "HEAVY";
  status_breakdown: Record<string, number>;
  orders: OrderSummaryItem[];
}

interface WorkloadSummary {
  total_active_orders: number;
  total_order_groups: number;
  total_consultants_engaged: number;
  total_reviewers_engaged: number;
  unassigned_orders_count: number;
  avg_consultant_load: number;
  avg_reviewer_load: number;
}

export default function TeamWorkloadPage() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_orders_active", "view") || hasPermission("clients_orders", "view");

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<WorkloadSummary | null>(null);
  const [teamWorkload, setTeamWorkload] = useState<TeamMemberWorkload[]>([]);

  // Filtering and Sorting States
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeMode, setScopeMode] = useState<"ACTIVE" | "ALL">("ACTIVE");
  const [sortBy, setSortBy] = useState<"LOAD_DESC" | "CONSULTANT_DESC" | "REVIEWER_DESC" | "NAME_ASC">("LOAD_DESC");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Row Expansion State (employee_id -> expanded boolean)
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  // Inner Order Tab Filter per employee (employee_id -> 'ALL' | 'CONSULTANT' | 'REVIEWER')
  const [innerOrderFilter, setInnerOrderFilter] = useState<Record<number, "ALL" | "CONSULTANT" | "REVIEWER">>({});

  // Chat Dialog Modal
  const [chatOrder, setChatOrder] = useState<{ orderNumber: string; companyName: string } | null>(null);

  // Authorization Check & Redirect
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to view Team Workload.");
      if (hasPermission("clients_my", "view")) {
        router.replace("/business/assigned-orders");
      } else {
        router.replace("/business/dashboard");
      }
    }
  }, [userLoading, canView, hasPermission, router]);

  // Fetch Workload Matrix from Backend
  const fetchWorkloadMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/workload-matrix`, {
        credentials: "include",
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || null);
        setTeamWorkload(data.team_workload || []);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to load team workload matrix.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error fetching team workload.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchWorkloadMatrix();
    }
  }, [canView]);

  // Toggle Row Expansion
  const toggleRow = (empId: number) => {
    setExpandedRows(prev => ({ ...prev, [empId]: !prev[empId] }));
  };

  const expandAll = () => {
    const allExp: Record<number, boolean> = {};
    teamWorkload.forEach(m => { allExp[m.employee_id] = true; });
    setExpandedRows(allExp);
  };

  const collapseAll = () => {
    setExpandedRows({});
  };

  // Filtered & Sorted Workload List
  const filteredTeam = useMemo(() => {
    return teamWorkload
      .filter(member => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          !q ||
          member.name.toLowerCase().includes(q) ||
          (member.job_title && member.job_title.toLowerCase().includes(q)) ||
          (member.department && member.department.toLowerCase().includes(q)) ||
          (member.email && member.email.toLowerCase().includes(q)) ||
          (member.phone && member.phone.toLowerCase().includes(q)) ||
          member.orders.some(o => 
            o.order_number.toLowerCase().includes(q) || 
            o.company_name.toLowerCase().includes(q) ||
            o.services.some(s => s.toLowerCase().includes(q))
          );

        return matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === "LOAD_DESC") {
          const loadA = scopeMode === "ACTIVE" ? a.total_active_load : a.total_all_load;
          const loadB = scopeMode === "ACTIVE" ? b.total_active_load : b.total_all_load;
          if (loadB !== loadA) return loadB - loadA;
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "CONSULTANT_DESC") {
          const cA = scopeMode === "ACTIVE" ? a.consultant_active_count : a.consultant_total_count;
          const cB = scopeMode === "ACTIVE" ? b.consultant_active_count : b.consultant_total_count;
          if (cB !== cA) return cB - cA;
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "REVIEWER_DESC") {
          const rA = scopeMode === "ACTIVE" ? a.reviewer_active_count : a.reviewer_total_count;
          const rB = scopeMode === "ACTIVE" ? b.reviewer_active_count : b.reviewer_total_count;
          if (rB !== rA) return rB - rA;
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "NAME_ASC") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [teamWorkload, searchQuery, scopeMode, sortBy]);

  // Paginated View
  const totalPages = Math.ceil(filteredTeam.length / pageSize) || 1;
  const paginatedTeam = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTeam.slice(start, start + pageSize);
  }, [filteredTeam, currentPage, pageSize]);

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Status Styling Helper
  const getOrderStatusBadgeClass = (status: string) => {
    switch ((status || "").toUpperCase()) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25";
      case "CONFIRMED":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25";
      case "ORDER_ASSIGNED":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25";
      case "IN_PROGRESS":
        return "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25";
      case "REVIEW_DOCS":
        return "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25";
      case "DOCUMENTS_REVIEWED":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25";
      case "FINAL_DOCUMENT_PREPARATION":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25";
      case "FINAL_DOC_READY":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25";
      case "ON_HOLD":
        return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35 font-semibold";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25 line-through opacity-75";
      default:
        return "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/25";
    }
  };

  const getCapacityStatusPill = (status: string) => {
    switch (status) {
      case "HEAVY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            High Volume
          </span>
        );
      case "OPTIMAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Optimal Load
          </span>
        );
      case "LIGHT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            Light Load
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            Available
          </span>
        );
    }
  };

  if (userLoading || (!canView && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        <p className="text-sm text-muted-foreground font-medium">Verifying team workload permissions...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Minimalist Metrics Strip & Action Button Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
          
          {/* Active Orders */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 sm:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Active Orders</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{summary?.total_active_orders ?? 0}</p>
            </div>
          </div>

          {/* Executing Consultants */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 sm:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Consultants</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{summary?.total_consultants_engaged ?? 0}</p>
            </div>
          </div>

          {/* Designated Reviewers */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 sm:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Reviewers</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{summary?.total_reviewers_engaged ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Action Button: Refresh Data */}
        <Button 
          onClick={fetchWorkloadMatrix}
          disabled={loading}
          variant="outline"
          className="gap-2 font-bold shadow-xs rounded-2xl h-auto min-h-[48px] px-6 text-sm border-border/60 bg-card/60 hover:bg-card shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-600" : ""}`} /> Refresh Data
        </Button>
      </div>

      {/* Team Workload & Allocation Display Card */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <div className="p-4 bg-muted/10 border-b border-border/40 flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search legal team member, role, order..."
                className="pl-9 h-9 text-xs rounded-xl bg-background/70 border-border/50 focus:border-ring"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Scope Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
              {[
                { id: "ACTIVE", label: "Active Orders Only" },
                { id: "ALL", label: "All Orders (incl. Completed)" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setScopeMode(tab.id as any);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    scopeMode === tab.id 
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs font-bold" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-9 px-3 text-xs font-semibold rounded-xl border border-border/50 bg-background/70 text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-xs"
            >
              <option value="LOAD_DESC">Sort: Highest Total Load</option>
              <option value="CONSULTANT_DESC">Sort: Most Consultant Orders</option>
              <option value="REVIEWER_DESC">Sort: Most Reviewer Orders</option>
              <option value="NAME_ASC">Sort: Name (A to Z)</option>
            </select>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAll}
                className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1 rounded-lg"
              >
                <ChevronDown className="h-3.5 w-3.5" /> Expand All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1 rounded-lg"
              >
                <ChevronUp className="h-3.5 w-3.5" /> Collapse All
              </Button>
            </div>

            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold hidden sm:inline-block">
              Showing {paginatedTeam.length} of {filteredTeam.length} members
            </span>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                  <th className="p-4 pl-5 w-12 text-center">#</th>
                  <th className="p-4 min-w-[220px]">Legal Team Member &amp; Contact</th>
                  <th className="p-4 min-w-[150px] text-center">
                    <div className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Executing Consultant</span>
                    </div>
                  </th>
                  <th className="p-4 min-w-[150px] text-center">
                    <div className="inline-flex items-center gap-1 text-purple-700 dark:text-purple-400 font-bold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Designated Reviewer</span>
                    </div>
                  </th>
                  <th className="p-4 min-w-[160px] text-center">Total Order Load</th>
                  <th className="p-4 min-w-[130px] text-center">Capacity Status</th>
                  <th className="p-4 text-right pr-5 w-28">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
                      <span className="text-xs font-medium">Aggregating team workload matrix...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTeam.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-sm font-semibold text-foreground">No legal team members match criteria</span>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Try adjusting your search query.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTeam.map((member, idx) => {
                  const isExpanded = !!expandedRows[member.employee_id];
                  const cCount = scopeMode === "ACTIVE" ? member.consultant_active_count : member.consultant_total_count;
                  const rCount = scopeMode === "ACTIVE" ? member.reviewer_active_count : member.reviewer_total_count;
                  const totalLoad = scopeMode === "ACTIVE" ? member.total_active_load : member.total_all_load;
                  const maxCap = 25;
                  const capPercent = Math.min(100, Math.round((totalLoad / maxCap) * 100));

                  const currentInnerFilter = innerOrderFilter[member.employee_id] || "ALL";

                  // Filter orders displayed in the expanded sub-table
                  const displayOrders = member.orders.filter(ord => {
                    if (scopeMode === "ACTIVE" && !ord.is_active) return false;
                    if (currentInnerFilter === "CONSULTANT") {
                      return ord.assigned_as === "CONSULTANT" || ord.assigned_as === "BOTH";
                    }
                    if (currentInnerFilter === "REVIEWER") {
                      return ord.assigned_as === "REVIEWER" || ord.assigned_as === "BOTH";
                    }
                    return true;
                  });

                  return (
                    <React.Fragment key={member.employee_id}>
                      {/* Master Employee Row */}
                      <tr 
                        onClick={() => toggleRow(member.employee_id)}
                        className={`group cursor-pointer transition-colors ${
                          isExpanded 
                            ? "bg-purple-500/[0.04] dark:bg-purple-950/10" 
                            : "hover:bg-muted/30"
                        }`}
                      >
                        {/* Serial Number */}
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground font-semibold">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>

                        {/* Employee Avatar & Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs shrink-0 border border-purple-500/30">
                              {member.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground text-sm truncate group-hover:text-purple-600 transition-colors">
                                  {member.name}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                                <span className="font-medium text-foreground/80">{member.job_title}</span>
                                {member.phone && member.phone !== "-" && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono flex items-center gap-1">
                                      <Phone className="h-2.5 w-2.5 text-muted-foreground" />
                                      {member.phone}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Executing Consultant Count */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Badge
                              variant="outline"
                              className={`font-mono text-xs px-2.5 py-0.5 font-bold shadow-none ${
                                cCount > 0
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                  : "text-muted-foreground/60 border-border/40"
                              }`}
                            >
                              {cCount} Orders
                            </Badge>
                          </div>
                        </td>

                        {/* Designated Reviewer Count */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Badge
                              variant="outline"
                              className={`font-mono text-xs px-2.5 py-0.5 font-bold shadow-none ${
                                rCount > 0
                                  ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                                  : "text-muted-foreground/60 border-border/40"
                              }`}
                            >
                              {rCount} Orders
                            </Badge>
                          </div>
                        </td>

                        {/* Total Active Load & Capacity Bar */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col items-center gap-1.5 w-full max-w-[140px] mx-auto">
                            <div className="flex items-center justify-between w-full font-mono text-[11px]">
                              <span className="font-bold text-foreground text-xs">{totalLoad} Active</span>
                              <span className="text-[10px] text-muted-foreground">{capPercent}% load</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/40">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  capPercent > 75
                                    ? "bg-rose-500"
                                    : capPercent > 35
                                    ? "bg-purple-500"
                                    : capPercent > 0
                                    ? "bg-emerald-500"
                                    : "bg-transparent"
                                }`}
                                style={{ width: `${capPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Capacity Status */}
                        <td className="py-3.5 px-4 text-center">
                          {getCapacityStatusPill(member.capacity_status)}
                        </td>

                        {/* Expand / Collapse Action */}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(member.employee_id);
                            }}
                            className="h-7 px-2.5 text-[11px] font-semibold gap-1 rounded-lg text-purple-700 dark:text-purple-400 hover:bg-purple-500/10"
                          >
                            <span>{isExpanded ? "Hide" : "Drilldown"}</span>
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </td>
                      </tr>

                      {/* Expandable Order Drilldown Sub-table */}
                      {isExpanded && (
                        <tr className="bg-purple-500/[0.02] dark:bg-purple-950/5 border-b-2 border-purple-500/20">
                          <td colSpan={7} className="p-4 sm:p-5">
                            <div className="space-y-4 rounded-xl border border-purple-500/20 bg-background/90 p-4 sm:p-5 shadow-inner">
                              {/* Drilldown Header & Filter Tabs */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                  <FolderKanban className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                                    Assigned Orders for {member.name}
                                  </h4>
                                  <Badge variant="outline" className="font-mono text-[10px] font-bold px-2">
                                    {displayOrders.length} {scopeMode === "ACTIVE" ? "Active" : "Total"} Orders
                                  </Badge>
                                </div>

                                {/* Inner Role Filter Tabs */}
                                <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/40 text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => setInnerOrderFilter(prev => ({ ...prev, [member.employee_id]: "ALL" }))}
                                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                      currentInnerFilter === "ALL"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    All Roles ({member.orders.length})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setInnerOrderFilter(prev => ({ ...prev, [member.employee_id]: "CONSULTANT" }))}
                                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                      currentInnerFilter === "CONSULTANT"
                                        ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    As Consultant ({cCount})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setInnerOrderFilter(prev => ({ ...prev, [member.employee_id]: "REVIEWER" }))}
                                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                                      currentInnerFilter === "REVIEWER"
                                        ? "bg-purple-500/20 text-purple-800 dark:text-purple-300 font-bold shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    As Reviewer ({rCount})
                                  </button>
                                </div>
                              </div>

                              {/* Orders Drilldown Sub-table */}
                              {displayOrders.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground text-xs italic">
                                  No orders match this filter.
                                </div>
                              ) : (
                                <div className="overflow-x-auto rounded-xl border border-border/50 bg-card">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="border-b border-border/40 bg-muted/20 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                        <th className="py-2.5 px-3">Order Number</th>
                                        <th className="py-2.5 px-3">Role Assigned</th>
                                        <th className="py-2.5 px-3 min-w-[180px]">Client / Target Entity</th>
                                        <th className="py-2.5 px-3 min-w-[200px]">Service Scope</th>
                                        <th className="py-2.5 px-3 text-center">Lifecycle Status</th>
                                        <th className="py-2.5 px-3 text-right">Contract Value</th>
                                        <th className="py-2.5 px-3">Co-Assignees</th>
                                        <th className="py-2.5 px-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/30">
                                      {displayOrders.map((ord) => (
                                        <tr key={ord.order_number} className="hover:bg-muted/30 transition-colors">
                                          {/* Order # */}
                                          <td className="py-2 px-3 font-mono font-bold text-foreground">
                                            <Link
                                              href={`/business/clients/orders?order=${ord.order_number}`}
                                              className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                                            >
                                              {ord.order_number}
                                              <ExternalLink className="h-3 w-3 opacity-60" />
                                            </Link>
                                          </td>

                                          {/* Role Badge */}
                                          <td className="py-2 px-3 whitespace-nowrap">
                                            {ord.assigned_as === "BOTH" ? (
                                              <div className="flex items-center gap-1">
                                                <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                                                  Consultant
                                                </Badge>
                                                <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30">
                                                  Reviewer
                                                </Badge>
                                              </div>
                                            ) : ord.assigned_as === "REVIEWER" ? (
                                              <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 font-semibold flex items-center gap-1 w-fit">
                                                <ShieldCheck className="h-2.5 w-2.5" />
                                                Reviewer
                                              </Badge>
                                            ) : (
                                              <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold flex items-center gap-1 w-fit">
                                                <UserCheck className="h-2.5 w-2.5" />
                                                Consultant
                                              </Badge>
                                            )}
                                          </td>

                                          {/* Company Entity */}
                                          <td className="py-2 px-3">
                                            <div className="font-semibold text-foreground text-xs leading-tight truncate max-w-[200px]">
                                              {ord.company_name}
                                            </div>
                                            {ord.client_name && (
                                              <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                                {ord.client_name}
                                              </div>
                                            )}
                                          </td>

                                          {/* Services */}
                                          <td className="py-2 px-3">
                                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                                              {ord.services && ord.services.length > 0 ? (
                                                ord.services.map((svc, sIdx) => (
                                                  <span key={sIdx} className="text-[10px] font-medium bg-muted/60 px-1.5 py-0.5 rounded border border-border/40 text-foreground truncate max-w-[220px]">
                                                    {svc}
                                                  </span>
                                                ))
                                              ) : (
                                                <span className="text-muted-foreground text-[10px] italic">General Scope</span>
                                              )}
                                            </div>
                                          </td>

                                          {/* Status */}
                                          <td className="py-2 px-3 text-center whitespace-nowrap">
                                            <Badge
                                              variant="outline"
                                              className={`text-[9.5px] font-bold px-2 py-0.5 border ${getOrderStatusBadgeClass(ord.status)}`}
                                            >
                                              {ord.status.replace(/_/g, " ")}
                                            </Badge>
                                          </td>

                                          {/* Contract Value */}
                                          <td className="py-2 px-3 text-right font-mono font-bold text-xs text-foreground whitespace-nowrap">
                                            {formatCurrency(ord.total_amount)}
                                          </td>

                                          {/* Co-Assignees / Team */}
                                          <td className="py-2 px-3">
                                            <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground max-w-[180px]">
                                              {ord.co_consultants && ord.co_consultants.length > 0 && (
                                                <div className="truncate">
                                                  <span className="font-semibold text-foreground/80">Co-consultant:</span>{" "}
                                                  {ord.co_consultants.join(", ")}
                                                </div>
                                              )}
                                              {ord.reviewers_names && ord.reviewers_names.length > 0 && ord.assigned_as !== "REVIEWER" && (
                                                <div className="truncate text-purple-700 dark:text-purple-300">
                                                  <span className="font-semibold">Reviewer:</span>{" "}
                                                  {ord.reviewers_names.join(", ")}
                                                </div>
                                              )}
                                              {(!ord.co_consultants || ord.co_consultants.length === 0) &&
                                               (!ord.reviewers_names || ord.reviewers_names.length === 0) && (
                                                <span className="italic text-muted-foreground">Sole Assignee</span>
                                              )}
                                            </div>
                                          </td>

                                          {/* Actions */}
                                          <td className="py-2 px-3 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-6 px-2 text-[10px] gap-1 font-semibold border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
                                                onClick={() => setChatOrder({
                                                  orderNumber: ord.order_number,
                                                  companyName: ord.company_name
                                                })}
                                              >
                                                <MessageSquare className="h-3 w-3" /> Chat
                                              </Button>
                                              <Link href={`/business/assigned-orders?order=${ord.order_number}&chat=false`}>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                                                >
                                                  View <ExternalLink className="h-2.5 w-2.5" />
                                                </Button>
                                              </Link>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-bold text-foreground">{paginatedTeam.length}</span> of{" "}
            <span className="font-bold text-foreground">{filteredTeam.length}</span> legal team members
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </Card>

      {/* Direct Integrated Order Chat Dialog */}
      {chatOrder && (
        <DualOrderChatDialog
          isOpen={!!chatOrder}
          onClose={() => setChatOrder(null)}
          orderNumber={chatOrder.orderNumber}
          companyName={chatOrder.companyName}
        />
      )}
    </div>
  );
}
