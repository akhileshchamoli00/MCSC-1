"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Trash2, Calendar, Wallet, Monitor, CheckCircle2, Clock, Package, MessageSquare, FileText, Megaphone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";

export function NotificationBell() {
  const { isAdmin, hasPermission } = useUser();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isClientUser, setIsClientUser] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // websocket ref to prevent multiple connections
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const role = (localStorage.getItem("user_role") || "").toUpperCase();
    setIsClientUser(role === "CLIENT" || pathname.startsWith("/client"));
  }, [pathname]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=5`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: "no-store"
      });
      if (res.status === 401) return;
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
      
      const countRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/unread-count`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: "no-store"
      });
      if (countRes.status === 401) return;
      if (countRes.ok) {
        const countData = await countRes.json();
        setUnreadCount(countData.unread_count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener("notifications-updated", handleUpdate);
    
    const token = localStorage.getItem("hrms_token");
    if (token) {
      // Connect WS
      // Resolve WebSocket URL robustly for local development and production
      let wsUrl = "";
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const nextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL || "/api-proxy";
      
      if (nextPublicApiUrl.startsWith("http")) {
        const wsProtocol = nextPublicApiUrl.startsWith("https") ? "wss" : "ws";
        const hostPart = nextPublicApiUrl.replace(/^https?:\/\//, "");
        wsUrl = `${wsProtocol}://${hostPart}/api/notifications/ws?token=${token}`;
      } else {
        const cleanPath = nextPublicApiUrl.replace(/\/$/, "");
        wsUrl = `${protocol}://${window.location.host}${cleanPath}/api/notifications/ws?token=${token}`;
      }
      const socket = new WebSocket(wsUrl);
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.action === "REFRESH_NOTIFICATIONS" || data.type === "NOTIFICATION_REMOVED") {
            fetchNotifications();
            window.dispatchEvent(new Event("notifications-updated"));
            return;
          }
          if (data.id && data.title) {
            setNotifications(prev => [data, ...prev.filter(n => n.id !== data.id)].slice(0, 5));
            setUnreadCount(prev => prev + 1);
            window.dispatchEvent(new Event("notifications-updated"));
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };
      
      ws.current = socket;
    }
    
    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const markAsRead = async (id: number) => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const notif = notifications.find(n => n.id === id);
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    setOpen(false);
    if (notif.action_url) {
      let targetUrl = notif.action_url;
      if (isClientUser && (targetUrl.startsWith("/business/") || targetUrl.startsWith("/hrms/"))) {
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
      } else if (!isAdmin && !isClientUser) {
        // Staff user - check module permissions before navigating
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
      return <Package className="h-5 w-5 text-sky-500" />;
    }
    if (lowerMod.includes("chat") || lowerType.includes("chat") || lowerType.includes("message")) {
      return <MessageSquare className="h-5 w-5 text-indigo-500" />;
    }
    if (lowerMod.includes("doc") || lowerType.includes("doc")) {
      return <FileText className="h-5 w-5 text-emerald-500" />;
    }
    if (lowerMod.includes("announcement") || lowerType.includes("announcement")) {
      return <Megaphone className="h-5 w-5 text-amber-500" />;
    }
    if (lowerType.includes("leave")) return <Calendar className="h-5 w-5 text-blue-500" />;
    if (lowerType.includes("payroll")) return <Wallet className="h-5 w-5 text-green-500" />;
    if (lowerType.includes("attendance")) return <Clock className="h-5 w-5 text-orange-500" />;
    if (lowerType.includes("asset")) return <Monitor className="h-5 w-5 text-purple-500" />;
    return <Bell className="h-5 w-5 text-muted-foreground" />;
  };

  const viewAllUrl = isClientUser ? "/client/notifications" : "/shared/notifications";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30 transition-all duration-200 cursor-pointer shadow-sm">
          <Bell className={`h-4 w-4 ${unreadCount > 0 ? "animate-[wiggle_1s_ease-in-out_infinite] text-emerald-400" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-[9px] font-black text-white flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.6)] border border-[#0b0c10]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96 rounded-xl border border-zinc-800 bg-[#12131a] dark:bg-[#0c0e17] text-zinc-100 shadow-[0_10px_30px_rgba(0,0,0,0.85)] overflow-hidden" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-zinc-800/80">
          <DropdownMenuLabel className="p-0 font-bold text-sm text-white flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {unreadCount} new
              </span>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-6 px-2 text-[11px] text-zinc-400 hover:text-white hover:bg-white/10 rounded-md">
              <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-400" />
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-[380px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 flex flex-col items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2.5">
                <Bell className="h-5 w-5 text-zinc-500" />
              </div>
              <p className="text-xs font-semibold text-zinc-300">All caught up!</p>
              <p className="text-[11px] mt-0.5 text-zinc-500">You have no new notifications.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-800/60">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative flex gap-3.5 p-3.5 cursor-pointer hover:bg-white/[0.06] transition-colors ${!notif.is_read ? "bg-emerald-500/[0.04]" : ""}`}
                >
                  {!notif.is_read && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  )}
                  
                  <div className={`mt-0.5 shrink-0 rounded-lg p-2 flex items-center justify-center ${!notif.is_read ? 'bg-white/10 text-white shadow-sm border border-white/15' : 'bg-white/5 text-zinc-400'}`}>
                    {getIcon(notif.type, notif.module)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-bold leading-tight truncate ${!notif.is_read ? "text-white" : "text-zinc-400"}`}>
                        {notif.title}
                      </p>
                      <button 
                        onClick={(e) => deleteNotification(notif.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-rose-400 shrink-0 p-1 -mr-1 -mt-1 rounded-md hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className={`text-[11px] line-clamp-2 pr-1 leading-relaxed ${!notif.is_read ? "text-zinc-300" : "text-zinc-500"}`}>
                      {notif.message}
                    </p>
                    <p className="text-[9.5px] font-medium text-zinc-500 pt-0.5">
                      {notif.created_at ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) : "Just now"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-2 border-t border-zinc-800/80 bg-white/[0.02]">
          <Link href={viewAllUrl} onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full text-xs font-semibold h-8 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg">
              View All Notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

