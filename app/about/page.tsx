"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppWidget } from "@/components/whatsapp-widget"
import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { Building2, Users, Award, Target, TrendingUp } from "lucide-react"
import ElectricBorder from "@/components/ui/ElectricBorder"

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
    <div className="min-h-screen">
      <Header />
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
                <ElectricBorder key={index} borderRadius={12} color="#3b82f6" speed={0.8} chaos={0.1}>
                    <div
                    className="group rounded-lg border border-border/20 bg-background/40 backdrop-blur-sm p-6 transition-all hover:shadow-lg hover:border-primary/50 text-left h-full"
                    >
                    <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 transition-transform group-hover:scale-110">
                        <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{value.title}</h3>
                    <p className="text-sm text-muted-foreground text-pretty">{value.description}</p>
                    </div>
                </ElectricBorder>
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
                <ElectricBorder borderRadius={12} color="#3b82f6" speed={0.8} chaos={0.1}>
                    <div className="rounded-lg border border-border/20 bg-background/40 backdrop-blur-sm p-8 text-left transition-all hover:shadow-lg hover:border-primary/50 h-full">
                    <div className="mb-4 flex justify-start">
                        <div className="rounded-full bg-primary/10 p-4">
                        <Building2 className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold">{language === "en" ? "Tax Division" : "Divisi Pajak"}</h3>
                    </div>
                </ElectricBorder>
                <ElectricBorder borderRadius={12} color="#3b82f6" speed={0.8} chaos={0.1}>
                    <div className="rounded-lg border border-border/20 bg-background/40 backdrop-blur-sm p-8 text-left transition-all hover:shadow-lg hover:border-primary/50 h-full">
                    <div className="mb-4 flex justify-start">
                        <div className="rounded-full bg-primary/10 p-4">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold">
                        {language === "en" ? "Accounting Division" : "Divisi Akuntansi"}
                    </h3>
                    </div>
                </ElectricBorder>
                <ElectricBorder borderRadius={12} color="#3b82f6" speed={0.8} chaos={0.1}>
                    <div className="rounded-lg border border-border/20 bg-background/40 backdrop-blur-sm p-8 text-left transition-all hover:shadow-lg hover:border-primary/50 h-full">
                    <div className="mb-4 flex justify-start">
                        <div className="rounded-full bg-primary/10 p-4">
                        <Award className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-xl font-semibold">
                        {language === "en" ? "Licenses Division" : "Divisi Perizinan"}
                    </h3>
                    </div>
                </ElectricBorder>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-12 text-center text-3xl font-bold">
                {language === "en" ? "Our Journey" : "Perjalanan Kami"}
              </h2>
              <div className="space-y-8">
                <div className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary p-2 transition-transform group-hover:scale-110">
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </div>
                    <div className="h-full w-px bg-border" />
                  </div>
                  <div className="pb-8">
                    <h3 className="mb-1 text-xl font-semibold">2013</h3>
                    <p className="text-muted-foreground">
                      {language === "en"
                        ? "Founded as PT Mandiri Cipta Solusi (MCS Consulting)"
                        : "Didirikan sebagai PT Mandiri Cipta Solusi (MCS Consulting)"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary p-2 transition-transform group-hover:scale-110">
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </div>
                    <div className="h-full w-px bg-border" />
                  </div>
                  <div className="pb-8">
                    <h3 className="mb-1 text-xl font-semibold">2016</h3>
                    <p className="text-muted-foreground">
                      {language === "en"
                        ? "Started annual team trips to strengthen bonds and teamwork"
                        : "Memulai perjalanan tim tahunan untuk memperkuat ikatan dan kerja sama tim"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary p-2 transition-transform group-hover:scale-110">
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </div>
                    <div className="h-full w-px bg-border" />
                  </div>
                  <div className="pb-8">
                    <h3 className="mb-1 text-xl font-semibold">2015-2020</h3>
                    <p className="text-muted-foreground">
                      {language === "en"
                        ? "Expanded services and built strong reputation in business licensing"
                        : "Memperluas layanan dan membangun reputasi kuat dalam perizinan usaha"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary p-2 transition-transform group-hover:scale-110">
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 text-xl font-semibold">2024</h3>
                    <p className="text-muted-foreground">
                      {language === "en"
                        ? "Over 10 years of professional service with hundreds of satisfied clients"
                        : "Lebih dari 10 tahun layanan profesional dengan ratusan klien yang puas"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
