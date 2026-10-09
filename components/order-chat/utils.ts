import { ChatMessage, MessageGroupData } from "./types";

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface HumanStatus {
  label: string;
  variant: StatusVariant;
  dotColor: string;
}

export const HUMAN_STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  ORDER: { label: "Order placed", variant: "info" },
  ORDER_CREATED: { label: "Order placed", variant: "info" },
  ORDER_REGISTERED: { label: "Order registered", variant: "info" },
  REGISTERED: { label: "Order registered", variant: "info" },
  ORDER_ASSIGNED: { label: "Assigned", variant: "info" },
  ASSIGNED: { label: "Assigned", variant: "info" },
  REVIEW: { label: "In review", variant: "warning" },
  UNDER_REVIEW: { label: "In review", variant: "warning" },
  DOCUMENTS_REVIEW: { label: "In review", variant: "warning" },
  DOCUMENT_REVIEW: { label: "In review", variant: "warning" },
  DOCS_REVIEW: { label: "In review", variant: "warning" },
  PROFORMA: { label: "Proforma issued", variant: "warning" },
  PROFORMA_GENERATED: { label: "Proforma issued", variant: "warning" },
  PROFORMA_ISSUED: { label: "Proforma issued", variant: "warning" },
  PROFORMA_PAID: { label: "Proforma paid", variant: "info" },
  IN_PROGRESS: { label: "In progress", variant: "info" },
  PROGRESS: { label: "In progress", variant: "info" },
  IN: { label: "In progress", variant: "info" },
  ACTIVE: { label: "In progress", variant: "info" },
  GOVERNMENT: { label: "Gov processing", variant: "warning" },
  GOVERNMENT_PROCESSING: { label: "Gov processing", variant: "warning" },
  NOTARY: { label: "Notary processing", variant: "warning" },
  NOTARY_APPOINTMENT: { label: "Notary processing", variant: "warning" },
  FINAL_DOC: { label: "Final docs ready", variant: "success" },
  FINAL_DOC_READY: { label: "Final docs ready", variant: "success" },
  FINAL_DOCS: { label: "Final docs ready", variant: "success" },
  FINAL_DOCS_READY: { label: "Final docs ready", variant: "success" },
  INVOICE: { label: "Invoice issued", variant: "info" },
  INVOICE_GENERATED: { label: "Invoice issued", variant: "info" },
  FINAL_INVOICE: { label: "Final invoice issued", variant: "info" },
  FINAL_INVOICE_GENERATED: { label: "Final invoice issued", variant: "info" },
  FINAL_PAID: { label: "Paid in full", variant: "success" },
  FULLY_PAID: { label: "Paid in full", variant: "success" },
  PAID: { label: "Paid in full", variant: "success" },
  COMPLETED: { label: "Completed", variant: "success" },
  ON_HOLD: { label: "On hold", variant: "warning" },
  HOLD: { label: "On hold", variant: "warning" },
  PAUSED: { label: "On hold", variant: "warning" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
  REOPENED: { label: "Reopened", variant: "info" }
};

export function formatHumanStatus(rawStatus?: string | null): HumanStatus {
  if (!rawStatus) {
    return { label: "In progress", variant: "info", dotColor: "#2E90FA" };
  }
  const normalized = rawStatus.toUpperCase().trim().replace(/[\s-]+/g, "_");
  const mapped = HUMAN_STATUS_MAP[normalized];
  if (mapped) {
    const dotColors: Record<StatusVariant, string> = {
      success: "#12B76A",
      warning: "#F79009",
      danger: "#F04438",
      info: "#2E90FA",
      neutral: "#667085"
    };
    return {
      label: mapped.label,
      variant: mapped.variant,
      dotColor: dotColors[mapped.variant]
    };
  }

  // Graceful fallback for non-mapped strings
  const cleaned = rawStatus.replace(/_/g, " ").toLowerCase();
  return {
    label: cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
    variant: "neutral",
    dotColor: "#667085"
  };
}

export function formatTimeTabular(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "";
  }
}

export function formatFullDateTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

export function getDateSeparatorLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();

    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return "Today";

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

    const isCurrentYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      ...(isCurrentYear ? {} : { year: "numeric" })
    });
  } catch {
    return "";
  }
}

export function isSystemMessage(msg: any): boolean {
  if (!msg) return false;
  if (msg.pending) return false;
  if (msg.is_client || (msg.sender_role || "").toUpperCase() === "CLIENT") return false;
  const role = (msg.sender_role || "").toUpperCase();
  if (role === "MILESTONE" || role === "SYSTEM") return true;
  const name = (msg.sender_name || "").toUpperCase();
  if (name === "SYSTEM" || name === "MILESTONE") return true;
  if (!msg.user_id && !msg.sender_name) return true;
  const txt = (msg.message || "").toLowerCase().trim();
  if (!txt) return false;
  return (
    txt.startsWith("order execution status") ||
    txt.includes("order placed on hold") ||
    txt.includes("⏸️") ||
    txt.startsWith("pipeline order") ||
    txt.startsWith("order moved") ||
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
    txt.includes("consultant is actively") ||
    txt.includes("has been reopened") ||
    txt.includes("reopened and moved back") ||
    txt.includes("marked as cancelled") ||
    txt.includes("has been cancelled")
  );
}

export function cleanMilestoneText(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();

  // Clean hold reason messages
  if (text.toLowerCase().includes("on hold")) {
    const reasonMatch = text.match(/reason:\s*(.+)$/i);
    if (reasonMatch) {
      return `Order placed on hold: ${reasonMatch[1].trim()}`;
    }
    return "Order placed on hold";
  }

  // Strip trailing periods, dots, or punctuation
  const cleaned = text.replace(/[\.\s]+$/, "").trim();

  // Match "Order execution status has been updated to <STATUS_NAME>"
  // Capture multi-word status names (e.g. "IN PROGRESS", "ORDER REGISTERED", "UNDER REVIEW")
  const prefixMatch = cleaned.match(
    /(?:order execution status|order status|status)(?:\s+has been)?\s+updated to\s+([A-Za-z0-9_\s-]+)/i
  );
  if (prefixMatch) {
    const mapped = formatHumanStatus(prefixMatch[1].trim());
    return `Status updated to ${mapped.label}`;
  }

  // Match "Pipeline order moved to <STATUS_NAME>" or "Order moved to <STATUS_NAME>"
  const movedMatch = cleaned.match(
    /(?:pipeline order|order)\s+moved to\s+([A-Za-z0-9_\s-]+)/i
  );
  if (movedMatch) {
    const mapped = formatHumanStatus(movedMatch[1].trim());
    return `Moved to ${mapped.label}`;
  }

  return text;
}

export interface StreamItem {
  type: "date-separator" | "system-group" | "message-group";
  key: string;
  dateLabel?: string;
  systemEvents?: ChatMessage[];
  messageGroup?: MessageGroupData;
}

export function groupMessagesForStream(
  messages: ChatMessage[],
  isSelfPredicate: (msg: ChatMessage) => boolean
): StreamItem[] {
  const items: StreamItem[] = [];
  let currentDate = "";
  let pendingSystemEvents: ChatMessage[] = [];

  const flushSystemEvents = () => {
    if (pendingSystemEvents.length > 0) {
      items.push({
        type: "system-group",
        key: `sys-grp-${pendingSystemEvents[0].id || items.length}-${pendingSystemEvents.length}`,
        systemEvents: [...pendingSystemEvents]
      });
      pendingSystemEvents = [];
    }
  };

  let currentGroup: MessageGroupData | null = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg) continue;

    // Date separator check
    const msgDateLabel = getDateSeparatorLabel(msg.created_at);
    if (msgDateLabel && msgDateLabel !== currentDate) {
      flushSystemEvents();
      if (currentGroup) {
        items.push({
          type: "message-group",
          key: currentGroup.id,
          messageGroup: currentGroup
        });
        currentGroup = null;
      }
      currentDate = msgDateLabel;
      items.push({
        type: "date-separator",
        key: `date-sep-${currentDate}-${i}`,
        dateLabel: currentDate
      });
    }

    if (isSystemMessage(msg)) {
      if (currentGroup) {
        items.push({
          type: "message-group",
          key: currentGroup.id,
          messageGroup: currentGroup
        });
        currentGroup = null;
      }
      pendingSystemEvents.push(msg);
      continue;
    }

    // Regular message
    flushSystemEvents();

    const isSelf = isSelfPredicate(msg);
    const isClient = Boolean(msg.is_client || (msg.sender_role || "").toUpperCase() === "CLIENT");
    const senderKey = isClient
      ? `client-${msg.sender_name || "Client"}`
      : `staff-${msg.user_id || msg.sender_id || msg.sender_name || "Staff"}`;

    const msgTime = new Date(msg.created_at).getTime();
    const canGroupWithPrev =
      currentGroup !== null &&
      currentGroup.senderKey === senderKey &&
      currentGroup.messages.length > 0 &&
      Math.abs(msgTime - new Date(currentGroup.messages[currentGroup.messages.length - 1].created_at).getTime()) <= 300000; // 5 mins

    if (canGroupWithPrev && currentGroup) {
      currentGroup.messages.push(msg);
    } else {
      if (currentGroup) {
        items.push({
          type: "message-group",
          key: currentGroup.id,
          messageGroup: currentGroup
        });
      }
      currentGroup = {
        id: `grp-${msg.id || i}-${senderKey}`,
        senderKey,
        senderName: msg.sender_name || (isClient ? "Client" : "Team Member"),
        senderRole: msg.sender_role || undefined,
        senderPhoto: msg.sender_avatar || msg.sender_photo || null,
        isSelf,
        isClient,
        timeStr: formatTimeTabular(msg.created_at),
        fullDateStr: formatFullDateTime(msg.created_at),
        messages: [msg]
      };
    }
  }

  flushSystemEvents();
  if (currentGroup) {
    items.push({
      type: "message-group",
      key: currentGroup.id,
      messageGroup: currentGroup
    });
  }

  return items;
}

export function formatExternalTeamName(name?: string | null): string {
  if (!name) return "Consultant MCS";
  const trimmed = name.trim();
  if (!trimmed) return "Consultant MCS";
  const lower = trimmed.toLowerCase();
  if (lower === "client" || lower === "you (client)" || lower === "you" || lower === "member" || lower === "system" || lower === "milestone") {
    return trimmed;
  }
  if (trimmed.toUpperCase().endsWith(" MCS")) {
    return trimmed;
  }
  const first = trimmed.split(/\s+/)[0];
  return `${first} MCS`;
}

export function isImageFile(filename?: string | null): boolean {
  if (!filename) return false;
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(filename);
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function resolveAttachmentUrl(
  attachmentUrl?: string | null,
  orderNumber?: string | null
): string {
  if (!attachmentUrl || attachmentUrl === "uploading...") return "";
  if (
    attachmentUrl.startsWith("http://") ||
    attachmentUrl.startsWith("https://") ||
    attachmentUrl.startsWith("data:") ||
    attachmentUrl.startsWith("blob:")
  ) {
    return attachmentUrl;
  }
  if (orderNumber) {
    return `/api-proxy/api/clients/orders/${encodeURIComponent(
      orderNumber
    )}/attachments/preview?path=${encodeURIComponent(attachmentUrl)}`;
  }
  return `/api-proxy/${attachmentUrl.replace(/^\/+/, "")}`;
}

export function formatAttachmentDisplayName(filename?: string | null): string {
  if (!filename) return "Attachment";
  // Strip any directory path (Unix or Windows)
  const basename = filename.split(/[/\\]/).pop() || filename;
  // If filename is a raw UUID or auto-generated snippet filename
  if (
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(\.[a-z0-9]+)?$/i.test(
      basename
    )
  ) {
    return "Image snippet";
  }
  if (/^snippet[_-].*/i.test(basename)) {
    return "Image snippet";
  }
  return basename;
}

