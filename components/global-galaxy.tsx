"use client";

import SplashCursor from "@/components/ui/SplashCursor";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function GlobalGalaxy() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-auto bg-background transition-colors duration-500">
      <div className="w-full h-full opacity-80 flex items-center justify-center">
        <div
          style={{ width: "1080px", height: "1080px", position: "relative" }}
        >
          <SplashCursor
            SIM_RESOLUTION={128}
            DYE_RESOLUTION={1440}
            DENSITY_DISSIPATION={3.5}
            VELOCITY_DISSIPATION={2}
            PRESSURE={0.1}
            CURL={3}
            SPLAT_RADIUS={0.2}
            SPLAT_FORCE={6000}
            COLOR_UPDATE_SPEED={10}
          />
        </div>
      </div>
    </div>
  );
}
