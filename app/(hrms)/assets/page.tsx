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
import { Loader2, Monitor, Plus, Trash2, Edit, AlertCircle, History } from "lucide-react";

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
  const { register, control, handleSubmit, reset } = useForm({
    defaultValues: {
      employee_id: "",
      assigned_date: new Date().toISOString().split('T')[0],
      assets: [
        { asset_type: "Laptop", brand: "", model: "", asset_tag: "", serial_number: "", condition: "New", remarks: "" }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "assets"
  });

  // Edit Form
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, control: controlEdit } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("hrms_token");
      if (!token) return;

      const [assetsRes, empRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { headers: { "Authorization": `Bearer ${token}` } })
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
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/bulk-assign`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
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
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/${editingAsset.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
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
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
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
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assets/${id}/history`, {
        headers: { "Authorization": `Bearer ${token}` }
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Management</h1>
          <p className="text-muted-foreground mt-1">Manage all company assets and assignments.</p>
        </div>
        <Button onClick={openAssignModal} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Assign Asset
        </Button>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border border-border/50 bg-card shadow-sm">
          <div className="py-1 px-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Total Assets</p>
            <p className="text-lg md:text-xl font-bold text-foreground mt-0">{totalAssets}</p>
          </div>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <div className="py-1 px-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Assigned Assets</p>
            <p className="text-lg md:text-xl font-bold text-foreground mt-0">{assignedAssets}</p>
          </div>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <div className="py-1 px-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Available</p>
            <p className="text-lg md:text-xl font-bold text-foreground mt-0">{availableAssets}</p>
          </div>
        </Card>
        <Card className="border border-border/50 bg-card shadow-sm">
          <div className="py-1 px-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Damaged</p>
            <p className="text-lg md:text-xl font-bold text-foreground mt-0">{damagedAssets}</p>
          </div>
        </Card>
      </div>

      <div className="flex gap-4 mb-2">
        <Input 
          placeholder="Search by employee, serial number, brand..." 
          className="max-w-md bg-background shadow-sm" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Asset Table */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Serial / Tag</th>
                  <th className="px-4 py-3 font-medium">Assigned To</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      Loading assets...
                    </td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No assets found.
                    </td>
                  </tr>
                ) : (
                  paginatedAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{asset.brand} {asset.model}</p>
                        <p className="text-xs text-muted-foreground">{asset.asset_type}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <p>S/N: {asset.serial_number}</p>
                        {asset.asset_tag && <p>Tag: {asset.asset_tag}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {asset.current_assignment ? (
                          <>
                            <p className="font-medium text-primary">{asset.current_assignment.first_name} {asset.current_assignment.last_name}</p>
                            <p className="text-xs text-muted-foreground">{asset.current_assignment.department}</p>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`
                          ${asset.status === 'AVAILABLE' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                          ${asset.status === 'ASSIGNED' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                          ${asset.status === 'DAMAGED' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        `}>
                          {asset.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openHistoryModal(asset)}>
                          <History className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" onClick={() => openEditModal(asset)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => handleDelete(asset.id)}>
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
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

      {/* Bulk Assign Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent 
          className="sm:max-w-3xl max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative pt-6"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 shrink-0" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">Assign Assets to Employee</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Assign one or more assets to an employee simultaneously.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onBulkAssignSubmit)} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 dark:bg-zinc-900/40 rounded-lg border border-border/40">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee</label>
                <Controller
                  control={control}
                  name="employee_id"
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm mt-1">
                        <SelectValue placeholder="Select Employee..." />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {employees.map(e => (
                          <SelectItem key={e.id} value={e.id.toString()}>{e.first_name} {e.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Date</label>
                <Input type="date" {...register("assigned_date")} required className="mt-1" />
              </div>
            </div>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="relative p-5 border border-border rounded-lg bg-card shadow-sm">
                  <div className="absolute -top-3 left-4 bg-background px-2 text-sm font-medium text-primary flex items-center gap-2">
                    <Monitor className="h-4 w-4" /> Asset {index + 1}
                  </div>
                  {fields.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute -top-4 -right-4 h-8 w-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 shadow-sm border border-red-200"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Asset Type</label>
                      <Controller
                        control={control}
                        name={`assets.${index}.asset_type`}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value="Laptop">Laptop</SelectItem>
                              <SelectItem value="Mobile Phone">Mobile Phone</SelectItem>
                              <SelectItem value="Monitor">Monitor</SelectItem>
                              <SelectItem value="Access Card">Access Card</SelectItem>
                              <SelectItem value="Software License">Software License</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Brand</label>
                      <Input placeholder="e.g. Lenovo, Apple" {...register(`assets.${index}.brand`)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Model</label>
                      <Input placeholder="e.g. ThinkPad T14" {...register(`assets.${index}.model`)} required />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Serial Number</label>
                      <Input placeholder="Unique S/N" {...register(`assets.${index}.serial_number`)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Asset Tag</label>
                      <Input placeholder="Optional Tag ID" {...register(`assets.${index}.asset_tag`)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Condition</label>
                      <Controller
                        control={control}
                        name={`assets.${index}.condition`}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                              <SelectValue placeholder="Select Condition" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Good">Good</SelectItem>
                              <SelectItem value="Fair">Fair</SelectItem>
                              <SelectItem value="Damaged">Damaged</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-3">
                      <label className="text-xs font-medium text-muted-foreground uppercase">Remarks</label>
                      <Input placeholder="Additional details..." {...register(`assets.${index}.remarks`)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-dashed border-2 bg-muted/20 hover:bg-muted/50 h-12"
              onClick={() => append({ asset_type: "Laptop", brand: "", model: "", asset_tag: "", serial_number: "", condition: "New", remarks: "" })}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Another Asset
            </Button>

            <DialogFooter className="border-t border-border/50 pt-4 mt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)} className="bg-background">Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save & Assign Assets"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Modal */}
      <Dialog open={!!editingAsset} onOpenChange={(o) => !o && setEditingAsset(null)}>
        <DialogContent 
          className="sm:max-w-xl border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden pt-6"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 shrink-0" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">Edit Asset</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Update details, status, or condition of this asset.
            </DialogDescription>
          </DialogHeader>
          {editingAsset && (
            <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4 bg-muted/30 dark:bg-zinc-900/40 p-5 rounded-lg border border-border/40">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Asset Type</label>
                  <Input {...registerEdit("asset_type")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Controller
                    control={controlEdit}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent position="popper">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Brand</label>
                  <Input {...registerEdit("brand")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model</label>
                  <Input {...registerEdit("model")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Serial Number</label>
                  <Input {...registerEdit("serial_number")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Asset Tag</label>
                  <Input {...registerEdit("asset_tag")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Condition</label>
                  <Controller
                    control={controlEdit}
                    name="condition"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm">
                          <SelectValue placeholder="Select Condition" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Damaged">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Remarks</label>
                  <Textarea {...registerEdit("remarks")} />
                </div>
              </div>
              <DialogFooter className="border-t border-border/50 pt-4 mt-2">
                <Button type="button" variant="outline" onClick={() => setEditingAsset(null)} className="bg-background">Cancel</Button>
                <Button type="submit" disabled={submitting}>Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Asset History Modal */}
      <Dialog open={!!historyAsset} onOpenChange={(o) => !o && setHistoryAsset(null)}>
        <DialogContent 
          className="sm:max-w-2xl border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden pt-6"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 shrink-0" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">Asset History Timeline</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {historyAsset && `${historyAsset.brand} ${historyAsset.model} (S/N: ${historyAsset.serial_number})`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {historyLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No history recorded for this asset yet.</p>
              </div>
            ) : (
              <div className="space-y-6 border-l-2 border-primary/20 ml-3 pl-6 relative">
                {historyLogs.map((log, i) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[33px] top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                    <p className="text-xs text-muted-foreground mb-1">{new Date(log.created_at).toLocaleString()}</p>
                    <p className="font-semibold text-sm mb-1">{log.action}</p>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border border-border/50">{log.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="border-t border-border/50 pt-4 mt-2">
            <Button variant="outline" onClick={() => setHistoryAsset(null)} className="bg-background">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
