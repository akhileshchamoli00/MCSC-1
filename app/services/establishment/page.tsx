"use client";

import { Building2 } from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";

export default function EstablishmentPage() {
  const title = {
    en: "Establishment of Business Entities/Legal Entities",
    id: "Pendirian Badan Usaha/Badan Hukum",
    cn: "业务实体/法人实体设立",
  };

  const description = {
    en: "Establishment of local PT, PMA PT, Individual PT, Foundation, Firm, CV, Cooperative. The formal process of forming a legally recognized business entity.",
    id: "Pendirian PT lokal, PT PMA, PT Perseorangan, Yayasan, Firma, CV, Koperasi. Proses formal pembentukan badan usaha yang diakui secara hukum.",
    cn: "设立本地 PT、PT PMA（外资）、个人 PT、基金会、商号、CV、合作社。建立法律认可的商业实体的正式程序。",
  };

  const subServices = [
    {
      title: {
        en: "Establishment Local Investment",
        id: "Pendirian PT Lokal",
        cn: "设立本地投资公司 (PT Lokal)",
      },
      items: {
        en: [
          "Deed of Establishment",
          "Ministry of Law and Human Rights Decree",
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "Akta Pendirian",
          "SK Kemenkumham",
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "设立契约",
          "法律与人权部批文",
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
    {
      title: {
        en: "Establishment Foreign Investment-PMA",
        id: "Pendirian PT PMA",
        cn: "设立外商投资公司 (PT PMA)",
      },
      items: {
        en: [
          "Deed of Establishment",
          "Ministry of Law and Human Rights Decree",
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "Akta Pendirian",
          "SK Kemenkumham",
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "设立契约",
          "法律与人权部批文",
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
    {
      title: {
        en: "Commanditaire Vennootschap (CV)",
        id: "Commanditaire Vennootschap (CV)",
        cn: "设立两合公司 (CV)",
      },
      items: {
        en: [
          "Deed of Establishment",
          "Ministry of Law and Human Rights Decree",
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "Akta Pendirian",
          "SK Kemenkumham",
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "设立契约",
          "法律与人权部批文",
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
    {
      title: {
        en: "Foundation of Organizations",
        id: "Pendirian Yayasan",
        cn: "设立基金会 (Yayasan)",
      },
      items: {
        en: [
          "Deed of Establishment",
          "Ministry of Law and Human Rights Decree",
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "Akta Pendirian",
          "SK Kemenkumham",
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "设立契约",
          "法律与人权部批文",
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
    {
      title: { en: "Firm", id: "Firma", cn: "设立商号 (Firma)" },
      items: {
        en: [
          "Deed of Establishment",
          "Ministry of Law and Human Rights Decree",
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "Akta Pendirian",
          "SK Kemenkumham",
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "设立契约",
          "法律与人权部批文",
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
    {
      title: {
        en: "Sole Proprietorship",
        id: "Usaha Perseorangan",
        cn: "设立独资企业 (Usaha Perseorangan)",
      },
      items: {
        en: [
          "Tax Identification Number (NPWP)",
          "Company Details",
          "OSS Account",
          "Certificate of Registration (SKT) issued by the tax office",
          "Business Identification Number (NIB)",
        ],
        id: [
          "NPWP Asli",
          "Keterangan Perusahaan",
          "Akun OSS",
          "Surat Keterangan Terdaftar (SKT) dari kantor pajak",
          "Nomor Induk Berusaha (NIB)",
        ],
        cn: [
          "原件税务登记号 (NPWP)",
          "公司说明文件",
          "OSS 账号",
          "税务局颁发的登记证明书 (SKT)",
          "业务登记号 (NIB)",
        ],
      },
    },
  ];

  const faqs = [
    {
      question: {
        en: "What is the minimum capital required to establish a PT PMA?",
        id: "Berapa modal minimum yang diperlukan untuk mendirikan PT PMA?",
        cn: "设立PT PMA的最低资本是多少？",
      },
      answer: {
        en: "The minimum required investment plan for a PT PMA is IDR 10 billion (excluding land and buildings), with a minimum paid-up capital of IDR 10 billion that must be deposited into the corporate bank account after incorporation.",
        id: "Rencana investasi minimum yang disyaratkan untuk PT PMA adalah Rp 10 miliar (tidak termasuk tanah dan bangunan), dengan modal disetor minimum Rp 10 miliar yang harus disetorkan ke rekening bank perusahaan setelah pendirian.",
        cn: "PT PMA的最低投资计划为100亿印尼盾（不包括土地和建筑），最低实缴资本为100亿印尼盾，必须在成立后存入公司银行账户。",
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
        en: "What is the difference between a PT PMA and a CV?",
        id: "Apa perbedaan antara PT PMA dan CV?",
        cn: "PT PMA 和 CV 之间有什么区别？",
      },
      answer: {
        en: "A PT PMA is a limited liability company open to foreign investors. A CV (Commanditaire Vennootschap) is a limited partnership that is strictly reserved for 100% local (Indonesian citizen) ownership.",
        id: "PT PMA adalah perseroan terbatas yang terbuka untuk investor asing. CV (Commanditaire Vennootschap) adalah persekutuan komanditer yang secara ketat dicadangkan untuk 100% kepemilikan lokal (warga negara Indonesia).",
        cn: "PT PMA是向外国投资者开放的有限责任公司。CV（两合公司）是严格保留给100%本地（印度尼西亚公民）所有权的有限合伙企业。",
      },
    },
    {
      question: {
        en: "How long does the establishment process usually take?",
        id: "Berapa lama proses pendirian biasanya berlangsung?",
        cn: "成立过程通常需要多长时间？",
      },
      answer: {
        en: "The standard incorporation process for a PT PMA or local PT, including the Notarial Deed, MOLHR approval, and NIB issuance via the OSS system, usually takes between 5 to 10 working days, assuming all documentation is complete.",
        id: "Proses pendirian standar untuk PT PMA atau PT lokal, termasuk Akta Notaris, persetujuan Kemenkumham, dan penerbitan NIB melalui sistem OSS, biasanya memakan waktu antara 5 hingga 10 hari kerja, dengan asumsi semua dokumentasi lengkap.",
        cn: "假设所有文件齐全，PT PMA或本地PT的标准成立流程（包括公证书，MOLHR批准和通过OSS系统签发NIB）通常需要5到10个工作日。",
      },
    },
    {
      question: {
        en: "Can a foreigner be a Director of the company?",
        id: "Bisakah orang asing menjadi Direktur perusahaan?",
        cn: "外国人可以担任公司的董事吗？",
      },
      answer: {
        en: "Yes, a foreigner can be appointed as a Director or Commissioner in a PT PMA. However, they must obtain a valid work permit (KITAS) to legally reside and perform their duties in Indonesia.",
        id: "Ya, orang asing dapat ditunjuk sebagai Direktur atau Komisaris di PT PMA. Namun, mereka harus mendapatkan izin kerja (KITAS) yang sah untuk tinggal dan melaksanakan tugasnya secara hukum di Indonesia.",
        cn: "是的，外国人可以被任命为PT PMA的董事或专员。但是，他们必须获得有效的工作许可证（KITAS）才能合法居住在印度尼西亚并履行其职责。",
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

  return (
    <BaseServicePage
      icon={Building2}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
      faqs={faqs}
    />
  );
}
