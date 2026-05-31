"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Info,
  Briefcase,
  ChevronRight,
  Activity,
  Tag,
  Server,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import BorderGlow from "@/components/ui/BorderGlow";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { kbliData, KBLI } from "@/data/kbli";
import Link from "next/link";

const categories = [
  "All",
  "Consulting",
  "Technology",
  "Trading",
  "F&B",
  "Real Estate",
  "Marketing",
  "Retail",
  "Hospitality",
  "Other",
];

const kbliFaqs = [
  {
    question: {
      en: "What is a KBLI code?",
      id: "Apa itu kode KBLI?",
      cn: "什么是 KBLI 代码？",
    },
    answer: {
      en: "KBLI (Klasifikasi Baku Lapangan Usaha Indonesia) is the standard industrial classification of business activities in Indonesia. It is a 5-digit classification code used by the government to classify business activities for licensing and taxation.",
      id: "KBLI (Klasifikasi Baku Lapangan Usaha Indonesia) adalah klasifikasi industri standar untuk kegiatan bisnis di Indonesia. Ini adalah kode klasifikasi 5 digit yang digunakan pemerintah untuk mengklasifikasikan kegiatan bisnis untuk perizinan dan perpajakan.",
      cn: "KBLI（印度尼西亚标准业务领域分类）是印尼业务活动的标准行业分类。它是政府用于分类业务活动以进行许可和征税的 5 位数分类代码。",
    },
  },
  {
    question: {
      en: "Why is choosing the correct KBLI code crucial for company setup?",
      id: "Mengapa memilih kode KBLI yang benar sangat krusial untuk pendirian perusahaan?",
      cn: "为什么选择正确的 KBLI 代码对公司设立至关重要？",
    },
    answer: {
      en: "Your chosen KBLI code determines your company's business activities, its foreign ownership limits (under the Positive Investment List), the required risk level, minimum capital requirements, and specific operational licenses needed to run legally.",
      id: "Kode KBLI yang Anda pilih menentukan aktivitas bisnis perusahaan Anda, batas kepemilikan asing (di bawah Daftar Positif Investasi), tingkat risiko, persyaratan modal minimum, dan izin operasional spesifik yang diperlukan untuk berjalan secara legal.",
      cn: "您选择的 KBLI 代码决定了您公司的业务活动、外资所有权限制（根据积极投资清单）、所需的风险级别、最低资本要求以及合法运营所需的特定运营许可。",
    },
  },
  {
    question: {
      en: "Can a single company register multiple KBLI codes?",
      id: "Apakah satu perusahaan dapat mendaftarkan beberapa kode KBLI?",
      cn: "一家公司可以注册多个 KBLI 代码吗？",
    },
    answer: {
      en: "Yes, a company in Indonesia can register multiple KBLI codes in its Articles of Association and OSS profile, as long as they are compatible with the company's capital type (PT PMA vs. local PT) and operational locations.",
      id: "Ya, perusahaan di Indonesia dapat mendaftarkan beberapa kode KBLI dalam Anggaran Dasar dan profil OSS-nya, selama kode tersebut kompatibel dengan jenis modal perusahaan (PT PMA vs. PT lokal) dan lokasi operasional.",
      cn: "是的，印尼公司可以在其公司章程和 OSS 配置文件中注册多个 KBLI 代码，只要它们与公司的资本类型（PT PMA 与本地 PT）和运营地点兼容即可。",
    },
  },
  {
    question: {
      en: "What is Risk-Based Licensing (OSS-RBA)?",
      id: "Apa itu Perizinan Berbasis Risiko (OSS-RBA)?",
      cn: "什么是基于风险的许可系统 (OSS-RBA)？",
    },
    answer: {
      en: "OSS-RBA (Online Single Submission Risk-Based Approach) is the system used in Indonesia where business licensing requirements are directly linked to the risk level of your KBLI codes. Lower-risk businesses need fewer permits than high-risk ones.",
      id: "OSS-RBA (Online Single Submission Risk-Based Approach) adalah sistem yang digunakan di Indonesia di mana persyaratan perizinan usaha dikaitkan langsung dengan tingkat risiko dari kode KBLI Anda. Bisnis berisiko rendah membutuhkan lebih sedikit izin daripada yang berisiko tinggi.",
      cn: "OSS-RBA（基于风险的在线单一提交系统）是印尼使用的一项系统，其业务许可要求与您的 KBLI 代码的风险级别直接挂钩。低风险业务比高风险业务需要更少的许可件。",
    },
  },
  {
    question: {
      en: "What are the different risk levels under OSS-RBA?",
      id: "Apa saja tingkat risiko yang berbeda di bawah OSS-RBA?",
      cn: "OSS-RBA 系统下的不同风险级别有哪些？",
    },
    answer: {
      en: "There are four risk levels: Low Risk (only requires an NIB), Medium-Low Risk (NIB + Standard Certificate), Medium-High Risk (NIB + verified Standard Certificate), and High Risk (NIB + verified License and site audits).",
      id: "Ada empat tingkat risiko: Risiko Rendah (hanya butuh NIB), Risiko Menengah-Rendah (NIB + Sertifikat Standar), Risiko Menengah-Tinggi (NIB + Sertifikat Standar terverifikasi), dan Risiko Tinggi (NIB + Izin terverifikasi dan audit lokasi).",
      cn: "共有四个风险级别：低风险（仅需 NIB）、中低风险（NIB + 标准证书）、中高风险（NIB + 经验证的标准证书）和高风险（NIB + 经验证的许可和现场审计）。",
    },
  },
  {
    question: {
      en: "Can foreign investors (PT PMA) select any KBLI code?",
      id: "Apakah investor asing (PT PMA) bisa memilih kode KBLI apa saja?",
      cn: "外国投资者 (PT PMA) 可以选择任何 KBLI 代码吗？",
    },
    answer: {
      en: "No. Under Presidential Regulation No. 10 of 2021 (The Positive Investment List), some business sectors are closed to foreign investment, some require local partnerships, and some are reserved strictly for micro, small, and medium local businesses (UMKM).",
      id: "Tidak. Berdasarkan Peraturan Presiden No. 10 Tahun 2021 (Daftar Positif Investasi), beberapa sektor bisnis tertutup untuk investasi asing, beberapa memerlukan kemitraan lokal, dan beberapa dicadangkan secara eksklusif untuk usaha mikro, kecil, dan menengah lokal (UMKM).",
      cn: "不可以。根据 2021 年第 10 号总统令（积极投资清单），某些业务领域对外国投资关闭，某些领域需要与本地合伙，某些领域则专为本地微型、小型和中型企业 (UMKM) 保留。",
    },
  },
  {
    question: {
      en: "How does my KBLI code affect my foreign ownership limits?",
      id: "Bagaimana kode KBLI mempengaruhi batas kepemilikan asing saya?",
      cn: "KBLI 代码如何影响我的外资所有权比例上限？",
    },
    answer: {
      en: "Each KBLI code maps to a specific category in the Positive Investment List. While most sectors allow 100% foreign ownership, some KBLIs restrict foreign equity to 49%, 67%, or require specific joint ventures with Indonesian nationals.",
      id: "Setiap kode KBLI memetakan ke kategori tertentu dalam Daftar Positif Investasi. Meskipun sebagian besar sektor mengizinkan 100% kepemilikan asing, beberapa KBLI membatasi ekuitas asing hingga 49%, 67%, atau memerlukan usaha patungan khusus dengan warga negara Indonesia.",
      cn: "每个 KBLI 代码都对应积极投资清单中的特定类别。虽然大多数行业允许 100% 的外资所有权，但某些 KBLI 将外资股权限制在 49%、67%，或者要求与印尼国民进行特定的合资。",
    },
  },
  {
    question: {
      en: "What is the minimum capital requirement for a PT PMA in Indonesia?",
      id: "Berapa modal minimum yang disyaratkan untuk PT PMA di Indonesia?",
      cn: "在印尼设立 PT PMA 的最低资本要求是多少？",
    },
    answer: {
      en: "The minimum authorized and paid-up capital for a PT PMA is IDR 10 billion (approx. USD 650,000) per company setup, which must be fully declared. The minimum investment value (excluding land and buildings) is also IDR 10 billion per KBLI code, though regulations allow combining similar KBLIs.",
      id: "Modal dasar dan disetor minimum untuk PT PMA adalah Rp 10 miliar per pendirian perusahaan, yang harus dideklarasikan sepenuhnya. Nilai investasi minimum (tidak termasuk tanah dan bangunan) juga Rp 10 miliar per kode KBLI, meskipun peraturan mengizinkan penggabungan KBLI yang sejenis.",
      cn: "每个 PT PMA 设立的最低注册和实缴资本为 100 亿印尼盾（约合 65 万美元），且必须完全申报。每个 KBLI 代码的最低投资额（不包括土地和建筑物）也是 100 亿印尼盾，不过法规允许合并制造与服务等不同大类的 KBLI。",
    },
  },
  {
    question: {
      en: "Can a Virtual Office be used for all KBLI codes?",
      id: "Apakah Virtual Office dapat digunakan untuk semua kode KBLI?",
      cn: "虚拟办公室可以用于所有的 KBLI 代码吗？",
    },
    answer: {
      en: "No. A Virtual Office is perfect for consulting, technology, marketing, and services. However, trading, retail, manufacturing, logistics, and hospitality KBLI codes generally require a physical office, shopfront, or warehouse for operational licenses and tax registration (PKP).",
      id: "Tidak. Virtual Office sangat cocok untuk konsultasi, teknologi, pemasaran, dan jasa. Namun, kode KBLI perdagangan, ritel, manufaktur, logistik, dan akomodasi umumnya memerlukan kantor fisik, ruko, atau gudang untuk izin operasional dan pengukuhan PKP.",
      cn: "不可以。虚拟办公室非常适合咨询、技术、营销和服务行业。然而，贸易、零售、制造、物流和酒店等 KBLI 代码通常需要实体办公室、店面或仓库，以获取运营许可和税务登记 (PKP)。",
    },
  },
  {
    question: {
      en: "What is a Nomor Induk Berusaha (NIB)?",
      id: "Apa itu Nomor Induk Berusaha (NIB)?",
      cn: "什么是商业登记号 (NIB)？",
    },
    answer: {
      en: "The NIB is a unique business identity number that acts as your company's basic business license, company registration certificate (TDP), import identifier (API), and customs access in Indonesia.",
      id: "NIB adalah nomor identitas bisnis unik yang bertindak sebagai izin usaha dasar perusahaan Anda, tanda daftar perusahaan (TDP), angka pengenal importir (API), dan akses kepabeanan di Indonesia.",
      cn: "NIB 是一个独特的商业身份代码，在印尼作为您公司的基本营业执照、公司注册证书 (TDP)、进口商识别号 (API) 和海关准入证明。",
    },
  },
  {
    question: {
      en: "Can I add or change KBLI codes after incorporating?",
      id: "Apakah saya bisa menambah atau mengubah kode KBLI setelah pendirian perusahaan?",
      cn: "公司成立后可以添加或更改 KBLI 代码吗？",
    },
    answer: {
      en: "Yes. Changing or adding KBLI codes requires holding a shareholder meeting (RUPS), amending your company's Articles of Association through a Notary, obtaining approval from the Ministry of Law and Human Rights, and updating your profile in the OSS system.",
      id: "Ya. Mengubah atau menambah kode KBLI memerlukan Rapat Umum Pemegang Saham (RUPS), mengamandemen Anggaran Dasar perusahaan Anda melalui Notaris, mendapatkan persetujuan Kemenkumham, dan memperbarui profil Anda di sistem OSS.",
      cn: "可以。更改或添加 KBLI 代码需要召开股东大会 (RUPS)、通过公证人修改您的公司章程、获得法律与人权部的批准，并在 OSS 系统中更新您的配置文件。",
    },
  },
  {
    question: {
      en: "What is the difference between KBLI 2017 and KBLI 2020?",
      id: "Apa perbedaan antara KBLI 2017 dan KBLI 2020?",
      cn: "KBLI 2017 和 KBLI 2020 有什么区别？",
    },
    answer: {
      en: "KBLI 2020 is the latest revision, introducing new digital classifications, updated industry codes (such as e-commerce, cloud computing, and digital platforms), and aligned with the Risk-Based Licensing system (OSS-RBA).",
      id: "KBLI 2020 adalah revisi terbaru, memperkenalkan klasifikasi digital baru, memperbarui kode industri (seperti e-commerce, cloud computing, dan platform digital), dan diselaraskan dengan sistem Perizinan Berbasis Risiko (OSS-RBA).",
      cn: "KBLI 2020 是最新修订版，引入了新的数字化分类，更新了行业代码（例如电子商务、云计算和数字平台），并与基于风险的许可系统 (OSS-RBA) 保持一致。",
    },
  },
  {
    question: {
      en: "What is PKKPR and why is it needed for my KBLI?",
      id: "Apa itu PKKPR dan mengapa diperlukan untuk KBLI saya?",
      cn: "什么是 PKKPR，为什么我的 KBLI 需要它？",
    },
    answer: {
      en: "PKKPR (Confirmation of Suitability of Space Utilization Activities) is a spatial planning permit. It verifies that your chosen KBLI business activities are legally permitted in your office's physical zoning location before standard certificates can be verified.",
      id: "PKKPR (Kesesuaian Kegiatan Pemanfaatan Ruang) adalah izin perencanaan tata ruang. Ini memverifikasi bahwa aktivitas bisnis KBLI pilihan Anda diizinkan secara hukum di lokasi zonasi fisik kantor Anda sebelum sertifikat standar dapat diverifikasi.",
      cn: "PKKPR（空间利用活动适宜性确认）是一项空间规划许可。它可在标准证书验证前，验证您选择的 KBLI 业务活动在您办公室的物理规划区域内是否合法允许。",
    },
  },
  {
    question: {
      en: "How can I check the official risk level of a specific KBLI code?",
      id: "Bagaimana cara memeriksa tingkat risiko resmi dari kode KBLI tertentu?",
      cn: "如何检查特定 KBLI 代码的官方风险级别？",
    },
    answer: {
      en: "You can search for your 5-digit code in this KBLI Directory. The directory pulls the classification and defaults the risk level. For complex operations, the official OSS system determines risk based on scale (number of employees, capital, land usage).",
      id: "Anda dapat mencari kode 5 digit Anda di Direktori KBLI ini. Direktori ini mengambil klasifikasi dan menentukan tingkat risiko secara otomatis. Untuk operasi yang kompleks, sistem resmi OSS menentukan risiko berdasarkan skala (jumlah karyawan, modal, penggunaan lahan).",
      cn: "您可以在此 KBLI 目录中搜索您的 5 位数代码。该目录会提取分类并默认风险级别。对于复杂的业务运营，OSS 官方系统根据规模（员工人数、资本、土地使用情况）来确定风险。",
    },
  },
  {
    question: {
      en: "What happens if I operate my business under an incorrect KBLI code?",
      id: "Apa yang terjadi jika saya menjalankan bisnis dengan kode KBLI yang salah?",
      cn: "如果我用错误的 KBLI 代码经营业务会怎样？",
    },
    answer: {
      en: "Operating under a KBLI code that does not match your real business activities is a compliance violation. It can lead to the cancellation of your licenses, tax audits (due to incorrect sector filing), difficulties opening corporate bank accounts, or administrative sanctions.",
      id: "Beroperasi di bawah kode KBLI yang tidak sesuai dengan aktivitas bisnis nyata Anda adalah pelanggaran kepatuhan. Ini dapat menyebabkan pencabutan izin Anda, audit pajak (karena pelaporan sektor yang salah), kesulitan membuka rekening bank perusahaan, atau sanksi administratif.",
      cn: "在与您实际业务活动不符的 KBLI 代码下进行运营属于合规违规行为。这可能会导致您的执照被吊销、税务审计（由于申报行业错误）、难以开设公司银行账户或面临行政处罚。",
    },
  },
  {
    question: {
      en: "Does my KBLI code affect my corporate tax rate?",
      id: "Apakah kode KBLI mempengaruhi tarif pajak perusahaan saya?",
      cn: "KBLI 代码会影响我的企业税率吗？",
    },
    answer: {
      en: "While the standard corporate income tax is generally 22% in Indonesia, some KBLIs are eligible for special tax incentives (like tax holidays or tax allowances). Additionally, specific sectors may have special tax treatments or specific VAT rates.",
      id: "Meskipun pajak penghasilan badan standar umumnya 22% di Indonesia, beberapa KBLI berhak atas insentif pajak khusus (seperti tax holiday atau tax allowance). Selain itu, sektor tertentu mungkin memiliki perlakuan pajak khusus atau tarif PPN tertentu.",
      cn: "虽然印尼的标准企业所得税率通常为 22%，但某些 KBLI 有资格获得特殊的税收优惠（如免税期或税收折让）。此外，特定行业可能享有特殊的税收待遇或特定的增值税率。",
    },
  },
  {
    question: {
      en: "Do PT PMDNs and PT PMAs have access to different KBLI codes?",
      id: "Apakah PT PMDN dan PT PMA memiliki akses ke kode KBLI yang berbeda?",
      cn: "PT PMDN 和 PT PMA 是否可以使用不同的 KBLI 代码？",
    },
    answer: {
      en: "Yes. PT PMDN (100% domestic capital) has access to all KBLI codes without capital structure restrictions. PT PMAs have restrictions on closed or semi-closed sectors and must comply with the IDR 10 billion minimum investment requirements.",
      id: "Ya. PT PMDN (100% modal domestik) memiliki akses ke semua kode KBLI tanpa batasan struktur modal. PT PMA memiliki batasan pada sektor tertutup atau semi-tertutup dan harus mematuhi persyaratan investasi minimum Rp 10 miliar.",
      cn: "是的。PT PMDN（100% 本地资本）可以使用所有 KBLI 代码，不受资本结构限制。PT PMA 在封闭或半封闭行业受限，且必须符合最低 100 亿印尼盾的投资要求。",
    },
  },
  {
    question: {
      en: "Which KBLI codes are completely closed to foreign ownership?",
      id: "Kode KBLI mana yang sepenuhnya tertutup untuk kepemilikan asing?",
      cn: "哪些 KBLI 代码完全对外国所有权关闭？",
    },
    answer: {
      en: "Sectors closed completely to all private and foreign investment include weapons manufacturing, cultivation of narcotics, chemical weapons, gambling, salvage of historic artifacts, and traditional crafts reserved exclusively for local cooperatives.",
      id: "Sektor yang tertutup sepenuhnya untuk semua investasi swasta dan asing termasuk pembuatan senjata, penanaman narkotika, senjata kimia, perjudian, penyelamatan artefak bersejarah, dan kerajinan tradisional yang dicadangkan secara eksklusif untuk koperasi lokal.",
      cn: "完全禁止所有私有和外资投资的行业包括武器制造、麻醉品种植、化学武器、赌博、历史文物打捞，以及专为本地合作社保留的传统工艺。",
    },
  },
  {
    question: {
      en: "Does my KBLI code affect hiring foreign workers (KITAS)?",
      id: "Apakah kode KBLI mempengaruhi perekrutan tenaga kerja asing (KITAS)?",
      cn: "我的 KBLI 代码会影响聘用外籍员工 (KITAS) 吗？",
    },
    answer: {
      en: "Yes. The Ministry of Manpower specifies which foreign positions can be hired based on KBLI codes. Some KBLIs (such as retail sales personnel or HR managers) are legally restricted from hiring foreign nationals.",
      id: "Ya. Kementerian Ketenagakerjaan menetapkan posisi asing apa saja yang dapat dipekerjakan berdasarkan kode KBLI. Beberapa KBLI (seperti staf penjualan ritel atau manajer HRD) secara hukum dilarang mempekerjakan warga negara asing.",
      cn: "是的。人力部根据 KBLI 代码规定了可以聘用外籍人员的岗位。某些 KBLI（如零售销售人员或人力资源经理）在法律上禁止聘用外籍公民。",
    },
  },
  {
    question: {
      en: "Can a company combine manufacturing and trading KBLI codes?",
      id: "Apakah sebuah perusahaan dapat menggabungkan kode KBLI manufaktur dan perdagangan?",
      cn: "一家公司可以合并制造和贸易的 KBLI 代码吗？",
    },
    answer: {
      en: "Yes, you can register both. However, note that a manufacturer is generally restricted from directly retailing their own imported goods. If you manufacture locally, you can distribute your own products, but for wholesale trading of third-party goods, separate rules and capitalizations apply.",
      id: "Ya, Anda dapat mendaftarkan keduanya. Namun, perlu dicatat bahwa produsen umumnya dilarang menjual secara eceran barang impor mereka sendiri secara langsung. Jika memproduksi secara lokal, Anda dapat mendistribusikan produk sendiri, tetapi untuk perdagangan grosir barang pihak ketiga, aturan dan permodalan terpisah berlaku.",
      cn: "可以，您可以同时注册两者。但请注意，制造商通常被限制直接零售其自主进口的商品。如果您在本地制造，您可以分销自己的产品；但对于第三方商品的批发贸易，适用独立的规则和资本额规定。",
    },
  },
];

export default function KBLIPage() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(20);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const translations = {
    title: {
      en: "KBLI Directory",
      id: "Direktori KBLI",
      cn: "KBLI 目录",
    },
    subtitle: {
      en: "Indonesia Standard Classification of Business Fields",
      id: "Klasifikasi Baku Lapangan Usaha Indonesia",
      cn: "印度尼西亚标准业务领域分类",
    },
    description: {
      en: "Search the top curated KBLI codes for foreign investors to determine the correct business classification and risk level for your company setup.",
      id: "Cari kode KBLI teratas yang dikurasi untuk investor asing untuk menentukan klasifikasi bisnis dan tingkat risiko yang tepat untuk pendirian perusahaan Anda.",
      cn: "搜索为外国投资者精心挑选的顶级KBLI代码，以确定您公司设置的正确业务分类和风险级别。",
    },
    searchPlaceholder: {
      en: "Search by code (e.g., 70209) or keyword...",
      id: "Cari berdasarkan kode (mis., 70209) atau kata kunci...",
      cn: "按代码（例如：70209）或关键字搜索...",
    },
    noResults: {
      en: "No KBLI codes found matching your search.",
      id: "Tidak ada kode KBLI yang cocok dengan pencarian Anda.",
      cn: "找不到符合您搜索的KBLI代码。",
    },
    riskLabel: {
      en: "Risk Level:",
      id: "Tingkat Risiko:",
      cn: "风险级别：",
    },
    categoryLabel: {
      en: "Category:",
      id: "Kategori:",
      cn: "类别：",
    },
  };

  const getTranslation = (obj: any, lang: string) => {
    if (!obj) return "";
    return obj[lang] || obj["en"] || obj["id"] || "";
  };

  const filteredData = kbliData.filter((item) => {
    const matchesSearch =
      item.code.includes(searchQuery) ||
      item.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.cn.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-12 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
              <Server className="mr-2 h-4 w-4" />
              {getTranslation(translations.subtitle, language)}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              {getTranslation(translations.title, language)}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              {getTranslation(translations.description, language)}
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-10">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder={getTranslation(
                  translations.searchPlaceholder,
                  language,
                )}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(20);
                }}
                className="pl-12 py-6 text-lg rounded-2xl bg-background/50 backdrop-blur-md border border-border/50 dark:border-white/20 focus-visible:ring-primary shadow-sm"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setVisibleCount(20);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-background/40 border border-border/50 dark:border-white/20 text-muted-foreground hover:bg-background/80 hover:text-foreground backdrop-blur-sm"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="pt-4 pb-16 bg-background/20 backdrop-blur-[2px] flex-grow">
        <div className="container mx-auto px-4 max-w-5xl">
          <AnimatePresence mode="popLayout">
            {filteredData.length > 0 ? (
              <div className="flex flex-col gap-8">
                <motion.div className="grid gap-4 max-w-5xl mx-auto" layout>
                  {filteredData.slice(0, visibleCount).map((item, index) => (
                    <motion.div
                      key={item.code}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      layout
                    >
                    <BorderGlow className="h-full">
                      <Card className="h-full border border-border/50 dark:border-white/20 bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col md:flex-row animate-in fade-in duration-300">
                        {/* Left block: Code & Category */}
                        <div className="py-4 px-5 md:w-[24%] bg-primary/5 flex flex-col items-start justify-center border-b md:border-b-0 md:border-r border-border/50 shrink-0">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 leading-none">
                            KBLI Code
                          </span>
                          <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-none">
                            {item.code}
                          </span>
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-bold leading-none">
                            <Tag className="w-3.5 h-3.5" />
                            {item.category}
                          </div>
                        </div>

                        {/* Right block: Title, Description, Risk */}
                        <CardContent className="py-4 px-5 md:w-[76%] flex flex-col justify-center">
                          <h3 className="text-lg md:text-xl font-bold mb-1.5 text-foreground leading-snug line-clamp-1">
                            {getTranslation(item.title, language)}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                            {getTranslation(item.description, language)}
                          </p>
                          <div className="flex items-center gap-2 mt-auto leading-none">
                            <span className="text-xs text-muted-foreground font-medium">
                              {getTranslation(translations.riskLabel, language)}
                            </span>
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold py-1 px-2.5 rounded flex items-center gap-1"
                            >
                              <Activity className="w-3.5 h-3.5 mr-0.5 animate-pulse" />
                              {getTranslation(item.riskLevel, language)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </BorderGlow>
                  </motion.div>
                ))}
                </motion.div>
                {filteredData.length > visibleCount && (
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={() => setVisibleCount((prev) => prev + 30)}
                      variant="outline"
                      className="rounded-full px-8 py-6 text-base border-primary/20 hover:bg-primary/5 hover:text-primary transition-all bg-background/50 backdrop-blur-md shadow-sm"
                    >
                      {language === "en"
                        ? `Load More Business Codes (${filteredData.length - visibleCount} remaining)`
                        : language === "cn"
                          ? `加载更多行业代码 (剩余 ${filteredData.length - visibleCount} 个)`
                          : `Muat Lebih Banyak Kode Bisnis (tersisa ${filteredData.length - visibleCount})`}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                  {getTranslation(translations.noResults, language)}
                </h3>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setVisibleCount(20);
                  }}
                  className="text-primary"
                >
                  Clear filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background/25 border-t border-border/50 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6 backdrop-blur-sm border border-primary/20">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              {language === "en"
                ? "KBLI & Business Classification FAQ"
                : language === "cn"
                  ? "KBLI 与业务分类常见问题"
                  : "FAQ KBLI & Klasifikasi Bisnis"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === "en"
                ? "Get expert answers to the most common questions regarding business classifications and company setup requirements in Indonesia."
                : language === "cn"
                  ? "获取有关印度尼西亚业务分类和公司设立要求的常见问题的专家解答。"
                  : "Dapatkan jawaban ahli untuk pertanyaan paling umum mengenai klasifikasi bisnis dan persyaratan pendirian perusahaan di Indonesia."}
            </p>
          </div>

          <div className="divide-y divide-border/50 dark:divide-white/40 max-w-3xl mx-auto border-t border-b border-border/50">
            {kbliFaqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;

              return (
                <div key={index} className="group">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left py-4 flex items-start justify-between gap-4 focus:outline-none transition-colors"
                  >
                    <h3
                      className={`font-medium text-base transition-colors ${
                        isOpen
                          ? "text-primary"
                          : "text-foreground group-hover:text-primary/80"
                      }`}
                    >
                      {getTranslation(faq.question, language)}
                    </h3>
                    <ChevronDown
                      className={`h-5 w-5 mt-0.5 shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? "rotate-180 text-primary"
                          : "text-muted-foreground group-hover:text-primary/80"
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-4 pt-1 pr-8 text-sm text-muted-foreground leading-relaxed">
                          {getTranslation(faq.answer, language)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-20 bg-background border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {language === "en"
              ? "Need help finding the right KBLI?"
              : language === "cn"
                ? "需要帮助寻找合适的 KBLI 吗？"
                : "Butuh bantuan menemukan KBLI yang tepat?"}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {language === "en"
              ? "Our legal consultants can help you determine the exact business classifications required for your specific operational goals."
              : language === "cn"
                ? "我们的法律顾问可以帮助您确定特定运营目标所需的准确业务分类。"
                : "Konsultan hukum kami dapat membantu Anda menentukan klasifikasi bisnis yang tepat yang diperlukan untuk tujuan operasional spesifik Anda."}
          </p>
          <Link href="/contact">
            <Button size="lg" className="rounded-full px-8">
              {language === "en"
                ? "Consult with an Expert"
                : language === "cn"
                  ? "咨询专家"
                  : "Konsultasi dengan Ahli"}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
