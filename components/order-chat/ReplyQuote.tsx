"use client";

import React from "react";
import { CornerDownRight, X } from "lucide-react";
import { ChannelType } from "./types";

interface ReplyQuoteProps {
  authorName?: string | null;
  text?: string | null;
  messageId?: number | null;
  channel?: ChannelType;
  isDraftPreview?: boolean;
  onCancel?: () => void;
  onClick?: () => void;
}

export function ReplyQuote({
  authorName,
  text,
  messageId,
  channel = "CLIENT",
  isDraftPreview = false,
  onCancel,
  onClick
}: ReplyQuoteProps) {
  if (!text && !authorName) return null;

  const isInternal = channel === "INTERNAL";

  return (
    <div
      onClick={!isDraftPreview && onClick ? onClick : undefined}
      className={`relative flex items-start justify-between gap-2 p-2 rounded-md transition-all text-left ${
        isDraftPreview
          ? "bg-[var(--oc-bg-subtle)] border-l-2 border-l-[var(--oc-brand-500)] text-[var(--oc-text-primary)] mb-2"
          : "bg-black/5 dark:bg-white/5 border-l-2 border-l-current cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 mb-1.5"
      } ${
        isInternal && isDraftPreview ? "border-l-[var(--oc-internal-500)]" : ""
      }`}
      style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
      role={isDraftPreview ? undefined : "button"}
      tabIndex={isDraftPreview ? undefined : 0}
      onKeyDown={(e) => {
        if (!isDraftPreview && onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-90 mb-0.5">
          <CornerDownRight className="w-3 h-3 shrink-0 opacity-70" />
          <span className="truncate">{authorName || "User"}</span>
        </div>
        <p className="text-[12px] opacity-80 line-clamp-2 leading-relaxed">
          {text || "Attachment or media"}
        </p>
      </div>

      {isDraftPreview && onCancel && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="p-1 rounded hover:bg-[var(--oc-bg-panel)] text-[var(--oc-text-tertiary)] hover:text-[var(--oc-text-primary)] transition-colors"
          aria-label="Cancel reply"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
