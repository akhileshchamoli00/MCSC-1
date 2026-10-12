"use client";

import React from "react";
import { Lock, MessageSquare } from "lucide-react";
import { ChannelType } from "./types";

interface ChannelHeaderProps {
  channel: ChannelType;
  title?: string;
  description?: string;
  unreadCount?: number;
  isClientOnline?: boolean;
  participantCount?: number;
  rightAction?: React.ReactNode;
}

export function ChannelHeader({
  channel,
  title,
  description,
  unreadCount = 0,
  isClientOnline,
  rightAction
}: ChannelHeaderProps) {
  const isInternal = channel === "INTERNAL";

  const defaultTitle = isInternal ? "Internal Team Chat" : "Client & Consultant Chat";
  const defaultDesc = isInternal
    ? "Private staff discussion · Client cannot view these messages"
    : "Direct communication with the client · Visible to all order participants";

  return (
    <header
      className="h-14 px-4 flex items-center justify-between border-b border-white/10 shrink-0 select-none transition-colors bg-black/35 backdrop-blur-md relative z-10"
      style={{
        borderTop: "2px solid",
        borderTopColor: isInternal
          ? "var(--oc-bubble-internal-border)"
          : "var(--oc-bubble-client-border)"
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Channel Icon Badge (Theme-synchronized frosted glass) */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all border shadow-xs backdrop-blur-xs"
          style={{
            backgroundColor: isInternal
              ? "var(--oc-bubble-internal-bg)"
              : "var(--oc-bubble-client-bg)",
            borderColor: isInternal
              ? "var(--oc-bubble-internal-border)"
              : "var(--oc-bubble-client-border)",
            color: isInternal
              ? "var(--oc-bubble-internal-text)"
              : "var(--oc-bubble-client-text)"
          }}
          aria-hidden="true"
        >
          {isInternal ? <Lock className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        </div>

        {/* Title & Description */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h2
              className="text-sm font-semibold text-white truncate leading-tight"
              style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.70)" }}
            >
              {title || defaultTitle}
            </h2>

            {/* Audience Badge (Theme-synchronized frosted pill) */}
            {isInternal ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 backdrop-blur-xs shadow-xs"
                style={{
                  backgroundColor: "var(--oc-bubble-internal-bg)",
                  borderColor: "var(--oc-bubble-internal-border)",
                  color: "var(--oc-bubble-internal-text)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.65)"
                }}
              >
                <Lock className="w-3 h-3 opacity-80" />
                Internal only
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 backdrop-blur-xs shadow-xs"
                style={{
                  backgroundColor: "var(--oc-bubble-client-bg)",
                  borderColor: "var(--oc-bubble-client-border)",
                  color: "var(--oc-bubble-client-text)",
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.65)"
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--oc-bubble-client-text)" }}
                />
                Visible to client
              </span>
            )}

            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-purple-600 text-white tabular-nums shadow-xs">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <p
            className="text-[11px] text-zinc-300 truncate leading-normal"
            style={{ textShadow: "0 1px 1px rgba(0, 0, 0, 0.50)" }}
          >
            {description || defaultDesc}
          </p>
        </div>
      </div>

      {/* Right Action / Participant Status */}
      <div className="flex items-center gap-2 shrink-0">
        {!isInternal && isClientOnline !== undefined && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-zinc-200 bg-white/5 border border-white/10 backdrop-blur-xs shadow-xs"
            title={isClientOnline ? "Client is currently online" : "Client is currently offline"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isClientOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
              }`}
            />
            <span>{isClientOnline ? "Client online" : "Client offline"}</span>
          </div>
        )}

        {rightAction}
      </div>
    </header>
  );
}
