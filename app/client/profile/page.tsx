"use client";

import React, { useState, useEffect, useRef } from "react";
import { useClient } from "../layout";
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  Download,
  ExternalLink,
  Briefcase,
  FileSpreadsheet,
  Calendar,
  Layers,
  Sparkles,
  KeyRound
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PhoneInput, isValidPhoneNumber, isValidEmail } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";
import { resolveImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ClientProfilePage() {
  const { clientProfile, activeCompany, loading: contextLoading, refreshProfile } = useClient();
  
  // Representative form state
  const [repForm, setRepForm] = useState({
    contact_person: "",
    email: "",
    phone: "",
    notes: ""
  });

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    company_code: "",
    tax_number: "",
    industry: "",
    address: ""
  });

  // Documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Loading states
  const [savingRep, setSavingRep] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state with client context
  useEffect(() => {
    if (clientProfile) {
      setRepForm({
        contact_person: clientProfile.contact_person || "",
        email: clientProfile.email || "",
        phone: clientProfile.phone || "",
        notes: clientProfile.notes || ""
      });
    }
    if (activeCompany) {
      setCompanyForm({
        company_name: activeCompany.company_name || "",
        company_code: activeCompany.company_code || "",
        tax_number: activeCompany.tax_number || "",
        industry: activeCompany.industry || "",
        address: activeCompany.address || ""
      });
    }
  }, [clientProfile, activeCompany]);

  // Fetch shared documents
  useEffect(() => {
    if (activeCompany?.id) {
      const fetchDocs = async () => {
        setDocsLoading(true);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${activeCompany.id}/documents`, {
      credentials: "include",
              }
          );
          if (res.ok) {
            const data = await res.json();
            setDocuments(data || []);
          }
        } catch (e) {
          console.error("Failed to load documents", e);
        } finally {
          setDocsLoading(false);
        }
      };
      fetchDocs();
    }
  }, [activeCompany?.id]);

  // Update Representative Details
  const handleUpdateRep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientProfile) return;

    if (!repForm.email || !isValidEmail(repForm.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (repForm.phone && !isValidPhoneNumber(repForm.phone)) {
      toast.error("Please enter a valid phone number (6 to 15 digits).");
      return;
    }

    setSavingRep(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${clientProfile.id}`, {
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(repForm)
      });

      if (res.ok) {
        toast.success("Representative profile updated successfully!");
        await refreshProfile();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to update representative profile.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating representative profile.");
    } finally {
      setSavingRep(false);
    }
  };

  // Update Company Details
  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;

    setSavingCompany(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${activeCompany.id}`, {
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(companyForm)
      });

      if (res.ok) {
        toast.success("Company details updated successfully!");
        await refreshProfile();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to update company details.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating company details.");
    } finally {
      setSavingCompany(false);
    }
  };

  // Upload Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCompany?.id) return;

    setLogoUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${activeCompany.id}/logo`, {
      credentials: "include",
        method: "POST",
        body: formData
      });

      if (res.ok) {
        toast.success("Company logo uploaded successfully!");
        await refreshProfile();
        if (logoInputRef.current) logoInputRef.current.value = "";
      } else {
        toast.error("Failed to upload company logo.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading company logo.");
    } finally {
      setLogoUploading(false);
    }
  };

  // Change Password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/change-password`, {
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (res.ok) {
        setPasswordSuccess("Password updated successfully!");
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setPasswordError(data.detail || "Failed to update password.");
        toast.error(data.detail || "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      setPasswordError("Error updating password.");
      toast.error("Error updating password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading representative profile...</p>
        </div>
      </div>
    );
  }

  if (!activeCompany && !clientProfile) {
    return (
      <div className="flex h-[500px] items-center justify-center animate-in fade-in">
        <div className="flex flex-col items-center gap-3 text-center max-w-md p-8 rounded-2xl border border-dashed border-border/60 bg-background/50 backdrop-blur-md">
          <AlertCircle className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-xl font-bold text-foreground">No Profile Linked</h2>
          <p className="text-xs text-muted-foreground">
            Please contact your system administrator to configure your client representative profile credentials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0 flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Representative & Company Profile
              </h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold px-2 py-0.5 rounded-full text-[10px]">
                Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage representative credentials, corporate metadata, security keys, and legal records.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Summary Bento Card */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <Card className="border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md p-5 text-left shadow-sm rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
            
            <div className="flex flex-col items-start gap-3.5 mt-1.5">
              <div className="relative group">
                {activeCompany?.logo_url ? (
                  <img
                    src={resolveImageUrl(activeCompany.logo_url)}
                    alt={activeCompany.company_name}
                    className="h-24 w-24 rounded-2xl object-cover border border-emerald-500/20 shadow-md bg-background"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-2xl border border-emerald-500/20 shadow-md">
                    {activeCompany?.company_name?.substring(0, 2).toUpperCase() || "CP"}
                  </div>
                )}
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity text-white text-xs font-semibold gap-1.5 cursor-pointer backdrop-blur-xs"
                  title="Upload Company Logo"
                >
                  {logoUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      <Camera className="h-4 w-4" /> Change
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-0.5 w-full">
                <h3 className="font-bold text-base text-foreground leading-tight">
                  {clientProfile?.contact_person || activeCompany?.company_name}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {activeCompany?.company_name || "Corporate Client"}
                </p>
                <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] font-bold">
                    {clientProfile?.status || "ACTIVE"}
                  </Badge>
                  <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-[9px] px-2 py-0.5 rounded-md">
                    {activeCompany?.company_code || `CLI-${clientProfile?.id?.toString().padStart(4, '0') || "0001"}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full space-y-2.5 pt-4 border-t border-border/40 text-left text-xs mt-4">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/20 border border-border/30">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Email</div>
                  <span className="text-foreground text-xs font-medium truncate block">{clientProfile?.email || "No email"}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/20 border border-border/30">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Phone</div>
                  <span className="text-foreground text-xs font-medium truncate block">{clientProfile?.phone || "No phone listed"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/20 border border-border/30">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Building className="h-3.5 w-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Industry</div>
                  <span className="text-foreground text-xs font-medium truncate block">{activeCompany?.industry || "Corporate Services"}</span>
                </div>
              </div>

              {activeCompany?.address && (
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/20 border border-border/30">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Office Address</div>
                    <span className="text-foreground text-xs font-medium line-clamp-2">{activeCompany.address}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Tabbed Details */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <Tabs defaultValue="representative" className="w-full">
            <TabsList className="bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/40 p-1 rounded-2xl h-auto w-fit flex flex-wrap sm:flex-nowrap gap-1 mb-5 shadow-xs">
              <TabsTrigger value="representative" className="rounded-xl text-xs font-semibold px-3 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-emerald-500" /> Representative
              </TabsTrigger>
              <TabsTrigger value="company" className="rounded-xl text-xs font-semibold px-3 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-emerald-500" /> Company
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-xl text-xs font-semibold px-3 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-emerald-500" /> Documents
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-xl text-xs font-semibold px-3 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-emerald-500" /> Password
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: REPRESENTATIVE CONTACT */}
            <TabsContent value="representative" className="space-y-5 mt-0">
              <Card className="border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Representative Contact Details</CardTitle>
                  <CardDescription className="text-xs">Keep your primary contact and correspondence information updated.</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleUpdateRep} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Representative Full Name</label>
                        <Input
                          value={repForm.contact_person}
                          onChange={(e) => setRepForm({ ...repForm, contact_person: e.target.value })}
                          placeholder="e.g. John Doe"
                          className="h-9 rounded-xl bg-background/70 border-border/50 text-xs"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                        <EmailInput
                          value={repForm.email}
                          onChange={(val) => setRepForm({ ...repForm, email: val })}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                        <PhoneInput 
                          value={repForm.phone} 
                          onChange={(val) => setRepForm({ ...repForm, phone: val })} 
                          placeholder="812 3456 789" 
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Notes & Special Remarks</label>
                        <textarea 
                          value={repForm.notes} 
                          onChange={(e) => setRepForm({ ...repForm, notes: e.target.value })} 
                          placeholder="Preferred communication times, billing instructions, or remarks..."
                          className="flex min-h-[75px] w-full rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button 
                        type="submit" 
                        disabled={savingRep} 
                        className="gap-2 font-bold shadow-sm rounded-xl h-9 px-5 text-xs cursor-pointer"
                      >
                        {savingRep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Representative Profile
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Read-only Information Bento Card */}
              <Card className="border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Account Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="p-3 rounded-xl border border-border/30 bg-muted/20 space-y-0.5">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Linked Companies</div>
                    <p className="font-bold text-xs sm:text-sm text-foreground">{clientProfile?.companies?.length || 1} Profile(s)</p>
                  </div>
                  <div className="p-3 rounded-xl border border-border/30 bg-muted/20 space-y-0.5">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Portal Role</div>
                    <p className="font-bold text-xs sm:text-sm text-foreground">Client Rep</p>
                  </div>
                  <div className="p-3 rounded-xl border border-border/30 bg-muted/20 space-y-0.5">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Verification</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                      <span className="font-bold text-xs text-foreground">{clientProfile?.status || "Verified"}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-border/30 bg-muted/20 space-y-0.5">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Client Code</div>
                    <p className="font-mono text-xs font-bold text-foreground mt-0.5">
                      {activeCompany?.company_code || `CLI-${clientProfile?.id?.toString().padStart(4, '0') || "0001"}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: COMPANY DETAILS */}
            <TabsContent value="company" className="space-y-5 mt-0">
              <Card className="border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Company Registration & Metadata</CardTitle>
                  <CardDescription className="text-xs">Review and modify corporate metadata, industry sector, and tax identification.</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleUpdateCompany} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Company Legal Name</label>
                        <Input
                          value={companyForm.company_name}
                          onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                          placeholder="e.g. PT Maju Bersama Jaya"
                          className="h-9 rounded-xl bg-background/70 border-border/50 text-xs"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          Company Code <Lock className="h-3 w-3 text-muted-foreground/60" />
                        </label>
                        <Input
                          value={companyForm.company_code}
                          disabled
                          className="h-9 rounded-xl bg-muted/40 text-muted-foreground cursor-not-allowed font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tax ID / NPWP / SST</label>
                        <Input
                          value={companyForm.tax_number}
                          onChange={(e) => setCompanyForm({ ...companyForm, tax_number: e.target.value })}
                          placeholder="e.g. 01.234.567.8-901.000"
                          className="h-9 rounded-xl bg-background/70 border-border/50 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Industry / Business Sector</label>
                        <Input
                          value={companyForm.industry}
                          onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                          placeholder="e.g. Information Technology"
                          className="h-9 rounded-xl bg-background/70 border-border/50 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Registered Office Address</label>
                        <textarea
                          value={companyForm.address}
                          onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                          placeholder="Street, Building, Suite, City, Postal Code"
                          className="flex min-h-[75px] w-full rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Button 
                        type="submit" 
                        disabled={savingCompany} 
                        className="gap-2 font-bold shadow-sm rounded-xl h-9 px-5 text-xs cursor-pointer"
                      >
                        {savingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Company Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: DOCUMENTS */}
            <TabsContent value="documents" className="space-y-5 mt-0">
              <Card className="border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">Company & Legal Documents</CardTitle>
                    <CardDescription className="text-xs">Verified corporate charters, deeds, permits, and deliverables.</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-bold text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {documents.length} File(s)
                  </Badge>
                </CardHeader>
                <CardContent className="p-5">
                  {docsLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                      <p className="text-xs">Loading company files...</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                      <FileText className="h-8 w-8 opacity-30 mb-2 text-emerald-500" />
                      <p className="text-xs font-bold text-foreground">No documents uploaded yet</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Documents uploaded for your orders will appear here automatically.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30 border border-border/40 rounded-2xl overflow-hidden">
                      {documents.map((doc: any) => (
                        <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 pr-4">
                            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <FileText className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{doc.file_name || "Document"}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                                <span>{doc.document_type || "Corporate Document"}</span>
                                {doc.order_number && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Order #{doc.order_number}</span>
                                  </>
                                )}
                                {doc.uploaded_at && (
                                  <>
                                    <span>•</span>
                                    <span>{format(new Date(doc.uploaded_at), "MMM d, yyyy")}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {doc.file_url ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7.5 px-3 text-xs font-semibold gap-1.5 rounded-xl shadow-xs shrink-0"
                              asChild
                            >
                              <a
                                href={doc.file_url.startsWith("http") ? doc.file_url : `${process.env.NEXT_PUBLIC_API_URL}${doc.file_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download</span>
                              </a>
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-muted/40 rounded-lg border border-border/30">
                              Archived
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: SECURITY & PASSWORD */}
            <TabsContent value="security" className="space-y-5 mt-0">
              <Card className="border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Change Portal Password</CardTitle>
                  <CardDescription className="text-xs">Ensure your portal account is protected with a strong security passphrase.</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handlePasswordChange} className="space-y-3.5 max-w-sm">
                    {passwordSuccess && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> {passwordSuccess}
                      </div>
                    )}
                    {passwordError && (
                      <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-bold">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {passwordError}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Current Password</label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9 rounded-xl bg-background/70 border-border/50 text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9 rounded-xl bg-background/70 border-border/50 text-xs"
                        required
                      />
                      <p className="text-[10px] text-muted-foreground">Minimum 6 characters recommended.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9 rounded-xl bg-background/70 border-border/50 text-xs"
                        required
                      />
                    </div>

                    <div className="pt-1">
                      <Button 
                        type="submit" 
                        disabled={passwordLoading} 
                        className="gap-2 font-bold shadow-sm rounded-xl h-9 px-5 text-xs cursor-pointer"
                      >
                        {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        Update Security Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
