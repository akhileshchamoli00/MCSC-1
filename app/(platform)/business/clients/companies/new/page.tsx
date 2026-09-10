"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building, User, Building2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/phone-input";
import { toast } from "sonner";

export const isValidEmail = (email: string): boolean => {
  if (!email || !email.trim()) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

export default function NewCompanyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlClientId = searchParams ? searchParams.get("client_id") : null;
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("company");
  const [selectedClientId, setSelectedClientId] = useState<string>(urlClientId || "");

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
    client_id: null as number | null
  });

  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [dirEmailTouched, setDirEmailTouched] = useState(false);
  const [dirPhoneTouched, setDirPhoneTouched] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const [nextCompanySeq, setNextCompanySeq] = useState<number>(1);

  // Load clients list for parent client dropdown and get next sequence number
  useEffect(() => {
    const fetchClientsAndCount = async () => {
      if (!token) return;
      try {
        const [cliRes, compRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        if (cliRes.ok) setClients(await cliRes.json());
        if (compRes.ok) {
          const compData = await compRes.json();
          if (Array.isArray(compData)) setNextCompanySeq(compData.length + 1);
        }
      } catch (err) {
        console.error("Error fetching clients/companies list:", err);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClientsAndCount();
  }, [token]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEmailTouched(true);
    setPhoneTouched(true);

    if (!formData.company_name.trim()) {
      setError("Company Name is required");
      setLoading(false);
      setActiveTab("company");
      return;
    }
    if (!formData.key_contact_person.trim()) {
      setError("Key Contact Person Name is mandatory");
      setLoading(false);
      setActiveTab("contact");
      return;
    }
    if (!formData.key_contact_email.trim()) {
      setError("Key Contact Email is mandatory");
      setLoading(false);
      setActiveTab("contact");
      return;
    }
    if (!isValidEmail(formData.key_contact_email)) {
      setError("Please enter a valid Key Contact Email address (e.g. contact@domain.com)");
      toast.error("Invalid email format. Please check the Key Contact Email.");
      setLoading(false);
      setActiveTab("contact");
      return;
    }
    if (!formData.key_contact_phone || !formData.key_contact_phone.trim()) {
      setError("Key Contact Phone is mandatory");
      setLoading(false);
      setActiveTab("contact");
      return;
    }
    if (!isValidPhoneNumber(formData.key_contact_phone)) {
      setError("Please enter a valid Key Contact Phone number (6 to 15 digits)");
      toast.error("Invalid phone format. Please check the Key Contact Phone.");
      setLoading(false);
      setActiveTab("contact");
      return;
    }

    if (formData.director_email && formData.director_email.trim() && !isValidEmail(formData.director_email)) {
      setError("Please enter a valid Director Email address or leave it blank");
      toast.error("Invalid email format for Director Email.");
      setLoading(false);
      setActiveTab("contact");
      return;
    }
    if (formData.director_contact && formData.director_contact.trim() && formData.director_contact.trim() !== "+62" && !isValidPhoneNumber(formData.director_contact)) {
      setError("Please enter a valid Director Phone number or leave it blank");
      toast.error("Invalid phone format for Director Phone.");
      setLoading(false);
      setActiveTab("contact");
      return;
    }

    try {
      const payload = {
        ...formData,
        key_contact_email: formData.key_contact_email.trim().toLowerCase(),
        key_contact_phone: formData.key_contact_phone.trim(),
        director_name: formData.director_name.trim() || null,
        director_email: formData.director_email.trim() ? formData.director_email.trim().toLowerCase() : null,
        director_contact: (formData.director_contact.trim() && formData.director_contact.trim() !== "+62") ? formData.director_contact.trim() : null,
        client_id: selectedClientId && selectedClientId !== "none" ? parseInt(selectedClientId) : null
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/standalone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
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

      toast.success("Company profile created successfully!");
      router.push("/business/clients/companies");
    } catch (err: any) {
      setError(err.message || "Failed to register company");
      toast.error(err.message || "Failed to register company");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      <div className="flex items-start gap-4">
        <Link href="/business/clients/companies" className="mt-1">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="p-2.5 rounded-xl bg-muted/60 border border-border/60 text-foreground shadow-xs shrink-0 flex items-center justify-center">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add New Client Company</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Register corporate profiles under parent representative owners.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-xs font-medium p-4 rounded-xl border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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
                  <label className="text-xs font-semibold text-foreground">Parent Client Representative (Optional)</label>
                  <Select 
                    value={selectedClientId} 
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger className="w-full h-10 rounded-xl border-border/50 bg-background/60">
                      <SelectValue placeholder="Choose a client... (Optional)" />
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
                  <p className="text-[11px] text-muted-foreground">Select the client owner who holds the contract for this company.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground" htmlFor="company_name">Company Name *</label>
                    <Input 
                      id="company_name" 
                      name="company_name" 
                      value={formData.company_name} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="e.g. Acme Corporation" 
                      className="h-10 rounded-xl border-border/50 bg-background/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground" htmlFor="company_code">Company Code (Auto Generated)</label>
                    <Input 
                      id="company_code" 
                      name="company_code" 
                      readOnly
                      value={(formData as any).company_code || (formData.company_name ? `A${new Date().getFullYear().toString().slice(-2)}•••• (Auto-generated)` : `A${new Date().getFullYear().toString().slice(-2)}••••`)} 
                      className="h-10 rounded-xl bg-muted/40 font-mono font-bold text-foreground border-border/40"
                      placeholder={`Auto generated e.g. A${new Date().getFullYear().toString().slice(-2)}2675`} 
                    />
                    <p className="text-[10px] text-muted-foreground">Auto-generated format: A + 2-digit Year + 4 Random Digits (e.g. A{new Date().getFullYear().toString().slice(-2)}2675). Uniqueness is guaranteed across all companies.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground" htmlFor="industry">Industry Segment</label>
                    <Input 
                      id="industry" 
                      name="industry" 
                      value={formData.industry} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Technology, Manufacturing, Logistics" 
                      className="h-10 rounded-xl border-border/50 bg-background/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground" htmlFor="tax_number">Tax ID / NPWP Number</label>
                    <Input 
                      id="tax_number" 
                      name="tax_number" 
                      value={formData.tax_number} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Tax Registration ID" 
                      className="h-10 rounded-xl border-border/50 bg-background/60"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground" htmlFor="address">Registered Office Address</label>
                    <textarea 
                      id="address" 
                      name="address" 
                      value={formData.address} 
                      onChange={handleInputChange} 
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
                  <p className="text-[11px] text-muted-foreground">Primary operational representative. Automatically registered under the company&apos;s Board &amp; Stakeholders records.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-start">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground" htmlFor="key_contact_person">Key Contact Person Name *</label>
                      <Input 
                        id="key_contact_person" 
                        name="key_contact_person" 
                        required
                        value={formData.key_contact_person} 
                        onChange={handleInputChange} 
                        placeholder="e.g. John Doe" 
                        className="h-10 rounded-xl border-border/50 bg-background/60"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground" htmlFor="key_contact_email">Key Contact Email *</label>
                      <Input 
                        id="key_contact_email" 
                        name="key_contact_email" 
                        type="email" 
                        required
                        value={formData.key_contact_email} 
                        onChange={(e) => {
                          handleInputChange(e);
                          setEmailTouched(true);
                        }}
                        onBlur={() => setEmailTouched(true)}
                        placeholder="e.g. keycontact@company.com" 
                        className={`h-10 rounded-xl border-border/50 bg-background/60 transition-all ${
                          emailTouched && formData.key_contact_email && !isValidEmail(formData.key_contact_email)
                            ? "border-destructive ring-1 ring-destructive/30"
                            : ""
                        }`}
                      />
                      {emailTouched && formData.key_contact_email && !isValidEmail(formData.key_contact_email) && (
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
                        value={formData.key_contact_phone}
                        onChange={(val) => {
                          setFormData(prev => ({ ...prev, key_contact_phone: val }));
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
                  <p className="text-[11px] text-muted-foreground">If entered, this director is automatically registered under the company&apos;s Board and Stakeholders records.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-start">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground" htmlFor="director_name">Director Full Name</label>
                      <Input 
                        id="director_name" 
                        name="director_name" 
                        value={formData.director_name} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Jane Smith" 
                        className="h-10 rounded-xl border-border/50 bg-background/60"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-foreground" htmlFor="director_email">Director Email</label>
                      <Input 
                        id="director_email" 
                        name="director_email" 
                        type="email" 
                        value={formData.director_email} 
                        onChange={(e) => {
                          handleInputChange(e);
                          setDirEmailTouched(true);
                        }}
                        onBlur={() => setDirEmailTouched(true)}
                        placeholder="e.g. director@company.com" 
                        className={`h-10 rounded-xl border-border/50 bg-background/60 transition-all ${
                          dirEmailTouched && formData.director_email && !isValidEmail(formData.director_email)
                            ? "border-destructive ring-1 ring-destructive/30"
                            : ""
                        }`}
                      />
                      {dirEmailTouched && formData.director_email && !isValidEmail(formData.director_email) && (
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
                        value={formData.director_contact}
                        onChange={(val) => {
                          setFormData(prev => ({ ...prev, director_contact: val }));
                          setDirPhoneTouched(true);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Notes Row */}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <label className="text-xs font-semibold text-foreground" htmlFor="notes">Notes / Remarks</label>
                  <textarea 
                    id="notes" 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleInputChange} 
                    rows={3}
                    className="flex w-full rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Enter any additional notes or remarks about the company..."
                  />
                </div>

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("company")} className="rounded-xl font-semibold text-xs h-10 px-4">
                    Back to Profile
                  </Button>
                  <Button type="submit" disabled={loading} className="px-6 font-bold rounded-xl h-10 shadow-md">
                    {loading ? "Registering Company..." : "Save Company & Finish"}
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
