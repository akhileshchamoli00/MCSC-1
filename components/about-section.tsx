"use client"

import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AboutSection() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <section id="about" className="pt-20 pb-10 md:pt-32 md:pb-16 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {t.about.title}
          </h2>
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="space-y-6">
            <p className="text-xl leading-relaxed text-muted-foreground md:text-2xl">
              {t.about.description}
            </p>
            <div className="pt-4">
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">{language === "en" ? "Read More" : "Baca Selengkapnya"}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
