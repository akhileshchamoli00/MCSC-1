"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format, isBefore, differenceInDays } from "date-fns";
import { DropboxFileManager } from "@/components/dropbox-file-manager";

export default function CompanyDocumentsManagementPage() {
  const params = useParams();
  const companyId = params.id as string;
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>("Loading...");
  const [companyCode, setCompanyCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState("documents");

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
  const [selectedOrderNum, setSelectedOrderNum] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);

  // Activity Logs
  const [activities, setActivities] = useState<any[]>([]);

  // Search filter for docs
  const [documentSearchQuery, setDocumentSearchQuery] = useState("");

  const filteredDocuments = documents.filter((doc: any) => {
    const query = documentSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      (doc.document_type || "").toLowerCase().includes(query) ||
      (doc.description || "").toLowerCase().includes(query) ||
      (doc.order_number || "").toLowerCase().includes(query)
    );
  });


  const fetchInitialData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [compRes, docRes, stkRes, actRes, ordRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/documents`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/stakeholders`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/activities`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/orders`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (docRes.ok) setDocuments(await docRes.json());
      if (stkRes.ok) setStakeholders(await stkRes.json());
      if (actRes.ok) setActivities(await actRes.json());

      if (ordRes.ok) {
        const allOrders = await ordRes.json();
        const companyOrders = allOrders.filter((o: any) => o.company_id?.toString() === companyId);
        const uniqueOrderNums = Array.from(new Set(companyOrders.map((o: any) => o.order_number))) as string[];
        setOrderNumbers(uniqueOrderNums);
      }

      if (compRes.ok) {
        const allCompanies = await compRes.json();
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
    if (!token) return;
    if (!uploadRow.file) {
      toast.error("Please attach a file to upload.");
      return;
    }
    if (!selectedOrderNum) {
      toast.error("Please select a parent Order Number.");
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
      formData.append("order_number", selectedOrderNum);
      if (uploadRow.date) formData.append("document_date", uploadRow.date);
      if (uploadRow.expiry_date) formData.append("expiry_date", uploadRow.expiry_date);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/documents`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Save failed");
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
    if (!token || !deleteDocId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/documents/${deleteDocId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete document");
      setDocuments(prev => prev.filter(doc => doc.id !== deleteDocId));
      toast.success("Document deleted successfully");
      setDeleteDocId(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditDocument = async () => {
    if (!token || !editDoc) return;
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
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`
        },
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
    const previewUrl = `/api-proxy/api/clients/companies/${companyId}/documents/${doc.id}/preview?token=${token}`;
    setResolvedPreviewUrl(previewUrl);
  };

  const handleDownloadDocFile = async (doc: any) => {
    if (!token) return;
    if (!doc.file_url || doc.file_url === "#") {
      toast.error("No valid URL found for this document.");
      return;
    }

    if (doc.file_url.startsWith("/Clients/")) {
      const toastId = toast.loading("Generating secure Dropbox download link...");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dropbox/download?path=${encodeURIComponent(doc.file_url)}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        toast.dismiss(toastId);
        if (res.ok && data.success && data.link) {
          window.open(data.link, "_blank");
          toast.success("Download started!");
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
    }
  };
  // Stakeholder Creation
  const handleAddStakeholder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newStakeholder.name) return;
    setAddingStakeholder(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/stakeholders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/stakeholders/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
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
    if (!token || !editStakeholder || !editStakeholder.name) return;
    setSavingStakeholder(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/stakeholders/${editStakeholder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
    const role = typeof window !== "undefined" ? localStorage.getItem("user_role") : null;

    if (fromSource === "company-docs") {
      router.push("/business/clients/documents");
    } else if (fromSource === "assigned-orders") {
      router.push("/business/assigned-orders");
    } else if (fromSource === "orders") {
      router.push("/business/clients/orders");
    } else {
      if (role === "CLIENT") {
        router.push("/client/dashboard");
      } else {
        router.push("/business/clients/documents");
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                <DropboxFileManager basePath={`/Clients/${companyCode}`} title={`${companyName} Documents`} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 1: Legal Documents with Compliance Expiry */}
        <TabsContent value="documents" className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Corporate Legal Documents & Permits
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Upload and track license validity, KITAS permits, and expiration dates.
                </CardDescription>
              </div>
              <div className="w-64 relative shrink-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search documents..."
                  value={documentSearchQuery}
                  onChange={(e) => setDocumentSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs bg-muted/10 border-border/80 focus:bg-background transition-all"
                />
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
                          <td className="px-4 py-3 text-muted-foreground text-sm font-medium max-w-[450px] whitespace-normal break-words">
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
                              onClick={() => setEditDoc(doc)}
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
                <div className="flex flex-col md:flex-row gap-3 items-end w-full">
                  <div className="w-full md:w-[160px] shrink-0 relative">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Order Number *</label>
                    <div className="relative">
                      <Input
                        placeholder="Search orders..."
                        value={orderSearchQuery}
                        onChange={(e) => {
                          setOrderSearchQuery(e.target.value);
                          setOrderDropdownOpen(true);
                        }}
                        onFocus={() => setOrderDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setOrderDropdownOpen(false), 200)}
                        className="h-9 text-xs bg-muted/20 pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setOrderDropdownOpen(!orderDropdownOpen)}
                        className="absolute right-2 top-2.5 text-muted-foreground text-[10px]"
                      >
                        ▼
                      </button>
                    </div>
                    {orderDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md font-mono text-[11px]">
                        {orderNumbers
                          .filter(num => num.toLowerCase().includes(orderSearchQuery.toLowerCase()))
                          .slice(0, 30)
                          .map((num) => (
                            <div
                              key={num}
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
                            No orders found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-[130px] shrink-0">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Category *</label>
                    <Select
                      value={uploadRow.type}
                      onValueChange={(val) => setUploadRow({ ...uploadRow, type: val })}
                    >
                      <SelectTrigger className="h-9 text-xs bg-muted/20 w-full">
                        <SelectValue placeholder="Choose type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Client ID">Client ID</SelectItem>
                        <SelectItem value="Photo">Photo</SelectItem>
                        <SelectItem value="Signed Docs">Signed Docs</SelectItem>
                        <SelectItem value="Final Docs">Final Docs</SelectItem>
                        <SelectItem value="Invoice">Invoice</SelectItem>
                        <SelectItem value="Misc Docs">Misc Docs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full md:flex-grow md:flex-1">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Description</label>
                    <Input
                      placeholder="Brief scope..."
                      value={uploadRow.description}
                      onChange={(e) => setUploadRow({ ...uploadRow, description: e.target.value })}
                      className="h-9 text-xs bg-muted/20"
                    />
                  </div>

                  <div className="w-full md:w-[200px] shrink-0">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">Issue Date</label>
                    <Input
                      type="date"
                      value={uploadRow.date}
                      onChange={(e) => setUploadRow({ ...uploadRow, date: e.target.value })}
                      className="h-9 text-xs bg-muted/20"
                    />
                  </div>

                  <div className="w-full md:w-[200px] shrink-0">
                    <label className="text-[11px] uppercase tracking-wider text-amber-600 font-semibold block mb-1">Expiry Date (Alerts)</label>
                    <Input
                      type="date"
                      value={uploadRow.expiry_date}
                      onChange={(e) => setUploadRow({ ...uploadRow, expiry_date: e.target.value })}
                      className="h-9 text-xs bg-amber-500/5 border-amber-500/30"
                    />
                  </div>
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
                    disabled={uploadingDocs || !uploadRow.file || !selectedOrderNum || !uploadRow.type}
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
                      <SelectContent>
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
                    <Input
                      placeholder="e.g. +62 812..."
                      value={newStakeholder.phone}
                      onChange={(e) => setNewStakeholder({ ...newStakeholder, phone: e.target.value })}
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Email Address</label>
                    <Input
                      type="email"
                      placeholder="e.g. contact@domain.com"
                      value={newStakeholder.email}
                      onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })}
                      className="h-9 text-xs bg-background"
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
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Corporate Activity Audit Log
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time chronological timeline of orders issued, document uploads, and stakeholder changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No activity history recorded for this company yet.
                </div>
              ) : (
                <div className="relative border-l border-primary/20 ml-4 space-y-6 py-2">
                  {activities.map((act) => (
                    <div key={act.id} className="relative pl-6">
                      <span className="absolute -left-2 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] font-mono font-bold uppercase text-primary border-primary/30">
                          {act.action_type}
                        </Badge>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                          {act.performed_by && (
                            <span className="font-semibold text-foreground/80 bg-muted px-1.5 py-0.5 rounded border border-border">
                              By: {act.performed_by}
                            </span>
                          )}
                          <span>
                            {format(new Date(act.created_at), "MMM d, yyyy HH:mm")}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground mt-1">{act.description}</p>
                    </div>
                  ))}
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
                  <SelectContent>
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
                  className="text-xs bg-muted/20"
                  rows={3}
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Order Number</label>
                <Input
                  value={editDoc.order_number || ""}
                  onChange={(e) => setEditDoc({ ...editDoc, order_number: e.target.value })}
                  className="h-9 text-xs font-mono font-bold"
                />
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
        <div className={`fixed top-[104px] bottom-0 right-0 left-0 md:left-[260px] z-30 bg-background/98 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-between overflow-hidden duration-300 border-l border-t border-border shadow-2xl ${isClosingPreview ? "animate-out slide-out-to-right" : "animate-in slide-in-from-right"}`}>
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

    </div>
  );
}
