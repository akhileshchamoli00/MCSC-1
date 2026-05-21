"use client"

import SplashCursor from "@/components/ui/SplashCursor"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function GlobalGalaxy() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDarkMode = resolvedTheme === "dark"

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-auto">
      {isDarkMode ? (
        <div className="w-full h-full opacity-80 flex items-center justify-center">
          <div style={{ width: '1080px', height: '1080px', position: 'relative' }}>
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
      ) : (
        <div className="w-full h-full opacity-30">
          <SplashCursor
            DENSITY_DISSIPATION={0.5}
            VELOCITY_DISSIPATION={0.8}
            PRESSURE={0.5}
            CURL={7}
            SPLAT_RADIUS={0.5}
            SPLAT_FORCE={5000}
            COLOR_UPDATE_SPEED={11}
            SHADING
            RAINBOW_MODE
            COLOR="#5557f7"
          />
        </div>
      )}
    </div>
  )
}
