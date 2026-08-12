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
import {
  ArrowLeft,
  Building,
  Mail,
  MapPin,
  Lock,
  User,
  Phone,
  Plus,
  Loader2,
  Save,
  ShieldAlert,
  ExternalLink,
  Edit2
} from "lucide-react";
import { toast } from "sonner";

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal");

  const [clientData, setClientData] = useState<any>(null);

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
  const [resettingPassword, setResettingPassword] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchClientDetails = async () => {
    if (!token || !clientId) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${clientId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setClientData(data);
        setEditForm({
          contact_person: data.contact_person || "",
          email: data.email || "",
          phone: data.phone || "",
          notes: data.notes || "",
          date_of_birth: data.date_of_birth || "",
          nationality: data.nationality || "",
          gender: data.gender || "",
          identification_number: data.identification_number || "",
          personal_address: data.personal_address || ""
        });
      } else {
        setError("Failed to fetch client details or client not found.");
      }
    } catch (err) {
      console.error("Error loading client details:", err);
      setError("An unexpected error occurred while loading client details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetails();
  }, [clientId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clientId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        toast.success("Client representative updated successfully!");
        setSuccess("Client details updated successfully!");
        setTimeout(() => {
          router.push("/business/clients");
        }, 800);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update client details");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update client");
      toast.error(err.message || "Failed to update client");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!token || !clientData) return;
    const newStatus = clientData.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${clientId}/status?status_str=${newStatus}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Client status set to ${newStatus}`);
        fetchClientDetails();
      } else {
        toast.error("Failed to update client status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating status");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clientId || !newPassword) return;
    setResettingPassword(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${clientId}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: newPassword })
      });
      if (res.ok) {
        toast.success(clientData?.user_id ? "Client portal password reset successfully!" : "Client portal account created successfully!");
        setNewPassword("");
        fetchClientDetails();
      } else {
        const errData = await res.json();
        toast.error(errData.detail || "Failed to reset password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error resetting password");
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading client details...</p>
      </div>
    );
  }

  if (error && !clientData) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto p-6 text-center">
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg border border-destructive/20 font-medium">
          {error}
        </div>
        <Link href="/business/clients">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Partner Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/business/clients">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{editForm.contact_person || "Edit Client"}</h1>
              {clientData?.client_code && (
                <Badge variant="outline" className="font-mono text-sm font-bold bg-primary/10 border-primary/20 text-primary">
                  {clientData.client_code}
                </Badge>
              )}
              <Badge variant={clientData?.status === "ACTIVE" ? "default" : "destructive"}>
                {clientData?.status || "ACTIVE"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Update representative details, manage associated companies, and configure portal credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            className="text-xs"
          >
            {clientData?.status === "ACTIVE" ? "Disable Client Account" : "Activate Client Account"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="gap-2 font-semibold shadow-md"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-xs font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-destructive/10 border border-destructive/25 text-destructive p-3 rounded-lg text-xs font-medium">
          {error}
        </div>
      )}

      {/* Main Full-Screen Form Container */}
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto sm:h-12 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="personal" className="h-full gap-2 text-sm">
              <User className="h-4 w-4" /> <span>Personal Details</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="h-full gap-2 text-sm">
              <Building className="h-4 w-4" /> <span>Associated Companies ({clientData?.companies?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="h-full gap-2 text-sm">
              <Lock className="h-4 w-4" /> <span>Portal Security</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Personal Details */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Client Representative Information</CardTitle>
                <CardDescription>Primary profile and contact details of the client representative.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="contact_person">Representative Full Name *</label>
                    <Input
                      id="contact_person"
                      name="contact_person"
                      value={editForm.contact_person}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Donald Trump"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="email">Email Address *</label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. contact@domain.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="phone">Phone Number</label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +62 812 3456 789"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="date_of_birth">Date of Birth</label>
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={editForm.date_of_birth}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="nationality">Nationality</label>
                    <Input
                      id="nationality"
                      name="nationality"
                      value={editForm.nationality}
                      onChange={handleInputChange}
                      placeholder="e.g. Indonesian, American"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="gender">Gender</label>
                    <Select
                      value={editForm.gender}
                      onValueChange={(val) => handleSelectChange("gender", val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="identification_number">Passport / ID Number</label>
                    <Input
                      id="identification_number"
                      name="identification_number"
                      value={editForm.identification_number}
                      onChange={handleInputChange}
                      placeholder="National ID Card or Passport No."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="personal_address">Residential Address</label>
                    <textarea
                      id="personal_address"
                      name="personal_address"
                      value={editForm.personal_address}
                      onChange={handleInputChange}
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Residential address of the client representative..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border/40 mt-4">
                  <Button type="button" onClick={() => setActiveTab("companies")} className="gap-2">
                    Manage Companies →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Associated Companies */}
          <TabsContent value="companies" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Associated Corporate Accounts</CardTitle>
                  <CardDescription>Corporate entities managed under this client representative.</CardDescription>
                </div>
                <Link href={`/clients/companies/new?client_id=${clientId}`}>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add New Company
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {!clientData?.companies || clientData.companies.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground space-y-2">
                    <Building className="h-10 w-10 mx-auto opacity-40" />
                    <p className="font-semibold text-sm">No Corporate Profiles Linked</p>
                    <p className="text-xs">Click "Add New Company" above to register a company for this client.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientData.companies.map((company: any) => (
                      <div key={company.id} className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3 hover:border-primary/40 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-base text-foreground">{company.company_name}</h4>
                            <span className="font-mono text-xs text-primary font-semibold">Code: {company.company_code}</span>
                          </div>
                          <Link href={`/clients/companies/${company.id}`}>
                            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                              <Edit2 className="h-3.5 w-3.5" /> Edit Company
                            </Button>
                          </Link>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-2">
                          {company.industry && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">Industry:</span> {company.industry}
                            </div>
                          )}
                          {company.tax_number && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">NPWP/Tax ID:</span> {company.tax_number}
                            </div>
                          )}
                          {company.address && (
                            <div className="flex items-start gap-2 truncate">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                              <span className="truncate">{company.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("personal")}>
                    ← Back to Personal
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("security")}>
                    Portal Security →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Portal Security */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Portal Access & Security</CardTitle>
                <CardDescription>Reset login credentials or change account access status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Reset Password Form */}
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" /> {clientData?.user_id ? "Reset Portal Password" : "Enable Portal Login Account"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {clientData?.user_id 
                        ? `Assign a new access password for ${editForm.contact_person}'s portal account (${editForm.email}).`
                        : `This partner representative does not have a portal login yet. Set a password to create their login account using email: ${editForm.email}.`
                      }
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end gap-3 max-w-md">
                    <div className="space-y-1.5 flex-1 w-full">
                      <label className="text-xs font-semibold">New Password</label>
                      <Input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="font-mono text-sm font-semibold"
                        placeholder="Enter new strong password"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resettingPassword || !newPassword}
                      className="w-full sm:w-auto"
                    >
                      {resettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : (clientData?.user_id ? "Update Password" : "Create Portal Account")}
                    </Button>
                  </div>
                </div>

                {/* Account Status Toggle */}
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Portal Account Status</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {clientData?.user_id ? (
                        <>Currently: <span className="font-bold uppercase text-foreground">{clientData?.status || "ACTIVE"}</span>. Disabling blocks client portal login.</>
                      ) : (
                        <>Currently: <span className="font-bold uppercase text-amber-600 dark:text-amber-400">NO PORTAL ACCESS</span>. Portal user login has not been set up.</>
                      )}
                    </p>
                  </div>
                  {clientData?.user_id && (
                    <Button
                      type="button"
                      variant={clientData?.status === "ACTIVE" ? "destructive" : "default"}
                      onClick={handleToggleStatus}
                      className="text-xs"
                    >
                      {clientData?.status === "ACTIVE" ? "Disable Client Portal Account" : "Activate Client Portal Account"}
                    </Button>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("companies")}>
                    ← Back to Companies
                  </Button>
                  <Button type="submit" disabled={saving} className="gap-2 font-semibold">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save All Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
