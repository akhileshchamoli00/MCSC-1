import type { Metadata } from "next";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";

  return {
    title: "KBLI Directory | Indonesian Business Classification Codes",
    description: "Search KBLI codes to find the correct business classification for your company registration in Indonesia.",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/resources/kbli`,
      languages: {
        "en": `https://www.mcsc.co.id/en/resources/kbli`,
        "id": `https://www.mcsc.co.id/id/resources/kbli`,
        "zh-CN": `https://www.mcsc.co.id/cn/resources/kbli`,
        "x-default": `https://www.mcsc.co.id/en/resources/kbli`,
      },
    },
  };
}

export default function Kblilayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
