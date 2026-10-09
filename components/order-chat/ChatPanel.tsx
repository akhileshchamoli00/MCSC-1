"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { ChannelType, ChatMessage, TaggableUser } from "./types";
import { groupMessagesForStream, StreamItem } from "./utils";
import { ChannelHeader } from "./ChannelHeader";
import { DateSeparator } from "./DateSeparator";
import { SystemEventGroup } from "./SystemEvent";
import { MessageGroup } from "./MessageGroup";
import { EmptyState } from "./EmptyState";
import { Composer } from "./Composer";

interface ChatPanelProps {
  channel: ChannelType;
  orderNumber?: string | null;
  title?: string;
  description?: string;
  unreadCount?: number;
  isClientOnline?: boolean;
  participantCount?: number;
  headerRightAction?: React.ReactNode;

  // Stream data
  messages: ChatMessage[];
  loading?: boolean;
  currentUserId?: number | null;
  currentUserName?: string | null;

  // Typing indicator
  typingUser?: string | null;

  // Composer
  composerValue: string;
  onComposerChange: (val: string) => void;
  onSend: () => void;
  sending?: boolean;
  composerPlaceholder?: string;
  quotedMessage?: ChatMessage | null;
  onCancelQuote?: () => void;
  attachment?: File | null;
  attachmentPreview?: string | null;
  onSelectAttachment?: (file: File) => void;
  onRemoveAttachment?: () => void;
  taggableUsers?: TaggableUser[];
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;

  // Actions
  onReply?: (message: ChatMessage) => void;
  onReact?: (messageId: number, emoji: string) => void;
  onCopy?: (text: string) => void;
  onDelete?: (messageId: number) => void;
  onEdit?: (message: ChatMessage) => void;
  onOpenImagePreview?: (url: string, filename?: string) => void;
  onSelectSuggestion?: (text: string) => void;
  orderStatus?: string;
  hideSuggestions?: boolean;
}

export function ChatPanel({
  channel,
  orderNumber,
  title,
  description,
  unreadCount = 0,
  isClientOnline,
  participantCount,
  headerRightAction,

  messages,
  loading = false,
  currentUserId,
  currentUserName,

  typingUser,

  composerValue,
  onComposerChange,
  onSend,
  sending = false,
  composerPlaceholder,
  quotedMessage,
  onCancelQuote,
  attachment,
  attachmentPreview,
  onSelectAttachment,
  onRemoveAttachment,
  taggableUsers = [],
  inputRef,

  onReply,
  onReact,
  onCopy,
  onDelete,
  onEdit,
  onOpenImagePreview,
  onSelectSuggestion,
  orderStatus,
  hideSuggestions
}: ChatPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [hasNewMessagesWhileScrolledUp, setHasNewMessagesWhileScrolledUp] = useState(false);
  const prevMessagesLengthRef = useRef(messages.length);

  // Group messages into stream items (date separators, system groups, 5-min sender batches)
  const isSelfPredicate = useCallback(
    (msg: ChatMessage) => {
      if (currentUserId && (msg.user_id === currentUserId || msg.sender_id === currentUserId)) {
        return true;
      }
      if (
        currentUserName &&
        msg.sender_name &&
        msg.sender_name.toLowerCase() === currentUserName.toLowerCase()
      ) {
        return true;
      }
      return false;
    },
    [currentUserId, currentUserName]
  );

  const streamItems: StreamItem[] = useMemo(() => {
    return groupMessagesForStream(messages, isSelfPredicate);
  }, [messages, isSelfPredicate]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
      setIsScrolledUp(false);
      setHasNewMessagesWhileScrolledUp(false);
    }
  }, []);

  // Track scroll position
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const scrolledUp = distanceFromBottom > 120;
    setIsScrolledUp(scrolledUp);
    if (!scrolledUp) {
      setHasNewMessagesWhileScrolledUp(false);
    }
  };

  // Autoscroll when new messages arrive if user is already at bottom
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      if (isScrolledUp) {
        setHasNewMessagesWhileScrolledUp(true);
      } else {
        scrollToBottom(true);
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, isScrolledUp, scrollToBottom]);

  const hasInitializedScrollRef = useRef(false);

  // Scroll to bottom on initial load once messages are rendered
  useEffect(() => {
    if (!loading && messages.length > 0 && !hasInitializedScrollRef.current) {
      hasInitializedScrollRef.current = true;
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
    }
  }, [loading, messages.length, scrollToBottom]);

  // Scroll to quoted message
  const handleScrollToQuote = (quotedId: number) => {
    const el = document.getElementById(`message-${quotedId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-[var(--oc-brand-500)]", "ring-offset-2");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-[var(--oc-brand-500)]", "ring-offset-2");
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--oc-bg-panel)] relative overflow-hidden">
      {/* 56px Channel Header */}
      <ChannelHeader
        channel={channel}
        title={title}
        description={description}
        unreadCount={unreadCount}
        isClientOnline={isClientOnline}
        participantCount={participantCount}
        rightAction={headerRightAction}
      />

      {/* Main Stream Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 relative overscroll-contain select-text"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(125, 125, 125, 0.35) transparent"
        }}
        role="log"
        aria-live="polite"
      >
        {loading ? (
          /* Skeleton Loader */
          <div className="flex-1 flex flex-col justify-end space-y-4 py-4 animate-pulse">
            <div className="h-4 bg-[var(--oc-bg-subtle)] rounded w-24 mx-auto" />
            <div className="flex items-start gap-2 max-w-[60%]">
              <div className="w-6 h-6 rounded-full bg-[var(--oc-bg-subtle)] shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-[var(--oc-bg-subtle)] rounded w-20" />
                <div className="h-10 bg-[var(--oc-bg-subtle)] rounded-xl" />
              </div>
            </div>
            <div className="flex items-start gap-2 max-w-[60%] ml-auto flex-row-reverse">
              <div className="w-6 h-6 rounded-full bg-[var(--oc-bg-subtle)] shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-[var(--oc-bg-subtle)] rounded w-20 ml-auto" />
                <div className="h-12 bg-[var(--oc-bg-subtle)] rounded-xl" />
              </div>
            </div>
            <div className="h-8 bg-[var(--oc-bg-subtle)] rounded-md max-w-sm mx-auto" />
          </div>
        ) : messages.length === 0 ? (
          /* Calm Empty State */
          <EmptyState
            channel={channel}
            orderNumber={orderNumber}
            orderStatus={orderStatus}
            hideSuggestions={hideSuggestions}
            onSelectSuggestion={onSelectSuggestion || ((txt) => onComposerChange(txt))}
          />
        ) : (
          /* Rendered Stream Items */
          <div className="flex flex-col min-h-full">
            <div className="mt-auto space-y-0.5">
              {streamItems.map((item) => {
                if (item.type === "date-separator" && item.dateLabel) {
                  return <DateSeparator key={item.key} label={item.dateLabel} />;
                }

                if (item.type === "system-group" && item.systemEvents) {
                  return (
                    <SystemEventGroup key={item.key} events={item.systemEvents} />
                  );
                }

                if (item.type === "message-group" && item.messageGroup) {
                  return (
                    <MessageGroup
                      key={item.key}
                      group={item.messageGroup}
                      channel={channel}
                      orderNumber={orderNumber}
                      currentUserName={currentUserName}
                      taggableUsers={taggableUsers}
                      onReply={onReply}
                      onReact={onReact}
                      onCopy={onCopy}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onScrollToQuote={handleScrollToQuote}
                      onOpenImagePreview={onOpenImagePreview}
                    />
                  );
                }

                return null;
              })}

              {/* Live Typing Indicator */}
              {typingUser && (
                <div className="flex items-center gap-2 text-xs text-[var(--oc-text-tertiary)] py-1.5 px-2 animate-fadeIn">
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--oc-text-tertiary)] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--oc-text-tertiary)] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--oc-text-tertiary)] animate-bounce" />
                  </span>
                  <span>{typingUser} is typing...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Jump To Latest Floating Pill */}
      {isScrolledUp && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-6 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--oc-bg-panel)] text-[var(--oc-text-primary)] border border-[var(--oc-border)] shadow-md hover:bg-[var(--oc-bg-subtle)] transition-all animate-fadeIn"
          aria-label="Jump to latest messages"
        >
          <ArrowDown className="w-3.5 h-3.5 text-[var(--oc-brand-500)]" />
          <span>Jump to latest</span>
          {hasNewMessagesWhileScrolledUp && (
            <span className="w-2 h-2 rounded-full bg-[var(--oc-brand-600)]" />
          )}
        </button>
      )}

      {/* Unified Composer */}
      <Composer
        channel={channel}
        value={composerValue}
        onChange={onComposerChange}
        onSend={onSend}
        sending={sending}
        placeholder={composerPlaceholder}
        quotedMessage={quotedMessage}
        onCancelQuote={onCancelQuote}
        attachment={attachment}
        attachmentPreview={attachmentPreview}
        onSelectAttachment={onSelectAttachment}
        onRemoveAttachment={onRemoveAttachment}
        taggableUsers={taggableUsers}
        inputRef={inputRef}
      />
    </div>
  );
}
