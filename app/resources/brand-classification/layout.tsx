import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Classification Search | Trademark Classes Indonesia",
  description: "Look up the correct trademark class for your brand or product before registering intellectual property in Indonesia.",
  alternates: {
    canonical: "https://www.mcsc.co.id/resources/brand-classification",
  },
};

export default function BrandClassificationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
