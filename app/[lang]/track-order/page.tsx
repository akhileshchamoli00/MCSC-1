"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { translations } from "@/lib/translations";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  Sparkles,
  Lock,
  UserPlus,
  Send,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowRight,
  UserCheck,
  Briefcase,
  FileCheck,
  ExternalLink,
  Shield,
  User,
  Mail,
  Phone,
  X,
  MessageSquare,
  Check
} from "lucide-react";
import { AskLogo } from "@/components/ask-logo";
import { validateEmail, validateMobileNumber } from "@/lib/utils";
import { PhoneInput, isValidPhoneNumber, isValidEmail } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface MessageItem {
  id: number;
  order_number: string;
  user_id?: number | null;
  message: string;
  channel?: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  created_at: string;
  sender_name?: string | null;
  sender_role?: string | null;
  sender_avatar?: string | null;
  is_client?: boolean;
}

interface OrderTrackData {
  order_number: string;
  job_title: string;
  job_id?: string | null;
  company_name?: string | null;
  company_code?: string | null;
  company_id?: number | null;
  client_name?: string | null;
  branch_name?: string | null;
  status: string;
  payment_status: string;
  created_at: string;
  progress_percentage: number;
  milestones: Array<{ key: string; title: string; completed: boolean }>;
  messages: MessageItem[];
}

interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

const isSystemMessage = (msg: MessageItem) => {
  if (!msg) return false;
  if (!msg.user_id) return true;
  const role = (msg.sender_role || "").toUpperCase();
  if (role === "MILESTONE" || role === "SYSTEM") return true;
  const name = (msg.sender_name || "").toUpperCase();
  if (name === "SYSTEM" || name === "MILESTONE") return true;
  const txt = (msg.message || "").toLowerCase();
  return (
    txt.startsWith("order execution status") ||
    txt.startsWith("pipeline order") ||
    txt.startsWith("order moved") ||
    txt.startsWith("payment") ||
    txt.startsWith("proforma payment") ||
    txt.startsWith("final invoice payment") ||
    txt.startsWith("additional payment") ||
    txt.startsWith("amount received") ||
    txt.includes("invoice has been generated") ||
    txt.includes("proforma invoice (") ||
    txt.includes("final documents") ||
    txt.includes("uploaded to dropbox") ||
    txt.includes("emailed to client") ||
    txt.includes("assigned to review") ||
    txt.includes("consultant is actively")
  );
};

const getMilestoneIcon = (message: string) => {
  const txt = (message || "").toLowerCase();
  if (txt.includes("payment") || txt.includes("amount received") || txt.includes("paid")) {
    return <CreditCard className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  }
  if (txt.includes("invoice")) {
    return <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  }
  if (txt.includes("final document") || txt.includes("dropbox")) {
    return <FileCheck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
  }
  if (txt.includes("status") || txt.includes("active orders")) {
    return <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />;
  }
  return <Clock className="h-3.5 w-3.5 text-primary shrink-0" />;
};

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();
  const t = translations[language];

  // Search & Order State
  const [searchInput, setSearchInput] = useState(searchParams.get("order") || "");
  const [companyIdInput, setCompanyIdInput] = useState(
    searchParams.get("company_id") || searchParams.get("company_code") || searchParams.get("tax_id") || ""
  );
  const [orderData, setOrderData] = useState<OrderTrackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticated Member State (if visiting while logged in)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Registration Form State (6 Fields)
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Check existing session
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch current user details
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/me`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser({
          id: data.id,
          email: data.email,
          name: data.name || data.email.split("@")[0],
          role: data.role?.name || "MEMBER"
        });
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.error("Auth check failed:", e);
    }
  };

  // Auto-search if URL query contains order and company_id
  useEffect(() => {
    const orderQuery = searchParams.get("order");
    const compQuery = searchParams.get("company_id") || searchParams.get("company_code") || searchParams.get("tax_id");
    if (orderQuery && compQuery) {
      setSearchInput(orderQuery);
      setCompanyIdInput(compQuery);
      handleTrackOrder(orderQuery, compQuery);
    } else if (orderQuery) {
      setSearchInput(orderQuery);
    }
  }, [searchParams]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [orderData?.messages]);

  const handleTrackOrder = async (orderNum?: string, compId?: string, isSilent = false) => {
    const targetOrder = (orderNum || searchInput).trim();
    const targetCompanyId = (compId || companyIdInput).trim();

    if (!targetOrder) {
      toast.error("Please enter a valid Order ID.");
      return;
    }

    if (!targetCompanyId) {
      toast.error("Please enter your Company ID for verification.");
      return;
    }

    if (!isSilent) {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/public/orders/${encodeURIComponent(targetOrder)}/track?company_id=${encodeURIComponent(targetCompanyId)}`
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Order not found. Please verify your Order ID and Company ID.");
      }

      const data: OrderTrackData = await res.json();
      setOrderData(data);
      setSearched(true);
      if (!isSilent) {
        toast.success(`Verified & Loaded Order #${data.order_number}`);
      }
    } catch (err: any) {
      if (!isSilent) {
        setError(err.message || "Failed to load order.");
        setOrderData(null);
        setSearched(true);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Member Registration Handler
  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setRegError("Please fill in all mandatory fields.");
      return;
    }

    // Global Email Validation Rule
    const emailVal = validateEmail(regEmail);
    if (!emailVal.isValid) {
      setRegError(emailVal.error || "Please provide a valid email address (e.g. name@example.com).");
      return;
    }

    // Global Mobile Number Validation Rule
    if (regMobile && regMobile.trim()) {
      const mobileVal = validateMobileNumber(regMobile, false);
      if (!mobileVal.isValid) {
        setRegError(mobileVal.error || "Please provide a valid phone number with 6 to 15 digits.");
        return;
      }
    }

    if (regPassword !== regConfirmPassword) {
      setRegError("Passwords do not match.");
      return;
    }

    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters.");
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/member-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: emailVal.cleaned,
          password: regPassword,
          confirm_password: regConfirmPassword,
          phone: regMobile.trim() || null,
          date_of_birth: regDob || null,
          order_number: orderData?.order_number || searchInput || null
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Registration failed. Please try again.");
      }

      const data = await res.json();
      localStorage.setItem("user_role", "MEMBER");
      localStorage.setItem("user_email", data.user.email);
      localStorage.setItem("user_id", data.user.id.toString());

      setShowRegisterModal(false);
      toast.success(`Welcome, ${data.user.name}! Redirecting to your Member Order Portal...`);

      // Forward to member order tracking portal
      const targetOrder = orderData?.order_number || searchInput.trim();
      const targetCompanyId = companyIdInput.trim();
      const queryParam = targetOrder && targetCompanyId ? `?order=${encodeURIComponent(targetOrder)}&company_id=${encodeURIComponent(targetCompanyId)}` : (targetOrder ? `?order=${encodeURIComponent(targetOrder)}` : "");

      setTimeout(() => {
        router.push(`/member/track-order${queryParam}`);
      }, 500);
    } catch (err: any) {
      setRegError(err.message || "Registration failed.");
    } finally {
      setRegLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "IN_PROGRESS":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "UNDER_REVIEW":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-muted/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Top Header */}
        <div className="text-center space-y-3">
          <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 text-xs font-semibold uppercase tracking-wider">
            Public Order Status Tracking
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Track Order & Progress
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Key in your Order ID and registered Company ID to monitor real-time execution milestones and corporate advisory progress.
          </p>
        </div>

        {/* Member Session Banner (if user is already logged in as a Member) */}
        {currentUser && currentUser.role === "MEMBER" ? (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-primary/30 shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  Logged in as <span className="text-primary">{currentUser.name}</span>
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Member Account Active • Access full interactive chat and document uploads
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="h-8 text-xs font-bold gap-1.5 px-3 bg-primary text-primary-foreground shrink-0 shadow-xs"
            >
              <Link href={orderData ? `/member/track-order?order=${orderData.order_number}&company_id=${companyIdInput}` : "/member/track-order"}>
                Open Member Tracker <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        ) : (
          /* Unregistered Guest View Banner at the TOP */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 p-4 rounded-2xl bg-card border border-border shadow-xs backdrop-blur-md">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-2xs">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Unregistered Guest View
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  To interact directly with consultants, post messages, and upload documents, please register as a Member.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <Button
                size="sm"
                onClick={() => setShowRegisterModal(true)}
                className="h-8 text-xs font-bold gap-1.5 px-3.5 bg-primary text-primary-foreground shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5" /> Register Member
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold gap-1.5 px-3 border-border"
              >
                <Link href="/login">
                  Portal Login <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Guest Search Card */}
        <Card className="p-5 sm:p-6 border-border shadow-md bg-card/90 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrackOrder();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-primary" /> Order ID *
                </Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. MCSX-260002, MCSX-260001"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-11 text-sm bg-background/60 border-border uppercase font-mono tracking-wide"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Company ID *
                </Label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. A260001, COMP-001, or Company ID"
                  value={companyIdInput}
                  onChange={(e) => setCompanyIdInput(e.target.value)}
                  className="h-11 text-sm bg-background/60 border-border uppercase font-mono tracking-wide"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                <span className="font-semibold text-foreground/80">Security Notice:</span>
                <span>Both Order ID & Company ID are required to verify ownership.</span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-10 px-6 w-full sm:w-auto text-xs font-bold gap-2 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying & Tracking...
                  </>
                ) : (
                  <>
                    Track Order
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Error State */}
        {searched && error && (
          <Card className="p-6 text-center border-destructive/30 bg-destructive/5 space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <h3 className="text-base font-bold text-foreground">Order Verification Failed</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
          </Card>
        )}

        {/* Order Details & Chat Section */}
        {orderData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Order Overview Header Card */}
            <Card className="p-5 sm:p-6 border-border shadow-md bg-card/95 backdrop-blur-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge variant="outline" className="font-mono text-xs font-bold px-2.5 py-0.5 bg-primary/10 text-primary border-primary/25">
                      #{orderData.order_number}
                    </Badge>
                    <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 ${getStatusBadgeVariant(orderData.status)}`}>
                      {orderData.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 bg-muted text-muted-foreground border-border">
                      Payment: {orderData.payment_status}
                    </Badge>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {orderData.job_title}
                  </h2>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Order Placed Date</p>
                  <p className="text-sm font-semibold text-foreground flex items-center sm:justify-end gap-1.5 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {orderData.created_at ? new Date(orderData.created_at).toLocaleDateString(undefined, { dateStyle: "medium" }) : "-"}
                  </p>
                </div>
              </div>

              {/* Company & Client Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> Company Entity
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground text-sm truncate">
                      {orderData.company_name || "General Client Order"}
                    </p>
                    {orderData.company_code && (
                      <Badge variant="outline" className="text-[10px] font-mono font-bold px-1.5 py-0 bg-primary/5 text-primary border-primary/20">
                        ID: {orderData.company_code}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-500" /> Client Representative
                  </span>
                  <p className="font-bold text-foreground text-sm truncate">
                    {orderData.client_name || "Client"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Operating Location
                  </span>
                  <p className="font-bold text-foreground text-sm truncate">
                    {orderData.branch_name || "Headquarters"}
                  </p>
                </div>
              </div>

              {/* Visual 5-Stage Milestone Progress Pipeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">Execution Milestones</span>
                  <span className="text-primary">{orderData.progress_percentage}% Completed</span>
                </div>

                {/* Progress bar line */}
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${orderData.progress_percentage}%` }}
                  />
                </div>

                {/* Milestones Steps */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  {orderData.milestones.map((m, idx) => (
                    <div
                      key={m.key || idx}
                      className={`p-2.5 rounded-lg border text-center transition-all ${m.completed
                          ? "bg-primary/10 border-primary/30 text-foreground"
                          : "bg-background/40 border-border/40 text-muted-foreground opacity-60"
                        }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {m.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-[11px] font-bold block leading-tight">{m.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Client Chat Stream & Read-Only Guest Dock */}
            <Card className="border-border shadow-lg bg-card/95 backdrop-blur-md overflow-hidden flex flex-col min-h-[720px] sm:h-[800px]">
              {/* Chat Stream Header */}
              <div className="p-4 sm:p-5 border-b border-border/70 bg-muted/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">Order Updates & Consultant Stream</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">Order #{orderData.order_number} Progress Channel</p>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] sm:text-[11px] font-bold bg-background text-muted-foreground border-border px-2.5 py-0.5">
                  Guest Read-Only Stream
                </Badge>
              </div>

              {/* Chat Messages Stream */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-background/30 overscroll-contain"
                style={{ scrollbarWidth: "thin" }}
              >
                {orderData.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                    <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-bold text-foreground">No progress updates yet</p>
                    <p className="text-[11px] text-muted-foreground max-w-xs mt-1">
                      Updates from your assigned consultants will appear here in real time.
                    </p>
                  </div>
                ) : (
                  orderData.messages.map((msg, idx) => {
                    const isSystem = isSystemMessage(msg);
                    const isClientSender = msg.is_client || (msg.sender_role || "").toUpperCase() === "CLIENT" || (msg.sender_role || "").toUpperCase() === "MEMBER";

                    if (isSystem) {
                      return (
                        <div key={msg.id || idx} className="flex justify-center my-3 px-2">
                          <div className="bg-muted/70 dark:bg-zinc-900/80 border border-border/80 dark:border-zinc-800 rounded-full px-3.5 py-1.5 text-xs text-muted-foreground dark:text-zinc-400 flex items-center gap-2 shadow-2xs backdrop-blur-md max-w-[92%] text-center">
                            <div className="h-5 w-5 rounded-full bg-muted dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              {getMilestoneIcon(msg.message)}
                            </div>
                            <span className="font-medium text-[11px] sm:text-xs leading-snug">{msg.message}</span>
                            <span className="text-[10px] text-muted-foreground/60 dark:text-zinc-500 shrink-0 font-mono ml-0.5">
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isClientSender ? "items-start" : "items-start"} max-w-[88%] mr-auto`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          {isClientSender ? (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
                              {msg.sender_role || "Client / Member"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20">
                              Consultant
                            </Badge>
                          )}
                          <span className="text-[11px] font-bold text-foreground">
                            {msg.sender_name || (isClientSender ? "Client" : "Consultant")}
                          </span>
                          {msg.sender_role && !isClientSender && (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              ({msg.sender_role})
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs ${isClientSender
                              ? "bg-emerald-500/10 dark:bg-emerald-950/30 text-foreground border border-emerald-500/25 dark:border-emerald-500/30 rounded-tl-sm"
                              : "bg-sky-500/10 dark:bg-sky-950/30 text-foreground border border-sky-500/25 dark:border-sky-500/30 rounded-tl-sm"
                            }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.message}</div>

                          {/* Client Uploaded Document Indicator (Viewing restricted) */}
                          {(msg.attachment_name || (msg.attachment_url && msg.attachment_url !== "uploading...")) && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-background/90 border border-border/60 flex items-center justify-between gap-3 text-xs shadow-2xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                                  <FileText className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-foreground truncate block text-xs">
                                    {msg.attachment_name || "Uploaded Document"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3 text-emerald-500" /> Stored in Consultant Vault
                                  </span>
                                </div>
                              </div>

                              <Badge variant="outline" className="text-[10px] font-medium bg-muted/60 text-muted-foreground border-border shrink-0">
                                Protected Document
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Guest Read-Only Dock with Register & Portal Links */}
              <div className="p-4 border-t border-border/80 bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shrink-0">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground flex items-center justify-center sm:justify-start gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-500" /> Unregistered Guest View
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    To interact directly with consultants, post messages, and upload documents, please register as a Member.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => setShowRegisterModal(true)}
                    className="h-8 text-xs font-bold gap-1.5 px-3.5 bg-primary text-primary-foreground shadow-sm"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Register Member
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-bold gap-1.5 px-3 border-border"
                  >
                    <Link href="/login">
                      Portal Login <ExternalLink className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Member Registration Modal (Spacious, Elegant & Professional Split Layout) */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-card border border-border/80 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden relative max-h-[92vh] flex flex-col lg:flex-row text-foreground"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="absolute right-4 top-4 z-30 p-2 rounded-full bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 backdrop-blur-md transition-all shadow-xs"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Left Column: Corporate Value & Feature Showcase */}
              <div className="lg:w-[42%] bg-gradient-to-br from-slate-950 via-zinc-900 to-black text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-border/40">
                {/* Glowing ambient backgrounds */}
                <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

                <div className="space-y-6 relative z-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold px-2.5 py-0.5 border-primary/40 bg-primary/20 text-primary-foreground tracking-wider uppercase">
                        Member Portal
                      </Badge>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
                      Collaborate Directly With Your Consulting Team
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Register your Member account to unlock direct messaging, deliverables tracking, and secure document vault for your orders.
                    </p>
                  </div>

                  {/* 3 Value Proposition Highlight Cards */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <div className="h-8 w-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30 mt-0.5">
                        <MessageSquare className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white">Direct 2-Way Live Chat</h4>
                        <p className="text-[11px] text-zinc-400 leading-tight">
                          Message your assigned corporate specialists and consultants.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <div className="h-8 w-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30 mt-0.5">
                        <Sparkles className="h-4 w-4 text-sky-400" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white">Milestone Progress Tracking</h4>
                        <p className="text-[11px] text-zinc-400 leading-tight">
                          Real-time 5-stage timeline from order placement to final delivery.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <div className="h-8 w-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30 mt-0.5">
                        <ShieldCheck className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white">Encrypted Order Vault</h4>
                        <p className="text-[11px] text-zinc-400 leading-tight">
                          Safely submit IDs, corporate docs, and receipts directly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="pt-6 border-t border-white/10 mt-6 relative z-10 flex items-center gap-2 text-[11px] text-zinc-400">
                  <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Enterprise Data Security & Corporate Confidentiality</span>
                </div>
              </div>

              {/* Right Column: Registration Form */}
              <div className="lg:w-[58%] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-5 bg-card/80">
                <div className="space-y-1.5">
                  <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                    Quick Setup
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                    Create Member Account
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {orderData?.order_number
                      ? `Registering will link your profile directly to Order #${orderData.order_number}.`
                      : "Create your member credentials to access the live consultation tracker."}
                  </p>
                </div>

                {regError && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterMember} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* 1. Full Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <User className="h-3.5 w-3.5 text-primary" /> Full Name *
                      </Label>
                      <Input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="h-10 text-xs bg-background/70 border-border/80"
                      />
                    </div>

                    {/* 2. Email Address */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <Mail className="h-3.5 w-3.5 text-primary" /> Email Address *
                      </Label>
                      <EmailInput
                        id="reg-email"
                        required
                        placeholder="name@example.com"
                        value={regEmail}
                        onChange={(val) => setRegEmail(val)}
                        className="h-10 text-xs bg-background/70 border-border/80"
                      />
                    </div>

                    {/* 3. Mobile Number with Country Code */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <Phone className="h-3.5 w-3.5 text-primary" /> Mobile Number
                      </Label>
                      <PhoneInput
                        id="reg-mobile"
                        value={regMobile}
                        onChange={(val) => setRegMobile(val)}
                        placeholder="812 3456 789"
                        className="h-10 text-xs bg-background/70 border-border/80"
                      />
                    </div>

                    {/* 4. Date of Birth */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <Calendar className="h-3.5 w-3.5 text-primary" /> Date of Birth
                      </Label>
                      <Input
                        type="date"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="h-10 text-xs bg-background/70 border-border/80"
                      />
                    </div>

                    {/* 5. Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <Lock className="h-3.5 w-3.5 text-primary" /> Password *
                      </Label>
                      <Input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="h-10 text-xs bg-background/70 border-border/80"
                      />
                    </div>

                    {/* 6. Confirm Password */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Confirm Password *
                      </Label>
                      <Input
                        type="password"
                        required
                        placeholder="Re-enter password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="h-10 text-xs bg-background/70 border-border/80"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={regLoading}
                    className="w-full h-11 text-xs sm:text-sm font-bold gap-2 mt-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all"
                  >
                    {regLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Account & Activating Portal...
                      </>
                    ) : (
                      <>
                        Complete Registration & Open Member Portal
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="pt-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <span>Already have a Member or Partner account?</span>
                    <Link href="/login" className="font-bold text-primary hover:underline flex items-center gap-0.5">
                      Log in at MCS Portal <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading order tracking portal...</p>
          </div>
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
