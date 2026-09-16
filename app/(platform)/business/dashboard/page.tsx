"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/user-context";
import { resolveImageUrl } from "@/lib/utils";
import {
  Users, Briefcase, FolderGit, Sunrise, Sun, Moon, ArrowUpRight, FileText, CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MagicBento, { BentoCardItem, BentoCard } from "@/components/magic-bento";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function BusinessDashboard() {
  const { resolvedTheme } = useTheme();
  const glowColor = resolvedTheme === "dark" ? "16, 185, 129" : "148, 163, 184"; // emerald glow for business
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);

  // State for metrics
  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);

  const getDaysRemaining = (expiryDateStr?: string) => {
    if (!expiryDateStr) return 0;
    const diffTime = new Date(expiryDateStr).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good Morning",
        subtitle: "Review your client assignments and business deliverables.",
        badge: "🌅 Sunrise Mode",
        icon: Sunrise,
        themeClass: "from-zinc-100/90 via-slate-50/85 to-zinc-200/80 dark:from-[#151109]/95 dark:via-[#1e140d]/90 dark:to-[#281313]/85",
        badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
        iconClass: "text-emerald-500 animate-pulse"
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        greeting: "Good Afternoon",
        subtitle: "Maintain productivity, coordinate deliverables, and engage clients.",
        badge: "☀️ Focus Mode",
        icon: Sun,
        themeClass: "from-sky-50/90 via-teal-50/85 to-emerald-50/80 dark:from-[#08121a]/95 dark:via-[#09181c]/90 dark:to-[#091a14]/85",
        badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
        iconClass: "text-emerald-500 animate-[spin_30s_linear_infinite]"
      };
    }
    return {
      greeting: "Good Evening",
      subtitle: "Monitoring ongoing transactions and workspace communications.",
      badge: "🌙 Twilight Mode",
      icon: Moon,
      themeClass: "from-indigo-50/90 via-purple-50/85 to-pink-50/80 dark:from-[#0b0c16]/95 dark:via-[#110d1f]/90 dark:to-[#1a0c20]/85",
      badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      iconClass: "text-emerald-400"
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, ordersRes, docsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
            credentials: "include"
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
            credentials: "include"
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/documents/expiring`, {
            credentials: "include"
          })
        ]);

        if (clientsRes.ok) setClients(await clientsRes.json());
        if (ordersRes.ok) setOrders(await ordersRes.json());
        if (docsRes.ok) setExpiringDocs(await docsRes.json());
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getOrderStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED") return <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"><span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-emerald-500" />COMPLETED</span>;
    if (s === "IN_PROGRESS") return <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20"><span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-sky-500 animate-pulse" />IN PROGRESS</span>;
    if (s === "CONFIRMED") return <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"><span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-indigo-500" />CONFIRMED</span>;
    if (s === "CANCELLED") return <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20"><span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-rose-500" />CANCELLED</span>;
    return <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-zinc-500/10 dark:bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"><span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-zinc-400" />DRAFT</span>;
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex h-[400px] items-center justify-center rounded-xl border border-border/50 bg-card/30 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground text-sm">Loading Business metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  // Group raw rows by order_number to avoid duplicate items and duplicate key errors
  const groupedOrdersMap = new Map<string, any>();
  orders.forEach((row) => {
    const num = row.order_number;
    if (!groupedOrdersMap.has(num)) {
      groupedOrdersMap.set(num, {
        order_number: num,
        company_id: row.company_id,
        company_name: row.company ? row.company.company_name : "Individual",
        client_name: row.company?.client ? row.company.client.contact_person : (row.client_name || "-"),
        created_at: row.created_at,
        status: row.status,
        total_amount: 0,
        items: [],
        consultants: []
      });
    }
    const group = groupedOrdersMap.get(num);
    group.items.push(row);
    group.total_amount += row.unit_price || 0;
    if (row.consultants && Array.isArray(row.consultants)) {
      row.consultants.forEach((c: any) => {
        if (!group.consultants.some((exist: any) => exist.id === c.id)) {
          group.consultants.push(c);
        }
      });
    }
  });
  const groupedOrders = Array.from(groupedOrdersMap.values());

  // Calculate Metrics
  const activeOrders = groupedOrders.filter(o => o.status === "IN_PROGRESS" || o.status === "CONFIRMED");
  const totalDeliverables = orders.length; // Each raw row is a single scope deliverable
  const completedOrders = groupedOrders.filter(o => o.status === "COMPLETED").length;

  const businessCards: BentoCardItem[] = [
    {
      label: "Total Clients",
      icon: Users,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{clients.length}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Clients registered</p>
        </div>
      )
    },
    {
      label: "Active Projects",
      icon: FolderGit,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{activeOrders.length}</div>
          <p className="text-[10px] text-emerald-500 font-semibold mt-1">Ongoing execution</p>
        </div>
      )
    },
    {
      label: "Completed Projects",
      icon: CheckCircle,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{completedOrders}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Successfully delivered</p>
        </div>
      )
    },
    {
      label: "Total Scope Items",
      icon: Briefcase,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{totalDeliverables}</div>
          <p className="text-[10px] text-indigo-500 font-semibold mt-1">Scope deliverables</p>
        </div>
      )
    }
  ];

  const greetingData = getGreetingData();
  const GreetingIcon = greetingData.icon;

  return (
    <div className="flex-1 space-y-8 pb-10">

      {/* 1. WELCOME BANNER */}
      <BentoCard
        className="!relative !overflow-hidden p-6 sm:p-8 text-slate-800 dark:text-slate-100 shadow-2xl animate-scale-in bg-gradient-to-br from-zinc-100 via-slate-100/80 to-zinc-200/60 dark:from-[#030712] dark:via-[#041f16] dark:to-[#030712] border !border-zinc-200/80 dark:!border-emerald-500/10"
        particleCount={25}
        glowColor={glowColor}
      >
        {/* Floating Orbs */}
        <div className="absolute top-[-50%] right-[-10%] w-[380px] h-[380px] rounded-full blur-[95px] pointer-events-none -z-10 animate-float-slow bg-emerald-500/5 dark:bg-emerald-500/10" />
        <div className="absolute bottom-[-30%] left-[20%] w-[320px] h-[320px] rounded-full blur-[80px] pointer-events-none -z-10 animate-float-reverse bg-teal-500/5 dark:bg-teal-500/10" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-3 py-1 text-xs backdrop-blur-md rounded-full font-semibold flex items-center gap-1.5 w-fit">
              <GreetingIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>{greetingData.badge}</span>
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-slate-700 via-emerald-600 to-emerald-800 dark:from-emerald-300 dark:via-teal-200 dark:to-emerald-400 pb-1">
                {greetingData.greeting}, {profile ? `${profile.first_name} ${profile.last_name}` : "Team Partner"}
              </h1>
              <p className="text-zinc-700 dark:text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
                {greetingData.subtitle} You have <span className="font-bold text-zinc-950 dark:text-emerald-300 underline decoration-emerald-500/30 underline-offset-4">{activeOrders.length} active projects</span> and <span className="font-bold text-zinc-950 dark:text-emerald-300 underline decoration-emerald-500/30 underline-offset-4">{clients.length} clients</span> in your pipeline.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Clients</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{clients.length}</span>
              </div>
              <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Active Orders</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{activeOrders.length}</span>
              </div>
              <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Completed</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{completedOrders}</span>
              </div>
            </div>
          </div>

          <div className="h-28 w-28 rounded-2xl border-2 border-emerald-300/40 dark:border-emerald-500/10 bg-white/40 dark:bg-white/5 backdrop-blur-md flex items-center justify-center text-4xl font-extrabold text-emerald-700 dark:text-white shadow-xl overflow-hidden shrink-0 group self-center sm:self-start transition-all duration-300 hover:rotate-2 hover:scale-105">
            {profile?.profile_photo ? (
              <img src={resolveImageUrl(profile.profile_photo)} alt="Profile" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
            ) : (
              `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`
            )}
          </div>
        </div>
      </BentoCard>

      {/* 2. NAVIGATION / ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 backdrop-blur-xl p-4 rounded-xl border border-border/40 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-foreground">Operational Overview</h2>
          <p className="text-xs text-muted-foreground">Monitor ongoing client projects, assignments, and corporate documents</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/business/clients/new">
            <Button size="sm" className="h-9 font-semibold text-xs gap-1">
              Add Client
            </Button>
          </Link>
          <Link href="/business/clients/orders">
            <Button size="sm" variant="outline" className="h-9 font-semibold text-xs border-border/60 bg-background/50">
              Create Order
            </Button>
          </Link>
        </div>
      </div>

      {/* STATS & MAIN CONTENT */}
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Bento Stats */}
        <MagicBento
          cards={businessCards}
          textAutoHide={true}
          enableStars
          enableSpotlight={false}
          enableBorderGlow={true}
          enableTilt={false}
          enableMagnetism={false}
          clickEffect
          spotlightRadius={400}
          particleCount={12}
          glowColor="16, 185, 129"
          gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
        />

        {/* Side-by-Side Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
          {/* Expiring Documents & Permits Card */}
          <Card className="overflow-hidden border border-border/40 bg-background/50 shadow-sm backdrop-blur-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/30 bg-muted/10">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  <span>Expiring Documents & Permits</span>
                </CardTitle>
                <CardDescription className="text-xs">Track validity and expiration of legal corporate files</CardDescription>
              </div>
              <Link href="/business/clients/documents">
                <Button variant="ghost" size="sm" className="text-xs hover:bg-muted/80 flex items-center gap-1 rounded-xl">
                  Manage Documents <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b border-border/40 font-semibold tracking-wider">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Client</th>
                      <th className="px-5 py-3 font-semibold">Company</th>
                      <th className="px-5 py-3 font-semibold">Document Name</th>
                      <th className="px-5 py-3 font-semibold text-right">Status / Days Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {[...expiringDocs]
                      .sort((a, b) => getDaysRemaining(a.expiry_date) - getDaysRemaining(b.expiry_date))
                      .map((doc) => {
                        const daysLeft = getDaysRemaining(doc.expiry_date);
                        return (
                          <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-foreground">{doc.partner_name || "Individual Client"}</td>
                            <td className="px-5 py-3.5 font-semibold text-muted-foreground">{doc.company_name}</td>
                            <td className="px-5 py-3.5 whitespace-normal break-words max-w-[200px] leading-normal">
                              <div className="font-semibold text-foreground">{doc.file_name}</div>
                              <div className="text-[10px] text-muted-foreground/80 mt-0.5">{doc.document_type}</div>
                            </td>
                            <td className="px-5 py-3.5 text-right font-semibold">
                              {daysLeft < 0 ? (
                                <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
                                  EXPIRED ({Math.abs(daysLeft)}d ago)
                                </span>
                              ) : daysLeft === 0 ? (
                                <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                  TODAY
                                </span>
                              ) : daysLeft <= 30 ? (
                                <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                  {daysLeft}d LEFT
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                                  {daysLeft}d LEFT
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {expiringDocs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-xs italic">
                          No expiring corporate documents found in workspace database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders log */}
          <Card className="overflow-hidden border border-border/40 bg-background/50 shadow-sm backdrop-blur-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/30 bg-muted/10">
              <div>
                <CardTitle className="text-base font-bold">Recent Client Orders</CardTitle>
                <CardDescription className="text-xs">Latest services purchased and execution status</CardDescription>
              </div>
              <Link href="/business/clients/orders">
                <Button variant="ghost" size="sm" className="text-xs hover:bg-muted/80 flex items-center gap-1 rounded-xl">
                  Manage Orders <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-muted/30 border-b border-border/40 font-semibold tracking-wider">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Order Number</th>
                      <th className="px-5 py-3 font-semibold">Representative</th>
                      <th className="px-5 py-3 font-semibold">Assigned To</th>
                      <th className="px-5 py-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {groupedOrders.slice(0, 5).map((order) => (
                      <tr key={order.order_number} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono font-bold text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 px-2 py-0.5 rounded-md text-foreground">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground font-semibold">{order.client_name || "-"}</td>
                        <td className="px-5 py-3.5">
                          {order.consultants && order.consultants.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {order.consultants.map((c: any) => (
                                <span key={c.id} className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold py-0.5 px-2 rounded-full">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60 italic text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">{getOrderStatusBadge(order.status)}</td>
                      </tr>
                    ))}
                    {groupedOrders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-xs italic">
                          No client orders found in workspace database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}

