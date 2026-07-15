"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Building2, UploadCloud, Download, FileText, Upload, PlusCircle, Paperclip, CheckCircle2, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

export default function CompanyDocumentsManagementPage() {
  const params = useParams();
  const companyId = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string>("Loading...");

  // Documents
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadRow, setUploadRow] = useState({ file: null as File | null, type: "", description: "", date: "" });
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const paginatedDocuments = documents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchInitialData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [compRes, docRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/documents`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (docRes.ok) setDocuments(await docRes.json());

      if (compRes.ok) {
        const allCompanies = await compRes.json();
        const thisCompany = allCompanies.find((c: any) => c.id.toString() === companyId);
        if (thisCompany) {
          setCompanyName(thisCompany.company_name);
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
  }, [companyId, token]);

  const handleUploadDocuments = async () => {
    if (!token || !uploadRow.file) return;
    setUploadingDocs(true);
    
    try {
      const formData = new FormData();
      formData.append("file", uploadRow.file);
      if (uploadRow.type) formData.append("document_type", uploadRow.type);
      if (uploadRow.description) formData.append("description", uploadRow.description);
      if (uploadRow.date) formData.append("document_date", uploadRow.date);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/documents`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Upload failed");
      }
      
      const newDoc = await res.json();
      
      // Update state directly with the new document
      setDocuments(prev => [...prev, newDoc]);
      setUploadRow({ file: null, type: "", description: "", date: "" });
      toast.success("Document uploaded successfully");
      
    } catch (err: any) {
      console.error("Upload failed", err);
      toast.error(`Failed to upload the document: ${err.message}`);
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
      
      if (!res.ok) {
        throw new Error("Failed to delete document");
      }
      
      setDocuments(prev => prev.filter(doc => doc.id !== deleteDocId));
      toast.success("Document deleted successfully");
      setDeleteDocId(null);
    } catch (err: any) {
      console.error("Delete failed", err);
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditDocument = async () => {
    if (!token || !editDoc) return;
    setIsEditing(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/documents/${editDoc.id}`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          document_type: editDoc.document_type || null,
          description: editDoc.description || null,
          document_date: editDoc.document_date || null
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to update document");
      }
      
      const updatedDoc = await res.json();
      setDocuments(prev => prev.map(doc => doc.id === editDoc.id ? updatedDoc : doc));
      toast.success("Document updated successfully");
      setEditDoc(null);
    } catch (err: any) {
      console.error("Edit failed", err);
      toast.error(err.message);
    } finally {
      setIsEditing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading documents...</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-[100rem] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/clients/documents">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{companyName}</h1>
              <p className="text-sm text-muted-foreground">Manage and upload documents</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Documents Section */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Company Documents</CardTitle>
              <CardDescription>Upload and maintain documents related to this company.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-12 text-center">No.</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Document Type</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date Generated</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date Uploaded</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                    {documents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center bg-muted/10 border-b">
                          <FileText className="mx-auto h-6 w-6 text-muted-foreground/40 mb-1" />
                          <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                        </td>
                      </tr>
                    )}
                    {paginatedDocuments.map((doc: any, index: number) => (
                      <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {doc.document_type || "Other"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                          {doc.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {doc.document_date ? format(new Date(doc.document_date), "MMM d, yyyy") : "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(doc.uploaded_at), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 flex items-center justify-end gap-2">
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary/80 hover:bg-primary/10 gap-1.5">
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </Button>
                          </a>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-1.5"
                            onClick={() => setEditDoc(doc)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10 gap-1.5"
                            onClick={() => setDeleteDocId(doc.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Quick Add Row */}
                    <tr className="bg-muted/5 border-t-2 border-border/60">
                      <td colSpan={6} className="p-4 md:p-6">
                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                          <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
                            <PlusCircle className="h-4 w-4 text-primary" />
                            <h4 className="text-sm font-semibold text-foreground">Quick Add Document</h4>
                          </div>
                          <div className="p-4 md:p-5">
                            <div className="flex flex-col lg:flex-row items-end gap-4 w-full">
                              <div className="space-y-1.5 w-full lg:w-48 xl:w-56 shrink-0">
                                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">Document Type</label>
                                <Input 
                                  placeholder="e.g. Legal, Tax..." 
                                  value={uploadRow.type}
                                  onChange={(e) => setUploadRow({ ...uploadRow, type: e.target.value })}
                                  className="h-10 text-sm bg-muted/20 w-full"
                                />
                              </div>
                              <div className="space-y-1.5 w-full lg:flex-1 min-w-[200px]">
                                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">Description</label>
                                <Input 
                                  placeholder="Brief description of the document..." 
                                  value={uploadRow.description}
                                  onChange={(e) => setUploadRow({ ...uploadRow, description: e.target.value })}
                                  className="h-10 text-sm bg-muted/20 w-full"
                                />
                              </div>
                              <div className="space-y-1.5 w-full lg:w-40 xl:w-48 shrink-0">
                                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">Date Generated</label>
                                <Input 
                                  type="date"
                                  value={uploadRow.date}
                                  onChange={(e) => setUploadRow({ ...uploadRow, date: e.target.value })}
                                  className="h-10 text-sm bg-muted/20 w-full"
                                />
                              </div>
                              
                              <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 pb-0">
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
                                    className={`h-10 gap-1.5 whitespace-nowrap ${uploadRow.file ? "border-primary/40 text-primary bg-primary/5" : "border-dashed"}`}
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    <Paperclip className="h-4 w-4" />
                                    {uploadRow.file ? <span className="max-w-[120px] xl:max-w-[150px] truncate">{uploadRow.file.name}</span> : "Attach File"}
                                  </Button>
                                  {uploadRow.file && (
                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md h-10">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> 
                                    </span>
                                  )}
                                </div>
                                
                                <Button 
                                  className="h-10 gap-1.5 font-semibold shadow-sm whitespace-nowrap"
                                  onClick={handleUploadDocuments} 
                                  disabled={uploadingDocs || !uploadRow.file}
                                >
                                  <Upload className="h-4 w-4" />
                                  {uploadingDocs ? "Uploading..." : "Upload Document"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {documents.length > itemsPerPage && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, documents.length)} of {documents.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm font-medium px-2">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

      </div>
        {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDocId} onOpenChange={(open) => !open && setDeleteDocId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the document from the server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDocId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocument} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Document Dialog */}
      <Dialog open={!!editDoc} onOpenChange={(open) => !open && setEditDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document Details</DialogTitle>
            <DialogDescription>
              Update the metadata for this document.
            </DialogDescription>
          </DialogHeader>
          
          {editDoc && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type</label>
                <Input 
                  value={editDoc.document_type || ""} 
                  onChange={(e) => setEditDoc({...editDoc, document_type: e.target.value})}
                  placeholder="e.g. Legal, Tax..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input 
                  value={editDoc.description || ""} 
                  onChange={(e) => setEditDoc({...editDoc, description: e.target.value})}
                  placeholder="Brief description..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Generated</label>
                <Input 
                  type="date"
                  value={editDoc.document_date ? editDoc.document_date.split('T')[0] : ""} 
                  onChange={(e) => setEditDoc({...editDoc, document_date: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)} disabled={isEditing}>
              Cancel
            </Button>
            <Button onClick={handleEditDocument} disabled={isEditing}>
              {isEditing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
