"use client";

import { RefreshCw } from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";

export default function CompanyChangesPage() {
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

  const subServices = [
    {
      title: {
        en: "Amendment to the Company's Articles of Association",
        id: "Perubahan Anggaran Dasar Perusahaan",
        cn: "修改公司章程",
      },
      items: {
        en: [
          "Change of Company Name",
          "Change of Company Domicile",
          "Change/Add Business Fields",
          "Change in Company Capital",
        ],
        id: [
          "Perubahan Nama Perusahaan",
          "Perubahan Domisili Perusahaan",
          "Perubahan/Penambahan Bidang Usaha",
          "Perubahan Modal Perusahaan",
        ],
        cn: [
          "更改公司名称",
          "更改公司地址/住所",
          "更改/新增经营范围",
          "更改公司资本结构",
        ],
      },
    },
    {
      title: {
        en: "Changes in Company Data",
        id: "Perubahan Data Perusahaan",
        cn: "公司数据/信息变更",
      },
      items: {
        en: [
          "Change in Management Structure",
          "Extension of Management Structure (Board of Directors and commissioners)",
        ],
        id: [
          "Perubahan Struktur Pengurus",
          "Perpanjangan Struktur Pengurus (Direksi dan Dewan Komisaris)",
        ],
        cn: [
          "更换管理人员/董事会/监事会结构",
          "延长管理人员任期（董事会和监事会）",
        ],
      },
    },
    {
      title: {
        en: "Branch Office Management",
        id: "Pengurusan Kantor Cabang",
        cn: "分公司设立与管理",
      },
      items: {
        en: [
          "Branch Office Registration",
          "Branch Office Documentation",
          "Compliance Processing",
        ],
        id: [
          "Pendaftaran Kantor Cabang",
          "Dokumentasi Kantor Cabang",
          "Proses Kepatuhan",
        ],
        cn: ["分公司注册登记", "分公司文件筹备", "合规手续办理"],
      },
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

  return (
    <BaseServicePage
      icon={RefreshCw}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
      faqs={faqs}
    />
  );
}
