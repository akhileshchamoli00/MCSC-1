import type { Metadata } from "next";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";

  return {
    title: "Resources | Business Tools & Guides for Indonesia",
    description: "Brand classification lookup, application status checker, KBLI directory, and FAQ — free resources for doing business in Indonesia.",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/resources`,
      languages: {
        "en": `https://www.mcsc.co.id/en/resources`,
        "id": `https://www.mcsc.co.id/id/resources`,
        "zh-CN": `https://www.mcsc.co.id/cn/resources`,
        "x-default": `https://www.mcsc.co.id/en/resources`,
      },
    },
  };
}

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
