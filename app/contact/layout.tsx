import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact MCS Consulting | Jakarta & Tangerang Offices",
  description: "Reach MCS Consulting's Jakarta head office or Tangerang branch. WhatsApp, phone, and email support for your Indonesia business setup.",
  alternates: {
    canonical: "https://www.mcsc.co.id/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
