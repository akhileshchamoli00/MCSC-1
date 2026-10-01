import { CatalogServiceItem, LocalizedServiceContent } from "@/contexts/cart-context";

export const TOP_CATALOG_SERVICES: CatalogServiceItem[] = [
  {
    id: "L004",
    title: "Foreign Investment Company (PT PMA) Incorporation",
    category: "entity-setup",
    categoryLabel: "Entity Setup",
    basePrice: 11100000,
    priceFormatted: "Rp 11,100,000",
    timeline: "7 - 10 Business Days",
    popular: true,
    description: "Complete turnkey incorporation package for foreign-owned companies in Indonesia (PT PMA), including BKPM approval and single business number.",
    deliverables: [
      "Notarial Deed of Establishment (Akta Pendirian)",
      "Ministry of Law Approval & Legalization (SK Kemenkumham)",
      "Tax Identification Number (NPWP Perusahaan) & SKT",
      "OSS-RBA Business Identification Number (NIB)",
      "Standard Articles of Association & Corporate Compliance Guide"
    ],
    translations: {
      id: {
        title: "Pendirian Perusahaan Penanaman Modal Asing (PT PMA)",
        categoryLabel: "Pendirian Badan Usaha",
        timeline: "7 - 10 Hari Kerja",
        description: "Paket lengkap pendirian perusahaan PMA di Indonesia, termasuk persetujuan BKPM dan NIB izin usaha OSS-RBA.",
        deliverables: [
          "Akta Notaris Pendirian PT PMA (Akta Pendirian)",
          "SK Pengesahan Badan Hukum Kemenkumham",
          "NPWP Badan Usaha & SKT Terdaftar Pajak",
          "Nomor Induk Berusaha (NIB) OSS-RBA",
          "Anggaran Dasar Standar & Panduan Kepatuhan Korporasi"
        ]
      },
      cn: {
        title: "外商独资/合资公司（PT PMA）设立全套套餐",
        categoryLabel: "企业设立与注册",
        timeline: "7 - 10 个工作日",
        description: "为外国投资者在印尼设立外资企业（PT PMA）提供的一站式设立服务，涵盖投资协调委员会（BKPM）及单一商业执照（NIB）。",
        deliverables: [
          "执业公证人设立公证书（Akta Pendirian）",
          "印尼司法部官方合法法团批文（SK Kemenkumham）",
          "企业税务识别号（NPWP）及税务登记证明（SKT）",
          "OSS-RBA 官方单一商业执照（NIB）",
          "公司标准章程及法定合规指引"
        ]
      }
    }
  },
  {
    id: "L002-A",
    title: "Domestic Limited Liability Company (PT PMDN) Establishment – authorized capital up to IDR 25 million",
    category: "entity-setup",
    categoryLabel: "Entity Setup",
    basePrice: 2300000,
    priceFormatted: "Rp 2,300,000",
    timeline: "5 - 7 Business Days",
    popular: true,
    description: "Establishment package for Domestic Limited Liability Company (PT PMDN) with authorized capital up to IDR 25 million.",
    deliverables: [
      "Deed of Establishment",
      "Ministerial Decree approving legal-entity status",
      "Company Taxpayer Identification Number",
      "Business Identification Number (low-risk activities)",
      "Company Coretax access",
      "Tax Registration Certificate, if issued",
      "State Gazette publication evidence"
    ],
    translations: {
      id: {
        title: "Pendirian Perseroan Terbatas (PT PMDN) – Modal Dasar s.d. Rp 25 Juta",
        categoryLabel: "Pendirian Badan Usaha",
        timeline: "5 - 7 Hari Kerja",
        description: "Paket pendirian PT PMDN skala mikro dengan modal dasar sampai dengan Rp 25.000.000.",
        deliverables: [
          "Akta Pendirian Notaris",
          "Keputusan Menteri pengesahan status badan hukum",
          "Nomor Pokok Wajib Pajak (NPWP) Perusahaan",
          "Nomor Induk Berusaha (NIB kegiatan risiko rendah)",
          "Akses Coretax Perusahaan",
          "Surat Keterangan Terdaftar (SKT) Pajak, jika terbit",
          "Bukti pengumuman Berita Negara Republik Indonesia"
        ]
      },
      cn: {
        title: "印尼本土有限责任公司（PT PMDN）设立 – 注册资本 2500 万印尼盾以内",
        categoryLabel: "企业设立与注册",
        timeline: "5 - 7 个工作日",
        description: "适用于微型企业的本土有限责任公司（PT PMDN）全套设立套餐（法定资本最高 2500 万印尼盾）。",
        deliverables: [
          "公证处设立公证契约（Deed of Establishment）",
          "司法部法人资格批准令（Ministerial Decree）",
          "企业纳税人识别号（NPWP）",
          "单一商业识别号（NIB 低风险类目）",
          "国家税务总局 Coretax 账户权限",
          "税务登记证明（SKT，如出具）",
          "国家公报刊登备案凭据"
        ]
      }
    }
  },
  {
    id: "L002-B",
    title: "Domestic Limited Liability Company (PT PMDN) Establishment – authorized capital above IDR 25 million up to IDR 1 billion",
    category: "entity-setup",
    categoryLabel: "Entity Setup",
    basePrice: 2600000,
    priceFormatted: "Rp 2,600,000",
    timeline: "5 - 7 Business Days",
    popular: true,
    description: "Establishment package for Domestic Limited Liability Company (PT PMDN) with authorized capital above IDR 25 million up to IDR 1 billion.",
    deliverables: [
      "Deed of Establishment",
      "Ministerial Decree approving legal-entity status",
      "Company Taxpayer Identification Number",
      "Business Identification Number (low-risk activities)",
      "Company Coretax access",
      "Tax Registration Certificate, if issued",
      "State Gazette publication evidence"
    ],
    translations: {
      id: {
        title: "Pendirian Perseroan Terbatas (PT PMDN) – Modal Dasar di atas Rp 25 Juta s.d. Rp 1 Miliar",
        categoryLabel: "Pendirian Badan Usaha",
        timeline: "5 - 7 Hari Kerja",
        description: "Paket pendirian PT PMDN skala kecil hingga menengah dengan modal dasar Rp 25.000.000 hingga Rp 1.000.000.000.",
        deliverables: [
          "Akta Pendirian Notaris",
          "Keputusan Menteri pengesahan status badan hukum",
          "Nomor Pokok Wajib Pajak (NPWP) Perusahaan",
          "Nomor Induk Berusaha (NIB kegiatan risiko rendah)",
          "Akses Coretax Perusahaan",
          "Surat Keterangan Terdaftar (SKT) Pajak, jika terbit",
          "Bukti pengumuman Berita Negara Republik Indonesia"
        ]
      },
      cn: {
        title: "印尼本土有限责任公司（PT PMDN）设立 – 注册资本 2500 万至 10 亿印尼盾",
        categoryLabel: "企业设立与注册",
        timeline: "5 - 7 个工作日",
        description: "适用于中小企业的本土有限责任公司（PT PMDN）全套设立套餐（法定资本 2500 万至 10 亿印尼盾）。",
        deliverables: [
          "公证处设立公证契约（Deed of Establishment）",
          "司法部法人资格批准令（Ministerial Decree）",
          "企业纳税人识别号（NPWP）",
          "单一商业识别号（NIB 低风险类目）",
          "国家税务总局 Coretax 账户权限",
          "税务登记证明（SKT，如出具）",
          "国家公报刊登备案凭据"
        ]
      }
    }
  },
  {
    id: "L002-C",
    title: "Domestic Limited Liability Company (PT PMDN) Establishment – authorized capital above IDR 1 billion",
    category: "entity-setup",
    categoryLabel: "Entity Setup",
    basePrice: 3500000,
    priceFormatted: "Rp 3,500,000",
    timeline: "5 - 7 Business Days",
    popular: false,
    description: "Establishment package for Domestic Limited Liability Company (PT PMDN) with authorized capital above IDR 1 billion.",
    deliverables: [
      "Deed of Establishment",
      "Ministerial Decree approving legal-entity status",
      "Company Taxpayer Identification Number",
      "Business Identification Number (low-risk activities)",
      "Company Coretax access",
      "Tax Registration Certificate, if issued",
      "State Gazette publication evidence"
    ],
    translations: {
      id: {
        title: "Pendirian Perseroan Terbatas (PT PMDN) – Modal Dasar di atas Rp 1 Miliar",
        categoryLabel: "Pendirian Badan Usaha",
        timeline: "5 - 7 Hari Kerja",
        description: "Paket pendirian PT PMDN skala menengah hingga besar dengan modal dasar di atas Rp 1.000.000.000.",
        deliverables: [
          "Akta Pendirian Notaris",
          "Keputusan Menteri pengesahan status badan hukum",
          "Nomor Pokok Wajib Pajak (NPWP) Perusahaan",
          "Nomor Induk Berusaha (NIB kegiatan risiko rendah)",
          "Akses Coretax Perusahaan",
          "Surat Keterangan Terdaftar (SKT) Pajak, jika terbit",
          "Bukti pengumuman Berita Negara Republik Indonesia"
        ]
      },
      cn: {
        title: "印尼本土有限责任公司（PT PMDN）设立 – 注册资本超过 10 亿印尼盾",
        categoryLabel: "企业设立与注册",
        timeline: "5 - 7 个工作日",
        description: "适用于中大型规模企业的本土有限责任公司（PT PMDN）全套设立套餐（法定资本高于 10 亿印尼盾）。",
        deliverables: [
          "公证处设立公证契约（Deed of Establishment）",
          "司法部法人资格批准令（Ministerial Decree）",
          "企业纳税人识别号（NPWP）",
          "单一商业识别号（NIB 低风险类目）",
          "国家税务总局 Coretax 账户权限",
          "税务登记证明（SKT，如出具）",
          "国家公报刊登备案凭据"
        ]
      }
    }
  },
  {
    id: "L006",
    title: "Individual Company (PT Perorangan) Incorporation",
    category: "entity-setup",
    categoryLabel: "Entity Setup",
    basePrice: 1500000,
    priceFormatted: "Rp 1,500,000",
    timeline: "2 - 3 Business Days",
    popular: false,
    description: "Simplified single-founder legal entity tailored for micro and small businesses under the Indonesian Job Creation Law.",
    deliverables: [
      "Official AHU Statement of Establishment Certificate",
      "KBLI Business Activity Classification Assignment",
      "Electronic NIB via OSS-RBA System",
      "Corporate NPWP & Tax Office Registration"
    ],
    translations: {
      id: {
        title: "Pendirian PT Perorangan (Usaha Mikro & Kecil)",
        categoryLabel: "Pendirian Badan Usaha",
        timeline: "2 - 3 Hari Kerja",
        description: "Badan hukum perseroan pendiri tunggal khusus usaha mikro dan kecil sesuai UU Cipta Kerja.",
        deliverables: [
          "Sertifikat Pernyataan Pendirian Resmi AHU Kemenkumham",
          "Penetapan Klasifikasi Lapangan Usaha KBLI 5 Digit",
          "NIB Elektronik melalui Sistem OSS-RBA",
          "NPWP Badan Usaha & Pendaftaran Kantor Pajak"
        ]
      },
      cn: {
        title: "印尼一人有限责任公司（PT Perorangan）设立",
        categoryLabel: "企业设立与注册",
        timeline: "2 - 3 个工作日",
        description: "根据印尼《创造就业法》针对微型和小型企业量身定制的单一股东/创始人法团。",
        deliverables: [
          "司法部 AHU 官方设立声明证书",
          "5位 KBLI 商业活动分类指定",
          "OSS-RBA 电子单一商业执照（NIB）",
          "企业 NPWP 税务登记与税务局备案"
        ]
      }
    }
  },
  {
    id: "L005",
    title: "Commanditaire Vennootschap (CV) Establishment",
    category: "entity-setup",
    categoryLabel: "Entity Setup",
    basePrice: 3500000,
    priceFormatted: "Rp 3,500,000",
    timeline: "3 - 5 Business Days",
    popular: false,
    description: "Partnership business entity establishment (Active and Passive partners) without minimum authorized share capital requirements.",
    deliverables: [
      "Notarial Partnership Deed (Akta Pendirian CV)",
      "Ministry of Law Legal Entity Certificate (SK AHU)",
      "Company Tax Number (NPWP) & Tax Office Filing",
      "NIB Registration on OSS-RBA Portal"
    ],
    translations: {
      id: {
        title: "Pendirian Commanditaire Vennootschap (CV)",
        categoryLabel: "Pendirian Badan Usaha",
        timeline: "3 - 5 Hari Kerja",
        description: "Pendirian persekutuan komanditer (sekutu aktif & pasif) tanpa syarat modal setor minimum.",
        deliverables: [
          "Akta Notaris Pendirian Persekutuan CV",
          "Surat Keterangan Terdaftar (SK AHU) Kemenkumham",
          "NPWP Badan Usaha & Pendaftaran Kantor Pajak",
          "Registrasi NIB pada Portal OSS-RBA"
        ]
      },
      cn: {
        title: "印尼两合公司 / 商业合伙企业（CV）设立",
        categoryLabel: "企业设立与注册",
        timeline: "3 - 5 个工作日",
        description: "设立合伙制商业实体（无限责任普通合伙人与有限责任合伙人），无最低实收资本要求。",
        deliverables: [
          "公证处合伙设立契约（Akta CV）",
          "司法部 AHU 登记批准函",
          "企业纳税人识别号（NPWP）",
          "OSS-RBA 系统企业 NIB 执照"
        ]
      }
    }
  },
  {
    id: "L007",
    title: "Shareholders Meeting Resolution (RUPS Tanpa Audit)",
    category: "corporate-legal",
    categoryLabel: "Corporate Legal",
    basePrice: 3500000,
    priceFormatted: "Rp 3,500,000",
    timeline: "3 - 5 Business Days",
    popular: true,
    description: "General Meeting of Shareholders legal drafting and notarial minutes for companies not requiring statutory public auditing.",
    deliverables: [
      "Official Minutes of Shareholders Meeting (Risalah RUPS)",
      "Notarial Statement of Meeting Resolution (Akta Pernyataan Keputusan RUPS)",
      "Ministry of Law AHU Notification Receipt / Acceptance Letter",
      "Updated Company Legal Database Record"
    ],
    translations: {
      id: {
        title: "Keputusan RUPS Perusahaan (RUPS Tanpa Audit)",
        categoryLabel: "Akta Korporasi & RUPS",
        timeline: "3 - 5 Hari Kerja",
        description: "Penyusunan risalah dan akta notaris RUPS untuk perseroan yang tidak diwajibkan audit publik undang-undang.",
        deliverables: [
          "Risalah Resmi Rapat Umum Pemegang Saham (RUPS)",
          "Akta Pernyataan Keputusan RUPS (PKR) oleh Notaris",
          "Surat Penerimaan Pemberitahuan Perubahan AHU Kemenkumham",
          "Pembaruan Data Legal Perusahaan di Database AHU"
        ]
      },
      cn: {
        title: "股东大会决议公证（RUPS 无需法定审计类）",
        categoryLabel: "公司章程与股东决议",
        timeline: "3 - 5 个工作日",
        description: "为无需根据法规进行法定公开财务审计的公司起草并公证股东大会（RUPS）决议纪要与章程变更。",
        deliverables: [
          "正式股东大会会议纪要（Risalah RUPS）",
          "公证处股东大会决议声明契约（Akta PKR）",
          "司法部 AHU 变更备案接收函 / 批准凭据",
          "公司法定档案数据库更新凭证"
        ]
      }
    }
  },
  {
    id: "L008",
    title: "Shareholders Meeting Resolution (RUPS Wajib Audit)",
    category: "corporate-legal",
    categoryLabel: "Corporate Legal",
    basePrice: 5000000,
    priceFormatted: "Rp 5,000,000",
    timeline: "5 - 7 Business Days",
    popular: false,
    description: "Specialized GMS documentation and notarization for companies subject to statutory financial audit or medium/large capital regulations.",
    deliverables: [
      "Audit Review Alignment & RUPS Minutes Drafting",
      "Notarial Deed of Annual / Extraordinary GMS Resolution",
      "Formal Ministry of Law (Kemenkumham) AHU Approval Submission",
      "Official AHU Approval Confirmation Decree"
    ],
    translations: {
      id: {
        title: "Keputusan RUPS Perusahaan (RUPS Wajib Audit)",
        categoryLabel: "Akta Korporasi & RUPS",
        timeline: "5 - 7 Hari Kerja",
        description: "Dokumentasi dan notarisasi RUPS khusus untuk perseroan dengan kewajiban audit laporan keuangan atau skala modal tertentu.",
        deliverables: [
          "Penyelarasan Review Audit & Drafting Risalah RUPS",
          "Akta Notaris Keputusan RUPS Tahunan / Luar Biasa",
          "Pengajuan Pengesahan AHU Kemenkumham Resmi",
          "SK Persetujuan Perubahan Anggaran Dasar dari Kemenkumham"
        ]
      },
      cn: {
        title: "股东大会决议公证（RUPS 须法定审计类）",
        categoryLabel: "公司章程与股东决议",
        timeline: "5 - 7 个工作日",
        description: "适用于受法定财务审计监管或具有中大型实收资本规模公司的股东大会决议起草与公证备案。",
        deliverables: [
          "审计审核协调及股东大会纪要起草",
          "年度 / 临时股东大会决议公证契约",
          "向印尼司法部（Kemenkumham）提交正式批准申请",
          "司法部 AHU 批准法令正式批文"
        ]
      }
    }
  },
  {
    id: "A001",
    title: "Articles of Association Amendment (Akta Perubahan AD/ART)",
    category: "corporate-legal",
    categoryLabel: "Corporate Legal",
    basePrice: 4500000,
    priceFormatted: "Rp 4,500,000",
    timeline: "4 - 6 Business Days",
    popular: true,
    description: "Legal restructuring of corporate deeds covering changes of Board of Directors, Commissioners, share ownership transfer, or capital increases.",
    deliverables: [
      "Notarial Deed of Articles Amendment (Akta Perubahan)",
      "Ministry of Law AHU Filing & Legal Receipt (Penerimaan Pemberitahuan AHU)",
      "Updated Company Ownership & Board Structure Certificate",
      "OSS-RBA Profile Synchronization Guidance"
    ],
    translations: {
      id: {
        title: "Perubahan Anggaran Dasar Perseroan (Akta Perubahan AD/ART)",
        categoryLabel: "Akta Korporasi & RUPS",
        timeline: "4 - 6 Hari Kerja",
        description: "Restrukturisasi legal akta perseroan meliputi perubahan Direksi, Komisaris, pengalihan saham, atau penambahan modal.",
        deliverables: [
          "Akta Notaris Perubahan Anggaran Dasar",
          "Bukti Penerimaan Pemberitahuan Perubahan AHU Kemenkumham",
          "Sertifikat Pembaruan Struktur Direksi & Kepemilikan Saham",
          "Panduan Sinkronisasi Profil Usaha pada Sistem OSS-RBA"
        ]
      },
      cn: {
        title: "公司章程变更公证契约（Akta Perubahan AD/ART）",
        categoryLabel: "公司章程与股东决议",
        timeline: "4 - 6 个工作日",
        description: "涵盖董事会、监事会变更、股权转让、注册资本增减或公司名称地址变更的法律重组公证服务。",
        deliverables: [
          "公证处公司章程修正契约（Akta Perubahan）",
          "印尼司法部 AHU 备案接收函及批准文书",
          "更新后的公司股权及董事会架构证书",
          "OSS-RBA 官方系统企业资料同步指引"
        ]
      }
    }
  },
  {
    id: "C001",
    title: "OSS-RBA Business Identification Number (Update NIB)",
    category: "licensing",
    categoryLabel: "Licensing",
    basePrice: 1000000,
    priceFormatted: "Rp 1,000,000",
    timeline: "2 - 4 Business Days",
    popular: true,
    description: "Update and synchronization of company business scope, new KBLI 5-digit classifications, or branch office addresses on OSS-RBA.",
    deliverables: [
      "Updated Electronic Business Identification Number (NIB)",
      "Verified KBLI 5-Digit Risk-Based Activity Alignment",
      "Standard Certificate / Basic Environmental Verification Review",
      "Official OSS Portal Download & System Certificate"
    ],
    translations: {
      id: {
        title: "Pembaruan NIB Berbasis Risiko (Update NIB OSS-RBA)",
        categoryLabel: "Perizinan & NIB",
        timeline: "2 - 4 Hari Kerja",
        description: "Pembaruan dan sinkronisasi bidang usaha, penambahan klasifikasi KBLI 5 digit baru, atau alamat cabang di OSS-RBA.",
        deliverables: [
          "Nomor Induk Berusaha (NIB) Elektronik Terbaru",
          "Penyelarasan Klasifikasi KBLI 5 Digit Berbasis Risiko",
          "Verifikasi Sertifikat Standar / Lingkungan Dasar",
          "Dokumen Cetak & Sertifikat Resmi dari Portal OSS"
        ]
      },
      cn: {
        title: "OSS-RBA 单一商业识别号（NIB 执照更新与类目增项）",
        categoryLabel: "商业许可与NIB",
        timeline: "2 - 4 个工作日",
        description: "在 OSS-RBA 官方平台更新和同步公司经营范围、新增5位 KBLI 行业分类或分支机构地址。",
        deliverables: [
          "更新后的电子单一商业登记证（NIB）",
          "已核验的5位 KBLI 风险分级行业分类备案",
          "标准证书及基本环境承诺备案核验",
          "OSS 官方系统全套营业许可文件下载与交付"
        ]
      }
    }
  },
  {
    id: "C008",
    title: "Ministry of Law Portal Correction (Perbaikan Data AHU)",
    category: "corporate-legal",
    categoryLabel: "Corporate Legal",
    basePrice: 850000,
    priceFormatted: "Rp 850,000",
    timeline: "2 - 3 Business Days",
    popular: false,
    description: "Official administrative correction and rectification of typo errors, NIK/Passport mismatch, or share counts on the AHU Online database.",
    deliverables: [
      "AHU Online System Verification & Case Submission",
      "Ministry of Law Data Synchronization Confirmation",
      "Updated Official AHU Legal Database Extract",
      "Zero-downtime Legal Entity Status Verification"
    ],
    translations: {
      id: {
        title: "Koreksi & Sinkronisasi Data Portal Kemenkumham (AHU Online)",
        categoryLabel: "Akta Korporasi & RUPS",
        timeline: "2 - 3 Hari Kerja",
        description: "Perbaikan administratif resmi untuk kesalahan ketik nama, ketidaksesuaian NIK/Paspor, atau komposisi saham di AHU.",
        deliverables: [
          "Verifikasi Sistem AHU Online & Pengajuan Berkas Kasus",
          "Konfirmasi Sinkronisasi Data dari Kemenkumham",
          "Ekstrak Database Legal Resmi AHU Terbaru",
          "Verifikasi Status Badan Hukum Aktif Tanpa Downtime"
        ]
      },
      cn: {
        title: "印尼司法部 AHU 官方系统数据更正与信息勘误",
        categoryLabel: "公司章程与股东决议",
        timeline: "2 - 3 个工作日",
        description: "对 AHU Online 数据库中的拼写错误、证件号/护照号不匹配或股份数量差异进行官方行政修正。",
        deliverables: [
          "AHU Online 系统合规审查与更正申请呈报",
          "司法部数据同步与修正确认记录",
          "最新官方 AHU 法定法人数据库摘要凭据",
          "保障企业法人经营资格与执照有效性"
        ]
      }
    }
  },
  {
    id: "C006",
    title: "Corporate Tax ID Data Update (Perubahan Data NPWP)",
    category: "tax-compliance",
    categoryLabel: "Tax & Compliance",
    basePrice: 750000,
    priceFormatted: "Rp 750,000",
    timeline: "3 - 5 Business Days",
    popular: false,
    description: "Filing and updating of corporate registered domicile, primary contact person, or legal representative with the Tax Office (KPP).",
    deliverables: [
      "Tax Office Formal Amendment Form Submission",
      "Updated Electronic NPWP Certificate & Taxpayer Master File (SKT)",
      "DJP Online Account Profile Synchronization",
      "Official Tax Office Receipt / Evidence of Delivery"
    ],
    translations: {
      id: {
        title: "Pembaruan Data NPWP Badan Usaha (Perubahan Data Perpajakan)",
        categoryLabel: "Pajak & Kepatuhan",
        timeline: "3 - 5 Hari Kerja",
        description: "Pengajuan dan perubahan domisili terdaftar perusahaan, kontak penanggung jawab, atau wakil hukum di KPP.",
        deliverables: [
          "Pengajuan Formulir Resmi Perubahan Data ke Kantor Pajak",
          "Kartu NPWP Elektronik Terbaru & Surat Keterangan Terdaftar (SKT)",
          "Sinkronisasi Profil Akun DJP Online Perusahaan",
          "Bukti Tanda Terima Resmi dari Kantor Pelayanan Pajak (KPP)"
        ]
      },
      cn: {
        title: "企业税务登记号（NPWP）资料变更与税务局备案",
        categoryLabel: "税务与合规",
        timeline: "3 - 5 个工作日",
        description: "向主管税务局（KPP）申报并变更企业注册地址、法定代表人或主联络人税务档案。",
        deliverables: [
          "向主管税务局提交官方税务变更申报表",
          "更新后的电子 NPWP 税卡及纳税人登记证明（SKT）",
          "DJP Online 税务系统企业账户信息同步",
          "主管税务局出具的正式受理回执"
        ]
      }
    }
  },
  {
    id: "C002",
    title: "Investment Activity Report Filing (Pelaporan LKPM)",
    category: "tax-compliance",
    categoryLabel: "Tax & Compliance",
    basePrice: 500000,
    priceFormatted: "Rp 500,000",
    timeline: "2 - 3 Business Days",
    popular: true,
    description: "Mandatory quarterly (for PMA) or semester investment capital realization report preparation and submission on the BKPM OSS portal.",
    deliverables: [
      "Realized Investment Expenditure & Workforce Audit",
      "BKPM OSS-RBA LKPM Online Filing & Validation",
      "Official BKPM LKPM Submission Receipt (Bukti Tanda Terima)",
      "Compliance Risk Review to prevent OSS license revocation"
    ],
    translations: {
      id: {
        title: "Pelaporan LKPM Triwulanan / Semesteran (OSS BKPM)",
        categoryLabel: "Pajak & Kepatuhan",
        timeline: "2 - 3 Hari Kerja",
        description: "Penyusunan dan pelaporan realisasi modal investasi wajib kuartalan (PT PMA) atau semesteran di portal OSS BKPM.",
        deliverables: [
          "Audit Realisasi Investasi Modal & Penyerapan Tenaga Kerja",
          "Pelaporan & Validasi Online LKPM pada OSS-RBA BKPM",
          "Bukti Tanda Terima Resmi Pengesahan LKPM BKPM",
          "Tinjauan Kepatuhan untuk Mencegah Pencabutan Izin OSS"
        ]
      },
      cn: {
        title: "印尼投资活动报告申报（LKPM 季报 / 半年报 OSS BKPM）",
        categoryLabel: "税务与合规",
        timeline: "2 - 3 个工作日",
        description: "在 BKPM OSS 门户网站编制并提报强制性季度（外资 PMA）或半年度资本投资落实报告。",
        deliverables: [
          "已落实投资支出核算及本地/外籍用工统计",
          "BKPM OSS-RBA 系统 LKPM 在线申报与数据核验",
          "BKPM 官方出具的 LKPM 申报回执单（Bukti Penerimaan）",
          "合规风险审查，防止 OSS 商业执照被暂停或吊销"
        ]
      }
    }
  },
  {
    id: "D002",
    title: "BPJS Manpower Corporate Registration (BPJS Ketenagakerjaan)",
    category: "employment",
    categoryLabel: "Employment",
    basePrice: 750000,
    priceFormatted: "Rp 750,000",
    timeline: "2 - 4 Business Days",
    popular: false,
    description: "Corporate enrollment in mandatory state employment security programs (JKK, JKM, JHT, JP) ensuring compliance with Indonesian labor law.",
    deliverables: [
      "Corporate BPJS Ketenagakerjaan Master Account Registration",
      "Company Entity Registration Number (Nomor Pendaftaran Perusahaan - NPP)",
      "Electronic Membership Certificate (Sertifikat Kepesertaan)",
      "EPS Onboarding Guide for monthly contribution reporting"
    ],
    translations: {
      id: {
        title: "Pendaftaran BPJS Ketenagakerjaan Perusahaan",
        categoryLabel: "Ketenagakerjaan & BPJS",
        timeline: "2 - 4 Hari Kerja",
        description: "Pendaftaran perusahaan dalam program jaminan sosial ketenagakerjaan (JKK, JKM, JHT, JP) sesuai ketentuan ketenagakerjaan RI.",
        deliverables: [
          "Registrasi Akun Induk Perusahaan di BPJS Ketenagakerjaan",
          "Nomor Pendaftaran Perusahaan (NPP Resmi)",
          "Sertifikat Kepesertaan Elektronik Badan Usaha",
          "Panduan Onboarding Sistem EPS untuk Pelaporan Iuran Bulanan"
        ]
      },
      cn: {
        title: "印尼企业员工劳动保险开户（BPJS Ketenagakerjaan）",
        categoryLabel: "劳工与BPJS社保",
        timeline: "2 - 4 个工作日",
        description: "办理企业法定工伤、身故、养老及退休金国家社会保障项目开户，确保符合印尼劳动法规。",
        deliverables: [
          "企业 BPJS 劳工社保主账户设立",
          "官方企业注册编码（NPP 号码）",
          "企业电子参保资格证书（Sertifikat Kepesertaan）",
          "EPS 月度申报缴纳系统操作指导与协助"
        ]
      }
    }
  },
  {
    id: "W006",
    title: "Director / Commissioner Working KITAS (1 Year)",
    category: "immigration",
    categoryLabel: "Immigration",
    basePrice: 7000000,
    priceFormatted: "Rp 7,000,000",
    timeline: "10 - 14 Business Days",
    popular: true,
    description: "Comprehensive work and residence permit processing for foreign directors and commissioners holding active corporate appointments.",
    deliverables: [
      "Ministry of Manpower RPTKA Endorsement Verification",
      "Electronic Working Visa (e-Visa Index C312 / E23) Issuance",
      "Immigration Office Biometric Appointment Assistance",
      "Official Electronic Limited Stay Permit (e-KITAS) Card (1 Year)"
    ],
    translations: {
      id: {
        title: "Pengurusan KITAS Kerja Direktur / Komisaris (1 Tahun)",
        categoryLabel: "Imigrasi & KITAS",
        timeline: "10 - 14 Hari Kerja",
        description: "Pengurusan izin kerja dan izin tinggal terbatas komprehensif bagi direktur atau komisaris WNA yang aktif menjabat.",
        deliverables: [
          "Verifikasi Pengesahan RPTKA Kementerian Ketenagakerjaan",
          "Penerbitan Visa Kerja Elektronik (e-Visa Indeks C312 / E23)",
          "Pendampingan Janji Temu Biometrik di Kantor Imigrasi",
          "Kartu Izin Tinggal Terbatas Elektronik (e-KITAS) Resmi 1 Tahun"
        ]
      },
      cn: {
        title: "外籍董事 / 监事工作居留签证（1年期工作 KITAS）",
        categoryLabel: "移民与KITAS签证",
        timeline: "10 - 14 个工作日",
        description: "为在印尼公司担任外籍董事或监事的高管办理全套外籍劳工聘用审批、工作签证与居留许可。",
        deliverables: [
          "劳工部 RPTKA 外籍劳工聘用规划批准函",
          "印尼移民局电子工作签证（e-Visa 索引 C312 / E23）批复",
          "移民局拍照录指纹生物信息预约与现场协助",
          "官方电子居留许可证（e-KITAS）卡（1年有效期）"
        ]
      }
    }
  },
  {
    id: "W008",
    title: "Investor KITAS Permit (2 Years - Min. 10M Shares)",
    category: "immigration",
    categoryLabel: "Immigration",
    basePrice: 7000000,
    priceFormatted: "Rp 7,000,000",
    timeline: "10 - 14 Business Days",
    popular: true,
    description: "2-Year multi-entry residence permit for foreign shareholders investing at least Rp 10 Billion in PMA shares, exempt from DPKK work levy.",
    deliverables: [
      "BKPM Investment & Shareholding Qualification Verification",
      "Electronic Investor Visa (Index E28A / C313 / C314) Issuance",
      "Immigration Office Biometrics Coordination & Representation",
      "2-Year Multi-Entry Electronic Limited Stay Permit (e-KITAS)"
    ],
    translations: {
      id: {
        title: "Izin Tinggal Terbatas Investor KITAS (2 Tahun - Min. Saham 10M)",
        categoryLabel: "Imigrasi & KITAS",
        timeline: "10 - 14 Hari Kerja",
        description: "Izin tinggal multi-entry 2 tahun bagi pemegang saham PMA asing dengan kepemilikan minimal Rp 10 Miliar, bebas iuran DPKK.",
        deliverables: [
          "Verifikasi Kualifikasi Saham & Investasi BKPM",
          "Penerbitan Visa Investor Elektronik (Indeks E28A / C313 / C314)",
          "Koordinasi & Pendampingan Biometrik di Kantor Imigrasi",
          "Kartu e-KITAS Investor Multi-Entry Resmi 2 Tahun"
        ]
      },
      cn: {
        title: "外籍投资者长期居留许可（2年期投资人 KITAS）",
        categoryLabel: "移民与KITAS签证",
        timeline: "10 - 14 个工作日",
        description: "针对持有外资公司（PT PMA）股份达 100 亿印尼盾以上的外国股东设立的两年多次往返居留签证，免缴 DPKK 劳工外税。",
        deliverables: [
          "BKPM 股权及投资资质合规核查证明",
          "电子投资者居留签证（索引 E28A / C313 / C314）",
          "移民局生物信息录入全程协调与陪同",
          "官方2年多次往返电子居留许可卡（e-KITAS）"
        ]
      }
    }
  },
  {
    id: "A012",
    title: "Full Company Dissolution & Liquidation (Akta Penutupan 3 Tahap)",
    category: "corporate-legal",
    categoryLabel: "Corporate Legal",
    basePrice: 15000000,
    priceFormatted: "Rp 15,000,000",
    timeline: "60 - 90 Business Days",
    popular: false,
    description: "Complete 3-stage statutory corporate dissolution process complying with Indonesian Company Law (UUPT) and tax audit clearances.",
    deliverables: [
      "Stage 1: Dissolution Deed, Liquidator Appointment & Newspaper Notice",
      "Stage 2: Creditor Notice, Tax Clearance (Surat Keterangan Fiskal) & NIB Revocation",
      "Stage 3: Liquidator Discharge & Release (Acquit et de Charge) Deed",
      "Ministry of Law Decree of Legal Entity Status Striking & De-registration"
    ],
    translations: {
      id: {
        title: "Pembubaran & Likuidasi Perseroan Penuh (Akta Penutupan 3 Tahap)",
        categoryLabel: "Akta Korporasi & RUPS",
        timeline: "60 - 90 Hari Kerja",
        description: "Proses pembubaran resmi perseroan 3 tahap sesuai UU Perseroan Terbatas (UUPT) dan penyelesaian audit pajak.",
        deliverables: [
          "Tahap 1: Akta Pembubaran, Penunjukan Likuidator & Pengumuman Koran",
          "Tahap 2: Pemberitahuan Kreditur, SK Fiskal Pajak & Pencabutan NIB",
          "Tahap 3: Akta Pelunasan & Pembebasan Likuidator (Acquit et de Charge)",
          "SK Kemenkumham Pencabutan Status Badan Hukum & Penghapusan Database"
        ]
      },
      cn: {
        title: "公司法定注销与清算全流程（三阶段法定关闭流程）",
        categoryLabel: "公司章程与股东决议",
        timeline: "60 - 90 个工作日",
        description: "严格遵循印尼《公司法》（UUPT）及税务审计清算要求的三个阶段官方公司解散与注销。",
        deliverables: [
          "第一阶段：解散公证书、指定清算人并完成全国报纸公告",
          "第二阶段：债权人申报催告、税务局清税证明（SKF）及撤销 NIB",
          "第三阶段：清算责任解除契约（Acquit et de Charge）",
          "印尼司法部关于撤销法人资格并注销法团登记的正式法令"
        ]
      }
    }
  }
];

export const CATALOG_CATEGORIES = [
  { id: "all", label: "All Services", icon: "LayoutGrid" },
  { id: "entity-setup", label: "Business Establishment", icon: "Building2" },
  { id: "corporate-legal", label: "Corporate Deeds & RUPS", icon: "FileText" },
  { id: "licensing", label: "Licensing & NIB", icon: "Award" },
  { id: "tax-compliance", label: "Tax & Compliance", icon: "Calculator" },
  { id: "immigration", label: "Immigration & KITAS", icon: "Globe" },
  { id: "employment", label: "Employment & BPJS", icon: "Users" },
];

/**
 * Returns localized services for the selected language ('en' | 'id' | 'cn')
 */
export function getLocalizedCatalogServices(lang: string = "en"): CatalogServiceItem[] {
  if (lang !== "id" && lang !== "cn") {
    return TOP_CATALOG_SERVICES;
  }
  const targetLang = lang as "id" | "cn";
  return TOP_CATALOG_SERVICES.map((item) => {
    const loc = item.translations?.[targetLang];
    if (!loc) return item;
    return {
      ...item,
      title: loc.title,
      categoryLabel: loc.categoryLabel,
      timeline: loc.timeline,
      description: loc.description,
      deliverables: loc.deliverables,
    };
  });
}

/**
 * Returns localized category tabs
 */
export function getLocalizedCategories(lang: string = "en") {
  const categoryLabels: Record<string, Record<string, string>> = {
    all: {
      en: "All Services",
      id: "Semua Layanan",
      cn: "全部服务",
    },
    "entity-setup": {
      en: "Business Establishment",
      id: "Pendirian Usaha",
      cn: "企业设立与注册",
    },
    "corporate-legal": {
      en: "Corporate Deeds & RUPS",
      id: "Akta Korporasi & RUPS",
      cn: "公司章程与股东决议",
    },
    licensing: {
      en: "Licensing & NIB",
      id: "Perizinan & NIB",
      cn: "商业许可与NIB",
    },
    "tax-compliance": {
      en: "Tax & Compliance",
      id: "Pajak & Kepatuhan",
      cn: "税务与合规",
    },
    immigration: {
      en: "Immigration & KITAS",
      id: "Imigrasi & KITAS",
      cn: "移民与KITAS签证",
    },
    employment: {
      en: "Employment & BPJS",
      id: "Ketenagakerjaan & BPJS",
      cn: "劳工与BPJS社保",
    },
  };

  const l = (lang === "id" || lang === "cn") ? lang : "en";

  return CATALOG_CATEGORIES.map((cat) => ({
    ...cat,
    label: categoryLabels[cat.id]?.[l] || cat.label,
  }));
}

/**
 * UI Text Translations for the Catalog Page
 */
export const CATALOG_PAGE_TRANSLATIONS = {
  en: {
    heroBadge: "Official Service Catalog & Base Pricing",
    heroTitle: "Corporate Legal & Business Licensing Packages",
    heroDesc: "Browse our most requested Indonesian incorporation, RUPS, OSS-RBA licensing, and KITAS immigration services. Select packages, review exact deliverables, and engage our licensed consultants directly.",
    searchPlaceholder: "Search service by name or code (e.g. PT PMA, RUPS, KITAS)...",
    showingServices: "Showing",
    packagesLabel: "service packages",
    complianceBadge: "Verified Government Domicile & AHU Compliance Included",
    popularBadge: "Popular",
    estTurnaround: "Est. Turnaround:",
    deliverablesHeading: "Package Deliverables:",
    officialBaseRate: "Official Base Rate",
    addToCart: "Add to Cart",
    inCart: "In Cart",
    noServicesTitle: "No matching services found",
    noServicesDesc: "We couldn't find any packages matching your query. Try clearing your query or select All Services.",
    resetFilters: "Reset Filters",
    guarantee1Title: "Official Government Filings",
    guarantee1Desc: "All incorporations, deeds, and licensing documents are executed by licensed Indonesian Notaries and registered on official AHU & OSS portals.",
    guarantee2Title: "Secure Xendit Payment Gateway",
    guarantee2Desc: "Seamless multi-channel checkout supporting Virtual Accounts (BCA, Mandiri, BNI, BRI), QRIS, and International Credit/Debit Cards.",
    guarantee3Title: "Direct Legal Consultant Support",
    guarantee3Desc: "Every order is assigned a designated Corporate Consultant and Reviewer tracking your file to completion. Inquiries: contact@mcsc.co.id.",
    addressLine: "PT Mandiri Cipta Solusi (MCS Consulting) • Springhill Office Tower Lantai 9 Unit 9C, Kemayoran, Jakarta Pusat",
    privacyPolicy: "Privacy Policy",
    termsOfEngagement: "Terms of Engagement",
    floatingCartCount: "service(s) in cart",
    viewCart: "View Cart",
    checkout: "Checkout",
  },
  id: {
    heroBadge: "Katalog Layanan Resmi & Biaya Dasar",
    heroTitle: "Paket Hukum Korporasi & Perizinan Berusaha",
    heroDesc: "Telusuri layanan pendirian perusahaan Indonesia, RUPS, perizinan OSS-RBA, dan imigrasi KITAS yang paling sering dibutuhkan. Pilih paket, tinjau dokumen hasil kerja, dan hubungi konsultan berlisensi kami langsung.",
    searchPlaceholder: "Cari layanan berdasarkan nama atau kode (cth. PT PMA, RUPS, KITAS)...",
    showingServices: "Menampilkan",
    packagesLabel: "paket layanan",
    complianceBadge: "Termasuk Verifikasi Domisili Pemerintah & Kepatuhan AHU Resmi",
    popularBadge: "Populer",
    estTurnaround: "Estimasi Waktu:",
    deliverablesHeading: "Dokumen & Hasil Kerja:",
    officialBaseRate: "Biaya Dasar Resmi",
    addToCart: "Tambah ke Keranjang",
    inCart: "Di Keranjang",
    noServicesTitle: "Layanan Tidak Ditemukan",
    noServicesDesc: "Kami tidak menemukan paket layanan yang cocok dengan pencarian Anda. Coba hapus kata kunci atau pilih Semua Layanan.",
    resetFilters: "Atur Ulang Filter",
    guarantee1Title: "Pendaftaran Resmi Pemerintah",
    guarantee1Desc: "Seluruh pendirian, akta, dan perizinan dikerjakan oleh Notaris Indonesia berlisensi dan terdaftar resmi di portal AHU & OSS.",
    guarantee2Title: "Gerbang Pembayaran Xendit Aman",
    guarantee2Desc: "Pembayaran multi-kanal mudah mendukung Virtual Account (BCA, Mandiri, BNI, BRI), QRIS, dan Kartu Kredit/Debit Internasional.",
    guarantee3Title: "Dukungan Konsultan Hukum Langsung",
    guarantee3Desc: "Setiap pesanan didampingi Konsultan Korporat dan Peninjau berkualifikasi yang memantau berkas hingga tuntas. Kontak: contact@mcsc.co.id.",
    addressLine: "PT Mandiri Cipta Solusi (MCS Consulting) • Springhill Office Tower Lantai 9 Unit 9C, Kemayoran, Jakarta Pusat",
    privacyPolicy: "Kebijakan Privasi",
    termsOfEngagement: "Ketentuan Layanan",
    floatingCartCount: "layanan di keranjang",
    viewCart: "Lihat Keranjang",
    checkout: "Lanjut Pembayaran",
  },
  cn: {
    heroBadge: "官方服务目录与基础价格",
    heroTitle: "企业法律与商业许可服务套餐",
    heroDesc: "浏览我们最热门的印尼公司设立、股东大会决议（RUPS）、OSS-RBA商业许可和KITAS签证居留服务。挑选套餐、查看交付成果清单，并直接对接我们的持牌顾问团队。",
    searchPlaceholder: "按服务名称或代码搜索（例如 PT PMA、RUPS、KITAS）...",
    showingServices: "共显示",
    packagesLabel: "项服务套餐",
    complianceBadge: "包含官方政府注册地址验证及司法部AHU合规备案",
    popularBadge: "热门推荐",
    estTurnaround: "预计办理周期:",
    deliverablesHeading: "服务交付成果清单:",
    officialBaseRate: "官方基础规费",
    addToCart: "加入购物车",
    inCart: "已在购物车",
    noServicesTitle: "未找到匹配的服务套餐",
    noServicesDesc: "未能找到与您的关键词匹配的服务套餐。请尝试清空搜索词或切换至全部服务。",
    resetFilters: "重置筛选条件",
    guarantee1Title: "官方政府登记与公证",
    guarantee1Desc: "所有公司设立、公证契约和许可文件均由印尼执业公证人办理，并在司法部AHU及OSS官方系统依法备案。",
    guarantee2Title: "安全可靠的 Xendit 支付网关",
    guarantee2Desc: "支持多种官方合规支付方式，包含各大银行虚拟账户（BCA、Mandiri、BNI、BRI）、QRIS 二维码及国际信用卡/借记卡。",
    guarantee3Title: "持牌法律顾问专属跟进",
    guarantee3Desc: "每笔订单均配备专属企业顾问与复核专家全流程跟进至完结。咨询邮箱: contact@mcsc.co.id。",
    addressLine: "PT Mandiri Cipta Solusi (MCS Consulting) • Springhill Office Tower 9层 9C室, Kemayoran, Jakarta Pusat",
    privacyPolicy: "隐私政策",
    termsOfEngagement: "服务委托协议",
    floatingCartCount: "项服务在购物车中",
    viewCart: "查看购物车",
    checkout: "立即结算",
  },
};

/**
 * UI Text Translations for Cart Drawer
 */
export const CART_DRAWER_TRANSLATIONS = {
  en: {
    cartTitle: "Service Cart",
    itemsSelected: "service(s) selected for engagement",
    clearAll: "Clear all",
    emptyTitle: "Your cart is empty",
    emptyDesc: "Explore our service catalog to select company incorporation, licensing, or legal packages.",
    browseCatalog: "Browse Service Catalog",
    subtotal: "Subtotal",
    taxLabel: "PPN / VAT (11%)",
    totalAmount: "Total Amount",
    proceedToCheckout: "Proceed to Checkout",
    officialGuarantee: "Official Guarantee",
    secureCheckout: "Secure Xendit Checkout",
  },
  id: {
    cartTitle: "Keranjang Layanan",
    itemsSelected: "layanan dipilih untuk pengurusan",
    clearAll: "Hapus semua",
    emptyTitle: "Keranjang Anda kosong",
    emptyDesc: "Jelajahi katalog layanan kami untuk memilih paket pendirian perusahaan, perizinan, atau akta hukum.",
    browseCatalog: "Lihat Katalog Layanan",
    subtotal: "Subtotal",
    taxLabel: "PPN (11%)",
    totalAmount: "Total Biaya",
    proceedToCheckout: "Lanjutkan ke Checkout",
    officialGuarantee: "Jaminan Resmi",
    secureCheckout: "Checkout Aman Xendit",
  },
  cn: {
    cartTitle: "服务购物车",
    itemsSelected: "项企业服务已选择",
    clearAll: "清空全部",
    emptyTitle: "购物车是空的",
    emptyDesc: "请浏览我们的服务目录，挑选印尼公司设立、商业许可或法律服务套餐。",
    browseCatalog: "浏览服务目录",
    subtotal: "费用小计",
    taxLabel: "印尼增值税 PPN (11%)",
    totalAmount: "合计应付金额",
    proceedToCheckout: "前往安全结算",
    officialGuarantee: "官方资质保障",
    secureCheckout: "Xendit 安全支付",
  },
};

/**
 * UI Text Translations for Checkout Page
 */
export const CHECKOUT_PAGE_TRANSLATIONS = {
  en: {
    backToCatalog: "Back to Catalog",
    stepBadge: "Step 2 of 2: Review & Secure Checkout",
    pageTitle: "Complete Your Service Engagement",
    pageSubtitle: "Provide company details, review statutory requirements, and proceed to verified payment processing via Xendit.",
    emptyCartNotice: "Your cart is currently empty. Please add services from the catalog before proceeding.",
    sec1Title: "1. Client & Entity Information",
    fullName: "Full Name (as in ID/Passport) *",
    fullNamePlaceholder: "e.g. John Doe / Alexander Tan",
    email: "Email Address *",
    emailPlaceholder: "alex@company.com",
    emailSubtext: "Order confirmation, payment receipts, and draft deliverables are sent here.",
    phone: "WhatsApp / Phone Number *",
    phonePlaceholder: "+62 812 3456 7890",
    phoneSubtext: "Our corporate consultant will contact you via WhatsApp upon payment.",
    companyName: "Company / Proposed Entity Name",
    companyNamePlaceholder: "e.g. PT Nusantara Digital Solusi",
    city: "Target Domicile / City",
    notes: "Special Instructions / Existing Legal Documents (Optional)",
    notesPlaceholder: "Share existing NIB number, shareholder count, specific KBLI codes, or deadline constraints...",
    sec2Title: "2. Payment Method",
    sec2Subtitle: "Select your preferred payment channel powered by Xendit Secure Gateway",
    methodVa: "Virtual Account (VA)",
    methodVaDesc: "Instant automated confirmation via BCA, Mandiri, BNI, BRI, Permata",
    methodQris: "QRIS",
    methodQrisDesc: "Instant QR payment via GoPay, OVO, Dana, ShopeePay, or Mobile Banking",
    methodCard: "Credit / Debit Card",
    methodCardDesc: "Visa, Mastercard, JCB with 3D-Secure 256-bit encryption",
    methodManual: "Corporate Bank Transfer",
    methodManualDesc: "Direct bank wire to PT Mandiri Cipta Solusi corporate account",
    sec3Title: "Order Summary",
    subtotal: "Subtotal",
    tax: "PPN / VAT (11%)",
    taxSub: "Statutory Tax",
    totalDue: "Total Amount Due",
    term1: "I confirm the accuracy of the provided company information and agree to the Terms of Service & Privacy Policy.",
    term2: "I acknowledge that government processing fees and notary registrations are initiated upon payment confirmation.",
    payNowBtn: "Pay Now via Secure Gateway",
    processingBtn: "Connecting to Secure Gateway...",
    trustGuarantee: "Official Indonesian Legal Services Guarantee",
    trustGuaranteeDesc: "All services are carried out strictly in accordance with Indonesian Commercial Law (UUPT) and BKPM / OSS-RBA regulations.",
    thankYouTitle: "Payment Instructions & Order Confirmed",
    thankYouSubtitle: "Your service engagement has been registered. Complete payment below to begin processing.",
    orderNumber: "Order Reference",
    orderDate: "Date",
    amountToPay: "Amount to Pay",
    vaNumberLabel: "Virtual Account Number",
    copyBtn: "Copy",
    copiedBtn: "Copied!",
    qrisScanTitle: "Scan QR Code to Pay",
    qrisScanDesc: "Open your mobile banking app or e-wallet and scan the QRIS code.",
    downloadReceipt: "Download Order Summary",
    backToHome: "Return to Homepage",
  },
  id: {
    backToCatalog: "Kembali ke Katalog",
    stepBadge: "Langkah 2 dari 2: Tinjau & Pembayaran Aman",
    pageTitle: "Selesaikan Pengurusan Layanan Anda",
    pageSubtitle: "Lengkapi data pemohon, periksa ketentuan hukum, dan lanjutkan pembayaran aman melalui gerbang resmi Xendit.",
    emptyCartNotice: "Keranjang Anda saat ini kosong. Silakan pilih layanan dari katalog terlebih dahulu.",
    sec1Title: "1. Informasi Pemohon & Badan Usaha",
    fullName: "Nama Lengkap (sesuai KTP/Paspor) *",
    fullNamePlaceholder: "cth. Budi Santoso / Alexander Tan",
    email: "Alamat Email *",
    emailPlaceholder: "budi@perusahaan.com",
    emailSubtext: "Konfirmasi pesanan, kuitansi pembayaran, dan draf dokumen dikirimkan ke email ini.",
    phone: "Nomor WhatsApp / Telepon *",
    phonePlaceholder: "+62 812 3456 7890",
    phoneSubtext: "Konsultan kami akan menghubungi Anda via WhatsApp setelah pembayaran terkonfirmasi.",
    companyName: "Nama Perusahaan / Rencana Nama PT",
    companyNamePlaceholder: "cth. PT Solusi Digital Nusantara",
    city: "Kota Domisili Usaha",
    notes: "Catatan Khusus / Dokumen Terkait (Opsional)",
    notesPlaceholder: "Tuliskan nomor NIB yang ada, jumlah pemegang saham, kode KBLI khusus, atau tenggat waktu...",
    sec2Title: "2. Metode Pembayaran",
    sec2Subtitle: "Pilih kanal pembayaran yang diinginkan didukung gerbang resmi Xendit",
    methodVa: "Virtual Account (VA)",
    methodVaDesc: "Verifikasi otomatis instan via BCA, Mandiri, BNI, BRI, Permata",
    methodQris: "QRIS",
    methodQrisDesc: "Pembayaran QR instan via GoPay, OVO, Dana, ShopeePay, atau Mobile Banking",
    methodCard: "Kartu Kredit / Debit",
    methodCardDesc: "Visa, Mastercard, JCB dengan perlindungan enkripsi 3D-Secure 256-bit",
    methodManual: "Transfer Bank Perusahaan",
    methodManualDesc: "Transfer langsung ke rekening giro resmi PT Mandiri Cipta Solusi",
    sec3Title: "Ringkasan Pesanan",
    subtotal: "Subtotal",
    tax: "PPN (11%)",
    taxSub: "Pajak Pertambahan Nilai",
    totalDue: "Total Biaya Pengurusan",
    term1: "Saya menyatakan bahwa data perusahaan yang diberikan benar dan menyetujui Ketentuan Layanan & Kebijakan Privasi.",
    term2: "Saya memahami bahwa biaya pengurusan pemerintah dan pendaftaran notaris diproses segera setelah pembayaran dikonfirmasi.",
    payNowBtn: "Bayar Sekarang via Gateway Aman",
    processingBtn: "Menghubungkan ke Gateway Aman...",
    trustGuarantee: "Jaminan Layanan Hukum Indonesia Resmi",
    trustGuaranteeDesc: "Seluruh pengurusan dilakukan sesuai dengan Undang-Undang Perseroan Terbatas (UUPT) dan regulasi BKPM / OSS-RBA Republik Indonesia.",
    thankYouTitle: "Instruksi Pembayaran & Pesanan Dikonfirmasi",
    thankYouSubtitle: "Permohonan pengurusan layanan Anda telah terdaftar. Selesaikan pembayaran di bawah ini untuk memulai pengerjaan berkas.",
    orderNumber: "Nomor Referensi Pesanan",
    orderDate: "Tanggal Pesanan",
    amountToPay: "Total yang Harus Dibayar",
    vaNumberLabel: "Nomor Virtual Account",
    copyBtn: "Salin",
    copiedBtn: "Tersalin!",
    qrisScanTitle: "Pindai Kode QR untuk Membayar",
    qrisScanDesc: "Buka aplikasi mobile banking atau dompet digital Anda lalu pindai kode QRIS.",
    downloadReceipt: "Unduh Ringkasan Pesanan",
    backToHome: "Kembali ke Beranda",
  },
  cn: {
    backToCatalog: "返回服务目录",
    stepBadge: "第 2 步（共 2 步）：核对与安全结算",
    pageTitle: "完成企业服务委托与结算",
    pageSubtitle: "请填写企业委托信息，核对法定合规要求，并通过 Xendit 官方合规安全网关完成付款。",
    emptyCartNotice: "您的购物车目前是空的。请先从服务目录中选择所需服务。",
    sec1Title: "1. 委托方与拟设企业信息",
    fullName: "姓名（与身份证/护照一致）*",
    fullNamePlaceholder: "例如：张伟 / Alexander Tan",
    email: "电子邮箱 *",
    emailPlaceholder: "zhangwei@company.com",
    emailSubtext: "订单确认函、付款凭单及交付文件初稿将发送至此邮箱。",
    phone: "WhatsApp / 联络电话 *",
    phonePlaceholder: "+62 812 3456 7890",
    phoneSubtext: "付款确认后，我们的专属企业法律顾问将通过 WhatsApp 与您取得联络。",
    companyName: "公司全称 / 拟定公司名称",
    companyNamePlaceholder: "例如：PT Nusantara Digital Solusi",
    city: "目标设立城市",
    notes: "特别备注 / 现有相关文件说明（选填）",
    notesPlaceholder: "可注明现有 NIB 编号、股东人数、指定 KBLI 行业编码或特别办理时限要求...",
    sec2Title: "2. 支付结算方式",
    sec2Subtitle: "请选择便捷安全的支付渠道（由 Xendit 官方合规网关提供支持）",
    methodVa: "银行虚拟账户（VA）",
    methodVaDesc: "各大银行（BCA、Mandiri、BNI、BRI、Permata）实时自动对账到账",
    methodQris: "印尼国民标准二维码（QRIS）",
    methodQrisDesc: "支持 GoPay、OVO、Dana、ShopeePay 及印尼各大手机银行 App 扫码即付",
    methodCard: "国际信用卡 / 借记卡",
    methodCardDesc: "支持 Visa、Mastercard、JCB，采用 3D-Secure 256 位金融级加密",
    methodManual: "企业对公银行电汇",
    methodManualDesc: "直接转账至 PT Mandiri Cipta Solusi 公司官方对公银行账户",
    sec3Title: "订单服务摘要",
    subtotal: "规费小计",
    tax: "增值税 PPN (11%)",
    taxSub: "印尼法定税款",
    totalDue: "应付总金额",
    term1: "我确认所填写的企业资料真实准确，并同意遵守服务条款与隐私政策。",
    term2: "我知悉并确认，官方政府规费支出与公证登记工作将在收到付款后立即启动办理。",
    payNowBtn: "通过安全网关立即支付",
    processingBtn: "正在连接安全支付网关...",
    trustGuarantee: "印尼官方执业机构法定保障",
    trustGuaranteeDesc: "全部服务均严格依据印尼《公司法》（UUPT）及投资协调委员会 BKPM / OSS-RBA 法规由执业公证人依法办理。",
    thankYouTitle: "订单已确认与付款指引",
    thankYouSubtitle: "您的企业服务委托已成功登记。请按以下指引完成付款，以便即刻启动官方办理流程。",
    orderNumber: "订单专属编号",
    orderDate: "委托日期",
    amountToPay: "应付全款金额",
    vaNumberLabel: "专属虚拟账户号码",
    copyBtn: "复制",
    copiedBtn: "已复制！",
    qrisScanTitle: "扫描二维码完成支付",
    qrisScanDesc: "打开您的手机银行 App 或印尼主流电子钱包，扫描下方 QRIS 码完成付款。",
    downloadReceipt: "下载订单凭证",
    backToHome: "返回网站首页",
  },
};
