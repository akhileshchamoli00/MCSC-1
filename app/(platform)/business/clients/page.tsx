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
  LockOpen
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

export default function ClientList() {
  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

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
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
        headers: { "Authorization": `Bearer ${token}` }
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
    fetchClients();
  }, []);

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedClient) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${selectedClient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
    if (!token) return;
    setErrorMsg("");
    setSuccessMsg("");
    const newStatus = client.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${client.id}/status?status_str=${newStatus}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
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
    if (!token || !selectedClient) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${selectedClient.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm shrink-0 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Partner Directory</h1>
            <p className="text-muted-foreground text-sm">
              Manage partner companies, representative details, portal credentials, and upload logos.
            </p>
          </div>
        </div>

        {/* Create Client Link */}
        <Link href="/business/clients/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add New Partner
          </Button>
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Total Partners */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Total Partners</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{clients.length}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Active Panels */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Active Panels</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{clients.filter(c => c.status === "ACTIVE").length}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Corporate Entities */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              <Building className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Corporate Entities</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">
                {clients.reduce((acc, curr) => acc + (curr.companies?.length || 0), 0)}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Portal Accounts */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <LockOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Portal Credentials</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{clients.filter(c => c.user_id).length}</h3>
            </div>
          </CardContent>
        </Card>
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

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search company or contact person..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg self-end sm:self-auto">
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
      </div>

      {/* Clients Display Card */}
      <Card>
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 border-t">
              <Building className="h-10 w-10 text-muted-foreground/35" />
              <span className="text-sm font-semibold">No Clients Found</span>
            </div>
          ) : (
            <div className="overflow-x-auto border-t">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-4">Contact Representative</th>
                     <th className="p-4 min-w-[420px]">Associated Companies</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedClients.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                            {(client.contact_person || "").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-foreground font-semibold flex items-center gap-2">
                              <span>{client.contact_person}</span>
                              {client.client_code && (
                                <Badge variant="outline" className="font-mono text-xs font-bold bg-primary/10 border-primary/30 text-primary py-0.5 px-2">
                                  {client.client_code}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-primary/70" />
                              <span>{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-primary/70" />
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
                                 className="flex flex-col px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 shadow-xs text-left max-w-[160px] truncate"
                                 title={`${comp.company_name} (Code: ${comp.company_code})`}
                               >
                                 <span className="text-slate-900 dark:text-slate-100 font-bold text-xs truncate">
                                   {comp.company_name}
                                 </span>
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
                        <Badge
                          variant={client.status === "ACTIVE" ? "default" : "destructive"}
                          className="cursor-pointer"
                          onClick={() => handleToggleStatus(client)}
                        >
                          {client.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <Link href={`/clients/${client.id}/edit`}>
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
