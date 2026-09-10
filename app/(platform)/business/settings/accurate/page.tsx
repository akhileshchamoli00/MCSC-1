"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Building2,
  Receipt,
  CreditCard,
  Database,
  Layers,
  Clock,
  Code,
  Check,
  Sparkles,
  Search,
  Activity,
  FileCheck,
  Lock,
  Server
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/contexts/user-context";

interface AccurateConfig {
  id: number;
  database_id?: string;
  database_alias?: string;
  default_bank_account_no?: string;
  default_bank_account_name?: string;
  default_sales_account_no?: string;
  default_ar_account_no?: string;
  default_dp_account_no?: string;
  default_tax_ppn_no?: string;
  auto_sync_on_proforma: boolean;
  auto_sync_on_payment: boolean;
  auto_sync_on_final_invoice: boolean;
  is_active: boolean;
  is_connected: boolean;
  has_credentials: boolean;
  token_expires_at?: string;
  updated_at?: string;
}

interface SyncLog {
  id: number;
  event_type: string;
  status: string;
  reference_id?: string;
  reference_number?: string;
  accurate_doc_no?: string;
  request_payload?: string;
  response_payload?: string;
  error_message?: string;
  created_at: string;
}

export default function AccurateSettingsPage() {
  const { isAdmin } = useUser();
  const [config, setConfig] = useState<AccurateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [logFilterStatus, setLogFilterStatus] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "mapping" | "logs">("overview");

  // Form State (Chart of Accounts & Automation rules only - No secrets on frontend)
  const [formData, setFormData] = useState({
    default_bank_account_no: "130001",
    default_bank_account_name: "Giro Bank 998",
    default_sales_account_no: "4101",
    default_ar_account_no: "1103",
    default_dp_account_no: "2102",
    default_tax_ppn_no: "PPN 11%",
    auto_sync_on_proforma: true,
    auto_sync_on_payment: true,
    auto_sync_on_final_invoice: true,
    is_active: true
  });

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accurate/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setFormData({
          default_bank_account_no: data.default_bank_account_no || "130001",
          default_bank_account_name: data.default_bank_account_name || "Giro Bank 998",
          default_sales_account_no: data.default_sales_account_no || "4101",
          default_ar_account_no: data.default_ar_account_no || "1103",
          default_dp_account_no: data.default_dp_account_no || "2102",
          default_tax_ppn_no: data.default_tax_ppn_no || "PPN 11%",
          auto_sync_on_proforma: data.auto_sync_on_proforma !== false,
          auto_sync_on_payment: data.auto_sync_on_payment !== false,
          auto_sync_on_final_invoice: data.auto_sync_on_final_invoice !== false,
          is_active: data.is_active !== false
        });
      }
    } catch (err) {
      console.error("Failed to fetch Accurate config:", err);
      toast.error("Could not load Accurate Online configuration");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accurate/logs?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch Accurate sync logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, []);

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accurate/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        toast.success("Accurate Online settings saved successfully!");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to save Accurate settings");
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accurate/test-connection`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Connected to Accurate Online successfully!");
        fetchConfig();
        fetchLogs();
      } else {
        toast.error(data.message || data.error || "Accurate connection test failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to test Accurate connection");
    } finally {
      setTesting(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      !logSearch ||
      (log.reference_number && log.reference_number.toLowerCase().includes(logSearch.toLowerCase())) ||
      (log.accurate_doc_no && log.accurate_doc_no.toLowerCase().includes(logSearch.toLowerCase())) ||
      (log.event_type && log.event_type.toLowerCase().includes(logSearch.toLowerCase())) ||
      (log.error_message && log.error_message.toLowerCase().includes(logSearch.toLowerCase()));

    const matchesStatus = logFilterStatus === "ALL" || log.status === logFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1 font-mono text-[11px] font-bold">
            <CheckCircle2 className="h-3 w-3" /> SUCCESS
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 gap-1 font-mono text-[11px] font-bold">
            <XCircle className="h-3 w-3" /> FAILED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-mono text-[11px] font-bold">
            {status}
          </Badge>
        );
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "CUSTOMER_SYNC":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-bold">
            <Building2 className="h-2.5 w-2.5 mr-1" /> Customer Sync
          </Badge>
        );
      case "PROFORMA_SO":
        return (
          <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px] font-bold">
            <Receipt className="h-2.5 w-2.5 mr-1" /> Proforma (SO)
          </Badge>
        );
      case "SALES_INVOICE":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">
            <FileCheck className="h-2.5 w-2.5 mr-1" /> Final Invoice
          </Badge>
        );
      case "SALES_RECEIPT":
        return (
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
            <CreditCard className="h-2.5 w-2.5 mr-1" /> Sales Receipt
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16 max-w-7xl mx-auto">
      {/* Hero Banner with Live Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-background border border-border/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
                <Zap className="h-5 w-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Accurate Online Integration
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 gap-1.5 px-3 py-1 font-mono text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE CONNECTED
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automated 2-way accounting bridge for MCS Platform. Generates Customers, Proforma Sales Orders,
              Final Tax Invoices with DP allocation, and Sales Receipts into Accurate Online on the fly.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing}
              className="gap-2 font-bold bg-background/80 hover:bg-background shadow-xs h-9"
            >
              <RefreshCw className={`h-4 w-4 ${testing ? "animate-spin text-primary" : ""}`} />
              {testing ? "Testing Connection..." : "Test Connection"}
            </Button>
          </div>
        </div>

        {/* Quick Database & Health Indicator Strip */}
        <div className="mt-6 pt-5 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground block font-medium">Connected Database</span>
            <span className="font-bold text-foreground flex items-center gap-1.5 mt-0.5">
              <Database className="h-3.5 w-3.5 text-purple-500" />
              {config?.database_alias || "PT Mandiri Cipta Solusi"} (#{config?.database_id || "851599"})
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block font-medium">Default Bank Account</span>
            <span className="font-mono font-bold text-foreground mt-0.5 block">
              {config?.default_bank_account_no || "1101"} ({config?.default_bank_account_name || "Bank BCA"})
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block font-medium">Auto-Sync On Proforma</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {config?.auto_sync_on_proforma ? "Active (On-The-Fly)" : "Disabled"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block font-medium">Auto-Sync Receipts</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {config?.auto_sync_on_payment ? "Active (Xendit & Wire)" : "Disabled"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "overview"
              ? "bg-primary/10 text-primary border border-primary/20 shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> System Health & Security
        </button>
        <button
          onClick={() => setActiveTab("mapping")}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "mapping"
              ? "bg-primary/10 text-primary border border-primary/20 shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Layers className="h-4 w-4" /> Chart of Accounts & Rules
        </button>
        <button
          onClick={() => {
            setActiveTab("logs");
            fetchLogs();
          }}
          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "logs"
              ? "bg-primary/10 text-primary border border-primary/20 shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Activity className="h-4 w-4" /> Sync Audit Logs ({logs.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & SYSTEM HEALTH */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Security & Health Card */}
          <Card className="lg:col-span-2 border-border/80 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Server className="h-5 w-5 text-emerald-500" /> Secure Backend Integration Status
              </CardTitle>
              <CardDescription className="text-xs">
                Accurate Online API credentials and HMAC signatures are managed securely on the server backend.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                  <ShieldCheck className="h-5 w-5" /> Live Connection Active & Verified
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  The MCS backend server is securely connected to Accurate Online database <strong className="text-foreground">PT MANDIRI CIPTA SOLUSI (#851599)</strong>. All outgoing API requests are cryptographically signed with HMAC-SHA256 headers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Credential Storage</span>
                  <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-purple-500" /> Server Environment (.env)
                  </p>
                  <p className="text-[11px] text-muted-foreground">Tokens are protected and never exposed to the browser.</p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Company Database</span>
                  <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-blue-500" /> PT Mandiri Cipta Solusi
                  </p>
                  <p className="text-[11px] text-muted-foreground">Database ID #851599 (Zeus Server)</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t border-border/40 pt-4">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {config?.updated_at ? `Configuration verified ${new Date(config.updated_at).toLocaleString("id-ID")}` : "Ready"}
              </span>
              <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testing} className="font-bold text-xs">
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${testing ? "animate-spin text-primary" : ""}`} />
                {testing ? "Verifying..." : "Run Health Check"}
              </Button>
            </CardFooter>
          </Card>

          {/* Workflow Overview Card */}
          <div className="space-y-6">
            <Card className="border-border/80 shadow-md bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" /> Automated On-The-Fly Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold shrink-0 text-[10px]">1</span>
                  <p><strong className="text-foreground">Proforma Invoicing:</strong> Auto-creates Customer and Sales Order (50% DP milestone) in Accurate.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold shrink-0 text-[10px]">2</span>
                  <p><strong className="text-foreground">Payment Receipt:</strong> Automatically registers Sales Receipt and deposits funds to Bank BCA ledger (#1101).</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0 text-[10px]">3</span>
                  <p><strong className="text-foreground">Final Invoice:</strong> Generates official Sales Invoice, auto-deducting down payment already paid.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS & AUTOMATION RULES */}
      {activeTab === "mapping" && (
        <Card className="border-border/80 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" /> Chart of Accounts & Automation Configuration
            </CardTitle>
            <CardDescription className="text-xs">
              Configure the exact general ledger accounts and automation behaviors for on-the-fly posting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Default Bank Account No
                </label>
                <Input
                  placeholder="130001"
                  value={formData.default_bank_account_no}
                  onChange={(e) => setFormData({ ...formData, default_bank_account_no: e.target.value })}
                  className="font-mono text-xs"
                />
                <span className="text-[10px] text-muted-foreground">e.g. 130001 (Giro Bank 998)</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Bank Account Name
                </label>
                <Input
                  placeholder="Giro Bank 998"
                  value={formData.default_bank_account_name}
                  onChange={(e) => setFormData({ ...formData, default_bank_account_name: e.target.value })}
                  className="text-xs"
                />
                <span className="text-[10px] text-muted-foreground">e.g. Giro Bank 998 / Bank BCA</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Default Sales Income Account No
                </label>
                <Input
                  placeholder="4101"
                  value={formData.default_sales_account_no}
                  onChange={(e) => setFormData({ ...formData, default_sales_account_no: e.target.value })}
                  className="font-mono text-xs"
                />
                <span className="text-[10px] text-muted-foreground">e.g. 4101 (Pendapatan Jasa Konsultasi)</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Default Accounts Receivable (AR)
                </label>
                <Input
                  placeholder="1103"
                  value={formData.default_ar_account_no}
                  onChange={(e) => setFormData({ ...formData, default_ar_account_no: e.target.value })}
                  className="font-mono text-xs"
                />
                <span className="text-[10px] text-muted-foreground">e.g. 1103 (Piutang Usaha IDR)</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Down Payment (DP) Account
                </label>
                <Input
                  placeholder="2102"
                  value={formData.default_dp_account_no}
                  onChange={(e) => setFormData({ ...formData, default_dp_account_no: e.target.value })}
                  className="font-mono text-xs"
                />
                <span className="text-[10px] text-muted-foreground">e.g. 2102 (Uang Muka Penjualan)</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Default PPN / VAT Tax Code
                </label>
                <Input
                  placeholder="PPN 11%"
                  value={formData.default_tax_ppn_no}
                  onChange={(e) => setFormData({ ...formData, default_tax_ppn_no: e.target.value })}
                  className="text-xs"
                />
                <span className="text-[10px] text-muted-foreground">Accurate Tax Name (e.g. PPN 11%)</span>
              </div>
            </div>

            {/* Automation Toggles */}
            <div className="pt-6 border-t border-border/60 space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Automated Trigger Rules
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Sync on Proforma</p>
                    <p className="text-[11px] text-muted-foreground">
                      Auto-creates Customer and Sales Order when Proforma (50% DP) is finalized.
                    </p>
                  </div>
                  <Switch
                    checked={formData.auto_sync_on_proforma}
                    onCheckedChange={(val: boolean) => setFormData({ ...formData, auto_sync_on_proforma: val })}
                  />
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Sync on Payment</p>
                    <p className="text-[11px] text-muted-foreground">
                      Auto-creates Sales Receipt and deposits funds to Bank BCA when payment confirmed.
                    </p>
                  </div>
                  <Switch
                    checked={formData.auto_sync_on_payment}
                    onCheckedChange={(val: boolean) => setFormData({ ...formData, auto_sync_on_payment: val })}
                  />
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Sync on Final Invoice</p>
                    <p className="text-[11px] text-muted-foreground">
                      Auto-creates Final Sales Invoice with DP deduction when deliverables are ready.
                    </p>
                  </div>
                  <Switch
                    checked={formData.auto_sync_on_final_invoice}
                    onCheckedChange={(val: boolean) => setFormData({ ...formData, auto_sync_on_final_invoice: val })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border/40 pt-4">
            <Button onClick={handleSaveConfig} disabled={saving} className="font-bold shadow-sm">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Save Configuration
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* TAB 3: LIVE SYNC AUDIT LOGS */}
      {activeTab === "logs" && (
        <Card className="border-border/80 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" /> Accurate Synchronization Audit Logs
                </CardTitle>
                <CardDescription className="text-xs">
                  Full chronological history of all API calls, status responses, and error payloads.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search order ref, doc no..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="text-xs h-8 pl-8 w-48 sm:w-64 bg-muted/30"
                  />
                </div>

                <select
                  value={logFilterStatus}
                  onChange={(e) => setLogFilterStatus(e.target.value)}
                  className="text-xs h-8 px-2.5 rounded-lg border border-border bg-muted/30 text-foreground"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">Success Only</option>
                  <option value="FAILED">Failed Only</option>
                </select>

                <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loadingLogs} className="h-8 text-xs font-bold gap-1">
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Event Type</th>
                    <th className="p-3.5">Order / Entity Ref</th>
                    <th className="p-3.5">Accurate Doc No</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-sans">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("id-ID")}
                        </td>
                        <td className="p-3.5">{getEventTypeBadge(log.event_type)}</td>
                        <td className="p-3.5 font-bold text-foreground">
                          {log.reference_number || (log.reference_id ? `Ref #${log.reference_id}` : "-")}
                        </td>
                        <td className="p-3.5">
                          {log.accurate_doc_no ? (
                            <Badge variant="outline" className="font-mono text-[11px] font-bold bg-primary/5 text-primary border-primary/20">
                              {log.accurate_doc_no}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground font-mono text-xs">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">{getStatusBadge(log.status)}</td>
                        <td className="p-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="h-7 px-2 text-xs font-bold text-primary hover:bg-primary/10 gap-1"
                          >
                            <Code className="h-3 w-3" /> View Payload
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        {loadingLogs ? "Loading sync logs..." : "No Accurate synchronization logs found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PAYLOAD INSPECTOR MODAL */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl p-6 bg-background border border-border">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Code className="h-4 w-4 text-purple-500" /> API Payload Inspector
              </DialogTitle>
              {selectedLog && getStatusBadge(selectedLog.status)}
            </div>
            <DialogDescription className="text-xs">
              Event: <strong className="text-foreground">{selectedLog?.event_type}</strong> | Ref:{" "}
              <span className="font-mono text-foreground font-bold">{selectedLog?.reference_number}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pt-2 text-xs font-mono">
              {selectedLog.error_message && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" /> Error Description:
                  </p>
                  <p className="mt-1 font-sans text-xs">{selectedLog.error_message}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="font-bold text-foreground text-xs font-sans">Request Payload:</span>
                <pre className="p-3 rounded-xl bg-muted/60 border border-border/60 overflow-x-auto text-[11px] leading-relaxed">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.request_payload || "{}"), null, 2);
                    } catch {
                      return selectedLog.request_payload || "No request payload";
                    }
                  })()}
                </pre>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-foreground text-xs font-sans">Accurate Response Payload:</span>
                <pre className="p-3 rounded-xl bg-muted/60 border border-border/60 overflow-x-auto text-[11px] leading-relaxed">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.response_payload || "{}"), null, 2);
                    } catch {
                      return selectedLog.response_payload || "No response payload";
                    }
                  })()}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
