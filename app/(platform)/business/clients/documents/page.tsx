"use client";

import React, { useEffect, useState } from "react";
import { 
  Building, 
  Search, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  ArrowLeft,
  Building2,
  FileText,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CompanyDocumentsDirectory() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { 
        headers: { "Authorization": `Bearer ${token}` } 
      });
      
      if (response.ok) {
        setCompanies(await response.json());
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCompanies = companies.filter(c => {
    const name = c.company_name || "";
    const code = c.company_code || "";
    const ind = c.industry || "";
    const contact = c.key_contact_person || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ind.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contact.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Only show active companies in document directory
    const matchesStatus = c.status === "ACTIVE";
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCompanies.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  const totalFoldersCount = companies.length;
  const compliantFoldersCount = companies.filter(c => c.tax_number).length;
  const parentPartnersCount = new Set(companies.map(c => c.client_id).filter(Boolean)).size;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/business/clients" className="mt-1">
            <Button variant="ghost" size="icon" title="Back to Clients">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm shrink-0 flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Company Documents</h1>
            <p className="text-muted-foreground text-sm">
              Manage and upload documents for assigned corporate partners.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Active Directories */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Active Vaults</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{totalFoldersCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Profiles */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Tax Compliance</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{compliantFoldersCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Parent Partners */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20 shrink-0">
              <Building className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Parent Partners</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{parentPartnersCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Cloud Repository */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Cloud Repository</p>
              <h3 className="text-base font-bold text-foreground leading-none mt-0.5">Dropbox Panel</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, code, contact or industry..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Companies Display Card */}
      <Card>

        <CardContent className="p-0">
          {filteredCompanies.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Building2 className="h-10 w-10 text-muted-foreground/35" />
              <span className="text-sm font-semibold">No Companies Found</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-4">Company Profile</th>
                    <th className="p-4">Parent Client</th>
                    <th className="p-4">Key Contact</th>
                    <th className="p-4">Tax & Location</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedCompanies.map((company) => {
                    return (
                      <tr key={company.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            {company.logo_url ? (
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}${company.logo_url}`}
                                alt={company.company_name}
                                className="h-10 w-10 rounded-lg object-cover border border-white/10 shadow bg-background"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold">
                                {company.company_name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="text-foreground font-semibold">
                                <span>{company.company_name}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                Code: <span className="font-mono text-foreground font-medium">{company.company_code}</span>
                                {company.industry && (
                                  <>
                                    <span>•</span>
                                    <span>{company.industry}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground space-y-1">
                          {company.client ? (
                            <>
                              <div className="text-foreground font-semibold flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                <span>{company.client.contact_person}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <Mail className="h-3 w-3 opacity-70" />
                                <span>{company.client.email}</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground italic font-normal text-xs">No Representative</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground space-y-1">
                          {company.key_contact_person ? (
                            <>
                              <div className="text-foreground font-semibold flex items-center gap-1">
                                <span>{company.key_contact_person}</span>
                              </div>
                              {company.key_contact_email && (
                                <div className="flex items-center gap-1.5 text-[10px] truncate max-w-[150px]">
                                  <Mail className="h-3 w-3 opacity-70" />
                                  <span className="truncate">{company.key_contact_email}</span>
                                </div>
                              )}
                              {company.key_contact_phone && (
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <Phone className="h-3 w-3 opacity-70" />
                                  <span>{company.key_contact_phone}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground italic font-normal text-xs">Not configured</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground space-y-1">
                          {company.tax_number && (
                            <div className="text-[11px]">
                              Tax ID: <span className="font-mono text-foreground font-semibold">{company.tax_number}</span>
                            </div>
                          )}
                          {company.address && (
                            <div className="flex items-start gap-1 text-[11px] max-w-[180px]" title={company.address}>
                              <MapPin className="h-3 w-3 opacity-70 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{company.address}</span>
                            </div>
                          )}
                          {!company.tax_number && !company.address && (
                            <span className="text-muted-foreground italic font-normal text-xs">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/business/clients/documents/${company.id}?from=company-docs`}>
                            <Button size="sm" variant="outline" className="gap-2">
                              <FileText className="h-4 w-4" />
                              Manage Documents
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(filteredCompanies.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{filteredCompanies.length}</span> entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
