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
  Building
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function NotariesPage() {
  const [notaries, setNotaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, cityFilter, statusFilter]);

  // Edit / Delete Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedNotary, setSelectedNotary] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    service_fee: "",
    status: "ACTIVE",
    notes: ""
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchNotaries = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/`, {
        headers: { "Authorization": `Bearer ${token}` }
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
    fetchNotaries();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenEdit = (notary: any) => {
    setSelectedNotary(notary);
    setFormData({
      name: notary.name || "",
      email: notary.email || "",
      phone: notary.phone || "",
      address: notary.address || "",
      city: notary.city || "",
      service_fee: notary.service_fee !== undefined ? String(notary.service_fee) : "0",
      status: notary.status || "ACTIVE",
      notes: notary.notes || ""
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedNotary) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city,
        service_fee: formData.service_fee ? parseFloat(formData.service_fee) : 0.0,
        status: formData.status,
        notes: formData.notes || null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/${selectedNotary.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Notary public updated successfully!");
        setIsEditOpen(false);
        fetchNotaries();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to update notary record");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating notary record");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!token || !selectedNotary) return;
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/notaries/${selectedNotary.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
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
  const activeNotariesCount = notaries.filter(n => n.status === "ACTIVE").length;
  const avgServiceFee = totalNotariesCount > 0 
    ? notaries.reduce((acc, curr) => acc + (curr.service_fee || 0), 0) / totalNotariesCount 
    : 0;
  
  // Calculate top city
  const cityCounts = notaries.reduce((acc: any, curr) => {
    acc[curr.city] = (acc[curr.city] || 0) + 1;
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

    return matchesSearch && matchesCity && matchesStatus;
  });

  const totalPages = Math.ceil(filteredNotaries.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedNotaries = filteredNotaries.slice(startIndex, endIndex);

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
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm shrink-0 flex items-center justify-center">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Notaries Catalog
            </h1>
            <p className="text-xs sm:text-sm mt-1 text-muted-foreground/90 font-medium">
              Manage licensed Indonesian notaries, jurisdictions, contact info, and registered service fees.
            </p>
          </div>
        </div>

        <Link href="/business/clients/notaries/new">
          <Button className="gap-2 font-semibold shadow">
            <Plus className="h-4 w-4" /> Add New Notary
          </Button>
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        
        {/* Total Notaries */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
              <Scale className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Total Notaries</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{totalNotariesCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Active Notaries */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Active Panel</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5">{activeNotariesCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Average Service Fee */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500 border border-pink-500/20 shrink-0">
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Avg Job Fee</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5 truncate">{formatCurrency(avgServiceFee)}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Top City */}
        <Card className="border border-border/40 bg-background/50 backdrop-blur-md shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold truncate">Top Location</p>
              <h3 className="text-base font-extrabold text-foreground leading-none mt-0.5 truncate">{topCity}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Notary name or email..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto">
          {/* City Filter */}
          <div className="w-full sm:w-40">
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-9 rounded-xl">
                <SelectValue placeholder="Filter City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {uniqueCities.map((city, i) => (
                  <SelectItem key={i} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Notary Table Card */}
      <Card>
        <CardContent className="p-0">
          {filteredNotaries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 border-t">
              <Scale className="h-10 w-10 text-muted-foreground/35" />
              <span className="text-sm font-semibold">No Notaries Found</span>
              <p className="text-xs max-w-sm">Click "Add New Notary" above to register your first legal notary public.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border-t">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground/90 font-extrabold uppercase border-b border-border/40 select-none">
                    <th className="py-3 px-4 w-1/4">Notary Name</th>
                    <th className="py-3 px-4">Contact Detail</th>
                    <th className="py-3 px-4">Jurisdiction (City)</th>
                    <th className="py-3 px-4 text-right">Job Fee</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/25">
                  {paginatedNotaries.map((notary) => (
                    <tr 
                      key={notary.id} 
                      className="hover:bg-muted/10 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-foreground align-top">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-indigo-500/80 shrink-0" />
                          <span>{notary.name}</span>
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

                      <td className="py-3.5 px-4 align-top font-bold text-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{notary.city}</span>
                        </div>
                        {notary.address && (
                          <div className="text-[10px] text-muted-foreground font-normal mt-1 truncate max-w-xs">
                            {notary.address}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top font-mono font-bold text-right text-foreground">
                        {formatCurrency(notary.service_fee || 0)}
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

                      <td className="py-3.5 px-4 align-top text-center flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Edit Notary" 
                          onClick={() => handleOpenEdit(notary)}
                          className="h-8 w-8 border border-transparent hover:border-border rounded-lg"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Delete Notary" 
                          className="h-8 w-8 hover:bg-destructive/10 border border-transparent hover:border-destructive/10 rounded-lg"
                          onClick={() => {
                            setSelectedNotary(notary);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
                <div className="text-xs text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                  <span className="font-medium text-foreground">{Math.min(filteredNotaries.length, endIndex)}</span> of{" "}
                  <span className="font-medium text-foreground">{filteredNotaries.length}</span> entries
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
          </>
          )}
        </CardContent>
      </Card>

      {/* EDIT NOTARY DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-4xl p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader className="pb-4 border-b border-border/50">
            <DialogTitle className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" /> Edit Notary Profile
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm mt-1 text-muted-foreground/90 font-medium">
              Update contact info, jurisdiction, and job service fee for {selectedNotary?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-6 pt-4">
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Notary Name *</label>
                  <Input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="h-10 text-sm font-medium bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">City / Jurisdiction *</label>
                  <Input
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Jakarta Selatan"
                    className="h-10 text-sm font-medium bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Contact Email</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. notary@example.com"
                    className="h-10 text-sm font-medium bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Contact Phone</label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +62 812 3456 789"
                    className="h-10 text-sm font-medium bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Service Fee (IDR) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    name="service_fee"
                    value={formData.service_fee}
                    onChange={handleInputChange}
                    placeholder="e.g. 5000000"
                    className="h-10 font-mono font-bold text-sm bg-background border-border/60 focus:border-primary/50 focus:ring-primary/25 rounded-xl transition-all"
                  />
                  {formData.service_fee && !isNaN(parseFloat(formData.service_fee)) && (
                    <div className="bg-amber-500/5 border border-amber-500/15 text-amber-600 dark:text-amber-400 py-1.5 px-2.5 rounded-xl font-bold font-mono text-[10.5px] text-center mt-1 truncate">
                      {formatCurrency(parseFloat(formData.service_fee))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Panel Status</label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Office Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className="flex w-full rounded-xl border border-border/60 bg-background p-3.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-relaxed font-medium transition-all"
                  placeholder="Complete office physical address..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Notes / Scope Specialties</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="flex w-full rounded-xl border border-border/60 bg-background p-3.5 text-sm placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary leading-relaxed font-medium transition-all"
                  placeholder="Notary specialty details (e.g. PPAT licensed, land deeds, fast remote service...)"
                />
              </div>
            </div>

            <DialogFooter className="pt-5 border-t border-border/30">
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-xl h-10 px-4 font-bold border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground transition-colors bg-transparent" 
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving} 
                className="px-6 font-bold shadow-md rounded-xl h-10 bg-zinc-900 hover:bg-zinc-100 text-zinc-50 hover:text-zinc-900 border border-zinc-900 dark:bg-zinc-100 dark:hover:bg-zinc-900 dark:text-zinc-950 dark:hover:text-zinc-100 dark:border-zinc-100 transition-all duration-200"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Notary
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Delete Notary Record</DialogTitle>
            <DialogDescription className="text-sm mt-1">
              Are you sure you want to delete <span className="font-bold text-foreground">{selectedNotary?.name}</span>? This action is permanent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl h-10 px-4 font-bold border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-foreground transition-colors bg-transparent" 
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
              {saving ? "Deleting..." : "Delete Notary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
