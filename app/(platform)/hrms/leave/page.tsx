"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Edit, Loader2, Coffee, PlusCircle, Search, Users, CheckCircle, Clock, Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function LeaveManagementPage() {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Edit Modal State
  const [editingBalance, setEditingBalance] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    annual_leave_balance: 0.0,
    sick_leave_balance: 0.0,
    annual_leave_taken: 0.0,
    sick_leave_taken: 0.0,
    bonus_allocated: 0.0,
    reason: ""
  });
  const [saving, setSaving] = useState(false);

  // Allocate Modal State
  const [allocatingBalance, setAllocatingBalance] = useState<any | null>(null);
  const [allocateForm, setAllocateForm] = useState({
    amount: 1.0,
    reason: "",
    allocation_date: new Date().toISOString().split("T")[0]
  });
  const [allocating, setAllocating] = useState(false);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/balances`, {
      credentials: "include",
        });
      if (res.ok) {
        setBalances(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch leave balances", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const filteredBalances = balances.filter(b => {
    if (!b.employee) return false;
    const search = searchTerm.toLowerCase();
    return b.employee.first_name.toLowerCase().includes(search) ||
      b.employee.last_name.toLowerCase().includes(search);
  });

  const totalPages = Math.ceil(filteredBalances.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedBalances = filteredBalances.slice(startIndex, endIndex);

  const handleEditClick = (balance: any) => {
    setEditingBalance(balance);
    setEditForm({
      annual_leave_balance: balance.annual_leave_balance,
      sick_leave_balance: balance.sick_leave_balance,
      annual_leave_taken: balance.annual_leave_taken || 0.0,
      sick_leave_taken: balance.sick_leave_taken || 0.0,
      bonus_allocated: balance.bonus_allocated || 0.0,
      reason: ""
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.reason.trim()) {
      alert("Reason for adjustment is required.");
      return;
    }

    if ((editForm.annual_leave_balance * 2) % 1 !== 0 ||
        (editForm.annual_leave_taken * 2) % 1 !== 0 ||
        (editForm.sick_leave_taken * 2) % 1 !== 0 ||
        (editForm.bonus_allocated * 2) % 1 !== 0) {
      alert("Leave days must be in increments of 0.5 (half-day or full-day).");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/balances/${editingBalance.employee_id}`, {
      credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        setEditingBalance(null);
        fetchBalances();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to update balance");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving balance");
    } finally {
      setSaving(false);
    }
  };

  const handleAllocateClick = (balance: any) => {
    setAllocatingBalance(balance);
    setAllocateForm({
      amount: 1.0,
      reason: "",
      allocation_date: new Date().toISOString().split("T")[0]
    });
  };

  const handleAllocateSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (allocateForm.amount <= 0) {
      alert("Allocation amount must be greater than 0.");
      return;
    }
    if ((allocateForm.amount * 2) % 1 !== 0) {
      alert("Allocated amount must be in increments of 0.5 (half-day or full-day).");
      return;
    }
    if (!allocateForm.allocation_date) {
      alert("Allocation date is required.");
      return;
    }
    if (!allocateForm.reason.trim()) {
      alert("Reason for allocation is required.");
      return;
    }

    try {
      setAllocating(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/allocate`, {
      credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          employee_id: allocatingBalance.employee_id,
          amount: allocateForm.amount,
          reason: allocateForm.reason,
          allocation_date: allocateForm.allocation_date
        })
      });

      if (res.ok) {
        setAllocatingBalance(null);
        fetchBalances();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to allocate leave");
      }
    } catch (err) {
      console.error(err);
      alert("Error allocating leave");
    } finally {
      setAllocating(false);
    }
  };

  const totalStaffBalances = balances.length;
  const totalAnnualBalance = balances.reduce((sum, b) => sum + (Number(b.annual_leave_balance) || 0), 0);
  const totalAnnualTaken = balances.reduce((sum, b) => sum + (Number(b.annual_leave_taken) || 0), 0);
  const totalSickTaken = balances.reduce((sum, b) => sum + (Number(b.sick_leave_taken) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Minimalist Metrics Strip Row */}
      <div className="flex flex-col xl:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2.5 sm:px-4 sm:py-3 shadow-xs flex-1 gap-3 sm:gap-4">
          
          {/* Total Staff */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Staff</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalStaffBalances}</p>
            </div>
          </div>

          {/* Total Bal. Days */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Total Bal. Days</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalAnnualBalance.toFixed(1)}</p>
            </div>
          </div>

          {/* Leave Taken */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Coffee className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Leave Taken</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalAnnualTaken.toFixed(1)}</p>
            </div>
          </div>

          {/* Sick Days Taken */}
          <div className="flex items-center gap-3 px-2 sm:px-3 py-1 xl:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Sick Days Taken</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{totalSickTaken.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-9 h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-emerald-500/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Balances Card Table */}
      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee Name</th>
                  <th className="px-5 py-3.5">Annual Leave Bal.</th>
                  <th className="px-5 py-3.5">Annual Leave Taken</th>
                  <th className="px-5 py-3.5">Bonus Allocated</th>
                  <th className="px-5 py-3.5">Sick Leave Taken</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Loading balances...
                    </td>
                  </tr>
                ) : filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-xs">
                      No employee balances found.
                    </td>
                  </tr>
                ) : (
                  paginatedBalances.map((balance) => (
                    <tr key={balance.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {balance.employee ? `${balance.employee.first_name} ${balance.employee.last_name}` : `EMP ID: ${balance.employee_id}`}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {balance.annual_leave_balance} Days
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-muted-foreground">
                        {balance.annual_leave_taken || 0} Days
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {balance.bonus_allocated ? `+${balance.bonus_allocated} Days` : "0 Days"}
                      </td>
                      <td className="px-5 py-4 font-medium text-muted-foreground">
                        {balance.sick_leave_taken || 0} Days
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs font-semibold rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/20"
                          onClick={() => handleAllocateClick(balance)}
                        >
                          <PlusCircle className="h-3.5 w-3.5" /> Allocate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs font-semibold rounded-lg hover:bg-muted"
                          onClick={() => handleEditClick(balance)}
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit
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
                <span className="font-medium text-foreground">{Math.min(filteredBalances.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{filteredBalances.length}</span> entries
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

      {/* Allocate Leave Balance Modal */}
      <Dialog open={!!allocatingBalance} onOpenChange={(open) => !open && setAllocatingBalance(null)}>
        <DialogContent className="sm:max-w-md border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="text-lg font-bold tracking-tight">Allocate Annual Leave Balance</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Allocate leave days directly to the employee's annual leave balance. This will show as an addition in their history.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAllocateSave} className="space-y-4 pt-2">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee Name</label>
                <p className="font-bold text-foreground mt-1">
                  {allocatingBalance?.employee ? `${allocatingBalance.employee.first_name} ${allocatingBalance.employee.last_name}` : `EMP ID: ${allocatingBalance?.employee_id}`}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Allocation Date</label>
                <Input
                  type="date"
                  value={allocateForm.allocation_date}
                  onChange={(e) => setAllocateForm({ ...allocateForm, allocation_date: e.target.value })}
                  required
                  className="rounded-xl border-border/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Days to Allocate</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={allocateForm.amount}
                  onChange={(e) => setAllocateForm({ ...allocateForm, amount: parseFloat(e.target.value) || 0.0 })}
                  required
                  className="rounded-xl border-border/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Reason for Allocation</label>
                <Textarea
                  value={allocateForm.reason}
                  onChange={(e) => setAllocateForm({ ...allocateForm, reason: e.target.value })}
                  placeholder="e.g. Special recognition bonus leave"
                  required
                  className="min-h-[90px] rounded-xl border-border/50 text-xs"
                />
              </div>
            </div>
            <DialogFooter className="border-t border-border/40 pt-4 mt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAllocatingBalance(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={allocating} className="rounded-xl">
                {allocating ? "Allocating..." : "Allocate Leave"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Balance Modal */}
      <Dialog open={!!editingBalance} onOpenChange={(open) => !open && setEditingBalance(null)}>
        <DialogContent className="sm:max-w-md border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <DialogHeader className="border-b border-border/40 pb-4">
            <DialogTitle className="text-lg font-bold tracking-tight">Edit Leave Balance</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Adjusting balances will create an audit log. A reason is required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Annual Leave Bal.</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editForm.annual_leave_balance}
                    onChange={(e) => setEditForm({ ...editForm, annual_leave_balance: parseFloat(e.target.value) || 0.0 })}
                    required
                    className="rounded-xl border-border/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Annual Leave Taken</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editForm.annual_leave_taken}
                    onChange={(e) => setEditForm({ ...editForm, annual_leave_taken: parseFloat(e.target.value) || 0.0 })}
                    required
                    className="rounded-xl border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Bonus Allocated</label>
                <Input
                  type="number"
                  step="0.5"
                  value={editForm.bonus_allocated}
                  onChange={(e) => {
                    const newBonusVal = parseFloat(e.target.value) || 0.0;
                    const delta = newBonusVal - editForm.bonus_allocated;
                    setEditForm({
                      ...editForm,
                      bonus_allocated: newBonusVal,
                      annual_leave_balance: editForm.annual_leave_balance + delta
                    });
                  }}
                  required
                  className="rounded-xl border-border/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Sick Leave Taken</label>
                <Input
                  type="number"
                  step="0.5"
                  value={editForm.sick_leave_taken}
                  onChange={(e) => setEditForm({ ...editForm, sick_leave_taken: parseFloat(e.target.value) || 0.0 })}
                  required
                  className="rounded-xl border-border/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason for Adjustment</label>
                <Textarea
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  placeholder="e.g. New employee allocation"
                  required
                  className="min-h-[90px] rounded-xl border-border/50 text-xs"
                />
              </div>
            </div>
            <DialogFooter className="border-t border-border/40 pt-4 mt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditingBalance(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
