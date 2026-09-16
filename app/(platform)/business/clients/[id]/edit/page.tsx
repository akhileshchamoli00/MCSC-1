"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PhoneInput } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";
import {
  ArrowLeft,
  Building,
  Mail,
  Lock,
  User,
  Phone,
  Plus,
  Loader2,
  Save,
  CheckCircle,
  Building2,
  KeyRound,
  ShieldCheck,
  Link as LinkIcon,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";

interface CompanyOption {
  id: number;
  company_name: string;
  company_code: string;
}

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_all", "view");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal");

  const [customerData, setCustomerData] = useState<any>(null);
  const [availableCompanies, setAvailableCompanies] = useState<CompanyOption[]>([]);
  const [selectedLinkCompanyId, setSelectedLinkCompanyId] = useState("NONE");

  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    status: "ACTIVE",
    notes: "",
    date_of_birth: "",
    nationality: "",
    gender: "",
    identification_number: "",
    address: "",
    company_id: "NONE"
  });

  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  // Authorization Check
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to edit clients.");
      router.replace("/business/dashboard");
    }
  }, [userLoading, canView, router]);

  const fetchCustomerDetails = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const [custRes, compRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/${customerId}`, {
          credentials: "include"
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, {
          credentials: "include"
        })
      ]);

      if (custRes.ok) {
        const data = await custRes.json();
        setCustomerData(data);
        setEditForm({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          status: data.status || "ACTIVE",
          notes: data.notes || "",
          date_of_birth: data.date_of_birth ? data.date_of_birth.substring(0, 10) : "",
          nationality: data.nationality || "",
          gender: data.gender || "",
          identification_number: data.identification_number || "",
          address: data.address || "",
          company_id: data.company_id ? data.company_id.toString() : "NONE"
        });
      } else {
        setError("Failed to fetch client details or client not found.");
      }

      if (compRes.ok) {
        const comps = await compRes.json();
        if (Array.isArray(comps)) {
          setAvailableCompanies(comps);
        }
      }
    } catch (err) {
      console.error("Error loading client details:", err);
      setError("An unexpected error occurred while loading client details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && canView) {
      fetchCustomerDetails();
    }
  }, [customerId, userLoading, canView]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;

    if (!editForm.full_name.trim()) {
      setError("Client full name is required.");
      setActiveTab("personal");
      return;
    }

    if (!editForm.email.trim()) {
      setError("Client email address is required.");
      setActiveTab("personal");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: any = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim() || null,
        status: editForm.status,
        notes: editForm.notes.trim() || null,
        date_of_birth: editForm.date_of_birth || null,
        nationality: editForm.nationality.trim() || null,
        gender: editForm.gender.trim() || null,
        identification_number: editForm.identification_number.trim() || null,
        address: editForm.address.trim() || null,
        company_id: editForm.company_id && editForm.company_id !== "NONE" ? parseInt(editForm.company_id) : null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Client details updated successfully!");
        setSuccess("Client details updated successfully!");
        setTimeout(() => {
          router.push("/business/clients");
        }, 600);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update client details");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save changes.");
      toast.error(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkCompany = async () => {
    if (selectedLinkCompanyId === "NONE") return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/${customerId}/link-company?company_id=${selectedLinkCompanyId}`,
        {
          method: "POST",
          credentials: "include"
        }
      );
      if (res.ok) {
        toast.success("Company linked to client successfully!");
        setSelectedLinkCompanyId("NONE");
        fetchCustomerDetails();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to link company");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to link company");
    }
  };

  const handleUnlinkCompany = async (companyId: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/${customerId}/unlink-company?company_id=${companyId}`,
        {
          method: "POST",
          credentials: "include"
        }
      );
      if (res.ok) {
        toast.success("Company unlinked successfully");
        fetchCustomerDetails();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to unlink company");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to unlink company");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setResettingPassword(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/${customerId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ new_password: newPassword })
      });
      if (res.ok) {
        toast.success("Client portal password updated successfully!");
        setNewPassword("");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to reset password");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const linkedCompanies =
    customerData?.companies && customerData.companies.length > 0
      ? customerData.companies
      : customerData?.company
      ? [customerData.company]
      : [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header & Back Action */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/business/clients">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Edit Client - {customerData?.full_name || "Client"}
              </h1>
              {(customerData?.client_code || customerData?.customer_code) && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs font-semibold">
                  {customerData.client_code || customerData.customer_code}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update contact information, manage corporate company associations, and configure portal credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/business/clients">
            <Button variant="ghost" size="sm" className="text-xs">
              Cancel
            </Button>
          </Link>
          <Button 
            onClick={handleSubmit} 
            disabled={saving}
            className="gap-2 font-bold shadow-sm rounded-xl px-5 text-xs h-9"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Save Changes
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/25 text-destructive p-3.5 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl text-xs font-medium">
          {success}
        </div>
      )}

      {/* Main Tabs Card */}
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md h-10 p-1 bg-muted/60 rounded-xl">
            <TabsTrigger value="personal" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              <User className="h-3.5 w-3.5" /> Client Details
            </TabsTrigger>
            <TabsTrigger value="company" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              <Building2 className="h-3.5 w-3.5" /> Company Entity ({linkedCompanies.length})
            </TabsTrigger>
            <TabsTrigger value="portal" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              <Lock className="h-3.5 w-3.5" /> Portal Access
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CLIENT DETAILS */}
          <TabsContent value="personal">
            <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-xs rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Client Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Primary contact and identity details for this client account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      name="full_name"
                      placeholder="e.g. John Doe"
                      value={editForm.full_name}
                      onChange={handleInputChange}
                      className="h-9 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Email Address <span className="text-destructive">*</span>
                    </label>
                    <EmailInput
                      name="email"
                      placeholder="e.g. john@company.com"
                      value={editForm.email}
                      onChange={(val) => setEditForm((p) => ({ ...p, email: val }))}
                      required
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Mobile Phone</label>
                    <PhoneInput
                      value={editForm.phone}
                      onChange={(val) => setEditForm((p) => ({ ...p, phone: val }))}
                      placeholder="+62 812 3456 7890"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Account Status</label>
                    <Select
                      value={editForm.status}
                      onValueChange={(val) => handleSelectChange("status", val)}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="DISABLED">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Date of Birth</label>
                    <Input
                      type="date"
                      name="date_of_birth"
                      value={editForm.date_of_birth}
                      onChange={handleInputChange}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Nationality</label>
                    <Input
                      name="nationality"
                      placeholder="e.g. Indonesian / Australian"
                      value={editForm.nationality}
                      onChange={handleInputChange}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Gender</label>
                    <Select
                      value={editForm.gender}
                      onValueChange={(val) => handleSelectChange("gender", val)}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">National ID / KTP / Passport</label>
                    <Input
                      name="identification_number"
                      placeholder="e.g. 3171xxxxxxxx0001"
                      value={editForm.identification_number}
                      onChange={handleInputChange}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground">Residential Address</label>
                    <Input
                      name="address"
                      placeholder="Street, City, Province, Country"
                      value={editForm.address}
                      onChange={handleInputChange}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-foreground">Internal Notes / Background</label>
                  <textarea
                    name="notes"
                    rows={3}
                    placeholder="Internal notes or communication log for this client..."
                    value={editForm.notes}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: COMPANY ENTITY */}
          <TabsContent value="company">
            <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-xs rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Associated Companies
                </CardTitle>
                <CardDescription className="text-xs">
                  Companies currently linked to this client account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* List of currently linked companies */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Currently Linked Companies</label>
                  {linkedCompanies.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground border border-dashed border-border/60 rounded-xl">
                      <p className="text-xs">No companies are currently associated with this client.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {linkedCompanies.map((comp: any) => (
                        <div
                          key={comp.id}
                          className="flex items-center justify-between p-3 bg-muted/20 border border-border/50 rounded-xl"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Building className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{comp.company_name}</p>
                              <p className="font-mono text-[10px] text-muted-foreground">{comp.company_code}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlinkCompany(comp.id)}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Unlink company"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Link another company */}
                <div className="p-4 bg-muted/30 border border-border/50 rounded-xl space-y-3">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5 text-primary" />
                    Link Another Existing Company
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedLinkCompanyId}
                      onValueChange={setSelectedLinkCompanyId}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl bg-background flex-1">
                        <SelectValue placeholder="Choose a registered corporate entity..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="NONE">-- Select Company --</SelectItem>
                        {availableCompanies.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.company_name} ({c.company_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={handleLinkCompany}
                      disabled={selectedLinkCompanyId === "NONE"}
                      className="text-xs h-9 rounded-xl px-4"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PORTAL ACCESS */}
          <TabsContent value="portal">
            <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-xs rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Client Portal Authentication
                </CardTitle>
                <CardDescription className="text-xs">
                  Set or reset the login password for this client account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Reset Portal Password</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">New Password</label>
                    <div className="flex gap-2 max-w-md">
                      <Input
                        type="password"
                        placeholder="Enter new password (8+ chars, uppercase, lowercase, digit)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-background font-mono"
                      />
                      <Button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={!newPassword || resettingPassword}
                        className="text-xs h-9 rounded-xl px-4 shrink-0"
                      >
                        {resettingPassword ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Client logs in using email: <span className="font-semibold text-foreground">{editForm.email}</span>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Submission Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 mt-6">
          <Link href="/business/clients">
            <Button variant="outline" type="button" className="text-xs rounded-xl h-9 px-4">
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={saving}
            className="gap-2 font-bold shadow-sm rounded-xl px-6 text-xs h-9"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
