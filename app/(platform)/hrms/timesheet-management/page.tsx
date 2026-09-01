"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Clock, 
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function TimesheetManagement() {
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchTimesheets = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/all`, {
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

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">Approved</Badge>;
      case "REJECTED": return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20">Rejected</Badge>;
      case "SUBMITTED": return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20">Pending Review</Badge>;
      default: return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20">Draft</Badge>;
    }
  };

  const handleApprove = async (id: number) => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Timesheet approved successfully");
        setIsReviewModalOpen(false);
        fetchTimesheets();
      } else {
        toast.error("Failed to approve timesheet");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/${id}/reject?comment=${encodeURIComponent(rejectionReason)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Timesheet rejected");
        setIsReviewModalOpen(false);
        setRejectionReason("");
        fetchTimesheets();
      } else {
        toast.error("Failed to reject timesheet");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const openReviewModal = (timesheet: any) => {
    setSelectedTimesheet(timesheet);
    setRejectionReason(timesheet.comments || "");
    setIsReviewModalOpen(true);
  };

  const filteredTimesheets = timesheets.filter(t => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const empName = `${t.employee?.first_name} ${t.employee?.last_name}`.toLowerCase();
      return empName.includes(search) || t.status.toLowerCase().includes(search);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTimesheets.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedTimesheets = filteredTimesheets.slice(startIndex, endIndex);

  const pendingCount = timesheets.filter(t => t.status === "SUBMITTED").length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Timesheet Management
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Review and approve employee timesheets.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Pending Reviews" value={pendingCount} icon={Clock} colorTheme="amber" />
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Timesheets Directory</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees or status..."
                  className="pl-9 w-[250px] bg-background/50 border-border/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="border-border/50 bg-background/50">
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="font-medium">Employee</TableHead>
                <TableHead className="font-medium">Week</TableHead>
                <TableHead className="font-medium">Total Hours</TableHead>
                <TableHead className="font-medium">Overtime</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Loading timesheets...</TableCell>
                </TableRow>
              ) : filteredTimesheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No timesheets found.</TableCell>
                </TableRow>
              ) : (
                paginatedTimesheets.map((timesheet) => (
                  <TableRow key={timesheet.id} className="border-border/40 hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {timesheet.employee?.first_name} {timesheet.employee?.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{timesheet.employee?.employee_id_custom || "N/A"}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {format(new Date(timesheet.week_start), "MMM d")} - {format(new Date(timesheet.week_end), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-primary">{timesheet.total_hours.toFixed(1)}h</span>
                    </TableCell>
                    <TableCell>
                      {timesheet.overtime_hours > 0 ? (
                        <span className="text-orange-500 font-medium">{timesheet.overtime_hours.toFixed(1)}h</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openReviewModal(timesheet)} className="hover:bg-primary/10 hover:text-primary">
                        {timesheet.status === "SUBMITTED" ? "Review" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(filteredTimesheets.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{filteredTimesheets.length}</span> entries
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

      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent 
          className="sm:max-w-[700px] border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh] relative pt-6"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 shrink-0" />
          <DialogHeader className="shrink-0 border-b border-border/50 pb-4">
            <DialogTitle className="text-xl flex items-center gap-2 font-semibold tracking-tight">
              Review Timesheet
              {selectedTimesheet && getStatusBadge(selectedTimesheet.status)}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {selectedTimesheet && `Reviewing entries for ${selectedTimesheet.employee?.first_name} ${selectedTimesheet.employee?.last_name} (${format(new Date(selectedTimesheet.week_start), "MMM d")} - ${format(new Date(selectedTimesheet.week_end), "MMM d, yyyy")})`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-5">
            <div className="grid grid-cols-2 gap-4 bg-muted/30 dark:bg-zinc-900/40 p-4 rounded-lg border border-border/40">
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold text-primary mt-1">{selectedTimesheet?.total_hours.toFixed(1)}h</p>
              </div>
              <div className="bg-orange-500/5 rounded-lg p-4 border border-orange-500/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overtime</p>
                <p className="text-2xl font-bold text-orange-500 mt-1">{selectedTimesheet?.overtime_hours.toFixed(1)}h</p>
              </div>
            </div>

            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2">Daily Entries</h4>
            <div className="border border-border/50 rounded-lg overflow-hidden divide-y divide-border/50">
              {selectedTimesheet?.entries?.length > 0 ? (
                selectedTimesheet.entries.map((entry: any) => (
                  <div key={entry.id} className="p-3 bg-muted/20 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm w-12">{format(new Date(entry.date), "EEE")}</span>
                        <span className="text-sm">{entry.project?.project_name || "N/A"} - {entry.task?.task_name || "N/A"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-14">{entry.description || "No description"}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <span className="text-xs text-muted-foreground/70">
                         {entry.start_time ? format(new Date(entry.start_time), "HH:mm") : "N/A"} - {entry.end_time ? format(new Date(entry.end_time), "HH:mm") : "N/A"}
                      </span>
                      <span className="font-bold">{entry.total_hours.toFixed(1)}h</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No entries found.</div>
              )}
            </div>

            {selectedTimesheet?.status === "SUBMITTED" && (
              <div className="mt-6 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Rejection Feedback (Required for Rejection)</label>
                <Textarea 
                  placeholder="Provide a reason if you are rejecting this timesheet..."
                  className="bg-background/50 border-border/50 resize-none h-20"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}
            
            {selectedTimesheet?.status === "REJECTED" && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Rejection Reason:</strong> {selectedTimesheet.comments}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="shrink-0 mt-4 border-t border-border/50 pt-4">
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)} className="bg-background">Close</Button>
            {selectedTimesheet?.status === "SUBMITTED" && (
              <>
                <Button variant="destructive" onClick={() => handleReject(selectedTimesheet.id)} className="hover:bg-destructive/10 hover:border-destructive/30">
                  Reject
                </Button>
                <Button onClick={() => handleApprove(selectedTimesheet.id)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
