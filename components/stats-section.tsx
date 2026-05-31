"use client"

import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { motion } from "framer-motion"
import { Globe, Target, Award, Diamond } from "lucide-react"
import BorderGlow from "@/components/ui/BorderGlow"
import { Card } from "@/components/ui/card"

export function StatsSection() {
  const { language } = useLanguage()
  const t = translations[language]

  const stats = [
    {
      icon: <Target className="h-6 w-6 text-foreground" />,
      title: t.stats?.assisted?.title || "500+ Businesses Assisted",
      description: t.stats?.assisted?.description || "Trusted partner for company registration, business licensing, and regulatory compliance in Indonesia."
    },
    {
      icon: <Award className="h-6 w-6 text-foreground" />,
      title: t.stats?.projects?.title || "1,000+ Licensing Projects Completed",
      description: t.stats?.projects?.description || "Successfully managing business licenses, permits, and regulatory approvals across Indonesia."
    },
    {
      icon: <Globe className="h-6 w-6 text-foreground" />,
      title: t.stats?.decade?.title || "10+ Years of Experience",
      description: t.stats?.decade?.description || "Serving clients throughout Indonesia and international clients from Singapore, Malaysia, China, and other countries"
    },
    {
      icon: <Diamond className="h-6 w-6 text-foreground" />,
      title: t.stats?.advisors?.title || "Expert Business Consultants",
      description: t.stats?.advisors?.description || "Providing strategic guidance and regulatory expertise to help businesses succeed in Indonesia."
    }
  ]

  return (
    <section id="stats" className="pt-12 pb-8 md:pt-24 md:pb-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-fuchsia-400/20 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-emerald-400/10 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full text-center mb-16 space-y-6"
        >
          <h2 className="font-sans text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl lg:whitespace-nowrap">
            {t.stats?.sectionTitle || "Why Choose MCS"}
          </h2>
          {t.stats?.sectionDescription && (
            <p className="mx-auto max-w-4xl text-xl leading-relaxed text-muted-foreground whitespace-normal">
              {t.stats.sectionDescription}
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full bg-white dark:bg-zinc-950/80 border border-transparent shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:border-white/10 p-8 flex flex-col items-center text-center rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                <div className="w-16 h-16 rounded-full border border-muted-foreground/30 dark:border-white/20 flex items-center justify-center mb-6">
                  {stat.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 font-sans text-foreground">
                  {stat.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
