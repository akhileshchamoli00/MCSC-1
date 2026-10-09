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
      <div className="relative px-3 py-0.5 rounded-full bg-[var(--oc-bg-panel)] border border-[var(--oc-border)] shadow-xs">
        <span className="text-[11px] font-medium text-[var(--oc-text-tertiary)] tracking-wide">
          {label}
        </span>
      </div>
    </div>
  );
}
