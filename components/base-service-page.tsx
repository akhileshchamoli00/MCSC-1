"use client"

import { useLanguage } from "@/contexts/language-context"
import { CheckCircle2, ArrowRight, LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import BorderGlow from "./ui/BorderGlow"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SubService {
  title: { en: string; id: string; cn?: string }
  subtitle?: { en: string; id: string; cn?: string }
  price?: string
  items?: { en: string[]; id: string[]; cn?: string[] }
}

interface BaseServicePageProps {
  icon: LucideIcon
  title: { en: string; id: string; cn?: string }
  description: { en: string; id: string; cn?: string }
  subServices: SubService[]
  ctaText?: { en: string; id: string; cn?: string }
  ctaDescription?: { en: string; id: string; cn?: string }
}

export function BaseServicePage({
  icon: Icon,
  title,
  description,
  subServices,
  ctaText,
  ctaDescription,
}: BaseServicePageProps) {
  const { language } = useLanguage()

  const getTranslation = (obj: any, lang: string) => {
    if (!obj) return ""
    return obj[lang] || obj["en"] || obj["id"] || ""
  }

  const getTranslationArray = (obj: any, lang: string): string[] => {
    if (!obj) return []
    return obj[lang] || obj["en"] || obj["id"] || []
  }

  return (
    <main className="flex-grow relative z-10">
      {/* Hero Section */}
      <section className="pt-6 pb-4 md:pt-10 md:pb-6">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-8 backdrop-blur-sm border border-primary/20">
              <Icon className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl font-sans">
              {getTranslation(title, language)}
            </h1>
            <p className="text-xl text-muted-foreground text-pretty leading-relaxed max-w-3xl mx-auto">
              {getTranslation(description, language)}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="pt-4 pb-20 bg-background/20 backdrop-blur-[2px]">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {subServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
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
                  <Card className="h-full border-none bg-background/50 backdrop-blur-md transition-all duration-300 hover:bg-background/70 flex flex-col">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-2xl font-bold leading-tight mb-2">
                        {getTranslation(service.title, language)}
                      </CardTitle>
                      {service.subtitle && (
                        <CardDescription className="text-sm font-medium text-primary/80">
                          {getTranslation(service.subtitle, language)}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between">
                      {service.items && (
                        <ul className="space-y-4 mb-8">
                          {getTranslationArray(service.items, language).map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start gap-3 text-base">
                              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button className="w-full h-12 text-lg font-semibold group mt-auto" asChild>
                        <a href="https://wa.me/6285718189799" target="_blank" rel="noopener noreferrer">
                          {language === "en" ? "Consult Now" : (language === "cn" ? "立即咨询" : "Konsultasi Sekarang")}
                          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </BorderGlow>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-transparent p-12 backdrop-blur-md"
          >
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              {ctaText ? getTranslation(ctaText, language) : (language === "en" ? "Ready to Get Started?" : (language === "cn" ? "准备好开始了吗？" : "Siap untuk Memulai?"))}
            </h2>
            <p className="mb-10 text-xl text-muted-foreground leading-relaxed">
              {ctaDescription ? getTranslation(ctaDescription, language) : (language === "en"
                ? "Contact our experts today for a free consultation regarding your business needs."
                : (language === "cn" ? "立即联系我们的专家，就您的业务需求进行免费咨询。" : "Hubungi ahli kami hari ini untuk konsultasi gratis mengenai kebutuhan bisnis Anda."))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="default"
                className="h-14 px-10 text-lg rounded-full bg-primary text-primary-foreground hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 cursor-pointer"
                asChild
              >
                <a href="https://wa.me/6285718189799" target="_blank" rel="noopener noreferrer">
                  {language === "en" ? "WhatsApp Us" : (language === "cn" ? "WhatsApp 联系" : "WhatsApp Kami")}
                </a>
              </Button>
              <Button
                size="lg"
                variant="default"
                className="h-14 px-10 text-lg rounded-full bg-primary text-primary-foreground hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 cursor-pointer"
                asChild
              >
                <Link href="/contact">
                  {language === "en" ? "Contact Form" : (language === "cn" ? "联系表单" : "Formulir Kontak")}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
