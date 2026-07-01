"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit, Mail, Phone, Calendar, Briefcase, MapPin, Building, User, Wallet, Landmark, FileText, Monitor, Upload, Download, Loader2, Camera, Award } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolveImageUrl } from "@/lib/utils";
import { toast } from "sonner";

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

  const fetchData = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [empRes, docRes, perfRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}/documents`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/reviews?employee_id=${employeeId}`, { headers })
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
    const token = localStorage.getItem("hrms_token");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docType);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const token = localStorage.getItem("hrms_token");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employeeId}/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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
        <Link href="/employees"><Button variant="outline">Back to Directory</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Employee Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Column: Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden sticky top-24">
            <div className="h-24 bg-primary/10 w-full relative">
              <Link href={`/employees/${employee.id}/edit`}>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-background/50 backdrop-blur-sm rounded-full h-8 w-8 hover:bg-background/80">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <CardContent className="pt-0 relative">
              <div className="absolute -top-12 left-6 h-24 w-24 rounded-full border-4 border-card bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-sm overflow-hidden group">
                {employee.profile_photo ? (
                  <img src={resolveImageUrl(employee.profile_photo)} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`
                )}
                
                {/* Photo Upload Overlay */}
                <div 
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {uploadingPhoto ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Camera className="h-6 w-6 text-white" />}
                </div>
                <input 
                  type="file" 
                  ref={photoInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                />
              </div>
              <div className="pt-16 space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{employee.first_name} {employee.last_name}</h2>
                  <p className="text-sm font-medium text-primary mt-0.5">{employee.user?.role?.name || "No Designation"}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant={employee.status === "ACTIVE" ? "default" : "secondary"}>
                    {employee.status || "ACTIVE"}
                  </Badge>
                  <Badge variant="outline">{employee.employee_id_custom || `EMP-${employee.id.toString().padStart(4, '0')}`}</Badge>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/50 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    {employee.user?.email ? (
                      <a href={`mailto:${employee.user.email}`} className="hover:underline truncate">{employee.user.email}</a>
                    ) : (
                      <span className="text-muted-foreground italic">No email linked</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    {employee.phone ? (
                      <a href={`tel:${employee.phone}`} className="hover:underline">{employee.phone}</a>
                    ) : (
                      <span className="text-muted-foreground italic">No phone listed</span>
                    )}
                  </div>
                  {employee.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{employee.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabbed Details */}
        <div className="md:col-span-3 space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4 h-auto sm:h-12 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="personal" className="h-full gap-2 text-sm">
                <User className="h-4 w-4" /> <span className="hidden lg:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="employment" className="h-full gap-2 text-sm">
                <Briefcase className="h-4 w-4" /> <span className="hidden lg:inline">Employment</span>
              </TabsTrigger>
              <TabsTrigger value="bank" className="h-full gap-2 text-sm">
                <Landmark className="h-4 w-4" /> <span className="hidden lg:inline">Bank</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="h-full gap-2 text-sm">
                <FileText className="h-4 w-4" /> <span className="hidden lg:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="assets" className="h-full gap-2 text-sm">
                <Monitor className="h-4 w-4" /> <span className="hidden lg:inline">Assets</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="h-full gap-2 text-sm">
                <Award className="h-4 w-4" /> <span className="hidden lg:inline">Performance</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                    <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Gender</div>
                    <p className="font-medium">{employee.gender || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Date of Birth</div>
                    <p className="font-medium">{employee.date_of_birth || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Nationality</div>
                    <p className="font-medium">{employee.nationality || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Marital Status</div>
                    <p className="font-medium">{employee.marital_status || "Not specified"}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2 pt-2 border-t border-border/50">
                    <div className="text-sm font-medium text-muted-foreground">Emergency Contact</div>
                    <p className="font-medium">{employee.emergency_contact || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Employment Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Building className="h-4 w-4" /> Company</div>
                    <p className="font-medium">{employee.company_name || "MCS Consulting"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Building className="h-4 w-4" /> Department</div>
                    <p className="font-medium">{employee.department?.name || "None Assigned"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4" /> Designation</div>
                    <p className="font-medium">{employee.user?.role?.name || "None Assigned"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Manager</div>
                    <p className="font-medium">{employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : "None"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Hire Date</div>
                    <p className="font-medium">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : "Unknown"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4" /> Type</div>
                    <p className="font-medium">{employee.employment_type || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


            
            <TabsContent value="bank" className="space-y-4">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Bank Account Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Bank Name</div>
                    <p className="font-medium text-lg">{employee.bank_name || "Not provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Account Number</div>
                    <p className="font-medium text-lg font-mono tracking-wider">{employee.bank_account_number || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Employee Documents</CardTitle>
                    <CardDescription>Securely store passports, contracts, and tax forms (Max file size: 10MB).</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Upload UI */}
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-4 flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1 space-y-2 w-full">
                      <label className="text-sm font-medium">Document Type</label>
                      <Select value={docType} onValueChange={setDocType}>
                        <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                          <SelectValue placeholder="Document Type" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="Contract">Employment Contract</SelectItem>
                          <SelectItem value="Passport">Passport / ID</SelectItem>
                          <SelectItem value="Tax">Tax Form</SelectItem>
                          <SelectItem value="Bank">Bank Form</SelectItem>
                          <SelectItem value="Other">Other Document</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Select File</label>
                        <span className="text-[10px] text-muted-foreground">Max 10MB</span>
                      </div>
                      <Input type="file" ref={fileInputRef} className="cursor-pointer" />
                    </div>
                    <Button onClick={handleFileUpload} disabled={uploadingDoc} className="w-full sm:w-auto flex items-center gap-2">
                      {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload
                    </Button>
                  </div>

                  {/* Document List */}
                  <div className="space-y-3">
                    {documents.length === 0 ? (
                      <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No documents uploaded yet.</p>
                      </div>
                    ) : (
                      documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border border-border/50 rounded-md hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{doc.file_name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm">{doc.document_type}</Badge>
                                <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <a href={resolveImageUrl(doc.file_url)} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assets" className="space-y-4">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Assigned Assets</CardTitle>
                  <CardDescription>Hardware and access cards assigned to this employee.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                    <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Asset tracking integration active.</p>
                    <Link href="/assets">
                      <Button variant="link" className="mt-2">Go to Assets Module to assign hardware</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle>Performance History</CardTitle>
                  <CardDescription>Past performance cycles, evaluations, and target milestones.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((r, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-border/40 bg-card/20 space-y-3">
                          <div className="flex items-center justify-between border-b border-border/20 pb-2">
                            <div>
                              <p className="font-bold text-sm text-foreground">{r.cycle?.name || "Review Cycle"}</p>
                              <p className="text-[10px] text-muted-foreground">Evaluator: {r.reviewer?.email || "Manager"}</p>
                            </div>
                            <Badge variant="outline" className={`font-bold ${
                              r.overall_rating === "Excellent" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              r.overall_rating === "Good" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              r.overall_rating === "Average" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                              "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            }`}>
                              {r.overall_rating}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider text-[9px]">Key Strengths</span>
                              <span className="text-foreground">{r.key_strengths || "N/A"}</span>
                            </div>
                            <div>
                              <span className="font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider text-[9px]">Areas for Improvement</span>
                              <span className="text-foreground">{r.improvement_areas || "N/A"}</span>
                            </div>
                          </div>

                          <div className="text-xs pt-2 border-t border-border/10">
                            <span className="font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider text-[9px]">Manager Comments</span>
                            <span className="text-foreground italic">"{r.comments || "No general comments listed."}"</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                      <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No evaluation cycles or active performance reviews found for this employee.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}
