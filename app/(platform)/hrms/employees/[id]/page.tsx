"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Mail, Phone, Calendar, Briefcase, MapPin, Building, User, Wallet, Landmark, FileText, Monitor, Upload, Download, Loader2, Camera, Award, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolveImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function EmployeeProfilePage() {
  const params = useParams();
  const employeeId = params.id as string;
  
  const [employee, setEmployee] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("Contract");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  const fetchData = async () => {
    try {
      const [empRes, docRes, perfRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}`, {
      credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}/documents`, {
      credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/reviews?employee_id=${employeeId}`, {
      credentials: "include" })
      ]);
      
      if (empRes.ok) setEmployee(await empRes.json());
      else setError("Failed to fetch employee details.");
      
      if (docRes.ok) setDocuments(await docRes.json());
      if (perfRes.ok) setReviews(await perfRes.json());
      
    } catch (err) {
      console.error("Failed to load employee:", err);
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const handleFileUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    // Local validation for 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast.warning("Upload Failed: File size exceeds the 10MB maximum limit. Please choose a smaller file.", {
        style: {
          backgroundColor: "#2563eb",
          color: "#ffffff",
          borderColor: "#1d4ed8"
        }
      });
      return;
    }

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docType);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}/documents`, {
      credentials: "include",
        method: "POST",
        body: formData
      });
      
      if (res.ok) {
        toast.success("Document uploaded successfully.");
        await fetchData(); // Refresh documents
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast.error(`Failed to upload document: ${errorData.detail || "Server limit exceeded or connection closed (Max 10MB)"}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload Error: Failed to complete request. Please ensure the file is under 10MB and try again.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocumentConfirm = async () => {
    if (!deletingDocumentId) return;
    
    setIsDeletingDoc(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}/documents/${deletingDocumentId}`, {
      credentials: "include",
        method: "DELETE",
        });
      if (res.ok) {
        toast.success("Document deleted successfully");
        await fetchData();
        setDeletingDocumentId(null);
      } else {
        toast.error("Failed to delete document");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting document");
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const compressImage = async (file: File, maxWidth = 1000, quality = 0.85): Promise<File> => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith("image/")) {
        resolve(file);
        return;
      }
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            quality
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    let fileToUpload = file;
    try {
      fileToUpload = await compressImage(file);
    } catch (cErr) {
      console.warn("Photo compression fallback to original file", cErr);
    }

    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}/photo`, {
      credentials: "include",
        method: "POST",
        body: formData
      });
      
      if (res.ok) {
        toast.success("Photo uploaded successfully.");
        await fetchData(); // Refresh employee data to show new photo
        if (photoInputRef.current) photoInputRef.current.value = "";
      } else {
        toast.error("Failed to upload photo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading employee profile...</div>;

  if (error || !employee) {
    return (
      <div className="p-10 text-center space-y-4">
        <div className="text-destructive mb-4">{error || "Employee not found"}</div>
        <Link href="/hrms/employees"><Button variant="outline">Back to Directory</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Back Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/hrms/employees">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9 px-3.5 text-xs font-semibold bg-card/60 backdrop-blur-md border-border/50 shadow-xs hover:bg-muted cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Employees
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Summary Card */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="rounded-2xl border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md p-5 shadow-sm xl:sticky xl:top-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto pr-0.5">
            <div className="flex flex-col items-start text-left">
              {/* Profile Photo */}
              <div className="relative group shrink-0">
                {employee.profile_photo ? (
                  <img
                    src={resolveImageUrl(employee.profile_photo)}
                    alt={`${employee.first_name} ${employee.last_name}`}
                    className="h-24 w-24 rounded-2xl object-cover border border-white/10 shadow-md bg-background"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 font-bold text-2xl border border-emerald-500/20 shadow-md">
                    {employee.first_name?.[0] || ""}{employee.last_name?.[0] || ""}
                  </div>
                )}
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity text-white text-xs font-semibold gap-1.5 cursor-pointer"
                  title="Upload Profile Photo"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      <Camera className="h-4 w-4" /> Change Photo
                    </>
                  )}
                </button>
              </div>

              {/* Name & Role */}
              <div className="mt-3.5 min-w-0 w-full">
                <h2 className="font-bold text-lg text-foreground leading-tight truncate">{employee.first_name} {employee.last_name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">{employee.job_title || employee.department?.name || "Team Member"}</p>
                
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant={employee.status === "ACTIVE" ? "default" : "secondary"} className={employee.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold" : "text-[10px]"}>
                    {employee.status || "ACTIVE"}
                  </Badge>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                    {employee.user?.role?.name || "Employee"}
                  </span>
                </div>
              </div>

              {/* Information Strip */}
              <div className="w-full space-y-2.5 pt-4 border-t border-border/40 text-xs mt-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center border border-border/50 shrink-0">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Employee ID</p>
                    <p className="font-mono font-semibold text-foreground text-xs truncate">{employee.employee_id_custom || `EMP-${employee.id.toString().padStart(4, '0')}`}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Email Address</p>
                    <p className="font-medium text-foreground text-xs truncate">{employee.user?.email || "No email linked"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Phone</p>
                    <p className="font-medium text-foreground text-xs truncate">{employee.phone || "No phone listed"}</p>
                  </div>
                </div>

                {employee.address && (
                  <div className="flex items-start gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Address</p>
                      <p className="font-medium text-foreground text-xs leading-relaxed line-clamp-2">{employee.address}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full pt-3.5 border-t border-border/40 mt-3.5">
                <Link href={`/hrms/employees/${employee.id}/edit`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs font-semibold rounded-xl h-9 hover:bg-muted cursor-pointer">
                    <Edit className="h-3.5 w-3.5" /> Edit Employee
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Tabbed Details */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 p-1 rounded-2xl h-auto w-fit flex flex-wrap sm:flex-nowrap gap-1 mb-5 shadow-xs">
              <TabsTrigger value="personal" className="rounded-xl text-xs font-semibold px-3 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-emerald-500" /> Personal
              </TabsTrigger>
              <TabsTrigger value="employment" className="rounded-xl text-xs font-semibold px-3 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-emerald-500" /> Employment
              </TabsTrigger>
              <TabsTrigger value="bank" className="rounded-xl text-xs font-semibold px-3 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <Landmark className="h-3.5 w-3.5 text-emerald-500" /> Bank
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-xl text-xs font-semibold px-3 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-emerald-500" /> Documents
              </TabsTrigger>
              <TabsTrigger value="assets" className="rounded-xl text-xs font-semibold px-3 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <Monitor className="h-3.5 w-3.5 text-emerald-500" /> Assets
              </TabsTrigger>
              <TabsTrigger value="performance" className="rounded-xl text-xs font-semibold px-3 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-emerald-500" /> Performance
              </TabsTrigger>
            </TabsList>

            {/* Tab: Personal */}
            <TabsContent value="personal" className="space-y-5 mt-0">
              <Card className="rounded-2xl border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Full Name</div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.first_name} {employee.last_name}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Gender</div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.gender || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Date of Birth</div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.date_of_birth || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Nationality</div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.nationality || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Marital Status</div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.marital_status || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Emergency Contact</div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.emergency_contact || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Employment */}
            <TabsContent value="employment" className="space-y-5 mt-0">
              <Card className="rounded-2xl border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Employment Overview</CardTitle>
                </CardHeader>
                <CardContent className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Building className="h-3 w-3 text-emerald-500" /> Company
                    </div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.company_name || "MCS Consulting"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Building className="h-3 w-3 text-emerald-500" /> Department
                    </div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.department?.name || "None Assigned"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3 text-emerald-500" /> Job Title
                    </div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.job_title || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3 text-emerald-500" /> System Role
                    </div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.user?.role?.name || "None Assigned"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3 text-emerald-500" /> Employment Type
                    </div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.employment_type || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <User className="h-3 w-3 text-emerald-500" /> Manager
                    </div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : "None"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-emerald-500" /> Hire Date
                    </div>
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : "Unknown"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Bank */}
            <TabsContent value="bank" className="space-y-5 mt-0">
              <Card className="rounded-2xl border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Bank Account Information</CardTitle>
                </CardHeader>
                <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Bank Name</div>
                    <p className="font-semibold text-sm text-foreground">{employee.bank_name || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Account Number</div>
                    <p className="font-mono font-semibold text-sm text-foreground tracking-wider">{employee.bank_account_number || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Documents */}
            <TabsContent value="documents" className="space-y-5 mt-0">
              <Card className="rounded-2xl border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">Employee Documents</CardTitle>
                    <CardDescription className="text-xs">Securely store passports, contracts, and tax forms (Max 10MB).</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  
                  {/* Upload UI */}
                  <div className="bg-card/40 border border-border/50 rounded-2xl p-3.5 flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-1 space-y-1.5 w-full">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Document Type</label>
                      <Select value={docType} onValueChange={setDocType}>
                        <SelectTrigger className="w-full h-9 rounded-xl border-border/50 bg-background/70 px-3 py-1.5 text-xs font-semibold">
                          <SelectValue placeholder="Document Type" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="rounded-xl border-border/50">
                          <SelectItem value="Contract" className="text-xs cursor-pointer">Employment Contract</SelectItem>
                          <SelectItem value="Passport" className="text-xs cursor-pointer">Passport / ID</SelectItem>
                          <SelectItem value="Tax" className="text-xs cursor-pointer">Tax Form</SelectItem>
                          <SelectItem value="Bank" className="text-xs cursor-pointer">Bank Form</SelectItem>
                          <SelectItem value="Other" className="text-xs cursor-pointer">Other Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-1.5 w-full">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Select File</label>
                        <span className="text-[10px] text-muted-foreground">Max 10MB</span>
                      </div>
                      <Input type="file" ref={fileInputRef} className="cursor-pointer rounded-xl bg-background/70 border-border/50 h-9 text-xs" />
                    </div>
                    <Button onClick={handleFileUpload} disabled={uploadingDoc} className="w-full sm:w-auto flex items-center gap-2 rounded-xl h-9 px-4 text-xs font-bold shadow-sm cursor-pointer">
                      {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload
                    </Button>
                  </div>

                  {/* Document List */}
                  <div className="space-y-2.5">
                    {documents.length === 0 ? (
                      <div className="text-center p-6 text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                        <FileText className="h-7 w-7 mx-auto mb-2 opacity-50 text-emerald-500" />
                        <p className="text-xs">No documents uploaded yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/40 border border-border/40 rounded-2xl overflow-hidden">
                        {documents.map(doc => (
                          <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3 min-w-0 pr-4">
                              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
                                <FileText className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-foreground truncate">{doc.file_name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md">{doc.document_type}</Badge>
                                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <a href={resolveImageUrl(doc.file_url)} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-7.5 w-7.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer">
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </a>
                              <Button variant="ghost" size="icon" className="h-7.5 w-7.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-500/10 cursor-pointer" onClick={() => setDeletingDocumentId(doc.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tab: Assets */}
            <TabsContent value="assets" className="space-y-5 mt-0">
              <Card className="rounded-2xl border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Assigned Assets</CardTitle>
                  <CardDescription className="text-xs">Hardware and access devices assigned to this employee.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center p-6 text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                    <Monitor className="h-7 w-7 mx-auto mb-2 opacity-50 text-emerald-500" />
                    <p className="text-xs">Asset tracking integration active.</p>
                    <Link href="/hrms/assets">
                      <Button variant="link" className="mt-1.5 text-xs font-semibold text-emerald-500">Go to Assets Module to assign hardware</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Performance */}
            <TabsContent value="performance" className="space-y-5 mt-0">
              <Card className="rounded-2xl border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Performance History</CardTitle>
                  <CardDescription className="text-xs">Past performance cycles, evaluations, and target milestones.</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-3.5">
                  {reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.map((r, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl border border-border/40 bg-card/20 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-border/20 pb-2">
                            <div>
                              <p className="font-bold text-xs sm:text-sm text-foreground">{r.cycle?.name || "Review Cycle"}</p>
                              <p className="text-[10px] text-muted-foreground">Evaluator: {r.reviewer?.email || "Manager"}</p>
                            </div>
                            <Badge variant="outline" className={`font-bold text-[10px] ${
                              r.overall_rating === "Excellent" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              r.overall_rating === "Good" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              r.overall_rating === "Average" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                              "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            }`}>
                              {r.overall_rating}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider text-[9px]">Key Strengths</span>
                              <span className="text-foreground text-xs">{r.key_strengths || "N/A"}</span>
                            </div>
                            <div>
                              <span className="font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider text-[9px]">Areas for Improvement</span>
                              <span className="text-foreground text-xs">{r.improvement_areas || "N/A"}</span>
                            </div>
                          </div>

                          <div className="text-xs pt-1.5 border-t border-border/10">
                            <span className="font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider text-[9px]">Manager Comments</span>
                            <span className="text-foreground text-xs italic">"{r.comments || "No general comments listed."}"</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                      <Award className="h-7 w-7 mx-auto mb-2 opacity-50 text-emerald-500" />
                      <p className="text-xs">No evaluation cycles or active performance reviews found for this employee.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>

      {/* Delete Document Modal */}
      <Dialog open={!!deletingDocumentId} onOpenChange={(open) => !open && !isDeletingDoc && setDeletingDocumentId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Document
            </DialogTitle>
            <DialogDescription className="mt-2 text-foreground">
              Are you sure you want to delete this document?
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            This action cannot be undone. The file will be permanently removed from the employee's profile.
          </div>
          <DialogFooter className="mt-4 flex sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingDocumentId(null)} disabled={isDeletingDoc}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocumentConfirm} disabled={isDeletingDoc}>
              {isDeletingDoc ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                "Delete Document"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
