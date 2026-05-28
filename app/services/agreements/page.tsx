"use client";

import { FileSignature } from "lucide-react";
import { BaseServicePage } from "@/components/base-service-page";
import { useLanguage } from "@/contexts/language-context";

export default function AgreementsPage() {
  const { language } = useLanguage();

  const title = {
    en: "Draft Agreement",
    id: "Perjanjian",
    cn: "协议草案",
  };

  const description = {
    en: "Professional legal agreement drafting services including Cooperation Agreements, Sales Agreements, Lease Agreements, and document legalization services.",
    id: "Layanan penyusunan perjanjian hukum profesional termasuk Perjanjian Kerjasama, Perjanjian Jual Beli, Perjanjian Sewa Menyewa, dan layanan legalisasi dokumen.",
    cn: "专业的法律协议起草服务，包括合作协议、销售协议、租赁协议和文件合法化服务。",
  };

  const subServices = [
    {
      title: {
        en: "Cooperation Agreement",
        id: "Perjanjian Kerjasama",
        cn: "合作协议",
      },
    },
    {
      title: {
        en: "Sales Agreement",
        id: "Perjanjian Jual Beli",
        cn: "销售协议",
      },
    },
    {
      title: {
        en: "License Agreement",
        id: "Perjanjian Lisensi",
        cn: "许可协议",
      },
    },
    {
      title: {
        en: "Lease Agreement",
        id: "Perjanjian Sewa Menyewa",
        cn: "租赁协议",
      },
    },
    {
      title: {
        en: "Separation of Assets Agreement",
        id: "Perjanjian Pemisahan Harta",
        cn: "财产分割协议",
      },
    },
    {
      title: {
        en: "Addendum to Agreement",
        id: "Addendum Perjanjian",
        cn: "协议附录/补充协议",
      },
    },
    {
      title: {
        en: "Document Verification",
        id: "Verifikasi Dokumen",
        cn: "文件核实",
      },
    },
    {
      title: {
        en: "Document Legalization",
        id: "Legalisasi Dokumen",
        cn: "文件合法化",
      },
    },
  ];

  const faqs = [
    {
      question: {
        en: "Do business agreements need to be in Bahasa Indonesia?",
        id: "Apakah perjanjian bisnis harus dalam Bahasa Indonesia?",
        cn: "商业协议需要使用印尼语吗？",
      },
      answer: {
        en: "Yes. Under Law No. 24 of 2009, any agreement involving an Indonesian entity or citizen must be drafted in Bahasa Indonesia. Bilingual contracts are legally valid and recommended for foreign entities.",
        id: "Ya. Berdasarkan UU No. 24 Tahun 2009, setiap perjanjian yang melibatkan entitas atau warga negara Indonesia harus dibuat dalam Bahasa Indonesia. Kontrak dwibahasa sah secara hukum dan direkomendasikan untuk entitas asing.",
        cn: "是的。根据2009年第24号法律，涉及印度尼西亚实体或公民的任何协议都必须使用印尼语起草。双语合同在法律上是有效的，推荐外国实体使用。",
      },
    },
    {
      question: {
        en: "What is the difference between a Notarial Deed and a private contract?",
        id: "Apa perbedaan antara Akta Notaris dan kontrak pribadi (di bawah tangan)?",
        cn: "公证书和私人合同有什么区别？",
      },
      answer: {
        en: "A private contract (underhand agreement) is signed only by the parties involved. A Notarial Deed is an authentic act executed by a sworn Notary, carrying absolute evidentiary weight in Indonesian courts. Certain transactions legally require a Notarial Deed.",
        id: "Kontrak pribadi (perjanjian di bawah tangan) hanya ditandatangani oleh para pihak yang terlibat. Akta Notaris adalah akta otentik yang dilaksanakan oleh Notaris tersumpah, membawa bobot pembuktian mutlak di pengadilan Indonesia. Transaksi tertentu secara hukum memerlukan Akta Notaris.",
        cn: "私人合同（私下协议）仅由涉及方签署。公证书是由宣誓公证人执行的真实行为，在印度尼西亚法院具有绝对的证据效力。某些交易在法律上要求提供公证书。",
      },
    },
    {
      question: {
        en: "What is 'Waarmarking'?",
        id: "Apa itu 'Waarmarking'?",
        cn: "什么是 'Waarmarking'？",
      },
      answer: {
        en: "Waarmarking is the process of registering a privately drafted contract with a Notary. The Notary records the date of the agreement in their official registry, which provides legal certainty regarding when the document was executed.",
        id: "Waarmarking adalah proses mendaftarkan kontrak yang dibuat secara pribadi ke Notaris. Notaris mencatat tanggal perjanjian dalam daftar resmi mereka, yang memberikan kepastian hukum mengenai kapan dokumen tersebut dieksekusi.",
        cn: "Waarmarking是将私人起草的合同在公证人处注册的过程。公证人在其官方登记册中记录协议的日期，从而对文件的执行时间提供法律确定性。",
      },
    },
    {
      question: {
        en: "Can you assist with the Apostille or Legalization of foreign documents?",
        id: "Bisakah Anda membantu dengan Apostille atau Legalisasi dokumen asing?",
        cn: "您能协助办理外国文件的Apostille（海牙认证）或合法化吗？",
      },
      answer: {
        en: "Yes. For foreign documents (like parent company articles) to be used in Indonesia, they must be legalized. We assist with Apostille (for member countries) or consular legalization at the relevant Indonesian Embassy.",
        id: "Ya. Agar dokumen asing (seperti anggaran dasar perusahaan induk) dapat digunakan di Indonesia, dokumen tersebut harus dilegalisasi. Kami membantu dengan Apostille (untuk negara anggota) atau legalisasi konsuler di Kedutaan Besar Republik Indonesia yang relevan.",
        cn: "是的。要在印度尼西亚使用外国文件（如母公司章程），必须对其进行合法化。我们协助办理Apostille（针对成员国）或在相关印度尼西亚大使馆进行领事认证。",
      },
    },
    {
      question: {
        en: "Are Non-Disclosure Agreements (NDAs) strictly enforced in Indonesia?",
        id: "Apakah Non-Disclosure Agreements (NDA) ditegakkan secara ketat di Indonesia?",
        cn: "保密协议 (NDA) 在印度尼西亚会被严格执行吗？",
      },
      answer: {
        en: "Yes, NDAs are recognized and enforceable under the Indonesian Civil Code. However, to ensure maximum enforceability, they must be drafted clearly, include specific penalty clauses, and be accompanied by a Bahasa Indonesia translation.",
        id: "Ya, NDA diakui dan dapat ditegakkan berdasarkan KUHPerdata Indonesia. Namun, untuk memastikan penegakan maksimal, NDA harus disusun dengan jelas, menyertakan klausul hukuman tertentu, dan disertai dengan terjemahan Bahasa Indonesia.",
        cn: "是的，NDA在《印度尼西亚民法典》下是被承认并可执行的。但是，为了确保最大的可执行性，它们必须起草清晰，包括特定的违约金条款，并附有印尼语翻译。",
      },
    },
  ];

  const ctaText = {
    en: "Professional Legal Documentation",
    id: "Dokumentasi Hukum Profesional",
    cn: "专业的法律文件服务",
  };
  const ctaDescription = {
    en: "Ensure your business agreements are legally sound and professionally drafted",
    id: "Pastikan perjanjian bisnis Anda sah secara hukum dan disusun secara profesional",
    cn: "确保您的商业协议在法律上健全且起草专业",
  };

  return (
    <BaseServicePage
      icon={FileSignature}
      title={title}
      description={description}
      subServices={subServices}
      ctaText={ctaText}
      ctaDescription={ctaDescription}
      faqs={faqs}
    />
  );
}
