import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Services | Business Setup, Licensing & Compliance in Indonesia",
  description: "Company registration, business licensing, document changes, agreements, virtual office, work permits, and IP registration — all in one place.",
  alternates: {
    canonical: "https://www.mcsc.co.id/services",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
