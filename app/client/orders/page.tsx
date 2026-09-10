"use client";

import React, { useEffect, useState } from "react";
import { useClient } from "../layout";
import { useRouter } from "next/navigation";
import {
  Package,
  MessageSquare,
  Search,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  CreditCard,
  Building,
  Building2,
  User,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveImageUrl } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: "Draft", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  CONFIRMED: { label: "Confirmed", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  ORDER_ASSIGNED: { label: "Consultant Assigned", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  IN_PROGRESS: { label: "In Progress", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  REVIEW_DOCS: { label: "Reviewing Documents", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  FINAL_DOCUMENT_PREPARATION: { label: "Doc Preparation", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  FINAL_DOC_READY: { label: "Final Docs Ready", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  WAITING_ON_CLIENT: { label: "Action Required", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  WAITING_FOR_FINAL_PAYMENT: { label: "Payment Pending", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  FINAL_PAYMENT_COMPLETED: { label: "Paid", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  SOFT_COPY_DELIVERED: { label: "Soft Copy Sent", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  HARD_COPY_DELIVERED: { label: "Delivered", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  COMPLETED: { label: "Completed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  CANCELLED: { label: "Cancelled", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" }
};

export default function ClientOrdersPage() {
  const router = useRouter();
  const { clientProfile, activeCompany } = useClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchOrders = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Error fetching client orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [clientProfile, activeCompany]);

  // Filter orders by active company, search, and status
  const filteredOrders = orders.filter(ord => {
    if (activeCompany && ord.company_id && ord.company_id !== activeCompany.id) {
      return false;
    }

    const isCompleted = ["COMPLETED", "HARD_COPY_DELIVERED"].includes(ord.status);
    if (filterStatus === "ACTIVE" && isCompleted) return false;
    if (filterStatus === "COMPLETED" && !isCompleted) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNum = (ord.order_number || "").toLowerCase().includes(q);
      const matchTitle = (ord.job_title || "").toLowerCase().includes(q);
      const matchCompany = (ord.company_name || "").toLowerCase().includes(q);
      const matchConsultant = (ord.consultants || []).some((c: any) =>
        (c.name || "").toLowerCase().includes(q)
      );
      if (!matchNum && !matchTitle && !matchCompany && !matchConsultant) return false;
    }

    return true;
  });

  // Group by order_number for clean display
  const orderGroups = React.useMemo(() => {
    const map = new Map<string, any[]>();
    filteredOrders.forEach(ord => {
      const num = ord.order_number || `ORD-${ord.id}`;
      if (!map.has(num)) map.set(num, []);
      map.get(num)!.push(ord);
    });
    return Array.from(map.entries()).map(([orderNumber, items]) => {
      const primary = items[0];
      const totalAmount = items.reduce(
        (acc, curr) => acc + (Number(curr.total_amount) || Number(curr.unit_price) || 0),
        0
      );

      const proformaPaidAmount = items.reduce((acc, curr) => {
        if (curr.proforma_paid_amount != null && curr.proforma_paid_amount > 0) {
          return acc + Number(curr.proforma_paid_amount);
        }
        return acc;
      }, 0) || (primary.proforma_paid_amount != null ? Number(primary.proforma_paid_amount) : 0);

      const paymentStatus = primary.payment_status || "UNPAID";
      const status = primary.status || "CONFIRMED";
      const proformaStagePercent = primary.proforma_stage_percent || 50;

      const isPaidInFull =
        paymentStatus === "PAID" ||
        ["FINAL_PAYMENT_COMPLETED", "COMPLETED", "HARD_COPY_DELIVERED", "SOFT_COPY_DELIVERED"].includes(status) ||
        (totalAmount > 0 && proformaPaidAmount >= totalAmount);

      const isPartiallyPaid =
        paymentStatus === "PARTIALLY_PAID" ||
        (proformaPaidAmount > 0 && proformaPaidAmount < totalAmount);

      const paidAmount = isPaidInFull
        ? totalAmount
        : proformaPaidAmount > 0
          ? proformaPaidAmount
          : isPartiallyPaid
            ? (totalAmount * proformaStagePercent) / 100
            : 0;

      const pendingAmount = isPaidInFull ? 0 : Math.max(0, totalAmount - paidAmount);

      return {
        orderNumber,
        primaryOrder: primary,
        items,
        consultants: primary.consultants || [],
        status,
        createdAt: primary.created_at,
        companyName: primary.company_name || activeCompany?.company_name || "Corporate Entity",
        totalAmount,
        customPriceText: primary.custom_price_text,
        paymentStatus,
        paidAmount,
        pendingAmount,
        isPaidInFull,
        isPartiallyPaid
      };
    });
  }, [filteredOrders, activeCompany]);

  // KPI Metrics Calculation
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter(o => !["COMPLETED", "HARD_COPY_DELIVERED", "CANCELLED"].includes(o.status)).length;
  const completedOrdersCount = orders.filter(o => ["COMPLETED", "HARD_COPY_DELIVERED"].includes(o.status)).length;
  const totalSettledAmount = orderGroups.reduce((sum, g) => sum + g.paidAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Minimalist Metrics Strip Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Orders */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Orders</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalOrdersCount}</p>
            </div>
          </div>

          {/* In Progress */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">In Progress</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{activeOrdersCount}</p>
            </div>
          </div>

          {/* Completed */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Completed</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{completedOrdersCount}</p>
            </div>
          </div>

          {/* Settled Value */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <CreditCard className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Settled Value</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {totalSettledAmount > 0 ? `IDR ${(totalSettledAmount / 1_000_000).toFixed(1)}M` : "IDR 0"}
              </p>
            </div>
          </div>
        </div>

        {/* Action / Context Badge */}
        {activeCompany && (
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl shadow-xs shrink-0">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Entity</p>
              <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{activeCompany.company_name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Card with Filter Bar */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardHeader className="p-4 sm:p-5 border-b border-border/40">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3 w-full md:w-auto">
              <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
                <SelectTrigger className="w-[180px] h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="ALL">All Orders ({orders.length})</SelectItem>
                  <SelectItem value="ACTIVE">
                    In Progress ({activeOrdersCount})
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    Completed ({completedOrdersCount})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative w-full md:w-[320px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders, services, consultants..."
                className="pl-9 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                  <TableHead className="w-[160px] pl-5">Order Reference</TableHead>
                  <TableHead>Service / Deliverable</TableHead>
                  <TableHead>Lead Consultant</TableHead>
                  <TableHead>Package Total</TableHead>
                  <TableHead>Paid / Settlement</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-5">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-32">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span className="text-xs text-muted-foreground">Loading orders directory...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orderGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-48 text-muted-foreground">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-25 text-emerald-500" />
                      <p className="font-bold text-sm text-foreground">No orders matching your criteria</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {searchTerm ? "Try refining your search keywords or clear filters." : "You currently have no registered orders."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  orderGroups.map(group => {
                    const statusConfig = STATUS_LABELS[group.status] || {
                      label: group.status,
                      color: "text-emerald-600 dark:text-emerald-400",
                      bg: "bg-emerald-500/10",
                      border: "border-emerald-500/20"
                    };

                    const consultant = group.consultants[0];

                    return (
                      <TableRow key={group.orderNumber} className="hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0 text-xs">
                        {/* Monospace Order Number Badge */}
                        <TableCell className="pl-5 font-mono font-bold text-xs whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2.5 py-1 rounded-lg">
                              {group.orderNumber}
                            </span>
                          </div>
                        </TableCell>

                        {/* Service Title */}
                        <TableCell>
                          <div className="font-bold text-sm leading-tight text-foreground">
                            {group.primaryOrder.job_title || "Corporate Consulting Service"}
                          </div>
                          {group.items.length > 1 && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                              <Layers className="h-3 w-3" />
                              <span>+{group.items.length - 1} bundled package(s)</span>
                            </div>
                          )}
                        </TableCell>

                        {/* Consultant */}
                        <TableCell>
                          {consultant ? (
                            <div className="flex items-center gap-2.5">
                              {consultant.profile_photo ? (
                                <img
                                  src={resolveImageUrl(consultant.profile_photo)}
                                  alt={consultant.name}
                                  className="h-8 w-8 rounded-full object-cover border border-emerald-500/30 shrink-0"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 shrink-0">
                                  {(consultant.name || "C")[0]}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-foreground truncate leading-tight">
                                  {consultant.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {consultant.job_title || "Lead Consultant"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Pending assignment
                            </span>
                          )}
                        </TableCell>

                        {/* Total Cost */}
                        <TableCell className="whitespace-nowrap">
                          {group.totalAmount > 0 ? (
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-xs text-foreground">
                                IDR {Number(group.totalAmount).toLocaleString("id-ID")}
                              </span>
                              {group.items.length > 1 && (
                                <span className="text-[10px] text-muted-foreground">
                                  Total ({group.items.length} services)
                                </span>
                              )}
                            </div>
                          ) : group.customPriceText ? (
                            <span className="text-xs font-medium text-foreground">{group.customPriceText}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Custom Quote</span>
                          )}
                        </TableCell>

                        {/* Paid / Pending Breakdown */}
                        <TableCell className="whitespace-nowrap">
                          {group.totalAmount > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Paid:</span>
                                <span className={`font-mono text-xs ${group.paidAmount > 0 ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground font-medium"}`}>
                                  IDR {Number(group.paidAmount).toLocaleString("id-ID")}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Pending:</span>
                                <span className={`font-mono text-xs ${group.pendingAmount > 0 ? "font-bold text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400 font-semibold"}`}>
                                  {group.pendingAmount > 0 ? `IDR ${Number(group.pendingAmount).toLocaleString("id-ID")}` : "IDR 0 (Settled)"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
                        </TableCell>

                        {/* Created Date */}
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {group.createdAt ? format(new Date(group.createdAt), "MMM d, yyyy") : "-"}
                        </TableCell>

                        {/* Status Badge Pill */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} text-[10px] font-bold px-2.5 py-0.5 rounded-full`}
                          >
                            {statusConfig.label}
                          </Badge>
                        </TableCell>

                        {/* Action Link */}
                        <TableCell className="text-right pr-5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs font-bold gap-1.5 rounded-xl shadow-xs"
                            asChild
                          >
                            <Link href={`/client/chat?order=${group.orderNumber}`}>
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span>Order Chat</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
