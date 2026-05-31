import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Playfair_Display, Antonio } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/contexts/language-context"
import { ThemeProvider } from "@/components/theme-provider"
import { GlobalGalaxy } from "@/components/global-galaxy"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppWidget } from "@/components/whatsapp-widget"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" })
const antonio = Antonio({ subsets: ["latin"], variable: "--font-antonio" })

export const metadata: Metadata = {
  metadataBase: new URL("https://mcsc.co.id"),
  title: "MCS Consulting - Company Registration, Business Licensing, Tax & Compliance Services in Indonesia",
  description:
    "Your trusted partner in managing all aspects of business licensing with over 10 years of professional experience.",
  keywords: ["MCS Consulting", "Indonesia Business Consulting", "Company Registration Indonesia", "Business Licensing", "Tax Services Indonesia", "Compliance Services", "BPK Regulations"],
  generator: "v0.app",
  alternates: {
    canonical: "https://mcsc.co.id",
  },
  openGraph: {
    title: "MCS Consulting - Your Business Partner in Indonesia",
    description: "Your trusted partner in managing all aspects of business licensing with over 10 years of professional experience.",
    url: "https://mcsc.co.id",
    siteName: "MCS Consulting",
    locale: "en_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCS Consulting",
    description: "Your trusted partner in managing all aspects of business licensing with over 10 years of professional experience.",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${antonio.variable} ${geistSans.variable} ${geistMono.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased min-h-screen bg-transparent text-foreground selection:bg-primary/30 relative">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalGalaxy />
          <LanguageProvider>
            <Header />
            {children}
            <Footer />
            <WhatsAppWidget />
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
