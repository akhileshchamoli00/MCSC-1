"use client"

import { Users } from "lucide-react"
import { BaseServicePage } from "@/components/base-service-page"

export default function WorkPermitPage() {
  const title = {
    en: "Work Permit",
    id: "Izin Kerja",
    cn: "工作许可/工作签证",
  }

  const description = {
    en: "Management of foreign national permits such as KITAS, KITAP, Reporting Certificate (TTKOA), Residence Certificate (SKTT), RPTKA, Mandatory Reporting, Exit Permit Only (EPO), Exit Re-entry Permit (ERP)",
    id: "Pengurusan izin tenaga kerja asing seperti KITAS, KITAP, Surat Keterangan Melapor (TTKOA), Surat Keterangan Tinggal Tetap (SKTT), RPTKA, Wajib Lapor, Exit Permit Only (EPO), Exit Re-entry Permit (ERP)",
    cn: "管理和办理外籍人员许可证件，例如工作准证 (KITAS)、永久居留证 (KITAP)、报告证明 (TTKOA)、临时居住证明 (SKTT)、外籍员工聘用计划 (RPTKA)、强制报告、仅限出境许可 (EPO)、出境重入境许可 (ERP)",
  }

  const subServices = [
    {
      title: { en: "Limited Stay Permit (KITAS)", id: "Kartu Izin Tinggal Terbatas (KITAS)", cn: "工作/暂住准证 (KITAS)" },
      items: {
        en: [
          "New Application & Extension",
          "Working KITAS",
          "Family Reunion KITAS",
          "Official Permit for Foreign Nationals",
        ],
        id: [
          "Permohonan Baru & Perpanjangan",
          "KITAS Kerja",
          "KITAS Penyatuan Keluarga",
          "Izin Resmi Warga Negara Asing",
        ],
        cn: [
          "新申请与延期服务",
          "工作类 KITAS",
          "家属团聚类 KITAS",
          "外籍人士法定许可证",
        ],
      },
    },
    {
      title: { en: "Permanent Residence (KITAP)", id: "Kartu Izin Tinggal Tetap (KITAP)", cn: "永久居留准证 (KITAP)" },
      items: {
        en: [
          "Permanent Residence Permit",
          "Available after two KITAS extensions",
          "Valid for 5 years per extension",
          "Full Immigration Compliance",
        ],
        id: [
          "Izin Tinggal Tetap",
          "Tersedia setelah dua kali perpanjangan KITAS",
          "Berlaku 5 tahun per perpanjangan",
          "Kepatuhan Imigrasi Penuh",
        ],
        cn: [
          "永久居留权申请",
          "持有两次 KITAS 延期后可申请",
          "每期延长有效期为5年",
          "完全合规的移民身份",
        ],
      },
    },
    {
      title: { en: "Permit Closures (EPO/ERP)", id: "Penutupan Izin (EPO/ERP)", cn: "注销与注销出境许可 (EPO/ERP)" },
      items: {
        en: [
          "Exit Permit Only (EPO)",
          "Exit Re-entry Permit (ERP)",
          "Returning Immigration Documents",
          "Ending Stay in Indonesia",
        ],
        id: [
          "Exit Permit Only (EPO)",
          "Exit Re-entry Permit (ERP)",
          "Pengembalian Dokumen Imigrasi",
          "Mengakhiri Masa Tinggal di Indonesia",
        ],
        cn: [
          "出境许可 (EPO)",
          "出境重入境许可 (ERP)",
          "退还移民主管机关文件",
          "终止在印尼的逗留期",
        ],
      },
    },
    {
      title: { en: "Business Visas", id: "Visa Bisnis", cn: "商务签证 (Visa Bisnis)" },
      items: {
        en: [
          "Multiple Business Visa",
          "Frequent Business Trips",
          "2-Month Validity per Visit",
          "Sponsorship Support",
        ],
        id: [
          "Visa Bisnis Multiple",
          "Perjalanan Bisnis Routin",
          "Validitas 2 Bulan per Kunjungan",
          "Dukungan Sponsor",
        ],
        cn: [
          "多次往返商务签证",
          "满足频繁商务旅行需求",
          "每次入境可停留2个月",
          "赞助商/担保函支持",
        ],
      },
    },
    {
      title: { en: "Official Certificates", id: "Surat Keterangan Resmi", cn: "官方登记与证明材料" },
      items: {
        en: [
          "Residence Certificate (SKTT)",
          "Reporting Certificate (STM)",
          "Dukcapil & Police Coordination",
          "Identity Documents for Foreigners",
        ],
        id: [
          "Surat Keterangan Tinggal Tetap (SKTT)",
          "Surat Keterangan Melapor (STM)",
          "Koordinasi Dukcapil & Polisi",
          "Dokumen Identitas Orang Asing",
        ],
        cn: [
          "临时居留证明 (SKTT)",
          "警方申报证明 (STM)",
          "户政局与警方协调对接",
          "外籍人士身份证明文件",
        ],
      },
    },
  ]

  const ctaText = { 
    en: "Simplify Your Immigration Process", 
    id: "Permudah Proses Imigrasi Anda",
    cn: "简化您的移民与签证流程",
  }
  const ctaDescription = {
    en: "Let us handle all your foreign worker permit requirements efficiently and professionally",
    id: "Biarkan kami menangani semua persyaratan izin tenaga kerja asing Anda secara efisien dan profesional",
    cn: "让我们高效、专业地为您处理所有的外籍员工工作许可和签证要求",
  }

  return (
    <BaseServicePage
      icon={Users}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
    />
  )
}
