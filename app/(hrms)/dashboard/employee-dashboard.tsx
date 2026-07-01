"use client";

import { useEffect, useState } from "react";
import CalendarWidget from "@/components/calendar-widget";
import {
  CalendarOff, Laptop, Download, CheckCircle, Clock3,
  User, Briefcase, Building, Calendar, Sunrise, Sun, Moon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MagicBento, { BentoCardItem, BentoCard } from "@/components/magic-bento";
import { useTheme } from "next-themes";
import { useUser } from "@/contexts/user-context";
import { resolveImageUrl } from "@/lib/utils";

export default function EmployeeDashboard() {
  const { resolvedTheme } = useTheme();
  const glowColor = resolvedTheme === "dark" ? "14, 165, 233" : "148, 163, 184";
  const [data, setData] = useState<any>({
    leave_balances: { annual: 0, sick: 0 },
    attendance_pct: 0,
    pending_leaves: 0,
    assigned_assets: [],
    leave_history: [],
    latest_payslip: null,
    recent_timesheets: []
  });
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);

  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good Morning",
        subtitle: "Start your day with purpose and clarity.",
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
        subtitle: "Stay focused, creative, and productive.",
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
      subtitle: "Reviewing your progress for the day.",
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

  const handleDownloadPayslip = async (id: number, monthStr: string, empId: string) => {
    try {
      const token = localStorage.getItem("hrms_token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payroll/${id}/download`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Parse monthStr (e.g. "May 2026") into mm and yyyy
        const monthMatch = monthStr.match(/([a-zA-Z]+)\s+(\d{4})/);
        let mm = "00";
        let yyyy = "0000";
        if (monthMatch) {
          const monthIndex = new Date(Date.parse(monthMatch[1] + " 1, 2012")).getMonth() + 1;
          mm = monthIndex.toString().padStart(2, '0');
          yyyy = monthMatch[2];
        }

        a.download = `${mm}${yyyy}_${empId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        console.error("Failed to download payslip");
      }
    } catch (error) {
      console.error("Error downloading payslip:", error);
    }
  };

  useEffect(() => {
    // Load cached dashboard data for instant render
    const cached = localStorage.getItem("hrms_employee_dashboard_data");
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLoading(false);
      } catch (e) {}
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        const headers = { "Authorization": `Bearer ${token}` };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/employee`, { headers });

        if (response.ok) {
          const freshData = await response.json();
          setData(freshData);
          localStorage.setItem("hrms_employee_dashboard_data", JSON.stringify(freshData));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex h-[400px] items-center justify-center rounded-xl border border-border/50 bg-card/30 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground text-sm">Aggregating workforce metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  const employeeCards: BentoCardItem[] = [
    {
      label: "Annual Leave Balance",
      icon: CalendarOff,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{data.leave_balances.annual}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Days remaining in your annual allocation</p>
        </div>
      )
    },
    {
      label: "Attendance (This Month)",
      icon: CheckCircle,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{data.attendance_pct}%</div>
          <p className="text-[10px] text-muted-foreground mt-1">Based on standard working days</p>
        </div>
      )
    },
    {
      label: "Pending Leaves",
      icon: Clock3,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{data.pending_leaves}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Awaiting coordinator response</p>
        </div>
      )
    },
    {
      label: "Assigned Assets",
      icon: Laptop,
      children: (
        <div className="mt-2 w-full">
          <div className="flex flex-wrap gap-1.5 mt-1 max-h-[48px] overflow-y-auto">
            {data.assigned_assets.length > 0 ? (
              data.assigned_assets.map((asset: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="bg-secondary/40 text-[10px] px-2 py-0.5 border border-border/20 font-medium">
                  {asset}
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic mt-1">No assets assigned</p>
            )}
          </div>
          <p className="text-[9px] text-muted-foreground mt-2">Active devices registered to you</p>
        </div>
      )
    }
  ];

  return (
    <div className="flex-1 space-y-8 pb-10">

      {/* 1. VISUAL WELCOMING BANNER */}
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
                    {greetingData.greeting}, {profile ? `${profile.first_name} ${profile.last_name}` : "Team Member"}
                  </h1>
                  <p className="text-zinc-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
                    {greetingData.subtitle} You have <span className="font-bold text-zinc-950 dark:text-sky-300 underline decoration-zinc-500/30 dark:decoration-sky-400/30 underline-offset-4">{data.pending_leaves || 0} pending leave requests</span> and your attendance is at <span className="font-bold text-zinc-950 dark:text-sky-300 underline decoration-zinc-500/30 dark:decoration-sky-400/30 underline-offset-4">{data.attendance_pct || 0}%</span> this month.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40 hover:bg-zinc-50/50 dark:hover:bg-white/10">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-sky-400 uppercase tracking-wider block">Custom ID</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{profile?.employee_id_custom || `EMP-${profile?.id?.toString().padStart(4, '0')}`}</span>
                  </div>
                  <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40 hover:bg-zinc-50/50 dark:hover:bg-white/10">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-sky-400 uppercase tracking-wider block">Department</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{profile?.department?.name || "Unassigned"}</span>
                  </div>
                  <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40 hover:bg-zinc-50/50 dark:hover:bg-white/10">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-sky-400 uppercase tracking-wider block">Designation</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{profile?.user?.role?.name || "Team Member"}</span>
                  </div>
                </div>
              </div>

              <div className="h-28 w-28 rounded-2xl border-2 border-zinc-300/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md flex items-center justify-center text-4xl font-extrabold text-zinc-700 dark:text-white shadow-xl overflow-hidden shrink-0 group self-center sm:self-start transition-all duration-300 hover:rotate-2 hover:scale-105">
                {profile?.profile_photo ? (
                  <img src={resolveImageUrl(profile.profile_photo)} alt="Profile" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`
                )}
              </div>
            </div>
          </BentoCard>
        );
      })()}

      {/* 2. KPI CARDS */}
      <MagicBento
        cards={employeeCards}
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

      {/* 3. WORKFORCE PLANNING CALENDAR (Full Width) */}
      <div className="grid grid-cols-1">
        <CalendarWidget />
      </div>

      {/* 4. MAIN WIDGET GRID (Leave History, Timesheet Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Leave History Table */}
        <BentoCard className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/30 bg-muted/20">
            <div>
              <CardTitle className="text-lg font-bold">My Leave History</CardTitle>
              <CardDescription>Your 5 most recent leave applications</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/40">
                  <tr>
                    <th className="px-5 py-4 font-semibold tracking-wider">Leave Type</th>
                    <th className="px-5 py-4 font-semibold tracking-wider text-center">Days</th>
                    <th className="px-5 py-4 font-semibold tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {data.leave_history.length > 0 ? data.leave_history.map((leave: any, idx: number) => (
                    <tr key={idx} className="table-row-hover hover:bg-muted/20">
                      <td className="px-5 py-4 font-bold text-foreground">{leave.type}</td>
                      <td className="px-5 py-4 text-center font-semibold text-muted-foreground">{leave.days}</td>
                      <td className="px-5 py-4 text-right">
                        <Badge
                          variant="outline"
                          className={`px-2.5 py-0.5 border text-xs font-semibold ${leave.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              leave.status === "REJECTED" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }`}
                        >
                          {leave.status}
                        </Badge>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground text-sm italic">No leave history found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </BentoCard>

        {/* Timesheet Status Table */}
        <BentoCard className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/30 bg-muted/20">
            <div>
              <CardTitle className="text-lg font-bold">My Recent Timesheets</CardTitle>
              <CardDescription>Your 5 most recent timesheet submissions</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/40">
                  <tr>
                    <th className="px-5 py-4 font-semibold tracking-wider">Week Starting</th>
                    <th className="px-5 py-4 font-semibold tracking-wider text-center">Total Hours</th>
                    <th className="px-5 py-4 font-semibold tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {data.recent_timesheets.length > 0 ? data.recent_timesheets.map((ts: any, idx: number) => (
                    <tr key={idx} className="table-row-hover hover:bg-muted/20">
                      <td className="px-5 py-4 font-bold text-foreground">{ts.week_start}</td>
                      <td className="px-5 py-4 text-center font-bold text-primary">{ts.total_hours}h</td>
                      <td className="px-5 py-4 text-right">
                        <Badge
                          variant="outline"
                          className={`px-2.5 py-0.5 border text-xs font-semibold ${ts.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              ts.status === "REJECTED" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                ts.status === "SUBMITTED" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                  "bg-slate-500/10 text-slate-500 border-slate-500/20"
                            }`}
                        >
                          {ts.status}
                        </Badge>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground text-sm italic">No recent timesheets found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </BentoCard>
      </div>
    </div>
  );
}
