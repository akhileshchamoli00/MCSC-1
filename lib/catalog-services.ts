import { CatalogServiceItem } from "@/contexts/cart-context";

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
    ]
  },
  {
    id: "L002",
    title: "Local PT Company (PT Konvensional) Incorporation",
    category: "entity-setup",
    categoryLabel: "Entity Setup",
    basePrice: 6000000,
    priceFormatted: "Rp 6,000,000",
    timeline: "5 - 7 Business Days",
    popular: true,
    description: "Full incorporation for domestic Indonesian limited liability companies (PT Lokal) with authorized capital up to Rp 1 Billion.",
    deliverables: [
      "Notarial Deed of Establishment by Licensed Indonesian Notary",
      "Ministry of Law & Human Rights Approval (SK AHU)",
      "Company Tax Identification (NPWP Badan Usaha)",
      "Business Identification Number (NIB) via OSS-RBA",
      "Basic Commercial Location Verification & Registered Office Filing"
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
