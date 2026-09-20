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
import { ServiceSearchSelect } from "@/components/service-search-select";
import { CreateCompanyDialog } from "@/components/create-company-dialog";
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

  const handleServiceSelect = (index: number, serviceIdStr: string, customTitle?: string) => {
    if (serviceIdStr === "CUSTOM") {
      setOrderItems((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          service_id: "CUSTOM",
          job_id: "CUSTOM",
          job_title: customTitle || copy[index].job_title || "Custom Service",
          description: copy[index].description || "One-time custom service",
          pricing_tier: "PARTNER_A3",
          unit_price: copy[index].unit_price || 0,
          custom_price_text: "",
          notary_id: "",
          _raw_service: null
        };
        return copy;
      });
      return;
    }

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
        price = copy[index].unit_price || 0;
        customText = "";
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
          price = (item.pricing_tier === "PARTNER_A3" && item.unit_price) ? item.unit_price : 0;
          customText = "";
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
    setIsCreateCompanyOpen(true);
  };

  const handleCompanyCreated = (createdComp: any) => {
    setCompanies((prev) => [...prev, createdComp]);
    if (createCompanyTarget === "billing") {
      setBillingCompanyId(String(createdComp.id));
    } else {
      setSelectedCompanyId(String(createdComp.id));
      if (sameBillingCompany) {
        setBillingCompanyId(String(createdComp.id));
      }
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
        service_id: (i.service_id && i.service_id !== "CUSTOM" && !isNaN(parseInt(i.service_id))) ? parseInt(i.service_id) : null,
        job_id: i.job_id || "CUSTOM",
        job_title: i.job_title.trim(),
        branch_name: i.branch_name ? i.branch_name.trim() : null,
        description: i.description || null,
        service_instructions: i.service_instructions?.trim() || null,
        pricing_tier: i.pricing_tier || "PARTNER_A3",
        unit_price: i.unit_price || 0,
        custom_price_text: i.custom_price_text || null,
        notary_id: (i.notary_id && !isNaN(parseInt(i.notary_id))) ? parseInt(i.notary_id) : null
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
    return "IDR " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
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
    <div className="w-full max-w-none space-y-3.5 pb-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 rounded-lg border-border/60 hover:bg-muted/50 shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                {isPipeline ? "Create Pipeline Prospect Order" : "Issue New Client Order"}
              </h1>
              <Badge variant="outline" className="font-mono text-[10px] uppercase px-1.5 py-0.5 bg-primary/10 border-primary/20 text-primary shrink-0">
                {isPipeline ? "Pipeline" : "Active Workflow"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
              Select a client company, configure service line items, and allocate team members.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-start">

          {/* LEFT COLUMN: Entity Info & Service Line Items */}
          <div className="xl:col-span-7 2xl:col-span-8 space-y-3.5 min-w-0">

            {/* STEP 1: ENTITY & GENERAL INFORMATION */}
            <Card className="border-border/60 shadow-2xs rounded-xl overflow-hidden bg-card/60 backdrop-blur-md">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-foreground uppercase tracking-wider">
                    <Building2 className="h-3.5 w-3.5 text-primary shrink-0" /> Step 1: Corporate Entity & Order Details
                  </CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
                    Designate the company entity receiving services and unique order reference ID.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Client Partner:</span>
                  <select
                    value={filterClientId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setFilterClientId(cid);
                      setSelectedCompanyId("");
                      setBillingCompanyId("");
                    }}
                    className="h-7 rounded-md border border-border/60 bg-background px-2 text-[11px] font-medium max-w-[180px] truncate"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3 items-start">

                  {/* Col 1: Order Reference ID */}
                  <div className={cn(
                    "col-span-1 sm:col-span-2 xl:col-span-4 2xl:col-span-3 space-y-1.5 p-2.5 rounded-lg border transition-all duration-200",
                    orderNumberStatus === "taken"
                      ? "bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20"
                      : orderNumberStatus === "available"
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-muted/20 border-border/60"
                  )}>
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1 min-w-0 truncate">
                        <Tag className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate">Order Ref ID *</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={fetchingNumber}
                        onClick={fetchNextOrderNumber}
                        className="h-5 px-1.5 text-[9px] gap-1 font-bold text-primary hover:text-primary hover:bg-primary/10 shrink-0"
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
                        <span className="font-bold text-rose-600 dark:text-rose-400 truncate">
                          {orderNumberFeedback || "Order ID already taken!"}
                        </span>
                      ) : orderNumberStatus === "available" ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                          {orderNumberFeedback || "Order ID is available"}
                        </span>
                      ) : orderNumberStatus === "checking" ? (
                        <span className="text-muted-foreground truncate">Checking ID availability...</span>
                      ) : (
                        <span className="text-muted-foreground truncate">Unique Order ID</span>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Target Corporate Entity */}
                  <div className="col-span-1 sm:col-span-1 xl:col-span-4 2xl:col-span-5 space-y-1.5 bg-muted/20 p-2.5 rounded-lg border border-border/60">
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1 min-w-0 truncate">
                        <Building className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate">Target Corporate Entity *</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenCreateCompany("target")}
                        className="h-5 px-1.5 text-[9px] gap-0.5 font-bold text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                      >
                        <Plus className="h-2.5 w-2.5" /> New
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
                      className="flex h-8 w-full rounded-md border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary truncate"
                    >
                      <option value="">Choose Target Company Entity...</option>
                      {(filterClientId
                        ? companies.filter(c => c.client_id === parseInt(filterClientId) || String(c.id) === String(selectedCompanyId))
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
                          className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
                        />
                        <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                          Billing recipient is same as Target
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Col 3: Invoicing / Billing Recipient Entity */}
                  <div className="col-span-1 sm:col-span-1 xl:col-span-4 2xl:col-span-4 space-y-1.5 bg-muted/20 p-2.5 rounded-lg border border-border/60">
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1 min-w-0 truncate">
                        <Building className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate">Invoicing / Billed Entity</span>
                      </label>
                      {!sameBillingCompany && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCreateCompany("billing")}
                          className="h-5 px-1.5 text-[9px] gap-0.5 font-bold text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                        >
                          <Plus className="h-2.5 w-2.5" /> Add
                        </Button>
                      )}
                    </div>

                    {sameBillingCompany ? (
                      <div className="h-8 flex items-center px-2.5 rounded-md border border-border/50 bg-background/60 text-xs text-muted-foreground font-medium truncate">
                        <span className="truncate">
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
                        className="flex h-8 w-full rounded-md border border-primary/50 bg-background px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary truncate"
                      >
                        <option value="">Choose Billing Entity...</option>
                        {(filterClientId
                          ? companies.filter(c => c.client_id === parseInt(filterClientId) || String(c.id) === String(billingCompanyId))
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
                    <p className="text-[9px] text-muted-foreground truncate">
                      Tax & Proforma invoices will be addressed to this entity
                    </p>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Section 2: Service Line Items Card (Full Width Horizontal Matrix) */}
            <Card className="border-border/60 shadow-2xs rounded-xl bg-card/60 backdrop-blur-md">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Briefcase className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                    2. Billed Service Line Items ({orderItems.length})
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOrderItem}
                    className="h-7 px-2.5 border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1 font-bold rounded-md text-[11px]"
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
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="flex h-5 px-2 items-center justify-center rounded-md bg-primary/10 text-primary text-[11px] font-bold font-mono shrink-0">
                          #{idx + 1}
                        </span>
                        {item.job_id && (
                          <Badge variant="outline" className="font-mono text-[10px] font-bold bg-muted/50 border-border/70 text-foreground py-0 px-1.5 shrink-0">
                            {item.job_id}
                          </Badge>
                        )}
                        {item.job_title && (
                          <span className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                            {item.job_title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                        <div className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 font-mono text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(item.unit_price)}
                        </div>

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
                    <div className="grid grid-cols-1 md:grid-cols-12 xl:grid-cols-12 gap-2.5 items-start">

                      {/* Service Package Selector (Full width on md, 5 cols on xl) */}
                      <div className="col-span-1 md:col-span-12 xl:col-span-5 space-y-1">
                        <label className="text-[10.5px] font-bold text-foreground flex items-center gap-1">
                          <span>Service Package Catalog</span>
                          <span className="text-destructive font-black">*</span>
                        </label>
                        <ServiceSearchSelect
                          required
                          services={services}
                          value={item.service_id}
                          customTitle={item.job_title}
                          onChange={(serviceId, customTitle) => handleServiceSelect(idx, serviceId, customTitle)}
                        />
                        {item.service_id === "CUSTOM" && (
                          <div className="mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                            <Input
                              value={item.job_title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setOrderItems((prev) => {
                                  const copy = [...prev];
                                  copy[idx].job_title = val;
                                  return copy;
                                });
                              }}
                              placeholder="Custom service name..."
                              className="h-7 text-xs font-semibold rounded-md border-amber-500/40 bg-amber-500/5 focus-visible:ring-amber-500 text-foreground"
                            />
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 shrink-0 font-medium"
                            >
                              Custom
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Pricing Tier Selector (6 cols on md, 4 cols on xl) */}
                      <div className="col-span-1 md:col-span-6 xl:col-span-4 space-y-1">
                        <label className="text-[10.5px] font-bold text-foreground flex items-center gap-1">
                          <span>Pricing Tier & Rate</span>
                          <span className="text-destructive font-black">*</span>
                        </label>
                        {item.service_id === "CUSTOM" ? (
                          <select
                            required
                            value={item.pricing_tier}
                            onChange={(e) => handleTierSelect(idx, e.target.value)}
                            className="flex h-8 w-full rounded-lg border border-amber-500/40 bg-amber-500/5 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200 shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary truncate"
                          >
                            <option value="PARTNER_A3">Custom Pricing (Direct Quote)</option>
                          </select>
                        ) : (
                          <select
                            required
                            value={item.pricing_tier}
                            onChange={(e) => handleTierSelect(idx, e.target.value)}
                            className="flex h-8 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary truncate"
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
                              Partner A3 (Custom Pricing)
                            </option>
                          </select>
                        )}
                      </div>

                      {/* Branch / Project Reference (6 cols on md, 3 cols on xl) */}
                      <div className="col-span-1 md:col-span-6 xl:col-span-3 space-y-1">
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
                          className="h-8 text-xs font-medium rounded-lg border-border/70 bg-background placeholder:text-muted-foreground/50 truncate"
                        />
                      </div>
                    </div>

                    {/* Custom Numerical Pricing Amount Input (if PARTNER_A3 or CUSTOM) */}
                    {(item.pricing_tier === "PARTNER_A3" || item.service_id === "CUSTOM") && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/25 space-y-1 animate-in fade-in duration-200">
                        <label className="text-[10.5px] font-bold text-foreground flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <span>Custom Rate / Unit Price (IDR)</span>
                            <span className="text-destructive font-black">*</span>
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono font-medium">Numerical amount (two decimal places)</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground select-none">
                            IDR
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={item.unit_price === 0 || item.unit_price === "" || item.unit_price === null ? "" : item.unit_price}
                            onChange={(e) => {
                              const val = e.target.value;
                              const numVal = val === "" ? 0 : parseFloat(val);
                              setOrderItems((prev) => {
                                const copy = [...prev];
                                copy[idx] = {
                                  ...copy[idx],
                                  unit_price: isNaN(numVal) ? 0 : numVal,
                                  custom_price_text: ""
                                };
                                return copy;
                              });
                            }}
                            placeholder="0.00"
                            className="h-8 pl-12 text-xs font-mono font-bold bg-background rounded-lg border-border/80 focus-visible:ring-primary/20"
                          />
                        </div>
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
                ))}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Frequently Changed Operational Modules (Roster, Reviewer, Notes) */}
          <div className="xl:col-span-5 2xl:col-span-4 space-y-3 min-w-0 xl:sticky xl:top-2 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto pr-0.5">

            {/* Licensing Roster Allocation */}
            {!isPipeline && (
              <Card className="border-border/60 shadow-2xs rounded-xl bg-card/60 backdrop-blur-md">
                <CardHeader className="py-2.5 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                      3. Consultant Roster ({selectedConsultantIds.length})
                    </CardTitle>
                  </div>
                  {selectedConsultantIds.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConsultantIds([])}
                      className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-destructive gap-0.5 font-medium shrink-0"
                    >
                      Clear All
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
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
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-[10.5px] transition-colors ${isReviewer
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
                <CardHeader className="py-2.5 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                      4. Designated Reviewer ({selectedReviewerId ? "1 Selected" : "Optional"})
                    </CardTitle>
                  </div>
                  {selectedReviewerId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReviewerId(null)}
                      className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-destructive gap-0.5 font-medium shrink-0"
                    >
                      <X className="h-2.5 w-2.5" /> Clear Reviewer
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
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
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg border select-none text-[10.5px] transition-all ${isConsultant
                                ? "opacity-50 border-dashed border-primary/40 bg-primary/5 cursor-not-allowed"
                                : isSelected
                                  ? "border-purple-500/80 bg-purple-500/15 text-purple-800 dark:text-purple-300 font-bold shadow-2xs ring-1 ring-purple-500/40 cursor-pointer"
                                  : "border-border/60 bg-background/50 hover:bg-muted/40 hover:border-border cursor-pointer"
                              }`}
                          >
                            <div className={`h-3 w-3 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected
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
              <CardHeader className="py-2.5 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                    {isPipeline ? "3. Pipeline Lead Notes" : "5. Internal Delivery Notes"}
                  </CardTitle>
                </div>
                <span className="text-[9px] text-muted-foreground font-mono italic shrink-0">For Delivery Manager</span>
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
        <div className="sticky bottom-0 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-card/95 border border-border/70 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 flex-wrap min-w-0">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Order Summary:</span>
            <Badge variant="secondary" className="font-mono text-xs font-semibold px-2 py-0.5 shrink-0">
              {orderItems.length} {orderItems.length === 1 ? "Line Item" : "Line Items"}
            </Badge>
            <span className="font-mono font-black text-sm text-foreground truncate">
              {formatCurrency(orderGrandTotal)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <Link href={isPipeline ? "/business/clients/orders/pipeline" : "/business/clients/orders"}>
              <Button type="button" variant="outline" className="rounded-lg h-8 px-3.5 font-bold text-xs">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="font-bold shadow-xs gap-1.5 rounded-lg h-8 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              {saving ? "Saving..." : isPipeline ? "Create Pipeline Order" : "Issue Client Order"}
            </Button>
          </div>
        </div>

      </form>

      {/* Create Company Modal - Fully Consistent with Add New Company Entity Form */}
      <CreateCompanyDialog
        open={isCreateCompanyOpen}
        onOpenChange={setIsCreateCompanyOpen}
        target={createCompanyTarget}
        initialClientId={filterClientId || (clients[0] ? String(clients[0].id) : "")}
        clients={clients}
        onSuccess={handleCompanyCreated}
      />
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
