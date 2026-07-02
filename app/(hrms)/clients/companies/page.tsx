"use client";

import React, { useEffect, useState } from "react";
import { 
  Building, 
  Search, 
  Plus, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  CheckCircle, 
  XCircle, 
  User, 
  ArrowLeft,
  Building2 
} from "lucide-react";
import Link from "next/link";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function CompaniesDirectory() {
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // Form states
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [useClientRep, setUseClientRep] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    company_code: "",
    industry: "",
    tax_number: "",
    address: "",
    key_contact_person: "",
    key_contact_email: "",
    key_contact_phone: "",
    status: "ACTIVE"
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchData = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const clientsData = await response.json();
        setClients(clientsData);

        // Flatten companies and preserve client rep info
        const flattened = clientsData.flatMap((client: any) => 
          (client.companies || []).map((company: any) => ({
            ...company,
            client: {
              id: client.id,
              contact_person: client.contact_person,
              email: client.email,
              phone: client.phone
            }
          }))
        );
        setCompanies(flattened);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Autofill representative logic
  useEffect(() => {
    if (useClientRep && selectedClientId) {
      const parentClient = clients.find(c => c.id.toString() === selectedClientId);
      if (parentClient) {
        setCompanyForm(prev => ({
          ...prev,
          key_contact_person: parentClient.contact_person || "",
          key_contact_email: parentClient.email || "",
          key_contact_phone: parentClient.phone || ""
        }));
      }
    }
  }, [useClientRep, selectedClientId, clients]);

  // Removed handleOpenAdd (creation is now on a dedicated page)

  const handleOpenEdit = (comp: any) => {
    setErrorMsg("");
    setSuccessMsg("");
    setSelectedCompany(comp);
    setSelectedClientId(comp.client.id.toString());
    
    // Check if key contact details match client representative details
    const isRep = comp.key_contact_person === comp.client.contact_person &&
                  comp.key_contact_email === comp.client.email &&
                  (comp.key_contact_phone || "") === (comp.client.phone || "");
                  
    setUseClientRep(isRep);
    setCompanyForm({
      company_name: comp.company_name || "",
      company_code: comp.company_code || "",
      industry: comp.industry || "",
      tax_number: comp.tax_number || "",
      address: comp.address || "",
      key_contact_person: comp.key_contact_person || "",
      key_contact_email: comp.key_contact_email || "",
      key_contact_phone: comp.key_contact_phone || "",
      status: comp.status || "ACTIVE"
    });
    setIsEditOpen(true);
  };

  // Removed handleCreateCompany (handled on dedicated page)

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCompany) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${selectedCompany.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(companyForm)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update company");
      }

      setSuccessMsg("Company details updated successfully!");
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update company");
    }
  };

  const handleToggleCompanyStatus = async (comp: any) => {
    if (!token) return;
    setErrorMsg("");
    setSuccessMsg("");
    const newStatus = comp.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    const payload = {
      company_name: comp.company_name,
      company_code: comp.company_code,
      industry: comp.industry || "",
      tax_number: comp.tax_number || "",
      address: comp.address || "",
      key_contact_person: comp.key_contact_person || "",
      key_contact_email: comp.key_contact_email || "",
      key_contact_phone: comp.key_contact_phone || "",
      status: newStatus
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${comp.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update company status");
      }

      setSuccessMsg(`Company status toggled to ${newStatus}`);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to toggle status");
    }
  };

  const filteredCompanies = companies.filter(c => {
    const name = c.company_name || "";
    const code = c.company_code || "";
    const ind = c.industry || "";
    const contact = c.key_contact_person || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ind.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contact.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCompanies.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

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
        <div className="flex items-start gap-4">
          <Link href="/clients" className="mt-1">
            <Button variant="ghost" size="icon" title="Back to Clients">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Company Directory</h1>
            <p className="text-muted-foreground text-sm">
              Manage corporate partner profiles, registered codes, and associate custom key contacts.
            </p>
          </div>
        </div>
        
        <Link href="/clients/companies/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add New Company
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
            placeholder="Search name, code, contact or industry..."
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

      {/* Companies Display Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Company Directory</CardTitle>
          <CardDescription>View, edit, toggle status, and manage client corporate partners.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCompanies.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 border-t">
              <Building2 className="h-10 w-10 text-muted-foreground/35" />
              <span className="text-sm font-semibold">No Companies Found</span>
            </div>
          ) : (
            <div className="overflow-x-auto border-t">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-4">Company Profile</th>
                    <th className="p-4">Parent Client</th>
                    <th className="p-4">Key Contact</th>
                    <th className="p-4">Tax & Location</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedCompanies.map((company) => {
                    const isRep = company.key_contact_person === company.client?.contact_person &&
                                  company.key_contact_email === company.client?.email &&
                                  (company.key_contact_phone || "") === (company.client?.phone || "");
                    
                    return (
                      <tr key={company.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            {company.logo_url ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}${company.logo_url}`}
                                alt={company.company_name}
                                className="h-10 w-10 rounded-lg object-cover border border-white/10 shadow bg-background animate-in fade-in zoom-in-95 duration-200"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold">
                                {company.company_name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="text-foreground font-semibold">
                                <span>{company.company_name}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                Code: <span className="font-mono text-foreground font-medium">{company.company_code}</span>
                                {company.industry && (
                                  <>
                                    <span>•</span>
                                    <span>{company.industry}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground space-y-1">
                          {company.client ? (
                            <>
                              <div className="text-foreground font-semibold flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                <span>{company.client.contact_person}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <Mail className="h-3 w-3 opacity-70" />
                                <span>{company.client.email}</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground italic font-normal text-xs">No Representative</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground space-y-1">
                          {company.key_contact_person ? (
                            <>
                              <div className="text-foreground font-semibold flex items-center gap-1">
                                <span>{company.key_contact_person}</span>
                                {isRep && (
                                  <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 bg-primary/10 text-primary border-none font-bold">REP</Badge>
                                )}
                              </div>
                              {company.key_contact_email && (
                                <div className="flex items-center gap-1.5 text-[10px] truncate max-w-[150px]">
                                  <Mail className="h-3 w-3 opacity-70" />
                                  <span className="truncate">{company.key_contact_email}</span>
                                </div>
                              )}
                              {company.key_contact_phone && (
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <Phone className="h-3 w-3 opacity-70" />
                                  <span>{company.key_contact_phone}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground italic font-normal text-xs">Not configured</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground space-y-1">
                          {company.tax_number && (
                            <div className="text-[11px]">
                              Tax ID: <span className="font-mono text-foreground font-semibold">{company.tax_number}</span>
                            </div>
                          )}
                          {company.address && (
                            <div className="flex items-start gap-1 text-[11px] max-w-[180px]" title={company.address}>
                              <MapPin className="h-3 w-3 opacity-70 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{company.address}</span>
                            </div>
                          )}
                          {!company.tax_number && !company.address && (
                            <span className="text-muted-foreground italic font-normal text-xs">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant={company.status === "ACTIVE" ? "default" : "destructive"}
                            className="cursor-pointer"
                            onClick={() => handleToggleCompanyStatus(company)}
                          >
                            {company.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            title="Edit Company"
                            onClick={() => handleOpenEdit(company)}
                          >
                            <Edit2 className="h-4 w-4 text-slate-500 hover:text-foreground" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(filteredCompanies.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{filteredCompanies.length}</span> entries
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

      {/* Edit Company Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company Profile</DialogTitle>
            <DialogDescription>
              Update corporate details, operational status, and key contact settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCompany} className="space-y-4">
            <div className="grid gap-4">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Company Name *</label>
                  <Input
                    required
                    value={companyForm.company_name}
                    onChange={(e) => setCompanyForm({...companyForm, company_name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Company Code * (Username)</label>
                  <Input
                    required
                    value={companyForm.company_code}
                    onChange={(e) => setCompanyForm({...companyForm, company_code: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Industry</label>
                  <Input
                    value={companyForm.industry}
                    onChange={(e) => setCompanyForm({...companyForm, industry: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Tax ID / NPWP</label>
                  <Input
                    value={companyForm.tax_number}
                    onChange={(e) => setCompanyForm({...companyForm, tax_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Registered Address</label>
                  <Input
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Operational Status</label>
                  <Select 
                    value={companyForm.status} 
                    onValueChange={(val) => setCompanyForm({...companyForm, status: val})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="DISABLED">DISABLED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Key Contact Setup */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Key Contact Configuration</span>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="use-rep-edit"
                      checked={useClientRep}
                      onCheckedChange={(checked) => setUseClientRep(!!checked)}
                    />
                    <label 
                      htmlFor="use-rep-edit"
                      className="text-xs font-semibold text-muted-foreground cursor-pointer select-none"
                    >
                      Use Client Representative
                    </label>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Key Contact Person Name</label>
                    <Input
                      placeholder="Contact Person Name"
                      value={companyForm.key_contact_person}
                      onChange={(e) => setCompanyForm({...companyForm, key_contact_person: e.target.value})}
                      disabled={useClientRep}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Contact Email</label>
                      <Input
                        type="email"
                        placeholder="email@company.com"
                        value={companyForm.key_contact_email}
                        onChange={(e) => setCompanyForm({...companyForm, key_contact_email: e.target.value})}
                        disabled={useClientRep}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Contact Phone</label>
                      <Input
                        placeholder="+62 812..."
                        value={companyForm.key_contact_phone}
                        onChange={(e) => setCompanyForm({...companyForm, key_contact_phone: e.target.value})}
                        disabled={useClientRep}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button type="submit">Save Updates</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
