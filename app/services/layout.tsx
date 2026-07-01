import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Business & Licensing Services in Indonesia | MCS Consulting",
  description: "Explore our complete range of company establishment, business licensing, tax compliance, virtual office, and work permit services in Indonesia.",
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
