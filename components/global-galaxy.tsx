"use client"

import Galaxy from "@/components/ui/Galaxy"
import Particles from "@/components/ui/Particles"
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
            starSpeed={0.3}
            density={0.6}
            hueShift={140}
            speed={1}
            glowIntensity={0.3}
            saturation={0}
            mouseRepulsion={true}
            repulsionStrength={2}
            twinkleIntensity={0.3}
            rotationSpeed={0.1}
            transparent={true}
          />
        </div>
      ) : (
        <div className="w-full h-full opacity-30">
          <Particles
            particleCount={200}
            particleSpread={10}
            speed={0.1}
            particleColors={["#000000", "#000000", "#000000"]}
            moveParticlesOnHover={false}
            particleHoverFactor={1}
            alphaParticles={false}
            particleBaseSize={200}
            sizeRandomness={1}
            cameraDistance={20}
            disableRotation={false}
          />
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
