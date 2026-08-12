"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserProvider } from "@/contexts/user-context";
import { Users, Briefcase, ChevronRight, Loader2, LogOut, CheckCircle, ShieldCheck } from "lucide-react";
import { AskLogo } from "@/components/ask-logo";
import FloatingLines from "@/components/floating-lines";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const ENABLED_WAVES = ["top", "middle", "bottom"];

export default function SelectSystemPage() {
  return (
    <UserProvider>
      <SelectSystemContent />
    </UserProvider>
  );
}

function SelectSystemContent() {
  const { profile, allowedModes, setMode, setPreferredMode, preferredMode, loading, refreshProfile } = useUser();
  const [rememberSelection, setRememberSelection] = useState(false);
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);

  // Auto-redirect if only one mode is allowed
  useEffect(() => {
    if (!loading) {
      if (allowedModes.length === 1) {
        const target = allowedModes[0];
        router.push(`/${target}/dashboard`);
      } else if (allowedModes.length === 0) {
        // No modes allowed, logout
        handleLogout();
      }
    }
  }, [loading, allowedModes, router]);

  // Read preferred mode from cache if saved and automatically open it
  useEffect(() => {
    if (!loading && allowedModes.length > 1) {
      const savedPref = localStorage.getItem("preferred_system") as "hrms" | "business";
      if (savedPref && allowedModes.includes(savedPref)) {
        setTransitioning(true);
        setMode(savedPref);
        router.push(`/${savedPref}/dashboard`);
      }
    }
  }, [loading, allowedModes, router, setMode]);

  const selectMode = (mode: "hrms" | "business") => {
    setTransitioning(true);
    setMode(mode);
    if (rememberSelection) {
      setPreferredMode(mode);
    }
    router.push(`/${mode}/dashboard`);
  };

  const handleLogout = () => {
    localStorage.removeItem("hrms_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_id");
    localStorage.removeItem("hrms_permissions");
    localStorage.removeItem("hrms_profile");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  };

  if (loading || transitioning || allowedModes.length <= 1) {
    return (
      <div className="dark">
        <div className="flex h-screen w-full items-center justify-center bg-background text-foreground relative overflow-hidden">
          <div className="absolute inset-0 w-full h-full z-0">
            <FloatingLines enabledWaves={ENABLED_WAVES} lineCount={3} gradientStart="#065eee" gradientMid="#10B981" gradientEnd="#EAB308" />
          </div>
          <div className="flex flex-col items-center gap-4 relative z-10">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-sm text-muted-foreground font-semibold">Configuring your workspaces...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark select-none">
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden text-foreground">
        
        {/* Animated Lines Background */}
        <div className="absolute inset-0 bg-grid-slate-200/20 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-800/10 opacity-30 z-0 pointer-events-none" />
        <div className="absolute inset-0 w-full h-full z-0">
          <FloatingLines
            enabledWaves={ENABLED_WAVES}
            lineCount={3}
            lineDistance={34}
            bendRadius={24}
            bendStrength={0}
            interactive
            parallax={true}
            animationSpeed={1.5}
            gradientStart="#059669"
            gradientMid="#065eee"
            gradientEnd="#4f46e5"
          />
        </div>

        {/* Floating Glowing blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[130px] pointer-events-none -z-10" />

        <div className="relative z-10 w-full max-w-5xl space-y-8">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <AskLogo className="h-16 w-auto" />
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-sky-300 to-indigo-400">
                Where would you like to go?
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base font-medium mt-2">
                Select your work environment to launch operations.
              </p>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            
            {/* Card 1: HRMS */}
            <motion.div
              whileHover={{ scale: 1.025, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d14]/60 p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:shadow-emerald-500/5"
              onClick={() => selectMode("hrms")}
            >
              {/* Card Ambient Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex flex-col justify-between h-full space-y-8 relative z-10">
                <div className="space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                    <Users className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      MCS HRMS Platform
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed mt-2.5">
                      Manage employees, attendance, leave, payroll, assets, performance reviews, and company HR operations.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-5">
                  <span className="text-xs text-muted-foreground font-semibold">HR Operations</span>
                  <button className="h-10 px-5 rounded-lg text-xs font-bold bg-white text-black hover:bg-slate-100 flex items-center gap-1 shadow-sm transition-all duration-300">
                    Open HRMS
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Business Platform */}
            <motion.div
              whileHover={{ scale: 1.025, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d14]/60 p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-primary/30 hover:shadow-primary/5"
              onClick={() => selectMode("business")}
            >
              {/* Card Ambient Glow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex flex-col justify-between h-full space-y-8 relative z-10">
                <div className="space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      MCS Business Platform
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed mt-2.5">
                      Manage partner directories, work orders, service deliverables, consulting catalog, and project chat pipelines.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-5">
                  <span className="text-xs text-muted-foreground font-semibold">Daily Business</span>
                  <button className="h-10 px-5 rounded-lg text-xs font-bold bg-white text-black hover:bg-slate-100 flex items-center gap-1 shadow-sm transition-all duration-300">
                    Open Business
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-6 gap-4">
            {/* Remember my Selection checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-400 hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={rememberSelection}
                onChange={(e) => setRememberSelection(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-black/40 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span className="font-semibold">Remember my selection for future logins</span>
            </label>

            {/* Logout/Profile details */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Logged In As</span>
                <span className="text-xs text-slate-200 font-semibold block">{profile ? `${profile.first_name} ${profile.last_name}` : "User"}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="h-9 px-4 rounded-lg border border-white/10 hover:border-red-500/20 hover:bg-red-500/10 text-slate-300 hover:text-red-400 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all duration-300 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
