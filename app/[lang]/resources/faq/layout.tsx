import type { Metadata } from "next";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";

  return {
    title: "FAQ | Common Questions About Business Setup in Indonesia",
    description: "Answers to frequently asked questions about company registration, PT PMA, licensing, and compliance in Indonesia.",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/resources/faq`,
      languages: {
        "en": `https://www.mcsc.co.id/en/resources/faq`,
        "id": `https://www.mcsc.co.id/id/resources/faq`,
        "zh": `https://www.mcsc.co.id/cn/resources/faq`,
        "x-default": `https://www.mcsc.co.id/en/resources/faq`,
      },
    },
  };
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
