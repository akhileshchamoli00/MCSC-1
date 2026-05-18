"use client"

import { Lightbulb } from "lucide-react"
import { BaseServicePage } from "@/components/base-service-page"

export default function IntellectualPropertyPage() {
  const title = {
    en: "Intellectual Property Rights",
    id: "Hak Kekayaan Intelektual",
    cn: "知识产权",
  }

  const description = {
    en: "IPR is a legal right granted to protect the intellectual work and innovation of a person or entity. Includes registration of Trademarks, Industrial Designs, and Copyright.",
    id: "HKI adalah hak hukum yang diberikan untuk melindungi karya intelektual dan inovasi seseorang atau entitas. Mencakup pendaftaran Merek, Desain Industri, dan Hak Cipta.",
    cn: "知识产权是为保护个人或实体的智力成果和创新而授予的法定权利。包括商标、工业设计和版权的注册登记。",
  }

  const subServices = [
    {
      title: { en: "Trademark Registration", id: "Pendaftaran Merek", cn: "商标注册" },
      items: {
        en: ["Brand Name & Logo Protection", "10-Year Legal Protection", "DJKI Registration", "Official Certificate Extract"],
        id: ["Perlindungan Nama & Logo", "Perlindungan Hukum 10 Tahun", "Pendaftaran DJKI", "Petikan Sertifikat Resmi"],
        cn: ["品牌名称与标志保护", "10年法定保护期", "DJKI（知识产权总局）注册", "官方证书副本"],
      },
    },
    {
      title: { en: "Trademark Management", id: "Pengelolaan Merek", cn: "商标管理与后期维护" },
      items: {
        en: ["Trademark Renewal", "Assignment of Ownership", "License Recording", "Address Changes"],
        id: ["Perpanjangan Merek", "Pengalihan Hak", "Pencatatan Lisensi", "Perubahan Alamat"],
        cn: ["商标续展", "所有权转让", "许可合同备案", "注册地址变更"],
      },
    },
    {
      title: { en: "Copyright Registration", id: "Pendaftaran Hak Cipta", cn: "版权/著作权登记" },
      items: {
        en: ["Protection for Creative Works", "Literary & Artistic Works", "Digital Content Protection", "Legal Ownership Proof"],
        id: ["Perlindungan Karya Kreatif", "Karya Sastra & Seni", "Perlindungan Konten Digital", "Bukti Kepemilikan Hukum"],
        cn: ["创意作品保护", "文学与艺术作品登记", "数字内容版权保护", "法定所有权证明"],
      },
    },
    {
      title: { en: "Industrial Design", id: "Desain Industri", cn: "工业设计专利申请" },
      items: {
        en: ["Product Aesthetic Protection", "Shape & Configuration", "Commercial Design Rights", "Market Exclusivity"],
        id: ["Perlindungan Estetika Produk", "Bentuk & Konfigurasi", "Hak Desain Komersial", "Eksklusivitas Pasar"],
        cn: ["产品外观美学保护", "形状与配置专利", "商业设计权", "市场独占权保护"],
      },
    },
  ]

  const ctaText = { 
    en: "Protect Your Intellectual Property", 
    id: "Lindungi Kekayaan Intelektual Anda",
    cn: "保护您的知识产权",
  }
  const ctaDescription = { 
    en: "Secure your innovations and creative works with comprehensive IP protection services", 
    id: "Amankan inovasi dan karya kreatif Anda dengan layanan perlindungan HKI yang komprehensif",
    cn: "通过全方位的知识产权保护服务，确保您的创新和创意作品安全",
  }

  return (
    <BaseServicePage
      icon={Lightbulb}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
    />
  )
}
