import { Hero } from "@/components/hero"
import { AboutSection } from "@/components/about-section"
import { ServicesSection } from "@/components/services-section"
import { AnnouncementSection } from "@/components/announcement-section"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppWidget } from "@/components/whatsapp-widget"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <AboutSection />
        <ServicesSection />
        <AnnouncementSection />
      </main>
      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
