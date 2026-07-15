"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building, User } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function NewCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("company");
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const [formData, setFormData] = useState({
    company_name: "",
    company_code: "",
    industry: "",
    tax_number: "",
    address: "",
    key_contact_person: "",
    key_contact_email: "",
    key_contact_phone: "",
    status: "ACTIVE",
    client_id: null as number | null
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  // Load clients list for parent client dropdown
  useEffect(() => {
    const fetchClients = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          setClients(await response.json());
        }
      } catch (err) {
        console.error("Error fetching clients list:", err);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, [token]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
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
        throw new Error(err.detail || "Failed to create company profile");
      }

      router.push("/clients/companies");
    } catch (err: any) {
      setError(err.message || "Failed to register company");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-10">
      <div className="flex items-start gap-4">
        <Link href="/clients/companies" className="mt-1">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Client Company</h1>
          <p className="text-muted-foreground mt-1">Register corporate profiles under parent representative owners.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-auto sm:h-12 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="company" className="h-full gap-2 text-sm">
              <Building className="h-4 w-4" /> <span>Company Profile</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="h-full gap-2 text-sm">
              <User className="h-4 w-4" /> <span>Key Contact Setup</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Company Profile */}
          <TabsContent value="company" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Primary corporate identifiers and registration data.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Select Parent Client Representative */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parent Client Representative (Optional)</label>
                  <Select 
                    value={selectedClientId} 
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a client... (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Parent Client (Standalone) --</SelectItem>
                      {clients.map((cl) => (
                        <SelectItem key={cl.id} value={cl.id.toString()}>
                          {cl.contact_person} ({cl.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Select the client owner who holds the contract for this company.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company_name">Company Name *</label>
                    <Input 
                      id="company_name" 
                      name="company_name" 
                      value={formData.company_name} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="e.g. Acme Corporation" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company_code">Company Code * (Username)</label>
                    <Input 
                      id="company_code" 
                      name="company_code" 
                      value={formData.company_code} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="e.g. CLI-ACME" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="industry">Industry Segment</label>
                    <Input 
                      id="industry" 
                      name="industry" 
                      value={formData.industry} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Tech, Manufacturing, Logistics" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="tax_number">Tax ID / NPWP Number</label>
                    <Input 
                      id="tax_number" 
                      name="tax_number" 
                      value={formData.tax_number} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Tax Registration ID" 
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
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Complete physical office address..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={() => setActiveTab("contact")} className="gap-1">
                    Continue to Key Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Key Contact Setup */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Key Contact Configuration</CardTitle>
                <CardDescription>Assign the main representative who holds operational communications for this entity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="key_contact_person">Key Contact Person Name</label>
                    <Input 
                      id="key_contact_person" 
                      name="key_contact_person" 
                      value={formData.key_contact_person} 
                      onChange={handleInputChange} 
                      placeholder="e.g. John Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="key_contact_email">Key Contact Email</label>
                    <Input 
                      id="key_contact_email" 
                      name="key_contact_email" 
                      type="email"
                      value={formData.key_contact_email} 
                      onChange={handleInputChange} 
                      placeholder="e.g. keycontact@company.com" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="key_contact_phone">Key Contact Phone</label>
                    <Input 
                      id="key_contact_phone" 
                      name="key_contact_phone" 
                      value={formData.key_contact_phone} 
                      onChange={handleInputChange} 
                      placeholder="e.g. +62 812..." 
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("company")}>
                    Back to Profile
                  </Button>
                  <Button type="submit" disabled={loading} className="px-6">
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
