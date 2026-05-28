"use client";

import { useLanguage } from "@/contexts/language-context";
import {
  Building,
  FileText,
  RefreshCw,
  FileSignature,
  MapPin,
  Briefcase,
  Copyright,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BorderGlow from "@/components/ui/BorderGlow";
import { motion } from "framer-motion";

import { translations } from "@/lib/translations";

export default function ServicesPage() {
  const { language } = useLanguage();
  const t = translations[language];

  const serviceIcons: Record<string, any> = {
    establishment: Building,
    "business-license": FileText,
    "company-changes": RefreshCw,
    agreements: FileSignature,
    "virtual-office": MapPin,
    "work-permit": Briefcase,
    "intellectual-property": Copyright,
  };

  const servicePaths: Record<string, string> = {
    establishment: "/services/establishment",
    "business-license": "/services/business-license",
    "company-changes": "/services/company-changes",
    agreements: "/services/agreements",
    "virtual-office": "/services/virtual-office",
    "work-permit": "/services/work-permit",
    "intellectual-property": "/services/intellectual-property",
  };

  const servicesList = t.services.items.map((item) => ({
    icon: serviceIcons[item.id] || Building,
    title: item.title,
    description: item.description,
    href: servicePaths[item.id] || `/services/${item.id}`,
  }));

  return (
    <main>
      {/* Hero Section */}
      <section className="relative pt-6 pb-4 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-4 inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                {language === "en"
                  ? "What We Do"
                  : language === "cn"
                    ? "服务范围"
                    : "Apa Yang Kami Lakukan"}
              </div>
              <h1 className="mb-6 text-4xl font-bold text-balance md:text-5xl">
                {language === "en"
                  ? "Our Services"
                  : language === "cn"
                    ? "我们的服务"
                    : "Layanan Kami"}
              </h1>
              <p className="text-lg text-muted-foreground text-pretty">
                {language === "en"
                  ? "Establish, Operate, and Grow Your Business in Indonesia with Confidence"
                  : language === "cn"
                    ? "为您量身定制的全面业务许可解决方案"
                    : "Solusi perizinan usaha komprehensif yang disesuaikan dengan kebutuhan Anda"}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Grid with Electric Borders & Glassmorphism */}
      <section className="pt-4 pb-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {servicesList.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <Link href={service.href} className="block h-full group">
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
                      <div className="rounded-xl border border-border/50 dark:border-white/20 bg-background/40 backdrop-blur-md p-6 transition-all duration-300 hover:bg-background/60 cursor-pointer h-full flex flex-col justify-between">
                        <div>
                          <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 transition-transform group-hover:scale-110 group-hover:bg-primary/20">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="mb-3 text-xl font-semibold text-balance group-hover:text-primary transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-sm text-muted-foreground text-pretty leading-relaxed mb-6">
                            {service.description}
                          </p>
                        </div>
                        <div className="flex items-center text-primary text-sm font-semibold mt-auto group-hover:gap-2 transition-all">
                          {language === "en"
                            ? "Learn More"
                            : language === "cn"
                              ? "了解更多"
                              : "Pelajari Lebih Lanjut"}
                          <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </BorderGlow>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-3xl font-bold text-balance md:text-4xl">
              {language === "en"
                ? "Ready to Get Started?"
                : language === "cn"
                  ? "准备好开始了吗？"
                  : "Siap untuk Memulai?"}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground text-pretty">
              {language === "en"
                ? "Contact us today to discuss your business licensing needs"
                : language === "cn"
                  ? "立即联系我们以讨论您的业务许可需求"
                  : "Hubungi kami hari ini untuk mendiskusikan kebutuhan perizinan usaha Anda"}
            </p>
            <Button
              size="lg"
              asChild
              className="transition-all hover:scale-105 active:scale-95 px-8 py-6 text-md font-semibold shadow-lg"
            >
              <Link href="/contact">
                {language === "en"
                  ? "Contact Us"
                  : language === "cn"
                    ? "联系我们"
                    : "Hubungi Kami"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
