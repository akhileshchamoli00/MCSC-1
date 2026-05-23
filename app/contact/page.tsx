"use client"

import type React from "react"

import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import BorderGlow from "@/components/ui/BorderGlow"

export default function ContactPage() {
  const { language } = useLanguage()
  const t = translations[language]
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const localT = {
    en: {
      subtitle: "Get in touch with us for your business licensing needs",
      hours: "Mon - Fri: 8:00 AM - 5:00 PM",
      sendMessage: "Send us a message",
      name: "Name",
      namePlaceholder: "Your name",
      emailPlaceholder: "your@email.com",
      phone: "Phone",
      message: "Message",
      messagePlaceholder: "How can we help you?",
      submit: "Send Message",
      submitting: "Sending...",
      success: "Message sent successfully! Our team will get back to you soon.",
      error: "Failed to send message. Please try again or contact us via WhatsApp."
    },
    id: {
      subtitle: "Hubungi kami untuk kebutuhan perizinan usaha Anda",
      hours: "Sen - Jum: 8.00 - 17.00",
      sendMessage: "Kirim pesan kepada kami",
      name: "Nama",
      namePlaceholder: "Nama Anda",
      emailPlaceholder: "email@anda.com",
      phone: "Telepon",
      message: "Pesan",
      messagePlaceholder: "Bagaimana kami dapat membantu Anda?",
      submit: "Kirim Pesan",
      submitting: "Mengirim...",
      success: "Pesan berhasil dikirim! Tim kami akan segera menghubungi Anda.",
      error: "Gagal mengirim pesan. Silakan coba lagi atau hubungi kami melalui WhatsApp."
    },
    cn: {
      subtitle: "联系我们以获取您的业务许可需求",
      hours: "周一 - 周五: 上午 8:00 - 下午 5:00",
      sendMessage: "给我们发送留言",
      name: "姓名",
      namePlaceholder: "您的姓名",
      emailPlaceholder: "your@email.com",
      phone: "电话",
      message: "留言内容",
      messagePlaceholder: "我们能为您提供什么帮助？",
      submit: "发送留言",
      submitting: "正在发送...",
      success: "留言发送成功！我们的团队会尽快与您联系。",
      error: "发送留言失败。请重试或通过 WhatsApp 与我们联系。"
    }
  }[language] || {
    subtitle: "Get in touch with us for your business licensing needs",
    hours: "Mon - Fri: 9:00 AM - 5:00 PM",
    sendMessage: "Send us a message",
    name: "Name",
    namePlaceholder: "Your name",
    emailPlaceholder: "your@email.com",
    phone: "Phone",
    message: "Message",
    messagePlaceholder: "How can we help you?",
    submit: "Send Message",
    submitting: "Sending...",
    success: "Message sent successfully! Our team will get back to you soon.",
    error: "Failed to send message. Please try again or contact us via WhatsApp."
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage(null)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus("success")
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
        })
      } else {
        setStatus("error")
        setErrorMessage(data.error || "Failed to send message.")
      }
    } catch (err) {
      console.error("Resend API contact submission error:", err)
      setStatus("error")
      setErrorMessage("Network error. Please try again later.")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <main>
      {/* Hero Section */}
      <section className="relative pt-6 pb-4 overflow-hidden">
        <div className="absolute inset-0 z-0">

        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold text-balance md:text-5xl">{t.contact.title}</h1>
            <p className="text-lg text-muted-foreground text-pretty">
              {localT.subtitle}
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
                      href="tel:+6285718189799"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      +62 878-7796-7799
                    </a>
                  </div>
                  <div className="flex gap-4 items-center group-hover:translate-x-1 transition-transform">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                    <a
                      href="mailto:admin@mcsc.co.id"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      admin@mcsc.co.id
                    </a>
                  </div>
                  <div className="flex gap-4 items-center group-hover:translate-x-1 transition-transform">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-muted-foreground">
                      {localT.hours}
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
            <BorderGlow
              edgeSensitivity={30}
              glowColor="220 80 80"
              backgroundColor="transparent"
              borderRadius={16}
              glowRadius={40}
              glowIntensity={1}
              coneSpread={25}
              animated={false}
              colors={['#1e40af', '#10b981', '#f97316']}
              className="h-full"
            >
              <div className="rounded-lg border-none bg-background/40 backdrop-blur-md p-8 h-full">
                <h2 className="mb-6 text-2xl font-bold">
                  {localT.sendMessage}
                </h2>
                {status === "success" && (
                  <div className="p-4 mb-6 text-sm rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold shadow-lg shadow-emerald-500/5">
                    ✨ {localT.success}
                  </div>
                )}
                {status === "error" && (
                  <div className="p-4 mb-6 text-sm rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold shadow-lg shadow-red-500/5">
                    <div className="font-bold">❌ {localT.error}</div>
                    {errorMessage && (
                      <div className="text-xs opacity-90 mt-2 font-mono bg-red-950/40 p-2.5 rounded-lg border border-red-500/10">
                        Error Details: {errorMessage}
                      </div>
                    )}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">{localT.name}</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={status === "submitting"}
                      className="w-full rounded-md border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow disabled:opacity-50"
                      placeholder={localT.namePlaceholder}
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
                      disabled={status === "submitting"}
                      className="w-full rounded-md border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow disabled:opacity-50"
                      placeholder={localT.emailPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">{localT.phone}</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={status === "submitting"}
                      className="w-full rounded-md border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow disabled:opacity-50"
                      placeholder="+62 xxx xxx xxx"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">{localT.message}</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      disabled={status === "submitting"}
                      rows={5}
                      className="w-full rounded-md border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-shadow disabled:opacity-50"
                      placeholder={localT.messagePlaceholder}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full transition-transform hover:scale-105 disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {status === "submitting" ? localT.submitting : localT.submit}
                  </Button>
                </form>
              </div>
            </BorderGlow>
          </div>
        </div>
      </section>
    </main>
  )
}
