import { Metadata, ResolvingMetadata } from "next"
import { translations } from "@/lib/translations"
import AnnouncementDetailClient from "./AnnouncementDetailClient"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const id = (await params).id
  
  // We use English as the default for metadata since language context is client-side
  const announcement = translations["en"].announcement.items.find((item: any) => item.id === id)
  
  if (!announcement) {
    return { title: "Regulation Not Found - MCS Consulting" }
  }
  
  const description = (announcement as any).summary || announcement.content.substring(0, 160) + "..."

  return {
    title: `${announcement.title} - MCS Consulting`,
    description: description,
    openGraph: {
      title: `${announcement.title} - MCS Consulting`,
      description: description,
      type: "article",
      publishedTime: new Date(announcement.date).toISOString(),
    }
  }
}

export default async function AnnouncementDetailPage({ params }: Props) {
  const id = (await params).id

  // We add JSON-LD script here as well!
  const announcement = translations["en"].announcement.items.find((item: any) => item.id === id)

  return (
    <>
      {announcement && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": announcement.title,
              "description": (announcement as any).summary || announcement.content.substring(0, 160) + "...",
              "datePublished": new Date(announcement.date).toISOString(),
              "author": {
                "@type": "Organization",
                "name": "MCS Consulting",
                "url": "https://mcsc.co.id"
              },
              "publisher": {
                "@type": "Organization",
                "name": "MCS Consulting",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://mcsc.co.id/logo.png"
                }
              }
            })
          }}
        />
      )}
      <AnnouncementDetailClient id={id} />
    </>
  )
}
