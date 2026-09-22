"use client";

import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
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
  Clock,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  Layers,
  FolderOpen,
  ShieldCheck,
  CheckSquare,
  UserCheck,
  MessageSquare,
  Megaphone
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

function getHeaderInfo(pathname: string, currentMode: string): {
  title: string;
  subtitle?: string;
  icon?: any;
  iconColor?: string;
} {
  if (pathname.includes("/dashboard")) {
    return {
      title: "Dashboard",
      subtitle: currentMode === "business" ? "Overview of orders, invoices, clients & metrics" : "HRMS executive overview, attendance & staff metrics",
      icon: LayoutDashboard,
      iconColor: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30 shadow-[0_0_8px_rgba(129,140,248,0.25)]"
    };
  }
  if (pathname.includes("/clients/companies")) {
    return {
      title: "Company Directory",
      subtitle: "Manage corporate partner profiles, key contacts, and administrative profile validation.",
      icon: Building2,
      iconColor: "text-sky-400 bg-sky-500/15 border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.25)]"
    };
  }
  if (pathname.includes("/clients/services")) {
    return {
      title: "Service Catalog & Base Price",
      subtitle: "Manage client service offerings, job IDs, base prices, and partner tier discount matrices.",
      icon: Layers,
      iconColor: "text-violet-400 bg-violet-500/15 border-violet-500/30 shadow-[0_0_8px_rgba(167,139,250,0.25)]"
    };
  }
  if (pathname.includes("/clients/notaries")) {
    return {
      title: "Notary & Partner Directory",
      subtitle: "Manage trusted notary partners, commission tiers, and disbursement bank details.",
      icon: ShieldCheck,
      iconColor: "text-amber-400 bg-amber-500/15 border-amber-500/30 shadow-[0_0_8px_rgba(251,191,36,0.25)]"
    };
  }
  if (pathname.includes("/clients/orders/pipeline")) {
    return {
      title: "Pipeline Orders",
      subtitle: "Track incoming deals and prospective orders before activation.",
      icon: Clock,
      iconColor: "text-amber-400 bg-amber-500/15 border-amber-500/30 shadow-[0_0_8px_rgba(251,191,36,0.25)]"
    };
  }
  if (pathname.includes("/clients/orders/workload")) {
    return {
      title: "Team Workload",
      subtitle: "Consultant & reviewer assignment matrix, capacity distribution, and productivity overview.",
      icon: Users,
      iconColor: "text-purple-400 bg-purple-500/15 border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.25)]"
    };
  }
  if (pathname.includes("/clients/orders/completed")) {
    return {
      title: "Completed Orders",
      subtitle: "Archive of fulfilled client orders and delivered documents.",
      icon: CheckCircle,
      iconColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.25)]"
    };
  }
  if (pathname.includes("/clients/orders/cancelled")) {
    return {
      title: "Cancelled Orders",
      subtitle: "Audit log of cancelled orders and voided invoice records.",
      icon: XCircle,
      iconColor: "text-rose-400 bg-rose-500/15 border-rose-500/30 shadow-[0_0_8px_rgba(251,113,133,0.25)]"
    };
  }
  if (pathname.includes("/clients/orders/notary-payments")) {
    return {
      title: "Notary Settlements",
      subtitle: "Track notary disbursements, payout statuses, and payment receipts.",
      icon: Wallet,
      iconColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.25)]"
    };
  }
  if (pathname.includes("/clients/orders")) {
    return {
      title: "Active Orders",
      subtitle: "Manage client service orders in progress, assign consultants, and track billing.",
      icon: FileText,
      iconColor: "text-blue-400 bg-blue-500/15 border-blue-500/30 shadow-[0_0_8px_rgba(96,165,250,0.25)]"
    };
  }
  if (pathname.includes("/clients/documents")) {
    return {
      title: "Shared Documents",
      subtitle: "Secure cloud storage repository for verified legal deliverables.",
      icon: FolderOpen,
      iconColor: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30 shadow-[0_0_8px_rgba(129,140,248,0.25)]"
    };
  }
  if (pathname.includes("/assigned-orders")) {
    return {
      title: "Assigned Orders",
      subtitle: "View and execute orders assigned directly to your desk.",
      icon: CheckSquare,
      iconColor: "text-teal-400 bg-teal-500/15 border-teal-500/30 shadow-[0_0_8px_rgba(45,212,191,0.25)]"
    };
  }
  if (pathname.includes("/teams")) {
    return {
      title: "Teams & Squads",
      subtitle: "Organize internal consulting squads and staff assignments.",
      icon: Users,
      iconColor: "text-purple-400 bg-purple-500/15 border-purple-500/30 shadow-[0_0_8px_rgba(192,132,252,0.25)]"
    };
  }
  if (pathname.includes("/clients/assign")) {
    return {
      title: "Assign Consultants",
      subtitle: "Map MCS employee accounts as advisors or primary managers to registered clients.",
      icon: UserCheck,
      iconColor: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30 shadow-[0_0_8px_rgba(129,140,248,0.25)]"
    };
  }
  if (pathname.includes("/chat")) {
    return {
      title: "Communication Center",
      subtitle: "Real-time client conversations, document dispatching, and support chats.",
      icon: MessageSquare,
      iconColor: "text-sky-400 bg-sky-500/15 border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.25)]"
    };
  }
  if (pathname.includes("/announcements")) {
    return {
      title: "Announcements & Bulletins",
      subtitle: currentMode === "business" 
        ? "Author, preview, schedule, and broadcast corporate notices to client portal and teams."
        : "View company-wide notices, operational schedules, policy circulars, and executive updates.",
      icon: Megaphone,
      iconColor: "text-amber-400 bg-amber-500/15 border-amber-500/30 shadow-[0_0_8px_rgba(251,191,36,0.25)]"
    };
  }
  if (pathname.includes("/clients")) {
    return {
      title: "Partner Directory",
      subtitle: "Manage partner companies, representative details, and portal credentials.",
      icon: Users,
      iconColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.25)]"
    };
  }
  if (pathname.includes("/employees/new")) {
    return {
      title: "Add New Employee",
      subtitle: "Onboard new employee profile and contract parameters.",
      icon: Users,
      iconColor: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30 shadow-[0_0_8px_rgba(129,140,248,0.25)]"
    };
  }
  if (pathname.includes("/employees")) {
    return {
      title: "Employee Directory",
      subtitle: "Manage team members, designations, contracts, and employment statuses.",
      icon: Users,
      iconColor: "text-purple-400 bg-purple-500/15 border-purple-500/30 shadow-[0_0_8px_rgba(192,132,252,0.25)]"
    };
  }
  if (pathname.includes("/roles")) {
    return {
      title: "System Roles",
      subtitle: "Manage user authorization tiers, roles, and granular permissions.",
      icon: Shield,
      iconColor: "text-amber-400 bg-amber-500/15 border-amber-500/30 shadow-[0_0_8px_rgba(251,191,36,0.25)]"
    };
  }
  if (pathname.includes("/access-control")) {
    return {
      title: "Permission Matrix",
      subtitle: "Granular access control and role-based permissions grid.",
      icon: ShieldCheck,
      iconColor: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30 shadow-[0_0_8px_rgba(129,140,248,0.25)]"
    };
  }
  if (pathname.includes("/attendance-report")) {
    return {
      title: "Attendance Report",
      subtitle: "Monthly summary of clock-in logs, overtime, and attendance metrics.",
      icon: Clock,
      iconColor: "text-blue-400 bg-blue-500/15 border-blue-500/30 shadow-[0_0_8px_rgba(96,165,250,0.25)]"
    };
  }
  if (pathname.includes("/timesheet-management")) {
    return {
      title: "Timesheet Management",
      subtitle: "Review, approve, and audit submitted employee timesheets.",
      icon: Clock,
      iconColor: "text-teal-400 bg-teal-500/15 border-teal-500/30 shadow-[0_0_8px_rgba(45,212,191,0.25)]"
    };
  }
  if (pathname.includes("/timesheets")) {
    return {
      title: "Timesheets",
      subtitle: "Log your daily activities, projects, and track working hours.",
      icon: Clock,
      iconColor: "text-sky-400 bg-sky-500/15 border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.25)]"
    };
  }
  if (pathname.includes("/public-holidays")) {
    return {
      title: "Public Holidays",
      subtitle: "Manage statutory holidays, regional days off, and forced leave schedules.",
      icon: Calendar,
      iconColor: "text-rose-400 bg-rose-500/15 border-rose-500/30 shadow-[0_0_8px_rgba(251,113,133,0.25)]"
    };
  }
  if (pathname.includes("/leave-approval")) {
    return {
      title: "Leave Approval",
      subtitle: "Review, approve, and manage employee leave applications & allocations.",
      icon: CheckCircle,
      iconColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.25)]"
    };
  }
  if (pathname.includes("/apply-leave")) {
    return {
      title: "Apply for Leave",
      subtitle: "Submit leave requests, view remaining balances, and track approvals.",
      icon: Calendar,
      iconColor: "text-violet-400 bg-violet-500/15 border-violet-500/30 shadow-[0_0_8px_rgba(167,139,250,0.25)]"
    };
  }
  if (pathname.includes("/leave")) {
    return {
      title: "Leave Management",
      subtitle: "Manage annual allocations, balances, and company-wide leave records.",
      icon: Calendar,
      iconColor: "text-amber-400 bg-amber-500/15 border-amber-500/30 shadow-[0_0_8px_rgba(251,191,36,0.25)]"
    };
  }
  if (pathname.includes("/my-payroll")) {
    return {
      title: "My Payslips",
      subtitle: "View, unlock, and download your monthly compensation statements.",
      icon: Wallet,
      iconColor: "text-sky-400 bg-sky-500/15 border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.25)]"
    };
  }
  if (pathname.includes("/payroll")) {
    return {
      title: "Payroll Management",
      subtitle: "Monthly payroll processing, encrypted payslip generation, and disbursements.",
      icon: Wallet,
      iconColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.25)]"
    };
  }
  if (pathname.includes("/attendance-management")) {
    return {
      title: "Attendance Management",
      subtitle: "Live clock-in tracking, timesheet validations, and staff attendance logs.",
      icon: Clock,
      iconColor: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.25)]"
    };
  }
  if (pathname.includes("/attendance")) {
    return {
      title: "Staff Attendance & Clocking",
      subtitle: "Live clock-in tracking, biometric records, and shift schedules.",
      icon: Clock,
      iconColor: "text-blue-400 bg-blue-500/15 border-blue-500/30 shadow-[0_0_8px_rgba(96,165,250,0.25)]"
    };
  }
  if (pathname.includes("/calendar")) {
    return {
      title: "HRMS Calendar",
      subtitle: "Company events, statutory holidays, and team leave schedules.",
      icon: Calendar,
      iconColor: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30 shadow-[0_0_8px_rgba(129,140,248,0.25)]"
    };
  }
  if (pathname.includes("/performance")) {
    return {
      title: "Performance Management",
      subtitle: "KPI tracking, quarterly reviews, and employee performance goals.",
      icon: Star,
      iconColor: "text-amber-400 bg-amber-500/15 border-amber-500/30 shadow-[0_0_8px_rgba(251,191,36,0.25)]"
    };
  }
  if (pathname.includes("/my-assets")) {
    return {
      title: "My Assigned Assets",
      subtitle: "Physical hardware, equipment custody, and allocated software licenses.",
      icon: BriefcaseBusiness,
      iconColor: "text-sky-400 bg-sky-500/15 border-sky-500/30 shadow-[0_0_8px_rgba(56,189,248,0.25)]"
    };
  }
  if (pathname.includes("/assets")) {
    return {
      title: "Asset Management",
      subtitle: "Manage, allocate, track, and audit physical equipment & digital licenses.",
      icon: BriefcaseBusiness,
      iconColor: "text-orange-400 bg-orange-500/15 border-orange-500/30 shadow-[0_0_8px_rgba(251,146,60,0.25)]"
    };
  }
  if (pathname.includes("/settings")) {
    return {
      title: "System Settings",
      subtitle: "Configure global enterprise preferences, integrations, and security rules.",
      icon: Settings,
      iconColor: "text-zinc-400 bg-zinc-500/15 border-zinc-500/30 shadow-[0_0_8px_rgba(161,161,170,0.25)]"
    };
  }
  if (pathname.includes("/profile")) {
    return {
      title: "My Profile",
      subtitle: "Manage your personal credentials, contact info, and security preferences.",
      icon: User,
      iconColor: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.25)]"
    };
  }
  return {
    title: currentMode === "business" ? "Business Workspace" : "HRMS Workspace",
    subtitle: undefined
  };
}

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
  const headerInfo = getHeaderInfo(pathname, currentMode);
  const mainScrollRef = useRef<HTMLElement>(null);

  // Auto-scroll to top on route change to prevent pages getting stuck scrolled down
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  // Route protection and authentication guards
  useEffect(() => {
    const role = (localStorage.getItem("user_role") || "").toUpperCase();
    if (!loading) {
      if (!userProfile && !isAdmin) {
        localStorage.removeItem("hrms_token");
        router.push("/login");
        return;
      }

      // Defensive guard: Client users belong to the Client Portal
      if (role === "CLIENT") {
        router.push("/client/dashboard");
        return;
      }

      // Defensive guard: Member users belong to the Member Order Tracker Portal
      if (role === "MEMBER") {
        router.push("/member/track-order");
        return;
      }

      // Route guards
      const isHrmsRoute = pathname.startsWith("/hrms");
      const isBusinessRoute = pathname.startsWith("/business");

      if (isHrmsRoute && !allowedModes.includes("hrms")) {
        router.push("/select-system");
        return;
      } else if (isBusinessRoute && !allowedModes.includes("business")) {
        router.push("/select-system");
        return;
      }
    }
  }, [loading, userProfile, isAdmin, allowedModes, pathname, router]);

  // Sync mode with pathname safely
  useEffect(() => {
    if (pathname.startsWith("/business")) {
      if (allowedModes.includes("business")) {
        setMode("business");
      }
    } else if (pathname.startsWith("/hrms")) {
      if (allowedModes.includes("hrms")) {
        setMode("hrms");
      }
    }
  }, [pathname, allowedModes, setMode]);

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
      <Suspense fallback={<div className="w-[260px] bg-[#0c0d12] hidden md:block" />}>
        <HRMSSidebar
          isAdmin={isAdmin}
          userProfile={userProfile}
          isMobileOpen={isSidebarOpen}
          setIsMobileOpen={setIsSidebarOpen}
        />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="relative w-full bg-[#0b0c10] dark:bg-[#07090e]/95 dark:backdrop-blur-xl border-b border-zinc-800/80 dark:border-zinc-800/60 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex items-center justify-between px-4 md:px-6 min-h-[64px] py-2 shrink-0 z-30 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg transition-colors md:hidden shrink-0"
              title="Open Navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Left-Aligned Dynamic Section Title & Subtitle */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-zinc-200 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-200">
                  {currentMode === "business" ? "ERP" : "HRMS"}
                </span>
              </div>
              <span className="text-zinc-600 font-medium text-xs shrink-0">/</span>
              {headerInfo.icon && (
                <div className={`p-1 rounded-md border flex items-center justify-center shrink-0 ${headerInfo.iconColor || "text-sky-400 bg-sky-500/15 border-sky-500/30"}`}>
                  <headerInfo.icon className="h-4 w-4" />
                </div>
              )}
              <span className="text-base sm:text-lg font-bold text-white tracking-tight shrink-0">
                {headerInfo.title}
              </span>
              {headerInfo.subtitle && (
                <>
                  <span className="text-zinc-500 font-medium text-xs shrink-0 hidden md:inline">—</span>
                  <span className="text-xs sm:text-[13px] text-zinc-300 dark:text-zinc-400 font-normal truncate hidden md:inline">
                    {headerInfo.subtitle}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <NotificationBell />
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1 md:pr-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/30">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/30 overflow-hidden shrink-0">
                    {userProfile?.profile_photo ? (
                      <img src={resolveImageUrl(userProfile.profile_photo)} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      userProfile ? `${userProfile.first_name?.[0] || ""}${userProfile.last_name?.[0] || ""}` : <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden md:flex flex-col text-left leading-none">
                    <span className="text-xs font-bold text-white truncate max-w-[130px]">
                      {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "Admin"}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium mt-0.5 truncate max-w-[130px]">
                      {isAdmin ? "Administrator" : (userProfile?.position?.title || "Staff")}
                    </span>
                  </div>
                  <ChevronDown className="hidden md:block h-3.5 w-3.5 text-zinc-400 shrink-0 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 mt-2 p-1.5 rounded-xl border border-zinc-800 bg-[#12131a] dark:bg-[#0c0e17] text-zinc-100 shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
                <DropdownMenuLabel className="font-normal px-2.5 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold text-white leading-none">{userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : "Administrator"}</p>
                    <p className="text-xs leading-none text-zinc-400">{userProfile?.user?.email || "admin@mcsc.co.id"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                <DropdownMenuItem asChild>
                  <Link href="/hrms/profile" className="cursor-pointer w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors">
                    <User className="mr-2 h-4 w-4 text-emerald-400" />
                    <span>My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                <DropdownMenuItem asChild className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors">
                  <Link href="/" className="w-full flex items-center" onClick={() => {
                    localStorage.removeItem("hrms_token");
                    localStorage.removeItem("user_role");
                    localStorage.removeItem("user_email");
                    localStorage.removeItem("user_id");
                    localStorage.removeItem("hrms_permissions");
                    localStorage.removeItem("hrms_profile");
                    sessionStorage.clear();
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, { method: "POST" }).catch(() => { });
                  }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main ref={mainScrollRef} className="flex-1 overflow-y-auto p-3.5 sm:p-4 md:p-5 xl:p-6 2xl:p-8 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
