"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/phone-input";
import {
  Building,
  User,
  Building2,
  AlertCircle,
  Check,
  Loader2,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

export const isValidEmail = (email: string): boolean => {
  if (!email || !email.trim()) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

interface ClientOption {
  id: number | string;
  contact_person?: string;
  email?: string;
  [key: string]: any;
}

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target?: "target" | "billing";
  initialClientId?: string;
  clients: ClientOption[];
  onSuccess: (createdCompany: any) => void;
}

export function CreateCompanyDialog({
  open,
  onOpenChange,
  target = "target",
  initialClientId = "",
  clients = [],
  onSuccess
}: CreateCompanyDialogProps) {
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company_name: "",
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
    client_id: initialClientId || ""
  });

  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [dirEmailTouched, setDirEmailTouched] = useState(false);
  const [dirPhoneTouched, setDirPhoneTouched] = useState(false);

  // Reset form whenever dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab("company");
      setError(null);
      setEmailTouched(false);
      setPhoneTouched(false);
      setDirEmailTouched(false);
      setDirPhoneTouched(false);
      setFormData({
        company_name: "",
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
        client_id: initialClientId || ""
      });
    }
  }, [open, initialClientId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTouched(true);
    setPhoneTouched(true);

    if (!formData.company_name.trim()) {
      setError("Company Name is required");
      toast.error("Company Name is required");
      setActiveTab("company");
      return;
    }

    if (!formData.key_contact_person.trim()) {
      setError("Key Contact Person Name is mandatory");
      toast.error("Key Contact Person Name is mandatory");
      setActiveTab("contact");
      return;
    }

    if (!formData.key_contact_email.trim()) {
      setError("Key Contact Email is mandatory");
      toast.error("Key Contact Email is mandatory");
      setActiveTab("contact");
      return;
    }

    if (!isValidEmail(formData.key_contact_email)) {
      setError("Please enter a valid Key Contact Email address (e.g. contact@domain.com)");
      toast.error("Invalid email format. Please check the Key Contact Email.");
      setActiveTab("contact");
      return;
    }

    if (!formData.key_contact_phone || !formData.key_contact_phone.trim()) {
      setError("Key Contact Phone is mandatory");
      toast.error("Key Contact Phone is mandatory");
      setActiveTab("contact");
      return;
    }

    if (!isValidPhoneNumber(formData.key_contact_phone)) {
      setError("Please enter a valid Key Contact Phone number (6 to 15 digits)");
      toast.error("Invalid phone format. Please check the Key Contact Phone.");
      setActiveTab("contact");
      return;
    }

    if (formData.director_email && formData.director_email.trim() && !isValidEmail(formData.director_email)) {
      setError("Please enter a valid Director Email address or leave it blank");
      toast.error("Invalid email format for Director Email.");
      setActiveTab("contact");
      return;
    }

    if (
      formData.director_contact &&
      formData.director_contact.trim() &&
      formData.director_contact.trim() !== "+62" &&
      !isValidPhoneNumber(formData.director_contact)
    ) {
      setError("Please enter a valid Director Phone number or leave it blank");
      toast.error("Invalid phone format for Director Phone.");
      setActiveTab("contact");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        company_name: formData.company_name.trim(),
        industry: formData.industry.trim() || null,
        tax_number: formData.tax_number.trim() || null,
        address: formData.address.trim() || null,
        key_contact_person: formData.key_contact_person.trim(),
        key_contact_email: formData.key_contact_email.trim().toLowerCase(),
        key_contact_phone: formData.key_contact_phone.trim(),
        director_name: formData.director_name.trim() || null,
        director_email: formData.director_email.trim() ? formData.director_email.trim().toLowerCase() : null,
        director_contact:
          formData.director_contact.trim() && formData.director_contact.trim() !== "+62"
            ? formData.director_contact.trim()
            : null,
        notes: formData.notes.trim() || null,
        status: "ACTIVE",
        client_id: formData.client_id && formData.client_id !== "none" ? parseInt(formData.client_id) : null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/standalone`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        let errMsg = "Failed to create company profile";
        if (err.detail) {
          if (typeof err.detail === "string") {
            errMsg = err.detail;
          } else if (Array.isArray(err.detail)) {
            errMsg = err.detail.map((e: any) => `${e.loc.join(".")}: ${e.msg}`).join(", ");
          } else {
            errMsg = JSON.stringify(err.detail);
          }
        }
        throw new Error(errMsg);
      }

      const createdComp = await res.json();
      toast.success(`Company "${createdComp.company_name}" created successfully!`);
      onSuccess(createdComp);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to create company profile");
      toast.error(err.message || "Failed to create company profile");
    } finally {
      setLoading(false);
    }
  };

  const yearSuffix = new Date().getFullYear().toString().slice(-2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl w-[96vw] max-h-[92vh] overflow-y-auto p-0 border border-border/80 shadow-2xl rounded-2xl bg-card">
        {/* Header Banner */}
        <div className="p-5 sm:p-6 pb-4 bg-muted/40 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs shrink-0">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                  Create New Company Entity
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Register a corporate entity profile for{" "}
                  <span className="font-semibold text-foreground">
                    {target === "billing" ? "invoicing & billing recipient" : "service delivery target"}
                  </span>
                  .
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="hidden sm:inline-flex px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider bg-background border-border/70 shrink-0"
            >
              {target === "billing" ? "Billing Entity" : "Target Entity"}
            </Badge>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="p-5 sm:p-6 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-5 h-10 bg-muted/40 p-1 rounded-xl border border-border/40">
                <TabsTrigger
                  value="company"
                  className="h-full gap-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs cursor-pointer"
                >
                  <Building className="h-3.5 w-3.5" /> <span>Company Profile</span>
                </TabsTrigger>
                <TabsTrigger
                  value="contact"
                  className="h-full gap-2 text-xs font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs cursor-pointer"
                >
                  <User className="h-3.5 w-3.5" /> <span>Key Contact Setup</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Company Profile */}
              <TabsContent value="company" className="space-y-4 focus-visible:outline-none">
                {/* Parent Client Representative */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Parent Client Representative (Optional)
                  </label>
                  <select
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <option value="">-- No Parent Client (Standalone) --</option>
                    {clients.map((cl) => (
                      <option key={cl.id} value={String(cl.id)}>
                        {cl.contact_person || `Client #${cl.id}`} {cl.email ? `(${cl.email})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Select the client owner who holds the contract for this company.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                      <span>Company Name</span>
                      <span className="text-destructive font-black">*</span>
                    </label>
                    <Input
                      required
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      placeholder="e.g. PT Mandiri Cipta Solusi"
                      className="h-10 rounded-xl border-border/70 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Company Code (Auto Generated)
                    </label>
                    <Input
                      readOnly
                      value={
                        formData.company_name
                          ? `A${yearSuffix}•••• (Auto-generated)`
                          : `A${yearSuffix}••••`
                      }
                      className="h-10 rounded-xl bg-muted/40 font-mono font-bold text-foreground border-border/50 select-none cursor-default"
                      placeholder={`Auto generated e.g. A${yearSuffix}2675`}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Auto-generated format: A + 2-digit Year + 4 Random Digits (e.g. A{yearSuffix}2675).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Industry Segment
                    </label>
                    <Input
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      placeholder="e.g. Technology, Manufacturing, Logistics"
                      className="h-10 rounded-xl border-border/70 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Tax ID / NPWP Number
                    </label>
                    <Input
                      name="tax_number"
                      value={formData.tax_number}
                      onChange={handleInputChange}
                      placeholder="e.g. 01.234.567.8-901.000"
                      className="h-10 rounded-xl font-mono border-border/70 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground">
                      Registered Office Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="flex w-full rounded-xl border border-border/70 bg-background p-3 text-xs placeholder:text-muted-foreground/50 resize-none font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      placeholder="Complete physical office address..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("contact")}
                    className="gap-1.5 font-bold rounded-xl h-9 px-4 text-xs cursor-pointer"
                  >
                    <span>Continue to Key Contact</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 2: Key Contact Setup */}
              <TabsContent value="contact" className="space-y-5 focus-visible:outline-none">
                {/* Section 1: Operational Key Contact */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/25 border border-border/60">
                  <div className="flex items-center justify-between pb-1 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Operational Key Contact (Mandatory)
                      </h4>
                    </div>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                      Auto-syncs to Documents &rarr; Board &amp; Stakeholders
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Primary operational representative. Automatically registered under the company&apos;s Board &amp; Stakeholders records.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-start">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <span>Contact Name</span>
                        <span className="text-destructive font-black">*</span>
                      </label>
                      <Input
                        required
                        name="key_contact_person"
                        value={formData.key_contact_person}
                        onChange={handleInputChange}
                        placeholder="e.g. John Doe"
                        className="h-10 rounded-xl border-border/70 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <span>Contact Email</span>
                        <span className="text-destructive font-black">*</span>
                      </label>
                      <Input
                        type="email"
                        required
                        name="key_contact_email"
                        value={formData.key_contact_email}
                        onChange={(e) => {
                          handleInputChange(e);
                          setEmailTouched(true);
                        }}
                        onBlur={() => setEmailTouched(true)}
                        placeholder="e.g. keycontact@company.com"
                        className={`h-10 rounded-xl border-border/70 bg-background transition-all focus-visible:ring-1 focus-visible:ring-primary ${
                          emailTouched && formData.key_contact_email && !isValidEmail(formData.key_contact_email)
                            ? "border-destructive ring-1 ring-destructive/30"
                            : ""
                        }`}
                      />
                      {emailTouched && formData.key_contact_email && !isValidEmail(formData.key_contact_email) && (
                        <p className="text-[10.5px] text-destructive font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>Invalid email (e.g. name@domain.com)</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <span>Contact Phone</span>
                        <span className="text-destructive font-black">*</span>
                      </label>
                      <PhoneInput
                        value={formData.key_contact_phone}
                        onChange={(val) => {
                          setFormData((prev) => ({ ...prev, key_contact_phone: val }));
                          setPhoneTouched(true);
                        }}
                        required
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Director Contact Details (Optional) */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/25 border border-border/60">
                  <div className="flex items-center justify-between pb-1 border-b border-border/40">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Director Contact Details (Optional)
                      </h4>
                    </div>
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                      Auto-syncs to Documents &rarr; Board &amp; Stakeholders
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    If entered, this director is automatically registered under the company&apos;s Board and Stakeholders records.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-start">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Director Full Name
                      </label>
                      <Input
                        name="director_name"
                        value={formData.director_name}
                        onChange={handleInputChange}
                        placeholder="e.g. Jane Smith"
                        className="h-10 rounded-xl border-border/70 bg-background focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Director Email
                      </label>
                      <Input
                        type="email"
                        name="director_email"
                        value={formData.director_email}
                        onChange={(e) => {
                          handleInputChange(e);
                          setDirEmailTouched(true);
                        }}
                        onBlur={() => setDirEmailTouched(true)}
                        placeholder="e.g. director@company.com"
                        className={`h-10 rounded-xl border-border/70 bg-background transition-all focus-visible:ring-1 focus-visible:ring-primary ${
                          dirEmailTouched && formData.director_email && !isValidEmail(formData.director_email)
                            ? "border-destructive ring-1 ring-destructive/30"
                            : ""
                        }`}
                      />
                      {dirEmailTouched && formData.director_email && !isValidEmail(formData.director_email) && (
                        <p className="text-[10.5px] text-destructive font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>Invalid email address</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Director Phone / WhatsApp
                      </label>
                      <PhoneInput
                        value={formData.director_contact}
                        onChange={(val) => {
                          setFormData((prev) => ({ ...prev, director_contact: val }));
                          setDirPhoneTouched(true);
                        }}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Internal Notes / Billing Instructions */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Internal Notes / Billing Instructions
                  </label>
                  <Input
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Special billing instructions, tax exemption details, etc."
                    className="h-10 rounded-xl border-border/70 bg-background focus-visible:ring-1 focus-visible:ring-primary text-xs"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer Action Controls */}
          <div className="flex items-center justify-end gap-3 p-4 sm:p-5 bg-muted/20 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 sm:h-10 px-4 sm:px-5 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 sm:h-10 px-5 sm:px-6 text-xs font-bold gap-2 rounded-xl cursor-pointer shadow-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save &amp; Select Company</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
