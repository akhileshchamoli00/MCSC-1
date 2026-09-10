import type { Metadata } from "next";

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const lang = params.lang || "en";

  return {
    title: "Track Order Status & Client Chat | MCS Consulting",
    description: "Track your real-time company registration, licensing order progress, milestones, and communicate directly with assigned consultants.",
    alternates: {
      canonical: `https://www.mcsc.co.id/${lang}/track-order`,
      languages: {
        "en": `https://www.mcsc.co.id/en/track-order`,
        "id": `https://www.mcsc.co.id/id/track-order`,
        "zh": `https://www.mcsc.co.id/cn/track-order`,
        "x-default": `https://www.mcsc.co.id/en/track-order`,
      },
    },
  };
}

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
