"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { 
  FileText, 
  Loader2, 
  ArrowLeft, 
  DollarSign, 
  Check, 
  Briefcase,
  Building2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function EditClientServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.serviceId;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    job_title: "",
    job_id: "",
    description: "",
    base_price: "",
    partner_a_discount: "",
    partner_a1_discount: "",
    partner_a2_discount: "",
    partner_a3_price: "",
    needs_notary: false
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  useEffect(() => {
    if (!token || !serviceId) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog/${serviceId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load service");
        return res.json();
      })
      .then((data) => {
        setFormData({
          job_title: data.job_title || "",
          job_id: data.job_id || "",
          description: data.description || "",
          base_price: data.base_price !== undefined ? String(data.base_price) : "",
          partner_a_discount: data.partner_a_discount !== undefined ? String(data.partner_a_discount) : "20",
          partner_a1_discount: data.partner_a1_discount !== undefined ? String(data.partner_a1_discount) : "40",
          partner_a2_discount: data.partner_a2_discount !== undefined ? String(data.partner_a2_discount) : "50",
          partner_a3_price: data.partner_a3_price !== null && data.partner_a3_price !== undefined ? String(data.partner_a3_price) : "",
          needs_notary: data.needs_notary || false
        });
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error loading service details");
      })
      .finally(() => setLoading(false));
  }, [token, serviceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !serviceId) return;
    setSaving(true);
    try {
      const payload = {
        job_id: formData.job_id,
        job_title: formData.job_title,
        description: formData.description,
        base_price: formData.base_price ? parseFloat(formData.base_price) : 0,
        partner_a_discount: formData.partner_a_discount !== "" ? parseFloat(formData.partner_a_discount) : 20,
        partner_a1_discount: formData.partner_a1_discount !== "" ? parseFloat(formData.partner_a1_discount) : 40,
        partner_a2_discount: formData.partner_a2_discount !== "" ? parseFloat(formData.partner_a2_discount) : 50,
        partner_a3_price: formData.partner_a3_price ? parseFloat(formData.partner_a3_price) : null,
        needs_notary: formData.needs_notary
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog/${serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Service package updated successfully!");
        router.push("/business/clients/services");
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

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading service specifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-10">
      
      {/* Title Header */}
      <div className="flex items-start gap-4">
        <Link href="/business/clients/services" className="mt-1">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm shrink-0 flex items-center justify-center">
          <Briefcase className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Service Package</h1>
          <p className="text-muted-foreground mt-1">Modify standardized client offering specifications and tier rates.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-4 border-b border-border/30">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span>Service Package Specifications</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Scope Details */}
              <div className="lg:col-span-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Service Identification & Scope
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-7 space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Job Title *</label>
                      <Input
                        required
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleInputChange}
                        className="h-10 text-sm font-medium bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Job ID</label>
                      <div className="h-10 flex items-center font-mono font-extrabold text-sm text-primary select-none pointer-events-none">
                        {formData.job_id}
                      </div>
                    </div>

                    <div className="sm:col-span-3 space-y-2 flex flex-col justify-end pb-2">
                      <div className="flex items-center gap-2 h-10">
                        <input
                          type="checkbox"
                          id="edit-needs-notary"
                          name="needs_notary"
                          checked={formData.needs_notary}
                          onChange={(e) => setFormData((prev) => ({ ...prev, needs_notary: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-emerald-600 cursor-pointer"
                        />
                        <label 
                          htmlFor="edit-needs-notary"
                          className="text-xs font-bold text-muted-foreground/90 cursor-pointer select-none"
                        >
                          Notary Required
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Description Textarea */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center justify-between">
                      <span>Detailed Scope & Description</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={12}
                      className="flex w-full rounded-xl border border-border/60 bg-background p-3.5 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 leading-relaxed font-medium transition-all"
                      placeholder="Provide comprehensive details regarding what is included..."
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Pricing & Discount Matrix */}
              <div className="lg:col-span-6 space-y-6 lg:border-l lg:border-border/30 lg:pl-6">
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-primary shrink-0" /> Pricing & Partner Tier Matrix
                  </label>

                  <div className="space-y-4 p-5 rounded-2xl border border-border/30 bg-muted/10 dark:bg-slate-900/25">
                    <div className="space-y-2">
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
                        Partner A Discount (%)
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
                          Partner Price: {formatCurrency(parseFloat(formData.base_price) * (1 - (parseFloat(formData.partner_a_discount) || 0) / 100))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Partner A1 Discount (%)
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
                          Partner Price: {formatCurrency(parseFloat(formData.base_price) * (1 - (parseFloat(formData.partner_a1_discount) || 0) / 100))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Partner A2 Discount (%)
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
                          Partner Price: {formatCurrency(parseFloat(formData.base_price) * (1 - (parseFloat(formData.partner_a2_discount) || 0) / 100))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Partner A3 Special Price (IDR)</label>
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
              </div>

            </div>

            {/* Actions Bar */}
            <div className="flex justify-between pt-6 border-t border-border/30 mt-6">
              <Link href="/business/clients/services">
                <Button type="button" variant="outline" className="rounded-xl h-10 px-4 font-bold border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground transition-colors bg-transparent">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={saving} 
                className="px-6 font-bold shadow-md gap-2 rounded-xl h-10 bg-zinc-900 hover:bg-zinc-100 text-zinc-50 hover:text-zinc-900 border border-zinc-900 dark:bg-zinc-100 dark:hover:bg-zinc-900 dark:text-zinc-950 dark:hover:text-zinc-100 dark:border-zinc-100 transition-all duration-200"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Service Package
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
