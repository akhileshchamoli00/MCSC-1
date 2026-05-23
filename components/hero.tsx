"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export function Hero() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <section
      id="home"
      className="relative flex min-h-[85vh] items-center justify-center overflow-hidden py-24 lg:py-32"
    >
      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center space-y-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-sans text-5xl font-bold leading-[1.15] tracking-tight text-foreground md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground/90 to-foreground/70"
            >
              {t.hero.title || "Streamline Business Licensing. Instantly."}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground md:text-2xl"
            >
              {t.hero.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap justify-center gap-4 pt-6"
            >
              <Button
                variant="default"
                size="lg"
                className="group h-14 gap-2 px-8 text-base font-medium transition-all duration-300 rounded-full bg-primary text-primary-foreground hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 cursor-pointer"
                asChild
              >
                <Link href="/contact">
                  {t.hero.cta}
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
