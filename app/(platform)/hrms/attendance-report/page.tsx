"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  ArrowLeft,
  ArrowRight,
  Download,
  Building2,
  CalendarDays,
  Users,
  Clock,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";
import { KpiCard } from "@/components/kpi-card";

export default function ConsolidatedAttendanceReport() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-indexed
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Month options mapping
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Year options
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  // Fetch departments
  useEffect(() => {
    const fetchDepts = async () => {
      try {

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments/`, {
      credentials: "include",
          });
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
    fetchDepts();
  }, []);

  // Fetch report data
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {

      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/monthly-report?year=${selectedYear}&month=${selectedMonth}`;
      if (selectedDept !== "all") {
        url += `&department_id=${selectedDept}`;
      }

      const res = await fetch(url, {
      credentials: "include",
        });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to fetch attendance report.");
      }

      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedYear, selectedMonth, selectedDept]);

  // Navigate back/forth months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData || !reportData.employees || reportData.employees.length === 0) return;

    const headers = [
      "Custom ID",
      "Employee Name",
      "Department",
      "Job Title",
      "Present Count",
      "Late Count",
      "Half Day Count",
      "Absent Count",
      "Leave Count",
      "Holiday Count",
      "Weekend Count",
      ...Array.from({ length: reportData.days_in_month }, (_, i) => `Day ${i + 1}`)
    ];

    const rows = reportData.employees.map((emp: any) => [
      emp.employee_id_custom || "",
      `${emp.first_name} ${emp.last_name}`,
      emp.department,
      emp.job_title || "",
      emp.summary.present,
      emp.summary.late,
      emp.summary.half_day,
      emp.summary.absent,
      emp.summary.leave,
      emp.summary.holiday,
      emp.summary.weekend,
      ...emp.days.map((day: any) => day.status || "-")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Consolidated_Attendance_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Get weekday short name (Mon, Tue, etc.)
  const getDayOfWeekName = (dayNum: number) => {
    const d = new Date(selectedYear, selectedMonth - 1, dayNum);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  };

  // Filtering employees
  const filteredEmployees = reportData?.employees?.filter((emp: any) => {
    if (!searchTerm) return true;
    const name = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const customId = (emp.employee_id_custom || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || customId.includes(query);
  }) || [];

  // Summary Metrics calculations based on filtered list
  const totalEmployees = filteredEmployees.length;
  let overallPresent = 0;
  let overallLate = 0;
  let overallAbsent = 0;
  let overallLeave = 0;
  let overallHalfDay = 0;

  filteredEmployees.forEach((emp: any) => {
    overallPresent += emp.summary.present;
    overallLate += emp.summary.late;
    overallAbsent += emp.summary.absent;
    overallLeave += emp.summary.leave;
    overallHalfDay += emp.summary.half_day;
  });

  const totalWorkingDays = overallPresent + overallLate + overallHalfDay + overallAbsent;
  const attendanceRate = totalWorkingDays > 0 
    ? ((overallPresent + overallLate + overallHalfDay) / totalWorkingDays) * 100 
    : 0;

  return (
    <div className="w-full max-w-none space-y-6 animate-in fade-in duration-500 pb-16">
      
      {/* Minimalist Stat Ribbon & Controls Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Staff */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Staff</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalEmployees}</p>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Attendance Rate</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{attendanceRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Late Arrivals */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Late Arrivals</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{overallLate}</p>
            </div>
          </div>

          {/* Total Absences */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
              <XCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Absences</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{overallAbsent}</p>
            </div>
          </div>

          {/* Total Leaves */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Leaves</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{overallLeave}</p>
            </div>
          </div>
        </div>

        {/* Date Selector Controls & Export */}
        <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-1.5 shadow-xs min-h-[48px]">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 hover:bg-muted rounded-xl cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </Button>

            <div className="flex items-center gap-1 px-1">
              <Select
                value={String(selectedMonth)}
                onValueChange={(val) => setSelectedMonth(parseInt(val))}
              >
                <SelectTrigger className="h-8 w-28 border-none bg-transparent shadow-none hover:bg-muted/50 rounded-xl font-semibold text-xs focus:ring-0">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  {months.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)} className="text-xs cursor-pointer">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(selectedYear)}
                onValueChange={(val) => setSelectedYear(parseInt(val))}
              >
                <SelectTrigger className="h-8 w-20 border-none bg-transparent shadow-none hover:bg-muted/50 rounded-xl font-semibold text-xs focus:ring-0">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-xs cursor-pointer">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 hover:bg-muted rounded-xl cursor-pointer">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </Button>
          </div>

          <Button 
            onClick={handleExportCSV} 
            disabled={!reportData || !reportData.employees || reportData.employees.length === 0}
            className="h-full min-h-[48px] px-5 text-sm font-bold rounded-2xl gap-2 shadow-sm cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Matrix Table Card */}
      <TooltipProvider delayDuration={150}>
        <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
          <CardHeader className="border-b border-border/40 bg-muted/20 py-3.5 px-6 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <CardTitle className="text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                <CalendarDays className="w-4 h-4 text-emerald-500" />
                Attendance Matrix ({months.find((m) => m.value === selectedMonth)?.label} {selectedYear})
              </CardTitle>

              {/* Filters beside the Title */}
              <div className="flex items-center gap-2 max-w-md w-full">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search employee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
                  />
                </div>

                <div className="w-40 sm:w-48">
                  <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                      <SelectValue placeholder="All Depts" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50">
                      <SelectItem value="all" className="text-xs cursor-pointer">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={String(dept.id)} className="text-xs cursor-pointer">
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Grid Legend */}
            <div className="hidden xl:flex items-center gap-3.5 text-[11px] font-semibold text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Present (P)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Late (L)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Half Day (H)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Absent (A)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Leave (Le)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Holiday (Ho)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 inline-block" /> Weekend (We)
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-muted-foreground font-medium">Loading report records...</p>
              </div>
            ) : error ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2 text-rose-500">
                <AlertCircle className="w-8 h-8" />
                <p className="text-sm font-semibold">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchReport} className="mt-2 text-xs rounded-xl border-border/50">
                  Retry
                </Button>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-700 opacity-60" />
                <p className="text-xs font-medium">No employees found matching the filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-w-full">
                {/* Responsive Matrix Grid */}
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/40">
                      {/* Sticky Employee Details Columns */}
                      <th className="sticky left-0 bg-background/95 backdrop-blur-md z-20 px-4 py-3 min-w-[200px] border-r border-border/40 font-bold text-muted-foreground uppercase text-[10px] tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        Employee
                      </th>
                      <th className="px-4 py-3 min-w-[50px] border-r border-border/40 text-center font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        P
                      </th>
                      <th className="px-4 py-3 min-w-[50px] border-r border-border/40 text-center font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        L
                      </th>
                      <th className="px-4 py-3 min-w-[50px] border-r border-border/40 text-center font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                        H
                      </th>
                      <th className="px-4 py-3 min-w-[50px] border-r border-border/40 text-center font-bold text-muted-foreground uppercase text-[10px] tracking-wider" title="Approved Leaves">
                        Le
                      </th>
                      
                      {/* Days columns */}
                      {Array.from({ length: reportData.days_in_month }, (_, i) => i + 1).map((dayNum) => {
                        const dayName = getDayOfWeekName(dayNum);
                        const isWeekend = dayName === "Sat" || dayName === "Sun";
                        return (
                          <th
                            key={dayNum}
                            className={`px-1 py-2 text-center min-w-[36px] border-r border-border/20 font-bold ${
                              isWeekend 
                                ? "text-zinc-400 dark:text-zinc-500 bg-zinc-500/5" 
                                : "text-muted-foreground"
                            }`}
                          >
                            <span className="block text-[9px] uppercase font-semibold">{dayName}</span>
                            <span className="block text-xs mt-0.5 font-bold">{String(dayNum).padStart(2, '0')}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredEmployees.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                        
                        {/* Sticky Employee Details Cell */}
                        <td className="sticky left-0 bg-background/95 backdrop-blur-md z-20 px-4 py-3 border-r border-border/40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground truncate max-w-[170px] text-xs">
                              {emp.first_name} {emp.last_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[170px] mt-0.5 font-medium">
                              {emp.job_title || "Consultant"} • {emp.department}
                            </span>
                          </div>
                        </td>

                        {/* Summary cells */}
                        <td className="px-2 py-3 border-r border-border/40 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                          {emp.summary.present}
                        </td>
                        <td className="px-2 py-3 border-r border-border/40 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5">
                          {emp.summary.late}
                        </td>
                        <td className="px-2 py-3 border-r border-border/40 text-center font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-500/5">
                          {emp.summary.half_day}
                        </td>
                        <td className="px-2 py-3 border-r border-border/40 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/5">
                          {emp.summary.leave}
                        </td>

                        {/* Calendar cells */}
                        {emp.days.map((day: any) => {
                          const status = day.status;
                          
                          // Badge class mappings
                          let cellBg = "";
                          let cellText = "";
                          let abbreviation = "-";
                          
                          if (status === "Present") {
                            cellBg = "bg-emerald-500";
                            cellText = "text-white";
                            abbreviation = "P";
                          } else if (status === "Late") {
                            cellBg = "bg-amber-500";
                            cellText = "text-white";
                            abbreviation = "L";
                          } else if (status === "Half Day") {
                            cellBg = "bg-yellow-400";
                            cellText = "text-zinc-950";
                            abbreviation = "H";
                          } else if (status === "Absent") {
                            cellBg = "bg-rose-500";
                            cellText = "text-white";
                            abbreviation = "A";
                          } else if (status === "Leave") {
                            cellBg = "bg-indigo-500";
                            cellText = "text-white";
                            abbreviation = "Le";
                          } else if (status === "Holiday") {
                            cellBg = "bg-sky-500";
                            cellText = "text-white";
                            abbreviation = "Ho";
                          } else if (status === "Weekend") {
                            cellBg = "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700";
                            cellText = "text-zinc-400 dark:text-zinc-500";
                            abbreviation = "We";
                          }
                          
                          const formatTime = (timeStr: string) => {
                            if (!timeStr) return "-";
                            try {
                              const d = new Date(timeStr);
                              return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            } catch {
                              return "-";
                            }
                          };

                          return (
                            <td
                              key={day.day}
                              className={`p-1 border-r border-border/20 text-center align-middle`}
                            >
                              {status ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button 
                                      className={`mx-auto flex items-center justify-center rounded-full w-6 h-6 hover:scale-110 active:scale-95 transition-transform duration-200 shadow-sm font-bold text-[9px] cursor-pointer ${cellBg} ${cellText}`}
                                    >
                                      {abbreviation}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-zinc-950/95 backdrop-blur-xl text-white border border-border/40 p-3 shadow-2xl rounded-xl space-y-1.5 text-xs max-w-[220px]">
                                    <p className="font-bold text-emerald-400 flex items-center gap-1 border-b border-zinc-800 pb-1">
                                      <Info className="w-3.5 h-3.5" />
                                      {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                    <div className="space-y-0.5">
                                      <p className="flex justify-between gap-4">
                                        <span className="text-zinc-400">Status:</span>
                                        <span className="font-semibold">{status}</span>
                                      </p>
                                      {status === "Holiday" && day.holiday_name && (
                                        <p className="text-sky-300 italic">{day.holiday_name}</p>
                                      )}
                                      {status === "Leave" && day.leave_type && (
                                        <p className="text-indigo-300 italic">{day.leave_type}</p>
                                      )}
                                      {(status === "Present" || status === "Late" || status === "Half Day") && (
                                        <>
                                          <p className="flex justify-between gap-4">
                                            <span className="text-zinc-400">Clock In:</span>
                                            <span className="font-mono text-zinc-200">{formatTime(day.clock_in)}</span>
                                          </p>
                                          <p className="flex justify-between gap-4">
                                            <span className="text-zinc-400">Clock Out:</span>
                                            <span className="font-mono text-zinc-200">{formatTime(day.clock_out)}</span>
                                          </p>
                                          <p className="flex justify-between gap-4">
                                            <span className="text-zinc-400">Working Hrs:</span>
                                            <span className="font-semibold text-zinc-200">{day.working_hours.toFixed(2)}h</span>
                                          </p>
                                          {day.late_minutes > 0 && (
                                            <p className="flex justify-between gap-4 text-amber-400 font-medium">
                                              <span>Late:</span>
                                              <span>+{day.late_minutes}m</span>
                                            </p>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="mx-auto flex items-center justify-center w-6 h-6 text-zinc-300 dark:text-zinc-700 select-none">
                                  -
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  );
}
