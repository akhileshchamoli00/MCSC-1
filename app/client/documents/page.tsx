"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useClient } from "../layout";
import {
  FolderClosed,
  FileText,
  Search,
  Calendar,
  Package,
  ShieldCheck,
  Building,
  Building2,
  Loader2,
  ChevronDown,
  ChevronRight,
  File,
  FileSpreadsheet,
  Image as ImageIcon,
  FolderOpen,
  Filter,
  Lock,
  Download,
  ExternalLink,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface ClientDoc {
  id: number;
  company_id: number;
  file_name: string;
  file_url: string;
  document_type?: string;
  description?: string;
  document_path?: string;
  order_number?: string | null;
  document_date?: string | null;
  expiry_date?: string | null;
  uploaded_at: string;
  uploaded_by?: number;
}

export default function SharedDocuments() {
  const { activeCompany } = useClient();
  const [documents, setDocuments] = useState<ClientDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [selectedOrderFilter, setSelectedOrderFilter] = useState<string>("ALL");
  
  // Collapsed order sections state: mapping orderKey -> boolean (true = expanded)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const fetchDocuments = async () => {
    if (!activeCompany?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${activeCompany.id}/documents`, {
      credentials: "include",
          }
      );
      if (res.ok) {
        const data: ClientDoc[] = await res.json();
        setDocuments(data || []);
        
        // Default expand all sections
        const sections: Record<string, boolean> = {};
        (data || []).forEach(doc => {
          const key = doc.order_number?.trim() || "__GENERAL__";
          sections[key] = true;
        });
        setExpandedSections(sections);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeCompany?.id]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    documents.forEach(d => {
      if (d.document_type) set.add(d.document_type);
    });
    return ["ALL", ...Array.from(set)];
  }, [documents]);

  // Distinct order numbers
  const distinctOrders = useMemo(() => {
    const orderSet = new Set<string>();
    let hasGeneral = false;
    documents.forEach(d => {
      if (d.order_number?.trim()) {
        orderSet.add(d.order_number.trim());
      } else {
        hasGeneral = true;
      }
    });
    const sorted = Array.from(orderSet).sort();
    return {
      orderNumbers: sorted,
      hasGeneral
    };
  }, [documents]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // 1. Category filter
      const matchesCategory =
        categoryFilter === "ALL" ||
        (doc.document_type || "").toUpperCase() === categoryFilter.toUpperCase();
      if (!matchesCategory) return false;

      // 2. Order filter
      if (selectedOrderFilter !== "ALL") {
        if (selectedOrderFilter === "__GENERAL__") {
          if (doc.order_number?.trim()) return false;
        } else {
          if (doc.order_number?.trim() !== selectedOrderFilter) return false;
        }
      }

      // 3. Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (doc.file_name || "").toLowerCase().includes(q) ||
        (doc.document_type || "").toLowerCase().includes(q) ||
        (doc.description || "").toLowerCase().includes(q) ||
        (doc.order_number || "").toLowerCase().includes(q)
      );
    });
  }, [documents, categoryFilter, selectedOrderFilter, searchQuery]);

  // Segregate documents Order ID wise
  const groupedDocuments = useMemo(() => {
    const groups: {
      orderKey: string;
      orderNumber: string | null;
      title: string;
      documents: ClientDoc[];
      clientSharedCount: number;
    }[] = [];

    const map = new Map<string, ClientDoc[]>();

    filteredDocuments.forEach(doc => {
      const key = doc.order_number?.trim() || "__GENERAL__";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(doc);
    });

    // Sort order keys (specific orders first in descending order, general last)
    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      if (a === "__GENERAL__") return 1;
      if (b === "__GENERAL__") return -1;
      return b.localeCompare(a);
    });

    sortedKeys.forEach(key => {
      const docs = map.get(key) || [];
      const isGeneral = key === "__GENERAL__";
      const clientSharedCount = docs.filter(d => d.document_type === "Client Shared Docs").length;

      groups.push({
        orderKey: key,
        orderNumber: isGeneral ? null : key,
        title: isGeneral ? "General Corporate Documents & Records" : `Order #${key}`,
        documents: docs,
        clientSharedCount
      });
    });

    return groups;
  }, [filteredDocuments]);

  // Expand / Collapse toggling
  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    groupedDocuments.forEach(g => {
      next[g.orderKey] = true;
    });
    setExpandedSections(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    groupedDocuments.forEach(g => {
      next[g.orderKey] = false;
    });
    setExpandedSections(next);
  };

  // Helper to determine file type icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (["pdf"].includes(ext)) {
      return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
    }
    if (["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(ext)) {
      return <ImageIcon className="h-4 w-4 text-purple-500 shrink-0" />;
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />;
    }
    return <File className="h-4 w-4 text-sky-500 shrink-0" />;
  };

  // Stats calculation
  const totalDocsCount = documents.length;
  const totalOrdersCount = distinctOrders.orderNumbers.length;
  const clientSharedDocsCount = documents.filter(d => d.document_type === "Client Shared Docs").length;
  const generalDocsCount = documents.filter(d => !d.order_number?.trim()).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Minimalist Metrics Strip Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Documents */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <FolderOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Documents</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalDocsCount}</p>
            </div>
          </div>

          {/* Order Vaults */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20 shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Order Vaults</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalOrdersCount}</p>
            </div>
          </div>

          {/* Client Uploads */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Client Uploads</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{clientSharedDocsCount}</p>
            </div>
          </div>

          {/* Corporate Records */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Building className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Corporate Records</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{generalDocsCount}</p>
            </div>
          </div>
        </div>

        {/* Action / Context Badge */}
        {activeCompany && (
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-2 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl shadow-xs shrink-0">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Entity</p>
              <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{activeCompany.company_name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents, order #, category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Controls: Order Select + Expand/Collapse */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedOrderFilter} onValueChange={setSelectedOrderFilter}>
                <SelectTrigger className="h-10 text-xs w-full sm:w-48 rounded-xl bg-background/70 border-border/50">
                  <SelectValue placeholder="All Orders" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="ALL">All Order Vaults</SelectItem>
                  {distinctOrders.orderNumbers.map(orderNum => (
                    <SelectItem key={orderNum} value={orderNum}>
                      Order #{orderNum}
                    </SelectItem>
                  ))}
                  {distinctOrders.hasGeneral && (
                    <SelectItem value="__GENERAL__">General Docs</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="h-10 text-xs px-3 font-semibold rounded-xl border-border/50"
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                className="h-10 text-xs px-3 font-semibold rounded-xl border-border/50"
              >
                Collapse All
              </Button>
            </div>
          </div>

          {/* Category Filter Chips */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Categories:
              </span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                    categoryFilter === cat
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat === "ALL" ? "All Documents" : cat}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Segregated Document List Container */}
      {loading ? (
        <Card className="border-border/40 bg-background/50 backdrop-blur-md rounded-2xl p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="text-xs text-muted-foreground">Loading company vault records...</span>
          </div>
        </Card>
      ) : groupedDocuments.length === 0 ? (
        <Card className="border-border/40 bg-background/50 backdrop-blur-md rounded-2xl p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <FolderClosed className="h-12 w-12 text-emerald-500/30 mb-2" />
            <span className="text-base font-bold text-foreground">No Documents Found</span>
            <span className="text-xs text-muted-foreground max-w-sm">
              {searchQuery || categoryFilter !== "ALL" || selectedOrderFilter !== "ALL"
                ? "No documents match your active search keyword or category filters."
                : "Documents stored for your company will appear organized by order here."}
            </span>
            {(searchQuery || categoryFilter !== "ALL" || selectedOrderFilter !== "ALL") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("ALL");
                  setSelectedOrderFilter("ALL");
                }}
                className="mt-3 h-8 text-xs font-semibold rounded-xl"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedDocuments.map(group => {
            const isExpanded = expandedSections[group.orderKey] ?? true;
            const isGeneral = group.orderKey === "__GENERAL__";

            return (
              <div
                key={group.orderKey}
                className="border border-border/40 rounded-2xl bg-background/50 backdrop-blur-md overflow-hidden shadow-sm transition-all"
              >
                {/* Order Group Header */}
                <div
                  className={`px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors border-b border-border/40 ${
                    isExpanded ? "bg-muted/40 dark:bg-zinc-900/50" : "hover:bg-muted/20"
                  }`}
                  onClick={() => toggleSection(group.orderKey)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      {isGeneral ? (
                        <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <Building className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Package className="h-3.5 w-3.5" />
                        </div>
                      )}
                      
                      <span className="font-bold text-foreground text-sm tracking-tight truncate">
                        {group.title}
                      </span>

                      {!isGeneral && group.orderNumber && (
                        <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-[11px] px-2 py-0.5 rounded-md">
                          {group.orderNumber}
                        </span>
                      )}

                      <Badge
                        variant="secondary"
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground shrink-0"
                      >
                        {group.documents.length} File{group.documents.length === 1 ? "" : "s"}
                      </Badge>

                      {group.clientSharedCount > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shrink-0 hidden sm:inline-flex items-center gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {group.clientSharedCount} chat upload{group.clientSharedCount === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document List Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30 border-b border-border/30">
                        <TableRow className="hover:bg-transparent h-9">
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2 px-4 w-[48%]">
                            Document Name & File
                          </TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2 px-4 w-[22%]">
                            Category / Type
                          </TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2 px-4 w-[16%]">
                            Uploaded Date
                          </TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right py-2 px-4 w-[14%]">
                            Vault Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.documents.map((doc, idx) => {
                          const isClientShared = doc.document_type === "Client Shared Docs";

                          return (
                            <TableRow
                              key={doc.id}
                              className={`border-b border-border/20 last:border-0 transition-colors hover:bg-muted/30 text-xs ${
                                idx % 2 === 0 ? "bg-background/20" : "bg-transparent"
                              }`}
                            >
                              {/* Document Name & Description */}
                              <TableCell className="py-2.5 px-4">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-8 w-8 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center shrink-0">
                                    {getFileIcon(doc.file_name)}
                                  </div>
                                  <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-foreground text-xs truncate max-w-xs sm:max-w-md">
                                      {doc.file_name}
                                    </span>
                                    {isClientShared && (
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shrink-0"
                                      >
                                        Chat Upload
                                      </Badge>
                                    )}
                                    {doc.description && (
                                      <span className="text-[11px] text-muted-foreground truncate hidden md:inline">
                                        • {doc.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>

                              {/* Category / Document Type */}
                              <TableCell className="py-2.5 px-4">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                                    isClientShared
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                      : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                                  }`}
                                >
                                  {doc.document_type || "Corporate Record"}
                                </Badge>
                              </TableCell>

                              {/* Uploaded Date */}
                              <TableCell className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                  <span>
                                    {doc.uploaded_at
                                      ? format(new Date(doc.uploaded_at), "MMM d, yyyy")
                                      : "-"}
                                  </span>
                                </div>
                              </TableCell>

                              {/* Vault Action / Download */}
                              <TableCell className="py-2.5 px-4 text-right whitespace-nowrap">
                                {doc.file_url ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2.5 text-xs font-semibold gap-1 rounded-lg shadow-xs"
                                    asChild
                                  >
                                    <a
                                      href={doc.file_url.startsWith("http") ? doc.file_url : `${process.env.NEXT_PUBLIC_API_URL}${doc.file_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Download className="h-3 w-3" />
                                      <span>Download</span>
                                    </a>
                                  </Button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-muted/40 border border-border/30">
                                    <Lock className="h-3 w-3 text-muted-foreground/70" />
                                    Vault Archived
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
