"use client";

import { Lightbulb, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { translations } from "@/lib/translations";
import { motion } from "framer-motion";
import Link from "next/link";
import BorderGlow from "@/components/ui/BorderGlow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResourcesPage() {
  const { language } = useLanguage();
  const t = translations[language];

  const title = {
    en: "Resources",
    id: "Sumber Daya",
    cn: "资源",
  };

  const description = {
    en: "Access expert insights, regulatory updates, and educational content covering intellectual property protection, company registration, business licensing, tax compliance, and corporate services in Indonesia.",
    id: "Akses wawasan ahli, pembaruan peraturan, dan konten edukasi yang mencakup perlindungan kekayaan intelektual, pendaftaran perusahaan, perizinan berusaha, kepatuhan pajak, dan layanan perusahaan di Indonesia.",
    cn: "获取专家见解、法规更新和教育内容，涵盖印度尼西亚的知识产权保护、公司注册、商业许可、税务合规以及企业服务。",
  };

  const getTranslation = (obj: any, lang: string) => {
    if (!obj) return "";
    return obj[lang] || obj["en"] || obj["id"] || "";
  };

  const cards = [
    {
      title: t.nav.brandClassification,
      href: "/resources/brand-classification",
      description: {
        en: "Classify your brand according to the international trademark classification system.",
        id: "Klasifikasikan merek Anda sesuai dengan sistem klasifikasi merek internasional.",
        cn: "根据国际商标分类系统对您的品牌进行分类。",
      },
    },
    {
      title: t.nav.checkApplicationStatus,
      href: "/resources/check-application-status",
      description: {
        en: "Check the current status of your intellectual property application.",
        id: "Periksa status permohonan kekayaan intelektual Anda saat ini.",
        cn: "检查您的知识产权申请的当前状态。",
      },
    },
    {
      title: "FAQ",
      href: "/resources/faq",
      description: {
        en: "Find answers to common questions about our services and intellectual property.",
        id: "Temukan jawaban untuk pertanyaan umum tentang layanan dan kekayaan intelektual kami.",
        cn: "查找有关我们的服务和知识产权的常见问题的答案。",
      },
    },
  ];

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
              {language === "en"
                ? "Protect Your Future"
                : "Lindungi Masa Depan Anda"}
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
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full"
              >
                <Link
                  href={card.href}
                  className="block h-full cursor-pointer group"
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
                    colors={["#1e40af", "#10b981", "#f97316"]}
                    className="h-full"
                  >
                    <Card className="h-full border border-border/50 dark:border-white/20 bg-background/50 backdrop-blur-md transition-all duration-300 group-hover:bg-background/80 group-hover:-translate-y-1 flex flex-col text-center p-5">
                      <CardHeader className="pb-2 w-full">
                        <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors flex justify-center items-center min-h-[56px]">
                          {card.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2 pb-0 flex flex-col flex-grow w-full">
                        <p className="text-muted-foreground mb-4 text-sm flex-grow">
                          {getTranslation(card.description, language)}
                        </p>
                        <div className="inline-flex items-center justify-center text-primary font-semibold text-sm mt-auto w-full">
                          {language === "en" ? "Get Started" : "Mulai Sekarang"}
                          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
  );
}
