"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Edit, Loader2, Coffee, PlusCircle } from "lucide-react";
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
      const token = localStorage.getItem("hrms_token");
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/balances`, {
        headers: { "Authorization": `Bearer ${token}` }
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
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/balances/${editingBalance.employee_id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
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
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/allocate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
        <p className="text-muted-foreground mt-1">Manage and audit employee leave balances.</p>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search employees..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" /> Employee Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee Name</th>
                  <th className="px-4 py-3 font-medium">Annual Leave Bal.</th>
                  <th className="px-4 py-3 font-medium">Annual Leave Taken</th>
                  <th className="px-4 py-3 font-medium">Bonus Allocated</th>
                  <th className="px-4 py-3 font-medium">Sick Leave Taken</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      Loading balances...
                    </td>
                  </tr>
                ) : filteredBalances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No balances found.
                    </td>
                  </tr>
                ) : (
                  paginatedBalances.map((balance) => (
                    <tr key={balance.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {balance.employee ? `${balance.employee.first_name} ${balance.employee.last_name}` : `EMP ID: ${balance.employee_id}`}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary">
                        {balance.annual_leave_balance} Days
                      </td>
                      <td className="px-4 py-3 font-semibold text-muted-foreground">
                        {balance.annual_leave_taken || 0} Days
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {balance.bonus_allocated ? `+${balance.bonus_allocated} Days` : "0 Days"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-muted-foreground">
                        {balance.sick_leave_taken || 0} Days
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-950/20" onClick={() => handleAllocateClick(balance)}>
                          <PlusCircle className="h-4 w-4" /> Allocate
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => handleEditClick(balance)}>
                          <Edit className="h-4 w-4" /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/50 bg-transparent mt-4">
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

      {/* Allocate Leave Balance Modal */}
      <Dialog open={!!allocatingBalance} onOpenChange={(open) => !open && setAllocatingBalance(null)}>
        <DialogContent
          className="sm:max-w-md border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">Allocate Annual Leave Balance</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Allocate leave days directly to the employee's annual leave balance. This will show as an addition in their history.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAllocateSave} className="space-y-4">
            <div className="space-y-4 py-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee Name</label>
                <p className="font-semibold mt-1">
                  {allocatingBalance?.employee ? `${allocatingBalance.employee.first_name} ${allocatingBalance.employee.last_name}` : `EMP ID: ${allocatingBalance?.employee_id}`}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Allocation Date</label>
                <Input
                  type="date"
                  value={allocateForm.allocation_date}
                  onChange={(e) => setAllocateForm({ ...allocateForm, allocation_date: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Days to Allocate</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={allocateForm.amount}
                  onChange={(e) => setAllocateForm({ ...allocateForm, amount: parseFloat(e.target.value) || 0.0 })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Reason for Allocation</label>
                <Textarea
                  value={allocateForm.reason}
                  onChange={(e) => setAllocateForm({ ...allocateForm, reason: e.target.value })}
                  placeholder="e.g. Special recognition bonus leave"
                  required
                  className="min-h-[100px] mt-1"
                />
              </div>
            </div>
            <DialogFooter className="border-t border-border/50 pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setAllocatingBalance(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={allocating} className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-700 dark:hover:bg-emerald-800">
                {allocating ? "Allocating..." : "Allocate Leave"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Balance Modal */}
      <Dialog open={!!editingBalance} onOpenChange={(open) => !open && setEditingBalance(null)}>
        <DialogContent
          className="sm:max-w-md border border-zinc-200 dark:border-zinc-800 bg-background/95 backdrop-blur-xl shadow-2xl rounded-xl relative overflow-hidden"
          overlayClassName="backdrop-blur-md bg-black/60"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">Edit Leave Balance</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Adjusting balances will create an audit log. A reason is required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Annual Leave Bal.</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editForm.annual_leave_balance}
                    onChange={(e) => setEditForm({ ...editForm, annual_leave_balance: parseFloat(e.target.value) || 0.0 })}
                    required
                    className="mt-1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Annual Leave Taken</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editForm.annual_leave_taken}
                    onChange={(e) => setEditForm({ ...editForm, annual_leave_taken: parseFloat(e.target.value) || 0.0 })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
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
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Sick Leave Taken</label>
                <Input
                  type="number"
                  step="0.5"
                  value={editForm.sick_leave_taken}
                  onChange={(e) => setEditForm({ ...editForm, sick_leave_taken: parseFloat(e.target.value) || 0.0 })}
                  required
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason for Adjustment</label>
                <Textarea
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  placeholder="e.g. New employee allocation"
                  required
                  className="min-h-[100px] mt-1"
                />
              </div>
            </div>
            <DialogFooter className="border-t border-border/50 pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setEditingBalance(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
