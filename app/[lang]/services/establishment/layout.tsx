import type { Metadata } from "next";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";

  return {
    title: "Company Registration in Indonesia | PT, PT PMA, CV Setup",
    description: "Establish a local PT, foreign-owned PT PMA, CV, foundation, or firm in Indonesia. Full deed, NPWP, NIB, and OSS registration support.",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/services/establishment`,
      languages: {
        "en": `https://www.mcsc.co.id/en/services/establishment`,
        "id": `https://www.mcsc.co.id/id/services/establishment`,
        "zh": `https://www.mcsc.co.id/cn/services/establishment`,
        "x-default": `https://www.mcsc.co.id/en/services/establishment`,
      },
    },
  };
}

export default function EstablishmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
