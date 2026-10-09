"use client";

import React from "react";

interface MentionChipProps {
  mentionText: string;
  isCurrentUser?: boolean;
}

export function MentionChip({ mentionText, isCurrentUser = false }: MentionChipProps) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[12px] font-medium leading-none transition-colors align-baseline ${
        isCurrentUser
          ? "bg-[var(--oc-internal-500)] text-white shadow-xs font-semibold"
          : "bg-[var(--oc-internal-100)] text-[var(--oc-internal-700)] dark:bg-[var(--oc-internal-900)] dark:text-[var(--oc-internal-200)]"
      }`}
    >
      @{mentionText.replace(/^@/, "")}
    </span>
  );
}

/**
 * Helper to parse a message string containing `@Name` into structured React nodes.
 */
export function renderMessageWithMentions(
  content: string,
  currentUserName?: string | null
): React.ReactNode {
  if (!content) return null;

  // Regex to detect @mentions: matches @ followed by letters, numbers, spaces (up to 3 words)
  const mentionRegex = /@([a-zA-Z0-9_\-\.]+[\s]?[a-zA-Z0-9_\-\.]*)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(content)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(content.substring(lastIndex, matchIndex));
    }

    const mentionName = match[1].trim();
    const isSelf = Boolean(
      currentUserName &&
        (mentionName.toLowerCase() === currentUserName.toLowerCase() ||
          mentionName.toLowerCase() === "me" ||
          mentionName.toLowerCase() === "all" ||
          mentionName.toLowerCase() === "team")
    );

    parts.push(
      <MentionChip
        key={`mention-${matchIndex}`}
        mentionText={mentionName}
        isCurrentUser={isSelf}
      />
    );

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts;
}
