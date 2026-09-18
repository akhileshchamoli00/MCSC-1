"use client";

import React, { useState, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Smile, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface EmojiItem {
  emoji: string;
  name: string;
  category: string;
  keywords: string[];
}

export const EMOJI_CATEGORIES: { id: string; name: string; icon: string }[] = [
  { id: "smileys", name: "Smileys", icon: "😀" },
  { id: "gestures", name: "Gestures", icon: "👍" },
  { id: "hearts", name: "Hearts & Fun", icon: "❤️" },
  { id: "work", name: "Work & Objects", icon: "💼" },
  { id: "symbols", name: "Symbols", icon: "✅" }
];

export const QUICK_EMOJIS = ["👍", "❤️", "🙌", "🎉", "🔥", "🚀", "👀", "✅", "👏", "😊", "🙏", "💯"];

export const ALL_EMOJIS: EmojiItem[] = [
  // Smileys & Emotions
  { emoji: "😀", name: "Grinning Face", category: "smileys", keywords: ["grinning", "face", "happy", "smile"] },
  { emoji: "😃", name: "Smiling Face with Big Eyes", category: "smileys", keywords: ["smiling", "happy", "joy", "smile"] },
  { emoji: "😄", name: "Grinning Face with Smiling Eyes", category: "smileys", keywords: ["smile", "happy", "laugh"] },
  { emoji: "😁", name: "Beaming Face", category: "smileys", keywords: ["beaming", "grin", "teeth"] },
  { emoji: "😆", name: "Grinning Squinting Face", category: "smileys", keywords: ["laughing", "squint", "haha"] },
  { emoji: "😅", name: "Grinning Face with Sweat", category: "smileys", keywords: ["sweat", "nervous", "relief"] },
  { emoji: "🤣", name: "Rolling on the Floor Laughing", category: "smileys", keywords: ["rofl", "lol", "laugh"] },
  { emoji: "😂", name: "Face with Tears of Joy", category: "smileys", keywords: ["joy", "tears", "laugh", "funny"] },
  { emoji: "🙂", name: "Slightly Smiling Face", category: "smileys", keywords: ["smile", "polite", "okay"] },
  { emoji: "😊", name: "Smiling Face with Smiling Eyes", category: "smileys", keywords: ["warm", "happy", "blush"] },
  { emoji: "😇", name: "Smiling Face with Halo", category: "smileys", keywords: ["angel", "innocent", "good"] },
  { emoji: "🥰", name: "Smiling Face with Hearts", category: "smileys", keywords: ["love", "hearts", "adore"] },
  { emoji: "😍", name: "Heart Eyes", category: "smileys", keywords: ["love", "adore", "heart", "crush"] },
  { emoji: "🤩", name: "Star-Struck", category: "smileys", keywords: ["star", "excited", "wow", "amazing"] },
  { emoji: "😘", name: "Face Blowing a Kiss", category: "smileys", keywords: ["kiss", "love", "heart"] },
  { emoji: "😋", name: "Face Savoring Food", category: "smileys", keywords: ["yum", "delicious", "tasty"] },
  { emoji: "😎", name: "Smiling Face with Sunglasses", category: "smileys", keywords: ["cool", "sunglasses", "chill"] },
  { emoji: "🤓", name: "Nerd Face", category: "smileys", keywords: ["nerd", "geek", "glasses", "smart"] },
  { emoji: "🧐", name: "Face with Monocle", category: "smileys", keywords: ["inspect", "curious", "monocle"] },
  { emoji: "🤔", name: "Thinking Face", category: "smileys", keywords: ["think", "ponder", "wonder", "hmm"] },
  { emoji: "🫡", name: "Saluting Face", category: "smileys", keywords: ["salute", "respect", "yes sir", "understood"] },
  { emoji: "🤫", name: "Shushing Face", category: "smileys", keywords: ["quiet", "shh", "secret"] },
  { emoji: "🫢", name: "Face with Open Eyes and Hand Over Mouth", category: "smileys", keywords: ["shock", "gasp", "oops"] },
  { emoji: "😮", name: "Face with Open Mouth", category: "smileys", keywords: ["surprised", "wow", "gasp"] },
  { emoji: "😲", name: "Astonished Face", category: "smileys", keywords: ["astonished", "shocked", "omg"] },
  { emoji: "🥳", name: "Partying Face", category: "smileys", keywords: ["party", "celebrate", "congrats", "birthday"] },
  { emoji: "🥺", name: "Pleading Face", category: "smileys", keywords: ["pleading", "please", "puppy eyes"] },
  { emoji: "🥹", name: "Face Holding Back Tears", category: "smileys", keywords: ["grateful", "touched", "emotional"] },
  { emoji: "😭", name: "Loudly Crying Face", category: "smileys", keywords: ["cry", "sad", "tears", "sob"] },
  { emoji: "😤", name: "Face with Steam from Nose", category: "smileys", keywords: ["determined", "proud", "triumph"] },
  { emoji: "😴", name: "Sleeping Face", category: "smileys", keywords: ["sleep", "tired", "zzz"] },
  { emoji: "🤯", name: "Exploding Head", category: "smileys", keywords: ["mindblown", "shock", "boom"] },

  // Gestures & People
  { emoji: "👍", name: "Thumbs Up", category: "gestures", keywords: ["thumbs up", "like", "approve", "agree", "yes", "good"] },
  { emoji: "👎", name: "Thumbs Down", category: "gestures", keywords: ["thumbs down", "dislike", "no", "bad"] },
  { emoji: "👌", name: "OK Hand", category: "gestures", keywords: ["ok", "perfect", "good", "fine"] },
  { emoji: "✌️", name: "Victory Hand", category: "gestures", keywords: ["peace", "victory", "two"] },
  { emoji: "🤞", name: "Crossed Fingers", category: "gestures", keywords: ["luck", "hope", "wish"] },
  { emoji: "🤟", name: "Love-You Gesture", category: "gestures", keywords: ["love", "rock"] },
  { emoji: "🤘", name: "Sign of the Horns", category: "gestures", keywords: ["rock", "metal", "cool"] },
  { emoji: "🤙", name: "Call Me Hand", category: "gestures", keywords: ["call", "shaka", "hang loose"] },
  { emoji: "👈", name: "Backhand Index Pointing Left", category: "gestures", keywords: ["left", "point"] },
  { emoji: "👉", name: "Backhand Index Pointing Right", category: "gestures", keywords: ["right", "point"] },
  { emoji: "👆", name: "Backhand Index Pointing Up", category: "gestures", keywords: ["up", "point", "above"] },
  { emoji: "👇", name: "Backhand Index Pointing Down", category: "gestures", keywords: ["down", "point", "below"] },
  { emoji: "☝️", name: "Index Pointing Up", category: "gestures", keywords: ["up", "first", "one", "point"] },
  { emoji: "👏", name: "Clapping Hands", category: "gestures", keywords: ["clap", "applause", "bravo", "great job"] },
  { emoji: "🙌", name: "Raising Hands", category: "gestures", keywords: ["celebrate", "hooray", "praise", "cheers"] },
  { emoji: "👐", name: "Open Hands", category: "gestures", keywords: ["open", "hug"] },
  { emoji: "🤲", name: "Palms Up Together", category: "gestures", keywords: ["prayer", "receive", "dua"] },
  { emoji: "🤝", name: "Handshake", category: "gestures", keywords: ["deal", "agree", "partnership", "shake", "business"] },
  { emoji: "🙏", name: "Folded Hands", category: "gestures", keywords: ["pray", "thank you", "thanks", "please", "namaste"] },
  { emoji: "✍️", name: "Writing Hand", category: "gestures", keywords: ["write", "signature", "sign", "draft"] },
  { emoji: "💪", name: "Flexed Biceps", category: "gestures", keywords: ["strong", "power", "muscle", "workout", "effort"] },
  { emoji: "👋", name: "Waving Hand", category: "gestures", keywords: ["wave", "hello", "hi", "goodbye", "bye"] },

  // Hearts & Fun
  { emoji: "❤️", name: "Red Heart", category: "hearts", keywords: ["heart", "love", "like"] },
  { emoji: "🧡", name: "Orange Heart", category: "hearts", keywords: ["orange", "heart", "love"] },
  { emoji: "💛", name: "Yellow Heart", category: "hearts", keywords: ["yellow", "heart", "friendship"] },
  { emoji: "💚", name: "Green Heart", category: "hearts", keywords: ["green", "heart", "nature"] },
  { emoji: "💙", name: "Blue Heart", category: "hearts", keywords: ["blue", "heart", "trust", "loyalty"] },
  { emoji: "💜", name: "Purple Heart", category: "hearts", keywords: ["purple", "heart"] },
  { emoji: "🖤", name: "Black Heart", category: "hearts", keywords: ["black", "heart"] },
  { emoji: "🤍", name: "White Heart", category: "hearts", keywords: ["white", "heart", "peace"] },
  { emoji: "💖", name: "Sparkling Heart", category: "hearts", keywords: ["sparkle", "heart", "love"] },
  { emoji: "💘", name: "Heart with Arrow", category: "hearts", keywords: ["cupid", "love", "arrow"] },
  { emoji: "🔥", name: "Fire", category: "hearts", keywords: ["fire", "hot", "lit", "trending", "great"] },
  { emoji: "✨", name: "Sparkles", category: "hearts", keywords: ["sparkle", "stars", "clean", "magic", "new"] },
  { emoji: "⭐", name: "Star", category: "hearts", keywords: ["star", "favorite", "rating", "vip"] },
  { emoji: "🌟", name: "Glowing Star", category: "hearts", keywords: ["star", "glow", "special"] },
  { emoji: "🎉", name: "Party Popper", category: "hearts", keywords: ["party", "celebration", "tada", "congratulations", "win"] },
  { emoji: "🎊", name: "Confetti Ball", category: "hearts", keywords: ["confetti", "party", "celebration"] },
  { emoji: "🎈", name: "Balloon", category: "hearts", keywords: ["balloon", "party"] },
  { emoji: "🎁", name: "Wrapped Gift", category: "hearts", keywords: ["gift", "present", "reward"] },
  { emoji: "🏆", name: "Trophy", category: "hearts", keywords: ["trophy", "winner", "award", "success", "champion"] },
  { emoji: "🥇", name: "1st Place Medal", category: "hearts", keywords: ["first", "gold", "medal", "champion"] },

  // Work & Objects
  { emoji: "💼", name: "Briefcase", category: "work", keywords: ["briefcase", "work", "business", "job"] },
  { emoji: "📁", name: "File Folder", category: "work", keywords: ["folder", "file", "directory", "docs"] },
  { emoji: "📂", name: "Open File Folder", category: "work", keywords: ["folder", "open", "files"] },
  { emoji: "📄", name: "Page Facing Up", category: "work", keywords: ["document", "page", "file", "paper", "contract"] },
  { emoji: "📑", name: "Bookmark Tabs", category: "work", keywords: ["tabs", "documents", "reports"] },
  { emoji: "📊", name: "Bar Chart", category: "work", keywords: ["chart", "analytics", "stats", "graph", "metrics"] },
  { emoji: "📈", name: "Chart Increasing", category: "work", keywords: ["trend", "growth", "up", "profit", "success"] },
  { emoji: "📉", name: "Chart Decreasing", category: "work", keywords: ["chart", "down", "loss"] },
  { emoji: "📋", name: "Clipboard", category: "work", keywords: ["clipboard", "checklist", "tasks", "notes"] },
  { emoji: "📌", name: "Pushpin", category: "work", keywords: ["pin", "notice", "pinned", "important"] },
  { emoji: "📍", name: "Round Pushpin", category: "work", keywords: ["location", "pin", "place"] },
  { emoji: "📎", name: "Paperclip", category: "work", keywords: ["paperclip", "attachment", "attach", "file"] },
  { emoji: "📏", name: "Straight Ruler", category: "work", keywords: ["ruler", "measure"] },
  { emoji: "📐", name: "Triangular Ruler", category: "work", keywords: ["ruler", "architecture", "plan"] },
  { emoji: "✒️", name: "Black Nib", category: "work", keywords: ["pen", "sign", "signature", "ink"] },
  { emoji: "📝", name: "Memo", category: "work", keywords: ["note", "memo", "write", "document", "draft"] },
  { emoji: "💻", name: "Laptop", category: "work", keywords: ["laptop", "computer", "tech", "work"] },
  { emoji: "🖥️", name: "Desktop Computer", category: "work", keywords: ["desktop", "monitor", "pc"] },
  { emoji: "🖨️", name: "Printer", category: "work", keywords: ["printer", "print", "hardcopy"] },
  { emoji: "📱", name: "Mobile Phone", category: "work", keywords: ["phone", "mobile", "cell", "call"] },
  { emoji: "📞", name: "Telephone Receiver", category: "work", keywords: ["phone", "call", "hotline"] },
  { emoji: "✉️", name: "Envelope", category: "work", keywords: ["email", "mail", "letter", "message"] },
  { emoji: "📧", name: "E-Mail", category: "work", keywords: ["email", "inbox", "send"] },
  { emoji: "📦", name: "Package", category: "work", keywords: ["package", "box", "delivery", "order", "parcel"] },
  { emoji: "🚀", name: "Rocket", category: "work", keywords: ["rocket", "launch", "fast", "speed", "progress"] },
  { emoji: "⏳", name: "Hourglass Not Done", category: "work", keywords: ["time", "wait", "pending", "processing", "loading"] },
  { emoji: "⌛", name: "Hourglass Done", category: "work", keywords: ["done", "time", "expired"] },
  { emoji: "⏰", name: "Alarm Clock", category: "work", keywords: ["clock", "alarm", "deadline", "reminder"] },
  { emoji: "🗓️", name: "Spiral Calendar", category: "work", keywords: ["calendar", "date", "schedule"] },
  { emoji: "💡", name: "Light Bulb", category: "work", keywords: ["idea", "tip", "smart", "solution", "insight"] },
  { emoji: "🔍", name: "Magnifying Glass Left", category: "work", keywords: ["search", "find", "review", "audit", "inspect"] },
  { emoji: "🔒", name: "Locked", category: "work", keywords: ["lock", "secure", "private", "confidential"] },
  { emoji: "🔓", name: "Unlocked", category: "work", keywords: ["unlock", "open", "access"] },
  { emoji: "🏢", name: "Office Building", category: "work", keywords: ["office", "building", "company", "corporate"] },
  { emoji: "🏦", name: "Bank", category: "work", keywords: ["bank", "finance", "money"] },
  { emoji: "💳", name: "Credit Card", category: "work", keywords: ["card", "payment", "pay", "money", "invoice"] },
  { emoji: "💰", name: "Money Bag", category: "work", keywords: ["money", "cash", "wealth", "paid"] },
  { emoji: "💵", name: "Dollar Banknote", category: "work", keywords: ["dollar", "cash", "currency", "payment"] },

  // Symbols
  { emoji: "✅", name: "Check Mark Button", category: "symbols", keywords: ["check", "done", "yes", "completed", "approved", "verified"] },
  { emoji: "☑️", name: "Check Box with Check", category: "symbols", keywords: ["checkbox", "check", "task", "done"] },
  { emoji: "✔️", name: "Check Mark", category: "symbols", keywords: ["check", "correct", "verified"] },
  { emoji: "❌", name: "Cross Mark", category: "symbols", keywords: ["x", "no", "cancel", "rejected", "error"] },
  { emoji: "❎", name: "Cross Mark Button", category: "symbols", keywords: ["cross", "x", "delete"] },
  { emoji: "⚠️", name: "Warning", category: "symbols", keywords: ["warning", "alert", "caution", "notice"] },
  { emoji: "🚫", name: "Prohibited", category: "symbols", keywords: ["no", "forbidden", "stop"] },
  { emoji: "⛔", name: "No Entry", category: "symbols", keywords: ["stop", "blocked", "hold"] },
  { emoji: "⏸️", name: "Pause Button", category: "symbols", keywords: ["pause", "hold", "wait"] },
  { emoji: "▶️", name: "Play Button", category: "symbols", keywords: ["play", "start", "resume"] },
  { emoji: "🔄", name: "Counterclockwise Arrows Button", category: "symbols", keywords: ["sync", "refresh", "update", "reload"] },
  { emoji: "ℹ️", name: "Information", category: "symbols", keywords: ["info", "help", "detail"] },
  { emoji: "💯", name: "Hundred Points", category: "symbols", keywords: ["100", "perfect", "score", "excellent"] },
  { emoji: "🔔", name: "Bell", category: "symbols", keywords: ["notification", "alert", "reminder", "bell"] },
  { emoji: "🔕", name: "Bell with Slash", category: "symbols", keywords: ["mute", "silent"] },
  { emoji: "⚡", name: "High Voltage", category: "symbols", keywords: ["fast", "lightning", "urgent", "power"] },
  { emoji: "🎯", name: "Direct Hit", category: "symbols", keywords: ["target", "goal", "bullseye", "focus"] },
  { emoji: "👀", name: "Eyes", category: "symbols", keywords: ["eyes", "look", "review", "seen", "watching"] }
];

interface ChatEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  className?: string;
}

export function ChatEmojiPicker({
  onSelectEmoji,
  trigger,
  align = "end",
  side = "top",
  sideOffset = 8,
  className
}: ChatEmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredEmojis = useMemo(() => {
    let list = ALL_EMOJIS;
    if (selectedCategory !== "all") {
      list = list.filter(e => e.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        e =>
          e.name.toLowerCase().includes(q) ||
          e.emoji.includes(q) ||
          e.keywords.some(k => k.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, selectedCategory]);

  const handlePick = (emoji: string) => {
    onSelectEmoji(emoji);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <button
            type="button"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus:outline-none"
            title="Insert Emoji"
          >
            <Smile className="h-4 w-4" />
          </button>
        )}
      </PopoverTrigger>
        <PopoverContent
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={16}
          className={`z-[99999] w-[320px] sm:w-[350px] p-0 rounded-2xl bg-popover/95 text-popover-foreground border border-border shadow-2xl backdrop-blur-xl overflow-hidden [&_.rotate-45]:hidden ${className || ""}`}
        >
          {/* Header & Search */}
          <div className="p-2.5 border-b border-border/50 bg-muted/30 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search emojis..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="pl-8 pr-7 h-8 text-xs rounded-xl bg-background/80 border-border/60 focus:border-primary/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Quick Emojis Row */}
            {!search && (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1 shrink-0">
                  Quick:
                </span>
                {QUICK_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handlePick(emoji)}
                    className="h-7 w-7 rounded-lg hover:bg-primary/15 hover:scale-115 active:scale-95 transition-all flex items-center justify-center text-sm shrink-0"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Category Tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-muted/60 rounded-xl border border-border/40 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`flex-1 py-1 rounded-lg font-bold transition-all text-center ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              {EMOJI_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-1 py-1 rounded-lg text-sm transition-all text-center ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground opacity-75 hover:opacity-100"
                  }`}
                  title={cat.name}
                >
                  {cat.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji Grid Stream */}
          <div className="p-2.5 max-h-[220px] overflow-y-auto overscroll-contain">
            {filteredEmojis.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground space-y-1">
                <Smile className="h-6 w-6 mx-auto opacity-40 mb-1" />
                <p className="text-xs font-semibold">No emojis found</p>
                <p className="text-[10px] text-muted-foreground">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
                {filteredEmojis.map(item => (
                  <button
                    key={`${item.emoji}-${item.name}`}
                    type="button"
                    onClick={() => handlePick(item.emoji)}
                    title={item.name}
                    className="h-8 w-8 rounded-lg hover:bg-primary/15 hover:scale-120 active:scale-95 transition-transform flex items-center justify-center text-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
    </Popover>
  );
}
