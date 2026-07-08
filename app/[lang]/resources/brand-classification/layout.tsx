import type { Metadata } from "next";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";

  return {
    title: "Brand Classification Search | Trademark Classes Indonesia",
    description: "Look up the correct trademark class for your brand or product before registering intellectual property in Indonesia.",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/resources/brand-classification`,
      languages: {
        "en": `https://www.mcsc.co.id/en/resources/brand-classification`,
        "id": `https://www.mcsc.co.id/id/resources/brand-classification`,
        "zh-CN": `https://www.mcsc.co.id/cn/resources/brand-classification`,
        "x-default": `https://www.mcsc.co.id/en/resources/brand-classification`,
      },
    },
  };
}

export default function BrandClassificationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
