"use client";

import React from "react";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatHumanStatus, formatTimeTabular, cleanMilestoneText } from "./utils";
import { ChatMessage } from "./types";

interface StatusTimelineProps {
  currentStatus?: string | null;
  systemEvents: ChatMessage[];
  createdAt?: string | null;
}

export function StatusTimeline({
  currentStatus,
  systemEvents,
  createdAt
}: StatusTimelineProps) {
  // Extract unique chronological events
  const timelineItems = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      timeStr: string;
      isCurrent: boolean;
      variant: "success" | "warning" | "danger" | "info" | "neutral";
    }> = [];

    const seen = new Set<string | number>();

    // Filter milestones that represent status changes, deduplicating identical events
    const milestoneMsgs = systemEvents.filter((e) => {
      if (!e) return false;
      const dedupeKey =
        e.id !== undefined && e.id !== null ? `id-${e.id}` : `msg-${e.message}-${e.created_at}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);

      const msg = (e.message || "").toLowerCase();
      return (
        msg.includes("status") ||
        msg.includes("order moved") ||
        msg.includes("assigned") ||
        msg.includes("payment") ||
        msg.includes("invoice") ||
        msg.includes("final documents") ||
        msg.includes("on hold") ||
        msg.includes("cancelled")
      );
    });

    milestoneMsgs.forEach((e, idx) => {
      const cleaned = cleanMilestoneText(e.message);
      const isLast = idx === milestoneMsgs.length - 1;
      list.push({
        id: `timeline-node-${e.id ?? idx}-${idx}`,
        title: cleaned,
        timeStr: formatTimeTabular(e.created_at) || "Recent",
        isCurrent: isLast,
        variant: isLast ? "info" : "neutral"
      });
    });

    // If no milestone events, show created + current status
    if (list.length === 0) {
      if (createdAt) {
        list.push({
          id: "created",
          title: "Order placed & registered",
          timeStr: formatTimeTabular(createdAt) || "",
          isCurrent: false,
          variant: "neutral"
        });
      }
      if (currentStatus) {
        const hs = formatHumanStatus(currentStatus);
        list.push({
          id: "current",
          title: `Current status: ${hs.label}`,
          timeStr: "Active",
          isCurrent: true,
          variant: hs.variant
        });
      }
    }

    return list;
  }, [systemEvents, currentStatus, createdAt]);

  if (timelineItems.length === 0) {
    return (
      <div className="text-xs text-[var(--oc-text-tertiary)] italic p-2 text-center">
        No status history recorded yet
      </div>
    );
  }

  return (
    <div className="relative pl-4 space-y-3.5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--oc-border)]">
      {timelineItems.map((item, idx) => {
        const isLatest = idx === timelineItems.length - 1;
        return (
          <div key={item.id} className="relative flex items-start justify-between gap-2 text-xs">
            {/* Timeline node icon */}
            <span
              className={`absolute -left-4 mt-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center border transition-colors ${
                isLatest
                  ? "bg-[var(--oc-brand-600)] border-[var(--oc-brand-600)] text-white shadow-xs"
                  : "bg-[var(--oc-bg-panel)] border-[var(--oc-border-strong)] text-[var(--oc-text-tertiary)]"
              }`}
            >
              {isLatest ? (
                <CheckCircle2 className="h-2.5 w-2.5 stroke-[3]" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-[var(--oc-text-tertiary)]" />
              )}
            </span>

            {/* Label */}
            <div className="min-w-0 flex-1 pl-1">
              <span className={`block leading-snug font-medium ${isLatest ? "text-[var(--oc-text-primary)] font-semibold" : "text-[var(--oc-text-secondary)]"}`}>
                {item.title}
              </span>
            </div>

            {/* Timestamp */}
            {item.timeStr && (
              <span className="text-[11px] font-mono text-[var(--oc-text-tertiary)] shrink-0 tabular-nums">
                {item.timeStr}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
