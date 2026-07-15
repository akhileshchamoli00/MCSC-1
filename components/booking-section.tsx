"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, ExternalLink, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function BookingSection({ isEmbedded = false }: { isEmbedded?: boolean } = {}) {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);

  useEffect(() => {
    // Only load the URL on the client to avoid hydration mismatch
    // and access the environment variable safely.
    const url = process.env.NEXT_PUBLIC_GOOGLE_BOOKING_URL;
    if (url) {
      setBookingUrl(url);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const texts = {
    en: {
      title: "Schedule a Consultation",
      description: "Pick a time that works best for you. Our experts are ready to help.",
      loading: "Loading calendar...",
      fallbackBtn: "Open Booking Page",
      unavailable: "Booking is currently unavailable. Please contact us directly.",
    },
    cn: {
      title: "预约咨询",
      description: "选择最适合您的时间。我们的专家已准备好为您提供帮助。",
      loading: "正在加载日历...",
      fallbackBtn: "打开预约页面",
      unavailable: "目前无法预约，请直接联系我们。",
    },
    id: {
      title: "Jadwalkan Konsultasi",
      description: "Pilih waktu yang paling sesuai untuk Anda. Pakar kami siap membantu.",
      loading: "Memuat kalender...",
      fallbackBtn: "Buka Halaman Pemesanan",
      unavailable: "Pemesanan saat ini tidak tersedia. Silakan hubungi kami secara langsung.",
    }
  };

  const currentLang = (language === "en" || language === "cn" || language === "id") ? language : "en";
  const t = texts[currentLang];

  return (
    <section className={isEmbedded ? "w-full h-full relative" : "py-8 md:py-12 bg-background overflow-hidden relative"}>
      <div className={isEmbedded ? "w-full h-full relative z-10" : "container mx-auto px-0 md:px-4 lg:px-8 relative z-10"}>
        <Card className={isEmbedded ? "w-full border-border/50 shadow-sm overflow-hidden relative min-h-[650px] flex flex-col" : "max-w-5xl mx-auto border-border/50 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden relative min-h-[600px] flex flex-col transition-all duration-300"}>
          <CardContent className="p-0 flex-grow relative flex flex-col">
            
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground font-medium animate-pulse">{t.loading}</p>
              </div>
            )}

            {!bookingUrl ? (
              <div className="flex-grow flex flex-col items-center justify-center p-12 text-center bg-muted/20">
                <CalendarClock className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Configuration Required</h3>
                <p className="text-muted-foreground max-w-md">{t.unavailable}</p>
              </div>
            ) : (
              <div className="w-full h-full flex-grow relative min-h-[650px] md:min-h-[750px] overflow-hidden">
                <iframe
                  src={bookingUrl}
                  width="100%"
                  height="100%"
                  className="absolute top-0 left-0 w-full h-[calc(100%+65px)] border-0"
                  onLoad={handleIframeLoad}
                  title="Google Booking Calendar"
                  allow="camera; microphone"
                />
              </div>
            )}
          </CardContent>

        </Card>
      </div>
    </section>
  );
}
