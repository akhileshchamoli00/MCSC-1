"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { HeroVisual } from "./hero-visual"

export function Hero() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <section
      id="home"
      className="relative flex min-h-[90vh] items-center justify-center overflow-hidden py-16 lg:py-0"
    >
      <div className="container relative z-10 mx-auto px-4 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Interactive Animated Experience */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="order-2 lg:order-1 flex justify-center items-center"
          >
            <HeroVisual />
          </motion.div>

          {/* Right: Text Content */}
          <div className="order-1 lg:order-2 space-y-8 text-center lg:text-left">
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
                className="font-serif text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl"
              >
                {t.hero.title || "Streamline Business Licensing. Instantly."}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mx-auto lg:mx-0 max-w-2xl text-xl leading-relaxed text-muted-foreground md:text-2xl"
              >
                {t.hero.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="group h-14 gap-2 px-8 text-base font-medium shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-background/50 backdrop-blur-sm"
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
      </div>
    </section>
  )
}
