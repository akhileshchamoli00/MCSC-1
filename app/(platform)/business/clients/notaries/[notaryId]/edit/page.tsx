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
  Trash2
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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function EditNotaryPage() {
  const router = useRouter();
  const params = useParams();
  const notaryId = params?.notaryId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  // Fetch Notary Data & Services
  useEffect(() => {
    if (!token || !notaryId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Notary
        const resNotary = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/${notaryId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!resNotary.ok) {
          toast.error("Notary public not found");
          router.push("/business/clients/notaries");
          return;
        }

        const data = await resNotary.json();
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          status: data.status || "ACTIVE",
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
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (resServices.ok) {
          const sData = await resServices.json();
          setServices(Array.isArray(sData) ? sData : []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading notary details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, notaryId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !notaryId) return;
    setSaving(true);
    try {
      const feesPayload = Object.entries(serviceFees)
        .map(([sid, val]) => ({
          service_id: parseInt(sid),
          fee: parseFloat(val) || 0.0
        }))
        .filter(x => x.fee > 0);

      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city,
        status: formData.status,
        notes: formData.notes || null,
        bank_name: formData.bank_name || null,
        bank_account_number: formData.bank_account_number || null,
        bank_account_holder_name: formData.bank_account_holder_name || null,
        bank_branch: formData.bank_branch || null,
        bank_swift_code: formData.bank_swift_code || null,
        service_fees: feesPayload
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/${notaryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Notary public updated successfully!");
        router.push("/business/clients/notaries");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update notary record");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating notary record");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !notaryId) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/${notaryId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Notary record deleted successfully!");
        router.push("/business/clients/notaries");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to delete notary");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting notary record");
    } finally {
      setSaving(false);
    }
  };

  const notaryServices = services.filter((s) => s.needs_notary);
  const configuredFeesCount = notaryServices.filter((s) => parseFloat(serviceFees[s.id] || "0") > 0).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading Notary Profile...</p>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold tracking-tight">Edit Notary Profile</h1>
            <p className="text-muted-foreground mt-1">
              Update legal credentials, bank destination account, and service fees for <strong>{formData.name}</strong>.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDeleteOpen(true)}
          className="text-destructive hover:bg-destructive/10 border-destructive/20 rounded-xl h-10 px-4 font-bold text-xs"
        >
          <Trash2 className="h-4 w-4 mr-1.5" /> Delete Notary
        </Button>
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
              <span>Notary Public Profile</span>
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
            
            {/* TAB 1: NOTARY PUBLIC PROFILE */}
            {activeTab === "general" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Notary Full Name *
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
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Contact Email
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. notary@example.com"
                      className="h-10 text-sm font-medium bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                      Contact Phone / WhatsApp
                    </label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +62 812 3456 789"
                      className="h-10 text-sm font-medium bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <SelectContent>
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
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                    Configure Service-Specific Fees
                  </label>
                  <div className="border border-border/50 rounded-xl overflow-hidden bg-background/50">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase font-bold text-[10px] border-b border-border/50 select-none">
                          <tr>
                            <th className="p-3">Service Name</th>
                            <th className="p-3">Service Code</th>
                            <th className="p-3 w-44 text-right">Notary Fee (IDR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {services.filter((s) => s.needs_notary).map((s) => (
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
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-border/40 mt-6">
              <Link href="/business/clients/notaries">
                <Button type="button" variant="outline" className="rounded-xl h-10 px-5 font-bold border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                  Cancel
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                {activeTab === "general" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("bank")}
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
                  className="px-6 font-bold shadow-md gap-2 rounded-xl h-10 bg-zinc-900 hover:bg-zinc-100 text-zinc-50 hover:text-zinc-900 border border-zinc-900 dark:bg-zinc-100 dark:hover:bg-zinc-900 dark:text-zinc-950 dark:hover:text-zinc-100 dark:border-zinc-100 transition-all duration-200"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Delete Notary Record</DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Are you sure you want to delete <span className="font-bold text-foreground">{formData.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl h-10 px-4 font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors bg-transparent" 
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
              {saving ? "Deleting..." : "Delete Notary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
