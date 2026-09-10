"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AskLogo } from "@/components/ask-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogOut, User, PackageSearch, ShieldCheck, Moon, Sun, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memberUser, setMemberUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const verifyAuth = async () => {
      const token = localStorage.getItem("hrms_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("hrms_token");
          localStorage.removeItem("user_role");
          router.push("/login");
          return;
        }

        const data = await res.json();
        const role = (data.role?.name || "").trim().toUpperCase();
        if (role !== "MEMBER" && role !== "ADMIN" && role !== "SUPER ADMIN") {
          // If a staff or client opens member page, allow or redirect
          // We allow them or keep member profile
        }
        setMemberUser(data);
      } catch (err) {
        console.error("Auth verification failed", err);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("hrms_token");
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem("hrms_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_id");
      localStorage.removeItem("hrms_permissions");
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Verifying Member Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Member Portal Top Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center group transition-transform active:scale-95">
              <AskLogo className="h-14 sm:h-16 w-auto transition-transform duration-300 group-hover:scale-105" />
            </Link>

            <div className="h-7 w-px bg-border/60 hidden sm:block" />

            <Badge variant="secondary" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 font-semibold text-xs border border-primary/20 bg-primary/10 text-primary">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Member Portal
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            {/* User Profile Info */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                {memberUser?.name ? memberUser.name.charAt(0).toUpperCase() : "M"}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-semibold text-foreground leading-none">{memberUser?.name || "Member"}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{memberUser?.email}</span>
              </div>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-xs font-medium border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all rounded-xl h-[42px] px-3.5 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline font-semibold">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground bg-background/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} PT Mitra Cendekia Solusindo. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/en/privacy-policy" className="hover:underline hover:text-foreground">Privacy Policy</Link>
            <Link href="/en/terms-and-conditions" className="hover:underline hover:text-foreground">Terms of Service</Link>
            <Link href="/en/contact" className="hover:underline hover:text-foreground">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
