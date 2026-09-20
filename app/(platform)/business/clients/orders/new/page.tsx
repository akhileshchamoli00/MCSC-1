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
  FileText,
  ShieldCheck,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle
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
import { cn } from "@/lib/utils";

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

  // Form Fields State & Order Number Real-time Validation
  const [manualOrderNumber, setManualOrderNumber] = useState<string>("");
  const [orderNumberStatus, setOrderNumberStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [orderNumberFeedback, setOrderNumberFeedback] = useState<string>("");
  const [fetchingNumber, setFetchingNumber] = useState<boolean>(false);

  const [filterClientId, setFilterClientId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [sameBillingCompany, setSameBillingCompany] = useState<boolean>(true);
  const [billingCompanyId, setBillingCompanyId] = useState<string>("");
  const [selectedConsultantIds, setSelectedConsultantIds] = useState<number[]>([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const fetchNextOrderNumber = async () => {
    setFetchingNumber(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/next-number`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order_number) {
          setManualOrderNumber(data.order_number);
          setOrderNumberStatus("available");
          setOrderNumberFeedback("Auto-generated unique Order ID");
        }
      }
    } catch (err) {
      console.error("Failed to fetch next order number:", err);
    } finally {
      setFetchingNumber(false);
    }
  };

  const checkAvailability = async (num: string) => {
    const cleaned = num.trim().toUpperCase();
    if (!cleaned) {
      setOrderNumberStatus("idle");
      setOrderNumberFeedback("");
      return;
    }
    setOrderNumberStatus("checking");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/check-number?order_number=${encodeURIComponent(cleaned)}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.available) {
          setOrderNumberStatus("available");
          setOrderNumberFeedback(data.message || "Order ID is available");
        } else {
          setOrderNumberStatus("taken");
          setOrderNumberFeedback(data.reason || "Order ID already exists!");
        }
      }
    } catch (err) {
      console.error("Error checking order number:", err);
      setOrderNumberStatus("idle");
    }
  };

  // Debounced validation on manualOrderNumber change
  useEffect(() => {
    if (!manualOrderNumber.trim()) {
      setOrderNumberStatus("idle");
      setOrderNumberFeedback("");
      return;
    }
    const timer = setTimeout(() => {
      checkAvailability(manualOrderNumber);
    }, 400);
    return () => clearTimeout(timer);
  }, [manualOrderNumber]);

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
      const [cliRes, compRes, serRes, empRes, teamRes, notariesRes, nextNumRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/next-number`, { credentials: "include" })
      ]);

      if (cliRes.ok) setClients(await cliRes.json());
      if (compRes.ok) setCompanies(await compRes.json());
      if (serRes.ok) setServices(await serRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
      if (teamRes.ok) setTeams(await teamRes.json());
      if (notariesRes.ok) setNotaries(await notariesRes.json());
      if (nextNumRes.ok) {
        const nextNumData = await nextNumRes.json();
        if (nextNumData.order_number) {
          setManualOrderNumber(nextNumData.order_number);
          setOrderNumberStatus("available");
          setOrderNumberFeedback("Auto-generated unique Order ID");
        }
      }
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
    if (selectedReviewerId === empId && !selectedConsultantIds.includes(empId)) {
      toast.error("This person is currently selected as the Designated Reviewer. An employee cannot be both an executing consultant and the order reviewer.");
      return;
    }
    setSelectedConsultantIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectReviewer = (empId: number) => {
    if (selectedReviewerId === empId) {
      setSelectedReviewerId(null);
      return;
    }
    if (selectedConsultantIds.includes(empId)) {
      toast.error("This person is currently allocated as an executing consultant. An employee cannot be both an executing consultant and the order reviewer.");
      return;
    }
    setSelectedReviewerId(empId);
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

    if (!manualOrderNumber.trim()) {
      toast.error("Please enter an Order ID / Reference Number (e.g. MCSX-260017)");
      return;
    }

    if (orderNumberStatus === "taken") {
      toast.error("Order ID already exists. Please generate or enter a unique Order ID.");
      return;
    }

    if (!selectedCompanyId) {
      toast.error("Please select a target company entity");
      return;
    }

    if (selectedReviewerId && selectedConsultantIds.includes(selectedReviewerId)) {
      toast.error("The same person cannot be selected as both an executing consultant and the order reviewer.");
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
        order_number: manualOrderNumber.trim().toUpperCase(),
        company_id: parseInt(selectedCompanyId),
        billing_company_id: finalBillingCompanyId,
        items: validItems,
        consultant_ids: selectedConsultantIds,
        reviewer_id: selectedReviewerId || null,
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
    <div className="w-full max-w-none space-y-3.5 pb-12 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 rounded-lg border-border/60 hover:bg-muted/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                {isPipeline ? "Create Pipeline Prospect Order" : "Issue New Client Order"}
              </h1>
              <Badge variant="outline" className="font-mono text-[10px] uppercase px-1.5 py-0.5 bg-primary/10 border-primary/20 text-primary">
                {isPipeline ? "Pipeline" : "Active Workflow"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Select a client company, configure service line items, and allocate team members.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="text-xs font-semibold h-8 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || orderNumberStatus === "taken"}
            onClick={handleCreateSubmit}
            className="text-xs font-bold h-8 px-3.5 gap-1.5 rounded-lg shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Issuing Order...</span>
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                <span>{isPipeline ? "Save to Pipeline" : "Create & Issue Order"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleCreateSubmit} className="space-y-3.5">
        
        {/* Main 2-Column Responsive Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          
          {/* LEFT COLUMN: Entity Info & Service Line Items */}
          <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 space-y-3.5">
            
            {/* STEP 1: ENTITY & GENERAL INFORMATION */}
            <Card className="border-border/60 shadow-2xs rounded-xl overflow-hidden bg-card/60 backdrop-blur-md">
              <CardHeader className="py-2 px-3.5 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> Step 1: Corporate Entity & Order Details
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
                    Designate the company entity receiving services and unique order reference ID.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Client Partner Filter:</span>
                  <select
                    value={filterClientId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setFilterClientId(cid);
                      setSelectedCompanyId("");
                      setBillingCompanyId("");
                    }}
                    className="h-6.5 rounded-md border border-border/60 bg-background px-2 text-[11px] font-medium"
                  >
                    <option value="">All Client Partners</option>
                    {clients.map((cli) => (
                      <option key={cli.id} value={String(cli.id)}>
                        {cli.contact_person}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              
              <CardContent className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-start">
                  
                  {/* Col 1: Order Reference ID (3 cols) */}
                  <div className={cn(
                    "md:col-span-3 space-y-1 p-2 rounded-lg border transition-all duration-200",
                    orderNumberStatus === "taken" 
                      ? "bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20" 
                      : orderNumberStatus === "available"
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-muted/20 border-border/60"
                  )}>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1">
                        <Tag className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                        <span>Order Reference ID *</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={fetchingNumber}
                        onClick={fetchNextOrderNumber}
                        className="h-4.5 px-1 text-[9px] gap-0.5 font-bold text-primary hover:text-primary hover:bg-primary/10"
                        title="Auto-generate next unique Order ID"
                      >
                        <RefreshCw className={cn("h-2.5 w-2.5", fetchingNumber && "animate-spin")} />
                        <span>Auto ID</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        required
                        value={manualOrderNumber}
                        onChange={(e) => {
                          let val = e.target.value.toUpperCase();
                          if (val.startsWith("MSCX-")) {
                            val = "MCSX-" + val.slice(5);
                          }
                          setManualOrderNumber(val);
                        }}
                        onBlur={() => {
                          if (manualOrderNumber.startsWith("MSCX-")) {
                            setManualOrderNumber("MCSX-" + manualOrderNumber.slice(5));
                          }
                        }}
                        placeholder="e.g. MCSX-260017"
                        className={cn(
                          "h-8 font-mono font-black text-xs tracking-wider bg-background uppercase pr-7",
                          orderNumberStatus === "taken"
                            ? "border-rose-500 text-rose-600 focus-visible:ring-rose-500"
                            : orderNumberStatus === "available"
                              ? "border-emerald-500/60 text-emerald-700 dark:text-emerald-400 focus-visible:ring-emerald-500"
                              : "border-border/70"
                        )}
                      />
                      <div className="absolute right-2 top-2">
                        {orderNumberStatus === "checking" && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        )}
                        {orderNumberStatus === "available" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {orderNumberStatus === "taken" && (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] pt-0.5">
                      {orderNumberStatus === "taken" ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400 line-clamp-1">
                          {orderNumberFeedback || "Order ID already taken!"}
                        </span>
                      ) : orderNumberStatus === "available" ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 line-clamp-1">
                          {orderNumberFeedback || "Order ID is available"}
                        </span>
                      ) : orderNumberStatus === "checking" ? (
                        <span className="text-muted-foreground line-clamp-1">Checking ID availability...</span>
                      ) : (
                        <span className="text-muted-foreground line-clamp-1">Unique Order ID</span>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Target Corporate Entity (5 cols) */}
                  <div className="md:col-span-5 space-y-1 bg-muted/20 p-2 rounded-lg border border-border/60">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1">
                        <Building className="h-3 w-3 text-primary" />
                        <span>Target Corporate Entity *</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenCreateCompany("target")}
                        className="h-4.5 px-1 text-[9px] gap-0.5 font-bold text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-2.5 w-2.5" /> New Company
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
                      className="flex h-8 w-full rounded-md border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      <option value="">Choose Target Company Entity...</option>
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
                    <div className="pt-0.5">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
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
                          className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Billing recipient is the same as Target Company
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Col 3: Invoicing / Billing Recipient Entity (4 cols) */}
                  <div className="md:col-span-4 space-y-1 bg-muted/20 p-2 rounded-lg border border-border/60">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1">
                        <Building className="h-3 w-3 text-primary" />
                        <span>Invoicing Recipient / Billed Entity</span>
                      </label>
                      {!sameBillingCompany && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCreateCompany("billing")}
                          className="h-4.5 px-1 text-[9px] gap-0.5 font-bold text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Plus className="h-2.5 w-2.5" /> Add Entity
                        </Button>
                      )}
                    </div>

                    {sameBillingCompany ? (
                      <div className="h-8 flex items-center px-2.5 rounded-md border border-border/50 bg-background/60 text-xs text-muted-foreground font-medium truncate">
                        <span>
                          {selectedCompanyId 
                            ? `Same: ${(companies.find(c => String(c.id) === selectedCompanyId)?.company_name) || "Selected Company"}`
                            : "Same as Target Corporate Entity"}
                        </span>
                      </div>
                    ) : (
                      <select
                        required
                        value={billingCompanyId}
                        onChange={(e) => setBillingCompanyId(e.target.value)}
                        className="flex h-8 w-full rounded-md border border-primary/50 bg-background px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        <option value="">Choose Billing Entity...</option>
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
                    )}
                    <p className="text-[9px] text-muted-foreground line-clamp-1">
                      Tax & Proforma invoices will be addressed to this entity
                    </p>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Section 2: Service Line Items Card (Full Width Horizontal Matrix) */}
            <Card className="border-border/60 shadow-2xs rounded-xl bg-card/60 backdrop-blur-md">
              <CardHeader className="py-2 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                    2. Billed Service Line Items ({orderItems.length})
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOrderItem}
                    className="h-6.5 px-2 border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1 font-bold rounded-md text-[11px]"
                  >
                    <Plus className="h-3 w-3" /> Add Service Line
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-2.5 sm:p-3 space-y-2.5">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-border/70 bg-card/80 dark:bg-card/40 hover:border-primary/40 shadow-2xs transition-all space-y-2.5 relative">
                    
                    {/* Line Item Header: Number Badge, Job Title / ID info, Price Pill & Delete Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="flex h-5 px-2 items-center justify-center rounded-md bg-primary/10 text-primary text-[11px] font-bold font-mono shrink-0">
                          #{idx + 1}
                        </span>
                        {item.job_id && (
                          <Badge variant="outline" className="font-mono text-[10px] font-bold bg-muted/50 border-border/70 text-foreground py-0 px-1.5">
                            {item.job_id}
                          </Badge>
                        )}
                        {item.job_title && (
                          <span className="text-xs font-bold text-foreground truncate max-w-[280px] sm:max-w-md">
                            {item.job_title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        {item.pricing_tier === "PARTNER_A3" ? (
                          <div className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            {item.custom_price_text ? `Custom: ${item.custom_price_text}` : "Custom Pricing"}
                          </div>
                        ) : (
                          <div className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 font-mono text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(item.unit_price)}
                          </div>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={orderItems.length <= 1 && !item.service_id}
                          onClick={() => handleRemoveOrderItem(idx)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0"
                          title="Remove service line item"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Primary Configuration Grid: Service Package, Pricing Tier, Branch Reference */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
                      
                      {/* Service Package Selector (5 cols) */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[10.5px] font-bold text-foreground flex items-center gap-1">
                          <span>Service Package Catalog</span>
                          <span className="text-destructive font-black">*</span>
                        </label>
                        <select
                          required
                          value={item.service_id}
                          onChange={(e) => handleServiceSelect(idx, e.target.value)}
                          className="flex h-8 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary truncate"
                        >
                          <option value="">-- Choose Service Package / Job Title * --</option>
                          {services.map((s) => (
                            <option key={s.id} value={String(s.id)}>
                              {s.job_title} ({s.job_id})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Pricing Tier Selector (4 cols) */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[10.5px] font-bold text-foreground flex items-center gap-1">
                          <span>Pricing Tier & Rate</span>
                          <span className="text-destructive font-black">*</span>
                        </label>
                        <select
                          required
                          value={item.pricing_tier}
                          onChange={(e) => handleTierSelect(idx, e.target.value)}
                          className="flex h-8 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        >
                          <option value="BASE">
                            Base ({item._raw_service ? formatCurrency(item._raw_service.base_price) : "Default"})
                          </option>
                          <option value="PARTNER_A">
                            Partner A (-{item._raw_service?.partner_a_discount || 20}%)
                          </option>
                          <option value="PARTNER_A1">
                            Partner A1 (-{item._raw_service?.partner_a1_discount || 40}%)
                          </option>
                          <option value="PARTNER_A2">
                            Partner A2 (-{item._raw_service?.partner_a2_discount || 50}%)
                          </option>
                          <option value="PARTNER_A3">
                            Partner A3 (Custom Pricing / Free Text)
                          </option>
                        </select>
                      </div>

                      {/* Branch / Project Reference (3 cols) */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[10.5px] font-semibold text-muted-foreground flex items-center justify-between">
                          <span>Branch / Ref</span>
                          <span className="text-[9px] text-muted-foreground/70 font-mono">Optional</span>
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
                          placeholder="e.g. Bali Branch / Ref #12"
                          className="h-8 text-xs font-medium rounded-lg border-border/70 bg-background placeholder:text-muted-foreground/50"
                        />
                      </div>

                      {/* Custom Contract Price Text (if PARTNER_A3) */}
                      {item.pricing_tier === "PARTNER_A3" && (
                        <div className="sm:col-span-12 p-2 rounded-lg bg-amber-500/5 border border-amber-500/25 space-y-1 animate-in fade-in duration-200">
                          <label className="text-[10.5px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <span>Custom Contract Price / Billing Value Text</span>
                            <span className="text-destructive font-black">*</span>
                          </label>
                          <Input
                            required
                            value={item.custom_price_text || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOrderItems((prev) => {
                                const copy = [...prev];
                                copy[idx].custom_price_text = val;
                                return copy;
                              });
                            }}
                            placeholder="e.g. Free (Pro Bono) or Custom Contract Amount (e.g. IDR 15,000,000)"
                            className="h-8 text-xs font-semibold bg-background rounded-lg border-amber-500/35 focus-visible:ring-amber-500/20"
                          />
                        </div>
                      )}

                      {/* Designated Vendor / Notary Selection (if required or configured) */}
                      {(item._raw_service?.needs_notary || item._raw_service?.needs_gov_officer || item._raw_service?.needs_other_vendors) && (
                        <div className="sm:col-span-12 space-y-1">
                          <label className="text-[10.5px] font-semibold text-muted-foreground flex items-center justify-between">
                            <span>
                              {item._raw_service?.needs_notary 
                                ? "Assigned Notary Officer" 
                                : item._raw_service?.needs_gov_officer 
                                ? "Assigned Government Official Body" 
                                : "Assigned External Vendor"}
                            </span>
                            <span className="text-[9px] text-muted-foreground/70 font-mono">Optional</span>
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
                            className="flex h-8 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-medium shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          >
                            <option value="">
                              {item._raw_service?.needs_notary 
                                ? "-- Select Notary Officer (Optional) --" 
                                : item._raw_service?.needs_gov_officer 
                                ? "-- Select Government Body (Optional) --" 
                                : "-- Select External Vendor (Optional) --"}
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

                              return filtered.map((n) => (
                                <option key={n.id} value={n.id}>
                                  {n.name} ({n.city || "General"})
                                </option>
                              ));
                            })()}
                          </select>
                        </div>
                      )}

                      {/* Service Execution Instructions (Textarea) */}
                      <div className="sm:col-span-12 space-y-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10.5px] font-bold text-foreground flex items-center gap-1">
                            <FileText className="h-3 w-3 text-primary" />
                            <span>Service Execution Instructions</span>
                          </label>
                          <span className="text-[9px] text-muted-foreground font-mono">Visible to assigned consultants & review team</span>
                        </div>
                        <textarea
                          value={item.service_instructions || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOrderItems((prev) => {
                              const copy = [...prev];
                              copy[idx].service_instructions = val;
                              return copy;
                            });
                          }}
                          rows={2}
                          placeholder="Enter detailed service execution instructions, specific document checklists, government portal credentials/details, or processing requirements for this line item..."
                          className="flex w-full rounded-lg border border-border/70 bg-background p-2 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary leading-relaxed font-normal resize-y min-h-[48px]"
                        />
                      </div>

                    </div>

                  </div>
                ))}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Frequently Changed Operational Modules (Roster, Reviewer, Notes) */}
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 space-y-3 lg:sticky lg:top-4">
            
            {/* Licensing Roster Allocation */}
            {!isPipeline && (
              <Card className="border-border/60 shadow-2xs rounded-xl bg-card/60 backdrop-blur-md">
                <CardHeader className="py-2 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                      3. Consultant Roster ({selectedConsultantIds.length})
                    </CardTitle>
                  </div>
                  {selectedConsultantIds.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConsultantIds([])}
                      className="h-4.5 px-1.5 text-[9px] text-muted-foreground hover:text-destructive gap-0.5 font-medium"
                    >
                      Clear All
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {(() => {
                      const licensingTeam = (teams || []).find((t: any) => t.name.toLowerCase() === "licensing team");
                      const licensingMemberIds = licensingTeam ? (licensingTeam.members || []).map((m: any) => m.id) : [];
                      const licensingEmployees = employees.filter((emp) => licensingMemberIds.includes(emp.id));

                      if (licensingEmployees.length === 0) {
                        return <span className="text-xs text-muted-foreground italic py-2 text-center col-span-2">No licensing consultants available</span>;
                      }

                      return licensingEmployees.map((emp) => {
                        const isSelected = selectedConsultantIds.includes(emp.id);
                        const isReviewer = selectedReviewerId === emp.id;
                        return (
                          <label
                            key={emp.id}
                            title={isReviewer ? `${emp.first_name} ${emp.last_name} is currently selected as the Designated Order Reviewer.` : undefined}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10.5px] transition-colors ${
                              isReviewer
                                ? "opacity-50 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 cursor-not-allowed"
                                : isSelected 
                                  ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs cursor-pointer" 
                                  : "border-border/60 bg-background/50 hover:bg-muted/40 cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isReviewer}
                              onChange={() => toggleConsultantSelect(emp.id)}
                              className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary accent-primary shrink-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="truncate flex-1">
                              <div className="font-semibold text-foreground truncate flex items-center justify-between gap-1">
                                <span>{emp.first_name} {emp.last_name}</span>
                                {isReviewer && (
                                  <span className="text-[8px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-1 py-0.2 rounded shrink-0">
                                    Reviewer
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-muted-foreground truncate">{emp.job_title || "Consultant"}</div>
                            </div>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Designated Order Reviewer Selection */}
            {!isPipeline && (
              <Card className="border-border/60 shadow-2xs rounded-xl bg-card/60 backdrop-blur-md">
                <CardHeader className="py-2 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                      4. Designated Reviewer ({selectedReviewerId ? "1 Selected" : "Optional"})
                    </CardTitle>
                  </div>
                  {selectedReviewerId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReviewerId(null)}
                      className="h-4.5 px-1.5 text-[9px] text-muted-foreground hover:text-destructive gap-0.5 font-medium"
                    >
                      <X className="h-2.5 w-2.5" /> Clear Reviewer
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {(() => {
                      const licensingTeam = (teams || []).find((t: any) => t.name.toLowerCase() === "licensing team");
                      const licensingMemberIds = licensingTeam ? (licensingTeam.members || []).map((m: any) => m.id) : [];
                      const licensingEmployees = employees.filter((emp) => licensingMemberIds.includes(emp.id));

                      if (licensingEmployees.length === 0) {
                        return <span className="text-xs text-muted-foreground italic py-2 text-center col-span-2">No licensing consultants available</span>;
                      }

                      return licensingEmployees.map((emp) => {
                        const isSelected = selectedReviewerId === emp.id;
                        const isConsultant = selectedConsultantIds.includes(emp.id);
                        return (
                          <div
                            key={emp.id}
                            title={isConsultant ? `${emp.first_name} ${emp.last_name} is already allocated as an executing consultant.` : undefined}
                            onClick={() => handleSelectReviewer(emp.id)}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg border select-none text-[10.5px] transition-all ${
                              isConsultant
                                ? "opacity-50 border-dashed border-primary/40 bg-primary/5 cursor-not-allowed"
                                : isSelected 
                                  ? "border-purple-500/80 bg-purple-500/15 text-purple-800 dark:text-purple-300 font-bold shadow-2xs ring-1 ring-purple-500/40 cursor-pointer" 
                                  : "border-border/60 bg-background/50 hover:bg-muted/40 hover:border-border cursor-pointer"
                            }`}
                          >
                            <div className={`h-3 w-3 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected 
                                ? "border-purple-600 bg-purple-600 text-white" 
                                : isConsultant
                                  ? "border-primary/40 bg-transparent text-primary"
                                  : "border-gray-400 bg-background"
                            }`}>
                              {isSelected && <div className="h-1 w-1 rounded-full bg-white" />}
                              {isConsultant && <div className="h-1 w-1 rounded-full bg-primary" />}
                            </div>
                            <div className="truncate flex-1">
                              <div className="font-semibold text-foreground truncate flex items-center justify-between gap-1">
                                <span>{emp.first_name} {emp.last_name}</span>
                                {isConsultant && (
                                  <span className="text-[8px] font-bold text-primary bg-primary/10 px-1 py-0.2 rounded shrink-0">
                                    Consultant
                                  </span>
                                )}
                              </div>
                              <div className="text-[9px] text-muted-foreground truncate">{emp.job_title || "Reviewer"}</div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Internal Delivery Notes */}
            <Card className="border-border/60 shadow-2xs rounded-xl bg-card/60 backdrop-blur-md">
              <CardHeader className="py-2 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {isPipeline ? "3. Pipeline Lead Notes" : "5. Internal Delivery Notes"}
                  </CardTitle>
                </div>
                <span className="text-[9px] text-muted-foreground font-mono italic">For Delivery Manager</span>
              </CardHeader>
              <CardContent className="p-2.5">
                <textarea
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="flex w-full rounded-lg border border-border/60 bg-background p-2 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary leading-relaxed font-normal resize-none"
                  placeholder="Note from order creator to delivery manager (internal only)..."
                />
              </CardContent>
            </Card>

          </div>

        </div>

        {/* Bottom Sticky Action Controls Bar */}
        <div className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-card/80 border border-border/60 shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-muted-foreground">Order Summary:</span>
            <Badge variant="secondary" className="font-mono text-xs font-semibold px-2 py-0.5">
              {orderItems.length} {orderItems.length === 1 ? "Line Item" : "Line Items"}
            </Badge>
            <span className="font-mono font-black text-sm text-foreground">
              {formatCurrency(orderGrandTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href={isPipeline ? "/business/clients/orders/pipeline" : "/business/clients/orders"}>
              <Button type="button" variant="outline" className="rounded-lg h-8 px-3.5 font-bold text-xs">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={saving} 
              className="font-bold shadow-xs gap-1.5 rounded-lg h-8 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              {saving ? "Saving..." : isPipeline ? "Create Pipeline Order" : "Issue Client Order"}
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
