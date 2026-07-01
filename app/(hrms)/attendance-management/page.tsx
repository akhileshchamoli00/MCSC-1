"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Pencil, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AttendanceManagementPage() {
  const [summary, setSummary] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editDate, setEditDate] = useState("");
  const [editClockInTime, setEditClockInTime] = useState("");
  const [editClockOutTime, setEditClockOutTime] = useState("");
  
  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("hrms_token");
      if (!token) return;

      const [sumRes, attRes, corrRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/today-summary`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/corrections`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      
      if (sumRes.ok) setSummary(await sumRes.json());
      if (attRes.ok) setAttendance(await attRes.json());
      if (corrRes.ok) setCorrections(await corrRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem("hrms_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/correction/${id}/approve`, {
        method: "PUT", headers: { "Authorization": `Bearer ${token}` }
      });
      fetchAdminData();
    } catch (e) {}
  };

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem("hrms_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/correction/${id}/reject`, {
        method: "PUT", headers: { "Authorization": `Bearer ${token}` }
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
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedRecord) return;
    try {
      const token = localStorage.getItem("hrms_token");
      const buildDate = (timeStr: string) => {
        if (!timeStr || !timeStr.trim()) return null;
        const cleaned = timeStr.replace(/[^0-9:]/g, "");
        let [h, m] = cleaned.split(":");
        if (!h) return null;
        if (!m) m = "00";
        if (h.length === 1) h = "0" + h;
        if (m.length === 1) m = "0" + m;
        // Simple validation
        if (parseInt(h) > 23) h = "23";
        if (parseInt(m) > 59) m = "59";
        
        return new Date(`${editDate}T${h}:${m}:00`).toISOString();
      };

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/${selectedRecord.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clock_in_time: buildDate(editClockInTime),
          clock_out_time: buildDate(editClockOutTime)
        })
      });
      setIsEditModalOpen(false);
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
        <p className="text-muted-foreground mt-1">Monitor company-wide attendance and approve corrections.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border border-border/50 bg-card shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Staff</p>
              <p className="text-3xl md:text-4xl font-normal text-foreground tracking-tight mt-1">{summary.total_employees}</p>
            </CardContent>
          </Card>
          <Card className="border border-border/50 bg-card shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">Present</p>
              <p className="text-3xl md:text-4xl font-normal text-foreground tracking-tight mt-1">{summary.present}</p>
            </CardContent>
          </Card>
          <Card className="border border-border/50 bg-card shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">Absent</p>
              <p className="text-3xl md:text-4xl font-normal text-foreground tracking-tight mt-1">{summary.absent}</p>
            </CardContent>
          </Card>
          <Card className="border border-border/50 bg-card shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">Late</p>
              <p className="text-3xl md:text-4xl font-normal text-foreground tracking-tight mt-1">{summary.late}</p>
            </CardContent>
          </Card>
          <Card className="border border-border/50 bg-card shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">Attendance %</p>
              <p className="text-3xl md:text-4xl font-normal text-foreground tracking-tight mt-1">{summary.percentage}%</p>
            </CardContent>
          </Card>
        </div>
      )}

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

      {/* Main Table */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee Name</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Clock In</th>
                  <th className="px-4 py-3 font-medium">Clock Out</th>
                  <th className="px-4 py-3 font-medium">Hours</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {rec.employee ? `${rec.employee.first_name} ${rec.employee.last_name}` : rec.employee_id}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{rec.attendance_date}</td>
                    <td className="px-4 py-3 font-mono text-xs">{rec.clock_in_time ? new Date(rec.clock_in_time).toLocaleTimeString() : "-"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{rec.clock_out_time ? new Date(rec.clock_out_time).toLocaleTimeString() : "-"}</td>
                    <td className="px-4 py-3 font-medium">{rec.working_hours}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`
                        ${rec.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${rec.status === 'Late' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                        ${rec.status === 'Half Day' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                      `}>
                        {rec.status}
                      </Badge>
                      {rec.late_minutes > 0 && <span className="ml-2 text-xs text-red-500">+{rec.late_minutes}m</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEditModal(rec)} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent 
          className="sm:max-w-[425px] border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">Edit Attendance Record</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Modify the clock-in and clock-out times for this record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid gap-4 bg-muted/30 dark:bg-zinc-900/40 p-5 rounded-lg border border-border/40">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</Label>
                <Input 
                  type="date" 
                  value={editDate} 
                  onChange={(e) => setEditDate(e.target.value)} 
                  className="mt-1 bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clock In Time</Label>
                  <Input 
                    type="text" 
                    placeholder="HH:MM (e.g. 09:00)"
                    value={editClockInTime} 
                    onChange={(e) => setEditClockInTime(e.target.value)} 
                    className="mt-1 bg-background"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clock Out Time</Label>
                  <Input 
                    type="text" 
                    placeholder="HH:MM (e.g. 18:00)"
                    value={editClockOutTime} 
                    onChange={(e) => setEditClockOutTime(e.target.value)} 
                    className="mt-1 bg-background"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border/50 pt-4 mt-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
