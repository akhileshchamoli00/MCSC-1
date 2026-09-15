"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { 
  Scale, 
  Loader2, 
  ArrowLeft, 
  DollarSign, 
  Check, 
  Building2, 
  MapPin, 
  FileText,
  Landmark,
  ArrowRight,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PhoneInput, isValidPhoneNumber, isValidEmail } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";

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

export default function EditNotaryPage() {
  const router = useRouter();
  const params = useParams();
  const notaryId = params?.notaryId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [rawNotary, setRawNotary] = useState<any>(null);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [serviceFees, setServiceFees] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<"general" | "bank" | "fees">("general");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    status: "ACTIVE",
    vendor_type: "",
    notes: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_holder_name: "",
    bank_branch: "",
    bank_swift_code: ""
  });

  const INDONESIAN_BANKS = [
    { code: "BCA", name: "Bank Central Asia (BCA)" },
    { code: "MANDIRI", name: "Bank Mandiri" },
    { code: "BNI", name: "Bank Negara Indonesia (BNI)" },
    { code: "BRI", name: "Bank Rakyat Indonesia (BRI)" },
    { code: "CIMB", name: "CIMB Niaga" },
    { code: "PERMATA", name: "Bank Permata" },
    { code: "DANAMON", name: "Bank Danamon" },
    { code: "BSI", name: "Bank Syariah Indonesia (BSI)" },
    { code: "BTPN", name: "Bank BTPN / Jenius" },
    { code: "OCBC", name: "OCBC NISP" },
    { code: "MAYBANK", name: "Maybank Indonesia" },
    { code: "PANIN", name: "Panin Bank" },
    { code: "DBS", name: "DBS Indonesia" },
    { code: "OTHER", name: "Other Bank (Manual Code)" }
  ];

  // Fetch Notary Data & Services
  useEffect(() => {
    if (!notaryId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Notary
        const resNotary = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/${notaryId}`, {
      credentials: "include",
          });

        if (!resNotary.ok) {
          toast.error("Vendor not found");
          router.push("/business/clients/notaries");
          return;
        }

        const data = await resNotary.json();
        setRawNotary(data);
        const vType = data.vendor_type || (data.is_gov_officer ? "GOVERNMENT_OFFICER" : (data.is_other_vendor ? "OTHER_VENDORS" : "NOTARY"));

        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          status: data.status || "ACTIVE",
          vendor_type: vType,
          notes: data.notes || "",
          bank_name: data.bank_name || "",
          bank_account_number: data.bank_account_number || "",
          bank_account_holder_name: data.bank_account_holder_name || "",
          bank_branch: data.bank_branch || "",
          bank_swift_code: data.bank_swift_code || ""
        });

        const feesMap: Record<number, string> = {};
        if (data.service_fees) {
          data.service_fees.forEach((sf: any) => {
            feesMap[sf.service_id] = String(sf.fee);
          });
        }
        setServiceFees(feesMap);

        // 2. Fetch Services
        const resServices = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, {
      credentials: "include",
          });
        if (resServices.ok) {
          const sData = await resServices.json();
          setServices(Array.isArray(sData) ? sData : []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading vendor details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [notaryId, router]);

  const handleValidateNotary = async (status: "VALIDATED" | "NEEDS_REVISION" | "PENDING_VALIDATION", notes?: string) => {
    if (!notaryId) return;
    setValidating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/${notaryId}/validate`, {
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: status,
          notes: notes || null
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setRawNotary(updated);
        toast.success(status === "VALIDATED" ? "Vendor profile verified and approved!" : (status === "NEEDS_REVISION" ? "Revision requested for vendor profile." : "Validation status reset."));
        if (status === "NEEDS_REVISION") {
          setRevisionDialogOpen(false);
        }
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update validation status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating validation status");
    } finally {
      setValidating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Dynamically filter services based on selected vendor type
  const eligibleServices = services.filter((s) => {
    if (formData.vendor_type === "NOTARY") return Boolean(s.needs_notary);
    if (formData.vendor_type === "GOVERNMENT_OFFICER") return Boolean(s.needs_gov_officer);
    if (formData.vendor_type === "OTHER_VENDORS") {
      return Boolean(s.needs_other_vendors) || (!s.needs_notary && !s.needs_gov_officer);
    }
    return false;
  });

  const configuredFeesCount = eligibleServices.filter((s) => parseFloat(serviceFees[s.id] || "0") > 0).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaryId) return;

    if (!formData.vendor_type) {
      toast.error("Please select a Vendor Type.");
      setActiveTab("general");
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      toast.error("Please enter a valid email address (e.g. notary@example.com).");
      setActiveTab("general");
      return;
    }

    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      toast.error("Please enter a valid phone number (6 to 15 digits).");
      setActiveTab("general");
      return;
    }

    setSaving(true);
    try {
      const eligibleIds = new Set(eligibleServices.map(s => s.id));
      const feesPayload = Object.entries(serviceFees)
        .map(([sid, val]) => ({
          service_id: parseInt(sid),
          fee: parseFloat(val) || 0.0
        }))
        .filter(x => x.fee > 0 && eligibleIds.has(x.service_id));

      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city,
        status: formData.status,
        vendor_type: formData.vendor_type,
        is_notary: formData.vendor_type === "NOTARY",
        is_gov_officer: formData.vendor_type === "GOVERNMENT_OFFICER",
        is_other_vendor: formData.vendor_type === "OTHER_VENDORS",
        notes: formData.notes || null,
        bank_name: formData.bank_name || null,
        bank_account_number: formData.bank_account_number || null,
        bank_account_holder_name: formData.bank_account_holder_name || null,
        bank_branch: formData.bank_branch || null,
        bank_swift_code: formData.bank_swift_code || null,
        service_fees: feesPayload
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/${notaryId}`, {
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Vendor profile updated successfully!");
        router.push("/business/clients/notaries");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update vendor record");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating vendor record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!notaryId) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/${notaryId}`, {
      credentials: "include",
        method: "DELETE",
        });

      if (res.ok) {
        toast.success("Vendor record deleted successfully!");
        router.push("/business/clients/notaries");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to delete vendor");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting vendor record");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading Vendor Profile...</p>
      </div>
    );
  }

  const valStatus = rawNotary?.validation_status || "PENDING_VALIDATION";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4">
          <Link href="/business/clients/notaries" className="mt-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border/50">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm shrink-0 flex items-center justify-center">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">Edit Vendor Profile</h1>
              {valStatus === "VALIDATED" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Profile
                </span>
              )}
              {valStatus === "PENDING_VALIDATION" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/20">
                  <Clock className="h-3.5 w-3.5" /> Pending Admin Review
                </span>
              )}
              {valStatus === "NEEDS_REVISION" && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-500/20">
                  <AlertTriangle className="h-3.5 w-3.5" /> Needs Revision
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Update credentials, vendor classification, bank destination account, and administrative validation for <strong>{formData.name}</strong>.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDeleteOpen(true)}
          className="text-destructive hover:bg-destructive/10 border-destructive/20 rounded-xl h-10 px-4 font-bold text-xs"
        >
          <Trash2 className="h-4 w-4 mr-1.5" /> Delete Vendor
        </Button>
      </div>

      {/* TOP ADMIN VALIDATION BANNER */}
      <div className={`p-4 rounded-xl border transition-all ${
        valStatus === "VALIDATED" 
          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-950 dark:text-emerald-100" 
          : valStatus === "NEEDS_REVISION"
          ? "bg-rose-500/10 border-rose-500/25 text-rose-950 dark:text-rose-100"
          : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              valStatus === "VALIDATED" 
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                : valStatus === "NEEDS_REVISION"
                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
            }`}>
              {valStatus === "VALIDATED" ? <ShieldCheck className="h-5 w-5" /> : valStatus === "NEEDS_REVISION" ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm flex items-center gap-2">
                {valStatus === "VALIDATED" 
                  ? "Verified Vendor Profile" 
                  : valStatus === "NEEDS_REVISION"
                  ? "Profile Revision Requested"
                  : "Vendor Profile Pending Admin Validation"
                }
              </h3>
              <p className="text-xs opacity-90">
                {valStatus === "VALIDATED" ? (
                  <>Validated by <strong>{formatUserName(rawNotary?.validator, "Admin")}</strong> on {rawNotary?.validated_at ? new Date(rawNotary.validated_at).toLocaleDateString() : "Record"}. Credentials, pricing rules, and bank accounts are confirmed.</>
                ) : valStatus === "NEEDS_REVISION" ? (
                  <>Admin Feedback: <em>&ldquo;{rawNotary?.validation_notes || "Please review and complete the missing vendor details."}&rdquo;</em></>
                ) : (
                  <>Created by <strong>{formatUserName(rawNotary?.creator, "Employee")}</strong> on {rawNotary?.created_at ? new Date(rawNotary.created_at).toLocaleDateString() : "N/A"}. Please review vendor details and bank information before validating.</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {valStatus !== "VALIDATED" && (
              <Button
                type="button"
                onClick={() => handleValidateNotary("VALIDATED")}
                disabled={validating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-3 gap-1.5 shadow-sm"
              >
                {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                Approve &amp; Validate Vendor
              </Button>
            )}

            {valStatus !== "NEEDS_REVISION" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRevisionNotes(rawNotary?.validation_notes || "");
                  setRevisionDialogOpen(true);
                }}
                disabled={validating}
                className="border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 font-semibold text-xs h-9 px-3 gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Request Revision
              </Button>
            )}

            {valStatus === "VALIDATED" && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleValidateNotary("PENDING_VALIDATION")}
                disabled={validating}
                className="text-xs h-9 px-2.5 text-muted-foreground hover:text-foreground gap-1"
                title="Reset back to pending validation"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset Status
              </Button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-md overflow-hidden rounded-2xl">
          
          {/* TAB BAR NAVIGATION */}
          <div className="flex border-b border-border/60 bg-muted/20 px-6 pt-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "general"
                  ? "border-primary text-primary bg-background/50 rounded-t-lg"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Scale className="h-4 w-4" />
              <span>Vendor Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bank")}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "bank"
                  ? "border-primary text-primary bg-background/50 rounded-t-lg"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Landmark className="h-4 w-4" />
              <span>Bank Account</span>
              {formData.bank_name && formData.bank_account_number ? (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("fees")}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "fees"
                  ? "border-primary text-primary bg-background/50 rounded-t-lg"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Service Fees ({configuredFeesCount})</span>
            </button>
          </div>
          
          <CardContent className="p-6 sm:p-8 space-y-6">
            
            {/* TAB 1: VENDOR PROFILE */}
            {activeTab === "general" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Vendor Full Name *
                    </label>
                    <Input
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Maria Elizabeth, S.H., M.Kn."
                      className="h-10 text-sm font-medium bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      City / Jurisdiction *
                    </label>
                    <Input
                      required
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Jakarta Selatan"
                      className="h-10 text-sm font-medium bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1">
                      Vendor Type <span className="text-destructive">*</span>
                    </label>
                    <Select 
                      value={formData.vendor_type} 
                      onValueChange={(val) => setFormData(prev => ({ ...prev, vendor_type: val }))}
                    >
                      <SelectTrigger className={`h-10 rounded-xl bg-background font-medium ${!formData.vendor_type ? "text-muted-foreground border-amber-500/50" : ""}`}>
                        <SelectValue placeholder="Select Vendor Type..." />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" sideOffset={4}>
                        <SelectItem value="NOTARY" className="font-medium">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-500" />
                            Notary
                          </span>
                        </SelectItem>
                        <SelectItem value="GOVERNMENT_OFFICER" className="font-medium">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Government Body
                          </span>
                        </SelectItem>
                        <SelectItem value="OTHER_VENDORS" className="font-medium">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-cyan-500" />
                            Other Vendors
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Panel Status
                    </label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-background">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" sideOffset={4}>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Contact Email
                    </label>
                    <EmailInput
                      value={formData.email}
                      onChange={(val) => setFormData((prev) => ({ ...prev, email: val }))}
                      placeholder="notary@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Contact Phone / WhatsApp
                    </label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(val) => setFormData((prev) => ({ ...prev, phone: val }))}
                      placeholder="812 3456 789"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                    Office Physical Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="flex w-full rounded-xl border border-border/60 bg-background p-3.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-relaxed font-medium transition-all"
                    placeholder="Street name, Building block, suite info..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                    Specialties & Scope Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="flex w-full rounded-xl border border-border/60 bg-background p-3.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-relaxed font-medium transition-all"
                    placeholder="Enter details on specific skills, land deed authorizations, speed covenants, or other key notary remarks..."
                  />
                </div>
              </div>
            )}

            {/* TAB 2: BANK ACCOUNT */}
            {activeTab === "bank" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                  <Landmark className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">Xendit Payout / Disbursement Account:</span>
                    <p className="mt-0.5">
                      Configure destination bank account to enable 1-click automated payouts directly via Xendit.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Destination Bank Name / Code *
                    </label>
                    <Select
                      value={
                        INDONESIAN_BANKS.some(b => b.code === formData.bank_name?.toUpperCase())
                          ? formData.bank_name?.toUpperCase()
                          : (formData.bank_name ? "OTHER" : "")
                      }
                      onValueChange={(val) => {
                        if (val === "OTHER") {
                          setFormData(prev => ({ ...prev, bank_name: "" }));
                        } else {
                          setFormData(prev => ({ ...prev, bank_name: val }));
                        }
                      }}
                    >
                      <SelectTrigger className="h-10 rounded-xl bg-background">
                        <SelectValue placeholder="Select Destination Bank" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" sideOffset={4}>
                        {INDONESIAN_BANKS.map((b) => (
                          <SelectItem key={b.code} value={b.code}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(!INDONESIAN_BANKS.some(b => b.code === formData.bank_name?.toUpperCase()) || formData.bank_name === "") && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                        Custom Bank Code / Name
                      </label>
                      <Input
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        placeholder="e.g. MAYBANK, PANIN..."
                        className="h-10 text-sm font-medium bg-background rounded-xl"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Account Number *
                    </label>
                    <Input
                      name="bank_account_number"
                      value={formData.bank_account_number}
                      onChange={handleInputChange}
                      placeholder="e.g. 5420123456"
                      className="h-10 text-sm font-mono font-bold bg-background rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Account Holder Name *
                    </label>
                    <Input
                      name="bank_account_holder_name"
                      value={formData.bank_account_holder_name}
                      onChange={handleInputChange}
                      placeholder="Name registered on bank account..."
                      className="h-10 text-sm font-medium bg-background rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Branch Name (Optional)
                    </label>
                    <Input
                      name="bank_branch"
                      value={formData.bank_branch}
                      onChange={handleInputChange}
                      placeholder="e.g. KCU Sudirman"
                      className="h-10 text-sm font-medium bg-background rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      SWIFT / BIC Code (Optional)
                    </label>
                    <Input
                      name="bank_swift_code"
                      value={formData.bank_swift_code}
                      onChange={handleInputChange}
                      placeholder="e.g. CENAIDJA"
                      className="h-10 text-sm font-mono bg-background rounded-xl uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SERVICE FEES */}
            {activeTab === "fees" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Configure Service-Specific Fees
                    </label>
                    {formData.vendor_type && (
                      <span className="text-xs font-semibold text-muted-foreground">
                        Filtering for:{" "}
                        <span className="font-bold text-foreground">
                          {formData.vendor_type === "NOTARY" ? "Notary" : formData.vendor_type === "GOVERNMENT_OFFICER" ? "Government Body" : "Other Vendors"}
                        </span>
                      </span>
                    )}
                  </div>

                  {!formData.vendor_type ? (
                    <div className="p-8 text-center border border-dashed border-border/70 rounded-2xl bg-muted/20 flex flex-col items-center justify-center gap-3">
                      <Scale className="h-10 w-10 text-muted-foreground/40" />
                      <div>
                        <h3 className="text-sm font-bold text-foreground">No Vendor Type Selected</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md">
                          Please select a Vendor Type (Notary, Government Body, or Other Vendors) in the <strong>Vendor Profile</strong> tab to view and configure eligible services.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("general")}
                        className="mt-2 rounded-xl font-bold text-xs"
                      >
                        Go to Vendor Profile
                      </Button>
                    </div>
                  ) : eligibleServices.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border/70 rounded-2xl bg-muted/20 flex flex-col items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                      <h3 className="text-sm font-bold text-foreground">No Eligible Services Found</h3>
                      <p className="text-xs text-muted-foreground max-w-md">
                        There are currently no catalog services configured with requirement for{" "}
                        <strong>
                          {formData.vendor_type === "NOTARY" ? "Notary" : formData.vendor_type === "GOVERNMENT_OFFICER" ? "Government Body" : "Other Vendors"}
                        </strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-border/50 rounded-xl overflow-hidden bg-background/50">
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-[10px] border-b border-border/50 select-none">
                            <tr>
                              <th className="p-3">Service Name</th>
                              <th className="p-3">Service Code</th>
                              <th className="p-3 w-44 text-right">
                                {formData.vendor_type === "NOTARY" 
                                  ? "Notary Fee (IDR)" 
                                  : formData.vendor_type === "GOVERNMENT_OFFICER" 
                                  ? "Gov Body Fee (IDR)" 
                                  : "Vendor Fee (IDR)"}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {eligibleServices.map((s) => (
                              <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                                <td className="p-3 font-semibold text-foreground">
                                  {s.job_title}
                                  {s.description && (
                                    <div className="text-[10px] text-muted-foreground font-normal mt-0.5 whitespace-pre-wrap break-words max-w-lg leading-relaxed">
                                      {s.description}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 font-mono text-muted-foreground">{s.job_id}</td>
                                <td className="p-3 text-right">
                                  <div className="relative inline-block w-40">
                                    <span className="absolute left-2.5 top-2.5 text-[10px] font-mono text-muted-foreground leading-none">Rp</span>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      className="h-8 pl-7 text-right font-mono font-bold text-xs rounded-lg bg-background"
                                      value={serviceFees[s.id] || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setServiceFees(prev => ({ ...prev, [s.id]: val }));
                                      }}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-border/40 mt-6">
              <Link href="/business/clients/notaries">
                <Button type="button" variant="outline" className="rounded-xl h-10 px-5 font-bold">
                  Cancel
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                {activeTab === "general" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!formData.vendor_type) {
                        toast.error("Please select a Vendor Type first.");
                        return;
                      }
                      setActiveTab("bank");
                    }}
                    className="rounded-xl h-10 px-4 font-bold"
                  >
                    Next: Bank Account <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                )}
                {activeTab === "bank" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("fees")}
                    className="rounded-xl h-10 px-4 font-bold"
                  >
                    Next: Service Fees <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                )}

                <Button 
                  type="submit" 
                  disabled={saving} 
                  className="px-6 font-bold shadow-md gap-2 rounded-xl h-10"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* REVISION DIALOG MODAL */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Request Vendor Profile Revision
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide specific feedback or notes on what credentials, bank details, or pricing rules the creator needs to correct.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-foreground">Revision Notes / Feedback *</label>
            <textarea
              rows={3}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="e.g. Please verify the bank account number and provide full office address..."
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRevisionDialogOpen(false)}
              className="rounded-xl h-9 px-4 font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={validating || !revisionNotes.trim()}
              onClick={() => handleValidateNotary("NEEDS_REVISION", revisionNotes.trim())}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1 rounded-xl h-9 px-4 text-xs"
            >
              {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Submit Revision Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Delete Vendor Record</DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Are you sure you want to delete <span className="font-bold text-foreground">{formData.name}</span>? This action cannot be undone.
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
              className="rounded-xl h-10 px-4 font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors" 
              onClick={handleDelete} 
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
