import { Hero } from "@/components/hero"
import { StatsSection } from "@/components/stats-section"
import { AboutSection } from "@/components/about-section"
import { ServicesSection } from "@/components/services-section"
import { AnnouncementSection } from "@/components/announcement-section"
import type { Metadata } from "next"

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";

  return {
    title: "MCS Consulting | Business Registration & Licensing in Indonesia",
    description: "PT & PT PMA registration, business licensing, tax and compliance services in Indonesia. 500+ businesses assisted since 2013. Free consultation.",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}`,
      languages: {
        "en": `https://www.mcsc.co.id/en`,
        "id": `https://www.mcsc.co.id/id`,
        "zh-CN": `https://www.mcsc.co.id/cn`,
        "x-default": `https://www.mcsc.co.id/en`,
      },
    },
  };
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
