"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Calendar, Briefcase, MapPin, Building, User, Wallet, Landmark, FileText, Monitor, Loader2, Save, Camera, Lock, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";
import { resolveImageUrl } from "@/lib/utils";
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/phone-input";

export default function MyProfilePage() {
  const { profile: employee, refreshProfile, loading } = useUser();
  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Password Change Fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Editable fields
  const [editForm, setEditForm] = useState({
    phone: "",
    address: "",
    emergency_contact: "",
    profile_photo: ""
  });
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (employee) {
      setEditForm({
        phone: employee.phone || "",
        address: employee.address || "",
        emergency_contact: employee.emergency_contact || "",
        profile_photo: employee.profile_photo || ""
      });
    }
  }, [employee]);

  useEffect(() => {
    if (employee?.id) {
      const fetchDocs = async () => {
        setDocsLoading(true);
        try {
          const docRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employee.id}/documents`, {
      credentials: "include" });
          if (docRes.ok) setDocuments(await docRes.json());
        } catch (e) {
          console.error("Failed to load documents", e);
        } finally {
          setDocsLoading(false);
        }
      };
      fetchDocs();
    }
  }, [employee?.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editForm.phone && !isValidPhoneNumber(editForm.phone)) {
      toast.error("Please enter a valid phone number (6 to 15 digits).");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/`, {
      credentials: "include",
        method: "PUT",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(editForm)
      });
      
      if (res.ok) {
        toast.success("Profile updated successfully!");
        await refreshProfile();
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating profile.");
    } finally {
      setSaving(false);
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
    if (!file || !employee?.id) return;

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employee.id}/photo`, {
      credentials: "include",
        method: "POST",
        body: formData
      });
      
      if (res.ok) {
        toast.success("Profile photo uploaded successfully!");
        await refreshProfile(); // Refresh employee data to show new photo
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/change-password`, {
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (res.ok) {
        setPasswordSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setPasswordError(data.detail || "Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      setPasswordError("Error updating password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading your profile...</div>;

  if (error || !employee) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 text-center bg-card/60 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">Profile Not Loaded</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {error || "Could not locate the linked employee profile for your user account."}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Button 
            variant="default" 
            size="sm"
            onClick={() => refreshProfile()}
            className="rounded-xl text-xs font-semibold"
          >
            Retry Loading Profile
          </Button>
          <Link href="/hrms/dashboard">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Profile Summary Card */}
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

              {/* Name & Title */}
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
                    <p className="font-medium text-foreground text-xs truncate">{employee.user?.email || "No email"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Phone</p>
                    <p className="font-medium text-foreground text-xs truncate">{employee.phone || "Not provided"}</p>
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
            </div>
          </Card>
        </div>

        {/* Right Column: Tabbed Details */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-5">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 p-1 rounded-2xl h-auto w-fit flex flex-wrap sm:flex-nowrap gap-1 mb-5 shadow-xs">
              <TabsTrigger value="personal" className="rounded-xl text-xs font-semibold px-3.5 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-emerald-500" /> Personal
              </TabsTrigger>
              <TabsTrigger value="employment" className="rounded-xl text-xs font-semibold px-3.5 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-emerald-500" /> Employment
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-xl text-xs font-semibold px-3.5 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-emerald-500" /> Documents
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-xl text-xs font-semibold px-3.5 py-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-emerald-500" /> Security
              </TabsTrigger>
            </TabsList>

            {/* Tab: Personal */}
            <TabsContent value="personal" className="space-y-5 mt-0">
              <Card className="rounded-2xl border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Update Personal Details</CardTitle>
                  <CardDescription className="text-xs">Keep your contact and emergency information up to date.</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                        <PhoneInput 
                          value={editForm.phone} 
                          onChange={(val) => setEditForm({ ...editForm, phone: val })} 
                          placeholder="812 3456 789" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Emergency Contact</label>
                        <Input 
                          value={editForm.emergency_contact} 
                          onChange={e => setEditForm({...editForm, emergency_contact: e.target.value})} 
                          placeholder="Contact Name & Phone Number" 
                          className="rounded-xl bg-background/70 border-border/50 h-9.5 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Address</label>
                        <textarea 
                          value={editForm.address} 
                          onChange={e => setEditForm({...editForm, address: e.target.value})} 
                          placeholder="Street, District, City, Province, Postal Code"
                          className="flex min-h-[75px] w-full rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button type="submit" disabled={saving} className="gap-2 font-bold shadow-sm rounded-xl h-9 px-5 text-xs cursor-pointer">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              <Card className="rounded-2xl border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Verified Personal Information</CardTitle>
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
                      <Briefcase className="h-3 w-3 text-emerald-500" /> Type
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

            {/* Tab: Documents */}
            <TabsContent value="documents" className="space-y-5 mt-0">
              <Card className="rounded-2xl border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">My Documents</CardTitle>
                  <CardDescription className="text-xs">Official employee records and documents uploaded by HR.</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-3">
                    {docsLoading ? (
                      <div className="flex justify-center p-6 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center p-6 text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                        <FileText className="h-7 w-7 mx-auto mb-2 opacity-50 text-emerald-500" />
                        <p className="text-xs">No documents available.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/40 border border-border/40 rounded-2xl overflow-hidden">
                        {documents.map(doc => (
                          <div key={doc.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
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
                            <a href={resolveImageUrl(doc.file_url)} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer">
                              <Download className="h-3.5 w-3.5" />
                              <span>Download</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tab: Security */}
            <TabsContent value="security" className="space-y-5 mt-0">
              <Card className="rounded-2xl border-border/40 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/40 py-3.5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground">Change Password</CardTitle>
                  <CardDescription className="text-xs">Update your account credentials to keep your account secure.</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <form onSubmit={handlePasswordChange} className="space-y-3.5 max-w-sm">
                    {passwordError && (
                      <div className="p-3 text-xs rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Current Password</label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-xl bg-background/70 border-border/50 h-9.5 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-xl bg-background/70 border-border/50 h-9.5 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-xl bg-background/70 border-border/50 h-9.5 text-xs"
                        required
                      />
                    </div>
                    <div className="pt-1">
                      <Button type="submit" disabled={passwordLoading} className="gap-2 font-bold shadow-sm rounded-xl h-9 px-5 text-xs cursor-pointer">
                        {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Update Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}
