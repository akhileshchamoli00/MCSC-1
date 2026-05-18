"use client"

import { Building2 } from "lucide-react"
import { BaseServicePage } from "@/components/base-service-page"

export default function EstablishmentPage() {
  const title = {
    en: "Establishment of Business Entities/Legal Entities",
    id: "Pendirian Badan Usaha/Badan Hukum",
    cn: "业务实体/法人实体设立",
  }

  const description = {
    en: "Establishment of local PT, PMA PT, Individual PT, Foundation, Firm, CV, Cooperative. The formal process of forming a legally recognized business entity.",
    id: "Pendirian PT lokal, PT PMA, PT Perseorangan, Yayasan, Firma, CV, Koperasi. Proses formal pembentukan badan usaha yang diakui secara hukum.",
    cn: "设立本地 PT、PT PMA（外资）、个人 PT、基金会、商号、CV、合作社。建立法律认可的商业实体的正式程序。",
  }

  const subServices = [
    {
      title: { en: "Establishment Local Investment", id: "Pendirian PT Lokal", cn: "设立本地投资公司 (PT Lokal)" },
      items: {
        en: [
          "Deed of Establishment",
          "Ministry of Law and Human Rights Decree",
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "Akta Pendirian",
          "SK Kemenkumham",
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "设立契约",
          "法律与人权部批文",
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
    {
      title: { en: "Establishment Foreign Investment-PMA", id: "Pendirian PT PMA", cn: "设立外商投资公司 (PT PMA)" },
      items: {
        en: [
          "Deed of Establishment",
          "Ministry of Law and Human Rights Decree",
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "Akta Pendirian",
          "SK Kemenkumham",
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "设立契约",
          "法律与人权部批文",
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
    {
      title: { en: "Commanditaire Vennootschap (CV)", id: "Commanditaire Vennootschap (CV)", cn: "设立两合公司 (CV)" },
      items: {
        en: [
          "Deed of Establishment",
          "Ministry of Law and Human Rights Decree",
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "Akta Pendirian",
          "SK Kemenkumham",
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "设立契约",
          "法律与人权部批文",
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
    {
      title: { en: "Foundation of Organizations", id: "Pendirian Yayasan", cn: "设立基金会 (Yayasan)" },
      items: {
        en: [
          "Deed of Establishment",
          "Ministry of Law and Human Rights Decree",
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "Akta Pendirian",
          "SK Kemenkumham",
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "设立契约",
          "法律与人权部批文",
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
    {
      title: { en: "Firm", id: "Firma", cn: "设立商号 (Firma)" },
      items: {
        en: [
          "Deed of Establishment",
          "Ministry of Law and Human Rights Decree",
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "Akta Pendirian",
          "SK Kemenkumham",
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "设立契约",
          "法律与人权部批文",
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
    {
      title: { en: "Sole Proprietorship", id: "Usaha Perseorangan", cn: "设立独资企业 (Usaha Perseorangan)" },
      items: {
        en: [
          "Deed of Establishment",
          "Ministry of Law and Human Rights Decree",
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "Akta Pendirian",
          "SK Kemenkumham",
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "设立契约",
          "法律与人权部批文",
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
  ]

  const ctaText = { 
    en: "Need More Information?", 
    id: "Butuh Informasi Lebih Lanjut?",
    cn: "需要更多信息吗？",
  }
  const ctaDescription = {
    en: "Our team is ready to help you choose the right business entity type for your needs",
    id: "Tim kami siap membantu Anda memilih jenis badan usaha yang tepat untuk kebutuhan Anda",
    cn: "我们的团队随时准备帮助您根据您的需求选择最合适的商业实体类型",
  }

  return (
    <BaseServicePage
      icon={Building2}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
    />
  )
}
