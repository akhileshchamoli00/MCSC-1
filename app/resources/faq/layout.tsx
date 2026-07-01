import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Common Questions About Business Setup in Indonesia",
  description: "Answers to frequently asked questions about company registration, PT PMA, licensing, and compliance in Indonesia.",
  alternates: {
    canonical: "https://www.mcsc.co.id/resources/faq",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
