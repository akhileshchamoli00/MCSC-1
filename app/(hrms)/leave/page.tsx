"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Edit, Loader2, Coffee } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function LeaveManagementPage() {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit Modal State
  const [editingBalance, setEditingBalance] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    annual_leave_balance: 0.0,
    sick_leave_balance: 0.0,
    annual_leave_taken: 0.0,
    sick_leave_taken: 0.0,
    reason: ""
  });
  const [saving, setSaving] = useState(false);

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

  const handleEditClick = (balance: any) => {
    setEditingBalance(balance);
    setEditForm({
      annual_leave_balance: balance.annual_leave_balance,
      sick_leave_balance: balance.sick_leave_balance,
      annual_leave_taken: balance.annual_leave_taken || 0.0,
      sick_leave_taken: balance.sick_leave_taken || 0.0,
      reason: ""
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.reason.trim()) {
      alert("Reason for adjustment is required.");
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
                  <th className="px-4 py-3 font-medium">Sick Leave Bal.</th>
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
                  filteredBalances.map((balance) => (
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
                      <td className="px-4 py-3 font-semibold text-orange-600">
                        {balance.sick_leave_balance} Days
                      </td>
                      <td className="px-4 py-3 font-semibold text-muted-foreground">
                        {balance.sick_leave_taken || 0} Days
                      </td>
                      <td className="px-4 py-3 text-right">
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
        </CardContent>
      </Card>

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
                    step="any"
                    value={editForm.annual_leave_balance} 
                    onChange={(e) => setEditForm({...editForm, annual_leave_balance: parseFloat(e.target.value) || 0.0})}
                    required
                    className="mt-1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Annual Leave Taken</label>
                  <Input 
                    type="number" 
                    step="any"
                    value={editForm.annual_leave_taken} 
                    onChange={(e) => setEditForm({...editForm, annual_leave_taken: parseFloat(e.target.value) || 0.0})}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Sick Leave Bal.</label>
                  <Input 
                    type="number" 
                    step="any"
                    value={editForm.sick_leave_balance} 
                    onChange={(e) => setEditForm({...editForm, sick_leave_balance: parseFloat(e.target.value) || 0.0})}
                    required
                    className="mt-1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Sick Leave Taken</label>
                  <Input 
                    type="number" 
                    step="any"
                    value={editForm.sick_leave_taken} 
                    onChange={(e) => setEditForm({...editForm, sick_leave_taken: parseFloat(e.target.value) || 0.0})}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason for Adjustment</label>
                <Textarea 
                  value={editForm.reason}
                  onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
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
