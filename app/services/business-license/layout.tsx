import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business License Registration Indonesia | NIB, NPWP, BPJS",
  description: "Get your NIB, PKKPR, NPWP, BPJS Health/Employment, and LKPM reporting handled. Business licensing services across Indonesia.",
  alternates: {
    canonical: "https://www.mcsc.co.id/services/business-license",
  },
};

export default function BusinessLicenseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
