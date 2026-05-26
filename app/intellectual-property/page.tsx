"use client"

import { Lightbulb, ArrowRight } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { motion } from "framer-motion"
import Link from "next/link"
import BorderGlow from "@/components/ui/BorderGlow"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function IntellectualPropertyPage() {
  const { language } = useLanguage()
  const t = translations[language]

  const title = {
    en: "Intellectual Property",
    id: "Kekayaan Intelektual",
  }

  const description = {
    en: "IPR is a legal right granted to protect the intellectual work and innovation of a person or entity. Choose an option below to proceed.",
    id: "HKI adalah hak hukum yang diberikan untuk melindungi karya intelektual dan inovasi seseorang atau entitas. Pilih opsi di bawah untuk melanjutkan.",
  }

  const getTranslation = (obj: any, lang: string) => {
    if (!obj) return ""
    return obj[lang] || obj["en"] || obj["id"] || ""
  }

  const cards = [
    {
      title: t.nav.brandClassification,
      href: "/intellectual-property/brand-classification",
      description: {
        en: "Classify your brand according to the international trademark classification system.",
        id: "Klasifikasikan merek Anda sesuai dengan sistem klasifikasi merek internasional.",
      }
    },
    {
      title: t.nav.checkApplicationStatus,
      href: "/intellectual-property/check-application-status",
      description: {
        en: "Check the current status of your intellectual property application.",
        id: "Periksa status permohonan kekayaan intelektual Anda saat ini.",
      }
    }
  ]

  return (
    <main className="flex-grow relative z-10 flex flex-col">
      {/* Hero Section */}
      <section className="pt-4 pb-8 md:pt-8 md:pb-16 relative overflow-hidden">
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-5 py-2 mb-8 text-sm font-semibold text-primary backdrop-blur-md shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2.5 animate-pulse"></span>
              {language === 'en' ? 'Protect Your Future' : 'Lindungi Masa Depan Anda'}
            </motion.div>

            <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl font-sans">
              <span className="bg-gradient-to-r from-foreground via-foreground/90 to-primary/80 bg-clip-text text-transparent drop-shadow-sm">
                {getTranslation(title, language)}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty leading-relaxed max-w-3xl mx-auto font-medium">
              {getTranslation(description, language)}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="pb-16 flex-grow">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full"
              >
                <Link href={card.href} className="block h-full cursor-pointer group">
                  <BorderGlow
                    edgeSensitivity={30}
                    glowColor="220 80 80"
                    backgroundColor="transparent"
                    borderRadius={16}
                    glowRadius={40}
                    glowIntensity={1}
                    coneSpread={25}
                    animated={false}
                    colors={['#1e40af', '#10b981', '#f97316']}
                    className="h-full"
                  >
                    <Card className="h-full border-none bg-background/50 backdrop-blur-md transition-all duration-300 group-hover:bg-background/80 group-hover:-translate-y-1 flex flex-col justify-center items-center text-center p-8">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-3xl font-bold leading-tight group-hover:text-primary transition-colors">
                          {card.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-6 text-lg">
                          {getTranslation(card.description, language)}
                        </p>
                        <div className="inline-flex items-center text-primary font-semibold text-lg">
                          {language === 'en' ? 'Get Started' : 'Mulai Sekarang'}
                          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </BorderGlow>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
