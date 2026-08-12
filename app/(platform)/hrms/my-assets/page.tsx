"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Assets</h1>
        <p className="text-muted-foreground mt-1">View all company assets allocated to you.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading your assigned assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed rounded-lg bg-muted/10">
          <Box className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p>You currently do not have any company assets assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((item) => (
            <Card key={item.assignment_id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getAssetIcon(item.asset.asset_type)}
                    {item.asset.asset_type}
                  </CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {item.asset.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  <div className="grid grid-cols-3 p-4 hover:bg-muted/20">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Brand</span>
                    <span className="col-span-2 text-sm font-medium">{item.asset.brand}</span>
                  </div>
                  <div className="grid grid-cols-3 p-4 hover:bg-muted/20">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Model</span>
                    <span className="col-span-2 text-sm font-medium">{item.asset.model}</span>
                  </div>
                  <div className="grid grid-cols-3 p-4 hover:bg-muted/20">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Serial Number</span>
                    <span className="col-span-2 text-sm font-mono text-muted-foreground">{item.asset.serial_number}</span>
                  </div>
                  {item.asset.asset_tag && (
                    <div className="grid grid-cols-3 p-4 hover:bg-muted/20">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Asset Tag</span>
                      <span className="col-span-2 text-sm font-mono text-muted-foreground">{item.asset.asset_tag}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 p-4 hover:bg-muted/20">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Assigned Date</span>
                    <span className="col-span-2 text-sm font-medium">{new Date(item.assigned_date).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-3 p-4 hover:bg-muted/20">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Condition</span>
                    <span className="col-span-2 text-sm font-medium">{item.asset.condition}</span>
                  </div>
                  {item.asset.remarks && (
                    <div className="p-4 bg-muted/10">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Remarks</span>
                      <p className="text-sm italic text-muted-foreground">{item.asset.remarks}</p>
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
