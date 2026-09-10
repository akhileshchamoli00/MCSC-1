"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Target, Loader2, Save, Wifi, Gift } from "lucide-react";
import { toast } from "sonner";

export default function AttendanceSettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifyTeamBirthdays, setNotifyTeamBirthdays] = useState(true);
  const [savingBirthdaySettings, setSavingBirthdaySettings] = useState(false);
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

        // Fetch birthday settings
        const bdayRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/settings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (bdayRes.ok) {
          const s = await bdayRes.json();
          setNotifyTeamBirthdays(s.notify_team_birthdays);
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

  const handleToggleBirthdaySettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setNotifyTeamBirthdays(val);
    setSavingBirthdaySettings(true);
    try {
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/settings`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notify_team_birthdays: val })
      });
      if (res.ok) {
        toast.success("Birthday Celebration settings updated successfully!");
      } else {
        toast.error("Failed to save celebration settings");
        setNotifyTeamBirthdays(!val); // Revert
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving celebration settings");
      setNotifyTeamBirthdays(!val); // Revert
    } finally {
      setSavingBirthdaySettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center p-12 bg-background/50 backdrop-blur-md rounded-2xl border border-border/40 max-w-md mx-auto my-12">
        <p className="text-sm font-semibold text-rose-500">Access Denied. Admins only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto pb-16">
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
        <CardHeader className="pt-6">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-500" /> Office Location Perimeter
          </CardTitle>
          <CardDescription className="text-xs">
            Employees must be within the specified radius in meters of these coordinates to Clock In or Clock Out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Office Name</label>
              <Input {...register("office_name")} required className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-emerald-500" /> Latitude
                </label>
                <Input type="number" step="any" {...register("latitude")} required className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-emerald-500" /> Longitude
                </label>
                <Input type="number" step="any" {...register("longitude")} required className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" />
              </div>
            </div>

            <div className="space-y-1.5 bg-muted/20 p-4 rounded-xl border border-border/40">
              <label className="text-xs font-semibold">Geofence Radius (Meters)</label>
              <div className="flex items-center gap-4">
                <Input type="number" {...register("radius_meters")} className="w-36 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" required />
              </div>
            </div>

            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-emerald-500" /> Allowed Office IP Address (Optional)
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Restrict clock-ins to a specific Wi-Fi network. Leave blank to disable.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAutoDetectIP} className="h-8 text-xs rounded-lg border-border/50 cursor-pointer self-start sm:self-auto">
                  Auto-Detect My IP
                </Button>
              </div>
              <Input placeholder="e.g. 192.168.1.1 or 203.0.113.45" {...register("allowed_ip_address")} className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" />
            </div>

            <Button type="submit" disabled={saving} className="w-full h-10 text-xs font-bold rounded-xl shadow-sm cursor-pointer">
              {saving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...</> : <><Save className="mr-2 h-3.5 w-3.5" /> Save Configuration</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* General Celebration Settings */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
        <CardHeader className="pt-6">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Gift className="h-4 w-4 text-emerald-500" /> General Celebration Settings
          </CardTitle>
          <CardDescription className="text-xs">
            Configure system-wide notifications and automated celebrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/20">
            <div className="space-y-0.5">
              <label className="text-xs font-bold flex items-center gap-1.5" htmlFor="notify-birthdays-toggle">
                Team Birthday Awareness
              </label>
              <p className="text-[11px] text-muted-foreground">
                Notify colleagues on their dashboard when it is an employee's birthday.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notify-birthdays-toggle"
                checked={notifyTeamBirthdays}
                disabled={savingBirthdaySettings}
                onChange={handleToggleBirthdaySettings}
                className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
