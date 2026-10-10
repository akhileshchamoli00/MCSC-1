"use client";

import React from "react";
import { Lock, Globe, MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
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
  participantCount,
  rightAction
}: ChannelHeaderProps) {
  const isInternal = channel === "INTERNAL";

  const defaultTitle = isInternal ? "Internal Team Chat" : "Client & Consultant Chat";
  const defaultDesc = isInternal
    ? "Private staff discussion · Client cannot view these messages"
    : "Direct communication with the client · Visible to all order participants";

  return (
    <header
      className={`h-14 px-4 flex items-center justify-between border-b shrink-0 select-none transition-colors bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)] ${
        isInternal
          ? "border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] border-t-2 border-t-[var(--oc-internal-500)]"
          : "border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] border-t-2 border-t-[var(--oc-brand-500)]"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Channel Icon Badge */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            isInternal
              ? "bg-[var(--oc-internal-50)] text-[var(--oc-internal-600)] border border-[var(--oc-internal-200)]"
              : "bg-[var(--oc-brand-50)] text-[var(--oc-brand-600)] border border-[var(--oc-brand-200)]"
          }`}
          aria-hidden="true"
        >
          {isInternal ? <Lock className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        </div>

        {/* Title & Description */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--oc-text-primary)] truncate leading-tight">
              {title || defaultTitle}
            </h2>

            {/* Audience Badge */}
            {isInternal ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--oc-internal-50)] text-[var(--oc-internal-700)] border border-[var(--oc-internal-200)] shrink-0">
                <Lock className="w-3 h-3 text-[var(--oc-internal-600)]" />
                Internal only
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--oc-brand-50)] text-[var(--oc-brand-700)] border border-[var(--oc-brand-200)] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--oc-brand-500)] animate-pulse" />
                Visible to client
              </span>
            )}

            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[var(--oc-brand-600)] text-white tabular-nums">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <p className="text-[11px] text-[var(--oc-text-tertiary)] truncate leading-normal">
            {description || defaultDesc}
          </p>
        </div>
      </div>

      {/* Right Action / Participant Status */}
      <div className="flex items-center gap-2 shrink-0">
        {!isInternal && isClientOnline !== undefined && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-[var(--oc-text-secondary)] bg-[var(--oc-bg-subtle)] border border-[var(--oc-border)]"
            title={isClientOnline ? "Client is currently online" : "Client is currently offline"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isClientOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
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
