import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Agreement Drafting | Contracts & Agreements Indonesia",
  description: "Draft cooperation agreements, sale and purchase agreements, license agreements, and notarial documents for your business in Indonesia.",
  alternates: {
    canonical: "https://www.mcsc.co.id/services/agreements",
  },
};

export default function AgreementsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
