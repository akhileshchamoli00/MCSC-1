"use client";

import React, { useState } from "react";
import { Activity, ChevronDown, ChevronUp, CheckCircle2, Clock } from "lucide-react";
import { ChatMessage } from "./types";
import { cleanMilestoneText, formatTimeTabular } from "./utils";

interface SystemEventProps {
  events: ChatMessage[];
}

export function SystemEventGroup({ events }: SystemEventProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!events || events.length === 0) return null;

  // Single event rendering
  if (events.length === 1) {
    const event = events[0];
    const cleaned = cleanMilestoneText(event.message);
    const time = formatTimeTabular(event.created_at);

    return (
      <div className="my-2.5 flex items-center justify-center gap-3 px-4 select-none">
        <div className="h-px flex-1 bg-[var(--oc-border)] opacity-60" />
        <div className="flex items-center gap-2 text-[12px] text-[var(--oc-text-tertiary)] max-w-[80%] text-center">
          <Activity className="w-3.5 h-3.5 shrink-0 text-[var(--oc-brand-500)] opacity-80" />
          <span className="font-medium text-[var(--oc-text-secondary)]">{cleaned}</span>
          {time && <span className="tabular-nums text-[11px] opacity-75">{time}</span>}
        </div>
        <div className="h-px flex-1 bg-[var(--oc-border)] opacity-60" />
      </div>
    );
  }

  // Multiple consecutive events: collapsible
  const latestEvent = events[events.length - 1];
  const count = events.length;

  return (
    <div className="my-2.5 px-4 select-none">
      <div className="flex items-center justify-center gap-3">
        <div className="h-px flex-1 bg-[var(--oc-border)] opacity-60" />
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-[var(--oc-text-secondary)] bg-[var(--oc-bg-subtle)] hover:bg-[var(--oc-bg-panel)] border border-[var(--oc-border)] transition-colors cursor-pointer group"
        >
          <Activity className="w-3 h-3 text-[var(--oc-brand-500)]" />
          <span>
            {count} status updates
            {!isExpanded && (
              <span className="text-[var(--oc-text-tertiary)] font-normal ml-1">
                · {cleanMilestoneText(latestEvent.message)}
              </span>
            )}
          </span>
          <span className="text-[var(--oc-text-tertiary)] group-hover:text-[var(--oc-text-primary)] transition-colors flex items-center">
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        </button>
        <div className="h-px flex-1 bg-[var(--oc-border)] opacity-60" />
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-1.5 pl-6 pr-2 border-l-2 border-[var(--oc-border)] max-w-lg mx-auto py-1">
          {events.map((evt, idx) => {
            const time = formatTimeTabular(evt.created_at);
            const text = cleanMilestoneText(evt.message);
            return (
              <div key={`sys-evt-${evt.id ?? idx}-${idx}`} className="flex items-start justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-1.5 text-[var(--oc-text-secondary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--oc-border-strong)] mt-0.5" />
                  <span>{text}</span>
                </div>
                {time && (
                  <span className="text-[var(--oc-text-tertiary)] tabular-nums shrink-0">
                    {time}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
