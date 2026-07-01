import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Playfair_Display, Antonio } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/contexts/language-context"
import { ThemeProvider } from "@/components/theme-provider"
import { GlobalGalaxy } from "@/components/global-galaxy"
import { PublicLayoutWrapper } from "@/components/public-layout-wrapper"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" })
const antonio = Antonio({ subsets: ["latin"], variable: "--font-antonio" })

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mcsc.co.id"),
  title: "MCS Consulting - Company Registration, Business Licensing, Tax & Compliance Services in Indonesia",
  description:
    "Your trusted partner in managing all aspects of business licensing with over 10 years of professional experience.",
  generator: "https://www.mcsc.co.id",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "MCS Consulting (PT Mandiri Cipta Solusi)",
  url: "https://www.mcsc.co.id",
  logo: "https://www.mcsc.co.id/logo.png",
  description:
    "Business registration, licensing, tax, and compliance consulting firm serving local and foreign investors in Indonesia since 2013.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Springhill Office Tower Lantai 9 Unit 9C, Jalan Benyamin Suaeb Blok D7-Kemayoran",
    addressLocality: "Jakarta Utara",
    postalCode: "14410",
    addressCountry: "ID",
  },
  telephone: "+62-878-7796-7799",
  email: "admin@mcsc.co.id",
  sameAs: ["https://www.instagram.com/mcsc.id/"],
  areaServed: "Indonesia",
  foundingDate: "2013",
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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-transparent text-foreground selection:bg-primary/30 relative">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalGalaxy />
          <LanguageProvider>
            <TooltipProvider>
              <PublicLayoutWrapper>
                {children}
              </PublicLayoutWrapper>
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  )
}