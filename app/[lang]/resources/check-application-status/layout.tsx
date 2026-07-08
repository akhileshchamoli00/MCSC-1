import type { Metadata } from "next";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";

  return {
    title: "Check Application Status | Track Your Business Registration",
    description: "Check the real-time status of your business license, NIB, or company registration application in Indonesia.",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/resources/check-application-status`,
      languages: {
        "en": `https://www.mcsc.co.id/en/resources/check-application-status`,
        "id": `https://www.mcsc.co.id/id/resources/check-application-status`,
        "zh-CN": `https://www.mcsc.co.id/cn/resources/check-application-status`,
      },
    },
  };
}

export default function CheckApplicationStatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
