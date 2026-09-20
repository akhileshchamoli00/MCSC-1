"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  AlertTriangle,
  Loader2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Building2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const holidaySchema = z.object({
  holiday_name: z.string().min(2, "Name is required"),
  holiday_date: z.string().min(1, "Date is required"),
  holiday_type: z.string().min(1, "Type is required"),
  recurring: z.boolean().default(false),
  description: z.string().optional(),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

export default function PublicHolidaysPage() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, yearFilter]);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<"table" | "calendar">("table");

  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedHolidayDetails, setSelectedHolidayDetails] = useState<{
    date: Date;
    dateString: string;
    holidays: any[];
  } | null>(null);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCalMonth(new Date().getMonth());
    setCalYear(new Date().getFullYear());
  };

  const formatDateString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Synchronize yearFilter with calYear when in calendar view
  useEffect(() => {
    if (view === "calendar" && yearFilter !== "all" && yearFilter !== calYear.toString()) {
      setYearFilter(calYear.toString());
    }
  }, [calYear, view]);

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      holiday_type: "National Holiday",
      recurring: false,
    }
  });

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("hrms_token");
      const url = yearFilter === "all" 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/public-holidays`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/public-holidays?year=${yearFilter}`;
        
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHolidays(data);
      }
    } catch (err) {
      toast.error("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [yearFilter]);

  const onSubmitAdd = async (data: HolidayFormValues) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public-holidays`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        toast.success("Public Holiday added successfully");
        setIsAddOpen(false);
        reset();
        fetchHolidays();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to add holiday");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitEdit = async (data: HolidayFormValues) => {
    if (!selectedHoliday) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public-holidays/${selectedHoliday.id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        toast.success("Public Holiday updated successfully");
        setIsEditOpen(false);
        fetchHolidays();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update holiday");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!selectedHoliday) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public-holidays/${selectedHoliday.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success("Public Holiday deleted successfully");
        setIsDeleteOpen(false);
        fetchHolidays();
      } else {
        toast.error("Failed to delete holiday");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (holiday: any) => {
    setSelectedHoliday(holiday);
    setValue("holiday_name", holiday.holiday_name);
    setValue("holiday_date", holiday.holiday_date);
    setValue("holiday_type", holiday.holiday_type);
    setValue("recurring", holiday.recurring);
    setValue("description", holiday.description || "");
    setIsEditOpen(true);
  };

  const openDelete = (holiday: any) => {
    setSelectedHoliday(holiday);
    setIsDeleteOpen(true);
  };

  const filteredHolidays = holidays.filter(h => 
    h.holiday_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredHolidays.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedHolidays = filteredHolidays.slice(startIndex, endIndex);

  return (
    <div className="w-full max-w-none space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Minimalist Metrics Strip & Action Button Row */}
      <div className="flex flex-col xl:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-xs flex-1 gap-3 sm:gap-4">
          
          {/* Total Holidays */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Holidays</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{holidays.length}</p>
            </div>
          </div>

          {/* National Days */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">National Days</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{holidays.filter(h => h.holiday_type === "National Holiday").length}</p>
            </div>
          </div>

          {/* Joint / Company */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Joint / Company</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{holidays.filter(h => h.holiday_type === "Joint Leave" || h.holiday_type === "Company Holiday").length}</p>
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Recurring</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{holidays.filter(h => h.recurring).length}</p>
            </div>
          </div>
        </div>

        {/* Add Holiday Button */}
        <Button 
          onClick={() => { reset(); setIsAddOpen(true); }} 
          className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Holiday
        </Button>
      </div>

      <div className="bg-background/50 backdrop-blur-md border border-border/40 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search holidays..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px] h-10 text-xs rounded-xl bg-background/70 border-border/50">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50">
                <SelectItem value="all" className="text-xs cursor-pointer">All Years</SelectItem>
                <SelectItem value={(new Date().getFullYear() - 1).toString()} className="text-xs cursor-pointer">{new Date().getFullYear() - 1}</SelectItem>
                <SelectItem value={new Date().getFullYear().toString()} className="text-xs cursor-pointer">{new Date().getFullYear()}</SelectItem>
                <SelectItem value={(new Date().getFullYear() + 1).toString()} className="text-xs cursor-pointer">{new Date().getFullYear() + 1}</SelectItem>
              </SelectContent>
            </Select>

            <Tabs value={view} onValueChange={(v: any) => setView(v)} className="w-[110px]">
              <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/60 p-1 rounded-xl border border-border/40">
                <TabsTrigger value="table" className="rounded-lg cursor-pointer"><List className="w-3.5 h-3.5" /></TabsTrigger>
                <TabsTrigger value="calendar" className="rounded-lg cursor-pointer"><CalendarIcon className="w-3.5 h-3.5" /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Loading holidays...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === "table" ? (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-2xl border border-border/40 overflow-hidden bg-background/50 backdrop-blur-md"
              >
                <div className="overflow-x-auto w-full">
                  <Table className="w-full">
                    <TableHeader className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-3 pl-6">Holiday Name</TableHead>
                        <TableHead className="py-3">Date</TableHead>
                        <TableHead className="py-3">Day</TableHead>
                        <TableHead className="py-3">Type</TableHead>
                        <TableHead className="py-3">Recurring</TableHead>
                        <TableHead className="text-right pr-6 py-3">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs divide-y divide-border/20">
                      {filteredHolidays.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                            No holidays found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedHolidays.map((holiday) => (
                          <TableRow key={holiday.id} className="group hover:bg-muted/30 transition-colors">
                            <TableCell className="font-semibold py-3 pl-6 text-foreground">
                              {holiday.holiday_name}
                              {holiday.description && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 font-normal">{holiday.description}</p>
                              )}
                            </TableCell>
                            <TableCell className="py-3 font-mono text-muted-foreground">
                              {new Date(holiday.holiday_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </TableCell>
                            <TableCell className="py-3 text-foreground font-medium">
                              {new Date(holiday.holiday_date).toLocaleDateString("en-US", { weekday: "long" })}
                            </TableCell>
                            <TableCell className="py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                holiday.holiday_type === "National Holiday" 
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" 
                                  : holiday.holiday_type === "Forced Leave"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                              }`}>
                                {holiday.holiday_type}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              {holiday.recurring ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">Yes (Yearly)</span>
                              ) : (
                                <span className="text-muted-foreground text-[10px]">No</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-3 pr-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-muted cursor-pointer">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 rounded-xl border-border/50">
                                  <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openEdit(holiday)} className="text-xs cursor-pointer">
                                    <Pencil className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openDelete(holiday)} className="text-xs text-rose-500 focus:text-rose-500 cursor-pointer">
                                    <Trash2 className="mr-2 h-3.5 w-3.5 text-rose-500" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-muted/10">
                    <div className="text-xs text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                      <span className="font-medium text-foreground">{Math.min(filteredHolidays.length, endIndex)}</span> of{" "}
                      <span className="font-medium text-foreground">{filteredHolidays.length}</span> entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-8 text-xs rounded-xl bg-background border-border/50 hover:bg-muted shrink-0"
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 text-xs rounded-xl bg-background border-border/50 hover:bg-muted shrink-0"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-4"
              >
                {/* Calendar Navigation Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/20 border border-border/40 rounded-2xl p-3.5 sm:px-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleGoToday} className="h-9 text-xs font-semibold rounded-xl border-border/50 cursor-pointer">Today</Button>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl cursor-pointer" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl cursor-pointer" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-base font-bold text-foreground ml-2">
                      {monthNames[calMonth]} {calYear}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500/20 border border-blue-500/40"></span>
                      <span>National Holiday</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40"></span>
                      <span>Forced Leave</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500/20 border border-purple-500/40"></span>
                      <span>Company Holiday</span>
                    </div>
                  </div>
                </div>

                {/* Days Grid */}
                <div className="rounded-2xl border border-border/40 overflow-hidden bg-background/50 backdrop-blur-md shadow-xs">
                  <div className="grid grid-cols-7 border-b border-border/30 bg-muted/30">
                    {weekdayNames.map((day, idx) => (
                      <div 
                        key={day} 
                        className={`py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground ${
                          idx === 0 || idx === 6 ? "bg-muted/10 text-rose-500/80" : ""
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 divide-x divide-y divide-border/20">
                    {(() => {
                      const firstDay = new Date(calYear, calMonth, 1);
                      const startDayIdx = firstDay.getDay();
                      const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                      
                      const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
                      const cellsList = [];
                      for (let i = startDayIdx - 1; i >= 0; i--) {
                        cellsList.push({
                          date: new Date(calYear, calMonth - 1, prevMonthDays - i),
                          isCurrentMonth: false
                        });
                      }
                      
                      for (let i = 1; i <= daysInMonth; i++) {
                        cellsList.push({
                          date: new Date(calYear, calMonth, i),
                          isCurrentMonth: true
                        });
                      }
                      
                      const totalCells = Math.ceil(cellsList.length / 7) * 7;
                      const nextPadding = totalCells - cellsList.length;
                      for (let i = 1; i <= nextPadding; i++) {
                        cellsList.push({
                          date: new Date(calYear, calMonth + 1, i),
                          isCurrentMonth: false
                        });
                      }

                      return cellsList.map((cell, idx) => {
                        const isToday = formatDateString(cell.date) === formatDateString(new Date());
                        const cellHolidays = holidays.filter(h => {
                          const hDate = new Date(h.holiday_date);
                          if (h.recurring) {
                            return hDate.getMonth() === cell.date.getMonth() && hDate.getDate() === cell.date.getDate();
                          } else {
                            return hDate.getFullYear() === cell.date.getFullYear() &&
                                   hDate.getMonth() === cell.date.getMonth() &&
                                   hDate.getDate() === cell.date.getDate();
                          }
                        });

                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              if (cellHolidays.length > 0) {
                                setSelectedHolidayDetails({
                                  date: cell.date,
                                  dateString: formatDateString(cell.date),
                                  holidays: cellHolidays
                                });
                              } else {
                                const role = (localStorage.getItem("user_role") || "").toUpperCase();
                                if (role === "ADMIN" || role === "SUPER ADMIN" || role === "HR") {
                                  reset({
                                    holiday_name: "",
                                    holiday_date: formatDateString(cell.date),
                                    holiday_type: "National Holiday",
                                    recurring: false,
                                    description: ""
                                  });
                                  setIsAddOpen(true);
                                }
                              }
                            }}
                            className={`min-h-[140px] xl:min-h-[160px] p-2.5 sm:p-3 flex flex-col justify-between transition-colors cursor-pointer hover:bg-muted/20 ${
                              cell.isCurrentMonth ? "bg-background/20" : "bg-muted/5 opacity-40"
                            } ${isToday ? "ring-2 ring-emerald-500 ring-inset bg-emerald-500/5" : ""}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`text-sm font-bold ${
                                cell.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                              } ${isToday ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                                {cell.date.getDate()}
                              </span>
                            </div>

                            <div className="space-y-1.5 mt-2 flex-grow overflow-y-auto max-h-[100px] xl:max-h-[120px] pr-0.5">
                              {cellHolidays.map(h => (
                                <div 
                                  key={h.id}
                                  className={`text-xs p-1.5 rounded-xl border leading-tight font-semibold shadow-xs ${
                                    h.holiday_type === "National Holiday" 
                                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" 
                                      : h.holiday_type === "Forced Leave"
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                        : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                  }`}
                                >
                                  <div className="truncate">{h.holiday_name}</div>
                                  {h.recurring && <div className="text-[9px] opacity-70 mt-0.5 font-normal">Yearly</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ADD DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
          <DialogHeader className="pt-2">
            <DialogTitle className="text-lg font-bold">Add Public Holiday</DialogTitle>
            <DialogDescription className="text-xs">
              Create a new public holiday for the organization.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="holiday_name" className="text-xs font-semibold">Holiday Name <span className="text-destructive">*</span></Label>
              <Input id="holiday_name" placeholder="e.g., Eid al-Fitr" {...register("holiday_name")} className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" />
              {errors.holiday_name && <p className="text-[10px] text-destructive">{errors.holiday_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="holiday_date" className="text-xs font-semibold">Date <span className="text-destructive">*</span></Label>
              <Input id="holiday_date" type="date" {...register("holiday_date")} className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" />
              {errors.holiday_date && <p className="text-[10px] text-destructive">{errors.holiday_date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Type <span className="text-destructive">*</span></Label>
              <Controller
                name="holiday_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50">
                      <SelectItem value="National Holiday" className="text-xs cursor-pointer">National Holiday</SelectItem>
                      <SelectItem value="Company Holiday" className="text-xs cursor-pointer">Company Holiday</SelectItem>
                      <SelectItem value="Forced Leave" className="text-xs cursor-pointer">Forced Leave</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <Controller
                name="recurring"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="recurring" 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 border-border/70 rounded-md cursor-pointer"
                  />
                )}
              />
              <Label htmlFor="recurring" className="text-xs font-medium cursor-pointer">
                Recurring Every Year
              </Label>
            </div>
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="description" className="text-xs font-semibold">Description (Optional)</Label>
              <Textarea 
                id="description" 
                placeholder="Add any additional details..." 
                className="resize-none h-20 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" 
                {...register("description")} 
              />
            </div>
            <DialogFooter className="pt-3 border-t border-border/40 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={submitting} className="h-10 text-xs rounded-xl border-border/50 cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="h-10 text-xs font-bold rounded-xl cursor-pointer">
                {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Add Holiday
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
          <DialogHeader className="pt-2">
            <DialogTitle className="text-lg font-bold">Edit Public Holiday</DialogTitle>
            <DialogDescription className="text-xs">
              Update the details of this public holiday.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit_name" className="text-xs font-semibold">Holiday Name <span className="text-destructive">*</span></Label>
              <Input id="edit_name" {...register("holiday_name")} className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_date" className="text-xs font-semibold">Date <span className="text-destructive">*</span></Label>
              <Input id="edit_date" type="date" {...register("holiday_date")} className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Type <span className="text-destructive">*</span></Label>
              <Controller
                name="holiday_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50">
                      <SelectItem value="National Holiday" className="text-xs cursor-pointer">National Holiday</SelectItem>
                      <SelectItem value="Company Holiday" className="text-xs cursor-pointer">Company Holiday</SelectItem>
                      <SelectItem value="Forced Leave" className="text-xs cursor-pointer">Forced Leave</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <Controller
                name="recurring"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="edit_recurring" 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 border-border/70 rounded-md cursor-pointer"
                  />
                )}
              />
              <Label htmlFor="edit_recurring" className="text-xs font-medium cursor-pointer">
                Recurring Every Year
              </Label>
            </div>
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="edit_desc" className="text-xs font-semibold">Description (Optional)</Label>
              <Textarea 
                id="edit_desc" 
                className="resize-none h-20 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" 
                {...register("description")} 
              />
            </div>
            <DialogFooter className="pt-3 border-t border-border/40 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={submitting} className="h-10 text-xs rounded-xl border-border/50 cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="h-10 text-xs font-bold rounded-xl cursor-pointer">
                {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-rose-500/20 bg-background/95 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600 shrink-0" />
          <DialogHeader className="pt-2">
            <DialogTitle className="text-rose-600 dark:text-rose-400 flex items-center gap-2 font-bold text-lg">
              <AlertTriangle className="w-5 h-5" />
              Delete Holiday
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete <span className="font-semibold text-foreground">{selectedHoliday?.holiday_name}</span>? This action cannot be undone and may affect future payroll and leave calculations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3 border-t border-border/40 gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={submitting} className="h-10 text-xs rounded-xl border-border/50 cursor-pointer">
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={submitting} className="h-10 text-xs font-bold rounded-xl cursor-pointer">
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DAY DETAILS DIALOG */}
      <Dialog open={!!selectedHolidayDetails} onOpenChange={(open) => !open && setSelectedHolidayDetails(null)}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
          <DialogHeader className="pt-2">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-500" />
              {selectedHolidayDetails && new Date(selectedHolidayDetails.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Holidays scheduled for this day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            {selectedHolidayDetails?.holidays.map(h => (
              <div key={h.id} className="p-3.5 rounded-xl border border-border/40 bg-muted/20 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-foreground text-xs">{h.holiday_name}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    h.holiday_type === "National Holiday" 
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" 
                      : h.holiday_type === "Forced Leave"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                  }`}>
                    {h.holiday_type}
                  </span>
                </div>
                {h.description && <p className="text-xs text-muted-foreground">{h.description}</p>}
                <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                  <span>Recurring: {h.recurring ? "Yes (Yearly)" : "No"}</span>
                </div>
                
                {/* Admin Actions */}
                {(() => {
                  const role = (localStorage.getItem("user_role") || "").toUpperCase();
                  if (role === "ADMIN" || role === "SUPER ADMIN" || role === "HR") {
                    return (
                      <div className="flex justify-end gap-2 pt-2 border-t border-border/20 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs rounded-lg gap-1.5 border-border/50 cursor-pointer" 
                          onClick={() => {
                            setSelectedHolidayDetails(null);
                            openEdit(h);
                          }}
                        >
                          <Pencil className="w-3 h-3 text-emerald-500" /> Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs rounded-lg gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 cursor-pointer" 
                          onClick={() => {
                            setSelectedHolidayDetails(null);
                            openDelete(h);
                          }}
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>
          <DialogFooter className="border-t border-border/40 pt-3">
            <Button variant="outline" onClick={() => setSelectedHolidayDetails(null)} className="h-10 text-xs rounded-xl border-border/50 cursor-pointer">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
