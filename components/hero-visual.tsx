"use client"

import { motion } from "framer-motion"
import { Shield, Activity, CheckCircle2, BarChart3, ArrowUpRight, Lock, Globe, Zap, Cpu, Search, Landmark, FileText, Briefcase, Scale, Stamp, PieChart, Users } from "lucide-react"
import { useEffect, useState } from "react"

const TickerItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono text-emerald-500 whitespace-nowrap bg-emerald-500/5 rounded-full border border-emerald-500/20">
    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
    {text}
  </div>
)

const SatelliteIcon = ({ icon: Icon, delay, x, y, label }: any) => (
  <motion.div 
     initial={{ opacity: 0, scale: 0 }}
     animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0.8, 1.1, 1.1, 0.8],
        y: [0, -30, 0] 
     }}
     transition={{ 
        duration: 8, 
        repeat: Infinity, 
        delay,
        times: [0, 0.2, 0.8, 1]
     }}
     className="absolute h-16 w-16 rounded-2xl border-2 border-primary/30 bg-primary/10 backdrop-blur-2xl flex flex-col items-center justify-center text-primary shadow-[0_0_30px_rgba(59,130,246,0.3)] group z-30"
     style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
  >
     <Icon className="h-7 w-7 transition-transform group-hover:scale-125 transition-colors" />
     <span className="text-[8px] font-bold uppercase mt-1 tracking-tighter text-foreground bg-primary/20 px-1 rounded">{label}</span>
  </motion.div>
)

const MetricCard = ({ icon: Icon, label, value, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="w-full max-w-[280px]"
  >
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl hover:bg-white/10 transition-colors w-full flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-lg font-bold font-mono">{value}</div>
    </div>
  </motion.div>
)

export function HeroVisual() {
  const [score, setScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0
      const interval = setInterval(() => {
        if (current >= 100) {
          clearInterval(interval)
        } else {
          current += 1
          setScore(current)
        }
      }, 20)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const tickerMessages = [
    "PT JAYA ABADI - NIB ISSUED",
    "CV MAJU MAPAN - TAX FILING SUCCESS",
    "PT GLOBAL TECH - PMA LICENSED",
    "YAYASAN BAKTI - LEGALIZED",
    "PT SURYA ENERGI - NPWP ACTIVATED",
    "CV KARYA UTAMA - SBU APPROVED",
    "PT MEKAR SARI - ISO COMPLIANT",
  ]

  return (
    <div className="relative h-[650px] w-full max-w-[650px] flex items-center justify-center p-8">
      {/* Expanded Dashboard Grid Background */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 gap-px opacity-20 pointer-events-none">
        {[...Array(144)].map((_, i) => (
          <div key={i} className="border-[0.5px] border-primary/10" />
        ))}
      </div>

      {/* Relocated Satellite Modules */}
      <SatelliteIcon icon={Landmark} delay={0} x={10} y={-10} label="TAX OFFICE" />
      <SatelliteIcon icon={Globe} delay={1.5} x={45} y={-15} label="GLOBAL" />
      <SatelliteIcon icon={Search} delay={3} x={80} y={-10} label="SCAN" />
      <SatelliteIcon icon={Scale} delay={4.5} x={-15} y={35} label="LEGAL" />
      <SatelliteIcon icon={Shield} delay={6} x={-20} y={65} label="SAFE" />
      <SatelliteIcon icon={Stamp} delay={2} x={5} y={110} label="LICENSES" />
      <SatelliteIcon icon={Briefcase} delay={4} x={35} y={115} label="PERMITS" />
      <SatelliteIcon icon={PieChart} delay={5.5} x={65} y={110} label="FISCAL" />

      {/* Borderless BORDERLESS HUD Style */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full h-full flex flex-col gap-8"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-primary/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-500 uppercase">System Active</span>
          </div>
          <div className="text-[10px] font-mono text-primary/60">LIVE FEED: MCS-CORE-v4</div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Central Compliance Score - Back to Clean Borderless HUD style */}
          <div className="col-span-1 row-span-2 relative flex flex-col items-center justify-center max-w-[150px] aspect-square">
            <div className="h-full w-full flex flex-col items-center justify-center rounded-full border border-primary/20 bg-primary/5 backdrop-blur-3xl p-6 overflow-hidden group shadow-lg">
                <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-1 border border-dashed border-primary/10 rounded-full"
                />
                <div className="relative text-center">
                <motion.div 
                    className="text-3xl font-mono font-bold text-primary"
                >
                    {score}%
                </motion.div>
                <div className="text-[7px] font-bold text-muted-foreground uppercase tracking-[0.1em] mt-0.5">Compliance</div>
                </div>
            </div>
          </div>

          <div className="col-span-2 flex flex-col gap-4">
              <MetricCard icon={Shield} label="Licenses" value="1,284+" delay={0.2} />
              <MetricCard icon={Users} label="Clients" value="1,000+" delay={0.4} />
          </div>
        </div>

        {/* Live Ticker Area */}
        <div className="relative border-y border-primary/10 py-6 overflow-hidden h-40">
          <div className="absolute left-0 top-0 z-20 flex items-center gap-2 text-[9px] font-bold text-primary/60 uppercase tracking-widest bg-background/80 px-2 py-0.5 rounded">
             <BarChart3 className="h-3 w-3" />
             Live Approval Feed
          </div>
          <motion.div 
            animate={{ y: [0, -250] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="flex flex-col gap-3 pt-6"
          >
            {[...tickerMessages, ...tickerMessages].map((msg, i) => (
              <TickerItem key={i} text={msg} />
            ))}
          </motion.div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>

        {/* Bottom Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-primary/20 pt-6">
          <div className="flex items-center gap-4">
             <CheckCircle2 className="h-5 w-5 text-emerald-500" />
             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Global Business Framework v4.0
             </div>
          </div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 text-primary"
          >
            <span className="text-[10px] font-bold">READY</span>
            <ArrowUpRight className="h-4 w-4" />
          </motion.div>
        </div>
      </motion.div>

      {/* Decorative Blur Glows */}
      <div className="absolute -left-40 -top-20 h-96 w-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -right-40 -bottom-20 h-96 w-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  )
}
