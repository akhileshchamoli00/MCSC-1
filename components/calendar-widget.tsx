"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Calendar, Briefcase, CalendarCheck, AlertCircle, Filter, Download, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, 
  RefreshCw, FileSpreadsheet, Info, X, Clock, HelpCircle, Users, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BentoCard } from "@/components/magic-bento";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Holiday {
  id: number;
  holiday_name: string;
  holiday_date: string;
  holiday_type: string;
  recurring: boolean;
  description: string;
}

interface Leave {
  id: number;
  employee_id: number;
  employee_name: string;
  profile_photo: string | null;
  department_name: string;
  department_id: number;
  manager_name: string;
  manager_id: number;
  start_date: string;
  end_date: string;
  leave_type: string;
  days_requested: number;
  status: string;
  reason: string | null;
}

interface Stats {
  on_leave_today: number;
  pending_leaves: number;
  total_active_employees: number;
  team_availability_pct: number;
  next_holiday: {
    holiday_name: string;
    holiday_date: string;
    holiday_type: string;
    days_away: number;
  } | null;
}

interface FilterOptions {
  departments: { id: number; name: string }[];
  managers: { id: number; name: string }[];
}

export default function CalendarWidget() {
  const todayDate = new Date();
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth()); // 0-indexed

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedManager, setSelectedManager] = useState("all");
  const [selectedLeaveType, setSelectedLeaveType] = useState("all");
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState("all");

  // API response state
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [stats, setStats] = useState<Stats>({
    on_leave_today: 0,
    pending_leaves: 0,
    total_active_employees: 0,
    team_availability_pct: 100.0,
    next_holiday: null
  });
  const [filtersData, setFiltersData] = useState<FilterOptions>({
    departments: [],
    managers: []
  });

  const [loading, setLoading] = useState(true);

  // Dialog state for viewing a day's details on click
  const [selectedDayDetails, setSelectedDayDetails] = useState<{
    date: Date;
    dateString: string;
    holidays: Holiday[];
    leaves: Leave[];
  } | null>(null);

  // Generate date grid for current month/year
  const getDaysInMonth = useCallback((year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const firstDayIndex = firstDay.getDay(); // 0 = Sunday
    const days: { date: Date; isCurrentMonth: boolean; dateString: string }[] = [];

    // Prev month padding
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateString: formatDateString(d)
      });
    }

    // Current month days
    const currentDaysCount = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= currentDaysCount; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        dateString: formatDateString(d)
      });
    }

    // Next month padding to fill grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    const nextPadding = totalCells - days.length;
    for (let i = 1; i <= nextPadding; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateString: formatDateString(d)
      });
    }

    return days;
  }, []);

  const formatDateString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("hrms_token");
      const headers = { "Authorization": `Bearer ${token}` };
      
      const queryParams = new URLSearchParams({
        month: String(currentMonth + 1),
        year: String(currentYear)
      });

      if (search) queryParams.append("search", search);
      if (selectedDept !== "all") queryParams.append("department_id", selectedDept);
      if (selectedManager !== "all") queryParams.append("manager_id", selectedManager);
      if (selectedLeaveType !== "all") queryParams.append("leave_type", selectedLeaveType);
      if (selectedLeaveStatus !== "all") queryParams.append("leave_status", selectedLeaveStatus);

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/calendar/monthly-overview?${queryParams.toString()}`;
      const res = await fetch(url, { headers });
      
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves);
        setHolidays(data.holidays);
        setStats(data.stats);
        
        // Only update filter options on load or if empty
        if (filtersData.departments.length === 0) {
          setFiltersData(data.filters);
        }
      } else {
        toast.error("Failed to load calendar details.");
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
      toast.error("An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, search, selectedDept, selectedManager, selectedLeaveType, selectedLeaveStatus, filtersData.departments.length]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    fetchOverview();
  }, [currentMonth, currentYear, selectedDept, selectedManager, selectedLeaveType, selectedLeaveStatus]);

  // Debounced search trigger
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      fetchOverview();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, fetchOverview]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handlePrevYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  const handleGoToday = () => {
    setCurrentMonth(todayDate.getMonth());
    setCurrentYear(todayDate.getFullYear());
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedDept("all");
    setSelectedManager("all");
    setSelectedLeaveType("all");
    setSelectedLeaveStatus("all");
  };

  // Export CSV
  const handleExportCSV = () => {
    if (leaves.length === 0) {
      toast.info("No leave records to export for the selected month.");
      return;
    }

    const headers = ["Employee Name", "Department", "Manager", "Leave Type", "Start Date", "End Date", "Days", "Status"];
    const rows = leaves.map(l => [
      `"${l.employee_name}"`,
      `"${l.department_name}"`,
      `"${l.manager_name}"`,
      `"${l.leave_type}"`,
      l.start_date,
      l.end_date,
      l.days_requested,
      l.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HRMS_Workforce_Leaves_${currentYear}_${currentMonth + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully!");
  };

  // Helper to match events to a day
  const getDayEvents = (dateString: string) => {
    const dayHolidays = holidays.filter(h => h.holiday_date === dateString);
    const dayLeaves = leaves.filter(l => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      const current = new Date(dateString);
      
      // Zero out times for date-only comparison
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      current.setHours(0,0,0,0);

      return current >= start && current <= end;
    });

    return { dayHolidays, dayLeaves };
  };

  const gridDays = getDaysInMonth(currentYear, currentMonth);
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const getTooltipPositionClass = (index: number) => {
    const row = Math.floor(index / 7);
    const col = index % 7;
    let vertical = "bottom-full mb-2";
    let horizontal = "left-1/2 -translate-x-1/2";
    
    // If in the first row, show below the cell
    if (row === 0) {
      vertical = "top-full mt-2";
    }
    // If on the right edge, shift left
    if (col >= 5) {
      horizontal = "right-0 translate-x-0";
    } else if (col <= 1) {
      horizontal = "left-0 translate-x-0";
    }
    return `${vertical} ${horizontal}`;
  };

  const getLeaveBadgeColor = (type: string, status: string) => {
    if (status.toUpperCase() === "PENDING") {
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
    if (type.toLowerCase().includes("sick")) {
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    }
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  };

  return (
    <div className="space-y-6">
      {/* 1. KPI WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* On Leave Today */}
        <BentoCard>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">On Leave Today</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{stats.on_leave_today}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Approved absences</p>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </BentoCard>

        {/* Team Availability */}
        <BentoCard>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex-1 mr-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Availability</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{stats.team_availability_pct}%</h3>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.team_availability_pct}%` }}
                />
              </div>
            </div>
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </BentoCard>

        {/* Pending Approvals */}
        <BentoCard>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Leaves</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{stats.pending_leaves}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">Awaiting approval</p>
            </div>
            <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </BentoCard>
      </div>

      {/* 2. CALENDAR CARD */}
      <BentoCard className="flex flex-col overflow-hidden">
        {/* Sticky Control Header */}
        <CardHeader className="border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-10 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Workforce Calendar
              </CardTitle>
              <CardDescription>Monitor workforce availability, approved/pending leaves, and holidays.</CardDescription>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border/60 rounded-lg bg-background p-1 shadow-sm">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded" onClick={handlePrevYear} title="Previous Year">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded" onClick={handlePrevMonth} title="Previous Month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold px-3 text-center min-w-[120px] select-none text-foreground">
                  {monthNames[currentMonth]} {currentYear}
                </span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded" onClick={handleNextMonth} title="Next Month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded" onClick={handleNextYear} title="Next Year">
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" className="h-10 text-xs font-semibold" onClick={handleGoToday}>
                Today
              </Button>

              <Button variant="default" size="sm" className="h-10 text-xs gap-1.5 font-semibold" onClick={handleExportCSV}>
                <FileSpreadsheet className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
            {/* Employee Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 border-border/60 bg-background/50 focus-visible:ring-primary/20 text-sm"
              />
            </div>

            {/* Department Filter */}
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-10 border-border/60 bg-background/50 text-sm">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {filtersData.departments.map(d => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Team/Manager Filter */}
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger className="h-10 border-border/60 bg-background/50 text-sm">
                <SelectValue placeholder="Manager / Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {filtersData.managers.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>Team {m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Leave Type Filter */}
            <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
              <SelectTrigger className="h-10 border-border/60 bg-background/50 text-sm">
                <SelectValue placeholder="Leave Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leave Types</SelectItem>
                <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
              </SelectContent>
            </Select>

            {/* Leave Status / Clear Filters */}
            <div className="flex gap-2">
              <Select value={selectedLeaveStatus} onValueChange={setSelectedLeaveStatus}>
                <SelectTrigger className="h-10 border-border/60 bg-background/50 text-sm flex-1">
                  <SelectValue placeholder="Leave Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="APPROVED">Approved Only</SelectItem>
                  <SelectItem value="PENDING">Pending Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/60 bg-background/50 rounded-lg" onClick={handleClearFilters} title="Clear All Filters">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center bg-card/20">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Updating calendar matrix...</p>
              </div>
            </div>
          ) : (
            <div className="w-full">
              {/* Weekdays Header */}
              <div className="grid grid-cols-7 border-b border-border/30 bg-muted/30">
                {weekdayNames.map((day, idx) => (
                  <div 
                    key={day} 
                    className={`py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                      idx === 0 || idx === 6 ? "bg-muted/20" : ""
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 grid-rows-5 border-b border-border/20">
                {gridDays.map((dayObj, index) => {
                  const { dayHolidays, dayLeaves } = getDayEvents(dayObj.dateString);
                  const isWeekend = dayObj.date.getDay() === 0 || dayObj.date.getDay() === 6;
                  
                  // Style hooks
                  const isToday = formatDateString(todayDate) === dayObj.dateString;
                  const isHoliday = dayHolidays.length > 0;
                  const hasLeaves = dayLeaves.length > 0;

                  // Compute holiday type background
                  let holidayBgClass = "";
                  if (isHoliday) {
                    const isNational = dayHolidays.some(h => h.holiday_type === "National Holiday");
                    holidayBgClass = isNational 
                      ? "bg-red-500/5 dark:bg-red-950/10 border-red-500/10 text-red-500" 
                      : "bg-blue-500/5 dark:bg-blue-950/10 border-blue-500/10 text-blue-500";
                  }

                  return (
                    <div
                      key={index}
                      onClick={() => {
                        if (isHoliday || hasLeaves) {
                          setSelectedDayDetails({
                            date: dayObj.date,
                            dateString: dayObj.dateString,
                            holidays: dayHolidays,
                            leaves: dayLeaves
                          });
                        }
                      }}
                      className={`group relative p-1.5 sm:p-2 border-r border-b border-border/30 min-h-[85px] sm:min-h-[120px] flex flex-col justify-between transition-all duration-200 select-none hover:bg-primary/5 hover:scale-[1.01] hover:z-10 hover:shadow-lg cursor-pointer ${
                        !dayObj.isCurrentMonth ? "opacity-30 pointer-events-none" : ""
                      } ${isWeekend ? "bg-muted/10" : "bg-card"} ${
                        isToday ? "ring-2 ring-primary/40 ring-inset" : ""
                      } ${holidayBgClass}`}
                    >
                      {/* Day Header */}
                      <div className="flex justify-between items-center">
                        <span className={`text-[10px] sm:text-xs font-bold ${
                          isToday 
                            ? "bg-primary text-primary-foreground h-4 w-4 sm:h-5 sm:w-5 rounded-full flex items-center justify-center" 
                            : "text-foreground"
                        }`}>
                          {dayObj.date.getDate()}
                        </span>

                        {/* Holiday indicator */}
                        {isHoliday && (
                          <span className="flex items-center gap-1 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-rose-500" />
                          </span>
                        )}
                      </div>

                      {/* Cell Contents */}
                      <div className="flex-1 mt-1 sm:mt-2 space-y-1 sm:space-y-1.5 overflow-hidden">
                        {/* Holiday labels */}
                        {dayHolidays.slice(0, 1).map((h, hIdx) => (
                          <div 
                            key={hIdx} 
                            className={`text-[8px] sm:text-[10px] font-medium py-0.5 px-1 sm:px-1.5 rounded border leading-tight line-clamp-1 truncate ${
                              h.holiday_type === "National Holiday" 
                                ? "bg-red-500/10 border-red-500/20 text-red-500 dark:bg-red-950/20" 
                                : "bg-blue-500/10 border-blue-500/20 text-blue-500 dark:bg-blue-950/20"
                            }`}
                            title={h.holiday_name}
                          >
                            🎉 {h.holiday_name}
                          </div>
                        ))}

                        {/* Leave stack */}
                        <div className="space-y-1">
                          {dayLeaves.slice(0, 2).map((l, lIdx) => (
                            <div 
                              key={lIdx} 
                              className={`text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded border flex items-center justify-between gap-1 leading-tight border-border/50 truncate bg-background/60`}
                            >
                              <span className="font-semibold text-foreground truncate">{l.employee_name}</span>
                              <Badge 
                                className={`text-[7px] sm:text-[8px] px-0.5 sm:px-1 py-0 h-3.5 sm:h-4 border leading-none font-medium scale-95 shrink-0 ${
                                  getLeaveBadgeColor(l.leave_type, l.status)
                                }`}
                              >
                                {l.status === "PENDING" ? "Pending" : l.leave_type.split(" ")[0]}
                              </Badge>
                            </div>
                          ))}
                          
                          {/* Overflow leaves */}
                          {dayLeaves.length > 2 && (
                            <div className="text-[8px] sm:text-[9px] font-semibold text-muted-foreground text-right pr-1">
                              +{dayLeaves.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. PREMIUM GLASSMORPHIC DETAIL TOOLTIP ON HOVER */}
                      <div className={`absolute z-30 opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none group-hover:pointer-events-auto transition-all duration-200 w-72 p-0 ${
                        getTooltipPositionClass(index)
                      }`}>
                        <div className="glass shadow-2xl border border-border/40 rounded-xl p-4 text-foreground text-xs space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-border/30">
                            <span className="font-bold text-sm text-foreground">
                              {dayObj.date.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                            {isToday && <Badge className="bg-primary/20 text-primary border-primary/30">Today</Badge>}
                          </div>

                          {/* Holidays detail */}
                          {isHoliday && (
                            <div className="space-y-1 bg-rose-500/5 dark:bg-rose-950/10 p-2 rounded-lg border border-rose-500/10">
                              <p className="font-bold text-rose-500 flex items-center gap-1">
                                <span>🎉 Public Holiday</span>
                              </p>
                              {dayHolidays.map((h, hIdx) => (
                                <div key={hIdx} className="text-muted-foreground">
                                  <p className="font-semibold text-foreground text-xs">{h.holiday_name}</p>
                                  <p className="text-[10px] mt-0.5 opacity-90">{h.holiday_type}</p>
                                  {h.description && <p className="text-[10px] italic mt-1 leading-relaxed border-t border-rose-500/10 pt-1">{h.description}</p>}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Leaves detail */}
                          <div className="space-y-2">
                            <p className="font-bold text-foreground/80">
                              Leaves Scheduled ({dayLeaves.length})
                            </p>
                            {dayLeaves.length > 0 ? (
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                {dayLeaves.map((l, lIdx) => (
                                  <div key={lIdx} className="p-2 bg-background/50 border border-border/30 rounded-lg flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                      <span className="font-semibold text-foreground">{l.employee_name}</span>
                                      <Badge className={`text-[8px] px-1 py-0 h-4 border ${getLeaveBadgeColor(l.leave_type, l.status)}`}>
                                        {l.status}
                                      </Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                      Dept: <span className="font-medium text-foreground">{l.department_name}</span>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      Type: <span className="font-medium text-foreground">{l.leave_type} ({l.days_requested} days)</span>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      Manager: <span className="font-medium text-foreground">{l.manager_name}</span>
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground italic text-[11px]">No employee leaves scheduled.</p>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </BentoCard>

      {/* 4. EXPANSION MODAL ON CLICK */}
      <Dialog open={selectedDayDetails !== null} onOpenChange={(open) => !open && setSelectedDayDetails(null)}>
        {selectedDayDetails && (
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {selectedDayDetails.date.toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </DialogTitle>
              <DialogDescription>
                Detailed overview of public holidays and team leaves for this date.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              {/* Holidays Section */}
              {selectedDayDetails.holidays.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-rose-500 border-b border-rose-500/10 pb-1">🎉 Public Holidays</h4>
                  {selectedDayDetails.holidays.map((h, idx) => (
                    <div key={idx} className="p-3 bg-red-500/5 dark:bg-red-950/10 border border-red-500/10 rounded-lg space-y-1">
                      <p className="font-bold text-sm text-foreground">{h.holiday_name}</p>
                      <p className="text-xs text-muted-foreground">{h.holiday_type}</p>
                      {h.description && <p className="text-xs italic text-muted-foreground/80 mt-1 leading-relaxed">{h.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Leaves Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-foreground/80 border-b border-border pb-1">👥 Employee Leaves ({selectedDayDetails.leaves.length})</h4>
                {selectedDayDetails.leaves.length > 0 ? (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {selectedDayDetails.leaves.map((l, idx) => (
                      <div key={idx} className="p-3 bg-background/50 border border-border/40 rounded-lg flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-foreground">{l.employee_name}</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-1">
                            <span>Dept: <strong className="text-foreground">{l.department_name}</strong></span>
                            <span>Manager: <strong className="text-foreground">{l.manager_name}</strong></span>
                            <span className="col-span-2">Type: <strong className="text-foreground">{l.leave_type}</strong></span>
                            <span className="col-span-2">Duration: <strong className="text-foreground">{l.start_date} to {l.end_date} ({l.days_requested} days)</strong></span>
                          </div>
                        </div>
                        <Badge className={`text-xs px-2.5 py-0.5 border shrink-0 ${getLeaveBadgeColor(l.leave_type, l.status)}`}>
                          {l.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">No employees on leave today.</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedDayDetails(null)} className="w-full sm:w-auto">
                Close View
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
