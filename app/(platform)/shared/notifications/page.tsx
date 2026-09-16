"use client";

import { useState, useEffect } from "react";
import { 
  Bell, Calendar, Wallet, Clock, Monitor, Trash2, 
  CheckCircle2, Search, Filter, Package, MessageSquare, FileText, Megaphone, Users, Building2, Briefcase
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";

export default function NotificationsPage() {
  const { isAdmin, hasPermission, currentMode } = useUser();
  const searchParams = useSearchParams();
  const initialSystem = searchParams.get("system");

  const [systemArea, setSystemArea] = useState<string>(
    initialSystem === "business" || initialSystem === "hrms" ? initialSystem : (currentMode || "all")
  );
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const areaParam = systemArea && systemArea !== "all" ? `&system_area=${systemArea}` : "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=200${areaParam}`, {
        credentials: "include",
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener("notifications-updated", handleUpdate);
    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
    };
  }, [systemArea]);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/read`, {
        credentials: "include",
        method: "PUT",
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const areaParam = systemArea && systemArea !== "all" ? `?system_area=${systemArea}` : "";
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all${areaParam}`, {
        credentials: "include",
        method: "PUT",
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}`, {
        credentials: "include",
        method: "DELETE",
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowClick = (notif: any) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    if (notif.action_url) {
      let targetUrl = notif.action_url;
      if (!isAdmin) {
        if (targetUrl.startsWith("/business/clients/orders/completed")) {
          if (!hasPermission("clients_orders_completed", "view")) {
            if (hasPermission("clients_my", "view") && targetUrl.includes("order=")) {
              const match = targetUrl.match(/order=([^&]+)/);
              targetUrl = `/business/assigned-orders?order=${match ? match[1] : ""}&chat=true`;
            } else {
              toast.error("Access Denied: You do not have permission to access Completed Orders.");
              return;
            }
          }
        } else if (targetUrl.startsWith("/business/clients/orders/cancelled")) {
          if (!hasPermission("clients_orders_cancelled", "view")) {
            if (hasPermission("clients_my", "view") && targetUrl.includes("order=")) {
              const match = targetUrl.match(/order=([^&]+)/);
              targetUrl = `/business/assigned-orders?order=${match ? match[1] : ""}&chat=true`;
            } else {
              toast.error("Access Denied: You do not have permission to access Cancelled Orders.");
              return;
            }
          }
        } else if (targetUrl.startsWith("/business/clients/orders/pipeline")) {
          if (!hasPermission("clients_orders_pipeline", "view")) {
            if (hasPermission("clients_my", "view") && targetUrl.includes("order=")) {
              const match = targetUrl.match(/order=([^&]+)/);
              targetUrl = `/business/assigned-orders?order=${match ? match[1] : ""}&chat=true`;
            } else {
              toast.error("Access Denied: You do not have permission to access Pipeline Orders.");
              return;
            }
          }
        } else if (targetUrl.startsWith("/business/clients/orders")) {
          if (!hasPermission("clients_orders_active", "view")) {
            if (hasPermission("clients_my", "view") && targetUrl.includes("order=")) {
              const match = targetUrl.match(/order=([^&]+)/);
              targetUrl = `/business/assigned-orders?order=${match ? match[1] : ""}&chat=true`;
            } else {
              toast.error("Access Denied: You do not have permission to access Active Orders.");
              return;
            }
          }
        } else if (targetUrl.startsWith("/business/assigned-orders")) {
          if (!hasPermission("clients_my", "view")) {
            toast.error("Access Denied: You do not have permission to access Assigned Orders.");
            return;
          }
        }
      }
      router.push(targetUrl);
    }
  };

  const getIcon = (type: string, moduleName?: string) => {
    const lowerType = (type || "").toLowerCase();
    const lowerMod = (moduleName || "").toLowerCase();

    if (lowerMod.includes("order") || lowerType.includes("order")) {
      return <Package className="h-4 w-4 text-sky-400" />;
    }
    if (lowerMod.includes("chat") || lowerType.includes("chat") || lowerType.includes("message")) {
      return <MessageSquare className="h-4 w-4 text-indigo-400" />;
    }
    if (lowerMod.includes("doc") || lowerType.includes("doc")) {
      return <FileText className="h-4 w-4 text-emerald-400" />;
    }
    if (lowerMod.includes("company") || lowerType.includes("company")) {
      return <Building2 className="h-4 w-4 text-cyan-400" />;
    }
    if (lowerMod.includes("client") || lowerMod.includes("partner")) {
      return <Users className="h-4 w-4 text-emerald-400" />;
    }
    if (lowerMod.includes("announcement") || lowerType.includes("announcement")) {
      return <Megaphone className="h-4 w-4 text-amber-400" />;
    }
    if (lowerType.includes("leave")) return <Calendar className="h-4 w-4 text-blue-400" />;
    if (lowerType.includes("payroll")) return <Wallet className="h-4 w-4 text-emerald-400" />;
    if (lowerType.includes("attendance")) return <Clock className="h-4 w-4 text-orange-400" />;
    if (lowerType.includes("asset")) return <Monitor className="h-4 w-4 text-purple-400" />;
    if (lowerType.includes("timesheet")) return <Clock className="h-4 w-4 text-teal-400" />;
    return <Bell className="h-4 w-4 text-muted-foreground" />;
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterStatus === "UNREAD" && n.is_read) return false;
    if (filterStatus === "READ" && !n.is_read) return false;
    if (filterType !== "ALL" && n.module !== filterType) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (n.title || "").toLowerCase().includes(q);
      const matchMsg = (n.message || "").toLowerCase().includes(q);
      if (!matchTitle && !matchMsg) return false;
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Manage notifications separately for HRMS and Business operations.</p>
        </div>
        <Button onClick={markAllAsRead} size="sm" className="gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Mark {systemArea !== "all" ? systemArea.toUpperCase() : "all"} read
        </Button>
      </div>

      {/* SYSTEM AREA SELECTION TABS */}
      <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-2">
        <Tabs value={systemArea} onValueChange={setSystemArea} className="w-full sm:w-auto">
          <TabsList className="h-10 grid grid-cols-3 bg-muted/60 p-1 w-full sm:w-[380px]">
            <TabsTrigger value="all" className="text-xs font-semibold">
              All Notifications
            </TabsTrigger>
            <TabsTrigger value="hrms" className="text-xs font-semibold gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400 inline-block"></span>
              HRMS
            </TabsTrigger>
            <TabsTrigger value="business" className="text-xs font-semibold gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block"></span>
              Business
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="border border-border/40 bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="UNREAD">Unread</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="Leave">Leave</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="timesheets">Timesheets</SelectItem>
                  <SelectItem value="assets">Assets</SelectItem>
                  <SelectItem value="clients">Business & Orders</SelectItem>
                  <SelectItem value="chat">Chat Messages</SelectItem>
                  <SelectItem value="announcements">Announcements</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search notifications..."
                className="pl-8 h-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Notification</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground text-xs">Loading notifications...</TableCell>
                  </TableRow>
                ) : filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-48 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm font-semibold">No {systemArea !== "all" ? systemArea.toUpperCase() : ""} notifications found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications.map((notif) => (
                    <TableRow 
                      key={notif.id} 
                      className={`cursor-pointer transition-colors hover:bg-muted/20 ${!notif.is_read ? (notif.system_area === 'business' ? "bg-emerald-500/[0.03] font-medium" : "bg-indigo-500/[0.03] font-medium") : ""}`}
                      onClick={() => handleRowClick(notif)}
                    >
                      <TableCell>
                        <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center">
                          {getIcon(notif.type, notif.module)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs sm:text-sm text-foreground">{notif.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{notif.message}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${notif.system_area === 'business' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'}`}>
                          {notif.system_area || "HRMS"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-medium">{notif.module}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {notif.created_at ? format(new Date(notif.created_at), "MMM d, yyyy h:mm a") : "-"}
                      </TableCell>
                      <TableCell>
                        {!notif.is_read ? (
                          <Badge variant="default" className={notif.system_area === 'business' ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"}>Unread</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">Read</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => deleteNotification(notif.id, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
