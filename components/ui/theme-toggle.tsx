"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/contexts/language-context"

export interface ThemeToggleProps {
  variant?: "default" | "segmented" | "compact"
  showLabel?: boolean
  className?: string
}

export function ThemeToggle({
  variant = "default",
  showLabel = false,
  className = ""
}: ThemeToggleProps) {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { language } = useLanguage()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? (theme || resolvedTheme || "light") : "light"
  const isDark = currentTheme === "dark"

  const labelMap = {
    en: { title: "Theme", light: "Light", dark: "Dark" },
    id: { title: "Tema", light: "Terang", dark: "Gelap" },
    cn: { title: "主题", light: "浅色", dark: "深色" }
  }[language] || { title: "Theme", light: "Light", dark: "Dark" }

  if (variant === "segmented") {
    return (
      <div className={`flex flex-col items-center gap-0.5 ${className}`}>
        {showLabel && (
          <span className="text-[8px] 2xl:text-[8.5px] font-mono font-semibold tracking-wider text-muted-foreground uppercase opacity-75 select-none">
            {labelMap.title}
          </span>
        )}
        <div className="flex items-center gap-0.5 rounded-full border border-border/50 bg-background/30 backdrop-blur-md p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => setTheme("light")}
            aria-label="Switch to Light Theme"
            className={`flex items-center gap-1 rounded-full px-1.5 2xl:px-2.5 py-0.5 2xl:py-1 text-[10px] 2xl:text-[11px] font-bold uppercase transition-all duration-200 cursor-pointer ${
              !isDark
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            <Sun className={`h-3 w-3 ${!isDark ? "text-amber-500 fill-amber-500/30" : "text-muted-foreground"}`} />
            <span className="hidden 2xl:inline text-[10px] tracking-wide">{labelMap.light}</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            aria-label="Switch to Dark Theme"
            className={`flex items-center gap-1 rounded-full px-1.5 2xl:px-2.5 py-0.5 2xl:py-1 text-[10px] 2xl:text-[11px] font-bold uppercase transition-all duration-200 cursor-pointer ${
              isDark
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            <Moon className={`h-3 w-3 ${isDark ? "text-sky-400 fill-sky-400/30" : "text-muted-foreground"}`} />
            <span className="hidden 2xl:inline text-[10px] tracking-wide">{labelMap.dark}</span>
          </button>
        </div>
      </div>
    )
  }

  // Default / Compact Button with high contrast and smooth animations
  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      {showLabel && (
        <span className="text-[8.5px] font-mono font-semibold tracking-wider text-muted-foreground uppercase opacity-75 select-none">
          {labelMap.title}
        </span>
      )}
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-background/80 dark:bg-zinc-900/90 text-foreground hover:border-primary/50 hover:bg-accent hover:shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all duration-200 cursor-pointer shadow-xs backdrop-blur-md group"
        title={`${labelMap.title}: ${isDark ? labelMap.dark : labelMap.light}`}
        aria-label="Toggle Theme"
      >
        <div className="relative h-3.5 w-3.5 flex items-center justify-center">
          <Sun className={`h-3.5 w-3.5 transition-all duration-300 text-amber-500 fill-amber-500/30 group-hover:rotate-45 ${
            isDark ? "-rotate-90 scale-0 opacity-0 absolute" : "rotate-0 scale-100 opacity-100"
          }`} />
          <Moon className={`h-3.5 w-3.5 transition-all duration-300 text-sky-400 fill-sky-400/30 group-hover:-rotate-12 ${
            isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0 absolute"
          }`} />
        </div>
        <span className="sr-only">Toggle theme</span>
      </button>
    </div>
  )
}
