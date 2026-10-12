"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  Square,
  FileText,
  FileCheck2,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Download,
  MessageSquare,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Building,
  ShieldCheck,
  ExternalLink,
  X,
  Maximize2,
  Minimize2
} from "lucide-react";
import { toast } from "sonner";

export interface PreSignatureChecklistItem {
  document_name: string;
  document_id?: number | null;
  document_path?: string | null;
  category?: string;
  size?: number | null;
  description?: string | null;
  source?: string;
  is_reviewed: boolean;
  reviewed_by_id?: number | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  notes?: string | null;
}

export interface PreSignatureChecklistResponse {
  order_number: string;
  company_name: string;
  company_code?: string;
  company_id?: number | null;
  total_documents: number;
  reviewed_documents: number;
  is_all_reviewed: boolean;
  lifecycle_status?: string;
  items: PreSignatureChecklistItem[];
}

export interface PreSignatureReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  companyName?: string;
  companyCode?: string;
  companyId?: string | number;
  currentLifecycleStatus?: string;
  onStatusUpdated?: (newStatus: string) => void;
  onOpenChat?: () => void;
}

export function PreSignatureReviewDialog({
  open,
  onOpenChange,
  orderNumber,
  companyName,
  companyCode,
  companyId,
  currentLifecycleStatus,
  onStatusUpdated,
  onOpenChat,
}: PreSignatureReviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PreSignatureChecklistResponse | null>(null);
  const [togglingDoc, setTogglingDoc] = useState<string | null>(null);
  const [advancingStatus, setAdvancingStatus] = useState(false);

  // In-System Document Preview State
  const [selectedDoc, setSelectedDoc] = useState<PreSignatureChecklistItem | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  const fetchChecklist = useCallback(async () => {
    if (!orderNumber) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/clients/orders/${encodeURIComponent(orderNumber)}/pre-signature-checklist`,
        { credentials: "include" }
      );
      if (!res.ok) {
        throw new Error("Failed to load pre-signature documents checklist.");
      }
      const json: PreSignatureChecklistResponse = await res.json();
      setData(json);

      // Keep selected document in sync if active
      if (selectedDoc) {
        const updated = json.items.find((i) => i.document_name === selectedDoc.document_name);
        if (updated) setSelectedDoc(updated);
      }
    } catch (err: any) {
      console.error("Error fetching pre-signature checklist:", err);
      toast.error(err.message || "Failed to load checklist");
    } finally {
      setLoading(false);
    }
  }, [orderNumber, selectedDoc]);

  // Reset preview when dialog closes
  const handleClosePreview = useCallback(() => {
    setSelectedDoc(null);
    setPreviewError(null);
    setIsFullscreenPreview(false);
    setPreviewBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    if (open && orderNumber) {
      fetchChecklist();
    } else {
      handleClosePreview();
      setData(null);
    }
  }, [open, orderNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  const handleToggleReview = async (item: PreSignatureChecklistItem) => {
    if (togglingDoc) return;
    const newReviewedState = !item.is_reviewed;
    setTogglingDoc(item.document_name);

    // Optimistic UI update in checklist
    setData((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((it) =>
        it.document_name === item.document_name
          ? {
              ...it,
              is_reviewed: newReviewedState,
              reviewed_by_name: newReviewedState ? "You (Saving...)" : null,
              reviewed_at: newReviewedState ? new Date().toISOString() : null,
            }
          : it
      );
      const revCount = updatedItems.filter((i) => i.is_reviewed).length;
      return {
        ...prev,
        items: updatedItems,
        reviewed_documents: revCount,
        is_all_reviewed: updatedItems.length > 0 && revCount === updatedItems.length,
      };
    });

    // Also update selected doc if it's the one being previewed
    if (selectedDoc?.document_name === item.document_name) {
      setSelectedDoc((prev) =>
        prev
          ? {
              ...prev,
              is_reviewed: newReviewedState,
              reviewed_by_name: newReviewedState ? "You" : null,
              reviewed_at: newReviewedState ? new Date().toISOString() : null,
            }
          : null
      );
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/clients/orders/${encodeURIComponent(orderNumber)}/pre-signature-checklist/toggle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            document_name: item.document_name,
            is_reviewed: newReviewedState,
            document_id: item.document_id,
            document_path: item.document_path,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update review status.");
      }

      const updatedItem: PreSignatureChecklistItem = await res.json();

      setData((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((it) =>
          it.document_name === item.document_name ? updatedItem : it
        );
        const revCount = updatedItems.filter((i) => i.is_reviewed).length;
        return {
          ...prev,
          items: updatedItems,
          reviewed_documents: revCount,
          is_all_reviewed: updatedItems.length > 0 && revCount === updatedItems.length,
        };
      });

      if (selectedDoc?.document_name === item.document_name) {
        setSelectedDoc(updatedItem);
      }

      if (newReviewedState) {
        toast.success(`Verified: '${item.document_name}' marked as reviewed!`, {
          description: "Logged automatically in order chat for audit trail.",
        });
      } else {
        toast.info(`'${item.document_name}' marked as unreviewed.`);
      }
    } catch (err: any) {
      console.error("Error toggling document review:", err);
      toast.error(err.message || "Failed to toggle review");
      fetchChecklist();
    } finally {
      setTogglingDoc(null);
    }
  };

  const handleAdvanceToReviewed = async () => {
    if (advancingStatus) return;
    setAdvancingStatus(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/clients/orders/${encodeURIComponent(orderNumber)}/advance-to-reviewed`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) {
        throw new Error("Failed to advance order lifecycle status.");
      }
      toast.success("Order status advanced to 'DOCUMENTS REVIEWED'!", {
        description: "Milestone logged in internal order chat.",
      });
      if (onStatusUpdated) {
        onStatusUpdated("DOCUMENTS_REVIEWED");
      }
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error advancing order status:", err);
      toast.error(err.message || "Failed to advance order status");
    } finally {
      setAdvancingStatus(false);
    }
  };

  // In-System Document Streaming
  const handleSelectDocForPreview = async (item: PreSignatureChecklistItem) => {
    // If clicking same doc, toggle off
    if (selectedDoc?.document_name === item.document_name) {
      handleClosePreview();
      return;
    }

    setSelectedDoc(item);
    setPreviewLoading(true);
    setPreviewError(null);

    // Revoke previous blob
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }

    try {
      const effectiveCompId = data?.company_id || companyId;

      // 1. Primary: Direct order pre-signature stream endpoint
      const streamEndpoint = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/clients/orders/${encodeURIComponent(
        orderNumber
      )}/pre-signature-checklist/stream-preview?document_name=${encodeURIComponent(
        item.document_name
      )}&document_id=${item.document_id || ""}&document_path=${encodeURIComponent(item.document_path || "")}`;

      const res = await fetch(streamEndpoint, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(objUrl);
        return;
      }

      // 2. Secondary fallback: Company document preview endpoint
      if (item.document_id && effectiveCompId) {
        const compEndpoint = `/api-proxy/api/clients/companies/${effectiveCompId}/documents/${item.document_id}/preview`;
        const compRes = await fetch(compEndpoint, { credentials: "include" });
        if (compRes.ok) {
          const blob = await compRes.blob();
          const objUrl = URL.createObjectURL(blob);
          setPreviewBlobUrl(objUrl);
          return;
        }
      }

      // 3. Tertiary fallback: Dropbox temporary link resolved to blob
      if (item.document_path && item.document_path.startsWith("/Clients/")) {
        const dropRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/dropbox/download?path=${encodeURIComponent(
            item.document_path
          )}&action=PREVIEW`,
          { credentials: "include" }
        );
        const dropJson = await dropRes.json();
        if (dropRes.ok && dropJson.success && dropJson.link) {
          const fileRes = await fetch(dropJson.link);
          if (fileRes.ok) {
            const blob = await fileRes.blob();
            const objUrl = URL.createObjectURL(blob);
            setPreviewBlobUrl(objUrl);
            return;
          }
        }
      }

      throw new Error("Unable to stream document. The file might still be transferring.");
    } catch (err: any) {
      console.error("Preview load error:", err);
      setPreviewError(err.message || "Failed to load document preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownloadDoc = async (item: PreSignatureChecklistItem) => {
    if (downloadingDoc) return;
    setDownloadingDoc(true);
    const toastId = toast.loading(`Preparing download for ${item.document_name}...`);

    try {
      const streamEndpoint = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/clients/orders/${encodeURIComponent(
        orderNumber
      )}/pre-signature-checklist/stream-preview?document_name=${encodeURIComponent(
        item.document_name
      )}&document_id=${item.document_id || ""}&document_path=${encodeURIComponent(
        item.document_path || ""
      )}&download=true`;

      const res = await fetch(streamEndpoint, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objUrl;
        link.download = item.document_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objUrl);
        toast.success(`Downloaded ${item.document_name}`, { id: toastId });
        return;
      }

      throw new Error("Download stream failed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to download document.", { id: toastId });
    } finally {
      setDownloadingDoc(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return null;
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getDocTypeBadge = (name: string) => {
    const ext = name.split(".").pop()?.toUpperCase() || "DOC";
    if (ext === "PDF") return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    if (["DOC", "DOCX"].includes(ext)) return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    if (["JPG", "JPEG", "PNG", "WEBP"].includes(ext))
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    if (["XLS", "XLSX"].includes(ext)) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
  };

  const total = data?.total_documents ?? 0;
  const reviewed = data?.reviewed_documents ?? 0;
  const progressPercent = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const isAllReviewed = total > 0 && reviewed === total;
  const statusToDisplay = data?.lifecycle_status || currentLifecycleStatus || "REVIEW_DOCS";

  const isDocPdf = (name?: string) => Boolean(name && /\.pdf$/i.test(name));
  const isDocImage = (name?: string) => Boolean(name && /\.(jpe?g|png|webp|svg)$/i.test(name));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={`p-0 !gap-0 bg-background border border-border text-foreground rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          selectedDoc
            ? "!w-[96vw] sm:!max-w-[96vw] md:!max-w-[96vw] lg:!max-w-[96vw] xl:!max-w-[1550px] 2xl:!max-w-[1650px] h-[92vh] max-h-[94vh]"
            : "!w-[96vw] sm:!max-w-3xl md:!max-w-4xl max-h-[92vh] h-auto"
        }`}
      >
        {/* Top Dialog Header */}
        <div className="p-4 sm:px-5 sm:py-4 border-b border-border/70 shrink-0 bg-gradient-to-r from-teal-500/15 via-teal-500/5 to-transparent dark:from-teal-950/40 dark:via-teal-950/15">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl border border-teal-500/30 bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground truncate">
                  <span>Pre-Signature Review Checklist</span>
                  <Badge
                    variant="outline"
                    className="text-[11px] font-mono px-2 py-0 border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10"
                  >
                    #{orderNumber}
                  </Badge>
                  {selectedDoc && (
                    <Badge
                      variant="outline"
                      className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold border-teal-500/40 text-teal-600 dark:text-teal-300 bg-teal-500/10"
                    >
                      <Eye className="h-3 w-3" />
                      In-System Viewer Active
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Building className="h-3 w-3 text-muted-foreground" />
                    {data?.company_name || companyName || "Client"}
                  </span>
                  <span>•</span>
                  <span>Category: Pre-Signature Documents</span>
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selectedDoc && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClosePreview}
                  className="h-8.5 px-2.5 text-xs gap-1.5 border-teal-500/30 hover:border-teal-500/50 text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 font-medium"
                  title="Close document viewer to return to compact list view"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Close Viewer</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchChecklist}
                disabled={loading}
                className="h-8.5 px-3 text-xs gap-1.5 border-border/80 hover:bg-muted font-medium"
                title="Refresh document checklist"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8.5 w-8.5 rounded-xl border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 text-muted-foreground hover:opacity-100 transition-all cursor-pointer shadow-xs ml-1"
                title="Close Review Checklist (Esc)"
              >
                <X className="h-4.5 w-4.5 stroke-[2.5]" />
                <span className="sr-only">Close Review Checklist</span>
              </Button>
            </div>
          </div>

          {/* Progress Banner (only on top when preview is not active, otherwise lives in left panel) */}
          {!selectedDoc && (
            <div className="mt-3 bg-card/80 dark:bg-zinc-900/60 border border-border/70 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="flex items-center gap-1.5 text-foreground">
                  <CheckCircle2 className={`h-4 w-4 ${isAllReviewed ? "text-emerald-500" : "text-teal-500"}`} />
                  Review Progress: {reviewed} of {total} Documents Checked
                </span>
                <span
                  className={
                    isAllReviewed
                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                      : "text-teal-600 dark:text-teal-400 font-bold"
                  }
                >
                  {progressPercent}% Complete
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isAllReviewed ? "bg-emerald-500" : "bg-teal-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-teal-500" />
                  Every check automatically posts an audit verification note in Order Chat.
                </span>
                <Badge variant="outline" className="text-[10px] font-semibold py-0 px-1.5 bg-background border-border">
                  Stage: {statusToDisplay.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        {selectedDoc ? (
          // ================= SPLIT VIEW (CHECKLIST + VIEWER IN ONE SCREEN) =================
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border/80">
            {/* Left Side: Checklist Panel (Sticky & Compact) */}
            <div
              className={`flex flex-col min-h-0 bg-muted/20 shrink-0 ${
                isFullscreenPreview ? "hidden" : "w-full md:w-[320px] lg:w-[340px] xl:w-[360px]"
              }`}
            >
              {/* Compact Progress Header in Left Panel */}
              <div className="p-3.5 border-b border-border/70 bg-card/60">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1 text-foreground">
                    <CheckCircle2 className={`h-3.5 w-3.5 ${isAllReviewed ? "text-emerald-500" : "text-teal-500"}`} />
                    Progress: {reviewed}/{total} Reviewed
                  </span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold text-xs">{progressPercent}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isAllReviewed ? "bg-emerald-500" : "bg-teal-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-teal-500 shrink-0" />
                  Select document below to view on right
                </p>
              </div>

              {/* Checklist Items Scrollable List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {data?.items.map((item, idx) => {
                  const isTogglingThis = togglingDoc === item.document_name;
                  const isCurrentActive = selectedDoc.document_name === item.document_name;

                  return (
                    <div
                      key={`split-${item.document_name}-${idx}`}
                      onClick={() => {
                        if (!isCurrentActive) handleSelectDocForPreview(item);
                      }}
                      className={`group rounded-xl border p-2.5 transition-all duration-150 flex items-start justify-between gap-2.5 cursor-pointer ${
                        isCurrentActive
                          ? "bg-teal-500/10 dark:bg-teal-950/40 border-teal-500 shadow-sm ring-1 ring-teal-500/30"
                          : item.is_reviewed
                          ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 hover:border-teal-500/40"
                          : "bg-card dark:bg-zinc-900/40 border-border/80 hover:border-teal-500/40 hover:bg-muted/40"
                      }`}
                    >
                      {/* Checkbox button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleReview(item);
                        }}
                        disabled={isTogglingThis}
                        className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs ${
                          item.is_reviewed
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "bg-background border-zinc-300 dark:border-zinc-700 hover:border-teal-500"
                        } ${isTogglingThis ? "opacity-60 cursor-wait" : ""}`}
                        title={item.is_reviewed ? "Click to uncheck review" : "Click to check & verify document"}
                      >
                        {isTogglingThis ? (
                          <Loader2 className="h-3 w-3 animate-spin text-current" />
                        ) : item.is_reviewed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                        ) : (
                          <Square className="h-3 w-3 text-muted-foreground/60" />
                        )}
                      </button>

                      {/* Doc Details */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-xs font-semibold truncate ${
                              isCurrentActive
                                ? "text-teal-700 dark:text-teal-300 font-bold"
                                : item.is_reviewed
                                ? "text-foreground line-through decoration-emerald-500/60"
                                : "text-foreground"
                            }`}
                            title={item.document_name}
                          >
                            {item.document_name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-mono py-0 px-1 ${getDocTypeBadge(item.document_name)}`}
                          >
                            {item.document_name.split(".").pop()?.toUpperCase() || "DOC"}
                          </Badge>
                        </div>

                        {/* Reviewer Meta info */}
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap">
                          {item.is_reviewed ? (
                            <span className="inline-flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                              <FileCheck2 className="h-2.5 w-2.5" />
                              Reviewed ({item.reviewed_by_name?.split(" ")[0] || "Reviewer"})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-amber-500">
                              <Clock className="h-2.5 w-2.5" />
                              Pending
                            </span>
                          )}
                          {formatFileSize(item.size) && <span>• {formatFileSize(item.size)}</span>}
                        </div>
                      </div>

                      {/* Right indicator */}
                      {isCurrentActive && (
                        <div className="shrink-0 self-center">
                          <Badge className="bg-teal-600 text-white text-[9px] font-medium py-0 px-1.5 shadow-xs">
                            Viewing
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Left Panel Footer Actions */}
              <div className="p-3 border-t border-border/70 bg-card/60 flex flex-col gap-2">
                {isAllReviewed &&
                  (statusToDisplay === "REVIEW_DOCS" ||
                    statusToDisplay === "ORDER_ASSIGNED" ||
                    statusToDisplay === "IN_PROGRESS") && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAdvanceToReviewed}
                      disabled={advancingStatus}
                      className="w-full h-8 text-xs font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
                    >
                      {advancingStatus ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      <span>Advance Order Status</span>
                    </Button>
                  )}

                <div className="flex items-center justify-between gap-2">
                  {onOpenChat && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        onOpenChat();
                      }}
                      className="h-8 text-[11px] gap-1 text-emerald-600 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>Chat</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="h-8 text-[11px] px-3 ml-auto"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Side: Embedded Document Viewer Panel */}
            <div className="flex-1 min-w-0 w-full flex flex-col min-h-0 bg-slate-950/5 dark:bg-zinc-950/60 overflow-hidden">
              {/* Viewer Control Bar */}
              <div className="px-4 py-2.5 border-b border-border/70 bg-card/90 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className="text-xs sm:text-sm font-bold text-foreground truncate max-w-sm sm:max-w-md md:max-w-lg"
                        title={selectedDoc.document_name}
                      >
                        {selectedDoc.document_name}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono py-0 px-1.5 ${getDocTypeBadge(selectedDoc.document_name)}`}
                      >
                        {selectedDoc.document_name.split(".").pop()?.toUpperCase() || "DOC"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Category: {selectedDoc.category || "Pre-Signature Documents"}
                      {formatFileSize(selectedDoc.size) && ` • ${formatFileSize(selectedDoc.size)}`}
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Mark Reviewed Toggle button inside viewer toolbar */}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleToggleReview(selectedDoc)}
                    disabled={togglingDoc === selectedDoc.document_name}
                    className={`h-8 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs ${
                      selectedDoc.is_reviewed
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {togglingDoc === selectedDoc.document_name ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : selectedDoc.is_reviewed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <CheckSquare className="h-3.5 w-3.5" />
                    )}
                    <span>{selectedDoc.is_reviewed ? "Reviewed" : "Mark Reviewed"}</span>
                  </Button>

                  {/* Download button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDoc(selectedDoc)}
                    disabled={downloadingDoc}
                    className="h-8 px-2 text-xs gap-1 border-border/80 hover:bg-muted"
                    title="Download document file"
                  >
                    <Download className={`h-3.5 w-3.5 ${downloadingDoc ? "animate-bounce" : ""}`} />
                    <span className="hidden sm:inline">Download</span>
                  </Button>

                  {/* Fullscreen Viewer toggle */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreenPreview((prev) => !prev)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hidden lg:flex items-center justify-center"
                    title={isFullscreenPreview ? "Restore checklist view" : "Maximize viewer frame"}
                  >
                    {isFullscreenPreview ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </Button>

                  {/* Close Viewer button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClosePreview}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                    title="Close document viewer (return to standard list view)"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Viewer Frame Body */}
              <div className="flex-1 min-h-0 p-2 sm:p-3 overflow-hidden flex flex-col items-center justify-center relative">
                {previewLoading ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-3 m-auto text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                    <p className="text-xs font-semibold text-muted-foreground">Streaming document directly into viewer...</p>
                    <p className="text-[11px] text-muted-foreground/80 max-w-xs">
                      Fetching encrypted bytes from cloud repository.
                    </p>
                  </div>
                ) : previewError ? (
                  <div className="text-center p-6 bg-card rounded-2xl border border-border space-y-3 max-w-md m-auto shadow-sm">
                    <AlertCircle className="h-9 w-9 text-amber-500 mx-auto" />
                    <p className="text-sm font-bold text-foreground">Could not preview document</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{previewError}</p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleSelectDocForPreview(selectedDoc)}
                        className="h-8 text-xs font-medium"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDoc(selectedDoc)}
                        className="h-8 text-xs font-medium gap-1"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                    </div>
                  </div>
                ) : previewBlobUrl ? (
                  isDocPdf(selectedDoc.document_name) ? (
                    <iframe
                      src={`${previewBlobUrl}#toolbar=1&navpanes=0`}
                      className="w-full h-full rounded-xl bg-white border border-border/70 shadow-xs"
                      title={selectedDoc.document_name}
                    />
                  ) : isDocImage(selectedDoc.document_name) ? (
                    <div className="w-full h-full flex items-center justify-center overflow-auto rounded-xl bg-zinc-950/20 dark:bg-zinc-950/70 border border-border/60 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewBlobUrl}
                        alt={selectedDoc.document_name}
                        className="max-h-full max-w-full object-contain rounded-lg shadow-lg border border-border/40"
                      />
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-card rounded-2xl border border-border space-y-3 max-w-md m-auto shadow-sm">
                      <FileText className="h-10 w-10 text-teal-500 mx-auto" />
                      <p className="text-sm font-bold text-foreground">{selectedDoc.document_name}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        This file format ({selectedDoc.document_name.split(".").pop()?.toUpperCase()}) can be downloaded
                        for viewing in your local application.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadDoc(selectedDoc)}
                        className="font-bold gap-2 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        <Download className="h-4 w-4" /> Download File
                      </Button>
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          // ================= STANDARD VIEW (COMPACT LIST VIEW) =================
          <>
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 min-h-[260px] max-h-[58vh]">
              {loading && !data ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
                  <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
                  <p className="text-xs font-medium">Scanning Pre-Signature Documents folder...</p>
                </div>
              ) : !data || data.items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/90 p-8 text-center flex flex-col items-center justify-center space-y-2.5">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">No Pre-Signature Documents Found</h4>
                  <p className="text-xs text-muted-foreground max-w-md">
                    No documents currently detected under the &apos;Pre-Signature Documents&apos; category for order
                    #{orderNumber}. Upload or place draft agreements and pre-docs in the order folder to review them.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.items.map((item, idx) => {
                    const isTogglingThis = togglingDoc === item.document_name;

                    return (
                      <div
                        key={`${item.document_name}-${idx}`}
                        className={`group rounded-xl border p-3 sm:p-3.5 transition-all duration-150 flex items-start sm:items-center justify-between gap-3 ${
                          item.is_reviewed
                            ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30"
                            : "bg-card dark:bg-zinc-900/40 border-border/80 hover:border-teal-500/40 hover:bg-muted/30"
                        }`}
                      >
                        {/* Left: Checkbox & Doc Info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleReview(item)}
                            disabled={isTogglingThis}
                            className={`mt-0.5 sm:mt-0 h-6 w-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs ${
                              item.is_reviewed
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/20"
                                : "bg-background border-zinc-300 dark:border-zinc-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                            } ${isTogglingThis ? "opacity-60 cursor-wait" : ""}`}
                            title={item.is_reviewed ? "Click to uncheck review" : "Click to check & verify document"}
                          >
                            {isTogglingThis ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
                            ) : item.is_reviewed ? (
                              <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                            ) : (
                              <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                onClick={() => handleSelectDocForPreview(item)}
                                className={`text-xs sm:text-sm font-semibold truncate cursor-pointer transition-colors ${
                                  item.is_reviewed
                                    ? "text-foreground line-through decoration-emerald-500/50"
                                    : "text-foreground hover:text-teal-600 dark:hover:text-teal-400"
                                }`}
                                title="Click to view inside system"
                              >
                                {item.document_name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] font-mono py-0 px-1.5 ${getDocTypeBadge(item.document_name)}`}
                              >
                                {item.document_name.split(".").pop()?.toUpperCase() || "DOC"}
                              </Badge>
                              {formatFileSize(item.size) && (
                                <span className="text-[10px] text-muted-foreground">{formatFileSize(item.size)}</span>
                              )}
                            </div>

                            {/* Reviewer / Meta info */}
                            <div className="flex items-center gap-2 flex-wrap text-[11px]">
                              {item.is_reviewed ? (
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                  <FileCheck2 className="h-3 w-3" />
                                  Reviewed by {item.reviewed_by_name || "Reviewer"}
                                  {item.reviewed_at && (
                                    <span className="text-muted-foreground text-[10px]">
                                      • {formatDateTime(item.reviewed_at)}
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3 text-amber-500" />
                                  Pending Review
                                </span>
                              )}

                              {item.description && (
                                <span className="text-muted-foreground truncate max-w-xs" title={item.description}>
                                  • {item.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectDocForPreview(item)}
                            className="h-8 px-2.5 text-xs gap-1 border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10 hover:bg-teal-500/20"
                            title="Open In-System Preview (Same Screen)"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3.5 sm:px-5 sm:py-3.5 border-t border-border/70 shrink-0 bg-muted/20 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                {onOpenChat && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onOpenChat();
                    }}
                    className="h-9 text-xs gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Open Order Chat</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isAllReviewed &&
                  (statusToDisplay === "REVIEW_DOCS" ||
                    statusToDisplay === "ORDER_ASSIGNED" ||
                    statusToDisplay === "IN_PROGRESS") && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAdvanceToReviewed}
                      disabled={advancingStatus}
                      className="h-9 px-3.5 text-xs font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer"
                    >
                      {advancingStatus ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span>Advance to Documents Reviewed</span>
                    </Button>
                  )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-9 px-4 text-xs font-medium cursor-pointer"
                >
                  Done
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
