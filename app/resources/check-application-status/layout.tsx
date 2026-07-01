import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Application Status | Track Your Business Registration",
  description: "Check the real-time status of your business license, NIB, or company registration application in Indonesia.",
  alternates: {
    canonical: "https://www.mcsc.co.id/resources/check-application-status",
  },
};

export default function CheckApplicationStatusLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
