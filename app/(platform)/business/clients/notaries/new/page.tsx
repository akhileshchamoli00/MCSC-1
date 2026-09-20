"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { PhoneInput, isValidPhoneNumber, isValidEmail } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";

export default function NewNotaryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
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
    vendor_type: "", // Mandatory dropdown with no default selection
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

  // Fetch catalog services
  useEffect(() => {

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, {
      credentials: "include",
      })
      .then(res => res.json())
      .then(data => setServices(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error loading services:", err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Filter services dynamically based on the selected vendor type
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
        city: formData.city ? formData.city.trim() : null,
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/`, {
      credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Vendor registered successfully!");
        router.push("/business/clients/notaries");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to register vendor");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error registering vendor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      
      {/* Title Header */}
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
          <h1 className="text-3xl font-bold tracking-tight">Add Vendor</h1>
          <p className="text-muted-foreground mt-1">Register a new partner vendor / notary public to your panel list.</p>
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
                <span className="h-2 w-2 rounded-full bg-zinc-400" />
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
                      City / Jurisdiction
                    </label>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="e.g. Jakarta Selatan (Optional)"
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
                    {!formData.vendor_type && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Mandatory field. Controls eligible service fee options.
                      </p>
                    )}
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
                  Save Vendor & Finish
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
