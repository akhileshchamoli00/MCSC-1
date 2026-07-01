import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources | Business Tools & Guides for Indonesia",
  description: "Brand classification lookup, application status checker, KBLI directory, and FAQ — free resources for doing business in Indonesia.",
  alternates: {
    canonical: "https://www.mcsc.co.id/resources",
  },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
