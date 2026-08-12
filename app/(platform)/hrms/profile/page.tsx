"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Calendar, Briefcase, MapPin, Building, User, Wallet, Landmark, FileText, Monitor, Loader2, Save, Camera, Lock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";
import { resolveImageUrl } from "@/lib/utils";

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
          const token = localStorage.getItem("hrms_token");
          const headers = { Authorization: `Bearer ${token}` };
          const docRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/${employee.id}/documents`, { headers });
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
    setSaving(true);
    const token = localStorage.getItem("hrms_token");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
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
    const token = localStorage.getItem("hrms_token");
    
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
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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
    const token = localStorage.getItem("hrms_token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
      <div className="p-10 text-center text-destructive mb-4">{error || "Profile not found"}</div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Column: Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/40 bg-background/50 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center sticky top-24 shadow-lg">
            <div className="relative group">
              {employee.profile_photo ? (
                <img
                  src={resolveImageUrl(employee.profile_photo)}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  className="h-32 w-32 rounded-2xl object-cover border border-white/10 shadow-lg bg-background"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-primary/20 text-primary font-bold text-3xl border border-primary/10 shadow-lg">
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

            <h3 className="font-bold text-lg text-foreground mt-4">{employee.first_name} {employee.last_name}</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold mt-1">
              {employee.user?.role?.name || "No Designation"}
            </span>

            <div className="w-full space-y-3 pt-6 border-t border-border/40 text-left text-xs mt-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant={employee.status === "ACTIVE" ? "default" : "secondary"}>
                  {employee.status || "ACTIVE"}
                </Badge>
                <Badge variant="outline">{employee.employee_id_custom || `EMP-${employee.id.toString().padStart(4, '0')}`}</Badge>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground mt-4">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-foreground truncate">{employee.user?.email}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-foreground">{employee.phone || "No phone listed"}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Tabbed Details */}
        <div className="md:col-span-3 space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4 h-auto sm:h-12 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="personal" className="h-full gap-2 text-sm">
                <User className="h-4 w-4" /> Personal
              </TabsTrigger>
              <TabsTrigger value="employment" className="h-full gap-2 text-sm">
                <Briefcase className="h-4 w-4" /> Work
              </TabsTrigger>
              <TabsTrigger value="documents" className="h-full gap-2 text-sm">
                <FileText className="h-4 w-4" /> Docs
              </TabsTrigger>
              <TabsTrigger value="security" className="h-full gap-2 text-sm">
                <Lock className="h-4 w-4" /> Password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <Card className="border-border/40 bg-background/50 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Update Details</CardTitle>
                  <CardDescription>Keep your contact and emergency information up to date.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <Input 
                          value={editForm.phone} 
                          onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                          placeholder="Update phone..." 
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Address</label>
                        <textarea 
                          value={editForm.address} 
                          onChange={e => setEditForm({...editForm, address: e.target.value})} 
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Emergency Contact</label>
                        <Input 
                          value={editForm.emergency_contact} 
                          onChange={e => setEditForm({...editForm, emergency_contact: e.target.value})} 
                          placeholder="Name & Number" 
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={saving} className="mt-4 flex items-center gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card className="border-border/40 bg-background/50 backdrop-blur-md mt-6">
                <CardHeader>
                  <CardTitle>Read-only Information</CardTitle>
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4">
              <Card className="border-border/40 bg-background/50 backdrop-blur-md">
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
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4" /> Job Title</div>
                    <p className="font-medium">{employee.job_title || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4" /> Designation (Role)</div>
                    <p className="font-medium">{employee.user?.role?.name || "None Assigned"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4" /> Employment Type</div>
                    <p className="font-medium">{employee.employment_type || "Not specified"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Manager</div>
                    <p className="font-medium">{employee.manager ? `${employee.manager.first_name} ${employee.manager.last_name}` : "None"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Hire Date</div>
                    <p className="font-medium">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : "Unknown"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card className="border-border/40 bg-background/50 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>My Documents</CardTitle>
                  <CardDescription>Documents uploaded by HR.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {docsLoading ? (
                      <div className="flex justify-center p-8 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No documents found.</p>
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
                            <Button variant="ghost" size="sm">View</Button>
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4">
              <Card className="border-border/40 bg-background/50 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password to keep your account secure.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    {passwordError && (
                      <div className="p-3 text-sm rounded bg-destructive/10 border border-destructive/20 text-destructive">
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="p-3 text-sm rounded bg-green-500/10 border border-green-500/20 text-green-500">
                        {passwordSuccess}
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Password</label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={passwordLoading} className="mt-4 flex items-center gap-2">
                      {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Update Password
                    </Button>
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
