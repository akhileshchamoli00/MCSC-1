"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ConsultantsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/client/orders");
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Redirecting to My Orders...</p>
      </div>
    </div>
  );
}
