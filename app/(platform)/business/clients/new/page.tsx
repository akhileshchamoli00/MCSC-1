"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building, Lock, User, Plus, CheckCircle, UserCheck, Building2, ShieldCheck, Mail, Phone, Calendar } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";

interface CompanyOption {
  id: number;
  company_name: string;
  company_code: string;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_all", "view");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [companyMode, setCompanyMode] = useState<"NONE" | "LINK_EXISTING" | "CREATE_NEW">("NONE");
  const [createPortalAccount, setCreatePortalAccount] = useState(true);

  // Available Companies to Link
  const [availableCompanies, setAvailableCompanies] = useState<CompanyOption[]>([]);

  const [formData, setFormData] = useState({
    // Customer Personal Details
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    nationality: "",
    gender: "",
    identification_number: "",
    address: "",
    notes: "",
    
    // Existing Company Link
    selected_company_id: "NONE",

    // New Company Details
    company_name: "",
    company_code: "",
    company_address: "",
    tax_number: "",
    industry: "",
    director_name: "",
    director_email: "",
    director_contact: "+62",
    company_notes: "",

    // Portal Account
    password: "Password123!"
  });

  // Authorization Check
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to add clients.");
      router.replace("/business/dashboard");
    }
  }, [userLoading, canView, router]);

  // Load Companies
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setAvailableCompanies(data);
        }
      })
      .catch((err) => console.error("Failed to load companies", err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.full_name.trim()) {
      setError("Client full name is required.");
      setActiveTab("personal");
      return;
    }

    if (!formData.email.trim()) {
      setError("Client email address is required.");
      setActiveTab("personal");
      return;
    }

    if (companyMode === "CREATE_NEW" && !formData.company_name.trim()) {
      setError("Company Name is required when creating a new company.");
      setActiveTab("company");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        nationality: formData.nationality.trim() || null,
        gender: formData.gender.trim() || null,
        identification_number: formData.identification_number.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        create_portal_account: createPortalAccount,
        password: createPortalAccount ? formData.password || undefined : undefined
      };

      if (companyMode === "LINK_EXISTING" && formData.selected_company_id !== "NONE") {
        payload.company_id = parseInt(formData.selected_company_id);
      } else if (companyMode === "CREATE_NEW") {
        payload.company_name = formData.company_name.trim();
        payload.company_code = formData.company_code.trim() || null;
        payload.company_address = formData.company_address.trim() || null;
        payload.tax_number = formData.tax_number.trim() || null;
        payload.industry = formData.industry.trim() || null;
        payload.director_name = formData.director_name.trim() || null;
        payload.director_email = formData.director_email.trim() || null;
        payload.director_contact = formData.director_contact.trim() || null;
        payload.company_notes = formData.company_notes.trim() || null;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to create client");
      }

      const created = await res.json();
      toast.success(`Client created successfully with ID: ${created.customer_code}`);
      router.push("/business/clients");
    } catch (err: any) {
      setError(err.message || "Failed to create client");
      toast.error(err.message || "Failed to create client");
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Register New Client</h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                Auto CLI-xxxx ID
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create an independent client record, optionally link/create corporate entities, and set up portal access.
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
            disabled={loading}
            className="gap-2 font-bold shadow-sm rounded-xl px-5 text-xs h-9"
          >
            {loading ? "Creating..." : "Save Client"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/25 text-destructive p-3.5 rounded-xl text-xs font-medium">
          {error}
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
              <Building2 className="h-3.5 w-3.5" /> Company Entity
            </TabsTrigger>
            <TabsTrigger value="portal" className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs">
              <Lock className="h-3.5 w-3.5" /> Portal Access
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CLIENT PERSONAL DETAILS */}
          <TabsContent value="personal">
            <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-xs rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Client Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Primary contact and identity details of the client representative.
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
                      value={formData.full_name}
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
                      value={formData.email}
                      onChange={(val) => setFormData((p) => ({ ...p, email: val }))}
                      required
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Mobile Phone</label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(val) => setFormData((p) => ({ ...p, phone: val }))}
                      placeholder="+62 812 3456 7890"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Date of Birth</label>
                    <Input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Nationality</label>
                    <Input
                      name="nationality"
                      placeholder="e.g. Indonesian / Australian"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Gender</label>
                    <Select
                      value={formData.gender}
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
                      value={formData.identification_number}
                      onChange={handleInputChange}
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Residential Address</label>
                    <Input
                      name="address"
                      placeholder="Street, City, Province, Country"
                      value={formData.address}
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
                    placeholder="Add any internal background notes or special instructions for this customer..."
                    value={formData.notes}
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
                  Company Association
                </CardTitle>
                <CardDescription className="text-xs">
                  Link an existing corporate client company or register a new corporate entity for this customer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Mode Selector */}
                <div className="grid grid-cols-3 gap-3 p-1.5 bg-muted/40 rounded-xl border border-border/50">
                  <button
                    type="button"
                    onClick={() => setCompanyMode("NONE")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center ${
                      companyMode === "NONE"
                        ? "bg-background shadow-xs text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    No Company (Individual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyMode("LINK_EXISTING")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center ${
                      companyMode === "LINK_EXISTING"
                        ? "bg-background shadow-xs text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Link Existing Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyMode("CREATE_NEW")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center ${
                      companyMode === "CREATE_NEW"
                        ? "bg-background shadow-xs text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Create New Company
                  </button>
                </div>

                {/* Option 1: Link Existing Company */}
                {companyMode === "LINK_EXISTING" && (
                  <div className="space-y-3 p-4 bg-muted/20 border border-border/40 rounded-xl animate-in fade-in duration-300">
                    <label className="text-xs font-semibold text-foreground">Select Registered Company</label>
                    <Select
                      value={formData.selected_company_id}
                      onValueChange={(val) => handleSelectChange("selected_company_id", val)}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl bg-background">
                        <SelectValue placeholder="Choose a registered corporate entity..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        <SelectItem value="NONE">-- Select Company --</SelectItem>
                        {availableCompanies.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.company_name} ({c.company_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      This customer will be linked to the selected company, and will be able to view its orders and documents in the client portal.
                    </p>
                  </div>
                )}

                {/* Option 2: Create New Company */}
                {companyMode === "CREATE_NEW" && (
                  <div className="space-y-4 p-4 bg-muted/20 border border-border/40 rounded-xl animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/30">
                      <Building className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">New Company Profile</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Company Legal Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                          name="company_name"
                          placeholder="e.g. PT Maju Bersama Indonesia"
                          value={formData.company_name}
                          onChange={handleInputChange}
                          className="h-9 text-xs rounded-xl bg-background"
                          required={companyMode === "CREATE_NEW"}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Tax Number (NPWP)</label>
                        <Input
                          name="tax_number"
                          placeholder="e.g. 01.234.567.8-012.000"
                          value={formData.tax_number}
                          onChange={handleInputChange}
                          className="h-9 text-xs rounded-xl bg-background"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Industry Sector</label>
                        <Input
                          name="industry"
                          placeholder="e.g. Technology / Hospitality / Trading"
                          value={formData.industry}
                          onChange={handleInputChange}
                          className="h-9 text-xs rounded-xl bg-background"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Registered Office Address</label>
                        <Input
                          name="company_address"
                          placeholder="e.g. Jl. Sudirman No. 10, Jakarta Selatan"
                          value={formData.company_address}
                          onChange={handleInputChange}
                          className="h-9 text-xs rounded-xl bg-background"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Director Full Name</label>
                        <Input
                          name="director_name"
                          placeholder="e.g. Budi Santoso"
                          value={formData.director_name}
                          onChange={handleInputChange}
                          className="h-9 text-xs rounded-xl bg-background"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Director Email</label>
                        <Input
                          name="director_email"
                          type="email"
                          placeholder="e.g. director@company.com"
                          value={formData.director_email}
                          onChange={handleInputChange}
                          className="h-9 text-xs rounded-xl bg-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Company Notes</label>
                      <textarea
                        name="company_notes"
                        rows={2}
                        placeholder="Corporate deed details, license numbers, or special handling notes..."
                        value={formData.company_notes}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PORTAL ACCESS */}
          <TabsContent value="portal">
            <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-xs rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Client Portal Account Setup
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure authentication credentials for the customer to log in, track orders, and chat with legal consultants.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2.5 p-3.5 bg-muted/30 border border-border/50 rounded-xl">
                  <Checkbox
                    id="create_portal_account"
                    checked={createPortalAccount}
                    onCheckedChange={(checked) => setCreatePortalAccount(Boolean(checked))}
                    className="rounded-md"
                  />
                  <label
                    htmlFor="create_portal_account"
                    className="text-xs font-semibold leading-none cursor-pointer select-none"
                  >
                    Enable Client Portal Login for this Client
                  </label>
                </div>

                {createPortalAccount && (
                  <div className="space-y-3 p-4 bg-muted/20 border border-border/40 rounded-xl animate-in fade-in duration-300">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Initial Temporary Password</label>
                      <Input
                        type="password"
                        name="password"
                        placeholder="Password123!"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="h-9 text-xs rounded-xl bg-background max-w-md font-mono"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Client will log in using their email address: <span className="font-semibold text-foreground">{formData.email || "email@example.com"}</span>.
                      </p>
                    </div>
                  </div>
                )}
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
            disabled={loading}
            className="gap-2 font-bold shadow-sm rounded-xl px-6 text-xs h-9"
          >
            {loading ? "Registering Client..." : "Register Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
