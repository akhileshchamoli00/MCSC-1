"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Lock, Eye, EyeOff, Check, X, ShieldCheck } from "lucide-react";
import { AskLogo } from "@/components/ask-logo";
import FloatingLines from "@/components/floating-lines";
import { Suspense } from "react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("The password reset link is missing or invalid. Please request a new link from the login page.");
    }
  }, [token]);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("The password reset link is missing or expired. Please request a new link from the login page.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords you entered do not match. Please verify that both fields contain the exact same password.");
      return;
    }

    if (!hasMinLength || !hasUpper || !hasLower || !hasDigit) {
      setError("Please ensure your password meets all security requirements listed below.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, new_password: password }),
      });

      let data: any = {};
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        let msg = "We were unable to reset your password. The link may have expired. Please request a new password reset link.";
        if (typeof data.detail === "string") {
          msg = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          msg = data.detail.map((item: any) => item.msg || item.message || JSON.stringify(item)).join(". ");
        }
        throw new Error(msg);
      }

      setSuccess(data.message || "Your password has been successfully reset! You can now log in with your new credentials.");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
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
                  <div className="flex items-center justify-center gap-2 font-semibold">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <span>Password Updated</span>
                  </div>
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
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-300" htmlFor="password">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-20" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder-slate-500 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/20 pl-9 pr-10 transition-all duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-slate-300" htmlFor="confirm-password">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 z-20" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder-slate-500 focus-visible:border-white/20 focus-visible:ring-1 focus-visible:ring-white/20 pl-9 pr-10 transition-all duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Security Checklist */}
                  {password.length > 0 && (
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1.5 text-xs text-slate-300">
                      <div className="font-semibold text-slate-200 mb-1">Password Requirements:</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400 font-medium" : "text-slate-400"}`}>
                          {hasMinLength ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-500" />}
                          <span>8+ characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-400 font-medium" : "text-slate-400"}`}>
                          {hasUpper ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-500" />}
                          <span>Uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-400 font-medium" : "text-slate-400"}`}>
                          {hasLower ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-500" />}
                          <span>Lowercase letter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${hasDigit ? "text-emerald-400 font-medium" : "text-slate-400"}`}>
                          {hasDigit ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-slate-500" />}
                          <span>At least 1 number</span>
                        </div>
                      </div>
                      {confirmPassword.length > 0 && (
                        <div className={`flex items-center gap-1.5 pt-1 border-t border-white/5 ${passwordsMatch ? "text-emerald-400 font-medium" : "text-amber-400"}`}>
                          {passwordsMatch ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <X className="h-3.5 w-3.5 text-amber-400" />}
                          <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button 
                    className="w-full bg-white hover:bg-slate-100 text-slate-950 font-semibold shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-95 mt-4" 
                    type="submit"
                    disabled={isLoading || !token}
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-950" /> : null}
                    {isLoading ? "Updating Password..." : "Update Password"}
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
