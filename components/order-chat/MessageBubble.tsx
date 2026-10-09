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
  isImageFile,
  resolveAttachmentUrl,
  formatAttachmentDisplayName
} from "./utils";
import { resolveImageUrl } from "@/lib/utils";
import { ChatMessage, ChannelType } from "./types";
import { renderMessageWithMentions } from "./MentionChip";
import { ReplyQuote } from "./ReplyQuote";

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

  // Bubble style classes based on channel and ownership
  let bubbleClasses = "";
  if (isSelf) {
    if (isInternal) {
      // Internal own message: Calming Eucalyptus / Sage (Professional workspace green)
      bubbleClasses =
        "bg-[var(--oc-bubble-internal-bg)] text-[var(--oc-bubble-internal-text)] border border-[var(--oc-bubble-internal-border)] shadow-2xs";
    } else {
      // Client external own message: Executive Slate-Indigo (Calm, trustworthy, professional)
      bubbleClasses =
        "bg-[var(--oc-bubble-client-bg)] text-[var(--oc-bubble-client-text)] border border-[var(--oc-bubble-client-border)] shadow-2xs";
    }
  } else {
    // Other person's message: Crisp subtle neutral white with clean border
    bubbleClasses =
      "bg-[var(--oc-bubble-other-bg)] text-[var(--oc-bubble-other-text)] border border-[var(--oc-bubble-other-border)] shadow-2xs";
  }

  const handleCopy = () => {
    if (message.message) {
      navigator.clipboard.writeText(message.message);
      if (onCopy) onCopy(message.message);
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group relative flex flex-col my-1 transition-colors ${
        isSelf ? "items-end" : "items-start"
      } ${
        mentionsCurrentUser
          ? "border-l-2 border-l-[var(--oc-internal-500)] pl-2 -ml-2"
          : ""
      }`}
    >
      {/* Floating Action Bar (revealed on hover) */}
      <div
        className={`absolute top-0 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--oc-bg-panel)] border border-[var(--oc-border)] shadow-md z-20 ${
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
              <div className="absolute bottom-full left-0 mb-1 flex items-center gap-1 p-1 rounded-lg bg-[var(--oc-bg-panel)] border border-[var(--oc-border)] shadow-lg z-30 animate-fadeIn">
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
        className={`min-w-[76px] max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 rounded-2xl transition-all ${bubbleClasses}`}
        style={{
          overflowWrap: "anywhere",
          wordBreak: "break-word"
        }}
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
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs">
                  <ImageIcon className="w-4 h-4 text-[var(--oc-text-tertiary)] shrink-0" />
                  <span className="truncate flex-1 font-medium">{displayAttachmentName}</span>
                  {resolvedAttachmentUrl && (
                    <a
                      href={resolvedAttachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] font-semibold text-[var(--oc-brand-600)] hover:underline shrink-0"
                    >
                      View
                    </a>
                  )}
                </div>
              ) : (
                <div
                  className="relative rounded-lg overflow-hidden border border-black/10 dark:border-white/10 group/img cursor-pointer max-w-sm bg-black/5 dark:bg-white/5"
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
                className="flex items-center gap-3 p-2.5 rounded-lg border transition-colors bg-[var(--oc-bg-panel)] hover:bg-[var(--oc-bg-subtle)] border-[var(--oc-border)] text-[var(--oc-text-primary)]"
              >
                <div className="p-2 rounded-md bg-black/5 dark:bg-white/10 shrink-0">
                  {isExcel ? (
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-[var(--oc-brand-500)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate leading-tight">
                    {displayAttachmentName}
                  </div>
                  <div className="text-[11px] opacity-75 mt-0.5 tabular-nums">
                    {formatFileSize(message.attachment_size)}
                  </div>
                </div>
                <Download className="w-4 h-4 shrink-0 opacity-80" />
              </a>
            )}
          </div>
        )}

        {/* Message Text with Mentions */}
        {message.message && (
          <div className="text-[14px] leading-relaxed whitespace-pre-wrap select-text">
            {renderMessageWithMentions(message.message, currentUserName)}
          </div>
        )}

        {/* Message Meta: Time & Read Receipts */}
        <div
          className={`flex items-center justify-end gap-1.5 mt-1 text-[11px] tabular-nums select-none whitespace-nowrap ${
            isSelf
              ? isInternal
                ? "text-[var(--oc-bubble-internal-meta)]"
                : "text-[var(--oc-bubble-client-meta)]"
              : "text-[var(--oc-bubble-other-meta)]"
          }`}
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
          ) : isSelf ? (
            message.seen_by && message.seen_by.length > 0 ? (
              <span title={`Seen by ${message.seen_by.map((u: { name: string }) => u.name).join(", ")}`}>
                <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
              </span>
            ) : (
              <Check className="w-3 h-3 opacity-70" />
            )
          ) : null}
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
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors border ${
                  hasReacted
                    ? "bg-[var(--oc-brand-50)] text-[var(--oc-brand-700)] border-[var(--oc-brand-300)]"
                    : "bg-[var(--oc-bg-panel)] text-[var(--oc-text-secondary)] border-[var(--oc-border)] hover:bg-[var(--oc-bg-subtle)]"
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
