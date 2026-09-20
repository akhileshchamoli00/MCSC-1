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
  Clock,
  ShieldAlert,
  Sunrise,
  Sun,
  Moon
} from "lucide-react";
import Link from "next/link";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import MagicBento, { BentoCardItem, BentoCard } from "@/components/magic-bento";
import { useTheme } from "next-themes";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: "Draft", color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/20" },
  PROSPECT: { label: "Pipeline", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  PIPELINE: { label: "Pipeline", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  CONFIRMED: { label: "Confirmed", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ORDER_ASSIGNED: { label: "Consultant Assigned", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  IN_PROGRESS: { label: "In Progress", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  ON_HOLD: { label: "On Hold", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  REVIEW_DOCS: { label: "Reviewing", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  DOCUMENTS_REVIEWED: { label: "Documents Reviewed", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  PRE_DOC_SENT_FOR_SIGNATURE: { label: "Pre Doc sent for Signature", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  PRE_DOCS_SENT: { label: "Pre Doc sent for Signature", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  FINAL_DOCUMENT_PREPARATION: { label: "Doc Prep", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  FINAL_DOC_READY: { label: "Final Docs Ready", color: "text-lime-600 dark:text-lime-400", bg: "bg-lime-500/10", border: "border-lime-500/20" },
  PROFORMA_GENERATED: { label: "Proforma Generated", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  INVOICE_GENERATED: { label: "Invoice Generated", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  WAITING_ON_CLIENT: { label: "Action Needed", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  WAITING_FOR_CLIENT: { label: "Action Needed", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  WAITING_FOR_FINAL_PAYMENT: { label: "Payment Pending", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  WAITING_ON_FINAL_PAYMENT: { label: "Payment Pending", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  FINAL_PAYMENT_COMPLETED: { label: "Payment Completed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  SOFT_COPY_DELIVERED: { label: "Soft Copy Delivered", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  HARD_COPY_DELIVERED: { label: "Hard Copy Delivered", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  COMPLETED: { label: "Completed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  CANCELLED: { label: "Cancelled", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" }
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

    const loadDashboardData = async () => {
      try {
        // Fetch Orders
        const ordRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
      credentials: "include",
          });
        if (ordRes.ok) {
          const allOrders = await ordRes.json();
          setOrders(allOrders || []);
        }

        // Documents (kept empty for now)
        setDocuments([]);

        // Fetch announcements
        const annRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements`, {
      credentials: "include",
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

  // Filter orders by active company
  const companyOrders = React.useMemo(() => {
    if (!activeCompany) return orders;
    return orders.filter(ord => {
      if (ord.company_id && activeCompany.id) {
        return ord.company_id === activeCompany.id;
      }
      if (ord.company_name && activeCompany.company_name) {
        return ord.company_name.toLowerCase() === activeCompany.company_name.toLowerCase();
      }
      return true;
    });
  }, [orders, activeCompany]);

  // Active in-progress orders for selected company
  const activeOrders = React.useMemo(() => {
    return companyOrders.filter(
      ord => !["COMPLETED", "HARD_COPY_DELIVERED", "CANCELLED"].includes(ord.status)
    );
  }, [companyOrders]);

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

  const recentAnnouncements = React.useMemo(() => announcements.slice(0, 4), [announcements]);

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
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      {/* Welcome Header */}
      {(() => {
        const greetingData = getGreetingData();
        const GreetingIcon = greetingData.icon;
        return (
          <BentoCard
            className="!relative !overflow-hidden p-8 sm:p-10 md:p-12 text-foreground shadow-sm rounded-3xl animate-scale-in bg-background/50 backdrop-blur-md border !border-border/40"
            particleCount={25}
            glowColor={glowColor}
          >
            {/* Ambient Animated Floating Orbs */}
            <div className="absolute top-[-50%] right-[-10%] w-[380px] h-[380px] rounded-full blur-[95px] pointer-events-none -z-10 animate-float-slow bg-emerald-500/5" />
            <div className="absolute bottom-[-30%] left-[20%] w-[320px] h-[320px] rounded-full blur-[80px] pointer-events-none -z-10 animate-float-reverse bg-teal-500/5" />
            <div className="absolute top-[20%] left-[-10%] w-[260px] h-[260px] rounded-full blur-[70px] pointer-events-none -z-10 animate-float-slow bg-emerald-500/5" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-1 text-xs backdrop-blur-md rounded-full font-bold flex items-center gap-1.5 w-fit">
                  <GreetingIcon className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{greetingData.badge}</span>
                </Badge>
                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-foreground">
                    {greetingData.greeting}, {clientProfile?.contact_person || "Partner"}
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xl">
                    {greetingData.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <div className="bg-background/80 border border-border/50 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Company</span>
                    <span className="text-xs sm:text-sm font-bold text-foreground mt-0.5 block">{activeCompany?.company_name || "Corporate Partner"}</span>
                  </div>
                  <div className="bg-background/80 border border-border/50 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Partner Code</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-foreground mt-0.5 block">{clientProfile?.client_code || "X260001"}</span>
                  </div>
                  <div className="bg-background/80 border border-border/50 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Active Orders</span>
                    <span className="text-xs sm:text-sm font-bold text-foreground mt-0.5 block">{activeOrderGroups.length} Ongoing</span>
                  </div>
                </div>
              </div>

              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-md flex items-center justify-center text-3xl font-extrabold text-foreground shadow-sm overflow-hidden shrink-0 group self-center sm:self-auto transition-all duration-300 hover:scale-105">
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

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Side: In-Progress Orders */}
        <div className="lg:col-span-7 space-y-6">
          <BentoCard className="flex flex-col h-full rounded-3xl border border-border/40 bg-background/50 backdrop-blur-md overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-5 sm:px-8 sm:py-6 border-b border-border/40 bg-muted/20">
              <div className="space-y-1">
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-500" /> In-Progress Orders
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
            <CardContent className="space-y-2.5 p-5 sm:p-6">
              {activeOrderGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                  <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold text-foreground">No In-Progress Orders</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                    New orders requested will be displayed here along with assigned consultant details.
                  </p>
                </div>
              ) : (
                activeOrderGroups.map(group => {
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
                      className="flex items-center justify-between gap-3 p-3 sm:px-4 sm:py-2.5 rounded-xl border border-border/40 bg-background/70 hover:border-emerald-500/30 hover:bg-muted/20 transition-all shadow-xs group"
                    >
                      {/* Left: Order Number Badge & Job Title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2.5 py-0.5 rounded-md shrink-0">
                          {group.orderNumber}
                        </span>
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate min-w-0" title={group.primaryOrder.job_title}>
                          {group.primaryOrder.job_title || "Consulting Service Package"}
                        </h4>
                      </div>

                      {/* Middle: Consultant pill */}
                      <div className="hidden md:flex items-center gap-1.5 shrink-0">
                        {consultant ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title={`Consultant: ${consultant.name}`}>
                            {consultant.profile_photo ? (
                              <img
                                src={resolveImageUrl(consultant.profile_photo)}
                                alt={consultant.name}
                                className="h-5 w-5 rounded-full object-cover border border-border/40"
                              />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-[9px]">
                                {(consultant.name || "C")[0]}
                              </div>
                            )}
                            <span className="text-[11px] font-medium text-foreground max-w-[100px] truncate">{consultant.name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                        )}
                      </div>

                      {/* Right: Status badge & Chat button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border font-bold text-[10px] px-2.5 py-0.5 rounded-full whitespace-nowrap`}
                        >
                          {statusConfig.label}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2.5 text-xs font-bold rounded-lg border border-border/40 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all cursor-pointer"
                          asChild
                        >
                          <Link href={`/client/chat?order=${group.orderNumber}`}>
                            <MessageSquare className="h-3.5 w-3.5 sm:mr-1" />
                            <span className="hidden sm:inline">Chat</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </BentoCard>
        </div>

        {/* Right Side: Announcements */}
        <div className="lg:col-span-5 space-y-6">
          <BentoCard className="flex flex-col h-full rounded-3xl border border-border/40 bg-background/50 backdrop-blur-md overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-5 sm:px-8 sm:py-6 border-b border-border/40 bg-muted/20">
              <div className="space-y-1">
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-emerald-500" /> Announcements
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Company bulletins and holiday updates</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                <Link href="/client/announcements" className="flex items-center gap-1">
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3.5 p-6 sm:p-8">
              {recentAnnouncements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                  <Megaphone className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-semibold text-foreground">No announcements posted yet</p>
                </div>
              ) : (
                recentAnnouncements.map(ann => (
                  <div key={ann.id} className="flex flex-col gap-2 p-4 rounded-2xl border border-border/30 hover:border-emerald-500/20 hover:bg-muted/20 transition-all bg-background/60 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">{ann.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3 text-emerald-500" />
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{ann.content}</p>
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
