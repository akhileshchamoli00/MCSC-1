"use client";

import { useLanguage } from "@/contexts/language-context";
import { HelpCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import BorderGlow from "@/components/ui/BorderGlow";
import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    question: {
      en: "What is the procedure to change the director, commissioner, or shareholder of a PT PMA?",
      id: "Bagaimana prosedur mengubah direktur, komisaris, atau pemegang saham PT PMA?",
      cn: "更改PT PMA的董事，专员或股东的程序是什么？",
    },
    answer: {
      en: "Changes to the corporate structure require a General Meeting of Shareholders (RUPS), followed by a Notarial Deed. The changes must then be submitted to and approved by the Ministry of Law and Human Rights (MOLHR) and updated in the OSS system.",
      id: "Perubahan struktur perusahaan memerlukan Rapat Umum Pemegang Saham (RUPS), diikuti dengan Akta Notaris. Perubahan tersebut kemudian harus diserahkan kepada dan disetujui oleh Kementerian Hukum dan HAM (Kemenkumham) dan diperbarui dalam sistem OSS.",
      cn: "公司结构的变更需要召开股东大会（RUPS），随后起草公证书。然后必须将这些变更提交给法律和人权部（MOLHR）批准，并在OSS系统中更新。",
    },
  },
  {
    question: {
      en: "How do we officially increase the paid-up capital of our existing company?",
      id: "Bagaimana cara resmi meningkatkan modal disetor perusahaan kami yang sudah ada?",
      cn: "我们如何正式增加现有公司的实缴资本？",
    },
    answer: {
      en: "Increasing paid-up capital requires a shareholder resolution (RUPS) to amend the Articles of Association. Once the funds are transferred to the corporate bank account, a Notary will execute the deed and register the capital increase with the MOLHR.",
      id: "Peningkatan modal disetor memerlukan resolusi pemegang saham (RUPS) untuk mengubah Anggaran Dasar. Setelah dana ditransfer ke rekening bank perusahaan, Notaris akan membuat akta dan mendaftarkan peningkatan modal ke Kemenkumham.",
      cn: "增加实缴资本需要股东决议（RUPS）来修改公司章程。资金转入公司银行账户后，公证人将执行契约并在MOLHR注册资本增加。",
    },
  },
  {
    question: {
      en: "Do all business agreements in Indonesia need to be drafted in the Indonesian language (Bahasa Indonesia)?",
      id: "Apakah semua perjanjian bisnis di Indonesia perlu dibuat dalam bahasa Indonesia?",
      cn: "印度尼西亚的所有商业协议都需要用印尼语（Bahasa Indonesia）起草吗？",
    },
    answer: {
      en: "Yes, under Law No. 24 of 2009, any agreement involving an Indonesian entity must be drafted in Bahasa Indonesia. Bilingual contracts are permitted and standard practice for international transactions, but the Indonesian version is mandatory.",
      id: "Ya, berdasarkan Undang-Undang No. 24 Tahun 2009, setiap perjanjian yang melibatkan entitas Indonesia harus dibuat dalam Bahasa Indonesia. Kontrak dwibahasa diizinkan dan merupakan praktik standar untuk transaksi internasional, tetapi versi bahasa Indonesia wajib ada.",
      cn: "是的，根据2009年第24号法律，涉及印度尼西亚实体的任何协议都必须用印尼语起草。双语合同是允许的，也是国际交易的标准做法，但印尼语版本是强制性的。",
    },
  },
  {
    question: {
      en: "Can your firm assist with the legalization and 'waarmarking' of foreign documents for use in Indonesia?",
      id: "Dapatkah perusahaan Anda membantu legalisasi dan 'waarmarking' dokumen asing untuk digunakan di Indonesia?",
      cn: "贵公司能否协助在印度尼西亚使用的外国文件进行合法化和‘waarmarking’？",
    },
    answer: {
      en: "Yes. We assist with the full legalization process, including translation by a sworn translator, notarization, and processing through relevant embassies or through the Apostille system depending on the issuing country.",
      id: "Ya. Kami membantu proses legalisasi penuh, termasuk penerjemahan oleh penerjemah tersumpah, notarisasi, dan pemrosesan melalui kedutaan terkait atau melalui sistem Apostille tergantung pada negara penerbit.",
      cn: "是的。我们协助完成全面的合法化流程，包括由宣誓翻译进行翻译，公证，并通过相关大使馆或根据发行国的Apostille系统进行处理。",
    },
  },
  {
    question: {
      en: "Is my international trademark automatically protected in Indonesia, or do I need to register it locally?",
      id: "Apakah merek dagang internasional saya otomatis dilindungi di Indonesia, atau saya perlu mendaftarkannya secara lokal?",
      cn: "我的国际商标在印度尼西亚自动受保护吗，还是我需要进行本地注册？",
    },
    answer: {
      en: "Indonesia uses a 'First-to-File' system. Your international trademark is not automatically protected unless it is registered in Indonesia through the local intellectual property office (DJKI) or via the Madrid Protocol designating Indonesia.",
      id: "Indonesia menggunakan sistem 'First-to-File'. Merek dagang internasional Anda tidak secara otomatis dilindungi kecuali terdaftar di Indonesia melalui kantor kekayaan intelektual lokal (DJKI) atau melalui Protokol Madrid yang menunjuk Indonesia.",
      cn: "印度尼西亚实行“先申请”制度。您的国际商标不会自动受保护，除非它通过当地知识产权局（DJKI）或指定印度尼西亚的马德里议定书在印度尼西亚注册。",
    },
  },
  {
    question: {
      en: "How long is a registered trademark valid in Indonesia, and when should I renew it?",
      id: "Berapa lama merek dagang yang terdaftar berlaku di Indonesia, dan kapan saya harus memperbaruinya?",
      cn: "在印度尼西亚注册的商标有效期多长，我应该何时续展？",
    },
    answer: {
      en: "A registered trademark is valid for 10 years from the filing date. You can apply for renewal starting from 6 months before the expiration date.",
      id: "Merek dagang yang terdaftar berlaku selama 10 tahun dari tanggal pengajuan. Anda dapat mengajukan perpanjangan mulai dari 6 bulan sebelum tanggal kedaluwarsa.",
      cn: "注册商标的有效期为自申请之日起10年。您可以在到期日前6个月开始申请续展。",
    },
  },
  {
    question: {
      en: "Can I use a Virtual Office address to apply for specialized business licenses?",
      id: "Bisakah saya menggunakan alamat Virtual Office untuk mengajukan izin usaha khusus?",
      cn: "我可以使用虚拟办公室地址申请专业营业执照吗？",
    },
    answer: {
      en: "A Virtual Office is sufficient for standard company establishment and obtaining an NIB. However, specialized licenses (such as manufacturing, certain trading, or warehousing) require a physical operational address to pass site verifications.",
      id: "Virtual Office cukup untuk pendirian perusahaan standar dan mendapatkan NIB. Namun, lisensi khusus (seperti manufaktur, perdagangan tertentu, atau pergudangan) memerlukan alamat operasional fisik untuk lulus verifikasi lokasi.",
      cn: "虚拟办公室足以进行标准的公司设立和获取NIB。但是，专业许可证（例如制造业，某些贸易或仓储）需要实际的运营地址才能通过现场验证。",
    },
  },
  {
    question: {
      en: "Can a foreign national hold multiple work permits (KITAS) if they work for two different companies in Indonesia?",
      id: "Dapatkah warga negara asing memegang beberapa izin kerja (KITAS) jika mereka bekerja untuk dua perusahaan yang berbeda di Indonesia?",
      cn: "如果外国国民在印度尼西亚的两家不同公司工作，他们可以持有多个工作许可证（KITAS）吗？",
    },
    answer: {
      en: "Generally, dual-employment is prohibited. A foreigner can only hold one working KITAS sponsored by one company. The only exception is for foreign Directors or Commissioners who may hold roles in multiple companies, provided it is approved by the Ministry of Manpower.",
      id: "Secara umum, pekerjaan ganda dilarang. Orang asing hanya dapat memegang satu KITAS kerja yang disponsori oleh satu perusahaan. Satu-satunya pengecualian adalah untuk Direktur atau Komisaris asing yang mungkin memegang peran di beberapa perusahaan, asalkan disetujui oleh Kementerian Ketenagakerjaan.",
      cn: "一般来说，禁止双重就业。外国人只能持有由一家公司赞助的一份工作KITAS。唯一的例外是外国董事或专员可能在多家公司担任职务，前提是获得人力部的批准。",
    },
  },
  {
    question: {
      en: "What is the difference between an EPO (Exit Permit Only) and an ERP (Exit Re-entry Permit)?",
      id: "Apa perbedaan antara EPO (Exit Permit Only) dan ERP (Exit Re-entry Permit)?",
      cn: "EPO（仅出境许可证）和ERP（出入境许可证）有什么区别？",
    },
    answer: {
      en: "An EPO is required when you are permanently ending your stay in Indonesia or changing sponsors; it cancels your KITAS. An ERP allows you to leave Indonesia temporarily and re-enter while keeping your KITAS active.",
      id: "EPO diperlukan ketika Anda mengakhiri masa tinggal Anda di Indonesia secara permanen atau berganti sponsor; ini membatalkan KITAS Anda. ERP memungkinkan Anda meninggalkan Indonesia sementara dan masuk kembali dengan menjaga KITAS Anda tetap aktif.",
      cn: "当您永久结束在印度尼西亚的逗留或更换赞助商时，需要EPO；它会取消您的KITAS。ERP允许您暂时离开印度尼西亚并重新入境，同时保持您的KITAS有效。",
    },
  },
  {
    question: {
      en: "What are the risks of operating a business if my NIB is active, but my standard certifications (like PKKPR) are still unverified?",
      id: "Apa risiko menjalankan bisnis jika NIB saya aktif, tetapi sertifikasi standar saya (seperti PKKPR) masih belum terverifikasi?",
      cn: "如果我的NIB有效，但我的标准认证（例如PKKPR）仍未经过验证，那么经营业务会有什么风险？",
    },
    answer: {
      en: "An active NIB only acts as a basic registration. If your business risk level is medium to high, you cannot legally commence commercial operations until standard certifications (like PKKPR and environmental permits) are verified. Operating without them can lead to sanctions or NIB revocation.",
      id: "NIB yang aktif hanya bertindak sebagai pendaftaran dasar. Jika tingkat risiko bisnis Anda menengah hingga tinggi, Anda tidak dapat secara hukum memulai operasi komersial sampai sertifikasi standar (seperti PKKPR dan izin lingkungan) diverifikasi. Beroperasi tanpanya dapat menyebabkan sanksi atau pencabutan NIB.",
      cn: "有效的NIB仅作为基本注册。如果您的业务风险等级为中到高，在标准认证（如PKKPR和环境许可）得到验证之前，您不能合法开始商业运营。没有它们而进行运营可能导致制裁或NIB被撤销。",
    },
  },
  {
    question: {
      en: "What is a PKKPR (Confirmation of Suitability of Space Utilization Activities) and why is it mandatory?",
      id: "Apa itu PKKPR (Kesesuaian Kegiatan Pemanfaatan Ruang) dan mengapa itu wajib?",
      cn: "什么是PKKPR（空间利用活动适宜性确认），为什么它是强制性的？",
    },
    answer: {
      en: "PKKPR replaces the old location permit. It confirms that your intended business activities align with the spatial planning of the regional government. It is a mandatory foundational requirement in the OSS system before any other operational licenses can be issued.",
      id: "PKKPR menggantikan izin lokasi lama. Ini mengkonfirmasi bahwa kegiatan bisnis yang Anda maksudkan sejalan dengan tata ruang pemerintah daerah. Ini adalah persyaratan dasar wajib dalam sistem OSS sebelum izin operasional lainnya dapat diterbitkan.",
      cn: "PKKPR取代了旧的选址许可证。它确认了您预期的商业活动符合当地政府的空间规划。在颁发任何其他运营许可证之前，这是OSS系统中一项强制性的基础要求。",
    },
  },
  {
    question: {
      en: "Can a foreign investor establish a CV (Commanditaire Vennootschap) or Firm in Indonesia?",
      id: "Dapatkah investor asing mendirikan CV (Commanditaire Vennootschap) atau Firma di Indonesia?",
      cn: "外国投资者可以在印度尼西亚设立CV（两合公司）或商号吗？",
    },
    answer: {
      en: "No. A CV or Firm is exclusively reserved for 100% domestic (Indonesian citizen) ownership. Foreign investors must establish a PT PMA (Limited Liability Company for Foreign Direct Investment).",
      id: "Tidak. CV atau Firma secara eksklusif diperuntukkan bagi 100% kepemilikan domestik (warga negara Indonesia). Investor asing harus mendirikan PT PMA (Perseroan Terbatas Penanaman Modal Asing).",
      cn: "不可以。CV或商号专为100%国内（印度尼西亚公民）所有权保留。外国投资者必须建立PT PMA（外国直接投资有限责任公司）。",
    },
  },
  {
    question: {
      en: "If I want to change my company’s business classification (KBLI), do I need to update my Articles of Association?",
      id: "Jika saya ingin mengubah klasifikasi bisnis (KBLI) perusahaan saya, apakah saya perlu memperbarui Anggaran Dasar saya?",
      cn: "如果我想更改公司的业务分类（KBLI），我需要更新公司章程吗？",
    },
    answer: {
      en: "Yes. Changing your KBLI requires amending the 'Purpose and Objective' section of your Articles of Association through a Notarial Deed, which must then be registered with the MOLHR and updated in the OSS system to issue a new NIB.",
      id: "Ya. Mengubah KBLI Anda memerlukan amandemen bagian 'Maksud dan Tujuan' dari Anggaran Dasar Anda melalui Akta Notaris, yang kemudian harus didaftarkan ke Kemenkumham dan diperbarui dalam sistem OSS untuk menerbitkan NIB baru.",
      cn: "是的。更改您的KBLI需要通过公证书修改公司章程的“目的和目标”部分，然后必须在MOLHR注册并在OSS系统中更新以颁发新的NIB。",
    },
  },
  {
    question: {
      en: "Why do I need a Notarial Deed for certain agreements instead of just a privately drafted contract?",
      id: "Mengapa saya membutuhkan Akta Notaris untuk perjanjian tertentu alih-alih hanya kontrak yang dibuat secara pribadi?",
      cn: "为什么我需要为某些协议提供公证书，而不仅仅是私人起草的合同？",
    },
    answer: {
      en: "A Notarial Deed (Authentic Deed) has perfect evidentiary power in an Indonesian court of law. Certain agreements, like Company Establishment, Share Transfers, and specific Sale & Purchase agreements, legally require a Notarial Deed to be valid.",
      id: "Akta Notaris (Akta Otentik) memiliki kekuatan pembuktian sempurna di pengadilan Indonesia. Perjanjian tertentu, seperti Pendirian Perusahaan, Pengalihan Saham, dan perjanjian Jual Beli tertentu, secara hukum memerlukan Akta Notaris agar valid.",
      cn: "公证书（真实契约）在印度尼西亚法院具有完美的证据效力。某些协议，如公司成立、股份转让和特定的买卖协议，在法律上需要公证书才能生效。",
    },
  },
  {
    question: {
      en: "Is a Virtual Office suitable for a PMA company applying for a Permanent Business License?",
      id: "Apakah Virtual Office cocok untuk perusahaan PMA yang mengajukan Izin Usaha Tetap?",
      cn: "虚拟办公室适合申请永久营业执照的PMA公司吗？",
    },
    answer: {
      en: "Virtual Offices are excellent for consulting or service-based PMAs. However, for retail, manufacturing, or distribution, the government may inspect your premises. In those cases, a physical office or warehouse is mandatory for final license approval.",
      id: "Virtual Office sangat baik untuk PMA berbasis konsultasi atau layanan. Namun, untuk ritel, manufaktur, atau distribusi, pemerintah dapat memeriksa tempat Anda. Dalam kasus tersebut, kantor fisik atau gudang wajib ada untuk persetujuan izin akhir.",
      cn: "虚拟办公室非常适合基于咨询或服务的PMA。但是，对于零售、制造或分销，政府可能会检查您的场所。在这些情况下，必须有实体办公室或仓库才能获得最终许可批准。",
    },
  },
  {
    question: {
      en: "What is the difference between a KITAS (Temporary Stay Permit) and a KITAP (Permanent Stay Permit)?",
      id: "Apa perbedaan antara KITAS (Izin Tinggal Sementara) dan KITAP (Izin Tinggal Tetap)?",
      cn: "KITAS（临时居留许可）和KITAP（永久居留许可）有什么区别？",
    },
    answer: {
      en: "A KITAS is typically valid for 6 months to 2 years and must be renewed regularly. After holding a KITAS consecutively for a number of years, you may be eligible to convert it into a KITAP, which is valid for 5 years and provides greater residency stability.",
      id: "KITAS biasanya berlaku selama 6 bulan hingga 2 tahun dan harus diperbarui secara berkala. Setelah memegang KITAS secara berturut-turut selama beberapa tahun, Anda mungkin memenuhi syarat untuk mengubahnya menjadi KITAP, yang berlaku selama 5 tahun dan memberikan stabilitas tempat tinggal yang lebih besar.",
      cn: "KITAS的有效期通常为6个月到2年，必须定期续签。在连续持有KITAS数年后，您可能有资格将其转换为KITAP，KITAP的有效期为5年，提供更大的居住稳定性。",
    },
  },
  {
    question: {
      en: "Can a dependent spouse holding a Dependent KITAS legally work in Indonesia?",
      id: "Dapatkah pasangan tanggungan yang memegang KITAS Tanggungan secara hukum bekerja di Indonesia?",
      cn: "持有家属KITAS的受抚养配偶可以在印度尼西亚合法工作吗？",
    },
    answer: {
      en: "No. A Dependent KITAS strictly prohibits the holder from engaging in any income-generating activities. To work, the spouse must obtain their own Working KITAS sponsored by an Indonesian company.",
      id: "Tidak. KITAS Tanggungan melarang keras pemegangnya untuk terlibat dalam kegiatan yang menghasilkan pendapatan apa pun. Untuk bekerja, pasangan harus mendapatkan KITAS Kerja mereka sendiri yang disponsori oleh perusahaan Indonesia.",
      cn: "不可以。家属KITAS严格禁止持有人从事任何创收活动。为了工作，配偶必须获得由印度尼西亚公司赞助的自己的工作KITAS。",
    },
  },
  {
    question: {
      en: "Can I register an Industrial Design for a product that is already being sold in the market?",
      id: "Bisakah saya mendaftarkan Desain Industri untuk produk yang sudah dijual di pasar?",
      cn: "我可以为市场上已经在销售的产品注册工业设计吗？",
    },
    answer: {
      en: "No. Industrial Designs in Indonesia must meet the 'Novelty' requirement. If the design has been publicly disclosed or sold before the filing date, it cannot be registered.",
      id: "Tidak. Desain Industri di Indonesia harus memenuhi persyaratan 'Kebaruan'. Jika desain telah diungkapkan secara publik atau dijual sebelum tanggal pengajuan, desain tersebut tidak dapat didaftarkan.",
      cn: "不可以。印度尼西亚的工业设计必须满足“新颖性”要求。如果设计在申请日之前已经公开披露或出售，则无法注册。",
    },
  },
  {
    question: {
      en: "Do I need to submit an LKPM (Investment Activity Report) if my company hasn't started commercial operations yet?",
      id: "Apakah saya perlu menyerahkan LKPM (Laporan Kegiatan Penanaman Modal) jika perusahaan saya belum memulai operasi komersial?",
      cn: "如果我的公司尚未开始商业运营，我需要提交LKPM（投资活动报告）吗？",
    },
    answer: {
      en: "Yes. Every PMA and PMDN company must submit LKPM quarterly or semi-annually (depending on investment size) even during the construction/preparation phase before generating revenue. Failure to do so can result in NIB revocation.",
      id: "Ya. Setiap perusahaan PMA dan PMDN harus menyerahkan LKPM secara triwulanan atau semesteran (tergantung ukuran investasi) bahkan selama fase konstruksi/persiapan sebelum menghasilkan pendapatan. Kegagalan untuk melakukannya dapat mengakibatkan pencabutan NIB.",
      cn: "是的。每个PMA和PMDN公司都必须每季度或每半年（取决于投资规模）提交LKPM，即使在产生收入之前的建设/准备阶段也是如此。否则可能导致NIB被撤销。",
    },
  },
  {
    question: {
      en: "What are the specific restrictions for foreign ownership (The Positive Investment List)?",
      id: "Apa batasan spesifik untuk kepemilikan asing (Daftar Investasi Positif)?",
      cn: "外资所有权的具体限制是什么（积极投资清单）？",
    },
    answer: {
      en: "Under Presidential Regulation No. 10 of 2021 (The Positive List), most business sectors are now 100% open to foreign ownership. However, certain sectors (like specific logistics, postal, and traditional industries) remain restricted to partial foreign ownership or are reserved exclusively for domestic companies.",
      id: "Berdasarkan Peraturan Presiden No. 10 Tahun 2021 (Daftar Positif), sebagian besar sektor bisnis sekarang 100% terbuka untuk kepemilikan asing. Namun, sektor-sektor tertentu (seperti logistik spesifik, pos, dan industri tradisional) tetap dibatasi untuk kepemilikan asing parsial atau dicadangkan secara eksklusif untuk perusahaan domestik.",
      cn: "根据2021年第10号总统令（积极清单），大多数商业领域现在100%向外资开放。但是，某些部门（例如特定的物流、邮政和传统行业）仍然限制外资部分持股，或者专为国内公司保留。",
    },
  },
  {
    question: {
      en: "Can I set up a company in Indonesia as a foreigner?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes, as a foreigner you can set up a foreign-owned company (PT PMA) in Indonesia if your business field is entirely open to foreigners. Find more about Indonesia’s Positive Investment List.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Is a foreigner able to become a director or commissioner?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes, in a foreign-owned (PT PMA) company, a foreigner can be a director or a commissioner.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "How long does PMA / PMDN incorporation process take?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "2-3 Weeks.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "How long does KPPA incorporation process take?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "3-3 Weeks.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is a PT PMA?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Limited liability company with foreign direct investment ranging from 1-100%",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can a foreigner form a CV?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "No.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can foreigners invest and own a company without having a local partner?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes, if it is a PMA.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can foreigners be shareholders in a PMA?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can foreigners be shareholders in a PMDN?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "No.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can a foreigner be the Chief Representative Oﬃcer of a KPPA?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "How long can a KPPA operate in Indonesia?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "KPPA licence does not have a validity period, meaning that it is valid as long as the KPPA operates.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is the difference between PT and CV?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "PT: limited liability company (shareholders are notlegally liable for company liabilities).CV: proprietary company where liability falls on theshareholders.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is the minimum shareholder requirement to incorporate a PT?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "2 shareholders.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is the minimum authorised capital requirement to form a PMA?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "IDR 10 billion.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is the minimum paid-up capital requirement to form a PMA?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "IDR 10 billion.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is the minimum investment requirement for PMA?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "IDR 10 billion.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is the minimum authorised capital requirement to form a PMDN?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Small: IDR 50 million – 500 million.Medium: IDR 501 million – 10 billion.Large: more than IDR 10 billion.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is the minimum paid-up capital requirement to form a PMDN?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Small: IDR 1 billion – 5 billion.Medium: IDR 5 billion – 10 billion.Large: more than IDR 10 billion.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is the minimum capital requirement for KPPA?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "None.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is the role of Director?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Take responsibility and make every decision for the company.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is the role of Commissioner?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Supervise and monitor the work of the Directors to make sure every activity is done and the decisions made are in coherence with the Shareholders’ goals.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can the same person be Director and Commissioner?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "No.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can the same person be Shareholder and Director?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can the same person be Shareholder and Commissioner?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "How many Directors can be in a PMA / PMDN?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "There is no maximum requirement, however for a small company we would recommend having 2-3 Directors and appoint a President Director.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What happens if a PT wants to add a director, a commissioner or other business activities in the future?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Any changes in the Deed of Incorporation will result in deed amendment and updating the changes in the OSS system.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Do I need to apply for the work permit if I’m both a shareholder and Director / Commissioner?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "No.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Are there options to expand my business without incorporating a company in Indonesia?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes, particularly for export and import business, you can use a service called undername import.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What are the common company types in Indonesia?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Depending on your business requirements, preferences, and the nature of your business. there are 3 company types you can chooseLocal Company (PT): 100% local ownership.Foreign Company (PT PMA): can be entirely owned by foreigners, however, restrictions in business sectors applyRepresentative Office: a branch of parent company overseas whose purpose is to conduct marketing-related activities without generating income or profits",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is a PT?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "PT (Perseroan Terbatas) is the Indonesian term for a limited liability company.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is a PT PMDN?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Limited liability company with 100% local / domestic direct investment",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is a CV?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "CV (Commanditer Vennootschap) is a proprietary business entity that houses several individuals to run a business.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What kind of company is the best for me: a foreign-owned company, local company, or representative office?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "It all depends on the nature of your business and the purpose of your business incorporation. Consult with us if you are not sure.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "When do I have to deposit money in the bank?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "As soon as the company completes its establishment process, the minimum paid-up capital should be deposited. Another option to look into: after the company receives the Article of Association and Deed of Establishment.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can you provide pricing details for company registration services?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "To provide you with accurate pricing information for our company registration service, we consider the complexities of your inquiries and the dynamic nature of regulations in Indonesia. As a result, the pricing for the services may vary accordingly. For detailed information, please contact our consultants.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can I set up a PMA / PMDN company in any location in Indonesia?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "No.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Will the government check if I have fulfilled the investment plan of IDR 10,000,000,000?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes, the government will check IDR 10,000,000,000, which is the minimum paid-up capital. Fulfilling this requirement is a must.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can I use a virtual oﬃce for PMA / PMDN?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is a virtual oﬃce?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "A low cost set of services that facilitate remote working while maintaining a business address to present to customers.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is a serviced oﬃce?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "A regular physical oﬃce where you can sit and work.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is a KPPA?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Representative Oﬃce.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can I set up a KPPA (Representative Oﬃce) in any location in Indonesia?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "No, Representative Oﬃces must be situated in the provincial capital, e.g. Jakarta, Bandung, Surabaya, Denpasar, etc.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can a KPPA conduct business and generate proﬁt?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "No, KPPA is strictly prohibited to do so.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can the CEO of the parent company be CRO?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "No.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is the OSS?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "OSS or Online Single Submission is a business licensing system that is integrated electronically with all ministries and state agencies.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is IU?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "IU or Izin Usaha is the business permit.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is SIUP?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "SIUP or Surat Izin Usaha Perdagangan is the operational license for businesses involved in retail and trading.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is TDUP?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "TUDP or Tanda Daftar Usaha Pariwisatais the operational licence for businesses involved intourism, e.g. restaurants, hotels, bars.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is IUI?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "IUI or Izin Usaha Industri is the operational licence for businesses involved in the manufacturing industry.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is NIB?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "NIB or Nomor Induk Berusaha is the business identity number.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Can I set-up a PT while I am abroad?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is KBLI?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Klasiﬁkasi Baku Lapangan Usaha Indonesia or the Indonesian Business Classiﬁcation Number.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Do I have to decide the KBLI for my business in Indonesia on my own?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "No, we will help you with the process.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "How many business activities can I have?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "There is no maximum requirement. However, you must show an investment plan of IDR 10 billion for each KBLIregistered in the OSS system.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is LKPM?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Laporan Kegiatan Penanaman Modal or the Quarterly Investment Activity Report.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Do we need to submit it regularly?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Yes.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is NPWP?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Tax identiﬁcation number.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "What is BPJS?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Employee’s health & social welfare.",
      id: undefined,
      cn: undefined,
    },
  },
  {
    question: {
      en: "Who are considered ‘dependents’?",
      id: undefined,
      cn: undefined,
    },
    answer: {
      en: "Only your spouse and your children under the age of 17.",
      id: undefined,
      cn: undefined,
    },
  },
];

export default function FAQPage() {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const getTranslation = (obj: any, lang: string) => {
    return obj[lang] || obj["en"] || obj["id"] || "";
  };

  const title = {
    en: "Frequently Asked Questions",
    id: "Pertanyaan yang Sering Diajukan",
    cn: "常见问题",
  };

  const description = {
    en: "Find answers to common questions about our services and intellectual property.",
    id: "Temukan jawaban untuk pertanyaan umum tentang layanan dan kekayaan intelektual kami.",
    cn: "查找有关我们的服务和知识产权的常见问题的答案。",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: getTranslation(faq.question, language),
      acceptedAnswer: {
        "@type": "Answer",
        text: getTranslation(faq.answer, language),
      },
    })),
  };

  return (
    <main className="flex-grow relative z-10 flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section className="pt-4 pb-6 md:pt-8 md:pb-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-6 backdrop-blur-sm border border-primary/20">
              <HelpCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl font-sans">
              {getTranslation(title, language)}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {getTranslation(description, language)}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="divide-y divide-border/50 dark:divide-white/40">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div key={index} className="group">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full text-left py-4 flex items-start justify-between gap-4 focus:outline-none transition-colors"
                  >
                    <h3
                      className={`font-medium text-base transition-colors ${isOpen ? "text-primary" : "text-foreground group-hover:text-primary/80"}`}
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
    </main>
  );
}
