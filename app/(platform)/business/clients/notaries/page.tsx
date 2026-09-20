"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Scale, 
  Search, 
  Plus, 
  Loader2, 
  Edit2, 
  Trash2, 
  DollarSign, 
  Check, 
  Building2,
  Tag,
  MapPin,
  ShieldCheck,
  Building,
  CreditCard,
  Landmark,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";

const formatUserName = (userObj: any, fallback = "Staff") => {
  if (!userObj) return fallback;
  if (userObj.employee) {
    const fn = (userObj.employee.first_name || "").trim();
    const ln = (userObj.employee.last_name || "").trim();
    const fullName = `${fn} ${ln}`.trim();
    if (fullName) return fullName;
  }
  if (userObj.name && typeof userObj.name === "string" && !userObj.name.includes("@")) {
    return userObj.name;
  }
  if (userObj.email && typeof userObj.email === "string") {
    const prefix = userObj.email.split("@")[0];
    const clean = prefix.replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()).trim();
    if (clean) return clean;
  }
  return fallback;
};

export default function NotariesPage() {
  const router = useRouter();
  const { isAdmin, hasPermission, loading: userLoading } = useUser();
  const canView = isAdmin || hasPermission("clients_notaries", "view");

  const [notaries, setNotaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [validationFilter, setValidationFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [serviceFees, setServiceFees] = useState<Record<number, string>>({});

  // Authorization Check & Redirect
  useEffect(() => {
    if (!userLoading && !canView) {
      toast.error("Access Denied: You do not have permission to access Vendors.");
      if (hasPermission("clients_my", "view")) {
        router.replace("/business/assigned-orders");
      } else {
        router.replace("/business/dashboard");
      }
    }
  }, [userLoading, canView, hasPermission, router]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, cityFilter, statusFilter, validationFilter, typeFilter]);

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedNotary, setSelectedNotary] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const fetchNotaries = async () => {
    if (userLoading || !canView) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/`, {
      credentials: "include",
        });
      if (res.ok) {
        const data = await res.json();
        setNotaries(data);
      } else {
        toast.error("Failed to load notaries directory");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching notaries list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && canView) {
      fetchNotaries();
    }
  }, [userLoading, canView]);

  const handleDeleteSubmit = async () => {
    if (!selectedNotary) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/${selectedNotary.id}`, {
      credentials: "include",
        method: "DELETE",
        });

      if (res.ok) {
        toast.success("Notary record deleted successfully!");
        setIsDeleteOpen(false);
        fetchNotaries();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to delete notary record");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting notary record");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
  };

  // Unique Cities list for dropdown filter
  const uniqueCities = Array.from(new Set(notaries.map(n => n.city).filter(Boolean)));

  // Metrics calculations
  const totalNotariesCount = notaries.length;
  const validatedVendorsCount = notaries.filter(n => n.validation_status === "VALIDATED").length;
  const pendingVendorsCount = notaries.filter(n => !n.validation_status || n.validation_status === "PENDING_VALIDATION").length;
  const activeNotariesCount = notaries.filter(n => n.status === "ACTIVE").length;
  const totalConfiguredFees = notaries.reduce((acc, curr) => acc + (curr.service_fees?.length || 0), 0);
  
  // Calculate top city
  const cityCounts = notaries.reduce((acc: any, curr) => {
    if (curr.city) {
      acc[curr.city] = (acc[curr.city] || 0) + 1;
    }
    return acc;
  }, {});
  let topCity = "N/A";
  let maxCount = 0;
  Object.keys(cityCounts).forEach(c => {
    if (cityCounts[c] > maxCount) {
      maxCount = cityCounts[c];
      topCity = c;
    }
  });

  // Filtered List
  const filteredNotaries = notaries.filter((notary) => {
    const matchesSearch = 
      notary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notary.email && notary.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (notary.notes && notary.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCity = cityFilter === "all" || notary.city === cityFilter;
    const matchesStatus = statusFilter === "all" || notary.status === statusFilter;
    
    const valStatus = notary.validation_status || "PENDING_VALIDATION";
    const matchesValidation = validationFilter === "ALL" ||
      (validationFilter === "VALIDATED" && valStatus === "VALIDATED") ||
      (validationFilter === "PENDING" && valStatus === "PENDING_VALIDATION") ||
      (validationFilter === "REVISION" && valStatus === "NEEDS_REVISION");

    let matchesType = true;
    if (typeFilter === "NOTARY") {
      matchesType = notary.vendor_type === "NOTARY" || notary.is_notary;
    } else if (typeFilter === "GOVERNMENT_OFFICER") {
      matchesType = notary.vendor_type === "GOVERNMENT_OFFICER" || notary.is_gov_officer;
    } else if (typeFilter === "OTHER_VENDORS") {
      matchesType = notary.vendor_type === "OTHER_VENDORS" || notary.is_other_vendor;
    }

    return matchesSearch && matchesCity && matchesStatus && matchesValidation && matchesType;
  });

  const totalPages = Math.ceil(filteredNotaries.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedNotaries = filteredNotaries.slice(startIndex, endIndex);

  if (userLoading || (!canView && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Verifying vendor catalog permissions...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading notaries directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-none pb-12">
      
      {/* Minimalist Metrics Strip & Action Button Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Vendors */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <Scale className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Vendors</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalNotariesCount}</p>
            </div>
          </div>

          {/* Verified Vendors */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Verified Vendors</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{validatedVendorsCount}</p>
            </div>
          </div>

          {/* Pending Validation */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Pending</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{pendingVendorsCount}</p>
            </div>
          </div>

          {/* Active Vendors */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Active Vendors</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{activeNotariesCount}</p>
            </div>
          </div>
        </div>

        {/* Add New Vendor Button */}
        <Link href="/business/clients/notaries/new" className="shrink-0 flex items-stretch">
          <Button className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm">
            <Plus className="h-4 w-4" /> Add New Vendor
          </Button>
        </Link>
      </div>

      {/* Main Notary Table Card */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <div className="p-4 bg-muted/20 border-b border-border/40 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
            {/* Search input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Vendor name, email, or city..."
                className="pl-8 h-9 text-xs rounded-xl bg-background/70 border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Validation Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-lg border border-border/40">
              {[
                { id: "ALL", label: "All" },
                { id: "VALIDATED", label: "Verified 🛡️" },
                { id: "PENDING", label: "Pending ⏳" },
                { id: "REVISION", label: "Revision ⚠️" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setValidationFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all
                    ${validationFilter === tab.id 
                      ? "bg-background shadow-sm text-foreground font-bold" 
                      : "text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Vendor Type Filter */}
            <div className="w-full sm:w-44">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 rounded-xl text-xs font-medium">
                  <SelectValue placeholder="Vendor Type" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" sideOffset={4}>
                  <SelectItem value="all">All Vendor Types</SelectItem>
                  <SelectItem value="NOTARY">Notary</SelectItem>
                  <SelectItem value="GOVERNMENT_OFFICER">Government Body</SelectItem>
                  <SelectItem value="OTHER_VENDORS">Other Vendors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City Filter */}
            <div className="w-full sm:w-36">
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="h-9 rounded-xl text-xs font-medium">
                  <SelectValue placeholder="Filter City" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" sideOffset={4}>
                  <SelectItem value="all">All Cities</SelectItem>
                  {uniqueCities.map((city, i) => (
                    <SelectItem key={i} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-32">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 rounded-xl text-xs font-medium">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" sideOffset={4}>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {filteredNotaries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Scale className="h-10 w-10 text-muted-foreground/35" />
              <span className="text-sm font-semibold">No Vendors Found</span>
              <p className="text-xs max-w-sm">Click "Add New Vendor" above to register your first partner vendor.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground/90 font-extrabold uppercase border-b border-border/40 select-none">
                    <th className="py-3 px-4 w-1/4">Vendor Name</th>
                    <th className="py-3 px-4">Contact Detail</th>
                    <th className="py-3 px-4">Bank & Payout Details</th>
                    <th className="py-3 px-4">Jurisdiction (City)</th>
                    <th className="py-3 px-4 text-right">Configured Services</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/25">
                  {paginatedNotaries.map((notary) => (
                    <tr 
                      key={notary.id} 
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-foreground align-top">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Building className="h-4 w-4 text-indigo-500/80 shrink-0" />
                          <span>{notary.name}</span>
                          {notary.validation_status === "VALIDATED" && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-500/20" title={`Validated by ${formatUserName(notary.validator, "Admin")}`}>
                              <ShieldCheck className="h-2.5 w-2.5" /> Verified
                            </span>
                          )}
                          {(!notary.validation_status || notary.validation_status === "PENDING_VALIDATION") && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/15 px-1.5 py-0.5 rounded-full border border-amber-500/20" title={`Created by ${formatUserName(notary.creator, "Staff")}`}>
                              <Clock className="h-2.5 w-2.5" /> Pending Review
                            </span>
                          )}
                          {notary.validation_status === "NEEDS_REVISION" && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15 px-1.5 py-0.5 rounded-full border border-rose-500/20" title={notary.validation_notes || "Revision requested"}>
                              <AlertTriangle className="h-2.5 w-2.5" /> Revision Required
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {notary.vendor_type === "GOVERNMENT_OFFICER" || notary.is_gov_officer ? (
                            <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 text-[9px] py-0 px-1.5 font-bold uppercase">
                              Gov Body
                            </Badge>
                          ) : notary.vendor_type === "OTHER_VENDORS" || notary.is_other_vendor ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] py-0 px-1.5 font-bold uppercase">
                              Other Vendor
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[9px] py-0 px-1.5 font-bold uppercase">
                              Notary
                            </Badge>
                          )}
                          {notary.creator && (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              • Added by: {formatUserName(notary.creator, "Staff")}
                            </span>
                          )}
                        </div>
                        {notary.notes && (
                          <p className="text-[10px] text-muted-foreground font-normal mt-1 leading-normal max-w-sm line-clamp-2">
                            {notary.notes}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground font-semibold align-top space-y-1">
                        <div>Email: <span className="text-foreground font-mono">{notary.email || "-"}</span></div>
                        <div>Phone: <span className="text-foreground font-mono">{notary.phone || "-"}</span></div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-xs space-y-1">
                        {notary.bank_name && notary.bank_account_number ? (
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-foreground">
                              <Landmark className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>{notary.bank_name}</span>
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] py-0 px-1 font-bold">
                                Ready
                              </Badge>
                            </div>
                            <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                              {notary.bank_account_number}
                            </div>
                            {notary.bank_account_holder_name && (
                              <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                {notary.bank_account_holder_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] py-0.5 px-2 font-medium">
                            <AlertCircle className="h-3 w-3 mr-1" /> Missing Bank Info
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top font-bold text-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{notary.city || "-"}</span>
                        </div>
                        {notary.address && (
                          <div className="text-[10px] text-muted-foreground font-normal mt-1 truncate max-w-xs">
                            {notary.address}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top font-mono font-bold text-right text-foreground">
                        {notary.service_fees?.length || 0} services
                      </td>

                      <td className="py-3.5 px-4 align-top text-center">
                        <Badge 
                          variant="outline" 
                          className={`font-extrabold text-[10px] px-2.5 py-0.5 rounded-full select-none ${
                            notary.status === "ACTIVE" 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : "bg-zinc-500/10 text-zinc-500 border-zinc-200"
                          }`}
                        >
                          {notary.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {notary.validation_status !== "VALIDATED" && (
                            <Link href={`/business/clients/notaries/${notary.id}/edit`}>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-[11px] px-2.5 gap-1 font-semibold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg"
                                title="Review & Validate Vendor Profile"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" /> Review
                              </Button>
                            </Link>
                          )}
                          <Link href={`/business/clients/notaries/${notary.id}/edit`}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Edit Vendor Profile" 
                              className="h-7 w-7 border border-transparent hover:border-border rounded-lg"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Delete Vendor" 
                            className="h-7 w-7 hover:bg-destructive/10 border border-transparent hover:border-destructive/10 rounded-lg"
                            onClick={() => {
                              setSelectedNotary(notary);
                              setIsDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              startIndex={startIndex}
              endIndex={endIndex}
              totalEntries={filteredNotaries.length}
            />
          </>
          )}
        </CardContent>
      </Card>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Delete Vendor Record</DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Are you sure you want to delete <span className="font-bold text-foreground">{selectedNotary?.name}</span>? This action is permanent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl h-10 px-4 font-bold" 
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="rounded-xl h-10 px-4 font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors" 
              onClick={handleDeleteSubmit} 
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
