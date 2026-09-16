"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Coffee,
  Wallet,
  Monitor,
  Clock,
  Settings,
  Menu,
  ChevronDown,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  BriefcaseBusiness,
  Zap,
  PlayCircle,
  FileCheck,
  Sparkles,
  Shield,
  MessageSquare,
  FileText,
  Megaphone,
  User,
  Award,
  Building2,
  Briefcase,
  ShoppingBag,
  Package,
  Scale,
  Bell,
  CreditCard,
  Receipt,
  UserCheck,
  Handshake
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@/contexts/user-context";

interface NavItem {
  name: string;
  href: string;
  adminOnly: boolean;
  employeeOnly?: boolean;
  badge?: number;
  moduleCode?: string;
}

interface NavModule {
  title: string;
  icon: React.ElementType;
  items?: NavItem[];
  href?: string;
  adminOnly?: boolean;
  employeeOnly?: boolean;
  moduleCode?: string;
  systemArea?: "hrms" | "business" | "shared";
}

const clientNavModules: NavModule[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/client/dashboard"
  },
  {
    title: "My Profile",
    icon: User,
    href: "/client/profile"
  },
  {
    title: "My Orders",
    icon: Package,
    href: "/client/orders"
  },
  {
    title: "Order Chat",
    icon: MessageSquare,
    href: "/client/chat"
  },
  {
    title: "Shared Documents",
    icon: FileText,
    href: "/client/documents"
  },
  {
    title: "Announcements",
    icon: Megaphone,
    href: "/client/announcements"
  }
];

const navModules: NavModule[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/hrms/dashboard",
    moduleCode: "dashboard",
    systemArea: "shared"
  },
  {
    title: "Teams",
    icon: Users,
    href: "/business/teams",
    moduleCode: "clients_teams",
    systemArea: "business"
  },
  {
    title: "Calendar",
    icon: Calendar,
    href: "/hrms/calendar",
    adminOnly: true,
    moduleCode: "calendar",
    systemArea: "hrms"
  },
  {
    title: "Employee",
    icon: Users,
    systemArea: "hrms",
    items: [
      { name: "All Employees", href: "/hrms/employees", adminOnly: true, moduleCode: "employees_all" },
      { name: "My Profile", href: "/hrms/profile", adminOnly: false, moduleCode: "employees_profile" },
    ]
  },
  {
    title: "Access Control",
    icon: Shield,
    systemArea: "hrms",
    items: [
      { name: "Roles List", href: "/hrms/roles", adminOnly: true, moduleCode: "roles_list" },
      { name: "Permission Matrix", href: "/hrms/access-control", adminOnly: true, moduleCode: "access_control_matrix" },
    ]
  },
  {
    title: "Attendance",
    icon: Calendar,
    systemArea: "hrms",
    items: [
      { name: "Management", href: "/hrms/attendance-management", adminOnly: true, moduleCode: "attendance_management" },
      { name: "Consolidated Report", href: "/hrms/attendance-report", adminOnly: true, moduleCode: "attendance_management" },
      { name: "My Attendance", href: "/hrms/attendance", adminOnly: false, moduleCode: "attendance_my" },
    ]
  },
  {
    title: "Leave",
    icon: Coffee,
    systemArea: "hrms",
    items: [
      { name: "Overview", href: "/hrms/leave", adminOnly: true, moduleCode: "leave_overview" },
      { name: "Management", href: "/hrms/leave-approval", adminOnly: true, moduleCode: "leave_management" },
      { name: "My Leave", href: "/hrms/apply-leave", adminOnly: false, moduleCode: "leave_my" },
    ]
  },
  {
    title: "Public Holidays",
    icon: Calendar,
    href: "/hrms/public-holidays",
    adminOnly: true,
    moduleCode: "public_holidays",
    systemArea: "hrms"
  },
  {
    title: "Payroll",
    icon: Wallet,
    systemArea: "hrms",
    items: [
      { name: "Management", href: "/hrms/payroll", adminOnly: true, moduleCode: "payroll_management" },
      { name: "My Payroll", href: "/hrms/my-payroll", adminOnly: false, moduleCode: "payroll_my" },
    ]
  },
  {
    title: "Timesheets",
    icon: Clock,
    systemArea: "hrms",
    items: [
      { name: "Management", href: "/hrms/timesheet-management", adminOnly: true, moduleCode: "timesheets_management" },
      { name: "My Timesheets", href: "/hrms/timesheets", adminOnly: false, moduleCode: "timesheets_my" },
    ]
  },
  {
    title: "Assets",
    icon: Monitor,
    systemArea: "hrms",
    items: [
      { name: "Management", href: "/hrms/assets", adminOnly: true, moduleCode: "assets_management" },
      { name: "My Assets", href: "/hrms/my-assets", adminOnly: false, moduleCode: "assets_my" },
    ]
  },
  {
    title: "Performance",
    icon: Award,
    systemArea: "hrms",
    items: [
      { name: "Overview", href: "/hrms/performance", adminOnly: false },
    ]
  },
  {
    title: "Announcements",
    icon: Megaphone,
    href: "/hrms/announcements",
    adminOnly: false,
    moduleCode: "hrms_announcements",
    systemArea: "hrms"
  },
  {
    title: "Clients",
    icon: UserCheck,
    href: "/business/clients",
    adminOnly: true,
    moduleCode: "clients_all",
    systemArea: "business"
  },
  {
    title: "Partners",
    icon: Handshake,
    href: "/business/partners",
    adminOnly: true,
    moduleCode: "clients_all",
    systemArea: "business"
  },
  {
    title: "Companies",
    icon: Building2,
    href: "/business/clients/companies",
    adminOnly: true,
    moduleCode: "clients_company",
    systemArea: "business"
  },
  {
    title: "Services",
    icon: Briefcase,
    href: "/business/clients/services",
    adminOnly: true,
    moduleCode: "clients_services",
    systemArea: "business"
  },
  {
    title: "Vendors",
    icon: Scale,
    systemArea: "business",
    items: [
      { name: "Vendor Directory", href: "/business/clients/notaries", adminOnly: true, moduleCode: "clients_notaries" },
      { name: "Vendor Settlements", href: "/business/clients/orders/notary-payments", adminOnly: true, moduleCode: "clients_orders_notary_payments" }
    ]
  },
  {
    title: "Order Management",
    icon: ShoppingBag,
    systemArea: "business",
    items: [
      { name: "Pipeline Orders", href: "/business/clients/orders/pipeline", adminOnly: true, moduleCode: "clients_orders_pipeline" },
      { name: "Active Orders", href: "/business/clients/orders", adminOnly: true, moduleCode: "clients_orders_active" },
      { name: "Completed Orders", href: "/business/clients/orders/completed", adminOnly: true, moduleCode: "clients_orders_completed" },
      { name: "Cancelled Orders", href: "/business/clients/orders/cancelled", adminOnly: true, moduleCode: "clients_orders_cancelled" }
    ]
  },
  {
    title: "Documents",
    icon: FileText,
    href: "/business/clients/documents",
    adminOnly: true,
    moduleCode: "clients_documents",
    systemArea: "business"
  },
  {
    title: "Accurate Online",
    icon: Receipt,
    href: "/business/settings/accurate",
    adminOnly: true,
    moduleCode: "clients_accurate",
    systemArea: "business"
  },
  {
    title: "Assigned Orders",
    icon: FileCheck,
    href: "/business/assigned-orders",
    adminOnly: false,
    employeeOnly: true,
    moduleCode: "clients_my",
    systemArea: "business"
  },
  {
    title: "Announcements",
    icon: Megaphone,
    href: "/business/announcements",
    adminOnly: true,
    moduleCode: "clients_announcements",
    systemArea: "business"
  }
];

interface HRMSSidebarProps {
  isAdmin: boolean;
  userProfile: any;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function HRMSSidebar({ isAdmin, userProfile, isMobileOpen, setIsMobileOpen }: HRMSSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [role, setRole] = useState("");
  const { hasPermission, currentMode, setMode, allowedModes, loading: userLoading } = useUser();

  useEffect(() => {
    const r = localStorage.getItem("user_role") || "EMPLOYEE";
    setRole(r);
    
    const saved = localStorage.getItem("hrms_sidebar_collapsed");
    if (saved) setIsCollapsed(JSON.parse(saved));

    const savedModules = localStorage.getItem("hrms_expanded_modules");
    if (savedModules) {
      setExpandedModules(JSON.parse(savedModules));
    } else {
      const activeModules = r.toUpperCase() === "CLIENT" ? clientNavModules : navModules;
      const allTrue = activeModules.reduce((acc, m) => ({ ...acc, [m.title]: true }), {});
      setExpandedModules(allTrue);
    }
  }, []);

  const toggleSidebar = () => {
    const newStat = !isCollapsed;
    setIsCollapsed(newStat);
    localStorage.setItem("hrms_sidebar_collapsed", JSON.stringify(newStat));
  };

  const toggleModule = (title: string) => {
    if (isCollapsed) {
      toggleSidebar();
    }
    const newMods = { ...expandedModules, [title]: !expandedModules[title] };
    setExpandedModules(newMods);
    localStorage.setItem("hrms_expanded_modules", JSON.stringify(newMods));
  };

  const isModuleActive = (module: NavModule) => {
    let href = module.href;
    if (module.title === "Dashboard" && role !== "CLIENT") {
      href = currentMode === "business" ? "/business/dashboard" : "/hrms/dashboard";
    }
    if (href) {
      if (href === "/business/clients") {
        const exclusions = [
          "/business/clients/companies",
          "/business/clients/services",
          "/business/clients/orders",
          "/business/clients/documents",
          "/business/clients/notaries"
        ];
        if (exclusions.some(ex => pathname === ex || pathname.startsWith(ex + '/'))) {
          return false;
        }
      }
      return pathname === href || pathname.startsWith(href + '/');
    }
    return module.items?.some(item => {
      if (item.href === "/business/clients/orders") {
        return pathname === "/business/clients/orders" || pathname === "/business/clients/orders/new";
      }
      return pathname === item.href || pathname.startsWith(item.href + '/');
    }) ?? false;
  };

  const handleLogout = () => {
    localStorage.removeItem("hrms_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_id");
    localStorage.removeItem("hrms_profile");
    localStorage.removeItem("hrms_permissions");
    localStorage.removeItem("hrms_employee_dashboard_data");
    localStorage.removeItem("hrms_admin_dashboard_data");
    localStorage.removeItem("hrms_employees_data");
    localStorage.removeItem("hrms_departments_data");
    localStorage.removeItem("hrms_roles_data");
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 },
  };

  const isDarkSidebar = true;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={sidebarVariants}
        initial={isCollapsed ? "collapsed" : "expanded"}
        animate={isCollapsed ? "collapsed" : "expanded"}
        transition={{ type: "spring", stiffness: 450, damping: 35, mass: 0.6 }}
        className={`fixed md:relative z-50 h-screen bg-[#0b0c10] dark:bg-[#07090e]/95 dark:backdrop-blur-xl text-zinc-100 border-r border-zinc-800/80 dark:border-zinc-800/60 shadow-[4px_0_30px_rgba(0,0,0,0.5)] dark:shadow-[4px_0_30px_rgba(0,0,0,0.7)] flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / Logo Area */}
        <div 
          className="h-16 flex items-center px-4 shrink-0 border-b border-zinc-800/80 dark:border-zinc-800/60 bg-black/20 dark:bg-black/40 relative overflow-visible"
          onMouseLeave={() => setIsSwitcherOpen(false)}
        >
          <div className="flex items-center gap-2.5 w-full">
            {/* Logo Icon */}
            <div 
              className="bg-gradient-to-tr from-emerald-500/30 via-emerald-500/20 to-teal-500/40 p-[1.5px] rounded-xl transition-transform shrink-0 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
              onClick={toggleSidebar}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <div className="bg-[#12131a] dark:bg-[#0e111a] border border-white/10 p-1.5 rounded-[10px] flex items-center justify-center">
                <img src="/icon.png" alt="MCS Logo" className="w-5 h-5 object-contain" />
              </div>
            </div>
            
            {/* Text & Switcher Area */}
            <motion.div 
              initial={false}
              animate={{ 
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : "auto",
                pointerEvents: isCollapsed ? "none" : "auto"
              }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="overflow-hidden whitespace-nowrap flex-1 flex flex-col justify-center items-start relative"
            >
              {allowedModes && allowedModes.length > 1 && role !== "CLIENT" ? (
                <>
                  <span className="text-[8.5px] bg-white/10 text-zinc-300 border border-white/15 px-1.5 py-0 rounded-full tracking-wider uppercase font-bold leading-tight">
                    Platform
                  </span>
                  <button
                    onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                    className="flex items-center gap-1 text-xs font-bold text-white hover:text-emerald-400 transition-colors mt-0.5"
                  >
                    <span>{currentMode === "business" ? "Business" : "HRMS"}</span>
                    <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col whitespace-nowrap">
                  <span className="font-black text-sm tracking-tight text-white leading-tight">
                    MCS
                  </span>
                  <span className="text-[9px] text-zinc-400 tracking-widest uppercase font-bold mt-0.5">
                    {role === "CLIENT" ? "Client Portal" : currentMode === "business" ? "Business" : "HRMS"}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Toggle Button */}
            {!isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="hidden md:flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10 p-1.5 rounded-lg transition-colors shrink-0 ml-auto"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Switcher Dropdown */}
          <AnimatePresence>
            {isSwitcherOpen && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.12 }}
                className="absolute left-10 top-[52px] w-[190px] rounded-xl border border-zinc-800 bg-[#12131a] dark:bg-[#0c0e17] text-zinc-100 shadow-[0_10px_30px_rgba(0,0,0,0.8)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.9)] p-1.5 z-50 text-[11px]"
              >
                <button
                  onClick={() => {
                    setIsSwitcherOpen(false);
                    if (currentMode !== "hrms") {
                      setMode("hrms");
                      router.push("/hrms/dashboard");
                    }
                  }}
                  className={`flex items-center justify-between w-full p-2 rounded-lg font-bold text-left transition-colors ${
                    currentMode === "hrms" 
                      ? "bg-white/15 text-white font-extrabold border border-white/20 shadow-sm" 
                      : "hover:bg-white/[0.08] text-zinc-300 hover:text-white"
                  }`}
                >
                  <span className="text-white">MCS HRMS Platform</span>
                  {currentMode === "hrms" && (
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsSwitcherOpen(false);
                    if (currentMode !== "business") {
                      setMode("business");
                      router.push("/business/dashboard");
                    }
                  }}
                  className={`flex items-center justify-between w-full p-2 rounded-lg font-bold text-left transition-colors ${
                    currentMode === "business" 
                      ? "bg-white/15 text-white font-extrabold border border-white/20 shadow-sm" 
                      : "hover:bg-white/[0.08] text-zinc-300 hover:text-white"
                  }`}
                >
                  <span className="text-white">MCS Business Platform</span>
                  {currentMode === "business" && (
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  )}
                </button>
                <div className="border-t border-zinc-800 my-1" />
                <Link
                  href="/select-system"
                  onClick={() => setIsSwitcherOpen(false)}
                  className="flex items-center gap-1.5 w-full p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] text-[10px] font-semibold"
                >
                  Change Workspace
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1.5 scrollbar-hide">
          {(role === "CLIENT" ? clientNavModules : navModules).map((module) => {
            // Filter by active system area (hrms vs business)
            const moduleArea = module.systemArea || "shared";
            if (role !== "CLIENT" && moduleArea !== "shared" && moduleArea !== currentMode) {
              return null;
            }

            let isVisible = false;
            let visibleItems: NavItem[] = [];

            if (module.href) {
              if (module.href === "/calendar" || module.href === "/hrms/calendar") {
                isVisible = isAdmin || userProfile?.has_calendar_access;
              } else if (module.moduleCode) {
                isVisible = hasPermission(module.moduleCode, "view");
              } else {
                isVisible = (!module.adminOnly || isAdmin) && (!module.employeeOnly || !isAdmin);
              }
            } else if (module.items) {
              visibleItems = module.items.filter(item => {
                if (item.moduleCode) {
                  return hasPermission(item.moduleCode, "view");
                } else {
                  return (!item.adminOnly || isAdmin) && (!item.employeeOnly || !isAdmin);
                }
              });
              isVisible = visibleItems.length > 0;
            }

            if (!isVisible) return null;

            const active = isModuleActive(module);

            // Dynamically override dashboard href
            let href = module.href;
            if (module.title === "Dashboard" && role !== "CLIENT") {
              href = currentMode === "business" ? "/business/dashboard" : "/hrms/dashboard";
            }

            // Direct link rendering (no dropdown)
            if (href) {
              return (
                <div key={module.title} className="flex flex-col mb-0.5">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        className={`flex items-center justify-between w-full p-2.5 text-sm font-semibold rounded-xl transition-colors duration-150 group ${
                          active
                            ? "bg-white/10 text-white font-bold border border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
                            : "text-zinc-400 hover:text-white hover:bg-white/[0.07] border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <module.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                            active 
                              ? "text-emerald-400" 
                              : "text-zinc-400 group-hover:text-white"
                          }`} />
                          <motion.span 
                            initial={false}
                            animate={{ 
                              opacity: isCollapsed ? 0 : 1,
                              width: isCollapsed ? 0 : "auto"
                            }}
                            transition={{ duration: 0.15 }}
                            className="tracking-tight group-hover:translate-x-[2px] transition-transform duration-200 truncate overflow-hidden whitespace-nowrap"
                          >
                            {module.title}
                          </motion.span>
                        </div>
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right" className="font-semibold">{module.title}</TooltipContent>}
                  </Tooltip>
                </div>
              );
            }

            // Collapsible dropdown rendering
            const expanded = expandedModules[module.title] && !isCollapsed;

            return (
              <div key={module.title} className="flex flex-col mb-0.5">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleModule(module.title)}
                      className={`flex items-center justify-between w-full p-2.5 text-sm font-semibold rounded-xl transition-colors duration-150 group ${
                        active && !expanded
                          ? "bg-white/10 text-white font-bold border border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.07] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <module.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                          active 
                            ? "text-emerald-400" 
                            : "text-zinc-400 group-hover:text-white"
                        }`} />
                        <motion.span 
                          initial={false}
                          animate={{ 
                            opacity: isCollapsed ? 0 : 1,
                            width: isCollapsed ? 0 : "auto"
                          }}
                          transition={{ duration: 0.15 }}
                          className="tracking-tight group-hover:translate-x-[2px] transition-transform duration-200 truncate overflow-hidden whitespace-nowrap"
                        >
                          {module.title}
                        </motion.span>
                      </div>
                      {!isCollapsed && (
                        <motion.div
                          animate={{ rotate: expanded ? 180 : 0 }}
                          transition={{ duration: 0.15 }}
                          className="shrink-0"
                        >
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </motion.div>
                      )}
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right" className="font-semibold">{module.title}</TooltipContent>}
                </Tooltip>

                {/* Sub-items list */}
                <AnimatePresence initial={false}>
                  {expanded && !isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-[18px] pl-3.5 border-l border-zinc-800 dark:border-zinc-800/60 py-1 mt-1 space-y-1">
                        {visibleItems.map((item) => {
                          const isSubActive = item.href === "/clients" || item.href === "/business/clients"
                            ? (pathname === "/business/clients" || pathname === "/business/clients/new")
                            : item.href === "/business/clients/orders"
                            ? (pathname === "/business/clients/orders" || pathname === "/business/clients/orders/new")
                            : (pathname === item.href || pathname.startsWith(item.href + '/'));
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[13px] transition-colors duration-150 relative group ${
                                isSubActive
                                  ? "text-white font-bold bg-white/10 border border-white/20 shadow-[0_2px_10px_rgba(0,0,0,0.4)]"
                                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                              }`}
                            >
                              <span className={`absolute -left-[18px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all ${
                                isSubActive 
                                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" 
                                  : "bg-transparent"
                              }`} />
                              <span className="group-hover:translate-x-[1px] transition-transform duration-200 truncate">{item.name}</span>
                              {item.badge && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-white shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Settings / System at bottom of list */}
          {currentMode === "hrms" && (isAdmin || hasPermission("settings", "view")) && (
            <div className="pt-4 mt-4 border-t border-zinc-800 dark:border-zinc-800/60">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Link
                    href="/hrms/settings"
                    className={`flex items-center gap-3 w-full p-2.5 text-sm font-semibold rounded-xl transition-colors duration-150 group ${
                      pathname.startsWith("/hrms/settings")
                        ? "bg-white/10 text-white font-bold border border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.07] border border-transparent"
                    }`}
                  >
                    <Settings className={`h-[18px] w-[18px] shrink-0 transition-colors ${pathname.startsWith("/hrms/settings") ? "text-emerald-400" : "text-zinc-400 group-hover:text-white"}`} />
                    {!isCollapsed && <span className="tracking-tight group-hover:translate-x-[2px] transition-transform duration-200 truncate">Settings</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right" className="font-semibold">Settings</TooltipContent>}
              </Tooltip>
            </div>
          )}
        </div>

        {/* Logout Footer */}
        <div className="p-3 border-t border-zinc-800/80 dark:border-zinc-800/60 bg-black/20 dark:bg-black/40 shrink-0">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex items-center justify-between w-full p-2.5 text-sm font-semibold rounded-xl transition-colors duration-150 group text-rose-400/90 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LogOut className="h-[18px] w-[18px] shrink-0" />
                  {!isCollapsed && <span className="tracking-tight group-hover:translate-x-[2px] transition-transform duration-200 truncate">Logout</span>}
                </div>
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right" className="font-semibold text-rose-400">Logout</TooltipContent>}
          </Tooltip>
        </div>
      </motion.aside>
    </>
  );
}
