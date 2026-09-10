"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { 
  Megaphone, 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Building, 
  Globe, 
  Users, 
  Clock, 
  Pin, 
  AlertTriangle, 
  FileText, 
  Upload, 
  Check, 
  X, 
  Radio, 
  Send, 
  Save, 
  Paperclip, 
  Loader2, 
  Calendar, 
  Trash2, 
  Eye,
  FileCheck,
  ShieldAlert,
  Info,
  Layers,
  FileUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Predefined Quick-Insert Templates
const TEMPLATES = [
  {
    name: "Tax Filing Deadline",
    icon: Building,
    category: "REGULATION",
    priority: "HIGH",
    title: "Notice: Annual Corporate Income Tax (SPT) Filing Deadline",
    content: "Dear Valued Clients,\n\nPlease be advised that the deadline for corporate annual tax returns (SPT Tahunan Badan) for the current fiscal year is approaching on April 30.\n\nOur consulting team is actively preparing reconciliation statements and submission documents. Kindly ensure that all final audited financial records and trial balances are provided to your designated account manager before April 15 to ensure timely processing.\n\nThank you for your continuous cooperation."
  },
  {
    name: "Holiday Schedule",
    icon: Calendar,
    category: "OPERATIONAL",
    priority: "NORMAL",
    title: "Operational Schedule: National Holiday Office Closure",
    content: "Dear Partners and Clients,\n\nPlease be informed that the offices of PT Multi Citra Solusindo will be closed in observance of the upcoming National Holiday from [Start Date] to [End Date].\n\nNormal operations and consulting support desks will resume on [Resume Date]. For urgent corporate compliance or notarial inquiries during this period, please contact our emergency dispatch hotline or leave an in-app message in your client portal.\n\nWarm regards,\nMCS Management"
  },
  {
    name: "System Maintenance",
    icon: Clock,
    category: "GENERAL",
    priority: "NORMAL",
    title: "Scheduled Maintenance: Client Portal Upgrade Window",
    content: "Notice to all Client Portal Users:\n\nWe will be conducting scheduled system maintenance and security enhancements on Sunday between 00:00 AM and 04:00 AM WIB. During this short maintenance window, document downloads and live order tracking may experience intermittent connectivity.\n\nNo client action is required, and all order records remain secure. We appreciate your understanding."
  },
  {
    name: "Regulatory Advisory",
    icon: Sparkles,
    category: "TAX_UPDATE",
    priority: "URGENT",
    title: "Urgent Advisory: Ministry of Law & Human Rights New Compliance Guideline",
    content: "Important Compliance Circular:\n\nPlease review the attached official regulatory circular regarding the updated Beneficial Ownership (BO) reporting mandate issued by the Ministry of Law and Human Rights.\n\nAll registered corporate entities are required to verify their current shareholder structure and beneficial ownership registry before the stipulated statutory date to avoid administrative compliance penalties.\n\nPlease refer to the attached PDF circular or contact your MCS advisor for assistance."
  }
];

export default function CreateOrEditAnnouncementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const routeId = params?.id as string | undefined;
  const editId = routeId || (searchParams ? searchParams.get("id") || searchParams.get("edit") : null);
  const isEditing = Boolean(editId);

  const [loadingInitial, setLoadingInitial] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    content: "",
    target_role: "CLIENT", // "CLIENT", "EMPLOYEE", "ALL"
    status: "PUBLISHED", // "DRAFT", "PUBLISHED", "ARCHIVED"
    category: "REGULATION", // "REGULATION", "TAX_UPDATE", "CORPORATE", "OPERATIONAL", "GENERAL"
    priority: "NORMAL", // "NORMAL", "HIGH", "URGENT"
    is_pinned: false,
    attachment_url: "",
    attachment_name: ""
  });

  // Fetch initial announcement if editing
  useEffect(() => {
    if (!editId) return;

    const fetchAnnouncement = async () => {
      const token = localStorage.getItem("hrms_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoadingInitial(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements/${editId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setForm({
            title: data.title || "",
            content: data.content || "",
            target_role: data.target_role || "CLIENT",
            status: data.status || "PUBLISHED",
            category: data.category || "REGULATION",
            priority: data.priority || "NORMAL",
            is_pinned: Boolean(data.is_pinned),
            attachment_url: data.attachment_url || "",
            attachment_name: data.attachment_name || ""
          });
        } else {
          toast.error("Announcement not found or unauthorized");
          router.push("/business/announcements");
        }
      } catch (err) {
        console.error("Failed to fetch announcement details:", err);
        toast.error("Error loading announcement");
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchAnnouncement();
  }, [editId, router]);

  // Apply Template
  const handleApplyTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setForm(prev => ({
      ...prev,
      title: tmpl.title,
      content: tmpl.content,
      category: tmpl.category,
      priority: tmpl.priority
    }));
    toast.info(`Applied template: "${tmpl.name}"`);
  };

  // Upload PDF Attachment
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size exceeds 15MB limit.");
      return;
    }

    setUploadingAttachment(true);
    const token = localStorage.getItem("hrms_token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements/upload-attachment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          attachment_url: data.file_url,
          attachment_name: data.file_name
        }));
        toast.success("Attachment uploaded successfully");
      } else {
        let errMsg = "Failed to upload attachment";
        try {
          const data = await res.json();
          errMsg = data.detail || errMsg;
        } catch {}
        toast.error(errMsg);
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = () => {
    setForm(prev => ({ ...prev, attachment_url: "", attachment_name: "" }));
    toast.info("Attachment removed");
  };

  // Submit Form
  const handleSubmit = async (desiredStatus: "PUBLISHED" | "DRAFT") => {
    if (!form.title.trim()) {
      toast.error("Please enter an announcement title");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Please enter announcement content");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("hrms_token");

    const payload = {
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      status: desiredStatus
    };

    try {
      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/announcements/${editId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/announcements`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(
          desiredStatus === "PUBLISHED" 
            ? "Announcement successfully published live to portal!" 
            : "Announcement saved as Draft"
        );
        router.push("/business/announcements");
      } else {
        let errMsg = "Failed to save announcement";
        try {
          const data = await res.json();
          errMsg = data.detail || errMsg;
        } catch {}
        toast.error(errMsg);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryInfo = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case "REGULATION":
        return { label: "Tax & Regulation", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" };
      case "TAX_UPDATE":
        return { label: "Tax Advisory", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" };
      case "CORPORATE":
        return { label: "Corporate News", color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" };
      case "OPERATIONAL":
        return { label: "Operational Notice", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" };
      default:
        return { label: "General Bulletin", color: "text-teal-500", bg: "bg-teal-500/10 border-teal-500/20" };
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground animate-pulse">Loading announcement parameters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-4 animate-in fade-in duration-500 pb-20">
      
      {/* 1. TOP HEADER & BREADCRUMB BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 sm:px-5 rounded-2xl border border-border/50 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/business/announcements">
            <Button variant="outline" size="icon" className="h-8.5 w-8.5 rounded-xl shrink-0 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Announcements
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-[11px] font-bold text-primary">
                {isEditing ? "Edit Notice" : "Create New"}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
              {isEditing ? "Edit Announcement" : "Create New Announcement"}
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Link href="/business/announcements">
            <Button variant="ghost" className="h-8.5 rounded-xl text-xs font-semibold px-3.5 cursor-pointer">
              Cancel
            </Button>
          </Link>
          <Button 
            variant="outline" 
            disabled={submitting} 
            onClick={() => handleSubmit("DRAFT")}
            className="h-8.5 rounded-xl text-xs font-semibold px-3.5 border-border/60 bg-background/80 hover:bg-muted cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Draft
          </Button>
          <Button 
            disabled={submitting} 
            onClick={() => handleSubmit("PUBLISHED")}
            className="h-8.5 rounded-xl text-xs font-bold px-4.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
          >
            {submitting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Publishing...</>
            ) : (
              <><Send className="h-3.5 w-3.5 mr-1.5" /> Publish Live</>
            )}
          </Button>
        </div>
      </div>

      {/* 2. SINGLE-LINE HORIZONTAL TARGET AUDIENCE & CLASSIFICATION STRIP */}
      <div className="bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2.5 sm:px-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 shadow-xs">
        
        {/* Left: Audience Segmented Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 shrink-0 mr-1">
            <Globe className="h-3.5 w-3.5 text-primary" /> Audience:
          </span>
          
          <div className="inline-flex items-center bg-muted/40 p-0.5 rounded-xl border border-border/40 shrink-0">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, target_role: "CLIENT" }))}
              className={`h-7.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                form.target_role === "CLIENT"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="h-3 w-3" /> Client Portal
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, target_role: "EMPLOYEE" }))}
              className={`h-7.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                form.target_role === "EMPLOYEE"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3 w-3" /> HRMS Staff
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, target_role: "ALL" }))}
              className={`h-7.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                form.target_role === "ALL"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Radio className="h-3 w-3" /> All Portals
            </button>
          </div>
        </div>

        {/* Right: Category, Priority, and Pin Controls */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 xl:pb-0 scrollbar-none shrink-0">
          
          {/* Category Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-muted-foreground hidden sm:inline">Category:</span>
            <Select value={form.category} onValueChange={(val) => setForm(f => ({ ...f, category: val }))}>
              <SelectTrigger className="h-8 text-xs w-[145px] rounded-xl bg-background/60 border-border/50 font-medium">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                <SelectItem value="REGULATION" className="text-xs cursor-pointer">Tax & Regulation</SelectItem>
                <SelectItem value="TAX_UPDATE" className="text-xs cursor-pointer">Tax Advisory</SelectItem>
                <SelectItem value="CORPORATE" className="text-xs cursor-pointer">Corporate News</SelectItem>
                <SelectItem value="OPERATIONAL" className="text-xs cursor-pointer">Operational Notice</SelectItem>
                <SelectItem value="GENERAL" className="text-xs cursor-pointer">General Bulletin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-muted-foreground hidden sm:inline">Priority:</span>
            <Select value={form.priority} onValueChange={(val) => setForm(f => ({ ...f, priority: val }))}>
              <SelectTrigger className="h-8 text-xs w-[130px] rounded-xl bg-background/60 border-border/50 font-medium">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                <SelectItem value="NORMAL" className="text-xs cursor-pointer">Normal</SelectItem>
                <SelectItem value="HIGH" className="text-xs cursor-pointer">High Priority ⚡</SelectItem>
                <SelectItem value="URGENT" className="text-xs cursor-pointer">Urgent 🚨</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pin to Top Button Toggle */}
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, is_pinned: !f.is_pinned }))}
            className={`h-8 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              form.is_pinned 
                ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-xs" 
                : "bg-background/60 border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Pin className={`h-3.5 w-3.5 ${form.is_pinned ? "fill-amber-500/30 text-amber-500" : ""}`} />
            <span>{form.is_pinned ? "Pinned to Top" : "Standard"}</span>
          </button>

        </div>

      </div>

      {/* 3. MAIN 2-COLUMN SECTION: ANNOUNCEMENT CONTENT (LEFT) & LIVE VIEW (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Expanded Announcement Content Area (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <Card className="border-border/50 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Announcement Content & Circular
                </CardTitle>
                
                {/* Quick Template Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 mr-0.5">
                    Template:
                  </span>
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 rounded-lg border border-border/40 bg-background/60 hover:bg-muted text-[11px] font-medium text-foreground whitespace-nowrap transition-colors shrink-0 cursor-pointer"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              
              {/* Announcement Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Announcement Title</label>
                  <span className="text-[10px] text-muted-foreground font-mono">{form.title.length}/150</span>
                </div>
                <Input
                  placeholder="e.g., Notice: Annual Corporate Income Tax (SPT) Filing Deadline 2026"
                  maxLength={150}
                  className="h-9.5 text-xs rounded-xl bg-background/60 border-border/50 font-medium"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              {/* EXPANDED Announcement Body Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Announcement Body Details</label>
                  <span className="text-[10px] text-muted-foreground font-normal">Supports multi-paragraph text & instructions</span>
                </div>
                <Textarea
                  placeholder="Write the full announcement circular here... Include important dates, compliance steps, affected entities, and designated contact advisors."
                  rows={14}
                  className="text-xs rounded-xl bg-background/60 border-border/50 leading-relaxed resize-y font-normal min-h-[320px]"
                  value={form.content}
                  onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                />
              </div>

              {/* PDF Attachment Bar */}
              <div className="pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleAttachmentUpload}
                />

                {form.attachment_url ? (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileCheck className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {form.attachment_name || "Official_Notice_Circular.pdf"}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          PDF Document Attached & Available for Download
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAttachment}
                        className="h-7.5 text-xs rounded-lg bg-background/80"
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAttachment}
                        className="h-7.5 text-xs text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => !uploadingAttachment && fileInputRef.current?.click()}
                    className="border border-dashed border-border/60 hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-colors p-3.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {uploadingAttachment ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-foreground">
                          {uploadingAttachment ? "Uploading PDF circular..." : "Attach PDF Circular (Optional)"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Max 15MB • Official decrees, advisory guides, or schedules
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      disabled={uploadingAttachment}
                      className="h-7.5 text-xs rounded-lg bg-background/70 shrink-0 pointer-events-none"
                    >
                      <Upload className="h-3 w-3 mr-1" /> Browse
                    </Button>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: Live View Right Beside It (5 Cols) */}
        <div className="lg:col-span-5 space-y-3.5 lg:sticky lg:top-20">
          
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Live View
            </span>
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-2 py-0 rounded-full">
              Real-Time Preview
            </Badge>
          </div>

          {/* Live Reactive Card */}
          <Card 
            className={`border bg-background/80 backdrop-blur-md rounded-2xl shadow-sm transition-all overflow-hidden relative ${
              form.is_pinned 
                ? "border-amber-500/40 dark:border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.08)] ring-1 ring-amber-500/20" 
                : form.priority === "URGENT"
                ? "border-rose-500/40 dark:border-rose-500/30 shadow-[0_4px_20px_rgba(244,63,94,0.08)]"
                : "border-border/50"
            }`}
          >
            {/* Top Accent Gradient Bar */}
            <div className={`h-1.5 w-full shrink-0 ${
              form.is_pinned 
                ? "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" 
                : form.priority === "URGENT"
                ? "bg-gradient-to-r from-rose-500 via-red-500 to-pink-500"
                : form.priority === "HIGH"
                ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400"
                : "bg-gradient-to-r from-emerald-500 to-teal-500"
            }`} />

            <CardHeader className="p-4 sm:p-5 pb-2.5 space-y-2.5">
              
              {/* Tags Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {form.is_pinned && (
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[10px] px-2 py-0 rounded-full flex items-center gap-1">
                      <Pin className="h-2.5 w-2.5 fill-amber-500/30" />
                      Pinned
                    </Badge>
                  )}

                  {form.priority === "URGENT" && (
                    <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-[10px] px-2 py-0 rounded-full flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                      </span>
                      Urgent
                    </Badge>
                  )}
                  {form.priority === "HIGH" && (
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[10px] px-2 py-0 rounded-full">
                      High Priority
                    </Badge>
                  )}

                  {/* Category Pill */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryInfo(form.category).bg} ${getCategoryInfo(form.category).color}`}>
                    {getCategoryInfo(form.category).label}
                  </span>
                </div>

                {/* Publish Date */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/30">
                  <Calendar className="h-2.5 w-2.5 text-emerald-500" />
                  {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>

              {/* Title */}
              <CardTitle className="text-sm sm:text-base font-bold text-foreground leading-snug tracking-tight">
                {form.title.trim() || "Announcement Title Preview"}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 pt-1 space-y-3.5">
              {/* Body */}
              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-normal max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                {form.content.trim() || "Your announcement body will render here exactly as client companies see it on their portal feed."}
              </div>

              {/* Simulated PDF Attachment Download Card */}
              {form.attachment_name && (
                <div className="p-3 rounded-xl bg-card/90 dark:bg-zinc-950/60 border border-emerald-500/20 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-foreground truncate">
                        {form.attachment_name}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        Official Circular • PDF
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 shrink-0">
                    Downloadable
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Audience Summary Pill */}
          <div className="p-3 rounded-xl border border-border/50 bg-card/40 backdrop-blur-md space-y-1 text-xs">
            <p className="font-bold text-[11px] text-foreground flex items-center gap-1.5">
              <Info className="h-3 w-3 text-primary" /> Delivery Channel
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {form.target_role === "CLIENT" 
                ? "This bulletin will be published directly to all client portal accounts."
                : form.target_role === "EMPLOYEE" 
                  ? "This bulletin is restricted to internal staff in the HRMS workspace."
                  : "This bulletin will broadcast simultaneously across both Client Portal and HRMS."}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
