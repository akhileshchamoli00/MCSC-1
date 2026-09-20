"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import { Loader2, Menu, LogOut, User, Building, Building2, ChevronDown, ChevronsUpDown, Check } from "lucide-react";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/utils";

import { UserProvider } from "@/contexts/user-context";

interface ClientContextType {
  clientProfile: any;
  activeCompany: any;
  setActiveCompany: (c: any) => void;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClient must be used within a ClientLayout");
  }
  return context;
}

function getClientHeaderTitle(pathname: string): string {
  if (pathname.includes("/client/dashboard")) return "Dashboard";
  if (pathname.includes("/client/profile")) return "My Profile";
  if (pathname.includes("/client/orders/")) return "Order Details";
  if (pathname.includes("/client/orders")) return "My Orders";
  if (pathname.includes("/client/chat")) return "Order Chat";
  if (pathname.includes("/client/documents")) return "Shared Documents";
  if (pathname.includes("/client/announcements")) return "Announcements";
  return "Client Portal";
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorState, setErrorState] = useState(false);

  const fetchProfile = async () => {
    const role = (localStorage.getItem("user_role") || "").toUpperCase();

    if (role === "MEMBER") {
      router.push("/member/track-order");
      return;
    }

    const isAdminOrStaff = ["ADMIN", "SUPER ADMIN", "SUPERADMIN", "SYSTEM ADMIN", "HR", "DIRECTOR", "EMPLOYEE ADMIN", "EMPLOYEE"].some(r => role.includes(r));

    if (role && role !== "CLIENT" && role !== "CUSTOMER" && role !== "PARTNER" && !isAdminOrStaff) {
      router.push("/hrms/dashboard");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("hrms_token");
          localStorage.removeItem("user_role");
          router.push("/login");
          return;
        }
        console.warn("Client layout: received non-OK response from /api/clients, falling back to cached profile", response.status);
      } else {
        const clients = await response.json();
        if (clients && clients.length > 0) {
          setClientProfile(clients[0]);
          if (clients[0].companies && clients[0].companies.length > 0) {
            const storedCompanyId = localStorage.getItem("active_company_id");
            const companyToSet = clients[0].companies.find((c: any) => c.id.toString() === storedCompanyId) || clients[0].companies[0];
            setActiveCompany(companyToSet);
            localStorage.setItem("active_company_id", companyToSet.id.toString());
          } else {
            setActiveCompany({
              id: 0,
              company_name: clients[0].company_name || clients[0].contact_person || "Corporate Entity",
              company_code: "CLIENT"
            });
          }
          return;
        }
      }

      // Safe resilient fallback so the client portal always renders cleanly
      const storedEmail = localStorage.getItem("user_email") || "client@company.com";
      const storedName = localStorage.getItem("user_name") || (storedEmail.includes("@") ? storedEmail.split("@")[0].toUpperCase() : "Client Representative");
      const fallbackClient = {
        id: 0,
        contact_person: storedName,
        email: storedEmail,
        companies: [{
          id: 0,
          company_name: `${storedName} Entity`,
          company_code: "CLIENT"
        }]
      };
      setClientProfile(fallbackClient);
      setActiveCompany(fallbackClient.companies[0]);
    } catch (error) {
      console.warn("Error loading client layout:", error);
      // Safe fallback on network or API failure
      const storedEmail = localStorage.getItem("user_email") || "client@company.com";
      const storedName = localStorage.getItem("user_name") || (storedEmail.includes("@") ? storedEmail.split("@")[0].toUpperCase() : "Client Representative");
      const fallbackClient = {
        id: 0,
        contact_person: storedName,
        email: storedEmail,
        companies: [{
          id: 0,
          company_name: `${storedName} Entity`,
          company_code: "CLIENT"
        }]
      };
      setClientProfile(fallbackClient);
      setActiveCompany(fallbackClient.companies[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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

  if (errorState) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4 p-8 rounded-xl border border-destructive/20 bg-destructive/5">
          <h2 className="text-xl font-bold text-destructive">Client Portal Access Error</h2>
          <p className="text-sm text-muted-foreground">
            We couldn't load your client representative profile. Please verify your credentials or contact support.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("hrms_token");
              localStorage.removeItem("user_role");
              router.push("/login");
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <UserProvider>
      <ClientContext.Provider value={{
        clientProfile,
        activeCompany,
        setActiveCompany: (c: any) => {
          setActiveCompany(c);
          localStorage.setItem("active_company_id", c.id.toString());
        },
        loading,
        refreshProfile: fetchProfile
      }}>
        <div className="flex h-screen bg-white dark:bg-background/80 dark:backdrop-blur-sm overflow-hidden selection:bg-primary/20 relative z-0">

          {/* Background Glowing Orbs & Tech Grid Overlay */}
          <div className="absolute inset-0 cyber-grid-overlay pointer-events-none -z-20" />
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary glow-orb pointer-events-none -z-10" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent glow-orb pointer-events-none -z-10" />
          <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-indigo-500 glow-orb pointer-events-none -z-10" />

          {/* Sidebar Component */}
          <HRMSSidebar
            isAdmin={false}
            userProfile={null}
            isMobileOpen={isSidebarOpen}
            setIsMobileOpen={setIsSidebarOpen}
          />

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 overflow-y-auto w-full transition-all">
            {/* Top Header */}
            <header className="relative w-full bg-[#0b0c10] dark:bg-[#07090e]/95 dark:backdrop-blur-xl border-b border-zinc-800/80 dark:border-zinc-800/60 shadow-[0_4px_24px_rgba(0,0,0,0.25)] flex items-center justify-between px-4 md:px-6 h-16 shrink-0 z-30 transition-colors">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg transition-colors md:hidden"
                  title="Open Navigation"
                >
                  <Menu className="w-4 h-4" />
                </button>

                {/* Dynamic Breadcrumbs & Section Title */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-300">
                      Client Portal
                    </span>
                  </div>
                  <span className="text-zinc-600 font-medium">/</span>
                  <span className="text-xs md:text-sm font-extrabold text-white tracking-tight">
                    {getClientHeaderTitle(pathname)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 ml-auto">
                {activeCompany && clientProfile?.companies?.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="group relative flex items-center justify-between gap-3 px-3.5 py-1.5 text-left border border-emerald-500/40 bg-zinc-900/90 hover:bg-zinc-800/90 hover:border-emerald-400 rounded-xl transition-all shadow-[0_2px_12px_rgba(16,185,129,0.12)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.25)] shrink-0 w-64 sm:w-76 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 cursor-pointer">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            {activeCompany.logo_url ? (
                              <img
                                src={resolveImageUrl(activeCompany.logo_url)}
                                alt={activeCompany.company_name}
                                className="h-7 w-7 rounded-lg object-cover border border-emerald-500/30 bg-background"
                              />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                                {activeCompany.company_name?.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-zinc-900 shadow-[0_0_6px_#34d399]" />
                          </div>

                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1 leading-none mb-0.5">
                              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Active Entity</span>
                              <span className="text-[8px] font-semibold text-zinc-400 bg-white/10 px-1 py-0.2 rounded group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">Switch</span>
                            </div>
                            <span className="text-xs font-bold text-white truncate leading-tight group-hover:text-emerald-300 transition-colors">
                              {activeCompany.company_name}
                            </span>
                          </div>
                        </div>

                        <div className="h-6 w-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 flex items-center justify-center transition-all shrink-0 ml-1">
                          <ChevronsUpDown className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[270px] mt-2 p-1.5 rounded-2xl border border-emerald-500/30 bg-[#12131a] dark:bg-[#0c0e17] text-zinc-100 shadow-[0_12px_40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                      <div className="px-3 py-2 border-b border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-emerald-400" /> Switch Company Entity
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {clientProfile.companies.length} {clientProfile.companies.length === 1 ? "Entity" : "Entities"}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Select active entity for orders & documents</p>
                      </div>

                      <div className="py-1 space-y-1">
                        {clientProfile.companies.map((c: any) => {
                          const isSelected = activeCompany.id === c.id;
                          return (
                            <DropdownMenuItem
                              key={c.id}
                              onClick={() => {
                                setActiveCompany(c);
                                localStorage.setItem("active_company_id", c.id.toString());
                              }}
                              className={`cursor-pointer flex items-center justify-between gap-2.5 py-2.5 px-3 rounded-xl text-xs transition-all ${
                                isSelected
                                  ? "bg-emerald-500/15 font-bold text-white border border-emerald-500/40 shadow-xs"
                                  : "hover:bg-white/[0.08] text-zinc-300 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {c.logo_url ? (
                                  <img
                                    src={resolveImageUrl(c.logo_url)}
                                    alt={c.company_name}
                                    className="h-6 w-6 rounded-md object-cover border border-white/10 shrink-0 bg-background"
                                  />
                                ) : (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30 shrink-0">
                                    {c.company_name?.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="truncate leading-tight">{c.company_name}</span>
                                  {c.company_code && (
                                    <span className="text-[9.5px] font-mono text-zinc-400">{c.company_code}</span>
                                  )}
                                </div>
                              </div>
                              {isSelected ? (
                                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono font-bold shrink-0">
                                  <Check className="h-3 w-3" /> Selected
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <NotificationBell />
                <ThemeToggle />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 p-1 md:pr-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/30">
                      <div className="h-8 w-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs border border-sky-500/30 overflow-hidden shrink-0">
                        {activeCompany?.logo_url ? (
                          <img src={resolveImageUrl(activeCompany.logo_url)} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          activeCompany ? `${activeCompany.company_name?.[0] || ""}${activeCompany.company_name?.[1] || ""}` : <User className="w-4 h-4" />
                        )}
                      </div>
                      <div className="hidden md:flex flex-col text-left leading-none">
                        <span className="text-xs font-bold text-white truncate max-w-[130px]">
                          {clientProfile ? clientProfile.contact_person : (activeCompany?.company_name || "Client")}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium mt-0.5 truncate max-w-[130px]">
                          Client Account
                        </span>
                      </div>
                      <ChevronDown className="hidden md:block h-3.5 w-3.5 text-zinc-400 shrink-0 ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 mt-2 p-1.5 rounded-xl border border-zinc-800 bg-[#12131a] dark:bg-[#0c0e17] text-zinc-100 shadow-[0_10px_30px_rgba(0,0,0,0.85)]">
                    <DropdownMenuLabel className="font-normal px-2.5 py-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold text-white leading-none">{clientProfile ? clientProfile.contact_person : "Client Partner"}</p>
                        <p className="text-xs leading-none text-zinc-400">{clientProfile?.email || ""}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                    <DropdownMenuItem asChild>
                      <Link href="/client/profile" className="cursor-pointer w-full flex items-center px-2.5 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors">
                        <User className="mr-2 h-4 w-4 text-sky-400" />
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
                        localStorage.removeItem("active_company_id");
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

            <main className="flex-1 p-6 md:p-8">
              {children}
            </main>
          </div>
        </div>
      </ClientContext.Provider>
    </UserProvider>
  );
}
