"use client";

import SplashCursor from "@/components/ui/SplashCursor";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function GlobalGalaxy() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMobile(window.innerWidth < 768);
  }, []);

  if (!mounted || isMobile) return null;

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-auto bg-background transition-colors duration-500">
      <div className="w-full h-full opacity-80 flex items-center justify-center">
        <div
          style={{ width: "1080px", height: "1080px", position: "relative" }}
        >
          <SplashCursor
            SIM_RESOLUTION={32}
            DYE_RESOLUTION={256}
            DENSITY_DISSIPATION={2}
            VELOCITY_DISSIPATION={1}
            PRESSURE={0.1}
            CURL={1}
            SPLAT_RADIUS={0.1}
            SPLAT_FORCE={1000}
            COLOR_UPDATE_SPEED={2}
          />
        </div>
      </div>
    </div>
  );
}