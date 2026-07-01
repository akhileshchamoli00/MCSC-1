"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/user-context";
import CalendarWidget from "@/components/calendar-widget";
import { resolveImageUrl } from "@/lib/utils";
import {
  Users, UserCheck, CalendarOff, Clock, Download, Sunrise, Sun, Moon
} from "lucide-react";
const PerformanceDashboardTab = dynamic(() => import("@/components/performance-dashboard-tab"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-xs">Loading performance statistics...</p>
      </div>
    </div>
  )
});
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MagicBento, { BentoCardItem, BentoCard } from "@/components/magic-bento";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

const DashboardCharts = dynamic(() => import("@/components/dashboard-charts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-xs">Loading analytics dashboard...</p>
      </div>
    </div>
  )
});

export default function AdminDashboard() {
  const { resolvedTheme } = useTheme();
  const glowColor = resolvedTheme === "dark" ? "14, 165, 233" : "148, 163, 184";
  const [kpis, setKpis] = useState<any>({});
  const [employeeGrowth, setEmployeeGrowth] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [leaveDist, setLeaveDist] = useState([]);
  const [deptHeadcount, setDeptHeadcount] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [pendingTimesheets, setPendingTimesheets] = useState([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [perfStats, setPerfStats] = useState<any>({});
  const { profile } = useUser();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Filters
  const [dateFilter, setDateFilter] = useState("this-month");
  const [deptFilter, setDeptFilter] = useState("all");

  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good Morning",
        subtitle: "Review your enterprise operations for the day ahead.",
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
        subtitle: "Keep operations active, aligned, and optimized.",
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
      subtitle: "Monitoring system activity and coordinator queues.",
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
    // Load cached dashboard data for instant render
    const cached = localStorage.getItem("hrms_admin_dashboard_data");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setKpis(parsed.kpis || {});
        setEmployeeGrowth(parsed.employeeGrowth || []);
        setAttendanceTrend(parsed.attendanceTrend || []);
        setLeaveDist(parsed.leaveDist || []);
        setDeptHeadcount(parsed.deptHeadcount || []);
        setRecentLeaves(parsed.recentLeaves || []);
        setPendingTimesheets(parsed.pendingTimesheets || []);
        setHolidays(parsed.holidays || []);
        setPerfStats(parsed.perfStats || {});
        setLoading(false);
      } catch (e) {}
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        const headers = { "Authorization": `Bearer ${token}` };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/admin-summary`, { headers });
        if (res.ok) {
          const data = await res.json();
          
          const freshKpis = data.kpis || {};
          const freshGrowth = data.employee_growth || [];
          const freshAtt = data.attendance_trend || [];
          const freshLeaveDist = data.leave_distribution || [];
          const freshDept = data.department_headcount || [];
          const freshLeaves = data.recent_leaves || [];
          const freshTs = data.pending_timesheets || [];
          const freshHolidays = data.upcoming_holidays || [];
          const freshPerf = data.performance_stats || {};

          setKpis(freshKpis);
          setEmployeeGrowth(freshGrowth);
          setAttendanceTrend(freshAtt);
          setLeaveDist(freshLeaveDist);
          setDeptHeadcount(freshDept);
          setRecentLeaves(freshLeaves);
          setPendingTimesheets(freshTs);
          setHolidays(freshHolidays);
          setPerfStats(freshPerf);

          // Save to cache
          localStorage.setItem("hrms_admin_dashboard_data", JSON.stringify({
            kpis: freshKpis,
            employeeGrowth: freshGrowth,
            attendanceTrend: freshAtt,
            leaveDist: freshLeaveDist,
            deptHeadcount: freshDept,
            recentLeaves: freshLeaves,
            pendingTimesheets: freshTs,
            holidays: freshHolidays,
            perfStats: freshPerf
          }));
        } else {
          console.error("Failed to fetch consolidated dashboard data:", res.status);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateFilter, deptFilter]);

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

  const adminCards: BentoCardItem[] = [
    {
      label: "Total Employees",
      icon: Users,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{kpis.total_employees || 0}</div>
          <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
            <span>+2 from last month</span>
          </p>
        </div>
      )
    },
    {
      label: "Present Today",
      icon: UserCheck,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{kpis.present_today || 0}</div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {kpis.total_employees ? Math.round(((kpis.present_today || 0) / kpis.total_employees) * 100) : 0}% attendance
          </p>
        </div>
      )
    },
    {
      label: "On Leave Today",
      icon: CalendarOff,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{kpis.on_leave || 0}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Absence schedule active</p>
        </div>
      )
    },
    {
      label: "Pending Leaves",
      icon: Clock,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{kpis.pending_leaves || 0}</div>
          <p className="text-[10px] text-indigo-500 font-semibold mt-1">Awaiting decision</p>
        </div>
      )
    },
    {
      label: "Pending Sheets",
      icon: Clock,
      children: (
        <div className="mt-2 w-full">
          <div className="text-3xl font-extrabold text-foreground">{kpis.pending_timesheets_count || 0}</div>
          <p className="text-[10px] text-cyan-500 font-semibold mt-1">Awaiting approval</p>
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
                    {greetingData.greeting}, {profile ? `${profile.first_name} ${profile.last_name}` : "Admin"}
                  </h1>
                  <p className="text-zinc-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
                    {greetingData.subtitle} You have <span className="font-bold text-zinc-950 dark:text-sky-300 underline decoration-zinc-500/30 dark:decoration-sky-400/30 underline-offset-4">{kpis.pending_leaves || 0} pending leave requests</span> and <span className="font-bold text-zinc-950 dark:text-sky-300 underline decoration-zinc-500/30 dark:decoration-sky-400/30 underline-offset-4">{kpis.pending_timesheets_count || 0} timesheets</span> that require action today.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40 hover:bg-zinc-50/50 dark:hover:bg-white/10">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-sky-400 uppercase tracking-wider block">Active Staff</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{kpis.total_employees || 0}</span>
                  </div>
                  <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40 hover:bg-zinc-50/50 dark:hover:bg-white/10">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-sky-400 uppercase tracking-wider block">Attendance Rate</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">
                      {kpis.total_employees ? Math.round(((kpis.present_today || 0) / kpis.total_employees) * 100) : 0}%
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-zinc-400/40 hover:bg-zinc-50/50 dark:hover:bg-white/10">
                    <span className="text-[10px] font-bold text-zinc-600 dark:text-sky-400 uppercase tracking-wider block">Designation</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 block">{profile?.user?.role?.name || "System Admin"}</span>
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

      {/* 2. FILTERS & NAVIGATION TABS ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/40 backdrop-blur-xl p-4 rounded-xl border border-border/40 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="h-10 w-full md:w-auto grid grid-cols-4 md:flex bg-muted/60 p-1">
            <TabsTrigger value="overview" className="h-8 text-xs font-semibold px-4">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="h-8 text-xs font-semibold px-4">Analytics</TabsTrigger>
            <TabsTrigger value="performance" className="h-8 text-xs font-semibold px-4">Performance</TabsTrigger>
            <TabsTrigger value="reports" className="h-8 text-xs font-semibold px-4">Reports</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[180px] h-10 border-border/60 bg-background/50 text-xs">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="hr">Human Resources</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="it">IT & Engineering</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[160px] h-10 border-border/60 bg-background/50 text-xs">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-10 text-xs font-semibold gap-1.5 hidden sm:flex border-border/60 bg-background/50 hover:bg-muted/80">
            <Download className="h-4 w-4 text-muted-foreground" /> Export
          </Button>
        </div>
      </div>

      {/* CATEGORY: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* ROW 1 - KPI CARDS */}
          <MagicBento
            cards={adminCards}
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
            gridClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 w-full"
          />

          {/* ROW 2 - WORKFORCE PLANNING CALENDAR */}
          <div className="grid grid-cols-1">
            <CalendarWidget />
          </div>

        </div>
      )}

      {/* CATEGORY: ANALYTICS (Gradients & Glowing Charts) */}
      {activeTab === "analytics" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DashboardCharts
            employeeGrowth={employeeGrowth}
            attendanceTrend={attendanceTrend}
            leaveDist={leaveDist}
            deptHeadcount={deptHeadcount}
            colors={COLORS}
          />
        </div>
      )}

      {/* CATEGORY: PERFORMANCE (Talent Evaluations & Goals Matrix) */}
      {activeTab === "performance" && (
        <PerformanceDashboardTab stats={perfStats} />
      )}

      {/* CATEGORY: REPORTS (Premium Tables) */}
      {activeTab === "reports" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Leave Requests Card */}
            <BentoCard className="flex flex-col h-full overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/30 bg-muted/20">
                <div>
                  <CardTitle className="text-lg font-bold">Recent Leave Requests</CardTitle>
                  <CardDescription>Latest employee leave filings</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs hover:bg-muted/80">Filter Leaves</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/40">
                      <tr>
                        <th className="px-5 py-4 font-semibold tracking-wider">Employee</th>
                        <th className="px-5 py-4 font-semibold tracking-wider">Leave Type</th>
                        <th className="px-5 py-4 font-semibold tracking-wider text-center">Days</th>
                        <th className="px-5 py-4 font-semibold tracking-wider text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {recentLeaves.length > 0 ? recentLeaves.map((leave: any) => (
                        <tr key={leave.id} className="table-row-hover hover:bg-muted/20">
                          <td className="px-5 py-4 font-bold text-foreground">{leave.employee_name}</td>
                          <td className="px-5 py-4 text-muted-foreground font-medium">{leave.leave_type}</td>
                          <td className="px-5 py-4 text-center font-semibold">{leave.days}</td>
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
                          <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-sm italic">No recent leave requests recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </BentoCard>

            {/* Pending Timesheets Card */}
            <BentoCard className="flex flex-col h-full overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/30 bg-muted/20">
                <div>
                  <CardTitle className="text-lg font-bold">Pending Timesheets</CardTitle>
                  <CardDescription>Timesheets awaiting coordinator approval</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs hover:bg-muted/80">Batch Approval</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/40">
                      <tr>
                        <th className="px-5 py-4 font-semibold tracking-wider">Employee</th>
                        <th className="px-5 py-4 font-semibold tracking-wider">Week Starting</th>
                        <th className="px-5 py-4 font-semibold tracking-wider text-center">Total Hours</th>
                        <th className="px-5 py-4 font-semibold tracking-wider text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {pendingTimesheets.length > 0 ? pendingTimesheets.map((ts: any) => (
                        <tr key={ts.id} className="table-row-hover hover:bg-muted/20">
                          <td className="px-5 py-4 font-bold text-foreground">{ts.employee_name}</td>
                          <td className="px-5 py-4 text-muted-foreground font-medium">{ts.week_start}</td>
                          <td className="px-5 py-4 text-center font-bold text-primary">{ts.total_hours}h</td>
                          <td className="px-5 py-4 text-right">
                            <Badge
                              variant="outline"
                              className="px-2.5 py-0.5 border text-xs font-semibold bg-amber-500/10 text-amber-500 border-amber-500/20"
                            >
                              {ts.status}
                            </Badge>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-sm italic">No pending timesheets awaiting review.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </BentoCard>
          </div>
        </div>
      )}

    </div>
  );
}
