"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ShoppingCart, 
  Loader2, 
  ArrowLeft, 
  Check, 
  Building2, 
  Building, 
  UserCheck, 
  Users, 
  Tag, 
  Plus, 
  Trash2,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  FileText
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PhoneInput, isValidPhoneNumber, isValidEmail } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";

function NewClientOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPipeline = searchParams.get("type") === "pipeline";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // DB Data Options
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [notaries, setNotaries] = useState<any[]>([]);

  // Form Fields State
  const [filterClientId, setFilterClientId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [sameBillingCompany, setSameBillingCompany] = useState<boolean>(true);
  const [billingCompanyId, setBillingCompanyId] = useState<string>("");
  const [selectedConsultantIds, setSelectedConsultantIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");

  // Quick Create Company State
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [createCompanyTarget, setCreateCompanyTarget] = useState<"billing" | "target">("billing");
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    company_name: "",
    client_id: "",
    address: "",
    tax_number: "",
    industry: "",
    key_contact_person: "",
    key_contact_email: "",
    key_contact_phone: "",
    notes: ""
  });
  const [orderItems, setOrderItems] = useState<any[]>([
    {
      service_id: "",
      job_id: "",
      job_title: "",
      branch_name: "",
      description: "",
      service_instructions: "",
      pricing_tier: "BASE",
      unit_price: 0,
      custom_price_text: "",
      notary_id: "",
      _raw_service: null
    }
  ]);

  const fetchData = async () => {

    try {
      setLoading(true);
      const [cliRes, compRes, serRes, empRes, teamRes, notariesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries`, {
      credentials: "include", })
      ]);

      if (cliRes.ok) setClients(await cliRes.json());
      if (compRes.ok) setCompanies(await compRes.json());
      if (serRes.ok) setServices(await serRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (teamRes.ok) setTeams(await teamRes.json());
      if (notariesRes.ok) setNotaries(await notariesRes.json());
    } catch (err) {
      console.error("Error loading master records:", err);
      toast.error("Failed to load dependency catalog data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleConsultantSelect = (empId: number) => {
    setSelectedConsultantIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleAddOrderItem = () => {
    setOrderItems((prev) => [
      {
        service_id: "",
        job_id: "",
        job_title: "",
        branch_name: "",
        description: "",
        service_instructions: "",
        pricing_tier: "BASE",
        unit_price: 0,
        custom_price_text: "",
        notary_id: "",
        _raw_service: null
      },
      ...prev
    ]);
  };

  const handleRemoveOrderItem = (index: number) => {
    if (orderItems.length <= 1) {
      setOrderItems([
        {
          service_id: "",
          job_id: "",
          job_title: "",
          branch_name: "",
          description: "",
          service_instructions: "",
          pricing_tier: "BASE",
          unit_price: 0,
          custom_price_text: "",
          notary_id: "",
          _raw_service: null
        }
      ]);
      return;
    }
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServiceSelect = (index: number, serviceIdStr: string) => {
    const selectedService = services.find((s) => String(s.id) === serviceIdStr);
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
        notary_id: "",
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

  const handleOpenCreateCompany = (target: "billing" | "target") => {
    setCreateCompanyTarget(target);
    setNewCompanyForm({
      company_name: "",
      client_id: filterClientId || (clients[0] ? String(clients[0].id) : ""),
      address: "",
      tax_number: "",
      industry: "",
      key_contact_person: "",
      key_contact_email: "",
      key_contact_phone: "",
      notes: ""
    });
    setIsCreateCompanyOpen(true);
  };

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCompanyForm.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!newCompanyForm.key_contact_person.trim()) {
      toast.error("Key Contact Person Name is required");
      return;
    }
    if (!newCompanyForm.key_contact_email.trim() || !isValidEmail(newCompanyForm.key_contact_email)) {
      toast.error("Please enter a valid key contact email address.");
      return;
    }
    if (!newCompanyForm.key_contact_phone.trim() || !isValidPhoneNumber(newCompanyForm.key_contact_phone)) {
      toast.error("Please enter a valid key contact phone number (6 to 15 digits).");
      return;
    }
    setCreatingCompany(true);
    try {
      const payload = {
        company_name: newCompanyForm.company_name.trim(),
        client_id: newCompanyForm.client_id ? parseInt(newCompanyForm.client_id) : (filterClientId ? parseInt(filterClientId) : (clients[0]?.id || null)),
        address: newCompanyForm.address || null,
        tax_number: newCompanyForm.tax_number || null,
        industry: newCompanyForm.industry || null,
        key_contact_person: newCompanyForm.key_contact_person || null,
        key_contact_email: newCompanyForm.key_contact_email || null,
        key_contact_phone: newCompanyForm.key_contact_phone || null,
        notes: newCompanyForm.notes || null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/standalone`, {
      credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdComp = await res.json();
        toast.success(`Company "${createdComp.company_name}" created successfully!`);
        setCompanies(prev => [...prev, createdComp]);

        if (createCompanyTarget === "billing") {
          setBillingCompanyId(String(createdComp.id));
        } else {
          setSelectedCompanyId(String(createdComp.id));
          if (sameBillingCompany) {
            setBillingCompanyId(String(createdComp.id));
          }
        }

        setIsCreateCompanyOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to create company");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating company");
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompanyId) {
      toast.error("Please select a target company entity");
      return;
    }

    const validItems = orderItems
      .filter((i) => i.job_title && i.job_title.trim() !== "")
      .map((i) => ({
        service_id: i.service_id ? parseInt(i.service_id) : null,
        job_id: i.job_id,
        job_title: i.job_title,
        branch_name: i.branch_name ? i.branch_name.trim() : null,
        description: i.description,
        service_instructions: i.service_instructions?.trim() || null,
        pricing_tier: i.pricing_tier,
        unit_price: i.unit_price || 0,
        custom_price_text: i.custom_price_text || null,
        notary_id: i.notary_id ? parseInt(i.notary_id) : null
      }));

    if (validItems.length === 0) {
      toast.error("Please select at least one valid service catalog line item");
      return;
    }

    setSaving(true);
    try {
      const finalBillingCompanyId = sameBillingCompany
        ? parseInt(selectedCompanyId)
        : (billingCompanyId ? parseInt(billingCompanyId) : parseInt(selectedCompanyId));

      const payload = {
        company_id: parseInt(selectedCompanyId),
        billing_company_id: finalBillingCompanyId,
        items: validItems,
        consultant_ids: selectedConsultantIds,
        notes: notes || null,
        status: isPipeline ? "PIPELINE" : undefined
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
      credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(isPipeline ? "Pipeline order created successfully!" : "Client service order issued successfully!");
        router.push(isPipeline ? "/business/clients/orders/pipeline" : "/business/clients/orders");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to issue new order");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error issuing service order");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
  };

  const orderGrandTotal = orderItems.reduce((acc, curr) => acc + (curr.unit_price || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading catalog metadata...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-10">
      
      {/* Title Header */}
      <div className="flex items-start gap-4">
        <Link href={isPipeline ? "/business/clients/orders/pipeline" : "/business/clients/orders"} className="mt-1">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0 flex items-center justify-center">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{isPipeline ? "Create Pipeline Order" : "Issue New Client Order"}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{isPipeline ? "Record a new prospect order in pipeline for third-party sales and team tracking." : "Configure client partner scope entities, allocate consultant rosters, and build billing line items."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {orderGrandTotal > 0 && (
              <Badge variant="outline" className="font-mono text-xs font-bold px-3 py-1.5 border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                Total Order Value: {formatCurrency(orderGrandTotal)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Corporate Entity Details & Service Items (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Target Corporate Entity Card */}
          <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-border/30 p-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Target Corporate Entity
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-4 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Optional Client Filter */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-muted-foreground/75" />
                    <span>Filter by Client Partner (Optional)</span>
                  </label>
                  <select
                    value={filterClientId}
                    onChange={(e) => {
                      setFilterClientId(e.target.value);
                      setSelectedCompanyId("");
                    }}
                    className="flex h-9 w-full rounded-lg border border-border/60 bg-background px-3 py-1 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">-- All Clients / Show All Companies --</option>
                    {clients.map((cli) => (
                      <option key={cli.id} value={String(cli.id)}>
                        {cli.contact_person} ({cli.email})
                      </option>
                    ))}
                  </select>
                </div>

                  {/* Target Company Dropdown */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-muted-foreground/75" />
                        <span>Select Target Company Entity *</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenCreateCompany("target")}
                        className="h-6 px-2 text-[10px] gap-1 font-bold text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3 w-3" /> New Company
                      </Button>
                    </div>
                    <select
                      required
                      value={selectedCompanyId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedCompanyId(val);
                        if (sameBillingCompany) {
                          setBillingCompanyId(val);
                        }
                      }}
                      className="flex h-9 w-full rounded-lg border border-border/60 bg-background px-3 py-1 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Choose Target Company...</option>
                      {(filterClientId
                        ? companies.filter(c => c.client_id === parseInt(filterClientId))
                        : companies
                      ).map((comp) => {
                        const valSuffix = comp.validation_status === "PENDING_VALIDATION" 
                          ? " • [Pending Validation]" 
                          : comp.validation_status === "NEEDS_REVISION" 
                          ? " • [Revision Needed]" 
                          : "";
                        return (
                          <option key={comp.id} value={String(comp.id)}>
                            {comp.company_name} ({comp.company_code}){valSuffix}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Billing Company Checkbox & Conditional Dropdown */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sameBillingCompany}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSameBillingCompany(checked);
                          if (checked) {
                            setBillingCompanyId(selectedCompanyId);
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-foreground">
                        Billing company is the same as Target Company Entity
                      </span>
                    </label>

                    {!sameBillingCompany && (
                      <div className="space-y-1.5 pl-6 pt-1 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                            <Building className="h-3.5 w-3.5 text-primary" />
                            <span>Select Billing Company Entity * (Invoicing Recipient)</span>
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCreateCompany("billing")}
                            className="h-6 px-2 text-[10px] gap-1 font-bold border-primary/40 text-primary hover:bg-primary/10"
                          >
                            <Plus className="h-3 w-3" /> Create Company
                          </Button>
                        </div>
                        <select
                          required
                          value={billingCompanyId}
                          onChange={(e) => setBillingCompanyId(e.target.value)}
                          className="flex h-9 w-full rounded-lg border border-primary/50 bg-background px-3 py-1 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        >
                          <option value="">Choose Billing Company...</option>
                          {(filterClientId
                            ? companies.filter(c => c.client_id === parseInt(filterClientId))
                            : companies
                          ).map((comp) => {
                            const valSuffix = comp.validation_status === "PENDING_VALIDATION" 
                              ? " • [Pending Validation]" 
                              : comp.validation_status === "NEEDS_REVISION" 
                              ? " • [Revision Needed]" 
                              : "";
                            return (
                              <option key={comp.id} value={String(comp.id)}>
                                {comp.company_name} ({comp.company_code}){valSuffix}
                              </option>
                            );
                          })}
                        </select>
                        <p className="text-[10px] text-muted-foreground italic">
                          Proforma and Final invoices will be addressed to and billed under this entity.
                        </p>
                      </div>
                    )}
                  </div>

              </div>
            </CardContent>
          </Card>

          {/* Service items Card */}
          <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-border/30 p-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" /> Service Line Items ({(orderItems || []).length})
                </CardTitle>
                <CardDescription className="text-xs">Build deliverables matching target partner discount tiers.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOrderItem}
                className="border-dashed border-primary/40 text-primary hover:bg-primary/5 gap-1.5 font-bold rounded-lg h-8 text-xs shrink-0"
              >
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-4 p-4">
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-border/40 bg-background/40 shadow-xs space-y-3 relative">
                    <div className="flex items-center justify-between pb-2 border-b border-border/30">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold font-mono">
                          #{idx + 1}
                        </span>
                        <h4 className="font-bold text-xs text-foreground truncate max-w-[240px]">
                          {item.job_title ? item.job_title : `Service Item #${idx + 1}`}
                        </h4>
                        {item.job_id && (
                          <Badge variant="outline" className="font-mono text-[9px] text-primary bg-primary/5 border-primary/20 h-5">
                            {item.job_id}
                          </Badge>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOrderItem(idx)}
                        className="text-destructive hover:bg-destructive/10 text-[10px] gap-1 h-6 rounded-lg px-2"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Service Selection */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Service / Job Title *</label>
                        <select
                          required
                          value={item.service_id}
                          onChange={(e) => handleServiceSelect(idx, e.target.value)}
                          className="flex h-8.5 w-full rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs font-medium shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <option value="">Choose Service Package...</option>
                          {services.map((s) => (
                            <option key={s.id} value={String(s.id)}>
                              {s.job_title} ({s.job_id})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tier Selection */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Pricing Tier *</label>
                        <select
                          required
                          value={item.pricing_tier}
                          onChange={(e) => handleTierSelect(idx, e.target.value)}
                          className="flex h-8.5 w-full rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs font-medium shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <option value="BASE">
                            Base Price {item._raw_service ? `(${formatCurrency(item._raw_service.base_price)})` : ""}
                          </option>
                          <option value="PARTNER_A">
                            Partner A (-{item._raw_service?.partner_a_discount || 20}% {item._raw_service ? `= ${formatCurrency(item._raw_service.partner_a_price ?? (item._raw_service.base_price * 0.8))}` : ""})
                          </option>
                          <option value="PARTNER_A1">
                            Partner A1 (-{item._raw_service?.partner_a1_discount || 40}% {item._raw_service ? `= ${formatCurrency(item._raw_service.partner_a1_price ?? (item._raw_service.base_price * 0.6))}` : ""})
                          </option>
                          <option value="PARTNER_A2">
                            Partner A2 (-{item._raw_service?.partner_a2_discount || 50}% {item._raw_service ? `= ${formatCurrency(item._raw_service.partner_a2_price ?? (item._raw_service.base_price * 0.5))}` : ""})
                          </option>
                          <option value="PARTNER_A3">
                            Partner A3 (Free Text: {item._raw_service?.partner_a3_price || "Custom"})
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Branch / Entity Reference (Free Text) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Branch / Entity Reference</span>
                        <span className="text-[10px] font-mono text-muted-foreground/70 italic">Optional • Printed on Invoices</span>
                      </label>
                      <Input
                        value={item.branch_name || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOrderItems((prev) => {
                            const copy = [...prev];
                            copy[idx].branch_name = val;
                            return copy;
                          });
                        }}
                        placeholder="e.g. Bali Branch, HQ Office, Project Alpha..."
                        className="h-8.5 text-xs font-medium rounded-lg border-border/60 bg-background"
                      />
                    </div>

                    {/* Pricing tier free text input (if A3) */}
                    {item.pricing_tier === "PARTNER_A3" && (
                      <div className="space-y-1 pt-0.5 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Custom Price Input Value</label>
                        <Input
                          required
                          value={item.custom_price_text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOrderItems((prev) => {
                              const copy = [...prev];
                              copy[idx].custom_price_text = val;
                              return copy;
                            });
                          }}
                          placeholder="e.g. Free or Custom Contract Price"
                          className="h-8.5 text-xs font-semibold rounded-lg border-border/60 bg-background"
                        />
                      </div>
                    )}

                    {/* Vendor / Notary Selection (Optional) */}
                    {(item._raw_service?.needs_notary || item._raw_service?.needs_gov_officer || item._raw_service?.needs_other_vendors) && (
                      <div className="space-y-1 pt-1 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                          <span>
                            {item._raw_service?.needs_notary 
                              ? "Select Notary (Optional)" 
                              : item._raw_service?.needs_gov_officer 
                              ? "Select Government Body (Optional)" 
                              : "Select Vendor (Optional)"}
                          </span>
                        </label>
                        <select
                          value={item.notary_id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOrderItems((prev) => {
                              const copy = [...prev];
                              copy[idx].notary_id = val ? parseInt(val) : "";
                              return copy;
                            });
                          }}
                          className="flex h-8.5 w-full rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs font-medium shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <option value="">
                            {item._raw_service?.needs_notary 
                              ? "Choose Notary..." 
                              : item._raw_service?.needs_gov_officer 
                              ? "Choose Government Body..." 
                              : "Choose Vendor..."}
                          </option>
                          {(() => {
                            const serviceId = Number(item.service_id);
                            const isNotaryReq = Boolean(item._raw_service?.needs_notary);
                            const isGovReq = Boolean(item._raw_service?.needs_gov_officer);
                            const isOtherReq = Boolean(item._raw_service?.needs_other_vendors);

                            const filtered = notaries.filter((n) => {
                              const hasConfiguredFee = n.service_fees && n.service_fees.some((sf: any) => sf.service_id === serviceId);
                              if (hasConfiguredFee) return true;

                              if (isGovReq) return n.vendor_type === "GOVERNMENT_OFFICER" || n.is_gov_officer;
                              if (isOtherReq) return n.vendor_type === "OTHER_VENDORS" || n.is_other_vendor;
                              if (isNotaryReq) return n.vendor_type === "NOTARY" || n.is_notary || (!n.vendor_type && !n.is_gov_officer && !n.is_other_vendor);
                              return true;
                            });

                            return filtered.map((n) => {
                              const valSuffix = n.validation_status === "PENDING_VALIDATION" 
                                ? " • [Pending Validation]" 
                                : n.validation_status === "NEEDS_REVISION" 
                                ? " • [Revision Needed]" 
                                : "";
                              return (
                                <option key={n.id} value={n.id}>
                                  {n.name} ({n.city || "General"}){valSuffix}
                                </option>
                              );
                            });
                          })()}
                        </select>
                      </div>
                    )}

                    {/* Service Instructions for this specific Service Item */}
                    <div className="space-y-1 pt-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-primary">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span>Service Instructions</span>
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/70 italic">
                          Visible to assigned processing team & order chat
                        </span>
                      </label>
                      <textarea
                        rows={2}
                        value={item.service_instructions || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOrderItems((prev) => {
                            const copy = [...prev];
                            copy[idx].service_instructions = val;
                            return copy;
                          });
                        }}
                        placeholder={`e.g. Specific document requirements, fast-track timeline, or execution instructions for ${item.job_title || "this service item"}...`}
                        className="flex min-h-[58px] w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-normal shadow-xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-y leading-relaxed"
                      />
                    </div>

                    {/* Reflected Price Bar */}
                    <div className="flex flex-wrap items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/30 gap-2 text-[10px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-muted-foreground">Price Calculation:</span>
                        <span className="font-extrabold text-xs text-foreground">
                          {item.pricing_tier === "PARTNER_A3"
                            ? `Free Text: ${item.custom_price_text || "Custom"}`
                            : formatCurrency(item.unit_price)}
                        </span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Roster, Notes, & Save actions (1/3 width) */}
        <div className="lg:col-span-1 space-y-3">
          
          {/* Unified Roster Allocation & Execution Notes Box */}
          <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
            <CardContent className="space-y-4 p-4 pt-4">
              {/* Roster Allocation (Hidden for Pipeline Orders) */}
              {!isPipeline && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Roster Allocation</label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-background rounded-lg border border-border/40">
                    {(() => {
                      const licensingTeam = (teams || []).find((t: any) => t.name.toLowerCase() === "licensing team");
                      const licensingMemberIds = licensingTeam ? (licensingTeam.members || []).map((m: any) => m.id) : [];
                      const licensingEmployees = employees.filter((emp) => licensingMemberIds.includes(emp.id));

                      if (licensingEmployees.length === 0) {
                        return <span className="text-xs text-muted-foreground italic py-2 text-center col-span-3">No licensing consultants</span>;
                      }

                      return licensingEmployees.map((emp) => {
                        const isSelected = selectedConsultantIds.includes(emp.id);
                        return (
                          <label
                            key={emp.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none text-[11px] transition-colors ${isSelected ? "border-primary bg-primary/10 text-primary font-bold shadow-xs" : "border-border/60 hover:bg-muted/40"}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleConsultantSelect(emp.id)}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                            />
                            <div className="truncate">
                              <div className="font-semibold text-foreground truncate">{emp.first_name} {emp.last_name}</div>
                              <div className="text-[9px] text-muted-foreground truncate">{emp.job_title || "Consultant"}</div>
                            </div>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Internal Instructions / Notes (Order-level for Managers) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Internal Instructions / Notes</label>
                  <span className="text-[9px] font-mono text-muted-foreground/70 italic">For Delivery Manager</span>
                </div>
                <textarea
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={isPipeline ? 5 : 3}
                  className="flex w-full rounded-lg border border-border/60 bg-background p-2.5 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-normal font-semibold transition-all"
                  placeholder="Note from order creator to delivery manager (not shown to processing team)..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Link href={isPipeline ? "/business/clients/orders/pipeline" : "/business/clients/orders"} className="flex-1">
              <Button type="button" variant="outline" className="w-full rounded-xl h-10 px-4 font-bold">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={saving} 
              className="flex-1 font-bold shadow-md gap-2 rounded-xl h-10"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Saving..." : isPipeline ? "Create Pipeline Order" : "Issue Order"}
            </Button>
          </div>
        </div>

      </form>

      {/* Quick Create Company Modal - Spacious, Clean & Elegant */}
      <Dialog open={isCreateCompanyOpen} onOpenChange={setIsCreateCompanyOpen}>
        <DialogContent className="max-w-3xl sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0 border border-border/80 shadow-2xl rounded-2xl bg-card">
          {/* Header Banner */}
          <div className="p-6 pb-5 bg-muted/40 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                    Create New Company Entity
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Register a corporate entity profile for <span className="font-semibold text-foreground">{createCompanyTarget === "billing" ? "invoicing & billing recipient" : "service delivery target"}</span>.
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider bg-background border-border/70">
                {createCompanyTarget === "billing" ? "Billing Entity" : "Target Entity"}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleCreateCompanySubmit} className="p-6 sm:p-7 space-y-6">
            
            {/* Section 1: Company Profile */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Briefcase className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">1. Corporate Identification</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>Company / Entity Legal Name</span>
                    <span className="text-destructive font-black">*</span>
                  </label>
                  <Input
                    required
                    value={newCompanyForm.company_name}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="e.g. PT Mandiri Cipta Solusi"
                    className="h-10 text-sm font-medium rounded-xl border-border/70 focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Parent Client Representative
                  </label>
                  <select
                    value={newCompanyForm.client_id}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, client_id: e.target.value }))}
                    className="flex h-10 w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="">-- Standalone (No parent client selected) --</option>
                    {clients.map((cli) => (
                      <option key={cli.id} value={String(cli.id)}>
                        {cli.contact_person} ({cli.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Industry / Business Sector
                  </label>
                  <Input
                    value={newCompanyForm.industry}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g. Management Consulting, IT Services"
                    className="h-10 text-xs font-medium rounded-xl border-border/70 focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Tax Identification Number (NPWP)</span>
                    <span className="text-[10px] text-muted-foreground/80 italic font-mono">Optional</span>
                  </label>
                  <Input
                    value={newCompanyForm.tax_number}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, tax_number: e.target.value }))}
                    placeholder="e.g. 01.234.567.8-901.000"
                    className="h-10 text-xs font-mono font-medium rounded-xl border-border/70 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Primary Key Contact (Mandatory) */}
            <div className="space-y-4 p-4.5 rounded-2xl bg-muted/25 border border-border/60">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">2. Primary Key Contact (Invoicing & Operations)</h4>
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Mandatory
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>Contact Name</span>
                    <span className="text-destructive font-black">*</span>
                  </label>
                  <Input
                    required
                    value={newCompanyForm.key_contact_person}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, key_contact_person: e.target.value }))}
                    placeholder="e.g. Budi Santoso"
                    className="h-10 text-xs font-medium rounded-xl border-border/70 focus-visible:ring-primary/20 bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>Email Address</span>
                    <span className="text-destructive font-black">*</span>
                  </label>
                  <EmailInput
                    required
                    value={newCompanyForm.key_contact_email}
                    onChange={(val) => setNewCompanyForm((prev) => ({ ...prev, key_contact_email: val }))}
                    placeholder="budi@company.co.id"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>Phone Number</span>
                    <span className="text-destructive font-black">*</span>
                  </label>
                  <PhoneInput
                    required
                    value={newCompanyForm.key_contact_phone}
                    onChange={(val) => setNewCompanyForm((prev) => ({ ...prev, key_contact_phone: val }))}
                    placeholder="812 3456 789"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Official Address & Notes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <MapPin className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">3. Registered Address & Notes</h4>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Registered Business Address (Printed on Tax & Proforma Invoices)
                  </label>
                  <textarea
                    value={newCompanyForm.address}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                    placeholder="Suite / Floor, Building Name, Street Address, City, Postal Code..."
                    className="flex w-full rounded-xl border border-border/70 bg-background p-3 text-xs placeholder:text-muted-foreground/50 resize-none font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Internal Notes / Billing Instructions
                  </label>
                  <Input
                    value={newCompanyForm.notes}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special billing instructions, tax exemption details, etc."
                    className="h-10 text-xs font-medium rounded-xl border-border/70 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Footer Action Controls */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateCompanyOpen(false)}
                className="h-10 px-5 text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingCompany}
                className="h-10 px-6 text-xs font-bold gap-2 rounded-xl"
              >
                {creatingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save & Select Company
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NewClientOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading form...</p>
      </div>
    }>
      <NewClientOrderContent />
    </Suspense>
  );
}
