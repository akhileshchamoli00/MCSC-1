import { Hero } from "@/components/hero"
import { StatsSection } from "@/components/stats-section"
import { AboutSection } from "@/components/about-section"
import { ServicesSection } from "@/components/services-section"
import { AnnouncementSection } from "@/components/announcement-section"

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
