"use client";

import React from "react";
import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";

interface DashboardChartsProps {
  employeeGrowth: any[];
  attendanceTrend: any[];
  leaveDist: any[];
  deptHeadcount: any[];
  colors: string[];
}

export default function DashboardCharts({ 
  employeeGrowth, 
  attendanceTrend, 
  leaveDist, 
  deptHeadcount, 
  colors 
}: DashboardChartsProps) {
  return (
    <div className="space-y-8">
      {/* CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Growth AreaChart */}
        <div className="border border-border/40 shadow-lg rounded-xl bg-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-1">Employee Growth Matrix</h3>
          <p className="text-xs text-muted-foreground mb-6">Headcount trend over the last 12 months</p>
          <div className="h-[260px]">
            {employeeGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={employeeGrowth} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} dx={-5} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#growthGradient)" dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">No data available</div>
            )}
          </div>
        </div>

        {/* Attendance Trend BarChart */}
        <div className="border border-border/40 shadow-lg rounded-xl bg-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-1">Attendance Engagement Index</h3>
          <p className="text-xs text-muted-foreground mb-6">Daily attendance percentage (Last 30 Days)</p>
          <div className="h-[260px]">
            {attendanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} dx={-5} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)' }}
                    formatter={(value) => [`${value}%`, 'Attendance']}
                  />
                  <Bar dataKey="percentage" fill="url(#attendanceGradient)" radius={[6, 6, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Distribution DonutChart */}
        <div className="border border-border/40 shadow-lg rounded-xl bg-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-1">Leave Distribution Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-6">Approved leave types comparison</p>
          <div className="h-[260px]">
            {leaveDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={4}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leaveDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="var(--background)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--muted-foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">No data available</div>
            )}
          </div>
        </div>

        {/* Department Headcount DonutChart */}
        <div className="border border-border/40 shadow-lg rounded-xl bg-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-1">Department Headcount Ratio</h3>
          <p className="text-xs text-muted-foreground mb-6">Employee allocation metrics</p>
          <div className="h-[260px]">
            {deptHeadcount.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptHeadcount}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={4}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deptHeadcount.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="var(--background)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--muted-foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
