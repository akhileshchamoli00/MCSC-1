"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { MapPin, Phone, MessageCircle } from "lucide-react"

export function ContactSection() {
  const { language } = useLanguage()
  const t = translations[language]

  return (
    <section id="contact" className="bg-muted/30 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">{t.contact.title}</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {t.contact.headOffice}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed text-muted-foreground">{t.contact.headAddress}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>021-26053029</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <a href="https://wa.me/6287877967799" className="text-primary hover:underline">
                    WhatsApp: 087877967799
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {t.contact.branchOffice}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed text-muted-foreground">{t.contact.branchAddress}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <a href="https://wa.me/6287877967799" className="text-primary hover:underline">
                    WhatsApp: 087877967799
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
