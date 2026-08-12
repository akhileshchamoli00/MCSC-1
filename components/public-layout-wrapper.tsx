"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppWidget } from "@/components/whatsapp-widget"

export function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const hrmsRoutes = [
    "/login", 
    "/dashboard", 
    "/reset-password",
    "/select-system",
    "/hrms",
    "/business",
    "/shared",
    "/client"
  ];
  
  const isHrms = hrmsRoutes.some(route => pathname?.startsWith(route));

  return (
    <>
      {!isHrms && <Header />}
      {children}
      {!isHrms && <Footer />}
      {!isHrms && <WhatsAppWidget />}
    </>
  )
}
