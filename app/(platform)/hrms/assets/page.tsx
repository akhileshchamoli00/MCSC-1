"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Monitor, Plus, Trash2, Edit, AlertCircle, History, 
  UserCheck, CheckCircle2, PackagePlus, PackageCheck, Smartphone, 
  KeyRound, CreditCard, Tag, Sparkles, ShieldCheck, Calendar, 
  User, Building2, Hash, Info, Layers, Headphones, Package
} from "lucide-react";
import { KpiCard } from "@/components/kpi-card";

const getDeptName = (dept: any) => {
  if (!dept) return "General";
  if (typeof dept === "string") return dept;
  if (typeof dept === "object") return dept.name || dept.title || "General";
  return "General";
};

const getJobTitle = (title: any, role?: any) => {
  if (typeof title === "string" && title.trim()) return title;
  if (typeof title === "object" && title?.name) return title.name;
  if (typeof role === "string" && role.trim()) return role;
  if (typeof role === "object" && role?.name) return role.name;
  return "Staff";
};

const getAssetTypeIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "laptop":
      return <Monitor className="h-4 w-4 text-emerald-500" />;
    case "mobile phone":
      return <Smartphone className="h-4 w-4 text-blue-500" />;
    case "monitor":
      return <Monitor className="h-4 w-4 text-indigo-500" />;
    case "access card":
      return <CreditCard className="h-4 w-4 text-amber-500" />;
    case "software license":
      return <KeyRound className="h-4 w-4 text-purple-500" />;
    case "headset / audio":
      return <Headphones className="h-4 w-4 text-pink-500" />;
    default:
      return <Package className="h-4 w-4 text-teal-500" />;
  }
};

const getConditionBadgeClass = (condition: string) => {
  switch (condition?.toLowerCase()) {
    case "new":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "good":
      return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "fair":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "damaged":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    default:
      return "bg-muted text-muted-foreground border-border/50";
  }
};

export default function AssetsAdminPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [historyAsset, setHistoryAsset] = useState<any | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Bulk Assign Form
  const { register, control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      employee_id: "",
      assigned_date: new Date().toISOString().split('T')[0],
      assets: [
        { asset_type: "Laptop", brand: "", model: "", asset_tag: "", serial_number: "", condition: "New", remarks: "" }
      ]
    }
  });

  const watchedEmployeeId = watch("employee_id");
  const watchedAssets = watch("assets");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "assets"
  });

  // Edit Form
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, control: controlEdit } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsRes, empRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets`, {
      credentials: "include", }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, {
      credentials: "include", })
      ]);

      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = () => {
    reset({
      employee_id: "",
      assigned_date: new Date().toISOString().split('T')[0],
      assets: [{ asset_type: "Laptop", brand: "", model: "", asset_tag: "", serial_number: "", condition: "New", remarks: "" }]
    });
    setIsAssignModalOpen(true);
  };

  const onBulkAssignSubmit = async (values: any) => {
    if (!values.employee_id) return alert("Select an employee");
    try {
      setSubmitting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/bulk-assign`, {
      credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          employee_id: parseInt(values.employee_id),
          assigned_date: values.assigned_date,
          assets: values.assets
        })
      });
      
      if (res.ok) {
        setIsAssignModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to assign assets");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (asset: any) => {
    resetEdit({
      asset_type: asset.asset_type,
      brand: asset.brand,
      model: asset.model,
      asset_tag: asset.asset_tag,
      serial_number: asset.serial_number,
      condition: asset.condition,
      status: asset.status,
      remarks: asset.remarks
    });
    setEditingAsset(asset);
  };

  const onEditSubmit = async (values: any) => {
    try {
      setSubmitting(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/${editingAsset.id}`, {
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      
      if (res.ok) {
        setEditingAsset(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to update asset");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating asset");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete (archive) this asset? It will be removed from the active list.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/${id}`, {
      credentials: "include",
        method: "DELETE",
        });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async (id: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/${id}/history`, {
      credentials: "include",
        });
      if (res.ok) {
        setHistoryLogs(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openHistoryModal = (asset: any) => {
    setHistoryAsset(asset);
    setHistoryLogs([]);
    fetchHistory(asset.id);
  };

  // Stats
  const totalAssets = assets.length;
  const assignedAssets = assets.filter(a => a.status === "ASSIGNED" || a.current_assignment).length;
  const availableAssets = assets.filter(a => a.status === "AVAILABLE").length;
  const damagedAssets = assets.filter(a => a.status === "DAMAGED" || a.condition === "Damaged").length;

  const filteredAssets = assets.filter(a => {
    const s = searchTerm.toLowerCase();
    const empName = a.current_assignment ? `${a.current_assignment.first_name} ${a.current_assignment.last_name}`.toLowerCase() : "";
    return (a.asset_type || "").toLowerCase().includes(s) || 
           (a.brand || "").toLowerCase().includes(s) || 
           (a.serial_number || "").toLowerCase().includes(s) ||
           empName.includes(s);
  });

  const totalPages = Math.ceil(filteredAssets.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Minimalist Metrics Strip & Action Button Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Total Assets */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Monitor className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Assets</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalAssets}</p>
            </div>
          </div>

          {/* Assigned */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Assigned</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{assignedAssets}</p>
            </div>
          </div>

          {/* Available */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Available</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{availableAssets}</p>
            </div>
          </div>

          {/* Damaged / Issue */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Damaged / Issue</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{damagedAssets}</p>
            </div>
          </div>
        </div>

        {/* Assign Asset Button */}
        <Button 
          onClick={openAssignModal} 
          className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> Assign Asset
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input 
            placeholder="Search by employee, serial number, brand..." 
            className="pl-4 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Asset Table */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Asset</th>
                  <th className="px-5 py-3.5">Serial / Tag</th>
                  <th className="px-5 py-3.5">Assigned To</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Loading assets...
                    </td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-xs">
                      No assets found.
                    </td>
                  </tr>
                ) : (
                  paginatedAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">{asset.brand} {asset.model}</p>
                        <p className="text-xs text-muted-foreground">{asset.asset_type}</p>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs">
                        <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2 py-0.5 rounded-md inline-block">
                          S/N: {asset.serial_number}
                        </span>
                        {asset.asset_tag && (
                          <span className="text-[10px] text-muted-foreground block mt-1">Tag: {asset.asset_tag}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {asset.current_assignment ? (
                          <>
                            <p className="font-semibold text-foreground">{asset.current_assignment.first_name} {asset.current_assignment.last_name}</p>
                            <p className="text-xs text-muted-foreground">{asset.current_assignment.department}</p>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {asset.status === 'AVAILABLE' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            AVAILABLE
                          </span>
                        )}
                        {asset.status === 'ASSIGNED' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            ASSIGNED
                          </span>
                        )}
                        {asset.status === 'DAMAGED' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            DAMAGED
                          </span>
                        )}
                        {asset.status !== 'AVAILABLE' && asset.status !== 'ASSIGNED' && asset.status !== 'DAMAGED' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                            {asset.status}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openHistoryModal(asset)}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEditModal(asset)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive rounded-lg" onClick={() => handleDelete(asset.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border/40 bg-muted/10">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(filteredAssets.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{filteredAssets.length}</span> entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs rounded-lg border-border/50"
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
                  className="h-8 text-xs rounded-lg border-border/50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Assign Modal - Redesigned & Expanded */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent 
          className="sm:max-w-3xl w-full max-h-[92vh] overflow-y-auto p-0 border border-border/50 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-3xl relative"
        >
          {/* Top Brand Accent Gradient */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 sticky top-0 z-30" />

          {/* Modal Header */}
          <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <PackagePlus className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                    Assign Assets to Employee
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Bulk Allocation
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Allocate company hardware, equipment, and access licenses with full serial tracking.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onBulkAssignSubmit)} className="p-6 sm:p-8 space-y-6">
            
            {/* Top Employee & Date Card */}
            <div className="p-4 sm:p-5 bg-muted/30 rounded-2xl border border-border/40 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                
                {/* Employee Select */}
                <div className="sm:col-span-7 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-emerald-500" />
                    Select Team Member <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name="employee_id"
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-11 rounded-2xl border-border/60 bg-background/70 shadow-xs text-xs font-semibold hover:border-emerald-500/50 transition-colors">
                          <SelectValue placeholder="Select team member..." />
                        </SelectTrigger>
                        <SelectContent position="popper" className="rounded-2xl max-h-64 border-border/50 shadow-xl">
                          {employees.map(e => (
                            <SelectItem key={e.id} value={e.id.toString()} className="text-xs cursor-pointer py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{e.first_name} {e.last_name}</span>
                                <span className="text-[11px] text-muted-foreground">
                                  ({getDeptName(e.department || e.department_name)} • {getJobTitle(e.job_title, e.role)})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Assigned Date */}
                <div className="sm:col-span-5 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                    Assignment Date <span className="text-rose-500">*</span>
                  </label>
                  <Input 
                    type="date" 
                    {...register("assigned_date")} 
                    required 
                    className="w-full h-11 rounded-2xl border-border/60 bg-background/70 shadow-xs text-xs font-medium focus:border-emerald-500/50" 
                  />
                </div>
              </div>

              {/* Live Selected Employee Preview Card */}
              {(() => {
                const selectedEmp = employees.find(e => e.id.toString() === watchedEmployeeId);
                if (!selectedEmp) return null;
                const deptDisplay = getDeptName(selectedEmp.department || selectedEmp.department_name);
                const titleDisplay = getJobTitle(selectedEmp.job_title, selectedEmp.role);

                return (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-background/80 border border-border/50 text-xs animate-in fade-in duration-300 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 shrink-0 text-xs">
                        {selectedEmp.first_name?.[0]}{selectedEmp.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-xs truncate">
                          {selectedEmp.first_name} {selectedEmp.last_name}
                        </p>
                        <p className="text-muted-foreground text-[11px] truncate flex items-center gap-1.5 mt-0.5">
                          <span className="text-foreground/80">{titleDisplay}</span>
                          <span>•</span>
                          <span>{deptDisplay}</span>
                          {selectedEmp.employee_id_custom && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-muted-foreground">{selectedEmp.employee_id_custom}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] shrink-0 font-semibold px-2.5 py-1 rounded-lg">
                      Ready for Allocation
                    </Badge>
                  </div>
                );
              })()}
            </div>

            {/* Asset Items Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Equipment / Asset Items ({fields.length})
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                Add serial numbers & specs
              </span>
            </div>

            {/* Repeater Asset Cards */}
            <div className="space-y-4">
              {fields.map((field, index) => {
                const currentType = watchedAssets?.[index]?.asset_type || "Laptop";
                const currentCondition = watchedAssets?.[index]?.condition || "New";

                return (
                  <div key={field.id} className="relative p-5 border border-border/50 rounded-3xl bg-card/60 backdrop-blur-md shadow-xs space-y-4 transition-all">
                    {/* Card Top Strip */}
                    <div className="flex items-center justify-between border-b border-border/30 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center border border-border/50">
                          {getAssetTypeIcon(currentType)}
                        </div>
                        <span className="text-xs font-bold text-foreground">
                          Asset #{index + 1}
                        </span>
                        <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${getConditionBadgeClass(currentCondition)}`}>
                          {currentCondition}
                        </Badge>
                      </div>

                      {fields.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs gap-1.5 cursor-pointer"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </Button>
                      )}
                    </div>
                    
                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      
                      {/* Asset Type */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <Tag className="h-3 w-3 text-emerald-500" /> Type <span className="text-rose-500">*</span>
                        </label>
                        <Controller
                          control={control}
                          name={`assets.${index}.asset_type`}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full h-10 rounded-xl border-border/60 bg-background/60 text-xs font-semibold">
                                <SelectValue placeholder="Select Type" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="rounded-xl border-border/50 shadow-xl">
                                <SelectItem value="Laptop" className="text-xs cursor-pointer py-1.5">💻 Laptop</SelectItem>
                                <SelectItem value="Mobile Phone" className="text-xs cursor-pointer py-1.5">📱 Mobile Phone</SelectItem>
                                <SelectItem value="Monitor" className="text-xs cursor-pointer py-1.5">🖥️ External Monitor</SelectItem>
                                <SelectItem value="Access Card" className="text-xs cursor-pointer py-1.5">🪪 Access Card / Badge</SelectItem>
                                <SelectItem value="Software License" className="text-xs cursor-pointer py-1.5">🔑 Software License</SelectItem>
                                <SelectItem value="Headset / Audio" className="text-xs cursor-pointer py-1.5">🎧 Headset / Audio</SelectItem>
                                <SelectItem value="Other" className="text-xs cursor-pointer py-1.5">📦 Other Equipment</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {/* Brand */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">
                          Brand / Manufacturer <span className="text-rose-500">*</span>
                        </label>
                        <Input 
                          placeholder="e.g. Apple, Dell, Lenovo" 
                          {...register(`assets.${index}.brand`)} 
                          required 
                          className="rounded-xl border-border/60 bg-background/60 text-xs h-10 font-medium" 
                        />
                      </div>

                      {/* Model */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">
                          Model Name / Specs <span className="text-rose-500">*</span>
                        </label>
                        <Input 
                          placeholder="e.g. MacBook Pro 16, M3" 
                          {...register(`assets.${index}.model`)} 
                          required 
                          className="rounded-xl border-border/60 bg-background/60 text-xs h-10 font-medium" 
                        />
                      </div>
                      
                      {/* Serial Number */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <Hash className="h-3 w-3 text-emerald-500" /> Serial Number <span className="text-rose-500">*</span>
                        </label>
                        <Input 
                          placeholder="Unique Serial Number" 
                          {...register(`assets.${index}.serial_number`)} 
                          required 
                          className="rounded-xl border-border/60 bg-background/60 font-mono text-xs h-10 font-medium" 
                        />
                      </div>

                      {/* Asset Tag */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">
                          Asset Tag Barcode
                        </label>
                        <Input 
                          placeholder="e.g. AST-2026-0042" 
                          {...register(`assets.${index}.asset_tag`)} 
                          className="rounded-xl border-border/60 bg-background/60 font-mono text-xs h-10" 
                        />
                      </div>

                      {/* Condition */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">
                          Condition <span className="text-rose-500">*</span>
                        </label>
                        <Controller
                          control={control}
                          name={`assets.${index}.condition`}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full h-10 rounded-xl border-border/60 bg-background/60 text-xs font-semibold">
                                <SelectValue placeholder="Select Condition" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="rounded-xl border-border/50 shadow-xl">
                                <SelectItem value="New" className="text-xs cursor-pointer py-1.5">🟢 New (Brand New / Boxed)</SelectItem>
                                <SelectItem value="Good" className="text-xs cursor-pointer py-1.5">🔵 Good (Working Perfectly)</SelectItem>
                                <SelectItem value="Fair" className="text-xs cursor-pointer py-1.5">🟡 Fair (Minor Wear & Tear)</SelectItem>
                                <SelectItem value="Damaged" className="text-xs cursor-pointer py-1.5">🔴 Damaged (Needs Repair)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      
                      {/* Remarks */}
                      <div className="space-y-1.5 md:col-span-3">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">
                          Remarks / Accessories Included
                        </label>
                        <Input 
                          placeholder="e.g. Includes 140W USB-C charger, laptop sleeve, wireless mouse" 
                          {...register(`assets.${index}.remarks`)} 
                          className="rounded-xl border-border/60 bg-background/60 text-xs h-10" 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Another Asset Button */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-dashed border-2 border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 h-12 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-2 cursor-pointer transition-all shadow-xs"
              onClick={() => append({ asset_type: "Laptop", brand: "", model: "", asset_tag: "", serial_number: "", condition: "New", remarks: "" })}
            >
              <Plus className="h-4 w-4" /> Add Another Equipment / Asset
            </Button>

            {/* Allocation Summary Ribbon */}
            {(() => {
              const selectedEmp = employees.find(e => e.id.toString() === watchedEmployeeId);
              return (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/40 text-xs">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-foreground">
                      {fields.length} Asset{fields.length > 1 ? "s" : ""} queued for assignment
                      {selectedEmp ? ` to ${selectedEmp.first_name} ${selectedEmp.last_name}` : ""}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-background text-foreground border-border/60 text-[10px] font-mono px-2 py-0.5 rounded-md">
                    {fields.length} Item{fields.length > 1 ? "s" : ""}
                  </Badge>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <DialogFooter className="border-t border-border/40 pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAssignModalOpen(false)} 
                className="w-full sm:w-auto h-11 px-5 rounded-2xl border-border/60 text-xs font-semibold hover:bg-muted cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || !watchedEmployeeId} 
                className="w-full sm:w-auto h-11 px-6 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving Assignments...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Save & Assign Assets ({fields.length})
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Modal */}
      <Dialog open={!!editingAsset} onOpenChange={(o) => !o && setEditingAsset(null)}>
        <DialogContent 
          className="sm:max-w-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden pt-6"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="text-lg font-bold tracking-tight">Edit Asset</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Update details, status, or condition of this asset.
            </DialogDescription>
          </DialogHeader>
          {editingAsset && (
            <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-4 rounded-xl border border-border/40">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Asset Type</label>
                  <Input {...registerEdit("asset_type")} className="rounded-xl border-border/50 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                  <Controller
                    control={controlEdit}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-9 rounded-xl border-border/50 text-xs">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="rounded-xl">
                          <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                          <SelectItem value="ASSIGNED">ASSIGNED</SelectItem>
                          <SelectItem value="RETURNED">RETURNED</SelectItem>
                          <SelectItem value="DAMAGED">DAMAGED</SelectItem>
                          <SelectItem value="LOST">LOST</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brand</label>
                  <Input {...registerEdit("brand")} className="rounded-xl border-border/50 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model</label>
                  <Input {...registerEdit("model")} className="rounded-xl border-border/50 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Serial Number</label>
                  <Input {...registerEdit("serial_number")} className="rounded-xl border-border/50 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Asset Tag</label>
                  <Input {...registerEdit("asset_tag")} className="rounded-xl border-border/50 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</label>
                  <Controller
                    control={controlEdit}
                    name="condition"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-9 rounded-xl border-border/50 text-xs">
                          <SelectValue placeholder="Select Condition" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="rounded-xl">
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Damaged">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remarks</label>
                  <Textarea {...registerEdit("remarks")} className="min-h-[70px] rounded-xl border-border/50 text-xs" />
                </div>
              </div>
              <DialogFooter className="border-t border-border/40 pt-4 mt-2">
                <Button type="button" variant="outline" onClick={() => setEditingAsset(null)} className="rounded-xl">Cancel</Button>
                <Button type="submit" disabled={submitting} className="rounded-xl font-bold">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Asset History Modal */}
      <Dialog open={!!historyAsset} onOpenChange={(o) => !o && setHistoryAsset(null)}>
        <DialogContent 
          className="sm:max-w-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden pt-6"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0" />
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="text-lg font-bold tracking-tight">Asset History Timeline</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {historyAsset && `${historyAsset.brand} ${historyAsset.model} (S/N: ${historyAsset.serial_number})`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {historyLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50 text-emerald-500" />
                <p className="text-xs">No history recorded for this asset yet.</p>
              </div>
            ) : (
              <div className="space-y-5 border-l-2 border-emerald-500/30 ml-3 pl-5 relative">
                {historyLogs.map((log, i) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-background" />
                    <p className="text-[10px] text-muted-foreground mb-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    <p className="font-bold text-xs mb-1 text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/40">{log.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 mt-2">
            <Button variant="outline" onClick={() => setHistoryAsset(null)} className="rounded-xl">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
