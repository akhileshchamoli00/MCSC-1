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
  AlertCircle,
  FileText,
  CheckCircle
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
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/all`, {
      credentials: "include",
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
      case "APPROVED": return <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block">Approved</span>;
      case "REJECTED": return <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block">Rejected</span>;
      case "SUBMITTED": return <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block">Pending Review</span>;
      default: return <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-block">Draft</span>;
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/${id}/approve`, {
      credentials: "include",
        method: "PUT",
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
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timesheets/${id}/reject?comment=${encodeURIComponent(rejectionReason)}`, {
      credentials: "include",
        method: "PUT",
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

  const totalCount = timesheets.length;
  const pendingCount = timesheets.filter(t => t.status === "PENDING" || t.status === "SUBMITTED").length;
  const approvedCount = timesheets.filter(t => t.status === "APPROVED").length;
  const rejectedCount = timesheets.filter(t => t.status === "REJECTED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-16">
      
      {/* Minimalist Metrics Strip Row */}
      <div className="flex flex-col xl:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-xs flex-1 gap-3 sm:gap-4">
          
          {/* Total Submissions */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Submissions</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalCount}</p>
            </div>
          </div>

          {/* Pending Review */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Pending Review</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{pendingCount}</p>
            </div>
          </div>

          {/* Approved */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Approved</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{approvedCount}</p>
            </div>
          </div>

          {/* Rejected */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
              <XCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Rejected</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/20 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-bold">Timesheets Directory</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search employees or status..."
                  className="pl-9 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table className="w-full">
              <TableHeader className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-3 pl-6 font-semibold text-foreground">Employee</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Week</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Total Hours</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Overtime</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Status</TableHead>
                  <TableHead className="text-right pr-6 font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs divide-y divide-border/20">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading timesheets...</TableCell>
                  </TableRow>
                ) : filteredTimesheets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No timesheets found.</TableCell>
                  </TableRow>
                ) : (
                  paginatedTimesheets.map((timesheet) => (
                    <TableRow key={timesheet.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="py-3 pl-6">
                        <div className="font-semibold text-foreground">
                          {timesheet.employee?.first_name} {timesheet.employee?.last_name}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">{timesheet.employee?.employee_id_custom || "N/A"}</div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-medium text-foreground">
                          {format(new Date(timesheet.week_start), "MMM d")} - {format(new Date(timesheet.week_end), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{timesheet.total_hours.toFixed(1)}h</span>
                      </TableCell>
                      <TableCell className="py-3">
                        {timesheet.overtime_hours > 0 ? (
                          <span className="text-amber-500 font-bold">{timesheet.overtime_hours.toFixed(1)}h</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="py-3">{getStatusBadge(timesheet.status)}</TableCell>
                      <TableCell className="text-right py-3 pr-6">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openReviewModal(timesheet)} 
                          className="h-8 text-xs font-semibold px-3 rounded-xl cursor-pointer"
                        >
                          {timesheet.status === "SUBMITTED" ? "Review" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-muted/10">
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
                  className="h-8 text-xs rounded-xl bg-background border-border/50 hover:bg-muted shrink-0"
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
                  className="h-8 text-xs rounded-xl bg-background border-border/50 hover:bg-muted shrink-0"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent 
          className="sm:max-w-[700px] rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative pt-6"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
          <DialogHeader className="shrink-0 border-b border-border/40 pb-4">
            <DialogTitle className="text-lg flex items-center gap-2 font-bold tracking-tight">
              Review Timesheet
              {selectedTimesheet && getStatusBadge(selectedTimesheet.status)}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {selectedTimesheet && `Reviewing entries for ${selectedTimesheet.employee?.first_name} ${selectedTimesheet.employee?.last_name} (${format(new Date(selectedTimesheet.week_start), "MMM d")} - ${format(new Date(selectedTimesheet.week_end), "MMM d, yyyy")})`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
              <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Hours</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedTimesheet?.total_hours.toFixed(1)}h</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Overtime</p>
                <p className="text-xl font-bold text-amber-500 mt-0.5">{selectedTimesheet?.overtime_hours.toFixed(1)}h</p>
              </div>
            </div>

            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-2 mb-1">Daily Entries</h4>
            <div className="border border-border/40 rounded-xl overflow-hidden divide-y divide-border/20">
              {selectedTimesheet?.entries?.length > 0 ? (
                selectedTimesheet.entries.map((entry: any) => (
                  <div key={entry.id} className="p-3 bg-muted/10 hover:bg-muted/20 transition-colors flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs w-10 text-emerald-600 dark:text-emerald-400">{format(new Date(entry.date), "EEE")}</span>
                        <span className="text-xs font-semibold text-foreground">{entry.project?.project_name || "N/A"} - {entry.task?.task_name || "N/A"}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 ml-12">{entry.description || "No description"}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="text-[11px] font-mono text-muted-foreground">
                         {entry.start_time ? format(new Date(entry.start_time), "HH:mm") : "N/A"} - {entry.end_time ? format(new Date(entry.end_time), "HH:mm") : "N/A"}
                      </span>
                      <span className="font-bold text-xs text-foreground">{entry.total_hours.toFixed(1)}h</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">No entries found.</div>
              )}
            </div>

            {selectedTimesheet?.status === "SUBMITTED" && (
              <div className="mt-4 space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Rejection Feedback (Required for Rejection)</label>
                <Textarea 
                  placeholder="Provide a reason if you are rejecting this timesheet..."
                  className="bg-background/70 border-border/50 rounded-xl resize-none h-20 text-xs focus:border-emerald-500/50"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}
            
            {selectedTimesheet?.status === "REJECTED" && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Rejection Reason:</strong> {selectedTimesheet.comments}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="shrink-0 mt-4 border-t border-border/40 pt-4 gap-2">
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)} className="h-10 text-xs rounded-xl border-border/50 cursor-pointer">Close</Button>
            {selectedTimesheet?.status === "SUBMITTED" && (
              <>
                <Button variant="destructive" onClick={() => handleReject(selectedTimesheet.id)} className="h-10 text-xs font-semibold rounded-xl cursor-pointer">
                  Reject
                </Button>
                <Button onClick={() => handleApprove(selectedTimesheet.id)} className="h-10 text-xs font-bold rounded-xl cursor-pointer">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
