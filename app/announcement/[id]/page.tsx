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
          <h1 className="text-2xl font-bold mb-4">Regulation Not Found</h1>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    )
  }

  // Split and parse provisions if they exist in content
  const lines = announcement.content.split("\n")
  const introParagraphs: string[] = []
  const provisions: Array<{ number: string; term: string; definition: string }> = []

  const hasProvisionsMarker = announcement.content.toLowerCase().includes("provisions & definitions") || 
                              announcement.content.toLowerCase().includes("ketentuan umum & definisi") ||
                              announcement.content.includes("项核心规定与定义")

  if (hasProvisionsMarker) {
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
  }

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
            {language === "en" ? "Back to Home" : (language === "cn" ? "返回主页" : "Kembali ke Beranda")}
          </Button>

          <Card className="border-2 border-primary/20 bg-background/50 backdrop-blur-md shadow-2xl overflow-hidden rounded-2xl">
            <CardHeader className="pt-10 pb-6 px-8 md:px-12 border-b border-primary/10 text-center flex flex-col items-center">
              <div className="flex items-center justify-center gap-3 text-primary font-medium mb-4">
                <Calendar className="h-5 w-5" />
                <span>{announcement.date}</span>
              </div>
              <CardTitle className="text-3xl md:text-5xl font-bold leading-tight tracking-tight text-foreground text-center">
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
                            <h4 className="font-sans font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
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
              ) : (() => {
                let hasSeenLowercase = false;
                return (
                  <div className="prose prose-lg dark:prose-invert max-w-none text-xl leading-relaxed text-muted-foreground">
                    {announcement.content.split('\n').map((line, idx) => {
                      if (!hasSeenLowercase && line !== line.toUpperCase()) {
                        hasSeenLowercase = true;
                      }
                      const isHeader = !hasSeenLowercase;
                      return (
                        <div key={idx} className={isHeader ? "text-center font-bold" : "whitespace-pre-wrap text-justify"}>
                          {line === "" ? <br /> : line}
                        </div>
                      )
                    })}
                  </div>
                );
              })()}

              {/* Summary and Key Points */}
              {((announcement as any).summary || (announcement as any).keyPoints) && (
                <div className="mt-16 relative animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Decorative background blur gradient */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-primary/10 rounded-3xl blur opacity-25" />
                  
                  {/* Glassmorphic Container */}
                  <div className="relative backdrop-blur-xl bg-background/40 border border-primary/20 shadow-2xl rounded-3xl p-8 md:p-12 overflow-hidden">
                    
                    {/* Subtle noise/texture overlay for premium feel */}
                    <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

                    {/* Summary Section */}
                    {(announcement as any).summary && (
                      <div className="relative z-10 mb-10">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-10 w-1 rounded-full bg-primary" />
                          <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            {language === "en" ? "Executive Summary" : (language === "cn" ? "执行摘要" : "Ringkasan Eksekutif")}
                          </h3>
                        </div>
                        <p className="text-lg md:text-xl leading-relaxed text-muted-foreground/90 font-medium pl-5 border-l border-primary/20 whitespace-pre-wrap">
                          {(announcement as any).summary}
                        </p>
                      </div>
                    )}

                    {/* Key Points Section */}
                    {(announcement as any).keyPoints && (announcement as any).keyPoints.length > 0 && (
                      <div className="relative z-10 pt-8 border-t border-primary/10">
                        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                          <span className="text-primary opacity-80">✦</span>
                          {language === "en" ? "Key Takeaways" : (language === "cn" ? "核心要点" : "Poin Utama")}
                        </h3>
                        <ul className="flex flex-col gap-4 pl-2">
                          {(announcement as any).keyPoints.map((point: string, idx: number) => (
                            <li key={idx} className="flex gap-4 text-muted-foreground items-start group/item">
                              <span className="text-primary/50 mt-2 shrink-0 transition-colors group-hover/item:text-primary">
                                <div className="h-2 w-2 rounded-full bg-current" />
                              </span>
                              <span className="leading-relaxed text-base md:text-lg">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
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
                      {language === "en" ? "View Official Reference (BPK)" : (language === "cn" ? "查看官方参考 (BPK)" : "Lihat Referensi Resmi (BPK)")}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
              
              <div className="mt-16 pt-8 border-t border-primary/10">
                <p className="text-sm text-muted-foreground italic">
                  {language === "en" 
                    ? "Published by MCS Consulting Media Team" 
                    : (language === "cn" 
                      ? "由 MCS 咨询媒体团队发布" 
                      : "Diterbitkan oleh Tim Media MCS Consulting")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
    </main>
  )
}
