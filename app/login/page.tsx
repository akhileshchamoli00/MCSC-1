"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Briefcase, Loader2, Mail, Lock } from "lucide-react";
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
  const router = useRouter();

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("hrms_token")) {
      const role = localStorage.getItem("user_role");
      if (role === "CLIENT") {
        router.push("/client/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        throw new Error("Invalid email/username or password");
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

        if (roleName === "CLIENT") {
          window.location.href = "/client/dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        window.location.href = "/dashboard";
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
              {error && (
                <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive text-center">
                  {error}
                </div>
              )}
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
                  disabled={isLoading}
                  suppressHydrationWarning
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? "Signing in..." : "Sign In"}
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
