"use client";

import React, { useEffect, useState, useRef } from "react";
import { useClient } from "../layout";
import { 
  FileText, 
  Download, 
  Upload, 
  Loader2, 
  Calendar, 
  User, 
  Plus, 
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert } from "lucide-react";

export default function SharedDocuments() {
  const { clientProfile, activeCompany, loading: contextLoading } = useClient();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchDocuments = async () => {
    if (contextLoading) return;
    if (!clientProfile || !activeCompany || !token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${activeCompany.id}/documents`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setDocuments(await response.json());
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [clientProfile, activeCompany, contextLoading]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !clientProfile || !activeCompany) return;

    setUploading(true);
    setSuccessMsg("");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${activeCompany.id}/documents`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to upload document");
      }

      setSuccessMsg(`Successfully uploaded "${file.name}"`);
      fetchDocuments();
    } catch (err: any) {
      console.error("Document upload error:", err);
      setErrorMsg(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Mounting secure partner filesystem...</p>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="flex h-[500px] items-center justify-center animate-in fade-in">
        <div className="flex flex-col items-center gap-3 text-center max-w-md p-8 rounded-2xl border border-dashed border-border bg-background/50">
          <ShieldAlert className="h-12 w-12 text-muted-foreground/30" />
          <h2 className="text-xl font-bold text-foreground">No Company Assigned</h2>
          <p className="text-sm text-muted-foreground">
            Please contact your system administrator to link a company to your profile before accessing documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Shared Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Access secure forms, contracts, project templates, and audits. Upload your own documents for consultant review.
          </p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadFile}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading file..." : "Upload New File"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-xs text-green-600 dark:text-green-400 font-medium">
          <CheckCircle2 className="h-4 w-4" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium">
          <AlertCircle className="h-4 w-4" /> {errorMsg}
        </div>
      )}

      {/* Main Files Display */}
      <Card className="border-border/40 bg-background/50 backdrop-blur-md">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold">Partner Folder</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">List of shared assets and contracts</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search file name..."
              className="pl-8 bg-background/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 border-t border-border/40">
              <FileText className="h-10 w-10 text-muted-foreground/35" />
              <span className="text-sm font-semibold">No Shared Files Found</span>
              <span className="text-xs text-muted-foreground/70">
                {searchTerm ? "No files match your search criteria." : "Start by uploading a document above."}
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-border/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-4">File Name</th>
                    <th className="p-4">Upload Date</th>
                    <th className="p-4">Author ID</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-semibold text-foreground flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="truncate max-w-[200px] sm:max-w-xs">{doc.file_name}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-primary/70" />
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-primary/70" />
                          User #{doc.uploaded_by}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                          <a href={`${process.env.NEXT_PUBLIC_API_URL}${doc.file_url}`} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
