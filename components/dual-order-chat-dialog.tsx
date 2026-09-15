"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  Users,
  Send,
  Loader2,
  Lock,
  Globe,
  AlertTriangle,
  RotateCw,
  Clock,
  Building,
  Package,
  X,
  ArrowLeft,
  User,
  ShieldAlert,
  Sparkles,
  CreditCard,
  FileCheck,
  FileText,
  Eye,
  ShieldCheck,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveImageUrl } from "@/lib/utils";
import { toast } from "sonner";

const isSystemMessage = (msg: any) => {
  if (!msg) return false;
  if (!msg.user_id) return true;
  const role = (msg.sender_role || "").toUpperCase();
  if (role === "MILESTONE" || role === "SYSTEM") return true;
  const name = (msg.sender_name || "").toUpperCase();
  if (name === "SYSTEM" || name === "MILESTONE") return true;
  const txt = (msg.message || "").toLowerCase();
  return (
    txt.startsWith("order execution status") ||
    txt.startsWith("pipeline order") ||
    txt.startsWith("order moved") ||
    txt.startsWith("payment") ||
    txt.startsWith("proforma payment") ||
    txt.startsWith("final invoice payment") ||
    txt.startsWith("additional payment") ||
    txt.startsWith("amount received") ||
    txt.includes("invoice has been generated") ||
    txt.includes("proforma invoice (") ||
    txt.includes("final documents") ||
    txt.includes("uploaded to dropbox") ||
    txt.includes("emailed to client") ||
    txt.includes("assigned to review") ||
    txt.includes("consultant is actively")
  );
};

const getMilestoneIcon = (message: string) => {
  const txt = (message || "").toLowerCase();
  if (txt.includes("payment") || txt.includes("amount received") || txt.includes("paid")) {
    return <CreditCard className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  }
  if (txt.includes("invoice")) {
    return <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  }
  if (txt.includes("final document") || txt.includes("dropbox")) {
    return <FileCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
  }
  if (txt.includes("status") || txt.includes("active orders")) {
    return <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />;
  }
  return <Clock className="h-3.5 w-3.5 text-primary shrink-0" />;
};

interface DualOrderChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string | null;
  orderTitle?: string;
  companyName?: string;
  clientName?: string;
  orderStatus?: string;
}

export function DualOrderChatDialog({
  isOpen,
  onClose,
  orderNumber,
  orderTitle,
  companyName,
  clientName,
  orderStatus
}: DualOrderChatDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [clientMessages, setClientMessages] = useState<any[]>([]);
  const [internalMessages, setInternalMessages] = useState<any[]>([]);
  const [loadingClient, setLoadingClient] = useState(false);
  const [loadingInternal, setLoadingInternal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Document Preview State (Preview Only - No Download)
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePreviewAttachment = (msg: any) => {
    if (!msg.attachment_url || msg.attachment_url === "uploading...") return;
    setPreviewAttachment(msg);
    const url = `/api-proxy/api/clients/orders/${orderNumber}/attachments/preview?path=${encodeURIComponent(msg.attachment_url)}`;
    setPreviewUrl(url);
  };

  // Inputs
  const [clientInput, setClientInput] = useState("");
  const [internalInput, setInternalInput] = useState("");
  const [sendingClient, setSendingClient] = useState(false);
  const [sendingInternal, setSendingInternal] = useState(false);

  // Client Confirmation Dialog State
  const [isConfirmClientOpen, setIsConfirmClientOpen] = useState(false);
  const [pendingClientMessage, setPendingClientMessage] = useState("");

  // Tagging in Internal Chat
  const [taggableUsers, setTaggableUsers] = useState<any[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  const clientMessagesContainerRef = useRef<HTMLDivElement | null>(null);
  const internalMessagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch Client Messages
  const fetchClientMessages = async (isInitial = false) => {
    if (!orderNumber) return;
    if (isInitial) setLoadingClient(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/progress?channel=CLIENT`,
        { credentials: "include" }
      );
      if (res.status === 403) {
        toast.error("You are not authorized to view the chat for this order.");
        onClose();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setClientMessages(data || []);
      }
    } catch (err) {
      console.error("Error loading client messages:", err);
    } finally {
      if (isInitial) setLoadingClient(false);
    }
  };

  // 2. Fetch Internal Messages
  const fetchInternalMessages = async (isInitial = false) => {
    if (!orderNumber) return;
    if (isInitial) setLoadingInternal(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/progress?channel=INTERNAL`,
        { credentials: "include" }
      );
      if (res.status === 403) {
        toast.error("You are not authorized to view the internal chat for this order.");
        onClose();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setInternalMessages(data || []);
      }
    } catch (err) {
      console.error("Error loading internal messages:", err);
    } finally {
      if (isInitial) setLoadingInternal(false);
    }
  };

  // 3. Fetch Taggable Users (for Internal Chat @mentions)
  const fetchTaggableUsers = async () => {
    if (!orderNumber) return;
    try {
      const [tagRes, teamRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/taggable-users`, {
          credentials: "include"
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, {
          credentials: "include"
        })
      ]);

      const employees = tagRes.ok ? await tagRes.json() : [];
      const teams = teamRes.ok ? await teamRes.json() : [];

      const formattedEmployees = (employees || []).map((e: any) => ({
        ...e,
        type: "employee",
        displayName: e.displayName || `${e.first_name} ${e.last_name}`.trim() || e.email
      }));
      const formattedTeams = (teams || []).map((t: any) => ({
        ...t,
        type: "team",
        displayName: t.name
      }));

      setTaggableUsers([...formattedEmployees, ...formattedTeams]);
    } catch (err) {
      console.error("Error fetching taggable users:", err);
    }
  };

  // Refresh all messages
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchClientMessages(false), fetchInternalMessages(false)]);
    setRefreshing(false);
  };

  // Prevent background scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.documentElement.style.overflow = prevHtmlOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && orderNumber) {
      fetchClientMessages(true);
      fetchInternalMessages(true);
      fetchTaggableUsers();

      // Background sync every 15 seconds
      const interval = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          fetchClientMessages(false);
          fetchInternalMessages(false);
        }
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isOpen, orderNumber]);

  // Scroll strictly inside the message stream container (NEVER scroll the browser window or parent)
  useEffect(() => {
    if (clientMessagesContainerRef.current) {
      clientMessagesContainerRef.current.scrollTop = clientMessagesContainerRef.current.scrollHeight;
    }
  }, [clientMessages.length]);

  useEffect(() => {
    if (internalMessagesContainerRef.current) {
      internalMessagesContainerRef.current.scrollTop = internalMessagesContainerRef.current.scrollHeight;
    }
  }, [internalMessages.length]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isConfirmClientOpen) {
          setIsConfirmClientOpen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, isConfirmClientOpen, onClose]);

  // 4. Handle Client Message Confirmation
  const handleClientSendClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInput.trim()) return;
    setPendingClientMessage(clientInput.trim());
    setIsConfirmClientOpen(true);
  };

  const handleConfirmSendClientMessage = async () => {
    if (!pendingClientMessage || !orderNumber || sendingClient) return;
    try {
      setSendingClient(true);
      setIsConfirmClientOpen(false);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/progress`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: pendingClientMessage,
            channel: "CLIENT"
          })
        }
      );
      if (res.ok) {
        const newMsg = await res.json();
        setClientMessages(prev => [...prev, newMsg]);
        setClientInput("");
        setPendingClientMessage("");
        toast.success("Message sent to Client successfully!");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to send message to client");
      }
    } catch (err) {
      console.error("Error sending client message:", err);
      toast.error("Error sending message to client");
    } finally {
      setSendingClient(false);
    }
  };

  // 5. Handle Internal Message Send (Instant, No Confirmation)
  const handleInternalSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!internalInput.trim() || !orderNumber || sendingInternal) return;
    const msgToSend = internalInput.trim();
    try {
      setSendingInternal(true);
      setInternalInput("");
      setShowSuggestions(false);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/progress`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: msgToSend,
            channel: "INTERNAL"
          })
        }
      );
      if (res.ok) {
        const newMsg = await res.json();
        setInternalMessages(prev => [...prev, newMsg]);
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to post internal message");
        setInternalInput(msgToSend);
      }
    } catch (err) {
      console.error("Error posting internal message:", err);
      toast.error("Error posting internal message");
      setInternalInput(msgToSend);
    } finally {
      setSendingInternal(false);
    }
  };

  // Handle @ Tagging in Internal Chat
  const handleInternalTextChange = (value: string, pos: number) => {
    setInternalInput(value);
    setCursorPosition(pos);

    const textBeforeCursor = value.slice(0, pos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\s]*)$/);

    if (match) {
      const query = match[1].toLowerCase();
      const filtered = taggableUsers.filter(u =>
        u.displayName.toLowerCase().includes(query)
      );
      setFilteredSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (item: any) => {
    if (cursorPosition === null) return;
    const textBeforeCursor = internalInput.slice(0, cursorPosition);
    const textAfterCursor = internalInput.slice(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    const newText =
      textBeforeCursor.slice(0, atIndex) +
      `@${item.displayName} ` +
      textAfterCursor;

    setInternalInput(newText);
    setShowSuggestions(false);
  };

  // Helper to render internal messages with clean inline colored tags (single unified bubble background)
  const renderInternalMessageText = (text: string) => {
    if (!text) return null;

    // Collect all taggable user & team names to match precisely
    const names = (taggableUsers || [])
      .map(u => u.displayName || `${u.first_name || ""} ${u.last_name || ""}`.trim())
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    const escapedNames = names.map(n => n.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const mentionPattern = escapedNames.length > 0
      ? new RegExp(`(@(?:${escapedNames.join('|')}|[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+|[a-zA-Z0-9_]+))`, 'gi')
      : /(@[a-zA-Z0-9_.-]+)/g;

    const parts = text.split(mentionPattern);
    return parts.map((part, idx) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={idx}
            className="font-bold text-amber-600 dark:text-amber-400"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (!mounted) return null;

  const content = (
    <>
      {/* SLIDING PANEL CONTAINER */}
      <AnimatePresence>
        {isOpen && orderNumber && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70]"
            />

            {/* Main Sliding Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              className="fixed inset-y-0 top-0 bottom-0 right-0 z-[75] h-screen h-[100dvh] max-h-screen max-h-[100dvh] w-full md:w-[min(1380px,calc(100vw-200px))] lg:w-[calc(100vw-260px)] max-w-7xl bg-background text-foreground shadow-2xl border-l border-border flex flex-col overflow-hidden"
            >
              {/* Top Header Bar - Fixed & Pinned */}
              <div className="p-3.5 sm:p-4 border-b border-border/80 bg-background/95 backdrop-blur-md flex flex-row items-center justify-between shrink-0 gap-4 sticky top-0 z-30 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="gap-2 font-bold shadow-xs bg-muted/60 hover:bg-muted text-foreground border-border transition-colors h-8.5 shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Orders
                  </Button>

                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                    <Package className="h-4.5 w-4.5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-extrabold font-mono text-foreground">
                        Order #{orderNumber}
                      </h3>
                      {orderStatus && (
                        <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                          {orderStatus}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-foreground truncate max-w-[260px]">
                        {orderTitle || "Corporate Consulting Order"}
                      </span>
                      {companyName && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 shrink-0 text-foreground/90 font-medium">
                            <Building className="h-3 w-3 text-muted-foreground" /> {companyName}
                          </span>
                        </>
                      )}
                      {clientName && (
                        <>
                          <span>•</span>
                          <span className="shrink-0">
                            Client: <strong className="text-foreground">{clientName}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="text-xs gap-1.5 h-8.5 font-medium border-border"
                  >
                    <RotateCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8.5 w-8.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <X className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>

              {/* DUAL CHAT SPLIT PANE CONTAINER */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/80 min-h-0 h-full max-h-full overflow-hidden bg-muted/5">
                {/* ============================================================ */}
                {/* PANE 1 (LEFT): CLIENT & CONSULTANT CHAT (EXTERNAL)           */}
                {/* ============================================================ */}
                <div className="flex flex-col h-full min-h-0 max-h-full bg-background/50 overflow-hidden">
                  {/* Client Pane Subheader */}
                  <div className="px-4 py-2.5 border-b border-border/40 bg-sky-500/5 dark:bg-sky-950/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                          Client & Consultant Chat
                        </h4>
                        <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                          External channel visible to client in their portal
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px] font-semibold px-2 py-0.5"
                    >
                      Visible to Client
                    </Badge>
                  </div>

                  {/* Client Messages Stream */}
                  <div
                    ref={clientMessagesContainerRef}
                    className="flex-1 min-h-0 max-h-full overflow-y-auto p-4 space-y-3.5 bg-background/30 overscroll-contain"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(125, 125, 125, 0.4) transparent"
                    }}
                  >
                    {loadingClient ? (
                      <div className="flex h-full items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : clientMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                        <Globe className="h-9 w-9 text-muted-foreground/30 mb-2" />
                        <p className="text-xs font-bold text-foreground">No client messages yet</p>
                        <p className="text-[11px] text-muted-foreground max-w-xs mt-1">
                          Send a message to update the client on progress, deliverables, or document requests.
                        </p>
                      </div>
                    ) : (
                      clientMessages
                        .filter(msg => (msg.channel || "").toUpperCase() !== "INTERNAL" || isSystemMessage(msg))
                        .map((msg, idx) => {
                        const isSystem = isSystemMessage(msg);
                        const isClientSender = msg.is_client || (msg.sender_role || "").toUpperCase() === "CLIENT";

                        if (isSystem) {
                          return (
                            <div key={msg.id || idx} className="flex justify-center my-3 px-2">
                              <div className="bg-muted/70 dark:bg-zinc-900/80 border border-border/80 dark:border-zinc-800 rounded-full px-3.5 py-1.5 text-xs text-muted-foreground dark:text-zinc-400 flex items-center gap-2 shadow-2xs backdrop-blur-md max-w-[92%] text-center">
                                <div className="h-5 w-5 rounded-full bg-muted dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                  {getMilestoneIcon(msg.message)}
                                </div>
                                <span className="font-medium text-[11px] sm:text-xs leading-snug">{msg.message}</span>
                                <span className="text-[10px] text-muted-foreground/60 dark:text-zinc-500 shrink-0 font-mono ml-0.5">
                                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex flex-col ${isClientSender ? "items-start" : "items-end"} max-w-[85%] ${
                              isClientSender ? "mr-auto" : "ml-auto"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              {isClientSender ? (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
                                  Client
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20">
                                  Staff / Team
                                </Badge>
                              )}
                              <span className="text-[11px] font-bold text-foreground">
                                {msg.sender_name || (isClientSender ? "Client" : "Consultant")}
                              </span>
                              {msg.sender_role && !isClientSender && (
                                <span className="text-[10px] text-muted-foreground">
                                  ({msg.sender_role})
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {msg.created_at
                                  ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  : ""}
                              </span>
                            </div>

                            <div
                              className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                                isClientSender
                                  ? "bg-emerald-500/10 dark:bg-emerald-950/30 text-foreground border border-emerald-500/25 dark:border-emerald-500/30 rounded-tl-sm"
                                  : "bg-sky-600 dark:bg-sky-600 text-white rounded-tr-sm shadow-sm"
                              }`}
                            >
                              {msg.message}

                              {/* Client Uploaded Document Preview Button (Preview Only - No Download) */}
                              {(msg.attachment_name || (msg.attachment_url && msg.attachment_url !== "uploading...")) && (
                                <div
                                  className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-2xs ${
                                    isClientSender
                                      ? "bg-background/90 border-border/60 text-foreground"
                                      : "bg-sky-700/80 border-sky-500/30 text-white"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                        isClientSender
                                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                                          : "bg-white/10 text-white border-white/20"
                                      }`}
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-bold truncate block text-xs">
                                        {msg.attachment_name || "Client Document"}
                                      </span>
                                      <span
                                        className={`text-[10px] block truncate ${
                                          isClientSender ? "text-muted-foreground" : "text-sky-200"
                                        }`}
                                      >
                                        Stored in Company Vault (Client Shared Docs)
                                      </span>
                                    </div>
                                  </div>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreviewAttachment(msg)}
                                    className={`h-7 text-[11px] font-bold gap-1 px-2.5 shrink-0 shadow-2xs ${
                                      isClientSender
                                        ? "text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 border-sky-500/30"
                                        : "text-white bg-white/10 hover:bg-white/20 border-white/30"
                                    }`}
                                  >
                                    <Eye className="h-3 w-3" />
                                    Preview
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Client Chat Input Bar (With Confirmation Trigger) */}
                  <form
                    onSubmit={handleClientSendClick}
                    className="p-3 border-t border-border/60 bg-muted/20 flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      placeholder="Message the Client (confirmation will be requested)..."
                      value={clientInput}
                      onChange={e => setClientInput(e.target.value)}
                      className="flex-1 text-xs sm:text-sm bg-background border border-input rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      disabled={sendingClient}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!clientInput.trim() || sendingClient}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold gap-1.5 px-3.5 h-9 shrink-0 shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send to Client
                    </Button>
                  </form>
                </div>

                {/* ============================================================ */}
                {/* PANE 2 (RIGHT): INTERNAL TEAM CHAT (PRIVATE)                */}
                {/* ============================================================ */}
                <div className="flex flex-col h-full min-h-0 max-h-full bg-background/50 overflow-hidden">
                  {/* Internal Pane Subheader */}
                  <div className="px-4 py-2.5 border-b border-border/40 bg-amber-500/5 dark:bg-amber-950/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                          Internal Team Chat
                        </h4>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          Private notes amongst staff & assigned team members
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold px-2 py-0.5"
                    >
                      Team Only • Hidden from Client
                    </Badge>
                  </div>

                  {/* Internal Messages Stream */}
                  <div
                    ref={internalMessagesContainerRef}
                    className="flex-1 min-h-0 max-h-full overflow-y-auto p-4 space-y-3.5 bg-background/30 overscroll-contain"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(125, 125, 125, 0.4) transparent"
                    }}
                  >
                    {loadingInternal ? (
                      <div className="flex h-full items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : internalMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                        <Lock className="h-9 w-9 text-muted-foreground/30 mb-2" />
                        <p className="text-xs font-bold text-foreground">No internal notes yet</p>
                        <p className="text-[11px] text-muted-foreground max-w-xs mt-1">
                          Collaborate privately with teammates, tag consultants (@name), or discuss blockers without client visibility.
                        </p>
                      </div>
                    ) : (
                      internalMessages
                        .filter(msg => isSystemMessage(msg) || (!msg.is_client && (msg.sender_role || "").toUpperCase() !== "CLIENT"))
                        .map((msg, idx) => {
                        const isSystem = isSystemMessage(msg);

                        if (isSystem) {
                          return (
                            <div key={msg.id || idx} className="flex justify-center my-3 px-2">
                              <div className="bg-muted/70 dark:bg-zinc-900/80 border border-border/80 dark:border-zinc-800 rounded-full px-3.5 py-1.5 text-xs text-muted-foreground dark:text-zinc-400 flex items-center gap-2 shadow-2xs backdrop-blur-md max-w-[92%] text-center">
                                <div className="h-5 w-5 rounded-full bg-muted dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                  {getMilestoneIcon(msg.message)}
                                </div>
                                <span className="font-medium text-[11px] sm:text-xs leading-snug">{msg.message}</span>
                                <span className="text-[10px] text-muted-foreground/60 dark:text-zinc-500 shrink-0 font-mono ml-0.5">
                                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={msg.id || idx} className="flex flex-col items-start max-w-[90%] mr-auto">
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[11px] font-bold text-foreground">
                                {msg.sender_name || "Team Member"}
                              </span>
                              {msg.sender_role && (
                                <span className="text-[10px] text-muted-foreground">
                                  ({msg.sender_role})
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground ml-1">
                                {msg.created_at
                                  ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  : ""}
                              </span>
                            </div>

                            <div className="p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs bg-amber-500/10 dark:bg-amber-950/30 text-foreground border border-amber-500/25 dark:border-amber-500/30 rounded-tl-sm">
                              {renderInternalMessageText(msg.message)}

                              {/* Attached Document Card (Preview Only) */}
                              {(msg.attachment_name || (msg.attachment_url && msg.attachment_url !== "uploading...")) && (
                                <div className="mt-2.5 p-2.5 rounded-xl bg-background/90 border border-border/60 flex items-center justify-between gap-3 text-xs shadow-2xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                                      <FileText className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-bold text-foreground truncate block text-xs">
                                        {msg.attachment_name || "Document"}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground block">
                                        Stored in Company Vault
                                      </span>
                                    </div>
                                  </div>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreviewAttachment(msg)}
                                    className="h-7 text-[11px] font-bold gap-1 px-2.5 shrink-0 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-500/30 shadow-2xs"
                                  >
                                    <Eye className="h-3 w-3" />
                                    Preview
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Internal Chat Input Bar (With @Tagging Support) */}
                  <div className="p-3 border-t border-border/60 bg-muted/20 relative shrink-0">
                    {/* Suggestions Popover for @mentions */}
                    {showSuggestions && (
                      <div className="absolute bottom-full left-3 right-3 mb-2 bg-popover border border-border rounded-xl shadow-xl p-1 z-50 max-h-48 overflow-y-auto">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                          Suggested Mentions
                        </div>
                        {filteredSuggestions.map((item, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectSuggestion(item)}
                            className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-muted/80 rounded-lg flex items-center justify-between"
                          >
                            <span className="font-semibold text-foreground">
                              {item.type === "team" ? `👥 ${item.displayName}` : `👤 ${item.displayName}`}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {item.type === "team" ? "Team" : item.department?.name || "Staff"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleInternalSend} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Internal team note (use @ to tag teammates)..."
                        value={internalInput}
                        onChange={e => handleInternalTextChange(e.target.value, e.target.selectionStart || 0)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && showSuggestions && filteredSuggestions.length > 0) {
                            e.preventDefault();
                            selectSuggestion(filteredSuggestions[0]);
                          }
                        }}
                        className="flex-1 text-xs sm:text-sm bg-background border border-input rounded-xl px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        disabled={sendingInternal}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!internalInput.trim() || sendingInternal}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5 px-3.5 h-9 shrink-0 shadow-xs"
                      >
                        {sendingInternal ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Post Note
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL BEFORE SENDING TO CLIENT */}
      <AnimatePresence>
        {isConfirmClientOpen && (
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmClientOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl p-6 z-[90] space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Confirm Message to Client
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please verify the content before sending it directly to the client.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-foreground">
                  Are you sure you want to send this message to the Client?
                </p>

                <div className="p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5 text-xs text-foreground leading-relaxed">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block mb-1">
                    Message Preview:
                  </span>
                  <p className="italic font-medium">"{pendingClientMessage}"</p>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  This message will be instantly delivered to the client portal and notify their primary representative.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmClientOpen(false)}
                  className="text-xs font-semibold h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmSendClientMessage}
                  disabled={sendingClient}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs gap-1.5 h-9 shadow-xs"
                >
                  {sendingClient ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Confirm & Send to Client
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ATTACHMENT PREVIEW MODAL FOR STAFF (PREVIEW ONLY - NO DOWNLOAD) */}
      <AnimatePresence>
        {previewAttachment && previewUrl && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setPreviewAttachment(null);
                setPreviewUrl(null);
              }}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-4xl h-[85vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[100]"
            >
              {/* Preview Header */}
              <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">
                      {previewAttachment.attachment_name || "Document Preview"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Order #{orderNumber} • Client Shared Document (Preview Only)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground italic mr-2 hidden sm:inline">
                    File download available via Company Documents
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPreviewAttachment(null);
                      setPreviewUrl(null);
                    }}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Preview Body */}
              <div className="flex-1 bg-muted/10 p-2 overflow-hidden flex items-center justify-center">
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-xl border border-border/40 bg-background"
                  title="Document Preview"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
