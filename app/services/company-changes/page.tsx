"use client"

import { RefreshCw } from "lucide-react"
import { BaseServicePage } from "@/components/base-service-page"

export default function CompanyChangesPage() {
  const title = {
    en: "Changes in Company Documents/Structure",
    id: "Perubahan Dokumen/Struktur Perusahaan",
    cn: "公司文件与结构变更",
  }

  const description = {
    en: "The process of modifying documents that regulate various important aspects of the company. These changes can include several things, such as changing the name, adjusting the amount of authorized capital, and changing the organizational structure.",
    id: "Proses modifikasi dokumen yang mengatur berbagai aspek penting perusahaan. Perubahan ini dapat mencakup beberapa hal, seperti mengubah nama, menyesuaikan jumlah modal dasar, dan mengubah struktur organisasi.",
    cn: "修改规范公司各项重要方面文件的过程。这些变更可以包括多个事项，例如更改公司名称、调整注册资本金额以及更改组织结构。",
  }

  const subServices = [
    {
      title: {
        en: "Amendment to the Company's Articles of Association",
        id: "Perubahan Anggaran Dasar Perusahaan",
        cn: "修改公司章程",
      },
      items: {
        en: [
          "Change of Company Name",
          "Change of Company Domicile",
          "Change/Add Business Fields",
          "Change in Company Capital",
        ],
        id: [
          "Perubahan Nama Perusahaan",
          "Perubahan Domisili Perusahaan",
          "Perubahan/Penambahan Bidang Usaha",
          "Perubahan Modal Perusahaan",
        ],
        cn: [
          "更改公司名称",
          "更改公司地址/住所",
          "更改/新增经营范围",
          "更改公司资本结构",
        ],
      },
    },
    {
      title: {
        en: "Changes in Company Data",
        id: "Perubahan Data Perusahaan",
        cn: "公司数据/信息变更",
      },
      items: {
        en: ["Change in Management Structure", "Extension of Management Structure (Board of Directors and commissioners)"],
        id: ["Perubahan Struktur Pengurus", "Perpanjangan Struktur Pengurus (Direksi dan Dewan Komisaris)"],
        cn: ["更换管理人员/董事会/监事会结构", "延长管理人员任期（董事会和监事会）"],
      },
    },
    {
      title: {
        en: "Branch Office Management",
        id: "Pengurusan Kantor Cabang",
        cn: "分公司设立与管理",
      },
      items: {
        en: ["Branch Office Registration", "Branch Office Documentation", "Compliance Processing"],
        id: ["Pendaftaran Kantor Cabang", "Dokumentasi Kantor Cabang", "Proses Kepatuhan"],
        cn: ["分公司注册登记", "分公司文件筹备", "合规手续办理"],
      },
    },
  ]

  const ctaText = { 
    en: "Need to Update Your Company?", 
    id: "Perlu Memperbarui Perusahaan Anda?",
    cn: "需要更新您的公司文件或结构吗？",
  }
  const ctaDescription = {
    en: "Our experienced team will guide you through every step of the company change process",
    id: "Tim berpengalaman kami akan memandu Anda melalui setiap langkah proses perubahan perusahaan",
    cn: "我们经验丰富的团队将引导您完成公司变更流程的每一步",
  }

  return (
    <BaseServicePage
      icon={RefreshCw}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
    />
  )
}
