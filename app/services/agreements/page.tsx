"use client";

import {
  FileSignature,
  ShieldCheck,
  Clock,
  Calendar,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  FileText,
  UserCheck,
  Scale,
  Signature,
  FileCheck2,
  CheckCircle,
} from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AgreementsPage() {
  const { language } = useLanguage();

  const getTranslation = (obj: any) => {
    if (!obj) return "";
    if (language === "id" && obj.idText) return obj.idText;
    return obj[language] || obj["en"] || "";
  };

  const title = {
    en: "Draft Agreement & Legalization",
    id: "Penyusunan Perjanjian & Legalisasi",
    cn: "协议起草与合法化认证",
  };

  const description = {
    en: "Professional legal agreement drafting services including Cooperation Agreements, Sales Agreements, Lease Agreements, and document legalization services.",
    id: "Layanan penyusunan perjanjian hukum profesional termasuk Perjanjian Kerjasama, Perjanjian Jual Beli, Perjanjian Sewa Menyewa, dan layanan legalisasi dokumen.",
    cn: "专业的法律协议起草服务，包括合作协议、销售协议、租赁协议和文件合法化服务。",
  };

  const content = {
    legalBadge: {
      en: "Reviewed by the MCS Consulting Legal Team · Last updated July 2026 · 6 min read",
      id: "Ditinjau oleh Tim Hukum MCS Consulting · Terakhir diperbarui Juli 2026 · 6 menit baca",
      cn: "由 MCS Consulting 法律团队审核 · 上次更新于 2026 年 7 月 · 6 分钟阅读",
    },
    introText: {
      en: "Legally sound agreements protect your business in every transaction, partnership, and asset transfer in Indonesia. MCS Consulting drafts, reviews, and legalizes agreements covering business cooperation, sales, licensing, leases, asset separation, and amendments — plus verification and legalization services for documents you've already prepared.",
      id: "Perjanjian yang sah secara hukum melindungi bisnis Anda dalam setiap transaksi, kemitraan, dan pengalihan aset di Indonesia. MCS Consulting menyusun, meninjau, dan melegalisasi perjanjian yang mencakup kerjasama bisnis, penjualan, lisensi, sewa menyewa, pemisahan harta, dan amandemen — ditambah layanan verifikasi dan legalisasi untuk dokumen yang telah Anda siapkan.",
      cn: "在印度尼西亚，具有法律效力的协议在每笔交易、合伙关系和资产转让中都能保护您的业务。MCS Consulting 起草、审查和合法化涵盖商业合作、销售、许可、租赁、资产分割和修正案的协议——并为您已经准备好的文件提供核实和合法化服务。",
    },
    onThisPage: {
      en: "On this page",
      id: "Di halaman ini",
      cn: "在本页",
    },
    tocItems: [
      {
        id: "agreement-types",
        en: "What type of agreement do you need?",
        idText: "Jenis perjanjian apa yang Anda butuhkan?",
        cn: "您需要什么类型的协议？",
      },
      {
        id: "comparing-agreements",
        en: "Comparing agreement types",
        idText: "Perbandingan jenis perjanjian",
        cn: "协议类型比较",
      },
      {
        id: "whats-included",
        en: "What's included with each service",
        idText: "Apa saja yang termasuk dalam setiap layanan",
        cn: "每个服务包含哪些内容",
      },
      {
        id: "requirements-details",
        en: "Requirements for drafting",
        idText: "Persyaratan untuk penyusunan",
        cn: "起草要求",
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
    agreementTitle: {
      en: "What type of agreement do you need?",
      id: "Jenis perjanjian apa yang Anda butuhkan?",
      cn: "您需要什么类型的协议？",
    },
    agreementDesc: {
      en: "Different business situations call for different agreement types — a partnership needs a cooperation agreement, a transaction needs a sales agreement, an asset transfer needs a separation of assets agreement. The table below shows what applies to your situation.",
      id: "Situasi bisnis yang berbeda memerlukan jenis perjanjian yang berbeda — kemitraan memerlukan perjanjian kerjasama, transaksi memerlukan perjanjian jual beli, pengalihan aset memerlukan perjanjian pemisahan harta. Tabel di bawah ini menunjukkan apa yang berlaku untuk situasi Anda.",
      cn: "不同的商业情景需要不同的协议类型——合作关系需要合作协议，商业交易需要销售协议，资产转让需要资产分割协议。下表显示了适用于您的情况。",
    },
    comparingTitle: {
      en: "Comparing agreement types",
      id: "Perbandingan jenis perjanjian",
      cn: "协议类型比较",
    },
    whatsIncludedTitle: {
      en: "What's included with each service",
      id: "Apa saja yang termasuk dalam setiap layanan",
      cn: "每个服务包含哪些内容",
    },
    whatsIncludedList: [
      {
        title: { en: "Cooperation Agreement", id: "Perjanjian Kerjasama", cn: "合作协议" },
        desc: {
          en: "Drafted to define each party's contributions, responsibilities, profit-sharing, and exit terms for a business partnership or joint venture.",
          id: "Disusun untuk menetapkan kontribusi, tanggung jawab, pembagian keuntungan, dan ketentuan keluar dari kemitraan bisnis atau usaha patungan.",
          cn: "旨在明确商业合伙关系或合资企业中各方的出资、职责、利润分配及退伙条款。",
        },
      },
      {
        title: { en: "Sales Agreement", id: "Perjanjian Jual Beli", cn: "销售协议" },
        desc: {
          en: "Drafted to document the terms of a sale — price, payment terms, delivery, and warranties — for goods, property, or business assets.",
          id: "Disusun untuk mencatat ketentuan penjualan — harga, syarat pembayaran, pengiriman, dan jaminan — untuk barang, properti, atau aset bisnis.",
          cn: "旨在记录商品、财产或商业资产销售的条款——价格、付款方式、交付和保修。",
        },
      },
      {
        title: { en: "License Agreement", id: "Perjanjian Lisensi", cn: "许可协议" },
        desc: {
          en: "Drafted to define the terms under which one party grants another the right to use intellectual property, technology, or a brand, including royalties, exclusivity, and duration.",
          id: "Disusun untuk menetapkan ketentuan di mana satu pihak memberikan hak kepada pihak lain untuk menggunakan kekayaan intelektual, teknologi, atau merek, termasuk royalti, eksklusivitas, dan jangka waktu.",
          cn: "旨在定义一方授予另一方使用知识产权、技术或品牌的条款，包括特许权使用费、排他性和期限。",
        },
      },
      {
        title: { en: "Lease Agreement", id: "Perjanjian Sewa Menyewa", cn: "租赁协议" },
        desc: {
          en: "Drafted to document rental terms for property, office space, or equipment, including duration, payment, and renewal conditions.",
          id: "Disusun untuk mencatat ketentuan sewa untuk properti, ruang kantor, atau peralatan, termasuk jangka waktu, pembayaran, dan kondisi perpanjangan.",
          cn: "旨在记录财产、办公空间或设备的租赁条款，包括租期、租金支付和续租条件。",
        },
      },
      {
        title: { en: "Separation of Assets Agreement", id: "Perjanjian Pemisahan Harta", cn: "财产分割协议" },
        desc: {
          en: "Drafted to formally divide ownership of jointly-held assets between co-owners, shareholders, or other parties.",
          id: "Disusun untuk membagi kepemilikan secara resmi atas aset yang dimiliki bersama antara rekan pemilik, pemegang saham, atau pihak lain.",
          cn: "旨在正式划分共同所有人、股东或其他各方之间共同持有的资产所有权。",
        },
      },
      {
        title: { en: "Addendum to Agreement", id: "Addendum Perjanjian", cn: "协议附录/补充协议" },
        desc: {
          en: "Drafted to formally amend, extend, or modify the terms of an existing agreement without redrafting the entire document.",
          id: "Disusun untuk secara resmi mengubah, memperpanjang, atau memodifikasi ketentuan perjanjian yang ada tanpa menyusun kembali seluruh dokumen.",
          cn: "旨在正式修改、延长或调整现有协议的条款，而无需重新起草整份文件。",
        },
      },
      {
        title: { en: "Document Verification", id: "Verifikasi Dokumen", cn: "文件核实" },
        desc: {
          en: "Confirms the authenticity and legal standing of a document before you rely on it or submit it to a third party.",
          id: "Mengonfirmasi keaslian dan kedudukan hukum suatu dokumen sebelum Anda mengandalkannya atau menyerahkannya ke pihak ketiga.",
          cn: "在您依赖该文件或将其提交给第三方之前，确认其真实性与法律地位。",
        },
      },
      {
        title: { en: "Document Legalization", id: "Legalisasi Dokumen", cn: "文件合法化" },
        desc: {
          en: "Formal certification of a document's authenticity for use with government bodies, banks, or international counterparts, including notarial legalization and, where required, apostille or embassy legalization for use abroad.",
          id: "Sertifikasi resmi atas keaslian dokumen untuk digunakan pada instansi pemerintah, bank, atau rekanan internasional, termasuk legalisasi notaris dan, jika diperlukan, apostille atau legalisasi kedutaan untuk penggunaan di luar negeri.",
          cn: "对文件的真实性进行官方认证，以便在政府机构、银行或国际交易对手处使用，包括公证处合法化，以及（根据需要）海关海牙认证或大使馆认证以便在国外使用。",
        },
      },
    ],
    requirementsTitle: {
      en: "Requirements for drafting",
      id: "Persyaratan untuk penyusunan",
      cn: "起草要求",
    },
    reqNewTitle: {
      en: "New Agreement (Cooperation, Sales, License, Lease, Separation of Assets)",
      id: "Perjanjian Baru (Kerjasama, Jual Beli, Lisensi, Sewa, Pemisahan Harta)",
      cn: "新协议（合作、销售、许可、租赁、财产分割）",
    },
    reqNewDesc: {
      en: "You'll need identification of all parties involved, a clear description of the terms you want reflected (payment, duration, obligations, exit conditions), and any supporting documentation relevant to the subject of the agreement — for example, property ownership documents for a lease, or IP registration details for a license agreement.",
      id: "Anda memerlukan identifikasi semua pihak yang terlibat, deskripsi jelas mengenai ketentuan yang ingin dicantumkan (pembayaran, jangka waktu, kewajiban, ketentuan keluar), dan dokumentasi pendukung apa pun yang relevan dengan pokok perjanjian — misalnya, dokumen kepemilikan properti untuk sewa, atau rincian pendaftaran HKI untuk perjanjian lisensi.",
      cn: "您需要提供所有参与方的身份证明、您希望体现的条款的清晰描述（付款、期限、义务、退出条件），以及与协议标的相关的所有支持文件——例如，租赁协议需要财产所有权文件，许可协议需要知识产权登记详情。",
    },
    reqAddendumTitle: {
      en: "Addendum to Agreement",
      id: "Addendum Perjanjian",
      cn: "补充协议/协议附录",
    },
    reqAddendumDesc: {
      en: "You'll need the original agreement being amended and a clear description of what's changing.",
      id: "Anda memerlukan perjanjian asli yang diubah dan deskripsi jelas mengenai apa yang berubah.",
      cn: "您需要提供被修改的原始协议以及所做变更的清晰描述。",
    },
    reqVerifyTitle: {
      en: "Document Verification",
      id: "Verifikasi Dokumen",
      cn: "文件核实",
    },
    reqVerifyDesc: {
      en: "You'll need the document itself and identification of the parties or authority that issued it.",
      id: "Anda memerlukan dokumen itu sendiri dan identifikasi para pihak atau otoritas yang menerbitkannya.",
      cn: "您需要提供文件本身以及签署该文件的各方或签发该文件的权威机构的身份证明。",
    },
    reqLegalTitle: {
      en: "Document Legalization",
      id: "Legalisasi Dokumen",
      cn: "文件合法化认证",
    },
    reqLegalDesc: {
      en: "You'll need the original document, and — for use abroad — confirmation of which country it's being legalized for, since requirements vary (some countries require apostille, others require embassy legalization).",
      id: "Anda memerlukan dokumen asli, dan — untuk penggunaan di luar negeri — konfirmasi untuk negara mana dokumen tersebut dilegalisasi, karena persyaratannya bervariasi (beberapa negara memerlukan apostille, yang lain memerlukan legalisasi kedutaan).",
      cn: "您需要提供原始文件，以及（如果是国外使用）确认该文件将用于哪个国家/地区，因为不同国家的要求有所不同（某些国家需要海牙认证，其他国家则需要大使馆认证）。",
    },
    regulatoryFooter: {
      en: "Contract law in Indonesia is governed by the Indonesian Civil Code (Kitab Undang-Undang Hukum Perdata), and agreements involving property, business assets, or long-term commitments generally benefit from notarization to ensure enforceability. MCS Consulting drafts every agreement to comply with current Indonesian contract law.",
      id: "Hukum perjanjian di Indonesia diatur oleh Kitab Undang-Undang Hukum Perdata (KUHPerdata), dan perjanjian yang melibatkan properti, aset bisnis, atau komitmen jangka panjang umumnya mendapat manfaat dari notarisasi untuk menjamin kepatuhan hukum. MCS Consulting menyusun setiap perjanjian untuk mematuhi hukum perjanjian Indonesia yang berlaku saat ini.",
      cn: "印度尼西亚的合同法受《印度尼西亚民法典》(KUHPerdata) 管辖，涉及财产、商业资产或长期承诺的协议通常会受益于公证处公证以确保其可执行性。MCS Consulting 起草的每份协议都完全符合当前的印尼合同法。",
    },
    stepsTitle: {
      en: "Step-by-step process",
      id: "Proses langkah demi langkah",
      cn: "逐步流程",
    },
    steps: [
      {
        title: {
          en: "Consultation and terms gathering",
          id: "Konsultasi dan pengumpulan ketentuan",
          cn: "业务咨询与条款收集",
        },
        duration: {
          en: "1–2 days",
          id: "1–2 hari",
          cn: "1-2 天",
        },
        desc: {
          en: "We discuss your situation and gather the specific terms you need reflected in the agreement.",
          id: "Kami mendiskusikan situasi Anda dan mengumpulkan ketentuan spesifik yang perlu dicantumkan dalam perjanjian.",
          cn: "我们与您沟通业务背景并收集您希望在协议中体现的具体条款。",
        },
      },
      {
        title: {
          en: "Drafting",
          id: "Penyusunan draf",
          cn: "协议草拟",
        },
        duration: {
          en: "2–4 days",
          id: "2–4 hari",
          cn: "2-4 天",
        },
        desc: {
          en: "We draft the agreement in accordance with Indonesian contract law, tailored to your specific terms.",
          id: "Kami menyusun perjanjian sesuai dengan hukum perjanjian Indonesia, disesuaikan dengan ketentuan spesifik Anda.",
          cn: "我们根据印度尼西亚合同法起草协议，完美贴合您的具体条款要求。",
        },
      },
      {
        title: {
          en: "Review and revisions",
          id: "Peninjauan dan revisi",
          cn: "客户审阅与修改",
        },
        duration: {
          en: "1–3 days",
          id: "1–3 hari",
          cn: "1-3 天",
        },
        desc: {
          en: "You review the draft and request any changes before finalizing.",
          id: "Anda meninjau draf tersebut dan meminta perubahan apa pun sebelum diselesaikan.",
          cn: "您审阅草案，并在最终定稿前提出任何修改意见。",
        },
      },
      {
        title: {
          en: "Notarization, if required",
          id: "Notarisasi, jika diperlukan",
          cn: "公证处签署公证",
        },
        duration: {
          en: "1–2 days",
          id: "1–2 hari",
          cn: "1-2 天",
        },
        desc: {
          en: "For agreements requiring notarization, we coordinate signing before a licensed Indonesian notary.",
          id: "Untuk perjanjian yang memerlukan notarisasi, kami mengoordinasikan penandatanganan di hadapan notaris berlisensi Indonesia.",
          cn: "对于需要公证的协议，我们安排并协调您在印尼执牌公证人面前进行签署。",
        },
      },
      {
        title: {
          en: "Verification or legalization, if requested",
          id: "Verifikasi atau legalisasi, jika diminta",
          cn: "文件核实或合法化认证",
        },
        duration: {
          en: "2–5 days",
          id: "2–5 hari",
          cn: "2-5 天",
        },
        desc: {
          en: "For document verification or legalization services, we confirm authenticity and process the required certification, including apostille or embassy legalization for international use where needed.",
          id: "Untuk layanan verifikasi atau legalisasi dokumen, kami mengonfirmasi keaslian dan memproses sertifikasi yang diperlukan, termasuk apostille atau legalisasi kedutaan untuk penggunaan internasional jika diperlukan.",
          cn: "对于文件核实或合法化服务， we 确认其真实性并办理所需的认证，包括在需要时为国际使用办理海牙认证或大使馆认证。",
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
      en: "1–2 Weeks",
      id: "1–2 Minggu",
      cn: "1-2 周",
    },
    totalTimelineDesc: {
      en: "For most new agreements; legalization for international use may take longer depending on the destination country's requirements.",
      id: "Untuk sebagian besar perjanjian baru; legalisasi untuk penggunaan internasional mungkin memakan waktu lebih lama tergantung pada persyaratan negara tujuan.",
      cn: "大多数新协议需 1-2 周；国际合法化认证的时间可能更长，具体取决于目的国的具体要求。",
    },
    finalCtaText: {
      en: "Not sure which agreement fits your situation? Schedule a free consultation and our team will draft exactly what you need.",
      id: "Belum yakin perjanjian mana yang sesuai dengan situasi Anda? Jadwalkan konsultasi gratis dan tim kami akan menyusun tepat apa yang Anda butuhkan.",
      cn: "不确定哪种协议适合您的情况？预约免费咨询，我们的团队将准确起草您所需的内容。",
    },
  };

  const tableHeaders = {
    columns: [
      { en: "Feature", id: "Fitur", cn: "特征" },
      { en: "Cooperation Agreement", id: "Perjanjian Kerjasama", cn: "合作协议" },
      { en: "Sales Agreement", id: "Perjanjian Jual Beli", cn: "销售协议" },
      { en: "License Agreement", id: "Perjanjian Lisensi", cn: "许可协议" },
      { en: "Lease Agreement", id: "Perjanjian Sewa Menyewa", cn: "租赁协议" },
      { en: "Separation of Assets Agreement", id: "Perjanjian Pemisahan Harta", cn: "财产分割协议" },
    ],
  };

  const tableRows = [
    {
      label: { en: "Used for", id: "Digunakan untuk", cn: "适用情景" },
      values: [
        {
          en: "Business partnerships, joint ventures, collaborations",
          id: "Kemitraan bisnis, usaha patungan, kolaborasi",
          cn: "商业合伙关系、合资企业、商业合作",
        },
        {
          en: "Buying or selling goods, property, or business assets",
          id: "Membeli atau menjual barang, properti, atau aset bisnis",
          cn: "购买或出售商品、财产或商业资产",
        },
        {
          en: "Granting rights to use IP, technology, or a brand",
          id: "Memberikan hak untuk menggunakan HKI, teknologi, atau merek",
          cn: "授予使用知识产权、技术或品牌的权利",
        },
        {
          en: "Renting property, office space, or equipment",
          id: "Menyewa properti, ruang kantor, atau peralatan",
          cn: "租赁财产、办公空间或设备",
        },
        {
          en: "Dividing ownership of jointly-held assets",
          id: "Membagi kepemilikan aset yang dimiliki bersama",
          cn: "分割共同持有资产的所有权",
        },
      ],
    },
    {
      label: { en: "Common parties", id: "Para pihak", cn: "签署主体" },
      values: [
        {
          en: "Two or more businesses/individuals partnering",
          id: "Dua atau lebih bisnis/individu yang bermitra",
          cn: "两家或多家合伙企业/个人",
        },
        { en: "Buyer and seller", id: "Pembeli dan penjual", cn: "买方和卖方" },
        { en: "Licensor and licensee", id: "Pemberi lisensi dan penerima lisensi", cn: "许可方和被许可方" },
        { en: "Landlord and tenant", id: "Pemilik properti dan penyewa", cn: "房东和租户" },
        {
          en: "Co-owners, shareholders, or divorcing spouses",
          id: "Rekan pemilik, pemegang saham, atau pasangan yang bercerai",
          cn: "共同所有人、股东或离婚配偶",
        },
      ],
    },
    {
      label: {
        en: "Notarization typically required?",
        id: "Notarisasi wajib?",
        cn: "需要公证吗？",
      },
      values: [
        { en: "Recommended, sometimes mandatory", id: "Direkomendasikan, kadang wajib", cn: "推荐，有时是强制性的" },
        {
          en: "Yes, for property and business asset sales",
          id: "Ya, untuk penjualan properti dan aset bisnis",
          cn: "是，用于财产和商业资产的出售",
        },
        { en: "Recommended", id: "Direkomendasikan", cn: "推荐" },
        {
          en: "Recommended for long-term leases",
          id: "Direkomendasikan untuk sewa jangka panjang",
          cn: "长期租赁推荐使用",
        },
        { en: "Yes", id: "Ya", cn: "是" },
      ],
    },
    {
      label: { en: "Best for", id: "Terbaik untuk", cn: "最适合" },
      values: [
        {
          en: "Businesses forming a partnership or joint venture",
          id: "Bisnis yang membentuk kemitraan atau usaha patungan",
          cn: "正在建立合伙关系或合资企业的企业",
        },
        {
          en: "Businesses or individuals completing a transaction",
          id: "Bisnis atau individu yang menyelesaikan transaksi",
          cn: "正在完成交易的企业或个人",
        },
        {
          en: "Businesses licensing IP or brand rights to another party",
          id: "Bisnis yang melisensikan HKI atau hak merek ke pihak lain",
          cn: "将知识产权或品牌权利授权给另一方的企业",
        },
        {
          en: "Businesses or individuals renting property or equipment",
          id: "Bisnis atau individu yang menyewa properti atau peralatan",
          cn: "租赁财产或设备的企业 or 个人",
        },
        {
          en: "Co-owners dividing jointly-held assets",
          id: "Rekan pemilik yang membagi aset yang dimiliki bersama",
          cn: "共同所有人分割共同持有的资产",
        },
      ],
    },
  ];

  const faqs = [
    {
      question: {
        en: "Do business agreements need to be in Bahasa Indonesia?",
        id: "Apakah perjanjian bisnis harus dalam Bahasa Indonesia?",
        cn: "商业协议需要使用印尼语吗？",
      },
      answer: {
        en: "Yes. Under Law No. 24 of 2009, any agreement involving an Indonesian entity or citizen must be drafted in Bahasa Indonesia. Bilingual contracts are legally valid and recommended for foreign entities.",
        id: "Ya. Berdasarkan UU No. 24 Tahun 2009, setiap perjanjian yang melibatkan entitas atau warga negara Indonesia harus dibuat dalam Bahasa Indonesia. Kontrak dwibahasa sah secara hukum dan direkomendasikan untuk entitas asing.",
        cn: "是的。根据2009年第24号法律，涉及印度尼西亚实体或公民的任何协议都必须使用印尼语起草。双语合同在法律上是有效的，推荐外国实体使用。",
      },
    },
    {
      question: {
        en: "What is the difference between a Notarial Deed and a private contract?",
        id: "Apa perbedaan antara Akta Notaris dan kontrak pribadi (di bawah tangan)?",
        cn: "公证书和私人合同有什么区别？",
      },
      answer: {
        en: "A private contract (underhand agreement) is signed only by the parties involved. A Notarial Deed is an authentic act executed by a sworn Notary, carrying absolute evidentiary weight in Indonesian courts. Certain transactions legally require a Notarial Deed.",
        id: "Kontrak pribadi (perjanjian di bawah tangan) hanya ditandatangani oleh para pihak yang terlibat. Akta Notaris adalah akta otentik yang dilaksanakan oleh Notaris tersumpah, membawa bobot pembuktian mutlak di pengadilan Indonesia. Transaksi tertentu secara hukum memerlukan Akta Notaris.",
        cn: "私人合同（私下协议）仅由涉及方签署。公证书是由宣誓公证人执行的真实行为，在印度尼西亚法院具有绝对的证据效力。某些交易在法律上要求提供公证书。",
      },
    },
    {
      question: {
        en: "What is 'Waarmarking'?",
        id: "Apa itu 'Waarmarking'?",
        cn: "什么是 'Waarmarking'？",
      },
      answer: {
        en: "Waarmarking is the process of registering a privately drafted contract with a Notary. The Notary records the date of the agreement in their official registry, which provides legal certainty regarding when the document was executed.",
        id: "Waarmarking adalah proses mendaftarkan kontrak yang dibuat secara pribadi ke Notaris. Notaris mencatat tanggal perjanjian dalam daftar resmi mereka, yang memberikan kepastian hukum mengenai kapan dokumen tersebut dieksekusi.",
        cn: "Waarmarking是将私人起草的合同在公证人处注册的过程。公证人在其官方登记册中记录协议的日期，从而对文件的执行时间提供法律确定性。",
      },
    },
    {
      question: {
        en: "Can you assist with the Apostille or Legalization of foreign documents?",
        id: "Bisakah Anda membantu dengan Apostille atau Legalisasi dokumen asing?",
        cn: "您能协助办理外国文件的Apostille（海牙认证）或合法化吗？",
      },
      answer: {
        en: "Yes. For foreign documents (like parent company articles) to be used in Indonesia, they must be legalized. We assist with Apostille (for member countries) or consular legalization at the relevant Indonesian Embassy.",
        id: "Ya. Agar dokumen asing (seperti anggaran dasar perusahaan induk) dapat digunakan di Indonesia, dokumen tersebut harus dilegalisasi. Kami membantu dengan Apostille (untuk negara anggota) atau legalisasi konsuler di Kedutaan Besar Republik Indonesia yang relevan.",
        cn: "是的。要在印度尼西亚使用外国文件（如母公司章程），必须对其进行合法化。我们协助办理Apostille（针对成员国）或在相关印度尼西亚大使馆进行领事认证。",
      },
    },
    {
      question: {
        en: "Are Non-Disclosure Agreements (NDAs) strictly enforced in Indonesia?",
        id: "Apakah Non-Disclosure Agreements (NDA) ditegakkan secara ketat di Indonesia?",
        cn: "保密协议 (NDA) 在印度尼西亚会被严格执行吗？",
      },
      answer: {
        en: "Yes, NDAs are recognized and enforceable under the Indonesian Civil Code. However, to ensure maximum enforceability, they must be drafted clearly, include specific penalty clauses, and be accompanied by a Bahasa Indonesia translation.",
        id: "Ya, NDA diakui dan dapat ditegakkan berdasarkan KUHPerdata Indonesia. Namun, untuk memastikan penegakan maksimal, NDA harus disusun dengan jelas, menyertakan klausul hukuman tertentu, dan disertai dengan terjemahan Bahasa Indonesia.",
        cn: "是的，NDA在《印度尼西亚民法典》下是被承认并可执行的。但是，为了确保最大的可执行性，它们必须起草清晰，包括特定的违约金条款，并附有印尼语翻译。",
      },
    },
  ];

  const ctaText = {
    en: "Professional Legal Documentation",
    id: "Dokumentasi Hukum Profesional",
    cn: "专业的法律文件服务",
  };

  const ctaDescription = {
    en: "Ensure your business agreements are legally sound and professionally drafted",
    id: "Pastikan perjanjian bisnis Anda sah secara hukum dan disusun secara profesional",
    cn: "确保您的商业协议在法律上健全且起草专业",
  };

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <BaseServicePage
      icon={FileSignature}
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
            <FileSignature className="h-5 w-5 text-primary" />
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

        {/* Section 1: What type of agreement do you need? */}
        <section id="agreement-types" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.agreementTitle)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-6">
            {getTranslation(content.agreementDesc)}
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
                        className={`p-3 font-semibold text-foreground ${idx === 0 ? "w-[15%]" : "w-[17%]"}`}
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
              const IconComponent = [FileText, UserCheck, Scale, Signature, FileCheck2, CheckCircle, Clock, Calendar][serviceIdx] || FileText;
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
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {getTranslation(service.desc)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Requirements for drafting */}
        <section id="requirements-details" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.requirementsTitle)}
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Cooperation, Sales, License, Lease, Separation of Assets */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqNewTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqNewDesc)}
              </p>
            </div>

            {/* Addendum to Agreement */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqAddendumTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqAddendumDesc)}
              </p>
            </div>

            {/* Document Verification */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqVerifyTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqVerifyDesc)}
              </p>
            </div>

            {/* Document Legalization */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm">
              <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                {getTranslation(content.reqLegalTitle)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getTranslation(content.reqLegalDesc)}
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
