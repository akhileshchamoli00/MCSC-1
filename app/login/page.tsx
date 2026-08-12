"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Briefcase, Loader2, Mail, Lock, ShieldAlert, Clock } from "lucide-react";
import { AskLogo } from "@/components/ask-logo";
import FloatingLines from "@/components/floating-lines";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const ENABLED_WAVES = ["top", "middle", "bottom"];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const router = useRouter();

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.clear();
      const params = new URLSearchParams(window.location.search);
      if (params.get("reason") === "inactivity") {
        setError("Session expired: You were automatically logged out due to 30 minutes of inactivity.");
      }
    }
    if (localStorage.getItem("hrms_token")) {
      const role = localStorage.getItem("user_role");
      if (role === "CLIENT") {
        router.push("/client/dashboard");
      } else {
        const pref = localStorage.getItem("preferred_system");
        const email = localStorage.getItem("user_email") || "";
        const uRole = (role || "").trim().toUpperCase();
        const isSuperAdmin = email === "admin@mcs-consulting.com" || uRole === "ADMIN" || uRole === "SUPER ADMIN" || uRole === "SUPERADMIN" || uRole === "SYSTEM ADMIN";
        
        if (isSuperAdmin) {
          if (pref === "hrms" || pref === "business") {
            router.push(`/${pref}/dashboard`);
          } else {
            router.push("/select-system");
          }
        } else {
          // Check cached permissions
          let freshPermissions: string[] = [];
          try {
            const cachedPerms = localStorage.getItem("hrms_permissions");
            if (cachedPerms) freshPermissions = JSON.parse(cachedPerms);
          } catch (e) {}

          const list: ("hrms" | "business")[] = [];
          const hasHRMS = freshPermissions.includes("platform_hrms:view") || freshPermissions.includes("platform_hrms:*") || freshPermissions.includes("*:*");
          if (hasHRMS) {
            list.push("hrms");
          }
          
          const hasBusiness = freshPermissions.includes("platform_business:view") || freshPermissions.includes("platform_business:*") || freshPermissions.includes("*:*");
          if (hasBusiness) {
            list.push("business");
          }

          if (list.length === 0) {
            list.push("hrms");
          }

          if (list.length === 1) {
            router.push(`/${list[0]}/dashboard`);
          } else {
            if (pref && list.includes(pref as any)) {
              router.push(`/${pref}/dashboard`);
            } else {
              router.push("/select-system");
            }
          }
        }
      }
    }
  }, [router]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;
    
    setIsLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          const detail = errorData.detail || "";
          const match = detail.match(/(\d+)\s*second/i);
          const secs = match ? parseInt(match[1]) : 60;
          setCooldownSeconds(secs);
          throw new Error(`Too many failed login attempts. Please wait ${secs} seconds before trying again.`);
        }
        throw new Error(errorData.detail || "Invalid email/username or password");
      }

      const data = await response.json();
      localStorage.setItem("hrms_token", data.access_token);

      // Fetch user profile to determine role
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: {
          "Authorization": `Bearer ${data.access_token}`
        }
      });

      if (userResponse.ok) {
        const user = await userResponse.json();
        const roleName = user.role?.name || "";
        localStorage.setItem("user_role", roleName);
        localStorage.setItem("user_email", user.email);
        localStorage.setItem("user_id", user.id.toString());
        
        const freshPermissions = user.permissions || [];
        localStorage.setItem("hrms_permissions", JSON.stringify(freshPermissions));

        if (roleName === "CLIENT") {
          window.location.href = "/client/dashboard";
        } else {
          const email = user.email || "";
          const uRole = roleName.trim().toUpperCase();
          const isSuperAdmin = email === "admin@mcs-consulting.com" || user.role_id === 1 || uRole === "ADMIN" || uRole === "SUPER ADMIN" || uRole === "SUPERADMIN" || uRole === "SYSTEM ADMIN";
          
          if (isSuperAdmin) {
            const pref = localStorage.getItem("preferred_system");
            if (pref === "hrms" || pref === "business") {
              window.location.href = `/${pref}/dashboard`;
            } else {
              window.location.href = "/select-system";
            }
          } else {
            const list: ("hrms" | "business")[] = [];
            const hasHRMS = freshPermissions.includes("platform_hrms:view") || freshPermissions.includes("platform_hrms:*") || freshPermissions.includes("*:*");
            if (hasHRMS) {
              list.push("hrms");
            }
            
            const hasBusiness = freshPermissions.includes("platform_business:view") || freshPermissions.includes("platform_business:*") || freshPermissions.includes("*:*");
            if (hasBusiness) {
              list.push("business");
            }

            if (list.length === 0) {
              list.push("hrms");
            }

            if (list.length === 1) {
              window.location.href = `/${list[0]}/dashboard`;
            } else {
              const pref = localStorage.getItem("preferred_system");
              if (pref && list.includes(pref as any)) {
                window.location.href = `/${pref}/dashboard`;
              } else {
                window.location.href = "/select-system";
              }
            }
          }
        }
      } else {
        const pref = localStorage.getItem("preferred_system");
        if (pref === "hrms" || pref === "business") {
          window.location.href = `/${pref}/dashboard`;
        } else {
          window.location.href = "/select-system";
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setForgotLoading(true);
    setForgotMessage("");
    setForgotError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      setForgotMessage(data.message || "Reset link sent!");
    } catch (err: any) {
      setForgotError(err.message || "Failed to send reset link");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="dark">
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden text-foreground">
        {/* Background decorations */}
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
            animationSpeed={2}
            gradientStart="#065eee"
            gradientMid="#84CC16"
            gradientEnd="#EAB308"
          />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <Link
            href="/"
            className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Website
          </Link>

          <div className="mb-8 flex justify-center">
            <AskLogo className="h-16 w-auto" />
          </div>

          <Card className="border-border/50 bg-background/60 shadow-xl backdrop-blur-xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight">MCS Portal</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to access your workspace or partner dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cooldownSeconds > 0 ? (
                <div className="mb-5 rounded-xl border border-rose-500/40 bg-gradient-to-br from-rose-950/90 via-rose-900/50 to-black/80 p-4 text-rose-100 shadow-2xl backdrop-blur-md space-y-2 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 animate-pulse" />
                      <span className="font-bold text-sm text-rose-200 tracking-wide">Too Many Failed Attempts</span>
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 shadow-inner">
                      <Clock className="h-3.5 w-3.5 text-rose-400" />
                      {Math.floor(cooldownSeconds / 60).toString().padStart(2, '0')}:{(cooldownSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-xs text-rose-200/90 leading-relaxed">
                    Security cooldown active. Please wait <span className="font-mono font-bold text-white bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/30">{Math.floor(cooldownSeconds / 60)}m {cooldownSeconds % 60}s</span> before trying again.
                  </p>
                </div>
              ) : error ? (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/15 p-3 text-sm text-destructive text-center font-semibold shadow-sm">
                  {error}
                </div>
              ) : null}
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                    Email or Client Code
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-20" />
                    <Input
                      id="email"
                      placeholder="Email Address or Client Code"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
                          e.stopPropagation();
                        }
                      }}
                      autoCapitalize="none"
                      autoComplete="username"
                      autoCorrect="off"
                      className="bg-slate-900/40 dark:bg-black/50 border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 focus-visible:border-slate-500 dark:focus-visible:border-white/30 pl-9 transition-all duration-200 select-text"
                      required
                      suppressHydrationWarning
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-20" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
                          e.stopPropagation();
                        }
                      }}
                      className="bg-slate-900/40 dark:bg-black/50 border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 focus-visible:border-slate-500 dark:focus-visible:border-white/30 pl-9 transition-all duration-200 select-text"
                      required
                      suppressHydrationWarning
                    />
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <Dialog open={isForgotModalOpen} onOpenChange={(open) => {
                      setIsForgotModalOpen(open);
                      if (!open) {
                        setForgotEmail("");
                        setForgotMessage("");
                        setForgotError("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-sm font-medium text-primary hover:underline cursor-pointer" suppressHydrationWarning>
                          Forgot password?
                        </button>
                      </DialogTrigger>
                      <DialogContent className="dark !bg-[#0b0c12]/95 !text-slate-100 !border-white/10 sm:max-w-md shadow-2xl backdrop-blur-xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold tracking-tight text-white">Reset your password</DialogTitle>
                          <DialogDescription className="text-slate-400 text-sm">
                            Enter your email address and we will send you a link to reset your password.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleForgotPassword} className="space-y-4 pt-4">
                          {forgotMessage && (
                            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400 text-center font-medium shadow-inner animate-fade-in">
                              {forgotMessage}
                            </div>
                          )}
                          {forgotError && (
                            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400 text-center font-medium shadow-inner animate-fade-in">
                              {forgotError}
                            </div>
                          )}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300" htmlFor="forgot-email">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-20" />
                              <Input
                                id="forgot-email"
                                type="email"
                                placeholder="Email address"
                                className="bg-white/5 border-white/10 text-white placeholder-slate-500 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/20 pl-9 transition-all duration-200"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                                suppressHydrationWarning
                              />
                            </div>
                          </div>
                          <DialogFooter className="sm:justify-between flex-row">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setIsForgotModalOpen(false)}
                              className="text-slate-400 hover:bg-white/5 hover:text-white transition-all duration-200"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={forgotLoading}
                              className="bg-white hover:bg-slate-100 text-slate-950 font-semibold shadow-md transition-all duration-200"
                              suppressHydrationWarning
                            >
                              {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-950" />}
                              Send Reset Link
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <Button
                  className="w-full transition-all duration-300 hover:scale-[1.02] active:scale-95"
                  type="submit"
                  disabled={isLoading || cooldownSeconds > 0}
                  suppressHydrationWarning
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? "Signing in..." : cooldownSeconds > 0 ? `Please Wait (${cooldownSeconds >= 60 ? `${Math.floor(cooldownSeconds / 60)}m ${cooldownSeconds % 60}s` : `${cooldownSeconds}s`})` : "Sign In"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center gap-4 text-center">
              <div className="text-sm text-muted-foreground">
                By signing in, you agree to our corporate policies.
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                <Briefcase className="h-3 w-3" />
                <span>MCS Consulting Portal</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
