
import {
  FileSignature,
  ShieldCheck,
  Clock,
  Calendar,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  FileText,
  UserCheck,
  Scale,
  Signature,
  FileCheck2,
  CheckCircle,
} from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";
import type { Metadata } from "next";
import { MotionDiv, MotionP, TocButton } from "@/components/service-interactive";
import { title, description, content as contentData, tableHeaders, tableRows, faqs, ctaText, ctaDescription } from "./content";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";
  const getTrans = (obj: any) => obj[lang] || obj["en"] || "";

  return {
    title: getTrans(title),
    description: getTrans(description),
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/services/agreements`,
      languages: {
        "en": `https://www.mcsc.co.id/en/services/agreements`,
        "id": `https://www.mcsc.co.id/id/services/agreements`,
        "zh-CN": `https://www.mcsc.co.id/cn/services/agreements`,
      },
    },
  };
}

export default async function AgreementsPage(props: PageProps) {
  const params = await props.params;
  const language = params.lang || "en";

  const getTranslation = (obj: any) => {
    if (!obj) return "";
    if (language === "id" && obj.idText) return obj.idText;
    return obj[language] || obj["en"] || "";
  };

    return (
    <BaseServicePage
      lang={language}
      icon={<FileSignature className="h-10 w-10 text-primary" />}
      title={title}
      description={description}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
      faqs={faqs}
    >
      <div className="container mx-auto px-4 pt-8 pb-0 max-w-6xl text-left">
        {/* Legal check badge */}
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center md:justify-start mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-border/80 dark:border-white/10 bg-background/50 backdrop-blur-md text-muted-foreground shadow-sm">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            <span>{getTranslation(contentData.legalBadge)}</span>
          </div>
        </MotionDiv>

        {/* Intro Text */}
        <MotionP
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg md:text-xl text-foreground/90 leading-relaxed font-sans mb-12"
        >
          {getTranslation(contentData.introText)}
        </MotionP>

        {/* On this page - TOC */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/30 backdrop-blur-md max-w-md shadow-sm"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
            <FileSignature className="h-5 w-5 text-primary" />
            {getTranslation(contentData.onThisPage)}
          </h3>
          <ul className="space-y-2.5">
            {contentData.tocItems.map((item) => (
              <li key={item.id}>
                <TocButton targetId={item.id}>
                  <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
                  <span>{getTranslation(item)}</span>
                </TocButton>
              </li>
            ))}
          </ul>
        </MotionDiv>

        {/* Section 1: What type of agreement do you need? */}
        <section id="agreement-types" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(contentData.agreementTitle)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-6">
            {getTranslation(contentData.agreementDesc)}
          </p>

          {/* Mobile Card Layout */}
          <div className="grid gap-6 md:grid-cols-2 lg:hidden my-8">
            {tableHeaders.columns.slice(1).map((col, colIdx) => {
              return (
                <div
                  key={colIdx}
                  className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/30 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 backdrop-blur-sm shadow-sm flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-2">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {getTranslation(col)}
                      </h3>
                    </div>
                    
                    <dl className="space-y-4">
                      {tableRows.map((row, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-3 gap-2">
                          <dt className="text-xs font-semibold text-foreground/70 col-span-1">
                            {getTranslation(row.label)}
                          </dt>
                          <dd className="text-xs text-muted-foreground col-span-2 leading-relaxed">
                            {getTranslation(row.values[colIdx])}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block relative my-8 rounded-2xl border border-border/50 dark:border-white/15 bg-background/30 backdrop-blur-sm shadow-md overflow-hidden">
            <table className="w-full text-left border-collapse text-xs lg:text-[11px] xl:text-xs table-fixed">
              <thead>
                <tr className="border-b border-border/50 dark:border-white/15 bg-muted/30">
                  {tableHeaders.columns.map((col, idx) => {
                    return (
                      <th
                        key={idx}
                        className={`p-3 font-semibold text-foreground ${idx === 0 ? "w-[15%]" : "w-[17%]"}`}
                      >
                        {getTranslation(col)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="border-b border-border/50 dark:border-white/10 last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <td className="p-3 font-medium text-foreground bg-muted/5">
                      {getTranslation(row.label)}
                    </td>
                    {row.values.map((val, valIdx) => {
                      return (
                        <td
                          key={valIdx}
                          className="p-3 text-muted-foreground leading-relaxed"
                        >
                          {getTranslation(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: What's included with each service */}
        <section id="whats-included" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(contentData.whatsIncludedTitle)}
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {contentData.whatsIncludedList.map((service, serviceIdx) => {
              const IconComponent = [FileText, UserCheck, Scale, Signature, FileCheck2, CheckCircle, Clock, Calendar][serviceIdx] || FileText;
              return (
                <div
                  key={serviceIdx}
                  className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 backdrop-blur-sm shadow-sm flex flex-col group"
                >
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/20">
                    <IconComponent className="h-5 w-5 text-primary shrink-0" />
                    <h3 className="font-bold text-foreground text-sm leading-tight">
                      {getTranslation(service.title)}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {getTranslation(service.desc)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Requirements for drafting */}
        <section id="requirements-details" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(contentData.requirementsTitle)}
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Cooperation, Sales, License, Lease, Separation of Assets */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 backdrop-blur-sm shadow-sm group">
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(contentData.reqNewTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(contentData.reqNewDesc)}
              </p>
            </div>

            {/* Addendum to Agreement */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 backdrop-blur-sm shadow-sm group">
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(contentData.reqAddendumTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(contentData.reqAddendumDesc)}
              </p>
            </div>

            {/* Document Verification */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 backdrop-blur-sm shadow-sm group">
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(contentData.reqVerifyTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(contentData.reqVerifyDesc)}
              </p>
            </div>

            {/* Document Legalization */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 backdrop-blur-sm shadow-sm group">
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(contentData.reqLegalTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(contentData.reqLegalDesc)}
              </p>
            </div>
          </div>

          <p className="text-base text-muted-foreground leading-relaxed border-l-2 border-primary/50 pl-4 py-1 italic bg-primary/5 rounded-r-xl">
            {getTranslation(contentData.regulatoryFooter)}
          </p>
        </section>

        {/* Section 4: Step-by-step process */}
        <section id="step-by-step" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(contentData.stepsTitle)}
          </h2>

          <div className="relative pl-8 ml-4 border-l border-border dark:border-white/10 space-y-12 py-4">
            {contentData.steps.map((step, idx) => (
              <div key={idx} className="relative">
                {/* timeline circle */}
                <div className="absolute -left-[45px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-background border border-primary/40 dark:border-primary/60 text-primary font-bold text-sm shadow-sm backdrop-blur-md">
                  {idx + 1}
                </div>
                
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                    <h3 className="text-xl font-bold text-foreground">
                      {getTranslation(step.title)}
                    </h3>
                    {(step as any).duration && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                        <Clock className="h-3 w-3" />
                        {getTranslation((step as any).duration)}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {getTranslation(step.desc)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Timeline & CTA */}
        <section id="timeline" className="scroll-mt-24 mb-4">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(contentData.timelineTitle)}
          </h2>
          <div className="p-8 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md mb-8 flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm">
            <div className="flex gap-4 items-center">
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center border border-primary/30 shrink-0">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  {getTranslation(contentData.totalTimelineLabel)}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {getTranslation(contentData.totalTimelineVal)}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed text-center md:text-left">
              {getTranslation(contentData.totalTimelineDesc)}
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-border/50 dark:border-white/15 bg-background/30 backdrop-blur-md text-center max-w-3xl mx-auto shadow-sm">
            <p className="text-base text-foreground leading-relaxed mb-6">
              {getTranslation(contentData.finalCtaText)}
            </p>
            <Button
              size="lg"
              variant="default"
              className="h-12 px-8 text-base rounded-full bg-primary text-primary-foreground hover:opacity-90 hover:scale-105 active:scale-95 shadow-md shadow-primary/10 cursor-pointer group"
              asChild
            >
              <Link href={`/${language}/contact`}>
                {language === "en"
                  ? "Schedule a Free Consultation"
                  : language === "cn"
                    ? "预约免费咨询"
                    : "Jadwalkan Konsultasi Gratis"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </BaseServicePage>
  );
}

