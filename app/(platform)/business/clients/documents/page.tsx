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
  Building2,
  FileText,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/contexts/user-context";
import { formatPhoneNumber } from "@/lib/utils";
import { TablePagination } from "@/components/ui/pagination";

export default function CompanyDocumentsDirectory() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_documents", "view");

  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Authorization Check & Redirect
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to access Documents.");
      if (hasPermission("clients_my", "view")) {
        router.replace("/business/assigned-orders");
      } else {
        router.replace("/business/dashboard");
      }
    }
  }, [userLoading, canView, hasPermission, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    if (userLoading || !canView) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, {
        credentials: "include", 
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
    if (!userLoading && canView) {
      fetchData();
    }
  }, [userLoading, canView]);

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

  if (userLoading || (!canView && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Verifying document repository permissions...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MINIMALIST METRIC RIBBON */}
      <div className="flex flex-col lg:flex-row items-stretch gap-3 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 flex-1 divide-y md:divide-y-0 md:divide-x divide-border/50 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs">
          <div className="flex items-center gap-3 px-3 py-1.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Vaults</p>
              <p className="text-lg font-bold tracking-tight">{totalFoldersCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-1.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tax Compliance</p>
              <p className="text-lg font-bold tracking-tight">{compliantFoldersCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-1.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Parent Partners</p>
              <p className="text-lg font-bold tracking-tight">{parentPartnersCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-1.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cloud Repository</p>
              <p className="text-lg font-bold tracking-tight">Dropbox Panel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Display Card */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <div className="p-4 bg-muted/20 border-b border-border/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, code, contact or industry..."
              className="pl-8 h-9 text-xs rounded-xl bg-background/70 border-border/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold tracking-wider">
            Showing {paginatedCompanies.length} of {filteredCompanies.length} entries
          </span>
        </div>

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
                  <tr className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                    <th className="p-4">Company Profile</th>
                    <th className="p-4">Parent Client</th>
                    <th className="p-4">Key Contact</th>
                    <th className="p-4">Tax & Location</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedCompanies.map((company) => {
                    return (
                      <tr key={company.id} className="hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0">
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
                                  <span>{formatPhoneNumber(company.key_contact_phone)}</span>
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

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            startIndex={startIndex}
            endIndex={endIndex}
            totalEntries={filteredCompanies.length}
          />
        </CardContent>
      </Card>
    </div>
  );
}
