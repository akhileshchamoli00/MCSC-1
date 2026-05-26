"use client"

import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"

export function AskLogo({ className = "h-11 w-auto", size }: { className?: string, size?: number }) {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="relative">
        <img 
          src="/logo.png" 
          alt="MCS Consulting Logo" 
          className={`${className} dark:hidden`}
          style={size ? { height: size } : undefined}
        />
        <img 
          src="/logo-dark.png" 
          alt="MCS Consulting Logo" 
          className={`${className} hidden dark:block`}
          style={size ? { height: size } : undefined}
        />
      </div>
      <span className="text-[7.5px] sm:text-[9.5px] font-bold uppercase tracking-[0.12em] text-black dark:text-white whitespace-nowrap select-none transition-colors duration-300 mt-0.5">
        {t.logoSubtext}
      </span>
    </div>
  )
}

