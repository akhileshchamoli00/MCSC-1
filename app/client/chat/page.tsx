"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useClient } from "../layout";
import {
  Send,
  MessageSquare,
  Package,
  Users,
  Clock,
  Loader2,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Layers,
  FileText,
  RotateCw,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  Building,
  Check,
  CheckCheck,
  PanelRightClose,
  PanelRightOpen,
  HelpCircle,
  CreditCard,
  FileCheck,
  Paperclip,
  X,
  File,
  Lock,
  UploadCloud,
  Pencil,
  Trash2,
  Reply,
  Quote,
  Eye,
  Smile
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { resolveImageUrl } from "@/lib/utils";
import Link from "next/link";
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
    return <FileCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  }
  if (txt.includes("status") || txt.includes("active orders")) {
    return <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  }
  return <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; step: number }
> = {
  DRAFT: { label: "Draft", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", step: 1 },
  CONFIRMED: { label: "Confirmed", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", step: 1 },
  ORDER_ASSIGNED: { label: "Assigned", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", step: 1 },
  IN_PROGRESS: { label: "In Progress", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", step: 2 },
  ON_HOLD: { label: "On Hold", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", step: 2 },
  REVIEW_DOCS: { label: "Reviewing", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", step: 3 },
  FINAL_DOCUMENT_PREPARATION: { label: "Doc Prep", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", step: 4 },
  FINAL_DOC_READY: { label: "Final Docs Ready", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", step: 4 },
  WAITING_ON_CLIENT: { label: "Action Needed", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", step: 3 },
  WAITING_FOR_FINAL_PAYMENT: { label: "Payment Pending", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", step: 4 },
  FINAL_PAYMENT_COMPLETED: { label: "Paid", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", step: 4 },
  SOFT_COPY_DELIVERED: { label: "Soft Copy Sent", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20", step: 5 },
  HARD_COPY_DELIVERED: { label: "Delivered", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", step: 5 },
  COMPLETED: { label: "Completed", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", step: 5 },
  CANCELLED: { label: "Cancelled", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", step: 0 }
};

const ORDER_STAGES = [
  { id: 1, name: "Assigned" },
  { id: 2, name: "In Progress" },
  { id: 3, name: "Docs Review" },
  { id: 4, name: "Final Prep" },
  { id: 5, name: "Delivered" }
];

const isEmojiOnlyText = (str?: string | null) => {
  if (!str) return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji_Modifier}|\p{Emoji_Component}|\s)+$/u;
  return emojiRegex.test(trimmed) && trimmed.length <= 32;
};

const renderMessageContent = (text?: string) => {
  if (!text) return null;

  if (isEmojiOnlyText(text)) {
    return (
      <div className="text-[32px] sm:text-[38px] leading-none select-none py-1 px-1 tracking-wide inline-block">
        {text}
      </div>
    );
  }

  return <span className="whitespace-pre-wrap leading-relaxed">{text}</span>;
};

export default function ClientOrderChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clientProfile, activeCompany, loading: contextLoading } = useClient();

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit / Delete Message State
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [quotedMessage, setQuotedMessage] = useState<any | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastMarkedMsgIdRef = useRef<number>(0);

  const markOrderChatRead = async (orderNo: string, lastMsgId: number) => {
    if (!orderNo || !lastMsgId) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNo}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          channel: "CLIENT",
          last_message_id: lastMsgId
        })
      });
    } catch {
      // silent
    }
  };

  const handleQuoteMessage = (msg: any) => {
    setQuotedMessage(msg);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
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

  const handleSaveEdit = async (msgId: number) => {
    if (!selectedOrderGroup || !editingMessageText.trim() || savingEdit) return;
    try {
      setSavingEdit(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(selectedOrderGroup.orderNumber)}/progress/${msgId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: editingMessageText.trim() })
        }
      );
      if (res.ok) {
        const updated = await res.json();
        setMessages(prev => prev.map(m => (m.id === msgId ? updated : m)));
        setEditingMessageId(null);
        setEditingMessageText("");
        toast.success("Message updated");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || "Failed to update message");
      }
    } catch (err) {
      console.error("Error editing message:", err);
      toast.error("Failed to edit message");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    if (!selectedOrderGroup || deletingMessageId) return;
    try {
      setDeletingMessageId(msgId);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(selectedOrderGroup.orderNumber)}/progress/${msgId}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        setConfirmDeleteId(null);
        toast.success("Message deleted");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || "Failed to delete message");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      toast.error("Failed to delete message");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleToggleReaction = async (msgId: number, emoji: string) => {
    if (!selectedOrderGroup) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(selectedOrderGroup.orderNumber)}/progress/${msgId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ emoji })
        }
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(prev =>
          prev.map(m => (m.id === msgId ? { ...m, reactions: data.reactions } : m))
        );
      } else {
        toast.error("Failed to update reaction");
      }
    } catch (err) {
      console.error("Error toggling reaction:", err);
      toast.error("Failed to toggle reaction");
    }
  };

  // 1. Fetch Orders for active company
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Error fetching client orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeCompany]);

  // Group orders by order_number
  const orderGroups = React.useMemo(() => {
    const map = new Map<string, any[]>();
    orders.forEach(ord => {
      if (activeCompany && ord.company_id && ord.company_id !== activeCompany.id) {
        return;
      }
      const num = ord.order_number || `ORD-${ord.id}`;
      if (!map.has(num)) map.set(num, []);
      map.get(num)!.push(ord);
    });

    return Array.from(map.entries()).map(([orderNumber, items]) => ({
      orderNumber,
      primaryOrder: items[0],
      items,
      consultants: items[0].consultants || [],
      status: items[0].status || "CONFIRMED",
      createdAt: items[0].created_at
    }));
  }, [orders, activeCompany]);

  // Auto-select order from query param or custom event
  const openOrderDirectly = (orderNum: string) => {
    if (!orderNum || orderGroups.length === 0) return;
    const matched = orderGroups.find(g => g.orderNumber?.toUpperCase() === orderNum.toUpperCase());
    if (matched) {
      const isCompleted = ["COMPLETED", "HARD_COPY_DELIVERED"].includes(matched.status);
      if (isCompleted && statusFilter === "ACTIVE") {
        setStatusFilter("ALL");
      }
      setSelectedOrderGroup(matched);
      lastMarkedMsgIdRef.current = 0;
      setSearchTerm("");
      setTimeout(() => {
        const el = document.getElementById(`client-order-item-${matched.orderNumber}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 200);
    }
  };

  useEffect(() => {
    if (orderGroups.length === 0) return;

    const orderParam = searchParams.get("order");
    if (orderParam) {
      openOrderDirectly(orderParam);
      return;
    }

    if (!selectedOrderGroup) {
      setSelectedOrderGroup(orderGroups[0]);
      lastMarkedMsgIdRef.current = 0;
    }

    const handleCustomOpen = (e: any) => {
      if (e.detail?.orderNumber) {
        openOrderDirectly(e.detail.orderNumber);
      }
    };
    window.addEventListener("open-order-chat", handleCustomOpen);

    return () => {
      window.removeEventListener("open-order-chat", handleCustomOpen);
    };
  }, [orderGroups, searchParams]);

  // 2. Fetch Messages for selected order (channel=CLIENT)
  const fetchMessages = async (orderNumber: string, isInitial = false) => {
    try {
      if (isInitial) {
        setLoadingMessages(true);
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/progress?channel=CLIENT`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            return data || [];
          }
          return prev;
        });
        if (data && data.length > 0) {
          const maxId = Math.max(...data.map((m: any) => m.id || 0));
          if (maxId > lastMarkedMsgIdRef.current) {
            lastMarkedMsgIdRef.current = maxId;
            markOrderChatRead(orderNumber, maxId);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching order messages:", err);
    } finally {
      if (isInitial) {
        setLoadingMessages(false);
      }
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    if (!selectedOrderGroup || refreshing) return;
    setRefreshing(true);
    fetchMessages(selectedOrderGroup.orderNumber, false);
  };

  useEffect(() => {
    if (!selectedOrderGroup) return;
    lastMarkedMsgIdRef.current = 0;
    fetchMessages(selectedOrderGroup.orderNumber, true);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchMessages(selectedOrderGroup.orderNumber, false);
      }
    }, 12000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchMessages(selectedOrderGroup.orderNumber, false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selectedOrderGroup]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  // 3. Send Message / Upload Document
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || !selectedOrderGroup || sending) return;

    const messageText = inputText.trim();
    const fileToUpload = selectedFile;
    const quoteToAttach = quotedMessage;

    // Immediate optimistic clearing
    setInputText("");
    setSelectedFile(null);
    setQuotedMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Optimistic message entry
    const tempId = Date.now();
    const optimisticMsg = {
      id: tempId,
      order_number: selectedOrderGroup.orderNumber,
      message: messageText || (fileToUpload ? `Uploaded document: ${fileToUpload.name}` : ""),
      channel: "CLIENT",
      attachment_url: fileToUpload ? "uploading..." : null,
      attachment_name: fileToUpload ? fileToUpload.name : null,
      quoted_message_id: quoteToAttach?.id || null,
      quoted_message_text: quoteToAttach
        ? quoteToAttach.message || quoteToAttach.attachment_name || "Attachment"
        : null,
      quoted_sender_name: quoteToAttach
        ? quoteToAttach.sender_name || (quoteToAttach.is_client ? "Client" : "Consultant")
        : null,
      created_at: new Date().toISOString(),
      sender_name: clientProfile?.contact_person || clientProfile?.email || "You (Client)",
      sender_role: "CLIENT",
      is_client: true,
      pending: true
    };

    setMessages(prev => [...prev, optimisticMsg]);

    try {
      setSending(true);

      if (fileToUpload) {
        // Multipart upload endpoint: /upload-attachment
        const formData = new FormData();
        formData.append("file", fileToUpload);
        if (messageText) {
          formData.append("message", messageText);
        }
        if (quoteToAttach) {
          if (quoteToAttach.id) formData.append("quoted_message_id", String(quoteToAttach.id));
          if (quoteToAttach.message || quoteToAttach.attachment_name) {
            formData.append("quoted_message_text", quoteToAttach.message || quoteToAttach.attachment_name || "Attachment");
          }
          if (quoteToAttach.sender_name || quoteToAttach.is_client) {
            formData.append("quoted_sender_name", quoteToAttach.sender_name || (quoteToAttach.is_client ? "Client" : "Consultant"));
          }
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.orderNumber}/upload-attachment`, {
      credentials: "include",
            method: "POST",
            body: formData
          }
        );

        if (res.ok) {
          const savedMsg = await res.json();
          setMessages(prev =>
            prev.map(m => (m.id === tempId ? savedMsg : m))
          );
          toast.success("Document uploaded and securely delivered to your consulting team!");
        } else {
          const err = await res.json();
          toast.error(err.detail || "Failed to upload document");
          setMessages(prev => prev.filter(m => m.id !== tempId));
          setInputText(messageText);
          setSelectedFile(fileToUpload);
          setQuotedMessage(quoteToAttach);
        }
      } else {
        // Plain text message endpoint
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${selectedOrderGroup.orderNumber}/progress`, {
      credentials: "include",
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              message: messageText,
              channel: "CLIENT",
              quoted_message_id: quoteToAttach?.id || undefined,
              quoted_message_text: quoteToAttach
                ? quoteToAttach.message || quoteToAttach.attachment_name || "Attachment"
                : undefined,
              quoted_sender_name: quoteToAttach
                ? quoteToAttach.sender_name || (quoteToAttach.is_client ? "Client" : "Consultant")
                : undefined
            })
          }
        );

        if (res.ok) {
          const savedMsg = await res.json();
          setMessages(prev =>
            prev.map(m => (m.id === tempId ? savedMsg : m))
          );
        } else {
          const err = await res.json();
          toast.error(err.detail || "Failed to deliver message");
          setMessages(prev => prev.filter(m => m.id !== tempId));
          setInputText(messageText);
          setQuotedMessage(quoteToAttach);
        }
      }
    } catch (err) {
      console.error("Error posting order message:", err);
      toast.error("Network error delivering message");
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(messageText);
      setSelectedFile(fileToUpload);
      setQuotedMessage(quoteToAttach);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  // Filtered order groups
  const filteredOrderGroups = orderGroups.filter(g => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      g.orderNumber.toLowerCase().includes(term) ||
      g.items.some((it: any) => (it.job_title || "").toLowerCase().includes(term)) ||
      g.consultants.some((c: any) => (c.name || "").toLowerCase().includes(term));

    if (!matchesSearch) return false;

    const isCompleted = ["COMPLETED", "HARD_COPY_DELIVERED"].includes(g.status);
    if (statusFilter === "ACTIVE") return !isCompleted;
    if (statusFilter === "COMPLETED") return isCompleted;
    return true;
  });

  const primaryConsultant = selectedOrderGroup?.consultants?.[0];
  const currentStatus = selectedOrderGroup
    ? STATUS_CONFIG[selectedOrderGroup.status] || {
        label: selectedOrderGroup.status,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        step: 2
      }
    : null;

  return (
    <div className="animate-in fade-in duration-500">
      {/* Main Unified Workspace Card */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-10.5rem)] min-h-[580px] rounded-2xl border border-border/40 overflow-hidden bg-background/50 backdrop-blur-xl shadow-xl">
        {/* ============================================================ */}
        {/* LEFT COLUMN: ACTIVE ORDERS DIRECTORY                         */}
        {/* ============================================================ */}
        <div className="w-full md:w-72 lg:w-80 shrink-0 border-r border-border/40 flex flex-col h-full bg-muted/20 overflow-hidden">
          {/* Search and Filters */}
          <div className="p-3.5 border-b border-border/40 bg-muted/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-emerald-500" /> Orders ({filteredOrderGroups.length})
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search orders, services..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-8.5 rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
              />
            </div>

            {/* Quick Status Tab Filters */}
            <div className="flex items-center p-0.5 bg-muted/60 rounded-xl border border-border/40 text-[11px]">
              {(["ALL", "ACTIVE", "COMPLETED"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`flex-1 py-1 rounded-lg font-bold transition-all ${
                    statusFilter === tab
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "ALL" ? "All" : tab === "ACTIVE" ? "Active" : "Done"}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List Stream */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {loadingOrders ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : filteredOrderGroups.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 text-emerald-500/30" />
                <p className="text-xs font-bold text-foreground">No Orders Found</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Orders for your entity will appear here.
                </p>
              </div>
            ) : (
              filteredOrderGroups.map(group => {
                const isSelected = selectedOrderGroup?.orderNumber === group.orderNumber;
                const statusConfig = STATUS_CONFIG[group.status] || {
                  label: group.status,
                  color: "text-emerald-600 dark:text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/20",
                  step: 1
                };
                const assigned = group.consultants[0];

                return (
                  <button
                    key={group.orderNumber}
                    id={`client-order-item-${group.orderNumber}`}
                    onClick={() => setSelectedOrderGroup(group)}
                    className={`w-full text-left p-3 rounded-xl transition-all relative ${
                      isSelected
                        ? "bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 shadow-xs"
                        : "hover:bg-muted/40 border border-transparent"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    )}

                    <div className="flex items-center justify-between gap-1.5 mb-1 pl-1">
                      <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-[11px] px-2 py-0.5 rounded-md">
                        {group.orderNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} text-[9px] px-1.5 py-0 font-bold rounded-full`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <h4 className="text-xs font-bold text-foreground line-clamp-1 pl-1">
                      {group.primaryOrder.job_title || "Consulting Service"}
                    </h4>

                    {/* Consultant Footer Bar */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/30 text-[10px] pl-1">
                      {assigned ? (
                        <div className="flex items-center gap-1.5 truncate">
                          {assigned.profile_photo ? (
                            <img
                              src={resolveImageUrl(assigned.profile_photo)}
                              alt={assigned.name}
                              className="h-4 w-4 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[8px] shrink-0">
                              {(assigned.name || "C")[0]}
                            </div>
                          )}
                          <span className="truncate text-foreground font-medium">{assigned.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Consultant pending</span>
                      )}

                      <span className="text-muted-foreground shrink-0">
                        {group.items.length} {group.items.length === 1 ? "Item" : "Items"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* CENTER COLUMN: MAIN CHAT CANVAS & TIMELINE TRACKER           */}
        {/* ============================================================ */}
        <div className="flex-1 min-w-0 flex flex-col h-full bg-background/30 overflow-hidden transition-all">
          {selectedOrderGroup ? (
            <>
              {/* Header Bar */}
              <div className="px-5 sm:px-6 py-3 border-b border-border/40 bg-background/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Package className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2 py-0.5 rounded-md">
                        {selectedOrderGroup.orderNumber}
                      </span>
                      {currentStatus && (
                        <Badge
                          variant="outline"
                          className={`${currentStatus.bg} ${currentStatus.color} ${currentStatus.border} text-[10px] font-bold px-2 py-0.5 rounded-full`}
                        >
                          {currentStatus.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold truncate mt-0.5">
                      {selectedOrderGroup.primaryOrder.job_title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Consultant Card */}
                  {primaryConsultant && (
                    <div className="hidden sm:flex items-center gap-2 bg-background/80 border border-border/40 rounded-xl px-2.5 py-1 shadow-2xs">
                      {primaryConsultant.profile_photo ? (
                        <img
                          src={resolveImageUrl(primaryConsultant.profile_photo)}
                          alt={primaryConsultant.name}
                          className="h-6 w-6 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {(primaryConsultant.name || "C")[0]}
                        </div>
                      )}
                      <div className="text-left leading-tight">
                        <span className="text-xs font-bold text-foreground block truncate max-w-[120px]">
                          {primaryConsultant.name}
                        </span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                          Consultant
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleManualRefresh}
                    title="Refresh Messages"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                    disabled={refreshing}
                  >
                    <RotateCw className={`h-4 w-4 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRightPanel(!showRightPanel)}
                    title={showRightPanel ? "Hide Order Info" : "Show Order Info"}
                    className="h-8 px-2.5 text-xs font-semibold gap-1 hidden lg:flex rounded-xl border-border/50"
                  >
                    {showRightPanel ? (
                      <>
                        <PanelRightClose className="h-3.5 w-3.5 text-emerald-500" /> Hide Details
                      </>
                    ) : (
                      <>
                        <PanelRightOpen className="h-3.5 w-3.5 text-emerald-500" /> Order Details
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Lifecycle Progress Stepper Bar */}
              <div className="px-5 sm:px-6 py-2.5 border-b border-border/30 bg-muted/20 flex items-center justify-between text-xs overflow-x-auto gap-4">
                {ORDER_STAGES.map((stg, i) => {
                  const currentStep = currentStatus?.step || 1;
                  const isDone = currentStep > stg.id;
                  const isCurrent = currentStep === stg.id;

                  return (
                    <div key={stg.id} className="flex items-center gap-2 shrink-0">
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          isDone
                            ? "bg-emerald-600 text-white shadow-xs"
                            : isCurrent
                            ? "bg-emerald-500 text-white ring-2 ring-emerald-500/30 shadow-xs"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isDone ? <Check className="h-3 w-3" /> : stg.id}
                      </div>
                      <span
                        className={`text-[11px] font-semibold ${
                          isCurrent
                            ? "text-foreground font-bold"
                            : isDone
                            ? "text-foreground/80 font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stg.name}
                      </span>
                      {i < ORDER_STAGES.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-muted-foreground/40 mx-1" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Message Stream */}
              <div
                ref={messagesContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-background/20 overscroll-contain"
              >
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 text-emerald-500/30 mb-3" />
                    <h4 className="text-base font-bold text-foreground">
                      Start Consultation Thread
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-md mt-1 leading-relaxed">
                      Consult directly with your assigned consulting team on documentation requirements, review deliverables, or request real-time status updates for order{" "}
                      <span className="font-mono font-bold text-foreground">
                        {selectedOrderGroup.orderNumber}
                      </span>.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx, arr) => {
                    const isSystem = isSystemMessage(msg);
                    const isSelf = msg.is_client || (msg.sender_role || "").toUpperCase() === "CLIENT";

                    if (isSystem) {
                      return (
                        <div key={msg.id || idx} className="flex justify-center my-3 px-2">
                          <div className="bg-muted/70 dark:bg-zinc-900/80 border border-border/80 dark:border-zinc-800 rounded-full px-3.5 py-1.5 text-xs text-muted-foreground dark:text-zinc-400 flex items-center gap-2 shadow-2xs backdrop-blur-md max-w-[90%] text-center">
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
                    const isPrevSelf = prevMsg ? (prevMsg.is_client || (prevMsg.sender_role || "").toUpperCase() === "CLIENT") : null;
                    const isSameSenderAsPrev = !isSystemMessage(prevMsg) && !!prevMsg && (
                      (Boolean(msg.user_id || msg.sender_id) && (msg.user_id || msg.sender_id) === (prevMsg.user_id || prevMsg.sender_id)) ||
                      (isSelf === isPrevSelf && Boolean(msg.sender_name) && msg.sender_name === prevMsg.sender_name)
                    );

                    const isEditing = editingMessageId === msg.id;
                    const isDeleting = confirmDeleteId === msg.id;
                    const canModify = isSelf;
                    const emojiOnly = isEmojiOnlyText(msg.message) && !msg.quoted_message_text && !msg.attachment_name && (!msg.attachment_url || msg.attachment_url === "uploading...");

                    return (
                      <div
                        key={msg.id || idx}
                        className={`group flex flex-col ${isSelf ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%] ${
                          isSelf ? "ml-auto" : "mr-auto"
                        } ${isSameSenderAsPrev ? "mt-1" : "mt-3.5"}`}
                      >
                        {!isSameSenderAsPrev && (
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            {isSelf ? (
                              <span className="text-[11px] font-bold text-foreground">
                                You (Client)
                              </span>
                            ) : (
                              <>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-emerald-500/20 rounded-full">
                                  Consultant
                                </Badge>
                                <span className="text-[11px] font-bold text-foreground">
                                  {msg.sender_name || "Consultant"}
                                </span>
                                {msg.sender_role && msg.sender_role !== "Milestone" && msg.sender_role !== "SYSTEM" && msg.sender_role.toUpperCase() !== "CLIENT" && (
                                  <span className="text-[10px] text-muted-foreground font-normal">
                                    ({msg.sender_role})
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {isEditing ? (
                          <div className="w-full space-y-2 p-2.5 rounded-xl bg-background border border-emerald-500/40 shadow-md text-foreground">
                            <textarea
                              value={editingMessageText}
                              onChange={e => setEditingMessageText(e.target.value)}
                              className="w-full text-xs sm:text-[13px] bg-muted/40 border border-border rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[60px] text-foreground resize-y"
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
                                onClick={() => handleSaveEdit(msg.id)}
                                disabled={!editingMessageText.trim() || savingEdit}
                                className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
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
                                onClick={() => handleDeleteMessage(msg.id)}
                                disabled={deletingMessageId === msg.id}
                                className="h-6.5 text-[11px] px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1"
                              >
                                {deletingMessageId === msg.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                Delete
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className={`flex flex-col max-w-full ${isSelf ? "self-end" : "self-start"}`}>
                            <div className="flex items-center gap-1.5 max-w-full">
                              {/* For outgoing (client) messages, show actions & WhatsApp reaction trigger on left */}
                              {isSelf && (
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
                                    onClick={() => handleQuoteMessage(msg)}
                                    className="p-1 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                                    title="Quote / Reply"
                                  >
                                    <Reply className="h-3 w-3" />
                                  </button>
                                  <WhatsAppReactionHoverBar
                                    onToggleReaction={emoji => handleToggleReaction(msg.id, emoji)}
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
                                  isSelf
                                    ? "bg-emerald-600 text-white rounded-tr-sm shadow-sm shadow-emerald-600/20"
                                    : "bg-background/80 dark:bg-zinc-900/80 text-foreground border border-border/50 rounded-tl-sm backdrop-blur-md"
                                }`}
                              >
                                {/* Quoted Message Header Preview */}
                                {(msg.quoted_message_text || msg.quoted_sender_name) && (
                                  <div
                                    className={`mb-2 p-2 rounded-lg border-l-2 text-xs flex flex-col gap-0.5 ${
                                      isSelf
                                        ? "bg-black/20 border-white/80 text-white/90"
                                        : "bg-muted/50 border-emerald-500 text-muted-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1 font-semibold text-[11px] opacity-90">
                                      <Quote className="h-3 w-3 shrink-0" />
                                      <span>{msg.quoted_sender_name || "Original Message"}</span>
                                    </div>
                                    <div className="text-[11px] truncate line-clamp-1 italic">
                                      {msg.quoted_message_text}
                                    </div>
                                  </div>
                                )}

                                <div>{renderMessageContent(msg.message)}</div>

                                {/* Client Uploaded Attachment Receipt */}
                                {(msg.attachment_name || (msg.attachment_url && msg.attachment_url !== "uploading...")) && (
                                  <div
                                    className={`mt-2 flex items-center gap-2.5 p-2 rounded-xl border text-xs shadow-2xs backdrop-blur-xs ${
                                      isSelf
                                        ? "bg-white/10 dark:bg-black/25 border-white/20 text-white"
                                        : "bg-background dark:bg-zinc-950/70 border-border/50 text-foreground"
                                    }`}
                                  >
                                    <div
                                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${
                                        isSelf
                                          ? "bg-white/20 text-white border-white/30"
                                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                      }`}
                                    >
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <span className="font-bold truncate block text-[11px] sm:text-xs">
                                        {msg.attachment_name || "Shared Document"}
                                      </span>
                                      <span
                                        className={`text-[9px] sm:text-[10px] flex items-center gap-1 mt-0.5 ${
                                          isSelf ? "text-white/80" : "text-muted-foreground"
                                        }`}
                                      >
                                        <Lock className="h-2.5 w-2.5 shrink-0 text-emerald-400" />
                                        Stored in Company Vault (Order #{selectedOrderGroup.orderNumber})
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* For incoming (consultant) messages, show actions & WhatsApp reaction trigger on right */}
                              {!isSelf && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <WhatsAppReactionHoverBar
                                    onToggleReaction={emoji => handleToggleReaction(msg.id, emoji)}
                                    align="start"
                                    side="top"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleQuoteMessage(msg)}
                                    className="p-1 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                                    title="Quote / Reply"
                                  >
                                    <Reply className="h-3 w-3" />
                                  </button>
                                </div>
                              )}

                              {/* Outside on the right side, vertically centered in the middle */}
                              <div className="flex items-center justify-center shrink-0 self-center select-none">
                                <SeenReceiptsIndicator
                                  seenBy={msg.seen_by}
                                  isSelf={isSelf}
                                  sentAt={msg.created_at}
                                />
                              </div>
                            </div>

                            {/* WhatsApp style reaction badges at the bottom of the message */}
                            <ChatMessageReactions
                              reactions={msg.reactions}
                              onToggleReaction={emoji => handleToggleReaction(msg.id, emoji)}
                              isSelf={isSelf}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Dock */}
              <div className="p-3.5 sm:p-4 border-t border-border/40 bg-background/80 backdrop-blur-md space-y-2">
                {/* Quoted Message Preview Banner */}
                {quotedMessage && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/60 border-l-4 border-emerald-500 text-xs shadow-xs animate-in fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <Quote className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground truncate block text-xs">
                          Replying to {quotedMessage.sender_name || (quotedMessage.is_client ? "Client" : "Consultant")}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {quotedMessage.message || quotedMessage.attachment_name || "Attachment"}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuotedMessage(null)}
                      className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Cancel Quote"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Selected File Indicator Chip */}
                {selectedFile && (
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs shadow-xs animate-in fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-foreground truncate block text-xs">
                          {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Storing in Vault → {selectedOrderGroup.orderNumber}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="h-5 w-5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />

                  {/* Attachment Trigger Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach & Upload Document"
                    className={`h-[46px] w-[46px] rounded-xl shrink-0 transition-colors ${
                      selectedFile
                        ? "border-emerald-500 text-emerald-600 bg-emerald-500/10 shadow-xs"
                        : "border-border/50 bg-background/70 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  {/* Insert Emoji Button on Left */}
                  <ChatEmojiPicker
                    onSelectEmoji={emoji => {
                      setInputText(prev => prev + emoji);
                      textareaRef.current?.focus();
                    }}
                    side="top"
                    align="start"
                    trigger={
                      <button
                        type="button"
                        className="h-[46px] w-[46px] rounded-xl border border-border/50 bg-background/70 text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors focus:outline-none"
                        title="Insert Emoji"
                      >
                        <Smile className="h-4 w-4" />
                      </button>
                    }
                  />

                  <textarea
                    ref={textareaRef}
                    placeholder={
                      selectedFile
                        ? `Add an optional note with ${selectedFile.name} (Press Enter to send)...`
                        : `Message your consultant regarding ${selectedOrderGroup.orderNumber} (Press Enter to send)...`
                    }
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={1}
                    className="flex-1 text-xs sm:text-sm bg-background/70 border border-border/50 rounded-xl px-3.5 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 resize-none placeholder:text-muted-foreground min-h-[46px] max-h-32 leading-relaxed"
                  />

                  <Button
                    type="submit"
                    disabled={(!inputText.trim() && !selectedFile) || sending}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-bold px-4 h-[46px] shrink-0 rounded-xl shadow-md"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>{sending ? "Sending..." : "Send"}</span>
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <Package className="h-12 w-12 text-emerald-500/30 mb-3" />
              <h3 className="text-base font-bold text-foreground">Select an Order</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Choose an active order from the left sidebar to start or continue your consultation.
              </p>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: ORDER INTELLIGENCE & WORKSPACE DRAWER          */}
        {/* ============================================================ */}
        {showRightPanel && selectedOrderGroup && (
          <div className="w-72 lg:w-80 shrink-0 border-l border-border/40 hidden lg:flex flex-col h-full bg-muted/20 overflow-y-auto p-4 space-y-4">
            {/* Order Overview Card */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Order Overview
              </span>
              <div className="p-3.5 rounded-2xl border border-border/40 bg-background/50 backdrop-blur-md space-y-2.5 text-xs shadow-2xs">
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold block">Service Title</span>
                  <span className="font-bold text-foreground block text-xs mt-0.5">
                    {selectedOrderGroup.primaryOrder.job_title}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold block">Order Reference</span>
                  <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2 py-0.5 rounded-md inline-block mt-0.5">
                    {selectedOrderGroup.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] uppercase font-bold block">Status</span>
                  <Badge variant="outline" className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedOrderGroup.status}
                  </Badge>
                </div>
                {selectedOrderGroup.primaryOrder.total_amount > 0 && (
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total Amount</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs block mt-0.5">
                      IDR {Number(selectedOrderGroup.primaryOrder.total_amount).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Consultant Contact Card */}
            {primaryConsultant && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Assigned Consultant
                </span>
                <div className="p-3.5 rounded-2xl border border-border/40 bg-background/50 backdrop-blur-md space-y-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    {primaryConsultant.profile_photo ? (
                      <img
                        src={resolveImageUrl(primaryConsultant.profile_photo)}
                        alt={primaryConsultant.name}
                        className="h-9 w-9 rounded-xl object-cover border border-emerald-500/20"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                        {(primaryConsultant.name || "C")[0]}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-foreground text-xs block">
                        {primaryConsultant.name}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                        {primaryConsultant.job_title || "Lead Consultant"}
                      </span>
                    </div>
                  </div>

                  {primaryConsultant.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full text-xs font-bold gap-1.5 h-8 rounded-xl shadow-xs"
                    >
                      <a
                        href={`https://wa.me/${primaryConsultant.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Phone className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp Direct
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions Links */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Quick Shortcuts
              </span>
              <div className="space-y-1.5 text-xs">
                <Button variant="ghost" asChild className="w-full justify-start text-xs h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 font-semibold">
                  <Link href={`/client/orders?order=${selectedOrderGroup.orderNumber}`}>
                    <Package className="h-3.5 w-3.5 mr-2 text-emerald-500" /> View Order Details
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="w-full justify-start text-xs h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 font-semibold">
                  <Link href="/client/documents">
                    <FileText className="h-3.5 w-3.5 mr-2 text-emerald-500" /> Shared Documents
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
