"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, FileText, Eye, Paperclip, Pencil, Trash2, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { KpiCard } from "@/components/kpi-card";

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
    is_half_day: false
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
          is_half_day: false
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Approval</h1>
          <p className="text-muted-foreground mt-1">Review and manage employee leave applications.</p>
        </div>
        <Button onClick={() => setIsApplyingOnBehalf(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Apply Leave on Behalf
        </Button>
      </div>

      {/* COMPACT METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Requests" value={total} icon={FileText} colorTheme="sky" />
        <KpiCard title="Pending" value={pending} icon={Clock} colorTheme="amber" pulseIcon={true} />
        <KpiCard title="Approved" value={approved} icon={CheckCircle} colorTheme="emerald" />
        <KpiCard title="Rejected" value={rejected} icon={XCircle} colorTheme="rose" />
      </div>

      {/* TEXT FILTER */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name or leave type..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8 bg-background/50 border-border/40"
          />
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Leave Type</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Days</th>
                  <th className="px-4 py-3 font-medium">Applied Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      Loading requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No leave requests found.
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {req.employee ? `${req.employee.first_name} ${req.employee.last_name}` : `EMP ID: ${req.employee_id}`}
                      </td>
                      <td className="px-4 py-3">
                        {req.leave_type}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {req.start_date} <br/>to {req.end_date}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {req.days_requested}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {format(new Date(req.created_at), "dd MMM yyyy, HH:mm")}
                      </td>
                      <td className="px-4 py-3">
                        {req.status === "PENDING" && <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">Pending</Badge>}
                        {req.status === "APPROVED" && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Approved</Badge>}
                        {req.status === "REJECTED" && <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Rejected</Badge>}
                        {req.status === "CANCELLED" && <Badge variant="outline" className="text-gray-600 bg-gray-50 border-gray-200">Cancelled</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {req.attachment_url && (
                          <a href={req.attachment_url.startsWith('http') ? req.attachment_url : `${process.env.NEXT_PUBLIC_API_URL}${req.attachment_url}`} target="_blank" rel="noreferrer" title="View Medical Certificate">
                            <Button variant="ghost" size="sm" className="h-8 gap-2 text-blue-600">
                              <Paperclip className="h-4 w-4" /> Cert
                            </Button>
                          </a>
                        )}
                        {req.leave_type === "Leave Allocation" && (
                          <Button variant="ghost" size="sm" className="h-8 gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/20" onClick={() => handleEditAllocationClick(req)}>
                            <Pencil className="h-4 w-4" /> Edit
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20" onClick={() => setDeletingRequestId(req.id)}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => setViewingRequest(req)}>
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
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
                  className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
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
                  className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
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
          className="w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden p-6"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <DialogHeader className="border-b border-border/50 pb-4 flex-shrink-0">
            <DialogTitle className="text-xl font-semibold tracking-tight">Leave Request Details</DialogTitle>
            <DialogDescription className="sr-only">
              Detailed view of the employee's submitted leave request.
            </DialogDescription>
          </DialogHeader>
          
          {viewingRequest && (
            <div className="flex flex-col flex-grow overflow-hidden">
              <div className="space-y-5 py-4 overflow-y-auto max-h-[55vh] pr-2 flex-grow">
                <div className="grid grid-cols-2 gap-4 bg-muted/30 dark:bg-zinc-900/40 p-4 rounded-lg border border-border/40">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Employee</p>
                    <p className="font-semibold text-sm text-foreground">
                      {viewingRequest.employee ? `${viewingRequest.employee.first_name} ${viewingRequest.employee.last_name}` : `ID: ${viewingRequest.employee_id}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Status</p>
                    <div>
                      {viewingRequest.status === "PENDING" && <Badge variant="outline" className="font-semibold text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/50 dark:text-orange-400">Pending</Badge>}
                      {viewingRequest.status === "APPROVED" && <Badge variant="outline" className="font-semibold text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-400">Approved</Badge>}
                      {viewingRequest.status === "REJECTED" && <Badge variant="outline" className="font-semibold text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">Rejected</Badge>}
                      {viewingRequest.status === "CANCELLED" && <Badge variant="outline" className="font-semibold text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-900/50 dark:text-gray-400">Cancelled</Badge>}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Leave Type</p>
                      <p className="font-medium text-foreground">{viewingRequest.leave_type}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Days Requested</p>
                      <p className="font-medium text-foreground">{viewingRequest.days_requested} Days</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Start Date</p>
                      <p className="font-medium text-foreground">{viewingRequest.start_date}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">End Date</p>
                      <p className="font-medium text-foreground">{viewingRequest.end_date}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</p>
                    <div className="bg-muted/10 dark:bg-zinc-900/20 border-l-2 border-primary/50 rounded-r-md p-3 text-sm min-h-[80px] text-foreground leading-relaxed break-words whitespace-pre-wrap">
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
                          <div className="mt-2 border border-border/50 rounded-md overflow-hidden bg-muted/10 max-w-sm">
                            <a href={fullUrl} target="_blank" rel="noreferrer">
                              <img src={fullUrl} alt="Medical Certificate" className="w-full h-auto object-contain max-h-48" />
                            </a>
                          </div>
                        ) : (
                          <a 
                            href={fullUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded-md border border-blue-100 dark:border-blue-900/30"
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
                <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t pt-4 border-border/50 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    className="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                    onClick={() => handleAction(viewingRequest.id, "reject")}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject
                  </Button>
                  <Button 
                    onClick={() => handleAction(viewingRequest.id, "approve")}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                  </Button>
                </DialogFooter>
              ) : (
                <DialogFooter className="mt-6 border-t pt-4 border-border/50 flex-shrink-0">
                  <Button variant="outline" onClick={() => setViewingRequest(null)} className="bg-background">
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
        <DialogContent 
          className="sm:max-w-md border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">Revise Leave Allocation</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Revise the number of days added for this allocation. The employee's annual leave balance will be updated by the difference.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAllocationSave} className="space-y-4">
            <div className="space-y-4 py-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee Name</label>
                <p className="font-semibold mt-1">
                  {editingAllocation?.employee ? `${editingAllocation.employee.first_name} ${editingAllocation.employee.last_name}` : `EMP ID: ${editingAllocation?.employee_id}`}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Allocation Date</label>
                <Input 
                  type="date"
                  value={allocationForm.allocation_date} 
                  onChange={(e) => setAllocationForm({...allocationForm, allocation_date: e.target.value})}
                  required
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Allocated Days</label>
                <Input 
                  type="number" 
                  step="0.5"
                  min="0.5"
                  value={allocationForm.days_requested} 
                  onChange={(e) => setAllocationForm({...allocationForm, days_requested: parseFloat(e.target.value) || 0.0})}
                  required
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Reason for Revision</label>
                <Textarea 
                  value={allocationForm.reason}
                  onChange={(e) => setAllocationForm({...allocationForm, reason: e.target.value})}
                  placeholder="e.g. Correcting typos in initial allocation"
                  required
                  className="min-h-[100px] mt-1"
                />
              </div>
            </div>
            <DialogFooter className="border-t border-border/50 pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setEditingAllocation(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatingAllocation} className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800">
                {updatingAllocation ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Request Confirmation Modal */}
      <Dialog open={!!deletingRequestId} onOpenChange={(open) => !open && !isDeleting && setDeletingRequestId(null)}>
        <DialogContent 
          className="sm:max-w-md border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-600" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight text-red-600 dark:text-red-400">Delete Leave Request?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete this leave request? 
              <br /><br />
              If this was an <strong>Approved Leave</strong>, the days will be refunded back to the employee's balance. If it was a <strong>Leave Allocation</strong>, the allocated days will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-border/50 pt-4 mt-2">
            <Button type="button" variant="outline" onClick={() => setDeletingRequestId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteRequestConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply on Behalf Modal */}
      <Dialog open={isApplyingOnBehalf} onOpenChange={(open) => !open && !isSubmittingAdminLeave && setIsApplyingOnBehalf(false)}>
        <DialogContent 
          className="sm:max-w-md border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">Apply Leave on Behalf</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Submit a leave request on behalf of an employee. This will automatically deduct from their balance and mark the request as pending.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminApplySubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Employee</label>
              <Select 
                value={adminLeaveForm.employee_id} 
                onValueChange={(val) => setAdminLeaveForm({...adminLeaveForm, employee_id: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employeesList.map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Leave Type</label>
              <Select 
                value={adminLeaveForm.leave_type} 
                onValueChange={(val) => setAdminLeaveForm({...adminLeaveForm, leave_type: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                  <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                  <SelectItem value="Maternity Leave">Maternity Leave</SelectItem>
                  <SelectItem value="Forced Leave">Forced Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Start Date</label>
                <Input 
                  type="date" 
                  value={adminLeaveForm.start_date}
                  onChange={(e) => setAdminLeaveForm({...adminLeaveForm, start_date: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">End Date</label>
                <Input 
                  type="date" 
                  value={adminLeaveForm.end_date}
                  onChange={(e) => setAdminLeaveForm({...adminLeaveForm, end_date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border border-border/50">
              <Checkbox 
                id="is_half_day_admin" 
                checked={adminLeaveForm.is_half_day}
                onCheckedChange={(checked) => setAdminLeaveForm({...adminLeaveForm, is_half_day: checked === true})}
              />
              <label htmlFor="is_half_day_admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Half Day Leave
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Reason / Note</label>
              <Textarea 
                value={adminLeaveForm.reason}
                onChange={(e) => setAdminLeaveForm({...adminLeaveForm, reason: e.target.value})}
                placeholder="Optional description"
                className="resize-none h-20"
              />
            </div>

            <DialogFooter className="border-t border-border/50 pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsApplyingOnBehalf(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingAdminLeave} className="bg-primary">
                {isSubmittingAdminLeave ? "Submitting..." : "Submit Leave"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Generic Alert Dialog */}
      <Dialog open={!!dialogMessage} onOpenChange={(open) => !open && setDialogMessage(null)}>
        <DialogContent className="sm:max-w-md border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle>{dialogMessage?.title}</DialogTitle>
            <DialogDescription className="text-sm text-foreground mt-2 font-medium">
              {dialogMessage?.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDialogMessage(null)} className="w-full sm:w-auto">OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
