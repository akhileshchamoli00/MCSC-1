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
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
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

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchClients = async () => {
    if (!token) return;
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients Directory</h1>
          <p className="text-muted-foreground text-sm">
            Manage partner companies, representative details, portal credentials, and upload logos.
          </p>
        </div>
        
        {/* Create Client Link */}
        <Link href="/clients/new">
          <Button className="flex items-center gap-2">
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
        <CardHeader className="pb-3">
          <CardTitle>Partner Directory</CardTitle>
          <CardDescription>View, edit, toggle status, and change portal passwords.</CardDescription>
        </CardHeader>
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
                    <th className="p-4">Associated Companies</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                            {(client.contact_person || "").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-foreground font-semibold">
                              <span>{client.contact_person}</span>
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
                      <td className="p-4 font-semibold text-foreground">
                        <div className="flex flex-col gap-2 max-w-xs">
                          {client.companies && client.companies.length > 0 ? (
                            client.companies.map((comp: any) => (
                              <div 
                                key={comp.id} 
                                className="flex flex-col p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 shadow-xs"
                              >
                                <span className="text-slate-900 dark:text-slate-100 font-semibold">{comp.company_name}</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                                  Code: <span className="font-mono text-slate-700 dark:text-slate-300">{comp.company_code}</span>
                                  {comp.industry && ` • ${comp.industry}`}
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
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          title="Edit Client"
                          onClick={() => {
                            setSelectedClient(client);
                            setEditForm({
                              contact_person: client.contact_person || "",
                              email: client.email || "",
                              phone: client.phone || "",
                              notes: client.notes || "",
                              date_of_birth: client.date_of_birth || "",
                              nationality: client.nationality || "",
                              gender: client.gender || "",
                              identification_number: client.identification_number || "",
                              personal_address: client.personal_address || ""
                            });
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4 text-slate-500 hover:text-foreground" />
                        </Button>

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
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client Personal Details</DialogTitle>
            <DialogDescription>
              Update profile and personal details for this client representative.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditClient} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Contact Name *</label>
                <Input
                  required
                  value={editForm.contact_person}
                  onChange={(e) => setEditForm({...editForm, contact_person: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Email *</label>
                <Input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Phone Number</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Date of Birth</label>
                <Input
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Nationality</label>
                <Input
                  placeholder="e.g. Indonesian, American"
                  value={editForm.nationality}
                  onChange={(e) => setEditForm({...editForm, nationality: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Gender</label>
                <Select 
                  value={editForm.gender} 
                  onValueChange={(val) => setEditForm({...editForm, gender: val})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Identification / Passport Number</label>
                <Input
                  placeholder="ID Card or Passport No."
                  value={editForm.identification_number}
                  onChange={(e) => setEditForm({...editForm, identification_number: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Notes</label>
                <Input
                  placeholder="Operational notes..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold">Personal Address</label>
                <textarea
                  value={editForm.personal_address}
                  onChange={(e) => setEditForm({...editForm, personal_address: e.target.value})}
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Representative's residential address"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
