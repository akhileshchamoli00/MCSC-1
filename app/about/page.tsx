"use client"

import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { Building2, Users, Award, Target, TrendingUp } from "lucide-react"
import BorderGlow from "@/components/ui/BorderGlow"

export default function AboutPage() {
  const { language } = useLanguage()
  const t = translations[language]

  const values = [
    {
      icon: Target,
      title: language === "en" ? "Mission" : "Misi",
      description:
        language === "en"
          ? "To provide comprehensive, reliable, and professional business licensing solutions."
          : "Memberikan solusi perizinan usaha yang komprehensif, handal, dan profesional.",
    },
    {
      icon: Award,
      title: language === "en" ? "Excellence" : "Keunggulan",
      description:
        language === "en"
          ? "Over 10 years of expertise in business regulation and licensing."
          : "Lebih dari 10 tahun keahlian dalam regulasi dan perizinan usaha.",
    },
    {
      icon: Users,
      title: language === "en" ? "Partnership" : "Kemitraan",
      description:
        language === "en"
          ? "Committed to being a trusted strategic partner for business owners."
          : "Berkomitmen menjadi mitra strategis terpercaya bagi pemilik usaha.",
    },
    {
      icon: TrendingUp,
      title: language === "en" ? "Growth Support" : "Dukungan Pertumbuhan",
      description:
        language === "en"
          ? "Supporting business growth with complete services from licensing to bookkeeping."
          : "Mendukung pertumbuhan bisnis dengan layanan lengkap dari perizinan hingga pembukuan.",
    },
  ]

  return (
    <main>
      {/* Hero & Overview Section */}
      <section className="relative pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 z-0">

        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-4xl text-left">
            <h1 className="mb-8 text-4xl font-bold text-balance md:text-5xl">{t.about.title}</h1>
            <div className="space-y-6">
              <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
                {t.about.description}
              </p>
              {t.about.fullDescription.map((paragraph, index) => (
                <p key={index} className="text-xl leading-relaxed text-muted-foreground text-pretty">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <BorderGlow
                key={index}
                edgeSensitivity={20}
                glowColor="220 80 80"
                backgroundColor="transparent"
                borderRadius={12}
                glowRadius={0}
                glowIntensity={0.1}
                animated={false}
                colors={['#1e40af', '#10b981', '#f97316']}
                className="h-full"
              >
                <div
                  className="group rounded-lg border-none bg-background/40 backdrop-blur-sm p-6 transition-all hover:shadow-lg text-left h-full"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 transition-transform group-hover:scale-110">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{value.title}</h3>
                  <p className="text-sm text-muted-foreground text-pretty">{value.description}</p>
                </div>
              </BorderGlow>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-3xl font-bold text-left">{t.about.staffTitle}</h2>

            <div className="space-y-6 mb-16 text-left">
              <p className="text-xl leading-relaxed text-muted-foreground text-pretty">{t.about.staffDescription}</p>
              <p className="text-xl leading-relaxed text-muted-foreground text-pretty">{t.about.staffTrips}</p>
            </div>

            {/* Three Divisions */}
            <div className="grid gap-6 md:grid-cols-3 mt-12">
              <BorderGlow
                edgeSensitivity={30}
                glowColor="220 80 80"
                backgroundColor="transparent"
                borderRadius={12}
                glowRadius={40}
                glowIntensity={1}
                coneSpread={25}
                animated={false}
                colors={['#1e40af', '#10b981', '#f97316']}
                className="h-full"
              >
                <div className="rounded-lg border-none bg-background/40 backdrop-blur-sm p-8 text-left transition-all hover:shadow-lg h-full">
                  <div className="mb-4 flex justify-start">
                    <div className="rounded-full bg-primary/10 p-4">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">{language === "en" ? "Tax Division" : "Divisi Pajak"}</h3>
                </div>
              </BorderGlow>
              <BorderGlow
                edgeSensitivity={30}
                glowColor="220 80 80"
                backgroundColor="transparent"
                borderRadius={12}
                glowRadius={40}
                glowIntensity={1}
                coneSpread={25}
                animated={false}
                colors={['#1e40af', '#10b981', '#f97316']}
                className="h-full"
              >
                <div className="rounded-lg border-none bg-background/40 backdrop-blur-sm p-8 text-left transition-all hover:shadow-lg h-full">
                  <div className="mb-4 flex justify-start">
                    <div className="rounded-full bg-primary/10 p-4">
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">
                    {language === "en" ? "Accounting Division" : "Divisi Akuntansi"}
                  </h3>
                </div>
              </BorderGlow>
              <BorderGlow
                edgeSensitivity={30}
                glowColor="220 80 80"
                backgroundColor="transparent"
                borderRadius={12}
                glowRadius={40}
                glowIntensity={1}
                coneSpread={25}
                animated={false}
                colors={['#1e40af', '#10b981', '#f97316']}
                className="h-full"
              >
                <div className="rounded-lg border-none bg-background/40 backdrop-blur-sm p-8 text-left transition-all hover:shadow-lg h-full">
                  <div className="mb-4 flex justify-start">
                    <div className="rounded-full bg-primary/10 p-4">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">
                    {language === "en" ? "Licenses Division" : "Divisi Perizinan"}
                  </h3>
                </div>
              </BorderGlow>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
