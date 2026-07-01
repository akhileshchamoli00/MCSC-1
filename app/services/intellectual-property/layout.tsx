import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trademark & IP Registration Indonesia | Brand Protection",
  description: "Register and protect your trademark, brand, and intellectual property rights in Indonesia with full legal support.",
  alternates: {
    canonical: "https://www.mcsc.co.id/services/intellectual-property",
  },
};

export default function IntellectualPropertyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
