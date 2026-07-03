"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, FileText, Eye, Paperclip, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function LeaveApprovalPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // View Request Modal State
  const [viewingRequest, setViewingRequest] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Allocation Modal State
  const [editingAllocation, setEditingAllocation] = useState<any | null>(null);
  const [allocationForm, setAllocationForm] = useState({
    days_requested: 0.0,
    reason: ""
  });
  const [updatingAllocation, setUpdatingAllocation] = useState(false);

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
  }, []);

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
        alert(error.detail || `Failed to ${action} request`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error trying to ${action} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditAllocationClick = (req: any) => {
    setEditingAllocation(req);
    setAllocationForm({
      days_requested: req.days_requested,
      reason: req.reason || ""
    });
  };

  const handleEditAllocationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (allocationForm.days_requested <= 0) {
      alert("Allocated days must be greater than 0.");
      return;
    }
    if ((allocationForm.days_requested * 2) % 1 !== 0) {
      alert("Allocated days must be in increments of 0.5 (half-day or full-day).");
      return;
    }
    if (!allocationForm.reason.trim()) {
      alert("Reason for revision is required.");
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
        alert(error.detail || "Failed to update allocation");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating allocation");
    } finally {
      setUpdatingAllocation(false);
    }
  };

  const total = requests.length;
  const pending = requests.filter(r => r.status === "PENDING").length;
  const approved = requests.filter(r => r.status === "APPROVED").length;
  const rejected = requests.filter(r => r.status === "REJECTED").length;

  const totalPages = Math.ceil(requests.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedRequests = requests.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leave Approval</h1>
        <p className="text-muted-foreground mt-1">Review and manage employee leave applications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <FileText className="h-4 w-4 text-muted-foreground/60" /> Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-normal text-foreground tracking-tight">{total}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <Clock className="h-4 w-4 text-muted-foreground/60" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-normal text-foreground tracking-tight">{pending}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <CheckCircle className="h-4 w-4 text-muted-foreground/60" /> Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-normal text-foreground tracking-tight">{approved}</div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <XCircle className="h-4 w-4 text-muted-foreground/60" /> Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-normal text-foreground tracking-tight">{rejected}</div>
          </CardContent>
        </Card>
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
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {req.status === "PENDING" && <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">Pending</Badge>}
                        {req.status === "APPROVED" && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Approved</Badge>}
                        {req.status === "REJECTED" && <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Rejected</Badge>}
                        {req.status === "CANCELLED" && <Badge variant="outline" className="text-gray-600 bg-gray-50 border-gray-200">Cancelled</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {req.attachment_url && (
                          <a href={`${process.env.NEXT_PUBLIC_API_URL}${req.attachment_url}`} target="_blank" rel="noreferrer" title="View Medical Certificate">
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
                <span className="font-medium text-foreground">{Math.min(requests.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{requests.length}</span> entries
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
                      <a 
                        href={`${process.env.NEXT_PUBLIC_API_URL}${viewingRequest.attachment_url}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded-md border border-blue-100 dark:border-blue-900/30"
                      >
                        <Paperclip className="h-4 w-4" /> View Medical Certificate
                      </a>
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
    </div>
  );
}
