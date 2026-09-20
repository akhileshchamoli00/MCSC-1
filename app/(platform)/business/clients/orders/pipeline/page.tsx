"use client";

import React, { useState, useEffect } from "react";
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
  DollarSign, 
  Loader2, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ArrowRightCircle,
  FileText,
  Briefcase,
  Layers,
  Scale,
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);

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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMoveToActiveOpen, setIsMoveToActiveOpen] = useState(false);
  const [movingOrder, setMovingOrder] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    if (userLoading || !canView) return;

    try {
      setLoading(true);
      const [ordersRes, compRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
      credentials: "include",
          }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies`, {
      credentials: "include",
          })
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data);
      }
      if (compRes.ok) {
        const compData = await compRes.json();
        setCompanies(compData);
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

  // Filter ONLY PIPELINE orders
  const pipelineOrders = groupedOrders.filter((ord) => (ord.status || "").toUpperCase() === "PIPELINE");

  const filteredOrders = pipelineOrders.filter((ord) => {
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
  const totalOrdersCount = pipelineOrders.length;
  const totalEstimatedValue = pipelineOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const uniqueEntitiesCount = new Set(pipelineOrders.map((o) => o.company_id || o.company_name || o.client_id)).size;
  const totalServicesCount = pipelineOrders.reduce((acc, curr) => acc + (curr.items?.length || 1), 0);

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val || 0);
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
        <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
          {/* Minimalist Metric Strip - Expanded Horizontally */}
          <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
            
            {/* Pipeline Orders */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
                <GitBranch className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Pipeline Deals</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalOrdersCount}</p>
              </div>
            </div>

            {/* Est. Pipeline Value */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <DollarSign className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Est. Pipeline Value</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(totalEstimatedValue)}</p>
              </div>
            </div>

            {/* Corporate Entities */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Corporate Entities</p>
                <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{uniqueEntitiesCount}</p>
              </div>
            </div>

            {/* Scope Line Items */}
            <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
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
            <Button className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm">
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
                        <th className="p-4">Order ID</th>
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
                            #{startIndex + index + 1}
                          </td>
                          <td className="p-4 align-top pt-5">
                            {ord.company_id ? (
                              <Link href={`/business/clients/documents/${ord.company_id}?from=pipeline`}>
                                <Badge
                                  variant="outline"
                                  className="font-mono font-bold text-xs bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 cursor-pointer transition-colors"
                                  title="Go to Company Documents Folder"
                                >
                                  {ord.order_number}
                                </Badge>
                              </Link>
                            ) : (
                              <Badge variant="outline" className="font-mono font-bold text-xs bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
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
                          <td className="p-4 text-right font-mono font-bold text-sm text-foreground align-top pt-5">
                            {formatCurrency(ord.total_amount)}
                          </td>
                          <td className="p-4 text-center align-top pt-5">
                            <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-bold border text-[11px]">
                              PIPELINE
                            </Badge>
                          </td>
                          <td className="p-4 text-right space-x-1.5 align-top pt-5 whitespace-nowrap">
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
                              onClick={() => router.push(`/business/clients/orders/${ord.order_number}/edit`)}
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
                <div className="p-4 border-t border-border/30 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
                    <span className="font-medium text-foreground">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
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

              {/* Designated Reviewer (if any) */}
              {selectedOrderGroup.reviewer && (
                <div>
                  <h4 className="font-bold text-xs text-foreground mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Designated Order Reviewer
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold flex items-center gap-1.5 py-1 px-2.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                      {selectedOrderGroup.reviewer.name}
                      <span className="text-[10px] text-muted-foreground ml-1">({selectedOrderGroup.reviewer.job_title || "Reviewer"})</span>
                    </Badge>
                  </div>
                </div>
              )}

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
              onClick={() => {
                setIsViewOpen(false);
                router.push(`/business/clients/orders/${selectedOrderGroup?.order_number}/edit`);
              }}
              className="font-bold text-xs h-9 gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" /> Edit Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
