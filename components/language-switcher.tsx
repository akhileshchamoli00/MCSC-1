"use client"
 
import { useLanguage } from "@/contexts/language-context"
 
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
 
  const languages = [
    { code: "en", label: "EN" },
    { code: "id", label: "ID" },
    { code: "cn", label: "中文" }
  ]

  const labelMap = {
    en: "Language",
    id: "Bahasa",
    cn: "语言"
  }[language] || "Language"
 
  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Label above the pills */}
      <span className="text-[8px] 2xl:text-[8.5px] font-mono font-semibold tracking-wider text-muted-foreground uppercase opacity-75 select-none">
        {labelMap}
      </span>
      
      {/* Compact inline pills */}
      <div className="flex items-center gap-0.5 rounded-full border border-border/50 bg-background/30 backdrop-blur-md p-0.5 shadow-xs">
        {languages.map((lang) => {
          const isActive = language === lang.code
          return (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as any)}
              className={`rounded-full px-1.5 2xl:px-2.5 py-0.5 2xl:py-1 text-[10px] 2xl:text-[11px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-xs scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              {lang.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
