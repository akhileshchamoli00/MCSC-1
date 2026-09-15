"use client"

import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import Image from "next/image"

export function AskLogo({ className = "h-9 sm:h-11 xl:h-12 2xl:h-14 w-auto", size }: { className?: string, size?: number }) {
  const { language } = useLanguage()
  const t = translations[language]

  const isEnglish = language === "en"
  const isChinese = language === "cn"
  const textSizeClass = isChinese
    ? "text-[8px] sm:text-[9.5px] 2xl:text-[11px]"
    : (isEnglish ? "text-[7px] sm:text-[8px] xl:text-[8.5px] 2xl:text-[10px]" : "text-[6.8px] sm:text-[7.5px] xl:text-[8px] 2xl:text-[9.5px]")

  return (
    <div className="flex flex-col items-start gap-0.5 sm:gap-1">
      <div className="relative">
        <Image
          src="/logo.png"
          alt="MCS Consulting Logo"
          width={1024}
          height={192}
          priority
          className={`${className} dark:hidden object-contain`}
          style={size ? { height: size, width: 'auto' } : undefined}
        />
        <Image
          src="/logo-dark.png"
          alt="MCS Consulting Logo"
          width={1024}
          height={192}
          priority
          className={`${className} hidden dark:block object-contain`}
          style={size ? { height: size, width: 'auto' } : undefined}
        />
      </div>
      <span className={`${textSizeClass} font-bold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-black dark:text-white whitespace-nowrap select-none transition-colors duration-300 mt-0.5`}>
        {t.logoSubtext}
      </span>
    </div>
  )
}

