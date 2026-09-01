"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Plus, 
  Loader2, 
  Trash2, 
  ArrowLeft, 
  DollarSign, 
  Check, 
  Tag,
  Building2,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AddClientServicesPage() {
  const router = useRouter();
  const [createItems, setCreateItems] = useState<any[]>([
    {
      job_id: "OA-001",
      job_title: "",
      description: "",
      base_price: "",
      partner_a_discount: "",
      partner_a1_discount: "",
      partner_a2_discount: "",
      partner_a3_price: "",
      needs_notary: false
    }
  ]);
  const [initialCount, setInitialCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchServicesCount = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInitialCount(data.length);
        const nextSeq = data.length + 1;
        const suggestedJobId = `OA-${String(nextSeq).padStart(3, '0')}`;
        setCreateItems([
          {
            job_id: suggestedJobId,
            job_title: "",
            description: "",
            base_price: "",
            partner_a_discount: "",
            partner_a1_discount: "",
            partner_a2_discount: "",
            partner_a3_price: "",
            needs_notary: false
          }
        ]);
      }
    } catch (err) {
      console.error("Error fetching service count:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesCount();
  }, []);

  const handleAddCreateItem = () => {
    const nextSeq = initialCount + createItems.length + 1;
    const suggestedJobId = `OA-${String(nextSeq).padStart(3, '0')}`;
    setCreateItems((prev) => [
      ...prev,
      {
        job_id: suggestedJobId,
        job_title: "",
        description: "",
        base_price: "",
        partner_a_discount: "",
        partner_a1_discount: "",
        partner_a2_discount: "",
        partner_a3_price: "",
        needs_notary: false
      }
    ]);
  };

  const handleRemoveCreateItem = (index: number) => {
    if (createItems.length <= 1) return;
    setCreateItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateItemChange = (index: number, field: string, value: any) => {
    setCreateItems((prev) => {
      const copy = [...prev];
      const currentItem = copy[index];

      if (field === "base_price") {
        if (value.trim() !== "") {
          copy[index] = {
            ...currentItem,
            base_price: value,
            partner_a_discount: currentItem.partner_a_discount || "20",
            partner_a1_discount: currentItem.partner_a1_discount || "40",
            partner_a2_discount: currentItem.partner_a2_discount || "50"
          };
        } else {
          copy[index] = {
            ...currentItem,
            base_price: "",
            partner_a_discount: "",
            partner_a1_discount: "",
            partner_a2_discount: ""
          };
        }
      } else {
        copy[index] = { ...currentItem, [field]: value };
      }

      return copy;
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || createItems.length === 0) return;
    setSaving(true);
    try {
      const payload = createItems.map((item) => ({
        job_id: item.job_id,
        job_title: item.job_title,
        description: item.description,
        base_price: item.base_price ? parseFloat(item.base_price) : 0,
        partner_a_discount: item.partner_a_discount !== "" ? parseFloat(item.partner_a_discount) : 20,
        partner_a1_discount: item.partner_a1_discount !== "" ? parseFloat(item.partner_a1_discount) : 40,
        partner_a2_discount: item.partner_a2_discount !== "" ? parseFloat(item.partner_a2_discount) : 50,
        partner_a3_price: item.partner_a3_price || null,
        needs_notary: item.needs_notary || false
      }));

      const isBulk = payload.length > 1;
      const endpoint = isBulk 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog/bulk`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/clients/services/catalog`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(isBulk ? payload : payload[0])
      });

      if (res.ok) {
        toast.success(isBulk ? `Successfully added ${payload.length} service packages!` : "Service catalog entry created successfully!");
        router.push("/business/clients/services");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to create service entry");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating service entry");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading package draft workspace...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Add Service Packages</h1>
          <p className="text-muted-foreground mt-1">Draft and register standardized offerings to the service catalog database.</p>
        </div>
      </div>

      <form onSubmit={handleCreateSubmit} className="space-y-6">
        <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/30">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Service Package Workspace</span>
              </CardTitle>
            </div>
            {createItems.length > 1 && (
              <Badge variant="outline" className="font-mono text-xs font-semibold px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm">
                Batch Mode: {createItems.length} Packages Drafted
              </Badge>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-6">
              {createItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-6 rounded-2xl border border-border/30 bg-gradient-to-b from-card/30 to-background/40 shadow-xs space-y-5 relative group"
                >
                  
                  {/* Card Header & Controls */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/30">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white text-xs font-black shadow shadow-primary/20">
                        #{idx + 1}
                      </span>
                      <h3 className="font-extrabold text-base text-foreground tracking-tight">
                        {item.job_title ? item.job_title : `Service Package #${idx + 1}`}
                      </h3>
                      <Badge variant="outline" className="font-mono text-xs text-primary bg-primary/10 border-primary/20 border py-0.5 px-2.5 rounded-full font-bold">
                        Job ID: {item.job_id}
                      </Badge>
                    </div>

                    {createItems.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveCreateItem(idx)}
                        className="text-destructive hover:bg-destructive/10 text-xs gap-1.5 font-bold transition-colors border border-transparent hover:border-destructive/20 rounded-lg px-2.5 py-1"
                      >
                        <Trash2 className="h-4 w-4" /> Remove Item
                      </Button>
                    )}
                  </div>

                  {/* Identification Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-7 space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Job Title *</label>
                      <Input
                        required
                        value={item.job_title}
                        onChange={(e) => handleCreateItemChange(idx, "job_title", e.target.value)}
                        placeholder="e.g. Setup PMA Company"
                        className="h-10 text-sm font-medium bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Job ID</label>
                      <div className="h-10 flex items-center font-mono font-extrabold text-sm text-primary select-none pointer-events-none">
                        {item.job_id}
                      </div>
                    </div>

                    <div className="sm:col-span-3 space-y-2 flex flex-col justify-end pb-2">
                      <div className="flex items-center gap-2 h-10">
                        <input
                          type="checkbox"
                          id={`needs-notary-${idx}`}
                          checked={item.needs_notary || false}
                          onChange={(e) => handleCreateItemChange(idx, "needs_notary", e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-emerald-600 cursor-pointer"
                        />
                        <label 
                          htmlFor={`needs-notary-${idx}`}
                          className="text-xs font-bold text-muted-foreground/90 cursor-pointer select-none"
                        >
                          Notary Required
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Description Textarea */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center justify-between">
                      <span>Detailed Scope & Description</span>
                      <span className="text-[10px] font-normal text-muted-foreground lowercase normal-case">Comprehensive work instructions & deliverable notes</span>
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleCreateItemChange(idx, "description", e.target.value)}
                      rows={4}
                      className="flex w-full rounded-xl border border-border/60 bg-background p-3.5 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 leading-relaxed font-medium transition-all"
                      placeholder="Provide comprehensive details regarding what is included in this service package (e.g. Setting up a foreign direct investment PMA company, preparing Articles of Association, obtaining NIB and tax registration...)"
                    />
                  </div>

                  {/* Pricing Matrix */}
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
                          value={item.base_price}
                          onChange={(e) => handleCreateItemChange(idx, "base_price", e.target.value)}
                          placeholder="e.g. 1000000"
                          className="h-10 font-mono font-bold text-sm bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {item.partner_a_discount ? `Partner A (-${item.partner_a_discount}%)` : "Partner A (-20%)"}
                        </label>
                        <Input
                          type="number"
                          value={item.partner_a_discount}
                          onChange={(e) => handleCreateItemChange(idx, "partner_a_discount", e.target.value)}
                          placeholder="e.g. 20"
                          className="h-10 font-mono text-sm bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                        />
                        {item.base_price && item.partner_a_discount && (
                          <div className="bg-blue-500/5 border border-blue-500/10 text-blue-600 dark:text-blue-400 py-1.5 px-2.5 rounded-xl font-bold font-mono text-[10.5px] text-center mt-1 truncate">
                            {formatCurrency(parseFloat(item.base_price) * (1 - (parseFloat(item.partner_a_discount) || 0) / 100))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {item.partner_a1_discount ? `Partner A1 (-${item.partner_a1_discount}%)` : "Partner A1 (-40%)"}
                        </label>
                        <Input
                          type="number"
                          value={item.partner_a1_discount}
                          onChange={(e) => handleCreateItemChange(idx, "partner_a1_discount", e.target.value)}
                          placeholder="e.g. 40"
                          className="h-10 font-mono text-sm bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                        />
                        {item.base_price && item.partner_a1_discount && (
                          <div className="bg-purple-500/5 border border-purple-500/10 text-purple-600 dark:text-purple-400 py-1.5 px-2.5 rounded-xl font-bold font-mono text-[10.5px] text-center mt-1 truncate">
                            {formatCurrency(parseFloat(item.base_price) * (1 - (parseFloat(item.partner_a1_discount) || 0) / 100))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {item.partner_a2_discount ? `Partner A2 (-${item.partner_a2_discount}%)` : "Partner A2 (-50%)"}
                        </label>
                        <Input
                          type="number"
                          value={item.partner_a2_discount}
                          onChange={(e) => handleCreateItemChange(idx, "partner_a2_discount", e.target.value)}
                          placeholder="e.g. 50"
                          className="h-10 font-mono text-sm bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                        />
                        {item.base_price && item.partner_a2_discount && (
                          <div className="bg-emerald-500/5 border border-emerald-500/10 text-emerald-700 dark:text-emerald-400 py-1.5 px-2.5 rounded-xl font-bold font-mono text-[10.5px] text-center mt-1 truncate">
                            {formatCurrency(parseFloat(item.base_price) * (1 - (parseFloat(item.partner_a2_discount) || 0) / 100))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Partner A3 (Special Price)</label>
                        <Input
                          type="number"
                          value={item.partner_a3_price}
                          onChange={(e) => handleCreateItemChange(idx, "partner_a3_price", e.target.value)}
                          placeholder="e.g. 1500000"
                          className="h-10 font-mono font-semibold text-sm bg-background border-amber-500/30 focus-visible:ring-amber-500/40 rounded-xl transition-all"
                        />
                        {item.partner_a3_price && !isNaN(parseFloat(item.partner_a3_price)) && (
                          <div className="bg-amber-500/5 border border-amber-500/15 text-amber-600 dark:text-amber-400 py-1.5 px-2.5 rounded-xl font-bold font-mono text-[10.5px] text-center mt-1 truncate">
                            {formatCurrency(parseFloat(item.partner_a3_price))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/30 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCreateItem}
                className="w-full sm:w-auto border-dashed border-primary/50 text-primary hover:bg-primary/5 hover:border-primary transition-all gap-2 font-bold px-4 h-10 rounded-xl"
              >
                <Plus className="h-4 w-4" /> Add Another Service Package
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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
                  Save Service Packages
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
