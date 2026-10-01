"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppWidget } from "@/components/whatsapp-widget"
import { CartProvider } from "@/contexts/cart-context"
import { CartDrawer } from "@/components/cart-drawer"

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
    "/client",
    "/member"
  ];
  
  const isHrms = hrmsRoutes.some(route => pathname?.startsWith(route));

  return (
    <CartProvider>
      {!isHrms && <Header />}
      {children}
      {!isHrms && <Footer />}
      {!isHrms && <WhatsAppWidget />}
      {!isHrms && <CartDrawer />}
    </CartProvider>
  )
}
