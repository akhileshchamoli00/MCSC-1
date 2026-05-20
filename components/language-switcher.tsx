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
    en: "Select Language",
    id: "Pilih Bahasa",
    cn: "选择语言"
  }[language] || "Select Language"
 
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Label above the pills */}
      <span className="text-[9px] font-mono font-bold tracking-widest text-muted-foreground uppercase opacity-80 select-none">
        {labelMap}
      </span>
      
      {/* Super Premium Larger inline pills */}
      <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/25 backdrop-blur-md p-1 shadow-sm">
        {languages.map((lang) => {
          const isActive = language === lang.code
          return (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as any)}
              className={`rounded-full px-5 py-2.5 text-[13px] font-bold uppercase transition-all duration-300 cursor-pointer ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md scale-105" 
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
