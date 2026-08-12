"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Archive, 
  Check, 
  X, 
  Loader2, 
  UserCheck, 
  Filter, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function BusinessTeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Form Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    leader_id: "none",
    color: "#10b981",
    is_active: true
  });

  // Assign Members Modal State
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [assignMemberIds, setAssignMemberIds] = useState<number[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [titleFilter, setTitleFilter] = useState("ALL");
  const [savingMembers, setSavingMembers] = useState(false);

  // Predefined beautiful premium theme colors
  const premiumColors = [
    { name: "Emerald", hex: "#10b981" },
    { name: "Indigo", hex: "#6366f1" },
    { name: "Amethyst", hex: "#8b5cf6" },
    { name: "Rose", hex: "#f43f5e" },
    { name: "Ocean", hex: "#0ea5e9" },
    { name: "Amber", hex: "#f59e0b" },
    { name: "Teal", hex: "#14b8a6" },
    { name: "Slate", hex: "#64748b" }
  ];

  const fetchTeams = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    try {
      setLoadingTeams(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setTeams(await res.json());
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load teams");
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchEmployees = async () => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    try {
      setLoadingEmployees(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setEmployees(await res.json());
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load employee list");
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchEmployees();
  }, []);

  // Filtered teams list
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = 
        team.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
        team.code.toLowerCase().includes(teamSearchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && team.is_active) ||
        (statusFilter === "ARCHIVED" && !team.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [teams, teamSearchQuery, statusFilter]);

  // Unique departments and job titles for filters
  const departments = useMemo(() => {
    const depts = new Set(employees.map(emp => emp.department?.name).filter(Boolean));
    return Array.from(depts);
  }, [employees]);

  const jobTitles = useMemo(() => {
    const titles = new Set(employees.map(emp => emp.job_title).filter(Boolean));
    return Array.from(titles);
  }, [employees]);

  // Filtered employees list for member selection
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const matchesSearch = fullName.includes(memberSearchQuery.toLowerCase()) || 
                            (emp.employee_id_custom || "").toLowerCase().includes(memberSearchQuery.toLowerCase());
      const matchesDept = deptFilter === "ALL" || emp.department?.name === deptFilter;
      const matchesTitle = titleFilter === "ALL" || emp.job_title === titleFilter;
      return matchesSearch && matchesDept && matchesTitle;
    });
  }, [employees, memberSearchQuery, deptFilter, titleFilter]);

  // Handle Form submit (Create / Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    setFormLoading(true);
    const token = localStorage.getItem("hrms_token");
    const payload = {
      name: form.name,
      description: form.description,
      leader_id: form.leader_id === "none" ? null : parseInt(form.leader_id),
      color: form.color,
      is_active: form.is_active
    };

    try {
      const url = editingTeam 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/teams/${editingTeam.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/teams`;
      const method = editingTeam ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingTeam ? "Team updated successfully" : "Team created successfully");
        setIsFormOpen(false);
        fetchTeams();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to save team details");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setForm({
      name: "",
      description: "",
      leader_id: "none",
      color: "#10b981",
      is_active: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (team: any) => {
    setEditingTeam(team);
    setForm({
      name: team.name,
      description: team.description || "",
      leader_id: team.leader_id?.toString() || "none",
      color: team.color || "#10b981",
      is_active: team.is_active
    });
    setIsFormOpen(true);
  };

  const handleArchiveToggle = async (team: any) => {
    const token = localStorage.getItem("hrms_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams/${team.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !team.is_active })
      });
      if (res.ok) {
        toast.success(team.is_active ? "Team archived successfully" : "Team activated successfully");
        fetchTeams();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteTeam = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this team? All member relationships will be removed.")) return;
    const token = localStorage.getItem("hrms_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Team deleted successfully");
        fetchTeams();
      } else {
        toast.error("Failed to delete team");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete team");
    }
  };

  // Open member selection
  const handleOpenMembers = (team: any) => {
    setSelectedTeam(team);
    setAssignMemberIds((team.members || []).map((m: any) => m.id));
    setMemberSearchQuery("");
    setDeptFilter("ALL");
    setTitleFilter("ALL");
    setIsMembersOpen(true);
  };

  const handleToggleMember = (empId: number) => {
    setAssignMemberIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleSaveMembers = async () => {
    if (!selectedTeam) return;
    setSavingMembers(true);
    const token = localStorage.getItem("hrms_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams/${selectedTeam.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ employee_ids: assignMemberIds })
      });
      if (res.ok) {
        toast.success("Team membership updated successfully");
        setIsMembersOpen(false);
        fetchTeams();
      } else {
        toast.error("Failed to update team members");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save team members");
    } finally {
      setSavingMembers(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-10">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" /> Teams Directory
          </h1>
          <p className="text-muted-foreground mt-1">Manage workloads and cross-team mentions by grouping employees into functional units.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Create Work Team
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams by name or code..."
            className="pl-9 h-10"
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[160px] h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active Teams</SelectItem>
              <SelectItem value="ARCHIVED">Archived / Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={fetchTeams} className="h-10 w-10 text-muted-foreground hover:text-foreground shrink-0 border rounded-lg bg-background">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Teams Grid List */}
      {loadingTeams ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm">Loading teams directory...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-2xl bg-muted/20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/35 mb-4" />
          <h3 className="font-bold text-lg">No Teams Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {teamSearchQuery || statusFilter !== "ALL" 
              ? "Try adjusting your search queries or status filters." 
              : "Start by creating a functional work team to group employees."}
          </p>
          {!teamSearchQuery && statusFilter === "ALL" && (
            <Button onClick={handleOpenCreate} className="mt-4" size="sm">
              Create First Team
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => {
            const teamColor = team.color || "#10b981";
            return (
              <Card 
                key={team.id} 
                className="overflow-hidden hover:border-primary/30 transition-all duration-300 bg-background/50 border-border/40 shadow-md group rounded-2xl flex flex-col justify-between"
              >
                {/* Colored Accent Header Bar */}
                <div className="h-2 w-full" style={{ backgroundColor: teamColor }} />
                
                <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Team Details Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-extrabold text-lg text-foreground tracking-tight group-hover:text-primary transition-colors truncate max-w-[200px]" title={team.name}>
                          {team.name}
                        </h3>
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-sm">
                          {team.code}
                        </span>
                      </div>
                      
                      <Badge variant={team.is_active ? "default" : "outline"} className={team.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15" : "text-muted-foreground"}>
                        {team.is_active ? "Active" : "Archived"}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">
                      {team.description || "No description provided for this work team."}
                    </p>

                    {/* Team Leader Indicator */}
                    <div className="flex items-center gap-2 bg-muted/30 p-2.5 rounded-xl border border-border/30">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary shrink-0 border border-primary/20">
                        {team.leader ? `${team.leader.first_name[0]}${team.leader.last_name[0]}` : "TL"}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground/60 block font-bold uppercase tracking-wider">Team Leader</span>
                        <span className="text-xs font-semibold text-foreground truncate block">
                          {team.leader ? `${team.leader.first_name} ${team.leader.last_name}` : "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Team Members Count and Edit Bar */}
                  <div className="border-t border-border/40 pt-4 flex items-center justify-between">
                    <button 
                      onClick={() => handleOpenMembers(team)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Users className="h-4 w-4 opacity-75" />
                      <span>{team.members?.length || 0} Members</span>
                    </button>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenEdit(team)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleArchiveToggle(team)}
                        className={`h-8 w-8 rounded-lg ${team.is_active ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50/50" : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50/50"}`}
                        title={team.is_active ? "Archive Team" : "Activate Team"}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteTeam(team.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50/50 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* FORM DRAWER (CREATE & EDIT) */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 z-40 bg-black"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-border/60 flex items-center justify-between shrink-0 bg-muted/20">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {editingTeam ? <Edit2 className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                    {editingTeam ? "Modify Work Team" : "Create Work Team"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editingTeam ? `Updating configuration for ${editingTeam.name}` : "Configure metadata for a new team group."}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="h-8 w-8 rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Team Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Team Name *</label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Licensing Team"
                    maxLength={50}
                  />
                  {form.name && (
                    <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-1">
                      <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                      Auto-generating code: <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground font-bold">
                        {editingTeam ? editingTeam.code : form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 5) || "TEAM"}
                      </span>
                    </p>
                  )}
                </div>

                {/* Team Leader */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Team Leader</label>
                  <Select value={form.leader_id} onValueChange={(val) => setForm({ ...form, leader_id: val })}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select team leader..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned / No Leader</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.first_name} {emp.last_name} ({emp.job_title || "Consultant"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Team Color Theme */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase text-muted-foreground block">Team Theme Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {premiumColors.map(color => (
                      <button
                        key={color.hex}
                        type="button"
                        onClick={() => setForm({ ...form, color: color.hex })}
                        className={`h-9 rounded-xl flex items-center justify-center border transition-all duration-200 hover:scale-105 ${form.color === color.hex ? "border-primary shadow-sm" : "border-border/60 hover:border-border"}`}
                      >
                        <span className="h-4.5 w-4.5 rounded-full block border shadow-xs" style={{ backgroundColor: color.hex }} />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input 
                      type="color" 
                      value={form.color} 
                      onChange={(e) => setForm({ ...form, color: e.target.value })} 
                      className="h-10 w-16 p-1 cursor-pointer border rounded-lg bg-background shrink-0" 
                    />
                    <div className="text-xs">
                      <span className="text-muted-foreground block">Custom Color Hex Code</span>
                      <span className="font-mono font-bold text-foreground">{form.color.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Team Status (Active / Inactive) */}
                <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/10">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase text-foreground block">Team Status</span>
                    <span className="text-[10px] text-muted-foreground block">Inactive teams cannot be tagged in logs.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Team Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the scope, objectives, or workload responsibilities..."
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    maxLength={200}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold min-w-[100px]">
                    {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VIEW & ASSIGN MEMBERS MODAL */}
      <Dialog open={isMembersOpen} onOpenChange={(open) => !open && !savingMembers && setIsMembersOpen(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border/60 shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary" /> Assign Team Members
            </DialogTitle>
            <DialogDescription className="mt-1">
              Select who belongs to the team <span className="font-semibold text-foreground">{selectedTeam?.name} ({selectedTeam?.code})</span>. Employees can belong to multiple teams.
            </DialogDescription>
          </DialogHeader>

          {/* Member Search & Filters */}
          <div className="p-6 py-4 bg-muted/20 border-b border-border/40 space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name or custom ID..."
                className="pl-9 h-10 bg-background"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={titleFilter} onValueChange={setTitleFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Job Title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Job Titles</SelectItem>
                  {jobTitles.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Searchable Employees List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {loadingEmployees ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading directory...</span>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-xl">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No employees match your search criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredEmployees.map((emp) => {
                  const isChecked = assignMemberIds.includes(emp.id);
                  return (
                    <div 
                      key={emp.id}
                      onClick={() => handleToggleMember(emp.id)}
                      className={`flex items-center justify-between py-3 cursor-pointer hover:bg-muted/30 px-3 rounded-xl transition-colors ${isChecked ? "bg-primary/[0.02]" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary border border-primary/20 shrink-0">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{emp.first_name} {emp.last_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {emp.job_title || "Consultant"} • <span className="font-medium text-muted-foreground/80">{emp.department?.name || "General"}</span>
                          </p>
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${isChecked ? "border-primary bg-primary text-primary-foreground" : "border-zinc-300 dark:border-zinc-700 bg-background"}`}>
                        {isChecked && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Save Controls */}
          <DialogFooter className="p-6 border-t border-border/60 bg-muted/10 shrink-0">
            <div className="flex justify-between items-center w-full">
              <span className="text-xs font-semibold text-muted-foreground">
                {assignMemberIds.length} employees selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsMembersOpen(false)} disabled={savingMembers}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMembers} disabled={savingMembers} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  {savingMembers ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Assignment"}
                </Button>
              </div>
            </div>
          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  );
}
