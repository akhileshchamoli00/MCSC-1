"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { Calendar, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import ElectricBorder from "./ui/ElectricBorder"

export function AnnouncementSection() {
  const { language } = useLanguage()
  const t = translations[language]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const announcements = t.announcement.items
  const totalSlides = announcements.length

  const nextSlide = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prevSlide = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide])

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0
    })
  }

  // Get visible announcements (1 on mobile, 3 on desktop)
  const getVisibleItems = () => {
    const visible = []
    // For simplicity and matching the service section logic:
    for (let i = 0; i < 3; i++) {
      visible.push(announcements[(currentIndex + i) % totalSlides])
    }
    return visible
  }

  return (
    <section id="announcement" className="pt-12 pb-24 md:pt-16 md:pb-32 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-6 font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {t.announcement.title}
          </h2>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-muted-foreground">{t.announcement.description}</p>
        </motion.div>

        <div
          className="relative group"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="flex justify-center items-center min-h-[400px]">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="grid gap-8 w-full md:grid-cols-3"
              >
                {getVisibleItems().map((announcement, idx) => (
                  <div key={`${announcement.id}-${idx}`} className="h-full">
                    <Link href={`/announcement/${announcement.id}`}>
                      <ElectricBorder
                        color="#1e40af"
                        speed={0.9}
                        chaos={0.1}
                        borderRadius={16}
                      >
                        <Card className="hover-lift h-full border-border/50 bg-transparent backdrop-blur-[2px] transition-all duration-300 hover:border-primary/50 hover:shadow-xl cursor-pointer flex flex-col">
                          <CardHeader className="pb-4">
                            <div className="flex items-center gap-2 text-sm text-primary mb-3 font-medium">
                              <Calendar className="h-4 w-4" />
                              <span>{announcement.date}</span>
                            </div>
                            <CardTitle className="text-xl font-bold leading-tight line-clamp-3">
                              {announcement.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex-grow flex flex-col justify-between">
                            <p className="text-muted-foreground text-base leading-relaxed line-clamp-3 mb-6">
                              {announcement.content}
                            </p>
                            <span className="text-primary font-semibold flex items-center gap-1 group/btn">
                              {language === "en" ? "Read More" : "Baca Selengkapnya"}
                              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                            </span>
                          </CardContent>
                        </Card>
                      </ElectricBorder>
                    </Link>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="absolute top-1/2 -left-4 -translate-y-1/2 md:-left-12 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
            <button
              onClick={prevSlide}
              className="p-3 rounded-full bg-background/20 backdrop-blur-md border border-white/10 hover:bg-primary hover:text-white transition-all shadow-xl"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute top-1/2 -right-4 -translate-y-1/2 md:-right-12 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
            <button
              onClick={nextSlide}
              className="p-3 rounded-full bg-background/20 backdrop-blur-md border border-white/10 hover:bg-primary hover:text-white transition-all shadow-xl"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Pagination Indicators */}
          <div className="mt-12 flex justify-center gap-2">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1)
                  setCurrentIndex(index)
                  setIsAutoPlaying(false)
                }}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

