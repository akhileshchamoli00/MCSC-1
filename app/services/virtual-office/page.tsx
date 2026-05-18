"use client"

import { MapPin } from "lucide-react"
import { BaseServicePage } from "@/components/base-service-page"

export default function VirtualOfficePage() {
  const title = {
    en: "Virtual Office",
    id: "Virtual Office",
    cn: "虚拟办公室",
  }

  const description = {
    en: "A service that allows individuals or companies to have a professional business address and office facilities without renting a physical space permanently. Includes mail handling and company registration use.",
    id: "Layanan yang memungkinkan individu atau perusahaan memiliki alamat bisnis profesional dan fasilitas kantor tanpa menyewa ruang fisik secara permanen. Termasuk pengelolaan surat dan penggunaan untuk pendaftaran perusahaan.",
    cn: "允许个人或公司在不长期租用实体空间的情况下拥有专业的商业地址和办公设施的服务。包括信件和包裹收发以及用于公司注册登记。",
  }

  const subServices = [
    {
      title: { en: "Virtual Office North Jakarta", id: "Virtual Office Jakarta Utara", cn: "虚拟办公室 - 北雅加达" },
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
      title: { en: "Virtual Office Tangerang Regency", id: "Virtual Office Kabupaten Tangerang", cn: "虚拟办公室 - 唐格朗县" },
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
  ]

  const ctaText = { 
    en: "Establish Your Business Presence", 
    id: "Wujudkan Kehadiran Bisnis Anda",
    cn: "确立您的企业商业形象",
  }
  const ctaDescription = { 
    en: "Get a professional business address in prime locations without the overhead costs", 
    id: "Dapatkan alamat bisnis profesional di lokasi strategis tanpa biaya overhead",
    cn: "在黄金地段获得专业的商业注册地址，无需高额的实体办公室运营成本",
  }

  return (
    <BaseServicePage
      icon={MapPin}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
    />
  )
}
