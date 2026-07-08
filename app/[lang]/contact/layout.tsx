import type { Metadata } from "next";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";

  return {
    title: "Contact MCS Consulting | Jakarta & Tangerang Offices",
    description: "Reach MCS Consulting",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/contact`,
      languages: {
        "en": `https://www.mcsc.co.id/en/contact`,
        "id": `https://www.mcsc.co.id/id/contact`,
        "zh-CN": `https://www.mcsc.co.id/cn/contact`,
        "x-default": `https://www.mcsc.co.id/en/contact`,
      },
    },
  };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
