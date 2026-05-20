"use client"
 
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/contexts/language-context"
 
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { language } = useLanguage()

  const labelMap = {
    en: "Theme",
    id: "Tema",
    cn: "主题"
  }[language] || "Theme"
 
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Label above the theme toggle */}
      <span className="text-[9px] font-mono font-bold tracking-widest text-muted-foreground uppercase opacity-80 select-none">
        {labelMap}
      </span>

      {/* Larger matching theme toggle button */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="relative inline-flex h-[46px] w-[46px] items-center justify-center rounded-full border border-border/40 bg-background/25 text-foreground backdrop-blur-md hover:bg-background/40 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-300 cursor-pointer shadow-sm"
      >
        <Sun className="h-[1.3rem] w-[1.3rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
        <Moon className="absolute h-[1.3rem] w-[1.3rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
        <span className="sr-only">Toggle theme</span>
      </button>
    </div>
  )
}
