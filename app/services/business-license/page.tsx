"use client";

import { FileText } from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";

export default function BusinessLicensePage() {
  const title = {
    en: "Business License",
    id: "Perizinan Badan Usaha",
    cn: "业务许可",
  };

  const description = {
    en: "Registration/Change of Business Identification Number (NIB), PKKPR, NPWP of individuals/business entities, legal entities, NPWPD, NOPD, BPJS Health, BPJS Employment, and LKPM Reporting.",
    id: "Pendaftaran/Perubahan Nomor Induk Berusaha (NIB), PKKPR, NPWP perorangan/badan usaha, badan hukum, NPWPD, NOPD, BPJS Kesehatan, BPJS Ketenagakerjaan, dan Pelaporan LKPM.",
    cn: "注册/变更业务识别号码 (NIB)、PKKPR、个人/业务实体、法人实体的 NPWP、NPWPD、NOPD、BPJS 健康、BPJS 就业、以及 LKPM 报告。",
  };

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
        en: ["OSS Account", "NIB RBA (The Risk based Business License)"],
        id: ["Akun OSS", "NIB RBA (Nomor Induk Berusaha Berbasis Risiko)"],
        cn: ["OSS 账户", "NIB RBA（基于风险的商业许可）"],
      },
    },
    {
      title: {
        en: "Application for Taxable Entrepreneur (PKP)",
        id: "Permohonan Pengusaha Kena Pajak (PKP)",
        cn: "申请成为增值税一般纳税人 (PKP)",
      },
      items: {
        en: ["Taxable Entrepreneur Certificate"],
        id: ["Sertifikat Pengusaha Kena Pajak"],
        cn: ["增值税一般纳税人证书"],
      },
    },
    {
      title: {
        en: "Activation of Coretax",
        id: "Aktivasi Coretax",
        cn: "激活 Coretax 新税务系统",
      },
      items: {
        en: [
          "Electronic Certificate for e-Filing",
          "Installation Guide",
          "Technical Support",
        ],
        id: [
          "Sertifikat Elektronik untuk e-Filing",
          "Panduan Instalasi",
          "Dukungan Teknis",
        ],
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
        en: ["NPWP Registration", "Tax Registration Certificate"],
        id: ["Pendaftaran NPWP", "Surat Keterangan Terdaftar Pajak"],
        cn: ["NPWP 注册", "税务登记证"],
      },
    },
  ];

  const faqs = [
    {
      question: {
        en: "What is the OSS RBA system?",
        id: "Apa itu sistem OSS RBA?",
        cn: "什么是 OSS RBA 系统？",
      },
      answer: {
        en: "The Online Single Submission Risk-Based Approach (OSS RBA) is the government's centralized platform for issuing business licenses. Licenses are granted based on the risk level (low, medium, high) of your specific business activities (KBLI).",
        id: "Online Single Submission Risk-Based Approach (OSS RBA) adalah platform terpusat pemerintah untuk menerbitkan izin usaha. Izin diberikan berdasarkan tingkat risiko (rendah, menengah, tinggi) dari kegiatan bisnis spesifik Anda (KBLI).",
        cn: "在线单次提交基于风险的方法（OSS RBA）是政府颁发营业执照的集中平台。根据您的特定业务活动（KBLI）的风险级别（低，中，高）颁发许可证。",
      },
    },
    {
      question: {
        en: "What is a PKKPR and why do I need it?",
        id: "Apa itu PKKPR dan mengapa saya membutuhkannya?",
        cn: "什么是 PKKPR，为什么我需要它？",
      },
      answer: {
        en: "PKKPR stands for Confirmation of Suitability of Space Utilization Activities. It acts as a location permit confirming your business matches local spatial planning. It is a mandatory prerequisite in the OSS before other licenses can be verified.",
        id: "PKKPR adalah singkatan dari Kesesuaian Kegiatan Pemanfaatan Ruang. Ini bertindak sebagai izin lokasi yang menegaskan bahwa bisnis Anda sesuai dengan tata ruang lokal. Ini adalah prasyarat wajib dalam OSS sebelum izin lain dapat diverifikasi.",
        cn: "PKKPR代表空间利用活动适宜性确认。它充当选址许可证，确认您的业务符合当地的空间规划。在验证其他许可证之前，它是OSS中的强制先决条件。",
      },
    },
    {
      question: {
        en: "What is an LKPM report?",
        id: "Apa itu laporan LKPM?",
        cn: "什么是 LKPM 报告？",
      },
      answer: {
        en: "LKPM is the Investment Activity Report. All PMA and PMDN companies must submit this report periodically (quarterly or semi-annually) to the Ministry of Investment (BKPM) to report on investment realization. Failure to report can result in license revocation.",
        id: "LKPM adalah Laporan Kegiatan Penanaman Modal. Semua perusahaan PMA dan PMDN harus menyampaikan laporan ini secara berkala (triwulanan atau semesteran) kepada Kementerian Investasi (BKPM) untuk melaporkan realisasi investasi. Kegagalan melapor dapat mengakibatkan pencabutan izin.",
        cn: "LKPM是投资活动报告。所有PMA和PMDN公司必须定期（每季度或每半年）向投资部（BKPM）提交此报告，以报告投资实现情况。未报告可能导致许可证被吊销。",
      },
    },
    {
      question: {
        en: "Is having an NIB enough to start operating?",
        id: "Apakah memiliki NIB cukup untuk mulai beroperasi?",
        cn: "拥有 NIB 足以开始运营吗？",
      },
      answer: {
        en: "For 'Low Risk' businesses, an NIB (Business Identification Number) is sufficient to start operations. However, for 'Medium' and 'High Risk' businesses, the NIB only serves as registration. You must obtain a verified Standard Certificate or Operating License before commencing commercial activities.",
        id: "Untuk bisnis 'Risiko Rendah', NIB (Nomor Induk Berusaha) sudah cukup untuk memulai operasi. Namun, untuk bisnis 'Risiko Menengah' dan 'Tinggi', NIB hanya berfungsi sebagai pendaftaran. Anda harus mendapatkan Sertifikat Standar atau Izin Operasional yang terverifikasi sebelum memulai aktivitas komersial.",
        cn: "对于“低风险”业务，NIB（业务识别号）足以开始运营。但是，对于“中等”和“高风险”业务，NIB仅用作注册。在开始商业活动之前，您必须获得经过验证的标准证书或营业执照。",
      },
    },
    {
      question: {
        en: "What are BPJS Ketenagakerjaan and BPJS Kesehatan?",
        id: "Apa itu BPJS Ketenagakerjaan dan BPJS Kesehatan?",
        cn: "BPJS Ketenagakerjaan 和 BPJS Kesehatan 是什么？",
      },
      answer: {
        en: "They are the mandatory national social security and healthcare programs. Every company in Indonesia is legally required to register their entity and enroll their employees into both BPJS programs.",
        id: "Keduanya adalah program jaminan sosial dan kesehatan nasional yang wajib. Setiap perusahaan di Indonesia diwajibkan secara hukum untuk mendaftarkan entitasnya dan mendaftarkan karyawannya ke dalam kedua program BPJS tersebut.",
        cn: "它们是强制性的国家社会保障和医疗保健计划。印度尼西亚的每家公司在法律上都必须注册其实体并为其员工注册两个BPJS计划。",
      },
    },
  ];

  const ctaText = {
    en: "Simplify Your Business Licensing",
    id: "Permudah Perizinan Usaha Anda",
    cn: "简化您的商业许可",
  };
  const ctaDescription = {
    en: "Let our experts handle all your business licensing needs efficiently and professionally",
    id: "Biarkan para ahli kami menangani semua kebutuhan perizinan usaha Anda secara efisien dan profesional",
    cn: "让我们的专家高效、专业地为您处理所有的商业许可需求",
  };

  return (
    <BaseServicePage
      icon={FileText}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
      faqs={faqs}
    />
  );
}
