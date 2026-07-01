import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work Permit & KITAS Services Indonesia | Foreign Employees",
  description: "KITAS, KITAP, RPTKA, and foreign worker permit management for companies employing expatriates in Indonesia.",
  alternates: {
    canonical: "https://www.mcsc.co.id/services/work-permit",
  },
};

export default function WorkPermitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
