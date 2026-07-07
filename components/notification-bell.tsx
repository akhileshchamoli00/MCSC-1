"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Trash2, Calendar, Wallet, Monitor, CheckCircle2, Clock } from "lucide-react";
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
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  // websocket ref to prevent multiple connections
  const ws = useRef<WebSocket | null>(null);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=5`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
      
      const countRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/unread-count`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: "no-store"
      });
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
          const newNotif = JSON.parse(event.data);
          setNotifications(prev => [newNotif, ...prev].slice(0, 5)); // Keep only recent 5 in dropdown
          setUnreadCount(prev => prev + 1);
          window.dispatchEvent(new Event("notifications-updated"));
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
      router.push(notif.action_url);
    }
  };

  const getIcon = (type: string) => {
    if (type.includes("leave")) return <Calendar className="h-5 w-5 text-blue-500" />;
    if (type.includes("payroll")) return <Wallet className="h-5 w-5 text-green-500" />;
    if (type.includes("attendance")) return <Clock className="h-5 w-5 text-orange-500" />;
    if (type.includes("asset")) return <Monitor className="h-5 w-5 text-purple-500" />;
    return <Bell className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-border/40 bg-background/25 text-muted-foreground backdrop-blur-md hover:text-foreground hover:bg-background/40 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-300 cursor-pointer shadow-sm">
          <Bell className={`h-[1.3rem] w-[1.3rem] ${unreadCount > 0 ? "animate-[wiggle_1s_ease-in-out_infinite] text-primary" : ""}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center shadow-sm border border-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96 rounded-xl border border-border/50 shadow-xl overflow-hidden" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/40">
          <DropdownMenuLabel className="p-0 font-bold text-base flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-[380px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 opacity-40" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs mt-1 opacity-70">You have no new notifications.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative flex gap-4 p-4 cursor-pointer hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0 ${!notif.is_read ? "bg-primary/[0.03]" : ""}`}
                >
                  {!notif.is_read && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                  
                  <div className={`mt-0.5 shrink-0 rounded-full p-2.5 flex items-center justify-center ${!notif.is_read ? 'bg-background shadow-sm border border-border/50' : 'bg-muted/50'}`}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium leading-tight truncate ${!notif.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      <button 
                        onClick={(e) => deleteNotification(notif.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 p-1 -mr-1 -mt-1 rounded-md hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className={`text-xs line-clamp-2 pr-2 leading-relaxed ${!notif.is_read ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] font-medium text-muted-foreground/50 pt-0.5">
                      {notif.created_at ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true }) : "Just now"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-2 border-t border-border/40 bg-muted/10">
          <Link href="/notifications" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full text-sm font-medium h-9 text-primary hover:text-primary hover:bg-primary/10 rounded-lg">
              View All Notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
