"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Trash2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function NewClientOrderPage() {
  const router = useRouter();
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
  const [selectedConsultantIds, setSelectedConsultantIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<any[]>([
    {
      service_id: "",
      job_id: "",
      job_title: "",
      description: "",
      pricing_tier: "BASE",
      unit_price: 0,
      custom_price_text: "",
      notary_id: "",
      _raw_service: null
    }
  ]);

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [cliRes, compRes, serRes, empRes, teamRes, notariesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries`, { headers: { "Authorization": `Bearer ${token}` } })
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
        description: "",
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
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
        description: i.description,
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
      const payload = {
        company_id: parseInt(selectedCompanyId),
        items: validItems,
        consultant_ids: selectedConsultantIds,
        notes: notes || null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Client service order issued successfully!");
        router.push("/business/clients/orders");
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
        <Link href="/business/clients/orders" className="mt-1">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm shrink-0 flex items-center justify-center">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Issue New Client Order</h1>
            <p className="text-muted-foreground mt-1">Configure client partner scope entities, allocate consultant rosters, and build billing line items.</p>
          </div>
          {orderGrandTotal > 0 && (
            <Badge variant="outline" className="font-mono text-sm font-bold px-4 py-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 self-start sm:self-auto rounded-xl">
              Total Order Value: {formatCurrency(orderGrandTotal)}
            </Badge>
          )}
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-muted-foreground/75" />
                    <span>Select Target Company Entity *</span>
                  </label>
                  <select
                    required
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-border/60 bg-background px-3 py-1 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Choose Target Company...</option>
                    {(filterClientId
                      ? companies.filter(c => c.client_id === parseInt(filterClientId))
                      : companies
                    ).map((comp) => (
                      <option key={comp.id} value={String(comp.id)}>
                        {comp.company_name} ({comp.company_code})
                      </option>
                    ))}
                  </select>
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

                    {/* Notary Selection (Conditional) */}
                    {item._raw_service?.needs_notary && (
                      <div className="space-y-1 pt-1 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Notary *</label>
                        <select
                          required
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
                          <option value="">Choose Notary...</option>
                          {(() => {
                            const serviceId = Number(item.service_id);
                            const filtered = notaries.filter((n) => 
                              n.service_fees && n.service_fees.some((sf: any) => sf.service_id === serviceId)
                            );
                            return filtered.map((n) => {
                              const serviceFeeObj = n.service_fees.find((sf: any) => sf.service_id === serviceId);
                              const specificFee = serviceFeeObj ? serviceFeeObj.fee : 0;
                              return (
                                <option key={n.id} value={n.id}>
                                  {n.name} ({n.city} - {formatCurrency(specificFee)})
                                </option>
                              );
                            });
                          })()}
                        </select>
                      </div>
                    )}

                    {/* Reflected Price Bar */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/30 font-mono text-[10px]">
                      <span className="font-bold text-muted-foreground">Price Calculation:</span>
                      <span className="font-extrabold text-xs text-foreground">
                        {item.pricing_tier === "PARTNER_A3"
                          ? `Free Text: ${item.custom_price_text || "Custom"}`
                          : formatCurrency(item.unit_price)}
                      </span>
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
              {/* Roster Allocation */}
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

              {/* Notes & Instructions */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">General Notes / Instructions</label>
                <textarea
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-lg border border-border/60 bg-background p-2.5 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-normal font-semibold transition-all"
                  placeholder="Deliverables schedule, client requests..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Link href="/business/clients/orders" className="flex-1">
              <Button type="button" variant="outline" className="w-full rounded-xl h-10 px-4 font-bold border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground transition-colors bg-transparent">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={saving} 
              className="flex-1 font-bold shadow-md gap-2 rounded-xl h-10 bg-zinc-900 hover:bg-zinc-100 text-zinc-50 hover:text-zinc-900 border border-zinc-900 dark:bg-zinc-100 dark:hover:bg-zinc-900 dark:text-zinc-950 dark:hover:text-zinc-100 dark:border-zinc-100 transition-all duration-200"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Issue Order
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
}
