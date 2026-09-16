"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Search,
  Plus,
  Loader2,
  Building,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Link as LinkIcon,
  Unlink,
  ShoppingBag,
  ExternalLink,
  Lock,
  LockOpen,
  KeyRound,
  ShieldCheck,
  Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";

interface CustomerData {
  id: number;
  customer_code: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  gender?: string;
  identification_number?: string;
  address?: string;
  status: string;
  notes?: string;
  user_id?: number;
  company_id?: number;
  created_at: string;
  company?: {
    id: number;
    company_name: string;
    company_code: string;
  };
  companies?: Array<{
    id: number;
    company_name: string;
    company_code: string;
  }>;
  orders_count: number;
  active_orders_count: number;
}

interface CompanyOption {
  id: number;
  company_name: string;
  company_code: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_all", "view");

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialogs
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [selectedLinkCompanyId, setSelectedLinkCompanyId] = useState("NONE");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Authorization Check
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to access Clients.");
      if (hasPermission("clients_my", "view")) {
        router.replace("/business/assigned-orders");
      } else {
        router.replace("/business/dashboard");
      }
    }
  }, [userLoading, canView, hasPermission, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Fetch Clients & Companies
  const fetchData = async () => {
    if (userLoading || !canView) return;
    try {
      setLoading(true);
      const [custRes, compRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers`, {
          credentials: "include"
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies`, {
          credentials: "include"
        })
      ]);

      if (custRes.ok) {
        const data = await custRes.json();
        setCustomers(data);
      }
      if (compRes.ok) {
        const data = await compRes.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
      setErrorMsg("Failed to load clients data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && canView) {
      fetchData();
    }
  }, [userLoading, canView]);

  // Filtered list
  const filteredCustomers = customers.filter((cust) => {
    const matchesStatus =
      statusFilter === "ALL" || cust.status.toUpperCase() === statusFilter.toUpperCase();
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      cust.full_name?.toLowerCase().includes(s) ||
      cust.email?.toLowerCase().includes(s) ||
      cust.customer_code?.toLowerCase().includes(s) ||
      cust.phone?.toLowerCase().includes(s) ||
      cust.company?.company_name?.toLowerCase().includes(s) ||
      cust.company?.company_code?.toLowerCase().includes(s) ||
      cust.companies?.some(
        (c) =>
          c.company_name?.toLowerCase().includes(s) ||
          c.company_code?.toLowerCase().includes(s)
      );

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle Status Handler
  const handleToggleStatus = async (customer: CustomerData) => {
    setErrorMsg("");
    setSuccessMsg("");
    const newStatus = customer.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/${customer.id}/status?status_str=${newStatus}`,
        {
          method: "PUT",
          credentials: "include"
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update client status");
      }

      setSuccessMsg(`Client status toggled to ${newStatus}`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to toggle status");
    }
  };

  // Reset Password Handler
  const handleOpenPassword = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setNewPassword("");
    setErrorMsg("");
    setSuccessMsg("");
    setIsPasswordOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/${selectedCustomer.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ new_password: newPassword })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to reset password");
      }

      setSuccessMsg("Client portal password updated successfully");
      setIsPasswordOpen(false);
      setNewPassword("");
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password");
    }
  };

  // Link Company Handler
  const handleOpenLink = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setSelectedLinkCompanyId(customer.company_id ? customer.company_id.toString() : "NONE");
    setErrorMsg("");
    setSuccessMsg("");
    setIsLinkOpen(true);
  };

  const handleLinkCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || selectedLinkCompanyId === "NONE") return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/${selectedCustomer.id}/link-company?company_id=${selectedLinkCompanyId}`,
        {
          method: "POST",
          credentials: "include"
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to link company");
      }

      setSuccessMsg("Company linked to client successfully!");
      setIsLinkOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to link company");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Customer Handler
  const handleOpenDelete = (customer: CustomerData) => {
    setCustomerToDelete(customer);
    setErrorMsg("");
    setSuccessMsg("");
    setIsDeleteOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/${customerToDelete.id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to delete client");
      }

      toast.success(`Client ${customerToDelete.full_name} (${customerToDelete.customer_code}) deleted successfully`);
      setSuccessMsg("Client deleted successfully");
      setIsDeleteOpen(false);
      setCustomerToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete client");
      setErrorMsg(err.message || "Failed to delete client");
    } finally {
      setDeleting(false);
    }
  };

  if (userLoading || (!canView && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Verifying client directory permissions...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Minimalist Metrics Strip & Action Button Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Clients */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Clients</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{customers.length}</p>
            </div>
          </div>

          {/* Active Accounts */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Active Accounts</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{customers.filter((c) => c.status === "ACTIVE").length}</p>
            </div>
          </div>

          {/* Corporate Entities */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <Building className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Corporate Entities</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {customers.reduce((acc, curr) => acc + (curr.companies?.length || (curr.company_id ? 1 : 0)), 0)}
              </p>
            </div>
          </div>

          {/* Portal Credentials */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <LockOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Portal Credentials</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{customers.filter((c) => c.user_id).length}</p>
            </div>
          </div>
        </div>

        {/* Add New Client Button - Dedicated Independent Page */}
        <Link href="/business/clients/new" className="shrink-0 flex items-stretch">
          <Button className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm">
            <Plus className="h-4 w-4" /> Add New Client
          </Button>
        </Link>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-xs font-medium">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/25 text-destructive p-3 rounded-lg text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Clients Display Card */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md">
        <div className="p-4 bg-muted/10 border-b border-border/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client name, email, code, or company..."
              className="pl-8 h-9 text-xs rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              {["ALL", "ACTIVE", "DISABLED"].map((statusOpt) => (
                <button
                  key={statusOpt}
                  onClick={() => setStatusFilter(statusOpt)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                    statusFilter === statusOpt
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {statusOpt}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold hidden md:inline-block">
              Showing {paginatedCustomers.length} of {filteredCustomers.length} entries
            </span>
          </div>
        </div>

        <CardContent className="p-0">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <UserCheck className="h-8 w-8 mx-auto opacity-30 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">No clients found</p>
              <p className="text-xs">
                {searchTerm || statusFilter !== "ALL"
                  ? "Try adjusting your search criteria or filter settings."
                  : "Get started by adding your first registered client profile."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-4">Client Representative</th>
                    <th className="p-4 min-w-[420px]">Associated Companies</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedCustomers.map((customer) => {
                    const linkedComps =
                      customer.companies && customer.companies.length > 0
                        ? customer.companies
                        : customer.company
                        ? [customer.company]
                        : [];

                    return (
                      <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                        {/* Customer Representative Details */}
                        <td className="p-4 text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2.5">
                            <Link
                              href={`/business/clients/${customer.id}/edit`}
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold shadow-xs shrink-0 hover:bg-blue-500/20 transition-colors"
                              title="Edit customer details"
                            >
                              {(customer.full_name || "CU").substring(0, 2).toUpperCase()}
                            </Link>
                            <div>
                              <div className="text-foreground font-semibold flex items-center gap-2">
                                <Link
                                  href={`/business/clients/${customer.id}/edit`}
                                  className="hover:text-primary transition-colors hover:underline"
                                >
                                  {customer.full_name}
                                </Link>
                                {customer.customer_code && (
                                  <span className="font-mono text-[11px] font-bold bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 py-0.5 px-2 rounded-md">
                                    {customer.customer_code}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                <Mail className="h-3 w-3 opacity-70" />
                                <span>{customer.email}</span>
                              </div>
                              {customer.phone && (
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <Phone className="h-3 w-3 opacity-70" />
                                  <span>{customer.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Associated Companies */}
                        <td className="p-4 font-semibold text-foreground min-w-[320px]">
                          <div className="flex flex-wrap gap-1.5 max-w-[450px]">
                            {linkedComps.length > 0 ? (
                              linkedComps.map((comp) => (
                                <div
                                  key={comp.id}
                                  className="group/item flex items-center gap-2 bg-card/80 border border-border/60 hover:border-primary/40 rounded-lg py-1 px-2.5 transition-all shadow-2xs hover:shadow-xs"
                                >
                                  <Link
                                    href={`/business/clients/companies?search=${encodeURIComponent(comp.company_code || comp.company_name)}`}
                                    className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors text-xs font-semibold"
                                  >
                                    <Building2 className="h-3 w-3 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                    <span>{comp.company_name}</span>
                                    {comp.company_code && (
                                      <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded font-normal">
                                        {comp.company_code}
                                      </span>
                                    )}
                                  </Link>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground font-normal italic text-[11px]">No company linked</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenLink(customer)}
                                  className="h-6 px-2 text-[10px] rounded-md text-primary hover:bg-primary/10 border-primary/20"
                                >
                                  <LinkIcon className="h-2.5 w-2.5 mr-1" />
                                  Link Company
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(customer)}
                            className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                              customer.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20"
                            }`}
                            title="Click to toggle status"
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                                customer.status === "ACTIVE" ? "bg-emerald-500" : "bg-zinc-500"
                              }`}
                            />
                            {customer.status === "ACTIVE" ? "Active" : "Disabled"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/business/clients/${customer.id}/edit`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg gap-1.5"
                                title="Edit client profile"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                            </Link>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg gap-1.5"
                              onClick={() => handleOpenPassword(customer)}
                              title="Reset portal password"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Password</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                              onClick={() => handleOpenDelete(customer)}
                              title="Delete client"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {filteredCustomers.length > 0 && (
            <div className="p-4 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="h-7 text-xs rounded-lg"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-7 text-xs rounded-lg"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-primary" />
              Reset Portal Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Set a new login password for <span className="font-semibold text-foreground">{selectedCustomer?.full_name}</span> ({selectedCustomer?.email}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">New Password *</Label>
              <Input
                type="password"
                placeholder="Enter new password (8+ chars, uppercase, lowercase, digit)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 h-9 text-sm font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPasswordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!newPassword}>
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Company Dialog */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <LinkIcon className="h-5 w-5 text-primary" />
              Link Company to Client
            </DialogTitle>
            <DialogDescription className="text-xs">
              Link a company to <span className="font-semibold text-foreground">{selectedCustomer?.full_name}</span> ({selectedCustomer?.customer_code}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLinkCompany} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Select Company *</Label>
              <Select
                value={selectedLinkCompanyId}
                onValueChange={setSelectedLinkCompanyId}
              >
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue placeholder="Choose a registered company..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="NONE">-- Select Company --</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.company_name} ({c.company_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsLinkOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={selectedLinkCompanyId === "NONE" || submitting}>
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Confirm Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Delete Client Record</DialogTitle>
                <DialogDescription className="text-xs">
                  Permanently remove this client and unbind linked records.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-2 text-xs space-y-2">
            <p className="text-foreground leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-foreground">{customerToDelete?.full_name}</span> (Code: <span className="font-mono font-semibold">{customerToDelete?.customer_code}</span>)?
            </p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              This will unlink the client profile from associated company orders and remove their portal authentication login. This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="font-semibold text-xs h-9 rounded-xl"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteCustomer}
              disabled={deleting}
              className="font-bold text-xs h-9 gap-1.5 rounded-xl"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {deleting ? "Deleting..." : "Delete Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
