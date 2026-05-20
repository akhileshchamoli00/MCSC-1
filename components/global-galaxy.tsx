"use client"

import Galaxy from "@/components/ui/Galaxy"
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
        <div className="w-full h-full opacity-80">
          <Galaxy
            mouseRepulsion
            mouseInteraction
            density={1}
            glowIntensity={0.3}
            saturation={0}
            hueShift={140}
            twinkleIntensity={0.3}
            rotationSpeed={0.1}
            repulsionStrength={2}
            autoCenterRepulsion={0}
            starSpeed={0.5}
            speed={1}
            transparent={true}
            lerpFactor={0.25}
          />
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
