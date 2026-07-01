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
      case "APPROVED": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "REJECTED": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "SUBMITTED": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-orange-500/10 text-orange-500 border-orange-500/20";
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

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading timesheets...</div>;

  const totalHours = currentTimesheet?.total_hours || 0;
  const overtimeHours = currentTimesheet?.overtime_hours || 0;
  const regularHours = totalHours - overtimeHours;
  const isReadOnly = currentTimesheet?.status === "SUBMITTED" || currentTimesheet?.status === "APPROVED";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            My Timesheets
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Log your daily activities and track your hours.</p>
        </div>
        <Button 
          onClick={() => setIsEntryModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5"
          disabled={isReadOnly}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Time Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <h3 className="text-2xl font-bold">{totalHours.toFixed(1)}h</h3>
              </div>
            </div>
            <Progress value={(totalHours / 40) * 100} className="h-1.5 mt-4" />
            <p className="text-xs text-muted-foreground mt-2">{Math.max(0, 40 - totalHours).toFixed(1)}h remaining this week</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <Clock4 className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overtime</p>
                <h3 className="text-2xl font-bold">{overtimeHours.toFixed(1)}h</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-sm md:col-span-2">
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Current Status</p>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`font-semibold px-3 py-1 text-sm ${getStatusColor(currentTimesheet?.status || "DRAFT")}`}>
                    {currentTimesheet?.status || "NO TIMESHEET"}
                  </Badge>
                  {currentTimesheet?.status === "REJECTED" && (
                    <span className="text-xs text-red-500 flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-md">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {currentTimesheet.comments}
                    </span>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleSubmitTimesheet}
                disabled={!currentTimesheet || isReadOnly || totalHours === 0}
                variant={isReadOnly ? "secondary" : "default"}
              >
                {currentTimesheet?.status === "SUBMITTED" ? "Awaiting Approval" : 
                 currentTimesheet?.status === "APPROVED" ? "Approved" : "Submit Timesheet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Weekly Entries
          </CardTitle>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <div className="divide-y divide-border/40">
          {(!currentTimesheet || currentTimesheet.entries.length === 0) ? (
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BriefcaseBusiness className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground">No time entries recorded for this week.</p>
              {!isReadOnly && (
                <Button variant="link" className="mt-2 text-primary" onClick={() => setIsEntryModalOpen(true)}>
                  Click here to add your first entry
                </Button>
              )}
            </div>
          ) : (
            currentTimesheet.entries.map((entry: any) => (
              <div key={entry.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 text-primary font-bold w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border border-primary/20">
                    <span className="text-xs font-medium uppercase">{format(parseLocalDate(entry.date), "EEE")}</span>
                    <span className="text-lg leading-none">{format(parseLocalDate(entry.date), "dd")}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      {entry.project?.project_name || "Unknown Project"}
                      <Badge variant="secondary" className="text-[10px] bg-muted">{entry.task?.task_name}</Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{entry.description || "No description provided"}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium text-muted-foreground/70">
                      <span className="flex items-center gap-1 bg-background px-2 py-1 rounded-md border border-border/50">
                        <Clock className="w-3.5 h-3.5" /> 
                        {entry.start_time ? format(new Date(entry.start_time), "HH:mm") : "N/A"} - {entry.end_time ? format(new Date(entry.end_time), "HH:mm") : "N/A"}
                      </span>
                      {entry.break_duration > 0 && (
                        <span className="bg-background px-2 py-1 rounded-md border border-border/50">
                          {entry.break_duration}m break
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{entry.total_hours.toFixed(1)}h</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Dialog open={isEntryModalOpen} onOpenChange={setIsEntryModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Time Entry</DialogTitle>
            <DialogDescription>
              Record your hours for a specific project and task.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date <span className="text-destructive">*</span></Label>
              <Input 
                type="date" 
                value={newEntry.date} 
                onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                className="bg-background/50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Project <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="E.g. Website Redesign"
                  value={newEntry.project_name}
                  onChange={(e) => setNewEntry({...newEntry, project_name: e.target.value})}
                  className="bg-background/50"
                />
              </div>
              <div className="grid gap-2">
                <Label>Task <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="E.g. Frontend Development"
                  value={newEntry.task_name}
                  onChange={(e) => setNewEntry({...newEntry, task_name: e.target.value})}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Start Time <span className="text-destructive">*</span></Label>
                <Input 
                  type="time" 
                  value={newEntry.start_time} 
                  onChange={(e) => setNewEntry({...newEntry, start_time: e.target.value})}
                  className="bg-background/50"
                />
              </div>
              <div className="grid gap-2">
                <Label>End Time <span className="text-destructive">*</span></Label>
                <Input 
                  type="time" 
                  value={newEntry.end_time} 
                  onChange={(e) => setNewEntry({...newEntry, end_time: e.target.value})}
                  className="bg-background/50"
                />
              </div>
              <div className="grid gap-2">
                <Label>Break (mins)</Label>
                <Input 
                  type="number" 
                  min="0"
                  value={newEntry.break_duration} 
                  onChange={(e) => setNewEntry({...newEntry, break_duration: parseInt(e.target.value) || 0})}
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Input 
                placeholder="What did you work on?" 
                value={newEntry.description} 
                onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                className="bg-background/50"
              />
            </div>
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-muted-foreground">Calculated Hours:</span>
              <span className="text-xl font-bold text-primary">
                {calculateHours(newEntry.start_time, newEntry.end_time, newEntry.break_duration).toFixed(2)}h
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEntryModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEntry}>Save Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
