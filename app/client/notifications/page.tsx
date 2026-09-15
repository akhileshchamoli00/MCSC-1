"use client";

import { useState, useEffect } from "react";
import { 
  Bell, Calendar, Wallet, Clock, Monitor, Trash2, 
  CheckCircle2, Search, Package, MessageSquare, FileText, Megaphone,
  Filter, CheckCheck, Inbox
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ClientNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const fetchNotifications = async () => {

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=200`, {
      credentials: "include",
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
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
  }, []);

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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
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
      // Safeguard: map any platform/staff URLs to client portal URLs
      if (targetUrl.startsWith("/business/") || targetUrl.startsWith("/hrms/")) {
        if (targetUrl.includes("order=")) {
          const match = targetUrl.match(/order=([^&]+)/);
          if (match) {
            targetUrl = `/client/chat?order=${match[1]}`;
          } else {
            targetUrl = "/client/orders";
          }
        } else {
          targetUrl = "/client/orders";
        }
      }
      router.push(targetUrl);
    }
  };

  const getIcon = (type: string, moduleName?: string) => {
    const lowerType = (type || "").toLowerCase();
    const lowerMod = (moduleName || "").toLowerCase();

    if (lowerMod.includes("order") || lowerType.includes("order")) {
      return <Package className="h-4 w-4 text-emerald-500" />;
    }
    if (lowerMod.includes("chat") || lowerType.includes("chat") || lowerType.includes("message")) {
      return <MessageSquare className="h-4 w-4 text-sky-500" />;
    }
    if (lowerMod.includes("doc") || lowerType.includes("doc")) {
      return <FileText className="h-4 w-4 text-purple-500" />;
    }
    if (lowerMod.includes("announcement") || lowerType.includes("announcement")) {
      return <Megaphone className="h-4 w-4 text-amber-500" />;
    }
    if (lowerType.includes("leave")) return <Calendar className="h-4 w-4 text-blue-500" />;
    if (lowerType.includes("payroll")) return <Wallet className="h-4 w-4 text-emerald-500" />;
    if (lowerType.includes("attendance")) return <Clock className="h-4 w-4 text-orange-500" />;
    if (lowerType.includes("asset")) return <Monitor className="h-4 w-4 text-indigo-500" />;
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Minimalist Metrics Strip & Action Button Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Alerts */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Alerts</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{notifications.length}</p>
            </div>
          </div>

          {/* Unread */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Unread Alerts</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{unreadCount}</p>
            </div>
          </div>

          {/* Read Notifications */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Archived Read</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{notifications.length - unreadCount}</p>
            </div>
          </div>

          {/* Activity Feeds */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
              <Inbox className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Inbox Status</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{unreadCount === 0 ? "All Caught Up" : "Action Pending"}</p>
            </div>
          </div>
        </div>

        {/* Mark All as Read Button */}
        <Button 
          onClick={markAllAsRead} 
          disabled={unreadCount === 0}
          className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm shrink-0 cursor-pointer disabled:opacity-50"
        >
          <CheckCheck className="h-4 w-4" /> Mark all as read
        </Button>
      </div>

      {/* Main Table Card with Filter Bar */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardHeader className="p-4 sm:p-5 border-b border-border/40">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3 w-full md:w-auto flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px] h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="UNREAD">Unread Only ({unreadCount})</SelectItem>
                  <SelectItem value="READ">Read Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="clients">Orders & Chat</SelectItem>
                  <SelectItem value="announcements">Announcements</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="general">General Alerts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative w-full md:w-[320px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search notifications..."
                className="pl-9 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                  <TableHead className="w-[50px] pl-5"></TableHead>
                  <TableHead>Notification Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-5">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-32">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        <span className="text-xs text-muted-foreground">Loading notifications...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-48 text-muted-foreground">
                      <Bell className="h-10 w-10 mx-auto mb-2 opacity-25 text-emerald-500" />
                      <p className="font-bold text-sm text-foreground">No notifications found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {searchQuery || filterStatus !== "ALL" || filterType !== "ALL"
                          ? "Try changing your search query or filters."
                          : "You're all caught up with your latest updates."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications.map((notif) => (
                    <TableRow 
                      key={notif.id} 
                      className={`cursor-pointer transition-colors border-b border-border/30 last:border-0 text-xs hover:bg-muted/40 ${
                        !notif.is_read ? "bg-emerald-500/[0.04] font-medium" : ""
                      }`}
                      onClick={() => handleRowClick(notif)}
                    >
                      <TableCell className="pl-5">
                        <div className="h-8 w-8 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-center shrink-0">
                          {getIcon(notif.type, notif.module)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-foreground text-xs leading-tight">{notif.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{notif.message}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-muted/40 text-muted-foreground border-border/40 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                          {notif.module || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {notif.created_at ? format(new Date(notif.created_at), "MMM d, yyyy • h:mm a") : "-"}
                      </TableCell>
                      <TableCell>
                        {!notif.is_read ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Unread
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60 font-medium">Read</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-5 whitespace-nowrap">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => deleteNotification(notif.id, e)}
                          title="Delete Notification"
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
