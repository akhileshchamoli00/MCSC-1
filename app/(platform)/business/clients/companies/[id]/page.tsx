"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building, 
  ArrowLeft, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  User
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import Link from "next/link";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id ? parseInt(params.id as string) : null;

  const [company, setCompany] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("company");

  const [companyForm, setCompanyForm] = useState({
    company_name: "",
    company_code: "",
    industry: "",
    tax_number: "",
    address: "",
    key_contact_person: "",
    key_contact_email: "",
    key_contact_phone: "",
    notes: "",
    status: "ACTIVE",
  });
  const [selectedClientId, setSelectedClientId] = useState<string>("none");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchCompanyDetails = async () => {
    if (!token || !companyId) return;
    try {
      setLoading(true);
      const [compRes, cliRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (cliRes.ok) setClients(await cliRes.json());

      if (compRes.ok) {
        const thisCompany = await compRes.json();
        setCompany(thisCompany);
        setCompanyForm({
          company_name: thisCompany.company_name || "",
          company_code: thisCompany.company_code || "",
          industry: thisCompany.industry || "",
          tax_number: thisCompany.tax_number || "",
          address: thisCompany.address || "",
          key_contact_person: thisCompany.key_contact_person || "",
          key_contact_email: thisCompany.key_contact_email || "",
          key_contact_phone: thisCompany.key_contact_phone || "",
          notes: thisCompany.notes || "",
          status: thisCompany.status || "ACTIVE",
        });
        setSelectedClientId(thisCompany.client_id ? thisCompany.client_id.toString() : "none");
      } else {
        setErrorMsg("Company not found or access denied.");
      }
    } catch (err) {
      console.error("Error loading company details:", err);
      setErrorMsg("Failed to load company record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, [companyId]);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !companyId) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        company_name: companyForm.company_name,
        company_code: companyForm.company_code,
        industry: companyForm.industry || null,
        tax_number: companyForm.tax_number || null,
        address: companyForm.address || null,
        key_contact_person: companyForm.key_contact_person || null,
        key_contact_email: companyForm.key_contact_email || null,
        key_contact_phone: companyForm.key_contact_phone || null,
        notes: companyForm.notes || null,
        status: companyForm.status,
        client_id: selectedClientId === "none" ? null : parseInt(selectedClientId)
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg("Company details updated successfully.");
        fetchCompanyDetails();
      } else {
        const err = await res.json();
        let errMsg = "Failed to update company";
        if (err.detail) {
          if (typeof err.detail === "string") {
            errMsg = err.detail;
          } else if (Array.isArray(err.detail)) {
            errMsg = err.detail.map((e: any) => `${e.loc.join(".")}: ${e.msg}`).join(", ");
          } else {
            errMsg = JSON.stringify(err.detail);
          }
        }
        setErrorMsg(errMsg);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error saving company details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading corporate profile...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Company Profile Not Found</h2>
        <Link href="/business/clients/companies">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Company List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/business/clients/companies">
            <Button variant="ghost" size="icon" title="Back to Company Directory">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{company.company_name}</h1>
              <Badge variant="outline" className="font-mono font-bold text-xs bg-primary/10 border-primary/30 text-primary">
                {company.company_code}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Edit corporate entity details, parent client association, and contact preferences.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md border border-red-200 dark:border-red-900/30">{errorMsg}</div>}
      {successMsg && <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-md border border-green-200 dark:border-green-900/30">{successMsg}</div>}

      <form onSubmit={handleUpdateCompany}>
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
                  <label className="text-sm font-medium">Parent Client Partner (Optional)</label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="No Parent Client" />
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company_name">Company Name *</label>
                    <Input 
                      id="company_name" 
                      required 
                      value={companyForm.company_name} 
                      onChange={(e) => setCompanyForm({...companyForm, company_name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="company_code">Company Code (Auto Generated)</label>
                    <Input 
                      id="company_code" 
                      value={companyForm.company_code} 
                      readOnly 
                      className="bg-muted/40 font-mono font-bold text-foreground" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="industry">Industry Segment</label>
                    <Input 
                      id="industry" 
                      value={companyForm.industry} 
                      onChange={(e) => setCompanyForm({...companyForm, industry: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="tax_number">Tax ID / NPWP</label>
                    <Input 
                      id="tax_number" 
                      value={companyForm.tax_number} 
                      onChange={(e) => setCompanyForm({...companyForm, tax_number: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="status">Operational Status</label>
                    <Select value={companyForm.status} onValueChange={(val) => setCompanyForm({...companyForm, status: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="DISABLED">DISABLED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="address">Registered Address</label>
                    <textarea 
                      id="address" 
                      value={companyForm.address} 
                      onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})} 
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
                <div className="space-y-6">
                  {/* Key Contact Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="key_contact_person">Key Contact Person Name</label>
                      <Input 
                        id="key_contact_person" 
                        placeholder="John Doe" 
                        value={companyForm.key_contact_person} 
                        onChange={(e) => setCompanyForm({...companyForm, key_contact_person: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="key_contact_email">Key Contact Email</label>
                      <Input 
                        id="key_contact_email" 
                        type="email" 
                        placeholder="john@example.com" 
                        value={companyForm.key_contact_email} 
                        onChange={(e) => setCompanyForm({...companyForm, key_contact_email: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="key_contact_phone">Key Contact Phone</label>
                      <Input 
                        id="key_contact_phone" 
                        placeholder="+62 812..." 
                        value={companyForm.key_contact_phone} 
                        onChange={(e) => setCompanyForm({...companyForm, key_contact_phone: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* Notes / Remarks */}
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium" htmlFor="notes">Notes / Remarks</label>
                    <textarea 
                      id="notes"
                      value={companyForm.notes} 
                      onChange={(e) => setCompanyForm({...companyForm, notes: e.target.value})} 
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Enter any additional notes or remarks about the company..."
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("company")}>
                    Back to Profile
                  </Button>
                  <Button type="submit" disabled={saving} className="px-6 font-semibold gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Profile Changes
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
