"use client";

import { useLanguage } from "@/contexts/language-context";
import { translations } from "@/lib/translations";
import { Calendar, Bell, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BorderGlow from "@/components/ui/BorderGlow";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export default function AnnouncementsPage() {
  const { language } = useLanguage();
  const t = translations[language];

  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(
        language === "en"
          ? "Please enter your email."
          : language === "cn"
            ? "请输入您的电子邮件。"
            : "Silakan masukkan email Anda.",
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(
        language === "en"
          ? "Please enter a valid email."
          : language === "cn"
            ? "请输入有效的电子邮件。"
            : "Silakan masukkan email yang valid.",
      );
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubscribed(true);
  };
  const licenseRegulationIds = ["pmk-28-2026", "permenkum-5-2026"];
  const taxLicenseRegulations = t.announcement.items.filter((item) =>
    licenseRegulationIds.includes(item.id),
  );
  const financeRegulations = t.announcement.items.filter(
    (item) => !licenseRegulationIds.includes(item.id),
  );

  const renderAnnouncementCard = (announcement: any, index: number) => (
    <motion.div
      key={announcement.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/announcement/${announcement.id}`} className="block group">
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
          <Card className="border border-border/50 dark:border-white/20 bg-background/50 backdrop-blur-md transition-all duration-300 hover:bg-background/70 cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span>{announcement.date}</span>
              </div>
              <CardTitle className="text-2xl group-hover:text-primary transition-colors line-clamp-2">
                {announcement.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-3 mb-6">
                {announcement.content}
              </p>
              <div className="flex items-center text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                {language === "en"
                  ? "Read Full Regulation"
                  : language === "cn"
                    ? "阅读完整法规"
                    : "Baca Selengkapnya"}
                <span className="ml-1 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </CardContent>
          </Card>
        </BorderGlow>
      </Link>
    </motion.div>
  );

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
                  ? "Regulations"
                  : language === "cn"
                    ? "政策法规"
                    : "Regulasi"}
              </div>
              <h1 className="mb-6 text-4xl font-bold text-balance md:text-5xl">
                {language === "en"
                  ? "Latest Regulatory Updates"
                  : language === "cn"
                    ? "最新监管动态"
                    : "Pembaruan Regulasi Terbaru"}
              </h1>
              <p className="text-lg text-muted-foreground text-pretty">
                {language === "en"
                  ? "Stay informed with the latest governmental regulations, laws, and announcements affecting business in Indonesia."
                  : language === "cn"
                    ? "随时了解影响印度尼西亚商业的最新政府法规、法律和公告动态。"
                    : "Tetap terinformasi dengan regulasi, undang-undang, dan pengumuman pemerintah terbaru yang memengaruhi bisnis di Indonesia."}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Announcements List */}
      <section className="pt-4 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Tax Regulations (Left) */}
            <div>
              <h2 className="mb-8 text-2xl font-bold text-center border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4 text-foreground/90">
                {language === "en"
                  ? "Tax Regulations"
                  : language === "cn"
                    ? "税务法规"
                    : "Regulasi Pajak"}
              </h2>
              <div className="grid gap-8">
                {financeRegulations.map((announcement, index) =>
                  renderAnnouncementCard(announcement, index),
                )}
              </div>
            </div>

            {/* License Regulations (Right) */}
            <div>
              <h2 className="mb-8 text-2xl font-bold text-center border-b border-zinc-200/60 dark:border-zinc-800/60 pb-4 text-foreground/90">
                {language === "en"
                  ? "License Regulations"
                  : language === "cn"
                    ? "许可法规"
                    : "Regulasi Izin"}
              </h2>
              <div className="grid gap-8">
                {taxLicenseRegulations.map((announcement, index) =>
                  renderAnnouncementCard(announcement, index),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
