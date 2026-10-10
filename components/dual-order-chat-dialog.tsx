"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Send,
  Loader2,
  X,
  FileText,
  Eye,
  Check,
  Trash2,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExcelPreview } from "@/components/excel-preview";

import {
  TopBar,
  OrderDetailsPanel,
  ChatPanel,
  ChatMessage,
  TaggableUser,
  OrderSummaryData,
  formatFileSize,
  formatExternalTeamName,
  isSystemMessage
} from "./order-chat";

interface DualOrderChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string | null;
  orderTitle?: string;
  companyName?: string;
  clientName?: string;
  orderStatus?: string;
}

const deduplicateMessages = (msgs: any[]): ChatMessage[] => {
  if (!Array.isArray(msgs)) return [];
  const map = new Map<string | number, any>();
  for (const m of msgs) {
    if (!m) continue;
    const key =
      m.id !== undefined && m.id !== null
        ? `id-${m.id}`
        : `msg-${m.created_at || ""}-${m.message || ""}`;
    map.set(key, m);
  }
  return Array.from(map.values());
};

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
  const [clientMessages, setClientMessages] = useState<ChatMessage[]>([]);
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [loadingClient, setLoadingClient] = useState(false);
  const [loadingInternal, setLoadingInternal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingToDropbox, setSavingToDropbox] = useState(false);
  const [downloadingTranscript, setDownloadingTranscript] = useState(false);

  // Order Details Summary State
  const [orderSummary, setOrderSummary] = useState<OrderSummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  // Mobile channel tab selector (<1024px)
  const [activeMobileTab, setActiveMobileTab] = useState<"CLIENT" | "INTERNAL">("INTERNAL");

  // Document Preview State (Lightbox)
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Composer Inputs & States
  const [clientInput, setClientInput] = useState("");
  const [internalInput, setInternalInput] = useState("");
  const [sendingClient, setSendingClient] = useState(false);
  const [sendingInternal, setSendingInternal] = useState(false);

  // Quote / Reply State
  const [quotedClientMessage, setQuotedClientMessage] = useState<ChatMessage | null>(null);
  const [quotedInternalMessage, setQuotedInternalMessage] = useState<ChatMessage | null>(null);

  // Input refs
  const clientInputRef = useRef<HTMLTextAreaElement | null>(null);
  const internalInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Attachment States
  const [clientAttachment, setClientAttachment] = useState<File | null>(null);
  const [clientAttachmentPreview, setClientAttachmentPreview] = useState<string | null>(null);

  const [internalAttachment, setInternalAttachment] = useState<File | null>(null);
  const [internalAttachmentPreview, setInternalAttachmentPreview] = useState<string | null>(null);

  // Client Confirmation Dialog State
  const [isConfirmClientOpen, setIsConfirmClientOpen] = useState(false);
  const [pendingClientMessage, setPendingClientMessage] = useState("");

  // Taggable users for @mentions
  const [taggableUsers, setTaggableUsers] = useState<TaggableUser[]>([]);

  // Current logged in user (for permission check on edit/delete)
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Edit / Delete State
  const [editingMessage, setEditingMessage] = useState<{
    msg: ChatMessage;
    channel: "CLIENT" | "INTERNAL";
  } | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    msgId: number;
    channel: "CLIENT" | "INTERNAL";
  } | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);

  const lastMarkedClientMsgIdRef = useRef<number>(0);
  const lastMarkedInternalMsgIdRef = useRef<number>(0);

  // Client attachment handlers
  const handleClientAttachmentSelect = (file: File) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File exceeds 50MB maximum size limit.");
      return;
    }
    setClientAttachment(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setClientAttachmentPreview(url);
    } else {
      setClientAttachmentPreview(null);
    }
    clientInputRef.current?.focus();
  };

  const handleRemoveClientAttachment = () => {
    if (clientAttachmentPreview) {
      URL.revokeObjectURL(clientAttachmentPreview);
    }
    setClientAttachment(null);
    setClientAttachmentPreview(null);
  };

  // Internal attachment handlers
  const handleInternalAttachmentSelect = (file: File) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File exceeds 50MB maximum size limit.");
      return;
    }
    setInternalAttachment(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setInternalAttachmentPreview(url);
    } else {
      setInternalAttachmentPreview(null);
    }
    internalInputRef.current?.focus();
  };

  const handleRemoveInternalAttachment = () => {
    if (internalAttachmentPreview) {
      URL.revokeObjectURL(internalAttachmentPreview);
    }
    setInternalAttachment(null);
    setInternalAttachmentPreview(null);
  };

  const handlePreviewAttachment = (msg: any) => {
    if (!msg.attachment_url || msg.attachment_url === "uploading...") return;
    setPreviewAttachment(msg);
    const url = `/api-proxy/api/clients/orders/${orderNumber}/attachments/preview?path=${encodeURIComponent(
      msg.attachment_url
    )}`;
    setPreviewUrl(url);
  };

  const roleName = (currentUser?.role?.name || "").trim().toUpperCase();
  const deptName = (currentUser?.department?.name || "").trim().toUpperCase();

  const isSuperAdmin = Boolean(
    currentUser?.is_super_admin ||
    currentUser?.role_id === 1 ||
    currentUser?.email === "admin@mcs-consulting.com" ||
    ["SUPER ADMIN", "SUPERADMIN", "SUPER_ADMIN", "SYSTEM ADMIN"].includes(roleName)
  );

  const isUserAdmin = Boolean(
    isSuperAdmin ||
    roleName === "ADMIN" ||
    roleName === "HR" ||
    roleName.includes("ADMIN") ||
    roleName.includes("HR") ||
    roleName.includes("DIRECTOR") ||
    deptName.includes("HR") ||
    deptName.includes("ADMIN")
  );

  const handleSaveToDropbox = async () => {
    if (!isUserAdmin) {
      toast.error("Only administrators can archive chats to Dropbox.");
      return;
    }
    if (!orderNumber || savingToDropbox) return;
    try {
      setSavingToDropbox(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/export-chat-dropbox`,
        {
          method: "POST",
          credentials: "include"
        }
      );
      const data = await res.json();
      if (res.ok && data.status === "success") {
        toast.success(
          <div className="space-y-0.5">
            <p className="font-semibold text-xs">Chat Archived to Dropbox!</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">{data.path}</p>
          </div>
        );
      } else {
        toast.error(data.detail || data.error || "Failed to save chat to Dropbox");
      }
    } catch (err) {
      console.error("Error saving to Dropbox:", err);
      toast.error("Network error saving chat to Dropbox");
    } finally {
      setSavingToDropbox(false);
    }
  };

  const handleDownloadTranscript = async () => {
    if (!isUserAdmin) {
      toast.error("Only administrators can download chat transcripts.");
      return;
    }
    if (!orderNumber || downloadingTranscript) return;
    try {
      setDownloadingTranscript(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/download-chat-transcript`,
        {
          method: "GET",
          credentials: "include"
        }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Chat_History_${orderNumber}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Chat transcript downloaded!");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to download transcript");
      }
    } catch (err) {
      console.error("Error downloading transcript:", err);
      toast.error("Error downloading transcript");
    } finally {
      setDownloadingTranscript(false);
    }
  };

  // Mark chat as read
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

  // Reaction toggle
  const handleToggleReaction = async (msgId: number, emoji: string, isInternal: boolean) => {
    if (!orderNumber || !msgId || !emoji) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(
          orderNumber
        )}/progress/${msgId}/reactions`,
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
          const syncUpdater = (prevMsgs: ChatMessage[]) =>
            prevMsgs.map((m) => (m.id === msgId ? { ...m, reactions: data.reactions } : m));
          if (isInternal) setInternalMessages(syncUpdater);
          else setClientMessages(syncUpdater);
        }
      }
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  };

  // Fetch Order Summary
  const fetchOrderSummary = async (isInitial = false) => {
    if (!orderNumber) return;
    if (isInitial) setLoadingSummary(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(
          orderNumber
        )}/summary`,
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

  // Fetch Client Messages
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
        setClientMessages(deduplicateMessages(data || []));
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

  // Fetch Internal Messages
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
        setInternalMessages(deduplicateMessages(data || []));
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

  // Fetch Taggable Users
  const fetchTaggableUsers = async () => {
    if (!orderNumber) return;
    try {
      const [tagRes, teamRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/taggable-users`, {
          credentials: "include"
        }).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, {
          credentials: "include"
        }).catch(() => null)
      ]);

      const employees = tagRes && tagRes.ok ? await tagRes.json().catch(() => []) : [];
      const teams = teamRes && teamRes.ok ? await teamRes.json().catch(() => []) : [];

      const formattedEmployees: TaggableUser[] = (employees || []).map((e: any) => ({
        id: e.id,
        type: "user",
        displayName: e.displayName || `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.email,
        job_title: e.job_title || e.position,
        avatar: e.profile_photo
      }));

      const formattedTeams: TaggableUser[] = (teams || []).map((t: any) => ({
        id: t.id,
        type: "team",
        displayName: t.name,
        subtitle: "Team channel"
      }));

      const orderTeamItem: TaggableUser = {
        id: "order_team_mention",
        type: "order_team",
        displayName: "Team",
        subtitle: "Assigned Consultants & Reviewers"
      };

      setTaggableUsers([orderTeamItem, ...formattedEmployees, ...formattedTeams]);
    } catch (err) {
      console.error("Error fetching taggable users:", err);
    }
  };

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchClientMessages(false),
      fetchInternalMessages(false),
      fetchOrderSummary(false)
    ]);
    setRefreshing(false);
  };

  // Fetch Current User
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

  // Lock background scroll
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

  // Initialize data & periodic polling
  useEffect(() => {
    if (isOpen && orderNumber) {
      lastMarkedClientMsgIdRef.current = 0;
      lastMarkedInternalMsgIdRef.current = 0;
      fetchOrderSummary(true);
      fetchClientMessages(true);
      fetchInternalMessages(true);
      fetchTaggableUsers();

      const interval = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState === "visible") {
          fetchClientMessages(false);
          fetchInternalMessages(false);
        }
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isOpen, orderNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewAttachment) {
          setPreviewAttachment(null);
          setPreviewUrl(null);
        } else if (isConfirmClientOpen) {
          setIsConfirmClientOpen(false);
        } else if (editingMessage) {
          setEditingMessage(null);
        } else if (deleteConfirm) {
          setDeleteConfirm(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, isConfirmClientOpen, previewAttachment, editingMessage, deleteConfirm, onClose]);

  // Permission check for edit / delete
  const canModifyMessage = (msg: ChatMessage) => {
    if (!msg || !msg.id || isSystemMessage(msg)) return false;
    if (!currentUser) return false;
    const isAuthor = msg.user_id && msg.user_id === currentUser.id;
    return Boolean(isAuthor || isUserAdmin);
  };

  // Edit Message Handlers
  const handleStartEdit = (msg: ChatMessage, channel: "CLIENT" | "INTERNAL") => {
    if (!canModifyMessage(msg)) {
      toast.error("You do not have permission to edit this message");
      return;
    }
    setEditingMessage({ msg, channel });
    setEditingMessageText(msg.message || "");
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !orderNumber || !editingMessageText.trim() || savingEdit) return;
    const { msg, channel } = editingMessage;

    try {
      setSavingEdit(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(
          orderNumber
        )}/progress/${msg.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: editingMessageText.trim() })
        }
      );

      if (res.ok) {
        const updated = await res.json();
        if (channel === "CLIENT") {
          setClientMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
        } else {
          setInternalMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
        }
        setEditingMessage(null);
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

  // Delete Message Handlers
  const handleConfirmDelete = async () => {
    if (!deleteConfirm || !orderNumber || deletingMessageId) return;
    const { msgId, channel } = deleteConfirm;

    try {
      setDeletingMessageId(msgId);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${encodeURIComponent(
          orderNumber
        )}/progress/${msgId}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const deletedRecord =
          data && data.id
            ? data
            : {
                is_deleted: true,
                message: "This message was deleted",
                attachment_url: null,
                attachment_name: null,
                reactions: []
              };

        if (channel === "CLIENT") {
          setClientMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, ...deletedRecord, is_deleted: true } : m))
          );
        } else {
          setInternalMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, ...deletedRecord, is_deleted: true } : m))
          );
        }
        setDeleteConfirm(null);
        toast.success("Message deleted");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "Failed to delete message");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      toast.error("Error deleting message");
    } finally {
      setDeletingMessageId(null);
    }
  };

  // Client Send Trigger (Opens Confirmation Modal)
  const handleClientSendClick = () => {
    if (!clientInput.trim() && !clientAttachment) return;
    setPendingClientMessage(clientInput.trim());
    setIsConfirmClientOpen(true);
  };

  // Confirmed Client Send
  const handleConfirmSendClientMessage = async () => {
    if ((!pendingClientMessage && !clientAttachment) || !orderNumber || sendingClient) return;
    try {
      setSendingClient(true);
      setIsConfirmClientOpen(false);

      const quotePayload = quotedClientMessage
        ? {
            quoted_message_id: quotedClientMessage.id,
            quoted_message_text:
              quotedClientMessage.message || quotedClientMessage.attachment_name || "Attachment",
            quoted_sender_name: quotedClientMessage.is_client
              ? quotedClientMessage.sender_name || "Client"
              : formatExternalTeamName(quotedClientMessage.sender_name)
          }
        : {};

      if (clientAttachment) {
        const formData = new FormData();
        formData.append("file", clientAttachment);
        if (pendingClientMessage) formData.append("message", pendingClientMessage);
        formData.append("channel", "CLIENT");
        const isSnippet =
          clientAttachment.name.startsWith("snippet_") ||
          clientAttachment.type.startsWith("image/");
        formData.append("is_snippet", isSnippet ? "true" : "false");
        if (quotePayload.quoted_message_id) {
          formData.append("quoted_message_id", String(quotePayload.quoted_message_id));
        }
        if (quotePayload.quoted_message_text) {
          formData.append("quoted_message_text", quotePayload.quoted_message_text);
        }
        if (quotePayload.quoted_sender_name) {
          formData.append("quoted_sender_name", quotePayload.quoted_sender_name);
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/upload-attachment`,
          {
            method: "POST",
            credentials: "include",
            body: formData
          }
        );
        if (res.ok) {
          const newMsg = await res.json();
          setClientMessages((prev) => deduplicateMessages([...prev, newMsg]));
          setClientInput("");
          setPendingClientMessage("");
          setQuotedClientMessage(null);
          handleRemoveClientAttachment();
          toast.success("Attachment and message sent to Client!");
        } else {
          const err = await res.json();
          toast.error(err.detail || "Failed to upload attachment to client");
        }
      } else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/progress`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: pendingClientMessage,
              channel: "CLIENT",
              ...quotePayload
            })
          }
        );
        if (res.ok) {
          const newMsg = await res.json();
          setClientMessages((prev) => deduplicateMessages([...prev, newMsg]));
          setClientInput("");
          setPendingClientMessage("");
          setQuotedClientMessage(null);
          toast.success("Message sent to Client!");
        } else {
          const err = await res.json();
          toast.error(err.detail || "Failed to send message to client");
        }
      }
    } catch (err) {
      console.error("Error sending client message:", err);
      toast.error("Error sending message to client");
    } finally {
      setSendingClient(false);
    }
  };

  // Internal Send (Instant)
  const handleInternalSend = async () => {
    if ((!internalInput.trim() && !internalAttachment) || !orderNumber || sendingInternal) return;
    const msgToSend = internalInput.trim();
    const quotePayload = quotedInternalMessage
      ? {
          quoted_message_id: quotedInternalMessage.id,
          quoted_message_text:
            quotedInternalMessage.message ||
            quotedInternalMessage.attachment_name ||
            "Attachment",
          quoted_sender_name: quotedInternalMessage.sender_name || "Team Member"
        }
      : {};

    try {
      setSendingInternal(true);
      setInternalInput("");

      if (internalAttachment) {
        const formData = new FormData();
        formData.append("file", internalAttachment);
        if (msgToSend) formData.append("message", msgToSend);
        formData.append("channel", "INTERNAL");
        const isSnippet =
          internalAttachment.name.startsWith("snippet_") ||
          internalAttachment.type.startsWith("image/");
        formData.append("is_snippet", isSnippet ? "true" : "false");
        if (quotePayload.quoted_message_id) {
          formData.append("quoted_message_id", String(quotePayload.quoted_message_id));
        }
        if (quotePayload.quoted_message_text) {
          formData.append("quoted_message_text", quotePayload.quoted_message_text);
        }
        if (quotePayload.quoted_sender_name) {
          formData.append("quoted_sender_name", quotePayload.quoted_sender_name);
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/upload-attachment`,
          {
            method: "POST",
            credentials: "include",
            body: formData
          }
        );
        if (res.ok) {
          const newMsg = await res.json();
          setInternalMessages((prev) => deduplicateMessages([...prev, newMsg]));
          setQuotedInternalMessage(null);
          handleRemoveInternalAttachment();
          toast.success("Internal note posted!");
        } else {
          const err = await res.json();
          toast.error(err.detail || "Failed to upload internal attachment");
          setInternalInput(msgToSend);
        }
      } else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${orderNumber}/progress`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: msgToSend,
              channel: "INTERNAL",
              ...quotePayload
            })
          }
        );
        if (res.ok) {
          const newMsg = await res.json();
          setInternalMessages((prev) => deduplicateMessages([...prev, newMsg]));
          setQuotedInternalMessage(null);
        } else {
          const err = await res.json();
          toast.error(err.detail || "Failed to post internal message");
          setInternalInput(msgToSend);
        }
      }
    } catch (err) {
      console.error("Error posting internal message:", err);
      toast.error("Error posting internal message");
      setInternalInput(msgToSend);
    } finally {
      setSendingInternal(false);
    }
  };

  if (!mounted) return null;

  const currentUserName = currentUser
    ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.email
    : null;

  const content = (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="order-chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            onClick={onClose}
            className="fixed inset-0 z-[74] bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          />
        )}
        {isOpen && (
          <motion.div
            key="order-chat-sheet"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.32 }}
            className="order-chat-workspace fixed inset-0 z-[75] h-screen h-[100dvh] w-screen flex flex-col bg-[#F8F9FA] dark:bg-[#0F0F12] bg-[var(--oc-bg-app)] text-[#111827] dark:text-[#F4F4F8] text-[var(--oc-text-primary)] overflow-hidden shadow-2xl"
          >
            {/* Top Navigation Bar */}
            <TopBar
              orderNumber={orderNumber}
              companyName={orderSummary?.company?.company_name || companyName}
              clientName={orderSummary?.client?.name || clientName}
              orderStatus={orderSummary?.status || orderStatus}
              showDetails={showDetails}
              isAdmin={isUserAdmin}
              onToggleDetails={() => setShowDetails(!showDetails)}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              onSaveToDropbox={isUserAdmin ? handleSaveToDropbox : undefined}
              savingToDropbox={savingToDropbox}
              onDownloadTranscript={isUserAdmin ? handleDownloadTranscript : undefined}
              downloadingTranscript={downloadingTranscript}
              onClose={onClose}
            />

            {/* Mobile Tab Selector (< 1024px) */}
            <div className="lg:hidden flex items-center border-b border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)] shrink-0 px-2 py-1.5 gap-2">
              <button
                type="button"
                onClick={() => setActiveMobileTab("CLIENT")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeMobileTab === "CLIENT"
                    ? "bg-[var(--oc-brand-50)] text-[var(--oc-brand-700)] border border-[var(--oc-brand-200)] shadow-2xs"
                    : "text-[var(--oc-text-secondary)] hover:bg-[var(--oc-bg-subtle)]"
                }`}
              >
                <span>Client & Consultant</span>
                {clientMessages.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--oc-brand-600)] text-white">
                    {clientMessages.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveMobileTab("INTERNAL")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeMobileTab === "INTERNAL"
                    ? "bg-[var(--oc-internal-50)] text-[var(--oc-internal-700)] border border-[var(--oc-internal-200)] shadow-2xs"
                    : "text-[var(--oc-text-secondary)] hover:bg-[var(--oc-bg-subtle)]"
                }`}
              >
                <span>Internal Team</span>
                {internalMessages.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--oc-internal-600)] text-white">
                    {internalMessages.length}
                  </span>
                )}
              </button>
            </div>

            {/* 3-Column Workspace Layout */}
            <div className="flex-1 flex min-h-0 h-full overflow-hidden">
              {/* Left Column: Order Details Panel */}
              <OrderDetailsPanel
                orderSummary={orderSummary}
                loading={loadingSummary}
                orderTitle={orderTitle}
                companyName={companyName}
                clientName={clientName}
                orderStatus={orderStatus}
                isOpen={showDetails}
                clientMessages={clientMessages}
                internalMessages={internalMessages}
              />

              {/* Middle & Right: Dual Chat Columns */}
              <div className="flex-1 flex min-h-0 h-full overflow-hidden divide-x divide-zinc-200 dark:divide-zinc-800 divide-[var(--oc-border)] bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)]">
                {/* Column 2: Client & Consultant Chat */}
                <div
                  className={`flex-1 min-w-0 h-full ${
                    activeMobileTab === "CLIENT" ? "flex" : "hidden lg:flex"
                  } flex-col`}
                >
                  <ChatPanel
                    channel="CLIENT"
                    orderNumber={orderNumber}
                    orderStatus={orderSummary?.status || orderStatus}
                    title="Client & Consultant Chat"
                    description="Messages visible to client in portal"
                    unreadCount={0}
                    messages={clientMessages}
                    loading={loadingClient}
                    currentUserId={currentUser?.id}
                    currentUserName={currentUserName}
                    composerValue={clientInput}
                    onComposerChange={setClientInput}
                    onSend={handleClientSendClick}
                    sending={sendingClient}
                    quotedMessage={quotedClientMessage}
                    onCancelQuote={() => setQuotedClientMessage(null)}
                    attachment={clientAttachment}
                    attachmentPreview={clientAttachmentPreview}
                    onSelectAttachment={handleClientAttachmentSelect}
                    onRemoveAttachment={handleRemoveClientAttachment}
                    taggableUsers={taggableUsers}
                    inputRef={clientInputRef}
                    onReply={(msg) => {
                      setQuotedClientMessage(msg);
                      clientInputRef.current?.focus();
                    }}
                    onReact={(id, emoji) => handleToggleReaction(id, emoji, false)}
                    onCopy={(txt) => toast.success("Message copied to clipboard")}
                    onEdit={(msg) => handleStartEdit(msg, "CLIENT")}
                    onDelete={(id) => setDeleteConfirm({ msgId: id, channel: "CLIENT" })}
                    onOpenImagePreview={(url, name) =>
                      handlePreviewAttachment({ attachment_url: url, attachment_name: name })
                    }
                  />
                </div>

                {/* Column 3: Internal Team Chat */}
                <div
                  className={`flex-1 min-w-0 h-full ${
                    activeMobileTab === "INTERNAL" ? "flex" : "hidden lg:flex"
                  } flex-col`}
                >
                  <ChatPanel
                    channel="INTERNAL"
                    orderNumber={orderNumber}
                    orderStatus={orderSummary?.status || orderStatus}
                    title="Internal Team Chat"
                    description="Private discussion · Processing staff only"
                    unreadCount={0}
                    messages={internalMessages}
                    loading={loadingInternal}
                    currentUserId={currentUser?.id}
                    currentUserName={currentUserName}
                    composerValue={internalInput}
                    onComposerChange={setInternalInput}
                    onSend={handleInternalSend}
                    sending={sendingInternal}
                    quotedMessage={quotedInternalMessage}
                    onCancelQuote={() => setQuotedInternalMessage(null)}
                    attachment={internalAttachment}
                    attachmentPreview={internalAttachmentPreview}
                    onSelectAttachment={handleInternalAttachmentSelect}
                    onRemoveAttachment={handleRemoveInternalAttachment}
                    taggableUsers={taggableUsers}
                    inputRef={internalInputRef}
                    onReply={(msg) => {
                      setQuotedInternalMessage(msg);
                      internalInputRef.current?.focus();
                    }}
                    onReact={(id, emoji) => handleToggleReaction(id, emoji, true)}
                    onCopy={(txt) => toast.success("Note copied to clipboard")}
                    onEdit={(msg) => handleStartEdit(msg, "INTERNAL")}
                    onDelete={(id) => setDeleteConfirm({ msgId: id, channel: "INTERNAL" })}
                    onOpenImagePreview={(url, name) =>
                      handlePreviewAttachment({ attachment_url: url, attachment_name: name })
                    }
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal Before Sending to Client */}
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
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md bg-[var(--oc-bg-panel)] border border-[var(--oc-border)] rounded-2xl shadow-xl p-5 z-[90] space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--oc-border)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--oc-brand-50)] text-[var(--oc-brand-600)] border border-[var(--oc-brand-200)] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--oc-text-primary)]">
                    Send Message to Client?
                  </h3>
                  <p className="text-xs text-[var(--oc-text-tertiary)]">
                    This message will be immediately visible to the client in their portal.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {clientAttachment && (
                  <div className="p-3 rounded-xl border border-[var(--oc-brand-200)] bg-[var(--oc-brand-50)]/40 flex items-center gap-3">
                    {clientAttachmentPreview ? (
                      <img
                        src={clientAttachmentPreview}
                        alt="Preview"
                        className="w-11 h-11 object-cover rounded-lg border border-[var(--oc-brand-200)] shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-[var(--oc-brand-100)] text-[var(--oc-brand-600)] flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-semibold block truncate text-[var(--oc-text-primary)]">
                        {clientAttachment.name}
                      </span>
                      <span className="text-[11px] text-[var(--oc-text-tertiary)] block">
                        {formatFileSize(clientAttachment.size)}
                      </span>
                    </div>
                  </div>
                )}

                {pendingClientMessage ? (
                  <div className="p-3 rounded-xl border border-[var(--oc-border)] bg-[var(--oc-bg-subtle)] text-xs text-[var(--oc-text-primary)] leading-relaxed">
                    <p className="italic">&ldquo;{pendingClientMessage}&rdquo;</p>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--oc-border)]">
                <button
                  type="button"
                  onClick={() => setIsConfirmClientOpen(false)}
                  className="h-8.5 text-xs font-medium px-3.5 rounded-lg border border-[var(--oc-border)] bg-[var(--oc-bg-panel)] text-[var(--oc-text-secondary)] hover:bg-[var(--oc-bg-subtle)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendClientMessage}
                  disabled={sendingClient}
                  className="h-8.5 text-xs font-semibold px-4 rounded-lg bg-[var(--oc-brand-600)] hover:bg-[var(--oc-brand-700)] text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {sendingClient ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send to Client</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Message Modal */}
      <AnimatePresence>
        {editingMessage && (
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMessage(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-lg bg-[var(--oc-bg-panel)] border border-[var(--oc-border)] rounded-2xl shadow-xl p-5 z-[90] space-y-3"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--oc-border)]">
                <Edit2 className="w-4 h-4 text-[var(--oc-brand-600)]" />
                <h3 className="text-sm font-semibold text-[var(--oc-text-primary)]">
                  Edit Message
                </h3>
              </div>

              <textarea
                value={editingMessageText}
                onChange={(e) => setEditingMessageText(e.target.value)}
                rows={4}
                className="w-full text-sm bg-[var(--oc-bg-subtle)] border border-[var(--oc-border)] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[var(--oc-brand-500)] text-[var(--oc-text-primary)] resize-y leading-relaxed"
                placeholder="Edit message..."
                autoFocus
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--oc-border)]">
                <button
                  type="button"
                  onClick={() => setEditingMessage(null)}
                  disabled={savingEdit}
                  className="h-8.5 text-xs font-medium px-3.5 rounded-lg border border-[var(--oc-border)] bg-[var(--oc-bg-panel)] text-[var(--oc-text-secondary)] hover:bg-[var(--oc-bg-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editingMessageText.trim() || savingEdit}
                  className="h-8.5 text-xs font-semibold px-4 rounded-lg bg-[var(--oc-brand-600)] hover:bg-[var(--oc-brand-700)] text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {savingEdit ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-sm bg-[var(--oc-bg-panel)] border border-[var(--oc-border)] rounded-2xl shadow-xl p-5 z-[90] space-y-3"
            >
              <div className="flex items-center gap-2.5 pb-2 text-[var(--oc-danger-600)]">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-semibold text-[var(--oc-text-primary)]">
                  Delete Message?
                </h3>
              </div>
              <p className="text-xs text-[var(--oc-text-secondary)] leading-relaxed">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--oc-border)]">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="h-8.5 text-xs font-medium px-3.5 rounded-lg border border-[var(--oc-border)] bg-[var(--oc-bg-panel)] text-[var(--oc-text-secondary)] hover:bg-[var(--oc-bg-subtle)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={Boolean(deletingMessageId)}
                  className="h-8.5 text-xs font-semibold px-4 rounded-lg bg-[var(--oc-danger-600)] hover:bg-[var(--oc-danger-700)] text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {deletingMessageId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attachment Preview Modal (Preview Only - No Download) */}
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
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-4xl h-[85vh] bg-[var(--oc-bg-panel)] border border-[var(--oc-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[100]"
            >
              {/* Preview Header */}
              <div className="px-5 py-3 border-b border-[var(--oc-border)] bg-[var(--oc-bg-subtle)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--oc-brand-50)] text-[var(--oc-brand-600)] flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--oc-text-primary)] truncate">
                      {previewAttachment.attachment_name || "Document Preview"}
                    </h3>
                    <p className="text-[11px] text-[var(--oc-text-tertiary)] truncate">
                      Order #{orderNumber} · Shared Document
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[var(--oc-text-tertiary)] italic mr-2 hidden sm:inline">
                    File download available via Company Documents
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPreviewAttachment(null);
                      setPreviewUrl(null);
                    }}
                    className="h-8 w-8 rounded-full text-[var(--oc-text-tertiary)] hover:text-[var(--oc-text-primary)]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Preview Body */}
              <div className="flex-1 bg-[var(--oc-bg-app)] p-2 overflow-hidden flex items-center justify-center">
                {previewAttachment?.attachment_name?.match(/\.(xlsx|xls|csv)$/i) ? (
                  <ExcelPreview
                    fileUrl={previewUrl}
                    fileName={previewAttachment.attachment_name}
                    className="h-full border-0 shadow-none rounded-none"
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full rounded-xl border border-[var(--oc-border)] bg-[var(--oc-bg-panel)]"
                    title="Document Preview"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
