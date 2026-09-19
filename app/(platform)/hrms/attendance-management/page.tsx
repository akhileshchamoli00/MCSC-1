"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, Pencil, Save, X, Search, Users, CheckCircle2, 
  XCircle, Clock, TrendingUp, Plus, Calendar, CalendarDays, ShieldCheck, 
  AlertCircle, Loader2, Sparkles, User, Building2, FileText, ArrowRight,
  Info, Timer, Check
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableEmployeeSelect } from "@/components/searchable-employee-select";

export default function AttendanceManagementPage() {
  const [summary, setSummary] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editDate, setEditDate] = useState("");
  const [editClockInTime, setEditClockInTime] = useState("");
  const [editClockOutTime, setEditClockOutTime] = useState("");
  const [editStatus, setEditStatus] = useState("Auto");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Add Attendance Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [addDate, setAddDate] = useState(new Date().toISOString().split("T")[0]);
  const [addClockInTime, setAddClockInTime] = useState("09:00");
  const [addClockOutTime, setAddClockOutTime] = useState("18:00");
  const [addStatus, setAddStatus] = useState("Auto");
  const [activePreset, setActivePreset] = useState<"standard" | "morning" | "afternoon" | "custom">("standard");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Themed Alert / Confirmation Dialog
  const [dialogAlert, setDialogAlert] = useState<{
    title: string;
    message: string;
    type?: "error" | "success" | "warning";
  } | null>(null);

  const fetchAdminData = async () => {
    try {
      const [sumRes, attRes, corrRes, empRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/today-summary`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/corrections?status=PENDING`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { credentials: "include" })
      ]);
      
      if (sumRes.ok) setSummary(await sumRes.json());
      if (attRes.ok) setAttendance(await attRes.json());
      if (corrRes.ok) setCorrections(await corrRes.json());
      if (empRes.ok) setEmployeesList(await empRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/correction/${id}/approve`, {
        credentials: "include",
        method: "PUT",
      });
      fetchAdminData();
    } catch (e) {}
  };

  const handleReject = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/correction/${id}/reject`, {
        credentials: "include",
        method: "PUT",
      });
      fetchAdminData();
    } catch (e) {}
  };

  const openEditModal = (rec: any) => {
    setSelectedRecord(rec);
    setEditDate(rec.attendance_date);
    const extractTime = (dateString: string) => {
      if (!dateString) return "";
      const d = new Date(dateString);
      return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    };
    
    setEditClockInTime(extractTime(rec.clock_in_time));
    setEditClockOutTime(extractTime(rec.clock_out_time));
    setEditStatus(rec.status || "Auto");
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedRecord) return;
    try {
      setIsSubmittingEdit(true);
      const buildDate = (timeStr: string) => {
        if (!timeStr || !timeStr.trim()) return null;
        const cleaned = timeStr.replace(/[^0-9:]/g, "");
        let [h, m] = cleaned.split(":");
        if (!h) return null;
        if (!m) m = "00";
        if (h.length === 1) h = "0" + h;
        if (m.length === 1) m = "0" + m;
        if (parseInt(h) > 23) h = "23";
        if (parseInt(m) > 59) m = "59";
        
        return new Date(`${editDate}T${h}:${m}:00`).toISOString();
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/${selectedRecord.id}`, {
        credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clock_in_time: buildDate(editClockInTime),
          clock_out_time: buildDate(editClockOutTime),
          status: editStatus === "Auto" ? undefined : editStatus
        })
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchAdminData();
        setDialogAlert({
          title: "Attendance Updated",
          message: "The attendance record was successfully updated.",
          type: "success"
        });
      } else {
        let detail = "Failed to update attendance record.";
        try {
          const errJson = await res.json();
          detail = errJson.detail || detail;
        } catch {
          const raw = await res.text().catch(() => "");
          if (raw) detail = raw;
        }
        setDialogAlert({
          title: "Update Failed",
          message: detail,
          type: "error"
        });
      }
    } catch (e: any) {
      console.error(e);
      setDialogAlert({
        title: "Error",
        message: e?.message || "An unexpected error occurred.",
        type: "error"
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Check if selected employee already has attendance for the chosen date
  const existingRecordOnDate = useMemo(() => {
    if (!selectedEmployeeId || !addDate) return null;
    return attendance.find(
      (rec) =>
        rec.employee_id?.toString() === selectedEmployeeId.toString() &&
        rec.attendance_date === addDate
    );
  }, [attendance, selectedEmployeeId, addDate]);

  // Lookup the selected employee object for richer info display
  const selectedEmployeeObj = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return employeesList.find((e) => e.id.toString() === selectedEmployeeId.toString()) || null;
  }, [employeesList, selectedEmployeeId]);

  // Calculate live duration preview in modal
  const estimatedHours = useMemo(() => {
    if (!addClockInTime || !addClockOutTime) return null;
    const [inH, inM] = addClockInTime.split(":").map(Number);
    const [outH, outM] = addClockOutTime.split(":").map(Number);
    if (isNaN(inH) || isNaN(outH)) return null;
    const totalMinutes = (outH * 60 + (outM || 0)) - (inH * 60 + (inM || 0));
    if (totalMinutes <= 0) return 0;
    return (totalMinutes / 60).toFixed(1);
  }, [addClockInTime, addClockOutTime]);

  const handleAddAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setDialogAlert({
        title: "Employee Selection Required",
        message: "Please select an employee to record attendance for.",
        type: "warning"
      });
      return;
    }
    if (!addDate) {
      setDialogAlert({
        title: "Attendance Date Required",
        message: "Please specify a valid attendance date.",
        type: "warning"
      });
      return;
    }

    if (existingRecordOnDate) {
      const emp = employeesList.find((e) => e.id.toString() === selectedEmployeeId.toString());
      const empName = emp ? `${emp.first_name} ${emp.last_name}` : "this employee";
      setDialogAlert({
        title: "Duplicate Record Detected",
        message: `An attendance record already exists for ${empName} on ${addDate}. Duplicate entries for the same employee and date are blocked. Please edit the existing record from the table instead.`,
        type: "warning"
      });
      return;
    }

    try {
      setIsSubmittingAdd(true);
      const buildDate = (timeStr: string) => {
        if (!timeStr || !timeStr.trim()) return null;
        const cleaned = timeStr.replace(/[^0-9:]/g, "");
        let [h, m] = cleaned.split(":");
        if (!h) return null;
        if (!m) m = "00";
        if (h.length === 1) h = "0" + h;
        if (m.length === 1) m = "0" + m;
        if (parseInt(h) > 23) h = "23";
        if (parseInt(m) > 59) m = "59";
        
        return new Date(`${addDate}T${h}:${m}:00`).toISOString();
      };

      const payload = {
        employee_id: parseInt(selectedEmployeeId),
        attendance_date: addDate,
        clock_in_time: buildDate(addClockInTime),
        clock_out_time: buildDate(addClockOutTime),
        status: addStatus === "Auto" ? undefined : addStatus
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/manual`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setSelectedEmployeeId("");
        setAddClockInTime("09:00");
        setAddClockOutTime("18:00");
        setAddStatus("Auto");
        setActivePreset("standard");
        fetchAdminData();
        setDialogAlert({
          title: "Attendance Recorded",
          message: "Attendance entry was successfully recorded and verified.",
          type: "success"
        });
      } else {
        let detail = "Failed to record attendance.";
        try {
          const errJson = await res.json();
          detail = errJson.detail || detail;
        } catch {
          const raw = await res.text().catch(() => "");
          if (raw) detail = raw;
        }
        setDialogAlert({
          title: "Unable to Add Attendance",
          message: detail,
          type: "error"
        });
      }
    } catch (err: any) {
      console.error(err);
      setDialogAlert({
        title: "Communication Error",
        message: err?.message || "An unexpected error occurred while communicating with the server.",
        type: "error"
      });
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const applyShiftPreset = (preset: "standard" | "morning" | "afternoon" | "clear") => {
    setActivePreset(preset === "clear" ? "custom" : preset);
    if (preset === "standard") {
      setAddClockInTime("09:00");
      setAddClockOutTime("18:00");
      setAddStatus("Auto");
    } else if (preset === "morning") {
      setAddClockInTime("09:00");
      setAddClockOutTime("13:00");
      setAddStatus("Half Day");
    } else if (preset === "afternoon") {
      setAddClockInTime("13:00");
      setAddClockOutTime("18:00");
      setAddStatus("Half Day");
    } else if (preset === "clear") {
      setAddClockInTime("");
      setAddClockOutTime("");
      setAddStatus("Auto");
    }
  };

  const filteredAttendance = attendance.filter((rec) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const name = rec.employee ? `${rec.employee.first_name} ${rec.employee.last_name}`.toLowerCase() : String(rec.employee_id);
    const date = rec.attendance_date.toLowerCase();
    return name.includes(term) || date.includes(term);
  });

  const totalPages = Math.ceil(filteredAttendance.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedAttendance = filteredAttendance.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-none pb-12">
      {/* Minimalist Metrics Strip & Action Buttons Row (Positioned beside Key Matrix) */}
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
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{summary?.total_employees ?? 0}</p>
            </div>
          </div>

          {/* Present */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Present</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{summary?.present ?? 0}</p>
            </div>
          </div>

          {/* Absent */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
              <XCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Absent</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{summary?.absent ?? 0}</p>
            </div>
          </div>

          {/* Late */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Late</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{summary?.late ?? 0}</p>
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Attendance Rate</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{summary?.percentage ?? 0}%</p>
            </div>
          </div>
        </div>

        {/* Action Button positioned beside the Key Matrix */}
        <div className="flex items-stretch shrink-0">
          {/* Add Attendance Button */}
          <Button 
            onClick={() => {
              setAddDate(new Date().toISOString().split("T")[0]);
              setSelectedEmployeeId("");
              setAddClockInTime("09:00");
              setAddClockOutTime("18:00");
              setAddStatus("Auto");
              setActivePreset("standard");
              setIsAddModalOpen(true);
            }} 
            className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-5 sm:px-6 text-xs sm:text-sm shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Attendance
          </Button>
        </div>
      </div>

      {/* Corrections Queue */}
      {corrections.filter(c => c.status === "PENDING").length > 0 && (
        <Card className="border-orange-200 shadow-sm overflow-hidden">
          <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
            <h3 className="font-semibold text-orange-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Pending Corrections
            </h3>
          </div>
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Req. In</th>
                  <th className="px-4 py-3">Req. Out</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {corrections.filter(c => c.status === "PENDING").map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium">
                      {c.employee ? `${c.employee.first_name} ${c.employee.last_name}` : `EMP ID: ${c.employee_id}`}
                    </td>
                    <td className="px-4 py-3">{c.requested_clock_in ? new Date(c.requested_clock_in).toLocaleTimeString() : "-"}</td>
                    <td className="px-4 py-3">{c.requested_clock_out ? new Date(c.requested_clock_out).toLocaleTimeString() : "-"}</td>
                    <td className="px-4 py-3 italic">{c.reason}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleApprove(c.id)}>Approve</Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleReject(c.id)}>Reject</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by employee name or date..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-indigo-500/50 shadow-xs"
          />
        </div>
      </div>

      {/* Main Attendance Table */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/20 border-b border-border/40">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Employee Name</th>
                  <th className="px-5 py-3.5 font-medium">Date</th>
                  <th className="px-5 py-3.5 font-medium">Clock In</th>
                  <th className="px-5 py-3.5 font-medium">Clock Out</th>
                  <th className="px-5 py-3.5 font-medium">Hours</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-xs text-muted-foreground">
                      No attendance records found matching your search.
                    </td>
                  </tr>
                ) : (
                  paginatedAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium">
                        {rec.employee ? `${rec.employee.first_name} ${rec.employee.last_name}` : rec.employee_id}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{rec.attendance_date}</td>
                      <td className="px-5 py-3.5 font-mono text-xs">{rec.clock_in_time ? new Date(rec.clock_in_time).toLocaleTimeString() : "-"}</td>
                      <td className="px-5 py-3.5 font-mono text-xs">{rec.clock_out_time ? new Date(rec.clock_out_time).toLocaleTimeString() : "-"}</td>
                      <td className="px-5 py-3.5 font-medium">{rec.working_hours}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={`
                          ${rec.status === 'Present' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : ''}
                          ${rec.status === 'Late' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' : ''}
                          ${rec.status === 'Half Day' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' : ''}
                          ${rec.status === 'Absent' ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' : ''}
                        `}>
                          {rec.status}
                        </Badge>
                        {rec.late_minutes > 0 && <span className="ml-2 text-xs text-rose-500 font-semibold">+{rec.late_minutes}m</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(rec)} className="h-8 w-8 p-0 cursor-pointer hover:bg-muted rounded-lg">
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/40 bg-muted/10 mt-0">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(filteredAttendance.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{filteredAttendance.length}</span> entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs rounded-lg border-border/50"
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
                  className="h-8 text-xs rounded-lg border-border/50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spacious & Themed Add Attendance Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent 
          className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto w-full border border-border/60 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-3xl p-6 sm:p-8 md:p-10"
        >
          <form onSubmit={handleAddAttendance} className="space-y-7 sm:space-y-8">
            {/* Modal Header */}
            <DialogHeader className="border-b border-border/40 pb-5 sm:pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-xs shrink-0">
                    <Plus className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                      Record Manual Attendance
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                      Log official attendance records, shift schedules, and working hours for employees.
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Duplicate Warning Callout Banner (if detected) */}
            {existingRecordOnDate && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs sm:text-sm space-y-2 animate-in fade-in duration-200 shadow-xs">
                <div className="flex items-center gap-2.5 font-bold text-amber-800 dark:text-amber-300 text-sm">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  Duplicate Record Detected on Selected Date
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                  An attendance entry for this employee is already logged for <strong className="font-semibold">{addDate}</strong> (Current Status: <strong className="font-semibold">{existingRecordOnDate.status}</strong>, Clock In: <strong className="font-semibold">{existingRecordOnDate.clock_in_time ? new Date(existingRecordOnDate.clock_in_time).toLocaleTimeString() : "N/A"}</strong>). Duplicate submissions for the same employee and date are blocked. You can close this dialog and click the edit pencil icon on the record row to update it.
                </p>
              </div>
            )}

            {/* Modal Body - 2 Generous Columns on Tablet / Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
              
              {/* Left Column: Employee & Date */}
              <div className="space-y-6 bg-card/60 dark:bg-zinc-900/50 p-6 sm:p-7 rounded-3xl border border-border/50 shadow-xs flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-1 border-b border-border/40">
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" /> Employee & Date Details
                    </h4>
                    <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      Step 1
                    </span>
                  </div>

                  {/* Employee Selection */}
                  <div className="space-y-2.5">
                    <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center justify-between">
                      <span>Staff Member <span className="text-rose-500">*</span></span>
                      {selectedEmployeeId && (
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                          <Check className="h-3 w-3" /> Selected
                        </span>
                      )}
                    </Label>
                    <SearchableEmployeeSelect
                      employees={employeesList}
                      value={selectedEmployeeId}
                      onChange={(val) => setSelectedEmployeeId(val)}
                      placeholder="Search staff by name, department, or ID..."
                      accentColor="indigo"
                    />

                    {/* Selected Employee Info Chip */}
                    {selectedEmployeeObj && (
                      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-background/80 border border-border/50 text-xs text-muted-foreground animate-in fade-in">
                        <Building2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="font-medium text-foreground truncate">
                          {typeof selectedEmployeeObj.department === "object" ? selectedEmployeeObj.department?.name : selectedEmployeeObj.department || "General"}
                        </span>
                        <span>•</span>
                        <span className="truncate">{selectedEmployeeObj.email || `EMP-${selectedEmployeeObj.id}`}</span>
                      </div>
                    )}
                  </div>

                  {/* Attendance Date */}
                  <div className="space-y-2.5">
                    <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" /> Attendance Date <span className="text-rose-500">*</span>
                    </Label>
                    <Input 
                      type="date" 
                      value={addDate} 
                      onChange={(e) => setAddDate(e.target.value)} 
                      className="h-12 text-xs sm:text-sm bg-background/80 border-border/60 rounded-xl px-3.5 font-medium"
                      required
                    />
                  </div>

                  {/* Status Override */}
                  <div className="space-y-2.5">
                    <Label className="text-xs sm:text-sm font-semibold text-foreground">
                      Attendance Status Classification
                    </Label>
                    <Select value={addStatus} onValueChange={setAddStatus}>
                      <SelectTrigger className="h-12 text-xs sm:text-sm bg-background/80 border-border/60 rounded-xl px-3.5 font-medium">
                        <SelectValue placeholder="Select attendance status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/60 shadow-xl">
                        <SelectItem value="Auto" className="text-xs sm:text-sm py-2.5 cursor-pointer">
                          ✨ Auto-Calculate (By shift hours & 09:00 threshold)
                        </SelectItem>
                        <SelectItem value="Present" className="text-xs sm:text-sm py-2.5 cursor-pointer">
                          🟢 Present (Standard on-time attendance)
                        </SelectItem>
                        <SelectItem value="Late" className="text-xs sm:text-sm py-2.5 cursor-pointer">
                          🟠 Late (Tardy arrival after threshold)
                        </SelectItem>
                        <SelectItem value="Half Day" className="text-xs sm:text-sm py-2.5 cursor-pointer">
                          🟡 Half Day (Reduced working hours)
                        </SelectItem>
                        <SelectItem value="Absent" className="text-xs sm:text-sm py-2.5 cursor-pointer">
                          🔴 Absent (Missing / Unexcused attendance)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>Verified admin action with duplicate prevention protection</span>
                </div>
              </div>

              {/* Right Column: Shift Presets & Timestamps */}
              <div className="space-y-6 bg-card/60 dark:bg-zinc-900/50 p-6 sm:p-7 rounded-3xl border border-border/50 shadow-xs flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-1 border-b border-border/40">
                    <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Timer className="h-4 w-4 text-indigo-500" /> Working Shift & Timestamps
                    </h4>
                    {estimatedHours !== null && (
                      <Badge variant="outline" className="text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 px-3 py-1 rounded-xl shadow-xs">
                        {estimatedHours} Hrs Duration
                      </Badge>
                    )}
                  </div>

                  {/* Quick Shift Presets Buttons */}
                  <div className="space-y-2.5">
                    <Label className="text-xs sm:text-sm font-semibold text-foreground">
                      Quick Shift Presets
                    </Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => applyShiftPreset("standard")}
                        className={`p-3 sm:p-3.5 text-xs font-semibold rounded-2xl border transition-all cursor-pointer text-left flex items-center justify-between ${
                          activePreset === "standard"
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30"
                            : "bg-background/80 hover:bg-muted text-foreground border-border/60"
                        }`}
                      >
                        <div>
                          <p className="font-bold">Full Day</p>
                          <p className={`text-[11px] ${activePreset === "standard" ? "text-indigo-100" : "text-muted-foreground"}`}>09:00 - 18:00</p>
                        </div>
                        <span className="text-xs opacity-80">9h</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyShiftPreset("morning")}
                        className={`p-3 sm:p-3.5 text-xs font-semibold rounded-2xl border transition-all cursor-pointer text-left flex items-center justify-between ${
                          activePreset === "morning"
                            ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/30"
                            : "bg-background/80 hover:bg-muted text-foreground border-border/60"
                        }`}
                      >
                        <div>
                          <p className="font-bold">Half Day AM</p>
                          <p className={`text-[11px] ${activePreset === "morning" ? "text-amber-100" : "text-muted-foreground"}`}>09:00 - 13:00</p>
                        </div>
                        <span className="text-xs opacity-80">4h</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyShiftPreset("afternoon")}
                        className={`p-3 sm:p-3.5 text-xs font-semibold rounded-2xl border transition-all cursor-pointer text-left flex items-center justify-between ${
                          activePreset === "afternoon"
                            ? "bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/30"
                            : "bg-background/80 hover:bg-muted text-foreground border-border/60"
                        }`}
                      >
                        <div>
                          <p className="font-bold">Half Day PM</p>
                          <p className={`text-[11px] ${activePreset === "afternoon" ? "text-amber-100" : "text-muted-foreground"}`}>13:00 - 18:00</p>
                        </div>
                        <span className="text-xs opacity-80">5h</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyShiftPreset("clear")}
                        className={`p-3 sm:p-3.5 text-xs font-semibold rounded-2xl border transition-all cursor-pointer text-left flex items-center justify-between ${
                          activePreset === "custom"
                            ? "bg-zinc-800 text-white border-zinc-700 shadow-md ring-2 ring-zinc-500/30 dark:bg-zinc-700"
                            : "bg-background/80 hover:bg-muted text-muted-foreground border-border/60"
                        }`}
                      >
                        <div>
                          <p className="font-bold">Custom Times</p>
                          <p className="text-[11px] opacity-80">Manual input</p>
                        </div>
                        <Clock className="h-3.5 w-3.5 opacity-60" />
                      </button>
                    </div>
                  </div>

                  {/* Clock In & Clock Out Inputs */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" /> Clock In Time
                      </Label>
                      <Input 
                        type="text" 
                        placeholder="09:00"
                        value={addClockInTime} 
                        onChange={(e) => {
                          setAddClockInTime(e.target.value);
                          setActivePreset("custom");
                        }} 
                        className="h-12 text-sm sm:text-base bg-background/80 border-border/60 rounded-xl font-mono font-semibold text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" /> Clock Out Time
                      </Label>
                      <Input 
                        type="text" 
                        placeholder="18:00"
                        value={addClockOutTime} 
                        onChange={(e) => {
                          setAddClockOutTime(e.target.value);
                          setActivePreset("custom");
                        }} 
                        className="h-12 text-sm sm:text-base bg-background/80 border-border/60 rounded-xl font-mono font-semibold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Helpful policy note & summary strip */}
                <div className="p-4 rounded-2xl bg-background/80 border border-border/50 space-y-2 text-xs text-muted-foreground shadow-xs">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Timer className="h-3.5 w-3.5 text-indigo-500" /> Shift Hours Estimate
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {estimatedHours ? `${estimatedHours} Hrs Total` : "—"}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Recording manual attendance will directly update the employee's monthly matrix, hours calculation, and KPI reports.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <DialogFooter className="border-t border-border/40 pt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3.5">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto h-12 px-7 rounded-2xl border-border/60 text-xs sm:text-sm font-semibold hover:bg-muted cursor-pointer" 
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingAdd || !selectedEmployeeId || !addDate || !!existingRecordOnDate} 
                className="w-full sm:w-auto h-12 px-9 rounded-2xl text-xs sm:text-sm font-bold gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmittingAdd ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Recording Attendance...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Save Attendance Record
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent 
          className="sm:max-w-[480px] border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-3xl p-6 sm:p-7"
        >
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground">Edit Attendance Record</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Modify the clock-in, clock-out, or status for {selectedRecord?.employee ? `${selectedRecord.employee.first_name} ${selectedRecord.employee.last_name}` : "this employee"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</Label>
              <Input 
                type="date" 
                value={editDate} 
                onChange={(e) => setEditDate(e.target.value)} 
                className="h-11 text-xs sm:text-sm bg-background/50 border-border/60 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clock In Time</Label>
                <Input 
                  type="text" 
                  placeholder="HH:MM (e.g. 09:00)"
                  value={editClockInTime} 
                  onChange={(e) => setEditClockInTime(e.target.value)} 
                  className="h-11 text-xs sm:text-sm bg-background/50 border-border/60 rounded-xl font-mono text-center"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clock Out Time</Label>
                <Input 
                  type="text" 
                  placeholder="HH:MM (e.g. 18:00)"
                  value={editClockOutTime} 
                  onChange={(e) => setEditClockOutTime(e.target.value)} 
                  className="h-11 text-xs sm:text-sm bg-background/50 border-border/60 rounded-xl font-mono text-center"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="h-11 text-xs sm:text-sm bg-background/50 border-border/60 rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60">
                  <SelectItem value="Auto" className="text-xs cursor-pointer">✨ Auto-Calculate</SelectItem>
                  <SelectItem value="Present" className="text-xs cursor-pointer">🟢 Present</SelectItem>
                  <SelectItem value="Late" className="text-xs cursor-pointer">🟠 Late</SelectItem>
                  <SelectItem value="Half Day" className="text-xs cursor-pointer">🟡 Half Day</SelectItem>
                  <SelectItem value="Absent" className="text-xs cursor-pointer">🔴 Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 flex items-center justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="h-10 px-5 rounded-xl text-xs font-semibold">
              Cancel
            </Button>
            <Button 
              onClick={handleEditSave} 
              disabled={isSubmittingEdit}
              className="h-10 px-6 rounded-xl text-xs font-bold"
            >
              {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Themed Feedback & Alert Dialog */}
      <Dialog open={!!dialogAlert} onOpenChange={(open) => !open && setDialogAlert(null)}>
        <DialogContent 
          className="sm:max-w-md border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl p-6"
        >
          <DialogHeader className="pt-2">
            <div className="flex items-center gap-2.5">
              <div className={`h-9 w-9 rounded-2xl flex items-center justify-center border shrink-0 ${
                dialogAlert?.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : dialogAlert?.type === 'warning'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}>
                {dialogAlert?.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : dialogAlert?.type === 'warning' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                {dialogAlert?.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm text-foreground/80 mt-2 font-medium leading-relaxed">
              {dialogAlert?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3">
            <Button 
              onClick={() => setDialogAlert(null)} 
              className="w-full sm:w-auto h-10 px-6 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
