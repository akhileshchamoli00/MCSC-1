"use client";

import { useState, useEffect } from "react";
import { 
  Bell, Calendar, Wallet, Clock, Monitor, Trash2, 
  CheckCircle2, Search, Filter 
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";

export default function NotificationsPage() {
  const { isAdmin, hasPermission } = useUser();
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

  const getIcon = (type: string) => {
    if (type.includes("leave")) return <Calendar className="h-4 w-4 text-blue-500" />;
    if (type.includes("payroll")) return <Wallet className="h-4 w-4 text-green-500" />;
    if (type.includes("attendance")) return <Clock className="h-4 w-4 text-orange-500" />;
    if (type.includes("asset")) return <Monitor className="h-4 w-4 text-purple-500" />;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">View and manage all your notifications.</p>
        </div>
        <Button onClick={markAllAsRead} className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 w-full md:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="UNREAD">Unread</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="Leave">Leave</SelectItem>
                  <SelectItem value="Payroll">Payroll</SelectItem>
                  <SelectItem value="Attendance">Attendance</SelectItem>
                  <SelectItem value="Assets">Assets</SelectItem>
                  <SelectItem value="clients">Clients & Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search notifications..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Notification</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                  </TableRow>
                ) : filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-48 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      No notifications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications.map((notif) => (
                    <TableRow 
                      key={notif.id} 
                      className={`cursor-pointer ${!notif.is_read ? "bg-primary/[0.03] font-medium" : ""}`}
                      onClick={() => handleRowClick(notif)}
                    >
                      <TableCell>
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {getIcon(notif.type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{notif.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{notif.message}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{notif.module}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {notif.created_at ? format(new Date(notif.created_at), "MMM d, yyyy h:mm a") : "-"}
                      </TableCell>
                      <TableCell>
                        {!notif.is_read ? (
                          <Badge variant="default">Unread</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">Read</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => deleteNotification(notif.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
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
