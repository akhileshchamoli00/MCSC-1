"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";

export default function DashboardRedirectPage() {
  const { allowedModes, currentMode, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (allowedModes.includes(currentMode)) {
        router.push(`/${currentMode}/dashboard`);
      } else if (allowedModes.length > 0) {
        router.push(`/${allowedModes[0]}/dashboard`);
      } else {
        router.push("/select-system");
      }
    }
  }, [loading, allowedModes, currentMode, router]);

  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <p className="text-xs text-muted-foreground">Redirecting to your platform...</p>
      </div>
    </div>
  );
}
