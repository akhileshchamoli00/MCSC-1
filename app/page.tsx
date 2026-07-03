import { Hero } from "@/components/hero"
import { StatsSection } from "@/components/stats-section"
import { AboutSection } from "@/components/about-section"
import { ServicesSection } from "@/components/services-section"
import { AnnouncementSection } from "@/components/announcement-section"
import type { Metadata } from "next"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "MCS Consulting | Business Registration & Licensing in Indonesia",
  description: "PT & PT PMA registration, business licensing, tax and compliance services in Indonesia. 500+ businesses assisted since 2013. Free consultation.",
  alternates: {
    canonical: "https://www.mcsc.co.id",
  },
}

export default function Home() {
  return (
    <main>
      <Hero />
      <StatsSection />
      <AboutSection />
      <ServicesSection />
      <AnnouncementSection />
    </main>
  )
}
