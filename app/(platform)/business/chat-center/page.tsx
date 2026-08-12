"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";
import { 
  Send, 
  MessageSquare, 
  Users, 
  Clock, 
  Loader2, 
  FileText,
  Download,
  AlertCircle,
  ShieldAlert,
  Building,
  Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function AdminChatCenter() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const pathname = usePathname();

  // Redirect if not admin and has no chat center view permission
  useEffect(() => {
    if (!userLoading && !isAdmin && !hasPermission("chat_center", "view")) {
      toast.error("Access denied. Admin permissions required.");
      router.push("/dashboard");
    }
  }, [isAdmin, userLoading, router, hasPermission]);

  // Auto-select conversation from query parameter
  useEffect(() => {
    if (typeof window !== "undefined" && conversations.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const convIdParam = params.get("convId");
      if (convIdParam) {
        const targetConv = conversations.find((c: any) => c.id.toString() === convIdParam);
        if (targetConv) {
          setSelectedConv(targetConv);
        }
      }
    }
  }, [conversations, pathname]);

  // New Chat Initiation states
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>("");
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;
  const currentUserId = typeof window !== "undefined" ? Number(localStorage.getItem("user_id")) : null;

  const fetchConversations = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        if (data.length > 0) {
          const params = new URLSearchParams(window.location.search);
          const convIdParam = params.get("convId");
          const target = convIdParam ? data.find((c: any) => c.id.toString() === convIdParam) : null;
          setSelectedConv(target || data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNewChatData = async () => {
    if (!token) return;
    try {
      const [clientsRes, employeesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);
      
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (employeesRes.ok) {
        const empData = await employeesRes.json();
        setEmployees(empData.filter((e: any) => e.status === "ACTIVE"));
      }
    } catch (err) {
      console.error("Error loading chat initiation data:", err);
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCompId || !selectedEmpId) return;
    setErrorMsg("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          company_id: Number(selectedCompId),
          employee_id: Number(selectedEmpId)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to start chat thread");
      }

      const newConv = await response.json();
      setIsNewChatOpen(false);
      await fetchConversations();
      setSelectedConv(newConv);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start chat thread");
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchMessages = async (convId: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations/${convId}/messages`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setMessages(await response.json());
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    if (!selectedConv) return;
    fetchMessages(selectedConv.id);
  }, [selectedConv]);

  // Connect WebSocket
  useEffect(() => {
    if (!token) return;

    // Resolve WebSocket URL robustly for local development and production
    let wsUrl = "";
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const nextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      
      if (nextPublicApiUrl.startsWith("http")) {
        const wsProtocol = nextPublicApiUrl.startsWith("https") ? "wss" : "ws";
        const hostPart = nextPublicApiUrl.replace(/^https?:\/\//, "");
        wsUrl = `${wsProtocol}://${hostPart}/api/chat/ws?token=${token}`;
      } else {
        if (window.location.port) {
          const hostname = window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname;
          wsUrl = `${protocol}://${hostname}:8000/api/chat/ws?token=${token}`;
        } else {
          const apiPath = nextPublicApiUrl.includes("proxy") ? "/api" : (nextPublicApiUrl || "/api");
          wsUrl = `${protocol}://${window.location.host}${apiPath}/chat/ws?token=${token}`;
        }
      }
    }

    console.log("Connecting to WebSocket URL:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected to Chat Center");
      setErrorMsg("");
    };

    ws.onmessage = (event) => {
      try {
        const newMessage = JSON.parse(event.data);
        if (selectedConv && newMessage.conversation_id === selectedConv.id) {
          setMessages((prev) => [...prev, newMessage]);
        }
        fetchConversations();
      } catch (err) {
        console.error("Error parsing WS message in Chat Center:", err);
      }
    };

    ws.onerror = () => {
      setErrorMsg("WebSocket issue. Reconnecting...");
    };

    ws.onclose = () => {
      setTimeout(() => {
        if (wsRef.current === ws) {
          fetchConversations();
        }
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, [token, selectedConv]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setErrorMsg("Offline. Message failed.");
      return;
    }

    const payload = {
      conversation_id: selectedConv.id,
      message: inputText.trim(),
      attachment: null
    };

    wsRef.current.send(JSON.stringify(payload));
    setInputText("");
  };

  if (userLoading || loading || (!isAdmin && !hasPermission("chat_center", "view"))) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-152px)] md:h-[calc(100vh-168px)] flex flex-col md:flex-row rounded-2xl border border-border/40 bg-background/30 backdrop-blur-xl overflow-hidden animate-in fade-in duration-500">
      
      {/* Sidebar List of Threads */}
      <div className="w-full md:w-80 border-r border-border/40 bg-background/50 flex flex-col h-1/3 md:h-full flex-shrink-0">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Active Threads
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-slate-100 dark:hover:bg-white/10"
              title="Start New Chat"
              onClick={() => {
                loadNewChatData();
                setSelectedCompId("");
                setSelectedEmpId("");
                setIsNewChatOpen(true);
              }}
            >
              <Plus className="h-4 w-4 text-slate-500 hover:text-foreground" />
            </Button>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
              {conversations.length} total
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 mt-4">
              <Users className="h-8 w-8 text-muted-foreground/30" />
              <span>No client threads currently registered.</span>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const clientName = conv.company ? conv.company.company_name : "Client";
              const consultantName = conv.employee ? `${conv.employee.first_name} ${conv.employee.last_name || ""}` : "Consultant";
              
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full flex flex-col gap-1 p-3 rounded-lg text-left transition-all
                    ${isSelected 
                      ? "bg-primary/10 border-l-2 border-primary text-foreground" 
                      : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <Building className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{clientName}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span>Advisor: {consultantName}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message History Grid */}
      <div className="flex-1 flex flex-col bg-background/10 h-2/3 md:h-full relative">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border/40 bg-background/40 backdrop-blur-md flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-bold text-xs text-foreground">
                  Monitoring: {selectedConv.company?.company_name} ↔ {selectedConv.employee?.first_name} {selectedConv.employee?.last_name}
                </span>
                <span className="text-[9px] text-muted-foreground leading-none">Administrative supervisor overrides allowed</span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary flex items-center gap-1 font-semibold">
                <Clock className="h-3 w-3" /> Chat Center Active
              </span>
            </div>

            {errorMsg && (
              <div className="bg-destructive/15 text-destructive border-b border-destructive/20 text-[11px] p-2 flex items-center justify-center gap-1.5 font-medium">
                <AlertCircle className="h-3.5 w-3.5" /> {errorMsg}
              </div>
            )}

            {/* Scroll messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId;
                const isClientMsg = msg.sender_role === "CLIENT";
                const dateStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] space-y-1 ${isMe ? "text-right" : "text-left"}`}>
                      <div className="flex items-center gap-1 px-1">
                        <span className="text-[9px] text-muted-foreground/80 font-bold uppercase">
                          {isMe ? "YOU (ADMIN)" : (isClientMsg ? "CLIENT" : "CONSULTANT")}
                        </span>
                      </div>
                      <div className={`p-3 rounded-xl shadow-md border text-xs leading-relaxed
                        ${isMe 
                          ? "bg-primary/25 text-foreground border-primary/20 rounded-tr-none" 
                          : (isClientMsg
                            ? "bg-amber-500/10 text-foreground border-amber-500/20 rounded-tl-none"
                            : "bg-white/5 text-foreground border-white/10 rounded-tl-none")
                        }
                      `}>
                        {msg.message && <p>{msg.message}</p>}
                        
                        {msg.attachment && (
                          <div className="mt-2 p-2 rounded bg-black/20 border border-white/5 flex items-center justify-between gap-3 text-[11px] max-w-full overflow-hidden">
                            <div className="flex items-center gap-1.5 truncate">
                              <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span className="truncate">{msg.attachment.split("/").pop()}</span>
                            </div>
                            <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                              <a href={`${process.env.NEXT_PUBLIC_API_URL}${msg.attachment}`} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground block px-1">{dateStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border/40 bg-background/50 backdrop-blur-md flex items-center gap-2">
              <Input
                placeholder="Type monitoring message or intervention..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-background/40 border-border/40"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <ShieldAlert className="h-12 w-12 text-muted-foreground/30 mb-2" />
            <h3 className="font-bold text-foreground">Select a Monitor Thread</h3>
            <p className="text-xs max-w-xs mt-1 text-muted-foreground">
              Please choose a conversation from the left to watch or moderate the chat.
            </p>
          </div>
        )}
      </div>

      {/* Start New Chat Dialog */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Advice Thread</DialogTitle>
            <DialogDescription>
              Initiate a secure advice thread between an active client company and a consultant.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStartChat} className="space-y-4">
            <div className="grid gap-4">
              
              {/* Select Company Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Client Company *</label>
                <Select 
                  value={selectedCompId} 
                  onValueChange={setSelectedCompId}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a client company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.flatMap((cl: any) => 
                      (cl.companies || []).map((comp: any) => (
                        <SelectItem key={comp.id} value={comp.id.toString()}>
                          {comp.company_name} ({cl.contact_person})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Select Employee Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Assigned Consultant *</label>
                <Select 
                  value={selectedEmpId} 
                  onValueChange={setSelectedEmpId}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a consultant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.first_name} {emp.last_name || ""} ({emp.job_title || "Consultant"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
            <DialogFooter>
              <Button type="submit">Create Thread</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
