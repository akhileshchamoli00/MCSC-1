"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Megaphone, 
  Calendar, 
  User, 
  Loader2, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Pin,
  AlertTriangle,
  FileText,
  Download,
  ExternalLink,
  Search,
  Building,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  ShieldAlert,
  Globe,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const CATEGORY_MAP: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  REGULATION: {
    label: "Tax & Regulation",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    border: "border-blue-500/20",
    icon: Building
  },
  TAX_UPDATE: {
    label: "Tax Advisory",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    border: "border-emerald-500/20",
    icon: Sparkles
  },
  CORPORATE: {
    label: "Corporate News",
    color: "text-purple-500 dark:text-purple-400",
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    border: "border-purple-500/20",
    icon: Globe
  },
  OPERATIONAL: {
    label: "Operational Schedule",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    border: "border-amber-500/20",
    icon: Clock
  },
  GENERAL: {
    label: "General Advisory",
    color: "text-teal-500 dark:text-teal-400",
    bg: "bg-teal-500/10 dark:bg-teal-500/15",
    border: "border-teal-500/20",
    icon: Megaphone
  }
};

export default function HRMSAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Sort pinned notices first, then newest published_at or created_at
        const sorted = data.sort((a: any, b: any) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          const dateA = new Date(a.published_at || a.created_at).getTime();
          const dateB = new Date(b.published_at || b.created_at).getTime();
          return dateB - dateA;
        });
        setAnnouncements(sorted);
      }
    } catch (err) {
      console.error("Error loading HRMS announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (ann.title || "").toLowerCase().includes(q) ||
        (ann.content || "").toLowerCase().includes(q) ||
        (ann.category || "").toLowerCase().includes(q);
      
      const matchesCategory = selectedCategory === "ALL" || ann.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [announcements, searchQuery, selectedCategory]);

  const urgentCount = announcements.filter(a => a.priority === "URGENT" || a.priority === "HIGH").length;
  const pinnedCount = announcements.filter(a => a.is_pinned).length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground animate-pulse">Loading corporate bulletin boards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* 1. MINIMALIST METRICS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs w-full gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
        
        {/* Total Bulletins */}
        <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
          <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
            <Megaphone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Bulletins</p>
            <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{announcements.length}</p>
          </div>
        </div>

        {/* Pinned Notices */}
        <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Pin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Pinned Notices</p>
            <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{pinnedCount}</p>
          </div>
        </div>

        {/* Priority Alerts */}
        <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
          <div className="h-9 w-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Priority Alerts</p>
            <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{urgentCount}</p>
          </div>
        </div>

        {/* Live Feed Status */}
        <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Live Feed</p>
            <p className="text-base sm:text-lg font-bold text-foreground leading-tight">Up to Date</p>
          </div>
        </div>
      </div>

      {/* 2. FILTER AND SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 dark:bg-zinc-900/40 p-3 rounded-2xl border border-border/40 backdrop-blur-md">
        
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Button
            size="sm"
            variant={selectedCategory === "ALL" ? "default" : "ghost"}
            onClick={() => setSelectedCategory("ALL")}
            className={`h-8 text-xs font-semibold rounded-xl px-3 cursor-pointer ${
              selectedCategory === "ALL" 
                ? "bg-primary text-primary-foreground shadow-xs" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Notices ({announcements.length})
          </Button>
          {Object.entries(CATEGORY_MAP).map(([key, info]) => {
            const count = announcements.filter(a => a.category === key).length;
            return (
              <Button
                key={key}
                size="sm"
                variant={selectedCategory === key ? "default" : "ghost"}
                onClick={() => setSelectedCategory(key)}
                className={`h-8 text-xs font-semibold rounded-xl px-3 shrink-0 cursor-pointer ${
                  selectedCategory === key 
                    ? "bg-primary text-primary-foreground shadow-xs" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {info.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search bulletins..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-8 text-xs bg-background/60 border-border/50 rounded-xl"
            />
          </div>

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

      {/* 3. ANNOUNCEMENTS FEED LIST */}
      {filteredAnnouncements.length === 0 ? (
        <Card className="border-border/40 bg-background/50 backdrop-blur-md rounded-2xl p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <Megaphone className="h-12 w-12 text-muted-foreground/30 mb-2" />
            <h3 className="font-bold text-base text-foreground">No Bulletins Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
              {searchQuery || selectedCategory !== "ALL"
                ? "No announcements matched your search or category filter. Try clearing filters."
                : "There are currently no active internal or company announcements posted."}
            </p>
            {(searchQuery || selectedCategory !== "ALL") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearchQuery(""); setSelectedCategory("ALL"); }}
                className="mt-3 text-xs rounded-xl"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((ann) => {
            const isExpanded = expandedIds[ann.id] || false;
            const catInfo = CATEGORY_MAP[ann.category] || CATEGORY_MAP.GENERAL;
            const Icon = catInfo.icon || Megaphone;
            const isUrgent = ann.priority === "URGENT";
            const isHigh = ann.priority === "HIGH";
            const isPinned = ann.is_pinned;

            const dateStr = ann.published_at || ann.created_at;
            const formattedDate = dateStr 
              ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "Recent";

            return (
              <Card 
                key={ann.id} 
                className={`border bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl shadow-xs transition-all overflow-hidden relative group ${
                  isPinned 
                    ? "border-amber-500/40 dark:border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.08)] ring-1 ring-amber-500/20" 
                    : isUrgent
                    ? "border-rose-500/40 dark:border-rose-500/30 shadow-[0_4px_20px_rgba(244,63,94,0.08)]"
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                {/* Top Accent Gradient Bar */}
                <div className={`h-1 w-full shrink-0 ${
                  isPinned 
                    ? "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500" 
                    : isUrgent
                    ? "bg-gradient-to-r from-rose-500 via-red-500 to-pink-500"
                    : isHigh
                    ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400"
                    : "bg-gradient-to-r from-primary to-accent"
                }`} />

                <CardHeader className="p-5 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="space-y-2 flex-1">
                      
                      {/* Meta Tags Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Pinned Tag */}
                        {isPinned && (
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <Pin className="h-3 w-3 fill-amber-500/30" />
                            Pinned Notice
                          </Badge>
                        )}

                        {/* Priority Tag */}
                        {isUrgent && (
                          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                            </span>
                            Urgent Priority
                          </Badge>
                        )}
                        {isHigh && (
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <AlertTriangle className="h-3 w-3" />
                            High Priority
                          </Badge>
                        )}

                        {/* Category Badge */}
                        <Badge className={`${catInfo.bg} ${catInfo.color} ${catInfo.border} border font-semibold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1`}>
                          <Icon className="h-3 w-3" />
                          {catInfo.label}
                        </Badge>

                      </div>

                      {/* Title */}
                      <CardTitle className="text-base sm:text-lg font-bold text-foreground leading-snug tracking-tight">
                        {ann.title}
                      </CardTitle>
                    </div>

                    {/* Meta Right */}
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <span className="flex items-center gap-1.5 bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 text-primary" />
                        {formattedDate}
                      </span>
                    </div>

                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  {/* Body Content */}
                  <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-normal">
                    {isExpanded ? ann.content : (
                      <span className="line-clamp-4">{ann.content}</span>
                    )}
                  </div>

                  {/* Expand / Collapse Button */}
                  {ann.content.length > 220 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleExpand(ann.id)} 
                      className="text-xs font-bold text-primary p-0 h-auto hover:bg-transparent hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>Show Less <ChevronUp className="h-3.5 w-3.5" /></>
                      ) : (
                        <>Read Full Bulletin <ChevronDown className="h-3.5 w-3.5" /></>
                      )}
                    </Button>
                  )}

                  {/* Attached PDF Circular */}
                  {ann.attachment_url && (
                    <div className="pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card/80 dark:bg-zinc-950/60 border border-primary/20 hover:border-primary/40 transition-colors shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">
                              {ann.attachment_name || "Official_Notice_Circular.pdf"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Official Document / Circular • Portable Document Format (PDF)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={ann.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={ann.attachment_name || "announcement_document.pdf"}
                          >
                            <Button 
                              size="sm" 
                              className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs flex items-center gap-1.5"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download Circular
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Meta Row */}
                  <div className="pt-2 border-t border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3 text-primary" />
                      <span>Issued by: <strong className="text-foreground">{ann.author_name || "MCS Executive Management"}</strong></span>
                    </div>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
