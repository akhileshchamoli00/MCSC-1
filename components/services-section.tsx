"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BorderGlow from "./ui/BorderGlow";

const serviceIcons = [
  Building2,
  FileText,
  RefreshCw,
  Scale,
  MapPin,
  Users,
  Lightbulb,
];

export function ServicesSection() {
  const { language } = useLanguage();
  const t = translations[language];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const services = t.services.items;
  const totalServices = services.length;

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalServices);
  }, [totalServices]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalServices) % totalServices);
  }, [totalServices]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  // Get 3 services to show at once on desktop, wrapping around
  const getVisibleServices = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(services[(currentIndex + i) % totalServices]);
    }
    return visible;
  };

  return (
    <section
      id="services"
      className="pt-12 pb-12 md:pt-16 md:pb-16 overflow-hidden"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-6 font-sans text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {t.services.title}
          </h2>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground">
            {(t.services as any).description ||
              (language === "en"
                ? "Establish, Operate, and Grow Your Business in Indonesia with Confidence"
                : language === "cn"
                  ? "为您量身定制的全面业务许可解决方案"
                  : "Solusi perizinan usaha komprehensif yang disesuaikan dengan kebutuhan Anda")}
          </p>
        </motion.div>

        <div
          className="relative group"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="flex justify-center items-center min-h-[450px]">
            <AnimatePresence
              initial={false}
              custom={direction}
              mode="popLayout"
            >
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="grid gap-8 w-full md:grid-cols-3"
              >
                {getVisibleServices().map((service, idx) => {
                  // Find original index for icon mapping
                  const originalIndex = services.findIndex(
                    (s) => s.title === service.title,
                  );
                  const Icon = serviceIcons[originalIndex] || Building2;

                  return (
                    <div key={`${service.id}-${idx}`} className="h-full">
                      <Link href={`/services/${service.id}`}>
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
                          <Card className="group hover-lift h-full border border-border/50 dark:border-white/20 bg-background/50 backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:bg-background/70 cursor-pointer flex flex-col">
                            <CardHeader className="space-y-4">
                              <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/5 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                                <Icon className="h-7 w-7 text-primary transition-colors duration-300" />
                              </div>
                              <CardTitle className="text-2xl font-bold text-card-foreground line-clamp-2">
                                {service.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col justify-between">
                              <CardDescription className="text-base leading-relaxed line-clamp-4 mb-6">
                                {service.description}
                              </CardDescription>
                              <span className="text-primary font-semibold flex items-center gap-1 group/btn mt-auto">
                                {language === "en"
                                  ? "Learn More"
                                  : "Pelajari Selengkapnya"}
                                <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                              </span>
                            </CardContent>
                          </Card>
                        </BorderGlow>
                      </Link>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="absolute top-1/2 -left-4 -translate-y-1/2 md:-left-12 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={prevSlide}
              className="p-3 rounded-full bg-background/20 backdrop-blur-md border border-white/10 hover:bg-primary hover:text-white transition-all shadow-xl"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute top-1/2 -right-4 -translate-y-1/2 md:-right-12 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={nextSlide}
              className="p-3 rounded-full bg-background/20 backdrop-blur-md border border-white/10 hover:bg-primary hover:text-white transition-all shadow-xl"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Pagination Indicators */}
          <div className="mt-12 flex justify-center gap-3">
            {services.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                  setIsAutoPlaying(false);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
                aria-label={`Go to service ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
