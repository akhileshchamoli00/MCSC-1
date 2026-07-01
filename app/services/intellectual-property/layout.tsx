import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trademark, Patent & Brand Registration in Indonesia | IP Services",
  description: "Protect your intellectual property in Indonesia. Register trademarks, brands, patents, and copyrights through our expert IP consulting services.",
};

export default function IntellectualPropertyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
