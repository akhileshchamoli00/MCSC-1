"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Coffee, List, AlertCircle, Paperclip, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Form Validation Schema
const leaveFormSchema = z.object({
  leave_type: z.string().min(1, { message: "Leave type is required" }),
  start_date: z.string().min(1, { message: "Start date is required" }),
  end_date: z.string().min(1, { message: "End date is required" }),
  reason: z.string().min(5, { message: "Reason must be at least 5 characters" }).max(100, { message: "Reason cannot exceed 100 characters" }),
  is_half_day: z.boolean().default(false)
}).refine((data) => {
  if (data.is_half_day) return true; // if half day, we don't care about end date strictness as much, but we set it equal anyway
  return new Date(data.end_date) >= new Date(data.start_date);
}, {
  message: "End date must be after or same as start date",
  path: ["end_date"]
});

type LeaveFormValues = z.infer<typeof leaveFormSchema>;

export default function ApplyLeavePage() {
  const [balances, setBalances] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [confirmEmergencyOpen, setConfirmEmergencyOpen] = useState(false);
  const [pendingSubmitValues, setPendingSubmitValues] = useState<LeaveFormValues | null>(null);

  // Edit Leave Request State
  const [editingLeave, setEditingLeave] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    reason: "",
    is_half_day: false
  });
  const [editCalculatedDays, setEditCalculatedDays] = useState(0);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [confirmEditEmergencyOpen, setConfirmEditEmergencyOpen] = useState(false);

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leave_type: "Annual Leave",
      start_date: "",
      end_date: "",
      reason: "",
      is_half_day: false
    }
  });

  const watchStartDate = form.watch("start_date");
  const watchEndDate = form.watch("end_date");
  const watchIsHalfDay = form.watch("is_half_day");
  const watchReason = form.watch("reason") || "";
  const [calculatedDays, setCalculatedDays] = useState(0);

  const calculateWorkingDays = (start: string, end: string, currentHistory: any[]) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < startDate) return 0;

    let count = 0;
    let curDate = new Date(startDate);
    
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sun, 6 = Sat
        // Format to YYYY-MM-DD for comparison
        const tzOffset = curDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(curDate.getTime() - tzOffset)).toISOString().split('T')[0];
        
        let existingWeight = 0;
        currentHistory.forEach((req: any) => {
          if (req.status === "APPROVED" || req.status === "PENDING") {
            if (localISOTime >= req.start_date && localISOTime <= req.end_date) {
              if (req.days_requested === 0.5 && req.start_date === req.end_date) {
                existingWeight += 0.5;
              } else {
                existingWeight += 1.0;
              }
            }
          }
        });
        
        const availableForDay = Math.max(0, 1.0 - existingWeight);
        count += availableForDay;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  const calculateWorkingDaysAdvance = (startDateStr: string) => {
    if (!startDateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    if (startDate <= today) {
      return 0;
    }

    let workingDays = 0;
    let current = new Date(today);
    current.setDate(current.getDate() + 1);

    while (current <= startDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  };

  useEffect(() => {
    const calculated = calculateWorkingDays(watchStartDate, watchEndDate, history);
    
    if (watchIsHalfDay) {
      if (watchStartDate && watchEndDate !== watchStartDate) {
        form.setValue("end_date", watchStartDate);
      }
      // If calculated is 0, the day is fully booked, so even half-day is 0
      setCalculatedDays(calculated === 0 ? 0 : 0.5);
    } else {
      setCalculatedDays(calculated);
      
      // Auto-check half day if the available time for a single day is 0.5
      if (calculated === 0.5 && watchStartDate === watchEndDate) {
        form.setValue("is_half_day", true);
      }
    }
  }, [watchStartDate, watchEndDate, watchIsHalfDay, history, form]);

  useEffect(() => {
    if (editingLeave) {
      const filteredHistory = history.filter((req: any) => req.id !== editingLeave.id);
      const calculated = calculateWorkingDays(editForm.start_date, editForm.end_date, filteredHistory);
      
      if (editForm.is_half_day) {
        if (editForm.start_date && editForm.end_date !== editForm.start_date) {
          setEditForm(prev => ({ ...prev, end_date: editForm.start_date }));
        }
        setEditCalculatedDays(calculated === 0 ? 0 : 0.5);
      } else {
        setEditCalculatedDays(calculated);
      }
    }
  }, [editForm.start_date, editForm.end_date, editForm.is_half_day, history, editingLeave]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("hrms_token");
      if (!token) return;

      const [balRes, histRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/my-balances`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/my-requests`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (balRes.ok) setBalances(await balRes.json());
      if (histRes.ok) setHistory(await histRes.json());
    } catch (err) {
      console.error("Failed to fetch leave data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPages = Math.ceil(history.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedHistory = history.slice(startIndex, endIndex);

  const executeSubmit = async (values: LeaveFormValues) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/request`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      
      if (res.ok) {
        const createdLeave = await res.json();
        
        // Upload attachment if any
        if (attachment && (values.leave_type === "Sick Leave" || values.leave_type === "Emergency Leave")) {
          const formData = new FormData();
          formData.append("file", attachment);
          
          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/request/${createdLeave.id}/upload-attachment`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${token}`
              },
              body: formData
            });
          } catch (uploadErr) {
            console.error("Attachment upload failed", uploadErr);
          }
        }
        
        form.reset();
        setAttachment(null);
        fetchData();
      } else {
        const error = await res.json();
        setErrorMessage(error.detail || "Failed to submit leave request");
        setErrorModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred while submitting your request.");
      setErrorModalOpen(true);
    } finally {
      setSubmitting(false);
      setPendingSubmitValues(null);
    }
  };

  const onSubmit = async (values: LeaveFormValues) => {
    if (calculatedDays <= 0) {
      alert("Requested period contains no working days.");
      return;
    }

    if (values.leave_type === "Annual Leave" || values.leave_type === "Emergency Leave") {
      const remainingBalance = balances?.annual_leave?.remaining ?? 0;
      if (remainingBalance <= 0) {
        toast.error("You cannot apply for Annual Leave or Emergency Leave because your remaining Annual Leave balance is 0 or less.", {
          style: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
            borderColor: '#dc2626'
          }
        });
        return;
      }
    }

    if (values.leave_type === "Annual Leave") {
      const advanceNotice = calculateWorkingDaysAdvance(values.start_date);
      if (advanceNotice < 5) {
        setPendingSubmitValues(values);
        setConfirmEmergencyOpen(true);
        return;
      }
    }

    await executeSubmit(values);
  };

  const confirmSubmitEmergency = async () => {
    if (pendingSubmitValues) {
      const updatedValues = {
        ...pendingSubmitValues,
        leave_type: "Emergency Leave"
      };
      setConfirmEmergencyOpen(false);
      await executeSubmit(updatedValues);
    }
  };

  const handleStartEdit = (req: any) => {
    setEditingLeave(req);
    setEditForm({
      leave_type: req.leave_type,
      start_date: req.start_date,
      end_date: req.end_date,
      reason: req.reason || "",
      is_half_day: req.days_requested === 0.5 && req.start_date === req.end_date
    });
  };

  const executeEditSubmit = async (values: typeof editForm) => {
    try {
      setEditSubmitting(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/request/${editingLeave.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      
      if (res.ok) {
        setEditingLeave(null);
        fetchData();
        toast.success("Leave request updated successfully");
      } else {
        const error = await res.json();
        setErrorMessage(error.detail || "Failed to update leave request");
        setErrorModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("An unexpected error occurred while updating your request.");
      setErrorModalOpen(true);
    } finally {
      setEditSubmitting(false);
      setConfirmEditEmergencyOpen(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editCalculatedDays <= 0) {
      alert("Requested period contains no working days.");
      return;
    }

    if (!editForm.reason || editForm.reason.trim().length < 5) {
      toast.error("Reason must be at least 5 characters");
      return;
    }

    if (editForm.reason.length > 100) {
      toast.error("Reason cannot exceed 100 characters");
      return;
    }

    if (editForm.leave_type === "Annual Leave" || editForm.leave_type === "Emergency Leave") {
      const remainingBalance = balances?.annual_leave?.remaining ?? 0;
      if (remainingBalance <= 0) {
        toast.error("You cannot apply for Annual Leave or Emergency Leave because your remaining Annual Leave balance is 0 or less.", {
          style: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
            borderColor: '#dc2626'
          }
        });
        return;
      }
    }

    if (editForm.leave_type === "Annual Leave") {
      const advanceNotice = calculateWorkingDaysAdvance(editForm.start_date);
      if (advanceNotice < 5) {
        setConfirmEditEmergencyOpen(true);
        return;
      }
    }

    await executeEditSubmit(editForm);
  };

  const confirmEditSubmitEmergency = async () => {
    const updatedValues = {
      ...editForm,
      leave_type: "Emergency Leave"
    };
    await executeEditSubmit(updatedValues);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-6">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold tracking-tight">Apply Leave</h1>
        <p className="text-muted-foreground text-xs">Submit a new leave request and view your balance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* Application Form */}
        <Card className="border-border/50 shadow-sm md:col-span-1 h-fit">
          <CardHeader className="py-4">
            <CardTitle className="text-base font-bold">New Request</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Leave Type</label>
                <Select 
                  value={form.watch("leave_type") || ""} 
                  onValueChange={(val) => form.setValue("leave_type", val)}
                >
                  <SelectTrigger className="w-full h-10 border border-input bg-background px-3 py-2 text-sm">
                    <SelectValue placeholder="Select Leave Type" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="Annual Leave" className="text-xs">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave" className="text-xs">Sick Leave</SelectItem>
                    <SelectItem value="Unpaid Leave" className="text-xs">Unpaid Leave</SelectItem>
                    <SelectItem value="Emergency Leave" className="text-xs">Emergency Leave</SelectItem>
                    <SelectItem value="Maternity Leave" className="text-xs">Maternity Leave</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.leave_type && <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.leave_type.message}</p>}
              </div>

              {(form.watch("leave_type") === "Annual Leave" || form.watch("leave_type") === "Emergency Leave") && (balances?.annual_leave?.remaining ?? 0) <= 0 && (
                <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] flex items-start gap-2 leading-normal">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>You cannot apply for Annual Leave or Emergency Leave because your remaining Annual Leave balance is 0 or less.</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Start Date</label>
                <Input type="date" className="h-10 text-sm py-2" {...form.register("start_date")} />
                {form.formState.errors.start_date && <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.start_date.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">End Date</label>
                <Input type="date" className="h-10 text-sm py-2" {...form.register("end_date")} disabled={watchIsHalfDay} />
                {form.formState.errors.end_date && <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.end_date.message}</p>}
              </div>

              <div className="flex items-center space-x-2 pt-2 pb-2">
                <input 
                  type="checkbox" 
                  id="is_half_day" 
                  {...form.register("is_half_day")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_half_day" className="text-xs font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Half-Day Leave
                </label>
              </div>

              {form.watch("leave_type") === "Sick Leave" && (
                <div className="space-y-2 p-2.5 bg-muted/30 border border-border/50 rounded-md">
                  <label className="text-xs font-semibold text-muted-foreground">Medical Certificate (Optional)</label>
                  <Input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    className="h-10 text-sm py-2"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setAttachment(e.target.files[0]);
                      } else {
                        setAttachment(null);
                      }
                    }}
                  />
                  <p className="text-[9px] text-muted-foreground leading-normal">Only image files (PNG, JPEG) are allowed to keep file size small.</p>
                </div>
              )}

              <div className="space-y-2 bg-muted/50 p-2.5 rounded-md border border-border/50 flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground">Number of Days (Excl. Weekends)</label>
                <span className="text-lg font-bold text-foreground">{calculatedDays}</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Reason</label>
                <Textarea 
                  {...form.register("reason")} 
                  placeholder="Reason for taking leave..." 
                  className="min-h-[140px] text-sm py-2"
                  maxLength={100}
                />
                <div className="flex justify-between items-center text-[10px] mt-1">
                  {form.formState.errors.reason ? (
                    <p className="text-red-500">{form.formState.errors.reason.message}</p>
                  ) : (
                    <div />
                  )}
                  <span className="text-muted-foreground">{watchReason.length}/100</span>
                </div>
              </div>

              <Button type="submit" className="w-full mt-2 h-10 text-sm font-semibold" disabled={submitting || calculatedDays <= 0}>
                {submitting ? "Submitting..." : "Submit Leave Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Stack of Balances and History */}
        <div className="md:col-span-2 flex flex-col gap-4 animate-in fade-in duration-500">
          {/* Balance Summary Table */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/50 py-2.5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Coffee className="h-4 w-4 text-primary" /> My Leave Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Leave Type</th>
                      <th className="px-4 py-2 font-semibold text-center">Allocated</th>
                      <th className="px-4 py-2 font-semibold text-center">Used</th>
                      <th className="px-4 py-2 font-semibold text-center">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {loading || !balances ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : (
                      <>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2 font-medium">Annual Leave</td>
                          <td className="px-4 py-2 text-center">
                            {balances.annual_leave.allocated}
                            {balances.annual_leave.additions > 0 && (
                              <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold block mt-0.5 animate-pulse">
                                (+{balances.annual_leave.additions} Added)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">{balances.annual_leave.used}</td>
                          <td className="px-4 py-2 text-center font-bold text-primary">{balances.annual_leave.remaining}</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2 font-medium">Sick Leave</td>
                          <td className="px-4 py-2 text-center">
                            {balances.sick_leave.allocated === 0 ? "-" : balances.sick_leave.allocated}
                          </td>
                          <td className="px-4 py-2 text-center">{balances.sick_leave.used}</td>
                          <td className="px-4 py-2 text-center font-bold text-orange-600">{balances.sick_leave.remaining}</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2 font-medium">Unpaid Leave</td>
                          <td className="px-4 py-2 text-center">-</td>
                          <td className="px-4 py-2 text-center">{balances.unpaid_leave?.used || 0}</td>
                          <td className="px-4 py-2 text-center font-bold text-muted-foreground">-</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2 font-medium">Emergency Leave</td>
                          <td className="px-4 py-2 text-center">-</td>
                          <td className="px-4 py-2 text-center">{balances.emergency_leave?.used || 0}</td>
                          <td className="px-4 py-2 text-center font-bold text-muted-foreground">-</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2 font-medium">Maternity Leave</td>
                          <td className="px-4 py-2 text-center">-</td>
                          <td className="px-4 py-2 text-center">{balances.maternity_leave?.used || 0}</td>
                          <td className="px-4 py-2 text-center font-bold text-muted-foreground">-</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Leave History */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="py-2.5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <List className="h-4 w-4 text-primary" /> My Leave History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Leave Type</th>
                      <th className="px-4 py-2 font-semibold">Start Date</th>
                      <th className="px-4 py-2 font-semibold">End Date</th>
                      <th className="px-4 py-2 font-semibold text-center">Days</th>
                      <th className="px-4 py-2 font-semibold">Reason</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                      <th className="px-4 py-2 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                          Loading history...
                        </td>
                      </tr>
                    ) : history.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground italic">
                          You have not submitted any leave requests yet.
                        </td>
                      </tr>
                    ) : (
                      paginatedHistory.map((req) => (
                        <tr key={req.id} className={req.leave_type === "Leave Allocation" ? "bg-green-100 dark:bg-green-950/40 text-green-900 dark:text-green-250 hover:bg-green-200/85" : "hover:bg-muted/30 transition-colors"}>
                          <td className="px-4 py-2 font-medium">
                            {req.leave_type}
                          </td>
                          <td className={`px-4 py-2 text-xs ${req.leave_type === "Leave Allocation" ? "text-green-800 dark:text-green-300 font-medium" : "text-muted-foreground"}`}>
                            {req.start_date}
                          </td>
                          <td className={`px-4 py-2 text-xs ${req.leave_type === "Leave Allocation" ? "text-green-800 dark:text-green-300 font-medium" : "text-muted-foreground"}`}>
                            {req.leave_type === "Leave Allocation" ? "-" : req.end_date}
                          </td>
                          <td className={`px-4 py-2 font-medium text-center ${req.leave_type === "Leave Allocation" ? "text-green-700 font-bold dark:text-green-400" : ""}`}>
                            {req.leave_type === "Leave Allocation" ? `+${req.days_requested}` : req.days_requested}
                          </td>
                          <td className={`px-4 py-2 text-xs max-w-xs truncate ${req.leave_type === "Leave Allocation" ? "text-green-800 dark:text-green-300 font-medium" : "text-muted-foreground"}`} title={req.reason && req.reason.startsWith("Forced Leave") ? "Forced Leave" : (req.reason || "N/A")}>
                            {req.reason && req.reason.startsWith("Forced Leave") ? "Forced Leave" : (req.reason || "N/A")}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              {req.leave_type === "Leave Allocation" ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-400">Allocated</Badge>
                              ) : (
                                <>
                                  {req.status === "PENDING" && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-orange-600 bg-orange-50 border-orange-200">Pending</Badge>}
                                  {req.status === "APPROVED" && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-green-600 bg-green-50 border-green-200">Approved</Badge>}
                                  {req.status === "REJECTED" && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-red-600 bg-red-50 border-red-200">Rejected</Badge>}
                                  {req.status === "CANCELLED" && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-gray-600 bg-gray-50 border-gray-200">Cancelled</Badge>}
                                </>
                              )}
                              {req.attachment_url && (
                                <a href={`${process.env.NEXT_PUBLIC_API_URL}${req.attachment_url}`} target="_blank" rel="noreferrer" title="View Medical Certificate">
                                  <Paperclip className="h-3.5 w-3.5 text-blue-600 hover:text-blue-800" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            {req.status === "PENDING" && req.leave_type !== "Emergency Leave" && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleStartEdit(req)}
                                className="text-[10px] h-7 px-2 flex items-center gap-1 border-zinc-200 hover:bg-muted dark:border-zinc-800"
                              >
                                <Pencil className="h-3 w-3" /> Edit
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-transparent mt-0">
                  <div className="text-[11px] text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                    <span className="font-medium text-foreground">{Math.min(history.length, endIndex)}</span> of{" "}
                    <span className="font-medium text-foreground">{history.length}</span> entries
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-7 text-[10px] bg-background border-zinc-200 dark:border-zinc-800"
                    >
                      Previous
                    </Button>
                    <span className="text-[10px] text-muted-foreground px-1.5">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7 text-[10px] bg-background border-zinc-200 dark:border-zinc-800"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Leave Request Dialog */}
      <Dialog open={!!editingLeave} onOpenChange={(open) => !open && setEditingLeave(null)}>
        <DialogContent 
          className="w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col border border-border bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden p-6"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          <DialogHeader className="border-b border-border/50 pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 font-semibold text-lg">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Leave Request
            </DialogTitle>
            <DialogDescription>
              Modify your pending leave request details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="flex flex-col flex-grow overflow-hidden">
            <div className="space-y-4 py-4 overflow-y-auto max-h-[55vh] pr-2 flex-grow">
              <div className="space-y-2">
                <label className="text-sm font-medium">Leave Type</label>
                <Select 
                  value={editForm.leave_type} 
                  onValueChange={(val) => setEditForm(prev => ({ ...prev, leave_type: val }))}
                >
                  <SelectTrigger className="w-full h-10 border border-input bg-background px-3 py-2 text-sm">
                    <SelectValue placeholder="Select Leave Type" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                    <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                    <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(editForm.leave_type === "Annual Leave" || editForm.leave_type === "Emergency Leave") && (balances?.annual_leave?.remaining ?? 0) <= 0 && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>You cannot apply for Annual Leave or Emergency Leave because your remaining Annual Leave balance is 0 or less.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input 
                    type="date" 
                    value={editForm.start_date} 
                    onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input 
                    type="date" 
                    value={editForm.end_date} 
                    disabled={editForm.is_half_day}
                    onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="edit_is_half_day" 
                  checked={editForm.is_half_day}
                  onChange={(e) => setEditForm(prev => ({ ...prev, is_half_day: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="edit_is_half_day" className="text-sm font-medium leading-none">
                  Half-Day Leave
                </label>
              </div>

              <div className="space-y-2 bg-muted/50 p-3 rounded-md border border-border/50">
                <label className="text-sm font-medium text-muted-foreground block">Number of Days (Excl. Weekends)</label>
                <span className="text-2xl font-bold text-foreground">{editCalculatedDays}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Textarea 
                  value={editForm.reason}
                  onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for taking leave..." 
                  className="min-h-[100px]"
                  maxLength={100}
                />
                <div className="flex justify-end text-xs text-muted-foreground mt-1">
                  <span>{editForm.reason.length}/100</span>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border/50 pt-4 mt-2 gap-2 flex-shrink-0">
              <Button type="button" variant="outline" onClick={() => setEditingLeave(null)} disabled={editSubmitting} className="bg-background">
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting || editCalculatedDays <= 0}>
                {editSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent 
          className="sm:max-w-md border border-red-200 dark:border-red-950/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="flex items-center gap-2 text-destructive font-semibold text-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Request Denied
            </DialogTitle>
            <DialogDescription className="sr-only">
              Details explaining why the leave request was denied.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-foreground leading-relaxed">
            {errorMessage}
          </div>
          <DialogFooter className="border-t border-border/50 pt-4 mt-2">
            <Button type="button" variant="outline" onClick={() => setErrorModalOpen(false)} className="bg-background">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Leave Confirmation Modal */}
      <Dialog open={confirmEmergencyOpen} onOpenChange={setConfirmEmergencyOpen}>
        <DialogContent 
          className="sm:max-w-md border border-amber-200 dark:border-amber-950/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="flex items-center gap-2 text-amber-600 font-semibold text-lg dark:text-amber-500">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Emergency Leave Classification
            </DialogTitle>
            <DialogDescription className="sr-only">
              Notice informing the user that their request will be submitted as emergency leave.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-foreground space-y-2 leading-relaxed">
            <p>As this leave request was not submitted at least 5 days in advance, it will be classified as Emergency Leave.</p>
            <p className="font-semibold text-amber-600 dark:text-amber-400">Would you like to continue?</p>
          </div>
          <DialogFooter className="border-t border-border/50 pt-4 mt-2">
            <Button type="button" variant="outline" onClick={() => { setConfirmEmergencyOpen(false); setPendingSubmitValues(null); }} className="bg-background">
              No
            </Button>
            <Button type="button" onClick={confirmSubmitEmergency}>
              Yes, Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Emergency Leave Confirmation Modal */}
      <Dialog open={confirmEditEmergencyOpen} onOpenChange={setConfirmEditEmergencyOpen}>
        <DialogContent 
          className="sm:max-w-md border border-amber-200 dark:border-amber-950/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="flex items-center gap-2 text-amber-600 font-semibold text-lg dark:text-amber-500">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Emergency Leave Classification
            </DialogTitle>
            <DialogDescription className="sr-only">
              Notice informing the user that their request will be submitted as emergency leave.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-foreground space-y-2 leading-relaxed">
            <p>As this updated leave request was not submitted at least 5 days in advance, it will be classified as Emergency Leave and can no longer be edited.</p>
            <p className="font-semibold text-amber-600 dark:text-amber-400">Would you like to continue?</p>
          </div>
          <DialogFooter className="border-t border-border/50 pt-4 mt-2">
            <Button type="button" variant="outline" onClick={() => setConfirmEditEmergencyOpen(false)} className="bg-background">
              No
            </Button>
            <Button type="button" onClick={confirmEditSubmitEmergency}>
              Yes, Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
