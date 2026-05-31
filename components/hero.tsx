"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import Link from "next/link"
import { ArrowRight, MessageCircle } from "lucide-react"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Side: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 text-center lg:text-left"
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
              className="mx-auto lg:mx-0 max-w-3xl text-xl leading-relaxed text-muted-foreground md:text-2xl"
            >
              {t.hero.description}
            </motion.p>
          </motion.div>

          {/* Right Side: CTA Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="bg-white dark:bg-zinc-950/80 border border-black/5 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none rounded-3xl p-8 md:p-10 relative overflow-hidden transition-transform duration-300 hover:-translate-y-1">
              <div className="relative z-10 text-center">
                <h3 className="font-sans text-3xl font-bold mb-4 text-foreground">
                  {t.stats?.cta?.title || "Ready to Start Your Business in Indonesia?"}
                </h3>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  {t.stats?.cta?.description || "Whether you're establishing a local company, registering a foreign-owned business (PT PMA), or obtaining business licenses, our team is ready to help."}
                </p>
                <div className="flex flex-col gap-4 group-hover:translate-x-0">
                  <Button asChild size="lg" className="group w-full h-14 gap-2 px-8 text-base font-medium transition-all duration-300 rounded-full bg-primary text-primary-foreground hover:bg-foreground hover:text-background dark:hover:bg-white dark:hover:text-black hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 hover:shadow-xl">
                    <Link href="/contact">
                      {t.stats?.cta?.scheduleBtn || "Schedule a Consultation"}
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full h-14 gap-2 px-8 text-base font-medium transition-all duration-300 rounded-full hover:scale-105 active:scale-95 border-muted-foreground/30 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white">
                    <Link href="https://wa.me/6285718189799" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-5 h-5" />
                      {t.stats?.cta?.whatsappBtn || "Contact Us on WhatsApp"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
