"use client";

import { Users } from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";

export default function WorkPermitPage() {
  const title = {
    en: "Work Permit",
    id: "Izin Kerja",
    cn: "工作许可/工作签证",
  };

  const description = {
    en: "Management of foreign national permits such as KITAS, KITAP, Reporting Certificate (TTKOA), Residence Certificate (SKTT), RPTKA, Mandatory Reporting, Exit Permit Only (EPO), Exit Re-entry Permit (ERP)",
    id: "Pengurusan izin tenaga kerja asing seperti KITAS, KITAP, Surat Keterangan Melapor (TTKOA), Surat Keterangan Tinggal Tetap (SKTT), RPTKA, Wajib Lapor, Exit Permit Only (EPO), Exit Re-entry Permit (ERP)",
    cn: "管理和办理外籍人员许可证件，例如工作准证 (KITAS)、永久居留证 (KITAP)、报告证明 (TTKOA)、临时居住证明 (SKTT)、外籍员工聘用计划 (RPTKA)、强制报告、仅限出境许可 (EPO)、出境重入境许可 (ERP)",
  };

  const subServices = [
    {
      title: {
        en: "Limited Stay Permit (KITAS)",
        id: "Kartu Izin Tinggal Terbatas (KITAS)",
        cn: "工作/暂住准证 (KITAS)",
      },
      items: {
        en: [
          "New Application & Extension",
          "Working KITAS",
          "Family Reunion KITAS",
          "Official Permit for Foreign Nationals",
        ],
        id: [
          "Permohonan Baru & Perpanjangan",
          "KITAS Kerja",
          "KITAS Penyatuan Keluarga",
          "Izin Resmi Warga Negara Asing",
        ],
        cn: [
          "新申请与延期服务",
          "工作类 KITAS",
          "家属团聚类 KITAS",
          "外籍人士法定许可证",
        ],
      },
    },
    {
      title: {
        en: "Permanent Residence (KITAP)",
        id: "Kartu Izin Tinggal Tetap (KITAP)",
        cn: "永久居留准证 (KITAP)",
      },
      items: {
        en: [
          "Permanent Residence Permit",
          "Available after two KITAS extensions",
          "Valid for 5 years per extension",
          "Full Immigration Compliance",
        ],
        id: [
          "Izin Tinggal Tetap",
          "Tersedia setelah dua kali perpanjangan KITAS",
          "Berlaku 5 tahun per perpanjangan",
          "Kepatuhan Imigrasi Penuh",
        ],
        cn: [
          "永久居留权申请",
          "持有两次 KITAS 延期后可申请",
          "每期延长有效期为5年",
          "完全合规的移民身份",
        ],
      },
    },
    {
      title: {
        en: "Permit Closures (EPO/ERP)",
        id: "Penutupan Izin (EPO/ERP)",
        cn: "注销与注销出境许可 (EPO/ERP)",
      },
      items: {
        en: [
          "Exit Permit Only (EPO)",
          "Exit Re-entry Permit (ERP)",
          "Returning Immigration Documents",
          "Ending Stay in Indonesia",
        ],
        id: [
          "Exit Permit Only (EPO)",
          "Exit Re-entry Permit (ERP)",
          "Pengembalian Dokumen Imigrasi",
          "Mengakhiri Masa Tinggal di Indonesia",
        ],
        cn: [
          "出境许可 (EPO)",
          "出境重入境许可 (ERP)",
          "退还移民主管机关文件",
          "终止在印尼的逗留期",
        ],
      },
    },
    {
      title: {
        en: "Business Visas",
        id: "Visa Bisnis",
        cn: "商务签证 (Visa Bisnis)",
      },
      items: {
        en: [
          "Multiple Business Visa",
          "Frequent Business Trips",
          "2-Month Validity per Visit",
          "Sponsorship Support",
        ],
        id: [
          "Visa Bisnis Multiple",
          "Perjalanan Bisnis Routin",
          "Validitas 2 Bulan per Kunjungan",
          "Dukungan Sponsor",
        ],
        cn: [
          "多次往返商务签证",
          "满足频繁商务旅行需求",
          "每次入境可停留2个月",
          "赞助商/担保函支持",
        ],
      },
    },
    {
      title: {
        en: "Official Certificates",
        id: "Surat Keterangan Resmi",
        cn: "官方登记与证明材料",
      },
      items: {
        en: [
          "Residence Certificate (SKTT)",
          "Reporting Certificate (TTKOA)",
          "Dukcapil & Police Coordination",
          "Identity Documents for Foreigners",
        ],
        id: [
          "Surat Keterangan Tinggal Tetap (SKTT)",
          "Surat Keterangan Melapor (TTKOA)",
          "Koordinasi Dukcapil & Polisi",
          "Dokumen Identitas Orang Asing",
        ],
        cn: [
          "临时居留证明 (SKTT)",
          "警方申报证明 (TTKOA)",
          "户政局与警方协调对接",
          "外籍人士身份证明文件",
        ],
      },
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
        id: "EPO diperlukan ketika orang asing mengakhiri pekerjaan mereka, berganti sponsor, atau meninggalkan Indonesia secara permanen. Ini secara resmi membatalkan KITAS dan memastikan perusahaan sponsor tidak lagi bertanggung jawab atas individu tersebut.",
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

  return (
    <BaseServicePage
      icon={Users}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
      faqs={faqs}
    />
  );
}
