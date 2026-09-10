"use client";

import React, { useEffect, useState } from "react";
import { useClient } from "../layout";
import { useRouter } from "next/navigation";
import {
  Package,
  FileText,
  MessageSquare,
  Megaphone,
  ChevronRight,
  Download,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  Phone,
  Mail,
  User,
  Sunrise,
  Sun,
  Moon,
  Users,
  Calendar,
  CheckCircle2,
  Layers
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import MagicBento, { BentoCardItem, BentoCard } from "@/components/magic-bento";
import { useTheme } from "next-themes";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: "Draft", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  CONFIRMED: { label: "Confirmed", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  ORDER_ASSIGNED: { label: "Consultant Assigned", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  IN_PROGRESS: { label: "In Progress", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  REVIEW_DOCS: { label: "Reviewing", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  FINAL_DOCUMENT_PREPARATION: { label: "Doc Prep", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  FINAL_DOC_READY: { label: "Final Docs Ready", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  WAITING_ON_CLIENT: { label: "Action Needed", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  COMPLETED: { label: "Completed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
};

export default function ClientDashboard() {
  const { resolvedTheme } = useTheme();
  const glowColor = resolvedTheme === "dark" ? "16, 185, 129" : "148, 163, 184";
  const { clientProfile, activeCompany, loading: contextLoading } = useClient();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good Morning",
        subtitle: "Track in-progress orders, access files, and coordinate directly with your consultants.",
        badge: "🌅 Sunrise Mode",
        icon: Sunrise,
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        greeting: "Good Afternoon",
        subtitle: "Review active consulting milestones and chat with consultants working on your orders.",
        badge: "☀️ Focus Mode",
        icon: Sun,
      };
    }
    return {
      greeting: "Good Evening",
      subtitle: "Reviewing your active orders, completed deliverables, and consulting updates.",
      badge: "🌙 Twilight Mode",
      icon: Moon,
    };
  };

  useEffect(() => {
    if (contextLoading) return;

    if (!clientProfile || !activeCompany) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("hrms_token");
    if (!token) {
      setLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      try {
        // Fetch Orders
        const ordRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (ordRes.ok) {
          const allOrders = await ordRes.json();
          setOrders(allOrders || []);
        }

        // Documents (kept empty for now)
        setDocuments([]);

        // Fetch announcements
        const annRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (annRes.ok) setAnnouncements(await annRes.json());

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [clientProfile, activeCompany, contextLoading]);

  // Active in-progress orders
  const activeOrders = React.useMemo(() => {
    return orders.filter(
      ord => !["COMPLETED", "HARD_COPY_DELIVERED", "CANCELLED"].includes(ord.status)
    );
  }, [orders]);

  // Group active orders by order_number
  const activeOrderGroups = React.useMemo(() => {
    const map = new Map<string, any[]>();
    activeOrders.forEach(ord => {
      const num = ord.order_number || `ORD-${ord.id}`;
      if (!map.has(num)) map.set(num, []);
      map.get(num)!.push(ord);
    });

    return Array.from(map.entries()).map(([orderNumber, items]) => ({
      orderNumber,
      primaryOrder: items[0],
      items,
      consultants: items[0].consultants || [],
      status: items[0].status || "IN_PROGRESS"
    }));
  }, [activeOrders]);

  const recentDocs = React.useMemo(() => documents.slice(0, 3), [documents]);
  const recentAnnouncements = React.useMemo(() => announcements.slice(0, 3), [announcements]);

  const clientCards: BentoCardItem[] = React.useMemo(() => [
    {
      label: "In-Progress Orders",
      icon: Package,
      onClick: () => router.push("/client/orders"),
      className: "cursor-pointer",
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{activeOrderGroups.length}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Ongoing active services</p>
        </div>
      )
    },
    {
      label: "Order Chat",
      icon: MessageSquare,
      onClick: () => router.push("/client/chat"),
      className: "cursor-pointer",
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{activeOrderGroups.length}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Direct consultant threads</p>
        </div>
      )
    },
    {
      label: "Shared Documents",
      icon: FileText,
      onClick: () => router.push("/client/documents"),
      className: "cursor-pointer",
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{documents.length}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Secure partner documents</p>
        </div>
      )
    },
    {
      label: "System Announcements",
      icon: Megaphone,
      onClick: () => router.push("/client/announcements"),
      className: "cursor-pointer",
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{announcements.length}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Latest partner bulletins</p>
        </div>
      )
    }
  ], [activeOrderGroups.length, documents.length, announcements.length, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Syncing partner workspace...</p>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="flex h-[500px] items-center justify-center animate-in fade-in">
        <div className="flex flex-col items-center gap-3 text-center max-w-md p-8 rounded-2xl border border-dashed border-border bg-background/50">
          <ShieldAlert className="h-12 w-12 text-muted-foreground/30" />
          <h2 className="text-xl font-bold text-foreground">No Company Assigned</h2>
          <p className="text-sm text-muted-foreground">
            Your client profile is active, but no company entities have been assigned to your account yet. Please contact your system administrator to link a company to your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      {(() => {
        const greetingData = getGreetingData();
        const GreetingIcon = greetingData.icon;
        return (
          <BentoCard
            className="!relative !overflow-hidden p-6 sm:p-8 text-foreground shadow-sm rounded-2xl animate-scale-in bg-background/50 backdrop-blur-md border !border-border/40"
            particleCount={25}
            glowColor={glowColor}
          >
            {/* Ambient Animated Floating Orbs */}
            <div className="absolute top-[-50%] right-[-10%] w-[380px] h-[380px] rounded-full blur-[95px] pointer-events-none -z-10 animate-float-slow bg-emerald-500/5" />
            <div className="absolute bottom-[-30%] left-[20%] w-[320px] h-[320px] rounded-full blur-[80px] pointer-events-none -z-10 animate-float-reverse bg-teal-500/5" />
            <div className="absolute top-[20%] left-[-10%] w-[260px] h-[260px] rounded-full blur-[70px] pointer-events-none -z-10 animate-float-slow bg-emerald-500/5" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-3.5 max-w-2xl">
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 text-xs backdrop-blur-md rounded-full font-bold flex items-center gap-1.5 w-fit">
                  <GreetingIcon className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{greetingData.badge}</span>
                </Badge>
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight text-foreground">
                    {greetingData.greeting}, {clientProfile?.contact_person || "Partner"}
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xl">
                    {greetingData.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <div className="bg-background/80 border border-border/50 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Company</span>
                    <span className="text-xs font-bold text-foreground mt-0.5 block">{activeCompany?.company_name || "Corporate Partner"}</span>
                  </div>
                  <div className="bg-background/80 border border-border/50 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Partner Code</span>
                    <span className="text-xs font-mono font-bold text-foreground mt-0.5 block">{clientProfile?.client_code || "X260001"}</span>
                  </div>
                  <div className="bg-background/80 border border-border/50 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Active Orders</span>
                    <span className="text-xs font-bold text-foreground mt-0.5 block">{activeOrderGroups.length} Ongoing</span>
                  </div>
                </div>
              </div>

              <div className="h-24 w-24 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-md flex items-center justify-center text-3xl font-extrabold text-foreground shadow-sm overflow-hidden shrink-0 group self-center sm:self-start transition-all duration-300 hover:scale-105">
                {activeCompany?.logo_url ? (
                  <img src={resolveImageUrl(activeCompany.logo_url)} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  `${clientProfile?.contact_person?.[0] || ""}${clientProfile?.contact_person?.split(" ")[1]?.[0] || ""}`
                )}
              </div>
            </div>
          </BentoCard>
        );
      })()}

      {/* KPI Stats Grid */}
      <MagicBento
        cards={clientCards}
        textAutoHide={true}
        enableStars
        enableSpotlight={false}
        enableBorderGlow={true}
        enableTilt={false}
        enableMagnetism={false}
        clickEffect
        spotlightRadius={400}
        particleCount={12}
        glowColor={resolvedTheme === "dark" ? "16, 185, 129" : "148, 163, 184"}
        disableAnimations={false}
      />

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Side: In-Progress Orders & Quick Actions */}
        <div className="md:col-span-7 space-y-6">
          {/* Active Orders Card */}
          <BentoCard className="flex flex-col h-full rounded-2xl border border-border/40 bg-background/50 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/40 bg-muted/20">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-500" /> In-Progress Orders
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Active consulting services currently being processed
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                <Link href="/client/orders" className="flex items-center gap-1">
                  All Orders <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {activeOrderGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border border-dashed border-border/60 rounded-xl">
                  <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold text-foreground">No In-Progress Orders</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 max-w-xs">
                    New orders requested will be displayed here along with assigned consultant details.
                  </p>
                </div>
              ) : (
                activeOrderGroups.slice(0, 3).map(group => {
                  const statusConfig = STATUS_LABELS[group.status] || {
                    label: group.status,
                    color: "text-emerald-600 dark:text-emerald-400",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20"
                  };
                  const consultant = group.consultants[0];

                  return (
                    <div
                      key={group.orderNumber}
                      className="p-3.5 rounded-xl border border-border/40 bg-background/70 hover:border-emerald-500/30 transition-all space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2.5 py-0.5 rounded-md">
                            {group.orderNumber}
                          </span>
                          <span
                            className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border font-bold text-[10px] px-2.5 py-0.5 rounded-full`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2.5 flex items-center gap-1 font-bold rounded-lg cursor-pointer"
                          asChild
                        >
                          <Link href={`/client/chat?order=${group.orderNumber}`}>
                            <MessageSquare className="h-3.5 w-3.5" /> Chat
                          </Link>
                        </Button>
                      </div>

                      <h4 className="text-xs font-bold text-foreground line-clamp-1">
                        {group.primaryOrder.job_title || "Consulting Service Package"}
                      </h4>

                      {/* Consultant assigned */}
                      {consultant ? (
                        <div className="flex items-center gap-2.5 pt-2 border-t border-border/30 text-xs">
                          {consultant.profile_photo ? (
                            <img
                              src={resolveImageUrl(consultant.profile_photo)}
                              alt={consultant.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-[10px]">
                              {(consultant.name || "C")[0]}
                            </div>
                          )}
                          <span className="text-muted-foreground text-[11px]">
                            Consultant: <strong className="text-foreground font-semibold">{consultant.name}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-muted-foreground italic pt-1">
                          Consultant assignment pending
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </BentoCard>

          {/* Quick Actions */}
          <BentoCard className="flex flex-col h-full rounded-2xl border border-border/40 bg-background/50 backdrop-blur-md">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
              <CardTitle className="text-base font-bold">Quick Workspace Actions</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Frequently accessed partner utilities</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 pt-4">
              {[
                { name: "My Orders", desc: "View all in-progress orders", link: "/client/orders", icon: Package },
                { name: "Order Chat", desc: "Chat directly with consultants", link: "/client/chat", icon: MessageSquare },
                { name: "Shared Documents", desc: "View all uploaded files", link: "/client/documents", icon: FileText },
                { name: "Company Profile", desc: "View corporate metadata", link: "/client/profile", icon: User }
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <Link href={act.link} key={i}>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer group shadow-sm bg-background/60">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1">
                          {act.name} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                        </span>
                        <span className="text-[10px] text-muted-foreground">{act.desc}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </BentoCard>
        </div>

        {/* Right Side: Announcements & Recent Documents */}
        <div className="md:col-span-5 space-y-6">
          {/* Announcements Card */}
          <BentoCard className="flex flex-col h-full rounded-2xl border border-border/40 bg-background/50 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/40 bg-muted/20">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold">Announcements</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Company bulletins and holiday updates</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                <Link href="/client/announcements" className="flex items-center gap-1">
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {recentAnnouncements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground border border-dashed border-border/60 rounded-xl">
                  <Megaphone className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold text-foreground">No announcements posted yet</p>
                </div>
              ) : (
                recentAnnouncements.map(ann => (
                  <div key={ann.id} className="flex flex-col gap-1 p-3 rounded-xl border border-border/30 hover:border-emerald-500/20 hover:bg-muted/20 transition-all bg-background/60 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground line-clamp-1">{ann.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-500" />
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ann.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </BentoCard>

          {/* Recent Documents */}
          <BentoCard className="flex flex-col h-full overflow-hidden rounded-2xl border border-border/40 bg-background/50 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/40 bg-muted/20">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold">Recent Documents</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Files uploaded for your review</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                <Link href="/client/documents" className="flex items-center gap-1">
                  All Files <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {recentDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground border border-dashed border-border/60 rounded-xl">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold text-foreground">No shared documents found</p>
                </div>
              ) : (
                recentDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 hover:bg-muted/20 transition-all bg-background/60 shadow-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">{doc.file_name}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" asChild>
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}${doc.file_url}`} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
