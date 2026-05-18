"use client"

import { FileText } from "lucide-react"
import { BaseServicePage } from "@/components/base-service-page"

export default function BusinessLicensePage() {
  const title = {
    en: "Business License",
    id: "Perizinan Badan Usaha",
    cn: "业务许可",
  }

  const description = {
    en: "Registration/Change of Business Identification Number (NIB), PKKPR, NPWP of individuals/business entities, legal entities, NPWPD, NOPD, BPJS Health, BPJS Employment, and LKPM Reporting.",
    id: "Pendaftaran/Perubahan Nomor Induk Berusaha (NIB), PKKPR, NPWP perorangan/badan usaha, badan hukum, NPWPD, NOPD, BPJS Kesehatan, BPJS Ketenagakerjaan, dan Pelaporan LKPM.",
    cn: "注册/变更业务识别号码 (NIB)、PKKPR、个人/业务实体、法人实体的 NPWP、NPWPD、NOPD、BPJS 健康、BPJS 就业、以及 LKPM 报告。",
  }

  const subServices = [
    {
      title: {
        en: "Business Identification Number (NIB)",
        id: "Nomor Induk Berusaha (NIB)",
        cn: "业务识别号码 (NIB)",
      },
      subtitle: {
        en: "Sole Proprietorship / Business Entity/Legal Entity",
        id: "Usaha Perseorangan / Badan Usaha/Badan Hukum",
        cn: "个人独资企业 / 商业实体/法人实体",
      },
      items: {
        en: [
          "OSS Account",
          "NIB RBA (The Risk based Business License)",
        ],
        id: [
          "Akun OSS",
          "NIB RBA (Nomor Induk Berusaha Berbasis Risiko)",
        ],
        cn: [
          "OSS 账户",
          "NIB RBA（基于风险的商业许可）",
        ],
      },
    },
    {
      title: {
        en: "Application for Taxable Entrepreneur (PKP)",
        id: "Permohonan Pengusaha Kena Pajak (PKP)",
        cn: "申请成为增值税一般纳税人 (PKP)",
      },
      items: {
        en: ["Taxable Entrepreneur Certificate", "Activation Code", "Password Activation Code"],
        id: ["Sertifikat Pengusaha Kena Pajak", "Kode Aktivasi", "Password Kode Aktivasi"],
        cn: ["增值税一般纳税人证书", "激活码", "密码激活码"],
      },
    },
    {
      title: {
        en: "Activation of Coretax",
        id: "Aktivasi Coretax",
        cn: "激活 Coretax 新税务系统",
      },
      items: {
        en: ["Electronic Certificate for e-Filing", "Installation Guide", "Technical Support"],
        id: ["Sertifikat Elektronik untuk e-Filing", "Panduan Instalasi", "Dukungan Teknis"],
        cn: ["电子申报电子证书", "安装指南", "技术支持"],
      },
    },
    {
      title: {
        en: "Registration of Tax Identification Number (NPWP)",
        id: "Pendaftaran Nomor Pokok Wajib Pajak (NPWP)",
        cn: "注册税务登记号 (NPWP)",
      },
      items: {
        en: ["NPWP Registration", "Original NPWP Card", "Tax Registration Certificate"],
        id: ["Pendaftaran NPWP", "Kartu NPWP Asli", "Surat Keterangan Terdaftar Pajak"],
        cn: ["NPWP 注册", "原件 NPWP 卡", "税务登记证"],
      },
    },
  ]

  const ctaText = { 
    en: "Simplify Your Business Licensing", 
    id: "Permudah Perizinan Usaha Anda",
    cn: "简化您的商业许可",
  }
  const ctaDescription = {
    en: "Let our experts handle all your business licensing needs efficiently and professionally",
    id: "Biarkan para ahli kami menangani semua kebutuhan perizinan usaha Anda secara efisien dan profesional",
    cn: "让我们的专家高效、专业地为您处理所有的商业许可需求",
  }

  return (
    <BaseServicePage
      icon={FileText}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
    />
  )
}
