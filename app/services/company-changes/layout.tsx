import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Structure & Deed Changes in Indonesia | KBLI Adjustments",
  description: "Update your company deed, adjust shareholder structures, change directors, or update KBLI codes in Indonesia with full legal compliance.",
};

export default function CompanyChangesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
