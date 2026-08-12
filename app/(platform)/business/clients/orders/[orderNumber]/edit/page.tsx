"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { 
  Loader2, 
  ArrowLeft, 
  Check, 
  Users,
  Tag,
  Plus,
  Trash2,
  Lock,
  Edit,
  Building,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function EditClientOrderPage() {
  const router = useRouter();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState<any>(null);

  // DB Data Options
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Edit Form States
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);
  const [editForm, setEditForm] = useState({
    status: "CONFIRMED",
    payment_status: "UNPAID",
    invoice_number: "",
    consultant_ids: [] as number[],
    notes: "",
    items: [] as any[],
    is_proforma_finalized: false,
    is_final_invoice_finalized: false
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [ordRes, serRes, empRes, teamRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      let fetchedOrders: any[] = [];
      let fetchedServices: any[] = [];
      if (ordRes.ok) fetchedOrders = await ordRes.json();
      if (serRes.ok) fetchedServices = await serRes.json();
      if (empRes.ok) setEmployees(await empRes.json());
      if (teamRes.ok) setTeams(await teamRes.json());
      
      setServices(fetchedServices);

      // Group raw orders by order_number
      const groupedOrdersMap = new Map<string, any>();
      (Array.isArray(fetchedOrders) ? fetchedOrders : []).forEach((ord) => {
        const key = ord.order_number || `SINGLE-${ord.id}`;
        if (!groupedOrdersMap.has(key)) {
          groupedOrdersMap.set(key, {
            order_number: ord.order_number,
            client_name: ord.client_name,
            client_id: ord.client_id,
            company_name: ord.company_name,
            company_id: ord.company_id,
            created_at: ord.created_at,
            status: ord.status || "CONFIRMED",
            payment_status: ord.payment_status || "UNPAID",
            invoice_number: ord.invoice_number || null,
            consultant_ids: ord.consultant_ids || [],
            consultants: ord.consultants || [],
            notes: ord.notes || "",
            total_amount: 0,
            items: [],
            is_proforma_finalized: ord.is_proforma_finalized || false,
            proforma_stage_percent: ord.proforma_stage_percent || 50,
            is_final_invoice_finalized: ord.is_final_invoice_finalized || false
          });
        }
        const group = groupedOrdersMap.get(key);
        group.items.push(ord);
        group.total_amount += ord.unit_price || ord.total_amount || 0;

        if (ord.is_proforma_finalized) {
          group.is_proforma_finalized = true;
        }
        if (ord.proforma_stage_percent) {
          group.proforma_stage_percent = ord.proforma_stage_percent;
        }
        if (ord.is_final_invoice_finalized) {
          group.is_final_invoice_finalized = true;
        }

        if (ord.consultants && ord.consultants.length > 0) {
          const existingIds = new Set(group.consultants.map((c: any) => c.id));
          ord.consultants.forEach((c: any) => {
            if (!existingIds.has(c.id)) group.consultants.push(c);
          });
        }
        if (ord.consultant_ids && ord.consultant_ids.length > 0) {
          group.consultant_ids = Array.from(new Set([...group.consultant_ids, ...ord.consultant_ids]));
        }
      });

      const targetGroup = groupedOrdersMap.get(orderNumber);
      if (!targetGroup) {
        toast.error(`Order group ${orderNumber} not found.`);
        router.push("/business/clients/orders");
        return;
      }

      setSelectedOrderGroup(targetGroup);
      
      const mappedItems = (targetGroup.items || []).map((item: any) => {
        const matchedService = fetchedServices.find((s) => s.id === item.service_id);
        return {
          id: item.id,
          service_id: item.service_id ? String(item.service_id) : "",
          job_id: item.job_id || "",
          job_title: item.job_title || "",
          description: item.description || "",
          pricing_tier: item.pricing_tier || "BASE",
          unit_price: item.unit_price || 0,
          custom_price_text: item.custom_price_text || "",
          _raw_service: matchedService || null
        };
      });

      setEditForm({
        status: targetGroup.status || "CONFIRMED",
        payment_status: targetGroup.payment_status || "UNPAID",
        invoice_number: targetGroup.invoice_number || "",
        consultant_ids: targetGroup.consultant_ids || [],
        notes: targetGroup.notes || "",
        items: mappedItems,
        is_proforma_finalized: targetGroup.is_proforma_finalized || false,
        is_final_invoice_finalized: targetGroup.is_final_invoice_finalized || false
      });

    } catch (err) {
      console.error("Error loading order data:", err);
      toast.error("Failed to load dependency catalog or order data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderNumber) {
      fetchData();
    }
  }, [orderNumber]);

  const toggleEditConsultantSelect = (empId: number) => {
    setEditForm(prev => {
      const current = prev.consultant_ids || [];
      const updated = current.includes(empId) ? current.filter(id => id !== empId) : [...current, empId];
      return { ...prev, consultant_ids: updated };
    });
  };

  const handleEditServiceSelect = (index: number, serviceIdStr: string) => {
    const selectedService = services.find((s) => String(s.id) === serviceIdStr);
    if (!selectedService) return;

    setEditForm((prev) => {
      const itemsCopy = [...prev.items];
      const tier = itemsCopy[index].pricing_tier || "BASE";

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

      itemsCopy[index] = {
        ...itemsCopy[index],
        service_id: String(selectedService.id),
        job_id: selectedService.job_id,
        job_title: selectedService.job_title,
        description: selectedService.description || "",
        unit_price: price,
        custom_price_text: customText,
        _raw_service: selectedService
      };
      return { ...prev, items: itemsCopy };
    });
  };

  const handleEditTierSelect = (index: number, tier: string) => {
    setEditForm((prev) => {
      const itemsCopy = [...prev.items];
      const item = itemsCopy[index];
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

      itemsCopy[index] = {
        ...item,
        pricing_tier: tier,
        unit_price: price,
        custom_price_text: customText
      };
      return { ...prev, items: itemsCopy };
    });
  };

  const handleAddEditItem = () => {
    setEditForm(prev => ({
      ...prev,
      items: [
        {
          service_id: "",
          job_id: "",
          job_title: "",
          description: "",
          pricing_tier: "BASE",
          unit_price: 0,
          custom_price_text: "",
          _raw_service: null
        },
        ...prev.items
      ]
    }));
  };

  const handleRemoveEditItem = (index: number) => {
    const itemToRemove = editForm.items[index];
    if (itemToRemove.id) {
      setDeletedItemIds(prev => [...prev, itemToRemove.id]);
    }
    setEditForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedOrderGroup || !editForm.items) return;

    const validItems = editForm.items.filter((i: any) => i.service_id && i.job_title);
    if (validItems.length === 0) {
      toast.error("Please add at least one valid service item.");
      return;
    }

    setSaving(true);
    try {
      // 1. Delete removed items from db
      if (deletedItemIds.length > 0) {
        await Promise.all(
          deletedItemIds.map((id) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${id}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
            })
          )
        );
      }

      // 2. Separate into new and existing items
      const existingItems = editForm.items.filter((item: any) => item.id);
      const newItems = editForm.items.filter((item: any) => !item.id);

      // 3. Update existing items in db
      if (existingItems.length > 0) {
        await Promise.all(
          existingItems.map((item: any) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${item.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                status: editForm.status,
                payment_status: editForm.payment_status,
                invoice_number: editForm.invoice_number || null,
                consultant_ids: editForm.consultant_ids,
                notes: editForm.notes || null,
                service_id: item.service_id ? Number(item.service_id) : null,
                job_id: item.job_id || null,
                job_title: item.job_title || null,
                description: item.description || null,
                pricing_tier: item.pricing_tier || null,
                unit_price: item.unit_price || 0,
                custom_price_text: item.custom_price_text || null,
                is_proforma_finalized: editForm.is_proforma_finalized,
                is_final_invoice_finalized: editForm.is_final_invoice_finalized
              })
            })
          )
        );
      }

      // 4. Create new items in db
      if (newItems.length > 0) {
        const payload = {
          company_id: selectedOrderGroup.company_id,
          order_number: selectedOrderGroup.order_number,
          items: newItems.map((item: any) => ({
            service_id: item.service_id ? Number(item.service_id) : null,
            job_id: item.job_id,
            job_title: item.job_title,
            description: item.description,
            pricing_tier: item.pricing_tier,
            unit_price: item.unit_price || 0,
            custom_price_text: item.custom_price_text || null
          })),
          consultant_ids: editForm.consultant_ids,
          notes: editForm.notes || null
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to create new order items");
        }
      }

      toast.success("Order changes saved successfully!");
      router.push("/business/clients/orders");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error updating order details");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
  };

  const editItemsTotal = (editForm.items || []).reduce((acc, curr) => acc + (curr.unit_price || 0), 0);
  const canEditItems = editForm.payment_status === "UNPAID" && editForm.status === "DRAFT";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading order details...</p>
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
          <Edit className="h-6 w-6" />
        </div>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Service Order</h1>
            <p className="text-muted-foreground mt-1">Configure client partner scope entities, allocate consultant rosters, and build billing line items.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-start sm:self-auto">
            <Badge variant="outline" className="font-mono text-sm font-bold px-4 py-2 border-primary/20 bg-primary/5 text-primary rounded-xl shrink-0">
              {orderNumber}
            </Badge>
            {editItemsTotal > 0 && (
              <Badge variant="outline" className="font-mono text-sm font-bold px-4 py-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                Total Order Value: {formatCurrency(editItemsTotal)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleEditSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Entity Details & Service Items (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Compact Entity Summary Banner */}
          {selectedOrderGroup && (
            <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 text-xs">
                <div>
                  <span className="text-muted-foreground block font-medium text-[10px] uppercase tracking-wider">Company</span>
                  <span className="font-bold text-foreground text-sm truncate block">{selectedOrderGroup.company_name || "Individual"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium text-[10px] uppercase tracking-wider">Representative</span>
                  <span className="font-semibold text-foreground truncate block">{selectedOrderGroup.client_name || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium text-[10px] uppercase tracking-wider">Created On</span>
                  <span className="font-semibold text-foreground block">
                    {new Date(selectedOrderGroup.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Items Editor */}
          <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-border/30 p-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" /> Service Line Items ({(editForm.items || []).length})
                </CardTitle>
                <CardDescription className="text-xs">Configure service deliverables and pricing tiers.</CardDescription>
              </div>
              {canEditItems && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEditItem}
                  className="border-dashed border-primary/40 text-primary hover:bg-primary/5 gap-1.5 font-bold rounded-lg h-8 text-xs shrink-0"
                >
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-4 pt-4 p-4">
              {(editForm.items || []).length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground italic border border-dashed rounded-lg">
                  No items in this order. Add at least one item to proceed.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {(editForm.items || []).map((item: any, idx: number) => (
                    <div key={item.id || idx} className="p-4 rounded-xl border border-border/40 bg-background/40 shadow-xs space-y-3 relative">
                      
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

                        {canEditItems && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEditItem(idx)}
                            className="text-destructive hover:bg-destructive/10 text-[10px] gap-1 h-6 rounded-lg px-2"
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Service Selection */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Service Catalog Item *</label>
                          <select
                            value={item.service_id}
                            onChange={(e) => handleEditServiceSelect(idx, e.target.value)}
                            disabled={!canEditItems}
                            className="flex h-8.5 w-full rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs font-medium shadow-xs disabled:opacity-80 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <option value="">Choose Service...</option>
                            {services.map((s) => (
                              <option key={s.id} value={String(s.id)}>
                                {s.job_title} ({s.job_id})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Pricing Tier */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pricing Tier *</label>
                          <select
                            value={item.pricing_tier}
                            onChange={(e) => handleEditTierSelect(idx, e.target.value)}
                            disabled={!canEditItems}
                            className="flex h-8.5 w-full rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs font-medium shadow-xs disabled:opacity-80 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
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

                      {/* Custom Price Text Input (A3) */}
                      {item.pricing_tier === "PARTNER_A3" && (
                        <div className="space-y-1 pt-0.5 animate-in slide-in-from-top-2 duration-200">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Custom Price Label Value *</label>
                          <Input
                            required
                            value={item.custom_price_text || ""}
                            disabled={!canEditItems}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditForm(prev => {
                                const itemsCopy = [...prev.items];
                                itemsCopy[idx] = { ...itemsCopy[idx], custom_price_text: val };
                                return { ...prev, items: itemsCopy };
                              });
                            }}
                            placeholder="e.g. Free or Custom Contract Price"
                            className="h-8.5 text-xs font-semibold rounded-lg border-border/60 bg-background"
                          />
                        </div>
                      )}

                      {/* Reflected Price Bar */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/30 font-mono text-[10px]">
                        <span className="font-bold text-muted-foreground">Price Calculation:</span>
                        <span className="font-extrabold text-xs text-foreground">
                          {item.pricing_tier === "PARTNER_A3"
                            ? `Free Text: ${item.custom_price_text || "Custom"}`
                            : formatCurrency(item.unit_price)
                          }
                        </span>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Settings, Consultants & Save Actions (1/3 width) */}
        <div className="lg:col-span-1 space-y-3">

          {/* Locked Proforma Alert banner */}
          {selectedOrderGroup?.is_proforma_finalized && (
            <Card className="border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 shadow-sm">
              <CardContent className="p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-500" /> Proforma Locked
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Order is finalized. Uncheck to unlock and allow edits.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 bg-background/50 p-2 rounded-lg border">
                  <input
                    type="checkbox"
                    id="unlock-proforma-checkbox"
                    checked={editForm.is_proforma_finalized}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setEditForm(prev => {
                        const nextForm = { ...prev, is_proforma_finalized: isChecked };
                        if (!isChecked) {
                          nextForm.is_final_invoice_finalized = false;
                          nextForm.status = "DRAFT";
                        }
                        return nextForm;
                      });
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                  />
                  <label htmlFor="unlock-proforma-checkbox" className="text-[10px] font-bold text-foreground cursor-pointer select-none">
                    {editForm.is_proforma_finalized ? "Locked" : "Editable"}
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lifecycle & Payment Status Settings */}
          <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
            <CardHeader className="p-3 pb-2 border-b border-border/30">
              <CardTitle className="text-xs font-bold flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" /> Lifecycle Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 p-3 pt-1.5">
              {/* Lifecycle Stage */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Lifecycle Stage</label>
                <select
                  required
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-border/60 bg-background px-3 py-1 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PROFORMA_GENERATED">PROFORMA GENERATED</option>
                  <option value="WAITING_ON_CLIENT">WAITING ON CLIENT</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="ORDER_ASSIGNED">ORDER ASSIGNED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="REVIEW_DOCS">REVIEW DOCS</option>
                  <option value="FINAL_DOCUMENT_PREPARATION">FINAL DOCUMENT PREPARATION</option>
                  <option value="FINAL_DOC_READY">FINAL DOC READY</option>
                  <option value="INVOICE_GENERATED">INVOICE GENERATED</option>
                  <option value="SOFT_COPY_DELIVERED">SOFT COPY DELIVERED</option>
                  <option value="HARD_COPY_DELIVERED">HARD copy DELIVERED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Payment Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Status</label>
                <select
                  required
                  value={editForm.payment_status}
                  onChange={(e) => setEditForm({ ...editForm, payment_status: e.target.value })}
                  className="flex h-9 w-full rounded-lg border border-border/60 bg-background px-3 py-1 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>

              {/* Internal Instructions */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Internal Instructions / Notes</label>
                <textarea
                  name="notes"
                  value={editForm.notes || ""}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={2}
                  className="flex w-full rounded-lg border border-border/60 bg-background p-2.5 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-normal font-semibold transition-all"
                  placeholder="Execution notes..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Consultant Roster Assignment Grid */}
          <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
            <CardHeader className="p-3 pb-2 border-b border-border/30">
              <CardTitle className="text-xs font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Roster Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1.5">
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-background rounded-lg border border-border/40">
                {(() => {
                  const licensingTeam = (teams || []).find((t: any) => t.name.toLowerCase() === "licensing team");
                  const licensingMemberIds = licensingTeam ? (licensingTeam.members || []).map((m: any) => m.id) : [];
                  const licensingEmployees = employees.filter((emp) => licensingMemberIds.includes(emp.id));

                  if (licensingEmployees.length === 0) {
                    return <span className="text-xs text-muted-foreground italic py-2 text-center col-span-3">No licensing consultants</span>;
                  }

                  return licensingEmployees.map((emp) => {
                    const isChecked = (editForm.consultant_ids || []).includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none text-[11px] transition-colors ${isChecked ? "border-primary bg-primary/10 text-primary font-bold shadow-xs" : "border-border/60 hover:bg-muted/40"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditConsultantSelect(emp.id)}
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
            </CardContent>
          </Card>

          {/* Sticky Actions Bar */}
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
              Save Changes
            </Button>
          </div>

        </div>

      </form>
    </div>
  );
}
