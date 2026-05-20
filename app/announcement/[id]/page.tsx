"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { Calendar, ChevronLeft, ArrowLeft, ExternalLink, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnnouncementDetailPage() {
  const { id } = useParams()
  const { language } = useLanguage()
  const router = useRouter()
  const t = translations[language]
  const [searchQuery, setSearchQuery] = useState("")

  const announcement = t.announcement.items.find((item) => item.id === id)

  if (!announcement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Announcement Not Found</h1>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    )
  }

  // Split and parse provisions if they exist in content
  const lines = announcement.content.split("\n")
  const introParagraphs: string[] = []
  const provisions: Array<{ number: string; term: string; definition: string }> = []

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return

    // Regex to match lines starting with numbers like "1. ", "40. "
    const match = trimmed.match(/^(\d+)\.\s*(.*)$/)
    if (match) {
      const num = match[1]
      const rest = match[2]

      // Try to split the term and definition by the first colon ":"
      const colonIdx = rest.indexOf(":")
      if (colonIdx !== -1) {
        const term = rest.substring(0, colonIdx).trim()
        const definition = rest.substring(colonIdx + 1).trim()
        provisions.push({
          number: num.padStart(2, "0"),
          term,
          definition
        })
      } else {
        provisions.push({
          number: num.padStart(2, "0"),
          term: "",
          definition: rest
        })
      }
    } else {
      // Exclude generic header lines from intro paragraphs
      const lower = trimmed.toLowerCase()
      if (
        !lower.includes("provisions & definitions") && 
        !lower.includes("ketentuan umum & definisi") && 
        !lower.includes("项核心规定与定义")
      ) {
        introParagraphs.push(trimmed)
      }
    }
  })

  // Filter provisions based on search query
  const filteredProvisions = provisions.filter(
    (item) =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <main className="flex-grow container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            className="mb-8 group transition-all hover:bg-transparent hover:text-primary p-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
            {language === "en" ? "Back to Home" : "Kembali ke Beranda"}
          </Button>

          <Card className="border-2 border-primary/20 bg-background/40 backdrop-blur-md shadow-2xl overflow-hidden rounded-2xl">
            <CardHeader className="pt-10 pb-6 px-8 md:px-12 border-b border-primary/10">
              <div className="flex items-center gap-3 text-primary font-medium mb-4">
                <Calendar className="h-5 w-5" />
                <span>{announcement.date}</span>
              </div>
              <CardTitle className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-foreground">
                {announcement.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-10 px-8 md:px-12">
              {/* Intro paragraphs */}
              {introParagraphs.length > 0 && (
                <div className="mb-10 space-y-4">
                  {introParagraphs.map((para, i) => (
                    <p key={i} className="text-lg md:text-xl leading-relaxed text-muted-foreground">
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Provisions layout */}
              {provisions.length > 0 ? (
                <div className="mt-8 border-t border-primary/10 pt-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground">
                      {language === "en" ? "General Provisions & Definitions" : "Ketentuan Umum & Definisi"}
                    </h3>
                    
                    {/* Premium Search Bar */}
                    <div className="relative w-full md:max-w-xs">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder={language === "en" ? "Search provisions..." : "Cari ketentuan..."}
                        className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-primary/20 bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* 2-Column Responsive Grid */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {filteredProvisions.map((prov, i) => (
                      <div
                        key={i}
                        className="p-6 rounded-2xl border border-primary/10 bg-primary/5 hover:bg-primary/10 backdrop-blur-[2px] transition-all duration-300 flex gap-4 group hover:shadow-xl hover:border-primary/30 animate-in fade-in slide-in-from-bottom-2 duration-200"
                      >
                        <span className="text-2xl font-serif font-black text-primary/30 group-hover:text-primary transition-colors select-none leading-none pt-1">
                          {prov.number}
                        </span>
                        <div className="flex-1">
                          {prov.term && (
                            <h4 className="font-serif font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                              {prov.term}
                            </h4>
                          )}
                          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                            {prov.definition}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredProvisions.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground text-lg">
                      {language === "en" ? "No provisions match your search query." : "Tidak ada ketentuan yang sesuai dengan pencarian Anda."}
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback for regular announcements */
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-xl leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                </div>
              )}

              {((announcement as any).referenceUrl || (announcement as any).downloadUrl) && (
                <div className="mt-12 pt-8 border-t border-primary/10 flex flex-wrap gap-4 justify-start">
                  {(announcement as any).downloadUrl && (
                    <a
                      href={(announcement as any).downloadUrl}
                      download
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 text-sm cursor-pointer"
                    >
                      {language === "en" ? "Download Official Document" : (language === "cn" ? "下载官方文件" : "Unduh Dokumen Resmi")}
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  {(announcement as any).referenceUrl && (
                    <a
                      href={(announcement as any).referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 text-sm"
                    >
                      {language === "en" ? "View Official Reference (BPK)" : "Lihat Referensi Resmi (BPK)"}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
              
              <div className="mt-16 pt-8 border-t border-primary/10">
                <p className="text-sm text-muted-foreground italic">
                  {language === "en" 
                    ? "Published by MCS Consulting Media Team" 
                    : "Diterbitkan oleh Tim Media MCS Consulting"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
    </main>
  )
}
