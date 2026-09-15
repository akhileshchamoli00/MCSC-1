"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Loader2, CheckCircle, XCircle, Clock, FileText, Eye, Paperclip, 
  Pencil, Trash2, Plus, Search, FileCheck2, UserCheck, Calendar, 
  CalendarDays, Send, Building2, User, Sparkles, CheckCircle2, 
  AlertCircle, ShieldCheck, Tag, Briefcase
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { KpiCard } from "@/components/kpi-card";

const QUICK_LEAVE_REASONS = [
  "Annual Vacation",
  "Medical & Health Appointment",
  "Personal Emergency",
  "Family Care / Event",
  "Official Business / Training"
];

const calculateLeaveDuration = (start: string, end: string, isHalfDay: boolean) => {
  if (!start) return 0;
  if (isHalfDay) return 0.5;
  if (!end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
  const diffTime = Math.abs(e.getTime() - s.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const getDeptName = (dept: any) => {
  if (!dept) return "General";
  if (typeof dept === "string") return dept;
  if (typeof dept === "object") return dept.name || dept.title || "General";
  return "General";
};

const getJobTitle = (title: any, role?: any) => {
  if (typeof title === "string" && title.trim()) return title;
  if (typeof title === "object" && title?.name) return title.name;
  if (typeof role === "string" && role.trim()) return role;
  if (typeof role === "object" && role?.name) return role.name;
  return "Staff";
};

export default function LeaveApprovalPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  // View Request Modal State
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Allocation Modal State
  const [editingAllocation, setEditingAllocation] = useState<any | null>(null);
  const [allocationForm, setAllocationForm] = useState({
    days_requested: 0.0,
    reason: "",
    allocation_date: ""
  });
  const [updatingAllocation, setUpdatingAllocation] = useState(false);
  
  // Delete Allocation State
  const [deletingRequestId, setDeletingRequestId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generic Alert State
  const [dialogMessage, setDialogMessage] = useState<{title: string, message: string} | null>(null);

  const showAlert = (message: string, title = "Notification") => {
    setDialogMessage({title, message});
  };

  // Apply on Behalf State
  const [isApplyingOnBehalf, setIsApplyingOnBehalf] = useState(false);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [isSubmittingAdminLeave, setIsSubmittingAdminLeave] = useState(false);
  const [adminLeaveForm, setAdminLeaveForm] = useState({
    employee_id: "",
    leave_type: "Annual Leave",
    start_date: "",
    end_date: "",
    reason: "",
    is_half_day: false,
    half_day_session: "MORNING"
  });

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("hrms_token");
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setEmployeesList(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("hrms_token");
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/requests`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch leave requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, []);

  const handleAdminApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminLeaveForm.employee_id || !adminLeaveForm.start_date || !adminLeaveForm.end_date) {
      showAlert("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmittingAdminLeave(true);
      const token = localStorage.getItem("hrms_token");
      const payload = {
        ...adminLeaveForm,
        employee_id: parseInt(adminLeaveForm.employee_id)
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/request`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsApplyingOnBehalf(false);
        setAdminLeaveForm({
          employee_id: "",
          leave_type: "Annual Leave",
          start_date: "",
          end_date: "",
          reason: "",
          is_half_day: false,
          half_day_session: "MORNING"
        });
        fetchRequests();
        showAlert("Leave successfully applied for employee.");
      } else {
        const error = await res.json();
        showAlert(error.detail || "Failed to apply leave");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error applying leave");
    } finally {
      setIsSubmittingAdminLeave(false);
    }
  };

  const handleAction = async (requestId: number, action: "approve" | "reject") => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/requests/${requestId}/${action}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (res.ok) {
        setViewingRequest(null);
        fetchRequests();
      } else {
        const error = await res.json();
        showAlert(error.detail || `Failed to ${action} request`);
      }
    } catch (err) {
      console.error(err);
      showAlert(`Error trying to ${action} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditAllocationClick = (req: any) => {
    setEditingAllocation(req);
    setAllocationForm({
      days_requested: req.days_requested,
      reason: req.reason || "",
      allocation_date: req.allocation_date || req.start_date || new Date().toISOString().split("T")[0]
    });
  };

  const handleEditAllocationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (allocationForm.days_requested <= 0) {
      showAlert("Allocated days must be greater than 0.");
      return;
    }
    if ((allocationForm.days_requested * 2) % 1 !== 0) {
      showAlert("Allocated days must be in increments of 0.5 (half-day or full-day).");
      return;
    }
    if (!allocationForm.allocation_date) {
      showAlert("Allocation date is required.");
      return;
    }
    if (!allocationForm.reason.trim()) {
      showAlert("Reason for revision is required.");
      return;
    }
    
    try {
      setUpdatingAllocation(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/requests/${editingAllocation.id}/allocation`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(allocationForm)
      });
      
      if (res.ok) {
        setEditingAllocation(null);
        fetchRequests();
      } else {
        const error = await res.json();
        showAlert(error.detail || "Failed to update allocation");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error updating allocation");
    } finally {
      setUpdatingAllocation(false);
    }
  };

  const handleDeleteRequestConfirm = async () => {
    if (!deletingRequestId) return;
    try {
      setIsDeleting(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/requests/${deletingRequestId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setDeletingRequestId(null);
        fetchRequests();
      } else {
        const error = await res.json();
        showAlert(error.detail || "Failed to delete allocation");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error deleting allocation");
    } finally {
      setIsDeleting(false);
    }
  };

  const total = requests.length;
  const pending = requests.filter(r => r.status === "PENDING").length;
  const approved = requests.filter(r => r.status === "APPROVED").length;
  const rejected = requests.filter(r => r.status === "REJECTED").length;

  const filteredRequests = requests.filter(req => {
    const empName = req.employee ? `${req.employee.first_name} ${req.employee.last_name}`.toLowerCase() : "";
    const leaveType = (req.leave_type || "").toLowerCase();
    const status = (req.status || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    return empName.includes(query) || leaveType.includes(query) || status.includes(query);
  });

  const totalPages = Math.ceil(filteredRequests.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 pb-8">
      {/* Minimalist Metrics Strip & Action Button Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Requests */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Requests</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{total}</p>
            </div>
          </div>

          {/* Pending */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Pending</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{pending}</p>
            </div>
          </div>

          {/* Approved */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Approved</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{approved}</p>
            </div>
          </div>

          {/* Rejected */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
              <XCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Rejected</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{rejected}</p>
            </div>
          </div>
        </div>

        {/* Apply Leave on Behalf Button */}
        <Button 
          onClick={() => setIsApplyingOnBehalf(true)} 
          className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> Apply Leave on Behalf
        </Button>
      </div>

      {/* TEXT FILTER */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employee, leave type, or status..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
          />
        </div>
      </div>

      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Leave Type</th>
                  <th className="px-5 py-3.5">Dates</th>
                  <th className="px-5 py-3.5">Days</th>
                  <th className="px-5 py-3.5">Applied Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Loading requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-xs">
                      No leave requests found.
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : `EMP ID: ${req.employee_id}`}
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">
                        {req.leave_type}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {req.start_date} <br/>to {req.end_date}
                      </td>
                      <td className="px-5 py-4 font-bold text-foreground">
                        {req.days_requested === 0.5 ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span>0.5 Day</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
                              {req.half_day_session === "AFTERNOON" ? "Afternoon" : "Morning"}
                            </span>
                          </div>
                        ) : (
                          `${req.days_requested} ${req.days_requested === 1 ? "Day" : "Days"}`
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {format(new Date(req.created_at), "dd MMM yyyy, HH:mm")}
                      </td>
                      <td className="px-5 py-4">
                        {req.status === "PENDING" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Pending
                          </span>
                        )}
                        {req.status === "APPROVED" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Approved
                          </span>
                        )}
                        {req.status === "REJECTED" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Rejected
                          </span>
                        )}
                        {req.status === "CANCELLED" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5">
                        {req.attachment_url && (
                          <a href={req.attachment_url.startsWith('http') ? req.attachment_url : `${process.env.NEXT_PUBLIC_API_URL}${req.attachment_url}`} target="_blank" rel="noreferrer" title="View Medical Certificate">
                            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-lg">
                              <Paperclip className="h-3.5 w-3.5" /> Cert
                            </Button>
                          </a>
                        )}
                        {req.leave_type === "Leave Allocation" && (
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-lg" onClick={() => handleEditAllocationClick(req)}>
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-lg text-destructive hover:text-destructive" onClick={() => setDeletingRequestId(req.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-lg" onClick={() => setViewingRequest(req)}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border/40 bg-muted/10">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(filteredRequests.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{filteredRequests.length}</span> entries
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

      {/* View Request Modal */}
      <Dialog open={!!viewingRequest} onOpenChange={(open) => !open && setViewingRequest(null)}>
        <DialogContent 
          className="w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden p-6"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <DialogHeader className="border-b border-border/40 pb-4 flex-shrink-0">
            <DialogTitle className="text-lg font-bold tracking-tight">Leave Request Details</DialogTitle>
            <DialogDescription className="sr-only">
              Detailed view of the employee's submitted leave request.
            </DialogDescription>
          </DialogHeader>
          
          {viewingRequest && (
            <div className="flex flex-col flex-grow overflow-hidden">
              <div className="space-y-5 py-4 overflow-y-auto max-h-[55vh] pr-2 flex-grow">
                <div className="grid grid-cols-2 gap-4 bg-muted/30 dark:bg-zinc-900/40 p-4 rounded-xl border border-border/40">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Employee</p>
                    <p className="font-bold text-sm text-foreground">
                      {viewingRequest.employee ? `${viewingRequest.employee.first_name} ${viewingRequest.employee.last_name}` : `ID: ${viewingRequest.employee_id}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Status</p>
                    <div>
                      {viewingRequest.status === "PENDING" && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Pending</span>}
                      {viewingRequest.status === "APPROVED" && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Approved</span>}
                      {viewingRequest.status === "REJECTED" && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Rejected</span>}
                      {viewingRequest.status === "CANCELLED" && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">Cancelled</span>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Leave Type</p>
                      <p className="font-semibold text-foreground text-sm">{viewingRequest.leave_type}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Days Requested</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground text-sm">
                          {viewingRequest.days_requested} {viewingRequest.days_requested === 1 ? "Day" : "Days"}
                        </p>
                        {viewingRequest.days_requested === 0.5 && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {viewingRequest.half_day_session === "AFTERNOON" ? "Afternoon" : "Morning"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Start Date</p>
                      <p className="font-medium text-muted-foreground text-sm">{viewingRequest.start_date}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">End Date</p>
                      <p className="font-medium text-muted-foreground text-sm">{viewingRequest.end_date}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</p>
                    <div className="bg-muted/10 border-l-2 border-emerald-500 rounded-r-xl p-3 text-xs min-h-[70px] text-foreground leading-relaxed break-words whitespace-pre-wrap">
                      {viewingRequest.reason || "No reason provided."}
                    </div>
                  </div>
                  
                  {viewingRequest.attachment_url && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attachment</p>
                      {(() => {
                        const url = viewingRequest.attachment_url;
                        const fullUrl = url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_API_URL}${url}`;
                        const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(url);
                        
                        return isImage ? (
                          <div className="mt-2 border border-border/50 rounded-xl overflow-hidden bg-muted/10 max-w-sm">
                            <a href={fullUrl} target="_blank" rel="noreferrer">
                              <img src={fullUrl} alt="Medical Certificate" className="w-full h-auto object-contain max-h-48" />
                            </a>
                          </div>
                        ) : (
                          <a 
                            href={fullUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors bg-blue-500/10 px-3 py-2 rounded-xl border border-blue-500/20"
                          >
                            <Paperclip className="h-4 w-4" /> View Medical Certificate
                          </a>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {viewingRequest.status === "PENDING" ? (
                <DialogFooter className="gap-2 sm:gap-2 mt-6 border-t pt-4 border-border/40 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    className="rounded-xl text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                    onClick={() => handleAction(viewingRequest.id, "reject")}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                  <Button 
                    className="rounded-xl"
                    onClick={() => handleAction(viewingRequest.id, "approve")}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                  </Button>
                </DialogFooter>
              ) : (
                <DialogFooter className="mt-6 border-t pt-4 border-border/40 flex-shrink-0">
                  <Button variant="outline" onClick={() => setViewingRequest(null)} className="rounded-xl">
                    Close
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Allocation Modal */}
      <Dialog open={!!editingAllocation} onOpenChange={(open) => !open && setEditingAllocation(null)}>
        <DialogContent className="sm:max-w-md border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="text-lg font-bold tracking-tight">Revise Leave Allocation</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Revise the number of days added for this allocation. The employee's annual leave balance will be updated by the difference.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAllocationSave} className="space-y-4 pt-2">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee Name</label>
                <p className="font-bold text-foreground mt-1">
                  {editingAllocation?.employee ? `${editingAllocation.employee.first_name} ${editingAllocation.employee.last_name}` : `EMP ID: ${editingAllocation?.employee_id}`}
                </p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Allocation Date</label>
                <Input 
                  type="date"
                  value={allocationForm.allocation_date} 
                  onChange={(e) => setAllocationForm({...allocationForm, allocation_date: e.target.value})}
                  required
                  className="rounded-xl border-border/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Allocated Days</label>
                <Input 
                  type="number" 
                  step="0.5"
                  min="0.5"
                  value={allocationForm.days_requested} 
                  onChange={(e) => setAllocationForm({...allocationForm, days_requested: parseFloat(e.target.value) || 0.0})}
                  required
                  className="rounded-xl border-border/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Reason for Revision</label>
                <Textarea 
                  value={allocationForm.reason}
                  onChange={(e) => setAllocationForm({...allocationForm, reason: e.target.value})}
                  placeholder="e.g. Correcting typos in initial allocation"
                  required
                  className="min-h-[90px] rounded-xl border-border/50 text-xs"
                />
              </div>
            </div>
            <DialogFooter className="border-t border-border/40 pt-4 mt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditingAllocation(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatingAllocation} className="rounded-xl">
                {updatingAllocation ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Request Confirmation Modal */}
      <Dialog open={!!deletingRequestId} onOpenChange={(open) => !open && !isDeleting && setDeletingRequestId(null)}>
        <DialogContent className="sm:max-w-md border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-500" />
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="text-lg font-bold tracking-tight text-rose-600 dark:text-rose-400">Delete Leave Request?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              Are you sure you want to delete this leave request? 
              <br /><br />
              If this was an <strong>Approved Leave</strong>, the days will be refunded back to the employee's balance. If it was a <strong>Leave Allocation</strong>, the allocated days will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-border/40 pt-4 mt-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDeletingRequestId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="rounded-xl" onClick={handleDeleteRequestConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply on Behalf Modal - Expanded & Modernized */}
      <Dialog open={isApplyingOnBehalf} onOpenChange={(open) => !open && !isSubmittingAdminLeave && setIsApplyingOnBehalf(false)}>
        <DialogContent className="sm:max-w-2xl w-full p-0 border border-border/50 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
          {/* Top Brand Accent Gradient */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

          {/* Modal Header */}
          <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                    Apply Leave on Behalf
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Admin Action
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Submit an official leave request for an employee. Balances and records will automatically synchronize.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleAdminApplySubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Employee Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-500" />
                  Select Team Member <span className="text-rose-500">*</span>
                </label>
                {adminLeaveForm.employee_id && (
                  <span className="text-[11px] text-muted-foreground font-medium">
                    ID: #{adminLeaveForm.employee_id}
                  </span>
                )}
              </div>

              <Select 
                value={adminLeaveForm.employee_id} 
                onValueChange={(val) => setAdminLeaveForm({...adminLeaveForm, employee_id: val})}
              >
                <SelectTrigger className="h-11 rounded-2xl border-border/60 bg-background/60 shadow-xs text-xs font-semibold hover:border-emerald-500/50 transition-colors">
                  <SelectValue placeholder="Search or select an employee..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-64 border-border/50 shadow-xl">
                  {employeesList.map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()} className="text-xs cursor-pointer py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{emp.first_name} {emp.last_name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          ({getDeptName(emp.department || emp.department_name)} • {getJobTitle(emp.job_title, emp.role)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Live Selected Employee Preview Card */}
              {(() => {
                const selectedEmp = employeesList.find(e => e.id.toString() === adminLeaveForm.employee_id);
                if (!selectedEmp) return null;
                const deptDisplay = getDeptName(selectedEmp.department || selectedEmp.department_name);
                const titleDisplay = getJobTitle(selectedEmp.job_title, selectedEmp.role);

                return (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/50 text-xs animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 shrink-0 text-xs">
                        {selectedEmp.first_name?.[0]}{selectedEmp.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-xs truncate">
                          {selectedEmp.first_name} {selectedEmp.last_name}
                        </p>
                        <p className="text-muted-foreground text-[11px] truncate flex items-center gap-1.5 mt-0.5">
                          <span className="text-foreground/80">{titleDisplay}</span>
                          <span>•</span>
                          <span>{deptDisplay}</span>
                          {selectedEmp.employee_id_custom && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-muted-foreground">{selectedEmp.employee_id_custom}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] shrink-0 font-semibold px-2.5 py-1 rounded-lg">
                      Ready
                    </Badge>
                  </div>
                );
              })()}
            </div>

            {/* Leave Type & Half Day Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Leave Type */}
              <div className="sm:col-span-7 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-emerald-500" />
                  Leave Category <span className="text-rose-500">*</span>
                </label>
                <Select 
                  value={adminLeaveForm.leave_type} 
                  onValueChange={(val) => setAdminLeaveForm({...adminLeaveForm, leave_type: val})}
                >
                  <SelectTrigger className="h-11 rounded-2xl border-border/60 bg-background/60 shadow-xs text-xs font-semibold hover:border-emerald-500/50 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4} className="rounded-2xl border-border/50 shadow-xl z-50">
                    <SelectItem value="Annual Leave" className="text-xs cursor-pointer py-2 font-medium">🌴 Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave" className="text-xs cursor-pointer py-2 font-medium">🤒 Sick Leave</SelectItem>
                    <SelectItem value="Emergency Leave" className="text-xs cursor-pointer py-2 font-medium">🚨 Emergency Leave</SelectItem>
                    <SelectItem value="Unpaid Leave" className="text-xs cursor-pointer py-2 font-medium">⏸️ Unpaid Leave</SelectItem>
                    <SelectItem value="Maternity Leave" className="text-xs cursor-pointer py-2 font-medium">👶 Maternity Leave</SelectItem>
                    <SelectItem value="Forced Leave" className="text-xs cursor-pointer py-2 font-medium">📋 Forced Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Half Day Switch Card */}
              <div className="sm:col-span-5 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  Duration Type
                </label>
                <div 
                  onClick={() => {
                    const nextVal = !adminLeaveForm.is_half_day;
                    setAdminLeaveForm({
                      ...adminLeaveForm, 
                      is_half_day: nextVal,
                      end_date: nextVal && adminLeaveForm.start_date ? adminLeaveForm.start_date : adminLeaveForm.end_date
                    });
                  }}
                  className={`h-11 flex items-center justify-between px-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                    adminLeaveForm.is_half_day 
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100 shadow-xs" 
                      : "bg-background/60 border-border/60 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">Half Day Leave</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-md font-semibold ${adminLeaveForm.is_half_day ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30" : "bg-muted text-muted-foreground"}`}>
                      0.5 d
                    </Badge>
                  </div>
                  <Checkbox 
                    id="is_half_day_admin" 
                    checked={adminLeaveForm.is_half_day}
                    onCheckedChange={(checked) => {
                      const nextVal = checked === true;
                      setAdminLeaveForm({
                        ...adminLeaveForm, 
                        is_half_day: nextVal,
                        end_date: nextVal && adminLeaveForm.start_date ? adminLeaveForm.start_date : adminLeaveForm.end_date
                      });
                    }}
                    className="h-4 w-4 rounded-md border-border/80 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Date Range Selection & Duration Indicator */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                    {adminLeaveForm.is_half_day ? "Leave Date" : "Start Date"} <span className="text-rose-500">*</span>
                  </label>
                  <Input 
                    type="date" 
                    value={adminLeaveForm.start_date}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAdminLeaveForm({
                        ...adminLeaveForm, 
                        start_date: val,
                        end_date: adminLeaveForm.is_half_day ? val : (adminLeaveForm.end_date || val)
                      });
                    }}
                    required
                    className="h-11 rounded-2xl border-border/60 bg-background/60 shadow-xs text-xs font-medium focus:border-emerald-500/50"
                  />
                </div>

                {adminLeaveForm.is_half_day ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Session <span className="text-rose-500">*</span>
                    </label>
                    <Select 
                      value={adminLeaveForm.half_day_session || "MORNING"} 
                      onValueChange={(val) => setAdminLeaveForm({...adminLeaveForm, half_day_session: val})}
                    >
                      <SelectTrigger className="h-11 rounded-2xl border-border/60 bg-background/80 shadow-xs text-xs font-semibold hover:border-amber-500/50 transition-colors">
                        <SelectValue placeholder="Choose Session" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" sideOffset={4} className="rounded-2xl border-border/50 shadow-xl z-50">
                        <SelectItem value="MORNING" className="text-xs cursor-pointer py-2 font-medium">🌅 Morning Session</SelectItem>
                        <SelectItem value="AFTERNOON" className="text-xs cursor-pointer py-2 font-medium">🌇 Afternoon Session</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                      End Date <span className="text-rose-500">*</span>
                    </label>
                    <Input 
                      type="date" 
                      value={adminLeaveForm.end_date}
                      onChange={(e) => setAdminLeaveForm({...adminLeaveForm, end_date: e.target.value})}
                      required
                      className="h-11 rounded-2xl border-border/60 bg-background/60 shadow-xs text-xs font-medium focus:border-emerald-500/50"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic Duration Live Calculation Banner */}
              {(() => {
                const duration = calculateLeaveDuration(adminLeaveForm.start_date, adminLeaveForm.end_date, adminLeaveForm.is_half_day);
                if (duration <= 0) return null;
                return (
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-semibold">
                        {adminLeaveForm.is_half_day 
                          ? `Single Half-Day on ${adminLeaveForm.start_date ? format(new Date(adminLeaveForm.start_date), "MMM d, yyyy") : ""} (${adminLeaveForm.half_day_session === "AFTERNOON" ? "Afternoon" : "Morning"})`
                          : `${adminLeaveForm.start_date ? format(new Date(adminLeaveForm.start_date), "MMM d, yyyy") : ""} → ${adminLeaveForm.end_date ? format(new Date(adminLeaveForm.end_date), "MMM d, yyyy") : ""}`}
                      </span>
                    </div>
                    <Badge className="bg-emerald-600 dark:bg-emerald-500 text-white font-bold text-xs px-3 py-0.5 rounded-xl shadow-xs">
                      {adminLeaveForm.is_half_day ? "0.5 Day" : `${duration} Working Day${duration > 1 ? "s" : ""}`}
                    </Badge>
                  </div>
                );
              })()}
            </div>

            {/* Reason / Notes & Quick Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-emerald-500" />
                  Reason / Administrative Note
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
              </label>
              
              <Textarea 
                value={adminLeaveForm.reason}
                onChange={(e) => setAdminLeaveForm({...adminLeaveForm, reason: e.target.value})}
                placeholder="Specify the reason or documentation notes for this leave application..."
                className="min-h-[85px] rounded-2xl border-border/60 bg-background/60 text-xs leading-relaxed focus:border-emerald-500/50 p-3"
              />

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Quick:</span>
                {QUICK_LEAVE_REASONS.map((qReason) => (
                  <button
                    key={qReason}
                    type="button"
                    onClick={() => setAdminLeaveForm({ ...adminLeaveForm, reason: qReason })}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40 transition-colors cursor-pointer font-medium"
                  >
                    {qReason}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <DialogFooter className="border-t border-border/40 pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto h-11 px-5 rounded-2xl border-border/60 text-xs font-semibold hover:bg-muted cursor-pointer" 
                onClick={() => setIsApplyingOnBehalf(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingAdminLeave || !adminLeaveForm.employee_id || !adminLeaveForm.start_date || !adminLeaveForm.end_date} 
                className="w-full sm:w-auto h-11 px-6 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAdminLeave ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting Request...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Submit Leave on Behalf
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generic Alert Dialog */}
      <Dialog open={!!dialogMessage} onOpenChange={(open) => !open && setDialogMessage(null)}>
        <DialogContent className="sm:max-w-md border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{dialogMessage?.title}</DialogTitle>
            <DialogDescription className="text-xs text-foreground mt-2 font-medium">
              {dialogMessage?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogMessage(null)} className="w-full sm:w-auto rounded-xl">OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
