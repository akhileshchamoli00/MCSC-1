"use client";

import React from "react";

interface DateSeparatorProps {
  label: string;
}

export function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <div className="relative my-4 flex items-center justify-center select-none" role="separator" aria-label={label}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-[var(--oc-border)] opacity-70" />
      </div>
      <div className="relative px-3 py-0.5 rounded-full bg-white/90 dark:bg-[#18181C]/90 backdrop-blur-xs border border-zinc-200 dark:border-white/15 shadow-xs">
        <span className="text-[11px] font-medium text-[var(--oc-text-secondary)] dark:text-zinc-300 tracking-wide">
          {label}
        </span>
      </div>
    </div>
  );
}
