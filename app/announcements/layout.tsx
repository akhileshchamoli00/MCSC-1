import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulations & Announcements | Indonesian Business Law Updates",
  description: "Stay current on the latest Indonesian government regulations, tax laws, and business compliance announcements.",
  alternates: {
    canonical: "https://www.mcsc.co.id/announcements",
  },
};

export default function AnnouncementsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
