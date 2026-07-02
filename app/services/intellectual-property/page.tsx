"use client";

import {
  Lightbulb,
  ShieldCheck,
  Clock,
  Calendar,
  ArrowRight,
  ChevronRight,
  Sparkles,
  RefreshCw,
  FileCode,
  Box,
  CheckCircle2,
} from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function IntellectualPropertyPage() {
  const { language } = useLanguage();

  const getTranslation = (obj: any) => {
    if (!obj) return "";
    if (language === "id" && obj.idText) return obj.idText;
    return obj[language] || obj["en"] || "";
  };

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

  const content = {
    legalBadge: {
      en: "Reviewed by the MCS Consulting Legal Team · Last updated July 2026 · 7 min read",
      id: "Ditinjau oleh Tim Hukum MCS Consulting · Terakhir diperbarui Juli 2026 · 7 menit baca",
      cn: "由 MCS Consulting 法律团队审核 · 上次更新于 2026 年 7 月 · 7 分钟阅读",
    },
    introText: {
      en: "Protecting your brand, creative work, or product design in Indonesia requires registering with DJKI (the Directorate General of Intellectual Property), Indonesia's official IP authority. MCS Consulting handles trademark registration and ongoing management, copyright registration, and industrial design protection — securing your rights and giving you legal ground to act against infringement.",
      id: "Melindungi merek, karya kreatif, atau desain produk Anda di Indonesia memerlukan pendaftaran ke DJKI (Direktorat Jenderal Kekayaan Intelektual), otoritas HKI resmi di Indonesia. MCS Consulting menangani pendaftaran dan pengelolaan berkelanjutan merek dagang, pendaftaran hak cipta, dan perlindungan desain industri — mengamankan hak-hak Anda dan memberi Anda dasar hukum untuk bertindak melawan pelanggaran.",
      cn: "在印度尼西亚保护您的品牌、创意作品或产品设计需要向印尼官方知识产权管理机构 DJKI（知识产权总局）进行登记。MCS Consulting 处理商标注册和后续管理维护、版权登记和工业设计保护——确保您的权利，并为您在打击侵权行为时提供合法的法律依据。",
    },
    onThisPage: {
      en: "On this page",
      id: "Di halaman ini",
      cn: "在本页",
    },
    tocItems: [
      {
        id: "ip-protection-needed",
        en: "What type of IP protection do you need?",
        idText: "Perlindungan HKI apa yang Anda butuhkan?",
        cn: "您需要什么类型的知识产权保护？",
      },
      {
        id: "comparing-ip",
        en: "Comparing IP protection types",
        idText: "Perbandingan jenis perlindungan HKI",
        cn: "知识产权保护类型比较",
      },
      {
        id: "whats-included",
        en: "What's included with each service",
        idText: "Apa saja yang termasuk dalam setiap layanan",
        cn: "每个服务包含哪些内容",
      },
      {
        id: "requirements-details",
        en: "Requirements for registration",
        idText: "Persyaratan pendaftaran",
        cn: "注册要求",
      },
      {
        id: "step-by-step",
        en: "Step-by-step process",
        idText: "Proses langkah demi langkah",
        cn: "逐步流程",
      },
      {
        id: "faq",
        en: "Frequently asked questions",
        idText: "Pertanyaan yang sering diajukan",
        cn: "常见问题",
      },
    ],
    ipTitle: {
      en: "What type of IP protection do you need?",
      id: "Perlindungan HKI apa yang Anda butuhkan?",
      cn: "您需要什么类型的知识产权保护？",
    },
    ipDesc: {
      en: "Indonesia's intellectual property system covers different types of assets differently — a brand name needs trademark protection, a design needs industrial design registration, and creative content needs copyright. The table below shows what applies to you.",
      id: "Sistem kekayaan intelektual Indonesia mencakup jenis aset yang berbeda secara berbeda — nama merek memerlukan perlindungan merek, desain memerlukan pendaftaran desain industri, dan konten kreatif memerlukan hak cipta. Tabel di bawah ini menunjukkan apa yang berlaku untuk Anda.",
      cn: "印度尼西亚的知识产权体系对不同类型的资产保护方式不同——品牌名称需要商标保护、外观设计需要工业设计登记，而创意内容则需要版权登记。下表显示了适于您的保护类型。",
    },
    comparingTitle: {
      en: "Comparing IP protection types",
      id: "Perbandingan jenis perlindungan HKI",
      cn: "知识产权保护类型比较",
    },
    whatsIncludedTitle: {
      en: "What's included with each service",
      id: "Apa saja yang termasuk dalam setiap layanan",
      cn: "每个服务包含哪些内容",
    },
    whatsIncludedList: [
      {
        title: { en: "Trademark Registration", id: "Pendaftaran Merek", cn: "商标注册" },
        bullets: [
          { en: "Brand Name & Logo Protection", id: "Perlindungan Nama Merek & Logo", cn: "品牌名称与标志保护" },
          { en: "10-Year Legal Protection", id: "Perlindungan Hukum 10 Tahun", cn: "10年法定保护期" },
          { en: "DJKI Registration", id: "Pendaftaran DJKI", cn: "DJKI 注册" },
          { en: "Official Certificate Extract", id: "Petikan Sertifikat Resmi", cn: "官方证书副本" },
        ],
      },
      {
        title: { en: "Trademark Management", id: "Pengelolaan Merek", cn: "商标管理与维护" },
        bullets: [
          { en: "Trademark Renewal", id: "Perpanjangan Merek", cn: "商标续展" },
          { en: "Assignment of Ownership", id: "Pengalihan Hak Kepemilikan", cn: "所有权转让" },
          { en: "License Recording", id: "Pencatatan Lisensi", cn: "许可合同备案" },
          { en: "Address Changes", id: "Perubahan Alamat", cn: "注册地址变更" },
        ],
      },
      {
        title: { en: "Copyright Registration", id: "Pendaftaran Hak Cipta", cn: "版权/著作权登记" },
        bullets: [
          { en: "Protection for Creative Works", id: "Perlindungan Karya Kreatif", cn: "创意作品保护" },
          { en: "Literary & Artistic Works", id: "Karya Sastra & Seni", cn: "文学与艺术作品登记" },
          { en: "Digital Content Protection", id: "Perlindungan Konten Digital", cn: "数字内容版权保护" },
          { en: "Legal Ownership Proof", id: "Bukti Kepemilikan Hukum", cn: "法定所有权证明" },
        ],
      },
      {
        title: { en: "Industrial Design", id: "Desain Industri", cn: "工业设计" },
        bullets: [
          { en: "Product Aesthetic Protection", id: "Perlindungan Estetika Produk", cn: "产品外观美学保护" },
          { en: "Shape & Configuration", id: "Bentuk & Konfigurasi", cn: "形状与配置专利" },
          { en: "Commercial Design Rights", id: "Hak Desain Komersial", cn: "商业设计权" },
          { en: "Market Exclusivity", id: "Eksklusivitas Pasar", cn: "市场独占权保护" },
        ],
      },
    ],
    requirementsTitle: {
      en: "Requirements for registration",
      id: "Persyaratan pendaftaran",
      cn: "注册要求",
    },
    reqTrademarkTitle: {
      en: "Trademark Registration",
      id: "Pendaftaran Merek",
      cn: "商标注册",
    },
    reqTrademarkDesc: {
      en: "You'll need a clear representation of your brand name or logo, the specific class(es) of goods or services it applies to under Indonesia's classification system, and proof of first use or intent to use in commerce. DJKI checks for conflicts with existing registered trademarks before approval, so a clearance search before filing helps avoid rejection.",
      id: "Anda memerlukan representasi nama merek atau logo yang jelas, kelas barang atau jasa tertentu yang berlaku di bawah sistem klasifikasi Indonesia, dan bukti penggunaan pertama atau niat untuk menggunakan dalam perdagangan. DJKI memeriksa pertentangan dengan merek terdaftar yang ada sebelum persetujuan, jadi pencarian kliring sebelum pengajuan membantu menghindari penolakan.",
      cn: "您需要清晰的品牌名称或标志图样、在印尼商品/服务分类系统下适用的特定类别，以及在商业中首次使用或意图使用的证明。DJKI 将在批准前检查是否存在与现有已注册商标的冲突，因此在申请前进行清算查询有助于避免被拒。",
    },
    reqManagementTitle: {
      en: "Trademark Management",
      id: "Pengelolaan Merek",
      cn: "商标管理与维护",
    },
    reqManagementDesc: {
      en: "Ongoing management requires your existing trademark registration details. Renewal must be filed before your 10-year protection period expires — MCS Consulting tracks this for you so protection never lapses. Assignment of ownership requires documentation of the transfer agreement between parties, and license recording requires the licensing agreement terms.",
      id: "Pengelolaan berkelanjutan memerlukan detail pendaftaran merek dagang Anda yang ada. Perpanjangan harus diajukan sebelum masa perlindungan 10 tahun Anda berakhir — MCS Consulting memantau hal ini untuk Anda sehingga perlindungan tidak pernah terputus. Pengalihan hak kepemilikan memerlukan dokumentasi perjanjian transfer antar pihak, dan pencatatan lisensi memerlukan ketentuan perjanjian lisensi.",
      cn: "后续管理维护需要您现有的商标注册信息。必须在您的 10 年保护期到期前提交续展——MCS Consulting 会为您跟踪，确保您的保护永不过期。所有权转让需要双方之间的转让协议文件，许可合同备案需要许可协议条款。",
    },
    reqCopyrightTitle: {
      en: "Copyright Registration",
      id: "Pendaftaran Hak Cipta",
      cn: "版权/著作权登记",
    },
    reqCopyrightDesc: {
      en: "You'll need the completed creative work itself (literary, artistic, or digital), proof of creation date, and identification of the creator or rights holder. Unlike trademarks, copyright protection exists automatically once a work is created — registration with DJKI provides official legal proof of ownership, which matters significantly if you ever need to enforce your rights in a dispute.",
      id: "Anda memerlukan karya kreatif itu sendiri (sastra, seni, atau digital) yang sudah selesai, bukti tanggal pembuatan, dan identitas pencipta atau pemegang hak. Tidak seperti merek dagang, perlindungan hak cipta ada secara otomatis begitu sebuah karya diciptakan — pendaftaran ke DJKI memberikan bukti hukum kepemilikan resmi, yang sangat penting jika Anda perlu menegakkan hak Anda dalam perselisihan.",
      cn: "您需要提供完整的创意作品本身（文学、艺术或数字形式）、创作日期证明以及创作者或权利持有人的身份证明。与商标不同，版权保护在作品创作完成时自动产生——向 DJKI 进行登记可以提供官方的法定所有权证明，这在您需要在纠纷中维权时非常关键。",
    },
    reqDesignTitle: {
      en: "Industrial Design",
      id: "Desain Industri",
      cn: "工业设计外观专利",
    },
    reqDesignDesc: {
      en: "You'll need visual representations of the design (drawings or photographs showing all relevant angles), a description of the product's shape or configuration, and confirmation the design hasn't been publicly disclosed before filing — industrial design protection in Indonesia requires novelty at the time of application.",
      id: "Anda memerlukan representasi visual dari desain tersebut (gambar atau foto yang menunjukkan semua sudut yang relevan), deskripsi bentuk atau konfigurasi produk, dan konfirmasi bahwa desain tersebut belum pernah diungkapkan secara publik sebelum diajukan — perlindungan desain industri di Indonesia memerlukan kebaruan pada saat pengajuan.",
      cn: "您需要提供该设计的外观图样（显示所有相关角度的图纸或照片）、产品形状或配置的描述，以及确认该设计在申请前未曾公开发布——印度尼西亚的工业设计保护要求在申请时具有新颖性。",
    },
    regulatoryFooter: {
      en: "Intellectual property in Indonesia is governed by Law No. 20 of 2016 on Trademarks and Geographical Indications, Law No. 28 of 2014 on Copyright, and Law No. 31 of 2000 on Industrial Design, all administered by DJKI under the Ministry of Law and Human Rights. MCS Consulting stays current with all DJKI regulation updates on your behalf.",
      id: "Kekayaan intelektual di Indonesia diatur oleh Undang-Undang No. 20 Tahun 2016 tentang Merek dan Indikasi Geografis, Undang-Undang No. 28 Tahun 2014 tentang Hak Cipta, dan Undang-Undang No. 31 Tahun 2000 tentang Desain Industri, semuanya dikelola oleh DJKI di bawah Kementerian Hukum dan Hak Asasi Manusia. MCS Consulting selalu memperbarui informasi dengan semua pembaruan peraturan DJKI demi kenyamanan Anda.",
      cn: "印度尼西亚的知识产权由 2016 年第 20 号关于商标和地理标志的法律、2014 年第 28 号关于版权的法律以及 2000 年第 31 号关于工业设计的法律管辖，这些法律均由法律和人权部下属的 DJKI 管理。MCS Consulting 代表您密切关注所有印尼知识产权法案与 DJKI 法规的最新的动态。",
    },
    stepsTitle: {
      en: "Step-by-step process",
      id: "Proses langkah demi langkah",
      cn: "逐步流程",
    },
    steps: [
      {
        title: {
          en: "Clearance search",
          id: "Pencarian kliring",
          cn: "排查与清算查询",
        },
        duration: {
          en: "2–3 days",
          id: "2–3 hari",
          cn: "2-3 天",
        },
        desc: {
          en: "For trademarks and industrial designs, we check DJKI's database for conflicting existing registrations before filing, reducing the risk of rejection.",
          id: "Untuk merek dagang dan desain industri, kami memeriksa database DJKI untuk pendaftaran yang bertentangan sebelum diajukan, mengurangi risiko penolakan.",
          cn: "针对商标和工业设计，我们在申请前核查 DJKI 数据库以排除任何冲突的已注册项目，降低被驳回的风险。",
        },
      },
      {
        title: {
          en: "Application preparation",
          id: "Penyiapan aplikasi",
          cn: "准备与提交申请",
        },
        duration: {
          en: "2–5 days",
          id: "2–5 hari",
          cn: "2-5 天",
        },
        desc: {
          en: "We prepare and file your application with all required documentation — brand representation and class selection for trademarks, the creative work and proof of creation for copyright, or design drawings and descriptions for industrial design.",
          id: "Kami menyiapkan dan mengajukan aplikasi Anda dengan semua dokumentasi yang diperlukan — representasi merek dan pilihan kelas untuk merek dagang, karya kreatif dan bukti penciptaan untuk hak cipta, atau gambar dan deskripsi desain untuk desain industri.",
          cn: "我们准备并提交您的申请以及所有必需的文档——包括商标的品牌图样与类别选择、版权的作品与创作证明，或工业设计的设计图纸与描述。",
        },
      },
      {
        title: {
          en: "DJKI formal examination",
          id: "Pemeriksaan formal DJKI",
          cn: "DJKI 形式审查",
        },
        duration: {
          en: "1–3 months",
          id: "1–3 bulan",
          cn: "1-3 个月",
        },
        desc: {
          en: "DJKI reviews your application for completeness and compliance with filing requirements.",
          id: "DJKI meninjau aplikasi Anda untuk kelengkapan dan kepatuhan terhadap persyaratan pengajuan.",
          cn: "DJKI 对您的申请进行形式审查，核实其完整性并检查是否符合申报要求。",
        },
      },
      {
        title: {
          en: "Substantive examination and publication",
          id: "Pemeriksaan substantif dan publikasi",
          cn: "实质审查与公告",
        },
        duration: {
          en: "6–12 months",
          id: "6–12 bulan",
          cn: "6-12 个月",
        },
        desc: {
          en: "For trademarks, DJKI conducts a substantive review and publishes the application for public opposition. Copyright and industrial design applications generally move faster, without the same opposition period.",
          id: "Untuk merek dagang, DJKI melakukan peninjauan substantif dan mempublikasikan aplikasi untuk sanggahan publik. Aplikasi hak cipta dan desain industri umumnya bergerak lebih cepat, tanpa periode publikasi sanggahan yang sama.",
          cn: "对于商标，DJKI 会进行实质审查，并公告申请以接受公众异议。版权和工业设计申请通常处理速度更快，不需要经历相同的公告异议期。",
        },
      },
      {
        title: {
          en: "Certificate issuance",
          id: "Penerbitan sertifikat",
          cn: "证书颁发",
        },
        duration: {
          en: "Varies",
          id: "Bervariasi",
          cn: "视审批情况",
        },
        desc: {
          en: "Once approved, DJKI issues your official registration certificate — your legal proof of ownership and protection.",
          id: "Setelah disetujui, DJKI menerbitkan sertifikat pendaftaran resmi Anda — bukti hukum kepemilikan dan perlindungan Anda.",
          cn: "获得批准后，DJKI 将颁发您的官方注册证书——这是您所有权和保护的法定凭证。",
        },
      },
    ],
    timelineTitle: {
      en: "How long does it take?",
      id: "Berapa lama waktu yang dibutuhkan?",
      cn: "这需要多长时间？",
    },
    totalTimelineLabel: {
      en: "Total typical timeline",
      id: "Total waktu pengerjaan",
      cn: "总计典型所需时间",
    },
    totalTimelineVal: {
      en: "Varies by Type",
      id: "Bervariasi berdasarkan Jenis",
      cn: "因保护类型而异",
    },
    totalTimelineDesc: {
      en: "Trademark registration: 12–18 months; copyright registration: completed within weeks; industrial design registration: 6–12 months.",
      id: "Pendaftaran merek dagang: 12–18 bulan; pendaftaran hak cipta: selesai dalam beberapa minggu; pendaftaran desain industri: 6–12 bulan.",
      cn: "商标注册通常需 12-18 个月；版权登记通常在几周内完成；工业设计外观专利通常需 6-12 个月。",
    },
    finalCtaText: {
      en: "Not sure which type of protection your business needs? Schedule a free consultation and our team will identify exactly what applies to your brand, work, or design.",
      id: "Belum yakin jenis perlindungan mana yang dibutuhkan bisnis Anda? Jadwalkan konsultasi gratis dan tim kami akan mengidentifikasi dengan tepat apa yang berlaku untuk merek, karya, atau desain Anda.",
      cn: "不确定您的企业需要哪种类型的保护？预约免费咨询，我们的团队将准确分析出适用于您的品牌、创作或设计的保护项目。",
    },
  };

  const tableHeaders = {
    columns: [
      { en: "Feature", id: "Fitur", cn: "特征" },
      { en: "Trademark", id: "Merek", cn: "商标" },
      { en: "Copyright", id: "Hak Cipta", cn: "版权" },
      { en: "Industrial Design", id: "Desain Industri", cn: "工业设计" },
    ],
  };

  const tableRows = [
    {
      label: { en: "Protects", id: "Melindungi", cn: "保护对象" },
      values: [
        { en: "Brand names, logos", id: "Nama merek, logo", cn: "品牌名称、商标" },
        { en: "Literary, artistic, and digital creative works", id: "Karya sastra, seni, dan karya kreatif digital", cn: "文学、艺术和数字创意作品" },
        { en: "Product shape, configuration, and aesthetic appearance", id: "Bentuk produk, konfigurasi, dan tampilan estetika", cn: "产品形状、配置和外观美学" },
      ],
    },
    {
      label: { en: "Registration required?", id: "Wajib Daftar?", cn: "必须注册？" },
      values: [
        { en: "Yes, mandatory for legal protection", id: "Ya, wajib untuk perlindungan hukum", cn: "是，取得法律保护的强制要求" },
        { en: "No — protection exists automatically on creation, but registration provides legal proof", id: "Tidak — perlindungan ada secara otomatis saat penciptaan, tetapi pendaftaran memberikan bukti hukum", cn: "否——作品在创作时自动产生保护，但登记可提供法定的法律证明" },
        { en: "Yes, mandatory for legal protection", id: "Ya, wajib untuk perlindungan hukum", cn: "是，取得法律保护的强制要求" },
      ],
    },
    {
      label: { en: "Protection length", id: "Masa Perlindungan", cn: "保护期限" },
      values: [
        { en: "10 years, renewable indefinitely", id: "10 tahun, dapat diperpanjang tanpa batas", cn: "10 年，可无限期续展" },
        { en: "Life of creator + 70 years (varies by work type)", id: "Seumur hidup pencipta + 70 tahun (bervariasi menurut jenis karya)", cn: "作者终生 + 70 年（根据作品类型有所不同）" },
        { en: "10 years from filing date", id: "10 tahun sejak tanggal pengajuan", cn: "自申请之日起 10 年" },
      ],
    },
    {
      label: { en: "Registered with", id: "Terdaftar di", cn: "主管机构" },
      values: [
        { en: "DJKI", id: "DJKI", cn: "DJKI" },
        { en: "DJKI", id: "DJKI", cn: "DJKI" },
        { en: "DJKI", id: "DJKI", cn: "DJKI" },
      ],
    },
    {
      label: { en: "Best for", id: "Terbaik untuk", cn: "最适合" },
      values: [
        { en: "Businesses building brand recognition", id: "Bisnis yang membangun pengenalan merek", cn: "建立品牌知名度的企业" },
        { en: "Authors, artists, digital content creators", id: "Penulis, seniman, pencipta konten digital", cn: "作家、艺术家、数字内容创作者" },
        { en: "Product manufacturers, industrial designers", id: "Produsen produk, desainer industri", cn: "产品制造商、工业设计师" },
      ],
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

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <BaseServicePage
      icon={Lightbulb}
      title={title}
      description={description}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
      faqs={faqs}
    >
      <div className="container mx-auto px-4 py-8 max-w-6xl text-left">
        {/* Legal check badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center md:justify-start mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-border/80 dark:border-white/10 bg-background/50 backdrop-blur-md text-muted-foreground shadow-sm">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            <span>{getTranslation(content.legalBadge)}</span>
          </div>
        </motion.div>

        {/* Intro Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg md:text-xl text-foreground/90 leading-relaxed font-sans mb-12"
        >
          {getTranslation(content.introText)}
        </motion.p>

        {/* On this page - TOC */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/30 backdrop-blur-md max-w-md shadow-sm"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
            <Lightbulb className="h-5 w-5 text-primary" />
            {getTranslation(content.onThisPage)}
          </h3>
          <ul className="space-y-2.5">
            {content.tocItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleScroll(item.id)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm md:text-base font-medium group text-left"
                >
                  <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
                  <span>{getTranslation(item)}</span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Section 1: What type of IP protection do you need? */}
        <section id="ip-protection-needed" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.ipTitle)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-6">
            {getTranslation(content.ipDesc)}
          </p>

          {/* Mobile Card Layout */}
          <div className="grid gap-6 md:grid-cols-2 lg:hidden my-8">
            {tableHeaders.columns.slice(1).map((col, colIdx) => {
              return (
                <div
                  key={colIdx}
                  className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/30 backdrop-blur-sm shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-2">
                      <h3 className="text-base font-bold text-foreground">
                        {getTranslation(col)}
                      </h3>
                    </div>
                    
                    <dl className="space-y-4">
                      {tableRows.map((row, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-3 gap-2">
                          <dt className="text-xs font-semibold text-foreground/70 col-span-1">
                            {getTranslation(row.label)}
                          </dt>
                          <dd className="text-xs text-muted-foreground col-span-2 leading-relaxed">
                            {getTranslation(row.values[colIdx])}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden lg:block relative my-8 rounded-2xl border border-border/50 dark:border-white/15 bg-background/30 backdrop-blur-sm shadow-md overflow-hidden">
            <table className="w-full text-left border-collapse text-xs lg:text-[11px] xl:text-xs table-fixed">
              <thead>
                <tr className="border-b border-border/50 dark:border-white/15 bg-muted/30">
                  {tableHeaders.columns.map((col, idx) => {
                    return (
                      <th
                        key={idx}
                        className={`p-3 font-semibold text-foreground ${idx === 0 ? "w-[16%]" : "w-[28%]"}`}
                      >
                        {getTranslation(col)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="border-b border-border/50 dark:border-white/10 last:border-0 hover:bg-muted/10 transition-colors"
                  >
                    <td className="p-3 font-medium text-foreground bg-muted/5">
                      {getTranslation(row.label)}
                    </td>
                    {row.values.map((val, valIdx) => {
                      return (
                        <td
                          key={valIdx}
                          className="p-3 text-muted-foreground leading-relaxed"
                        >
                          {getTranslation(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: What's included with each service */}
        <section id="whats-included" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.whatsIncludedTitle)}
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {content.whatsIncludedList.map((service, serviceIdx) => {
              const IconComponent = [Sparkles, RefreshCw, FileCode, Box][serviceIdx] || Sparkles;
              return (
                <div
                  key={serviceIdx}
                  className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/40 backdrop-blur-sm shadow-sm flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/20">
                    <IconComponent className="h-5 w-5 text-primary shrink-0" />
                    <h3 className="font-bold text-foreground text-sm leading-tight">
                      {getTranslation(service.title)}
                    </h3>
                  </div>
                  <ul className="space-y-3 flex-grow">
                    {service.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{getTranslation(bullet)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Requirements for registration */}
        <section id="requirements-details" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.requirementsTitle)}
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Trademark Registration */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqTrademarkTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqTrademarkDesc)}
              </p>
            </div>

            {/* Trademark Management */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqManagementTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqManagementDesc)}
              </p>
            </div>

            {/* Copyright Registration */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqCopyrightTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqCopyrightDesc)}
              </p>
            </div>

            {/* Industrial Design */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqDesignTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqDesignDesc)}
              </p>
            </div>
          </div>

          <p className="text-base text-muted-foreground leading-relaxed border-l-2 border-primary/50 pl-4 py-1 italic bg-primary/5 rounded-r-xl">
            {getTranslation(content.regulatoryFooter)}
          </p>
        </section>

        {/* Section 4: Step-by-step process */}
        <section id="step-by-step" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.stepsTitle)}
          </h2>

          <div className="relative pl-8 ml-4 border-l border-border dark:border-white/10 space-y-12 py-4">
            {content.steps.map((step, idx) => (
              <div key={idx} className="relative">
                {/* timeline circle */}
                <div className="absolute -left-[45px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-background border border-primary/40 dark:border-primary/60 text-primary font-bold text-sm shadow-sm backdrop-blur-md">
                  {idx + 1}
                </div>
                
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                    <h3 className="text-xl font-bold text-foreground">
                      {getTranslation(step.title)}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                      <Clock className="h-3 w-3" />
                      {getTranslation(step.duration)}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {getTranslation(step.desc)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Timeline & CTA */}
        <section id="timeline" className="scroll-mt-24 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.timelineTitle)}
          </h2>
          <div className="p-8 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md mb-8 flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm">
            <div className="flex gap-4 items-center">
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center border border-primary/30 shrink-0">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  {getTranslation(content.totalTimelineLabel)}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {getTranslation(content.totalTimelineVal)}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed text-center md:text-left">
              {getTranslation(content.totalTimelineDesc)}
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-border/50 dark:border-white/15 bg-background/30 backdrop-blur-md text-center max-w-3xl mx-auto shadow-sm">
            <p className="text-base text-foreground leading-relaxed mb-6">
              {getTranslation(content.finalCtaText)}
            </p>
            <Button
              size="lg"
              variant="default"
              className="h-12 px-8 text-base rounded-full bg-primary text-primary-foreground hover:opacity-90 hover:scale-105 active:scale-95 shadow-md shadow-primary/10 cursor-pointer group"
              asChild
            >
              <Link href="/contact">
                {language === "en"
                  ? "Schedule a Free Consultation"
                  : language === "cn"
                    ? "预约免费咨询"
                    : "Jadwalkan Konsultasi Gratis"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </BaseServicePage>
  );
}
