import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About MCS Consulting | Business Licensing Experts Since 2013",
  description: "MCS Consulting has helped 500+ local and foreign businesses register, license, and stay compliant in Indonesia since 2013. Meet our team.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
