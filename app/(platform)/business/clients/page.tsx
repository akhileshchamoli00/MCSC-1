"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Loader2,
  Building,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Settings,
  Lock,
  Camera,
  Edit2,
  Trash2,
  LockOpen,
  ShieldCheck,
  Clock
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
  DialogTrigger,
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";

export default function ClientList() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_all", "view");
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Authorization Check & Redirect
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to access Partners.");
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

  // Dialogs
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  // Selected Client
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [editForm, setEditForm] = useState({
    contact_person: "",
    email: "",
    phone: "",
    notes: "",
    date_of_birth: "",
    nationality: "",
    gender: "",
    identification_number: "",
    personal_address: ""
  });

  const [newPassword, setNewPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchClients = async () => {
    if (userLoading || !canView) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
      credentials: "include",
        });
      if (response.ok) {
        setClients(await response.json());
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && canView) {
      fetchClients();
    }
  }, [userLoading, canView]);

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${selectedClient.id}`, {
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update client");
      }

      setSuccessMsg("Client updated successfully");
      setIsEditOpen(false);
      fetchClients();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update client");
    }
  };

  const handleToggleStatus = async (client: any) => {
    setErrorMsg("");
    setSuccessMsg("");
    const newStatus = client.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${client.id}/status?status_str=${newStatus}`, {
      credentials: "include",
        method: "PUT",
        });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update client status");
      }

      setSuccessMsg(`Client status toggled to ${newStatus}`);
      fetchClients();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to toggle status");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${selectedClient.id}/password`, {
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ new_password: newPassword })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to reset password");
      }

      setSuccessMsg("Client portal password updated successfully");
      setIsPasswordOpen(false);
      setNewPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password");
    }
  };

  // Removed handleAddCompany (company creation is now dedicated)

  const filteredClients = clients.filter(c => {
    const contactPerson = c.contact_person || "";
    const email = c.email || "";
    const matchesSearch = contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.companies && c.companies.some((comp: any) => {
        const compName = comp.company_name || "";
        return compName.toLowerCase().includes(searchTerm.toLowerCase());
      }));

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredClients.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  if (userLoading || (!canView && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Verifying partner directory permissions...</p>
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
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Partners */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Partners</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{clients.length}</p>
            </div>
          </div>

          {/* Active Panels */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Active Panels</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{clients.filter(c => c.status === "ACTIVE").length}</p>
            </div>
          </div>

          {/* Corporate Entities */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Building className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Corporate Entities</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{clients.reduce((acc, curr) => acc + (curr.companies?.length || 0), 0)}</p>
            </div>
          </div>

          {/* Portal Credentials */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <LockOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Portal Credentials</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{clients.filter(c => c.user_id).length}</p>
            </div>
          </div>
        </div>

        {/* Add New Partner Button */}
        <Link href="/business/clients/new" className="shrink-0 flex items-stretch">
          <Button className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm">
            <Plus className="h-4 w-4" /> Add New Partner
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
              placeholder="Search company or contact person..."
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
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all
                    ${statusFilter === statusOpt
                      ? "bg-background shadow text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {statusOpt}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold hidden md:inline-block">
              Showing {paginatedClients.length} of {filteredClients.length} entries
            </span>
          </div>
        </div>

        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Building className="h-10 w-10 text-muted-foreground/35" />
              <span className="text-sm font-semibold">No Clients Found</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-4">Contact Representative</th>
                     <th className="p-4 min-w-[420px]">Associated Companies</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedClients.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs shrink-0">
                            {(client.contact_person || "").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-foreground font-semibold flex items-center gap-2">
                              <span>{client.contact_person}</span>
                              {client.client_code && (
                                <span className="font-mono text-[11px] font-bold bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 py-0.5 px-2 rounded-md">
                                  {client.client_code}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                              <Mail className="h-3 w-3 opacity-70" />
                              <span>{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Phone className="h-3 w-3 opacity-70" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                       <td className="p-4 font-semibold text-foreground min-w-[320px]">
                         <div className="flex flex-wrap gap-1.5 max-w-[450px]">
                           {client.companies && client.companies.length > 0 ? (
                             client.companies.map((comp: any) => (
                               <div
                                 key={comp.id}
                                 className="flex flex-col px-2.5 py-1 rounded-xl bg-background/60 border border-border/40 shadow-xs text-left max-w-[180px]"
                                 title={`${comp.company_name} (${comp.validation_status === "VALIDATED" ? "Verified" : "Pending Review"})`}
                               >
                                 <div className="flex items-center gap-1">
                                   <span className="text-foreground font-bold text-xs truncate">
                                     {comp.company_name}
                                   </span>
                                   {comp.validation_status === "VALIDATED" ? (
                                      <span title="Verified Profile" className="inline-flex">
                                        <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                                      </span>
                                    ) : (
                                      <span title="Pending Admin Validation" className="inline-flex">
                                        <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                                      </span>
                                    )}
                                 </div>
                                 <span className="text-[10px] text-muted-foreground font-mono font-semibold truncate mt-0.5">
                                   {comp.company_code}
                                 </span>
                               </div>
                             ))
                           ) : (
                             <span className="text-muted-foreground italic font-normal text-xs">No companies linked</span>
                           )}
                         </div>
                       </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(client)}
                          className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                            client.status === "ACTIVE"
                              ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-zinc-500/10 dark:bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20"
                          }`}
                          title="Click to toggle operational status"
                        >
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${client.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                          {client.status === "ACTIVE" ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <Link href={`/business/clients/${client.id}/edit`}>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Edit Client"
                          >
                            <Edit2 className="h-4 w-4 text-slate-500 hover:text-foreground" />
                          </Button>
                        </Link>

                        <Button
                          size="icon"
                          variant="ghost"
                          title="Reset Password"
                          onClick={() => {
                            setSelectedClient(client);
                            setIsPasswordOpen(true);
                          }}
                        >
                          <Lock className="h-4 w-4 text-slate-500 hover:text-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(filteredClients.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{filteredClients.length}</span> entries
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
        </CardContent>
      </Card>



      {/* Password Reset Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Portal Password</DialogTitle>
            <DialogDescription>
              Assign a new login password for {selectedClient?.contact_person}'s portal access.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold">New Password</label>
              <Input
                type="password"
                required
                placeholder="Enter strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Reset Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Company Dialog Removed */}

    </div>
  );
}
