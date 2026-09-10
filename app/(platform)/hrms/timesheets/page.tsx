"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks } from "date-fns";
import { 
  Clock, 
  Calendar, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock4, 
  BriefcaseBusiness,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KpiCard } from "@/components/kpi-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function MyTimesheets() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    project_name: "",
    task_name: "",
    start_time: "09:00",
    end_time: "17:00",
    break_duration: 60,
    description: ""
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  const currentTimesheet = timesheets.find(t => 
    t.week_start === format(weekStart, 'yyyy-MM-dd')
  );

  const fetchTimesheets = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTimesheets(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsAndTasks = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    try {
      const [projRes, taskRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/tasks`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (projRes.ok) setProjects(await projRes.json());
      if (taskRes.ok) setTasks(await taskRes.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTimesheets();
    fetchProjectsAndTasks();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold px-2.5 py-0.5 rounded-full";
      case "REJECTED": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold px-2.5 py-0.5 rounded-full";
      case "SUBMITTED": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold px-2.5 py-0.5 rounded-full";
      default: return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold px-2.5 py-0.5 rounded-full";
    }
  };

  const calculateHours = (start: string, end: string, breakMins: number) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let diff = (endH * 60 + endM) - (startH * 60 + startM) - breakMins;
    return Math.max(0, diff / 60);
  };

  const handleSaveEntry = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;

    if (!newEntry.project_name || !newEntry.task_name || !newEntry.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    const totalHours = calculateHours(newEntry.start_time, newEntry.end_time, newEntry.break_duration);
    
    // Convert times to full datetime strings in local timezone, then to ISO UTC
    const startDateTime = new Date(`${newEntry.date}T${newEntry.start_time}:00`).toISOString();
    const endDateTime = new Date(`${newEntry.date}T${newEntry.end_time}:00`).toISOString();

    try {
      let activeTimesheet = currentTimesheet;
      
      // Create timesheet if it doesn't exist
      if (!activeTimesheet) {
        const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/`, {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            week_start: format(weekStart, 'yyyy-MM-dd'),
            week_end: format(weekEnd, 'yyyy-MM-dd'),
            total_hours: 0,
            overtime_hours: 0,
            status: "DRAFT"
          })
        });
        if (createRes.ok) {
          activeTimesheet = await createRes.json();
        } else {
          toast.error("Failed to create weekly timesheet");
          return;
        }
      }

      // Add entry
      const entryRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/${activeTimesheet.id}/entries`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date: newEntry.date,
          project_name: newEntry.project_name,
          task_name: newEntry.task_name,
          description: newEntry.description,
          start_time: startDateTime,
          end_time: endDateTime,
          break_duration: newEntry.break_duration,
          total_hours: totalHours
        })
      });

      if (entryRes.ok) {
        toast.success("Time entry saved successfully");
        setIsEntryModalOpen(false);
        fetchTimesheets(); // Reload data
      } else {
        toast.error("Failed to save time entry");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleSubmitTimesheet = async () => {
    if (!currentTimesheet) return;
    const token = localStorage.getItem("hrms_token");
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/${currentTimesheet.id}/submit`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Timesheet submitted for approval");
        fetchTimesheets();
      } else {
        toast.error("Failed to submit timesheet");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Loading timesheets...</p>
        </div>
      </div>
    );
  }

  const totalHours = currentTimesheet?.total_hours || 0;
  const overtimeHours = currentTimesheet?.overtime_hours || 0;
  const isReadOnly = currentTimesheet?.status === "SUBMITTED" || currentTimesheet?.status === "APPROVED";

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-16">
      
      {/* Minimalist Metrics Strip & Action Button Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Hours */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Hours</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalHours.toFixed(1)}h</p>
            </div>
          </div>

          {/* Overtime */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Clock4 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Overtime</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{overtimeHours.toFixed(1)}h</p>
            </div>
          </div>

          {/* Weekly Status */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 col-span-2 justify-start sm:justify-center">
            <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Weekly Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={getStatusColor(currentTimesheet?.status || "DRAFT")}>
                    {currentTimesheet?.status || "NO TIMESHEET"}
                  </span>
                  {currentTimesheet?.status === "REJECTED" && (
                    <span className="text-[10px] text-rose-500 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 truncate max-w-[150px]">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {currentTimesheet.comments}
                    </span>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleSubmitTimesheet}
                disabled={!currentTimesheet || isReadOnly || totalHours === 0}
                variant={isReadOnly ? "secondary" : "default"}
                size="sm"
                className={isReadOnly ? "h-8 text-xs px-3 rounded-xl" : "h-8 text-xs px-3 rounded-xl font-bold shadow-sm cursor-pointer shrink-0"}
              >
                {currentTimesheet?.status === "SUBMITTED" ? "Awaiting Approval" : 
                 currentTimesheet?.status === "APPROVED" ? "Approved" : "Submit Week"}
              </Button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={() => setIsEntryModalOpen(true)}
          className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm shrink-0 cursor-pointer"
          disabled={isReadOnly}
        >
          <Plus className="h-4 w-4" /> Add Time Entry
        </Button>
      </div>

      {/* Weekly Entries Card */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/20 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>Weekly Entries</span>
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="h-8 w-8 p-0 rounded-lg border-border/50">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold text-foreground">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="h-8 w-8 p-0 rounded-lg border-border/50">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <div className="divide-y divide-border/20">
          {(!currentTimesheet || currentTimesheet.entries.length === 0) ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground">
                <BriefcaseBusiness className="w-6 h-6 opacity-60" />
              </div>
              <p className="text-xs text-muted-foreground">No time entries recorded for this week.</p>
              {!isReadOnly && (
                <Button variant="link" className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold p-0 h-auto cursor-pointer" onClick={() => setIsEntryModalOpen(true)}>
                  Click here to add your first entry
                </Button>
              )}
            </div>
          ) : (
            currentTimesheet.entries.map((entry: any) => (
              <div key={entry.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                <div className="flex gap-4 items-start">
                  <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border border-emerald-500/20">
                    <span className="text-[10px] font-medium uppercase">{format(parseLocalDate(entry.date), "EEE")}</span>
                    <span className="text-base leading-none font-bold">{format(parseLocalDate(entry.date), "dd")}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                      {entry.project?.project_name || "Unknown Project"}
                      <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-[10px] px-2 py-0.5 rounded-md">
                        {entry.task?.task_name}
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{entry.description || "No description provided"}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] font-medium text-muted-foreground">
                      <span className="flex items-center gap-1 bg-background/80 px-2 py-0.5 rounded-md border border-border/50">
                        <Clock className="w-3 h-3 text-emerald-500" /> 
                        {entry.start_time ? format(new Date(entry.start_time), "HH:mm") : "N/A"} - {entry.end_time ? format(new Date(entry.end_time), "HH:mm") : "N/A"}
                      </span>
                      {entry.break_duration > 0 && (
                        <span className="bg-background/80 px-2 py-0.5 rounded-md border border-border/50">
                          {entry.break_duration}m break
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{entry.total_hours.toFixed(1)}h</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Add Time Entry Modal */}
      <Dialog open={isEntryModalOpen} onOpenChange={setIsEntryModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
          <DialogHeader className="pt-2">
            <DialogTitle className="text-lg font-bold">Add Time Entry</DialogTitle>
            <DialogDescription className="text-xs">
              Record your hours for a specific project and task.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Date <span className="text-destructive">*</span></Label>
              <Input 
                type="date" 
                value={newEntry.date} 
                onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Project <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="E.g. Website Redesign"
                  value={newEntry.project_name}
                  onChange={(e) => setNewEntry({...newEntry, project_name: e.target.value})}
                  className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Task <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="E.g. Frontend Development"
                  value={newEntry.task_name}
                  onChange={(e) => setNewEntry({...newEntry, task_name: e.target.value})}
                  className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Start Time <span className="text-destructive">*</span></Label>
                <Input 
                  type="time" 
                  value={newEntry.start_time} 
                  onChange={(e) => setNewEntry({...newEntry, start_time: e.target.value})}
                  className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">End Time <span className="text-destructive">*</span></Label>
                <Input 
                  type="time" 
                  value={newEntry.end_time} 
                  onChange={(e) => setNewEntry({...newEntry, end_time: e.target.value})}
                  className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Break (mins)</Label>
                <Input 
                  type="number" 
                  min="0"
                  value={newEntry.break_duration} 
                  onChange={(e) => setNewEntry({...newEntry, break_duration: parseInt(e.target.value) || 0})}
                  className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Input 
                placeholder="What did you work on?" 
                value={newEntry.description} 
                onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
              />
            </div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center mt-1">
              <span className="text-xs font-medium text-muted-foreground">Calculated Hours:</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {calculateHours(newEntry.start_time, newEntry.end_time, newEntry.break_duration).toFixed(2)}h
              </span>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEntryModalOpen(false)} className="h-10 text-xs rounded-xl border-border/50 cursor-pointer">Cancel</Button>
            <Button onClick={handleSaveEntry} className="h-10 text-xs font-bold rounded-xl cursor-pointer">Save Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
