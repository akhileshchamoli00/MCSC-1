"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Megaphone, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  Filter, 
  Pin, 
  Sparkles, 
  RefreshCw, 
  Calendar, 
  Building, 
  Users, 
  Eye, 
  FileText, 
  Globe, 
  Radio, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Paperclip, 
  CheckCircle2, 
  Clock,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function BusinessAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PUBLISHED" | "DRAFT" | "CLIENT" | "ARCHIVED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements?scope=management`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Metrics Calculations
  const totalCount = announcements.length;
  const publishedCount = announcements.filter(a => a.status === "PUBLISHED").length;
  const draftsCount = announcements.filter(a => a.status === "DRAFT").length;
  const clientTargetedCount = announcements.filter(a => a.target_role === "CLIENT" || a.target_role === "ALL").length;
  const pinnedCount = announcements.filter(a => a.is_pinned).length;

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (ann.title || "").toLowerCase().includes(q) || 
        (ann.content || "").toLowerCase().includes(q) ||
        (ann.category || "").toLowerCase().includes(q);

      let matchesTab = true;
      if (activeTab === "PUBLISHED") matchesTab = ann.status === "PUBLISHED";
      else if (activeTab === "DRAFT") matchesTab = ann.status === "DRAFT";
      else if (activeTab === "CLIENT") matchesTab = ann.target_role === "CLIENT" || ann.target_role === "ALL";
      else if (activeTab === "ARCHIVED") matchesTab = ann.status === "ARCHIVED";

      const matchesCategory = categoryFilter === "ALL" || ann.category === categoryFilter;

      return matchesSearch && matchesTab && matchesCategory;
    });
  }, [announcements, searchQuery, activeTab, categoryFilter]);

  // Quick Action: Toggle Pin
  const handleTogglePin = async (id: number) => {
    const token = localStorage.getItem("hrms_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements/${id}/toggle-pin`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Pinned status updated");
        fetchAnnouncements();
      }
    } catch (e) {
      toast.error("Failed to update pin");
    }
  };

  // Quick Action: Publish Draft
  const handleQuickPublish = async (id: number) => {
    const token = localStorage.getItem("hrms_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements/${id}/publish`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Announcement published live!");
        fetchAnnouncements();
      }
    } catch (e) {
      toast.error("Failed to publish");
    }
  };

  // Quick Action: Delete
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const token = localStorage.getItem("hrms_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements/${deletingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Announcement deleted successfully");
        setDeletingId(null);
        fetchAnnouncements();
      } else {
        let errMsg = "Failed to delete announcement";
        try {
          const data = await res.json();
          errMsg = data.detail || errMsg;
        } catch {}
        toast.error(errMsg);
      }
    } catch (err) {
      toast.error("Error deleting announcement");
    } finally {
      setDeleting(false);
    }
  };

  // Category Icon & Label Helper
  const getCategoryInfo = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case "REGULATION":
        return { label: "Tax & Regulation", icon: Building, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" };
      case "TAX_UPDATE":
        return { label: "Tax Advisory", icon: Sparkles, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" };
      case "CORPORATE":
        return { label: "Corporate News", icon: Globe, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" };
      case "OPERATIONAL":
        return { label: "Operational Notice", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" };
      default:
        return { label: "General Bulletin", icon: Megaphone, color: "text-teal-500", bg: "bg-teal-500/10 border-teal-500/20" };
    }
  };

  return (
    <div className="w-full max-w-none space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* 1. MINIMALIST METRIC STRIP & ACTION BUTTON ROW */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 flex-1 divide-y md:divide-y-0 md:divide-x divide-border/50 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs">
          
          {/* Total Bulletins */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Bulletins</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalCount}</p>
            </div>
          </div>

          {/* Published & Live */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Live Published</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{publishedCount}</p>
            </div>
          </div>

          {/* Pending Drafts */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Drafts</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{draftsCount}</p>
            </div>
          </div>

          {/* Client Targeted */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Globe className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Client Portal</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{clientTargetedCount}</p>
            </div>
          </div>

        </div>

        {/* Create Announcement Button (Links directly to dedicated full creation page) */}
        <Link href="/business/announcements/new" className="shrink-0 flex items-stretch">
          <Button className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm">
            <Plus className="h-4 w-4" /> Create Announcement
          </Button>
        </Link>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        
        {/* Navigation Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Button
            variant={activeTab === "ALL" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("ALL")}
            className="rounded-xl text-xs font-semibold h-8 px-3 cursor-pointer"
          >
            All Bulletins ({totalCount})
          </Button>
          <Button
            variant={activeTab === "PUBLISHED" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("PUBLISHED")}
            className="rounded-xl text-xs font-semibold h-8 px-3 cursor-pointer flex items-center gap-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            Live ({publishedCount})
          </Button>
          <Button
            variant={activeTab === "DRAFT" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("DRAFT")}
            className="rounded-xl text-xs font-semibold h-8 px-3 cursor-pointer flex items-center gap-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
            Drafts ({draftsCount})
          </Button>
          <Button
            variant={activeTab === "CLIENT" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("CLIENT")}
            className="rounded-xl text-xs font-semibold h-8 px-3 cursor-pointer"
          >
            Client Portal ({clientTargetedCount})
          </Button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              className="pl-8.5 h-8 text-xs rounded-xl bg-background/60 border-border/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[150px] h-8 text-xs rounded-xl bg-background/60 border-border/50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50">
              <SelectItem value="ALL" className="text-xs cursor-pointer">All Categories</SelectItem>
              <SelectItem value="REGULATION" className="text-xs cursor-pointer">Tax & Regulation</SelectItem>
              <SelectItem value="TAX_UPDATE" className="text-xs cursor-pointer">Tax Advisory</SelectItem>
              <SelectItem value="CORPORATE" className="text-xs cursor-pointer">Corporate News</SelectItem>
              <SelectItem value="OPERATIONAL" className="text-xs cursor-pointer">Operational</SelectItem>
              <SelectItem value="GENERAL" className="text-xs cursor-pointer">General Bulletin</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchAnnouncements} 
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 border border-border/50 rounded-xl bg-background/60 cursor-pointer"
            title="Refresh feed"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 3. ANNOUNCEMENTS LIST FEED */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs animate-pulse">Loading corporate bulletin feed...</span>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-2xl p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <Megaphone className="h-12 w-12 text-muted-foreground/30 mb-2" />
            <h3 className="font-bold text-base text-foreground">No Bulletins Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
              {searchQuery || activeTab !== "ALL" || categoryFilter !== "ALL"
                ? "No announcements match your search criteria. Try resetting filters."
                : "Get started by authoring a new announcement for client or staff broadcast."}
            </p>
            {activeTab === "ALL" && !searchQuery && (
              <Link href="/business/announcements/new">
                <Button className="mt-4 rounded-xl text-xs font-bold gap-1.5 h-9 px-4">
                  <Plus className="h-4 w-4" /> Create First Bulletin
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => {
            const isExpanded = expandedIds[ann.id] || false;
            const isDraft = ann.status === "DRAFT";
            const isClientTarget = ann.target_role === "CLIENT" || ann.target_role === "ALL";
            const catInfo = getCategoryInfo(ann.category);

            return (
              <Card 
                key={ann.id} 
                className={`border bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl shadow-xs transition-all overflow-hidden relative group ${
                  ann.is_pinned 
                    ? "border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-sm" 
                    : "border-border/40 hover:border-border/80"
                }`}
              >
                {/* Top Glowing Color Accent Bar */}
                <div className={`h-1 w-full shrink-0 ${
                  ann.is_pinned 
                    ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" 
                    : isDraft 
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500" 
                      : "bg-gradient-to-r from-primary to-accent"
                }`} />

                <CardHeader className="p-5 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      
                      {/* Meta Tags Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        
                        {/* Pinned Pill */}
                        {ann.is_pinned && (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold gap-1">
                            <Pin className="h-3 w-3 fill-emerald-500" /> Pinned
                          </Badge>
                        )}

                        {/* Status Pill */}
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] font-bold ${
                            ann.status === "PUBLISHED" 
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                              : ann.status === "DRAFT" 
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" 
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                          }`}
                        >
                          {ann.status === "PUBLISHED" ? "Live Published" : ann.status === "DRAFT" ? "Draft" : "Archived"}
                        </Badge>

                        {/* Target Audience Pill */}
                        <Badge variant="secondary" className="text-[10px] font-semibold gap-1">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          {ann.target_role === "CLIENT" ? "Client Portal" : ann.target_role === "EMPLOYEE" ? "Employee HRMS" : "All Portals"}
                        </Badge>

                        {/* Category Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${catInfo.bg} ${catInfo.color}`}>
                          <catInfo.icon className="h-3 w-3" />
                          {catInfo.label}
                        </span>

                        {/* Priority Badge if High/Urgent */}
                        {ann.priority === "URGENT" && (
                          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                            Urgent Priority
                          </Badge>
                        )}
                        {ann.priority === "HIGH" && (
                          <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[10px] font-bold">
                            High Priority
                          </Badge>
                        )}
                      </div>

                      <CardTitle className="text-base sm:text-lg font-bold text-foreground leading-tight">
                        {ann.title}
                      </CardTitle>
                    </div>

                    {/* Quick Action Button Group */}
                    <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                      
                      {/* One-click Publish for drafts */}
                      {isDraft && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleQuickPublish(ann.id)}
                          className="h-8 text-xs font-bold gap-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" /> Publish Live
                        </Button>
                      )}

                      {/* Pin/Unpin button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleTogglePin(ann.id)}
                        className={`h-8 w-8 rounded-xl cursor-pointer ${ann.is_pinned ? "text-emerald-600 bg-emerald-500/10" : "text-muted-foreground hover:text-foreground"}`}
                        title={ann.is_pinned ? "Unpin notice" : "Pin notice to top"}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </Button>

                      {/* Edit button -> links to full edit page */}
                      <Link href={`/business/announcements/new?id=${ann.id}`}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Edit Announcement"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      {/* Delete button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setDeletingId(ann.id)}
                        className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-1 space-y-4">
                  {/* Content Body */}
                  <p className={`text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap ${!isExpanded ? "line-clamp-3" : ""}`}>
                    {ann.content}
                  </p>

                  {/* Expand / Collapse Button */}
                  {ann.content.length > 180 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleExpand(ann.id)} 
                      className="text-xs font-semibold text-primary p-0 h-auto hover:bg-transparent hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? <>Show Less <ChevronUp className="h-3.5 w-3.5" /></> : <>Read Full Notice <ChevronDown className="h-3.5 w-3.5" /></>}
                    </Button>
                  )}

                  {/* Attached Circular preview */}
                  {ann.attachment_url && (
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold text-foreground truncate max-w-[280px]">
                          {ann.attachment_name || "Official Circular Document.pdf"}
                        </span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">PDF</Badge>
                      </div>
                      <a 
                        href={ann.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" /> View / Download
                      </a>
                    </div>
                  )}

                  {/* Footer Meta Row */}
                  <div className="pt-2 border-t border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(ann.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {ann.published_at && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Published {new Date(ann.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span>Publisher: <strong className="text-foreground">{ann.author_name || "MCS Executive"}</strong></span>
                    </div>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && !deleting && setDeletingId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Announcement
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">
              Are you sure you want to delete this bulletin? This will permanently remove it from both the business administration feed and client portals.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setDeletingId(null)} disabled={deleting} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirm} disabled={deleting} className="rounded-xl text-xs font-bold">
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
