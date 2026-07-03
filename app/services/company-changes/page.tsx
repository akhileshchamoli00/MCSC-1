"use client";

import {
  RefreshCw,
  ShieldCheck,
  Clock,
  Calendar,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  FileEdit,
  UserCheck,
  Building,
} from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CompanyChangesPage() {
  const { language } = useLanguage();

  const getTranslation = (obj: any) => {
    if (!obj) return "";
    if (language === "id" && obj.idText) return obj.idText;
    return obj[language] || obj["en"] || "";
  };

  const title = {
    en: "Changes in Company Documents/Structure",
    id: "Perubahan Dokumen/Struktur Perusahaan",
    cn: "公司文件与结构变更",
  };

  const description = {
    en: "The process of modifying documents that regulate various important aspects of the company. These changes can include several things, such as changing the name, adjusting the amount of authorized capital, and changing the organizational structure.",
    id: "Proses modifikasi dokumen yang mengatur berbagai aspek penting perusahaan. Perubahan ini dapat mencakup beberapa hal, seperti mengubah nama, menyesuaikan jumlah modal dasar, dan mengubah struktur organisasi.",
    cn: "修改规范公司各项重要方面文件的过程。这些变更可以包括多个事项，例如更改公司名称、调整注册资本金额以及更改组织结构。",
  };

  const content = {
    legalBadge: {
      en: "Reviewed by the MCS Consulting Legal Team · Last updated July 2026 · 6 min read",
      id: "Ditinjau oleh Tim Hukum MCS Consulting · Terakhir diperbarui Juli 2026 · 6 menit baca",
      cn: "由 MCS Consulting 法律团队审核 · 上次更新于 2026 年 7 月 · 6 分钟阅读",
    },
    introText: {
      en: "As your business grows or changes direction, your company's legal documents need to keep pace — a new business line, a change of address, additional capital, or a new director all require formal amendment through Indonesia's Ministry of Law and Human Rights. MCS Consulting handles Articles of Association amendments, company data changes, and branch office setup end-to-end, keeping your business fully compliant.",
      id: "Seiring pertumbuhan bisnis atau perubahan arah bisnis Anda, dokumen hukum perusahaan Anda harus menyesuaikan — lini bisnis baru, perubahan alamat, modal tambahan, atau direktur baru semuanya memerlukan amandemen resmi melalui Kementerian Hukum dan Hak Asasi Manusia Indonesia. MCS Consulting menangani amandemen Anggaran Dasar, perubahan data perusahaan, dan pendirian kantor cabang secara menyeluruh, menjaga bisnis Anda tetap patuh sepenuhnya.",
      cn: "随着您的业务增长或调整方向，您公司的法律文件需要与时俱进——新的业务线、地址变更、追加资本或新董事都需要通过印度尼西亚法律和人权部进行正式修正。MCS Consulting 全程提供公司章程修正、公司数据变更以及分公司设立服务，让您的业务保持完全合规。",
    },
    onThisPage: {
      en: "On this page",
      id: "Di halaman ini",
      cn: "在本页",
    },
    tocItems: [
      {
        id: "changes-needed",
        en: "What kind of change do you need to make?",
        idText: "Perubahan apa yang perlu Anda lakukan?",
        cn: "您需要进行哪种类型的变更？",
      },
      {
        id: "comparing-changes",
        en: "Comparing change types",
        idText: "Perbandingan jenis perubahan",
        cn: "变更类型比较",
      },
      {
        id: "whats-included",
        en: "What's included with each service",
        idText: "Apa saja yang termasuk dalam setiap layanan",
        cn: "每个服务包含哪些内容",
      },
      {
        id: "requirements-details",
        en: "Requirements for filing changes",
        idText: "Persyaratan untuk mengajukan perubahan",
        cn: "提交变更的要求",
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
    changesTitle: {
      en: "What kind of change do you need to make?",
      id: "Perubahan apa yang perlu Anda lakukan?",
      cn: "您需要进行哪种类型的变更？",
    },
    changesDesc: {
      en: "Not every company change requires the same process. Amending your core legal documents (Articles of Association) is different from updating internal records (company data) or expanding physically (branch offices). The table below shows what applies to your situation.",
      id: "Tidak setiap perubahan perusahaan memerlukan proses yang sama. Mengamandemen dokumen hukum inti Anda (Anggaran Dasar) berbeda dari memperbarui catatan internal (data perusahaan) atau memperluas secara fisik (kantor cabang). Tabel di bawah ini menunjukkan apa yang berlaku untuk situasi Anda.",
      cn: "并不是每一次公司变更都需要相同的流程。修改您的核心法律文件（公司章程）与更新内部记录（公司数据）或进行实体扩展（分公司设立）是不同的。下表显示了适用于您的情况。",
    },
    comparingTitle: {
      en: "Comparing change types",
      id: "Perbandingan jenis perubahan",
      cn: "变更类型比较",
    },
    whatsIncludedTitle: {
      en: "What's included with each service",
      id: "Apa saja yang termasuk dalam setiap layanan",
      cn: "每个服务包含哪些内容",
    },
    whatsIncludedList: [
      {
        title: {
          en: "Amendment to the Company's Articles of Association",
          id: "Perubahan Anggaran Dasar Perusahaan",
          cn: "修改公司章程",
        },
        bullets: [
          { en: "Change of Company Name", id: "Perubahan Nama Perusahaan", cn: "更改公司名称" },
          { en: "Change of Company Domicile", id: "Perubahan Domisili Perusahaan", cn: "更改公司地址/住所" },
          { en: "Change/Add Business Fields", id: "Perubahan/Penambahan Bidang Usaha", cn: "更改/新增经营范围" },
          { en: "Change in Company Capital", id: "Perubahan Modal Perusahaan", cn: "更改公司资本结构" },
        ],
      },
      {
        title: {
          en: "Changes in Company Data",
          id: "Perubahan Data Perusahaan",
          cn: "公司数据/信息变更",
        },
        bullets: [
          { en: "Change in Management Structure", id: "Perubahan Struktur Pengurus", cn: "更换管理人员/董事会/监事会结构" },
          { en: "Extension of Management Structure (Board of Directors and Commissioners)", id: "Perpanjangan Struktur Pengurus (Direksi dan Dewan Komisaris)", cn: "延长管理人员任期（董事会和监事会）" },
        ],
      },
      {
        title: {
          en: "Branch Office Management",
          id: "Pengurusan Kantor Cabang",
          cn: "分公司设立与管理",
        },
        bullets: [
          { en: "Branch Office Registration", id: "Pendaftaran Kantor Cabang", cn: "分公司注册登记" },
          { en: "Branch Office Documentation", id: "Dokumentasi Kantor Cabang", cn: "分公司文件筹备" },
          { en: "Compliance Processing", id: "Proses Kepatuhan", cn: "合规手续办理" },
        ],
      },
    ],
    requirementsTitle: {
      en: "Requirements for filing changes",
      id: "Persyaratan untuk mengajukan perubahan",
      cn: "提交变更的要求",
    },
    reqAoATitle: {
      en: "Articles of Association Amendment",
      id: "Perubahan Anggaran Dasar",
      cn: "公司章程修正",
    },
    reqAoADesc: {
      en: "You'll need your company's current Articles of Association, a shareholders' resolution approving the specific change, and documentation supporting the change itself — for example, proof of the new registered address for a domicile change, or the updated capital structure for a capital change. Business field changes require confirming the new KBLI code is compliant with your company's ownership structure (some fields have foreign ownership restrictions that don't apply to your current activities).",
      id: "Anda memerlukan Anggaran Dasar perusahaan Anda yang berlaku saat ini, keputusan rapat pemegang saham yang menyetujui perubahan tertentu, dan dokumentasi yang mendukung perubahan itu sendiri — misalnya, bukti alamat terdaftar yang baru untuk perubahan domisili, atau struktur modal yang diperbarui untuk perubahan modal. Perubahan bidang usaha memerlukan konfirmasi bahwa kode KBLI baru mematuhi struktur kepemilikan perusahaan Anda (beberapa bidang memiliki batasan kepemilikan asing yang tidak berlaku untuk kegiatan Anda saat ini).",
      cn: "您需要提供公司现行的公司章程、批准该特定变更的股东决议，以及支持变更本身的文件——例如，住所变更需要新注册地址的证明，资本变更需要更新的资本结构。经营范围变更需要确认新的 KBLI 代码符合您公司的所有权结构（某些领域有外资持股限制，不适用于您当前的活动）。",
    },
    reqDataTitle: {
      en: "Company Data Change",
      id: "Perubahan Data Perusahaan",
      cn: "公司数据变更",
    },
    reqDataDesc: {
      en: "You'll need a shareholders' or board resolution approving the management change, identification documents for any new directors or commissioners, and — if the incoming director is foreign — confirmation of their work permit (KITAS) status, since foreign directors actively managing operations in Indonesia require one.",
      id: "Anda memerlukan keputusan pemegang saham atau dewan direksi yang menyetujui perubahan pengurus, dokumen identitas untuk direktur atau komisaris baru, dan — jika direktur yang masuk adalah warga negara asing — konfirmasi status izin kerja (KITAS) mereka, karena direktur asing yang aktif mengelola operasional di Indonesia memerlukannya.",
      cn: "您需要提供批准管理层变更的股东或董事会决议、任何新任董事或监事的身份证明文件，以及（如果新任董事是外籍人士）其工作许可 (KITAS) 状态的确认，因为在印尼实际管理运营的外籍董事需要工作许可。",
    },
    reqBranchTitle: {
      en: "Branch Office Management",
      id: "Pengurusan Kantor Cabang",
      cn: "分公司设立与管理",
    },
    reqBranchDesc: {
      en: "You'll need your parent company's Articles of Association and NIB, a registered address for the branch location, and confirmation that your business activities are permitted in the branch's regional jurisdiction. Some regions have additional local compliance requirements beyond national registration.",
      id: "Anda memerlukan Anggaran Dasar dan NIB perusahaan induk Anda, alamat terdaftar untuk lokasi cabang, dan konfirmasi bahwa kegiatan bisnis Anda diizinkan di yurisdiksi regional cabang tersebut. Beberapa daerah memiliki persyaratan kepatuhan lokal tambahan selain pendaftaran nasional.",
      cn: "您需要提供母公司的公司章程和 NIB、分公司所在地的注册地址，以及确认您的业务活动在分公司所在区域管辖范围内是允许的。某些地区在国家级登记之外还有额外的地方合规要求。",
    },
    regulatoryFooter: {
      en: "Company document changes in Indonesia are governed by Law No. 40 of 2007 on Limited Liability Companies and processed through the Ministry of Law and Human Rights' AHU Online system, with business licensing updates reflected through OSS. MCS Consulting stays current with all Ministry of Law and OSS regulation updates on your behalf.",
      id: "Perubahan dokumen perusahaan di Indonesia diatur oleh Undang-Undang No. 40 Tahun 2007 tentang Perseroan Terbatas dan diproses melalui sistem AHU Online Kementerian Hukum dan Hak Asasi Manusia, dengan pembaruan perizinan berusaha yang tercermin melalui OSS. MCS Consulting selalu memperbarui informasi dengan semua pembaruan peraturan Kementerian Hukum dan HAM serta OSS demi kenyamanan Anda.",
      cn: "印度尼西亚的公司文件变更受 2007 年第 40 号关于有限责任公司的法律管辖，并通过法律和人权部的 AHU 在线系统进行处理，业务许可更新则通过 OSS 进行体现。MCS Consulting 代表您密切关注所有法律部和 OSS 法规的最新动态。",
    },
    stepsTitle: {
      en: "Step-by-step process",
      id: "Proses langkah demi langkah",
      cn: "逐步流程",
    },
    steps: [
      {
        title: {
          en: "Resolution and documentation",
          id: "Keputusan dan dokumentasi",
          cn: "拟定决议与文件筹备",
        },
        duration: {
          en: "2–3 days",
          id: "2–3 hari",
          cn: "2-3 天",
        },
        desc: {
          en: "We prepare the shareholders' or board resolution approving your change, along with all supporting documentation specific to your amendment type.",
          id: "Kami menyiapkan keputusan pemegang saham atau dewan direksi yang menyetujui perubahan Anda, bersama dengan semua dokumentasi pendukung khusus untuk jenis amandemen Anda.",
          cn: "我们起草批准您变更的股东或董事会决议，以及针对您的修正案类型所需的所有支持文件。",
        },
      },
      {
        title: {
          en: "Notarial deed",
          id: "Akta notaris",
          cn: "公证处契约草拟",
        },
        duration: {
          en: "2–4 days",
          id: "2–4 hari",
          cn: "2-4 天",
        },
        desc: {
          en: "A licensed notary drafts the deed of amendment reflecting your approved changes.",
          id: "Notaris berlisensi menyusun akta perubahan yang mencerminkan perubahan yang telah Anda setujui.",
          cn: "持牌公证人起草反映您已批准变更的修改契约。",
        },
      },
      {
        title: {
          en: "Ministry of Law submission and approval",
          id: "Pengajuan dan persetujuan Kementerian Hukum & HAM",
          cn: "提交法律与人权部审批",
        },
        duration: {
          en: "1–3 weeks",
          id: "1–3 minggu",
          cn: "1-3 周",
        },
        desc: {
          en: "The amendment is submitted to the Ministry of Law and Human Rights for review and approval. Some changes (like management structure updates) may only require notification rather than full approval, which is faster.",
          id: "Amandemen diserahkan ke Kementerian Hukum dan Hak Asasi Manusia untuk ditinjau dan disetujui. Beberapa perubahan (seperti pembaruan struktur pengurus) mungkin hanya memerlukan pemberitahuan daripada persetujuan penuh, yang prosesnya lebih cepat.",
          cn: "将修正案提交给法律和人权部进行审查和批准。某些变更（如管理层结构更新）可能只需要通知而不是完全批准，这样速度更快。",
        },
      },
      {
        title: {
          en: "Update to company records and licenses",
          id: "Pembaruan catatan dan izin perusahaan",
          cn: "同步更新企业记录与许可",
        },
        duration: {
          en: "3–5 days",
          id: "3–5 hari",
          cn: "3-5 天",
        },
        desc: {
          en: "Once approved, we update your NIB and any related licenses through OSS to reflect the change, and — for branch offices — complete regional registration and compliance processing.",
          id: "Setelah disetujui, kami memperbarui NIB Anda dan izin terkait melalui OSS untuk mencerminkan perubahan tersebut, dan — untuk kantor cabang — menyelesaikan pendaftaran wilayah dan proses kepatuhan.",
          cn: "一旦获得批准，我们将通过 OSS 更新您的 NIB 和任何相关许可，以反映此变更，并（对于分公司）完成区域登记和合规手续的办理。",
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
      en: "Varies by Change Type",
      id: "Bervariasi berdasarkan Jenis Perubahan",
      cn: "因变更类型而异",
    },
    totalTimelineDesc: {
      en: "1–3 weeks for company data changes, 2–4 weeks for Articles of Association amendments, and 3–6 weeks for branch office setup.",
      id: "1–3 minggu untuk perubahan data perusahaan, 2–4 minggu untuk amandemen Anggaran Dasar, dan 3–6 minggu untuk pendirian kantor cabang.",
      cn: "公司数据变更需 1-3 周；公司章程修正需 2-4 周；分公司设立需 3-6 周。",
    },
    finalCtaText: {
      en: "Not sure which type of change applies to your situation? Schedule a free consultation and our team will map out exactly what's needed.",
      id: "Belum yakin jenis perubahan mana yang berlaku untuk situasi Anda? Jadwalkan konsultasi gratis dan tim kami akan memetakan dengan tepat apa yang diperlukan.",
      cn: "不确定哪种变更类型适用于您的情况？预约免费咨询，我们的团队将为您规划具体所需的步骤。",
    },
  };

  const tableHeaders = {
    columns: [
      { en: "Feature", id: "Fitur", cn: "特征" },
      {
        en: "Articles of Association Amendment",
        id: "Amandemen Anggaran Dasar",
        cn: "公司章程修正",
      },
      { en: "Company Data Change", id: "Perubahan Data Perusahaan", cn: "公司数据变更" },
      { en: "Branch Office Setup", id: "Pengurusan Kantor Cabang", cn: "分公司设立" },
    ],
  };

  const tableRows = [
    {
      label: { en: "What it covers", id: "Cakupan", cn: "变更范围" },
      values: [
        {
          en: "Name, domicile, business fields, capital",
          id: "Nama, domisili, bidang usaha, modal",
          cn: "名称、住所、经营范围、资本结构",
        },
        {
          en: "Management structure (directors, commissioners)",
          id: "Struktur pengurus (direksi, komisaris)",
          cn: "管理人员结构（董事会、监事会）",
        },
        {
          en: "New physical location under the same legal entity",
          id: "Lokasi fisik baru di bawah entitas hukum yang sama",
          cn: "在同一法人实体下设立新的实体分支机构",
        },
      ],
    },
    {
      label: {
        en: "Requires Ministry of Law approval?",
        id: "Perlu persetujuan Kemenkumham?",
        cn: "需要法律部批准？",
      },
      values: [
        { en: "Yes", id: "Ya", cn: "是" },
        {
          en: "Sometimes, depending on the change",
          id: "Kadang-kadang, tergantung pada perubahan",
          cn: "有时，具体取决于变更内容",
        },
        { en: "Yes, plus regional registration", id: "Ya, ditambah pendaftaran wilayah", cn: "是，并且需要在地方进行登记" },
      ],
    },
    {
      label: { en: "Requires notarial deed?", id: "Perlu akta notaris?", cn: "需要公证书？" },
      values: [
        { en: "Yes", id: "Ya", cn: "是" },
        {
          en: "Yes, for management structure changes",
          id: "Ya, untuk perubahan struktur pengurus",
          cn: "是，用于管理人员结构变更",
        },
        { en: "Yes", id: "Ya", cn: "是" },
      ],
    },
    {
      label: { en: "Typical timeline", id: "Waktu pengerjaan", cn: "办理周期" },
      values: [
        { en: "2–4 weeks", id: "2–4 minggu", cn: "2-4 周" },
        { en: "1–3 weeks", id: "1–3 minggu", cn: "1-3 周" },
        { en: "3–6 weeks", id: "3–6 minggu", cn: "3-6 周" },
      ],
    },
    {
      label: { en: "Best for", id: "Terbaik untuk", cn: "最适合" },
      values: [
        {
          en: "Companies changing name, address, business activities, or capital structure",
          id: "Perusahaan yang mengubah nama, alamat, kegiatan bisnis, atau struktur modal",
          cn: "公司需要变更名称、地址、经营范围或资本结构",
        },
        {
          en: "Companies adding, removing, or extending directors and commissioners",
          id: "Perusahaan yang menambah, menghapus, atau memperpanjang masa jabatan direktur dan komisaris",
          cn: "公司需要增加、移除或延长董事及监事的任期",
        },
        {
          en: "Companies expanding operations to a new city or region",
          id: "Perusahaan yang memperluas operasi ke kota atau wilayah baru",
          cn: "公司需要将业务运营扩展到新的城市或地区",
        },
      ],
    },
  ];

  const faqs = [
    {
      question: {
        en: "What is required to change my company's business classification (KBLI)?",
        id: "Apa yang diperlukan untuk mengubah klasifikasi bisnis perusahaan saya (KBLI)?",
        cn: "更改我公司的业务分类（KBLI）需要什么？",
      },
      answer: {
        en: "Changing a KBLI requires a General Meeting of Shareholders (RUPS) to amend the 'Purpose and Objective' section of the Articles of Association. This requires a Notarial Deed and an update to both the MOLHR and the OSS system.",
        id: "Mengubah KBLI memerlukan Rapat Umum Pemegang Saham (RUPS) untuk mengamandemen bagian 'Maksud dan Tujuan' dari Anggaran Dasar. Ini memerlukan Akta Notaris dan pembaruan pada Kemenkumham dan sistem OSS.",
        cn: "更改KBLI需要召开股东大会（RUPS）来修改公司章程中的“目的和目标”部分。这需要公证书并更新MOLHR和OSS系统。",
      },
    },
    {
      question: {
        en: "How do I replace a foreign director?",
        id: "Bagaimana cara mengganti direktur asing?",
        cn: "我如何更换外籍董事？",
      },
      answer: {
        en: "You must hold a RUPS to approve the resignation and new appointment. Once the Notarial Deed is finalized and registered with the MOLHR, the company must also cancel the outgoing director's work permit (KITAS) via an EPO and apply for a new KITAS for the incoming director.",
        id: "Anda harus mengadakan RUPS untuk menyetujui pengunduran diri dan pengangkatan baru. Setelah Akta Notaris diselesaikan dan didaftarkan ke Kemenkumham, perusahaan juga harus membatalkan izin kerja (KITAS) direktur yang keluar melalui EPO dan mengajukan KITAS baru untuk direktur yang masuk.",
        cn: "您必须召开RUPS来批准辞职和新任命。一旦公证书完成并在MOLHR注册，公司还必须通过EPO取消离职董事的工作许可（KITAS），并为新任董事申请新的KITAS。",
      },
    },
    {
      question: {
        en: "What is a General Meeting of Shareholders (RUPS)?",
        id: "Apa itu Rapat Umum Pemegang Saham (RUPS)?",
        cn: "什么是股东大会 (RUPS)？",
      },
      answer: {
        en: "RUPS is the highest governing body of an Indonesian limited liability company (PT). Major corporate changes, such as changing directors, increasing capital, or altering the company address, must be approved by the shareholders through a RUPS.",
        id: "RUPS adalah badan pengatur tertinggi dari perseroan terbatas (PT) Indonesia. Perubahan besar perusahaan, seperti mengganti direktur, meningkatkan modal, atau mengubah alamat perusahaan, harus disetujui oleh pemegang saham melalui RUPS.",
        cn: "RUPS是印度尼西亚有限责任公司（PT）的最高管理机构。重大的公司变更，如更换董事，增加资本或更改公司地址，必须通过RUPS由股东批准。",
      },
    },
    {
      question: {
        en: "How do we officially increase paid-up capital?",
        id: "Bagaimana cara resmi kami meningkatkan modal disetor?",
        cn: "我们如何正式增加实缴资本？",
      },
      answer: {
        en: "Capital increases must be approved via RUPS. The shareholders then deposit the funds into the corporate bank account. After proving the deposit, a Notary executes the deed of capital increase and registers it with the MOLHR.",
        id: "Peningkatan modal harus disetujui melalui RUPS. Pemegang saham kemudian menyetorkan dana ke rekening bank perusahaan. Setelah membuktikan setoran, Notaris melaksanakan akta peningkatan modal dan mendaftarkannya ke Kemenkumham.",
        cn: "增加资本必须通过RUPS批准。然后股东将资金存入公司银行账户。在证明存款后，公证人执行增加资本的契约并将其注册到MOLHR。",
      },
    },
    {
      question: {
        en: "How long does a Notarial Deed amendment take?",
        id: "Berapa lama waktu yang dibutuhkan untuk perubahan Akta Notaris?",
        cn: "公证书修改需要多长时间？",
      },
      answer: {
        en: "Once all required documents and signatures (or powers of attorney) are gathered, drafting the deed and obtaining the MOLHR decree typically takes 3 to 7 working days.",
        id: "Setelah semua dokumen yang diperlukan dan tanda tangan (atau surat kuasa) dikumpulkan, penyusunan akta dan perolehan SK Kemenkumham biasanya memakan waktu 3 hingga 7 hari kerja.",
        cn: "一旦收集了所有必要的文件和签名（或授权书），起草契约并获得MOLHR法令通常需要3到7个工作日。",
      },
    },
  ];

  const ctaText = {
    en: "Need to Update Your Company?",
    id: "Perlu Memperbarui Perusahaan Anda?",
    cn: "需要更新您的公司文件或结构吗？",
  };

  const ctaDescription = {
    en: "Our experienced team will guide you through every step of the company change process",
    id: "Tim berpengalaman kami akan memandu Anda melalui setiap langkah proses perubahan perusahaan",
    cn: "我们经验丰富的团队将引导您完成公司变更流程的每一步",
  };

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <BaseServicePage
      icon={RefreshCw}
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
            <RefreshCw className="h-5 w-5 text-primary" />
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

        {/* Section 1: What kind of change do you need to make? */}
        <section id="changes-needed" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.changesTitle)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mb-6">
            {getTranslation(content.changesDesc)}
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
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.whatsIncludedList.map((service, serviceIdx) => {
              const IconComponent = [FileEdit, UserCheck, Building][serviceIdx] || FileEdit;
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

        {/* Section 3: Requirements for filing changes */}
        <section id="requirements-details" className="scroll-mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground border-b border-border/50 dark:border-white/10 pb-3">
            {getTranslation(content.requirementsTitle)}
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* Articles of Association Amendment */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                  {getTranslation(content.reqAoATitle)}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {getTranslation(content.reqAoADesc)}
                </p>
              </div>
            </div>

            {/* Changes in Company Data */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                  {getTranslation(content.reqDataTitle)}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {getTranslation(content.reqDataDesc)}
                </p>
              </div>
            </div>

            {/* Branch Office Management */}
            <div className="p-6 rounded-2xl border border-border/50 dark:border-white/15 bg-background/45 backdrop-blur-sm shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-foreground text-lg mb-3 pb-1.5 border-b border-border/10">
                  {getTranslation(content.reqBranchTitle)}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {getTranslation(content.reqBranchDesc)}
                </p>
              </div>
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
