"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Language } from "@/lib/translations"
import { usePathname, useRouter } from "next/navigation"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  
  // Infer initial language from URL, default to "en"
  const langMatch = pathname?.match(/^\/(en|id|cn)(?:\/|$)/)
  const initialLang = (langMatch?.[1] as Language) || "en"
  
  const [language, setLanguageState] = useState<Language>(initialLang)

  // Sync state if pathname changes externally
  useEffect(() => {
    if (langMatch?.[1] && langMatch[1] !== language) {
      setLanguageState(langMatch[1] as Language)
    }
  }, [pathname])

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang)
    
    // Auto-update URL when language changes
    if (pathname) {
      const currentLangMatch = pathname.match(/^\/(en|id|cn)(?:\/|$)/)
      if (currentLangMatch) {
        const newPath = pathname.replace(/^\/(en|id|cn)/, `/${newLang}`)
        router.push(newPath)
      }
    }
  }

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
