"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Target, Loader2, Save } from "lucide-react";

export default function AttendanceSettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();

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
          if (!(data.role?.name && data.role.name.toUpperCase().includes("ADMIN"))) return;
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
            radius_meters: s.radius_meters
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
          radius_meters: parseInt(values.radius_meters)
        })
      });
      if (res.ok) {
        alert("Attendance Settings saved successfully!");
      }
    } catch (err) {
      console.error(err);
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
                <span className="text-sm text-muted-foreground">Default is 500m</span>
              </div>
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
