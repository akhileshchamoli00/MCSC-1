"use client";
 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building, Mail, MapPin, Lock, User, Phone, Globe, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createCompany, setCreateCompany] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  const [formData, setFormData] = useState({
    // Client Personal Details
    contact_person: "",
    email: "",
    phone: "",
    date_of_birth: "",
    nationality: "",
    gender: "",
    identification_number: "",
    personal_address: "",
    
    // Company Details
    company_name: "",
    company_code: "",
    address: "",
    tax_number: "",
    industry: "",
    notes: "",
    password: "Password123!" // default temporary password
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("hrms_token");
    if (!token) {
      setError("Authentication token not found.");
      setLoading(false);
      return;
    }

    // Clean payload: if not creating a company, set company fields to empty/null
    const payload = {
      ...formData,
      // Date parsing validation
      date_of_birth: formData.date_of_birth || null,
      company_name: createCompany ? formData.company_name : "",
      company_code: createCompany ? formData.company_code : "",
      address: createCompany ? formData.address : "",
      tax_number: createCompany ? formData.tax_number : "",
      industry: createCompany ? formData.industry : "",
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to create client profile");
      }

      router.push("/clients");
    } catch (err: any) {
      setError(err.message || "Failed to create client");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-10">
      <div className="flex items-start gap-4">
        <Link href="/clients" className="mt-1">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Client Partner</h1>
          <p className="text-muted-foreground mt-1">Configure client personal profiles, corporate accounts, and portal login credentials.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-auto sm:h-12 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="personal" className="h-full gap-2 text-sm">
              <User className="h-4 w-4" /> <span className="hidden md:inline">Client Personal Details</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="h-full gap-2 text-sm">
              <Building className="h-4 w-4" /> <span className="hidden md:inline">Company Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="h-full gap-2 text-sm">
              <Lock className="h-4 w-4" /> <span className="hidden md:inline">Portal Security</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Personal Details */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Client Representative Personal Information</CardTitle>
                <CardDescription>Primary identification details of the client owner.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="contact_person">Representative Full Name *</label>
                    <Input 
                      id="contact_person" 
                      name="contact_person" 
                      value={formData.contact_person} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="e.g. Donald Trump" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="date_of_birth">Date of Birth</label>
                    <Input 
                      id="date_of_birth" 
                      name="date_of_birth" 
                      type="date"
                      value={formData.date_of_birth} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="nationality">Nationality</label>
                    <Input 
                      id="nationality" 
                      name="nationality" 
                      value={formData.nationality} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Indonesian, German" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="gender">Gender</label>
                    <Select 
                      value={formData.gender} 
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
                    <label className="text-sm font-medium" htmlFor="identification_number">Passport / ID Identification Number</label>
                    <Input 
                      id="identification_number" 
                      name="identification_number" 
                      value={formData.identification_number} 
                      onChange={handleInputChange} 
                      placeholder="National ID Card or Passport No." 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="phone">Personal Phone Number</label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      type="tel"
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="e.g. +62 812 3456 789" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="email">Personal Email Address *</label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email"
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required
                      placeholder="e.g. contact@domain.com" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="personal_address">Residential Address</label>
                    <textarea 
                      id="personal_address" 
                      name="personal_address" 
                      value={formData.personal_address} 
                      onChange={handleInputChange} 
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Residential address of the client representative..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={() => setActiveTab("company")} className="gap-1">
                    Continue to Company Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Company Profile */}
          <TabsContent value="company" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Client Corporate Association</CardTitle>
                <CardDescription>Register corporate lines, industry segment, and registered offices.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Optional Company creation checkbox */}
                <div className="flex items-center gap-2 pb-4 border-b border-border/40 mb-4">
                  <Checkbox 
                    id="create-company-toggle"
                    checked={createCompany}
                    onCheckedChange={(checked) => setCreateCompany(!!checked)}
                  />
                  <div className="flex flex-col">
                    <label 
                      htmlFor="create-company-toggle"
                      className="text-sm font-semibold text-foreground cursor-pointer select-none"
                    >
                      Register a Company Profile now
                    </label>
                    <span className="text-xs text-muted-foreground">Uncheck this if you only want to register the client representative details for now.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company_name">Company Name{createCompany && " *"}</label>
                    <Input 
                      id="company_name" 
                      name="company_name" 
                      value={formData.company_name} 
                      onChange={handleInputChange} 
                      required={createCompany}
                      disabled={!createCompany}
                      placeholder={createCompany ? "e.g. Acme Corp" : "Disabled (Company registration skipped)"} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company_code">Company Code{createCompany && " * (Username)"}</label>
                    <Input 
                      id="company_code" 
                      name="company_code" 
                      value={formData.company_code} 
                      onChange={handleInputChange} 
                      required={createCompany}
                      disabled={!createCompany}
                      placeholder={createCompany ? "e.g. CLI-ACME" : "Disabled"} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="industry">Industry Segment</label>
                    <Input 
                      id="industry" 
                      name="industry" 
                      value={formData.industry} 
                      onChange={handleInputChange} 
                      disabled={!createCompany}
                      placeholder={createCompany ? "e.g. Tech, Logistics" : "Disabled"} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="tax_number">Tax ID / NPWP Number</label>
                    <Input 
                      id="tax_number" 
                      name="tax_number" 
                      value={formData.tax_number} 
                      onChange={handleInputChange} 
                      disabled={!createCompany}
                      placeholder={createCompany ? "e.g. NPWP / Tax Registration ID" : "Disabled"} 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="address">Registered Office Address</label>
                    <textarea 
                      id="address" 
                      name="address" 
                      value={formData.address} 
                      onChange={handleInputChange} 
                      rows={3}
                      disabled={!createCompany}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder={createCompany ? "Enter the complete corporate office address..." : "Disabled"}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("personal")}>
                    Back to Personal
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("security")}>
                    Continue to Security
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Portal Login */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Portal Security Credentials</CardTitle>
                <CardDescription>Setup client portal login authorization details and instructions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="login_email">Portal Login Email (Username)</label>
                    <Input 
                      id="login_email" 
                      name="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required
                      placeholder="Portal Login Username Email" 
                    />
                    <p className="text-xs text-muted-foreground">Matches the Personal Email entered in Step 1 (editable if needed).</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="password">Initial Access Password *</label>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="Enter temporary client password" 
                    />
                    <p className="text-xs text-muted-foreground">Prefilled with temporary password. The client can reset this upon first login.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="notes">Operational Notes & Directives</label>
                    <textarea 
                      id="notes" 
                      name="notes" 
                      value={formData.notes} 
                      onChange={handleInputChange} 
                      rows={4}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Add any internal remarks, guidelines, or special preferences..."
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("company")}>
                    Back to Company
                  </Button>
                  <Button type="submit" disabled={loading} className="px-6">
                    {loading ? "Creating Client..." : "Save Client & Finish"}
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
