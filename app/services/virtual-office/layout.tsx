import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Virtual Office Address Jakarta & Tangerang | MCS Consulting",
  description: "Premium virtual office addresses in Jakarta and Tangerang with mail handling, call forwarding, and meeting room access to fulfill your NIB requirements.",
};

export default function VirtualOfficeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
