"use client"

import { motion } from "framer-motion"
import { Shield, Scale, Star, Compass, Award, Heart, TrendingUp, Zap, Globe, Building, Users, ShieldCheck, Sun } from "lucide-react"
import ElectricBorder from "./ui/ElectricBorder"

const PlanetCard = ({ icon: Icon, label, delay, orbitDuration, distance, size }: any) => {
  return (
    <motion.div
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: orbitDuration,
        repeat: Infinity,
        ease: "linear",
        delay
      }}
      className="absolute top-1/2 left-1/2"
    >
      <motion.div
        animate={{
          rotate: -360, // Keep card upright
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: orbitDuration, repeat: Infinity, ease: "linear", delay },
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: Math.random() }
        }}
        className="relative -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
        style={{ marginLeft: distance }}
      >
        <ElectricBorder borderRadius={100} color="#3b82f6" speed={0.5} chaos={0.08}>
            <div 
            className="rounded-full border border-white/20 bg-white/5 backdrop-blur-xl flex items-center justify-center text-primary shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all group-hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] group-hover:border-primary/50"
            style={{ width: size, height: size }}
            >
            <Icon className="h-1/2 w-1/2" />
            </div>
        </ElectricBorder>
        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <span className="text-[10px] font-bold text-foreground uppercase tracking-widest bg-background/80 px-2 py-0.5 rounded-full border border-white/10">
                {label}
            </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

const OrbitalRing = ({ radius, delay }: { radius: number; delay: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ delay, duration: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-primary/20 rounded-full"
        style={{ width: radius * 2, height: radius * 2 }}
    />
)

export function AboutVisual() {
  const planets = [
    { icon: Shield, label: "Trust", orbitDuration: 15, distance: 100, size: 40, delay: 0 },
    { icon: Scale, label: "Integrity", orbitDuration: 22, distance: 140, size: 45, delay: -5 },
    { icon: Star, label: "Excellence", orbitDuration: 30, distance: 180, size: 50, delay: -10 },
    { icon: TrendingUp, label: "Growth", orbitDuration: 38, distance: 220, size: 55, delay: -15 },
    { icon: Zap, label: "Innovation", orbitDuration: 45, distance: 260, size: 60, delay: -20 },
    { icon: Globe, label: "Global", orbitDuration: 55, distance: 300, size: 65, delay: -25 },
  ]

  return (
    <div className="relative h-[650px] w-full max-w-[700px] flex items-center justify-center overflow-visible perspective-[1200px]">
      {/* Galaxy Background Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
            className="absolute h-0.5 w-0.5 bg-white rounded-full"
            style={{ 
                left: `${Math.random() * 100}%`, 
                top: `${Math.random() * 100}%` 
            }}
          />
        ))}
      </div>

      {/* Tilted Orbital Plane */}
      <motion.div 
        animate={{ rotateX: 65, rotateZ: [0, 5, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-full h-full flex items-center justify-center"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Orbital Rings */}
        {planets.map((p, i) => (
            <OrbitalRing key={i} radius={p.distance} delay={i * 0.2} />
        ))}

        {/* The Central Sun (Corporate Core) */}
        <div className="relative z-10" style={{ transform: "rotateX(-65deg)" }}>
          <ElectricBorder borderRadius={100} color="#3b82f6" speed={1.5} chaos={0.2}>
            <motion.div
                animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                    "0 0 40px rgba(59,130,246,0.2)",
                    "0 0 80px rgba(59,130,246,0.6)",
                    "0 0 40px rgba(59,130,246,0.2)"
                ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="h-28 w-28 rounded-full bg-gradient-to-br from-primary via-primary/80 to-background flex items-center justify-center relative overflow-hidden"
            >
                <Sun className="h-14 w-14 text-white animate-spin-slow" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)]" />
            </motion.div>
          </ElectricBorder>
          
          {/* Solar Flares */}
          {[...Array(4)].map((_, i) => (
            <motion.div
               key={i}
               animate={{ rotate: 360, scale: [1, 1.2, 1] }}
               transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }}
               className="absolute -inset-4 border border-primary/20 rounded-full border-t-white/40"
            />
          ))}
        </div>

        {/* Planet Cards */}
        {planets.map((p, i) => (
          <div key={i} style={{ transform: "rotateX(-65deg)" }}>
            <PlanetCard 
                icon={p.icon} 
                label={p.label} 
                orbitDuration={p.orbitDuration} 
                distance={p.distance} 
                size={p.size}
                delay={p.delay}
            />
          </div>
        ))}
      </motion.div>

      {/* Decorative Nebula Glow */}
      <div className="absolute -z-10 h-[500px] w-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -z-10 h-[400px] w-[400px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none animate-pulse" />
    </div>
  )
}
