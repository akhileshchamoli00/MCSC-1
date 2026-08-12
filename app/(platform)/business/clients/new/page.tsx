"use client";
// Force Next.js rebuild: Currency updated to IDR
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building, Lock, User, ShoppingCart, Plus, Trash2, Tag } from "lucide-react";
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

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createCompany, setCreateCompany] = useState(true);
  const [createPortalAccount, setCreatePortalAccount] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Available Services Catalog for Order Creation
  const [availableServices, setAvailableServices] = useState<any[]>([]);

  // Order Items State
  const [orderItems, setOrderItems] = useState<any[]>([
    {
      service_id: "",
      job_id: "",
      job_title: "",
      description: "",
      pricing_tier: "BASE",
      unit_price: 0,
      custom_price_text: "",
      _raw_service: null
    }
  ]);

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
    company_notes: "",
    notes: "",
    password: "Password123!" // default temporary password
  });

  const [nextCompanySeq, setNextCompanySeq] = useState<number>(1);

  useEffect(() => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setAvailableServices(data))
      .catch((err) => console.error("Failed to load service catalog for orders", err));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          setNextCompanySeq(data.length + 1);
        }
      })
      .catch((err) => console.error("Failed to load companies count", err));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Order Item Handlers
  const handleAddOrderItem = () => {
    setOrderItems((prev) => [
      ...prev,
      {
        service_id: "",
        job_id: "",
        job_title: "",
        description: "",
        pricing_tier: "BASE",
        unit_price: 0,
        custom_price_text: "",
        _raw_service: null
      }
    ]);
  };

  const handleRemoveOrderItem = (index: number) => {
    if (orderItems.length <= 1) {
      setOrderItems([
        {
          service_id: "",
          job_id: "",
          job_title: "",
          description: "",
          pricing_tier: "BASE",
          unit_price: 0,
          custom_price_text: "",
          _raw_service: null
        }
      ]);
      return;
    }
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServiceSelect = (index: number, serviceIdStr: string) => {
    const selectedService = availableServices.find((s) => String(s.id) === serviceIdStr);
    if (!selectedService) return;

    setOrderItems((prev) => {
      const copy = [...prev];
      const tier = copy[index].pricing_tier || "BASE";
      
      let price = selectedService.base_price || 0;
      let customText = "";

      if (tier === "PARTNER_A") {
        price = selectedService.partner_a_price ?? (selectedService.base_price * 0.8);
      } else if (tier === "PARTNER_A1") {
        price = selectedService.partner_a1_price ?? (selectedService.base_price * 0.6);
      } else if (tier === "PARTNER_A2") {
        price = selectedService.partner_a2_price ?? (selectedService.base_price * 0.5);
      } else if (tier === "PARTNER_A3") {
        customText = selectedService.partner_a3_price || "Custom";
        price = 0;
      }

      copy[index] = {
        ...copy[index],
        service_id: String(selectedService.id),
        job_id: selectedService.job_id,
        job_title: selectedService.job_title,
        description: selectedService.description || "",
        unit_price: price,
        custom_price_text: customText,
        _raw_service: selectedService
      };
      return copy;
    });
  };

  const handleTierSelect = (index: number, tier: string) => {
    setOrderItems((prev) => {
      const copy = [...prev];
      const item = copy[index];
      const s = item._raw_service;

      let price = 0;
      let customText = "";

      if (s) {
        if (tier === "BASE") {
          price = s.base_price || 0;
        } else if (tier === "PARTNER_A") {
          price = s.partner_a_price ?? (s.base_price * 0.8);
        } else if (tier === "PARTNER_A1") {
          price = s.partner_a1_price ?? (s.base_price * 0.6);
        } else if (tier === "PARTNER_A2") {
          price = s.partner_a2_price ?? (s.base_price * 0.5);
        } else if (tier === "PARTNER_A3") {
          customText = s.partner_a3_price || "Custom";
          price = 0;
        }
      }

      copy[index] = {
        ...item,
        pricing_tier: tier,
        unit_price: price,
        custom_price_text: customText
      };
      return copy;
    });
  };

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
  };

  const orderGrandTotal = orderItems.reduce((acc, curr) => acc + (curr.unit_price || 0), 0);

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

    // Filter valid order items
    const validOrderItems = orderItems
      .filter((i) => i.job_title && i.job_title.trim() !== "")
      .map((i) => ({
        service_id: i.service_id ? parseInt(i.service_id) : null,
        job_id: i.job_id,
        job_title: i.job_title,
        description: i.description,
        pricing_tier: i.pricing_tier,
        unit_price: i.unit_price || 0,
        custom_price_text: i.custom_price_text || null
      }));

    const payload = {
      ...formData,
      create_portal_account: createPortalAccount,
      date_of_birth: formData.date_of_birth || null,
      company_name: createCompany ? formData.company_name : "",
      company_code: createCompany ? (formData as any).company_code : "",
      address: createCompany ? formData.address : "",
      tax_number: createCompany ? formData.tax_number : "",
      industry: createCompany ? formData.industry : "",
      company_notes: createCompany ? formData.company_notes : "",
      order_items: validOrderItems
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

      router.push("/business/clients");
    } catch (err: any) {
      setError(err.message || "Failed to create client");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-10">
      <div className="flex items-start gap-4">
        <Link href="/business/clients" className="mt-1">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Client Partner</h1>
          <p className="text-muted-foreground mt-1">Configure client personal profiles, corporate accounts, service orders, and portal login credentials.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 h-auto sm:h-12 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="personal" className="h-full gap-2 text-xs sm:text-sm">
              <User className="h-4 w-4" /> <span className="hidden md:inline">Personal Details</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="h-full gap-2 text-xs sm:text-sm">
              <Building className="h-4 w-4" /> <span className="hidden md:inline">Company Profile</span>
            </TabsTrigger>
            <TabsTrigger value="order" className="h-full gap-2 text-xs sm:text-sm">
              <ShoppingCart className="h-4 w-4" /> <span className="hidden md:inline">Create Order</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="h-full gap-2 text-xs sm:text-sm">
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
                      placeholder="e.g. client@company.com" 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="personal_address">Personal Residential Address</label>
                    <Input 
                      id="personal_address" 
                      name="personal_address" 
                      value={formData.personal_address} 
                      onChange={handleInputChange} 
                      placeholder="Full Residential Address" 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border/40 mt-6">
                  <Button type="button" onClick={() => setActiveTab("company")}>
                    Continue to Company Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Company Profile */}
          <TabsContent value="company" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Corporate Account Details</CardTitle>
                <CardDescription>Optionally create a registered company profile for this client.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border border-border/60 bg-muted/20">
                  <Checkbox 
                    id="create-company-toggle"
                    checked={createCompany}
                    onCheckedChange={(checked) => setCreateCompany(!!checked)}
                  />
                  <label 
                    htmlFor="create-company-toggle"
                    className="text-sm font-medium text-foreground cursor-pointer select-none"
                  >
                    Register a corporate entity / company for this client
                  </label>
                </div>

                {createCompany && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="company_name">Company Name *</label>
                      <Input 
                        id="company_name" 
                        name="company_name" 
                        value={formData.company_name} 
                        onChange={handleInputChange} 
                        required={createCompany}
                        placeholder="e.g. PT Akari Digital Technology" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="company_code">Company Code (Auto Generated)</label>
                      <Input 
                        id="company_code" 
                        name="company_code" 
                        readOnly
                        value={(formData as any).company_code || (formData.company_name ? `${(formData.company_name.replace(/[^a-zA-Z]/g, "").charAt(0) || "C").toUpperCase()}${new Date().getFullYear().toString().slice(-2)}${String(nextCompanySeq).padStart(4, "0")}` : "")} 
                        className="bg-muted/40 font-mono font-bold text-foreground"
                        placeholder="Auto generated e.g. M260001" 
                      />
                      <p className="text-[11px] text-muted-foreground">Auto generated running code format: First Char + Year + Running Sequence (e.g. M260001, M260002)</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="tax_number">Tax Registration Number (NPWP)</label>
                      <Input 
                        id="tax_number" 
                        name="tax_number" 
                        value={formData.tax_number} 
                        onChange={handleInputChange} 
                        placeholder="Corporate NPWP Number" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="industry">Industry / Sector</label>
                      <Input 
                        id="industry" 
                        name="industry" 
                        value={formData.industry} 
                        onChange={handleInputChange} 
                        placeholder="e.g. Information Technology, Hospitality" 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium" htmlFor="address">Registered Office Address</label>
                      <Input 
                        id="address" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleInputChange} 
                        placeholder="Full Office Address" 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium" htmlFor="company_notes">Company Notes / Remarks</label>
                      <textarea 
                        id="company_notes" 
                        name="company_notes" 
                        value={formData.company_notes} 
                        onChange={handleInputChange} 
                        rows={3}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="Enter any additional notes or remarks about the company..."
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("personal")}>
                    Back to Personal
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("order")}>
                    Continue to Create Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Create Order */}
          <TabsContent value="order" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" /> Create Initial Service Order
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Select service offerings, job IDs, descriptions, and partner discount pricing tiers to attach an initial order to this client.
                  </CardDescription>
                </div>
                {orderGrandTotal > 0 && (
                  <Badge variant="secondary" className="font-mono text-sm font-bold px-3 py-1.5 bg-primary/10 text-primary self-start sm:self-auto">
                    Total Order: {formatCurrency(orderGrandTotal)}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-6">

                {orderItems.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-xl border border-border/70 bg-card shadow-sm space-y-4 relative">
                    <div className="flex items-center justify-between pb-3 border-b border-border/40">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                          #{idx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-foreground">
                          {item.job_title ? item.job_title : `Service Line Item #${idx + 1}`}
                        </h4>
                        {item.job_id && (
                          <Badge variant="outline" className="font-mono text-[11px] text-primary bg-primary/5">
                            Job ID: {item.job_id}
                          </Badge>
                        )}
                      </div>

                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveOrderItem(idx)}
                        className="text-destructive hover:bg-destructive/10 text-xs gap-1 h-8"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Job Title Dropdown Selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Select Service / Job Title *</label>
                        <Select
                          value={item.service_id}
                          onValueChange={(val) => handleServiceSelect(idx, val)}
                        >
                          <SelectTrigger className="w-full h-10 text-sm font-medium">
                            <SelectValue placeholder="Choose Service Package..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableServices.length === 0 ? (
                              <SelectItem value="none" disabled>No Services Found in Catalog</SelectItem>
                            ) : (
                              availableServices.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                  {s.job_title} ({s.job_id})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Pricing Tier Dropdown Selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Select Pricing Tier *</label>
                        <Select
                          value={item.pricing_tier}
                          onValueChange={(val) => handleTierSelect(idx, val)}
                        >
                          <SelectTrigger className="w-full h-10 text-sm font-medium">
                            <SelectValue placeholder="Choose Pricing Tier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BASE">
                              Base Price {item._raw_service ? `(${formatCurrency(item._raw_service.base_price)})` : ""}
                            </SelectItem>
                            <SelectItem value="PARTNER_A">
                              Partner A (-{item._raw_service?.partner_a_discount || 20}% {item._raw_service ? `= ${formatCurrency(item._raw_service.partner_a_price ?? (item._raw_service.base_price * 0.8))}` : ""})
                            </SelectItem>
                            <SelectItem value="PARTNER_A1">
                              Partner A1 (-{item._raw_service?.partner_a1_discount || 40}% {item._raw_service ? `= ${formatCurrency(item._raw_service.partner_a1_price ?? (item._raw_service.base_price * 0.6))}` : ""})
                            </SelectItem>
                            <SelectItem value="PARTNER_A2">
                              Partner A2 (-{item._raw_service?.partner_a2_discount || 50}% {item._raw_service ? `= ${formatCurrency(item._raw_service.partner_a2_price ?? (item._raw_service.base_price * 0.5))}` : ""})
                            </SelectItem>
                            <SelectItem value="PARTNER_A3">
                              Partner A3 (Free Text: {item._raw_service?.partner_a3_price || "Custom"})
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Custom Price Text Input (only show if PARTNER_A3 tier is selected) */}
                    {item.pricing_tier === "PARTNER_A3" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Custom Price Text (e.g. Free, Special Rate, Quote Needed) *</label>
                        <Input
                          placeholder="e.g. Special Corporate Waiver"
                          value={item.custom_price_text || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOrderItems(prev => {
                              const itemsCopy = [...prev];
                              itemsCopy[idx] = { ...itemsCopy[idx], custom_price_text: val };
                              return itemsCopy;
                            });
                          }}
                          className="h-10 text-xs"
                          required
                        />
                      </div>
                    )}

                    {/* Auto Populated Description Scope */}
                    {item.description && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Scope & Deliverables (Auto-Populated)</label>
                        <textarea
                          readOnly
                          value={item.description}
                          rows={2}
                          className="flex w-full rounded-md border border-input/60 bg-muted/20 p-2.5 text-xs text-muted-foreground leading-relaxed cursor-not-allowed"
                        />
                      </div>
                    )}

                    {/* Reflected Price Bar */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 font-mono text-xs">
                      <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-primary" /> Active Pricing:
                      </span>
                      <span className="font-bold text-sm text-foreground">
                        {item.pricing_tier === "PARTNER_A3"
                          ? `Free Text: ${item.custom_price_text || "Custom"}`
                          : formatCurrency(item.unit_price)
                        }
                      </span>
                    </div>

                  </div>
                ))}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddOrderItem}
                    className="w-full sm:w-auto border-dashed border-primary/40 text-primary hover:bg-primary/5 gap-2 font-semibold"
                  >
                    <Plus className="h-4 w-4" /> Add Another Service Item
                  </Button>

                  {orderGrandTotal > 0 && (
                    <div className="text-right text-xs text-muted-foreground">
                      Total Order Value: <span className="text-base font-bold font-mono text-primary ml-1">{formatCurrency(orderGrandTotal)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("company")}>
                    Back to Company
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("security")}>
                    Continue to Security
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Portal Login */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Portal Security Credentials</CardTitle>
                <CardDescription>Setup optional client portal login authorization details and instructions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Optional Portal Account Creation Checkbox */}
                <div className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-muted/20">
                  <Checkbox 
                    id="create-portal-account-toggle"
                    checked={createPortalAccount}
                    onCheckedChange={(checked) => setCreatePortalAccount(!!checked)}
                    className="mt-0.5"
                  />
                  <div className="flex flex-col">
                    <label 
                      htmlFor="create-portal-account-toggle"
                      className="text-sm font-semibold text-foreground cursor-pointer select-none"
                    >
                      Enable Portal Login Access for this Client
                    </label>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      Keep unchecked if this client representative only requires an offline directory listing and does not need portal login access.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="login_email">Portal Login Email (Username)</label>
                    <Input 
                      id="login_email" 
                      name="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required={createPortalAccount}
                      disabled={!createPortalAccount}
                      placeholder={createPortalAccount ? "Portal Login Username Email" : "Disabled (Portal access skipped)"} 
                    />
                    <p className="text-xs text-muted-foreground">Matches the Personal Email entered in Step 1.</p>
                  </div>
                  {createPortalAccount && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium" htmlFor="password">Initial Access Password *</label>
                      <Input 
                        id="password" 
                        name="password" 
                        type="text" 
                        value={formData.password} 
                        onChange={handleInputChange} 
                        required={createPortalAccount} 
                        className="font-mono text-sm font-semibold"
                        placeholder="Enter temporary client password" 
                      />
                      <p className="text-xs text-muted-foreground">Prefilled with temporary password. The client can reset this upon first login.</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-border/40 mt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("order")}>
                    Back to Order
                  </Button>
                  <Button type="submit" disabled={loading} className="px-6 font-semibold shadow">
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
