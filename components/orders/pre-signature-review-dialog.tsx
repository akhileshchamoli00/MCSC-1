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
import { Textarea } from "@/components/ui/textarea";
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
  Minimize2,
  XCircle,
  AlertTriangle,
  Trash2,
  Ban,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { ExcelPreview } from "@/components/excel-preview";

export interface PreSignatureChecklistItem {
  document_name: string;
  document_id?: number | null;
  document_path?: string | null;
  category?: string;
  size?: number | null;
  description?: string | null;
  source?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "EXCLUDED" | string;
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
  faulty_documents?: number;
  excluded_documents?: number;
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
  onDocumentsUpdated?: () => void;
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
  onDocumentsUpdated,
}: PreSignatureReviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PreSignatureChecklistResponse | null>(null);
  const [togglingDoc, setTogglingDoc] = useState<string | null>(null);
  const [advancingStatus, setAdvancingStatus] = useState(false);

  // In-System Document Preview State
  const [selectedDoc, setSelectedDoc] = useState<PreSignatureChecklistItem | null>(null);
  const selectedDocRef = React.useRef<PreSignatureChecklistItem | null>(null);
  useEffect(() => {
    selectedDocRef.current = selectedDoc;
  }, [selectedDoc]);

  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // DOCX inline preview states
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);
  const docxContainerRef = React.useRef<HTMLDivElement>(null);

  // Faulty / Rejection Dialog State
  const [faultDialogDoc, setFaultDialogDoc] = useState<PreSignatureChecklistItem | null>(null);
  const [faultComment, setFaultComment] = useState("");
  const [submittingFault, setSubmittingFault] = useState(false);

  // Render Word document (.docx) using docx-preview
  useEffect(() => {
    if (!selectedDoc || !selectedDoc.document_name?.match(/\.docx$/i) || !previewBlobUrl) {
      setDocxLoading(false);
      setDocxError(null);
      return;
    }

    let isMounted = true;
    setDocxLoading(true);
    setDocxError(null);

    fetch(previewBlobUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Could not load document (${res.status})`);
        return res.blob();
      })
      .then(async (blob) => {
        if (!isMounted) return;
        setTimeout(async () => {
          if (!isMounted || !docxContainerRef.current) return;
          try {
            docxContainerRef.current.innerHTML = "";
            const { renderAsync } = await import("docx-preview");
            await renderAsync(blob, docxContainerRef.current, undefined, {
              className: "docx-preview-content",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
            });
            if (isMounted) setDocxLoading(false);
          } catch (renderErr: any) {
            console.error("docx render error", renderErr);
            if (isMounted) {
              const msg = renderErr?.message || "";
              if (
                msg.toLowerCase().includes("central directory") ||
                msg.toLowerCase().includes("zip") ||
                msg.toLowerCase().includes("password") ||
                msg.toLowerCase().includes("encrypt")
              ) {
                setDocxError(
                  "This Word document is password-protected or encrypted. Please download the file to open and enter the password."
                );
              } else {
                setDocxError(msg || "Failed to render Word document preview.");
              }
              setDocxLoading(false);
            }
          }
        }, 60);
      })
      .catch((err: any) => {
        console.error("docx fetch error", err);
        if (isMounted) {
          setDocxError(err.message || "Failed to retrieve Word document data.");
          setDocxLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDoc, previewBlobUrl]);

  const fetchChecklist = useCallback(async (silent = false) => {
    if (!orderNumber) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/clients/orders/${encodeURIComponent(orderNumber)}/pre-signature-checklist`,
        { credentials: "include" }
      );
      if (!res.ok) {
        if (!silent) throw new Error("Failed to load pre-signature documents checklist.");
        return;
      }
      const json: PreSignatureChecklistResponse = await res.json();
      setData(json);

      // Keep selected document in sync if active
      if (selectedDocRef.current) {
        const updated = json.items.find((i) => i.document_name === selectedDocRef.current?.document_name);
        if (updated) setSelectedDoc(updated);
      }
    } catch (err: any) {
      if (!silent) {
        console.error("Error fetching pre-signature checklist:", err);
        toast.error(err.message || "Failed to load checklist");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderNumber]);

  // Reset preview when dialog closes
  const handleClosePreview = useCallback(() => {
    setSelectedDoc(null);
    setPreviewError(null);
    setDocxError(null);
    setDocxLoading(false);
    setIsFullscreenPreview(false);
    setPreviewBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  // Out of Scope / Exclude from review state
  const [excludingDoc, setExcludingDoc] = useState<string | null>(null);
  const [filterScope, setFilterScope] = useState<"ALL" | "ACTIVE" | "EXCLUDED">("ALL");
  const [deletingDocName, setDeletingDocName] = useState<string | null>(null);

  const handleToggleExclude = async (item: PreSignatureChecklistItem) => {
    if (excludingDoc) return;
    const isCurrentlyExcluded = item.status === "EXCLUDED";
    const targetStatus = isCurrentlyExcluded ? "PENDING" : "EXCLUDED";
    setExcludingDoc(item.document_name);

    // Retain original cross file / issue comment if present
    const preservedNote = item.notes && item.notes !== "Old Version - Not for Review" ? item.notes : null;

    // Optimistic UI update in checklist
    setData((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((it) =>
        it.document_name === item.document_name && (item.document_id ? it.document_id === item.document_id : true)
          ? {
            ...it,
            status: targetStatus,
            is_reviewed: false,
            notes: preservedNote,
          }
          : it
      );
      const activeItems = updatedItems.filter((i) => i.status !== "EXCLUDED");
      const revCount = activeItems.filter((i) => i.status === "APPROVED" || (i.is_reviewed && i.status !== "REJECTED")).length;
      const faultyCount = activeItems.filter((i) => i.status === "REJECTED").length;
      const exclCount = updatedItems.filter((i) => i.status === "EXCLUDED").length;
      return {
        ...prev,
        items: updatedItems,
        reviewed_documents: revCount,
        faulty_documents: faultyCount,
        excluded_documents: exclCount,
        is_all_reviewed: activeItems.length > 0 && revCount === activeItems.length && faultyCount === 0,
      };
    });

    if (selectedDoc?.document_name === item.document_name) {
      setSelectedDoc((prev) =>
        prev
          ? {
            ...prev,
            status: targetStatus,
            is_reviewed: false,
            notes: preservedNote,
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
            document_id: item.document_id,
            document_path: item.document_path,
            is_reviewed: false,
            status: targetStatus,
            notes: preservedNote,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update document scope.");
      }

      const updatedItem: PreSignatureChecklistItem = await res.json();

      setData((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((it) =>
          it.document_name === updatedItem.document_name && (item.document_id ? it.document_id === item.document_id : true)
            ? { ...it, ...updatedItem }
            : it
        );
        const activeItems = updatedItems.filter((i) => i.status !== "EXCLUDED");
        const revCount = activeItems.filter((i) => i.status === "APPROVED" || (i.is_reviewed && i.status !== "REJECTED")).length;
        const faultyCount = activeItems.filter((i) => i.status === "REJECTED").length;
        const exclCount = updatedItems.filter((i) => i.status === "EXCLUDED").length;
        return {
          ...prev,
          items: updatedItems,
          reviewed_documents: revCount,
          faulty_documents: faultyCount,
          excluded_documents: exclCount,
          is_all_reviewed: activeItems.length > 0 && revCount === activeItems.length && faultyCount === 0,
        };
      });

      if (selectedDoc?.document_name === item.document_name) {
        setSelectedDoc(updatedItem);
      }

      onDocumentsUpdated?.();
      window.dispatchEvent(new CustomEvent("order-documents-changed", { detail: { orderNumber } }));

      if (targetStatus === "EXCLUDED") {
        toast.info(`'${item.document_name}' marked as Old Version (Not to be reviewed).`, {
          description: "Removed from active review scope and logged in Order Chat.",
        });
      } else {
        toast.success(`'${item.document_name}' restored to Active Review scope.`);
      }
    } catch (err: any) {
      console.error("Error toggling exclude:", err);
      toast.error(err.message || "Failed to update review scope");
      fetchChecklist(true);
    } finally {
      setExcludingDoc(null);
    }
  };

  const handleDeleteDoc = async (item: PreSignatureChecklistItem) => {
    if (!orderNumber || deletingDocName) return;
    if (!window.confirm(`Are you sure you want to delete '${item.document_name}'? This will remove the file from the order and update the review checklist.`)) {
      return;
    }

    setDeletingDocName(item.document_name);
    try {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/clients/orders/${encodeURIComponent(orderNumber)}/pre-signature-checklist/documents`
      );
      url.searchParams.set("document_name", item.document_name);
      if (item.document_id) {
        url.searchParams.set("document_id", String(item.document_id));
      }

      const res = await fetch(url.toString(), {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        let msg = "Failed to delete document.";
        try {
          const err = await res.json();
          msg = err.detail || err.message || msg;
        } catch { }
        throw new Error(msg);
      }

      const updatedChecklist: PreSignatureChecklistResponse = await res.json();
      setData(updatedChecklist);

      if (selectedDoc?.document_name === item.document_name) {
        handleClosePreview();
      }

      onDocumentsUpdated?.();
      window.dispatchEvent(new CustomEvent("order-documents-changed", { detail: { orderNumber } }));

      toast.success(`'${item.document_name}' removed successfully.`, {
        description: "Checklist updated and removal logged in Order Chat.",
      });
    } catch (err: any) {
      console.error("Error deleting checklist document:", err);
      toast.error(err.message || "Failed to delete document");
    } finally {
      setDeletingDocName(null);
    }
  };

  useEffect(() => {
    if (!open || !orderNumber) {
      handleClosePreview();
      setData(null);
      return;
    }

    // Initial load
    fetchChecklist(false);

    // Auto-poll every 4 seconds to instantly detect newly added/modified documents in the order folder
    const intervalId = setInterval(() => {
      fetchChecklist(true);
    }, 4000);

    // Auto-refresh when user focuses back on the tab/window
    const handleFocus = () => {
      fetchChecklist(true);
    };
    window.addEventListener("focus", handleFocus);

    // Auto-refresh on order document change events
    const handleDocsChanged = (e: any) => {
      if (!e.detail?.orderNumber || e.detail.orderNumber.toUpperCase() === orderNumber.toUpperCase()) {
        fetchChecklist(true);
      }
    };
    window.addEventListener("order-documents-changed", handleDocsChanged);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("order-documents-changed", handleDocsChanged);
    };
  }, [open, orderNumber, fetchChecklist, handleClosePreview]);

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
    const isCurrentlyApproved = item.status === "APPROVED" || (item.is_reviewed && item.status !== "REJECTED");
    const targetStatus = isCurrentlyApproved ? "PENDING" : "APPROVED";
    const newReviewedState = targetStatus === "APPROVED";
    setTogglingDoc(item.document_name);

    // Optimistic UI update in checklist
    setData((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((it) =>
        it.document_name === item.document_name
          ? {
            ...it,
            status: targetStatus,
            is_reviewed: newReviewedState,
            notes: newReviewedState ? null : it.notes,
            reviewed_by_name: newReviewedState ? "You (Saving...)" : null,
            reviewed_at: newReviewedState ? new Date().toISOString() : null,
          }
          : it
      );
      const activeItems = updatedItems.filter((i) => i.status !== "EXCLUDED");
      const revCount = activeItems.filter((i) => i.status === "APPROVED" || (i.is_reviewed && i.status !== "REJECTED")).length;
      const faultyCount = activeItems.filter((i) => i.status === "REJECTED").length;
      const exclCount = updatedItems.filter((i) => i.status === "EXCLUDED").length;
      return {
        ...prev,
        items: updatedItems,
        reviewed_documents: revCount,
        faulty_documents: faultyCount,
        excluded_documents: exclCount,
        is_all_reviewed: activeItems.length > 0 && revCount === activeItems.length && faultyCount === 0,
      };
    });

    // Also update selected doc if it's the one being previewed
    if (selectedDoc?.document_name === item.document_name) {
      setSelectedDoc((prev) =>
        prev
          ? {
            ...prev,
            status: targetStatus,
            is_reviewed: newReviewedState,
            notes: newReviewedState ? null : prev.notes,
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
            status: targetStatus,
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
          it.document_name === item.document_name && (item.document_id ? it.document_id === item.document_id : true) ? updatedItem : it
        );
        const activeItems = updatedItems.filter((i) => i.status !== "EXCLUDED");
        const revCount = activeItems.filter((i) => i.status === "APPROVED" || (i.is_reviewed && i.status !== "REJECTED")).length;
        const faultyCount = activeItems.filter((i) => i.status === "REJECTED").length;
        const exclCount = updatedItems.filter((i) => i.status === "EXCLUDED").length;
        return {
          ...prev,
          items: updatedItems,
          reviewed_documents: revCount,
          faulty_documents: faultyCount,
          excluded_documents: exclCount,
          is_all_reviewed: activeItems.length > 0 && revCount === activeItems.length && faultyCount === 0,
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

  const handleOpenFaultDialog = (item: PreSignatureChecklistItem) => {
    setFaultDialogDoc(item);
    setFaultComment(item.status === "REJECTED" ? (item.notes || "") : "");
  };

  const handleSubmitFault = async (clearOnly: boolean = false) => {
    if (!faultDialogDoc || submittingFault) return;

    if (!clearOnly && !faultComment.trim()) {
      toast.error("Please specify what is missing or incorrect in the comment.");
      return;
    }

    setSubmittingFault(true);
    const targetStatus = clearOnly ? "PENDING" : "REJECTED";
    const commentToSend = clearOnly ? null : faultComment.trim();

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/clients/orders/${encodeURIComponent(orderNumber)}/pre-signature-checklist/toggle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            document_name: faultDialogDoc.document_name,
            is_reviewed: false,
            status: targetStatus,
            notes: commentToSend,
            document_id: faultDialogDoc.document_id,
            document_path: faultDialogDoc.document_path,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update document status.");
      }

      const updatedItem: PreSignatureChecklistItem = await res.json();

      setData((prev) => {
        if (!prev) return prev;
        const updatedItems = prev.items.map((it) =>
          it.document_name === faultDialogDoc.document_name && (faultDialogDoc.document_id ? it.document_id === faultDialogDoc.document_id : true) ? updatedItem : it
        );
        const activeItems = updatedItems.filter((i) => i.status !== "EXCLUDED");
        const revCount = activeItems.filter((i) => i.status === "APPROVED" || (i.is_reviewed && i.status !== "REJECTED")).length;
        const faultyCount = activeItems.filter((i) => i.status === "REJECTED").length;
        const exclCount = updatedItems.filter((i) => i.status === "EXCLUDED").length;
        return {
          ...prev,
          items: updatedItems,
          reviewed_documents: revCount,
          faulty_documents: faultyCount,
          excluded_documents: exclCount,
          is_all_reviewed: activeItems.length > 0 && revCount === activeItems.length && faultyCount === 0,
        };
      });

      if (selectedDoc?.document_name === faultDialogDoc.document_name) {
        setSelectedDoc(updatedItem);
      }

      if (clearOnly) {
        toast.info(`Cleared faulty status for '${faultDialogDoc.document_name}'.`);
      } else {
        toast.error(`❌ Flagged '${faultDialogDoc.document_name}' as faulty / unacceptable.`, {
          description: "Notification with reason and reviewer name posted to Order Chat.",
        });
      }

      setFaultDialogDoc(null);
      setFaultComment("");
    } catch (err: any) {
      console.error("Error submitting document fault:", err);
      toast.error(err.message || "Failed to mark document as faulty");
    } finally {
      setSubmittingFault(false);
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
    setDocxError(null);
    setDocxLoading(false);

    // Revoke previous blob
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }

    try {
      const effectiveCompId = data?.company_id || companyId;

      const createSafeBlobUrl = async (blob: Blob, docName: string) => {
        const isPdfOrDoc = Boolean(
          blob.type.includes("pdf") || docName.match(/\.(pdf|doc)$/i)
        );
        if (isPdfOrDoc) {
          const headerSlice = blob.slice(0, 5);
          const headerBuffer = await headerSlice.arrayBuffer();
          const headerText = new TextDecoder().decode(headerBuffer);
          if (!headerText.startsWith("%PDF")) {
            if (docName.match(/\.doc$/i)) {
              throw new Error("This Word document (.doc) could not be converted to a PDF preview on the server. Please download the file to view.");
            }
          }
          const pdfBlob = new Blob([blob], { type: "application/pdf" });
          return URL.createObjectURL(pdfBlob);
        }
        return URL.createObjectURL(blob);
      };

      // 1. Primary: Direct order pre-signature stream endpoint
      const params = new URLSearchParams({ document_name: item.document_name });
      if (item.document_id) params.set("document_id", String(item.document_id));
      if (item.document_path) params.set("document_path", item.document_path);

      const streamEndpoint = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/clients/orders/${encodeURIComponent(
        orderNumber
      )}/pre-signature-checklist/stream-preview?${params.toString()}`;

      const res = await fetch(streamEndpoint, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        const objUrl = await createSafeBlobUrl(blob, item.document_name);
        setPreviewBlobUrl(objUrl);
        return;
      }

      // 2. Secondary fallback: Company document preview endpoint
      if (item.document_id && effectiveCompId) {
        const compEndpoint = `/api-proxy/api/clients/companies/${effectiveCompId}/documents/${item.document_id}/preview`;
        const compRes = await fetch(compEndpoint, { credentials: "include" });
        if (compRes.ok) {
          const blob = await compRes.blob();
          const objUrl = await createSafeBlobUrl(blob, item.document_name);
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
            const objUrl = await createSafeBlobUrl(blob, item.document_name);
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
      const params = new URLSearchParams({
        document_name: item.document_name,
        download: "true",
      });
      if (item.document_id) params.set("document_id", String(item.document_id));
      if (item.document_path) params.set("document_path", item.document_path);

      const streamEndpoint = `${process.env.NEXT_PUBLIC_API_URL || ""}/api/clients/orders/${encodeURIComponent(
        orderNumber
      )}/pre-signature-checklist/stream-preview?${params.toString()}`;

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
    if (["JPG", "JPEG", "PNG", "WEBP", "GIF", "SVG"].includes(ext))
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    if (["XLS", "XLSX", "CSV"].includes(ext)) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (["TXT", "JSON"].includes(ext)) return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
  };

  const total = data?.total_documents ?? (data?.items?.length || 0);
  const excludedItems = data?.items?.filter((i) => i.status === "EXCLUDED") || [];
  const excluded = data?.excluded_documents ?? excludedItems.length;
  const activeItems = data?.items?.filter((i) => i.status !== "EXCLUDED") || [];
  const activeTotal = activeItems.length;

  const reviewed = data?.reviewed_documents ?? activeItems.filter((i) => i.status === "APPROVED" || (i.is_reviewed && i.status !== "REJECTED")).length;
  const faulty = data?.faulty_documents ?? activeItems.filter((i) => i.status === "REJECTED").length;
  const progressPercent = activeTotal > 0 ? Math.round((reviewed / activeTotal) * 100) : 0;
  const isAllReviewed = activeTotal > 0 && reviewed === activeTotal && faulty === 0;
  const statusToDisplay = data?.lifecycle_status || currentLifecycleStatus || "REVIEW_DOCS";

  const displayedItems = (data?.items || []).filter((item) => {
    if (filterScope === "ACTIVE") return item.status !== "EXCLUDED";
    if (filterScope === "EXCLUDED") return item.status === "EXCLUDED";
    return true;
  });

  const isDocPdf = (name?: string) => Boolean(name && /\.pdf$/i.test(name));
  const isDocImage = (name?: string) => Boolean(name && /\.(jpe?g|png|webp|svg)$/i.test(name));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={`p-0 !gap-0 bg-background border border-border text-foreground rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${selectedDoc
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
                    className="h-8.5 px-2.5 text-xs gap-1.5 border-teal-500/30 hover:border-teal-500/50 text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 font-medium cursor-pointer"
                    title="Close document viewer to return to compact list view"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Close Viewer</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchChecklist(false)}
                  disabled={loading}
                  className="h-8.5 px-3 text-xs gap-1.5 border-border/80 hover:bg-muted font-medium cursor-pointer"
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-foreground font-semibold">
                      <CheckCircle2 className={`h-4 w-4 ${isAllReviewed ? "text-emerald-500" : "text-teal-500"}`} />
                      Review Progress: {reviewed} of {activeTotal} Active Documents Checked
                    </span>
                    {excluded > 0 && (
                      <Badge variant="outline" className="text-[10px] font-semibold border-zinc-400/40 text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 gap-1 py-0">
                        <Ban className="h-3 w-3" />
                        {excluded} Old {excluded === 1 ? "Version" : "Versions"} (Out of Review Scope)
                      </Badge>
                    )}
                    {faulty > 0 && (
                      <Badge variant="outline" className="text-[10px] font-semibold border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10 gap-1 py-0">
                        <XCircle className="h-3 w-3" />
                        {faulty} Faulty / Rejected
                      </Badge>
                    )}
                  </div>
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
                    className={`h-full transition-all duration-300 rounded-full ${isAllReviewed ? "bg-emerald-500" : "bg-teal-500"
                      }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground flex-wrap gap-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-teal-500 shrink-0" />
                    Checks, rejections &amp; out-of-scope notes automatically post to internal Order Chat.
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
                className={`flex flex-col min-h-0 bg-muted/20 shrink-0 ${isFullscreenPreview ? "hidden" : "w-full md:w-[320px] lg:w-[340px] xl:w-[360px]"
                  }`}
              >
                {/* Compact Progress Header in Left Panel */}
                <div className="p-3.5 border-b border-border/70 bg-card/60">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1 text-foreground">
                      <CheckCircle2 className={`h-3.5 w-3.5 ${isAllReviewed ? "text-emerald-500" : "text-teal-500"}`} />
                      Progress: {reviewed}/{activeTotal}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {excluded > 0 && (
                        <Badge variant="outline" className="text-[9px] font-semibold py-0 px-1 border-zinc-400/40 text-zinc-600 dark:text-zinc-400 bg-zinc-500/10">
                          {excluded} Old
                        </Badge>
                      )}
                      {faulty > 0 && (
                        <Badge variant="outline" className="text-[9px] font-semibold py-0 px-1 border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10">
                          {faulty} Faulty
                        </Badge>
                      )}
                      <span className="text-teal-600 dark:text-teal-400 font-bold text-xs">{progressPercent}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${isAllReviewed ? "bg-emerald-500" : "bg-teal-500"
                        }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Filter scope buttons in left panel */}
                  <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setFilterScope("ALL")}
                      className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-all cursor-pointer ${filterScope === "ALL"
                          ? "bg-teal-600 text-white"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                    >
                      All ({total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterScope("ACTIVE")}
                      className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-all cursor-pointer ${filterScope === "ACTIVE"
                          ? "bg-teal-600 text-white"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                    >
                      Active ({activeTotal})
                    </button>
                    {excluded > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterScope("EXCLUDED")}
                        className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-all cursor-pointer ${filterScope === "EXCLUDED"
                            ? "bg-zinc-700 text-white"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          }`}
                      >
                        Old ({excluded})
                      </button>
                    )}
                  </div>
                </div>

                {/* Checklist Items Scrollable List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {displayedItems.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-xl my-2">
                      No {filterScope === "ACTIVE" ? "active" : "old / excluded"} documents found.
                    </div>
                  ) : (
                    displayedItems.map((item, idx) => {
                      const isTogglingThis = togglingDoc === item.document_name;
                      const isCurrentActive = selectedDoc.document_name === item.document_name;
                      const isExcluded = item.status === "EXCLUDED";
                      const isFaulty = item.status === "REJECTED";
                      const isApproved = item.status === "APPROVED" || (item.is_reviewed && !isFaulty && !isExcluded);

                      return (
                      <div
                        key={`split-${item.document_name}-${idx}`}
                        onClick={() => {
                          if (!isCurrentActive) handleSelectDocForPreview(item);
                        }}
                        className={`group rounded-xl border p-2.5 transition-all duration-150 flex flex-col gap-1.5 cursor-pointer ${isCurrentActive
                            ? "bg-teal-500/10 dark:bg-teal-950/40 border-teal-500 shadow-sm ring-1 ring-teal-500/30"
                            : isExcluded
                              ? "bg-zinc-100/60 dark:bg-zinc-900/20 border-dashed border-zinc-300 dark:border-zinc-700/70 opacity-70 hover:opacity-90 hover:border-zinc-400"
                              : isFaulty
                                ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60"
                                : isApproved
                                  ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 hover:border-teal-500/40"
                                  : "bg-card dark:bg-zinc-900/40 border-border/80 hover:border-teal-500/40 hover:bg-muted/40"
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          {/* Checkbox button */}
                          {isExcluded ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info(`'${item.document_name}' is marked as an Old Version (Not to be reviewed). Click Restore to include it.`);
                              }}
                              className="mt-0.5 h-5 w-5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 cursor-not-allowed opacity-80 shadow-xs"
                              title="Old Version - Out of review scope"
                            >
                              <Ban className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleReview(item);
                              }}
                              disabled={isTogglingThis}
                              className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs ${isFaulty
                                  ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-emerald-500/20 hover:border-emerald-500"
                                  : isApproved
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "bg-background border-zinc-300 dark:border-zinc-700 hover:border-teal-500"
                                } ${isTogglingThis ? "opacity-60 cursor-wait" : ""}`}
                              title={
                                isFaulty
                                  ? "Click to clear fault and approve document"
                                  : isApproved
                                    ? "Click to uncheck review"
                                    : "Click to check & verify document"
                              }
                            >
                              {isTogglingThis ? (
                                <Loader2 className="h-3 w-3 animate-spin text-current" />
                              ) : isFaulty ? (
                                <X className="h-3.5 w-3.5 stroke-[2.5] text-rose-600 dark:text-rose-400" />
                              ) : isApproved ? (
                                <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                              ) : (
                                <Square className="h-3 w-3 text-muted-foreground/60" />
                              )}
                            </button>
                          )}

                          {/* Doc Details */}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-xs font-semibold truncate ${isCurrentActive
                                    ? "text-teal-700 dark:text-teal-300 font-bold"
                                    : isExcluded
                                      ? "text-muted-foreground line-through decoration-zinc-400 font-normal"
                                      : isFaulty
                                        ? "text-rose-700 dark:text-rose-400 font-semibold"
                                        : isApproved
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
                              {isExcluded && (
                                <Badge
                                  variant="outline"
                                  className="text-[8px] font-semibold border-zinc-400/60 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 py-0 px-1"
                                >
                                  OLD VERSION
                                </Badge>
                              )}
                            </div>

                            {/* Reviewer / Status Meta */}
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap">
                              {isExcluded ? (
                                <span className="inline-flex items-center gap-0.5 font-medium text-zinc-500 dark:text-zinc-400">
                                  <Ban className="h-2.5 w-2.5" />
                                  Not to be reviewed
                                </span>
                              ) : isFaulty ? (
                                <span className="inline-flex items-center gap-0.5 font-medium text-rose-600 dark:text-rose-400">
                                  <XCircle className="h-2.5 w-2.5" />
                                  Faulty ({item.reviewed_by_name?.split(" ")[0] || "Reviewer"})
                                </span>
                              ) : isApproved ? (
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

                          {/* Actions inside split item card */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isCurrentActive && (
                              <Badge className="bg-teal-600 text-white text-[9px] font-medium py-0 px-1 shadow-xs">
                                Viewing
                              </Badge>
                            )}
                            {!isExcluded && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenFaultDialog(item);
                                }}
                                className={`h-6 w-6 rounded-md border flex items-center justify-center transition-all cursor-pointer ${isFaulty
                                    ? "border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/30"
                                    : "border-border/80 hover:border-rose-500/40 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600"
                                  }`}
                                title={isFaulty ? "Edit fault comment" : "Cross file / mark as faulty"}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {/* Toggle Excluded / Old Version button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExclude(item);
                              }}
                              disabled={excludingDoc === item.document_name}
                              className={`h-6 rounded-md border flex items-center justify-center transition-all cursor-pointer ${isExcluded
                                  ? "px-1.5 border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-[10px] font-medium gap-0.5"
                                  : "w-6 border-border/80 hover:border-zinc-500/50 hover:bg-zinc-500/10 text-muted-foreground hover:text-zinc-700 dark:hover:text-zinc-300"
                                }`}
                              title={isExcluded ? "Restore to active review scope" : "Mark as Old Version (Not to be reviewed)"}
                            >
                              {excludingDoc === item.document_name ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : isExcluded ? (
                                <>
                                  <Undo2 className="h-2.5 w-2.5" />
                                  <span>Restore</span>
                                </>
                              ) : (
                                <Ban className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDoc(item);
                              }}
                              disabled={deletingDocName === item.document_name}
                              className="h-6 w-6 rounded-md border border-border/80 hover:border-rose-500/40 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer"
                              title="Delete file from checklist"
                            >
                              {deletingDocName === item.document_name ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Fault note in split view card */}
                        {isFaulty && item.notes ? (
                          <div className="text-[10px] bg-rose-500/10 border border-rose-500/20 rounded-md p-1.5 text-rose-700 dark:text-rose-300">
                            <span className="font-semibold text-rose-600 dark:text-rose-400">Issue: </span>
                            <span className="line-clamp-2">{item.notes}</span>
                          </div>
                        ) : isExcluded && item.notes && item.notes !== "Old Version - Not for Review" ? (
                          <div className="text-[10px] bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 rounded-md p-1.5 text-amber-800 dark:text-amber-300">
                            <span className="font-semibold text-amber-700 dark:text-amber-400">Previous Cross Issue: </span>
                            <span className="line-clamp-2">{item.notes}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

                {/* Left Panel Footer Actions */}
                <div className="p-3 border-t border-border/70 bg-card/60 flex flex-col gap-2">
                  {faulty > 0 && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md p-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{faulty} faulty file(s) must be cleared to advance.</span>
                    </div>
                  )}

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
                      className={`h-8 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs ${selectedDoc.is_reviewed && selectedDoc.status !== "REJECTED"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                    >
                      {togglingDoc === selectedDoc.document_name ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : selectedDoc.is_reviewed && selectedDoc.status !== "REJECTED" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <CheckSquare className="h-3.5 w-3.5" />
                      )}
                      <span>{selectedDoc.is_reviewed && selectedDoc.status !== "REJECTED" ? "Reviewed" : "Mark Reviewed"}</span>
                    </Button>

                    {/* Mark Faulty / Cross File button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenFaultDialog(selectedDoc)}
                      className={`h-8 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs ${selectedDoc.status === "REJECTED"
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40 hover:bg-rose-500/25"
                          : "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/15"
                        }`}
                      title="Flag document as faulty / specify missing info"
                    >
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      <span>{selectedDoc.status === "REJECTED" ? "Faulty (Edit Note)" : "Cross File"}</span>
                    </Button>

                    {/* Exclude / Include in Review Scope button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleExclude(selectedDoc)}
                      disabled={excludingDoc === selectedDoc.document_name}
                      className={`h-8 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs ${selectedDoc.status === "EXCLUDED"
                          ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/40 hover:bg-teal-500/20"
                          : "border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      title={
                        selectedDoc.status === "EXCLUDED"
                          ? "Restore this document to the active review scope"
                          : "Mark this document as an older version (not to be reviewed)"
                      }
                    >
                      {excludingDoc === selectedDoc.document_name ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : selectedDoc.status === "EXCLUDED" ? (
                        <Undo2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      ) : (
                        <Ban className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span>{selectedDoc.status === "EXCLUDED" ? "Include in Review" : "Not for Review"}</span>
                    </Button>

                    {/* Open Document in New Tab */}
                    {previewBlobUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(previewBlobUrl, "_blank")}
                        className="h-8 px-2 text-xs gap-1 border-border/80 hover:bg-muted"
                        title="Open Document in New Tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">New Tab</span>
                      </Button>
                    )}

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

                {/* Banner if selected document is marked as an older version */}
                {selectedDoc.status === "EXCLUDED" && (
                  <div className="px-4 py-2 bg-zinc-500/10 border-b border-zinc-500/25 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Ban className="h-4 w-4 text-zinc-500 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          Old Version • Excluded from Review Scope:
                        </span>{" "}
                        {selectedDoc.notes && selectedDoc.notes !== "Old Version - Not for Review" ? (
                          <span>
                            <span className="font-semibold text-amber-700 dark:text-amber-400">Previous Cross Issue:</span>{" "}
                            &ldquo;{selectedDoc.notes}&rdquo;
                          </span>
                        ) : (
                          <span>This document is marked as not to be reviewed and will not block checklist approval.</span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleExclude(selectedDoc)}
                      className="h-6 px-2 text-[10px] shrink-0 border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 ml-2"
                    >
                      Include in Review
                    </Button>
                  </div>
                )}

                {/* Banner if selected document is marked faulty */}
                {selectedDoc.status === "REJECTED" && (
                  <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/25 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200 shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-rose-700 dark:text-rose-300">
                          Flagged Faulty {selectedDoc.reviewed_by_name ? `by ${selectedDoc.reviewed_by_name}` : ""}:
                        </span>{" "}
                        <span>{selectedDoc.notes || "Marked as unacceptable / needs revision."}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenFaultDialog(selectedDoc)}
                      className="h-6 px-2 text-[10px] shrink-0 border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 ml-2"
                    >
                      Edit Reason
                    </Button>
                  </div>
                )}

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
                    selectedDoc.document_name?.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) ? (
                      <div className="w-full h-full flex items-center justify-center overflow-auto rounded-xl bg-zinc-950/20 dark:bg-zinc-950/70 border border-border/60 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewBlobUrl}
                          alt={selectedDoc.document_name}
                          className="max-h-full max-w-full object-contain rounded-lg shadow-lg border border-border/40"
                        />
                      </div>
                    ) : selectedDoc.document_name?.match(/\.docx$/i) ? (
                      <div className="w-full h-full overflow-y-auto bg-slate-200/70 dark:bg-slate-900/90 rounded-xl p-2 sm:p-6 flex flex-col items-center border border-border/60">
                        {docxLoading && (
                          <div className="flex flex-col items-center justify-center p-12 space-y-3 m-auto">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                            <p className="text-xs font-semibold text-muted-foreground">Rendering Word Document (.docx)...</p>
                          </div>
                        )}
                        {docxError && (
                          <div className="text-center p-8 bg-card rounded-2xl border border-border space-y-3 max-w-md m-auto shadow-sm">
                            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                            <p className="text-sm font-bold text-foreground">Could not preview Word document</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{docxError}</p>
                            <Button
                              size="sm"
                              onClick={() => handleDownloadDoc(selectedDoc)}
                              className="font-bold gap-2 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                            >
                              <Download className="h-4 w-4" /> Download Word File (.docx)
                            </Button>
                          </div>
                        )}
                        <div
                          ref={docxContainerRef}
                          className={`w-full max-w-4xl bg-white text-black dark:bg-slate-100 rounded-lg shadow-md p-4 sm:p-8 font-sans ${
                            docxLoading || docxError ? "hidden" : "block"
                          }`}
                        />
                      </div>
                    ) : selectedDoc.document_name?.match(/\.(xlsx|xls|csv)$/i) ? (
                      <ExcelPreview
                        fileUrl={previewBlobUrl}
                        fileName={selectedDoc.document_name}
                        onDownload={() => handleDownloadDoc(selectedDoc)}
                        className="h-full w-full flex-1 min-h-0 border border-border/60 shadow-none rounded-xl"
                      />
                    ) : selectedDoc.document_name?.match(/\.(pdf|doc)$/i) ? (
                      <object
                        data={`${previewBlobUrl}#toolbar=1&navpanes=0`}
                        type="application/pdf"
                        className="w-full h-full rounded-xl border border-border/70 shadow-xs bg-white"
                      >
                        <iframe
                          src={`${previewBlobUrl}#toolbar=1&navpanes=0`}
                          className="w-full h-full rounded-xl border-0 shadow-xs bg-white"
                          title={selectedDoc.document_name}
                        />
                      </object>
                    ) : selectedDoc.document_name?.match(/\.(txt|json)$/i) ? (
                      <iframe
                        src={previewBlobUrl}
                        className="w-full h-full rounded-xl border border-border/70 shadow-xs bg-white p-4 font-mono text-xs"
                        title={selectedDoc.document_name}
                      />
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
                {/* Filter Scope Pills in Wide View */}
                {data && data.items.length > 0 && (
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
                    <span className="text-xs font-semibold text-muted-foreground">Filter Documents:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFilterScope("ALL")}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                          filterScope === "ALL"
                            ? "bg-teal-600 text-white shadow-xs"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                      >
                        All Documents ({total})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterScope("ACTIVE")}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                          filterScope === "ACTIVE"
                            ? "bg-teal-600 text-white shadow-xs"
                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                        }`}
                      >
                        Active for Review ({activeTotal})
                      </button>
                      {excluded > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterScope("EXCLUDED")}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                            filterScope === "EXCLUDED"
                              ? "bg-zinc-700 text-white shadow-xs"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground"
                          }`}
                        >
                          Old Versions / Out of Scope ({excluded})
                        </button>
                      )}
                    </div>
                  </div>
                )}

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
                      #{orderNumber}.
                    </p>
                  </div>
                ) : displayedItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/90 p-8 text-center flex flex-col items-center justify-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      No documents match the &apos;{filterScope === "ACTIVE" ? "Active for Review" : "Old Versions / Out of Scope"}&apos; filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFilterScope("ALL")}
                      className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline cursor-pointer"
                    >
                      Show all documents
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {displayedItems.map((item, idx) => {
                      const isTogglingThis = togglingDoc === item.document_name;
                      const isExcluded = item.status === "EXCLUDED";
                      const isFaulty = item.status === "REJECTED";
                      const isApproved = item.status === "APPROVED" || (item.is_reviewed && !isFaulty && !isExcluded);

                      return (
                        <div
                          key={`${item.document_name}-${idx}`}
                          className={`group rounded-xl border p-3 sm:p-3.5 transition-all duration-150 flex flex-col gap-2.5 ${
                            isExcluded
                              ? "bg-zinc-100/60 dark:bg-zinc-900/20 border-dashed border-zinc-300 dark:border-zinc-700/70 opacity-70 hover:opacity-90 hover:border-zinc-400"
                              : isFaulty
                              ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/35 hover:border-rose-500/50"
                              : isApproved
                              ? "bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30"
                              : "bg-card dark:bg-zinc-900/40 border-border/80 hover:border-teal-500/40 hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start sm:items-center justify-between gap-3">
                            {/* Left: Checkbox & Doc Info */}
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              {isExcluded ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.info(`'${item.document_name}' is marked as an Old Version (Not to be reviewed). Click 'Include in Review' to restore it.`);
                                  }}
                                  className="mt-0.5 sm:mt-0 h-6 w-6 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 cursor-not-allowed opacity-80 shadow-xs"
                                  title="Old Version - Out of review scope"
                                >
                                  <Ban className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleReview(item)}
                                  disabled={isTogglingThis}
                                  className={`mt-0.5 sm:mt-0 h-6 w-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs ${
                                    isFaulty
                                      ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-emerald-500/20 hover:border-emerald-500"
                                      : isApproved
                                      ? "bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/20"
                                      : "bg-background border-zinc-300 dark:border-zinc-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                                  } ${isTogglingThis ? "opacity-60 cursor-wait" : ""}`}
                                  title={
                                    isFaulty
                                      ? "Click to clear fault and approve document"
                                      : isApproved
                                      ? "Click to uncheck review"
                                      : "Click to check & verify document"
                                  }
                                >
                                  {isTogglingThis ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
                                  ) : isFaulty ? (
                                    <X className="h-4 w-4 stroke-[2.5] text-rose-600 dark:text-rose-400" />
                                  ) : isApproved ? (
                                    <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                                  ) : (
                                    <Square className="h-3.5 w-3.5 text-muted-foreground/60" />
                                  )}
                                </button>
                              )}

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    onClick={() => handleSelectDocForPreview(item)}
                                    className={`text-xs sm:text-sm font-semibold truncate cursor-pointer transition-colors ${
                                      isExcluded
                                        ? "text-muted-foreground line-through decoration-zinc-400 font-normal hover:underline"
                                        : isFaulty
                                        ? "text-rose-700 dark:text-rose-400 font-semibold hover:underline"
                                        : isApproved
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
                                  {isExcluded && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-semibold border-zinc-400/60 text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 gap-1"
                                    >
                                      <Ban className="h-3 w-3" />
                                      Old Version • Out of Review
                                    </Badge>
                                  )}
                                  {isFaulty && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-semibold border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10 gap-1"
                                    >
                                      <XCircle className="h-3 w-3" />
                                      Faulty / Rejected
                                    </Badge>
                                  )}
                                  {formatFileSize(item.size) && (
                                    <span className="text-[10px] text-muted-foreground">{formatFileSize(item.size)}</span>
                                  )}
                                </div>

                                {/* Reviewer / Meta info */}
                                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                  {isExcluded ? (
                                    <span className="inline-flex items-center gap-1 font-medium text-zinc-500 dark:text-zinc-400">
                                      <Ban className="h-3 w-3" />
                                      Not to be reviewed (Older Version)
                                    </span>
                                  ) : isFaulty ? (
                                    <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                                      <AlertTriangle className="h-3 w-3" />
                                      Flagged by {item.reviewed_by_name || "Reviewer"}
                                      {item.reviewed_at && (
                                        <span className="text-muted-foreground text-[10px]">
                                          • {formatDateTime(item.reviewed_at)}
                                        </span>
                                      )}
                                    </span>
                                  ) : isApproved ? (
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

                                  {item.description && !item.notes && (
                                    <span className="text-muted-foreground truncate max-w-xs" title={item.description}>
                                      • {item.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Cross / Flag Faulty button */}
                              {!isExcluded && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenFaultDialog(item)}
                                  className={`h-8 px-2.5 text-xs gap-1 cursor-pointer ${
                                    isFaulty
                                      ? "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20"
                                      : "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/15"
                                  }`}
                                  title={isFaulty ? "Edit fault comment" : "Cross file & specify missing details"}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>{isFaulty ? "Edit Issue" : "Cross File"}</span>
                                </Button>
                              )}

                              {/* Exclude / Include in review scope */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleExclude(item)}
                                disabled={excludingDoc === item.document_name}
                                className={`h-8 px-2.5 text-xs gap-1 cursor-pointer ${
                                  isExcluded
                                    ? "border-teal-500/40 text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 font-medium"
                                    : "border-border/80 text-muted-foreground hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-500/10"
                                }`}
                                title={
                                  isExcluded
                                    ? "Restore this document to the active review scope"
                                    : "Mark as older version / not to be reviewed"
                                }
                              >
                                {excludingDoc === item.document_name ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : isExcluded ? (
                                  <Undo2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                                ) : (
                                  <Ban className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span>{isExcluded ? "Include in Review" : "Not for Review"}</span>
                              </Button>

                              {/* Preview button */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectDocForPreview(item)}
                                className="h-8 px-2.5 text-xs gap-1 border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 cursor-pointer"
                                title="Open In-System Preview (Same Screen)"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Preview</span>
                              </Button>

                              {/* Delete button */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteDoc(item)}
                                disabled={deletingDocName === item.document_name}
                                className="h-8 px-2 text-xs gap-1 border-border/80 hover:border-destructive/40 hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                                title="Delete document from checklist"
                              >
                                {deletingDocName === item.document_name ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Rejection / Cross comment banner */}
                          {isFaulty && item.notes ? (
                            <div className="p-2 sm:p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-600 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-rose-800 dark:text-rose-200">Issue / Missing: </span>
                                <span className="whitespace-pre-wrap">{item.notes}</span>
                              </div>
                            </div>
                          ) : isExcluded && item.notes && item.notes !== "Old Version - Not for Review" ? (
                            <div className="p-2 sm:p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-amber-800 dark:text-amber-200">Previous Cross Issue: </span>
                                <span className="whitespace-pre-wrap">{item.notes}</span>
                              </div>
                            </div>
                          ) : null}
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
                  {faulty > 0 && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {faulty} faulty file(s) must be cleared to advance.
                    </span>
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

      {/* Faulty Document Rejection Modal */}
      <Dialog
        open={!!faultDialogDoc}
        onOpenChange={(isOpen) => {
          if (!isOpen && !submittingFault) {
            setFaultDialogDoc(null);
            setFaultComment("");
          }
        }}
      >
        <DialogContent className="max-w-md p-5 bg-background border border-border text-foreground rounded-2xl shadow-2xl z-[99999]">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold text-foreground">
                {faultDialogDoc?.status === "REJECTED" ? "Edit Faulty / Rejection Note" : "Mark Document as Faulty / Missing"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1 truncate" title={faultDialogDoc?.document_name}>
                Document: <span className="font-semibold text-foreground">{faultDialogDoc?.document_name}</span>
              </DialogDescription>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                What is missing or incorrect? <span className="text-rose-500">*</span>
              </label>
              <Textarea
                value={faultComment}
                onChange={(e) => setFaultComment(e.target.value)}
                placeholder="e.g., Missing director signature on page 4, blurry company stamp, certificate expired, or outdated legal entity name..."
                rows={4}
                className="text-xs resize-none bg-muted/40 focus:bg-background border-border/80 focus:border-rose-500 focus:ring-rose-500/20"
                autoFocus
              />
            </div>

            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 flex items-start gap-2 text-[11px] text-rose-700 dark:text-rose-300">
              <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-500" />
              <span>
                This comment, along with the document name and your reviewer name, will be automatically posted to the internal <strong>Order Chat</strong> for audit tracking.
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            {faultDialogDoc?.status === "REJECTED" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSubmitFault(true)}
                disabled={submittingFault}
                className="h-8 text-xs border-zinc-500/30 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear Fault / Reset
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFaultDialogDoc(null);
                  setFaultComment("");
                }}
                disabled={submittingFault}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleSubmitFault(false)}
                disabled={submittingFault || !faultComment.trim()}
                className="h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs cursor-pointer"
              >
                {submittingFault ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                <span>{faultDialogDoc?.status === "REJECTED" ? "Update Note & Chat" : "Cross File & Post to Chat"}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
