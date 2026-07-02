"use client";

import {
  Users,
  ShieldCheck,
  Clock,
  Calendar,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  FileCheck2,
  BookmarkCheck,
  UserX,
  FileText,
  BadgeAlert,
} from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function WorkPermitPage() {
  const { language } = useLanguage();

  const getTranslation = (obj: any) => {
    if (!obj) return "";
    if (language === "id" && obj.idText) return obj.idText;
    return obj[language] || obj["en"] || "";
  };

  const title = {
    en: "Immigration & Stay Permits",
    id: "Imigrasi & Izin Tinggal",
    cn: "移民与居留许可",
  };

  const description = {
    en: "Management of foreign national permits such as KITAS, KITAP, Reporting Certificate (TTKOA), Residence Certificate (SKTT), RPTKA, Mandatory Reporting, Exit Permit Only (EPO), Exit Re-entry Permit (ERP)",
    id: "Pengurusan izin tenaga kerja asing seperti KITAS, KITAP, Surat Keterangan Melapor (TTKOA), Surat Keterangan Tinggal Tetap (SKTT), RPTKA, Wajib Lapor, Exit Permit Only (EPO), Exit Re-entry Permit (ERP)",
    cn: "管理和办理外籍人员许可证件，例如工作准证 (KITAS)、永久居留证 (KITAP)、报告证明 (TTKOA)、临时居住证明 (SKTT)、外籍员工聘用计划 (RPTKA)、强制报告、仅限出境许可 (EPO)、出境重入境许可 (ERP)",
  };

  const content = {
    legalBadge: {
      en: "Reviewed by the MCS Consulting Legal Team · Last updated July 2026 · 7 min read",
      id: "Ditinjau oleh Tim Hukum MCS Consulting · Terakhir diperbarui Juli 2026 · 7 menit baca",
      cn: "由 MCS Consulting 法律团队审核 · 上次更新于 2026 年 7 月 · 7 分钟阅读",
    },
    introText: {
      en: "Foreign nationals living, working, or doing business in Indonesia need the right immigration document for their situation — a temporary stay permit, permanent residence, a business visa, or official certification. MCS Consulting handles the full range of immigration services, from KITAS applications through to permit closures when your stay in Indonesia ends.",
      id: "Warga negara asing yang tinggal, bekerja, atau berbisnis di Indonesia memerlukan dokumen imigrasi yang tepat untuk situasi mereka — izin tinggal terbatas, tinggal tetap, visa bisnis, atau sertifikasi resmi. MCS Consulting menangani seluruh layanan imigrasi, mulai dari pengajuan KITAS hingga penutupan izin (EPO) ketika masa tinggal Anda di Indonesia berakhir.",
      cn: "在印度尼西亚生活、工作或经商的外籍人士需要根据其具体情况申请合适的移民证件——包括临时居留许可、永久居留、商务签证或官方身份证明。MCS Consulting 提供全方位的移民与签证服务，从 KITAS 申请到您结束在印尼停留时的签证注销手续。",
    },
    onThisPage: {
      en: "On this page",
      id: "Di halaman ini",
      cn: "在本页",
    },
    tocItems: [
      {
        id: "permit-needed",
        en: "Which permit do you need?",
        idText: "Izin mana yang Anda butuhkan?",
        cn: "您需要哪种类型的许可证？",
      },
      {
        id: "comparing-permits",
        en: "Comparing permit types",
        idText: "Perbandingan jenis izin",
        cn: "许可证类型比较",
      },
      {
        id: "whats-included",
        en: "What's included with each service",
        idText: "Apa saja yang termasuk dalam setiap layanan",
        cn: "每个服务包含哪些内容",
      },
      {
        id: "requirements-details",
        en: "Requirements by permit type",
        idText: "Persyaratan berdasarkan jenis izin",
        cn: "各类型许可证的要求",
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
    permitTitle: {
      en: "Which permit do you need?",
      id: "Izin mana yang Anda butuhkan?",
      cn: "您需要哪种类型的许可证？",
    },
    permitDesc: {
      en: "The right document depends on why you're in Indonesia and how long you plan to stay — working, joining family, running periodic business trips, or settling permanently all require different permits. The table below shows what applies to your situation.",
      id: "Dokumen yang tepat bergantung pada alasan Anda berada di Indonesia dan berapa lama Anda berencana untuk tinggal — bekerja, berkumpul dengan keluarga, melakukan perjalanan bisnis berkala, atau menetap secara permanen semuanya memerlukan izin yang berbeda. Tabel di bawah ini menunjukkan apa yang berlaku untuk situasi Anda.",
      cn: "选择合适的身份证件取决于您在印尼的目的以及您计划停留的时间——工作、家属团聚、定期商务出差或永久定居都需要不同的许可证。下表显示了适用于您的情况。",
    },
    comparingTitle: {
      en: "Comparing permit types",
      id: "Perbandingan jenis izin",
      cn: "许可证类型比较",
    },
    whatsIncludedTitle: {
      en: "What's included with each service",
      id: "Apa saja yang termasuk dalam setiap layanan",
      cn: "每个服务包含哪些内容",
    },
    whatsIncludedList: [
      {
        title: { en: "Limited Stay Permit (KITAS)", id: "Kartu Izin Tinggal Terbatas (KITAS)", cn: "工作/暂住准证 (KITAS)" },
        bullets: [
          { en: "New Application & Extension", id: "Permohonan Baru & Perpanjangan", cn: "新申请与延期服务" },
          { en: "Working KITAS", id: "KITAS Kerja", cn: "工作类 KITAS" },
          { en: "Family Reunion KITAS", id: "KITAS Penyatuan Keluarga", cn: "家属团聚类 KITAS" },
          { en: "Official Permit for Foreign Nationals", id: "Izin Resmi Warga Negara Asing", cn: "外籍人士法定许可证" },
        ],
      },
      {
        title: { en: "Permanent Residence (KITAP)", id: "Kartu Izin Tinggal Tetap (KITAP)", cn: "永久居留准证 (KITAP)" },
        bullets: [
          { en: "Permanent Residence Permit", id: "Izin Tinggal Tetap", cn: "永久居留权申请" },
          { en: "Available after two KITAS extensions", id: "Tersedia setelah dua kali perpanjangan KITAS", cn: "持有两次 KITAS 延期后可申请" },
          { en: "Valid for 5 years per extension", id: "Berlaku 5 tahun per perpanjangan", cn: "每期延长有效期为5年" },
          { en: "Full Immigration Compliance", id: "Kepatuhan Imigrasi Penuh", cn: "完全合规的移民身份" },
        ],
      },
      {
        title: { en: "Permit Closures (EPO/ERP)", id: "Penutupan Izin (EPO/ERP)", cn: "注销与注销出境许可 (EPO/ERP)" },
        bullets: [
          { en: "Exit Permit Only (EPO)", id: "Exit Permit Only (EPO)", cn: "出境许可 (EPO)" },
          { en: "Exit Re-entry Permit (ERP)", id: "Exit Re-entry Permit (ERP)", cn: "出境重入境许可 (ERP)" },
          { en: "Returning Immigration Documents", id: "Pengembalian Dokumen Imigrasi", cn: "退还移民主管机关文件" },
          { en: "Ending Stay in Indonesia", id: "Mengakhiri Masa Tinggal di Indonesia", cn: "终止在印尼的逗留期" },
        ],
      },
      {
        title: { en: "Business Visas", id: "Visa Bisnis", cn: "商务签证 (Visa Bisnis)" },
        bullets: [
          { en: "Multiple Business Visa", id: "Visa Bisnis Multiple", cn: "多次往返商务签证" },
          { en: "Frequent Business Trips", id: "Perjalanan Bisnis Rutin", cn: "满足频繁商务旅行需求" },
          { en: "2-Month Validity per Visit", id: "Validitas 2 Bulan per Kunjungan", cn: "每次入境可停留2个月" },
          { en: "Sponsorship Support", id: "Dukungan Sponsor", cn: "赞助商/担保函支持" },
        ],
      },
      {
        title: { en: "Official Certificates", id: "Surat Keterangan Resmi", cn: "官方登记与证明材料" },
        bullets: [
          { en: "Residence Certificate (SKTT)", id: "Surat Keterangan Tempat Tinggal (SKTT)", cn: "临时居留证明 (SKTT)" },
          { en: "Reporting Certificate (TTKOA)", id: "Surat Keterangan Melapor (TTKOA)", cn: "警方申报证明 (TTKOA)" },
          { en: "Dukcapil & Police Coordination", id: "Koordinasi Dukcapil & Polisi", cn: "户政局与警方协调对接" },
          { en: "Identity Documents for Foreigners", id: "Dokumen Identitas Orang Asing", cn: "外籍人士身份证明文件" },
        ],
      },
    ],
    requirementsTitle: {
      en: "Requirements by permit type",
      id: "Persyaratan berdasarkan jenis izin",
      cn: "各类型许可证的要求",
    },
    reqKitasTitle: {
      en: "KITAS (Limited Stay Permit)",
      id: "KITAS (Izin Tinggal Terbatas)",
      cn: "KITAS（暂住/工作准证）",
    },
    reqKitasDesc: {
      en: "You'll need a sponsoring company (for Working KITAS) or sponsoring family member (for Family Reunion KITAS), a valid passport with sufficient remaining validity, and — for Working KITAS — confirmation that your sponsoring company holds the correct RPTKA (foreign worker utilization plan) approval before your application can proceed.",
      id: "Anda memerlukan perusahaan sponsor (untuk KITAS Kerja) atau anggota keluarga sponsor (untuk KITAS Penyatuan Keluarga), paspor yang sah dengan masa berlaku yang cukup, dan — untuk KITAS Kerja — konfirmasi bahwa perusahaan sponsor Anda memiliki persetujuan RPTKA (rencana penggunaan tenaga kerja asing) yang benar sebelum permohonan Anda dapat diproses.",
      cn: "您需要有担保公司（对于工作 KITAS）或担保家庭成员（对于家属团聚 KITAS）、有效期足够的护照，并且（对于工作 KITAS）在申请前需要确认您的担保公司已获得正确的 RPTKA（外籍员工聘用计划）批准。",
    },
    reqKitapTitle: {
      en: "KITAP (Permanent Stay Permit)",
      id: "KITAP (Izin Tinggal Tetap)",
      cn: "KITAP（永久居留准证）",
    },
    reqKitapDesc: {
      en: "You'll need to have held and extended your KITAS for the qualifying period (generally after two KITAS extensions), along with your complete immigration history and sponsor documentation.",
      id: "Anda harus telah memegang dan memperpanjang KITAS Anda selama masa kualifikasi (umumnya setelah dua kali perpanjangan KITAS), bersama dengan riwayat imigrasi lengkap dan dokumentasi sponsor Anda.",
      cn: "您需要已经持有并延期了您的 KITAS 达到规定的期限（通常是在两次 KITAS 延期之后），并提供完整的移民历史和担保人文件。",
    },
    reqClosureTitle: {
      en: "Permit Closures (EPO/ERP)",
      id: "Penutupan Izin (EPO/ERP)",
      cn: "关闭与注销签证 (EPO/ERP)",
    },
    reqClosureDesc: {
      en: "For an EPO, you'll need your current KITAS/KITAP and confirmation you're permanently leaving Indonesia. For an ERP, you'll need your current permit and your travel dates, since an ERP allows you to exit and return within your permit's validity.",
      id: "Untuk EPO, Anda memerlukan KITAS/KITAP Anda saat ini dan konfirmasi bahwa Anda meninggalkan Indonesia secara permanen. Untuk ERP, Anda memerlukan izin Anda saat ini dan tanggal perjalanan Anda, karena ERP memungkinkan Anda keluar dan kembali dalam masa berlaku izin Anda.",
      cn: "办理 EPO 需要您当前的 KITAS/KITAP 以及您永久离开印尼的确认函。办理 ERP 需要您当前的许可证和您的旅行日期，因为 ERP 允许您在许可证有效期内出境并返回。",
    },
    reqBusinessTitle: {
      en: "Business Visas",
      id: "Visa Bisnis",
      cn: "商务签证",
    },
    reqBusinessDesc: {
      en: "You'll need a sponsoring company in Indonesia, a valid passport, and documentation supporting the business purpose of your visits.",
      id: "Anda memerlukan perusahaan sponsor di Indonesia, paspor yang sah, dan dokumentasi yang mendukung tujuan bisnis dari kunjungan Anda.",
      cn: "您需要印尼的担保公司、有效的护照以及支持您访问商业目的的文件。",
    },
    reqCertificateTitle: {
      en: "Official Certificates",
      id: "Surat Keterangan Resmi",
      cn: "官方登记与居留证明",
    },
    reqCertificateDesc: {
      en: "Requirements vary by certificate — SKTT (Residence Certificate) and TTKOA (Reporting Certificate) require your current stay permit and coordination with local Dukcapil (civil registry) and police, which MCS Consulting manages on your behalf.",
      id: "Persyaratan bervariasi berdasarkan sertifikat — SKTT (Surat Keterangan Tempat Tinggal) dan TTKOA (Surat Keterangan Melapor) memerlukan izin tinggal Anda saat ini dan koordinasi dengan Dukcapil (catatan sipil) dan polisi setempat, yang semuanya dikelola oleh MCS Consulting atas nama Anda.",
      cn: "不同证书的要求有所不同——SKTT（居留证明）和 TTKOA（申报证明）需要您当前的居留许可，并与当地户政局（Dukcapil）和警方进行协调，MCS Consulting 将代表您处理这些事务。",
    },
    regulatoryFooter: {
      en: "Immigration matters in Indonesia are governed by Law No. 6 of 2011 on Immigration and administered by the Directorate General of Immigration, with additional coordination through Dukcapil (civil registry) and local police for residence and reporting certificates. MCS Consulting stays current with all immigration regulation updates on your behalf.",
      id: "Masalah imigrasi di Indonesia diatur oleh Undang-Undang No. 6 Tahun 2011 tentang Keimigrasian dan dikelola oleh Direktorat Jenderal Imigrasi, dengan koordinasi tambahan melalui Dukcapil (catatan sipil) dan polisi setempat untuk sertifikat tinggal dan melapor. MCS Consulting selalu memperbarui informasi dengan semua pembaruan peraturan imigrasi demi kenyamanan Anda.",
      cn: "印度尼西亚的移民事务受 2011 年第 6 号关于移民的法律管辖，并由移民总局管理，居留证明和报告证明还需要与户政局 (Dukcapil) 和当地警方进行额外的协调。MCS Consulting 代表您密切关注所有移民法规的最新的动态。",
    },
    stepsTitle: {
      en: "Step-by-step process",
      id: "Proses langkah demi langkah",
      cn: "逐步流程",
    },
    steps: [
      {
        title: {
          en: "Eligibility and document check",
          id: "Pemeriksaan kelayakan dan dokumen",
          cn: "资质与材料核查",
        },
        duration: {
          en: "1–2 days",
          id: "1–2 hari",
          cn: "1-2 天",
        },
        desc: {
          en: "We confirm which permit fits your situation and what documentation you'll need.",
          id: "Kami memastikan izin mana yang sesuai dengan situasi Anda dan dokumentasi apa yang Anda perlukan.",
          cn: "我们确认哪种许可证符合您的情况以及您需要准备哪些文件。",
        },
      },
      {
        title: {
          en: "Sponsor and application preparation",
          id: "Penyiapan sponsor dan aplikasi",
          cn: "担保函及申请材料准备",
        },
        duration: {
          en: "3–5 days",
          id: "3–5 hari",
          cn: "3-5 天",
        },
        desc: {
          en: "For KITAS and business visas, we prepare the sponsorship documentation and application with your sponsoring company or family member.",
          id: "Untuk KITAS dan visa bisnis, kami menyiapkan dokumentasi sponsor dan permohonan bersama perusahaan sponsor atau anggota keluarga sponsor Anda.",
          cn: "对于 KITAS 和商务签证，我们与您的担保公司或家庭成员共同准备担保文件和申请材料。",
        },
      },
      {
        title: {
          en: "Immigration submission",
          id: "Pengajuan imigrasi",
          cn: "提交移民总局审批",
        },
        duration: {
          en: "Varies",
          id: "Bervariasi",
          cn: "因签证而异",
        },
        desc: {
          en: "Your application is submitted to the Directorate General of Immigration for processing.",
          id: "Permohonan Anda diserahkan ke Direktorat Jenderal Imigrasi untuk diproses.",
          cn: "您的申请将被提交给印尼移民总局进行审批。",
        },
      },
      {
        title: {
          en: "Certificate and follow-up registration",
          id: "Sertifikat dan pendaftaran lanjutan",
          cn: "后续配套证书申领",
        },
        duration: {
          en: "2–5 days",
          id: "2–5 hari",
          cn: "2-5 天",
        },
        desc: {
          en: "Once your permit is issued, we handle any required follow-up registration, including SKTT and TTKOA certificates with Dukcapil and local police.",
          id: "Setelah izin Anda diterbitkan, kami menangani pendaftaran lanjutan yang diperlukan, termasuk sertifikat SKTT dan TTKOA dengan Dukcapil dan polisi setempat.",
          cn: "一旦您的许可证颁发，我们将办理任何所需的后续登记手续，包括向户政局和当地警方申请 SKTT 和 TTKOA 证书。",
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
      en: "2–4 Weeks",
      id: "2–4 Minggu",
      cn: "2-4 周",
    },
    totalTimelineDesc: {
      en: "For new KITAS applications; KITAP processing depends on completed KITAS history; business visas and permit closures are typically faster, often within 1–2 weeks.",
      id: "Untuk permohonan KITAS baru; proses KITAP bergantung pada riwayat KITAS yang telah diselesaikan; visa bisnis dan penutupan izin biasanya lebih cepat, sering kali dalam 1-2 minggu.",
      cn: "新 KITAS 申请通常需 2-4 周；KITAP 审批取决于已有的 KITAS 历史记录；商务签证和关闭签证注销（EPO/ERP）通常更快，通常在 1-2 周内完成。",
    },
    finalCtaText: {
      en: "Not sure which permit fits your situation? Schedule a free consultation and our team will identify exactly what you need.",
      id: "Belum yakin izin mana yang sesuai dengan situasi Anda? Jadwalkan konsultasi gratis dan tim kami akan mengidentifikasi dengan tepat apa yang Anda butuhkan.",
      cn: "不确定哪种许可证适合您的情况？预约免费咨询，我们的团队将为您确定具体所需的内容。",
    },
  };

  const tableHeaders = {
    columns: [
      { en: "Feature", id: "Fitur", cn: "特征" },
      { en: "KITAS", id: "KITAS", cn: "KITAS" },
      { en: "KITAP", id: "KITAP", cn: "KITAP" },
      { en: "Business Visa", id: "Visa Bisnis", cn: "商务签证" },
      { en: "EPO/ERP", id: "EPO/ERP", cn: "EPO/ERP" },
    ],
  };

  const tableRows = [
    {
      label: { en: "What it is", id: "Definisi", cn: "类型说明" },
      values: [
        { en: "Limited (temporary) Stay Permit", id: "Izin Tinggal Terbatas (Sementara)", cn: "有限期（临时）居留许可" },
        { en: "Permanent Residence Permit", id: "Izin Tinggal Tetap", cn: "永久居留许可" },
        { en: "Multiple-entry visa for business travel", id: "Visa kunjungan beberapa kali untuk perjalanan bisnis", cn: "用于商务旅行的多次入境签证" },
        { en: "Exit permits for ending or pausing your stay", id: "Izin keluar untuk mengakhiri atau menjeda masa tinggal Anda", cn: "用于终止或暂停居留的出境许可" },
      ],
    },
    {
      label: { en: "Who it's for", id: "Target pengguna", cn: "适用对象" },
      values: [
        { en: "Foreign workers, family members joining a sponsor", id: "Pekerja asing, anggota keluarga yang bergabung dengan sponsor", cn: "外籍员工、随行家属" },
        { en: "Long-term residents who've held KITAS through two extensions", id: "Penduduk jangka panjang yang telah memegang KITAS melalui dua kali perpanjangan", cn: "已完成两次续签的长期外籍居民" },
        { en: "Foreign nationals making frequent short business trips", id: "Warga negara asing yang sering melakukan perjalanan bisnis singkat", cn: "频繁进行短期商务旅行的外籍人士" },
        { en: "Anyone ending their stay (EPO) or leaving and returning (ERP)", id: "Siapa saja yang mengakhiri masa tinggal (EPO) atau pergi dan kembali (ERP)", cn: "终止在印尼停留 (EPO) 或出境并返回 (ERP) 的人员" },
      ],
    },
    {
      label: { en: "Validity", id: "Masa berlaku", cn: "有效期限" },
      values: [
        { en: "Typically 1–2 years, renewable", id: "Biasanya 1-2 tahun, dapat diperpanjang", cn: "通常为 1-2 年，可续签" },
        { en: "5 years per extension", id: "5 tahun per perpanjangan", cn: "每次续签 5 年" },
        { en: "2 months per visit", id: "2 bulan per kunjungan", cn: "每次入境最长可停留 2 个月" },
        { en: "One-time use per exit", id: "Satu kali penggunaan per keberangkatan", cn: "每次出境单次使用" },
      ],
    },
    {
      label: { en: "Allows work in Indonesia?", id: "Boleh bekerja?", cn: "允许工作？" },
      values: [
        { en: "Yes, for Working KITAS", id: "Ya, untuk KITAS Kerja", cn: "是（仅限工作类 KITAS）" },
        { en: "Yes", id: "Ya", cn: "是" },
        { en: "No — business activities only, not employment", id: "Tidak — hanya kegiatan bisnis, bukan hubungan kerja (employment)", cn: "否——仅限商务活动，不包含在当地就业" },
        { en: "Not applicable", id: "Tidak berlaku", cn: "不适用" },
      ],
    },
  ];

  const faqs = [
    {
      question: {
        en: "What is the difference between a KITAS and a KITAP?",
        id: "Apa perbedaan antara KITAS dan KITAP?",
        cn: "KITAS 和 KITAP 有什么区别？",
      },
      answer: {
        en: "KITAS is a Temporary Stay Permit, generally valid for 1-2 years and requires annual renewal. KITAP is a Permanent Stay Permit, valid for 5 years. Foreigners usually must hold a KITAS for several consecutive years before being eligible to upgrade to a KITAP.",
        id: "KITAS adalah Izin Tinggal Sementara, umumnya berlaku selama 1-2 tahun dan memerlukan perpanjangan tahunan. KITAP adalah Izin Tinggal Tetap, berlaku selama 5 tahun. Orang asing biasanya harus memegang KITAS selama beberapa tahun berturut-turut sebelum memenuhi syarat untuk beralih ke KITAP.",
        cn: "KITAS是临时居留许可，通常有效期为1-2年，需要每年续签。KITAP是永久居留许可，有效期为5年。外国人通常必须连续几年持有KITAS才有资格升级为KITAP。",
      },
    },
    {
      question: {
        en: "Can a spouse on a Dependent KITAS legally work?",
        id: "Bisakah pasangan dengan KITAS Tanggungan bekerja secara hukum?",
        cn: "持有家属KITAS的配偶可以合法工作吗？",
      },
      answer: {
        en: "No. A Dependent KITAS (Family KITAS) strictly prohibits the holder from earning an income in Indonesia. To work legally, the spouse must obtain their own Working KITAS sponsored by a local employer.",
        id: "Tidak. KITAS Tanggungan (KITAS Keluarga) sangat melarang pemegangnya untuk mendapatkan penghasilan di Indonesia. Untuk bekerja secara hukum, pasangan harus mendapatkan KITAS Kerja mereka sendiri yang disponsori oleh pemberi kerja lokal.",
        cn: "不可以。受抚养KITAS（家庭KITAS）严格禁止持有人在印度尼西亚赚取收入。为了合法工作，配偶必须获得由当地雇主赞助的自己的工作KITAS。",
      },
    },
    {
      question: {
        en: "Are there age restrictions for obtaining a Working KITAS?",
        id: "Apakah ada batasan usia untuk mendapatkan KITAS Kerja?",
        cn: "获取工作KITAS有年龄限制吗？",
      },
      answer: {
        en: "Yes. Foreign workers typically must be between 25 and 55 years old, possess a relevant university degree, and have at least 5 years of related work experience. Exceptions are sometimes made for Director or Commissioner positions.",
        id: "Ya. Pekerja asing biasanya harus berusia antara 25 dan 55 tahun, memiliki gelar sarjana yang relevan, dan memiliki setidaknya 5 tahun pengalaman kerja terkait. Pengecualian kadang-kadang dibuat untuk posisi Direktur atau Komisaris.",
        cn: "是的。外国工人通常必须在25至55岁之间，拥有相关的大学学位，并拥有至少5年的相关工作经验。董事或专员职位有时会有例外。",
      },
    },
    {
      question: {
        en: "What is an EPO (Exit Permit Only)?",
        id: "Apa itu EPO (Exit Permit Only)?",
        cn: "什么是 EPO（仅出境许可）？",
      },
      answer: {
        en: "An EPO is required when a foreigner ends their employment, changes sponsors, or permanently leaves Indonesia. It officially cancels the KITAS and ensures the sponsoring company is no longer liable for the individual.",
        id: "EPO diperlukan ketika orang asing mengakhiri pekerjaan mereka, berganti sponsor, atau meninggalkan Indonesia secara permanen. Ini secara resmi membatalkan KITAS & memastikan perusahaan sponsor tidak lagi bertanggung jawab atas individu tersebut.",
        cn: "当外国人结束其工作，更换赞助商或永久离开印度尼西亚时，需要EPO。它正式取消了KITAS，并确保赞助公司不再对该人承担责任。",
      },
    },
    {
      question: {
        en: "Can I hold two Working KITAS for two different companies?",
        id: "Bisakah saya memegang dua KITAS Kerja untuk dua perusahaan yang berbeda?",
        cn: "我可以持有两家不同公司的两份工作KITAS吗？",
      },
      answer: {
        en: "Generally, dual employment is prohibited; a foreigner can only be sponsored by one company. However, foreign Directors or Commissioners can hold board roles in multiple companies, subject to Ministry of Manpower approval.",
        id: "Secara umum, pekerjaan ganda dilarang; orang asing hanya dapat disponsori oleh satu perusahaan. Namun, Direktur atau Komisaris asing dapat memegang peran dewan di beberapa perusahaan, tunduk pada persetujuan Kementerian Ketenagakerjaan.",
        cn: "一般来说，禁止双重就业；外国人只能由一家公司赞助。但是，外国董事或专员可以在多家公司担任董事职务，这取决于人力部的批准。",
      },
    },
  ];

  const ctaText = {
    en: "Simplify Your Immigration Process",
    id: "Permudah Proses Imigrasi Anda",
    cn: "简化您的移民与签证流程",
  };

  const ctaDescription = {
    en: "Let us handle all your foreign worker permit requirements efficiently and professionally",
    id: "Biarkan kami menangani semua persyaratan izin tenaga kerja asing Anda secara efisien dan profesional",
    cn: "让我们高效、专业地为您处理所有的外籍员工工作许可和签证要求",
  };

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <BaseServicePage
      icon={Users}
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
            <Users className="h-5 w-5 text-primary" />
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

        {/* Section 1: Which permit do you need? */}
        <section id="permit-needed" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.permitTitle)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-6">
            {getTranslation(content.permitDesc)}
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
                        className={`p-3 font-semibold text-foreground ${idx === 0 ? "w-[16%]" : "w-[21%]"}`}
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
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.whatsIncludedList.map((service, serviceIdx) => {
              const IconComponent = [FileText, BookmarkCheck, UserX, FileCheck2, ShieldCheck][serviceIdx] || FileText;
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

        {/* Section 3: Requirements by permit type */}
        <section id="requirements-details" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.requirementsTitle)}
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* KITAS */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqKitasTitle)}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqKitasDesc)}
              </p>
            </div>

            {/* KITAP */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqKitapTitle)}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqKitapDesc)}
              </p>
            </div>

            {/* Permit Closures (EPO/ERP) */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqClosureTitle)}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqClosureDesc)}
              </p>
            </div>

            {/* Business Visas */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqBusinessTitle)}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqBusinessDesc)}
              </p>
            </div>

            {/* Official Certificates */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqCertificateTitle)}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqCertificateDesc)}
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
