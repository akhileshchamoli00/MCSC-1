"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Plus, 
  Loader2, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  DollarSign, 
  Percent, 
  Check, 
  Building2,
  Tag,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ClientServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    job_id: "",
    job_title: "",
    description: "",
    base_price: "",
    partner_a_discount: "",
    partner_a1_discount: "",
    partner_a2_discount: "",
    partner_a3_price: ""
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchServices = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      } else {
        toast.error("Failed to load service catalog");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching service catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "base_price") {
      if (value.trim() !== "") {
        setFormData((prev) => ({
          ...prev,
          base_price: value,
          partner_a_discount: prev.partner_a_discount || "20",
          partner_a1_discount: prev.partner_a1_discount || "40",
          partner_a2_discount: prev.partner_a2_discount || "50"
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          base_price: "",
          partner_a_discount: "",
          partner_a1_discount: "",
          partner_a2_discount: ""
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };



  const handleOpenEdit = (service: any) => {
    setSelectedService(service);
    setFormData({
      job_id: service.job_id || "",
      job_title: service.job_title || "",
      description: service.description || "",
      base_price: String(service.base_price || 0),
      partner_a_discount: String(service.partner_a_discount ?? 20),
      partner_a1_discount: String(service.partner_a1_discount ?? 40),
      partner_a2_discount: String(service.partner_a2_discount ?? 50),
      partner_a3_price: service.partner_a3_price || ""
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedService) return;
    setSaving(true);
    try {
      const payload = {
        job_id: formData.job_id,
        job_title: formData.job_title,
        description: formData.description,
        base_price: parseFloat(formData.base_price) || 0,
        partner_a_discount: parseFloat(formData.partner_a_discount) || 20,
        partner_a1_discount: parseFloat(formData.partner_a1_discount) || 40,
        partner_a2_discount: parseFloat(formData.partner_a2_discount) || 50,
        partner_a3_price: formData.partner_a3_price || null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog/${selectedService.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Service entry updated successfully!");
        setIsEditOpen(false);
        fetchServices();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update service entry");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating service entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!token || !selectedService) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog/${selectedService.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Service entry deleted");
        setIsDeleteOpen(false);
        fetchServices();
      } else {
        toast.error("Failed to delete service entry");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting service entry");
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = services.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.job_id || "").toLowerCase().includes(term) ||
      (s.job_title || "").toLowerCase().includes(term) ||
      (s.description || "").toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredServices.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading service catalog & price list...</p>
      </div>
    );
  }

  const totalServicesCount = services.length;
  const avgBasePrice = totalServicesCount > 0 
    ? services.reduce((acc, curr) => acc + (curr.base_price || 0), 0) / totalServicesCount 
    : 0;
  const paidServicesCount = services.filter(s => (s.base_price || 0) > 0).length;
  const maxBasePrice = totalServicesCount > 0 
    ? Math.max(...services.map(s => s.base_price || 0)) 
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-none pb-12">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/business/clients" className="mt-1">
            <Button variant="ghost" size="icon" title="Back to Clients">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm shrink-0 flex items-center justify-center">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Catalog & Base Price</h1>
            <p className="text-muted-foreground text-sm">
              Manage client service offerings, job IDs, base prices, and partner tier discount matrices.
            </p>
          </div>
        </div>

        <Link href="/business/clients/services/new">
          <Button className="gap-2 font-semibold shadow">
            <Plus className="h-4 w-4" /> Add New Service
          </Button>
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Total Services */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              <Tag className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Total Services</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{totalServicesCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Avg Price */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Average Base Price</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{formatCurrency(avgBasePrice)}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Paid services */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Paid Offerings</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{paidServicesCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Max Service Price */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Max Service Price</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{formatCurrency(maxBasePrice)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Job ID, Title or Description..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Services Table Card */}
      <Card>
        <CardContent className="p-0">
          {filteredServices.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 border-t">
              <Tag className="h-10 w-10 text-muted-foreground/35" />
              <span className="text-sm font-semibold">No Services Found</span>
              <p className="text-xs max-w-sm">Click "Add New Service" above to add your first job offering to the service catalog database.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border-t">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-4 w-12 text-center">No.</th>
                    <th className="p-4">Job ID</th>
                    <th className="p-4">Job Title</th>
                    <th className="p-4">Description</th>
                    <th className="p-4 text-right">Base Price</th>
                    <th className="p-4 text-right">Partner A (20% Off)</th>
                    <th className="p-4 text-right">Partner A1 (40% Off)</th>
                    <th className="p-4 text-right">Partner A2 (50% Off)</th>
                    <th className="p-4 text-right">Partner A3 (Free Text)</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedServices.map((service, index) => (
                    <tr key={service.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-center font-mono font-medium text-muted-foreground">
                        #{startIndex + index + 1}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-mono font-bold text-xs bg-primary/5 border-primary/20 text-primary">
                          {service.job_id}
                        </Badge>
                      </td>
                      <td className="p-4 font-bold text-foreground text-sm">
                        {service.job_title}
                      </td>
                      <td className="p-4 text-muted-foreground whitespace-normal break-words max-w-xs leading-relaxed">
                        {service.description || "-"}
                      </td>
                      <td className="p-4 text-right font-mono font-semibold text-foreground">
                        {formatCurrency(service.base_price)}
                      </td>
                      <td className="p-4 text-right font-mono">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(service.partner_a_price)}
                        </div>
                        <span className="text-[10px] text-muted-foreground">(-{service.partner_a_discount}%)</span>
                      </td>
                      <td className="p-4 text-right font-mono">
                        <div className="font-semibold text-purple-600 dark:text-purple-400">
                          {formatCurrency(service.partner_a1_price)}
                        </div>
                        <span className="text-[10px] text-muted-foreground">(-{service.partner_a1_discount}%)</span>
                      </td>
                      <td className="p-4 text-right font-mono">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(service.partner_a2_price)}
                        </div>
                        <span className="text-[10px] text-muted-foreground">(-{service.partner_a2_discount}%)</span>
                      </td>
                      <td className="p-4 text-right font-mono">
                        <div className="font-semibold text-amber-600 dark:text-amber-400">
                          {service.partner_a3_price && !isNaN(parseFloat(service.partner_a3_price))
                            ? formatCurrency(parseFloat(service.partner_a3_price))
                            : service.partner_a3_price || "-"}
                        </div>
                        <span className="text-[10px] text-muted-foreground">(Special Price)</span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit Service"
                          onClick={() => handleOpenEdit(service)}
                        >
                          <Edit2 className="h-4 w-4 text-slate-500 hover:text-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Delete Service"
                          onClick={() => {
                            setSelectedService(service);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
                <div className="text-xs text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                  <span className="font-medium text-foreground">{Math.min(filteredServices.length, endIndex)}</span> of{" "}
                  <span className="font-medium text-foreground">{filteredServices.length}</span> entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
          )}
        </CardContent>
      </Card>

      {/* EDIT SERVICE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader className="pb-4 border-b border-border/50">
            <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Edit2 className="h-6 w-6 text-primary" /> Edit Service Package
            </DialogTitle>
            <DialogDescription className="text-sm mt-1 text-muted-foreground/90 font-medium">
              Update service details, comprehensive description scope, or partner discount tiers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6 pt-2">
            
            {/* Section 1: Service Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> Service Identification & Scope
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Job Title *</label>
                  <Input
                    required
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleInputChange}
                    className="h-10 text-sm font-medium bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Job ID</label>
                  <div className="h-10 flex items-center font-mono font-extrabold text-sm text-primary select-none pointer-events-none">
                    {formData.job_id}
                  </div>
                </div>
              </div>

              {/* Large Expanded Description Textarea */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center justify-between">
                  <span>Detailed Scope & Description</span>
                  <span className="text-[10px] font-normal text-muted-foreground lowercase normal-case">Detailed work instructions & deliverable notes</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="flex w-full rounded-xl border border-border/60 bg-background p-3.5 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 leading-relaxed font-medium transition-all"
                  placeholder="Provide comprehensive details regarding what is included in this service package..."
                />
              </div>
            </div>

            {/* Section 2: Pricing & Discount Matrix */}
            <div className="space-y-3 pt-3 border-t border-border/30">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary shrink-0" /> Pricing & Partner Tier Matrix
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 p-5 rounded-2xl border border-border/30 bg-muted/10 dark:bg-slate-900/25">
                <div className="space-y-2 sm:border-r sm:border-border/30 sm:pr-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-foreground">Base Price (IDR) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    className="h-10 font-mono font-bold text-sm bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Partner A (-{formData.partner_a_discount}%)
                  </label>
                  <Input
                    type="number"
                    name="partner_a_discount"
                    value={formData.partner_a_discount}
                    onChange={handleInputChange}
                    className="h-10 font-mono text-sm bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                  />
                  {formData.base_price && formData.partner_a_discount && (
                    <div className="bg-blue-500/5 border border-blue-500/10 text-blue-600 dark:text-blue-400 py-1.5 px-2.5 rounded-xl font-bold font-mono text-[10.5px] text-center mt-1 truncate">
                      {formatCurrency(parseFloat(formData.base_price) * (1 - (parseFloat(formData.partner_a_discount) || 0) / 100))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Partner A1 (-{formData.partner_a1_discount}%)
                  </label>
                  <Input
                    type="number"
                    name="partner_a1_discount"
                    value={formData.partner_a1_discount}
                    onChange={handleInputChange}
                    className="h-10 font-mono text-sm bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                  />
                  {formData.base_price && formData.partner_a1_discount && (
                    <div className="bg-purple-500/5 border border-purple-500/10 text-purple-600 dark:text-purple-400 py-1.5 px-2.5 rounded-xl font-bold font-mono text-[10.5px] text-center mt-1 truncate">
                      {formatCurrency(parseFloat(formData.base_price) * (1 - (parseFloat(formData.partner_a1_discount) || 0) / 100))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Partner A2 (-{formData.partner_a2_discount}%)
                  </label>
                  <Input
                    type="number"
                    name="partner_a2_discount"
                    value={formData.partner_a2_discount}
                    onChange={handleInputChange}
                    className="h-10 font-mono text-sm bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                  />
                  {formData.base_price && formData.partner_a2_discount && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 text-emerald-700 dark:text-emerald-400 py-1.5 px-2.5 rounded-xl font-bold font-mono text-[10.5px] text-center mt-1 truncate">
                      {formatCurrency(parseFloat(formData.base_price) * (1 - (parseFloat(formData.partner_a2_discount) || 0) / 100))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Partner A3 (Special Price)</label>
                  <Input
                    type="number"
                    name="partner_a3_price"
                    value={formData.partner_a3_price}
                    onChange={handleInputChange}
                    placeholder="e.g. 1500000"
                    className="h-10 font-mono font-semibold text-sm bg-background border-amber-500/30 focus-visible:ring-amber-500/40 rounded-xl transition-all"
                  />
                  {formData.partner_a3_price && !isNaN(parseFloat(formData.partner_a3_price)) && (
                    <div className="bg-amber-500/5 border border-amber-500/15 text-amber-600 dark:text-amber-400 py-1.5 px-2.5 rounded-xl font-bold font-mono text-[10.5px] text-center mt-1 truncate">
                      {formatCurrency(parseFloat(formData.partner_a3_price))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-5 border-t border-border/30">
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-xl h-10 px-4 font-bold border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground transition-colors bg-transparent" 
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving} 
                className="px-6 font-bold shadow-md rounded-xl h-10 bg-zinc-900 hover:bg-zinc-100 text-zinc-50 hover:text-zinc-900 border border-zinc-900 dark:bg-zinc-100 dark:hover:bg-zinc-900 dark:text-zinc-950 dark:hover:text-zinc-100 dark:border-zinc-100 transition-all duration-200"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Service Package
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Delete Service Entry</DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Are you sure you want to delete <span className="font-bold text-foreground">{selectedService?.job_id} - {selectedService?.job_title}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl h-10 px-4 font-bold border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground transition-colors bg-transparent" 
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="rounded-xl h-10 px-4 font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors" 
              onClick={handleDeleteSubmit} 
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
