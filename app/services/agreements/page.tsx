"use client"

import { FileSignature } from "lucide-react"
import { BaseServicePage } from "@/components/base-service-page"
import { useLanguage } from "@/contexts/language-context"

export default function AgreementsPage() {
  const { language } = useLanguage()
  
  const title = {
    en: "Draft Agreement",
    id: "Perjanjian",
    cn: "协议草案",
  }

  const description = {
    en: "Professional legal agreement drafting services including Cooperation Agreements, Sales Agreements, Lease Agreements, and document legalization services.",
    id: "Layanan penyusunan perjanjian hukum profesional termasuk Perjanjian Kerjasama, Perjanjian Jual Beli, Perjanjian Sewa Menyewa, dan layanan legalisasi dokumen.",
    cn: "专业的法律协议起草服务，包括合作协议、销售协议、租赁协议和文件合法化服务。",
  }

  const subServices = [
    {
      title: { en: "Cooperation Agreement", id: "Perjanjian Kerjasama", cn: "合作协议" },
    },
    {
      title: { en: "Sales Agreement", id: "Perjanjian Jual Beli", cn: "销售协议" },
    },
    {
      title: { en: "License Agreement", id: "Perjanjian Lisensi", cn: "许可协议" },
    },
    {
      title: { en: "Lease Agreement", id: "Perjanjian Sewa Menyewa", cn: "租赁协议" },
    },
    {
      title: { en: "Separation of Assets Agreement", id: "Perjanjian Pemisahan Harta", cn: "财产分割协议" },
    },
    {
      title: { en: "Addendum to Agreement", id: "Addendum Perjanjian", cn: "协议附录/补充协议" },
    },
    {
      title: { en: "Document Verification", id: "Verifikasi Dokumen", cn: "文件核实" },
    },
    {
      title: { en: "Document Legalization", id: "Legalisasi Dokumen", cn: "文件合法化" },
    },
  ]

  const ctaText = { 
    en: "Professional Legal Documentation", 
    id: "Dokumentasi Hukum Profesional", 
    cn: "专业的法律文件服务",
  }
  const ctaDescription = { 
    en: "Ensure your business agreements are legally sound and professionally drafted", 
    id: "Pastikan perjanjian bisnis Anda sah secara hukum dan disusun secara profesional",
    cn: "确保您的商业协议在法律上健全且起草专业",
  }

  return (
    <BaseServicePage
      icon={FileSignature}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
    />
  )
}
