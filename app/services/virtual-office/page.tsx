"use client";

import { MapPin } from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";

export default function VirtualOfficePage() {
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

  const subServices = [
    {
      title: {
        en: "Virtual Office North Jakarta",
        id: "Virtual Office Jakarta Utara",
        cn: "虚拟办公室 - 北雅加达",
      },
      subtitle: {
        en: "Springhill Office Tower, Kemayoran, North Jakarta",
        id: "Springhill Office Tower, Kemayoran, Jakarta Utara",
        cn: "北雅加达 凯马约兰 Springhill Office Tower",
      },
      items: {
        en: [
          "Professional Business Address",
          "Mail & Parcel Handling",
          "Company Registration Support",
          "Prime Location",
        ],
        id: [
          "Alamat Bisnis Profesional",
          "Pengelolaan Surat & Paket",
          "Dukungan Pendaftaran Perusahaan",
          "Lokasi Strategis",
        ],
        cn: [
          "专业的商业地址",
          "信件与包裹收发管理",
          "公司注册登记支持服务",
          "黄金地理位置",
        ],
      },
    },
    {
      title: {
        en: "Virtual Office Tangerang Regency",
        id: "Virtual Office Kabupaten Tangerang",
        cn: "虚拟办公室 - 唐格朗县",
      },
      subtitle: {
        en: "Ruko Faraday, Gading Serpong, Tangerang Regency",
        id: "Ruko Faraday, Gading Serpong, Kabupaten Tangerang",
        cn: "唐格朗县 达丁塞尔蓬 Faraday 商业区",
      },
      items: {
        en: [
          "Professional Business Address",
          "Mail & Parcel Handling",
          "Company Registration Support",
          "Prime Strategic Location",
        ],
        id: [
          "Alamat Bisnis Profesional",
          "Pengelolaan Surat & Paket",
          "Dukungan Pendaftaran Perusahaan",
          "Lokasi Strategis Utama",
        ],
        cn: [
          "专业的商业地址",
          "信件与包裹收发管理",
          "公司注册登记支持服务",
          "黄金战略位置",
        ],
      },
    },
  ];

  const faqs = [
    {
      question: {
        en: "Is a Virtual Office legal for setting up a PT PMA?",
        id: "Apakah Virtual Office legal untuk mendirikan PT PMA?",
        cn: "使用虚拟办公室设立PT PMA合法吗？",
      },
      answer: {
        en: "Yes, using a Virtual Office is completely legal for company establishment and obtaining a standard NIB in Indonesia, especially for service-based and consulting companies.",
        id: "Ya, menggunakan Virtual Office sepenuhnya legal untuk pendirian perusahaan dan mendapatkan NIB standar di Indonesia, terutama untuk perusahaan berbasis layanan dan konsultasi.",
        cn: "是的，在印度尼西亚使用虚拟办公室进行公司设立和获取标准NIB是完全合法的，特别是对于基于服务和咨询的公司。",
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
        cn: "是的。我们的虚拟办公室设施符合印度尼西亚税务局设定的要求，这意味着您的企业可以成功申请PKP状态以开具税务发票 (faktur pajak)。",
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

  return (
    <BaseServicePage
      icon={MapPin}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
      faqs={faqs}
    />
  );
}
