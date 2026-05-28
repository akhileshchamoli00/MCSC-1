"use client";

import { Lightbulb } from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";

export default function IntellectualPropertyPage() {
  const title = {
    en: "Intellectual Property Rights",
    id: "Hak Kekayaan Intelektual",
    cn: "知识产权",
  };

  const description = {
    en: "IPR is a legal right granted to protect the intellectual work and innovation of a person or entity. Includes registration of Trademarks, Industrial Designs, and Copyright.",
    id: "HKI adalah hak hukum yang diberikan untuk melindungi karya intelektual dan inovasi seseorang atau entitas. Mencakup pendaftaran Merek, Desain Industri, dan Hak Cipta.",
    cn: "知识产权是为保护个人或实体的智力成果和创新而授予的法定权利。包括商标、工业设计和版权的注册登记。",
  };

  const subServices = [
    {
      title: {
        en: "Trademark Registration",
        id: "Pendaftaran Merek",
        cn: "商标注册",
      },
      items: {
        en: [
          "Brand Name & Logo Protection",
          "10-Year Legal Protection",
          "DJKI Registration",
          "Official Certificate Extract",
        ],
        id: [
          "Perlindungan Nama & Logo",
          "Perlindungan Hukum 10 Tahun",
          "Pendaftaran DJKI",
          "Petikan Sertifikat Resmi",
        ],
        cn: [
          "品牌名称与标志保护",
          "10年法定保护期",
          "DJKI（知识产权总局）注册",
          "官方证书副本",
        ],
      },
    },
    {
      title: {
        en: "Trademark Management",
        id: "Pengelolaan Merek",
        cn: "商标管理与后期维护",
      },
      items: {
        en: [
          "Trademark Renewal",
          "Assignment of Ownership",
          "License Recording",
          "Address Changes",
        ],
        id: [
          "Perpanjangan Merek",
          "Pengalihan Hak",
          "Pencatatan Lisensi",
          "Perubahan Alamat",
        ],
        cn: ["商标续展", "所有权转让", "许可合同备案", "注册地址变更"],
      },
    },
    {
      title: {
        en: "Copyright Registration",
        id: "Pendaftaran Hak Cipta",
        cn: "版权/著作权登记",
      },
      items: {
        en: [
          "Protection for Creative Works",
          "Literary & Artistic Works",
          "Digital Content Protection",
          "Legal Ownership Proof",
        ],
        id: [
          "Perlindungan Karya Kreatif",
          "Karya Sastra & Seni",
          "Perlindungan Konten Digital",
          "Bukti Kepemilikan Hukum",
        ],
        cn: [
          "创意作品保护",
          "文学与艺术作品登记",
          "数字内容版权保护",
          "法定所有权证明",
        ],
      },
    },
    {
      title: {
        en: "Industrial Design",
        id: "Desain Industri",
        cn: "工业设计专利申请",
      },
      items: {
        en: [
          "Product Aesthetic Protection",
          "Shape & Configuration",
          "Commercial Design Rights",
          "Market Exclusivity",
        ],
        id: [
          "Perlindungan Estetika Produk",
          "Bentuk & Konfigurasi",
          "Hak Desain Komersial",
          "Eksklusivitas Pasar",
        ],
        cn: [
          "产品外观美学保护",
          "形状与配置专利",
          "商业设计权",
          "市场独占权保护",
        ],
      },
    },
  ];

  const faqs = [
    {
      question: {
        en: "Does an international trademark protect my brand in Indonesia?",
        id: "Apakah merek dagang internasional melindungi merek saya di Indonesia?",
        cn: "国际商标在印度尼西亚保护我的品牌吗？",
      },
      answer: {
        en: "No. Indonesia strictly follows a 'First-to-File' system. You must register your trademark locally with the Directorate General of Intellectual Property (DJKI) or via the Madrid Protocol specifically designating Indonesia.",
        id: "Tidak. Indonesia secara ketat mengikuti sistem 'First-to-File'. Anda harus mendaftarkan merek dagang Anda secara lokal ke Direktorat Jenderal Kekayaan Intelektual (DJKI) atau melalui Protokol Madrid yang secara khusus menunjuk Indonesia.",
        cn: "不会。印度尼西亚严格遵循“先申请”制度。您必须在当地知识产权总局（DJKI）注册您的商标，或通过专门指定印度尼西亚的马德里议定书进行注册。",
      },
    },
    {
      question: {
        en: "How long does a trademark registration last?",
        id: "Berapa lama pendaftaran merek dagang bertahan?",
        cn: "商标注册的有效期是多长？",
      },
      answer: {
        en: "A registered trademark is valid for 10 years from the original filing date. It can be renewed indefinitely for subsequent 10-year periods. Renewal applications can be filed within 6 months before expiration.",
        id: "Merek dagang yang terdaftar berlaku selama 10 tahun dari tanggal pengajuan awal. Ini dapat diperbarui tanpa batas waktu untuk periode 10 tahun berikutnya. Aplikasi perpanjangan dapat diajukan dalam waktu 6 bulan sebelum kedaluwarsa.",
        cn: "注册商标自最初申请之日起10年内有效。它可以无限期地续展，随后的每次续展为期10年。可以在到期前6个月内提交续展申请。",
      },
    },
    {
      question: {
        en: "What is the 'Novelty' requirement for Industrial Designs?",
        id: "Apa persyaratan 'Kebaruan' untuk Desain Industri?",
        cn: "工业设计的“新颖性”要求是什么？",
      },
      answer: {
        en: "To be registered, an industrial design must be completely new. If the design has already been published, sold, or displayed publicly in Indonesia or abroad before the filing date, the application will be rejected.",
        id: "Untuk didaftarkan, desain industri harus sepenuhnya baru. Jika desain tersebut telah diterbitkan, dijual, atau dipajang di depan umum di Indonesia atau di luar negeri sebelum tanggal pengajuan, permohonan akan ditolak.",
        cn: "为了被注册，工业设计必须是全新的。如果在申请日之前该设计已经在印度尼西亚或国外公开出版，出售或展示，该申请将被拒绝。",
      },
    },
    {
      question: {
        en: "Do I need to register my Copyright?",
        id: "Apakah saya perlu mendaftarkan Hak Cipta saya?",
        cn: "我需要注册我的版权吗？",
      },
      answer: {
        en: "In Indonesia, copyright is automatically granted upon creation. However, formally recording your copyright with the DJKI provides crucial legal evidence of ownership in case of future infringement disputes.",
        id: "Di Indonesia, hak cipta secara otomatis diberikan pada saat penciptaan. Namun, mencatatkan hak cipta Anda secara formal ke DJKI memberikan bukti hukum kepemilikan yang penting jika terjadi perselisihan pelanggaran di masa depan.",
        cn: "在印度尼西亚，版权在创作时自动授予。但是，正式向DJKI记录您的版权，可以在未来发生侵权纠纷时提供关键的合法所有权证据。",
      },
    },
    {
      question: {
        en: "What if someone else has already registered my brand name?",
        id: "Bagaimana jika orang lain sudah mendaftarkan nama merek saya?",
        cn: "如果别人已经注册了我的品牌名称怎么办？",
      },
      answer: {
        en: "If your brand was registered by a third party in bad faith, you can file an objection (if the application is still pending) or a cancellation lawsuit through the Commercial Court. Our legal team can assist with IP litigation.",
        id: "Jika merek Anda didaftarkan oleh pihak ketiga dengan itikad buruk, Anda dapat mengajukan keberatan (jika permohonan masih tertunda) atau gugatan pembatalan melalui Pengadilan Niaga. Tim hukum kami dapat membantu dengan litigasi kekayaan intelektual.",
        cn: "如果您的品牌被第三方恶意注册，您可以提出异议（如果申请仍在等待处理中）或通过商业法院提起撤销诉讼。我们的法律团队可以协助处理知识产权诉讼。",
      },
    },
  ];

  const ctaText = {
    en: "Protect Your Intellectual Property",
    id: "Lindungi Kekayaan Intelektual Anda",
    cn: "保护您的知识产权",
  };
  const ctaDescription = {
    en: "Secure your innovations and creative works with comprehensive IP protection services",
    id: "Amankan inovasi dan karya kreatif Anda dengan layanan perlindungan HKI yang komprehensif",
    cn: "通过全方位的知识产权保护服务，确保您的创新和创意作品安全",
  };

  return (
    <BaseServicePage
      icon={Lightbulb}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
      faqs={faqs}
    />
  );
}
