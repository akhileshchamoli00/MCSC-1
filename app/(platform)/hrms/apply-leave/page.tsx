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
import { Loader2, Coffee, List, AlertCircle, Paperclip, Pencil, Calendar, Clock, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Form Validation Schema
const leaveFormSchema = z.object({
  leave_type: z.string().min(1, { message: "Leave type is required" }),
  start_date: z.string().min(1, { message: "Start date is required" }),
  end_date: z.string().min(1, { message: "End date is required" }),
  reason: z.string().min(5, { message: "Reason must be at least 5 characters" }).max(100, { message: "Reason cannot exceed 100 characters" }),
  is_half_day: z.boolean().default(false),
  half_day_session: z.enum(["MORNING", "AFTERNOON"]).optional()
}).refine((data) => {
  if (data.is_half_day) return true; // if half day, we don't care about end date strictness as much, but we set it equal anyway
  return new Date(data.end_date) >= new Date(data.start_date);
}, {
  message: "End date must be after or same as start date",
  path: ["end_date"]
});

type LeaveFormValues = z.infer<typeof leaveFormSchema>;

const compressImage = async (file: File, maxWidth = 1600, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      } else {
        resolve(file);
      }
    };
    img.onerror = () => resolve(file);
  });
};

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
    is_half_day: false,
    half_day_session: "MORNING"
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
      is_half_day: false,
      half_day_session: "MORNING"
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
          let fileToUpload = attachment;
          try {
            fileToUpload = await compressImage(attachment);
          } catch (cErr) {
            console.warn("Image compression fallback to original file", cErr);
          }

          const formData = new FormData();
          formData.append("file", fileToUpload);
          
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
      setErrorMessage("Requested period contains no available working days. The dates fall on weekends, public holidays, or you already have leaves booked.");
      setErrorModalOpen(true);
      return;
    }

    /* TEMPORARY: ALLOW NEGATIVE
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
    */

    if (values.leave_type === "Sick Leave" && !attachment) {
      toast.error("A Medical Certificate attachment is mandatory for Sick Leave.", {
        style: {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          borderColor: '#dc2626'
        }
      });
      return;
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
      is_half_day: req.days_requested === 0.5 && req.start_date === req.end_date,
      half_day_session: req.half_day_session || "MORNING"
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
      setErrorMessage("Requested period contains no available working days. The dates fall on weekends, public holidays, or you already have leaves booked.");
      setErrorModalOpen(true);
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

    /* TEMPORARY: ALLOW NEGATIVE
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
    */

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
    <div className="space-y-6 w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 pb-8">
      {/* Minimalist Metrics Strip Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Annual Leave Bal. */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Annual Leave Bal.</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {balances?.annual_leave?.remaining !== undefined && balances?.annual_leave?.remaining !== null ? balances.annual_leave.remaining : 0}{" "}
                <span className="text-xs font-normal text-muted-foreground">Days</span>
              </p>
            </div>
          </div>

          {/* Sick Leave Bal. */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Sick Leave Bal.</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {balances?.sick_leave?.remaining !== undefined && balances?.sick_leave?.remaining !== null ? balances.sick_leave.remaining : "-"}{" "}
                {balances?.sick_leave?.remaining !== undefined && balances?.sick_leave?.remaining !== "-" && (
                  <span className="text-xs font-normal text-muted-foreground">Days</span>
                )}
              </p>
            </div>
          </div>

          {/* Emergency Leave */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Coffee className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Emergency Leave</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {balances?.emergency_leave?.used !== undefined ? balances.emergency_leave.used : 0}{" "}
                <span className="text-xs font-normal text-muted-foreground">Used</span>
              </p>
            </div>
          </div>

          {/* My Requests */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">My Requests</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{history.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Application Form */}
        <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl lg:col-span-5 xl:col-span-4 h-fit">
          <CardHeader className="py-4 border-b border-border/40 bg-muted/20">
            <CardTitle className="text-sm font-bold text-foreground">New Leave Request</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Leave Type</label>
                <Select 
                  value={form.watch("leave_type") || ""} 
                  onValueChange={(val) => form.setValue("leave_type", val)}
                >
                  <SelectTrigger className="w-full h-10 rounded-xl border-border/50 text-xs bg-background/80">
                    <SelectValue placeholder="Select Leave Type" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4} className="rounded-xl shadow-xl z-50">
                    <SelectItem value="Annual Leave" className="text-xs">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave" className="text-xs">Sick Leave</SelectItem>
                    <SelectItem value="Unpaid Leave" className="text-xs">Unpaid Leave</SelectItem>
                    <SelectItem value="Emergency Leave" className="text-xs">Emergency Leave</SelectItem>
                    <SelectItem value="Maternity Leave" className="text-xs">Maternity Leave</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.leave_type && <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.leave_type.message}</p>}
              </div>

              {/* Half-Day Checkbox Header Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {watchIsHalfDay ? "Date & Session" : "Date Range"}
                </label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="is_half_day" 
                    checked={watchIsHalfDay}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      form.setValue("is_half_day", checked);
                      if (checked && form.getValues("start_date")) {
                        form.setValue("end_date", form.getValues("start_date"));
                      }
                    }}
                    className="h-3.5 w-3.5 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="is_half_day" className="text-xs font-semibold leading-none cursor-pointer select-none text-foreground flex items-center gap-1.5">
                    <span>Half-Day Leave</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">0.5 d</span>
                  </label>
                </div>
              </div>

              {/* 2-Column Aligned Date & Session Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    {watchIsHalfDay ? "Leave Date" : "Start Date"} <span className="text-rose-500">*</span>
                  </label>
                  <Input 
                    type="date" 
                    className="h-10 text-xs rounded-xl border-border/50 bg-background/80" 
                    {...form.register("start_date")}
                    onChange={(e) => {
                      form.setValue("start_date", e.target.value);
                      if (watchIsHalfDay) {
                        form.setValue("end_date", e.target.value);
                      }
                    }}
                  />
                  {form.formState.errors.start_date && <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.start_date.message}</p>}
                </div>

                {watchIsHalfDay ? (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Session <span className="text-rose-500">*</span>
                    </label>
                    <Select 
                      value={form.watch("half_day_session") || "MORNING"} 
                      onValueChange={(val) => form.setValue("half_day_session", val as "MORNING" | "AFTERNOON")}
                    >
                      <SelectTrigger className="w-full h-10 rounded-xl border-border/50 text-xs bg-background/80">
                        <SelectValue placeholder="Select Session" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" sideOffset={4} className="rounded-xl shadow-xl z-50">
                        <SelectItem value="MORNING" className="text-xs cursor-pointer py-2">🌅 Morning Session</SelectItem>
                        <SelectItem value="AFTERNOON" className="text-xs cursor-pointer py-2">🌇 Afternoon Session</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      End Date <span className="text-rose-500">*</span>
                    </label>
                    <Input 
                      type="date" 
                      className="h-10 text-xs rounded-xl border-border/50 bg-background/80" 
                      {...form.register("end_date")} 
                    />
                    {form.formState.errors.end_date && <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.end_date.message}</p>}
                  </div>
                )}
              </div>

              {form.watch("leave_type") === "Sick Leave" && (
                <div className="space-y-2 p-3 bg-muted/30 border border-border/40 rounded-xl">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medical Certificate (Mandatory)</label>
                  <Input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    className="h-10 text-xs rounded-xl border-border/50"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("File size must be less than 10 MB");
                          e.target.value = '';
                          setAttachment(null);
                          return;
                        }
                        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
                          toast.error("Only PNG and JPEG images are allowed");
                          e.target.value = '';
                          setAttachment(null);
                          return;
                        }
                        setAttachment(file);
                      } else {
                        setAttachment(null);
                      }
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground leading-normal">Required: Only image files (PNG, JPEG) are allowed. Max 10 MB.</p>
                </div>
              )}

              <div className="space-y-1 bg-muted/30 p-3 rounded-xl border border-border/40 flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground">Total Working Days</label>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{calculatedDays} Days</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</label>
                <Textarea 
                  {...form.register("reason")} 
                  placeholder="Reason for taking leave..." 
                  className="min-h-[100px] text-xs rounded-xl border-border/50"
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

              <Button type="submit" className="w-full mt-2 h-10 text-xs font-bold rounded-xl shadow-sm" disabled={submitting || calculatedDays <= 0}>
                {submitting ? "Submitting..." : "Submit Leave Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Stack of Balances and History */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          {/* Balance Summary Table */}
          <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
            <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Coffee className="h-4 w-4 text-emerald-500" /> My Leave Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-muted/40 border-b border-border/40 font-semibold tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Leave Type</th>
                      <th className="px-5 py-3 text-center">Allocated</th>
                      <th className="px-5 py-3 text-center">Used</th>
                      <th className="px-5 py-3 text-center">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {loading || !balances ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-emerald-500" />
                        </td>
                      </tr>
                    ) : (
                      <>
                        <tr className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3 font-semibold text-foreground">Annual Leave</td>
                          <td className="px-5 py-3 text-center font-medium">
                            {balances.annual_leave.allocated}
                            {balances.annual_leave.additions > 0 && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                                (+{balances.annual_leave.additions} Added)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center text-muted-foreground font-medium">{balances.annual_leave.used}</td>
                          <td className="px-5 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{balances.annual_leave.remaining}</td>
                        </tr>
                        <tr className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3 font-semibold text-foreground">Sick Leave</td>
                          <td className="px-5 py-3 text-center font-medium">
                            {balances.sick_leave.allocated === 0 ? "-" : balances.sick_leave.allocated}
                          </td>
                          <td className="px-5 py-3 text-center text-muted-foreground font-medium">{balances.sick_leave.used}</td>
                          <td className="px-5 py-3 text-center font-bold text-amber-600 dark:text-amber-400">{balances.sick_leave.remaining}</td>
                        </tr>
                        <tr className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3 font-semibold text-foreground">Unpaid Leave</td>
                          <td className="px-5 py-3 text-center font-medium">-</td>
                          <td className="px-5 py-3 text-center text-muted-foreground font-medium">{balances.unpaid_leave?.used || 0}</td>
                          <td className="px-5 py-3 text-center font-bold text-muted-foreground">-</td>
                        </tr>
                        <tr className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3 font-semibold text-foreground">Emergency Leave</td>
                          <td className="px-5 py-3 text-center font-medium">-</td>
                          <td className="px-5 py-3 text-center text-muted-foreground font-medium">{balances.emergency_leave?.used || 0}</td>
                          <td className="px-5 py-3 text-center font-bold text-muted-foreground">-</td>
                        </tr>
                        <tr className="hover:bg-muted/40 transition-colors">
                          <td className="px-5 py-3 font-semibold text-foreground">Maternity Leave</td>
                          <td className="px-5 py-3 text-center font-medium">-</td>
                          <td className="px-5 py-3 text-center text-muted-foreground font-medium">{balances.maternity_leave?.used || 0}</td>
                          <td className="px-5 py-3 text-center font-bold text-muted-foreground">-</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Leave History */}
          <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
            <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                <List className="h-4 w-4 text-emerald-500" /> My Leave History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-muted/40 border-b border-border/40 font-semibold tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Leave Type</th>
                      <th className="px-5 py-3">Start Date</th>
                      <th className="px-5 py-3">End Date</th>
                      <th className="px-5 py-3 text-center">Days</th>
                      <th className="px-5 py-3">Reason</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-emerald-500" />
                          Loading history...
                        </td>
                      </tr>
                    ) : history.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground italic">
                          You have not submitted any leave requests yet.
                        </td>
                      </tr>
                    ) : (
                      paginatedHistory.map((req) => (
                        <tr key={req.id} className={req.leave_type === "Leave Allocation" ? "bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors" : "hover:bg-muted/40 transition-colors"}>
                          <td className="px-5 py-3.5 font-semibold text-foreground">
                            {req.leave_type}
                          </td>
                          <td className={`px-5 py-3.5 ${req.leave_type === "Leave Allocation" ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}`}>
                            {req.start_date}
                          </td>
                          <td className={`px-5 py-3.5 ${req.leave_type === "Leave Allocation" ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}`}>
                            {req.leave_type === "Leave Allocation" ? "-" : req.end_date}
                          </td>
                          <td className={`px-5 py-3.5 font-bold text-center ${req.leave_type === "Leave Allocation" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                            {req.leave_type === "Leave Allocation" ? (
                              `+${req.days_requested}`
                            ) : req.days_requested === 0.5 ? (
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <span>0.5 Day</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                                  {req.half_day_session === "AFTERNOON" ? "Afternoon (PM)" : "Morning (AM)"}
                                </span>
                              </div>
                            ) : (
                              `${req.days_requested} ${req.days_requested === 1 ? 'Day' : 'Days'}`
                            )}
                          </td>
                          <td className={`px-5 py-3.5 max-w-xs truncate ${req.leave_type === "Leave Allocation" ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}`} title={req.reason && req.reason.startsWith("Forced Leave") ? "Forced Leave" : (req.reason || "N/A")}>
                            {req.reason && req.reason.startsWith("Forced Leave") ? "Forced Leave" : (req.reason || "N/A")}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              {req.leave_type === "Leave Allocation" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Allocated
                                </span>
                              ) : (
                                <>
                                  {req.status === "PENDING" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Pending</span>}
                                  {req.status === "APPROVED" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Approved</span>}
                                  {req.status === "REJECTED" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Rejected</span>}
                                  {req.status === "CANCELLED" && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">Cancelled</span>}
                                </>
                              )}
                              {req.attachment_url && (
                                <a href={req.attachment_url.startsWith('http') ? req.attachment_url : `${process.env.NEXT_PUBLIC_API_URL}${req.attachment_url}`} target="_blank" rel="noreferrer" title="View Medical Certificate">
                                  <Paperclip className="h-3.5 w-3.5 text-blue-600 hover:text-blue-800" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {req.status === "PENDING" && req.leave_type !== "Emergency Leave" && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleStartEdit(req)}
                                className="text-xs h-7 px-2.5 rounded-lg flex items-center gap-1 hover:bg-muted"
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
                <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-muted/10">
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
                      className="h-7 text-xs rounded-lg border-border/50"
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground px-1.5">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7 text-xs rounded-lg border-border/50"
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
        <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] flex flex-col border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden p-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <DialogHeader className="border-b border-border/40 pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 font-bold text-lg text-foreground">
              <Pencil className="h-5 w-5 text-emerald-500" />
              Edit Leave Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify your pending leave request details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="flex flex-col flex-grow overflow-hidden">
            <div className="space-y-4 py-4 overflow-y-auto max-h-[55vh] pr-2 flex-grow">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Leave Type</label>
                <Select 
                  value={editForm.leave_type} 
                  onValueChange={(val) => setEditForm(prev => ({ ...prev, leave_type: val }))}
                >
                  <SelectTrigger className="w-full h-10 rounded-xl border-border/50 text-xs">
                    <SelectValue placeholder="Select Leave Type" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4} className="rounded-xl shadow-xl z-50">
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                    <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                    <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Half-Day Checkbox Header Row */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {editForm.is_half_day ? "Date & Session" : "Date Range"}
                </label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="edit_is_half_day" 
                    checked={editForm.is_half_day}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditForm(prev => ({ 
                        ...prev, 
                        is_half_day: checked,
                        end_date: checked && prev.start_date ? prev.start_date : prev.end_date
                      }));
                    }}
                    className="h-3.5 w-3.5 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="edit_is_half_day" className="text-xs font-semibold leading-none cursor-pointer select-none text-foreground flex items-center gap-1.5">
                    <span>Half-Day Leave</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">0.5 d</span>
                  </label>
                </div>
              </div>

              {/* 2-Column Aligned Date & Session Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    {editForm.is_half_day ? "Leave Date" : "Start Date"} <span className="text-rose-500">*</span>
                  </label>
                  <Input 
                    type="date" 
                    value={editForm.start_date} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditForm(prev => ({ 
                        ...prev, 
                        start_date: val,
                        end_date: prev.is_half_day ? val : (prev.end_date || val)
                      }));
                    }}
                    className="h-10 rounded-xl border-border/50 text-xs bg-background/80"
                  />
                </div>

                {editForm.is_half_day ? (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Session <span className="text-rose-500">*</span>
                    </label>
                    <Select 
                      value={editForm.half_day_session || "MORNING"} 
                      onValueChange={(val) => setEditForm(prev => ({ ...prev, half_day_session: val as "MORNING" | "AFTERNOON" }))}
                    >
                      <SelectTrigger className="w-full h-10 text-xs rounded-xl border-border/50 bg-background/80">
                        <SelectValue placeholder="Choose Session" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" sideOffset={4} className="rounded-xl shadow-xl z-50">
                        <SelectItem value="MORNING" className="text-xs cursor-pointer py-2">🌅 Morning Session</SelectItem>
                        <SelectItem value="AFTERNOON" className="text-xs cursor-pointer py-2">🌇 Afternoon Session</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      End Date <span className="text-rose-500">*</span>
                    </label>
                    <Input 
                      type="date" 
                      value={editForm.end_date} 
                      onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="h-10 rounded-xl border-border/50 text-xs bg-background/80"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1 bg-muted/30 p-3 rounded-xl border border-border/40 flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground">Total Working Days</label>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{editCalculatedDays} Days</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</label>
                <Textarea 
                  value={editForm.reason}
                  onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for taking leave..." 
                  className="min-h-[90px] text-xs rounded-xl border-border/50"
                  maxLength={100}
                />
                <div className="flex justify-end text-xs text-muted-foreground mt-1">
                  <span>{editForm.reason.length}/100</span>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border/40 pt-4 mt-2 gap-2 flex-shrink-0">
              <Button type="button" variant="outline" onClick={() => setEditingLeave(null)} disabled={editSubmitting} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting || editCalculatedDays <= 0} className="rounded-xl">
                {editSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="sm:max-w-md border border-rose-200 dark:border-rose-950/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="flex items-center gap-2 text-destructive font-bold text-lg">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              Request Denied
            </DialogTitle>
            <DialogDescription className="sr-only">
              Details explaining why the leave request was denied.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-xs text-foreground leading-relaxed">
            {errorMessage}
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 mt-2">
            <Button type="button" variant="outline" onClick={() => setErrorModalOpen(false)} className="rounded-xl">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Leave Confirmation Modal */}
      <Dialog open={confirmEmergencyOpen} onOpenChange={setConfirmEmergencyOpen}>
        <DialogContent className="sm:max-w-md border border-amber-200 dark:border-amber-950/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="flex items-center gap-2 text-amber-600 font-bold text-lg dark:text-amber-500">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Emergency Leave Classification
            </DialogTitle>
            <DialogDescription className="sr-only">
              Notice informing the user that their request will be submitted as emergency leave.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-xs text-foreground space-y-2 leading-relaxed">
            <p>As this leave request was not submitted at least 5 days in advance, it will be classified as Emergency Leave.</p>
            <p className="font-semibold text-amber-600 dark:text-amber-400">Would you like to continue?</p>
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 mt-2">
            <Button type="button" variant="outline" onClick={() => { setConfirmEmergencyOpen(false); setPendingSubmitValues(null); }} className="rounded-xl">
              No
            </Button>
            <Button type="button" onClick={confirmSubmitEmergency} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
              Yes, Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Emergency Leave Confirmation Modal */}
      <Dialog open={confirmEditEmergencyOpen} onOpenChange={setConfirmEditEmergencyOpen}>
        <DialogContent className="sm:max-w-md border border-amber-200 dark:border-amber-950/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="flex items-center gap-2 text-amber-600 font-bold text-lg dark:text-amber-500">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Emergency Leave Classification
            </DialogTitle>
            <DialogDescription className="sr-only">
              Notice informing the user that their request will be submitted as emergency leave.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-xs text-foreground space-y-2 leading-relaxed">
            <p>As this updated leave request was not submitted at least 5 days in advance, it will be classified as Emergency Leave and can no longer be edited.</p>
            <p className="font-semibold text-amber-600 dark:text-amber-400">Would you like to continue?</p>
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 mt-2">
            <Button type="button" variant="outline" onClick={() => setConfirmEditEmergencyOpen(false)} className="rounded-xl">
              No
            </Button>
            <Button type="button" onClick={confirmEditSubmitEmergency} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white">
              Yes, Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
