"use client";

import React from "react";
import { MessageSquareDashed, Lock, Sparkles, ArrowRight } from "lucide-react";
import { ChannelType } from "./types";

interface EmptyStateProps {
  channel: ChannelType;
  onSelectSuggestion?: (suggestionText: string) => void;
  orderNumber?: string | null;
  orderStatus?: string;
  hideSuggestions?: boolean;
}

export function EmptyState({ channel, onSelectSuggestion, orderNumber, orderStatus, hideSuggestions }: EmptyStateProps) {
  const isInternal = channel === "INTERNAL";

  const isInquiryOrder = Boolean(
    hideSuggestions ||
    (orderNumber && (orderNumber.toUpperCase().startsWith("MCSX-") || orderNumber.toUpperCase().startsWith("INQ-"))) ||
    (orderStatus && ["UNDER_INITIAL_CHECK", "NEED_MORE_INFO", "CHECK_COMPLETED", "PIPELINE", "PROSPECT", "BEING_CHECKED", "ENQUIRY", "DRAFT"].includes(orderStatus.toUpperCase()))
  );

  const suggestions = isInternal
    ? [
        "Reviewing corporate documents and identity records.",
        "Awaiting notary appointment confirmation.",
        "All requirements verified. Ready for government processing."
      ]
    : [
        "Hello! We have begun reviewing your order.",
        "Could you please confirm the latest trade license documents?",
        "Your business registration dossier is in final review."
      ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none animate-fadeIn">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform ${
          isInternal
            ? "bg-[var(--oc-internal-50)] text-[var(--oc-internal-600)] border border-[var(--oc-internal-200)]"
            : "bg-[var(--oc-brand-50)] text-[var(--oc-brand-600)] border border-[var(--oc-brand-200)]"
        }`}
      >
        {isInternal ? (
          <Lock className="w-6 h-6 stroke-[1.75]" />
        ) : (
          <MessageSquareDashed className="w-6 h-6 stroke-[1.75]" />
        )}
      </div>

      <h3 className="text-sm font-semibold text-[var(--oc-text-primary)] mb-1">
        {isInternal ? "No internal notes yet" : "No messages with the client yet"}
      </h3>
      <p className="text-xs text-[var(--oc-text-tertiary)] max-w-sm mb-6 leading-relaxed">
        {isInternal
          ? "Use this private channel to coordinate with consultants, tag teammates, or record processing milestones."
          : "Start the conversation with the client or wait for inquiries. All participants on this order will be notified."}
      </p>

      {!isInquiryOrder && onSelectSuggestion && (
        <div className="flex flex-col items-center gap-2 max-w-md w-full">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--oc-text-tertiary)] uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-[var(--oc-brand-500)]" />
            Quick suggestions
          </div>
          <div className="flex flex-col gap-1.5 w-full">
            {suggestions.map((text, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSuggestion(text)}
                className="group w-full px-3.5 py-2 rounded-lg text-xs text-left bg-[var(--oc-bg-panel)] hover:bg-[var(--oc-bg-subtle)] border border-[var(--oc-border)] hover:border-[var(--oc-border-strong)] text-[var(--oc-text-secondary)] hover:text-[var(--oc-text-primary)] transition-all flex items-center justify-between shadow-2xs"
              >
                <span className="truncate pr-2 font-medium">{text}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[var(--oc-brand-600)] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
