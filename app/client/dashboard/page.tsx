"use client";

import React, { useEffect, useState } from "react";
import { useClient } from "../layout";
import { useRouter } from "next/navigation";
import {
  Users,
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
  FolderOpen,
  User,
  Sunrise,
  Sun,
  Moon
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import MagicBento, { BentoCardItem, BentoCard } from "@/components/magic-bento";
import { useTheme } from "next-themes";

export default function ClientDashboard() {
  const { resolvedTheme } = useTheme();
  const glowColor = resolvedTheme === "dark" ? "14, 165, 233" : "148, 163, 184";
  const { clientProfile, activeCompany, loading: contextLoading } = useClient();
  const router = useRouter();

  const [consultants, setConsultants] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good Morning",
        subtitle: "Access files, updates, and collaborate with your consultants.",
        badge: "🌅 Sunrise Mode",
        icon: Sunrise,
        glowColor: "148, 163, 184",
        themeClass: "from-zinc-100/90 via-slate-50/85 to-zinc-200/80 dark:from-[#151109]/95 dark:via-[#1e140d]/90 dark:to-[#281313]/85 border-zinc-200/40 dark:border-amber-500/20",
        textGradient: "from-zinc-700 via-slate-700 to-zinc-900 dark:from-amber-100 dark:via-orange-200 dark:to-rose-300",
        badgeClass: "bg-zinc-500/10 dark:bg-amber-400/15 text-zinc-700 dark:text-amber-300 border-zinc-500/15 dark:border-amber-400/20",
        orbColors: [
          "bg-zinc-400/25 dark:bg-amber-500/20",
          "bg-slate-400/20 dark:bg-rose-500/15",
          "bg-zinc-400/20 dark:bg-orange-500/15"
        ],
        iconClass: "text-zinc-500 dark:text-amber-400 animate-pulse"
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        greeting: "Good Afternoon",
        subtitle: "Check notifications and sync with your partner workspace.",
        badge: "☀️ Focus Mode",
        icon: Sun,
        glowColor: "14, 165, 233",
        themeClass: "from-sky-50/90 via-teal-50/85 to-emerald-50/80 dark:from-[#08121a]/95 dark:via-[#09181c]/90 dark:to-[#091a14]/85 border-sky-200/40 dark:border-sky-500/20",
        textGradient: "from-sky-600 via-teal-600 to-emerald-600 dark:from-sky-200 dark:via-teal-200 dark:to-emerald-300",
        badgeClass: "bg-sky-600/10 dark:bg-sky-400/15 text-sky-700 dark:text-sky-300 border-sky-600/15 dark:border-sky-400/20",
        orbColors: [
          "bg-sky-400/25 dark:bg-sky-500/20",
          "bg-teal-400/20 dark:bg-teal-500/15",
          "bg-emerald-400/20 dark:bg-emerald-500/15"
        ],
        iconClass: "text-sky-500 dark:text-sky-400 animate-[spin_30s_linear_infinite]"
      };
    }
    return {
      greeting: "Good Evening",
      subtitle: "Reviewing your corporate consulting accounts and deliverables.",
      badge: "🌙 Twilight Mode",
      icon: Moon,
      glowColor: "160, 160, 160",
      themeClass: "from-indigo-50/90 via-purple-50/85 to-pink-50/80 dark:from-[#0b0c16]/95 dark:via-[#110d1f]/90 dark:to-[#1a0c20]/85 border-purple-200/40 dark:border-purple-500/20",
      textGradient: "from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-200 dark:via-purple-200 dark:to-pink-300",
      badgeClass: "bg-purple-600/10 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300 border-purple-600/15 dark:border-purple-400/20",
      orbColors: [
        "bg-indigo-400/25 dark:bg-indigo-600/20",
        "bg-purple-400/20 dark:bg-purple-600/15",
        "bg-pink-400/20 dark:bg-pink-600/15"
      ],
      iconClass: "text-purple-500 dark:text-purple-400"
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
        // Fetch consultants
        const consRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${activeCompany.id}/consultants`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (consRes.ok) setConsultants(await consRes.json());

        // Fetch documents
        const docsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${activeCompany.id}/documents`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (docsRes.ok) setDocuments(await docsRes.json());

        // Fetch announcements
        const annRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/announcements`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (annRes.ok) setAnnouncements(await annRes.json());

        // Fetch conversations
        const convRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (convRes.ok) setConversations(await convRes.json());

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [clientProfile, activeCompany, contextLoading]);

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

  const primaryConsultant = consultants.find(c => c.is_primary) || consultants[0];
  const recentDocs = documents.slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 3);

  const clientCards: BentoCardItem[] = [
    {
      label: "My Consultants",
      icon: Users,
      onClick: () => router.push("/client/consultants"),
      className: "cursor-pointer",
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{consultants.length}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Dedicated professionals</p>
        </div>
      )
    },
    {
      label: "Active Chats",
      icon: MessageSquare,
      onClick: () => router.push("/client/chat"),
      className: "cursor-pointer",
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{conversations.length}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Open message threads</p>
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
  ];

  const startChatWithConsultant = async (consultantId: number) => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          company_id: activeCompany.id,
          employee_id: consultantId
        })
      });
      if (response.ok) {
        router.push("/client/chat");
      }
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      {(() => {
        const greetingData = getGreetingData();
        const GreetingIcon = greetingData.icon;
        return (
          <BentoCard
            className="!relative !overflow-hidden p-6 sm:p-8 text-slate-800 dark:text-slate-100 shadow-2xl animate-scale-in bg-gradient-to-br from-zinc-100 via-slate-100/80 to-zinc-200/60 dark:from-[#030712] dark:via-[#09152b] dark:to-[#030712] border !border-zinc-200/80 dark:!border-slate-800/40"
            particleCount={25}
            glowColor={glowColor}
          >
            {/* Ambient Animated Floating Orbs */}
            <div className="absolute top-[-50%] right-[-10%] w-[380px] h-[380px] rounded-full blur-[95px] pointer-events-none -z-10 animate-float-slow bg-zinc-300/30 dark:bg-sky-500/5" />
            <div className="absolute bottom-[-30%] left-[20%] w-[320px] h-[320px] rounded-full blur-[80px] pointer-events-none -z-10 animate-float-reverse bg-slate-300/25 dark:bg-indigo-500/5" />
            <div className="absolute top-[20%] left-[-10%] w-[260px] h-[260px] rounded-full blur-[70px] pointer-events-none -z-10 animate-float-slow bg-zinc-200/25 dark:bg-blue-500/5" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-4 max-w-2xl">
                <Badge className="bg-zinc-500/10 dark:bg-sky-500/10 text-zinc-700 dark:text-sky-300 border border-zinc-500/20 dark:border-sky-500/15 px-3 py-1 text-xs backdrop-blur-md rounded-full font-semibold flex items-center gap-1.5 w-fit">
                  <GreetingIcon className="h-4 w-4 text-zinc-600 dark:text-sky-400 animate-pulse" />
                  <span>{greetingData.badge}</span>
                </Badge>
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-zinc-700 via-slate-700 to-zinc-900 dark:from-sky-300 dark:via-blue-200 dark:to-indigo-300 pb-1">
                    {greetingData.greeting}, {clientProfile?.contact_person || "Partner"}
                  </h1>
                  <p className="text-zinc-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
                    {greetingData.subtitle} Manage your corporate accounts, access files, check notifications, and connect directly with your dedicated consultants.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40 hover:bg-zinc-50/50 dark:hover:bg-white/10">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-sky-400 uppercase tracking-wider block">Company</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{activeCompany?.name || "Corporate Partner"}</span>
                  </div>
                  <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40 hover:bg-zinc-50/50 dark:hover:bg-white/10">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-sky-400 uppercase tracking-wider block">Account Type</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">Partner Portal</span>
                  </div>
                  <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40 hover:bg-zinc-50/50 dark:hover:bg-white/10">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-sky-400 uppercase tracking-wider block">Assigned Advisors</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{consultants.length} Dedicated</span>
                  </div>
                </div>
              </div>

              <div className="h-28 w-28 rounded-2xl border-2 border-zinc-300/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md flex items-center justify-center text-4xl font-extrabold text-zinc-700 dark:text-white shadow-xl overflow-hidden shrink-0 group self-center sm:self-start transition-all duration-300 hover:rotate-2 hover:scale-105">
                {clientProfile?.company?.logo ? (
                  <img src={resolveImageUrl(clientProfile.company.logo)} alt="Logo" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
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
        glowColor={resolvedTheme === "dark" ? "255, 255, 255" : "0, 0, 0"}
        disableAnimations={false}
      />

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Side: Announcements & Quick Actions */}
        <div className="md:col-span-7 space-y-6">
          {/* Announcements Card */}
          <BentoCard className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/30 bg-muted/20">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">Latest Announcements</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">General updates and holiday calendars</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href="/client/announcements" className="flex items-center gap-1">
                  View All <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {recentAnnouncements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  <Megaphone className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs">No announcements bulletin posted yet.</p>
                </div>
              ) : (
                recentAnnouncements.map((ann) => (
                  <div key={ann.id} className="flex flex-col gap-1 p-3 rounded-lg border border-border/30 hover:border-primary/20 hover:bg-white/5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground line-clamp-1">{ann.title}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ann.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </BentoCard>

          {/* Quick Actions */}
          <BentoCard className="flex flex-col h-full">
            <CardHeader className="border-b border-border/30 bg-muted/20 pb-3">
              <CardTitle className="text-lg font-bold">Quick Workspace Actions</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Frequently accessed utilities</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 pt-4">
              {[
                { name: "Consultants Chat", desc: "Chat directly with advisors", link: "/client/chat", icon: MessageSquare },
                { name: "Download Forms", desc: "View all contract documents", link: "/client/documents", icon: Download },
                { name: "My Advisors", desc: "Contact assigned consultants", link: "/client/consultants", icon: Users },
                { name: "Company Profile", desc: "Update corporate metadata", link: "/client/profile", icon: User }
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <Link href={act.link} key={i}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                          {act.name} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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

        {/* Right Side: Primary Consultant & Recent Documents */}
        <div className="md:col-span-5 space-y-6">
          {/* Dedicated Advisor */}
          <BentoCard className="flex flex-col h-full overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
              <CardTitle className="text-lg font-bold">Primary Consultant</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Your dedicated corporate partner account manager</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {primaryConsultant ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {primaryConsultant.profile_photo ? (
                      <img
                        src={resolveImageUrl(primaryConsultant.profile_photo)}
                        alt={primaryConsultant.first_name}
                        className="h-16 w-16 rounded-xl object-cover border border-white/10"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold text-xl border border-primary/10">
                        {primaryConsultant.first_name[0]}
                      </div>
                    )}
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground">{primaryConsultant.first_name} {primaryConsultant.last_name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium inline-block">
                        {primaryConsultant.job_title || "Consultant"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-border/40 text-xs">
                    {primaryConsultant.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-foreground truncate">{primaryConsultant.email}</span>
                      </div>
                    )}
                    {primaryConsultant.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{primaryConsultant.phone}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full mt-4 flex items-center justify-center gap-2"
                    onClick={() => startChatWithConsultant(primaryConsultant.id)}
                  >
                    <MessageSquare className="h-4 w-4" /> Message Consultant
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  <ShieldAlert className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs font-semibold">No Consultant Assigned Yet</p>
                  <p className="text-[10px] text-muted-foreground mt-1 px-4">An administrator will assign your primary account manager shortly.</p>
                </div>
              )}
            </CardContent>
          </BentoCard>

          {/* Recent Documents */}
          <BentoCard className="flex flex-col h-full overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/30 bg-muted/20">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">Recent Documents</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Files uploaded for your company review</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href="/client/documents" className="flex items-center gap-1">
                  All Files <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {recentDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                  <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs">No shared documents found.</p>
                </div>
              ) : (
                recentDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border border-border/30 hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">{doc.file_name}</span>
                        <span className="text-[9px] text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}${doc.file_url}`} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
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
