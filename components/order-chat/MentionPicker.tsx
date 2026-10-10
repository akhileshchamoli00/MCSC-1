"use client";

import React, { useEffect, useRef } from "react";
import { Users, User, Shield } from "lucide-react";
import { TaggableUser } from "./types";

interface MentionPickerProps {
  candidates: TaggableUser[];
  selectedIndex: number;
  onSelect: (user: TaggableUser) => void;
  onClose: () => void;
}

export function MentionPicker({
  candidates,
  selectedIndex,
  onSelect,
  onClose
}: MentionPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep active item in view
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!candidates || candidates.length === 0) {
    return null;
  }

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 mb-2 w-72 max-h-56 overflow-y-auto rounded-lg bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)] border border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] shadow-md z-50 py-1"
      role="listbox"
      aria-label="Mention candidates"
    >
      <div className="px-3 py-1 text-[11px] font-semibold text-[var(--oc-text-tertiary)] uppercase tracking-wider">
        Mention person or team
      </div>

      {candidates.map((user, index) => {
        const isSelected = index === selectedIndex;
        const isTeam = user.type === "team" || user.type === "order_team";

        return (
          <button
            key={`${user.type}-${user.id}`}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(user)}
            className={`w-full px-3 py-1.5 flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
              isSelected
                ? "bg-[var(--oc-brand-50)] text-[var(--oc-brand-900)] dark:bg-[var(--oc-brand-950)] dark:text-[var(--oc-brand-100)]"
                : "hover:bg-[var(--oc-bg-subtle)] text-[var(--oc-text-primary)]"
            }`}
          >
            {/* Avatar / Icon */}
            <div className="w-6 h-6 rounded-full bg-[var(--oc-bg-subtle)] border border-[var(--oc-border)] flex items-center justify-center shrink-0 overflow-hidden text-[11px] font-semibold text-[var(--oc-text-secondary)]">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              ) : isTeam ? (
                <Users className="w-3.5 h-3.5 text-[var(--oc-brand-600)]" />
              ) : (
                user.displayName.charAt(0).toUpperCase()
              )}
            </div>

            {/* User info */}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium leading-snug truncate">
                {user.displayName}
              </div>
              <div className="text-[11px] text-[var(--oc-text-tertiary)] leading-tight truncate">
                {user.subtitle || (isTeam ? "Team" : user.job_title || "Consultant")}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
