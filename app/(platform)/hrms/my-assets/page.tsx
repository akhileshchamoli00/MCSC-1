"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Monitor, Smartphone, Key, MonitorSpeaker, Box } from "lucide-react";

export default function MyAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAssets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("hrms_token");
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/my-assets`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setAssets(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch my assets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const getAssetIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("laptop")) return <Monitor className="h-5 w-5" />;
    if (t.includes("phone")) return <Smartphone className="h-5 w-5" />;
    if (t.includes("monitor")) return <MonitorSpeaker className="h-5 w-5" />;
    if (t.includes("card") || t.includes("key")) return <Key className="h-5 w-5" />;
    return <Box className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Minimalist Metrics Strip Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Assets */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Box className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Assets</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{assets.length}</p>
            </div>
          </div>

          {/* Hardware Devices */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <Monitor className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Hardware Devices</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {assets.filter(a => (a.asset?.asset_type || "").toLowerCase().includes("laptop") || (a.asset?.asset_type || "").toLowerCase().includes("phone") || (a.asset?.asset_type || "").toLowerCase().includes("monitor")).length}
              </p>
            </div>
          </div>

          {/* Access & Keys */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Key className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Access & Keys</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {assets.filter(a => (a.asset?.asset_type || "").toLowerCase().includes("card") || (a.asset?.asset_type || "").toLowerCase().includes("key")).length}
              </p>
            </div>
          </div>

          {/* Active Assignment */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Smartphone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Active Assignment</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{assets.filter(a => (a.asset?.status || "").toUpperCase() === "ASSIGNED").length || assets.length}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mb-3 text-emerald-500" />
          <p className="text-xs">Loading your assigned assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-muted/10">
          <Box className="h-10 w-10 mb-3 text-muted-foreground/40" />
          <p className="text-xs font-medium">You currently do not have any company assets assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((item) => (
            <Card key={item.assignment_id} className="overflow-hidden border-border/40 shadow-sm bg-background/50 backdrop-blur-md rounded-2xl hover:shadow-md transition-all">
              <CardHeader className="bg-muted/20 border-b border-border/40 py-4 px-5">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {getAssetIcon(item.asset.asset_type)}
                    </span>
                    {item.asset.asset_type}
                  </CardTitle>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {item.asset.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/30 text-xs">
                  <div className="grid grid-cols-3 p-4 hover:bg-muted/30 transition-colors">
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Brand</span>
                    <span className="col-span-2 font-semibold text-foreground">{item.asset.brand}</span>
                  </div>
                  <div className="grid grid-cols-3 p-4 hover:bg-muted/30 transition-colors">
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Model</span>
                    <span className="col-span-2 font-medium text-foreground">{item.asset.model}</span>
                  </div>
                  <div className="grid grid-cols-3 p-4 hover:bg-muted/30 transition-colors">
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Serial Number</span>
                    <span className="col-span-2 font-mono font-bold text-zinc-800 dark:text-zinc-200">{item.asset.serial_number}</span>
                  </div>
                  {item.asset.asset_tag && (
                    <div className="grid grid-cols-3 p-4 hover:bg-muted/30 transition-colors">
                      <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Asset Tag</span>
                      <span className="col-span-2 font-mono text-muted-foreground">{item.asset.asset_tag}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 p-4 hover:bg-muted/30 transition-colors">
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Assigned Date</span>
                    <span className="col-span-2 font-medium text-foreground">{new Date(item.assigned_date).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-3 p-4 hover:bg-muted/30 transition-colors">
                    <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Condition</span>
                    <span className="col-span-2 font-semibold text-foreground">{item.asset.condition}</span>
                  </div>
                  {item.asset.remarks && (
                    <div className="p-4 bg-muted/10">
                      <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block mb-1">Remarks</span>
                      <p className="italic text-muted-foreground">{item.asset.remarks}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
