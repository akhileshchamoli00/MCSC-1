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
import { Loader2, Menu, LogOut, User, Building, ChevronDown } from "lucide-react";
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

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorState, setErrorState] = useState(false);

  const fetchProfile = async () => {
    const token = localStorage.getItem("hrms_token");
    const role = localStorage.getItem("user_role");
    
    if (!token || role !== "CLIENT") {
      localStorage.removeItem("hrms_token");
      localStorage.removeItem("user_role");
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch client profile");
      }

      const clients = await response.json();
      if (clients && clients.length > 0) {
        setClientProfile(clients[0]);
        if (clients[0].companies && clients[0].companies.length > 0) {
          const storedCompanyId = localStorage.getItem("active_company_id");
          const companyToSet = clients[0].companies.find((c: any) => c.id.toString() === storedCompanyId) || clients[0].companies[0];
          setActiveCompany(companyToSet);
          localStorage.setItem("active_company_id", companyToSet.id.toString());
        }
      } else {
        throw new Error("No client profile linked to this user");
      }
    } catch (error) {
      console.error("Error loading client layout:", error);
      setErrorState(true);
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
            <header className="relative w-full bg-transparent border-none shadow-none flex items-center justify-between px-6 h-[104px] shrink-0 transition-all">
              <div className="flex items-center">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors md:hidden"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <Link href="/client/dashboard" className="flex items-center gap-2 ml-2 group cursor-pointer">
                  <AskLogo className="h-16 w-auto transition-transform duration-300 group-hover:scale-105" />
                </Link>
              </div>

              <div className="flex items-center gap-4 ml-auto">
                {activeCompany && clientProfile?.companies?.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-3 px-4 py-2 text-left border border-border/60 bg-background/50 hover:bg-muted/30 dark:hover:bg-white/5 rounded-xl hover:border-primary/30 transition-all shadow-xs shrink-0 focus:outline-none">
                        {activeCompany.logo_url ? (
                          <img 
                            src={resolveImageUrl(activeCompany.logo_url)} 
                            alt={activeCompany.company_name} 
                            className="h-8 w-8 rounded-lg object-cover border border-border shrink-0" 
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm border shrink-0">
                            {activeCompany.company_name?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 pr-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Select your company</span>
                          <span className="text-xs md:text-sm font-extrabold text-foreground truncate max-w-[160px] leading-tight">
                            {activeCompany.company_name}
                          </span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground/60 shrink-0 ml-0.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 mt-2 p-1.5 rounded-xl">
                      <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2 py-1.5">Switch Company Profile</DropdownMenuLabel>
                      <DropdownMenuSeparator className="my-1" />
                      {clientProfile.companies.map((c: any) => (
                        <DropdownMenuItem 
                          key={c.id} 
                          onClick={() => {
                            setActiveCompany(c);
                            localStorage.setItem("active_company_id", c.id.toString());
                          }}
                          className={`cursor-pointer flex items-center gap-2.5 py-2 px-2.5 rounded-lg transition-all ${activeCompany.id === c.id ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-muted/50'}`}
                        >
                          {c.logo_url ? (
                            <img 
                              src={resolveImageUrl(c.logo_url)} 
                              alt={c.company_name} 
                              className="h-6 w-6 rounded-md object-cover border shrink-0 bg-background" 
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-[10px] border shrink-0">
                              {c.company_name?.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate text-xs font-medium">{c.company_name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <NotificationBell />
                <ThemeToggle />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-[80px] w-[80px] rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-border/40 overflow-hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-sm ml-1">
                      {activeCompany?.logo_url ? (
                        <img src={resolveImageUrl(activeCompany.logo_url)} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        activeCompany ? `${activeCompany.company_name?.[0] || ""}${activeCompany.company_name?.[1] || ""}` : <User className="w-8 h-8" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 mt-2">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">{clientProfile ? clientProfile.contact_person : "Client Partner"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{clientProfile?.email || "client@mcs.com"}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/client/profile" className="cursor-pointer w-full flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                      <Link href="/login" className="w-full flex items-center" onClick={() => {
                        localStorage.removeItem("hrms_token");
                        localStorage.removeItem("user_role");
                        localStorage.removeItem("user_email");
                        localStorage.removeItem("user_id");
                        localStorage.removeItem("hrms_permissions");
                        localStorage.removeItem("hrms_profile");
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
      </ClientContext.Provider>
    </UserProvider>
  );
}
