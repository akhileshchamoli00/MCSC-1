"use client"

import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 bg-transparent">
          {language.toUpperCase()}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("en")}>English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("id")}>Indonesia</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("cn")}>Chinese (Mandarin)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
