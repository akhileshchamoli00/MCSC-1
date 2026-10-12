"use client";

import React, { useEffect, useRef, useState } from "react";
import { Users, User, Shield } from "lucide-react";
import { TaggableUser } from "./types";
import { resolveImageUrl } from "@/lib/utils";

interface MentionPickerProps {
  candidates: TaggableUser[];
  selectedIndex: number;
  onSelect: (user: TaggableUser) => void;
  onClose: () => void;
}

function CandidateAvatar({ user }: { user: TaggableUser }) {
  const [imgError, setImgError] = useState(false);
  const isTeam = user.type === "team" || user.type === "order_team";

  if (isTeam) {
    return (
      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-700/60 flex items-center justify-center shrink-0 shadow-2xs">
        <Users className="w-3.5 h-3.5" />
      </div>
    );
  }

  const resolvedUrl = user.avatar ? resolveImageUrl(user.avatar) : null;

  if (resolvedUrl && !imgError) {
    return (
      <div className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-2xs">
        <img
          src={resolvedUrl}
          alt={user.displayName}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback initial
  const name = user.displayName || "User";
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

  // Deterministic palette
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % 5;
  const colorClasses = [
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  ][colorIndex];

  return (
    <div
      className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-[10px] font-bold ${colorClasses}`}
    >
      {initials}
    </div>
  );
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
      const activeEl = listRef.current.children[selectedIndex + 1] as HTMLElement;
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
      className="absolute bottom-full left-0 mb-2 w-80 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-[#1E1E26] border border-zinc-200 dark:border-zinc-700/80 shadow-2xl z-50 py-1.5 backdrop-blur-md"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(125, 125, 125, 0.4) transparent"
      }}
      role="listbox"
      aria-label="Mention candidates"
    >
      <div className="px-3 py-1.5 text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/80 mb-1 flex items-center justify-between select-none">
        <span>Mention Person or Team</span>
        <span className="text-[9.5px] font-normal lowercase tracking-normal text-zinc-400 dark:text-zinc-500">
          ↑↓ navigate · ↵ select
        </span>
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
            className={`w-full px-3 py-2 flex items-center gap-2.5 text-left transition-colors cursor-pointer border-l-2 ${
              isSelected
                ? "bg-purple-50 dark:bg-purple-950/70 border-l-purple-600 dark:border-l-purple-400"
                : "border-l-transparent hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60"
            }`}
          >
            {/* Avatar / Icon */}
            <CandidateAvatar user={user} />

            {/* User info */}
            <div className="min-w-0 flex-1">
              <div
                className={`text-[13px] leading-snug truncate ${
                  isSelected
                    ? "font-bold text-purple-950 dark:text-purple-100"
                    : "font-medium text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {user.displayName}
              </div>
              <div
                className={`text-[11px] leading-tight truncate mt-0.5 ${
                  isSelected
                    ? "text-purple-700 dark:text-purple-300 font-medium"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {user.subtitle || (isTeam ? "Assigned Consultants & Reviewers" : user.job_title || "Consultant")}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
