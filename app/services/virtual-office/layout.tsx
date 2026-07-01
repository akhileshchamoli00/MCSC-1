import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Virtual Office Indonesia | Jakarta & Tangerang Locations",
  description: "Get a registered virtual office address in Tangerang Regency or North Jakarta for your business registration and compliance needs.",
  alternates: {
    canonical: "https://www.mcsc.co.id/services/virtual-office",
  },
};

export default function VirtualOfficeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
