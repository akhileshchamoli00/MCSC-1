import type { Metadata } from "next";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";

  return {
    title: "Our Services | Business Setup, Licensing & Compliance in Indonesia",
    description: "Company registration, business licensing, document changes, agreements, virtual office, work permits, and IP registration — all in one place.",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/services`,
      languages: {
        "en": `https://www.mcsc.co.id/en/services`,
        "id": `https://www.mcsc.co.id/id/services`,
        "zh": `https://www.mcsc.co.id/cn/services`,
        "x-default": `https://www.mcsc.co.id/en/services`,
      },
    },
  };
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
