"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Award, TrendingUp, CheckCircle2, AlertTriangle, 
  Target, BarChart2, PieChart as PieIcon, ClipboardCheck
} from "lucide-react";
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

interface PerformanceDashboardTabProps {
  stats: {
    pending_reviews?: number;
    completed_reviews?: number;
    needing_improvement?: number;
    top_performers?: number;
    upcoming_goals?: any[];
    department_summary?: any[];
    ratings_distribution?: any[];
    goals_status_distribution?: any[];
  };
}

export default function PerformanceDashboardTab({ stats }: PerformanceDashboardTabProps) {
  const ratings = stats.ratings_distribution || [];
  const goalsStatus = stats.goals_status_distribution || [];
  const deptSummary = stats.department_summary || [];
  const upcomingGoals = stats.upcoming_goals || [];

  // Colors for charts
  const ratingColors: Record<string, string> = {
    "Excellent": "#10b981",       // emerald
    "Good": "#3b82f6",            // blue
    "Average": "#eab308",         // yellow
    "Needs Improvement": "#f97316", // orange
    "Poor": "#ef4444"             // red
  };
  
  const ratingColorsArray = [
    "#10b981", // Excellent
    "#3b82f6", // Good
    "#eab308", // Average
    "#f97316", // Needs Improvement
    "#ef4444"  // Poor
  ];

  const goalColors: Record<string, string> = {
    "Completed": "#10b981",
    "In Progress": "#3b82f6",
    "Not Started": "#94a3b8"
  };

  const goalColorsArray = ["#94a3b8", "#3b82f6", "#10b981"]; // Not Started, In Progress, Completed

  const totalReviews = (stats.completed_reviews || 0) + (stats.pending_reviews || 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Completed Evaluations */}
        <Card className="border-border/40 shadow-md bg-card/40 backdrop-blur-md relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed Reviews</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <ClipboardCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.completed_reviews || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>Out of {totalReviews} total cycles</span>
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Top Performers */}
        <Card className="border-border/40 shadow-md bg-card/40 backdrop-blur-md relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 dark:bg-blue-500/5 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Performers</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Award className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.top_performers || 0}</div>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1">
              Rating Excellent / Good
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Needing Focus */}
        <Card className="border-border/40 shadow-md bg-card/40 backdrop-blur-md relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 bg-orange-500/5 dark:bg-orange-500/5 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Underperforming</span>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.needing_improvement || 0}</div>
            <p className="text-[10px] text-orange-500 font-semibold mt-1">
              Requires training / coaching
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Pending evaluations */}
        <Card className="border-border/40 shadow-md bg-card/40 backdrop-blur-md relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Evaluations</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{stats.pending_reviews || 0}</div>
            <p className="text-[10px] text-indigo-500 font-semibold mt-1">
              Saved in Draft state
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart A: Evaluations Distribution */}
        <Card className="border-border/40 shadow-lg bg-card/40 backdrop-blur-md p-6">
          <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-1.5">
            <BarChart2 className="h-5 w-5 text-primary" /> Evaluation Ratings Distribution
          </h3>
          <p className="text-xs text-muted-foreground mb-6">Breakdown of submitted employee performance ratings</p>
          
          <div className="h-[280px]">
            {ratings.some(r => r.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} dx={-5} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {ratings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ratingColors[entry.name] || "var(--primary)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">No finalized reviews recorded to chart.</div>
            )}
          </div>
        </Card>

        {/* Chart B: Goals Status breakdown */}
        <Card className="border-border/40 shadow-lg bg-card/40 backdrop-blur-md p-6">
          <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-1.5">
            <PieIcon className="h-5 w-5 text-indigo-500" /> Goal Completion Progress
          </h3>
          <p className="text-xs text-muted-foreground mb-6">Status breakdown for all tracked review goals</p>
          
          <div className="h-[280px]">
            {goalsStatus.some(g => g.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalsStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {goalsStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={goalColors[entry.name] || "#94a3b8"} stroke="var(--background)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--muted-foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">No goals created yet.</div>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Lower Row: Department Summary & Upcoming Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Department Completion Summary */}
        <Card className="border-border/40 shadow-md bg-card/40 backdrop-blur-md p-6 lg:col-span-1 flex flex-col">
          <div className="mb-4">
            <h3 className="text-md font-bold text-foreground flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-emerald-500" /> Department Summary
            </h3>
            <p className="text-[11px] text-muted-foreground">Completed evaluation reviews per department</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px]">
            {deptSummary.length > 0 ? (
              deptSummary.map((dept, index) => (
                <div key={index} className="space-y-1.5 border-b border-border/10 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{dept.department_name}</span>
                    <Badge variant="outline" className="font-bold text-[10px] bg-primary/5 text-primary border-primary/10">
                      {dept.completed_reviews} Finished
                    </Badge>
                  </div>
                  <Progress value={dept.completed_reviews > 0 ? Math.min(dept.completed_reviews * 25, 100) : 0} className="h-1.5 bg-muted" />
                </div>
              ))
            ) : (
              <p className="text-xs italic text-muted-foreground text-center py-8">No department aggregates found.</p>
            )}
          </div>
        </Card>

        {/* Column 2 & 3: Upcoming / In Progress Goals */}
        <Card className="border-border/40 shadow-md bg-card/40 backdrop-blur-md p-6 lg:col-span-2 flex flex-col">
          <div className="mb-4">
            <h3 className="text-md font-bold text-foreground flex items-center gap-1.5">
              <Target className="h-4 w-4 text-primary" /> Active Workforce Goals
            </h3>
            <p className="text-[11px] text-muted-foreground">List of active goals with deadline targets</p>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/30">
                <tr>
                  <th className="px-4 py-3 font-semibold">Goal Objective</th>
                  <th className="px-4 py-3 font-semibold">Assignee</th>
                  <th className="px-4 py-3 font-semibold text-center">Progress</th>
                  <th className="px-4 py-3 font-semibold text-right">Target Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/15">
                {upcomingGoals.length > 0 ? upcomingGoals.map((goal: any) => (
                  <tr key={goal.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 font-bold text-foreground max-w-[200px] truncate">{goal.title}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{goal.employee_name}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 max-w-[120px] mx-auto">
                        <Progress value={goal.progress_pct} className="h-1.5 w-16 bg-muted" />
                        <span className="text-xs font-semibold">{goal.progress_pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">{goal.target_date || "N/A"}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-xs italic">No active employee goals registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        
      </div>
    </div>
  );
}
