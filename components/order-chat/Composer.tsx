"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Send,
  Paperclip,
  Smile,
  X,
  FileText,
  AlertCircle,
  Lock,
  MessageSquare,
  Loader2,
  Sparkles
} from "lucide-react";
import { ChannelType, TaggableUser, ChatMessage } from "./types";
import { formatFileSize } from "./utils";
import { ReplyQuote } from "./ReplyQuote";
import { MentionPicker } from "./MentionPicker";
import { ChatEmojiPicker } from "@/components/chat-emoji-picker";

interface ComposerProps {
  channel: ChannelType;
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  sending?: boolean;
  placeholder?: string;
  quotedMessage?: ChatMessage | null;
  onCancelQuote?: () => void;
  attachment?: File | null;
  attachmentPreview?: string | null;
  onSelectAttachment?: (file: File) => void;
  onRemoveAttachment?: () => void;
  taggableUsers?: TaggableUser[];
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function Composer({
  channel,
  value,
  onChange,
  onSend,
  sending = false,
  placeholder,
  quotedMessage,
  onCancelQuote,
  attachment,
  attachmentPreview,
  onSelectAttachment,
  onRemoveAttachment,
  taggableUsers = [],
  inputRef: externalInputRef
}: ComposerProps) {
  const isInternal = channel === "INTERNAL";
  const internalRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = externalInputRef || internalRef;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Mention autocomplete state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Auto-resize textarea up to 6 lines (~144px)
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 144);
    el.style.height = `${Math.max(newHeight, 38)}px`;
  }, [textareaRef]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Check for inline client warning when typing @mentions in client chat
  const hasMentionInClient = !isInternal && /@[a-zA-Z0-9_\-\.]+/i.test(value);

  // Filter mention candidates
  const filteredUsers = mentionQuery
    ? taggableUsers.filter((u) =>
        u.displayName.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : taggableUsers;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart || 0;
    onChange(text);

    // Check if an @ trigger is active before cursor
    const lastAtPos = text.lastIndexOf("@", cursor - 1);
    if (lastAtPos !== -1 && (lastAtPos === 0 || /\s/.test(text[lastAtPos - 1]))) {
      const query = text.substring(lastAtPos + 1, cursor);
      if (!query.includes(" ") && query.length < 20) {
        setMentionStartIndex(lastAtPos);
        setMentionQuery(query);
        setShowMentions(true);
        setSelectedMentionIndex(0);
        return;
      }
    }

    setShowMentions(false);
  };

  const handleSelectMention = (user: TaggableUser) => {
    if (mentionStartIndex === -1 || !textareaRef.current) return;
    const text = value;
    const cursor = textareaRef.current.selectionStart || 0;
    const before = text.substring(0, mentionStartIndex);
    const after = text.substring(cursor);
    const mentionTag = `@${user.displayName} `;
    const updated = before + mentionTag + after;

    onChange(updated);
    setShowMentions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = before.length + mentionTag.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Mentions navigation
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev === 0 ? filteredUsers.length - 1 : prev - 1
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelectMention(filteredUsers[selectedMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    // Normal Send on Enter (Shift+Enter for newline)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || attachment) && !sending) {
        onSend();
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSelectAttachment) {
      onSelectAttachment(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart || 0;
    const before = value.substring(0, cursor);
    const after = value.substring(cursor);
    const updated = before + emoji + after;
    onChange(updated);
    setShowEmojiPicker(false);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = cursor + emoji.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // Paste image handler
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || !onSelectAttachment) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.includes("image")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const ext = item.type.split("/")[1] || "png";
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(11, 19);
          const snippetFile = new File([file], `snippet_${timestamp}.${ext}`, {
            type: file.type || "image/png"
          });
          onSelectAttachment(snippetFile);
          return;
        }
      }
    }
  };

  const canSend = Boolean(value.trim() || attachment) && !sending;

  return (
    <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)] shrink-0 transition-colors">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept="*/*"
      />

      {/* Quoted Message Preview */}
      {quotedMessage && (
        <ReplyQuote
          authorName={quotedMessage.sender_name}
          text={quotedMessage.message || quotedMessage.attachment_name || "Attachment"}
          channel={channel}
          isDraftPreview
          onCancel={onCancelQuote}
        />
      )}

      {/* Staged Attachment Preview */}
      {attachment && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-[var(--oc-bg-subtle)] border border-[var(--oc-border)] max-w-sm">
          {attachmentPreview ? (
            <img
              src={attachmentPreview}
              alt="Preview"
              className="w-10 h-10 object-cover rounded border border-[var(--oc-border)]"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-[var(--oc-brand-50)] text-[var(--oc-brand-600)] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--oc-text-primary)] truncate">
              {attachment.name}
            </p>
            <p className="text-[11px] text-[var(--oc-text-tertiary)] tabular-nums">
              {formatFileSize(attachment.size)}
            </p>
          </div>
          {onRemoveAttachment && (
            <button
              type="button"
              onClick={onRemoveAttachment}
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--oc-text-tertiary)] hover:text-[var(--oc-text-primary)]"
              aria-label="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Inline Client Warning when typing @ mentions in external chat */}
      {hasMentionInClient && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-2 rounded-md bg-[var(--oc-warning-50)] border border-[var(--oc-warning-300)] text-[var(--oc-warning-700)] text-[12px] leading-tight">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[var(--oc-warning-500)]" />
          <span>Mentions in client chat will be visible to the client.</span>
        </div>
      )}

      {/* Unified Composer Container */}
      <div
        className={`relative rounded-xl border transition-all ${
          isFocused
            ? isInternal
              ? "border-[var(--oc-internal-500)] ring-2 ring-[var(--oc-internal-500)]/20 shadow-xs"
              : "border-[var(--oc-brand-500)] ring-2 ring-[var(--oc-brand-500)]/20 shadow-xs"
            : "border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] hover:border-[var(--oc-border-strong)]"
        } bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)]`}
      >
        {/* Audience Banner / Mode Tag */}
        <div
          className={`flex items-center justify-between px-3 py-1 text-[11px] font-medium border-b border-[var(--oc-border)]/60 rounded-t-xl select-none ${
            isInternal
              ? "bg-[var(--oc-internal-50)] text-[var(--oc-internal-700)] dark:bg-[var(--oc-internal-950)]/40 dark:text-[var(--oc-internal-300)]"
              : "bg-[var(--oc-brand-50)] text-[var(--oc-brand-700)] dark:bg-[var(--oc-brand-950)]/40 dark:text-[var(--oc-brand-300)]"
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isInternal ? (
              <>
                <Lock className="w-3 h-3 text-[var(--oc-internal-600)]" />
                <span>Internal note · Client can&apos;t see this</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-3 h-3 text-[var(--oc-brand-600)]" />
                <span>Replying to client</span>
              </>
            )}
          </div>

          {isFocused && (
            <span className="text-[10px] text-[var(--oc-text-tertiary)] opacity-85 hidden sm:inline">
              Enter to send · Shift+Enter for newline
            </span>
          )}
        </div>

        {/* Textarea Input */}
        <div className="relative px-3 pt-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPaste={handlePaste}
            placeholder={
              placeholder ||
              (isInternal
                ? "Write an internal note or type @ to tag teammates..."
                : "Type a message to the client...")
            }
            rows={1}
            className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-[var(--oc-text-primary)] placeholder:text-[var(--oc-text-tertiary)] focus:outline-none max-h-36 overflow-y-auto"
            aria-label={isInternal ? "Internal chat composer" : "Client chat composer"}
          />

          {/* Mention Popover */}
          {showMentions && (
            <MentionPicker
              candidates={filteredUsers}
              selectedIndex={selectedMentionIndex}
              onSelect={handleSelectMention}
              onClose={() => setShowMentions(false)}
            />
          )}
        </div>

        {/* Bottom Bar: Action Icons + Send Button */}
        <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
          {/* Left Actions: Attach, Emoji */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-[var(--oc-text-tertiary)] hover:text-[var(--oc-text-primary)] hover:bg-[var(--oc-bg-subtle)] transition-colors"
              title="Attach file or document (Max 50MB)"
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <ChatEmojiPicker
              onSelectEmoji={handleEmojiSelect}
              side="top"
              align="start"
              trigger={
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-[var(--oc-text-tertiary)] hover:text-[var(--oc-text-primary)] hover:bg-[var(--oc-bg-subtle)] transition-colors cursor-pointer"
                  title="Add emoji"
                  aria-label="Add emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
              }
            />
          </div>

          {/* Right Action: Solid Saturated Send Button */}
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-xs ${
              isInternal
                ? canSend
                  ? "bg-[var(--oc-internal-600)] hover:bg-[var(--oc-internal-700)] active:scale-[0.98] cursor-pointer"
                  : "bg-[var(--oc-internal-600)]/40 cursor-not-allowed opacity-60"
                : canSend
                ? "bg-[var(--oc-brand-600)] hover:bg-[var(--oc-brand-700)] active:scale-[0.98] cursor-pointer"
                : "bg-[var(--oc-brand-600)]/40 cursor-not-allowed opacity-60"
            }`}
            aria-label={isInternal ? "Send internal note" : "Send message to client"}
          >
            {sending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>{isInternal ? "Post Note" : "Send to Client"}</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
