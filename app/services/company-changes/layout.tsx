import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Document & Structure Changes | PT, CV, Foundation Amendments",
  description: "Update your company's deed, structure, or documents for PT, CV, PT Individual, Foundation, Firm, or Cooperative in Indonesia.",
  alternates: {
    canonical: "https://www.mcsc.co.id/services/company-changes",
  },
};

export default function CompanyChangesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
