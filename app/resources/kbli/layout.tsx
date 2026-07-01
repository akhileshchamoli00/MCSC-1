import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KBLI Directory | Indonesian Business Classification Codes",
  description: "Search KBLI codes to find the correct business classification for your company registration in Indonesia.",
  alternates: {
    canonical: "https://www.mcsc.co.id/resources/kbli",
  },
};

export default function Kblilayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
