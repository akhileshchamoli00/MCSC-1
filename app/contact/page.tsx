"use client"

import type React from "react"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppWidget } from "@/components/whatsapp-widget"
import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import ElectricBorder from "@/components/ui/ElectricBorder"

export default function ContactPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Create WhatsApp message
    const message = `Hello, my name is ${formData.name}. Email: ${formData.email}, Phone: ${formData.phone}. Message: ${formData.message}`
    const whatsappUrl = `https://wa.me/6281210001945?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative pt-6 pb-4 overflow-hidden">
          <div className="absolute inset-0 z-0">

          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-4xl font-bold text-balance md:text-5xl">{t.contact.title}</h1>
              <p className="text-lg text-muted-foreground text-pretty">
                {language === "en"
                  ? "Get in touch with us for your business licensing needs"
                  : "Hubungi kami untuk kebutuhan perizinan usaha Anda"}
              </p>
            </div>
          </div>
        </section>
        <section className="pt-2 pb-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Contact Information */}
              <div className="space-y-8">
                <div className="group">
                  <h2 className="mb-6 text-2xl font-bold">{t.contact.headOffice}</h2>
                  <div className="space-y-4">
                    <div className="flex gap-4 group-hover:translate-x-1 transition-transform">
                      <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <p className="text-muted-foreground text-pretty">{t.contact.headAddress}</p>
                    </div>
                    <div className="flex gap-4 items-center group-hover:translate-x-1 transition-transform">
                      <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                      <a
                        href="tel:+6281210001945"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        +62 812-1000-1945
                      </a>
                    </div>
                    <div className="flex gap-4 items-center group-hover:translate-x-1 transition-transform">
                      <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                      <a
                        href="mailto:info@MCS Consulting.co.id"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        info@MCS Consulting.co.id
                      </a>
                    </div>
                    <div className="flex gap-4 items-center group-hover:translate-x-1 transition-transform">
                      <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                      <p className="text-muted-foreground">
                        {language === "en" ? "Mon - Fri: 9:00 AM - 5:00 PM" : "Sen - Jum: 09.00 - 17.00"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <h2 className="mb-6 text-2xl font-bold">{t.contact.branchOffice}</h2>
                  <div className="space-y-4">
                    <div className="flex gap-4 group-hover:translate-x-1 transition-transform">
                      <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <p className="text-muted-foreground text-pretty">{t.contact.branchAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <ElectricBorder
                color="#1e40af"
                speed={0.8}
                chaos={0.1}
                borderRadius={16}
                className="h-full"
              >
                <div className="rounded-lg border-none bg-background/40 backdrop-blur-md p-8 h-full">
                  <h2 className="mb-6 text-2xl font-bold">
                    {language === "en" ? "Send us a message" : "Kirim pesan kepada kami"}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">{language === "en" ? "Name" : "Nama"}</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder={language === "en" ? "Your name" : "Nama Anda"}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder={language === "en" ? "your@email.com" : "email@anda.com"}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">{language === "en" ? "Phone" : "Telepon"}</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full rounded-md border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder="+62 xxx xxx xxx"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">{language === "en" ? "Message" : "Pesan"}</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full rounded-md border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                        placeholder={language === "en" ? "How can we help you?" : "Bagaimana kami dapat membantu Anda?"}
                      />
                    </div>
                    <Button type="submit" className="w-full transition-transform hover:scale-105">
                      {language === "en" ? "Send Message" : "Kirim Pesan"}
                    </Button>
                  </form>
                </div>
              </ElectricBorder>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppWidget />
    </div>
  )
}
