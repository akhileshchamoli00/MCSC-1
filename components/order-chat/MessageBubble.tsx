"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Check,
  CheckCheck,
  Clock,
  CornerUpLeft,
  Smile,
  Copy,
  Trash2,
  Edit2,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Image as ImageIcon
} from "lucide-react";
import {
  formatTimeTabular,
  formatFullDateTime,
  formatFileSize,
  formatSeenTime,
  isImageFile,
  resolveAttachmentUrl,
  formatAttachmentDisplayName
} from "./utils";
import { resolveImageUrl } from "@/lib/utils";
import { ChatMessage, ChannelType } from "./types";
import { renderMessageWithMentions } from "./MentionChip";
import { ReplyQuote } from "./ReplyQuote";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  channel: ChannelType;
  orderNumber?: string | null;
  currentUserName?: string | null;
  onReply?: (message: ChatMessage) => void;
  onReact?: (messageId: number, emoji: string) => void;
  onCopy?: (text: string) => void;
  onDelete?: (messageId: number) => void;
  onEdit?: (message: ChatMessage) => void;
  onScrollToQuote?: (quotedMessageId: number) => void;
  onOpenImagePreview?: (url: string, filename?: string) => void;
}

const COMMON_EMOJIS = ["👍", "❤️", "🙌", "👀", "✅", "🎉"];

export function ReadersListPopoverContent({
  readers
}: {
  readers: Array<{
    user_id?: number;
    name?: string;
    role?: string;
    read_at?: string;
    is_client?: boolean;
  }>;
}) {
  return (
    <div className="z-[99999] min-w-[220px] max-w-[300px] p-2.5 rounded-xl bg-[#18181C]/95 text-white border border-white/20 shadow-2xl backdrop-blur-md text-left">
      <div className="flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-white/10 text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-blue-400">
          <Eye className="w-3.5 h-3.5" />
          Seen by ({readers.length})
        </span>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {readers.map((r, idx) => (
          <div key={r.user_id || idx} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-white shrink-0 border border-white/10">
                {r.name ? r.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-[11px] text-white block truncate">{r.name}</span>
                {r.role && <span className="text-[9.5px] text-zinc-400 block truncate -mt-0.5">{r.role}</span>}
              </div>
            </div>
            <span className="text-[9.5px] font-mono text-zinc-400 shrink-0 text-right">{formatSeenTime(r.read_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeenReceiptsIndicator({
  seenBy,
  isSelf,
  sentAt
}: {
  seenBy?: Array<{
    user_id?: number;
    name?: string;
    role?: string;
    read_at?: string;
    is_client?: boolean;
  }>;
  isSelf: boolean;
  sentAt?: string;
}) {
  const readers = seenBy || [];
  const hasSeen = readers.length > 0;

  if (!isSelf && !hasSeen) return null;

  if (!hasSeen) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex items-center p-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-default"
              aria-label="Delivered"
            >
              <Check className="w-3.5 h-3.5 opacity-70" />
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            sideOffset={6}
            className="z-[99999] px-2.5 py-1 rounded-lg bg-[#18181C]/95 text-white border border-white/20 shadow-lg text-[11px] font-medium"
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
            className="inline-flex items-center gap-0.5 cursor-pointer p-0.5 rounded hover:bg-white/10 transition-colors focus:outline-none"
            aria-label={`Seen by ${readers.map((r) => r.name).join(", ")}`}
          >
            {isSelf ? (
              <CheckCheck className="w-3.5 h-3.5 text-blue-400 transition-colors" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-zinc-300 hover:text-white transition-colors" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="end"
          sideOffset={6}
          className="p-0 bg-transparent border-0 shadow-none z-[99999]"
        >
          <ReadersListPopoverContent readers={readers} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MessageBubble({
  message,
  isSelf,
  channel,
  orderNumber,
  currentUserName,
  onReply,
  onReact,
  onCopy,
  onDelete,
  onEdit,
  onScrollToQuote,
  onOpenImagePreview
}: MessageBubbleProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const isInternal = channel === "INTERNAL";

  // Check if this message mentions the current user
  const mentionsCurrentUser = Boolean(
    currentUserName &&
      message.message &&
      new RegExp(`@${currentUserName}\\b`, "i").test(message.message)
  );

  const timeFormatted = formatTimeTabular(message.created_at);
  const fullDateTime = formatFullDateTime(message.created_at);

  const isImg = isImageFile(message.attachment_name || message.attachment_url);
  const isExcel = Boolean(
    (message.attachment_name || message.attachment_url || "").match(/\.(xlsx|xls|csv)$/i)
  );

  const hasAttachment = Boolean(message.attachment_url);
  const resolvedAttachmentUrl = resolveAttachmentUrl(
    message.attachment_url,
    orderNumber || message.order_number
  );
  const displayAttachmentName = formatAttachmentDisplayName(
    message.attachment_name || (isImg ? "Image snippet" : "Attachment")
  );

  // Transparent Frosted Glass Bubble Styling with Dynamic Theme Colors
  const bubbleStyle: React.CSSProperties = {
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    backgroundColor: isSelf
      ? isInternal
        ? "var(--oc-bubble-internal-bg)"
        : "var(--oc-bubble-client-bg)"
      : "var(--oc-bubble-other-bg)",
    borderColor: isSelf
      ? isInternal
        ? "var(--oc-bubble-internal-border)"
        : "var(--oc-bubble-client-border)"
      : "var(--oc-bubble-other-border)",
    color: isSelf
      ? isInternal
        ? "var(--oc-bubble-internal-text)"
        : "var(--oc-bubble-client-text)"
      : "var(--oc-bubble-other-text)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.70)"
  };

  const handleCopy = () => {
    if (message.message) {
      navigator.clipboard.writeText(message.message);
      if (onCopy) onCopy(message.message);
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group relative flex flex-col my-1 transition-colors w-full ${
        isSelf ? "items-end" : "items-start"
      } ${
        mentionsCurrentUser
          ? "border-l-2 border-l-[var(--oc-internal-500)] pl-2 -ml-2"
          : ""
      }`}
    >
      {/* Floating Action Bar (revealed on hover) */}
      <div
        className={`absolute top-0 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md border border-zinc-200 dark:border-white/15 shadow-md z-20 ${
          isSelf ? "right-2" : "left-2"
        }`}
      >
        {onReply && (
          <button
            type="button"
            onClick={() => onReply(message)}
            className="p-1 rounded-full text-[var(--oc-text-tertiary)] hover:text-[var(--oc-text-primary)] hover:bg-[var(--oc-bg-subtle)] transition-colors"
            title="Reply / Quote"
            aria-label="Reply"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {onReact && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 rounded-full text-[var(--oc-text-tertiary)] hover:text-[var(--oc-text-primary)] hover:bg-[var(--oc-bg-subtle)] transition-colors"
              title="Add reaction"
              aria-label="React"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-1 flex items-center gap-1 p-1 rounded-lg bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md border border-zinc-200 dark:border-white/15 shadow-lg z-30 animate-fadeIn">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onReact(message.id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 text-base hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {message.seen_by && message.seen_by.length > 0 && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded-full text-[var(--oc-text-tertiary)] hover:text-blue-400 hover:bg-[var(--oc-bg-subtle)] transition-colors"
                  title="View who read this message"
                  aria-label="View who read this message"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                sideOffset={6}
                className="p-0 bg-transparent border-0 shadow-none z-[99999]"
              >
                <ReadersListPopoverContent readers={message.seen_by} />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {message.message && (
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-full text-[var(--oc-text-tertiary)] hover:text-[var(--oc-text-primary)] hover:bg-[var(--oc-bg-subtle)] transition-colors"
            title="Copy text"
            aria-label="Copy"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}

        {isSelf && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(message)}
            className="p-1 rounded-full text-[var(--oc-text-tertiary)] hover:text-[var(--oc-text-primary)] hover:bg-[var(--oc-bg-subtle)] transition-colors"
            title="Edit message"
            aria-label="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}

        {isSelf && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="p-1 rounded-full text-[var(--oc-text-tertiary)] hover:text-[var(--oc-danger-500)] hover:bg-[var(--oc-danger-50)] transition-colors"
            title="Delete message"
            aria-label="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bubble Container */}
      <div
        className="w-fit min-w-[72px] max-w-[88%] sm:max-w-[78%] px-3.5 py-2.5 rounded-2xl border transition-all shadow-md"
        style={bubbleStyle}
      >
        {/* Reply Quote Block */}
        {message.quoted_message_text && (
          <ReplyQuote
            authorName={message.quoted_sender_name}
            text={message.quoted_message_text}
            messageId={message.quoted_message_id}
            channel={channel}
            onClick={() => {
              if (message.quoted_message_id && onScrollToQuote) {
                onScrollToQuote(message.quoted_message_id);
              }
            }}
          />
        )}

        {/* Attachment Display */}
        {hasAttachment && (
          <div className="mb-2">
            {isImg ? (
              /* Image Thumbnail */
              imageLoadError ? (
                /* Graceful fallback if image file is unreachable on disk/proxy */
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/25 border border-white/10 text-xs">
                  <ImageIcon className="w-4 h-4 text-zinc-300 shrink-0" />
                  <span className="truncate flex-1 font-medium text-white">{displayAttachmentName}</span>
                  {resolvedAttachmentUrl && (
                    <a
                      href={resolvedAttachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-semibold text-cyan-300 hover:underline shrink-0"
                    >
                      View
                    </a>
                  )}
                </div>
              ) : (
                <div
                  className="relative rounded-lg overflow-hidden border border-white/15 group/img cursor-pointer max-w-sm bg-black/30"
                  onClick={() =>
                    onOpenImagePreview?.(
                      resolvedAttachmentUrl,
                      displayAttachmentName
                    )
                  }
                >
                  <img
                    src={resolvedAttachmentUrl}
                    alt={displayAttachmentName}
                    className="w-full max-h-60 object-contain object-center hover:scale-[1.02] transition-transform duration-200"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedFallback && message.attachment_url) {
                        target.dataset.triedFallback = "true";
                        target.src = resolveImageUrl(message.attachment_url);
                      } else {
                        setImageLoadError(true);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition-opacity text-white">
                    <span className="p-1.5 rounded-full bg-black/60 hover:bg-black/80">
                      <Eye className="w-4 h-4" />
                    </span>
                    <a
                      href={resolvedAttachmentUrl}
                      download={message.attachment_name || "download"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full bg-black/60 hover:bg-black/80"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )
            ) : (
              /* File Card */
              <a
                href={resolvedAttachmentUrl}
                download={message.attachment_name || "download"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-lg border transition-colors bg-black/25 hover:bg-black/40 border-white/15 text-white"
              >
                <div className="p-2 rounded-md bg-white/10 shrink-0">
                  {isExcel ? (
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-cyan-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate leading-tight text-white">
                    {displayAttachmentName}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5 tabular-nums text-zinc-300">
                    {formatFileSize(message.attachment_size)}
                  </div>
                </div>
                <Download className="w-4 h-4 shrink-0 opacity-80 text-white" />
              </a>
            )}
          </div>
        )}

        {/* Message Text with Mentions */}
        {message.message && (
          <div
            className="text-[14px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] select-text font-medium"
            style={{
              color: "inherit",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.70)"
            }}
          >
            {renderMessageWithMentions(message.message, currentUserName)}
          </div>
        )}

        {/* Message Meta: Time & Read Receipts */}
        <div
          className="flex items-center justify-end gap-1.5 mt-1 text-[11px] tabular-nums select-none whitespace-nowrap opacity-90 font-medium"
          style={{
            color: isSelf
              ? isInternal
                ? "var(--oc-bubble-internal-meta)"
                : "var(--oc-bubble-client-meta)"
              : "var(--oc-bubble-other-meta)",
            textShadow: "0 1px 1px rgba(0, 0, 0, 0.60)"
          }}
          title={fullDateTime}
        >
          {message.is_snippet && (
            <span className="text-[10px] uppercase font-mono px-1 rounded bg-black/10 dark:bg-white/10">
              Snippet
            </span>
          )}

          <span className="whitespace-nowrap">{timeFormatted}</span>

          {message.pending ? (
            <Clock className="w-3 h-3 animate-spin" />
          ) : (
            <SeenReceiptsIndicator
              seenBy={message.seen_by}
              isSelf={isSelf}
              sentAt={message.created_at}
            />
          )}
        </div>
      </div>

      {/* Reactions Section */}
      {message.reactions && message.reactions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1 z-10">
          {message.reactions.map((reaction: { emoji: string; users: Array<{ user_id: number; name: string }> }, i: number) => {
            const hasReacted = Boolean(
              currentUserName &&
                reaction.users.some(
                  (u: { name: string }) => u.name.toLowerCase() === currentUserName.toLowerCase()
                )
            );
            const userNames = reaction.users.map((u: { name: string }) => u.name).join(", ");

            return (
              <button
                key={i}
                type="button"
                onClick={() => onReact?.(message.id, reaction.emoji)}
                title={userNames}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border backdrop-blur-xs ${
                  hasReacted
                    ? "bg-[var(--oc-brand-50)] text-[var(--oc-brand-700)] border-[var(--oc-brand-300)]"
                    : "bg-white/80 dark:bg-[#18181C]/80 text-[var(--oc-text-secondary)] border-zinc-200 dark:border-white/15 hover:bg-[var(--oc-bg-subtle)]"
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className="font-semibold text-[11px] tabular-nums">
                  {reaction.users.length}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
