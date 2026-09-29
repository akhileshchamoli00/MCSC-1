"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  CheckSquare,
  MessageSquare,
  FileText,
  Clock,
  Menu,
  Building2,
  Users,
  Calendar
} from "lucide-react";

interface MobileBottomBarProps {
  mode: "business" | "hrms" | "client";
  onOpenMenu: () => void;
}

export function MobileBottomBar({ mode, onOpenMenu }: MobileBottomBarProps) {
  const pathname = usePathname();

  // Define tab items based on active system mode
  let tabs: Array<{
    name: string;
    href: string;
    icon: React.ElementType;
    isActive: boolean;
  }> = [];

  if (mode === "client") {
    tabs = [
      {
        name: "Dashboard",
        href: "/client/dashboard",
        icon: LayoutDashboard,
        isActive: pathname === "/client/dashboard"
      },
      {
        name: "Orders",
        href: "/client/orders",
        icon: Package,
        isActive: pathname.startsWith("/client/orders")
      },
      {
        name: "Chat",
        href: "/client/chat",
        icon: MessageSquare,
        isActive: pathname.startsWith("/client/chat")
      },
      {
        name: "Documents",
        href: "/client/documents",
        icon: FileText,
        isActive: pathname.startsWith("/client/documents")
      }
    ];
  } else if (mode === "hrms") {
    tabs = [
      {
        name: "Dashboard",
        href: "/hrms/dashboard",
        icon: LayoutDashboard,
        isActive: pathname === "/hrms/dashboard"
      },
      {
        name: "Attendance",
        href: "/hrms/attendance",
        icon: Clock,
        isActive: pathname.startsWith("/hrms/attendance")
      },
      {
        name: "Leave",
        href: "/hrms/leave",
        icon: Calendar,
        isActive: pathname.startsWith("/hrms/leave")
      },
      {
        name: "Employees",
        href: "/hrms/employees",
        icon: Users,
        isActive: pathname.startsWith("/hrms/employees")
      }
    ];
  } else {
    // Default: Business (ERP)
    tabs = [
      {
        name: "Dashboard",
        href: "/business/dashboard",
        icon: LayoutDashboard,
        isActive: pathname === "/business/dashboard"
      },
      {
        name: "Orders",
        href: "/business/clients/orders",
        icon: Package,
        isActive: pathname === "/business/clients/orders" || pathname.startsWith("/business/clients/orders/completed") || pathname.startsWith("/business/clients/orders/pipeline")
      },
      {
        name: "Assigned",
        href: "/business/assigned-orders",
        icon: CheckSquare,
        isActive: pathname.startsWith("/business/assigned-orders")
      },
      {
        name: "Companies",
        href: "/business/clients/companies",
        icon: Building2,
        isActive: pathname.startsWith("/business/clients/companies")
      }
    ];
  }

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0c10]/95 dark:bg-[#07090e]/95 backdrop-blur-xl border-t border-zinc-800/80 dark:border-zinc-800/60 pb-safe md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-center justify-around h-14 px-1 max-w-lg mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-150 active:scale-95 ${
                tab.isActive
                  ? "text-emerald-400 font-bold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div
                className={`flex items-center justify-center p-1 rounded-xl transition-colors ${
                  tab.isActive ? "bg-emerald-500/15" : "bg-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-[62px]">
                {tab.name}
              </span>
            </Link>
          );
        })}

        {/* 5th Action: Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center flex-1 h-full text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all duration-150"
          title="Open Full Navigation Menu"
        >
          <div className="flex items-center justify-center p-1 rounded-xl bg-white/5 border border-white/10">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-[62px]">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
}
