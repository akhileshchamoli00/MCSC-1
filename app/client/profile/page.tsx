"use client";

import React, { useState, useEffect, useRef } from "react";
import { useClient } from "../layout";
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  FileSpreadsheet, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Lock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ClientProfilePage() {
  const { clientProfile, activeCompany, loading: contextLoading, refreshProfile } = useClient();
  const [formData, setFormData] = useState({
    company_name: "",
    company_code: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    tax_number: "",
    industry: "",
    notes: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  useEffect(() => {
    if (contextLoading) return;
    if (!clientProfile || !activeCompany) {
      // No active company available
      return;
    }
    setFormData({
      company_name: activeCompany.company_name || "",
      company_code: activeCompany.company_code || "",
      contact_person: clientProfile.contact_person || "",
      email: clientProfile.email || "",
      phone: clientProfile.phone || "",
      address: activeCompany.address || "",
      tax_number: activeCompany.tax_number || "",
      industry: activeCompany.industry || "",
      notes: clientProfile.notes || ""
    });
  }, [clientProfile, activeCompany, contextLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !clientProfile) return;

    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      // 1. Update Client profile
      const clientPayload = {
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes
      };
      
      const resClient = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/${clientProfile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(clientPayload)
      });

      if (!resClient.ok) {
        const data = await resClient.json();
        throw new Error(data.detail || "Failed to update contact details");
      }

      // 2. Update Company profile
      const companyPayload = {
        company_name: formData.company_name,
        company_code: formData.company_code,
        address: formData.address,
        tax_number: formData.tax_number,
        industry: formData.industry
      };
      
      const resCompany = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${activeCompany.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(companyPayload)
      });

      if (!resCompany.ok) {
        const data = await resCompany.json();
        throw new Error(data.detail || "Failed to update company details");
      }

      setSuccessMsg("Profile updated successfully");
      await refreshProfile();
    } catch (err: any) {
      console.error("Profile update error:", err);
      setErrorMsg(err.message || "Failed to update profile details");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !clientProfile || !activeCompany) return;

    setLogoUploading(true);
    setSuccessMsg("");
    setErrorMsg("");

    const fileData = new FormData();
    fileData.append("file", file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${activeCompany.id}/logo`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: fileData
      });

      if (!response.ok) throw new Error("Failed to upload logo image");

      setSuccessMsg("Company logo updated successfully");
      await refreshProfile();
    } catch (err: any) {
      console.error("Logo upload error:", err);
      setErrorMsg(err.message || "Failed to upload logo image");
    } finally {
      setLogoUploading(false);
    }
  };



  if (!activeCompany && !contextLoading) {
    return (
      <div className="flex h-[500px] items-center justify-center animate-in fade-in">
        <div className="flex flex-col items-center gap-3 text-center max-w-md p-8 rounded-2xl border border-dashed border-border bg-background/50">
          <AlertCircle className="h-12 w-12 text-muted-foreground/30" />
          <h2 className="text-xl font-bold text-foreground">No Company Assigned</h2>
          <p className="text-sm text-muted-foreground">
            Please contact your system administrator to link a company to your profile before editing company details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Representative Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review company registration details, industry segments, tax files, and primary contacts.
        </p>
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

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Card: Company Logo & Profile Snapshot */}
        <Card className="md:col-span-4 border-border/40 bg-background/50 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="relative group">
            {activeCompany?.logo_url ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${activeCompany.logo_url}`}
                alt={activeCompany.company_name}
                className="h-32 w-32 rounded-2xl object-cover border border-white/10 shadow-lg bg-background"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-primary/20 text-primary font-bold text-4xl border border-primary/10 shadow-lg">
                {activeCompany?.company_name?.substring(0, 2).toUpperCase()}
              </div>
            )}
            <input
              type="file"
              ref={logoInputRef}
              onChange={handleLogoUpload}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg"
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity text-white text-xs font-semibold gap-1.5 cursor-pointer"
            >
              {logoUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <Camera className="h-4 w-4" /> Change Logo
                </>
              )}
            </button>
          </div>

          <h3 className="font-bold text-lg text-foreground mt-4">{activeCompany?.company_name}</h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold mt-1">
            {activeCompany?.company_code}
          </span>

          <div className="w-full space-y-3 pt-6 border-t border-border/40 text-left text-xs mt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">{clientProfile?.contact_person}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-foreground truncate">{clientProfile?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-4 w-4 text-primary" />
              <span className="text-foreground">{activeCompany?.industry || "Not Specified"}</span>
            </div>
          </div>
        </Card>

        {/* Right Card: Profile Form */}
        <Card className="md:col-span-8 border-border/40 bg-background/50 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Edit Company Details</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Update representative profile metadata</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="company_name">Company Name</label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="bg-background/40"
                    required
                  />
                </div>

                {/* Company Code (Locked) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1" htmlFor="company_code">
                    Company Code <Lock className="h-3 w-3 text-muted-foreground/60" />
                  </label>
                  <Input
                    id="company_code"
                    name="company_code"
                    value={formData.company_code}
                    disabled
                    className="bg-white/5 border-border/20 text-muted-foreground cursor-not-allowed"
                  />
                </div>

                {/* Contact Person */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="contact_person">Representative Contact</label>
                  <Input
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    className="bg-background/40"
                    required
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="email">Email Address</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-background/40"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="phone">Phone Number</label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-background/40"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="industry">Industry</label>
                  <Input
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="bg-background/40"
                  />
                </div>

                {/* Tax Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="tax_number">Tax ID / SST Number</label>
                  <Input
                    id="tax_number"
                    name="tax_number"
                    value={formData.tax_number}
                    onChange={handleChange}
                    className="bg-background/40"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="address">Registered Address</label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="bg-background/40"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
