"use client";

import {
  Building2,
  ShieldCheck,
  Users,
  Scale,
  Coins,
  MapPin,
  Clock,
  Calendar,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  BookmarkCheck,
  Briefcase,
  FileCheck2,
} from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EstablishmentPage() {
  const { language } = useLanguage();

  const getTranslation = (obj: any) => {
    if (!obj) return "";
    if (language === "id" && obj.idText) return obj.idText;
    return obj[language] || obj["en"] || "";
  };

  const title = {
    en: "Establishment of Business Entities/Legal Entities",
    id: "Pendirian Badan Usaha/Badan Hukum",
    cn: "业务实体/法人实体设立",
  };

  const description = {
    en: "Establishment of local PT, PMA PT, Individual PT, Foundation, Firm, CV, Cooperative. The formal process of forming a legally recognized business entity.",
    id: "Pendirian PT lokal, PT PMA, PT Perseorangan, Yayasan, Firma, CV, Koperasi. Proses formal pembentukan badan usaha yang diakui secara hukum.",
    cn: "设立本地 PT、PT PMA（外资）、个人 PT、基金会、商号、CV、合作社。建立法律认可 of 商业实体的正式程序。",
  };

  const content = {
    legalBadge: {
      en: "Reviewed by the MCS Consulting Legal Team · Last updated July 2026 · 8 min read",
      id: "Ditinjau oleh Tim Hukum MCS Consulting · Terakhir diperbarui Juli 2026 · 8 menit baca",
      cn: "由 MCS Consulting 法律团队审核 · 上次更新于 2026 年 7 月 · 8 分钟阅读",
    },
    introText: {
      en: "To establish a company in Indonesia, foreign investors typically set up a PMA (foreign-owned limited liability company), while Indonesian nationals can choose from Local Investment, a Firm, CV, Foundation, or Sole Proprietorship depending on their goals. A PMA requires at least two shareholders, one director, and one commissioner, with a minimum investment plan of IDR 10 billion per business sector and location. MCS Consulting handles the full process — from your notarial deed through to your final Business Identification Number — typically completed in 4 to 8 weeks.",
      id: "Untuk mendirikan perusahaan di Indonesia, investor asing biasanya mendirikan PMA (Perseroan Terbatas Penanaman Modal Asing), sementara warga negara Indonesia dapat memilih dari Investasi Lokal, Firma, CV, Yayasan, atau Perusahaan Perorangan tergantung pada tujuan mereka. PMA membutuhkan setidaknya dua pemegang saham, satu direktur, dan satu komisaris, dengan rencana investasi minimum Rp 10 miliar per sektor usaha dan lokasi. MCS Consulting menangani seluruh proses — mulai dari akta notaris Anda hingga Nomor Induk Berusaha final Anda — biasanya selesai dalam waktu 4 hingga 8 minggu.",
      cn: "在印度尼西亚设立公司，外国投资者通常会成立 PMA（外资有限责任公司），而印度尼西亚国民则可以根据自己的目标选择本地投资公司、商号、CV、基金会或个人独资企业。PMA 需要至少两名股东、一名董事和一名监事，每个业务部门和地点的最低投资计划为 100 亿印尼盾。MCS Consulting 处理整个流程——从您的公证书到最终的商业登记号——通常在 4 到 8 周内完成。",
    },
    onThisPage: {
      en: "On this page",
      id: "Di halaman ini",
      cn: "在本页",
    },
    tocItems: [
      {
        id: "entity-types",
        en: "What entity types are available in Indonesia?",
        idText: "Jenis entitas apa yang tersedia di Indonesia?",
        cn: "印度尼西亚有哪些实体类型？",
      },
      {
        id: "comparing-entities",
        en: "Comparing business entity types",
        idText: "Perbandingan jenis badan usaha",
        cn: "商业实体类型比较",
      },
      {
        id: "whats-included",
        en: "What's included with each entity type",
        idText: "Apa saja yang termasuk dalam setiap jenis entitas",
        cn: "每个实体类型包含哪些内容",
      },
      {
        id: "requirements-pma",
        en: "Requirements to establish a PMA",
        idText: "Persyaratan untuk mendirikan PMA",
        cn: "设立 PMA 的要求",
      },
      {
        id: "step-by-step",
        en: "Step-by-step registration process",
        idText: "Proses pendaftaran langkah demi langkah",
        cn: "逐步注册流程",
      },
      {
        id: "faq",
        en: "Frequently asked questions",
        idText: "Pertanyaan yang sering diajukan",
        cn: "常见问题",
      },
    ],
    entityTypesTitle: {
      en: "What entity types are available in Indonesia?",
      id: "Jenis entitas apa yang tersedia di Indonesia?",
      cn: "印度尼西亚有哪些实体类型？",
    },
    entityTypesDesc: {
      en: "Indonesia offers several legal structures depending on your ownership situation and business goals — from foreign-owned PMA companies to simple sole proprietorships. The table below compares your options at a glance.",
      id: "Indonesia menawarkan beberapa struktur hukum tergantung pada situasi kepemilikan dan tujuan bisnis Anda — mulai dari perusahaan PMA milik asing hingga perusahaan perorangan sederhana. Tabel di bawah ini membandingkan pilihan Anda secara sekilas.",
      cn: "印度尼西亚根据您的所有权状况和业务目标提供多种法律结构——从外资拥有的 PMA 公司到简单的个人独资企业。下表一目了然地比较了您的选择。",
    },
    comparingTitle: {
      en: "Comparing business entity types",
      id: "Perbandingan jenis badan usaha",
      cn: "商业实体类型比较",
    },
    whatsIncludedTitle: {
      en: "What's included with each entity type",
      id: "Apa saja yang termasuk dalam setiap jenis entitas",
      cn: "每个实体类型包含哪些内容",
    },
    whatsIncludedDesc: {
      en: "Every registration with MCS Consulting is handled end-to-end. Here's exactly what you receive for each entity type.",
      id: "Setiap pendaftaran dengan MCS Consulting ditangani secara menyeluruh. Inilah tepatnya yang Anda dapatkan untuk setiap jenis entitas.",
      cn: "MCS Consulting 的每次注册都是端到端处理的。以下是您为每种实体类型所获得的具体交付物。",
    },
    whatsIncludedBulletsCommon: [
      { en: "Deed of Establishment", id: "Akta Pendirian", cn: "设立契约" },
      { en: "Ministry of Law and Human Rights Decree", id: "SK Kemenkumham", cn: "法律与人权部批文" },
      { en: "Tax Identification Number (NPWP)", id: "Nomor Pokok Wajib Pajak (NPWP)", cn: "税务登记号 (NPWP)" },
      { en: "Company Details registration", id: "Pendaftaran Keterangan Perusahaan", cn: "公司说明文件登记" },
      { en: "OSS Account", id: "Akun OSS", cn: "OSS 账号" },
      { en: "Certificate of Registration (SKT) issued by the tax office", id: "Surat Keterangan Terdaftar (SKT) dari kantor pajak", cn: "税务局颁发的登记证明书 (SKT)" },
      { en: "Business Identification Number (NIB)", id: "Nomor Induk Berusaha (NIB)", cn: "业务登记号 (NIB)" },
    ],
    whatsIncludedBulletsSole: [
      { en: "Tax Identification Number (NPWP)", id: "Nomor Pokok Wajib Pajak (NPWP)", cn: "税务登记号 (NPWP)" },
      { en: "Company Details registration", id: "Pendaftaran Keterangan Perusahaan", cn: "公司说明文件登记" },
      { en: "OSS Account", id: "Akun OSS", cn: "OSS 账号" },
      { en: "Certificate of Registration (SKT) issued by the tax office", id: "Surat Keterangan Terdaftar (SKT) dari kantor pajak", cn: "税务局颁发的登记证明书 (SKT)" },
      { en: "Business Identification Number (NIB)", id: "Nomor Induk Berusaha (NIB)", cn: "业务登记号 (NIB)" },
    ],
    whatsIncludedNote: {
      en: "*Note: Sole Proprietorship registration doesn't require a Deed of Establishment or Ministry of Law Decree, since it isn't a separate legal entity from its owner — making it the fastest and simplest option to register.*",
      id: "*Catatan: Pendaftaran Perusahaan Perorangan tidak memerlukan Akta Pendirian atau SK Kemenkumham, karena bukan merupakan entitas hukum yang terpisah dari pemiliknya — menjadikannya pilihan pendaftaran tercepat dan paling sederhana.*",
      cn: "*注：个人独资企业注册不需要设立契约或法律部批文，因为它不是与其所有者分离的独立法人实体——这使其成为最快且最简单的注册选择。*",
    },
    requirementsTitle: {
      en: "Requirements to establish a PMA",
      id: "Persyaratan untuk mendirikan PMA",
      cn: "设立 PMA 的要求",
    },
    requirementsSubTitle: {
      en: "To register a PMA in Indonesia, you'll need to meet the following requirements:",
      id: "Untuk mendaftarkan PMA di Indonesia, Anda harus memenuhi persyaratan berikut:",
      cn: "在印度尼西亚注册 PMA，您需要满足以下要求：",
    },
    requirementsList: [
      {
        title: {
          en: "Shareholders",
          id: "Pemegang Saham",
          cn: "股东要求",
        },
        desc: {
          en: "At least two shareholders, who can be individuals, corporate entities, or a mix of both. Shareholders don't need to be Indonesian residents and can hold shares from anywhere in the world.",
          id: "Minimal dua pemegang saham, yang dapat berupa individu, entitas korporasi, atau campuran keduanya. Pemegang saham tidak perlu menjadi penduduk Indonesia dan dapat memegang saham dari mana saja di seluruh dunia.",
          cn: "至少两名股东，可以是个人、公司实体或两者的混合。股东不需要是印度尼西亚居民，可以从世界任何地方持有股份。",
        },
      },
      {
        title: {
          en: "Management structure",
          id: "Struktur Manajemen",
          cn: "管理结构",
        },
        desc: {
          en: "At least one director and one commissioner. The director manages day-to-day operations and can be foreign, though a foreign director actively working in Indonesia will need an Investor KITAS (stay permit). The commissioner supervises the director but doesn't manage daily operations.",
          id: "Setidaknya satu direktur dan satu komisaris. Direktur mengelola operasional sehari-hari dan dapat berupa warga negara asing, meskipun direktur asing yang aktif bekerja di Indonesia memerlukan KITAS Investor (izin tinggal). Komisaris mengawasi direktur tetapi tidak mengelola operasional sehari-hari.",
          cn: "至少一名董事和一名监事。董事负责管理日常运营，可以是外国人，但在印度尼西亚积极工作的外国董事需要投资者 KITAS（居留许可）。监事监督董事，但不管理日常运营。",
        },
      },
      {
        title: {
          en: "Capital requirements",
          id: "Persyaratan Modal",
          cn: "资本要求",
        },
        desc: {
          en: "A minimum total investment plan of IDR 10 billion per business sector and location (excluding land and buildings), with a portion committed as paid-up capital at incorporation. The paid-up capital doesn't need to be deposited immediately — a signed Capital Statement Letter is accepted at registration, with the actual deposit made once your corporate bank account is open.",
          id: "Rencana investasi total minimum Rp 10 miliar per sektor usaha dan lokasi (tidak termasuk tanah dan bangunan), dengan sebagian disetorkan sebagai modal disetor saat pendirian. Modal disetor tidak perlu disetorkan segera — Surat Pernyataan Modal yang ditandatangani diterima saat pendaftaran, dengan setoran aktual dilakukan setelah rekening bank perusahaan Anda dibuka.",
          cn: "每个业务部门和地点的最低总投资计划为 100 亿印尼盾（不包括土地和建筑物），其中一部分在注册成立时承诺为实缴资本。实缴资本不需要立即存入——注册时接受签署的资本声明书，实际存款将在您的公司银行账户开立后存入。",
        },
      },
      {
        title: {
          en: "Registered business address",
          id: "Alamat Bisnis Terdaftar",
          cn: "注册营业地址",
        },
        desc: {
          en: "Every PMA needs a registered business address in Indonesia, documented at the time of registration. Some business activities require a physical location and cannot use a virtual office — this depends on your KBLI (business classification) code, which MCS Consulting verifies for you before you commit to an address.",
          id: "Setiap PMA memerlukan alamat bisnis terdaftar di Indonesia, yang didokumentasikan pada saat pendaftaran. Beberapa kegiatan bisnis memerlukan lokasi fisik dan tidak dapat menggunakan kantor virtual — ini bergantung pada kode KBLI (klasifikasi bisnis) Anda, yang diverifikasi oleh MCS Consulting untuk Anda sebelum Anda menetapkan alamat.",
          cn: "每家 PMA 都需要在印度尼西亚有一个注册营业地址，并在注册时进行记录。某些商业活动需要实体位置，不能使用虚拟办公室——这取决于您的 KBLI（行业分类）代码，MCS Consulting 会在您确定地址之前为您进行核实。",
        },
      },
      {
        title: {
          en: "Business classification (KBLI)",
          id: "Klasifikasi Bisnis (KBLI)",
          cn: "行业分类 (KBLI)",
        },
        desc: {
          en: "You'll need to select the correct KBLI code for your business activity. This determines which sectors are open to foreign ownership, what percentage of foreign ownership is allowed, and which additional licenses your business will need. Choosing the wrong KBLI code is one of the most common causes of delays and licensing issues later on — MCS Consulting confirms the right classification before you begin.",
          id: "Anda harus memilih kode KBLI yang benar untuk kegiatan bisnis Anda. Ini menentukan sektor mana yang terbuka bagi kepemilikan asing, berapa persentase kepemilikan asing yang diizinkan, dan izin tambahan mana yang dibutuhkan bisnis Anda. Memilih kode KBLI yang salah adalah salah satu penyebab paling umum dari penundaan dan masalah perizinan di kemudian hari — MCS Consulting memastikan klasifikasi yang tepat sebelum Anda memulai.",
          cn: "您需要为您的业务活动选择正确的 KBLI 代码。这决定了哪些行业对外资开放、允许的外资持股比例是多少，以及您的业务需要哪些额外许可。选择错误的 KBLI 代码是日后发生延误和许可问题最常见的原因之一——MCS Consulting 会在您开始之前确认正确的分类。",
        },
      },
      {
        title: {
          en: "Sector restrictions",
          id: "Batasan Sektor",
          cn: "行业限制",
        },
        desc: {
          en: "Some sectors are fully open to 100% foreign ownership, others allow partial foreign ownership, and a small number are closed to foreign investment entirely (such as sectors related to national defense and security). MCS Consulting checks your intended sector against current investment regulations before you start the process.",
          id: "Beberapa sektor sepenuhnya terbuka untuk 100% kepemilikan asing, sebagian lainnya mengizinkan kepemilikan asing sebagian, dan sebagian kecil ditutup sepenuhnya untuk investasi asing (seperti sektor yang berkaitan dengan pertahanan dan keamanan nasional). MCS Consulting memeriksa sektor tujuan Anda terhadap peraturan investasi saat ini sebelum Anda memulai prosesnya.",
          cn: "某些行业完全对外资 100% 开放，其他行业允许部分外资持股，极少数行业完全禁止外商投资（例如与国防和国家安全相关的行业）。MCS Consulting 会在您开始此流程之前，根据当前的投资法规检查您的目标行业。",
        },
      },
    ],
    requirementsFooter: {
      en: "Company establishment in Indonesia is governed by Law No. 40 of 2007 on Limited Liability Companies and administered through the Online Single Submission (OSS) system. MCS Consulting stays current with all Ministry of Investment/BKPM regulation updates on your behalf.",
      id: "Pendirian perusahaan di Indonesia diatur oleh Undang-Undang No. 40 Tahun 2007 tentang Perseroan Terbatas dan dikelola melalui sistem Online Single Submission (OSS). MCS Consulting selalu memperbarui informasi dengan semua pembaruan peraturan Kementerian Investasi/BKPM demi kenyamanan Anda.",
      cn: "印度尼西亚的公司设立受 2007 年第 40 号关于有限责任公司的法律管辖，并通过在线单一提交 (OSS) 系统进行管理。MCS Consulting 代表您密切关注投资部/BKPM 法规的所有最新动态。",
    },
    stepsTitle: {
      en: "Step-by-step registration process",
      id: "Proses pendaftaran langkah demi langkah",
      cn: "逐步注册流程",
    },
    steps: [
      {
        title: {
          en: "Company name reservation",
          id: "Pemesanan nama perusahaan",
          cn: "公司名称预订",
        },
        duration: {
          en: "1–2 days",
          id: "1–2 hari",
          cn: "1-2 天",
        },
        desc: {
          en: "Your company name must be at least three words, not duplicate an existing registered name, and be submitted for approval through the Ministry of Law and Human Rights' online system (AHU). *(Not required for Sole Proprietorship.)*",
          id: "Nama perusahaan Anda harus terdiri dari minimal tiga kata, tidak menduplikasi nama terdaftar yang sudah ada, dan diajukan untuk disetujui melalui sistem online Kementerian Hukum dan HAM (AHU). *(Tidak diperlukan untuk Perusahaan Perorangan.)*",
          cn: "您的公司名称必须至少由三个单词组成，不能与已注册的现有名称重复，并且必须通过法律和人权部的在线系统 (AHU) 提交审批。*(个人独资企业不需要。)*",
        },
      },
      {
        title: {
          en: "Deed of establishment",
          id: "Akta pendirian",
          cn: "设立契约",
        },
        duration: {
          en: "3–5 days",
          id: "3–5 hari",
          cn: "3-5 天",
        },
        desc: {
          en: "A licensed Indonesian notary drafts your Deed of Establishment, covering your company's structure, shareholders, business activities (KBLI codes), and management. This can typically be signed remotely via Power of Attorney. *(Not required for Sole Proprietorship.)*",
          id: "Notaris berlisensi di Indonesia menyusun Akta Pendirian Anda, mencakup struktur perusahaan, pemegang saham, kegiatan usaha (kode KBLI), dan manajemen. Dokumen ini biasanya dapat ditandatangani dari jauh melalui Surat Kuasa (Power of Attorney). *(Tidak diperlukan untuk Perusahaan Perorangan.)*",
          cn: "由持牌的印度尼西亚公证人起草您的设立契约，其中涵盖您的公司结构、股东、业务活动（KBLI 代码）和管理层。这通常可以通过授权书 (Power of Attorney) 远程签署。*(个人独资企业不需要。)*",
        },
      },
      {
        title: {
          en: "Ministry of Law approval",
          id: "Persetujuan Kementerian Hukum & HAM",
          cn: "法律部批准",
        },
        duration: {
          en: "5–7 days",
          id: "5–7 hari",
          cn: "5-7 天",
        },
        desc: {
          en: "The notarized deed is submitted to the Ministry of Law and Human Rights for review. Once approved, you receive an official decree confirming your company's legal status. *(Not required for Sole Proprietorship.)*",
          id: "Akta yang telah dinotariskan diserahkan ke Kementerian Hukum dan Hak Asasi Manusia untuk ditinjau. Setelah disetujui, Anda menerima keputusan resmi yang mengonfirmasi status hukum perusahaan Anda. *(Tidak diperlukan untuk Perusahaan Perorangan.)*",
          cn: "将公证后的契约提交给法律和人权部进行审查。获得批准后，您将收到一份官方法令，确认您公司的法人身份。*(个人独资企业不需要。)*",
        },
      },
      {
        title: {
          en: "Tax registration — NPWP and SKT",
          id: "Pendaftaran Pajak — NPWP dan SKT",
          cn: "税务登记 — NPWP 和 SKT",
        },
        duration: {
          en: "2–3 days",
          id: "2–3 hari",
          cn: "2-3 天",
        },
        desc: {
          en: "Your business is registered with the Directorate General of Taxes to obtain your Tax Identification Number (NPWP) and Certificate of Registration (SKT).",
          id: "Bisnis Anda terdaftar di Direktorat Jenderal Pajak untuk mendapatkan Nomor Pokok Wajib Pajak (NPWP) dan Surat Keterangan Terdaftar Pajak (SKT).",
          cn: "您的企业在税务总局进行登记，以获取您的税务登记号 (NPWP) 和税务登记证 (SKT)。",
        },
      },
      {
        title: {
          en: "OSS account and Business Identification Number — NIB",
          id: "Akun OSS dan Nomor Induk Berusaha — NIB",
          cn: "OSS 账户和商业登记号 — NIB",
        },
        duration: {
          en: "3–5 days",
          id: "3–5 hari",
          cn: "3-5 天",
        },
        desc: {
          en: "We set up your OSS account and complete your NIB application, which functions as your primary business license, import license, and customs registration number.",
          id: "Kami menyiapkan akun OSS Anda dan menyelesaikan pengajuan NIB Anda, yang berfungsi sebagai izin usaha dasar, izin impor, dan nomor registrasi kepabeanan Anda.",
          cn: "我们设置您的 OSS 账户并完成您的 NIB 申请，该号码可作为您的主要营业执照、进口许可证和海关登记号。",
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
      en: "4–8 Weeks",
      id: "4–8 Minggu",
      cn: "4-8 周",
    },
    totalTimelineDesc: {
      en: "For Local Investment, PMA, CV, Foundation, and Firm; 1–2 weeks for Sole Proprietorship, given fewer required steps.",
      id: "Untuk Investasi Lokal, PMA, CV, Yayasan, dan Firma; 1–2 minggu untuk Perusahaan Perorangan, karena langkah yang diperlukan lebih sedikit.",
      cn: "本地投资公司、PMA、CV、基金会和商号需 4-8 周；鉴于步骤较少，个人独资企业仅需 1-2 周。",
    },
    finalCtaText: {
      en: "Not sure which entity type fits your business? Schedule a free consultation and our team will map out exactly what applies to you.",
      id: "Belum yakin jenis entitas mana yang sesuai dengan bisnis Anda? Jadwalkan konsultasi gratis dan tim kami akan memetakan dengan tepat apa yang berlaku untuk Anda.",
      cn: "不确定哪种实体类型适合您的企业？预约免费咨询，我们的团队将为您梳理出具体适用的项目。",
    },
  };

  const tableHeaders = {
    columns: [
      { en: "Feature", id: "Fitur", cn: "特征" },
      { en: "Local Investment (PT)", id: "Investasi Lokal (PT)", cn: "本地投资公司 (PT)" },
      { en: "Foreign Investment (PMA)", id: "PMA (Penanaman Modal Asing)", cn: "外商投资公司 (PMA)" },
      { en: "CV", id: "CV", cn: "CV" },
      { en: "Foundation", id: "Yayasan", cn: "基金会" },
      { en: "Firm", id: "Firma", cn: "商号" },
      { en: "Sole Proprietorship", id: "Perusahaan Perorangan", cn: "个人独资企业" },
    ],
  };

  const tableRows = [
    {
      label: { en: "Foreign ownership", id: "Kepemilikan asing", cn: "外资持股比例" },
      values: [
        { en: "Not allowed", id: "Tidak diperbolehkan", cn: "不允许" },
        { en: "Up to 100% (sector-dependent)", id: "Hingga 100% (tergantung sektor)", cn: "高达100%（视行业而定）" },
        { en: "Not allowed", id: "Tidak diperbolehkan", cn: "不允许" },
        { en: "Not applicable (non-profit)", id: "Tidak berlaku (nirlaba)", cn: "不适用（非营利）" },
        { en: "Not allowed", id: "Tidak diperbolehkan", cn: "不允许" },
        { en: "Not allowed", id: "Tidak diperbolehkan", cn: "不允许" },
      ],
    },
    {
      label: { en: "Minimum shareholders/founders", id: "Pemegang saham/pendiri minimum", cn: "最少股东/创始人" },
      values: [
        { en: "2", id: "2", cn: "2" },
        { en: "2", id: "2", cn: "2" },
        { en: "2 partners", id: "2 mitra", cn: "2位合伙人" },
        { en: "1 (as founder)", id: "1 (sebagai pendiri)", cn: "1（作为创始人）" },
        { en: "2 partners", id: "2 mitra", cn: "2位合伙人" },
        { en: "1 (individual)", id: "1 (individu)", cn: "1（个人）" },
      ],
    },
    {
      label: { en: "Minimum capital", id: "Modal minimum", cn: "最低资本" },
      values: [
        { en: "No fixed minimum", id: "Tidak ada minimum tetap", cn: "无固定最低限额" },
        { en: "IDR 10 billion investment plan", id: "Rencana investasi Rp 10 miliar", cn: "100亿印尼盾投资计划" },
        { en: "No fixed minimum", id: "Tidak ada minimum tetap", cn: "无固定最低限额" },
        { en: "Endowment-based, no fixed minimum", id: "Berdasarkan dana abadi, tidak ada minimum tetap", cn: "基于基金捐赠，无固定最低限额" },
        { en: "No fixed minimum", id: "Tidak ada minimum tetap", cn: "无固定最低限额" },
        { en: "No fixed minimum", id: "Tidak ada minimum tetap", cn: "无固定最低限额" },
      ],
    },
    {
      label: { en: "Legal liability", id: "Tanggung jawab hukum", cn: "法律责任" },
      values: [
        { en: "Limited", id: "Terbatas", cn: "有限责任" },
        { en: "Limited", id: "Terbatas", cn: "有限责任" },
        { en: "Limited for silent partners", id: "Terbatas untuk sekutu pasif", cn: "有限（对有限合伙人/被动合伙人）" },
        { en: "N/A (non-profit entity)", id: "N/A (entitas nirlaba)", cn: "不适用（非营利实体）" },
        { en: "Unlimited (personal liability)", id: "Tidak terbatas (tanggung jawab pribadi)", cn: "无限（个人连带责任）" },
        { en: "Unlimited (personal liability)", id: "Tidak terbatas (tanggung jawab pribadi)", cn: "无限（个人连带责任）" },
      ],
    },
    {
      label: { en: "Typical timeline", id: "Waktu pengerjaan", cn: "典型所需时间" },
      values: [
        { en: "2–4 weeks", id: "2–4 minggu", cn: "2-4 周" },
        { en: "4–8 weeks", id: "4–8 minggu", cn: "4-8 周" },
        { en: "2–3 weeks", id: "2–3 minggu", cn: "2-3 周" },
        { en: "3–5 weeks", id: "3–5 minggu", cn: "3-5 周" },
        { en: "1–2 weeks", id: "1–2 minggu", cn: "1-2 周" },
        { en: "1–2 weeks", id: "1–2 minggu", cn: "1-2 周" },
      ],
    },
    {
      label: { en: "Best for", id: "Terbaik untuk", cn: "最适合" },
      values: [
        { en: "Indonesian-owned small-to-medium businesses", id: "Bisnis kecil-menengah milik warga Indonesia", cn: "印尼人拥有的中小企业" },
        { en: "Foreign investors, international companies", id: "Investor asing, perusahaan internasional", cn: "外国投资者、国际公司" },
        { en: "Small local partnerships with mixed liability", id: "Kemitraan lokal kecil dengan tanggung jawab campuran", cn: "具有混合责任的小型本地合伙企业" },
        { en: "Non-profits, social/religious/charitable purposes", id: "Organisasi nirlaba, tujuan sosial/keagamaan/amal", cn: "非营利、社会/宗教/慈善目的" },
        { en: "Small partnerships, professional practices", id: "Kemitraan kecil, praktik profesional", cn: "小型合伙企业、专业事务所" },
        { en: "Individual entrepreneurs, freelancers, small local operators", id: "Wirausahawan mandiri, pekerja lepas, operator lokal kecil", cn: "个人创业者、自由职业者、本地小型运营商" },
      ],
    },
  ];

  const faqs = [
    {
      question: {
        en: "What is the minimum capital required to establish a PMA?",
        id: "Berapa modal minimum yang diperlukan untuk mendirikan PMA?",
        cn: "设立 PMA 的最低资本是多少？",
      },
      answer: {
        en: "The minimum required investment plan for a PMA is IDR 10 billion (excluding land and buildings), with a minimum paid-up capital of IDR 10 billion that must be deposited into the corporate bank account after incorporation.",
        id: "Rencana investasi minimum yang disyaratkan untuk PMA adalah Rp 10 miliar (tidak termasuk tanah dan bangunan), dengan modal disetor minimum Rp 10 miliar yang harus disetorkan ke rekening bank perusahaan setelah pendirian.",
        cn: "PMA 的最低投资计划为 100 亿印尼盾（不包括土地和建筑），最低实缴资本为 100 亿印尼盾，必须在成立后存入公司银行账户。",
      },
    },
    {
      question: {
        en: "What are the restrictions for foreign ownership in Indonesia?",
        id: "Apa saja batasan untuk kepemilikan asing di Indonesia?",
        cn: "印度尼西亚对外资所有权有什么限制？",
      },
      answer: {
        en: "Under the Positive Investment List (Perpres 10/2021), most sectors are 100% open to foreign ownership. However, certain sectors are restricted or reserved exclusively for domestic companies. Our team can help check the specific KBLI for your business.",
        id: "Berdasarkan Daftar Investasi Positif (Perpres 10/2021), sebagian besar sektor 100% terbuka untuk kepemilikan asing. Namun, sektor tertentu dibatasi atau dicadangkan secara eksklusif untuk perusahaan domestik. Tim kami dapat membantu memeriksa KBLI spesifik untuk bisnis Anda.",
        cn: "根据积极投资清单（2021年第10号总统令），大多数行业对外资100%开放。但是，某些行业受到限制或专供国内公司使用。我们的团队可以帮助您检查特定业务的KBLI。",
      },
    },
    {
      question: {
        en: "What is the difference between a PMA and a CV?",
        id: "Apa perbedaan antara PMA dan CV?",
        cn: "PMA 和 CV 之间有什么区别？",
      },
      answer: {
        en: "A PMA is a limited liability company open to foreign investors. A CV (Commanditaire Vennootschap) is a limited partnership that is strictly reserved for 100% local (Indonesian citizen) ownership.",
        id: "PMA adalah perseroan terbatas yang terbuka untuk investor asing. CV (Commanditaire Vennootschap) adalah persekutuan komanditer yang secara ketat dicadangkan untuk 100% kepemilikan lokal (warga negara Indonesia).",
        cn: "PMA 是向外国投资者开放的有限责任公司。CV（两合公司）是严格保留给100%本地（印度尼西亚公民）所有权的有限合伙企业。",
      },
    },
    {
      question: {
        en: "How long does the establishment process usually take?",
        id: "Berapa lama proses pendirian biasanya berlangsung?",
        cn: "成立过程通常需要多长时间？",
      },
      answer: {
        en: "The standard incorporation process for a PMA or local PT, including the Notarial Deed, MOLHR approval, and NIB issuance via the OSS system, usually takes between 4 to 8 weeks, assuming all documentation is complete.",
        id: "Proses pendirian standar untuk PMA atau PT lokal, termasuk Akta Notaris, persetujuan Kemenkumham, dan penerbitan NIB melalui sistem OSS, biasanya memakan waktu antara 4 hingga 8 minggu, dengan asumsi semua dokumentasi lengkap.",
        cn: "假设所有文件齐全，PMA 或本地 PT 的标准成立流程（包括公证书，MOLHR 批准和通过 OSS 系统签发 NIB）通常需要 4 到 8 周。",
      },
    },
    {
      question: {
        en: "Can a foreigner be a Director of the company?",
        id: "Bisakah orang asing menjadi Direktur perusahaan?",
        cn: "外国人可以担任公司的董事吗？",
      },
      answer: {
        en: "Yes, a foreigner can be appointed as a Director or Commissioner in a PMA. However, they must obtain a valid work permit (KITAS) to legally reside and perform their duties in Indonesia.",
        id: "Ya, orang asing dapat ditunjuk sebagai Direktur atau Komisaris di PMA. Namun, mereka harus mendapatkan izin kerja (KITAS) yang sah untuk tinggal dan melaksanakan tugasnya secara hukum di Indonesia.",
        cn: "是的，外国人可以被任命为 PMA 的董事或专员。但是，他们必须获得有效的工作许可证（KITAS）才能合法居住在印度尼西亚并履行其职责。",
      },
    },
  ];

  const ctaText = {
    en: "Need More Information?",
    id: "Butuh Informasi Lebih Lanjut?",
    cn: "需要更多信息吗？",
  };

  const ctaDescription = {
    en: "Our team is ready to help you choose the right business entity type for your needs",
    id: "Tim kami siap membantu Anda memilih jenis badan usaha yang tepat untuk kebutuhan Anda",
    cn: "我们的团队随时准备帮助您根据您的需求选择最合适的商业实体类型",
  };

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <BaseServicePage
      icon={Building2}
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
            <Building2 className="h-5 w-5 text-primary" />
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

        {/* Section 1: What entity types are available */}
        <section id="entity-types" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.entityTypesTitle)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-6">
            {getTranslation(content.entityTypesDesc)}
          </p>
        </section>

        {/* Section 2: Comparing business entity types */}
        <section id="comparing-entities" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.comparingTitle)}
          </h2>
          
          {/* Mobile Card Layout */}
          <div className="grid gap-6 md:grid-cols-2 lg:hidden my-8">
            {tableHeaders.columns.slice(1).map((col, colIdx) => {
              const isPma = colIdx === 1; // Foreign Investment (PMA) is at index 1 of slice(1)
              return (
                <div
                  key={colIdx}
                  className={`p-6 rounded-2xl border ${
                    isPma
                      ? "border-primary/40 bg-primary/5 dark:bg-primary/5 shadow-md shadow-primary/5"
                      : "border-border/50 dark:border-white/15 bg-background/30"
                  } backdrop-blur-sm shadow-sm flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-2">
                      <h3 className={`text-base font-bold ${isPma ? "text-primary" : "text-foreground"}`}>
                        {getTranslation(col)}
                      </h3>
                      {isPma && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Recommended
                        </span>
                      )}
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
                    const isPma = idx === 2; // PMA is column 2
                    return (
                      <th
                        key={idx}
                        className={`p-3 font-semibold text-foreground ${
                          isPma
                            ? "bg-primary/5 text-primary border-x border-primary/20 dark:border-primary/30"
                            : ""
                        } ${idx === 0 ? "w-[14%]" : "w-[14.3%]"}`}
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
                      const isPma = valIdx === 1; // PMA
                      return (
                        <td
                          key={valIdx}
                          className={`p-3 text-muted-foreground leading-relaxed ${
                            isPma
                              ? "bg-primary/5 border-x border-primary/20 dark:border-primary/30 text-foreground font-medium"
                              : ""
                          }`}
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

        {/* Section 3: What's included with each entity type */}
        <section id="whats-included" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.whatsIncludedTitle)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8">
            {getTranslation(content.whatsIncludedDesc)}
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tableHeaders.columns.slice(1).map((col, colIdx) => {
              const isSole = colIdx === 5; // Sole Proprietorship
              const isPma = colIdx === 1;
              const bullets = isSole ? content.whatsIncludedBulletsSole : content.whatsIncludedBulletsCommon;
              return (
                <div
                  key={colIdx}
                  className={`p-6 rounded-2xl border ${
                    isPma
                      ? "border-primary/35 bg-primary/5 dark:bg-primary/5"
                      : "border-border/50 dark:border-white/15 bg-background/40"
                  } backdrop-blur-sm shadow-sm flex flex-col`}
                >
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/20">
                    <Briefcase className={`h-5 w-5 ${isPma ? "text-primary" : "text-muted-foreground"}`} />
                    <h3 className="font-bold text-foreground text-base">
                      {getTranslation(col)}
                    </h3>
                  </div>
                  <ul className="space-y-3 flex-grow mb-4">
                    {bullets.map((bullet, idx) => (
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

          <p className="mt-8 text-sm text-muted-foreground italic leading-relaxed pl-4 border-l-2 border-primary/40">
            {getTranslation(content.whatsIncludedNote)}
          </p>
        </section>

        {/* Section 4: Requirements to establish a PMA */}
        <section id="requirements-pma" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.requirementsTitle)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-8">
            {getTranslation(content.requirementsSubTitle)}
          </p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {content.requirementsList.map((req, idx) => {
              const IconComponent = [Users, Scale, Coins, MapPin, BookmarkCheck, FileCheck2][idx] || Users;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/40 backdrop-blur-sm hover:border-primary/35 hover:bg-background/60 transition-all duration-300 shadow-sm flex flex-col"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/25 mb-4">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-foreground">
                      {getTranslation(req.title)}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {getTranslation(req.desc)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-base text-muted-foreground leading-relaxed border-l-2 border-primary/50 pl-4 py-1 italic bg-primary/5 rounded-r-xl">
            {getTranslation(content.requirementsFooter)}
          </p>
        </section>

        {/* Section 5: Step-by-step registration process */}
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

        {/* Section 6: Timeline & CTA */}
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
