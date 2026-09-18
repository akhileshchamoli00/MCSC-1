"use client";

import React, { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Smile, Plus } from "lucide-react";
import { ChatEmojiPicker } from "@/components/chat-emoji-picker";

export interface MessageReactionUser {
  user_id: number;
  name: string;
  role?: string;
  avatar?: string;
  is_client?: boolean;
  is_self?: boolean;
}

export interface MessageReactionGroup {
  emoji: string;
  count: number;
  has_reacted: boolean;
  users: MessageReactionUser[];
}

export const WHATSAPP_QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface ChatMessageReactionsProps {
  reactions?: MessageReactionGroup[];
  onToggleReaction: (emoji: string) => void;
  isSelf?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * WhatsApp-style bottom reaction badges on messages
 */
export function ChatMessageReactions({
  reactions = [],
  onToggleReaction,
  isSelf = false,
  disabled = false,
  className
}: ChatMessageReactionsProps) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 mt-1 select-none ${
        isSelf ? "justify-end" : "justify-start"
      } ${className || ""}`}
    >
      <TooltipProvider delayDuration={150}>
        {reactions.map(group => {
          const names = group.users.map(u => (u.is_self ? "You" : u.name)).join(", ");
          return (
            <Tooltip key={group.emoji}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={e => {
                    e.stopPropagation();
                    onToggleReaction(group.emoji);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all transform active:scale-90 border shadow-2xs focus:outline-none ${
                    group.has_reacted
                      ? "bg-primary/15 dark:bg-primary/25 border-primary/50 text-primary dark:text-primary-foreground font-bold"
                      : "bg-background/90 dark:bg-zinc-800/90 hover:bg-muted dark:hover:bg-zinc-700/90 border-border/80 dark:border-zinc-700/80 text-foreground"
                  }`}
                  aria-label={`${group.emoji} reacted by ${names}`}
                >
                  <span className="text-sm leading-none">{group.emoji}</span>
                  {group.count > 1 && (
                    <span className="text-[11px] font-mono leading-none font-bold text-muted-foreground ml-0.5">
                      {group.count}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                sideOffset={6}
                collisionPadding={12}
                className="z-[99999] max-w-xs px-2.5 py-1.5 rounded-xl bg-popover text-popover-foreground border border-border shadow-xl backdrop-blur-md text-xs text-left [&_.rotate-45]:hidden"
              >
                <div className="flex items-center gap-1.5 font-bold pb-0.5 border-b border-border/40 text-[10px] text-muted-foreground uppercase">
                  <span>{group.emoji}</span>
                  <span>Reactions ({group.count})</span>
                </div>
                <div className="pt-1 text-[11px] space-y-0.5 max-h-32 overflow-y-auto">
                  {group.users.map((u, i) => (
                    <div key={u.user_id || i} className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground truncate">
                        {u.is_self ? `${u.name} (You)` : u.name}
                      </span>
                      {u.role && (
                        <span className="text-[9px] text-muted-foreground truncate">
                          {u.role}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}

interface WhatsAppReactionHoverBarProps {
  onToggleReaction: (emoji: string) => void;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

/**
 * WhatsApp-style floating horizontal reaction pill bar (👍 ❤️ 😂 😮 😢 🙏 +)
 */
export function WhatsAppReactionHoverBar({
  onToggleReaction,
  disabled = false,
  align = "center",
  side = "top",
  className
}: WhatsAppReactionHoverBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`inline-flex items-center shrink-0 ${className || ""}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="h-6 w-6 rounded-full bg-background/80 dark:bg-zinc-800/80 hover:bg-muted dark:hover:bg-zinc-700/90 text-muted-foreground hover:text-foreground border border-border/60 dark:border-zinc-700 shadow-2xs flex items-center justify-center transition-all hover:scale-110 active:scale-95 focus:outline-none"
            title="React"
            aria-label="React with emoji"
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className="z-[99999] w-auto p-1 rounded-full bg-zinc-900/95 dark:bg-zinc-900/95 text-zinc-100 border border-zinc-700/80 shadow-2xl backdrop-blur-xl flex items-center gap-1 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 [&_.rotate-45]:hidden"
        >
          {WHATSAPP_QUICK_REACTIONS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onToggleReaction(emoji);
                setIsOpen(false);
              }}
              className="h-8 w-8 rounded-full hover:bg-white/15 flex items-center justify-center text-xl transition-transform duration-150 transform hover:scale-135 active:scale-95 select-none"
              title={emoji}
            >
              {emoji}
            </button>
          ))}

          <div className="h-4 w-px bg-zinc-700/80 mx-0.5" />

          {/* Plus button to open full emoji picker */}
          <ChatEmojiPicker
            onSelectEmoji={emoji => {
              onToggleReaction(emoji);
              setIsOpen(false);
            }}
            side="top"
            align={align}
            trigger={
              <button
                type="button"
                className="h-7 w-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-transform hover:scale-115 active:scale-95 select-none"
                title="More Emojis"
              >
                <Plus className="h-4 w-4" />
              </button>
            }
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Alias for backwards compatibility
export const QuickReactionTrigger = WhatsAppReactionHoverBar;
export const QUICK_REACTIONS = WHATSAPP_QUICK_REACTIONS;
