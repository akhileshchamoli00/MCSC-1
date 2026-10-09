"use client";

import React, { useState } from "react";
import { MessageGroupData, ChatMessage, ChannelType, TaggableUser } from "./types";
import { formatExternalTeamName } from "./utils";
import { resolveImageUrl } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { User, Shield } from "lucide-react";

interface MessageGroupProps {
  group: MessageGroupData;
  channel: ChannelType;
  orderNumber?: string | null;
  currentUserName?: string | null;
  taggableUsers?: TaggableUser[];
  onReply?: (message: ChatMessage) => void;
  onReact?: (messageId: number, emoji: string) => void;
  onCopy?: (text: string) => void;
  onDelete?: (messageId: number) => void;
  onEdit?: (message: ChatMessage) => void;
  onScrollToQuote?: (quotedMessageId: number) => void;
  onOpenImagePreview?: (url: string, filename?: string) => void;
}

export function MessageGroup({
  group,
  channel,
  orderNumber,
  currentUserName,
  taggableUsers,
  onReply,
  onReact,
  onCopy,
  onDelete,
  onEdit,
  onScrollToQuote,
  onOpenImagePreview
}: MessageGroupProps) {
  const { senderName, senderRole, senderPhoto, isSelf, isClient, timeStr, fullDateStr, messages } =
    group;

  const [photoError, setPhotoError] = useState(false);
  const isExternal = channel === "CLIENT";

  // Try finding photo from taggableUsers if not present on message group
  let effectivePhoto = senderPhoto;
  if (!effectivePhoto && taggableUsers && taggableUsers.length > 0) {
    const matched = taggableUsers.find((u) => {
      if (u.type !== "user") return false;
      const lowerName = senderName.toLowerCase();
      const userDisplay = u.displayName.toLowerCase();
      return (
        userDisplay === lowerName ||
        lowerName.startsWith(userDisplay) ||
        userDisplay.startsWith(lowerName) ||
        (group.senderKey.startsWith("staff-") && String(u.id) === group.senderKey.replace("staff-", ""))
      );
    });
    if (matched?.avatar) {
      effectivePhoto = matched.avatar;
    }
  }

  const resolvedPhotoUrl = effectivePhoto ? resolveImageUrl(effectivePhoto) : null;

  // In the client channel, staff members get formatted as "FirstName MCS" to look professional
  const displayName =
    isExternal && !isClient && !isSelf
      ? formatExternalTeamName(senderName)
      : senderName;

  return (
    <div className={`flex flex-col mb-3 ${isSelf ? "items-end" : "items-start"}`}>
      {/* Group Header: Avatar, Name, Role, Time */}
      <div
        className={`flex items-center gap-2 mb-1 px-1 text-xs select-none ${
          isSelf ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Profile Picture Avatar */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold border shadow-2xs overflow-hidden shrink-0 transition-transform ${
            isSelf
              ? isExternal
                ? "bg-[var(--oc-bubble-client-bg)] text-[var(--oc-brand-600)] border-[var(--oc-bubble-client-border)]"
                : "bg-[var(--oc-bubble-internal-bg)] text-[var(--oc-internal-600)] border-[var(--oc-bubble-internal-border)]"
              : isClient
              ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200"
              : isExternal
              ? "bg-[var(--oc-bubble-client-bg)] text-[var(--oc-brand-600)] border-[var(--oc-bubble-client-border)]"
              : "bg-[var(--oc-bubble-internal-bg)] text-[var(--oc-internal-600)] border-[var(--oc-bubble-internal-border)]"
          }`}
        >
          {resolvedPhotoUrl && !photoError ? (
            <img
              src={resolvedPhotoUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={() => setPhotoError(true)}
            />
          ) : (
            <span>{displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Sender Name & Role */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[13px] text-[var(--oc-text-primary)]">
            {isSelf ? "You" : displayName}
          </span>

          {senderRole && !isSelf && (
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                isClient
                  ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  : isExternal
                  ? "bg-[var(--oc-brand-50)] text-[var(--oc-brand-700)] border-[var(--oc-brand-200)] dark:bg-[var(--oc-brand-50)] dark:text-[var(--oc-brand-400)]"
                  : "bg-[var(--oc-internal-50)] text-[var(--oc-internal-700)] border-[var(--oc-internal-200)] dark:bg-[var(--oc-internal-50)] dark:text-[var(--oc-internal-700)]"
              }`}
            >
              {senderRole}
            </span>
          )}

          <span
            className="text-[11px] text-[var(--oc-text-tertiary)] tabular-nums"
            title={fullDateStr}
          >
            {timeStr}
          </span>
        </div>
      </div>

      {/* Group Messages Stack */}
      <div className={`w-full flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
        {messages.map((message: ChatMessage, msgIdx: number) => (
          <MessageBubble
            key={`msg-${message.id ?? msgIdx}-${msgIdx}`}
            message={message}
            isSelf={isSelf}
            channel={channel}
            orderNumber={orderNumber}
            currentUserName={currentUserName}
            onReply={onReply}
            onReact={onReact}
            onCopy={onCopy}
            onDelete={onDelete}
            onEdit={onEdit}
            onScrollToQuote={onScrollToQuote}
            onOpenImagePreview={onOpenImagePreview}
          />
        ))}
      </div>
    </div>
  );
}
