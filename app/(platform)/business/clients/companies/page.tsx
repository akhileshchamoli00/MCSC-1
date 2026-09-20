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
  Building2,
  Globe,
  FileSpreadsheet,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Trash2,
  MailCheck
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
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
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { formatPhoneNumber } from "@/lib/utils";

const formatUserName = (userObj: any, fallback = "Staff") => {
  if (!userObj) return fallback;
  if (userObj.employee) {
    const fn = (userObj.employee.first_name || "").trim();
    const ln = (userObj.employee.last_name || "").trim();
    const fullName = `${fn} ${ln}`.trim();
    if (fullName) return fullName;
  }
  if (userObj.name && typeof userObj.name === "string" && !userObj.name.includes("@")) {
    return userObj.name;
  }
  if (userObj.email && typeof userObj.email === "string") {
    const prefix = userObj.email.split("@")[0];
    const clean = prefix.replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()).trim();
    if (clean) return clean;
  }
  return fallback;
};

export default function CompaniesDirectory() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_company", "view");
  const canCreate = isAdmin || hasPermission("clients_company", "create");
  const canEdit = isAdmin || hasPermission("clients_company", "edit");
  const canDelete = isAdmin || hasPermission("clients_company", "delete");

  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [validationFilter, setValidationFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Authorization Check & Redirect
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to access Companies.");
      if (hasPermission("clients_my", "view")) {
        router.replace("/business/assigned-orders");
      } else {
        router.replace("/business/dashboard");
      }
    }
  }, [userLoading, canView, hasPermission, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, validationFilter]);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [companyToDelete, setCompanyToDelete] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Send Welcome & Invitation Email State
  const [companyToSendEmail, setCompanyToSendEmail] = useState<any>(null);
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendWelcomeEmail = async (company: any) => {

    if (!company) return;

    setSendingEmail(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${company.id}/send-welcome-email`, {
      credentials: "include",
        method: "POST",
        });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to send invitation email");
      }

      toast.success(`Invitation & Welcome email successfully sent to ${data.recipient_email}!`);
      setCompanies(prev => prev.map(c => c.id === company.id ? { 
        ...c, 
        invitation_sent_at: data.invitation_sent_at || new Date().toISOString(), 
        invitation_sent_to: data.recipient_email 
      } : c));
      setIsSendEmailOpen(false);
      setCompanyToSendEmail(null);
    } catch (err: any) {
      toast.error(err.message || "Error sending invitation email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyToDelete.id}`, {
      credentials: "include",
        method: "DELETE",
        });

      if (res.ok) {
        toast.success(`Company "${companyToDelete.company_name}" deleted successfully`);
        setIsDeleteOpen(false);
        setCompanyToDelete(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to delete company");
      }
    } catch (err: any) {
      console.error("Error deleting company:", err);
      toast.error(err.message || "Error deleting company");
    } finally {
      setDeleting(false);
    }
  };

  const fetchData = async () => {
    if (userLoading || !canView) return;

    try {
      setLoading(true);
      const [clientsRes, companiesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, {
      credentials: "include", })
      ]);
      
      if (clientsRes.ok) {
        setClients(await clientsRes.json());
      }
      if (companiesRes.ok) {
        setCompanies(await companiesRes.json());
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && canView) {
      fetchData();
    }
  }, [userLoading, canView]);

  const handleToggleCompanyStatus = async (comp: any) => {

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
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
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
    
    const valStatus = c.validation_status || "PENDING_VALIDATION";
    const matchesValidation = validationFilter === "ALL" || 
      (validationFilter === "VALIDATED" && valStatus === "VALIDATED") ||
      (validationFilter === "PENDING" && valStatus === "PENDING_VALIDATION") ||
      (validationFilter === "REVISION" && valStatus === "NEEDS_REVISION");

    return matchesSearch && matchesStatus && matchesValidation;
  });

  const totalPages = Math.ceil(filteredCompanies.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  const totalCompaniesCount = companies.length;
  const validatedCount = companies.filter(c => c.validation_status === "VALIDATED").length;
  const pendingCount = companies.filter(c => !c.validation_status || c.validation_status === "PENDING_VALIDATION").length;
  const activeCompaniesCount = companies.filter(c => c.status === "ACTIVE").length;

  if (userLoading || (!canView && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        <p className="text-sm text-muted-foreground font-medium">Verifying company directory permissions...</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Companies */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Companies</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalCompaniesCount}</p>
            </div>
          </div>

          {/* Verified Profiles */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Verified Profiles</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{validatedCount}</p>
            </div>
          </div>

          {/* Pending Validation */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Pending</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{pendingCount}</p>
            </div>
          </div>

          {/* Active Accounts */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Active Accounts</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{activeCompaniesCount}</p>
            </div>
          </div>
        </div>

        {/* Add New Company Button */}
        {canCreate && (
          <Link href="/business/clients/companies/new" className="shrink-0 flex items-stretch">
            <Button className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm">
              <Plus className="h-4 w-4" /> Add New Company
            </Button>
          </Link>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-medium">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/25 text-destructive p-3 rounded-xl text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Companies Display Card */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <div className="p-4 bg-muted/10 border-b border-border/40 flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, code, contact or industry..."
                className="pl-9 h-9 text-xs rounded-xl bg-background/70 border-border/50 focus:border-ring"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Validation Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
              {[
                { id: "ALL", label: "All" },
                { id: "VALIDATED", label: "Verified 🛡️" },
                { id: "PENDING", label: "Pending ⏳" },
                { id: "REVISION", label: "Revision ⚠️" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setValidationFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all
                    ${validationFilter === tab.id 
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs font-bold" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
              {["ALL", "ACTIVE", "DISABLED"].map((statusOpt) => (
                <button
                  key={statusOpt}
                  onClick={() => setStatusFilter(statusOpt)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all
                    ${statusFilter === statusOpt 
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs font-bold" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }
                  `}
                >
                  {statusOpt}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold hidden sm:inline-block">
              Showing {paginatedCompanies.length} of {filteredCompanies.length} entries
            </span>
          </div>
        </div>

        <CardContent className="p-0">
          {filteredCompanies.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Building2 className="h-10 w-10 text-muted-foreground/35" />
              <span className="text-sm font-semibold">No Companies Found</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-4 pl-5">Company Profile</th>
                    <th className="p-4">Parent Client</th>
                    <th className="p-4">Key Contact</th>
                    <th className="p-4">Tax & Location</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedCompanies.map((company) => {
                    const isRep = company.key_contact_person === company.client?.contact_person &&
                                  company.key_contact_email === company.client?.email &&
                                  (company.key_contact_phone || "") === (company.client?.phone || "");
                    
                    return (
                      <tr key={company.id} className="hover:bg-muted/30 transition-colors text-xs">
                        <td className="p-4 pl-5 text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2.5">
                            {company.logo_url ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}${company.logo_url}`}
                                alt={company.company_name}
                                className="h-10 w-10 rounded-xl object-cover border border-border/40 shadow-xs bg-background shrink-0"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/70 text-foreground font-bold border border-border/50 shadow-xs shrink-0">
                                {company.company_name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="text-foreground font-semibold flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-sm">{company.company_name}</span>
                                {company.validation_status === "VALIDATED" && (
                                  <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20" title={`Validated by ${formatUserName(company.validator, "Admin")}`}>
                                    <ShieldCheck className="h-3 w-3" /> Verified
                                  </span>
                                )}
                                {(!company.validation_status || company.validation_status === "PENDING_VALIDATION") && (
                                  <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/20" title={`Created by ${formatUserName(company.creator, "Staff")}`}>
                                    <Clock className="h-3 w-3" /> Pending Review
                                  </span>
                                )}
                                {company.validation_status === "NEEDS_REVISION" && (
                                  <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/20" title={company.validation_notes || "Revision requested"}>
                                    <AlertTriangle className="h-3 w-3" /> Revision Required
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
                                Code: <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold px-1.5 py-0.2 rounded">{company.company_code}</span>
                                {company.industry && (
                                  <>
                                    <span>•</span>
                                    <span>{company.industry}</span>
                                  </>
                                )}
                                {company.creator && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[9px] opacity-75">Added by: {formatUserName(company.creator, "Staff")}</span>
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
                                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
                                  <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 bg-muted text-foreground border-none font-bold">REP</Badge>
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
                                  <span>{formatPhoneNumber(company.key_contact_phone)}</span>
                                </div>
                              )}
                              {company.invitation_sent_at ? (
                                <div className="pt-1">
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 w-fit"
                                    title={`Official invitation email sent on ${new Date(company.invitation_sent_at).toLocaleDateString()} to ${company.invitation_sent_to || company.key_contact_email}`}
                                  >
                                    <MailCheck className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Invited {new Date(company.invitation_sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                  </Badge>
                                </div>
                              ) : company.validation_status === "VALIDATED" ? (
                                <div className="pt-1">
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] font-medium text-muted-foreground/70 border-dashed border-border/60 flex items-center gap-1 w-fit"
                                  >
                                    <Mail className="h-2.5 w-2.5 opacity-40" />
                                    <span>No Invite Sent</span>
                                  </Badge>
                                </div>
                              ) : null}
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
                          {company.accurate_customer_no && (
                            <div className="text-[10px] flex items-center gap-1 font-mono text-purple-600 dark:text-purple-400 font-bold" title="Accurate Online Customer Master Code">
                              <span>AOL:</span>
                              <span className="bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.2 rounded">
                                {company.accurate_customer_no}
                              </span>
                            </div>
                          )}
                          {company.address && (
                            <div className="flex items-start gap-1 text-[11px] max-w-[180px]" title={company.address}>
                              <MapPin className="h-3 w-3 opacity-70 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{company.address}</span>
                            </div>
                          )}
                          {!company.tax_number && !company.address && !company.accurate_customer_no && (
                            <span className="text-muted-foreground italic font-normal text-xs">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <button 
                            type="button"
                            onClick={() => handleToggleCompanyStatus(company)}
                            className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                              company.status === "ACTIVE"
                                ? "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-zinc-500/10 dark:bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20"
                            }`}
                            title="Click to toggle operational status"
                          >
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${company.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                            {company.status === "ACTIVE" ? "Active" : "Disabled"}
                          </button>
                        </td>
                        <td className="p-4 text-right pr-5">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Send Welcome / Invitation Email Action Button */}
                            {company.validation_status === "VALIDATED" ? (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className={`h-7 w-7 rounded-lg transition-colors ${
                                  company.invitation_sent_at
                                    ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                                    : "text-muted-foreground hover:bg-muted"
                                }`}
                                title={
                                  company.invitation_sent_at
                                    ? `Official Invitation sent on ${new Date(company.invitation_sent_at).toLocaleDateString()} to ${company.invitation_sent_to || company.key_contact_email} — Click to Resend`
                                    : "Send Official Invitation & Verified ID Card Email"
                                }
                                onClick={() => {
                                  setCompanyToSendEmail(company);
                                  setIsSendEmailOpen(true);
                                }}
                              >
                                {company.invitation_sent_at ? (
                                  <MailCheck className="h-3.5 w-3.5" />
                                ) : (
                                  <Mail className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            ) : (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                disabled
                                className="h-7 w-7 text-muted-foreground/30 cursor-not-allowed opacity-40 rounded-lg"
                                title="Company must be verified/validated first before sending ID Card email"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {company.validation_status !== "VALIDATED" && (
                              <Link href={`/business/clients/companies/${company.id}`}>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-[11px] px-2.5 gap-1 font-semibold rounded-lg"
                                  title="Review & Validate Profile"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" /> Review
                                </Button>
                              </Link>
                            )}
                            {canEdit && (
                              <Link href={`/business/clients/companies/${company.id}`}>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 text-muted-foreground rounded-lg"
                                  title="Edit Company"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            )}
                            {canDelete && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7 text-muted-foreground hover:!bg-destructive hover:!text-white rounded-lg"
                                title="Delete Company"
                                onClick={() => {
                                  setCompanyToDelete(company);
                                  setIsDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
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
                  className="h-8 text-xs bg-background border-border/70 rounded-xl"
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
                  className="h-8 text-xs bg-background border-border/70 rounded-xl"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Delete Company Entity</DialogTitle>
                <DialogDescription className="text-xs">
                  Permanently remove this company and associated records.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-2 text-xs space-y-2">
            <p className="text-foreground leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-foreground">{companyToDelete?.company_name}</span> (Code: <span className="font-mono font-semibold">{companyToDelete?.company_code}</span>)?
            </p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              This will unlink the company from any associated orders and remove all associated stakeholder entries and company documents. This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="font-semibold text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCompany}
              disabled={deleting}
              className="font-bold text-xs h-9 gap-1.5 rounded-xl"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {deleting ? "Deleting..." : "Delete Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Invitation / Welcome Email Dialog */}
      <Dialog open={isSendEmailOpen} onOpenChange={setIsSendEmailOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted border border-border/60 text-foreground">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">Send Company Invitation Email</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Official welcome email with embedded unique Corporate ID Card.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {companyToSendEmail && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Company Entity:</span>
                  <span className="font-bold text-foreground text-right">{companyToSendEmail.company_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Unique Company Code:</span>
                  <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2 py-0.5 rounded-md">{companyToSendEmail.company_code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Recipient Name:</span>
                  <span className="font-semibold text-foreground">{companyToSendEmail.key_contact_person || companyToSendEmail.client?.contact_person || "Company Representative"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Recipient Email:</span>
                  <span className="font-semibold text-foreground">{companyToSendEmail.key_contact_email || companyToSendEmail.client?.email || "(No email configured)"}</span>
                </div>
              </div>

              {companyToSendEmail.invitation_sent_at && (
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-900 dark:text-sky-300 space-y-1">
                  <p className="font-bold flex items-center gap-1 text-sky-700 dark:text-sky-300">
                    <MailCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /> Invitation Previously Dispatched
                  </p>
                  <p className="leading-relaxed">
                    An official invitation email was already sent to this company on <strong>{new Date(companyToSendEmail.invitation_sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong> ({companyToSendEmail.invitation_sent_to || companyToSendEmail.key_contact_email}). Sending now will deliver a fresh copy.
                  </p>
                </div>
              )}

              {companyToSendEmail.validation_status !== "VALIDATED" && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-700 dark:text-rose-400 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Company Profile Not Verified
                  </p>
                  <p className="leading-relaxed">
                    Official Welcome &amp; Verified ID Card emails can only be sent to companies that have been reviewed and marked as <strong>VALIDATED</strong>.
                  </p>
                </div>
              )}

              {companyToSendEmail.validation_status === "VALIDATED" && !companyToSendEmail.invitation_sent_at && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified Corporate Profile
                  </p>
                  <p className="leading-relaxed">
                    The recipient will receive their official welcome message with their luxury permanent <strong>Company ID Card ({companyToSendEmail.company_code})</strong> and live order tracking link.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSendEmailOpen(false)}
              disabled={sendingEmail}
              className="text-xs font-semibold h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="font-bold text-xs h-9 gap-1.5 rounded-xl"
              onClick={() => handleSendWelcomeEmail(companyToSendEmail)}
              disabled={sendingEmail || (!companyToSendEmail?.key_contact_email && !companyToSendEmail?.client?.email) || companyToSendEmail?.validation_status !== "VALIDATED"}
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending Email...
                </>
              ) : companyToSendEmail?.invitation_sent_at ? (
                <>
                  <MailCheck className="h-3.5 w-3.5" /> Resend Invitation Email
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5" /> Send Invitation Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
