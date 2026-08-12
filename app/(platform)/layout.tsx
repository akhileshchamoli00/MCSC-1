"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Wallet, 
  Settings, 
  LogOut,
  Bell,
  Monitor,
  Star,
  Shield,
  Coffee,
  User,
  ChevronDown,
  ChevronRight,
  BriefcaseBusiness,
  UserCircle,
  ChevronsUpDown,
  ChevronsDownUp,
  Maximize2,
  Minimize2,
  Menu,
  Clock
} from "lucide-react";
import { resolveImageUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { HRMSSidebar } from "@/components/hrms-sidebar";
import { AskLogo } from "@/components/ask-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { UserProvider, useUser } from "@/contexts/user-context";

export default function HRMSLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <HRMSLayoutContent>{children}</HRMSLayoutContent>
    </UserProvider>
  );
}

function HRMSLayoutContent({ children }: { children: React.ReactNode }) {
  const { profile: userProfile, isAdmin, loading, currentMode, setMode, allowedModes } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Route protection and authentication guards
  useEffect(() => {
    const token = localStorage.getItem("hrms_token");
    if (!loading) {
      if (!token || (!userProfile && !isAdmin)) {
        localStorage.removeItem("hrms_token");
        router.push("/login");
        return;
      }

      // Route guards
      const isHrmsRoute = pathname.startsWith("/hrms");
      const isBusinessRoute = pathname.startsWith("/business");
      
      if (isHrmsRoute && !allowedModes.includes("hrms")) {
        router.push("/select-system");
      } else if (isBusinessRoute && !allowedModes.includes("business")) {
        router.push("/select-system");
      }
    }
  }, [loading, userProfile, isAdmin, allowedModes, pathname, router]);

  // Sync mode with pathname
  useEffect(() => {
    if (pathname.startsWith("/business") && currentMode !== "business") {
      setMode("business");
    } else if (pathname.startsWith("/hrms") && currentMode !== "hrms") {
      setMode("hrms");
    }
  }, [pathname, currentMode, setMode]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const dashboardLink = currentMode === "business" ? "/business/dashboard" : "/hrms/dashboard";

  return (
    <div className="flex h-screen bg-white dark:bg-background/80 dark:backdrop-blur-sm overflow-hidden selection:bg-primary/20 relative z-0">
      
      {/* Background Glowing Orbs & Tech Grid Overlay */}
      <div className="absolute inset-0 cyber-grid-overlay pointer-events-none -z-20" />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary glow-orb pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent glow-orb pointer-events-none -z-10" />
      <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-indigo-500 glow-orb pointer-events-none -z-10" />

      {/* Sidebar Component */}
      <HRMSSidebar 
        isAdmin={isAdmin} 
        userProfile={userProfile} 
        isMobileOpen={isSidebarOpen} 
        setIsMobileOpen={setIsSidebarOpen} 
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-y-auto w-full transition-all">
          {/* Top Header */}
          <header className="relative w-full bg-transparent border-none shadow-none flex items-center justify-between px-6 h-[104px] shrink-0 transition-all">
            <div className="flex items-center">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Link href={dashboardLink} className="flex items-center gap-2 ml-2 group cursor-pointer">
                <AskLogo className="h-16 w-auto transition-transform duration-300 group-hover:scale-105" />
              </Link>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <NotificationBell />
              <ThemeToggle />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-[80px] w-[80px] rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-border/40 overflow-hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-sm ml-1">
                    {userProfile?.profile_photo ? (
                      <img src={resolveImageUrl(userProfile.profile_photo)} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      userProfile ? `${userProfile.first_name?.[0] || ""}${userProfile.last_name?.[0] || ""}` : <User className="w-8 h-8" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 mt-2">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "Administrator"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userProfile?.user?.email || "admin@mcs.com"}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/hrms/profile" className="cursor-pointer w-full flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                    <Link href="/" className="w-full flex items-center" onClick={() => {
                      localStorage.removeItem("hrms_token");
                      localStorage.removeItem("user_role");
                      localStorage.removeItem("user_email");
                      localStorage.removeItem("user_id");
                      localStorage.removeItem("hrms_permissions");
                      localStorage.removeItem("hrms_profile");
                      sessionStorage.clear();
                      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, { method: "POST" }).catch(() => {});
                    }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
  );
}
