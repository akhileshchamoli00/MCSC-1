"use client";

import {
  FileText,
  ShieldCheck,
  Clock,
  Calendar,
  ArrowRight,
  ChevronRight,
  ClipboardList,
  Fingerprint,
  TrendingUp,
} from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BusinessLicensePage() {
  const { language } = useLanguage();

  const getTranslation = (obj: any) => {
    if (!obj) return "";
    if (language === "id" && obj.idText) return obj.idText;
    return obj[language] || obj["en"] || "";
  };

  const title = {
    en: "Business License & Tax Registration",
    id: "Perizinan Usaha & Pendaftaran Pajak",
    cn: "商业许可与税务登记",
  };

  const description = {
    en: "Registration and activation of Business Identification Number (NIB), Tax Identification Number (NPWP), Taxable Entrepreneur (PKP) status, and Coretax activation.",
    id: "Pendaftaran dan aktivasi Nomor Induk Berusaha (NIB), Nomor Pokok Wajib Pajak (NPWP), status Pengusaha Kena Pajak (PKP), serta aktivasi Coretax.",
    cn: "注册并激活商业登记号 (NIB)、税务登记号 (NPWP)、增值税一般纳税人 (PKP) 身份以及 Coretax 激活。",
  };

  const content = {
    legalBadge: {
      en: "Reviewed by the MCS Consulting Legal Team · Last updated July 2026 · 7 min read",
      id: "Ditinjau oleh Tim Hukum MCS Consulting · Terakhir diperbarui Juli 2026 · 7 menit baca",
      cn: "由 MCS Consulting 法律团队审核 · 上次更新于 2026 年 7 月 · 7 分钟阅读",
    },
    introText: {
      en: "Every business operating in Indonesia needs three core registrations to legally trade: a Business Identification Number (NIB) to operate at all, a Tax Identification Number (NPWP) for tax reporting, and — once your revenue crosses the VAT threshold — Taxable Entrepreneur (PKP) status. MCS Consulting handles all three end-to-end, from your initial OSS account setup through to Coretax activation and ongoing e-Filing support.",
      id: "Setiap bisnis yang beroperasi di Indonesia membutuhkan tiga registrasi utama untuk berdagang secara legal: Nomor Induk Berusaha (NIB) untuk dapat beroperasi sama sekali, Nomor Pokok Wajib Pajak (NPWP) untuk pelaporan pajak, dan — setelah pendapatan Anda melewati ambang batas PPN — status Pengusaha Kena Pajak (PKP). MCS Consulting menangani ketiganya secara menyeluruh dari awal hingga akhir, mulai dari pengaturan awal akun OSS Anda hingga aktivasi Coretax dan dukungan e-Filing berkelanjutan.",
      cn: "在印度尼西亚运营的每家企业都需要三项核心登记才能合法开展贸易：用于开展运营的商业登记号 (NIB)、用于税务申报的税务登记号 (NPWP)，以及（一旦您的收入超过增值税门槛）增值税一般纳税人 (PKP) 身份。MCS Consulting 全程提供端到端处理服务，从您的初始 OSS 账户设置到 Coretax 激活以及持续的电子申报 (e-Filing) 支持。",
    },
    onThisPage: {
      en: "On this page",
      id: "Di halaman ini",
      cn: "在本页",
    },
    tocItems: [
      {
        id: "licenses-needed",
        en: "What licenses does your business actually need?",
        idText: "Izin apa saja yang sebenarnya dibutuhkan bisnis Anda?",
        cn: "您的企业究竟需要哪些许可？",
      },
      {
        id: "nib-details",
        en: "NIB: Business Identification Number",
        idText: "NIB: Nomor Induk Berusaha",
        cn: "NIB：商业登记号",
      },
      {
        id: "npwp-details",
        en: "NPWP: Tax Identification Number",
        idText: "NPWP: Nomor Pokok Wajib Pajak",
        cn: "NPWP：税务登记号",
      },
      {
        id: "pkp-details",
        en: "PKP: Taxable Entrepreneur status",
        idText: "PKP: Status Pengusaha Kena Pajak",
        cn: "PKP：增值税一般纳税人身份",
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
    licensesTitle: {
      en: "What licenses does your business actually need?",
      id: "Izin apa saja yang sebenarnya dibutuhkan bisnis Anda?",
      cn: "您的企业究竟需要哪些许可？",
    },
    licensesDesc: {
      en: "Not every business needs every registration on day one. The table below shows what applies at each stage of your business.",
      id: "Tidak setiap bisnis membutuhkan setiap registrasi pada hari pertama. Tabel di bawah ini menunjukkan apa yang berlaku pada setiap tahap bisnis Anda.",
      cn: "并不是每家企业在第一天都需要所有这些登记。下表显示了在您业务的各个阶段具体适用的登记项。",
    },
    nibTitle: {
      en: "NIB: Business Identification Number",
      id: "NIB: Nomor Induk Berusaha",
      cn: "NIB: 商业登记号",
    },
    nibDesc: {
      en: "Your NIB is issued through Indonesia's Online Single Submission (OSS) system and serves as your company's primary business license. It's required for every business entity — whether a sole proprietorship or a formally registered legal entity (PT, PT PMA, CV, etc.) — and functions as your import license and customs registration number where applicable.",
      id: "NIB Anda diterbitkan melalui sistem Online Single Submission (OSS) Indonesia dan berfungsi sebagai izin usaha utama perusahaan Anda. Ini diperlukan untuk setiap entitas bisnis — baik perusahaan perorangan maupun entitas hukum yang terdaftar secara resmi (PT, PT PMA, CV, dll.) — dan berfungsi sebagai izin impor dan nomor registrasi kepabeanan jika berlaku.",
      cn: "您的 NIB 是通过印度尼西亚的在线单一提交 (OSS) 系统颁发的，并作为您公司的主要营业执照。无论是独资企业还是正式注册的法人实体（PT、PT PMA、CV 等），每个商业实体都需要它，并在适用时作为您的进口许可证和海关登记号。",
    },
    handlesTitle: {
      en: "What MCS Consulting handles for you:",
      id: "Apa yang ditangani MCS Consulting untuk Anda:",
      cn: "MCS Consulting 为您处理的事项：",
    },
    nibBullets: [
      {
        en: "OSS account creation and setup",
        id: "Pembuatan dan pengaturan akun OSS",
        cn: "OSS 账户创建与设置",
      },
      {
        en: "NIB application for sole proprietorships and legal entities",
        id: "Pengajuan NIB untuk perusahaan perorangan dan entitas hukum",
        cn: "独资企业和法人实体的 NIB 申请",
      },
      {
        en: "NIB RBA (Risk-Based Approach) processing — Indonesia's risk-tiered licensing system that determines which additional sector-specific permits your business needs based on its risk classification",
        id: "Pemrosesan NIB RBA (Risk-Based Approach) — sistem perizinan bertingkat risiko di Indonesia yang menentukan izin khusus sektor tambahan apa yang dibutuhkan bisnis Anda berdasarkan klasifikasi risikonya",
        cn: "NIB RBA（基于风险的方法）处理——印度尼西亚基于风险的分级许可系统，根据您业务的风险分类确定其需要哪些额外的行业特定许可",
      },
    ],
    npwpTitle: {
      en: "NPWP: Tax Identification Number",
      id: "NPWP: Nomor Pokok Wajib Pajak",
      cn: "NPWP: 税务登记号",
    },
    npwpDesc: {
      en: "Your NPWP is mandatory for every business operating in Indonesia — it's required for banking, invoicing, payroll, and all tax reporting. Registration is handled through the Directorate General of Taxes and results in your official Tax Registration Certificate.",
      id: "NPWP Anda wajib dimiliki oleh setiap bisnis yang beroperasi di Indonesia — ini diperlukan untuk perbankan, pembuatan faktur, penggajian, dan semua pelaporan pajak. Pendaftaran ditangani melalui Direktorat Jenderal Pajak dan menghasilkan Surat Keterangan Terdaftar Pajak resmi Anda.",
      cn: "您的 NPWP 对于在印度尼西亚运营的每家企业都是强制性的——它是银行开户、开发票、工资发放和所有税务申报所必需的。登记通过税务总局处理，并颁发您的官方税务登记证。",
    },
    npwpBullets: [
      {
        en: "NPWP registration for your business entity",
        id: "Pendaftaran NPWP untuk entitas bisnis Anda",
        cn: "为您的商业实体进行 NPWP 登记",
      },
      {
        en: "Issuance of your Tax Registration Certificate",
        id: "Penerbitan Surat Keterangan Terdaftar Pajak Anda",
        cn: "颁发您的税务登记证",
      },
    ],
    pkpTitle: {
      en: "PKP: Taxable Entrepreneur status",
      id: "PKP: Status Pengusaha Kena Pajak",
      cn: "PKP: 增值税一般纳税人身份",
    },
    pkpDesc: {
      en: "Once your business crosses Indonesia's VAT revenue threshold — or if you choose to register voluntarily for B2B credibility — you'll need Taxable Entrepreneur (PKP) status. This allows you to collect and report VAT, and requires activation of Coretax, the Directorate General of Taxes' current tax administration system.",
      id: "Setelah bisnis Anda melewati ambang batas pendapatan PPN Indonesia — atau jika Anda memilih untuk mendaftar secara sukarela untuk kredibilitas B2B — Anda memerlukan status Pengusaha Kena Pajak (PKP). Ini memungkinkan Anda untuk memungut dan melaporkan PPN, dan memerlukan aktivasi Coretax, sistem administrasi perpajakan Direktorat Jenderal Pajak saat ini.",
      cn: "一旦您的业务超过印度尼西亚的增值税收入门槛——或者如果您为了 B2B 信誉选择自愿注册——您就需要增值税一般纳税人 (PKP) 身份。这使您能够收取和申报增值税，并且需要激活 Coretax（税务总局当前的税收管理系统）。",
    },
    pkpBullets: [
      {
        en: "PKP application and issuance of your Taxable Entrepreneur Certificate",
        id: "Pengajuan PKP dan penerbitan Sertifikat Pengusaha Kena Pajak Anda",
        cn: "PKP 申请及增值税一般纳税人证书的颁发",
      },
      {
        en: "Coretax activation for your business",
        id: "Aktivasi Coretax untuk bisnis Anda",
        cn: "为您激活 Coretax 系统账户",
      },
      {
        en: "Electronic Certificate setup for e-Filing (tax return submission)",
        id: "Pengaturan Sertifikat Elektronik untuk e-Filing (penyerahan SPT)",
        cn: "设置用于电子申报（申报表提交）的电子证书",
      },
      {
        en: "Installation guidance for Coretax and e-Filing systems",
        id: "Panduan instalasi untuk sistem Coretax dan e-Filing",
        cn: "Coretax 和电子申报系统的安装指导",
      },
      {
        en: "Ongoing technical support for both systems",
        id: "Dukungan teknis berkelanjutan untuk kedua sistem",
        cn: "为这两个系统提供持续的技术支持",
      },
    ],
    regulatoryFooter: {
      en: "Tax registration and reporting in Indonesia are governed by the General Provisions and Tax Procedures Law (UU KUP), while business licensing operates under the OSS-RBA framework established by Government Regulation No. 5 of 2021. MCS Consulting stays current with all Directorate General of Taxes and OSS regulation updates on your behalf.",
      id: "Pendaftaran dan pelaporan pajak di Indonesia diatur oleh Undang-Undang Ketentuan Umum dan Tata Cara Perpajakan (UU KUP), sementara perizinan usaha beroperasi di bawah kerangka OSS-RBA yang ditetapkan oleh Peraturan Pemerintah No. 5 Tahun 2021. MCS Consulting selalu memperbarui informasi dengan semua pembaruan peraturan Direktorat Jenderal Pajak dan OSS demi kenyamanan Anda.",
      cn: "印度尼西亚的税务登记和申报受《税收通用规定和程序法》(UU KUP) 管辖，而商业许可则在 2021 年第 5 号政府条例建立的 OSS-RBA 框架下运行。MCS Consulting 代表您密切关注税务总局和 OSS 法规的所有最新动态。",
    },
    stepsTitle: {
      en: "Step-by-step process",
      id: "Proses langkah demi langkah",
      cn: "逐步流程",
    },
    steps: [
      {
        title: {
          en: "OSS account setup",
          id: "Pengaturan akun OSS",
          cn: "OSS 账户设置",
        },
        duration: {
          en: "1–2 days",
          id: "1–2 hari",
          cn: "1-2 天",
        },
        desc: {
          en: "We create and configure your Online Single Submission account, the foundation for your NIB application.",
          id: "Kami membuat dan mengonfigurasi akun Online Single Submission Anda, fondasi untuk pengajuan NIB Anda.",
          cn: "我们创建并配置您的在线单一提交账户，这是您申请 NIB 的基础。",
        },
      },
      {
        title: {
          en: "NIB application",
          id: "Pengajuan NIB",
          cn: "NIB 申请",
        },
        duration: {
          en: "3–5 days",
          id: "3–5 hari",
          cn: "3-5 天",
        },
        desc: {
          en: "Your Business Identification Number is issued through OSS, classified under the Risk-Based Approach (NIB RBA) according to your business sector and activity.",
          id: "Nomor Induk Berusaha Anda diterbitkan melalui OSS, diklasifikasikan di bawah Pendekatan Berbasis Risiko (NIB RBA) sesuai dengan sektor dan kegiatan bisnis Anda.",
          cn: "您的商业登记号通过 OSS 颁发，根据您的业务部门和活动，归类在基于风险的方法 (NIB RBA) 下。",
        },
      },
      {
        title: {
          en: "NPWP registration",
          id: "Pendaftaran NPWP",
          cn: "NPWP 注册",
        },
        duration: {
          en: "2–3 days",
          id: "2–3 hari",
          cn: "2-3 天",
        },
        desc: {
          en: "Your company is registered with the Directorate General of Taxes to obtain your Tax Identification Number and Tax Registration Certificate.",
          id: "Perusahaan Anda terdaftar di Direktorat Jenderal Pajak untuk mendapatkan Nomor Pokok Wajib Pajak dan Surat Keterangan Terdaftar Pajak Anda.",
          cn: "您的公司在税务总局进行登记，以获取您的税务登记号和税务登记证。",
        },
      },
      {
        title: {
          en: "PKP application, if applicable",
          id: "Pengajuan PKP, jika berlaku",
          cn: "PKP 申请，如果适用",
        },
        duration: {
          en: "5–10 days",
          id: "5–10 hari",
          cn: "5-10 天",
        },
        desc: {
          en: "If your business meets the VAT threshold or you choose to register voluntarily, we apply for your Taxable Entrepreneur Certificate.",
          id: "Jika bisnis Anda memenuhi ambang batas PPN atau Anda memilih untuk mendaftar secara sukarela, kami mengajukan Sertifikat Pengusaha Kena Pajak Anda.",
          cn: "如果您的业务达到增值税门槛或您选择自愿注册，我们将申请您的增值税一般纳税人证书。",
        },
      },
      {
        title: {
          en: "Coretax and e-Filing activation",
          id: "Aktivasi Coretax dan e-Filing",
          cn: "Coretax 和电子申报激活",
        },
        duration: {
          en: "2–4 days",
          id: "2–4 hari",
          cn: "2-4 天",
        },
        desc: {
          en: "Once PKP status is granted, we activate your Coretax account, set up your Electronic Certificate for e-Filing, and guide you through installation — with ongoing technical support as needed.",
          id: "Setelah status PKP diberikan, kami mengaktifkan akun Coretax Anda, menyiapkan Sertifikat Elektronik Anda untuk e-Filing, dan memandu Anda melalui instalasi — dengan dukungan teknis berkelanjutan sesuai kebutuhan.",
          cn: "一旦被授予 PKP 身份，我们将激活您的 Coretax 账户，为您设置电子申报的电子证书，并指导您完成安装——并根据需要提供持续的技术支持。",
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
      en: "1–3 Weeks",
      id: "1–3 Minggu",
      cn: "1-3 周",
    },
    totalTimelineDesc: {
      en: "For NIB and NPWP alone; add 1–2 weeks if PKP and Coretax activation are also required.",
      id: "Untuk NIB dan NPWP saja; tambahkan 1–2 minggu jika aktivasi PKP dan Coretax juga diperlukan.",
      cn: "仅 NIB 和 NPWP 需 1-3 周；如果还需要 PKP 和 Coretax 激活，则增加 1-2 周。",
    },
    finalCtaText: {
      en: "Not sure which licenses your business needs? Schedule a free consultation and our team will map out exactly what applies to you.",
      id: "Belum yakin izin mana yang dibutuhkan bisnis Anda? Jadwalkan konsultasi gratis dan tim kami akan memetakan dengan tepat apa yang berlaku untuk Anda.",
      cn: "不确定您的企业需要哪些许可？预约免费咨询，我们的团队将为您梳理出具体适用的项目。",
    },
  };

  const tableHeaders = {
    columns: [
      { en: "Feature", id: "Fitur", cn: "特征" },
      { en: "NIB", id: "NIB", cn: "NIB" },
      { en: "NPWP", id: "NPWP", cn: "NPWP" },
      { en: "PKP", id: "PKP", cn: "PKP" },
    ],
  };

  const tableRows = [
    {
      label: { en: "What it is", id: "Pengertian", cn: "定义" },
      values: [
        {
          en: "Your primary business license and identification number",
          id: "Izin usaha utama dan nomor identifikasi Anda",
          cn: "您的主要营业执照和身份识别号",
        },
        {
          en: "Your company's tax identification number",
          id: "Nomor pokok wajib pajak perusahaan Anda",
          cn: "您公司的税务登记号",
        },
        {
          en: "Taxable Entrepreneur status for VAT collection",
          id: "Status Pengusaha Kena Pajak untuk pemungutan PPN",
          cn: "用于征收增值税的增值税一般纳税人身份",
        },
      ],
    },
    {
      label: { en: "Who needs it", id: "Persyaratan", cn: "适用对象" },
      values: [
        {
          en: "Every business entity, without exception",
          id: "Setiap entitas bisnis, tanpa kecuali",
          cn: "每个商业实体，毫无例外",
        },
        {
          en: "Every business entity, without exception",
          id: "Setiap entitas bisnis, tanpa kecuali",
          cn: "每个商业实体，毫无例外",
        },
        {
          en: "Businesses exceeding the VAT revenue threshold (or opting in voluntarily)",
          id: "Bisnis yang melebihi ambang batas pendapatan PPN (atau memilih masuk secara sukarela)",
          cn: "超过增值税收入门槛（或选择自愿加入）的企业",
        },
      ],
    },
    {
      label: { en: "Issued via", id: "Diterbitkan oleh", cn: "颁发系统" },
      values: [
        {
          en: "OSS (Online Single Submission) system",
          id: "Sistem OSS (Online Single Submission)",
          cn: "OSS（在线单一提交）系统",
        },
        {
          en: "Directorate General of Taxes (DJP)",
          id: "Direktorat Jenderal Pajak (DJP)",
          cn: "税务总局 (DJP)",
        },
        {
          en: "DJP, after NPWP is active",
          id: "DJP, setelah NPWP aktif",
          cn: "DJP，在 NPWP 激活后",
        },
      ],
    },
    {
      label: { en: "When to register", id: "Waktu Pendaftaran", cn: "登记时机" },
      values: [
        {
          en: "Immediately after company establishment",
          id: "Segera setelah pendirian perusahaan",
          cn: "公司成立后立即",
        },
        {
          en: "Immediately after company establishment",
          id: "Segera setelah pendirian perusahaan",
          cn: "公司成立后立即",
        },
        {
          en: "Once turnover crosses the threshold, or when needed for B2B credibility",
          id: "Setelah omzet melewati ambang batas, atau bila diperlukan untuk kredibilitas B2B",
          cn: "一旦营业额超过门槛，或在需要 B2B 信誉时",
        },
      ],
    },
    {
      label: { en: "MCS Consulting handles", id: "Layanan MCS", cn: "MCS服务涵盖" },
      values: [
        {
          en: "OSS account setup, NIB RBA (risk-based) application",
          id: "Pengaturan akun OSS, pengajuan NIB RBA (berbasis risiko)",
          cn: "OSS 账户设置、NIB RBA（基于风险）申请",
        },
        {
          en: "NPWP registration, Tax Registration Certificate",
          id: "Pendaftaran NPWP, Surat Keterangan Terdaftar Pajak",
          cn: "NPWP 注册、税务登记证",
        },
        {
          en: "PKP application, Taxable Entrepreneur Certificate, Coretax activation, e-Filing setup",
          id: "Pengajuan PKP, Sertifikat Pengusaha Kena Pajak, aktivasi Coretax, pengaturan e-Filing",
          cn: "PKP 申请、增值税一般纳税人证书、Coretax 激活、电子申报设置",
        },
      ],
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
        cn: "物理营业执照只针对中高风险。对于“低风险”业务，NIB（业务识别号）足以开始运营。但是，对于“中等”和“高风险”业务，NIB仅用作注册。在开始商业活动之前，您必须获得经过验证的标准证书或营业执照。",
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

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <BaseServicePage
      icon={FileText}
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
            <FileText className="h-5 w-5 text-primary" />
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

        {/* Section 1: What licenses does your business actually need? */}
        <section id="licenses-needed" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.licensesTitle)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-6">
            {getTranslation(content.licensesDesc)}
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

        {/* Section 2: NIB */}
        <section id="nib-details" className="scroll-mt-24 mb-16">
          <div className="p-8 rounded-2xl border border-border/50 dark:border-white/15 bg-background/40 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Fingerprint className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {getTranslation(content.nibTitle)}
              </h2>
            </div>
            
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              {getTranslation(content.nibDesc)}
            </p>

            <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider">
              {getTranslation(content.handlesTitle)}
            </h3>
            <ul className="space-y-3">
              {content.nibBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{getTranslation(bullet)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 3: NPWP */}
        <section id="npwp-details" className="scroll-mt-24 mb-16">
          <div className="p-8 rounded-2xl border border-border/50 dark:border-white/15 bg-background/40 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {getTranslation(content.npwpTitle)}
              </h2>
            </div>
            
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              {getTranslation(content.npwpDesc)}
            </p>

            <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider">
              {getTranslation(content.handlesTitle)}
            </h3>
            <ul className="space-y-3">
              {content.npwpBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{getTranslation(bullet)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 4: PKP */}
        <section id="pkp-details" className="scroll-mt-24 mb-16">
          <div className="p-8 rounded-2xl border border-border/50 dark:border-white/15 bg-background/40 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {getTranslation(content.pkpTitle)}
              </h2>
            </div>
            
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              {getTranslation(content.pkpDesc)}
            </p>

            <h3 className="font-bold text-foreground mb-3 text-sm uppercase tracking-wider">
              {getTranslation(content.handlesTitle)}
            </h3>
            <ul className="space-y-3 mb-6">
              {content.pkpBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span>{getTranslation(bullet)}</span>
                </li>
              ))}
            </ul>

            <p className="text-base text-muted-foreground leading-relaxed border-l-2 border-primary/50 pl-4 py-1 italic bg-primary/5 rounded-r-xl">
              {getTranslation(content.regulatoryFooter)}
            </p>
          </div>
        </section>

        {/* Section 5: Step-by-step process */}
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
