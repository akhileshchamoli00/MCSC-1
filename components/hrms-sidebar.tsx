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
  Scale
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
    title: "My Consultants",
    icon: Users,
    href: "/client/consultants"
  },
  {
    title: "Chat",
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
    title: "Partners",
    icon: Users,
    href: "/business/clients",
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
    title: "Notaries",
    icon: Scale,
    href: "/business/clients/notaries",
    adminOnly: true,
    moduleCode: "clients_notaries",
    systemArea: "business"
  },
  {
    title: "Orders",
    icon: ShoppingBag,
    systemArea: "business",
    items: [
      { name: "Active Orders", href: "/business/clients/orders", adminOnly: true, moduleCode: "clients_orders_active" },
      { name: "Completed Orders", href: "/business/clients/orders/completed", adminOnly: true, moduleCode: "clients_orders_completed" }
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
    title: "Assigned Orders",
    icon: FileCheck,
    href: "/business/assigned-orders",
    adminOnly: false,
    employeeOnly: true,
    moduleCode: "clients_my",
    systemArea: "business"
  },
  {
    title: "Chat",
    icon: MessageSquare,
    systemArea: "business",
    items: [
      { name: "Chat Center", href: "/business/chat-center", adminOnly: true, moduleCode: "chat_center" },
      { name: "Client Chat", href: "/business/chat", adminOnly: false, employeeOnly: true, moduleCode: "chat_client" },
      { name: "Assigned Company", href: "/business/chat/assigned-companies", adminOnly: false, moduleCode: "chat_assigned_companies" },
    ]
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
  const { hasPermission, currentMode, setMode, allowedModes } = useUser();

  // Persist state
  useEffect(() => {
    const saved = localStorage.getItem("hrms_sidebar_collapsed");
    if (saved) setIsCollapsed(JSON.parse(saved));

    const savedRole = localStorage.getItem("user_role") || "";
    setRole(savedRole.toUpperCase());

    const savedModules = localStorage.getItem("hrms_expanded_modules");
    if (savedModules) {
      setExpandedModules(JSON.parse(savedModules));
    } else {
      // Default to all true if first load
      const activeModules = savedRole.toUpperCase() === "CLIENT" ? clientNavModules : navModules;
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
      // If collapsed, auto-expand sidebar when a module is clicked
      toggleSidebar();
    }
    const newMods = { ...expandedModules, [title]: !expandedModules[title] };
    setExpandedModules(newMods);
    localStorage.setItem("hrms_expanded_modules", JSON.stringify(newMods));
  };

  // Determine if a module is active based on current path
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
    return module.items?.some(item => pathname === item.href || pathname.startsWith(item.href + '/')) ?? false;
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
    expanded: { width: "260px" },
    collapsed: { width: "80px" },
  };

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
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed md:relative z-50 h-screen bg-white/80 dark:bg-black border-r border-slate-200/50 dark:border-zinc-900 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] flex flex-col transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Header / Logo Area */}
        <div 
          className="h-[104px] flex items-center px-4 shrink-0 border-b border-slate-100 dark:border-zinc-900 relative"
          onMouseLeave={() => setIsSwitcherOpen(false)}
        >
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div 
                key="expanded-logo"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 w-full p-2 mt-2 overflow-visible"
              >
                <div 
                  className="bg-gradient-to-tr from-primary/20 via-primary/10 to-primary/30 p-[1.5px] rounded-xl transition-all shrink-0 hover:scale-105 cursor-pointer flex items-center justify-center shadow-sm"
                  onClick={toggleSidebar}
                >
                  <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-[11px] flex items-center justify-center">
                    <img src="/icon.png" alt="MCS Logo" className="w-6 h-6 object-contain" />
                  </div>
                </div>
                
                {allowedModes && allowedModes.length > 1 && role !== "CLIENT" ? (
                  <div className="flex flex-col whitespace-nowrap justify-start items-start relative">
                    <span className="text-[10px] text-muted-foreground/60 tracking-wider uppercase font-bold">
                      MCS Platform
                    </span>
                    <button
                      onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                      className="flex items-center gap-1 text-sm font-bold text-slate-800 dark:text-slate-100 hover:opacity-85 transition-opacity"
                    >
                      {currentMode === "business" ? "Business" : "HRMS"}
                      <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                    </button>
                    
                    {/* Switcher Dropdown */}
                    <AnimatePresence>
                      {isSwitcherOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-0 top-[38px] w-[180px] rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5 shadow-xl z-50 text-[11px]"
                        >
                          <button
                            onClick={() => {
                              setIsSwitcherOpen(false);
                              if (currentMode !== "hrms") {
                                setMode("hrms");
                                router.push("/hrms/dashboard");
                              }
                            }}
                            className={`flex items-center justify-between w-full p-2 rounded-lg font-bold text-left transition-colors ${currentMode === "hrms" ? "bg-primary/10 text-primary" : "hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-slate-300"}`}
                          >
                            <span>MCS HRMS Platform</span>
                            {currentMode === "hrms" && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          </button>
                          <button
                            onClick={() => {
                              setIsSwitcherOpen(false);
                              if (currentMode !== "business") {
                                setMode("business");
                                router.push("/business/dashboard");
                              }
                            }}
                            className={`flex items-center justify-between w-full p-2 rounded-lg font-bold text-left transition-colors ${currentMode === "business" ? "bg-primary/10 text-primary" : "hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-slate-300"}`}
                          >
                            <span>MCS Business Platform</span>
                            {currentMode === "business" && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          </button>
                          <div className="border-t border-slate-100 dark:border-zinc-900 my-1" />
                          <Link
                            href="/select-system"
                            onClick={() => setIsSwitcherOpen(false)}
                            className="flex items-center gap-1.5 w-full p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900 text-[10px] font-semibold"
                          >
                            Change Workspace
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col whitespace-nowrap">
                    <span className="font-black text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-200 leading-tight">
                      MCS
                    </span>
                    <span className="text-[9px] text-muted-foreground/60 tracking-widest uppercase font-bold mt-0.5">
                      {role === "CLIENT" ? "Client Portal" : currentMode === "business" ? "Business" : "HRMS"}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            initial={false}
            animate={{ right: isCollapsed ? 22 : 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-white/40 dark:hover:text-white dark:hover:bg-zinc-900 p-2 rounded-xl transition-colors shrink-0 absolute"
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 scrollbar-hide">
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
                <div key={module.title} className="flex flex-col mb-1">
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        className={`flex items-center justify-between w-full p-2.5 text-sm font-semibold rounded-xl transition-all duration-300 group ${active
                             ? "bg-primary/10 text-primary dark:bg-zinc-900 dark:text-white shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                             : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-zinc-900"
                           }`}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <module.icon className={`h-[18px] w-[18px] transition-colors ${active ? "text-primary dark:text-white" : "text-slate-400 dark:text-white/40 group-hover:text-slate-800 dark:group-hover:text-white"}`} />
                          </motion.div>
                          {!isCollapsed && (
                            <span className="tracking-tight group-hover:translate-x-[2px] transition-transform duration-200">{module.title}</span>
                          )}
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
              <div key={module.title} className="flex flex-col mb-1">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleModule(module.title)}
                      className={`flex items-center justify-between w-full p-2.5 text-sm font-semibold rounded-xl transition-all duration-300 group ${active && !expanded
                          ? "bg-primary/10 text-primary dark:bg-zinc-900 dark:text-white shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-zinc-900"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <module.icon className={`h-[18px] w-[18px] transition-colors ${active ? "text-primary dark:text-white" : "text-slate-400 dark:text-white/40 group-hover:text-slate-800 dark:group-hover:text-white"}`} />
                        </motion.div>
                        {!isCollapsed && (
                          <span className="tracking-tight group-hover:translate-x-[2px] transition-transform duration-200">{module.title}</span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <motion.div
                          animate={{ rotate: expanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
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
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-[18px] pl-4 border-l border-slate-100 dark:border-zinc-900 py-1 mt-1 space-y-1">
                        {visibleItems.map((item) => {
                          const isSubActive = item.href === "/clients" || item.href === "/business/clients"
                            ? (pathname === "/business/clients" || pathname === "/business/clients/new")
                            : item.href === "/chat" || item.href === "/business/chat"
                            ? (pathname === "/business/chat")
                            : item.href === "/business/clients/orders"
                            ? (pathname === "/business/clients/orders" || pathname === "/business/clients/orders/new")
                            : (pathname === item.href || pathname.startsWith(item.href + '/'));
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[13px] transition-all duration-200 relative group ${isSubActive
                                   ? "text-primary dark:text-white font-bold bg-primary/5 dark:bg-zinc-900/50 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                                   : "text-slate-500 hover:text-slate-800 dark:text-white/40 dark:hover:text-white hover:bg-slate-100/40 dark:hover:bg-zinc-900"
                                 }`}
                            >
                              <span className={`absolute -left-[18px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all ${isSubActive 
                                  ? "bg-primary dark:bg-primary shadow-[0_0_8px_hsl(var(--primary))] dark:shadow-[0_0_8px_hsl(var(--primary))]" 
                                  : "bg-transparent"
                                }`} />
                              <span className="group-hover:translate-x-[1px] transition-transform duration-200">{item.name}</span>
                              {item.badge && (
                                <span className="bg-primary/10 text-primary dark:bg-zinc-900 dark:text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
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
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-900">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Link
                    href="/hrms/settings"
                    className={`flex items-center gap-3 w-full p-2.5 text-sm font-semibold rounded-xl transition-all duration-300 group ${pathname.startsWith("/hrms/settings")
                        ? "bg-primary/10 text-primary dark:bg-zinc-900 dark:text-white shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-zinc-900"
                      }`}
                  >
                    <motion.div whileHover={{ scale: 1.1 }}>
                      <Settings className={`h-[18px] w-[18px] transition-colors ${pathname.startsWith("/hrms/settings") ? "text-primary dark:text-white" : "text-slate-400 dark:text-white/40 group-hover:text-slate-800 dark:group-hover:text-white"}`} />
                    </motion.div>
                    {!isCollapsed && <span className="tracking-tight group-hover:translate-x-[2px] transition-transform duration-200">Settings</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right" className="font-semibold">Settings</TooltipContent>}
              </Tooltip>
            </div>
          )}
        </div>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-900 shrink-0">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className={`flex items-center justify-between w-full p-2.5 text-sm font-semibold rounded-xl transition-all duration-300 group text-red-500/80 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
              >
                <div className="flex items-center gap-3">
                  <motion.div whileHover={{ scale: 1.1 }}>
                    <LogOut className="h-[18px] w-[18px]" />
                  </motion.div>
                  {!isCollapsed && <span className="tracking-tight group-hover:translate-x-[2px] transition-transform duration-200">Logout</span>}
                </div>
              </button>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right" className="font-semibold text-red-500">Logout</TooltipContent>}
          </Tooltip>
        </div>
      </motion.aside>
    </>
  );
}
