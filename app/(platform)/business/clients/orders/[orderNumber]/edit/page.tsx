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
  Building2,
  DollarSign,
  Briefcase,
  MapPin,
  UserCheck
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

export default function EditClientOrderPage() {
  const router = useRouter();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState<any>(null);

  // DB Data Options
  const [services, setServices] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [notaries, setNotaries] = useState<any[]>([]);

  // Edit Form States
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);
  const [editForm, setEditForm] = useState({
    status: "CONFIRMED",
    payment_status: "UNPAID",
    proforma_paid_amount: null as number | null,
    billing_company_id: null as number | null,
    same_billing_company: true,
    invoice_number: "",
    consultant_ids: [] as number[],
    notes: "",
    items: [] as any[],
    is_proforma_finalized: false,
    is_final_invoice_finalized: false
  });

  // Quick Create Company State
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    company_name: "",
    address: "",
    tax_number: "",
    industry: "",
    key_contact_person: "",
    key_contact_email: "",
    key_contact_phone: "",
    notes: ""
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [ordRes, serRes, empRes, teamRes, notariesRes, compRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      let fetchedOrders: any[] = [];
      let fetchedServices: any[] = [];
      if (ordRes.ok) fetchedOrders = await ordRes.json();
      if (serRes.ok) fetchedServices = await serRes.json();
      if (empRes.ok) setEmployees(await empRes.json());
      if (teamRes.ok) setTeams(await teamRes.json());
      if (notariesRes.ok) setNotaries(await notariesRes.json());
      if (compRes.ok) setCompanies(await compRes.json());
      
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
            billing_company_name: ord.billing_company_name || ord.company_name,
            billing_company_id: ord.billing_company_id || ord.company_id,
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
            proforma_paid_amount: ord.proforma_paid_amount != null ? ord.proforma_paid_amount : null,
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
        if (ord.proforma_paid_amount != null) {
          group.proforma_paid_amount = ord.proforma_paid_amount;
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
          branch_name: item.branch_name || "",
          description: item.description || "",
          pricing_tier: item.pricing_tier || "BASE",
          unit_price: item.unit_price || 0,
          custom_price_text: item.custom_price_text || "",
          notary_id: item.notary_id ? String(item.notary_id) : "",
          _raw_service: matchedService || null
        };
      });

      const isSameBilling = !targetGroup.billing_company_id || targetGroup.billing_company_id === targetGroup.company_id;
      setEditForm({
        status: targetGroup.status || "CONFIRMED",
        payment_status: targetGroup.payment_status || "UNPAID",
        proforma_paid_amount: targetGroup.proforma_paid_amount != null ? targetGroup.proforma_paid_amount : null,
        billing_company_id: targetGroup.billing_company_id || targetGroup.company_id,
        same_billing_company: isSameBilling,
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
        notary_id: "",
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
          notary_id: "",
          _raw_service: null
        },
        ...prev.items
      ]
    }));
  };

  const handleOpenCreateCompany = () => {
    setNewCompanyForm({
      company_name: "",
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
    if (!token) return;
    if (!newCompanyForm.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!newCompanyForm.key_contact_person.trim()) {
      toast.error("Key Contact Person Name is required");
      return;
    }
    if (!newCompanyForm.key_contact_email.trim()) {
      toast.error("Key Contact Email is required");
      return;
    }
    if (!newCompanyForm.key_contact_phone.trim()) {
      toast.error("Key Contact Phone is required");
      return;
    }
    setCreatingCompany(true);
    try {
      const payload = {
        company_name: newCompanyForm.company_name.trim(),
        client_id: selectedOrderGroup?.client_id || null,
        address: newCompanyForm.address || null,
        tax_number: newCompanyForm.tax_number || null,
        industry: newCompanyForm.industry || null,
        key_contact_person: newCompanyForm.key_contact_person || null,
        key_contact_email: newCompanyForm.key_contact_email || null,
        key_contact_phone: newCompanyForm.key_contact_phone || null,
        notes: newCompanyForm.notes || null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/standalone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdComp = await res.json();
        toast.success(`Company "${createdComp.company_name}" created successfully!`);
        setCompanies(prev => [...prev, createdComp]);
        setEditForm(prev => ({
          ...prev,
          billing_company_id: createdComp.id,
          same_billing_company: false
        }));
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
      const finalBillingId = editForm.same_billing_company
        ? selectedOrderGroup.company_id
        : (editForm.billing_company_id ? Number(editForm.billing_company_id) : selectedOrderGroup.company_id);

      if (existingItems.length > 0) {
        await Promise.all(
          existingItems.map((item: any, idx: number) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${item.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                status: editForm.status,
                payment_status: editForm.payment_status,
                ...(idx === 0 ? {
                  proforma_paid_amount: editForm.proforma_paid_amount != null ? Number(editForm.proforma_paid_amount) : null
                } : {}),
                billing_company_id: finalBillingId,
                invoice_number: editForm.invoice_number || null,
                consultant_ids: editForm.consultant_ids,
                notes: editForm.notes || null,
                service_id: item.service_id ? Number(item.service_id) : null,
                job_id: item.job_id || null,
                job_title: item.job_title || null,
                branch_name: item.branch_name ? item.branch_name.trim() : null,
                description: item.description || null,
                pricing_tier: item.pricing_tier || null,
                unit_price: item.unit_price || 0,
                custom_price_text: item.custom_price_text || null,
                is_proforma_finalized: editForm.is_proforma_finalized,
                is_final_invoice_finalized: editForm.is_final_invoice_finalized,
                notary_id: item.notary_id ? Number(item.notary_id) : null
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
            branch_name: item.branch_name ? item.branch_name.trim() : null,
            description: item.description,
            pricing_tier: item.pricing_tier,
            unit_price: item.unit_price || 0,
            custom_price_text: item.custom_price_text || null,
            notary_id: item.notary_id ? Number(item.notary_id) : null
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

          {/* Compact Entity Summary Banner with Billing Entity Controls */}
          {selectedOrderGroup && (
            <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-muted-foreground block font-medium text-[10px] uppercase tracking-wider">Target Company</span>
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
                </div>

                {/* Billing Company Checkbox & Dropdown */}
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editForm.same_billing_company}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditForm(prev => ({
                          ...prev,
                          same_billing_company: checked,
                          billing_company_id: checked ? selectedOrderGroup.company_id : prev.billing_company_id
                        }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-foreground">
                      Billing company is the same as Target Company Entity
                    </span>
                  </label>

                  {!editForm.same_billing_company && (
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
                          onClick={handleOpenCreateCompany}
                          className="h-6 px-2 text-[10px] gap-1 font-bold border-primary/40 text-primary hover:bg-primary/10"
                        >
                          <Plus className="h-3 w-3" /> Create Company
                        </Button>
                      </div>
                      <select
                        value={String(editForm.billing_company_id || "")}
                        onChange={(e) => setEditForm(prev => ({ ...prev, billing_company_id: e.target.value ? Number(e.target.value) : null }))}
                        className="flex h-8.5 w-full rounded-lg border border-primary/50 bg-background px-3 py-1 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        <option value="">Choose Billing Company...</option>
                        {companies.map((comp) => (
                          <option key={comp.id} value={String(comp.id)}>
                            {comp.company_name} ({comp.company_code})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-muted-foreground italic">
                        Proforma and Final invoices will be addressed to and billed under this entity.
                      </p>
                    </div>
                  )}
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

                      {/* Branch / Entity Reference (Free Text) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                          <span>Branch / Entity Reference</span>
                          <span className="text-[10px] font-mono text-muted-foreground/70 italic">Optional • Printed on Invoices</span>
                        </label>
                        <Input
                          value={item.branch_name || ""}
                          disabled={!canEditItems}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm((prev) => {
                              const itemsCopy = [...prev.items];
                              itemsCopy[idx] = { ...itemsCopy[idx], branch_name: val };
                              return { ...prev, items: itemsCopy };
                            });
                          }}
                          placeholder="e.g. Bali Branch, HQ Office, Project Alpha..."
                          className="h-8.5 text-xs font-medium rounded-lg border-border/60 bg-background disabled:opacity-80"
                        />
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

                      {/* Notary Selection (Conditional) */}
                      {item._raw_service?.needs_notary && (
                        <div className="space-y-1 pt-1 animate-in slide-in-from-top-2 duration-200">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Notary *</label>
                          <select
                            required
                            disabled={!canEditItems}
                            value={item.notary_id || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditForm((prev) => {
                                const itemsCopy = [...prev.items];
                                itemsCopy[idx] = { ...itemsCopy[idx], notary_id: val ? Number(val) : "" };
                                return { ...prev, items: itemsCopy };
                              });
                            }}
                            className="flex h-8.5 w-full rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs font-medium shadow-xs disabled:opacity-80 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
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

          {/* Unified Order Settings, Roster, & Notes Box */}
          <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
            <CardContent className="space-y-4 p-4 pt-4">
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
                  <option value="WAITING_FOR_FINAL_PAYMENT">WAITING FOR FINAL PAYMENT</option>
                  <option value="FINAL_PAYMENT_COMPLETED">FINAL PAYMENT COMPLETED</option>
                  <option value="SOFT_COPY_DELIVERED">SOFT COPY DELIVERED</option>
                  <option value="HARD_COPY_DELIVERED">HARD COPY DELIVERED</option>
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
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    let defaultPaidAmt = editForm.proforma_paid_amount;
                    if (newStatus === "PARTIALLY_PAID" && (defaultPaidAmt === undefined || defaultPaidAmt === null || defaultPaidAmt === 0)) {
                      defaultPaidAmt = Math.round((selectedOrderGroup?.total_amount || 0) * (selectedOrderGroup?.proforma_stage_percent || 50) / 100);
                    } else if (newStatus === "PAID") {
                      defaultPaidAmt = selectedOrderGroup?.total_amount || 0;
                    }
                    setEditForm({ ...editForm, payment_status: newStatus, proforma_paid_amount: defaultPaidAmt });
                  }}
                  className="flex h-9 w-full rounded-lg border border-border/60 bg-background px-3 py-1 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                  <option value="PAID">PAID</option>
                </select>
              </div>

              {/* Amount Received / Proforma Paid Amount Input */}
              {(editForm.payment_status === "PARTIALLY_PAID" || editForm.payment_status === "PAID") && (
                <div className="space-y-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {editForm.payment_status === "PARTIALLY_PAID" ? "Amount Received / Proforma Paid (IDR)" : "Total Amount Received (IDR)"}
                    </label>
                    {selectedOrderGroup?.total_amount && editForm.proforma_paid_amount ? (
                      <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                        {((Number(editForm.proforma_paid_amount) / selectedOrderGroup.total_amount) * 100).toFixed(1)}% of total
                      </span>
                    ) : null}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 2000000"
                    value={editForm.proforma_paid_amount ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? null : Number(e.target.value);
                      setEditForm({ ...editForm, proforma_paid_amount: val });
                    }}
                    className="h-8 text-xs font-mono font-bold bg-background"
                  />
                  {selectedOrderGroup?.total_amount && editForm.payment_status === "PARTIALLY_PAID" && (
                    <div className="text-[11px] text-muted-foreground flex justify-between pt-1 border-t border-amber-500/15">
                      <span>Remaining for Final Invoice:</span>
                      <span className="font-bold text-foreground font-mono">
                        IDR {Math.max(0, (selectedOrderGroup.total_amount || 0) - (Number(editForm.proforma_paid_amount) || 0)).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              )}

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
                    Register a corporate entity profile for <span className="font-semibold text-foreground">invoicing & billing recipient</span>.
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider bg-background border-border/70">
                Billing Entity
              </Badge>
            </div>
          </div>

          <form onSubmit={handleCreateCompanySubmit} className="p-6 sm:p-7 space-y-6">
            
            {/* Section 1: Corporate Profile */}
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
                    Industry / Business Sector
                  </label>
                  <Input
                    value={newCompanyForm.industry}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g. Management Consulting, IT Services"
                    className="h-10 text-xs font-medium rounded-xl border-border/70 focus-visible:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
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
                  <Input
                    required
                    type="email"
                    value={newCompanyForm.key_contact_email}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, key_contact_email: e.target.value }))}
                    placeholder="budi@company.co.id"
                    className="h-10 text-xs font-medium rounded-xl border-border/70 focus-visible:ring-primary/20 bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <span>Phone Number</span>
                    <span className="text-destructive font-black">*</span>
                  </label>
                  <Input
                    required
                    value={newCompanyForm.key_contact_phone}
                    onChange={(e) => setNewCompanyForm(prev => ({ ...prev, key_contact_phone: e.target.value }))}
                    placeholder="+62 812-3456-7890"
                    className="h-10 text-xs font-medium rounded-xl border-border/70 focus-visible:ring-primary/20 bg-background font-mono"
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
                className="h-10 px-5 text-xs font-bold rounded-xl border-border hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingCompany}
                className="h-10 px-6 text-xs font-bold gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
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
