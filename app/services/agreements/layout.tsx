import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Agreement Drafting & Translation Services | Indonesia",
  description: "Professional draft, review, and sworn translation services for lease agreements, employee contracts, partnership deeds, and corporate compliance.",
};

export default function AgreementsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
