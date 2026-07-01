"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { AskLogo } from "@/components/ask-logo";
import FloatingLines from "@/components/floating-lines";
import { Suspense } from "react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, new_password: password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      setSuccess("Your password has been successfully reset! You can now log in.");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark">
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden text-foreground">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-grid-slate-200/20 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-800/10 opacity-30 z-0 pointer-events-none" />
        <div className="absolute inset-0 w-full h-full z-0">
        <FloatingLines 
          enabledWaves={["top","middle","bottom"]}
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
          href="/login" 
          className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Login
        </Link>
        
        <div className="mb-8 flex justify-center">
          <AskLogo className="h-16 w-auto" />
        </div>
        
        <Card className="border-border/50 bg-background/60 shadow-xl backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
            <CardDescription className="text-muted-foreground">
              Create a new secure password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400 text-center font-medium shadow-inner animate-fade-in">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400 text-center font-medium shadow-inner animate-fade-in flex flex-col gap-3">
                <span>{success}</span>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/login")} 
                  className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 mt-2"
                >
                  Go to Login
                </Button>
              </div>
            )}
            
            {!success && (
              <form className="space-y-4" onSubmit={handleReset}>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-300" htmlFor="password">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-20" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-slate-500 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/20 pl-9 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-slate-300" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-20" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder-slate-500 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/20 pl-9 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-white hover:bg-slate-100 text-slate-950 font-semibold shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-95 mt-4" 
                  type="submit"
                  disabled={isLoading || !token}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-950" /> : null}
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
