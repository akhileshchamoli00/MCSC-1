"use client";

import {
  MapPin,
  ShieldCheck,
  Clock,
  Calendar,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Building2,
  Building,
  FileCheck2,
  HelpCircle,
} from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VirtualOfficePage() {
  const { language } = useLanguage();

  const getTranslation = (obj: any) => {
    if (!obj) return "";
    if (language === "id" && obj.idText) return obj.idText;
    return obj[language] || obj["en"] || "";
  };

  const title = {
    en: "Virtual Office",
    id: "Virtual Office",
    cn: "虚拟办公室",
  };

  const description = {
    en: "A service that allows individuals or companies to have a professional business address and office facilities without renting a physical space permanently. Includes mail handling and company registration use.",
    id: "Layanan yang memungkinkan individu atau perusahaan memiliki alamat bisnis profesional dan fasilitas kantor tanpa menyewa ruang fisik secara permanen. Termasuk pengelolaan surat dan penggunaan untuk pendaftaran perusahaan.",
    cn: "允许个人或公司在不长期租用实体空间的情况下拥有专业的商业地址和办公设施的服务。包括信件和包裹收发以及用于公司注册登记。",
  };

  const content = {
    legalBadge: {
      en: "Reviewed by the MCS Consulting Legal Team · Last updated July 2026 · 5 min read",
      id: "Ditinjau oleh Tim Hukum MCS Consulting · Terakhir diperbarui Juli 2026 · 5 menit baca",
      cn: "由 MCS Consulting 法律团队审核 · 上次更新于 2026 年 7 月 · 5 分钟阅读",
    },
    introText: {
      en: "A virtual office gives your business a professional registered address in Indonesia without the cost of a physical lease — ideal for company registration, licensing, and day-to-day correspondence. MCS Consulting offers virtual office locations in North Jakarta and Tangerang Regency, both suitable for business registration and ongoing compliance.",
      id: "Kantor virtual (Virtual Office) memberikan alamat terdaftar profesional untuk bisnis Anda di Indonesia tanpa biaya sewa fisik — ideal untuk pendaftaran perusahaan, perizinan, dan korespondensi sehari-hari. MCS Consulting menawarkan lokasi kantor virtual di Jakarta Utara dan Kabupaten Tangerang, keduanya cocok untuk pendaftaran bisnis dan kepatuhan hukum berkelanjutan.",
      cn: "虚拟办公室为您在印尼的企业提供专业的注册地址，而无需承担实体租赁的成本——是公司注册、许可申请和日常信函往来的理想选择。MCS Consulting 在北雅加达和唐格朗县提供虚拟办公室地址，均适用于商业登记和后续的合规手续办理。",
    },
    onThisPage: {
      en: "On this page",
      id: "Di halaman ini",
      cn: "在本页",
    },
    tocItems: [
      {
        id: "what-is-vo",
        en: "What is a virtual office, and who is it for?",
        idText: "Apa itu kantor virtual, dan untuk siapa ini ditujukan?",
        cn: "什么是虚拟办公室，它适合谁？",
      },
      {
        id: "comparing-vo",
        en: "Comparing our virtual office locations",
        idText: "Perbandingan lokasi kantor virtual kami",
        cn: "我们的虚拟办公室选址比较",
      },
      {
        id: "whats-included",
        en: "What's included with each location",
        idText: "Apa saja yang termasuk dalam setiap lokasi",
        cn: "每个选址包含哪些内容",
      },
      {
        id: "requirements-details",
        en: "Requirements and restrictions",
        idText: "Persyaratan dan batasan",
        cn: "要求与限制",
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
    whatIsTitle: {
      en: "What is a virtual office, and who is it for?",
      id: "Apa itu kantor virtual, dan untuk siapa ini ditujukan?",
      cn: "什么是虚拟办公室，它适合谁？",
    },
    whatIsDesc: {
      en: "A virtual office provides a legal, professional business address you can use for company registration, licensing, banking, and correspondence — without renting physical office space. It's a popular choice for startups, foreign-owned companies in their early stages, and businesses that operate remotely or don't need a physical storefront. It's important to know that not every business activity qualifies for a virtual office address — this depends on your KBLI (business classification) code, covered below.",
      id: "Kantor virtual (Virtual Office) menyediakan alamat bisnis yang sah dan profesional yang dapat Anda gunakan untuk pendaftaran perusahaan, perizinan, perbankan, dan korespondensi — tanpa menyewa ruang kantor fisik. Ini adalah pilihan populer untuk startup, perusahaan milik asing pada tahap awal, dan bisnis yang beroperasi dari jarak jauh atau tidak memerlukan toko fisik. Penting untuk diketahui bahwa tidak setiap kegiatan bisnis memenuhi syarat untuk alamat kantor virtual — ini tergantung pada kode KBLI (klasifikasi bisnis) Anda, yang dibahas di bawah.",
      cn: "虚拟办公室提供一个合法的、专业的商业注册地址，您可以将其用于公司注册、许可申请、银行开户和日常通信——而无需租用实体办公空间。它是初创公司、处于早期阶段的外资公司以及远程运营或不需要实体店面的企业的普遍选择。需要注意的是，并不是所有的业务活动都符合使用虚拟办公室地址的条件——这取决于您的 KBLI（行业分类）代码，具体说明如下。",
    },
    comparingTitle: {
      en: "Comparing our virtual office locations",
      id: "Perbandingan lokasi kantor virtual kami",
      cn: "我们的虚拟办公室选址比较",
    },
    whatsIncludedTitle: {
      en: "What's included with each location",
      id: "Apa saja yang termasuk dalam setiap lokasi",
      cn: "每个选址包含哪些内容",
    },
    whatsIncludedNorthBullets: [
      { en: "Professional Business Address", id: "Alamat Bisnis Profesional", cn: "专业的商业注册地址" },
      { en: "Mail & Parcel Handling", id: "Pengelolaan Surat & Paket", cn: "信件与包裹收发管理" },
      { en: "Company Registration Support", id: "Dukungan Pendaftaran Perusahaan", cn: "公司注册登记支持服务" },
      { en: "Prime Location", id: "Lokasi Utama", cn: "黄金地理位置" },
    ],
    whatsIncludedTangerangBullets: [
      { en: "Professional Business Address", id: "Alamat Bisnis Profesional", cn: "专业的商业注册地址" },
      { en: "Mail & Parcel Handling", id: "Pengelolaan Surat & Paket", cn: "信件与包裹收发管理" },
      { en: "Company Registration Support", id: "Dukungan Pendaftaran Perusahaan", cn: "公司注册登记支持服务" },
      { en: "Prime Strategic Location", id: "Lokasi Strategis Utama", cn: "黄金战略位置" },
    ],
    requirementsTitle: {
      en: "Requirements and restrictions",
      id: "Persyaratan dan batasan",
      cn: "要求与限制",
    },
    reqEligibleTitle: {
      en: "Who can use a virtual office",
      id: "Siapa yang dapat menggunakan kantor virtual",
      cn: "谁可以使用虚拟办公室",
    },
    reqEligibleDesc: {
      en: "Most low-risk business activities under Indonesia's KBLI classification system can register using a virtual office address — this covers many service-based, consulting, trading, and digital businesses.",
      id: "Sebagian besar kegiatan bisnis berisiko rendah di bawah sistem klasifikasi KBLI Indonesia dapat mendaftar menggunakan alamat kantor virtual — ini mencakup banyak bisnis berbasis layanan, konsultasi, perdagangan, dan digital.",
      cn: "根据印尼 KBLI 分类系统，大多数低风险业务活动都可以使用虚拟办公室地址进行注册——这包括许多服务型、咨询型、贸易型和数字化业务。",
    },
    reqNotEligibleTitle: {
      en: "Who can't",
      id: "Siapa yang tidak dapat",
      cn: "谁不符合使用条件",
    },
    reqNotEligibleDesc: {
      en: "Business activities that legally require a physical, dedicated location — such as manufacturing, restaurants, clinics, and certain retail operations — are not eligible for a virtual office address under OSS regulations. MCS Consulting checks your specific KBLI code against current requirements before you commit, so you're not registered with an address that gets rejected or flagged later.",
      id: "Kegiatan bisnis yang secara hukum memerlukan lokasi fisik khusus — seperti manufaktur, restoran, klinik, dan operasi ritel tertentu — tidak memenuhi syarat untuk alamat kantor virtual berdasarkan peraturan OSS. MCS Consulting memeriksa kode KBLI spesifik Anda terhadap persyaratan saat ini sebelum Anda membuat komitmen, sehingga Anda tidak mendaftar dengan alamat yang ditolak atau ditandai di kemudian hari.",
      cn: "法律上强制要求具备实体、专属场所的业务活动——例如制造业、餐饮业、诊所和某些零售运营——根据 OSS 规定，均不符合使用虚拟办公室地址的条件。MCS Consulting 会在您最终决定之前针对当前的要求核查您具体的 KBLI 代码，避免您使用后续会被拒或被标记的地址进行注册。",
    },
    reqNeedTitle: {
      en: "What you'll need to register",
      id: "Apa yang Anda butuhkan untuk mendaftar",
      cn: "注册需要提供什么",
    },
    reqNeedDesc: {
      en: "A completed KBLI classification for your business activity, your company's basic details (name, structure, shareholders), and — for company registration purposes — the virtual office documentation, which we provide as part of the service.",
      id: "Klasifikasi KBLI yang lengkap untuk kegiatan bisnis Anda, detail dasar perusahaan Anda (nama, struktur, pemegang saham), dan — untuk tujuan pendaftaran perusahaan — dokumentasi kantor virtual, yang kami sediakan sebagai bagian dari layanan.",
      cn: "确定的业务活动 KBLI 分类、您公司的基本信息（名称、组织结构、股东），以及（针对公司注册目的）虚拟办公室的文件，我们将作为服务的一部分为您提供。",
    },
    regulatoryFooter: {
      en: "Virtual office eligibility is governed by OSS-RBA (Risk-Based Approach) regulations under the Ministry of Investment/BKPM, which determine which business classifications may use a non-physical registered address. MCS Consulting stays current with all regulation updates affecting virtual office eligibility.",
      id: "Kelayakan kantor virtual diatur oleh peraturan OSS-RBA (Risk-Based Approach) di bawah Kementerian Investasi/BKPM, yang menentukan klasifikasi bisnis mana yang dapat menggunakan alamat terdaftar non-fisik. MCS Consulting selalu memperbarui informasi dengan semua pembaruan peraturan yang memengaruhi kelayakan kantor virtual.",
      cn: "虚拟办公室的使用资质受印尼投资部/BKPM 下属的 OSS-RBA（基于风险的方法）法规管辖，该法规规定了哪些业务分类可以使用非实体的注册地址。MCS Consulting 代表您密切关注影响虚拟办公室使用资质的所有法规更新。",
    },
    stepsTitle: {
      en: "Step-by-step process",
      id: "Proses langkah demi langkah",
      cn: "逐步流程",
    },
    steps: [
      {
        title: {
          en: "KBLI and eligibility check",
          id: "Pemeriksaan KBLI dan kelayakan",
          cn: "KBLI 与资质核查",
        },
        duration: {
          en: "1 day",
          id: "1 hari",
          cn: "1 天",
        },
        desc: {
          en: "We confirm your business classification is eligible for a virtual office address before you commit.",
          id: "Kami memastikan klasifikasi bisnis Anda memenuhi syarat untuk alamat kantor virtual sebelum Anda berkomitmen.",
          cn: "我们在您决定之前，核实并确认您的行业分类符合使用虚拟办公室地址的条件。",
        },
      },
      {
        title: {
          en: "Location selection",
          id: "Pemilihan lokasi",
          cn: "选择注册地址",
        },
        duration: {
          en: "Same day",
          id: "Hari yang sama",
          cn: "当天",
        },
        desc: {
          en: "You choose between our North Jakarta or Tangerang Regency address based on your business needs.",
          id: "Anda memilih antara alamat Jakarta Utara atau Kabupaten Tangerang kami berdasarkan kebutuhan bisnis Anda.",
          cn: "您根据您的业务需求，在我们的北雅加达或唐格朗县注册地址之间做出选择。",
        },
      },
      {
        title: {
          en: "Documentation and agreement",
          id: "Dokumentasi dan perjanjian",
          cn: "筹备证明文件与协议",
        },
        duration: {
          en: "1–2 days",
          id: "1–2 hari",
          cn: "1-2 天",
        },
        desc: {
          en: "We provide the virtual office documentation required for your company registration or licensing application.",
          id: "Kami menyediakan dokumentasi kantor virtual yang diperlukan untuk pendaftaran perusahaan atau permohonan perizinan Anda.",
          cn: "我们提供您在申请公司注册或办理许可所需的虚拟办公室所有证明文件。",
        },
      },
      {
        title: {
          en: "Ongoing mail and parcel handling",
          id: "Pengelolaan surat & paket berkelanjutan",
          cn: "日常信函与包裹收发",
        },
        duration: {
          en: "Ongoing",
          id: "Berkelanjutan",
          cn: "长期服务",
        },
        desc: {
          en: "Once active, incoming mail and parcels at your registered address are received and handled on your behalf.",
          id: "Setelah aktif, surat dan paket yang masuk ke alamat terdaftar Anda akan diterima dan dikelola atas nama Anda.",
          cn: "一旦激活启用，寄往您注册地址的来信和包裹都将由我们代表您进行签收和处理。",
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
      en: "1–3 Days",
      id: "1–3 Hari",
      cn: "1-3 天",
    },
    totalTimelineDesc: {
      en: "To set up, ready to use immediately for company registration or licensing purposes.",
      id: "Untuk pengaturan, siap digunakan segera untuk pendaftaran perusahaan atau perizinan.",
      cn: "完成设置并立即可以开始用于公司注册或办理各项许可。",
    },
    finalCtaText: {
      en: "Not sure if a virtual office fits your business activity? Schedule a free consultation and our team will confirm your eligibility before you commit.",
      id: "Belum yakin apakah kantor virtual sesuai dengan kegiatan bisnis Anda? Jadwalkan konsultasi gratis dan tim kami akan mengonfirmasi kelayakan Anda sebelum Anda berkomitmen.",
      cn: "不确定您的业务活动是否适合使用虚拟办公室？预约免费咨询，我们的团队将在您决定之前为您核实资质。",
    },
  };

  const tableHeaders = {
    columns: [
      { en: "Feature", id: "Fitur", cn: "特征" },
      { en: "Virtual Office North Jakarta", id: "Virtual Office Jakarta Utara", cn: "虚拟办公室 - 北雅加达" },
      { en: "Virtual Office Tangerang Regency", id: "Virtual Office Kabupaten Tangerang", cn: "虚拟办公室 - 唐格朗县" },
    ],
  };

  const tableRows = [
    {
      label: { en: "Address", id: "Alamat", cn: "详细地址" },
      values: [
        {
          en: "Springhill Office Tower, Kemayoran, North Jakarta",
          id: "Springhill Office Tower, Kemayoran, Jakarta Utara",
          cn: "北雅加达 凯马约兰 Springhill Office Tower",
        },
        {
          en: "Ruko Faraday, Gading Serpong, Tangerang Regency",
          id: "Ruko Faraday, Gading Serpong, Kabupaten Tangerang",
          cn: "唐格朗县 达丁塞尔蓬 Faraday 商业区",
        },
      ],
    },
    {
      label: { en: "Best for", id: "Terbaik untuk", cn: "最适合" },
      values: [
        {
          en: "Businesses wanting a central Jakarta business address",
          id: "Bisnis yang menginginkan alamat bisnis Jakarta pusat",
          cn: "希望拥有雅加达中心商业注册地址的企业",
        },
        {
          en: "Businesses in or serving the greater Tangerang/West Jakarta area",
          id: "Bisnis di atau yang melayani area Tangerang/Jakarta Barat",
          cn: "位于或服务于大唐格朗/西雅加达地区的企业",
        },
      ],
    },
    {
      label: { en: "Building type", id: "Jenis bangunan", cn: "楼宇类型" },
      values: [
        { en: "Office tower", id: "Gedung perkantoran", cn: "甲级写字楼" },
        { en: "Commercial shophouse (ruko)", id: "Ruko komersial", cn: "商业店面/排屋" },
      ],
    },
  ];

  const faqs = [
    {
      question: {
        en: "Is a Virtual Office legal for setting up a PMA?",
        id: "Apakah Virtual Office legal untuk mendirikan PMA?",
        cn: "使用虚拟办公室设立 PMA 合法吗？",
      },
      answer: {
        en: "Yes, using a Virtual Office is completely legal for company establishment and obtaining a standard NIB in Indonesia, especially for service-based and consulting companies.",
        id: "Ya, menggunakan Virtual Office sepenuhnya legal untuk pendirian perusahaan dan mendapatkan NIB standar di Indonesia, terutama untuk perusahaan berbasis layanan dan konsultasi.",
        cn: "是的，在印度尼西亚使用虚拟办公室进行公司设立和获取标准 NIB 是完全合法的，特别是对于基于服务和咨询的公司。",
      },
    },
    {
      question: {
        en: "Can I use a Virtual Office to get a specialized operational license?",
        id: "Bisakah saya menggunakan Virtual Office untuk mendapatkan izin operasional khusus?",
        cn: "我可以使用虚拟办公室获得专业的运营许可证吗？",
      },
      answer: {
        en: "For certain high-risk sectors (like manufacturing, trading with physical goods, or warehousing), the government requires a physical site verification. A Virtual Office cannot be used for these specific operational licenses.",
        id: "Untuk sektor berisiko tinggi tertentu (seperti manufaktur, perdagangan barang fisik, atau pergudangan), pemerintah mewajibkan verifikasi lokasi fisik. Virtual Office tidak dapat digunakan untuk izin operasional khusus ini.",
        cn: "对于某些高风险行业（如制造，实物商品贸易或仓储），政府需要进行物理现场验证。虚拟办公室不能用于这些特定的运营许可证。",
      },
    },
    {
      question: {
        en: "Can a company using a Virtual Office register as a Taxable Entrepreneur (PKP)?",
        id: "Dapatkah perusahaan yang menggunakan Virtual Office mendaftar sebagai Pengusaha Kena Pajak (PKP)?",
        cn: "使用虚拟办公室的公司可以注册为一般纳税人 (PKP) 吗？",
      },
      answer: {
        en: "Yes. Our Virtual Office facilities meet the requirements set by the Indonesian Tax Authority, meaning your business can successfully apply for PKP status to issue tax invoices (faktur pajak).",
        id: "Ya. Fasilitas Virtual Office kami memenuhi persyaratan yang ditetapkan oleh Otoritas Pajak Indonesia, yang berarti bisnis Anda dapat berhasil mengajukan status PKP untuk menerbitkan faktur pajak.",
        cn: "是的。我们的虚拟办公室设施符合印度尼西亚税务局设定的要求，这意味着您的企业可以成功申请 PKP 状态以开具税务发票 (faktur pajak)。",
      },
    },
    {
      question: {
        en: "What services are included in the Virtual Office package?",
        id: "Layanan apa saja yang termasuk dalam paket Virtual Office?",
        cn: "虚拟办公室套餐包含哪些服务？",
      },
      answer: {
        en: "Our packages typically include a prestigious business address, mail handling and forwarding, dedicated phone numbers with receptionists, and complimentary access to physical meeting rooms.",
        id: "Paket kami biasanya mencakup alamat bisnis bergengsi, penanganan dan penerusan surat, nomor telepon khusus dengan resepsionis, dan akses gratis ke ruang pertemuan fisik.",
        cn: "我们的套餐通常包括著名的商业地址，邮件处理和转发，带接待员的专用电话号码，以及免费使用物理会议室。",
      },
    },
    {
      question: {
        en: "Why should I choose a Virtual Office in Tangerang vs Jakarta?",
        id: "Mengapa saya harus memilih Virtual Office di Tangerang vs Jakarta?",
        cn: "为什么我应该选择丹格朗而不是雅加达的虚拟办公室？",
      },
      answer: {
        en: "Tangerang offers proximity to major industrial zones, the international airport, and often benefits from competitive regional minimum wage (UMK) rates compared to Central Jakarta, making it ideal for operational scaling.",
        id: "Tangerang menawarkan kedekatan dengan zona industri utama, bandara internasional, dan sering mendapat manfaat dari tarif upah minimum regional (UMK) yang kompetitif dibandingkan dengan Jakarta Pusat, menjadikannya ideal untuk penskalaan operasional.",
        cn: "丹格朗靠近主要工业区，国际机场，与雅加达市中心相比，通常受益于具有竞争力的区域最低工资（UMK）费率，使其成为运营扩展的理想选择。",
      },
    },
  ];

  const ctaText = {
    en: "Establish Your Business Presence",
    id: "Wujudkan Kehadiran Bisnis Anda",
    cn: "确立您的企业商业形象",
  };

  const ctaDescription = {
    en: "Get a professional business address in prime locations without the overhead costs",
    id: "Dapatkan alamat bisnis profesional di lokasi strategis tanpa biaya overhead",
    cn: "在黄金地段获得专业的商业注册地址，无需高额的实体办公室运营成本",
  };

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <BaseServicePage
      icon={MapPin}
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
            <MapPin className="h-5 w-5 text-primary" />
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

        {/* Section 1: What is a virtual office, and who is it for? */}
        <section id="what-is-vo" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.whatIsTitle)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-6">
            {getTranslation(content.whatIsDesc)}
          </p>
        </section>

        {/* Section 2: Comparing our virtual office locations */}
        <section id="comparing-vo" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.comparingTitle)}
          </h2>

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
                        className={`p-3 font-semibold text-foreground ${idx === 0 ? "w-[16%]" : "w-[42%]"}`}
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

        {/* Section 3: What's included with each location */}
        <section id="whats-included" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.whatsIncludedTitle)}
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
            {/* North Jakarta */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/40 backdrop-blur-sm shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/20">
                <Building className="h-5 w-5 text-primary shrink-0" />
                <h3 className="font-bold text-foreground text-sm leading-tight">
                  {getTranslation(tableHeaders.columns[1])}
                </h3>
              </div>
              <ul className="space-y-3 flex-grow">
                {content.whatsIncludedNorthBullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{getTranslation(bullet)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tangerang Regency */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/40 backdrop-blur-sm shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/20">
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <h3 className="font-bold text-foreground text-sm leading-tight">
                  {getTranslation(tableHeaders.columns[2])}
                </h3>
              </div>
              <ul className="space-y-3 flex-grow">
                {content.whatsIncludedTangerangBullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{getTranslation(bullet)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Requirements and restrictions */}
        <section id="requirements-details" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.requirementsTitle)}
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* Who can use */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                  {getTranslation(content.reqEligibleTitle)}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {getTranslation(content.reqEligibleDesc)}
                </p>
              </div>
            </div>

            {/* Who can't */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10 text-destructive">
                  {getTranslation(content.reqNotEligibleTitle)}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {getTranslation(content.reqNotEligibleDesc)}
                </p>
              </div>
            </div>

            {/* What you'll need */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                  {getTranslation(content.reqNeedTitle)}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {getTranslation(content.reqNeedDesc)}
                </p>
              </div>
            </div>
          </div>

          <p className="text-base text-muted-foreground leading-relaxed border-l-2 border-primary/50 pl-4 py-1 italic bg-primary/5 rounded-r-xl">
            {getTranslation(content.regulatoryFooter)}
          </p>
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
