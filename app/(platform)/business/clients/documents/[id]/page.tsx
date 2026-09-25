"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  Download,
  FileText,
  Upload,
  PlusCircle,
  Paperclip,
  Trash2,
  Edit,
  Users,
  History,
  Plus,
  Save,
  Eye,
  Search,
  Loader2,
  ExternalLink,
  RefreshCw,
  Filter,
  MessageSquare,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  PauseCircle,
  AlertCircle,
  AlertTriangle,
  Lock,
  FolderKanban,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { PhoneInput, isValidPhoneNumber, isValidEmail } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";
import Link from "next/link";
import { format, isBefore, differenceInDays } from "date-fns";
import { DropboxFileManager } from "@/components/dropbox-file-manager";
import { DualOrderChatDialog } from "@/components/dual-order-chat-dialog";
import { cn } from "@/lib/utils";

export default function CompanyDocumentsManagementPage() {
  const params = useParams();
  const companyId = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams?.get("order") || "";
  const fromSource = searchParams?.get("from") || "";

  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>("Loading...");
  const [companyCode, setCompanyCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState("documents");

  // Active Order Context & Direct Workflow Progression
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [activeOrderItems, setActiveOrderItems] = useState<any[]>([]);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);
  const [isConfirmStatusOpen, setIsConfirmStatusOpen] = useState(false);
  const [pendingConfirmStatus, setPendingConfirmStatus] = useState<string>("");
  const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");
  const [holdChannel, setHoldChannel] = useState<"CLIENT" | "INTERNAL">("CLIENT");
  const [submittingHold, setSubmittingHold] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [filterByActiveOrder, setFilterByActiveOrder] = useState(Boolean(orderNumberParam));

  // Documents
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadRow, setUploadRow] = useState({ file: null as File | null, type: "", description: "", document_path: "", date: "", expiry_date: "" });
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [isClosingPreview, setIsClosingPreview] = useState(false);
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState<string | null>(null);
  const [loadingPreviewLink, setLoadingPreviewLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClosePreview = () => {
    setIsClosingPreview(true);
    setTimeout(() => {
      setPreviewDoc(null);
      setResolvedPreviewUrl(null);
      setIsClosingPreview(false);
    }, 280);
  };

  // Stakeholders (Directors & Shareholders)
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [newStakeholder, setNewStakeholder] = useState({ name: "", role: "Key Contact Person", phone: "", email: "", is_key_contact: false });
  const [addingStakeholder, setAddingStakeholder] = useState(false);
  const [editStakeholder, setEditStakeholder] = useState<any | null>(null);
  const [savingStakeholder, setSavingStakeholder] = useState(false);
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);
  const [selectedOrderNum, setSelectedOrderNum] = useState(orderNumberParam || "");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const [editOrderSearchQuery, setEditOrderSearchQuery] = useState("");
  const [editOrderDropdownOpen, setEditOrderDropdownOpen] = useState(false);

  // Activity Logs
  const [activities, setActivities] = useState<any[]>([]);
  const [activitySearchQuery, setActivitySearchQuery] = useState("");
  const [activityCategoryFilter, setActivityCategoryFilter] = useState("ALL");
  const [refreshingActivities, setRefreshingActivities] = useState(false);

  const fetchActivities = async () => {
    setRefreshingActivities(true);
    try {
      const actRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/activities`, {
        credentials: "include",
      });
      if (actRes.ok) setActivities(await actRes.json());
    } catch (e) {
      console.error("Failed to refresh activities:", e);
    } finally {
      setRefreshingActivities(false);
    }
  };

  const filteredActivities = activities.filter((act: any) => {
    const q = activitySearchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (act.action_type || "").toLowerCase().includes(q) ||
      (act.description || "").toLowerCase().includes(q) ||
      (act.performed_by || "").toLowerCase().includes(q)
    );

    if (!matchesSearch) return false;

    if (activityCategoryFilter === "ALL") return true;
    if (activityCategoryFilter === "UPLOADS") {
      return (act.action_type || "").includes("UPLOAD");
    }
    if (activityCategoryFilter === "DELETIONS") {
      return (act.action_type || "").includes("DELETE");
    }
    if (activityCategoryFilter === "DOWNLOADS") {
      return (act.action_type || "").includes("DOWNLOAD");
    }
    if (activityCategoryFilter === "VIEWS") {
      return (act.action_type || "").includes("VIEW") || (act.action_type || "").includes("PREVIEW");
    }
    if (activityCategoryFilter === "FOLDERS") {
      return (act.action_type || "").includes("FOLDER");
    }
    if (activityCategoryFilter === "ORDERS") {
      return (act.action_type || "").startsWith("ORDER_") || (act.action_type || "").includes("INVOICE");
    }
    if (activityCategoryFilter === "STAKEHOLDERS") {
      return (act.action_type || "").includes("STAKEHOLDER");
    }
    return true;
  });

  const getActivityBadge = (actionType: string) => {
    const act = (actionType || "").toUpperCase();
    if (act.includes("UPLOAD")) {
      return {
        label: act,
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        icon: <Upload className="h-3 w-3 mr-1" />
      };
    }
    if (act.includes("DELETE")) {
      return {
        label: act,
        badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
        icon: <Trash2 className="h-3 w-3 mr-1" />
      };
    }
    if (act.includes("DOWNLOAD")) {
      return {
        label: act,
        badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
        icon: <Download className="h-3 w-3 mr-1" />
      };
    }
    if (act.includes("VIEW") || act.includes("PREVIEW")) {
      return {
        label: act,
        badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        icon: <Eye className="h-3 w-3 mr-1" />
      };
    }
    if (act.includes("FOLDER")) {
      return {
        label: act,
        badgeClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
        icon: <PlusCircle className="h-3 w-3 mr-1" />
      };
    }
    if (act.startsWith("ORDER_") || act.includes("INVOICE")) {
      return {
        label: act,
        badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        icon: <FileText className="h-3 w-3 mr-1" />
      };
    }
    return {
      label: act,
      badgeClass: "bg-primary/10 text-primary border-primary/30",
      icon: <History className="h-3 w-3 mr-1" />
    };
  };

  // Search filter for docs
  const [documentSearchQuery, setDocumentSearchQuery] = useState("");

  const activeOrderDocsCount = documents.filter((doc: any) => 
    activeOrder && doc.order_number && doc.order_number.trim().toUpperCase() === activeOrder.order_number.trim().toUpperCase()
  ).length;

  const filteredDocuments = documents.filter((doc: any) => {
    if (activeOrder && filterByActiveOrder) {
      if (!doc.order_number || doc.order_number.trim().toUpperCase() !== activeOrder.order_number.trim().toUpperCase()) {
        return false;
      }
    }
    const query = documentSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (doc.document_type || "").toLowerCase().includes(query) ||
      (doc.description || "").toLowerCase().includes(query) ||
      (doc.order_number || "").toLowerCase().includes(query) ||
      (doc.file_name || "").toLowerCase().includes(query)
    );
  });

  const CONSULTANT_EDITABLE_STATUSES = [
    "ORDER_ASSIGNED",
    "IN_PROGRESS",
    "REVIEW_DOCS",
    "DOCUMENTS_REVIEWED",
    "PRE_DOC_SENT_FOR_SIGNATURE",
    "FINAL_DOCUMENT_PREPARATION",
    "FINAL_DOC_READY",
    "ON_HOLD"
  ];

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold";
      case "CONFIRMED": return "bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold";
      case "DRAFT": return "bg-zinc-500/10 dark:bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 font-bold";
      case "CANCELLED": return "bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold";
      case "PROFORMA_GENERATED": return "bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 font-bold";
      case "WAITING_ON_CLIENT": return "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold";
      case "ORDER_ASSIGNED": return "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold";
      case "IN_PROGRESS": return "bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20 font-bold";
      case "ON_HOLD": return "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold";
      case "REVIEW_DOCS": return "bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20 font-bold";
      case "DOCUMENTS_REVIEWED": return "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold";
      case "PRE_DOC_SENT_FOR_SIGNATURE": return "bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold";
      case "PRE_DOCS_SENT": return "bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold";
      case "FINAL_DOCUMENT_PREPARATION": return "bg-orange-500/10 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20 font-bold";
      case "FINAL_DOC_READY": return "bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold";
      default: return "bg-primary/10 text-primary border-primary/20 font-bold";
    }
  };

  const handleUpdateActiveOrderStatus = async (newStatus: string) => {
    if (!activeOrder || !activeOrderItems || activeOrderItems.length === 0 || !newStatus || newStatus === activeOrder.status) return;
    if (newStatus === "ON_HOLD") {
      setHoldReason("");
      setHoldChannel("CLIENT");
      setIsHoldDialogOpen(true);
      return;
    }
    setPendingConfirmStatus(newStatus);
    setIsConfirmStatusOpen(true);
  };

  const executeUpdateActiveOrderStatus = async (newStatus: string, holdData?: { reason: string; channel: string }) => {
    if (!activeOrder || !activeOrderItems) return;
    setUpdatingOrderStatus(true);
    try {
      await Promise.all(
        activeOrderItems.map((itemRow: any) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders/${itemRow.id}`, {
            credentials: "include",
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              status: newStatus,
              ...(holdData ? { hold_reason: holdData.reason, hold_channel: holdData.channel } : {})
            })
          })
        )
      );

      if (newStatus === "FINAL_DOC_READY") {
        toast.success(`Order ${activeOrder.order_number} marked as Final Docs Ready and moved to Completed Orders!`);
      } else if (newStatus === "ON_HOLD") {
        toast.success(`Order ${activeOrder.order_number} status updated to ON HOLD`);
      } else {
        toast.success(`Order ${activeOrder.order_number} status updated to ${newStatus.replace(/_/g, " ")}`);
      }

      setActiveOrder((prev: any) => prev ? { ...prev, status: newStatus } : null);
      setActiveOrderItems((prev: any[]) => prev.map(item => ({ ...item, status: newStatus })));
      setIsConfirmStatusOpen(false);
      setPendingConfirmStatus("");
      fetchActivities();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingOrderStatus(false);
      setIsHoldDialogOpen(false);
      setHoldReason("");
    }
  };

  const [fetchingDocs, setFetchingDocs] = useState(false);

  const fetchDocuments = async () => {
    setFetchingDocs(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/documents`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch documents:", e);
    } finally {
      setFetchingDocs(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [compRes, docRes, stkRes, actRes, ordRes] = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/documents`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/stakeholders`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/activities`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, { credentials: "include" })
      ]);

      if (docRes.status === "fulfilled" && docRes.value.ok) {
        const docsData = await docRes.value.json();
        setDocuments(docsData || []);
      }
      if (stkRes.status === "fulfilled" && stkRes.value.ok) {
        setStakeholders(await stkRes.value.json());
      }
      if (actRes.status === "fulfilled" && actRes.value.ok) {
        setActivities(await actRes.value.json());
      }

      if (ordRes.status === "fulfilled" && ordRes.value.ok) {
        const allOrders = await ordRes.value.json();
        const companyOrders = allOrders.filter((o: any) => o.company_id?.toString() === companyId);
        const uniqueOrderNums = Array.from(new Set(companyOrders.map((o: any) => o.order_number))) as string[];
        setOrderNumbers(uniqueOrderNums);

        const targetOrderNum = orderNumberParam || (fromSource === "assigned-orders" && uniqueOrderNums.length > 0 ? uniqueOrderNums[0] : "");
        if (targetOrderNum) {
          const matchingItems = companyOrders.filter((o: any) => o.order_number?.toUpperCase() === targetOrderNum.toUpperCase());
          if (matchingItems.length > 0) {
            const first = matchingItems[0];
            setActiveOrder({
              order_number: targetOrderNum,
              status: first.status,
              items: matchingItems,
              consultants: first.consultants || [],
              reviewer: first.reviewer || null,
              reviewer_ids: first.reviewer_ids || (first.reviewer_id ? [first.reviewer_id] : []),
              reviewers: first.reviewers || (first.reviewer ? [first.reviewer] : []),
              created_at: first.created_at
            });
            setActiveOrderItems(matchingItems);
            setSelectedOrderNum(targetOrderNum);
            setOrderSearchQuery(targetOrderNum);
          }
        }
      }

      if (compRes.status === "fulfilled" && compRes.value.ok) {
        const allCompanies = await compRes.value.json();
        const thisCompany = allCompanies.find((c: any) => c.id.toString() === companyId);
        if (thisCompany) {
          setCompanyName(thisCompany.company_name);
          setCompanyCode(thisCompany.company_code || "");
          if (!thisCompany.company_code) {
            console.warn("Company has no company_code in database!");
            toast.error("This company is missing a company code. Dropbox integration requires a company code.");
          }
        } else {
          setCompanyName("Unknown Company");
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [companyId]);

  // Compliance Badge Helper
  const getDocumentComplianceStatus = (expiryDateStr: string | null) => {
    if (!expiryDateStr) return { label: "VALID", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" };
    const today = new Date();
    const exp = new Date(expiryDateStr);
    if (isBefore(exp, today)) {
      return { label: "EXPIRED", color: "bg-destructive/15 text-destructive border-destructive/30" };
    }
    const daysLeft = differenceInDays(exp, today);
    if (daysLeft <= 30) {
      return { label: `EXPIRING IN ${daysLeft} DAYS`, color: "bg-amber-500/15 text-amber-600 border-amber-500/30" };
    }
    return { label: "VALID", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" };
  };

  const handleUploadDocuments = async () => {
    if (!uploadRow.file) {
      toast.error("Please attach a file to upload.");
      return;
    }
    if (!uploadRow.type) {
      toast.error("Please select a document category.");
      return;
    }
    setUploadingDocs(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadRow.file);
      formData.append("document_type", uploadRow.type);
      if (uploadRow.description) formData.append("description", uploadRow.description);
      if (selectedOrderNum && selectedOrderNum.trim()) {
        formData.append("order_number", selectedOrderNum.trim());
      }
      if (uploadRow.date) formData.append("document_date", uploadRow.date);
      if (uploadRow.expiry_date) formData.append("expiry_date", uploadRow.expiry_date);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/documents`, {
        credentials: "include",
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        let msg = "Save failed";
        try {
          const errJson = await res.json();
          msg = errJson.detail || errJson.message || JSON.stringify(errJson);
        } catch {
          const errText = await res.text();
          if (errText) msg = errText;
        }
        throw new Error(msg);
      }

      const newDoc = await res.json();
      setDocuments(prev => [...prev, newDoc]);
      setUploadRow({ file: null, type: "", description: "", document_path: "", date: "", expiry_date: "" });
      setSelectedOrderNum("");
      setOrderSearchQuery("");
      toast.success("Document record saved successfully!");
      fetchInitialData();
    } catch (err: any) {
      console.error("Save failed", err);
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteDocId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/documents/${deleteDocId}`, {
        credentials: "include",
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete document");
      setDocuments(prev => prev.filter(doc => doc.id !== deleteDocId));
      toast.success("Document deleted successfully");
      setDeleteDocId(null);
      fetchActivities();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditDocument = async () => {
    if (!editDoc) return;
    setIsEditing(true);
    try {
      const formData = new FormData();
      if (editDoc.file) {
        formData.append("file", editDoc.file);
      }
      if (editDoc.document_type) {
        formData.append("document_type", editDoc.document_type);
      } else {
        formData.append("document_type", "");
      }
      if (editDoc.description) {
        formData.append("description", editDoc.description);
      } else {
        formData.append("description", "");
      }
      if (editDoc.order_number) {
        formData.append("order_number", editDoc.order_number);
      } else {
        formData.append("order_number", "");
      }
      if (editDoc.document_date) {
        formData.append("document_date", editDoc.document_date.split('T')[0]);
      } else {
        formData.append("document_date", "");
      }
      if (editDoc.expiry_date) {
        formData.append("expiry_date", editDoc.expiry_date.split('T')[0]);
      } else {
        formData.append("expiry_date", "");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/documents/${editDoc.id}`, {
        credentials: "include",
        method: "PATCH",
        body: formData
      });
      if (!res.ok) throw new Error("Failed to update document");
      const updatedDoc = await res.json();
      setDocuments(prev => prev.map(doc => doc.id === editDoc.id ? updatedDoc : doc));
      toast.success("Document updated successfully");
      setEditDoc(null);
      fetchInitialData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsEditing(false);
    }
  };

  const handlePreviewClick = (doc: any) => {
    setPreviewDoc(doc);
    if (!doc.file_url || doc.file_url === "#") {
      setResolvedPreviewUrl("#");
      return;
    }

    // Resolve directly to the secure backend preview endpoint that streams Dropbox or local file bytes
    const previewUrl = `/api-proxy/api/clients/companies/${companyId}/documents/${doc.id}/preview`;
    setResolvedPreviewUrl(previewUrl);
  };

  const handleDownloadDocFile = async (doc: any) => {
    if (!doc.file_url || doc.file_url === "#") {
      toast.error("No valid URL found for this document.");
      return;
    }

    if (doc.file_url.startsWith("/Clients/")) {
      const toastId = toast.loading("Generating secure Dropbox download link...");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dropbox/download?path=${encodeURIComponent(doc.file_url)}&action=DOWNLOAD`, {
          credentials: "include",
        });
        const data = await res.json();
        toast.dismiss(toastId);
        if (res.ok && data.success && data.link) {
          window.open(data.link, "_blank");
          toast.success("Download started!");
          fetchActivities();
        } else {
          throw new Error(data.error || "Failed to generate link");
        }
      } catch (err: any) {
        toast.dismiss(toastId);
        toast.error(err.message || "Failed to download Dropbox file");
      }
    } else {
      const url = doc.file_url.startsWith("/uploads/") ? `${process.env.NEXT_PUBLIC_API_URL}${doc.file_url}` : doc.file_url;
      window.open(url, "_blank");
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dropbox/log-action`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: doc.file_url,
          action_type: "DOCUMENT_DOWNLOADED",
          description: `Downloaded document '${doc.file_name}' (${doc.document_type || 'General'})${doc.order_number ? ` for order ${doc.order_number}` : ''}`,
          company_id: parseInt(companyId)
        })
      }).then(() => fetchActivities()).catch(() => {});
    }
  };
  // Stakeholder Creation
  const handleAddStakeholder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStakeholder.name) return;

    if (newStakeholder.email && !isValidEmail(newStakeholder.email)) {
      toast.error("Please enter a valid email address (e.g. contact@domain.com).");
      return;
    }

    if (newStakeholder.phone && !isValidPhoneNumber(newStakeholder.phone)) {
      toast.error("Please enter a valid phone number (6 to 15 digits).");
      return;
    }

    setAddingStakeholder(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/stakeholders`, {
      credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newStakeholder)
      });
      if (res.ok) {
        const added = await res.json();
        setStakeholders(prev => [...prev, added]);
        setNewStakeholder({ name: "", role: "Key Contact Person", phone: "", email: "", is_key_contact: false });
        toast.success("Corporate stakeholder added successfully!");
        fetchInitialData();
      } else {
        toast.error("Failed to add stakeholder");
      }
    } catch (err) {
      toast.error("Error adding stakeholder");
    } finally {
      setAddingStakeholder(false);
    }
  };

  const handleDeleteStakeholder = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/stakeholders/${id}`, {
      credentials: "include",
        method: "DELETE",
        });
      if (res.ok) {
        setStakeholders(prev => prev.filter(s => s.id !== id));
        toast.success("Stakeholder removed");
      }
    } catch (err) {
      toast.error("Error removing stakeholder");
    }
  };

  const handleUpdateStakeholder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStakeholder || !editStakeholder.name) return;
    setSavingStakeholder(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/stakeholders/${editStakeholder.id}`, {
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: editStakeholder.name,
          role: editStakeholder.role,
          phone: editStakeholder.phone || null,
          email: editStakeholder.email || null,
          is_key_contact: editStakeholder.is_key_contact || false
        })
      });
      if (res.ok) {
        toast.success("Corporate stakeholder updated successfully!");
        setEditStakeholder(null);
        fetchInitialData();
      } else {
        const errData = await res.json();
        toast.error(errData.detail || "Failed to update stakeholder");
      }
    } catch (err) {
      toast.error("Error updating stakeholder");
    } finally {
      setSavingStakeholder(false);
    }
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // Check Next.js query search parameters first (works reliably across client-side Link navigation)
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const fromSource = searchParams ? searchParams.get("from") : null;
    const tabParam = searchParams ? searchParams.get("tab") : null;
    const role = typeof window !== "undefined" ? localStorage.getItem("user_role") : null;

    if (fromSource === "company-docs") {
      router.push("/business/clients/documents");
    } else if (fromSource === "assigned-orders") {
      const orderParam = searchParams ? searchParams.get("order") : null;
      let targetUrl = `/business/assigned-orders?tab=${encodeURIComponent(tabParam || "IN_PROGRESS")}`;
      if (orderParam) {
        targetUrl += `&order=${encodeURIComponent(orderParam)}`;
      }
      router.push(targetUrl);
    } else if (fromSource === "orders") {
      router.push("/business/clients/orders");
    } else {
      if (role === "CLIENT") {
        router.push("/client/dashboard");
      } else {
        try {
          const cachedPerms = typeof window !== "undefined" ? localStorage.getItem("hrms_permissions") : null;
          const perms: string[] = cachedPerms ? JSON.parse(cachedPerms) : [];
          const hasDocsView = perms.includes("clients_documents:view") || perms.includes("*:*");
          if (hasDocsView) {
            router.push("/business/clients/documents");
          } else {
            router.push("/business/assigned-orders");
          }
        } catch {
          router.push("/business/assigned-orders");
        }
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading company workspace...</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[100rem] mx-auto w-full">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBackClick} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{companyName}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                Corporate Governance, Legal Documents & Audit Logs
                {companyCode && (
                  <>
                    <span>•</span>
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground font-semibold">Code: {companyCode}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Order Context & Direct Workflow Execution Bar */}
      {activeOrder && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/[0.08] via-primary/[0.03] to-background p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left Info: Order Badge, Status, Items, Consultants */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs px-2.5 py-1 gap-1.5 shadow-sm">
                  <FolderKanban className="h-3.5 w-3.5" />
                  ORDER #{activeOrder.order_number}
                </Badge>
                
                <Badge variant="outline" className={`${getOrderStatusColor(activeOrder.status)} text-xs px-2.5 py-0.5 border font-semibold`}>
                  {activeOrder.status ? activeOrder.status.replace(/_/g, " ") : "IN PROGRESS"}
                </Badge>

                {activeOrder.consultants && activeOrder.consultants.length > 0 && (
                  <div className="flex items-center gap-1 bg-background/80 px-2 py-0.5 rounded-md border border-border/60 text-[11px] text-muted-foreground font-medium">
                    <UserCheck className="h-3 w-3 text-primary" />
                    <span>Assignee:</span>
                    <span className="text-foreground font-semibold">
                      {activeOrder.consultants.map((c: any) => c.name).join(", ")}
                    </span>
                  </div>
                )}

                {(() => {
                  const revs = activeOrder.reviewers && activeOrder.reviewers.length > 0
                    ? activeOrder.reviewers
                    : (activeOrder.reviewer ? [activeOrder.reviewer] : []);
                  if (revs.length === 0) return null;
                  return (
                    <div className="flex items-center gap-1 bg-background/80 px-2 py-0.5 rounded-md border border-border/60 text-[11px] text-muted-foreground font-medium">
                      <ShieldCheck className="h-3 w-3 text-purple-500" />
                      <span>Reviewer{revs.length > 1 ? "s" : ""}:</span>
                      <span className="text-foreground font-semibold">
                        {revs.map((r: any) => r.name).join(", ")}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Service Scope items */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span className="font-semibold text-foreground">Service Scope:</span>
                {activeOrder.items && activeOrder.items.length > 0 ? (
                  activeOrder.items.map((item: any, i: number) => {
                    const svcName = item.job_title || item.service_name || item.service?.job_title || item.name || "Service Package";
                    return (
                      <span 
                        key={item.id || i} 
                        className="inline-flex items-center gap-1.5 bg-background/90 hover:bg-background px-2.5 py-1 rounded-md border border-border/80 text-foreground font-medium text-[11px] shadow-xs transition-colors"
                        title={item.description || svcName}
                      >
                        <span className="font-semibold">{svcName}</span>
                        {item.job_id && (
                          <Badge variant="outline" className="text-[9px] font-mono py-0 px-1.5 bg-primary/5 text-primary border-primary/20 shrink-0">
                            {item.job_id}
                          </Badge>
                        )}
                        {item.pricing_tier && item.pricing_tier !== "BASE" && (
                          <Badge variant="secondary" className="text-[9px] py-0 px-1 font-medium capitalize shrink-0">
                            {item.pricing_tier.toLowerCase().replace('_', ' ')}
                          </Badge>
                        )}
                      </span>
                    );
                  })
                ) : (
                  <span className="italic text-muted-foreground text-[11px]">Standard Company Legal Scope</span>
                )}
              </div>
            </div>

            {/* Right Actions: Quick Progression, Status Switcher, Chat & Return */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
              {/* Contextual Quick Transition Buttons */}
              {activeOrder.status === "ORDER_ASSIGNED" && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateActiveOrderStatus("IN_PROGRESS")}
                  disabled={updatingOrderStatus}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5" /> Start Order
                </Button>
              )}

              {activeOrder.status === "REVIEW_DOCS" && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateActiveOrderStatus("DOCUMENTS_REVIEWED")}
                  disabled={updatingOrderStatus}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark Reviewed
                </Button>
              )}

              {(activeOrder.status === "DOCUMENTS_REVIEWED" || activeOrder.status === "FINAL_DOCUMENT_PREPARATION" || activeOrder.status === "PRE_DOCS_SENT") && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateActiveOrderStatus("FINAL_DOC_READY")}
                  disabled={updatingOrderStatus}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Mark Final Doc Ready
                </Button>
              )}

              {/* Status Switcher Select */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 hidden sm:inline">Stage:</span>
                <select
                  value={activeOrder.status || "IN_PROGRESS"}
                  disabled={updatingOrderStatus}
                  onChange={(e) => handleUpdateActiveOrderStatus(e.target.value)}
                  className={`h-9 px-2.5 py-1 text-xs font-bold rounded-md border shadow-xs bg-background transition-colors cursor-pointer ${getOrderStatusColor(activeOrder.status)}`}
                >
                  <option value="ORDER_ASSIGNED">ORDER ASSIGNED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="REVIEW_DOCS">REVIEW DOCS</option>
                  <option value="DOCUMENTS_REVIEWED">DOCUMENTS REVIEWED</option>
                  <option value="PRE_DOC_SENT_FOR_SIGNATURE">PRE DOC SENT FOR SIGNATURE</option>
                  <option value="FINAL_DOCUMENT_PREPARATION">FINAL DOCUMENT PREPARATION</option>
                  <option value="FINAL_DOC_READY">FINAL DOC READY</option>
                  <option value="ON_HOLD">ON HOLD</option>
                </select>
              </div>

              {/* Order Chat */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatOpen(true)}
                className="h-9 gap-1.5 text-xs font-semibold bg-background hover:bg-muted border-border/80 cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Order Chat</span>
              </Button>

              {/* Return to Assigned Orders */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackClick}
                className="h-9 gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                title="Return to Allocated Orders Workspace"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Return to Orders</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        if (tab === "documents") fetchDocuments();
        if (tab === "activities") fetchActivities();
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 max-w-2xl">
          <TabsTrigger value="documents" className="gap-2 text-xs font-semibold">
            <FileText className="h-4 w-4" /> Legal Documents
          </TabsTrigger>
          <TabsTrigger value="dropbox" className="gap-2 text-xs font-semibold">
            <Upload className="h-4 w-4" /> Dropbox Files
          </TabsTrigger>
          <TabsTrigger value="stakeholders" className="gap-2 text-xs font-semibold">
            <Users className="h-4 w-4" /> Board & Shareholders
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-2 text-xs font-semibold">
            <History className="h-4 w-4" /> Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dropbox" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-500" /> Dropbox Integration
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Upload, download, and manage files securely on Dropbox for {companyName}.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {companyCode && (
                <DropboxFileManager 
                  basePath={`/Clients/${companyCode}`} 
                  title={`${companyName} Documents`}
                  onActivityTriggered={() => {
                    fetchActivities();
                    fetchDocuments();
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 1: Legal Documents with Compliance Expiry */}
        <TabsContent value="documents" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-4 border-b border-border/40">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Corporate Legal Documents & Permits
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Upload and track license validity, KITAS permits, and expiration dates.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
                {activeOrder && (
                  <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 text-xs">
                    <button
                      type="button"
                      onClick={() => setFilterByActiveOrder(true)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                        filterByActiveOrder 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Filter className="h-3 w-3" />
                      Order #{activeOrder.order_number} ({activeOrderDocsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterByActiveOrder(false)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        !filterByActiveOrder 
                          ? "bg-background text-foreground shadow-sm border border-border/50" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All Company Docs ({documents.length})
                    </button>
                  </div>
                )}
                <div className="w-full sm:w-60 relative shrink-0">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search documents..."
                    value={documentSearchQuery}
                    onChange={(e) => setDocumentSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs bg-muted/10 border-border/80 focus:bg-background transition-all"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={fetchDocuments}
                  disabled={fetchingDocs}
                  title="Refresh Documents"
                >
                  <RefreshCw className={`h-4 w-4 ${fetchingDocs ? "animate-spin text-primary" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto border rounded-xl max-h-[415px] overflow-y-auto shadow-inner bg-muted/5 relative">
                <table className="w-full text-xs text-left whitespace-nowrap border-collapse">
                  <thead className="bg-muted border-b sticky top-0 z-10 shadow-sm">
                    <tr className="uppercase font-semibold text-[10px] text-muted-foreground tracking-wider bg-muted">
                      <th className="px-4 py-3 w-12 text-center bg-muted">No.</th>
                      <th className="px-4 py-3 bg-muted">Document Type</th>
                      <th className="px-4 py-3 bg-muted">Description</th>
                      <th className="px-4 py-3 bg-muted">Order Number</th>
                      <th className="px-4 py-3 bg-muted">Issue Date</th>
                      <th className="px-4 py-3 bg-muted">Expiry Date</th>
                      <th className="px-4 py-3 text-center bg-muted">Compliance Status</th>
                      <th className="px-4 py-3 text-right bg-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 bg-background">
                    {filteredDocuments.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center bg-muted/10">
                          <FileText className="mx-auto h-6 w-6 text-muted-foreground/40 mb-1" />
                          <p className="text-sm text-muted-foreground">
                            {documentSearchQuery.trim() ? "No matching documents found" : "No documents uploaded yet"}
                          </p>
                        </td>
                      </tr>
                    )}
                    {filteredDocuments.map((doc: any, index: number) => {
                      const compliance = getDocumentComplianceStatus(doc.expiry_date);
                      return (
                        <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-bold text-foreground">
                            {doc.document_type || "General Document"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs font-medium max-w-[450px] whitespace-pre-line break-words leading-relaxed">
                            {doc.description || "-"}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-primary">
                            {doc.order_number || "-"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono">
                            {doc.document_date ? format(new Date(doc.document_date), "MMM d, yyyy") : "-"}
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-foreground">
                            {doc.expiry_date ? format(new Date(doc.expiry_date), "MMM d, yyyy") : "No Expiry"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`${compliance.color} text-[10px] font-bold font-mono px-2 py-0.5 border`}>
                              {compliance.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Preview Document"
                              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              onClick={() => handlePreviewClick(doc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {doc.file_url && doc.file_url !== "#" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                onClick={() => handleDownloadDocFile(doc)}
                                title="Download Document"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Document Metadata"
                              className="h-8 w-8 text-muted-foreground hover:bg-muted/50"
                              onClick={() => {
                                setEditDoc(doc);
                                setEditOrderSearchQuery(doc.order_number || "");
                                setEditOrderDropdownOpen(false);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Document"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteDocId(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Upload New Document Card */}
              <div className="bg-background rounded-xl border border-border shadow-sm p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <PlusCircle className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Upload New Document with Expiry Tracking</h4>
                </div>

                {/* Metadata Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                  <div className="relative">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Order Number (Optional)</label>
                    <div className="relative">
                      <Input
                        placeholder="Search orders..."
                        value={orderSearchQuery}
                        onChange={(e) => {
                          setOrderSearchQuery(e.target.value);
                          setSelectedOrderNum(e.target.value);
                          setOrderDropdownOpen(true);
                        }}
                        onFocus={() => setOrderDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setOrderDropdownOpen(false), 200)}
                        className="h-9 text-xs bg-muted/20 pr-8"
                      />
                      {orderSearchQuery ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderSearchQuery("");
                            setSelectedOrderNum("");
                          }}
                          className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground text-[11px]"
                        >
                          ✕
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOrderDropdownOpen(!orderDropdownOpen)}
                          className="absolute right-2 top-2.5 text-muted-foreground text-[10px]"
                        >
                          ▼
                        </button>
                      )}
                    </div>
                    {orderDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md font-mono text-[11px]">
                        <div
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedOrderNum("");
                            setOrderSearchQuery("");
                            setOrderDropdownOpen(false);
                          }}
                          className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 outline-none hover:bg-accent hover:text-accent-foreground text-muted-foreground italic border-b border-border/40"
                        >
                          None (General Document)
                        </div>
                        {orderNumbers
                          .filter(num => num.toLowerCase().includes(orderSearchQuery.toLowerCase()))
                          .slice(0, 30)
                          .map((num) => (
                            <div
                              key={num}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSelectedOrderNum(num);
                                setOrderSearchQuery(num);
                                setOrderDropdownOpen(false);
                              }}
                              className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 outline-none hover:bg-accent hover:text-accent-foreground"
                            >
                              {num}
                            </div>
                          ))}
                        {orderNumbers.filter(num => num.toLowerCase().includes(orderSearchQuery.toLowerCase())).length === 0 && (
                          <div className="py-2 text-center text-muted-foreground text-[10px]">
                            No matching orders
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Category *</label>
                    <Select
                      value={uploadRow.type}
                      onValueChange={(val) => setUploadRow({ ...uploadRow, type: val })}
                    >
                      <SelectTrigger className="h-9 text-xs bg-muted/20 w-full">
                        <SelectValue placeholder="Choose type..." />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                        <SelectItem value="Client ID">Client ID</SelectItem>
                        <SelectItem value="Photo">Photo</SelectItem>
                        <SelectItem value="Invoice">Invoice</SelectItem>
                        <SelectItem value="Deeds and Approval">Deeds and Approval</SelectItem>
                        <SelectItem value="Brand Certificate">Brand Certificate</SelectItem>
                        <SelectItem value="Miscellaneous Documents">Miscellaneous Documents</SelectItem>
                        <SelectItem value="Pre-Signature Documents">Pre-Signature Documents</SelectItem>
                        <SelectItem value="Signed Documents">Signed Documents</SelectItem>
                        <SelectItem value="Final Documents">Final Documents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Issue Date</label>
                    <Input
                      type="date"
                      value={uploadRow.date}
                      onChange={(e) => setUploadRow({ ...uploadRow, date: e.target.value })}
                      className="h-9 text-xs bg-muted/20"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-amber-600 font-semibold block mb-1">Expiry Date (Alerts)</label>
                    <Input
                      type="date"
                      value={uploadRow.expiry_date}
                      onChange={(e) => setUploadRow({ ...uploadRow, expiry_date: e.target.value })}
                      className="h-9 text-xs bg-amber-500/5 border-amber-500/30"
                    />
                  </div>
                </div>

                {/* Description Textarea (3 rows, expandable downwards) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                      Description / Items List
                    </label>
                    <span className="text-[10px] text-muted-foreground">Press Enter for multi-line items list</span>
                  </div>
                  <Textarea
                    rows={3}
                    placeholder="Enter document description or list multiple items (e.g. 1. KTP, 2. NPWP, 3. Deed)..."
                    value={uploadRow.description}
                    onChange={(e) => setUploadRow({ ...uploadRow, description: e.target.value })}
                    className="text-xs bg-muted/20 resize-y min-h-[72px] leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => setUploadRow({ ...uploadRow, file: e.target.files?.[0] || null })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`h-9 gap-1.5 ${uploadRow.file ? "border-primary/40 text-primary bg-primary/5" : "border-dashed"}`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                      {uploadRow.file ? uploadRow.file.name : "Attach File"}
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    className="h-9 gap-1.5 font-semibold shadow-sm px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleUploadDocuments}
                    disabled={uploadingDocs || !uploadRow.file || !uploadRow.type}
                  >
                    <Save className="h-4 w-4" />
                    {uploadingDocs ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Board & Shareholders */}
        <TabsContent value="stakeholders" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Corporate Board & Shareholders Structure
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Manage registered directors, commissioners, shareholders, and share percentages.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Add Stakeholder Form */}
              <form onSubmit={handleAddStakeholder} className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-primary" /> Add Corporate Director / Shareholder / Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Full Name *</label>
                    <Input
                      required
                      placeholder="e.g. John Doe"
                      value={newStakeholder.name}
                      onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Role *</label>
                    <Select value={newStakeholder.role} onValueChange={(val) => setNewStakeholder({ ...newStakeholder, role: val })}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                        <SelectItem value="Key Contact Person">Key Contact Person</SelectItem>
                        <SelectItem value="Director">Director</SelectItem>
                        <SelectItem value="Commissioner">Commissioner</SelectItem>
                        <SelectItem value="Shareholder">Shareholder</SelectItem>
                        <SelectItem value="Authorized Signer">Authorized Signer</SelectItem>
                        <SelectItem value="Billing">Billing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Phone Number</label>
                    <PhoneInput
                      placeholder="812 3456 789"
                      value={newStakeholder.phone}
                      onChange={(val) => setNewStakeholder({ ...newStakeholder, phone: val })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Email Address</label>
                    <EmailInput
                      placeholder="contact@domain.com"
                      value={newStakeholder.email}
                      onChange={(val) => setNewStakeholder({ ...newStakeholder, email: val })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 h-9 pb-1.5 pl-1">
                    <input
                      type="checkbox"
                      id="is_key_contact_cb"
                      checked={newStakeholder.is_key_contact}
                      onChange={(e) => setNewStakeholder({ ...newStakeholder, is_key_contact: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <label htmlFor="is_key_contact_cb" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                      Key Contact
                    </label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={addingStakeholder} className="gap-1.5 font-semibold">
                    <Plus className="h-4 w-4" /> Add Member
                  </Button>
                </div>
              </form>

              {/* Stakeholders Table */}
              <div className="border rounded-xl overflow-hidden text-xs bg-background">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                      <th className="p-3 w-12 text-center">No.</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Corporate Role</th>
                      <th className="p-3">Phone Number</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3 w-28 text-center">Key Contact</th>
                      <th className="p-3 w-20 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stakeholders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                          No corporate directors or stakeholders registered yet.
                        </td>
                      </tr>
                    ) : (
                      stakeholders.map((stk, idx) => (
                        <tr key={stk.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 text-center font-mono text-muted-foreground">#{idx + 1}</td>
                          <td className="p-3 font-bold text-foreground">{stk.name}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-semibold text-[10px] uppercase">
                              {stk.role}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">{stk.phone || "-"}</td>
                          <td className="p-3 text-muted-foreground">{stk.email || "-"}</td>
                          <td className="p-3 text-center">
                            {stk.is_key_contact ? (
                              <Badge className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-bold text-[9px] uppercase tracking-wide">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">-</span>
                            )}
                          </td>
                          <td className="p-3 text-right flex justify-end gap-1.5">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => setEditStakeholder(stk)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteStakeholder(stk.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Activity Audit Log Timeline */}
        <TabsContent value="activities" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" /> Corporate Activity Audit Log
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Real-time chronological timeline of document uploads, downloads, views, deletions, and job movements for {companyName}.
                </CardDescription>
              </div>

              {/* Activity Filter & Search Controls */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="relative min-w-[200px] flex-1 md:w-60">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search activity..."
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs bg-muted/10 border-border/80 focus:bg-background"
                  />
                </div>

                <Select value={activityCategoryFilter} onValueChange={setActivityCategoryFilter}>
                  <SelectTrigger className="h-9 text-xs w-[140px] bg-background">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" align="end">
                    <SelectItem value="ALL">All Actions</SelectItem>
                    <SelectItem value="UPLOADS">Uploads</SelectItem>
                    <SelectItem value="DELETIONS">Deletions</SelectItem>
                    <SelectItem value="DOWNLOADS">Downloads</SelectItem>
                    <SelectItem value="VIEWS">Views</SelectItem>
                    <SelectItem value="FOLDERS">Folders</SelectItem>
                    <SelectItem value="ORDERS">Orders / Invoices</SelectItem>
                    <SelectItem value="STAKEHOLDERS">Stakeholders</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchActivities}
                  disabled={refreshingActivities}
                  className="h-9 px-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Refresh activity logs"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshingActivities ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredActivities.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
                  <History className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                  <p className="font-medium text-foreground/80">
                    {activitySearchQuery || activityCategoryFilter !== "ALL" 
                      ? "No activity logs match your filter criteria."
                      : "No activity history recorded for this company yet."}
                  </p>
                  {(activitySearchQuery || activityCategoryFilter !== "ALL") && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => { setActivitySearchQuery(""); setActivityCategoryFilter("ALL"); }}
                      className="text-xs h-auto p-0 text-primary"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="relative border-l border-border/70 ml-4 sm:ml-6 space-y-6 py-4">
                  {filteredActivities.map((act) => {
                    const badgeInfo = getActivityBadge(act.action_type);
                    return (
                      <div key={act.id} className="relative pl-6 sm:pl-8 group">
                        <span className="absolute -left-2 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-background shadow-xs transition-transform group-hover:scale-125" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] font-mono font-bold uppercase border flex items-center px-2 py-0.5 rounded-md shadow-2xs ${badgeInfo.badgeClass}`}>
                              {badgeInfo.icon}
                              {act.action_type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono shrink-0">
                            {act.performed_by && (
                              <span className="font-semibold text-foreground/90 bg-muted/80 px-2 py-0.5 rounded border border-border/60">
                                By: {act.performed_by}
                              </span>
                            )}
                            <span className="text-muted-foreground/80">
                              {format(new Date(act.created_at), "MMM d, yyyy HH:mm:ss")}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-foreground/90 mt-1.5 leading-relaxed bg-muted/20 p-2.5 rounded-lg border border-border/40 group-hover:border-border transition-colors">
                          {act.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Delete Doc Dialog */}
      <Dialog open={!!deleteDocId} onOpenChange={(open) => !open && setDeleteDocId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Document Deletion</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete this document from the server? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDocId(null)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteDocument} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stakeholder Dialog */}
      <Dialog open={!!editStakeholder} onOpenChange={(open) => !open && setEditStakeholder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Corporate Board Member / Contact</DialogTitle>
            <DialogDescription className="text-xs">
              Update information for this company's board member or key representative.
            </DialogDescription>
          </DialogHeader>
          {editStakeholder && (
            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. John Doe"
                  value={editStakeholder.name || ""}
                  onChange={(e) => setEditStakeholder({ ...editStakeholder, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Role *</label>
                <Select value={editStakeholder.role} onValueChange={(val) => setEditStakeholder({ ...editStakeholder, role: val })}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
                    <SelectItem value="Key Contact Person">Key Contact Person</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Commissioner">Commissioner</SelectItem>
                    <SelectItem value="Shareholder">Shareholder</SelectItem>
                    <SelectItem value="Authorized Signer">Authorized Signer</SelectItem>
                    <SelectItem value="Billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Phone Number</label>
                <Input
                  placeholder="e.g. +62 812..."
                  value={editStakeholder.phone || ""}
                  onChange={(e) => setEditStakeholder({ ...editStakeholder, phone: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="e.g. contact@domain.com"
                  value={editStakeholder.email || ""}
                  onChange={(e) => setEditStakeholder({ ...editStakeholder, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit_is_key_contact_cb"
                  checked={editStakeholder.is_key_contact || false}
                  onChange={(e) => setEditStakeholder({ ...editStakeholder, is_key_contact: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <label htmlFor="edit_is_key_contact_cb" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                  Key Contact for this Company
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStakeholder(null)} disabled={savingStakeholder}>Cancel</Button>
            <Button onClick={handleUpdateStakeholder} disabled={savingStakeholder}>
              {savingStakeholder ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Doc Dialog */}
      <Dialog open={!!editDoc} onOpenChange={(open) => !open && setEditDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document Metadata & Expiry</DialogTitle>
          </DialogHeader>
          {editDoc && (
            <div className="space-y-4 py-2 text-xs">
              {/* Optional File Replacement */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Replace Document File (Optional)</span>
                  {editDoc.file_name && (
                    <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]" title={editDoc.file_name}>
                      Current: {editDoc.file_name}
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="edit-file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => setEditDoc({ ...editDoc, file: e.target.files?.[0] || null })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("edit-file-upload")?.click()}
                    className={`w-full h-9 text-xs gap-1.5 justify-start font-medium ${editDoc.file ? "border-primary/40 text-primary bg-primary/5 font-semibold" : "border-dashed"}`}
                  >
                    <Upload className="h-4 w-4" />
                    {editDoc.file ? editDoc.file.name : "Choose New File..."}
                  </Button>
                  {editDoc.file && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:bg-destructive/10"
                      onClick={() => setEditDoc({ ...editDoc, file: null })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Document Type</label>
                <Input
                  value={editDoc.document_type || ""}
                  onChange={(e) => setEditDoc({ ...editDoc, document_type: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Description</label>
                <Textarea
                  value={editDoc.description || ""}
                  onChange={(e) => setEditDoc({ ...editDoc, description: e.target.value })}
                  className="text-xs bg-muted/20 resize-y min-h-[72px] leading-relaxed"
                  rows={3}
                />
              </div>
              <div className="space-y-1 relative">
                <label className="font-semibold text-foreground block">Order Number (Optional)</label>
                <div className="relative">
                  <Input
                    placeholder="Search or select order..."
                    value={editOrderSearchQuery}
                    onChange={(e) => {
                      setEditOrderSearchQuery(e.target.value);
                      setEditDoc({ ...editDoc, order_number: e.target.value });
                      setEditOrderDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setEditOrderSearchQuery(editDoc.order_number || "");
                      setEditOrderDropdownOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setEditOrderDropdownOpen(false), 200)}
                    className="h-9 text-xs font-mono font-bold bg-muted/20 pr-8"
                  />
                  {(editDoc.order_number || editOrderSearchQuery) ? (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setEditOrderSearchQuery("");
                        setEditDoc({ ...editDoc, order_number: "" });
                      }}
                      className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground text-[11px]"
                    >
                      ✕
                    </button>
                  ) : (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setEditOrderDropdownOpen(!editOrderDropdownOpen)}
                      className="absolute right-2 top-2.5 text-muted-foreground text-[10px]"
                    >
                      ▼
                    </button>
                  )}
                </div>
                {editOrderDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md font-mono text-[11px]">
                    <div
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setEditDoc({ ...editDoc, order_number: "" });
                        setEditOrderSearchQuery("");
                        setEditOrderDropdownOpen(false);
                      }}
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 outline-none hover:bg-accent hover:text-accent-foreground text-muted-foreground italic border-b border-border/40"
                    >
                      None (General Document)
                    </div>
                    {orderNumbers
                      .filter(num => num.toLowerCase().includes(editOrderSearchQuery.toLowerCase()))
                      .slice(0, 30)
                      .map((num) => (
                        <div
                          key={num}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setEditDoc({ ...editDoc, order_number: num });
                            setEditOrderSearchQuery(num);
                            setEditOrderDropdownOpen(false);
                          }}
                          className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 outline-none hover:bg-accent hover:text-accent-foreground ${editDoc.order_number === num ? "bg-primary/10 text-primary font-bold" : ""}`}
                        >
                          {num}
                        </div>
                      ))}
                    {orderNumbers.filter(num => num.toLowerCase().includes(editOrderSearchQuery.toLowerCase())).length === 0 && (
                      <div className="py-2 text-center text-muted-foreground text-[10px]">
                        No matching orders
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Issue Date</label>
                <Input
                  type="date"
                  value={editDoc.document_date ? editDoc.document_date.split('T')[0] : ""}
                  onChange={(e) => setEditDoc({ ...editDoc, document_date: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-amber-600">Expiry Date (Compliance Tracking)</label>
                <Input
                  type="date"
                  value={editDoc.expiry_date ? editDoc.expiry_date.split('T')[0] : ""}
                  onChange={(e) => setEditDoc({ ...editDoc, expiry_date: e.target.value })}
                  className="h-9 text-xs border-amber-500/40"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)} disabled={isEditing}>Cancel</Button>
            <Button onClick={handleEditDocument} disabled={isEditing}>
              {isEditing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Right-to-Left Slide Preview Panel */}
      {previewDoc && (
        <div className={`fixed top-16 bottom-0 right-0 left-0 md:left-[260px] z-30 bg-background/98 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-between overflow-hidden duration-300 border-l border-t border-border shadow-2xl ${isClosingPreview ? "animate-out slide-out-to-right" : "animate-in slide-in-from-right"}`}>
          <div className="max-w-7xl w-full h-full mx-auto flex flex-col justify-between space-y-4">

            {/* Top Action Header */}
            <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900 text-white shadow-lg shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClosePreview}
                  className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800 font-semibold h-8 text-xs cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Documents
                </Button>
                <div className="h-4 w-px bg-slate-700 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm truncate max-w-xs sm:max-w-md">{previewDoc.document_type || "Document Preview"}</span>
                  {previewDoc.description && (
                    <span className="text-xs text-slate-400 hidden md:inline truncate max-w-sm">({previewDoc.description})</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {resolvedPreviewUrl && resolvedPreviewUrl !== "#" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(resolvedPreviewUrl, "_blank")}
                    className="h-8 gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800 font-semibold text-xs cursor-pointer px-3 rounded-lg border border-slate-700/60 transition-colors"
                    title="Open Document in New Tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Open in New Tab</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClosePreview}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  ✕
                </Button>
              </div>
            </div>

            {/* Document Viewer Frame */}
            <div className="flex-1 w-full bg-slate-900/5 dark:bg-slate-950 rounded-2xl border border-border shadow-inner flex items-center justify-center p-2 overflow-hidden">
              {resolvedPreviewUrl && resolvedPreviewUrl !== "#" ? (
                previewDoc.file_name?.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) ? (
                  <img
                    src={resolvedPreviewUrl}
                    alt="Document Preview"
                    className="max-h-[calc(100vh-16rem)] w-auto max-w-full object-contain rounded-lg shadow-md"
                  />
                ) : (
                  <iframe
                    src={previewDoc.file_name?.match(/\.pdf$/i) ? resolvedPreviewUrl : `https://docs.google.com/gview?url=${encodeURIComponent(resolvedPreviewUrl)}&embedded=true`}
                    className="w-full h-[calc(100vh-16rem)] rounded-xl border-0 shadow-sm"
                    title="Document Preview Frame"
                  />
                )
              ) : (
                <div className="text-center space-y-2 p-8">
                  <Paperclip className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-semibold text-foreground">External Document Registered</p>
                  <p className="text-xs font-mono text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 inline-block">
                    Order: {previewDoc.order_number || "No Order"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">This document is stored on local storage or Dropbox.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* STATUS CHANGE CONFIRMATION DIALOG */}
      <Dialog 
        open={isConfirmStatusOpen} 
        onOpenChange={(open) => {
          if (!open && !updatingOrderStatus) {
            setIsConfirmStatusOpen(false);
            setPendingConfirmStatus("");
          }
        }}
      >
        <DialogContent className="max-w-md p-6 rounded-2xl border border-border shadow-2xl bg-background">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Confirm Status Change
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Please review the order details and confirm the stage transition.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3.5">
            {/* Order and Company Card */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Order ID:</span>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15 font-mono font-bold text-xs px-2.5 py-0.5 border border-primary/25">
                  {activeOrder?.order_number || "ORDER"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground">Company:</span>
                <span className="font-semibold text-foreground truncate max-w-[230px] text-right">{companyName}</span>
              </div>

              {/* Status Transition Badges */}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground">Stage Update:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <Badge variant="outline" className={`text-[10px] py-0.5 px-2 ${getOrderStatusColor(activeOrder?.status)}`}>
                    {(activeOrder?.status || "").replace(/_/g, " ")}
                  </Badge>
                  <span className="text-muted-foreground">➔</span>
                  <Badge variant="outline" className={`text-[10px] py-0.5 px-2 ${getOrderStatusColor(pendingConfirmStatus)}`}>
                    {(pendingConfirmStatus || "").replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>

              {/* Service Scope in Confirmation Box */}
              {activeOrder?.items && activeOrder.items.length > 0 && (
                <div className="pt-2 border-t border-border/40 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground block">Service Scope:</span>
                  <div className="flex flex-wrap gap-1">
                    {activeOrder.items.map((item: any, i: number) => {
                      const svc = item.job_title || item.service_name || item.service?.job_title || item.name || "Service Package";
                      return (
                        <Badge key={i} variant="secondary" className="text-[10px] py-0.5 px-2 font-medium">
                          {svc}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded Documents Count Box */}
            <div className="p-3 rounded-xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Uploaded Documents</p>
                  <p className="text-[11px] text-muted-foreground">Documents uploaded for this order</p>
                </div>
              </div>
              <div>
                <Badge variant="outline" className={cn(
                  "text-xs font-bold font-mono px-2.5 py-0.5 border",
                  activeOrderDocsCount > 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                )}>
                  {activeOrderDocsCount} {activeOrderDocsCount === 1 ? "document" : "documents"}
                </Badge>
              </div>
            </div>

            {/* Contextual Guidance & Confirmation Message */}
            {pendingConfirmStatus === "FINAL_DOC_READY" ? (
              <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
                <span className="font-bold block text-xs mb-1 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Final Document Readiness:
                </span>
                Marking this order as Final Docs Ready indicates that legal final documents are available in the repository and the order will move to Completed.
              </div>
            ) : pendingConfirmStatus === "COMPLETED" ? (
              <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                <span className="font-bold block text-xs mb-1 text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Order Completion Notice:
                </span>
                Please ensure all final documents are uploaded before completing the order. Once completed, the order will be locked and assigned to Finance.
              </div>
            ) : (activeOrderDocsCount === 0 && ["DOCUMENTS_REVIEWED", "FINAL_DOCUMENT_PREPARATION"].includes(pendingConfirmStatus)) ? (
              <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                <span className="font-bold block text-xs mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Document Notice:
                </span>
                There are currently 0 documents uploaded for this order. You can still proceed if documents are being verified externally.
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-border/60 bg-muted/30 text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to change the status of order <span className="font-bold text-foreground">{activeOrder?.order_number}</span> to <span className="font-bold text-foreground">{(pendingConfirmStatus || "").replace(/_/g, " ")}</span>?
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-end gap-2.5 pt-3 border-t border-border/40">
            <Button 
              type="button" 
              variant="outline" 
              disabled={updatingOrderStatus}
              onClick={() => {
                setIsConfirmStatusOpen(false);
                setPendingConfirmStatus("");
              }}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              disabled={updatingOrderStatus}
              onClick={() => executeUpdateActiveOrderStatus(pendingConfirmStatus)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1.5"
            >
              {updatingOrderStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hold Reason Dialog */}
      <Dialog open={isHoldDialogOpen} onOpenChange={setIsHoldDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="flex items-center gap-2 text-amber-600 text-lg">
                <PauseCircle className="h-5 w-5" /> Put Order On Hold
              </DialogTitle>
              <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/30 font-mono text-xs font-bold px-2 py-0.5">
                {activeOrder?.order_number || "ORDER"}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Provide the reason and communication channel for placing order{" "}
              <span className="font-mono font-bold text-foreground">{activeOrder?.order_number}</span> on hold.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3">
            {/* Uploaded Documents Counter Box */}
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <FileText className="h-3.5 w-3.5 text-primary" /> Uploaded Documents:
              </span>
              <Badge variant="outline" className="text-xs font-mono font-bold bg-background">
                {activeOrderDocsCount} {activeOrderDocsCount === 1 ? "document" : "documents"} uploaded
              </Badge>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hold Reason / Blocker Details *</label>
              <Textarea
                placeholder="Describe what is blocking this order (e.g., waiting for client signature, missing passport scan)..."
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                className="text-xs min-h-[90px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channel</label>
              <Select value={holdChannel} onValueChange={(v: "CLIENT" | "INTERNAL") => setHoldChannel(v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT">Client Communication (Waiting on Client)</SelectItem>
                  <SelectItem value="INTERNAL">Internal Review / Department Blocker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHoldDialogOpen(false)} disabled={submittingHold}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={!holdReason.trim() || submittingHold}
              onClick={async () => {
                setSubmittingHold(true);
                await executeUpdateActiveOrderStatus("ON_HOLD", { reason: holdReason.trim(), channel: holdChannel });
                setSubmittingHold(false);
              }}
            >
              {submittingHold ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirm Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dual Order Chat Dialog */}
      {activeOrder && (
        <DualOrderChatDialog
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          orderNumber={activeOrder.order_number}
          orderTitle={activeOrder.items?.[0]?.service_name || activeOrder.items?.[0]?.name || "Order Workspace"}
          companyName={companyName}
          orderStatus={activeOrder.status}
        />
      )}

    </div>
  );
}
