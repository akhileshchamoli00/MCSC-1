"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  Send, 
  Paperclip, 
  MessageSquare, 
  Users, 
  Clock, 
  Loader2, 
  FileText,
  Download,
  AlertCircle,
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

export default function EmployeeChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const pathname = usePathname();

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
  const [myCompanies, setMyCompanies] = useState<any[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const loadMyCompanies = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const clientsData = await response.json();
        // Flatten to get all companies assigned to the employee
        const myComps = clientsData.flatMap((c: any) => 
          (c.companies || []).map((comp: any) => ({
            ...comp,
            client_contact_person: c.contact_person
          }))
        );
        setMyCompanies(myComps);
      }
    } catch (err) {
      console.error("Error loading assigned companies:", err);
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCompId) return;
    setErrorMsg("");

    try {
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error("Failed to authenticate employee profile");
      const meData = await meRes.json();
      const empId = meData.employee?.id;
      
      if (!empId) {
        throw new Error("Your user account is not linked to an employee profile");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          company_id: Number(selectedCompId),
          employee_id: empId
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
      console.log("WebSocket connected to Employee Chat");
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
        console.error("Error parsing WS message in Employee Chat:", err);
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

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachmentUrl) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setErrorMsg("Connection is offline. Message failed.");
      return;
    }

    const payload = {
      conversation_id: selectedConv.id,
      message: inputText.trim() || null,
      attachment: attachmentUrl
    };

    wsRef.current.send(JSON.stringify(payload));
    
    setInputText("");
    setAttachmentUrl(null);
    setAttachmentName(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setAttachmentUrl(data.attachment_url);
      setAttachmentName(data.filename);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg("Failed to upload attachment.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-152px)] md:h-[calc(100vh-168px)] flex flex-col md:flex-row rounded-2xl border border-border bg-background/30 backdrop-blur-xl overflow-hidden animate-in fade-in duration-500">
      
      {/* Sidebar (Left) */}
      <div className="w-full md:w-80 border-r border-border bg-background/50 flex flex-col h-1/3 md:h-full flex-shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Client Advice Chats
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 hover:bg-slate-100 dark:hover:bg-white/10"
              title="Start New Chat"
              onClick={() => {
                loadMyCompanies();
                setSelectedCompId("");
                setIsNewChatOpen(true);
              }}
            >
              <Plus className="h-4 w-4 text-slate-500 hover:text-foreground" />
            </Button>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-semibold">
              {conversations.length} Active
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 mt-4">
              <Users className="h-8 w-8 text-muted-foreground/30" />
              <span>No client chats available. Go to "My Clients" to start.</span>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const companyName = conv.company ? conv.company.company_name : "Company";
              const repName = conv.company ? (conv.company.client?.contact_person || conv.company.key_contact_person || "Representative") : "Representative";
              
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all
                    ${isSelected 
                      ? "bg-primary/10 border-l-2 border-primary text-foreground" 
                      : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {conv.company?.logo_url ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${conv.company.logo_url}`}
                      alt={companyName}
                      className="h-10 w-10 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
                      {companyName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-xs truncate text-foreground block">{repName} - {companyName}</span>
                    <span className="text-[10px] text-muted-foreground truncate block">{companyName}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Area (Right) */}
      <div className="flex-1 flex flex-col bg-background/10 h-2/3 md:h-full relative">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border bg-background/40 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedConv.company?.logo_url ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${selectedConv.company.logo_url}`}
                    alt="Client Logo"
                    className="h-9 w-9 rounded-lg object-cover border bg-background"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-xs">
                    {selectedConv.company?.company_name?.[0]}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-foreground">
                    {(selectedConv.company?.client?.contact_person || selectedConv.company?.key_contact_person || "Representative")} - {selectedConv.company?.company_name}
                  </span>
                  <span className="text-[9px] text-muted-foreground leading-none">Company: {selectedConv.company?.company_name}</span>
                </div>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary flex items-center gap-1 font-semibold">
                <Clock className="h-3 w-3" /> Secure WebSocket
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
                const isClient = msg.sender_role === "CLIENT";
                const dateStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] space-y-1 ${isMe ? "text-right" : "text-left"}`}>
                      <div className={`p-3 rounded-xl shadow-md border text-xs leading-relaxed
                        ${isMe 
                          ? "bg-primary/25 text-foreground border-primary/20 rounded-tr-none" 
                          : "bg-white/5 text-foreground border-white/10 rounded-tl-none"
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
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-background/50 backdrop-blur-md flex flex-col gap-2">
              
              {attachmentUrl && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs max-w-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="truncate text-foreground font-medium">{attachmentName}</span>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setAttachmentUrl(null); setAttachmentName(null); }}
                    className="text-muted-foreground hover:text-foreground text-[10px] h-6 px-1.5"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-background/40 hover:bg-white/5 flex-shrink-0"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  )}
                </Button>

                <Input
                  type="text"
                  placeholder={attachmentUrl ? "Add optional message..." : "Type advice message to client..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-background/40 border-border"
                />

                <Button type="submit" size="icon" className="flex-shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-2" />
            <h3 className="font-bold text-foreground">Select a Client Conversation</h3>
            <p className="text-xs max-w-xs mt-1 text-muted-foreground">
              Please choose an active client thread from the list on the left to start typing messages.
            </p>
          </div>
        )}
      </div>

      {/* Start New Chat Dialog */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Client Chat</DialogTitle>
            <DialogDescription>
              Select one of your assigned client companies to start a secure advice session.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStartChat} className="space-y-4">
            <div className="grid gap-4">
              
              {/* Select Company Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Assigned Client Company *</label>
                <Select 
                  value={selectedCompId} 
                  onValueChange={setSelectedCompId}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an assigned company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myCompanies.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id.toString()}>
                        {comp.company_name} ({comp.client_contact_person})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
            <DialogFooter>
              <Button type="submit">Start Chat</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
