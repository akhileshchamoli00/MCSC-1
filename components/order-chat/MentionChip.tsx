"use client";

import React from "react";

interface MentionChipProps {
  mentionText: string;
  isCurrentUser?: boolean;
}

export function MentionChip({ mentionText, isCurrentUser = false }: MentionChipProps) {
  const cleanText = mentionText.replace(/^@+/, "");
  return (
    <span
      className="inline-flex items-center max-w-full px-1.5 py-0.5 mx-0.5 rounded-md text-[12px] font-semibold leading-tight break-all transition-all align-baseline select-none border backdrop-blur-xs shadow-xs"
      style={{
        backgroundColor: isCurrentUser
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(255, 255, 255, 0.09)",
        borderColor: isCurrentUser
          ? "rgba(255, 255, 255, 0.28)"
          : "rgba(255, 255, 255, 0.16)",
        color: "inherit",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.70)"
      }}
    >
      <span className="opacity-70 mr-0.5 font-bold">@</span>
      {cleanText}
    </span>
  );
}

/**
 * Helper to parse a message string containing emails and `@Name` mentions into structured React nodes.
 * Accurately keeps email addresses intact (e.g. modsoul10@gmail.com is NOT broken or treated as a mention).
 */
export function renderMessageWithMentions(
  content: string,
  currentUserName?: string | null
): React.ReactNode {
  if (!content) return null;

  // Tokenization regex:
  // Group 1: Complete email addresses (e.g. modsoul10@gmail.com)
  // Group 2: User/team @mentions (e.g. @Team, @John Wick, @client)
  const tokenRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(@[A-Z][a-zA-Z0-9_\-\.]*(?:\s[A-Z][a-zA-Z0-9_\-\.]*)?|@[a-zA-Z0-9_\-\.]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(content)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(content.substring(lastIndex, matchIndex));
    }

    const emailMatch = match[1];
    const mentionMatch = match[2];

    if (emailMatch) {
      // Intact email address - render seamlessly as styled email text / mailto link
      parts.push(
        <a
          key={`email-${matchIndex}`}
          href={`mailto:${emailMatch}`}
          className="text-blue-500 dark:text-blue-400 hover:underline select-text"
          onClick={(e) => e.stopPropagation()}
        >
          {emailMatch}
        </a>
      );
    } else if (mentionMatch) {
      // Check if preceded by an alphanumeric character (in case of mid-word @)
      if (matchIndex > 0 && /[a-zA-Z0-9]/.test(content[matchIndex - 1])) {
        parts.push(mentionMatch);
      } else {
        const mentionName = mentionMatch.replace(/^@+/, "").trim();
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
      }
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts;
}
