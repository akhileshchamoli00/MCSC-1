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
  ExternalLink,
  Copy,
  Calendar,
  Mail,
  Phone,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Trash2,
  Check,
  CheckCheck,
  Reply,
  Quote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { resolveImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { ChatEmojiPicker } from "@/components/chat-emoji-picker";
import { ChatMessageReactions, WhatsAppReactionHoverBar } from "@/components/chat-message-reactions";

const formatSeenTime = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Today at ${timeStr}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} at ${timeStr}`;
  } catch {
    return dateStr;
  }
};

const SeenReceiptsIndicator = ({
  seenBy,
  isSelf,
  sentAt
}: {
  seenBy?: any[];
  isSelf: boolean;
  sentAt?: string;
  colorScheme?: string;
}) => {
  const readers = seenBy || [];
  const hasSeen = readers.length > 0;

  if (!hasSeen) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center p-0.5 opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
              aria-label="Delivered"
            >
              <Check className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            sideOffset={8}
            collisionPadding={16}
            className="z-[99999] px-2.5 py-1 rounded-lg bg-popover text-popover-foreground border border-border shadow-lg text-[11px] font-medium [&_.rotate-45]:hidden"
          >
            {sentAt ? `Delivered • ${formatSeenTime(sentAt)}` : "Delivered"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-0.5 cursor-pointer p-0.5 rounded hover:bg-muted/60 transition-colors focus:outline-none"
            aria-label={`Seen by ${readers.map(r => r.name).join(", ")}`}
          >
            <CheckCheck className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          sideOffset={8}
          collisionPadding={16}
          className="z-[99999] min-w-[210px] max-w-[280px] p-2.5 rounded-xl bg-popover text-popover-foreground border border-border shadow-2xl backdrop-blur-md text-left [&_.rotate-45]:hidden"
        >
          <div className="flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3 w-3 text-blue-500" />
              Seen by ({readers.length})
            </span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {readers.map((r, idx) => (
              <div key={r.user_id || idx} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0 border border-border">
                    {r.name ? r.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-[11px] text-foreground block truncate">
                      {r.name}
                    </span>
                    {r.role && (
                      <span className="text-[9px] text-muted-foreground block truncate -mt-0.5">
                        {r.role}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/80 shrink-0 text-right">
                  {formatSeenTime(r.read_at)}
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

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
    txt.includes("order placed on hold") ||
    txt.includes("⏸️") ||
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
  if (txt.includes("on hold") || txt.includes("⏸️") || txt.includes("pause")) {
    return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  }
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

const isEmojiOnlyText = (str?: string | null) => {
  if (!str) return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji_Modifier}|\p{Emoji_Component}|\s)+$/u;
  return emojiRegex.test(trimmed) && trimmed.length <= 32;
};

const renderMessageContent = (
  text?: string,
  isInternal: boolean = false,
  taggableList: any[] = []
) => {
  if (!text) return null;

  if (isEmojiOnlyText(text)) {
    return (
      <div className="text-[32px] sm:text-[38px] leading-none select-none py-1 px-1 tracking-wide inline-block">
        {text}
      </div>
    );
  }

  if (isInternal && text.includes("@")) {
    const names = taggableList
      .map(u => u.displayName || (u.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : null) || u.name)
      .filter(Boolean)
      .sort((a: string, b: string) => b.length - a.length)
      .map((name: string) => name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));

    let regex: RegExp;
    if (names.length > 0) {
      const namesPattern = names.join("|");
      regex = new RegExp(`(@\\[[^\\]]+\\]|@(?:${namesPattern})|@[A-Za-z0-9_.-]+(?:\\s+[A-Z][a-z0-9_.-]+)*)`, "g");
    } else {
      regex = /(@\[[^\]]+\]|@[A-Za-z0-9_.-]+(?:\s+[A-Z][a-z0-9_.-]+)*)/g;
    }

    const parts = text.split(regex);
    return (
      <span className="whitespace-pre-wrap leading-relaxed text-foreground">
        {parts.map((part, i) => {
          if (part && part.startsWith("@")) {
            return (
              <span
                key={i}
                className="font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-950/40 border border-amber-500/20 px-1.5 py-0.5 rounded-md text-[11px] sm:text-xs inline-block align-baseline mr-0.5"
              >
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  }

  return <span className="whitespace-pre-wrap leading-relaxed">{text}</span>;
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

  // Order Details Summary State
  const [orderSummary, setOrderSummary] = useState<any | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

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

  // Quote / Reply State
  const [quotedClientMessage, setQuotedClientMessage] = useState<any | null>(null);
  const [quotedInternalMessage, setQuotedInternalMessage] = useState<any | null>(null);

  // Input refs
  const clientInputRef = useRef<HTMLInputElement | null>(null);
  const internalInputRef = useRef<HTMLInputElement | null>(null);

  // Client Confirmation Dialog State
  const [isConfirmClientOpen, setIsConfirmClientOpen] = useState(false);
  const [pendingClientMessage, setPendingClientMessage] = useState("");

  // Tagging in Internal Chat
  const [taggableUsers, setTaggableUsers] = useState<any[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  // Current logged in user (for permission check on edit/delete)
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Edit / Delete State
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const clientMessagesContainerRef = useRef<HTMLDivElement | null>(null);
  const internalMessagesContainerRef = useRef<HTMLDivElement | null>(null);

  const handleQuoteClientMessage = (msg: any) => {
    setQuotedClientMessage(msg);
    setTimeout(() => {
      clientInputRef.current?.focus();
    }, 50);
  };

  const handleQuoteInternalMessage = (msg: any) => {
    setQuotedInternalMessage(msg);
    setTimeout(() => {
      internalInputRef.current?.focus();
    }, 50);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    if (isOpen) {
      fetchCurrentUser();
    }
  }, [isOpen]);

  const canModifyMessage = (msg: any) => {
    if (!msg || !msg.id || isSystemMessage(msg)) return false;
    if (!currentUser) return false;
    const isSuperAdmin = currentUser.role?.name?.toUpperCase() === "SUPER_ADMIN" || currentUser.is_super_admin;
    const isAdmin = currentUser.role?.name?.toUpperCase() === "ADMIN" || currentUser.role?.name?.toUpperCase() === "HR" || currentUser.department?.name === "HR";
    const isAuthor = msg.user_id && msg.user_id === currentUser.id;
    return Boolean(isAuthor || isSuperAdmin || isAdmin);
  };

  const handleStartEdit = (msg: any) => {
    setEditingMessageId(msg.id);
    setEditingMessageText(msg.message || "");
    setConfirmDeleteId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  const handleSaveEdit = async (msgId: number, channel: "CLIENT" | "INTERNAL") => {
    if (!orderNumber || !editingMessageText.trim() || savingEdit) return;
    try {
      setSavingEdit(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(orderNumber)}/progress/${msgId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: editingMessageText.trim()
          })
        }
      );

      if (res.ok) {
        const updated = await res.json();
        if (channel === "CLIENT") {
          setClientMessages(prev => prev.map(m => (m.id === msgId ? updated : m)));
        } else {
          setInternalMessages(prev => prev.map(m => (m.id === msgId ? updated : m)));
        }
        setEditingMessageId(null);
        setEditingMessageText("");
        toast.success("Message updated successfully");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update message");
      }
    } catch (err) {
      console.error("Error updating message:", err);
      toast.error("Error updating message");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMessage = async (msgId: number, channel: "CLIENT" | "INTERNAL") => {
    if (!orderNumber || deletingMessageId) return;
    try {
      setDeletingMessageId(msgId);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(orderNumber)}/progress/${msgId}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      if (res.ok) {
        if (channel === "CLIENT") {
          setClientMessages(prev => prev.filter(m => m.id !== msgId));
        } else {
          setInternalMessages(prev => prev.filter(m => m.id !== msgId));
        }
        setConfirmDeleteId(null);
        toast.success("Message deleted successfully");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to delete message");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      toast.error("Error deleting message");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const lastMarkedClientMsgIdRef = useRef<number>(0);
  const lastMarkedInternalMsgIdRef = useRef<number>(0);

  const markOrderChatRead = async (orderNo: string, channel: string, lastMsgId: number) => {
    if (!orderNo || !lastMsgId) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNo}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          channel,
          last_message_id: lastMsgId
        })
      });
    } catch {
      // silent
    }
  };

  const handleToggleReaction = async (msgId: number, emoji: string, isInternal: boolean) => {
    if (!orderNumber || !msgId || !emoji) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(orderNumber)}/progress/${msgId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ emoji })
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.reactions) {
          const syncUpdater = (prevMsgs: any[]) =>
            prevMsgs.map(m => (m.id === msgId ? { ...m, reactions: data.reactions } : m));
          if (isInternal) setInternalMessages(syncUpdater);
          else setClientMessages(syncUpdater);
        }
      }
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  };

  // 1. Fetch Order Summary
  const fetchOrderSummary = async (isInitial = false) => {
    if (!orderNumber) return;
    if (isInitial) setLoadingSummary(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(orderNumber)}/summary`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setOrderSummary(data);
      }
    } catch (err) {
      console.error("Error loading order summary:", err);
    } finally {
      if (isInitial) setLoadingSummary(false);
    }
  };

  // 2. Fetch Client Messages
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
        if (data && data.length > 0) {
          const maxId = Math.max(...data.map((m: any) => m.id || 0));
          if (maxId > lastMarkedClientMsgIdRef.current) {
            lastMarkedClientMsgIdRef.current = maxId;
            markOrderChatRead(orderNumber, "CLIENT", maxId);
          }
        }
      }
    } catch (err) {
      console.error("Error loading client messages:", err);
    } finally {
      if (isInitial) setLoadingClient(false);
    }
  };

  // 3. Fetch Internal Messages
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
        if (data && data.length > 0) {
          const maxId = Math.max(...data.map((m: any) => m.id || 0));
          if (maxId > lastMarkedInternalMsgIdRef.current) {
            lastMarkedInternalMsgIdRef.current = maxId;
            markOrderChatRead(orderNumber, "INTERNAL", maxId);
          }
        }
      }
    } catch (err) {
      console.error("Error loading internal messages:", err);
    } finally {
      if (isInitial) setLoadingInternal(false);
    }
  };

  // 4. Fetch Taggable Users (for Internal Chat @mentions)
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
    await Promise.all([
      fetchClientMessages(false),
      fetchInternalMessages(false),
      fetchOrderSummary(false)
    ]);
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
      lastMarkedClientMsgIdRef.current = 0;
      lastMarkedInternalMsgIdRef.current = 0;
      fetchOrderSummary(true);
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

  // 5. Handle Client Message Confirmation
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
      const quotePayload = quotedClientMessage ? {
        quoted_message_id: quotedClientMessage.id,
        quoted_message_text: quotedClientMessage.message || quotedClientMessage.attachment_name || "Attachment",
        quoted_sender_name: quotedClientMessage.sender_name || (quotedClientMessage.is_client ? "Client" : "Consultant")
      } : {};

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
            channel: "CLIENT",
            ...quotePayload
          })
        }
      );
      if (res.ok) {
        const newMsg = await res.json();
        setClientMessages(prev => [...prev, newMsg]);
        setClientInput("");
        setPendingClientMessage("");
        setQuotedClientMessage(null);
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

  // 6. Handle Internal Message Send (Instant, No Confirmation)
  const handleInternalSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!internalInput.trim() || !orderNumber || sendingInternal) return;
    const msgToSend = internalInput.trim();
    const quotePayload = quotedInternalMessage ? {
      quoted_message_id: quotedInternalMessage.id,
      quoted_message_text: quotedInternalMessage.message || quotedInternalMessage.attachment_name || "Attachment",
      quoted_sender_name: quotedInternalMessage.sender_name || "Team Member"
    } : {};

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
            channel: "INTERNAL",
            ...quotePayload
          })
        }
      );
      if (res.ok) {
        const newMsg = await res.json();
        setInternalMessages(prev => [...prev, newMsg]);
        setQuotedInternalMessage(null);
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

            {/* Fullscreen Dynamic Order Chat Dialog Flier */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              className="fixed inset-0 z-[75] h-screen h-[100dvh] max-h-screen max-h-[100dvh] w-screen w-[100vw] max-w-[100vw] bg-background text-foreground shadow-2xl flex flex-col overflow-hidden"
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
                      {(orderSummary?.status || orderStatus) && (
                        <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                          {orderSummary?.status || orderStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className={`text-xs gap-1.5 h-8.5 font-medium border-border transition-colors ${
                      showDetails ? "bg-primary/10 text-primary border-primary/30 font-semibold" : "bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                    title={showDetails ? "Hide Order Details" : "Show Order Details"}
                  >
                    {showDetails ? (
                      <>
                        <PanelLeftClose className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Hide Details</span>
                      </>
                    ) : (
                      <>
                        <PanelLeftOpen className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Show Details</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="text-xs gap-1.5 h-8.5 font-medium border-border"
                  >
                    <RotateCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
                    <span className="hidden sm:inline">Refresh</span>
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

              {/* 3-PANEL BODY: LEFT ORDER DETAILS + DUAL CHAT SPLIT PANE */}
              <div className="flex-1 flex flex-col lg:flex-row min-h-0 h-full max-h-full overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border/80 bg-muted/5">
                {/* ============================================================ */}
                {/* LEFT SIDEBAR: ORDER DETAILS & CLIENT OVERVIEW                */}
                {/* ============================================================ */}
                {showDetails && (
                  <div className="w-full lg:w-[320px] xl:w-[350px] 2xl:w-[380px] shrink-0 flex flex-col h-full min-h-0 max-h-full bg-card/60 dark:bg-zinc-950/40 border-r border-border/80 overflow-hidden">
                    {/* Sidebar Header */}
                    <div className="px-4 py-2.5 border-b border-border/40 bg-muted/40 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Order Details
                        </span>
                      </div>
                      {orderSummary?.status && (
                        <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5">
                          {orderSummary.status}
                        </Badge>
                      )}
                    </div>

                    {/* Sidebar Scrollable Body */}
                    <div
                      className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 overscroll-contain"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "rgba(125, 125, 125, 0.4) transparent"
                      }}
                    >
                      {loadingSummary ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-xs font-medium">Loading order details...</span>
                        </div>
                      ) : (
                        <>
                          {/* Card 1: Company Profile */}
                          <div className="p-3.5 rounded-xl bg-background/90 border border-border/80 shadow-2xs">
                            <div className="flex items-start gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
                                <Building className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                                  {orderSummary?.company?.company_name || companyName || "Company Profile"}
                                </h5>
                                {orderSummary?.company?.company_code && (
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[10px] font-mono text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                      {orderSummary.company.company_code}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(orderSummary.company.company_code, "Company ID")}
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                      title="Copy Company ID"
                                    >
                                      <Copy className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Card 2: Scope & Deliverables */}
                          <div className="p-3.5 rounded-xl bg-background/90 border border-border/80 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                              <div className="flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="text-xs font-bold text-foreground">Scope & Deliverables</span>
                              </div>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                                {orderSummary?.items?.length || 1}
                              </Badge>
                            </div>

                            <div className="space-y-2.5">
                              {orderSummary?.items && orderSummary.items.length > 0 ? (
                                orderSummary.items.map((item: any, i: number) => (
                                  <div key={item.id || i} className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-1.5">
                                    <div className="flex items-start justify-between gap-1.5">
                                      <span className="text-xs font-bold text-foreground leading-snug">
                                        {item.job_title}
                                      </span>
                                      {item.job_id && (
                                        <span className="text-[9px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded shrink-0">
                                          {item.job_id}
                                        </span>
                                      )}
                                    </div>

                                    {item.description ? (
                                      <p className="text-[11px] text-muted-foreground leading-relaxed bg-background/70 p-2 rounded-md border border-border/40 whitespace-pre-line">
                                        {item.description}
                                      </p>
                                    ) : (
                                      <p className="text-[10px] text-muted-foreground/70 italic">
                                        Standard scope deliverable
                                      </p>
                                    )}

                                    {(item.service_instructions || item.notes) && (
                                      <div className="p-2 rounded-md bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 space-y-0.5">
                                        <div className="flex items-center gap-1 font-bold text-[10px] text-amber-700 dark:text-amber-400">
                                          <FileText className="h-3 w-3 shrink-0" />
                                          <span>Service Instructions:</span>
                                        </div>
                                        <p className="text-[11px] text-foreground/90 font-medium leading-relaxed whitespace-pre-wrap">
                                          {item.service_instructions || item.notes}
                                        </p>
                                      </div>
                                    )}

                                    {(item.needs_notary || item.needs_gov_officer || item.needs_other_vendors) && (
                                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                        {item.needs_notary && (
                                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-medium">
                                            Notary
                                          </span>
                                        )}
                                        {item.needs_gov_officer && (
                                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                                            Gov Approval
                                          </span>
                                        )}
                                        {item.needs_other_vendors && (
                                          <span className="text-[9px] px-1.5 py-0 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                                            Vendor
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                                  <span className="text-xs font-semibold text-foreground block">
                                    {orderTitle || "Corporate Consulting Service"}
                                  </span>
                                  <p className="text-[11px] text-muted-foreground mt-1">
                                    Consulting and execution for corporate deliverables.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card 3: Assigned Consultants */}
                          <div className="p-3.5 rounded-xl bg-background/90 border border-border/80 shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                              <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="text-xs font-bold text-foreground">Assigned Consultants</span>
                              </div>
                              {orderSummary?.consultants?.length > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                                  {orderSummary.consultants.length}
                                </Badge>
                              )}
                            </div>

                            {orderSummary?.consultants && orderSummary.consultants.length > 0 ? (
                              <div className="space-y-2">
                                {orderSummary.consultants.map((c: any, idx: number) => (
                                  <div key={c.id || idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/40 border border-border/60">
                                    {c.profile_photo ? (
                                      <img
                                        src={resolveImageUrl(c.profile_photo)}
                                        alt={c.name}
                                        className="h-7 w-7 rounded-full object-cover border border-border shrink-0"
                                      />
                                    ) : (
                                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shrink-0">
                                        {c.name?.charAt(0) || "C"}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <span className="text-xs font-bold text-foreground truncate block">
                                        {c.name}
                                      </span>
                                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                                        <span>{c.job_title || c.position || "Consultant"}</span>
                                        {c.department && <span>• {c.department}</span>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-muted-foreground italic p-2.5 rounded-lg bg-muted/30 text-center">
                                No specific consultant assigned yet
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* DUAL CHAT SPLIT PANE (EXTERNAL CLIENT & INTERNAL NOTES)      */}
                {/* ============================================================ */}
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
                        .filter(msg => isSystemMessage(msg) || msg.channel === "CLIENT" || msg.is_client || (msg.sender_role || "").toUpperCase() === "CLIENT")
                        .map((msg, idx, arr) => {
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

                        const isClientSender = msg.is_client || (msg.sender_role || "").toUpperCase() === "CLIENT";
                        const prevMsg = idx > 0 ? arr[idx - 1] : null;
                        const isPrevClientSender = prevMsg ? (prevMsg.is_client || (prevMsg.sender_role || "").toUpperCase() === "CLIENT") : null;
                        const isSameSenderAsPrev = !isSystemMessage(prevMsg) && !!prevMsg && (
                          (Boolean(msg.user_id || msg.sender_id) && (msg.user_id || msg.sender_id) === (prevMsg.user_id || prevMsg.sender_id)) ||
                          (isClientSender === isPrevClientSender && Boolean(msg.sender_name) && msg.sender_name === prevMsg.sender_name)
                        );

                        const isEditing = editingMessageId === msg.id;
                        const isDeleting = confirmDeleteId === msg.id;
                        const canModify = canModifyMessage(msg);
                        const emojiOnly = isEmojiOnlyText(msg.message) && !msg.quoted_message_text && !msg.attachment_name && (!msg.attachment_url || msg.attachment_url === "uploading...");

                        return (
                          <div
                            key={msg.id || idx}
                            className={`group flex flex-col ${isClientSender ? "items-start" : "items-end"} max-w-[85%] ${
                              isClientSender ? "mr-auto" : "ml-auto"
                            } ${isSameSenderAsPrev ? "mt-1" : "mt-3.5"}`}
                          >
                            {!isSameSenderAsPrev && (
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
                              </div>
                            )}

                            {isEditing ? (
                              <div className="w-full space-y-2 p-2.5 rounded-xl bg-background border border-sky-500/40 shadow-md">
                                <textarea
                                  value={editingMessageText}
                                  onChange={e => setEditingMessageText(e.target.value)}
                                  className="w-full text-xs sm:text-[13px] bg-muted/40 border border-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500 min-h-[60px] text-foreground resize-y"
                                  autoFocus
                                  placeholder="Edit message..."
                                />
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    disabled={savingEdit}
                                    className="h-7 text-xs px-2.5 gap-1 text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-3 w-3" /> Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleSaveEdit(msg.id, "CLIENT")}
                                    disabled={!editingMessageText.trim() || savingEdit}
                                    className="h-7 text-xs px-2.5 gap-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs"
                                  >
                                    {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : isDeleting ? (
                              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2">
                                <p className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                                  Delete this message permanently?
                                </p>
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setConfirmDeleteId(null)}
                                    disabled={deletingMessageId === msg.id}
                                    className="h-6.5 text-[11px] px-2"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleDeleteMessage(msg.id, "CLIENT")}
                                    disabled={deletingMessageId === msg.id}
                                    className="h-6.5 text-[11px] px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1"
                                  >
                                    {deletingMessageId === msg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className={`flex flex-col max-w-full ${isClientSender ? "self-start" : "self-end"}`}>
                                <div className="flex items-center gap-1.5 max-w-full">
                                  {/* For outgoing (staff) message, show WhatsApp reaction trigger + actions on left */}
                                  {!isClientSender && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {canModify && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleStartEdit(msg)}
                                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                                            title="Edit message"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId(msg.id)}
                                            className="p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                                            title="Delete message"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleQuoteClientMessage(msg)}
                                        className="p-1 rounded-md text-muted-foreground hover:text-sky-600 hover:bg-sky-500/10 transition-colors"
                                        title="Quote / Reply"
                                      >
                                        <Reply className="h-3 w-3" />
                                      </button>
                                      <WhatsAppReactionHoverBar
                                        onToggleReaction={emoji => handleToggleReaction(msg.id, emoji, false)}
                                        align="end"
                                        side="top"
                                      />
                                    </div>
                                  )}

                                  <div
                                    className={`rounded-2xl leading-relaxed shadow-xs ${
                                      emojiOnly
                                        ? "px-2.5 py-1"
                                        : "px-3.5 py-2 text-xs sm:text-[13px]"
                                    } ${
                                      isClientSender
                                        ? "bg-emerald-500/10 dark:bg-emerald-950/30 text-foreground border border-emerald-500/25 dark:border-emerald-500/30 rounded-tl-sm"
                                        : "bg-sky-600 dark:bg-sky-600 text-white rounded-tr-sm shadow-sm"
                                    }`}
                                  >
                                    {/* Quoted / Replied Message Header */}
                                    {msg.quoted_message_text && (
                                      <div
                                        className={`mb-2 p-2 rounded-lg border-l-2 text-left text-xs select-none ${
                                          isClientSender
                                            ? "bg-emerald-500/15 dark:bg-emerald-950/50 border-l-emerald-600 text-foreground"
                                            : "bg-sky-700/80 border-l-white text-sky-100"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1 font-bold text-[10px] opacity-90">
                                          <Reply className="h-2.5 w-2.5" />
                                          <span>{msg.quoted_sender_name || "Quoted Message"}</span>
                                        </div>
                                        <p className="text-[11px] opacity-80 truncate italic mt-0.5">
                                          "{msg.quoted_message_text}"
                                        </p>
                                      </div>
                                    )}

                                    <div>{renderMessageContent(msg.message, false)}</div>

                                    {/* Client Uploaded Document Preview Button (Preview Only - No Download) */}
                                    {(msg.attachment_name || (msg.attachment_url && msg.attachment_url !== "uploading...")) && (
                                      <div
                                        className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-2xs ${
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

                                  {/* For incoming (client) message, show WhatsApp reaction trigger + actions on right */}
                                  {isClientSender && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <WhatsAppReactionHoverBar
                                        onToggleReaction={emoji => handleToggleReaction(msg.id, emoji, false)}
                                        align="start"
                                        side="top"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleQuoteClientMessage(msg)}
                                        className="p-1 rounded-md text-muted-foreground hover:text-sky-600 hover:bg-sky-500/10 transition-colors"
                                        title="Quote / Reply"
                                      >
                                        <Reply className="h-3 w-3" />
                                      </button>
                                      {canModify && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleStartEdit(msg)}
                                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                                            title="Edit message"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId(msg.id)}
                                            className="p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                                            title="Delete message"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {/* Outside on the right side, vertically centered in the middle */}
                                  <div className="flex items-center justify-center shrink-0 self-center select-none">
                                    <SeenReceiptsIndicator
                                      seenBy={msg.seen_by}
                                      isSelf={!isClientSender}
                                      sentAt={msg.created_at}
                                    />
                                  </div>
                                </div>

                                {/* WhatsApp style reaction badges at the bottom of the message */}
                                <ChatMessageReactions
                                  reactions={msg.reactions}
                                  onToggleReaction={emoji => handleToggleReaction(msg.id, emoji, false)}
                                  isSelf={!isClientSender}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Client Chat Input Bar (With Confirmation Trigger & Quote Preview Banner) */}
                  <div className="p-3 border-t border-border/60 bg-muted/20 space-y-2 shrink-0">
                    {quotedClientMessage && (
                      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-sky-500/10 border-l-4 border-l-sky-500 border-t border-r border-b border-sky-500/20 rounded-lg text-xs shadow-xs animate-in fade-in slide-in-from-bottom-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Reply className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-sky-700 dark:text-sky-300 block text-[10px] sm:text-[11px]">
                              Replying to {quotedClientMessage.sender_name || (quotedClientMessage.is_client ? "Client" : "Consultant")}
                            </span>
                            <p className="text-muted-foreground text-[11px] truncate max-w-sm italic">
                              "{quotedClientMessage.message || quotedClientMessage.attachment_name || "Attachment"}"
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setQuotedClientMessage(null)}
                          className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
                          title="Cancel reply"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    <form
                      onSubmit={handleClientSendClick}
                      className="flex items-center gap-2"
                    >
                      <ChatEmojiPicker
                        onSelectEmoji={emoji => {
                          setClientInput(prev => prev + emoji);
                          clientInputRef.current?.focus();
                        }}
                        side="top"
                        align="start"
                      />
                      <input
                        ref={clientInputRef}
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
                        .map((msg, idx, arr) => {
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

                        const prevMsg = idx > 0 ? arr[idx - 1] : null;
                        const isSameSenderAsPrev = !isSystemMessage(prevMsg) && !!prevMsg && (
                          (Boolean(msg.user_id || msg.sender_id) && (msg.user_id || msg.sender_id) === (prevMsg.user_id || prevMsg.sender_id)) ||
                          (Boolean(msg.sender_name) && msg.sender_name === prevMsg.sender_name)
                        );

                        const isEditing = editingMessageId === msg.id;
                        const isDeleting = confirmDeleteId === msg.id;
                        const canModify = canModifyMessage(msg);
                        const emojiOnly = isEmojiOnlyText(msg.message) && !msg.quoted_message_text && !msg.attachment_name && (!msg.attachment_url || msg.attachment_url === "uploading...");

                        return (
                          <div
                            key={msg.id || idx}
                            className={`group flex flex-col items-start max-w-[90%] mr-auto ${isSameSenderAsPrev ? "mt-1" : "mt-3.5"}`}
                          >
                            {!isSameSenderAsPrev && (
                              <div className="flex items-center gap-1.5 mb-1 px-1">
                                <span className="text-[11px] font-bold text-foreground">
                                  {msg.sender_name || "Team Member"}
                                </span>
                                {msg.sender_role && (
                                  <span className="text-[10px] text-muted-foreground">
                                    ({msg.sender_role})
                                  </span>
                                )}
                              </div>
                            )}

                            {isEditing ? (
                              <div className="w-full space-y-2 p-2.5 rounded-xl bg-background border border-amber-500/40 shadow-md">
                                <textarea
                                  value={editingMessageText}
                                  onChange={e => setEditingMessageText(e.target.value)}
                                  className="w-full text-xs sm:text-[13px] bg-muted/40 border border-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 min-h-[60px] text-foreground resize-y"
                                  autoFocus
                                  placeholder="Edit note..."
                                />
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    disabled={savingEdit}
                                    className="h-7 text-xs px-2.5 gap-1 text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-3 w-3" /> Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleSaveEdit(msg.id, "INTERNAL")}
                                    disabled={!editingMessageText.trim() || savingEdit}
                                    className="h-7 text-xs px-2.5 gap-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
                                  >
                                    {savingEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : isDeleting ? (
                              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2">
                                <p className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                                  Delete this internal note permanently?
                                </p>
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setConfirmDeleteId(null)}
                                    disabled={deletingMessageId === msg.id}
                                    className="h-6.5 text-[11px] px-2"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleDeleteMessage(msg.id, "INTERNAL")}
                                    disabled={deletingMessageId === msg.id}
                                    className="h-6.5 text-[11px] px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1"
                                  >
                                    {deletingMessageId === msg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col max-w-full self-start">
                                <div className="flex items-center gap-1.5 max-w-full">
                                  <div
                                    className={`rounded-2xl leading-relaxed shadow-xs bg-muted/40 dark:bg-zinc-900/60 text-foreground border border-border/60 dark:border-zinc-800 rounded-tl-sm ${
                                      emojiOnly
                                        ? "px-2.5 py-1"
                                        : "px-3.5 py-2 text-xs sm:text-[13px]"
                                    }`}
                                  >
                                    {/* Quoted Message Header */}
                                    {msg.quoted_message_text && (
                                      <div className="mb-2 p-2 rounded-lg border-l-2 border-l-amber-600 bg-amber-500/15 dark:bg-amber-950/50 text-foreground text-left text-xs select-none">
                                        <div className="flex items-center gap-1 font-bold text-[10px] text-amber-700 dark:text-amber-400">
                                          <Reply className="h-2.5 w-2.5" />
                                          <span>{msg.quoted_sender_name || "Quoted Message"}</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground truncate italic mt-0.5">
                                          "{msg.quoted_message_text}"
                                        </p>
                                      </div>
                                    )}

                                    <div>{renderMessageContent(msg.message, true, taggableUsers)}</div>

                                    {/* Attached Document Card (Preview Only) */}
                                    {(msg.attachment_name || (msg.attachment_url && msg.attachment_url !== "uploading...")) && (
                                      <div className="mt-2 p-2.5 rounded-xl bg-background/90 border border-border/60 flex items-center justify-between gap-3 text-xs shadow-2xs">
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

                                  {/* Actions & WhatsApp Reaction Hover Trigger right next to bubble */}
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <WhatsAppReactionHoverBar
                                      onToggleReaction={emoji => handleToggleReaction(msg.id, emoji, true)}
                                      align="start"
                                      side="top"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleQuoteInternalMessage(msg)}
                                      className="p-1 rounded-md text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                                      title="Quote / Reply"
                                    >
                                      <Reply className="h-3 w-3" />
                                    </button>
                                    {canModify && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleStartEdit(msg)}
                                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                                          title="Edit note"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(msg.id)}
                                          className="p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                                          title="Delete note"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  {/* Outside on the right side, vertically centered in the middle */}
                                  <div className="flex items-center justify-center shrink-0 self-center select-none">
                                    <SeenReceiptsIndicator
                                      seenBy={msg.seen_by}
                                      isSelf={true}
                                      sentAt={msg.created_at}
                                    />
                                  </div>
                                </div>

                                {/* Reactions Badges at the Bottom of Message */}
                                <ChatMessageReactions
                                  reactions={msg.reactions}
                                  onToggleReaction={emoji => handleToggleReaction(msg.id, emoji, true)}
                                  isSelf={false}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Internal Chat Input Bar (With @Tagging Support & Quote Banner) */}
                  <div className="p-3 border-t border-border/60 bg-muted/20 relative space-y-2 shrink-0">
                    {/* Quoted Internal Note Banner */}
                    {quotedInternalMessage && (
                      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-amber-500/10 border-l-4 border-l-amber-500 border-t border-r border-b border-amber-500/20 rounded-lg text-xs shadow-xs animate-in fade-in slide-in-from-bottom-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Reply className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-amber-700 dark:text-amber-300 block text-[10px] sm:text-[11px]">
                              Replying to {quotedInternalMessage.sender_name || "Team Member"}
                            </span>
                            <p className="text-muted-foreground text-[11px] truncate max-w-sm italic">
                              "{quotedInternalMessage.message || quotedInternalMessage.attachment_name || "Attachment"}"
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setQuotedInternalMessage(null)}
                          className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground"
                          title="Cancel reply"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

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
                      <ChatEmojiPicker
                        onSelectEmoji={emoji => {
                          setInternalInput(prev => prev + emoji);
                          internalInputRef.current?.focus();
                        }}
                        side="top"
                        align="start"
                      />
                      <input
                        ref={internalInputRef}
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
                        <span>Send</span>
                      </Button>
                    </form>
                  </div>
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
