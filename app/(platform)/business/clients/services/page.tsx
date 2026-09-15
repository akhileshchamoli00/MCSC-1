"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Search, 
  Plus, 
  Loader2, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  DollarSign, 
  Percent, 
  Check, 
  Building2,
  Tag,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";

export default function ClientServicesPage() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_services", "view") || hasPermission("clients_services", "read");
  const canCreate = isAdmin || hasPermission("clients_services", "create");
  const canEdit = isAdmin || hasPermission("clients_services", "edit");
  const canDelete = isAdmin || hasPermission("clients_services", "delete");

  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("You do not have permission to view the service catalog & price list.");
      router.push("/business/dashboard");
    }
  }, [userLoading, canView, router]);

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Modals
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, {
      credentials: "include",
        });
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      } else {
        toast.error("Failed to load service catalog");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching service catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDeleteSubmit = async () => {
    if (!selectedService) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog/${selectedService.id}`, {
      credentials: "include",
        method: "DELETE",
        });
      if (res.ok) {
        toast.success("Service entry deleted");
        setIsDeleteOpen(false);
        fetchServices();
      } else {
        toast.error("Failed to delete service entry");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting service entry");
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = services.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.job_id || "").toLowerCase().includes(term) ||
      (s.job_title || "").toLowerCase().includes(term) ||
      (s.description || "").toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredServices.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
  };

  if (loading || userLoading || !canView) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Verifying authorization & loading catalog...</p>
      </div>
    );
  }

  const totalServicesCount = services.length;
  const avgBasePrice = totalServicesCount > 0 
    ? services.reduce((acc, curr) => acc + (curr.base_price || 0), 0) / totalServicesCount 
    : 0;
  const paidServicesCount = services.filter(s => (s.base_price || 0) > 0).length;
  const maxBasePrice = totalServicesCount > 0 
    ? Math.max(...services.map(s => s.base_price || 0)) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-none pb-12">
      
      {/* Minimalist Metrics Strip & Action Button Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Services */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Tag className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Services</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalServicesCount}</p>
            </div>
          </div>

          {/* Average Base Price */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Avg Base Price</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(avgBasePrice)}</p>
            </div>
          </div>

          {/* Paid Offerings */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Paid Offerings</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{paidServicesCount}</p>
            </div>
          </div>

          {/* Max Service Price */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Max Base Price</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{formatCurrency(maxBasePrice)}</p>
            </div>
          </div>
        </div>

        {/* Add New Service Button */}
        {canCreate && (
          <Link href="/business/clients/services/new" className="shrink-0 flex items-stretch">
            <Button className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm">
              <Plus className="h-4 w-4" /> Add New Service
            </Button>
          </Link>
        )}
      </div>

      {/* Main Services Table Card */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <div className="p-4 bg-muted/20 border-b border-border/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Job ID, Title or Description..."
              className="pl-8 h-9 text-xs rounded-xl bg-background/70 border-border/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider">
            Showing {paginatedServices.length} of {filteredServices.length} offerings
          </span>
        </div>
        
        <CardContent className="p-0">
          {filteredServices.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 border-t">
              <Tag className="h-10 w-10 text-muted-foreground/35" />
              <span className="text-sm font-semibold">No Services Found</span>
              <p className="text-xs max-w-sm">
                {canCreate ? 'Click "Add New Service" above to add your first job offering to the service catalog database.' : 'No service catalog offerings available.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-4 w-12 text-center">No.</th>
                    <th className="p-4">Job ID</th>
                    <th className="p-4">Job Title</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Base Price</th>
                    <th className="p-4 text-right">Partner A (20% Off)</th>
                    <th className="p-4 text-right">Partner A1 (40% Off)</th>
                    <th className="p-4 text-right">Partner A2 (50% Off)</th>
                    <th className="p-4 text-right">Partner A3 (Free Text)</th>
                    {(canEdit || canDelete) && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedServices.map((service, index) => (
                    <tr key={service.id} className="hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0">
                      <td className="p-4 text-center font-mono font-medium text-muted-foreground">
                        #{startIndex + index + 1}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2 py-0.5 rounded-md">
                          {service.job_id}
                        </Badge>
                      </td>
                      <td className="p-4 font-bold text-foreground text-sm">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span>{service.job_title}</span>
                          {service.needs_notary && (
                            <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border-indigo-500/20 text-[9px] px-1.5 py-0.5 shrink-0">
                              NOTARY
                            </Badge>
                          )}
                          {service.needs_gov_officer && (
                            <Badge variant="secondary" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border-sky-500/20 text-[9px] px-1.5 py-0.5 shrink-0">
                              GOV BODY
                            </Badge>
                          )}
                          {service.needs_other_vendors && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-emerald-500/20 text-[9px] px-1.5 py-0.5 shrink-0">
                              OTHER VENDORS
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground whitespace-pre-wrap break-words max-w-md leading-relaxed text-xs">
                        {service.description || "-"}
                      </td>
                      <td className="p-4 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(service.base_price)}
                      </td>
                      <td className="p-4 text-right font-mono">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(service.partner_a_price)}
                        </div>
                        <span className="text-[10px] text-muted-foreground">(-{service.partner_a_discount}%)</span>
                      </td>
                      <td className="p-4 text-right font-mono">
                        <div className="font-semibold text-purple-600 dark:text-purple-400">
                          {formatCurrency(service.partner_a1_price)}
                        </div>
                        <span className="text-[10px] text-muted-foreground">(-{service.partner_a1_discount}%)</span>
                      </td>
                      <td className="p-4 text-right font-mono">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(service.partner_a2_price)}
                        </div>
                        <span className="text-[10px] text-muted-foreground">(-{service.partner_a2_discount}%)</span>
                      </td>
                      <td className="p-4 text-right font-mono">
                        <div className="font-semibold text-amber-600 dark:text-amber-400">
                          {service.partner_a3_price && !isNaN(parseFloat(service.partner_a3_price))
                            ? formatCurrency(parseFloat(service.partner_a3_price))
                            : service.partner_a3_price || "-"}
                        </div>
                        <span className="text-[10px] text-muted-foreground">(Special Price)</span>
                      </td>
                      {(canEdit || canDelete) && (
                        <td className="p-4 text-right space-x-1">
                          {canEdit && (
                            <Link href={`/business/clients/services/${service.id}/edit`}>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Edit Service"
                              >
                                <Edit2 className="h-4 w-4 text-slate-500 hover:text-foreground" />
                              </Button>
                            </Link>
                          )}
                          {canDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Delete Service"
                              onClick={() => {
                                setSelectedService(service);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                            </Button>
                          )}
                        </td>
                      )}
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
                  <span className="font-medium text-foreground">{Math.min(filteredServices.length, endIndex)}</span> of{" "}
                  <span className="font-medium text-foreground">{filteredServices.length}</span> entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 text-xs font-bold rounded-lg"
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
                    className="h-8 text-xs font-bold rounded-lg"
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

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Delete Service Entry</DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Are you sure you want to delete <span className="font-bold text-foreground">{selectedService?.job_id} - {selectedService?.job_title}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl h-10 px-4 font-bold" 
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="rounded-xl h-10 px-4 font-bold" 
              onClick={handleDeleteSubmit} 
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
