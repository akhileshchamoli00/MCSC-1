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
  ChevronRight
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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Public Holidays</h1>
          <p className="text-muted-foreground mt-1">Manage national and company public holidays globally.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button onClick={() => { reset(); setIsAddOpen(true); }} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Add Holiday
          </Button>
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search holidays..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-border/50 focus:border-primary"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[120px] bg-background/50 border-border/50">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</SelectItem>
                <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                <SelectItem value={(new Date().getFullYear() + 1).toString()}>{new Date().getFullYear() + 1}</SelectItem>
              </SelectContent>
            </Select>

            <Tabs value={view} onValueChange={(v: any) => setView(v)} className="w-[120px]">
              <TabsList className="grid w-full grid-cols-2 h-10">
                <TabsTrigger value="table"><List className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="calendar"><CalendarIcon className="w-4 h-4" /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading holidays...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === "table" ? (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-xl border border-border/50 overflow-hidden bg-background/50"
              >
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Holiday Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recurring</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHolidays.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          No holidays found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHolidays.map((holiday) => (
                        <TableRow key={holiday.id} className="group hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">
                            {holiday.holiday_name}
                            {holiday.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{holiday.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(holiday.holiday_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </TableCell>
                          <TableCell>
                            {new Date(holiday.holiday_date).toLocaleDateString("en-US", { weekday: "long" })}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              holiday.holiday_type === "National Holiday" 
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                                : holiday.holiday_type === "Forced Leave"
                                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                  : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                            }`}>
                              {holiday.holiday_type}
                            </span>
                          </TableCell>
                          <TableCell>
                            {holiday.recurring ? (
                              <span className="text-emerald-500 font-medium text-xs bg-emerald-500/10 px-2 py-1 rounded-full">Yes (Yearly)</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 border-border/50">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEdit(holiday)} className="cursor-pointer">
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDelete(holiday)} className="text-red-500 focus:text-red-500 cursor-pointer">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
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
                <div className="flex justify-between items-center bg-muted/30 border border-border/50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleGoToday}>Today</Button>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-lg font-semibold text-foreground ml-2">
                      {monthNames[calMonth]} {calYear}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500/20 border border-blue-500/30"></span>
                      <span>National Holiday</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500/20 border border-orange-500/30"></span>
                      <span>Forced Leave</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500/20 border border-purple-500/30"></span>
                      <span>Company Holiday</span>
                    </div>
                  </div>
                </div>

                {/* Days Grid */}
                <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
                  <div className="grid grid-cols-7 border-b border-border/30 bg-muted/30">
                    {weekdayNames.map((day, idx) => (
                      <div 
                        key={day} 
                        className={`py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                          idx === 0 || idx === 6 ? "bg-muted/10" : ""
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 divide-x divide-y divide-border/30">
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
                                const token = localStorage.getItem("hrms_token");
                                if (token) {
                                  try {
                                    const payload = JSON.parse(atob(token.split('.')[1]));
                                    const role = payload.role?.toUpperCase() || "";
                                    if (role.includes("ADMIN") || role.includes("HR")) {
                                      reset({
                                        holiday_name: "",
                                        holiday_date: formatDateString(cell.date),
                                        holiday_type: "National Holiday",
                                        recurring: false,
                                        description: ""
                                      });
                                      setIsAddOpen(true);
                                    }
                                  } catch (e) {}
                                }
                              }
                            }}
                            className={`min-h-[100px] p-2 flex flex-col justify-between transition-colors cursor-pointer hover:bg-muted/10 ${
                              cell.isCurrentMonth ? "bg-background/20" : "bg-muted/5 opacity-50"
                            } ${isToday ? "ring-2 ring-primary ring-inset bg-primary/5" : ""}`}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`text-xs font-semibold ${
                                cell.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                              } ${isToday ? "text-primary" : ""}`}>
                                {cell.date.getDate()}
                              </span>
                            </div>

                            <div className="space-y-1 mt-2 flex-grow overflow-y-auto max-h-[70px] scrollbar-thin">
                              {cellHolidays.map(h => (
                                <div 
                                  key={h.id}
                                  className={`text-[10px] p-1 rounded-lg border leading-tight ${
                                    h.holiday_type === "National Holiday" 
                                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" 
                                      : h.holiday_type === "Forced Leave"
                                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                                        : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                  }`}
                                >
                                  <div className="font-semibold truncate">{h.holiday_name}</div>
                                  {h.recurring && <div className="text-[8px] opacity-70 mt-0.5">Yearly</div>}
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
        <DialogContent className="sm:max-w-[425px] border-border/50 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Add Public Holiday</DialogTitle>
            <DialogDescription>
              Create a new public holiday for the organization.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="holiday_name">Holiday Name <span className="text-red-500">*</span></Label>
              <Input id="holiday_name" placeholder="e.g., Eid al-Fitr" {...register("holiday_name")} className="border-border/50 focus:border-primary" />
              {errors.holiday_name && <p className="text-xs text-red-500">{errors.holiday_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="holiday_date">Date <span className="text-red-500">*</span></Label>
              <Input id="holiday_date" type="date" {...register("holiday_date")} className="border-border/50 focus:border-primary" />
              {errors.holiday_date && <p className="text-xs text-red-500">{errors.holiday_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Type <span className="text-red-500">*</span></Label>
              <Controller
                name="holiday_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="border-border/50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="National Holiday">National Holiday</SelectItem>
                      <SelectItem value="Company Holiday">Company Holiday</SelectItem>
                      <SelectItem value="Forced Leave">Forced Leave</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Controller
                name="recurring"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="recurring" 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                )}
              />
              <Label htmlFor="recurring" className="font-medium">
                Recurring Every Year
              </Label>
            </div>
            <div className="space-y-2 pt-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description" 
                placeholder="Add any additional details..." 
                className="resize-none h-20 border-border/50 focus:border-primary" 
                {...register("description")} 
              />
            </div>
            <DialogFooter className="pt-4 border-t border-border/30">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Holiday
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] border-border/50 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Edit Public Holiday</DialogTitle>
            <DialogDescription>
              Update the details of this public holiday.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Holiday Name <span className="text-red-500">*</span></Label>
              <Input id="edit_name" {...register("holiday_name")} className="border-border/50 focus:border-primary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_date">Date <span className="text-red-500">*</span></Label>
              <Input id="edit_date" type="date" {...register("holiday_date")} className="border-border/50 focus:border-primary" />
            </div>
            <div className="space-y-2">
              <Label>Type <span className="text-red-500">*</span></Label>
              <Controller
                name="holiday_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="border-border/50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="National Holiday">National Holiday</SelectItem>
                      <SelectItem value="Company Holiday">Company Holiday</SelectItem>
                      <SelectItem value="Forced Leave">Forced Leave</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Controller
                name="recurring"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="edit_recurring" 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                )}
              />
              <Label htmlFor="edit_recurring" className="font-medium">
                Recurring Every Year
              </Label>
            </div>
            <div className="space-y-2 pt-2">
              <Label htmlFor="edit_desc">Description (Optional)</Label>
              <Textarea 
                id="edit_desc" 
                className="resize-none h-20 border-border/50 focus:border-primary" 
                {...register("description")} 
              />
            </div>
            <DialogFooter className="pt-4 border-t border-border/30">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] border-red-500/20 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Holiday
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{selectedHoliday?.holiday_name}</span>? This action cannot be undone and may affect future payroll and leave calculations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 mt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DAY DETAILS DIALOG */}
      <Dialog open={!!selectedHolidayDetails} onOpenChange={(open) => !open && setSelectedHolidayDetails(null)}>
        <DialogContent className="sm:max-w-[425px] border-border/50 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {selectedHolidayDetails && new Date(selectedHolidayDetails.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </DialogTitle>
            <DialogDescription>
              Holidays scheduled for this day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedHolidayDetails?.holidays.map(h => (
              <div key={h.id} className="p-4 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-foreground">{h.holiday_name}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    h.holiday_type === "National Holiday" 
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                      : h.holiday_type === "Forced Leave"
                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  }`}>
                    {h.holiday_type}
                  </span>
                </div>
                {h.description && <p className="text-sm text-muted-foreground">{h.description}</p>}
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>Recurring: {h.recurring ? "Yes (Yearly)" : "No"}</span>
                </div>
                
                {/* Admin Actions */}
                {(() => {
                  const token = typeof window !== 'undefined' ? localStorage.getItem("hrms_token") : null;
                  if (token) {
                    try {
                      const payload = JSON.parse(atob(token.split('.')[1]));
                      const role = payload.role?.toUpperCase() || "";
                      if (role.includes("ADMIN") || role.includes("HR")) {
                        return (
                          <div className="flex justify-end gap-2 pt-2 border-t border-border/20 mt-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 gap-1.5" 
                              onClick={() => {
                                setSelectedHolidayDetails(null);
                                openEdit(h);
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-8 gap-1.5" 
                              onClick={() => {
                                setSelectedHolidayDetails(null);
                                openDelete(h);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </Button>
                          </div>
                        );
                      }
                    } catch (e) {}
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedHolidayDetails(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
