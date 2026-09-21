"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  AlertCircle,
  Lock,
  Edit,
  DollarSign,
  PauseCircle,
  AlertTriangle,
  MessageSquare
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
import { cn, formatNumberWithCommas, parseNumberFromCommas } from "@/lib/utils";

export default function EditClientOrderPage() {
  const router = useRouter();
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState<any>(null);

  // DB Data Options
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [notaries, setNotaries] = useState<any[]>([]);

  // Filter Client Partner
  const [filterClientId, setFilterClientId] = useState<string>("");

  // Edit Form States
  const [deletedItemIds, setDeletedItemIds] = useState<number[]>([]);
  const [editForm, setEditForm] = useState({
    company_id: "" as string,
    billing_company_id: "" as string,
    same_billing_company: true,
    status: "CONFIRMED",
    payment_status: "UNPAID",
    proforma_paid_amount: null as number | null,
    invoice_number: "",
    consultant_ids: [] as number[],
    reviewer_id: null as number | null,
    reviewer_ids: [] as number[],
    notes: "",
    items: [] as any[],
    is_proforma_finalized: false,
    is_final_invoice_finalized: false
  });

  // Quick Create Company Modal State
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [createCompanyTarget, setCreateCompanyTarget] = useState<"billing" | "target">("billing");

  // On Hold Modal State
  const [isOnHoldDialogOpen, setIsOnHoldDialogOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  const [holdChannel, setHoldChannel] = useState<"CLIENT" | "INTERNAL">("CLIENT");
  const [prevStatusBeforeHold, setPrevStatusBeforeHold] = useState<string>("CONFIRMED");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cliRes, ordRes, serRes, empRes, teamRes, notariesRes, compRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { credentials: "include" })
      ]);

      let fetchedClients: any[] = [];
      let fetchedOrders: any[] = [];
      let fetchedServices: any[] = [];
      let fetchedCompanies: any[] = [];
      if (cliRes.ok) {
        fetchedClients = await cliRes.json();
        setClients(fetchedClients);
      }
      if (ordRes.ok) fetchedOrders = await ordRes.json();
      if (serRes.ok) {
        fetchedServices = await serRes.json();
        setServices(fetchedServices);
      }
      if (empRes.ok) setEmployees(await empRes.json());
      if (teamRes.ok) setTeams(await teamRes.json());
      if (notariesRes.ok) setNotaries(await notariesRes.json());
      if (compRes.ok) {
        fetchedCompanies = await compRes.json();
      }

      // Ensure any company referenced in fetched orders is present in companies list
      if (Array.isArray(fetchedOrders)) {
        fetchedOrders.forEach((o: any) => {
          if (o.company && !fetchedCompanies.some((c: any) => c.id === o.company.id)) {
            fetchedCompanies.push(o.company);
          }
          if (o.billing_company && !fetchedCompanies.some((c: any) => c.id === o.billing_company.id)) {
            fetchedCompanies.push(o.billing_company);
          }
        });
      }
      setCompanies(fetchedCompanies);

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
            reviewer_id: ord.reviewer_id || null,
            reviewer: ord.reviewer || null,
            reviewer_ids: ord.reviewer_ids || (ord.reviewer_id ? [ord.reviewer_id] : []),
            reviewers: ord.reviewers || (ord.reviewer ? [ord.reviewer] : []),
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

        if (!group.company_id && ord.company_id) {
          group.company_id = ord.company_id;
          group.company_name = ord.company_name;
        }
        if (!group.billing_company_id && ord.billing_company_id) {
          group.billing_company_id = ord.billing_company_id;
          group.billing_company_name = ord.billing_company_name;
        }
        if (!group.client_id && ord.client_id) {
          group.client_id = ord.client_id;
          group.client_name = ord.client_name;
        }

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

        if (ord.reviewer_id) {
          group.reviewer_id = ord.reviewer_id;
        }
        if (ord.reviewer) {
          group.reviewer = ord.reviewer;
        }
        if (ord.reviewer_ids && ord.reviewer_ids.length > 0) {
          group.reviewer_ids = Array.from(new Set([...(group.reviewer_ids || []), ...ord.reviewer_ids]));
        }
        if (ord.reviewers && ord.reviewers.length > 0) {
          const existingRevIds = new Set((group.reviewers || []).map((r: any) => r.id));
          ord.reviewers.forEach((r: any) => {
            if (!existingRevIds.has(r.id)) group.reviewers.push(r);
          });
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

      if (targetGroup.status === "PIPELINE" && searchParams.get("type") !== "pipeline") {
        router.replace(`/business/clients/orders/${orderNumber}/edit?type=pipeline`, { scroll: false });
      }
      
      // Determine filterClientId based on the target company's registered partner
      const targetCompany = (fetchedCompanies || []).find((c: any) => c.id === targetGroup.company_id);
      if (targetCompany && targetCompany.client_id) {
        setFilterClientId(String(targetCompany.client_id));
      } else {
        setFilterClientId("");
      }
      
      const mappedItems = (targetGroup.items || []).map((item: any) => {
        const matchedService = fetchedServices.find((s) => s.id === item.service_id);
        const isCustom = !item.service_id || item.service_id === "CUSTOM";
        return {
          id: item.id,
          service_id: isCustom ? "CUSTOM" : String(item.service_id),
          job_id: item.job_id || (isCustom ? "CUSTOM" : ""),
          job_title: item.job_title || "",
          branch_name: item.branch_name || "",
          description: item.description || "",
          service_instructions: item.service_instructions || "",
          notes: item.notes || "",
          pricing_tier: item.pricing_tier || (isCustom ? "PARTNER_A3" : "BASE"),
          unit_price: item.unit_price || 0,
          custom_price_text: item.custom_price_text || "",
          notary_id: item.notary_id ? String(item.notary_id) : "",
          _raw_service: matchedService || null
        };
      });

      const isSameBilling = !targetGroup.billing_company_id || targetGroup.billing_company_id === targetGroup.company_id;
      setEditForm({
        company_id: targetGroup.company_id ? String(targetGroup.company_id) : "",
        billing_company_id: targetGroup.billing_company_id ? String(targetGroup.billing_company_id) : (targetGroup.company_id ? String(targetGroup.company_id) : ""),
        same_billing_company: isSameBilling,
        status: targetGroup.status || "CONFIRMED",
        payment_status: targetGroup.payment_status || "UNPAID",
        proforma_paid_amount: targetGroup.proforma_paid_amount != null ? targetGroup.proforma_paid_amount : null,
        invoice_number: targetGroup.invoice_number || "",
        consultant_ids: targetGroup.consultant_ids || [],
        reviewer_id: targetGroup.reviewer_id || (targetGroup.reviewer_ids?.[0] ?? null),
        reviewer_ids: targetGroup.reviewer_ids || (targetGroup.reviewer_id ? [targetGroup.reviewer_id] : []),
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
    const currentReviewers = editForm.reviewer_ids || (editForm.reviewer_id ? [editForm.reviewer_id] : []);
    if (currentReviewers.includes(empId) && !(editForm.consultant_ids || []).includes(empId)) {
      toast.error("This person is currently selected as a Designated Reviewer. An employee cannot be both an executing consultant and an order reviewer.");
      return;
    }
    setEditForm(prev => {
      const current = prev.consultant_ids || [];
      const updated = current.includes(empId) ? current.filter(id => id !== empId) : [...current, empId];
      return { ...prev, consultant_ids: updated };
    });
  };

  const toggleEditReviewerSelect = (empId: number) => {
    if ((editForm.consultant_ids || []).includes(empId)) {
      toast.error("This person is currently allocated as an executing consultant. An employee cannot be both an executing consultant and an order reviewer.");
      return;
    }
    setEditForm(prev => {
      const current = prev.reviewer_ids || (prev.reviewer_id ? [prev.reviewer_id] : []);
      const updated = current.includes(empId) ? current.filter(id => id !== empId) : [...current, empId];
      return {
        ...prev,
        reviewer_ids: updated,
        reviewer_id: updated[0] || null
      };
    });
  };

  const handleEditServiceSelect = (index: number, serviceIdStr: string, customTitle?: string) => {
    if (serviceIdStr === "CUSTOM") {
      setEditForm((prev) => {
        const itemsCopy = [...prev.items];
        itemsCopy[index] = {
          ...itemsCopy[index],
          service_id: "CUSTOM",
          job_id: "CUSTOM",
          job_title: customTitle || itemsCopy[index].job_title || "Custom Service",
          description: itemsCopy[index].description || "One-time custom service",
          pricing_tier: "PARTNER_A3",
          unit_price: itemsCopy[index].unit_price || 0,
          custom_price_text: itemsCopy[index].unit_price ? formatNumberWithCommas(itemsCopy[index].unit_price) : "",
          notary_id: "",
          _raw_service: null
        };
        return { ...prev, items: itemsCopy };
      });
      return;
    }

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
        price = itemsCopy[index].unit_price || 0;
        customText = price ? formatNumberWithCommas(price) : "";
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
          price = (item.pricing_tier === "PARTNER_A3" && item.unit_price) ? item.unit_price : 0;
          customText = price ? formatNumberWithCommas(price) : "";
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
          branch_name: "",
          description: "",
          service_instructions: "",
          notes: "",
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

  const handleOpenCreateCompany = (target: "billing" | "target") => {
    setCreateCompanyTarget(target);
    setIsCreateCompanyOpen(true);
  };

  const handleCompanyCreated = (createdComp: any) => {
    setCompanies((prev) => [...prev, createdComp]);
    if (createCompanyTarget === "billing") {
      setEditForm((prev) => ({
        ...prev,
        billing_company_id: String(createdComp.id),
        same_billing_company: false
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        company_id: String(createdComp.id),
        billing_company_id: prev.same_billing_company ? String(createdComp.id) : prev.billing_company_id
      }));
    }
  };

  const handleRemoveEditItem = (index: number) => {
    const itemToRemove = editForm.items[index];
    if (itemToRemove.id) {
      setDeletedItemIds(prev => [...prev, itemToRemove.id]);
    }
    if (editForm.items.length <= 1) {
      setEditForm(prev => ({
        ...prev,
        items: [
          {
            service_id: "",
            job_id: "",
            job_title: "",
            branch_name: "",
            description: "",
            service_instructions: "",
            notes: "",
            pricing_tier: "BASE",
            unit_price: 0,
            custom_price_text: "",
            notary_id: "",
            _raw_service: null
          }
        ]
      }));
      return;
    }
    setEditForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "ON_HOLD") {
      setPrevStatusBeforeHold(editForm.status);
      setHoldReason("");
      setHoldChannel("CLIENT");
      setIsOnHoldDialogOpen(true);
      return;
    }
    setEditForm(prev => ({ ...prev, status: newStatus }));
  };

  const handleConfirmOnHold = () => {
    if (!holdReason.trim()) {
      toast.error("Please provide a reason for placing this order on hold.");
      return;
    }
    setEditForm(prev => ({ ...prev, status: "ON_HOLD" }));
    setIsOnHoldDialogOpen(false);
    toast.success("Order status set to ON HOLD. Save order to finalize.");
  };

  const handleCancelOnHold = () => {
    setIsOnHoldDialogOpen(false);
    if (editForm.status !== "ON_HOLD") {
      setEditForm(prev => ({ ...prev, status: prevStatusBeforeHold }));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderGroup || !editForm.items) return;

    const validItems = editForm.items.filter((i: any) => i.job_title && i.job_title.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Please add at least one valid service item.");
      return;
    }

    const activeReviewerIds = editForm.reviewer_ids || (editForm.reviewer_id ? [editForm.reviewer_id] : []);
    const overlap = activeReviewerIds.filter((id: number) => (editForm.consultant_ids || []).includes(id));
    if (overlap.length > 0) {
      toast.error("The same person cannot be selected as both an executing consultant and an order reviewer.");
      return;
    }

    if (editForm.status === "ON_HOLD" && !holdReason.trim()) {
      toast.error("Please provide a reason for placing this order on hold.");
      setIsOnHoldDialogOpen(true);
      return;
    }

    setSaving(true);
    try {
      // 1. Delete removed items from db
      if (deletedItemIds.length > 0) {
        await Promise.all(
          deletedItemIds.map((id) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${id}`, {
              credentials: "include",
              method: "DELETE"
            })
          )
        );
      }

      // 2. Separate into new and existing items
      const existingItems = editForm.items.filter((item: any) => item.id);
      const newItems = editForm.items.filter((item: any) => !item.id);

      // 3. Target company and billing company IDs
      const targetCompId = editForm.company_id ? Number(editForm.company_id) : selectedOrderGroup.company_id;
      const finalBillingId = editForm.same_billing_company
        ? targetCompId
        : (editForm.billing_company_id ? Number(editForm.billing_company_id) : targetCompId);

      // 4. Update existing items in db
      if (existingItems.length > 0) {
        await Promise.all(
          existingItems.map((item: any, idx: number) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${item.id}`, {
              credentials: "include",
              method: "PUT",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                company_id: targetCompId,
                status: editForm.status,
                payment_status: editForm.payment_status,
                ...(editForm.status === "ON_HOLD" && holdReason.trim() ? {
                  hold_reason: holdReason.trim(),
                  hold_channel: holdChannel
                } : {}),
                ...(idx === 0 ? {
                  proforma_paid_amount: editForm.proforma_paid_amount != null ? Number(editForm.proforma_paid_amount) : null
                } : {}),
                billing_company_id: finalBillingId,
                invoice_number: editForm.invoice_number || null,
                consultant_ids: editForm.consultant_ids,
                reviewer_ids: editForm.reviewer_ids || [],
                reviewer_id: editForm.reviewer_ids?.[0] || editForm.reviewer_id || null,
                service_instructions: item.service_instructions ? item.service_instructions.trim() : null,
                notes: editForm.notes ? editForm.notes.trim() : null,
                service_id: (item.service_id && item.service_id !== "CUSTOM" && !isNaN(Number(item.service_id))) ? Number(item.service_id) : null,
                job_id: item.job_id || "CUSTOM",
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

      // 5. Create new items in db
      if (newItems.length > 0) {
        const payload = {
          company_id: targetCompId,
          order_number: selectedOrderGroup.order_number,
          billing_company_id: finalBillingId,
          status: editForm.status,
          allow_append: true,
          items: newItems.map((item: any) => ({
            service_id: (item.service_id && item.service_id !== "CUSTOM" && !isNaN(Number(item.service_id))) ? Number(item.service_id) : null,
            job_id: item.job_id || "CUSTOM",
            job_title: item.job_title,
            branch_name: item.branch_name ? item.branch_name.trim() : null,
            description: item.description,
            service_instructions: item.service_instructions ? item.service_instructions.trim() : null,
            pricing_tier: item.pricing_tier,
            unit_price: item.unit_price || 0,
            custom_price_text: item.custom_price_text || null,
            notary_id: item.notary_id ? Number(item.notary_id) : null
          })),
          consultant_ids: editForm.consultant_ids,
          reviewer_ids: editForm.reviewer_ids || [],
          reviewer_id: editForm.reviewer_ids?.[0] || editForm.reviewer_id || null,
          notes: editForm.notes || null,
          internal_notes: editForm.notes || null
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
          credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to create new order items");
        }
      }

      toast.success("Order changes saved successfully!");
      if (editForm.status === "PIPELINE" || selectedOrderGroup?.status === "PIPELINE") {
        router.push("/business/clients/orders/pipeline");
      } else {
        router.push("/business/clients/orders");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error updating order details");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
  };

  const editItemsTotal = (editForm.items || []).reduce((acc, curr) => acc + (curr.unit_price || 0), 0);
  const isPipelineOrder = selectedOrderGroup?.status === "PIPELINE" || editForm.status === "PIPELINE";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading order details...</p>
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
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-1.5 truncate">
                Edit Service Order: <span className="font-mono text-primary truncate">{orderNumber}</span>
              </h1>
              <Badge variant="outline" className={`text-[10px] font-mono uppercase font-bold py-0.5 px-2 shrink-0 ${isPipelineOrder ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-primary/10 text-primary border-primary/30'}`}>
                {editForm.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
              Modify allocated corporate entity, billed service line items, assigned consultants, reviewer, and billing parameters.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            disabled={saving}
            className="h-8 text-xs font-semibold border-border/70 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            disabled={saving}
            className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs rounded-lg px-3.5"
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleEditSubmit} className="space-y-3.5">
        
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
                    Designate the company entity receiving services and registered order reference ID.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">Client Partner:</span>
                  <select
                    value={filterClientId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setFilterClientId(cid);
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
                  
                  {/* Col 1: Order Reference ID (Fixed) */}
                  <div className="col-span-1 sm:col-span-2 xl:col-span-4 2xl:col-span-3 space-y-1.5 p-2.5 rounded-lg border border-border/60 bg-muted/20">
                    <div className="flex items-center justify-between gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1 min-w-0 truncate">
                        <Tag className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="truncate">Order Ref ID</span>
                      </label>
                      <Badge variant="outline" className="text-[9px] font-mono py-0 px-1.5 bg-background border-border/70 text-muted-foreground shrink-0">
                        <Lock className="h-2.5 w-2.5 mr-0.5" /> Fixed
                      </Badge>
                    </div>
                    <div className="relative">
                      <Input
                        disabled
                        value={orderNumber}
                        className="h-8 font-mono font-black text-xs tracking-wider bg-background/80 uppercase border-border/70 text-foreground cursor-not-allowed"
                      />
                      <div className="absolute right-2 top-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] pt-0.5">
                      <span className="text-muted-foreground truncate">Registered Order Reference</span>
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
                      value={editForm.company_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditForm(prev => ({
                          ...prev,
                          company_id: val,
                          billing_company_id: prev.same_billing_company ? val : prev.billing_company_id
                        }));
                      }}
                      className="flex h-8 w-full rounded-md border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary truncate"
                    >
                      <option value="">Choose Target Company Entity...</option>
                      {(filterClientId
                        ? companies.filter(c => c.client_id === parseInt(filterClientId) || String(c.id) === String(editForm.company_id))
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
                          checked={editForm.same_billing_company}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditForm(prev => ({
                              ...prev,
                              same_billing_company: checked,
                              billing_company_id: checked ? prev.company_id : prev.billing_company_id
                            }));
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
                      {!editForm.same_billing_company && (
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

                    {editForm.same_billing_company ? (
                      <div className="h-8 flex items-center px-2.5 rounded-md border border-border/50 bg-background/60 text-xs text-muted-foreground font-medium truncate">
                        <span className="truncate">
                          {editForm.company_id 
                            ? `Same: ${(companies.find(c => String(c.id) === editForm.company_id)?.company_name) || "Selected Target Company"}`
                            : "Same as Target Corporate Entity"}
                        </span>
                      </div>
                    ) : (
                      <select
                        required
                        value={editForm.billing_company_id}
                        onChange={(e) => setEditForm(prev => ({ ...prev, billing_company_id: e.target.value }))}
                        className="flex h-8 w-full rounded-md border border-primary/50 bg-background px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary truncate"
                      >
                        <option value="">Choose Billing Entity...</option>
                        {(filterClientId
                          ? companies.filter(c => c.client_id === parseInt(filterClientId) || String(c.id) === String(editForm.billing_company_id))
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

            {/* STEP 2: SERVICE LINE ITEMS */}
            <Card className="border-border/60 shadow-2xs rounded-xl bg-card/60 backdrop-blur-md">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Briefcase className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                    2. Billed Service Line Items ({(editForm.items || []).length})
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditForm((prev) => ({
                      ...prev,
                      items: [
                        ...prev.items,
                        {
                          service_id: "",
                          job_id: "",
                          job_title: "",
                          branch_name: "",
                          description: "",
                          service_instructions: "",
                          notes: "",
                          pricing_tier: "BASE",
                          unit_price: 0,
                          custom_price_text: "",
                          notary_id: "",
                          _raw_service: null
                        }
                      ]
                    }));
                  }}
                  className="h-7 px-2.5 border-dashed border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1 font-bold rounded-md text-[11px] shrink-0"
                >
                  <Plus className="h-3 w-3" /> Add Service Item
                </Button>
              </CardHeader>
              
              <CardContent className="p-2.5 sm:p-3 space-y-2.5">
                <div className="space-y-2.5">
                  {(editForm.items || []).length === 0 ? (
                    <div className="text-center py-5 text-xs text-muted-foreground italic border border-dashed rounded-lg">
                      No items in this order. Add at least one item to proceed.
                    </div>
                  ) : (
                    (editForm.items || []).map((item: any, idx: number) => (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-xl border border-border/70 bg-card/80 dark:bg-card/40 hover:border-primary/40 shadow-2xs transition-all space-y-2.5 relative"
                      >
                        
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
                              disabled={(editForm.items || []).length <= 1 && !item.service_id}
                              onClick={() => handleRemoveEditItem(idx)}
                              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0"
                              title="Remove service line item"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Primary Configuration Grid: Service Package, Pricing Tier, Branch Reference */}
                        <div className="grid grid-cols-1 md:grid-cols-12 xl:grid-cols-12 gap-2.5 items-start">
                          
                          {/* Service Package Selector (Full width on md, 7 cols on xl) */}
                          <div className="col-span-1 md:col-span-12 xl:col-span-7 space-y-1">
                            <label className="text-[10.5px] font-bold text-foreground flex items-center gap-1">
                              <span>Service Package Catalog</span>
                              <span className="text-destructive font-black">*</span>
                            </label>
                            <ServiceSearchSelect
                              required
                              services={services}
                              value={item.service_id}
                              customTitle={item.job_title}
                              onChange={(serviceId, customTitle) => handleEditServiceSelect(idx, serviceId, customTitle)}
                            />
                            {item.service_id === "CUSTOM" && (
                              <div className="mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                                <Input
                                  value={item.job_title}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditForm((prev) => {
                                      const copy = [...prev.items];
                                      copy[idx] = { ...copy[idx], job_title: val };
                                      return { ...prev, items: copy };
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

                          {/* Pricing Tier Selector (6 cols on md, 5 cols on xl) */}
                          <div className="col-span-1 md:col-span-6 xl:col-span-5 space-y-1">
                            <label className="text-[10.5px] font-bold text-foreground flex items-center gap-1">
                              <span>Pricing Tier & Rate</span>
                              <span className="text-destructive font-black">*</span>
                            </label>
                            {item.service_id === "CUSTOM" ? (
                              <select
                                required
                                value={item.pricing_tier}
                                onChange={(e) => handleEditTierSelect(idx, e.target.value)}
                                className="flex h-8 w-full rounded-lg border border-amber-500/40 bg-amber-500/5 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:text-amber-200 shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary truncate"
                              >
                                <option value="PARTNER_A3">Custom Pricing (Direct Quote)</option>
                              </select>
                            ) : (
                              <select
                                required
                                value={item.pricing_tier}
                                onChange={(e) => handleEditTierSelect(idx, e.target.value)}
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

                          {/* Line Item Memo (Full width 12 cols, larger input size) */}
                          <div className="col-span-1 md:col-span-12 xl:col-span-12 space-y-1">
                            <label className="text-[10.5px] font-semibold text-muted-foreground flex items-center justify-between">
                              <span>Memo</span>
                              <span className="text-[9px] text-muted-foreground/70 font-mono">Optional</span>
                            </label>
                            <Input
                              value={item.branch_name || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditForm((prev) => {
                                  const copy = [...prev.items];
                                  copy[idx] = { ...copy[idx], branch_name: val };
                                  return { ...prev, items: copy };
                                });
                              }}
                              placeholder="e.g. Reference number, branch location, client memo, or internal reference notes..."
                              className="h-9 text-xs font-medium rounded-lg border-border/70 bg-background placeholder:text-muted-foreground/50 w-full"
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
                                type="text"
                                inputMode="decimal"
                                required
                                value={
                                  item.custom_price_text !== undefined && item.custom_price_text !== ""
                                    ? item.custom_price_text
                                    : (item.unit_price ? formatNumberWithCommas(item.unit_price) : "")
                                }
                                onChange={(e) => {
                                  const rawInput = e.target.value;
                                  const formatted = formatNumberWithCommas(rawInput);
                                  const numVal = parseNumberFromCommas(formatted);
                                  setEditForm((prev) => {
                                    const copy = [...prev.items];
                                    copy[idx] = { 
                                      ...copy[idx], 
                                      unit_price: numVal, 
                                      custom_price_text: formatted 
                                    };
                                    return { ...prev, items: copy };
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
                          <div className="space-y-1">
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
                                setEditForm((prev) => {
                                  const copy = [...prev.items];
                                  copy[idx] = { ...copy[idx], notary_id: val ? parseInt(val) : "" };
                                  return { ...prev, items: copy };
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
                              setEditForm((prev) => {
                                const copy = [...prev.items];
                                copy[idx] = { ...copy[idx], service_instructions: val };
                                return { ...prev, items: copy };
                              });
                            }}
                            rows={2}
                            placeholder="Enter detailed service execution instructions, specific document checklists, government portal credentials/details, or processing requirements for this line item..."
                            className="flex w-full rounded-lg border border-border/70 bg-background p-2 text-xs placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary leading-relaxed font-normal resize-y min-h-[48px]"
                          />
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: Frequently Changed Operational Modules (Controls, Roster, Reviewer, Notes) */}
          <div className="xl:col-span-5 2xl:col-span-4 space-y-3 min-w-0 xl:sticky xl:top-2 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto pr-0.5">
            
            {/* STEP 3: ORDER LIFECYCLE & FINANCIAL CONTROLS */}
            <Card className="border-border/60 shadow-2xs rounded-xl bg-card/60 backdrop-blur-md">
              <CardHeader className="py-2 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                    3. Order Lifecycle & Financial Controls
                  </CardTitle>
                </div>
                {selectedOrderGroup?.is_proforma_finalized && (
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                      <Lock className="h-2.5 w-2.5 mr-1" /> Proforma Finalized
                    </Badge>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="p-3 space-y-2.5">
                {/* Lifecycle Stage */}
                <div className="space-y-1 bg-muted/20 p-2 rounded-lg border border-border/60">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3 text-primary" />
                    <span>Lifecycle Stage</span>
                  </label>
                  <select
                    required
                    value={editForm.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="flex h-8 w-full rounded-md border border-border/70 bg-background px-2.5 py-1 text-xs font-bold shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <option value="PIPELINE">PIPELINE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PROFORMA_GENERATED">PROFORMA GENERATED</option>
                    <option value="WAITING_ON_CLIENT">WAITING ON CLIENT</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="ORDER_ASSIGNED">ORDER ASSIGNED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="REVIEW_DOCS">REVIEW DOCS</option>
                    <option value="DOCUMENTS_REVIEWED">DOCUMENTS REVIEWED</option>
                    <option value="PRE_DOC_SENT_FOR_SIGNATURE">PRE DOC SENT FOR SIGNATURE</option>
                    <option value="FINAL_DOCUMENT_PREPARATION">FINAL DOCUMENT PREPARATION</option>
                    <option value="FINAL_DOC_READY">FINAL DOC READY</option>
                    <option value="INVOICE_GENERATED">INVOICE GENERATED</option>
                    <option value="WAITING_FOR_FINAL_PAYMENT">WAITING FOR FINAL PAYMENT</option>
                    <option value="FINAL_PAYMENT_COMPLETED">FINAL PAYMENT COMPLETED</option>
                    <option value="SOFT_COPY_DELIVERED">SOFT COPY DELIVERED</option>
                    <option value="HARD_COPY_DELIVERED">HARD COPY DELIVERED</option>
                    <option value="ON_HOLD">ON HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>

                  {editForm.status === "ON_HOLD" && (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1 mt-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 text-[10px]">
                          <PauseCircle className="h-3 w-3" /> On-Hold Active
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsOnHoldDialogOpen(true)}
                          className="text-[9.5px] font-bold text-amber-600 dark:text-amber-400 underline"
                        >
                          Edit Reason
                        </button>
                      </div>
                      <p className="text-[10.5px] text-foreground font-medium line-clamp-2">
                        {holdReason || "No hold reason specified"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Status */}
                <div className="space-y-1 bg-muted/20 p-2 rounded-lg border border-border/60">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-emerald-600" />
                    <span>Payment Status</span>
                  </label>
                  <select
                    required
                    value={editForm.payment_status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      let defaultPaidAmt = editForm.proforma_paid_amount;
                      if (newStatus === "PARTIALLY_PAID" && (defaultPaidAmt === undefined || defaultPaidAmt === null || defaultPaidAmt === 0)) {
                        defaultPaidAmt = Math.round(editItemsTotal * (selectedOrderGroup?.proforma_stage_percent || 50) / 100);
                      } else if (newStatus === "PAID") {
                        defaultPaidAmt = editItemsTotal;
                      }
                      setEditForm(prev => ({ ...prev, payment_status: newStatus, proforma_paid_amount: defaultPaidAmt }));
                    }}
                    className="flex h-8 w-full rounded-md border border-border/70 bg-background px-2.5 py-1 text-xs font-bold shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  >
                    <option value="UNPAID">UNPAID</option>
                    <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                    <option value="PAID">PAID</option>
                  </select>
                  <p className="text-[9px] text-muted-foreground">
                    Tracks billing payment receipt from client
                  </p>
                </div>

                {/* Amount Received / Proforma Paid (if partially or fully paid) */}
                <div className="space-y-1 bg-muted/20 p-2 rounded-lg border border-border/60">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                      {editForm.payment_status === "PARTIALLY_PAID" ? "Amount Received (IDR)" : "Total Amount (IDR)"}
                    </label>
                    {editItemsTotal > 0 && editForm.proforma_paid_amount ? (
                      <span className="text-[9.5px] font-mono text-muted-foreground font-semibold">
                        {((Number(editForm.proforma_paid_amount) / editItemsTotal) * 100).toFixed(0)}%
                      </span>
                    ) : null}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    disabled={editForm.payment_status === "UNPAID"}
                    placeholder={editForm.payment_status === "UNPAID" ? "0 (Unpaid)" : "e.g. 2000000"}
                    value={editForm.proforma_paid_amount ?? ""}
                    onChange={(e) => {
                      const val = e.target.value === "" ? null : Number(e.target.value);
                      setEditForm(prev => ({ ...prev, proforma_paid_amount: val }));
                    }}
                    className="h-8 text-xs font-mono font-bold bg-background disabled:opacity-50"
                  />
                  {editItemsTotal > 0 && editForm.payment_status === "PARTIALLY_PAID" && (
                    <div className="text-[9px] text-muted-foreground flex justify-between pt-0.5">
                      <span>Remaining:</span>
                      <span className="font-bold text-foreground font-mono">
                        {formatCurrency(Math.max(0, editItemsTotal - (Number(editForm.proforma_paid_amount) || 0)))}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* STEP 4: CONSULTANT ROSTER */}
            {!isPipelineOrder && (
              <Card className="border-border/60 shadow-2xs rounded-xl bg-card/60 backdrop-blur-md">
                <CardHeader className="py-2.5 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                      4. Consultant Roster ({editForm.consultant_ids.length})
                    </CardTitle>
                  </div>
                  {editForm.consultant_ids.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditForm(prev => ({ ...prev, consultant_ids: [] }))}
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
                        const isSelected = (editForm.consultant_ids || []).includes(emp.id);
                        const isReviewer = (editForm.reviewer_ids || (editForm.reviewer_id ? [editForm.reviewer_id] : [])).includes(emp.id);
                        return (
                          <label
                            key={emp.id}
                            title={isReviewer ? `${emp.first_name} ${emp.last_name} is currently selected as a Designated Order Reviewer.` : undefined}
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
                              onChange={() => toggleEditConsultantSelect(emp.id)}
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

            {/* STEP 5: DESIGNATED REVIEWER */}
            {!isPipelineOrder && (
              <Card className="border-border/60 shadow-2xs rounded-xl bg-card/60 backdrop-blur-md">
                <CardHeader className="py-2.5 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                      5. Designated Reviewers ({editForm.reviewer_ids && editForm.reviewer_ids.length > 0 ? `${editForm.reviewer_ids.length} Selected` : "Optional"})
                    </CardTitle>
                  </div>
                  {editForm.reviewer_ids && editForm.reviewer_ids.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditForm(prev => ({ ...prev, reviewer_ids: [], reviewer_id: null }))}
                      className="h-5 px-1.5 text-[9px] text-muted-foreground hover:text-destructive gap-0.5 font-medium shrink-0"
                    >
                      <X className="h-2.5 w-2.5" /> Clear All
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
                        const currentReviewers = editForm.reviewer_ids || (editForm.reviewer_id ? [editForm.reviewer_id] : []);
                        const isSelected = currentReviewers.includes(emp.id);
                        const isConsultant = (editForm.consultant_ids || []).includes(emp.id);
                        return (
                          <label
                            key={emp.id}
                            title={isConsultant ? `${emp.first_name} ${emp.last_name} is already allocated as an executing consultant.` : undefined}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg border select-none text-[10.5px] transition-all ${
                              isConsultant
                                ? "opacity-50 border-dashed border-primary/40 bg-primary/5 cursor-not-allowed"
                                : isSelected 
                                  ? "border-purple-500/80 bg-purple-500/15 text-purple-800 dark:text-purple-300 font-bold shadow-2xs ring-1 ring-purple-500/40 cursor-pointer" 
                                  : "border-border/60 bg-background/50 hover:bg-muted/40 hover:border-border cursor-pointer"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isConsultant}
                              onChange={() => toggleEditReviewerSelect(emp.id)}
                              className="h-3 w-3 rounded border-gray-300 text-purple-600 focus:ring-purple-500 accent-purple-600 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                            />
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
                          </label>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* STEP 6: INTERNAL DELIVERY NOTES */}
            <Card className="border-border/60 shadow-2xs rounded-xl bg-card/60 backdrop-blur-md">
              <CardHeader className="py-2.5 px-3.5 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                    {isPipelineOrder ? "4. Pipeline Lead Notes" : "6. Internal Delivery Notes"}
                  </CardTitle>
                </div>
                <span className="text-[9px] text-muted-foreground font-mono italic shrink-0">For Delivery Manager</span>
              </CardHeader>
              <CardContent className="p-2.5">
                <textarea
                  name="notes"
                  value={editForm.notes || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
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
              {(editForm.items || []).length} {(editForm.items || []).length === 1 ? "Line Item" : "Line Items"}
            </Badge>
            <span className="font-mono font-black text-sm text-foreground truncate">
              {formatCurrency(editItemsTotal)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <Link href={isPipelineOrder ? "/business/clients/orders/pipeline" : "/business/clients/orders"}>
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
              {saving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </div>

      </form>

      {/* Create Company Modal - Fully Consistent with Add New Company Entity Form */}
      <CreateCompanyDialog
        open={isCreateCompanyOpen}
        onOpenChange={setIsCreateCompanyOpen}
        target={createCompanyTarget}
        initialClientId=""
        clients={clients}
        onSuccess={handleCompanyCreated}
      />

      {/* On-Hold Reason Dialog Modal */}
      <Dialog open={isOnHoldDialogOpen} onOpenChange={(open) => {
        if (!open) handleCancelOnHold();
      }}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <PauseCircle className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">Specify On-Hold Reason</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Please provide the reason why this order is being paused or placed on hold.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Reason for Hold *</label>
              <textarea
                required
                rows={3}
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="e.g. Waiting for client to provide certified passport copies..."
                className="flex w-full rounded-xl border border-border/70 bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-relaxed resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Broadcast Visibility</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHoldChannel("CLIENT")}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${holdChannel === "CLIENT" ? "border-primary bg-primary/10 text-primary font-bold" : "border-border/60 hover:bg-muted/40 text-xs"}`}
                >
                  <div className="font-semibold text-xs">Client & Team</div>
                  <div className="text-[10px] text-muted-foreground">Visible to client in order chat</div>
                </button>
                <button
                  type="button"
                  onClick={() => setHoldChannel("INTERNAL")}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${holdChannel === "INTERNAL" ? "border-primary bg-primary/10 text-primary font-bold" : "border-border/60 hover:bg-muted/40 text-xs"}`}
                >
                  <div className="font-semibold text-xs">Internal Only</div>
                  <div className="text-[10px] text-muted-foreground">Visible only to internal staff</div>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelOnHold}
              className="text-xs font-bold h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmOnHold}
              className="text-xs font-bold h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirm Hold Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
