"use client";

import { useLanguage } from "@/contexts/language-context";
import { translations } from "@/lib/translations";
import { Building2, Award, Target, Globe, Gem, TrendingUp } from "lucide-react";
import BorderGlow from "@/components/ui/BorderGlow";

export default function AboutPage() {
  const { language } = useLanguage();
  const t = translations[language];

  const values = [
    {
      icon: Globe,
      title:
        language === "en"
          ? "10+ Years of Experience"
          : language === "cn"
            ? "10年经验"
            : "1 Dekade",
      description:
        language === "en"
          ? "Serving clients throughout Indonesia and international clients from Singapore, Malaysia, China, and other countries"
          : language === "cn"
            ? "服务于整个印度尼西亚的客户，以及来自新加坡、马来西亚、中国和其他国家的国际客户"
            : "Melayani klien di seluruh Indonesia dan klien internasional dari Singapura, Malaysia, Cina, dan negara lainnya",
      variant: "white",
    },
    {
      icon: Target,
      title:
        language === "en"
          ? "500+ Businesses Assisted"
          : language === "cn"
            ? "协助超过500家企业"
            : "500+ Bisnis Terbantu",
      description:
        language === "en"
          ? "Trusted partner for company registration, business licensing, and regulatory compliance in Indonesia."
          : language === "cn"
            ? "在印度尼西亚公司注册、业务许可和合规方面值得信赖的合作伙伴。"
            : "Mitra terpercaya untuk pendaftaran perusahaan, perizinan bisnis, dan kepatuhan regulasi di Indonesia.",
      variant: "white",
    },
    {
      icon: Award,
      title:
        language === "en"
          ? "1,000+ Licensing Projects Completed"
          : language === "cn"
            ? "完成1,000多个许可项目"
            : "1.000+ Proyek Perizinan Selesai",
      description:
        language === "en"
          ? "Successfully managing business licenses, permits, and regulatory approvals across Indonesia."
          : language === "cn"
            ? "成功管理整个印度尼西亚的业务许可证、准证和监管审批。"
            : "Berhasil mengelola izin usaha, lisensi, dan persetujuan regulasi di seluruh Indonesia.",
      variant: "white",
    },
    {
      icon: Gem,
      title:
        language === "en"
          ? "Expert Business Consultants"
          : language === "cn"
            ? "值得信赖的顾问"
            : "Penasihat Terpercaya",
      description:
        language === "en"
          ? "Providing strategic guidance and regulatory expertise to help businesses succeed in Indonesia."
          : language === "cn"
            ? "提供战略指导和监管专业知识，帮助企业在印度尼西亚取得成功。"
            : "Memberikan panduan strategis dan keahlian regulasi untuk membantu bisnis sukses di Indonesia.",
      variant: "white",
    },
  ];

  return (
    <main>
      {/* Hero & Overview Section */}
      <section className="relative pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-4xl text-left">
            <h1 className="mb-8 text-4xl font-bold text-balance md:text-5xl">
              {t.about.title}
            </h1>
            <div className="space-y-6">
              <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
                {t.about.description}
              </p>
              {t.about.fullDescription.map(
                (paragraph: string, index: number) => (
                  <p
                    key={index}
                    className="text-xl leading-relaxed text-muted-foreground text-pretty"
                  >
                    {paragraph}
                  </p>
                ),
              )}
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
                borderRadius={24}
                glowRadius={0}
                glowIntensity={0.1}
                animated={false}
                colors={["#1e40af", "#10b981", "#f97316"]}
                className="h-full"
              >
                <div
                  className={`group rounded-3xl p-8 transition-all hover:shadow-xl text-center h-full flex flex-col items-center shadow-md ${value.variant === "orange"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background/40 backdrop-blur-md text-foreground border border-border/50 dark:border-white/10"
                    }`}
                >
                  <div
                    className={`mb-8 inline-flex items-center justify-center rounded-full p-4 border-[6px] w-24 h-24 ${value.variant === "orange"
                      ? "border-primary-foreground/40 bg-transparent text-primary-foreground"
                      : "border-primary/40 bg-transparent text-primary"
                      }`}
                  >
                    <value.icon className="h-10 w-10" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold">{value.title}</h3>
                  <p
                    className={`text-sm leading-relaxed ${value.variant === "orange"
                      ? "text-primary-foreground/90"
                      : "text-muted-foreground"
                      }`}
                  >
                    {value.description}
                  </p>
                </div>
              </BorderGlow>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-3xl font-bold text-left">
              {t.about.staffTitle}
            </h2>

            <div className="space-y-6 mb-16 text-left">
              <p className="text-xl leading-relaxed text-muted-foreground text-pretty whitespace-pre-wrap">
                {t.about.staffDescription}
              </p>
              <div
                className="text-xl leading-relaxed text-muted-foreground text-pretty whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: t.about.staffTrips }}
              />
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
                colors={["#1e40af", "#10b981", "#f97316"]}
                className="h-full"
              >
                <div className="group rounded-3xl p-8 transition-all hover:shadow-xl text-center h-full flex flex-col items-center shadow-md bg-background/40 backdrop-blur-md text-foreground border border-border/50 dark:border-white/10">
                  <div className="mb-6 inline-flex items-center justify-center rounded-full p-3 border-[4px] w-16 h-16 border-muted-foreground/30 bg-transparent text-foreground">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <h3 className="mb-4 text-xl font-bold">
                    {language === "en"
                      ? "Tax Division"
                      : language === "cn"
                        ? "税务部"
                        : "Divisi Pajak"}
                  </h3>
                </div>
              </BorderGlow>
              <BorderGlow
                edgeSensitivity={30}
                glowColor="220 80 80"
                backgroundColor="transparent"
                borderRadius={24}
                glowRadius={40}
                glowIntensity={1}
                coneSpread={25}
                animated={false}
                colors={["#1e40af", "#10b981", "#f97316"]}
                className="h-full"
              >
                <div className="group rounded-3xl p-8 transition-all hover:shadow-xl text-center h-full flex flex-col items-center shadow-md bg-background/40 backdrop-blur-md text-foreground border border-border/50 dark:border-white/10">
                  <div className="mb-6 inline-flex items-center justify-center rounded-full p-3 border-[4px] w-16 h-16 border-muted-foreground/30 bg-transparent text-foreground">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <h3 className="mb-4 text-xl font-bold">
                    {language === "en"
                      ? "Accounting Division"
                      : language === "cn"
                        ? "会计部"
                        : "Divisi Akuntansi"}
                  </h3>
                </div>
              </BorderGlow>
              <BorderGlow
                edgeSensitivity={30}
                glowColor="220 80 80"
                backgroundColor="transparent"
                borderRadius={24}
                glowRadius={40}
                glowIntensity={1}
                coneSpread={25}
                animated={false}
                colors={["#1e40af", "#10b981", "#f97316"]}
                className="h-full"
              >
                <div className="group rounded-3xl p-8 transition-all hover:shadow-xl text-center h-full flex flex-col items-center shadow-md bg-background/40 backdrop-blur-md text-foreground border border-border/50 dark:border-white/10">
                  <div className="mb-6 inline-flex items-center justify-center rounded-full p-3 border-[4px] w-16 h-16 border-muted-foreground/30 bg-transparent text-foreground">
                    <Award className="h-8 w-8" />
                  </div>
                  <h3 className="mb-4 text-xl font-bold">
                    {language === "en"
                      ? "Licenses Division"
                      : language === "cn"
                        ? "许可部"
                        : "Divisi Perizinan"}
                  </h3>
                </div>
              </BorderGlow>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
