"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { WhatsAppWidget } from "@/components/whatsapp-widget"

export function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Routes where the public Header/Footer should be hidden
  const hrmsRoutes = [
    "/login", 
    "/dashboard", 
    "/employees", 
    "/attendance", 
    "/leave",
    "/leave-approval",
    "/apply-leave",
    "/payroll", 
    "/my-payroll",
    "/assets", 
    "/my-assets",
    "/performance", 
    "/roles",
    "/settings",
    "/profile",
    "/notifications",
    "/timesheets",
    "/timesheet-management",
    "/reset-password",
    "/public-holidays",
    "/clients",
    "/chat-center",
    "/my-clients",
    "/chat",
    "/client",
    "/access-control",
    "/calendar"
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
