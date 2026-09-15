"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  Sparkles,
  Send,
  Paperclip,
  X,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowRight,
  UserCheck,
  Briefcase,
  FileCheck,
  Shield,
  MessageSquare,
  UploadCloud
} from "lucide-react";
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

function MemberTrackOrderContent() {
  const searchParams = useSearchParams();

  // Search & Order State
  const [searchInput, setSearchInput] = useState(searchParams.get("order") || "");
  const [companyIdInput, setCompanyIdInput] = useState(
    searchParams.get("company_id") || searchParams.get("company_code") || searchParams.get("tax_id") || ""
  );
  const [orderData, setOrderData] = useState<OrderTrackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat Input State
  const [chatMessage, setChatMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Send Chat Message (Authenticated Member)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData) return;
    if (!chatMessage.trim() && !selectedFile) return;

    const token = localStorage.getItem("hrms_token");
    if (!token) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    setSendingMessage(true);

    try {
      if (selectedFile) {
        // Upload with attachment
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (chatMessage.trim()) {
          formData.append("message", chatMessage.trim());
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/public/orders/${encodeURIComponent(orderData.order_number)}/upload-attachment`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to upload document.");
        }

        toast.success("Document shared with your consulting team!");
      } else {
        // Send text message
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/public/orders/${encodeURIComponent(orderData.order_number)}/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ message: chatMessage.trim() })
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to send message.");
        }
      }

      setChatMessage("");
      setSelectedFile(null);
      handleTrackOrder(orderData.order_number, companyIdInput.trim(), true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message.");
    } finally {
      setSendingMessage(false);
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
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-2.5 py-0.5 bg-primary/10 text-primary border-primary/20 text-[11px] font-bold uppercase">
              Member Workspace
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified Member Access
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1.5">
            Order Tracking & Consultant Live Chat
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Enter your Order ID and Company ID to monitor corporate deliverables and message directly with your assigned consulting team.
          </p>
        </div>
      </div>

      {/* Dual Search Input Bar */}
      <Card className="p-5 border-border shadow-md bg-card/90 backdrop-blur-md">
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
              <span className="font-semibold text-foreground/80">Active Verification:</span>
              <span>Order ID and Company ID pair unlocks live 2-way consultant messaging & document sharing.</span>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-6 w-full sm:w-auto text-xs font-bold gap-2 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Order...
                </>
              ) : (
                <>
                  Track & Open Live Chat
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

      {/* Empty State when no order searched yet */}
      {!orderData && !loading && !error && (
        <Card className="p-12 text-center border-border/60 bg-muted/20 space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Key in your Order ID to Begin</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Enter your Order ID (e.g. MCSX-260002) and registered Company ID above to track milestones, view corporate invoices, and chat directly with your assigned consultants.
          </p>
        </Card>
      )}

      {/* Order Details & Full Interactive Chat Section */}
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
                <p className="text-xs text-muted-foreground">Order Date</p>
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
                  <UserCheck className="h-3.5 w-3.5 text-emerald-500" /> Client Contact
                </span>
                <p className="font-bold text-foreground text-sm truncate">
                  {orderData.client_name || "Client Representative"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Location / Branch
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

          {/* Interactive Consultant Live Chat Stream & Input Dock */}
          <Card className="border-border shadow-lg bg-card/95 backdrop-blur-md overflow-hidden flex flex-col min-h-[720px] sm:h-[800px]">
            {/* Chat Stream Header */}
            <div className="p-4 sm:p-5 border-b border-border/70 bg-muted/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">Consultant & Member Live Channel</h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Direct 2-way communication for Order #{orderData.order_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] sm:text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1 px-2.5 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Stream
                </Badge>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-background/30 overscroll-contain"
              style={{ scrollbarWidth: "thin" }}
            >
              {orderData.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-bold text-foreground">No messages yet</p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mt-1">
                    Start a conversation with your assigned consultants using the input below.
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
                            {msg.sender_role || "Member"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold border border-sky-500/20">
                            Consultant
                          </Badge>
                        )}
                        <span className="text-[11px] font-bold text-foreground">
                          {msg.sender_name || (isClientSender ? "Member" : "Consultant")}
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

                        {/* Document Attachment Indicator (Viewing restricted for members) */}
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

            {/* Authenticated Member Interactive Chat Dock */}
            <form onSubmit={handleSendMessage} className="p-3.5 border-t border-border/80 bg-card space-y-2 shrink-0">
              {selectedFile && (
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-bold truncate text-foreground text-xs">{selectedFile.name}</span>
                    <span className="text-[10px] text-muted-foreground">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx,.zip"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 shrink-0 border-border/80 hover:bg-muted"
                  title="Attach Document, ID, or Receipt"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Input
                  type="text"
                  placeholder="Type a message or inquiry to your consulting team..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 h-10 text-xs bg-background/80 border-border/80"
                />

                <Button
                  type="submit"
                  disabled={sendingMessage || (!chatMessage.trim() && !selectedFile)}
                  className="h-10 px-4 text-xs font-bold gap-1.5 shrink-0 bg-primary text-primary-foreground"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Send
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function MemberTrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading Member Order Tracker...</p>
          </div>
        </div>
      }
    >
      <MemberTrackOrderContent />
    </Suspense>
  );
}
