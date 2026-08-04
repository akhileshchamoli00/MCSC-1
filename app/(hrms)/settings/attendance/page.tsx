"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Target, Loader2, Save, Wifi } from "lucide-react";
import { toast } from "sonner";

export default function AttendanceSettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, setValue, getValues } = useForm();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        if (!token) return;
        
        // Check role
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (meRes.ok) {
          const data = await meRes.json();
          if (!(data.permissions?.includes("*:*") || data.permissions?.includes("settings:view") || data.email === "admin@mcs-consulting.com" || data.role?.name?.toUpperCase() === "ADMIN")) return;
          setIsAdmin(true);
        }

        // Fetch settings
        const setRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/settings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (setRes.ok) {
          const s = await setRes.json();
            reset({
              office_name: s.office_name,
              latitude: s.latitude,
              longitude: s.longitude,
              radius_meters: s.radius_meters,
              allowed_ip_address: s.allowed_ip_address || ""
            });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  const handleAutoDetectIP = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (res.ok) {
        const data = await res.json();
        const currentIPs = getValues("allowed_ip_address") || "";
        
        if (currentIPs) {
          if (!currentIPs.includes(data.ip)) {
            setValue("allowed_ip_address", `${currentIPs.trim().replace(/,$/, "")}, ${data.ip}`);
            toast.success("IP Address appended successfully!");
          } else {
            toast.info("IP Address is already in the list");
          }
        } else {
          setValue("allowed_ip_address", data.ip);
          toast.success("IP Address detected successfully!");
        }
      } else {
        toast.error("Failed to detect IP");
      }
    } catch (err) {
      toast.error("Network error detecting IP");
    }
  };

  const onSubmit = async (values: any) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/settings`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          office_name: values.office_name,
          latitude: parseFloat(values.latitude),
          longitude: parseFloat(values.longitude),
          radius_meters: parseInt(values.radius_meters),
          allowed_ip_address: values.allowed_ip_address
        })
      });
      if (res.ok) {
        toast.success("Attendance Settings saved successfully!");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return <div className="text-center p-10 text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance Settings</h1>
        <p className="text-muted-foreground mt-1">Configure Geofencing limits and office coordinates.</p>
      </div>

      <Card className="border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Office Location Perimeter
          </CardTitle>
          <CardDescription>
            Employees must be within the specified radius in meters of these coordinates to Clock In or Clock Out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Office Name</label>
              <Input {...register("office_name")} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" /> Latitude
                </label>
                <Input type="number" step="any" {...register("latitude")} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" /> Longitude
                </label>
                <Input type="number" step="any" {...register("longitude")} required />
              </div>
            </div>

            <div className="space-y-2 bg-muted/40 p-4 rounded-lg border border-border/50">
              <label className="text-sm font-medium">Geofence Radius (Meters)</label>
              <div className="flex items-center gap-4">
                <Input type="number" {...register("radius_meters")} className="w-32" required />
              </div>
            </div>

            <div className="space-y-2 bg-muted/40 p-4 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-primary" /> Allowed Office IP Address (Optional)
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">Restrict clock-ins to a specific Wi-Fi network. Leave blank to disable.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAutoDetectIP}>
                  Auto-Detect My IP
                </Button>
              </div>
              <Input placeholder="e.g. 192.168.1.1 or 203.0.113.45" {...register("allowed_ip_address")} />
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Configuration</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
