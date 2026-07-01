import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indonesia KITAS, Visas & Work Permit Services | PMA Expatriates",
  description: "Streamlined handling of expatriate work permits (IMTA/RPTKA), investor KITAS, working KITAS, spouse KITAS, and business visa applications.",
};

export default function WorkPermitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
