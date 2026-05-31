"use client";

import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { translations } from "@/lib/translations";
import {
  Building2,
  FileText,
  RefreshCw,
  Scale,
  MapPin,
  Users,
  Lightbulb,
  HardHat,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const serviceIcons: Record<string, any> = {
  "business-establishment": Building2,
  "business-licensing": FileText,
  "corporate-changes": RefreshCw,
  "virtual-office": MapPin,
  "product-registration": Lightbulb,
  "human-resources": Users,
  "intellectual-property": Scale,
};

export default function ServiceDetailPage() {
  const { id } = useParams();
  const { language } = useLanguage();
  const router = useRouter();
  const t = translations[language];

  const service = t.services.items.find((item) => item.id === id) as any;
  const Icon = serviceIcons[id as string] || Building2;

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-grow container mx-auto px-4 py-20 relative z-10">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-8 group transition-all hover:bg-transparent hover:text-primary p-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
          {language === "en"
            ? "Back to Services"
            : language === "cn"
              ? "返回服务"
              : "Kembali ke Layanan"}
        </Button>

        <Card className="border-2 border-primary/20 bg-background/50 backdrop-blur-md shadow-2xl overflow-hidden rounded-2xl">
          <CardHeader className="pt-12 pb-8 px-8 md:px-12 border-b border-primary/10">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 flex items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
                <Icon className="h-10 w-10" />
              </div>
              <div>
                <CardTitle className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-foreground mb-2">
                  {service.title}
                </CardTitle>
                <p className="text-lg text-primary/80 font-medium">
                  {service.description}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-12 px-8 md:px-12">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-xl leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {service.content}
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2">
              <div className="p-6 rounded-xl bg-primary/5 border border-primary/10">
                <h4 className="font-bold mb-2 text-primary">
                  {language === "en"
                    ? "Expert Consultation"
                    : language === "cn"
                      ? "专家咨询"
                      : "Konsultasi Ahli"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {language === "en"
                    ? "Get professional guidance tailored to your specific business needs."
                    : language === "cn"
                      ? "获得针对您特定业务需求定制的专业指导。"
                      : "Dapatkan panduan profesional yang disesuaikan dengan kebutuhan bisnis spesifik Anda."}
                </p>
              </div>
              <div className="p-6 rounded-xl bg-primary/5 border border-primary/10">
                <h4 className="font-bold mb-2 text-primary">
                  {language === "en"
                    ? "Full Compliance"
                    : language === "cn"
                      ? "完全合规"
                      : "Kepatuhan Penuh"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {language === "en"
                    ? "Ensuring all your corporate documentation meets current regulations."
                    : language === "cn"
                      ? "确保您的所有公司文件符合现行法规。"
                      : "Memastikan semua dokumentasi perusahaan Anda memenuhi peraturan saat ini."}
                </p>
              </div>
            </div>

            <div className="mt-12 flex justify-center">
              <Button
                size="lg"
                className="rounded-full px-8 h-14 text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
                onClick={() =>
                  window.open("https://wa.me/628128000000", "_blank")
                }
              >
                {language === "en"
                  ? "Inquire Now"
                  : language === "cn"
                    ? "立即咨询"
                    : "Hubungi Kami"}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
