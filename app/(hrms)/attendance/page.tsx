"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, MapPin, Clock, CheckCircle2, XCircle, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// --- UTILS ---
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000;
  const phi_1 = (lat1 * Math.PI) / 180;
  const phi_2 = (lat2 * Math.PI) / 180;
  const delta_phi = ((lat2 - lat1) * Math.PI) / 180;
  const delta_lambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(delta_phi / 2) ** 2 + Math.cos(phi_1) * Math.cos(phi_2) * Math.sin(delta_lambda / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export default function AttendancePage() {
  const [settings, setSettings] = useState<any>(null);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [locationError, setLocationError] = useState("");
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("hrms_token");
      // For employee, we don't have a direct settings endpoint. We will need to fetch it.
      // Wait, admin only? Oh, the clock-in endpoint handles it securely.
      // But we want to show distance in UI. Let's make an endpoint for settings if missing, or just rely on the clock-in error.
      // I will just fetch history.
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/my-history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyHistory(data);
        const todayStr = new Date().toISOString().split("T")[0];
        const todayRec = data.find((d: any) => d.attendance_date.startsWith(todayStr));
        setTodayRecord(todayRec);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLocate = () => {
    setLocating(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocating(false);
      },
      (error) => {
        setLocationError("Please allow location access to clock in.");
        setLocating(false);
      }
    );
  };

  const handleClockIn = async () => {
    if (!coords) return toast.error("Please get location first.");
    setLocationError("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/clock-in`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng })
      });
      if (res.ok) {
        toast.success("Clock In Successful");
        fetchData();
      } else {
        const err = await res.json();
        setLocationError(err.detail || "Failed to clock in");
      }
    } catch (err) {
      console.error(err);
      setLocationError("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!coords) return toast.error("Please get location first.");
    setLocationError("");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/clock-out`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng })
      });
      if (res.ok) {
        toast.success("Clock Out Successful");
        fetchData();
      } else {
        const err = await res.json();
        setLocationError(err.detail || "Failed to clock out");
      }
    } catch (err) {
      console.error(err);
      setLocationError("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(myHistory.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedHistory = myHistory.slice(startIndex, endIndex);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground mt-1">Clock in and out using your current location.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clock In Panel */}
        <Card className="border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-primary" /> Geofenced Check In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/40 rounded-lg border border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">GPS Status:</span>
                {coords ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1"/> Location Acquired</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground"><AlertTriangle className="w-3 h-3 mr-1"/> Not Acquired</Badge>
                )}
              </div>
              
              {locationError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                  {locationError}
                </div>
              )}

              {!coords ? (
                <Button onClick={handleLocate} disabled={locating} variant="outline" className="w-full">
                  {locating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Locating...</> : "Get Current Location"}
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button 
                    onClick={handleClockIn} 
                    disabled={submitting || !!todayRecord?.clock_in_time} 
                    className="flex-1"
                  >
                    Clock In
                  </Button>
                  <Button 
                    onClick={handleClockOut} 
                    disabled={submitting || !todayRecord?.clock_in_time || !!todayRecord?.clock_out_time} 
                    variant="outline"
                    className="flex-1"
                  >
                    Clock Out
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/20 rounded border border-border/30">
                <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Status Today</p>
                <p className="font-semibold text-lg">{todayRecord ? todayRecord.status : "Not Checked In"}</p>
              </div>
              <div className="p-3 bg-muted/20 rounded border border-border/30">
                <p className="text-xs text-muted-foreground font-medium uppercase mb-1">Hours Worked</p>
                <p className="font-semibold text-lg">{todayRecord?.working_hours || 0} hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Panel */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Today's Record</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4"/> Clock In</span>
                <span className="font-medium">
                  {todayRecord?.clock_in_time ? new Date(todayRecord.clock_in_time).toLocaleTimeString() : "--:--"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4"/> Clock Out</span>
                <span className="font-medium">
                  {todayRecord?.clock_out_time ? new Date(todayRecord.clock_out_time).toLocaleTimeString() : "--:--"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border-b border-border/30">
                <span className="text-muted-foreground flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Late</span>
                <span className="font-medium text-red-600">
                  {todayRecord?.late_minutes ? `${todayRecord.late_minutes} mins` : "0 mins"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm mt-6">
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y border-border/50">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Clock In</th>
                <th className="px-4 py-3 font-medium">Clock Out</th>
                <th className="px-4 py-3 font-medium">Hours</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedHistory.map((rec) => (
                <tr key={rec.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{rec.attendance_date}</td>
                  <td className="px-4 py-3">{rec.clock_in_time ? new Date(rec.clock_in_time).toLocaleTimeString() : "-"}</td>
                  <td className="px-4 py-3">{rec.clock_out_time ? new Date(rec.clock_out_time).toLocaleTimeString() : "-"}</td>
                  <td className="px-4 py-3">{rec.working_hours}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{rec.status}</Badge>
                  </td>
                </tr>
              ))}
              {myHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No history found.</td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(myHistory.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{myHistory.length}</span> entries
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
    </div>
  );
}


