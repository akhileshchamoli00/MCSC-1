"use client"

import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { Calendar, Bell, Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BorderGlow from "@/components/ui/BorderGlow"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"

export default function AnnouncementsPage() {
  const { language } = useLanguage()
  const t = translations[language]

  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError(language === "en" ? "Please enter your email." : (language === "cn" ? "请输入您的电子邮件。" : "Silakan masukkan email Anda."))
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(language === "en" ? "Please enter a valid email." : (language === "cn" ? "请输入有效的电子邮件。" : "Silakan masukkan email yang valid."))
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSubscribed(true)
  }

  return (
    <main>
        {/* Hero Section */}
        <section className="relative pt-6 pb-4 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="mb-4 inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  {language === "en" ? "Regulations" : (language === "cn" ? "政策法规" : "Regulasi")}
                </div>
                <h1 className="mb-6 text-4xl font-bold text-balance md:text-5xl">
                  {language === "en" ? "Latest Regulatory Updates" : (language === "cn" ? "最新监管动态" : "Pembaruan Regulasi Terbaru")}
                </h1>
                <p className="text-lg text-muted-foreground text-pretty">
                  {language === "en"
                    ? "Stay informed with the latest governmental regulations, laws, and announcements affecting business in Indonesia."
                    : (language === "cn"
                      ? "随时了解影响印度尼西亚商业的最新政府法规、法律和公告动态。"
                      : "Tetap terinformasi dengan regulasi, undang-undang, dan pengumuman pemerintah terbaru yang memengaruhi bisnis di Indonesia.")}
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Announcements List */}
        <section className="pt-4 pb-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 max-w-4xl mx-auto">
              {t.announcement.items.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link href={`/announcement/${announcement.id}`} className="block group">
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
                      <Card className="border-none bg-background/50 backdrop-blur-md transition-all duration-300 hover:bg-background/70 cursor-pointer h-full">
                        <CardHeader>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Calendar className="h-4 w-4" />
                            <span>{announcement.date}</span>
                          </div>
                          <CardTitle className="text-2xl group-hover:text-primary transition-colors line-clamp-2">
                            {announcement.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground line-clamp-3 mb-6">
                            {announcement.content}
                          </p>
                          <div className="flex items-center text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                            {language === "en" ? "Read Full Regulation" : (language === "cn" ? "阅读完整法规" : "Baca Selengkapnya")}
                            <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                          </div>
                        </CardContent>
                      </Card>
                    </BorderGlow>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter / CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-2xl">
              <div className="mb-6 inline-flex rounded-full bg-primary/10 p-3">
                {isSubscribed ? (
                  <Check className="h-6 w-6 text-green-500 animate-bounce" />
                ) : (
                  <Bell className="h-6 w-6 text-primary animate-bounce" />
                )}
              </div>
              <h2 className="mb-4 text-3xl font-bold">
                {isSubscribed
                  ? (language === "en" ? "Subscription Successful!" : (language === "cn" ? "订阅成功！" : "Langganan Berhasil!"))
                  : (language === "en" ? "Never Miss an Update" : (language === "cn" ? "绝不错过任何更新" : "Jangan Lewatkan Pembaruan"))
                }
              </h2>

              {isSubscribed ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {language === "en"
                      ? "Thank you for subscribing! You will receive the latest regulatory updates directly at "
                      : (language === "cn"
                        ? "感谢您的订阅！您将在以下邮箱直接接收最新的监管动态："
                        : "Terima kasih telah berlangganan! Anda akan menerima pembaruan regulasi terbaru langsung di ")}
                    <span className="font-semibold text-primary">{email}</span>.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubscribed(false)
                      setEmail("")
                    }}
                    className="rounded-lg border border-primary/20 px-6 py-2.5 text-sm font-semibold transition-all hover:bg-primary/10 active:scale-95"
                  >
                    {language === "en" ? "Subscribe Another Email" : (language === "cn" ? "订阅另一个邮箱" : "Berlangganan Email Lain")}
                  </button>
                </motion.div>
              ) : (
                <>
                  <p className="mb-8 text-muted-foreground">
                    {language === "en"
                      ? "Subscribe to our newsletter to receive the latest regulatory updates directly in your inbox."
                      : (language === "cn"
                        ? "订阅我们的时事通讯，直接在您的收件箱中接收最新的监管更新动态。"
                        : "Berlangganan buletin kami untuk menerima pembaruan regulasi terbaru langsung di kotak masuk Anda.")}
                  </p>
                  <form onSubmit={handleSubscribe} className="flex flex-col gap-3 max-w-lg mx-auto">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (error) setError("")
                        }}
                        disabled={isLoading}
                        placeholder={language === "en" ? "Enter your email" : (language === "cn" ? "输入您的邮箱地址" : "Masukkan email Anda")}
                        className="rounded-lg border bg-background px-6 py-3 focus:outline-none focus:ring-2 focus:ring-primary min-w-[300px] disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 min-w-[160px] disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {language === "en" ? "Subscribing..." : (language === "cn" ? "正在订阅..." : "Sedang Berlangganan...")}
                          </>
                        ) : (
                          language === "en" ? "Subscribe Now" : (language === "cn" ? "立即订阅" : "Berlangganan Sekarang")
                        )}
                      </button>
                    </div>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm text-left sm:text-center mt-1"
                      >
                        {error}
                      </motion.p>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
    </main>
  )
}
