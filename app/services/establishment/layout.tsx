import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Registration in Indonesia | PT, PT PMA, CV Setup",
  description: "Establish a local PT, foreign-owned PT PMA, CV, foundation, or firm in Indonesia. Full deed, NPWP, NIB, and OSS registration support.",
  alternates: {
    canonical: "https://www.mcsc.co.id/services/establishment",
  },
};

export default function EstablishmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
