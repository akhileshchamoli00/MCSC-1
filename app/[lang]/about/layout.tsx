import type { Metadata } from "next";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";

  return {
    title: "About MCS Consulting | Business Licensing Experts Since 2013",
    description: "MCS Consulting has helped 500+ local and foreign businesses register, license, and stay compliant in Indonesia since 2013. Meet our team.",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/about`,
      languages: {
        "en": `https://www.mcsc.co.id/en/about`,
        "id": `https://www.mcsc.co.id/id/about`,
        "zh-CN": `https://www.mcsc.co.id/cn/about`,
        "x-default": `https://www.mcsc.co.id/en/about`,
      },
    },
  };
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
