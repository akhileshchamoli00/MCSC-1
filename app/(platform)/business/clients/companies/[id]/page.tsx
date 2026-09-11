"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building, 
  Building2,
  ArrowLeft, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  User,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Trash2,
  Mail,
  MailCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/phone-input";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";

export const isValidEmail = (email: string): boolean => {
  if (!email || !email.trim()) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

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

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id ? parseInt(params.id as string) : null;
  const { isAdmin, hasPermission, profile, loading: userLoading } = useUser();
  const isClient = profile?.role?.name?.toUpperCase() === "CLIENT";
  const canView = isAdmin || hasPermission("clients_company", "view");
  const canEdit = isAdmin || hasPermission("clients_company", "edit");
  const canDelete = isAdmin || hasPermission("clients_company", "delete");
  const canValidate = isAdmin || hasPermission("clients_company", "approve") || hasPermission("clients_company", "edit");

  const [company, setCompany] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userLoading && !canView && !isAdmin) {
      toast.error("Access Denied: You do not have permission to view this company.");
      router.replace("/business/clients/companies");
    }
  }, [userLoading, canView, isAdmin, router]);

  // Send Invitation / Welcome Email State
  const [isSendEmailOpen, setIsSendEmailOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendWelcomeEmail = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token || !companyId) return;

    setSendingEmail(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/send-welcome-email`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to send invitation email");
      }

      toast.success(`Invitation & Welcome email successfully sent to ${data.recipient_email}!`);
      setCompany((prev: any) => prev ? {
        ...prev,
        invitation_sent_at: data.invitation_sent_at || new Date().toISOString(),
        invitation_sent_to: data.recipient_email
      } : prev);
      setIsSendEmailOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error sending invitation email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDeleteCompany = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token || !company) return;
    setDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${company.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Company "${company.company_name}" deleted successfully`);
        router.push("/business/clients/companies");
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

  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");

  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [dirEmailTouched, setDirEmailTouched] = useState(false);
  const [dirPhoneTouched, setDirPhoneTouched] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    company_code: "",
    industry: "",
    tax_number: "",
    address: "",
    key_contact_person: "",
    key_contact_email: "",
    key_contact_phone: "+62",
    director_name: "",
    director_email: "",
    director_contact: "+62",
    notes: "",
    status: "ACTIVE",
  });
  const [selectedClientId, setSelectedClientId] = useState<string>("none");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchCompanyDetails = async () => {
    if (!token || !companyId) return;
    try {
      setLoading(true);
      const [compRes, cliRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (cliRes.ok) setClients(await cliRes.json());

      if (compRes.ok) {
        const thisCompany = await compRes.json();
        setCompany(thisCompany);
        setCompanyForm({
          company_name: thisCompany.company_name || "",
          company_code: thisCompany.company_code || "",
          industry: thisCompany.industry || "",
          tax_number: thisCompany.tax_number || "",
          address: thisCompany.address || "",
          key_contact_person: thisCompany.key_contact_person || "",
          key_contact_email: thisCompany.key_contact_email || "",
          key_contact_phone: thisCompany.key_contact_phone || "",
          director_name: thisCompany.director_name || "",
          director_email: thisCompany.director_email || "",
          director_contact: thisCompany.director_contact || "+62",
          notes: thisCompany.notes || "",
          status: thisCompany.status || "ACTIVE",
        });
        setSelectedClientId(thisCompany.client_id ? thisCompany.client_id.toString() : "none");
      } else {
        setErrorMsg("Company not found or access denied.");
      }
    } catch (err) {
      console.error("Error loading company details:", err);
      setErrorMsg("Failed to load company record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, [companyId]);

  const handleValidateCompany = async (status: "VALIDATED" | "NEEDS_REVISION" | "PENDING_VALIDATION", notes?: string) => {
    if (!token || !companyId) return;
    setValidating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/validate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: status,
          notes: notes || null
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setCompany(updated);
        setRevisionDialogOpen(false);
        setRevisionNotes("");
        if (status === "VALIDATED") {
          setSuccessMsg("Company profile has been successfully verified and validated!");
        } else if (status === "NEEDS_REVISION") {
          setSuccessMsg("Revision request has been recorded for this company profile.");
        } else {
          setSuccessMsg("Company validation status has been reset to pending review.");
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to update validation status");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error validating company");
    } finally {
      setValidating(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !companyId) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!companyForm.company_name.trim()) {
      setErrorMsg("Company Name is required");
      setSaving(false);
      setActiveTab("company");
      return;
    }
    if (!companyForm.key_contact_person || !companyForm.key_contact_person.trim()) {
      setErrorMsg("Key Contact Person Name is mandatory");
      setSaving(false);
      setActiveTab("contact");
      return;
    }
    if (!companyForm.key_contact_email || !companyForm.key_contact_email.trim()) {
      setErrorMsg("Key Contact Email is mandatory");
      setSaving(false);
      setActiveTab("contact");
      return;
    }
    if (!isValidEmail(companyForm.key_contact_email)) {
      setErrorMsg("Please enter a valid Key Contact Email address (e.g. contact@domain.com)");
      toast.error("Invalid email format. Please check the Key Contact Email.");
      setSaving(false);
      setActiveTab("contact");
      return;
    }
    if (!companyForm.key_contact_phone || !companyForm.key_contact_phone.trim()) {
      setErrorMsg("Key Contact Phone is mandatory");
      setSaving(false);
      setActiveTab("contact");
      return;
    }
    if (!isValidPhoneNumber(companyForm.key_contact_phone)) {
      setErrorMsg("Please enter a valid Key Contact Phone number (6 to 15 digits)");
      toast.error("Invalid phone format. Please check the Key Contact Phone.");
      setSaving(false);
      setActiveTab("contact");
      return;
    }

    if (companyForm.director_email && companyForm.director_email.trim() && !isValidEmail(companyForm.director_email)) {
      setErrorMsg("Please enter a valid Director Email address or leave it blank");
      toast.error("Invalid email format for Director Email.");
      setSaving(false);
      setActiveTab("contact");
      return;
    }
    if (companyForm.director_contact && companyForm.director_contact.trim() && companyForm.director_contact.trim() !== "+62" && !isValidPhoneNumber(companyForm.director_contact)) {
      setErrorMsg("Please enter a valid Director Phone number or leave it blank");
      toast.error("Invalid phone format for Director Phone.");
      setSaving(false);
      setActiveTab("contact");
      return;
    }

    try {
      const payload = {
        company_name: companyForm.company_name.trim(),
        company_code: companyForm.company_code,
        industry: companyForm.industry || null,
        tax_number: companyForm.tax_number || null,
        address: companyForm.address || null,
        key_contact_person: companyForm.key_contact_person.trim(),
        key_contact_email: companyForm.key_contact_email.trim().toLowerCase(),
        key_contact_phone: companyForm.key_contact_phone.trim(),
        director_name: companyForm.director_name.trim() || null,
        director_email: companyForm.director_email.trim() ? companyForm.director_email.trim().toLowerCase() : null,
        director_contact: (companyForm.director_contact.trim() && companyForm.director_contact.trim() !== "+62") ? companyForm.director_contact.trim() : null,
        notes: companyForm.notes || null,
        status: companyForm.status,
        client_id: (!selectedClientId || selectedClientId === "none") ? null : parseInt(selectedClientId)
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg("Company details updated successfully.");
        toast.success("Company profile updated successfully!");
        fetchCompanyDetails();
      } else {
        const err = await res.json();
        let errMsg = "Failed to update company";
        if (err.detail) {
          if (typeof err.detail === "string") {
            errMsg = err.detail;
          } else if (Array.isArray(err.detail)) {
            errMsg = err.detail.map((e: any) => `${e.loc.join(".")}: ${e.msg}`).join(", ");
          } else {
            errMsg = JSON.stringify(err.detail);
          }
        }
        setErrorMsg(errMsg);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error saving company details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading corporate profile...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Company Profile Not Found</h2>
        <Link href="/business/clients/companies">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Company List
          </Button>
        </Link>
      </div>
    );
  }

  const valStatus = company.validation_status || "PENDING_VALIDATION";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/business/clients/companies" className="mt-1">
            <Button variant="ghost" size="icon" title="Back to Company Directory" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="p-2.5 rounded-xl bg-muted/60 border border-border/60 text-foreground shadow-xs shrink-0 flex items-center justify-center">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{company.company_name}</h1>
              <span className="font-mono font-bold text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded-md">
                {company.company_code}
              </span>
              {valStatus === "VALIDATED" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Profile
                </span>
              )}
              {valStatus === "PENDING_VALIDATION" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Clock className="h-3.5 w-3.5" /> Pending Admin Review
                </span>
              )}
              {valStatus === "NEEDS_REVISION" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                  <AlertTriangle className="h-3.5 w-3.5" /> Needs Revision
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Edit corporate entity details, parent client association, and administrative profile validation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {valStatus === "VALIDATED" ? (
            <Button
              type="button"
              variant="outline"
              className={`text-xs font-bold gap-1.5 h-9 rounded-xl transition-colors ${
                company?.invitation_sent_at
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                  : ""
              }`}
              onClick={() => setIsSendEmailOpen(true)}
              title={
                company?.invitation_sent_at
                  ? `Official Welcome & ID Card email sent on ${new Date(company.invitation_sent_at).toLocaleDateString()} to ${company.invitation_sent_to || company.key_contact_email} — Click to Resend`
                  : "Send Official Welcome Email & ID Card"
              }
            >
              {company?.invitation_sent_at ? (
                <>
                  <MailCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Resend Invitation Email
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" /> Send Invitation Email
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              className="opacity-40 cursor-not-allowed text-xs font-semibold gap-1.5 h-9 text-muted-foreground rounded-xl"
              title="Company profile must be verified/validated first before sending Welcome ID Card email"
            >
              <Mail className="h-4 w-4" /> Send Invitation Email
            </Button>
          )}

          {canDelete && (
            <Button
              type="button"
              variant="outline"
              className="border-destructive/40 text-destructive hover:!bg-destructive hover:!text-white text-xs font-semibold gap-1.5 h-9 rounded-xl transition-all"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete Company
            </Button>
          )}
        </div>
      </div>

      {/* TOP ADMIN VALIDATION BANNER */}
      <div className={`p-4 rounded-2xl border transition-all ${
        valStatus === "VALIDATED" 
          ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-200" 
          : valStatus === "NEEDS_REVISION"
          ? "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 text-rose-950 dark:text-rose-200"
          : "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 text-amber-950 dark:text-amber-200"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${
              valStatus === "VALIDATED" 
                ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                : valStatus === "NEEDS_REVISION"
                ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20"
                : "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}>
              {valStatus === "VALIDATED" ? <ShieldCheck className="h-5 w-5" /> : valStatus === "NEEDS_REVISION" ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm">
                  {valStatus === "VALIDATED" 
                    ? "Verified Company Profile" 
                    : valStatus === "NEEDS_REVISION"
                    ? "Profile Revision Requested"
                    : "Company Profile Pending Admin Validation"
                  }
                </h3>
                {company?.invitation_sent_at && (
                  <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 flex items-center gap-1">
                    <MailCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Invitation Sent {new Date(company.invitation_sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                {valStatus === "VALIDATED" ? (
                  <>Validated by <strong>{formatUserName(company.validator, "Admin")}</strong> on {company.validated_at ? new Date(company.validated_at).toLocaleDateString() : "Record"}. All legal credentials and key contacts are confirmed.</>
                ) : valStatus === "NEEDS_REVISION" ? (
                  <>Admin Feedback: <em>&ldquo;{company.validation_notes || "Please review and complete the missing corporate details."}&rdquo;</em></>
                ) : (
                  <>Created by <strong>{formatUserName(company.creator, "Employee")}</strong> on {company.created_at ? new Date(company.created_at).toLocaleDateString() : "N/A"}. Please review company details and key contacts before validating.</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {valStatus !== "VALIDATED" && (
              <Button
                type="button"
                onClick={() => handleValidateCompany("VALIDATED")}
                disabled={validating}
                className="font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-sm"
              >
                {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Approve &amp; Validate Profile
              </Button>
            )}

            {valStatus !== "NEEDS_REVISION" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRevisionNotes(company.validation_notes || "");
                  setRevisionDialogOpen(true);
                }}
                disabled={validating}
                className="font-bold text-xs h-9 px-4 rounded-xl gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Request Revision
              </Button>
            )}

            {valStatus === "VALIDATED" && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSendEmailOpen(true)}
                  className="font-bold text-xs h-9 px-4 rounded-xl gap-1.5"
                  title="Resend Official Welcome Email & ID Card"
                >
                  <Mail className="h-3.5 w-3.5" /> Resend Welcome Email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleValidateCompany("PENDING_VALIDATION")}
                  disabled={validating}
                  className="border-border/60 text-muted-foreground hover:bg-muted font-semibold text-xs h-9 px-4 rounded-xl gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset Status
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revision Dialog Modal */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Request Profile Revision
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide specific feedback or notes on what information or key contact details the creator needs to correct.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-foreground">Revision Notes / Feedback *</label>
            <textarea
              rows={3}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="e.g. Please confirm the Director KTP/passport and re-verify the Key Contact WhatsApp phone number..."
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRevisionDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={validating || !revisionNotes.trim()}
              onClick={() => handleValidateCompany("NEEDS_REVISION", revisionNotes.trim())}
              className="font-bold gap-1 rounded-xl"
            >
              {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Submit Revision Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/20 text-destructive text-xs font-medium rounded-xl">{errorMsg}</div>}
      {successMsg && <div className="p-3 bg-green-500/10 border border-green-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-xl">{successMsg}</div>}

      <form onSubmit={handleUpdateCompany}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-11 bg-muted/40 p-1 rounded-xl border border-border/40">
            <TabsTrigger value="company" className="h-full gap-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Building className="h-4 w-4" /> <span>Company Profile</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="h-full gap-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <User className="h-4 w-4" /> <span>Key Contact Setup</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Company Profile */}
          <TabsContent value="company" className="space-y-6">
            <Card className="border-border/40 shadow-sm bg-background/50 backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/30 bg-muted/10 pb-4">
                <CardTitle className="text-base font-bold">Company Details</CardTitle>
                <CardDescription className="text-xs">Primary corporate identifiers and registration data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                
                {/* Select Parent Client Representative */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Parent Client Partner (Optional)</label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-full h-10 rounded-xl border-border/50 bg-background/60">
                      <SelectValue placeholder="No Parent Client" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">-- No Parent Client (Standalone) --</SelectItem>
                      {clients.map((cl) => (
                        <SelectItem key={cl.id} value={cl.id.toString()}>
                          {cl.contact_person} ({cl.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground" htmlFor="company_name">Company Name *</label>
                    <Input 
                      id="company_name" 
                      required 
                      value={companyForm.company_name} 
                      onChange={(e) => setCompanyForm({...companyForm, company_name: e.target.value})} 
                      className="h-10 rounded-xl border-border/50 bg-background/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground" htmlFor="company_code">Company Code (Auto Generated)</label>
                    <Input 
                      id="company_code" 
                      value={companyForm.company_code} 
                      readOnly 
                      className="h-10 rounded-xl bg-muted/40 font-mono font-bold text-foreground border-border/40" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground" htmlFor="industry">Industry Segment</label>
                    <Input 
                      id="industry" 
                      value={companyForm.industry} 
                      onChange={(e) => setCompanyForm({...companyForm, industry: e.target.value})} 
                      className="h-10 rounded-xl border-border/50 bg-background/60"
                      placeholder="e.g. Technology, Trading, Services"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground" htmlFor="tax_number">Tax ID / NPWP</label>
                    <Input 
                      id="tax_number" 
                      value={companyForm.tax_number} 
                      onChange={(e) => setCompanyForm({...companyForm, tax_number: e.target.value})} 
                      className="h-10 rounded-xl border-border/50 bg-background/60"
                      placeholder="e.g. Tax Registration ID"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground" htmlFor="status">Operational Status</label>
                    <Select value={companyForm.status} onValueChange={(val) => setCompanyForm({...companyForm, status: val})}>
                      <SelectTrigger className="h-10 rounded-xl border-border/50 bg-background/60"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="DISABLED">DISABLED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground" htmlFor="address">Registered Address</label>
                    <textarea 
                      id="address" 
                      value={companyForm.address} 
                      onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})} 
                      rows={3}
                      className="flex w-full rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Complete physical office address..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={() => setActiveTab("contact")} className="gap-1 font-bold rounded-xl h-10 px-5">
                    Continue to Key Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Key Contact Setup */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="border-border/40 shadow-sm bg-background/50 backdrop-blur-md rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-border/30 bg-muted/10 pb-4">
                <CardTitle className="text-base font-bold">Key Contact Configuration</CardTitle>
                <CardDescription className="text-xs">Configure operational points of contact and executive director information for this company.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                
                {/* Section 1: Operational Key Contact */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Operational Key Contact (Mandatory)</h3>
                    </div>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                      Auto-syncs to Documents &rarr; Board &amp; Stakeholders
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Primary operational representative. Automatically updated under the company&apos;s Board &amp; Stakeholders records.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-start">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground" htmlFor="key_contact_person">Key Contact Person Name *</label>
                      <Input 
                        id="key_contact_person" 
                        required
                        placeholder="e.g. John Doe" 
                        value={companyForm.key_contact_person} 
                        onChange={(e) => setCompanyForm({...companyForm, key_contact_person: e.target.value})} 
                        className="h-10 rounded-xl border-border/50 bg-background/60"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground" htmlFor="key_contact_email">Key Contact Email *</label>
                      <Input 
                        id="key_contact_email" 
                        type="email" 
                        required
                        placeholder="e.g. john@example.com" 
                        value={companyForm.key_contact_email} 
                        onChange={(e) => {
                          setCompanyForm({...companyForm, key_contact_email: e.target.value});
                          setEmailTouched(true);
                        }} 
                        onBlur={() => setEmailTouched(true)}
                        className={`h-10 rounded-xl border-border/50 bg-background/60 transition-all ${
                          emailTouched && companyForm.key_contact_email && !isValidEmail(companyForm.key_contact_email)
                            ? "border-destructive ring-1 ring-destructive/30"
                            : ""
                        }`}
                      />
                      {emailTouched && companyForm.key_contact_email && !isValidEmail(companyForm.key_contact_email) && (
                        <p className="text-[11px] text-destructive font-medium flex items-center gap-1 animate-in fade-in duration-200">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>Please enter a valid email address (e.g. name@domain.com)</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground" htmlFor="key_contact_phone">Key Contact Phone *</label>
                      <PhoneInput 
                        id="key_contact_phone"
                        value={companyForm.key_contact_phone}
                        onChange={(val) => {
                          setCompanyForm(prev => ({ ...prev, key_contact_phone: val }));
                          setPhoneTouched(true);
                        }}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Director Contact Details (Optional) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Director Contact Details (Optional)</h3>
                    </div>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                      Auto-syncs to Documents &rarr; Board &amp; Stakeholders
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">If entered, this director is automatically updated under the company&apos;s Board and Stakeholders records.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-start">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground" htmlFor="director_name">Director Full Name</label>
                      <Input 
                        id="director_name" 
                        placeholder="e.g. Jane Smith" 
                        value={companyForm.director_name} 
                        onChange={(e) => setCompanyForm({...companyForm, director_name: e.target.value})} 
                        className="h-10 rounded-xl border-border/50 bg-background/60"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground" htmlFor="director_email">Director Email</label>
                      <Input 
                        id="director_email" 
                        type="email" 
                        placeholder="e.g. director@company.com" 
                        value={companyForm.director_email} 
                        onChange={(e) => {
                          setCompanyForm({...companyForm, director_email: e.target.value});
                          setDirEmailTouched(true);
                        }} 
                        onBlur={() => setDirEmailTouched(true)}
                        className={`h-10 rounded-xl border-border/50 bg-background/60 transition-all ${
                          dirEmailTouched && companyForm.director_email && !isValidEmail(companyForm.director_email)
                            ? "border-destructive ring-1 ring-destructive/30"
                            : ""
                        }`}
                      />
                      {dirEmailTouched && companyForm.director_email && !isValidEmail(companyForm.director_email) && (
                        <p className="text-[11px] text-destructive font-medium flex items-center gap-1 animate-in fade-in duration-200">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>Please enter a valid email address</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground" htmlFor="director_contact">Director Phone / WhatsApp</label>
                      <PhoneInput 
                        id="director_contact"
                        value={companyForm.director_contact}
                        onChange={(val) => {
                          setCompanyForm(prev => ({ ...prev, director_contact: val }));
                          setDirPhoneTouched(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Notes / Remarks */}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <label className="text-xs font-semibold text-foreground" htmlFor="notes">Notes / Remarks</label>
                  <textarea 
                    id="notes"
                    value={companyForm.notes} 
                    onChange={(e) => setCompanyForm({...companyForm, notes: e.target.value})} 
                    rows={3}
                    className="flex w-full rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Enter any additional notes or remarks about the company..."
                  />
                </div>

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("company")} className="rounded-xl font-semibold text-xs h-10 px-4">
                    Back to Profile
                  </Button>
                  <Button type="submit" disabled={saving} className="px-6 font-bold gap-2 rounded-xl h-10 shadow-md">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Profile Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
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
              Are you sure you want to delete <span className="font-bold text-foreground">{company?.company_name}</span> (Code: <span className="font-mono font-semibold">{company?.company_code}</span>)?
            </p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              This will unlink the company from any associated orders and remove all associated stakeholder entries and company documents. This action cannot be undone.
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
              onClick={handleDeleteCompany}
              disabled={deleting}
              className="font-bold text-xs h-9 gap-1.5"
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

          {company && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Company Entity:</span>
                  <span className="font-bold text-foreground text-right">{company.company_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Unique Company Code:</span>
                  <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2 py-0.5 rounded-md">{company.company_code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Recipient Name:</span>
                  <span className="font-semibold text-foreground">{company.key_contact_person || company.client?.contact_person || "Company Representative"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Recipient Email:</span>
                  <span className="font-semibold text-foreground">{company.key_contact_email || company.client?.email || "(No email configured)"}</span>
                </div>
              </div>

              {company.invitation_sent_at && (
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-900 dark:text-sky-300 space-y-1">
                  <p className="font-bold flex items-center gap-1 text-sky-700 dark:text-sky-300">
                    <MailCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /> Invitation Previously Dispatched
                  </p>
                  <p className="leading-relaxed">
                    An official invitation email was already sent to this company on <strong>{new Date(company.invitation_sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong> ({company.invitation_sent_to || company.key_contact_email}). Sending now will deliver a fresh copy.
                  </p>
                </div>
              )}

              {valStatus !== "VALIDATED" && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-700 dark:text-rose-400 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Company Profile Not Verified
                  </p>
                  <p className="leading-relaxed">
                    Official Welcome &amp; Verified ID Card emails can only be sent to companies that have been reviewed and marked as <strong>VALIDATED</strong>.
                  </p>
                </div>
              )}

              {valStatus === "VALIDATED" && !company.invitation_sent_at && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-400 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified Corporate Profile
                  </p>
                  <p className="leading-relaxed">
                    The recipient will receive their official welcome message with their luxury permanent <strong>Company ID Card ({company.company_code})</strong> and live order tracking link.
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
              onClick={handleSendWelcomeEmail}
              disabled={sendingEmail || (!company?.key_contact_email && !company?.client?.email) || valStatus !== "VALIDATED"}
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending Email...
                </>
              ) : company?.invitation_sent_at ? (
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
