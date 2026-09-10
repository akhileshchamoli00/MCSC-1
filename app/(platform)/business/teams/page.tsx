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
  FolderOpen,
  CheckCircle,
  Building2,
  Palette,
  Shield,
  Info,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { resolveImageUrl } from "@/lib/utils";

export default function BusinessTeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create / Edit Modal State
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
  const [formMemberIds, setFormMemberIds] = useState<number[]>([]);
  const [formMemberSearch, setFormMemberSearch] = useState("");

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
    { name: "Emerald", hex: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)" },
    { name: "Indigo", hex: "#6366f1", bg: "rgba(99, 102, 241, 0.15)", border: "rgba(99, 102, 241, 0.3)" },
    { name: "Violet", hex: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.3)" },
    { name: "Rose", hex: "#f43f5e", bg: "rgba(244, 63, 94, 0.15)", border: "rgba(244, 63, 94, 0.3)" },
    { name: "Ocean", hex: "#0ea5e9", bg: "rgba(14, 165, 233, 0.15)", border: "rgba(14, 165, 233, 0.3)" },
    { name: "Amber", hex: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)" },
    { name: "Teal", hex: "#14b8a6", bg: "rgba(20, 184, 166, 0.15)", border: "rgba(20, 184, 166, 0.3)" },
    { name: "Slate", hex: "#64748b", bg: "rgba(100, 116, 139, 0.15)", border: "rgba(100, 116, 139, 0.3)" }
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

  // Filtered employees list for member selection in modal
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

  // Filtered employees list for the create/edit form quick-assign
  const formFilteredEmployees = useMemo(() => {
    if (!formMemberSearch.trim()) return employees;
    const q = formMemberSearch.toLowerCase();
    return employees.filter(emp => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const customId = (emp.employee_id_custom || "").toLowerCase();
      const dept = (emp.department?.name || "").toLowerCase();
      const title = (emp.job_title || "").toLowerCase();
      return fullName.includes(q) || customId.includes(q) || dept.includes(q) || title.includes(q);
    });
  }, [employees, formMemberSearch]);

  // Helper to generate dynamic team code preview
  const previewCode = useMemo(() => {
    if (editingTeam) return editingTeam.code;
    if (!form.name.trim()) return "TEAM";
    const words = form.name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 4).toUpperCase();
    }
    return words.map(w => w[0]).join("").toUpperCase().slice(0, 5) || "TEAM";
  }, [editingTeam, form.name]);

  // Resolved leader object for live preview
  const selectedLeader = useMemo(() => {
    if (form.leader_id === "none") return null;
    return employees.find(emp => emp.id.toString() === form.leader_id) || null;
  }, [employees, form.leader_id]);

  // Handle Form submit (Create / Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter a valid team name");
      return;
    }
    setFormLoading(true);
    const token = localStorage.getItem("hrms_token");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
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
        const savedTeam = await res.json();
        const teamId = savedTeam.id || editingTeam?.id;

        // If member selection was modified, save membership
        if (teamId && (formMemberIds.length > 0 || editingTeam)) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams/${teamId}/members`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ employee_ids: formMemberIds })
            });
          } catch (memErr) {
            console.error("Failed to sync team members during creation:", memErr);
          }
        }

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
    setFormMemberIds([]);
    setFormMemberSearch("");
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
    setFormMemberIds((team.members || []).map((m: any) => m.id));
    setFormMemberSearch("");
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

  const handleToggleFormMember = (empId: number) => {
    setFormMemberIds(prev =>
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
    <div className="w-full max-w-none space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* MINIMALIST METRIC RIBBON & ACTION BUTTON */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 flex-1 divide-y md:divide-y-0 md:divide-x divide-border/50 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs">
          <div className="flex items-center gap-3 px-3 py-1.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Teams</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{teams.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-1.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Teams</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{teams.filter(t => t.is_active).length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-1.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Members</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-1.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Staff</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{employees.length}</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleOpenCreate} 
          className="gap-2 font-bold shadow-sm rounded-2xl h-auto min-h-[48px] px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create Work Team
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams by name or code..."
            className="pl-9 h-9.5 text-xs rounded-xl bg-background/60 border-border/50"
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[160px] h-9.5 text-xs rounded-xl bg-background/60 border-border/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50">
              <SelectItem value="ALL" className="text-xs cursor-pointer">All Statuses</SelectItem>
              <SelectItem value="ACTIVE" className="text-xs cursor-pointer">Active Teams</SelectItem>
              <SelectItem value="ARCHIVED" className="text-xs cursor-pointer">Archived / Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={fetchTeams} className="h-9.5 w-9.5 text-muted-foreground hover:text-foreground shrink-0 border border-border/50 rounded-xl bg-background/60 cursor-pointer">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Teams Grid List */}
      {loadingTeams ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs">Loading teams directory...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/60 rounded-2xl bg-card/20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/35 mb-4" />
          <h3 className="font-bold text-base text-foreground">No Teams Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            {teamSearchQuery || statusFilter !== "ALL" 
              ? "Try adjusting your search queries or status filters." 
              : "Start by creating a functional work team to group employees."}
          </p>
          {!teamSearchQuery && statusFilter === "ALL" && (
            <Button onClick={handleOpenCreate} className="mt-4 font-bold shadow-sm rounded-xl h-9 px-4 text-xs cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" /> Create First Team
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => {
            const teamColor = team.color || "#10b981";
            return (
              <Card 
                key={team.id} 
                className="overflow-hidden hover:border-emerald-500/30 transition-all duration-300 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border-border/50 shadow-sm group rounded-2xl flex flex-col justify-between"
              >
                {/* Colored Accent Header Bar */}
                <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: teamColor }} />
                
                <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    {/* Team Details Header */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-foreground tracking-tight group-hover:text-primary transition-colors truncate" title={team.name}>
                          {team.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold tracking-wider uppercase bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md border border-border/40">
                            {team.code}
                          </span>
                        </div>
                      </div>
                      
                      <Badge variant={team.is_active ? "default" : "outline"} className={team.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold shrink-0" : "text-[10px] text-muted-foreground shrink-0"}>
                        {team.is_active ? "Active" : "Archived"}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed">
                      {team.description || "No description provided for this work team."}
                    </p>

                    {/* Team Leader Indicator */}
                    <div className="flex items-center gap-2.5 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/20">
                        {team.leader ? `${team.leader.first_name?.[0] || ""}${team.leader.last_name?.[0] || ""}` : "TL"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">Team Leader</span>
                        <span className="text-xs font-semibold text-foreground truncate block">
                          {team.leader ? `${team.leader.first_name} ${team.leader.last_name}` : "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Team Members Count and Edit Bar */}
                  <div className="border-t border-border/40 pt-3.5 flex items-center justify-between">
                    <button 
                      onClick={() => handleOpenMembers(team)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5 opacity-75" />
                      <span>{team.members?.length || 0} Members</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenEdit(team)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                        title="Edit Team"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleArchiveToggle(team)}
                        className="h-8 w-8 rounded-lg cursor-pointer"
                        title={team.is_active ? "Archive Team" : "Activate Team"}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteTeam(team.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive rounded-lg cursor-pointer"
                        title="Delete Team"
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

      {/* STATE-OF-THE-ART CREATE & EDIT WORK TEAM MODAL */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && !formLoading && setIsFormOpen(false)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/50 bg-card/95 dark:bg-zinc-900/95 backdrop-blur-2xl shadow-2xl">
          
          {/* Top Dynamic Glowing Accent Strip */}
          <div 
            className="h-1.5 w-full shrink-0 transition-colors duration-300"
            style={{ backgroundColor: form.color }}
          />

          {/* Modal Header */}
          <DialogHeader className="px-6 py-4 border-b border-border/40 shrink-0 flex flex-row items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-2xl flex items-center justify-center border shrink-0 transition-colors duration-300"
                style={{ 
                  backgroundColor: `${form.color}18`, 
                  borderColor: `${form.color}35`,
                  color: form.color 
                }}
              >
                {editingTeam ? <Edit2 className="h-5 w-5" /> : <Users className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  {editingTeam ? "Modify Work Team" : "Create Work Team"}
                  <span 
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase border transition-colors duration-300"
                    style={{ 
                      backgroundColor: `${form.color}15`, 
                      borderColor: `${form.color}30`,
                      color: form.color 
                    }}
                  >
                    {previewCode}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {editingTeam 
                    ? `Update team structure, membership, and workspace routing for ${editingTeam.name}.`
                    : "Configure a cross-functional work team with assigned leadership, color identity, and member roster."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* 2-Column Responsive Body */}
          <form id="team-form" onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Team Attributes & Details (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Team Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" /> Team Name <span className="text-destructive">*</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">{form.name.length}/50</span>
                  </div>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Legal & Licensing Team"
                    maxLength={50}
                    className="h-10 text-xs rounded-xl bg-background/70 border-border/50 focus:border-primary font-medium"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1 text-[10px]">
                      <Sparkles className="h-3 w-3 text-emerald-500" />
                      Auto-routing code: <span className="font-mono font-bold text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40">{previewCode}</span>
                    </span>
                  </div>
                </div>

                {/* Team Leader Assignment */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary" /> Team Leader / Supervisor
                  </label>
                  <Select value={form.leader_id} onValueChange={(val) => setForm({ ...form, leader_id: val })}>
                    <SelectTrigger className="w-full h-10 text-xs rounded-xl bg-background/70 border-border/50">
                      <SelectValue placeholder="Select team leader..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 max-h-60">
                      <SelectItem value="none" className="text-xs cursor-pointer">
                        <span className="text-muted-foreground">Unassigned / No Designated Leader</span>
                      </SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()} className="text-xs cursor-pointer">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                              {emp.first_name?.[0]}{emp.last_name?.[0]}
                            </div>
                            <span className="font-semibold">{emp.first_name} {emp.last_name}</span>
                            <span className="text-[10px] text-muted-foreground">({emp.job_title || emp.department?.name || "Staff"})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme Color Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-primary" /> Team Color Identity
                    </label>
                    <span className="text-[10px] font-mono font-bold uppercase text-foreground">{form.color}</span>
                  </div>
                  
                  {/* Preset Palette Chips */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {premiumColors.map(color => {
                      const isSelected = form.color.toLowerCase() === color.hex.toLowerCase();
                      return (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setForm({ ...form, color: color.hex })}
                          className={`group relative h-9 rounded-xl flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                            isSelected 
                              ? "ring-2 ring-offset-2 ring-foreground/20 scale-105 border-transparent shadow-md" 
                              : "border-border/40 hover:border-border hover:scale-102"
                          }`}
                          style={{ backgroundColor: color.bg }}
                          title={color.name}
                        >
                          <span 
                            className="h-4 w-4 rounded-full shadow-xs flex items-center justify-center transition-transform" 
                            style={{ backgroundColor: color.hex }}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 text-white stroke-[3px]" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Hex Color Picker */}
                  <div className="flex items-center gap-3 pt-1">
                    <input 
                      type="color" 
                      value={form.color} 
                      onChange={(e) => setForm({ ...form, color: e.target.value })} 
                      className="h-8 w-12 p-0.5 cursor-pointer border border-border/50 rounded-lg bg-background/80 shrink-0" 
                    />
                    <Input 
                      type="text"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      placeholder="#10B981"
                      className="h-8 text-xs font-mono uppercase rounded-lg w-28 bg-background/70 border-border/50"
                      maxLength={7}
                    />
                    <span className="text-[11px] text-muted-foreground">Custom theme hex code</span>
                  </div>
                </div>

                {/* Team Status Switch */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Team Operational Status</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, is_active: true })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        form.is_active 
                          ? "bg-emerald-500/10 border-emerald-500/40 text-foreground ring-1 ring-emerald-500/30 shadow-xs" 
                          : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${form.is_active ? "bg-emerald-500 text-white shadow-xs" : "bg-muted text-muted-foreground"}`}>
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs">Active Team</p>
                        <p className="text-[10px] text-muted-foreground truncate">Available for order tagging</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, is_active: false })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        !form.is_active 
                          ? "bg-amber-500/10 border-amber-500/40 text-foreground ring-1 ring-amber-500/30 shadow-xs" 
                          : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${!form.is_active ? "bg-amber-500 text-white shadow-xs" : "bg-muted text-muted-foreground"}`}>
                        <Archive className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs">Archived Team</p>
                        <p className="text-[10px] text-muted-foreground truncate">Hidden from active feeds</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Team Scope / Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Scope & Responsibilities</label>
                    <span className="text-[10px] text-muted-foreground">{form.description.length}/200</span>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Briefly describe the team's charter, jurisdiction, and project responsibilities..."
                    className="flex min-h-[85px] w-full rounded-xl border border-border/50 bg-background/70 px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none leading-relaxed"
                    maxLength={200}
                  />
                </div>

              </div>

              {/* RIGHT COLUMN: Live Card Preview & Initial Members (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* 1. Live Interactive Card Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Live Team Card Preview
                    </span>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase px-1.5 py-0 border-border/50">
                      Real-time
                    </Badge>
                  </div>

                  <Card className="overflow-hidden border-border/60 bg-card/40 backdrop-blur-md shadow-md rounded-2xl">
                    {/* Top dynamic accent bar */}
                    <div className="h-1.5 w-full shrink-0 transition-colors duration-300" style={{ backgroundColor: form.color }} />
                    
                    <div className="p-4 space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">
                            {form.name.trim() || "New Work Team"}
                          </h4>
                          <span 
                            className="inline-block text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border mt-1 transition-colors duration-300"
                            style={{ 
                              backgroundColor: `${form.color}15`, 
                              borderColor: `${form.color}30`,
                              color: form.color 
                            }}
                          >
                            {previewCode}
                          </span>
                        </div>
                        <Badge 
                          variant={form.is_active ? "default" : "outline"}
                          className={form.is_active ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-bold" : "text-[9px] text-muted-foreground"}
                        >
                          {form.is_active ? "Active" : "Archived"}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[30px] leading-relaxed">
                        {form.description.trim() || "Team description and operational scope preview."}
                      </p>

                      {/* Leader Preview */}
                      <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border border-border/40">
                        <div 
                          className="h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border transition-colors duration-300"
                          style={{ 
                            backgroundColor: `${form.color}20`, 
                            borderColor: `${form.color}40`,
                            color: form.color 
                          }}
                        >
                          {selectedLeader ? `${selectedLeader.first_name?.[0] || ""}${selectedLeader.last_name?.[0] || ""}` : "TL"}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground block">Leader</span>
                          <span className="text-[11px] font-semibold text-foreground truncate block">
                            {selectedLeader ? `${selectedLeader.first_name} ${selectedLeader.last_name}` : "Unassigned"}
                          </span>
                        </div>
                      </div>

                      {/* Member Count Strip */}
                      <div className="border-t border-border/40 pt-2.5 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-primary flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formMemberIds.length} Initial Member{formMemberIds.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Ready to Deploy</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* 2. Initial Members Quick Selector */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-primary" /> Assign Team Members
                    </label>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {formMemberIds.length} Selected
                    </span>
                  </div>

                  {/* Search inside member list */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search staff by name or dept..."
                      value={formMemberSearch}
                      onChange={(e) => setFormMemberSearch(e.target.value)}
                      className="pl-8 h-8 text-[11px] rounded-xl bg-background/70 border-border/50"
                    />
                  </div>

                  {/* Scrollable member checklist */}
                  <div className="border border-border/50 rounded-2xl bg-background/50 divide-y divide-border/40 max-h-48 overflow-y-auto p-1">
                    {formFilteredEmployees.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-xs">
                        No employees found matching search.
                      </div>
                    ) : (
                      formFilteredEmployees.map(emp => {
                        const isSelected = formMemberIds.includes(emp.id);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => handleToggleFormMember(emp.id)}
                            className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                              isSelected ? "bg-primary/10" : "hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 border border-primary/20">
                                {emp.first_name?.[0]}{emp.last_name?.[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-foreground truncate">
                                  {emp.first_name} {emp.last_name}
                                </p>
                                <p className="text-[9px] text-muted-foreground truncate">
                                  {emp.job_title || emp.department?.name || "Staff"}
                                </p>
                              </div>
                            </div>
                            <div className={`h-4 w-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border bg-background"
                            }`}>
                              {isSelected && <Check className="h-2.5 w-2.5 stroke-[3px]" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

            </div>
          </form>

          {/* Modal Footer Controls */}
          <DialogFooter className="px-6 py-4 border-t border-border/40 shrink-0 flex flex-row items-center justify-between bg-muted/20">
            <div className="text-xs text-muted-foreground font-medium hidden sm:flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>{editingTeam ? "Ready to update team" : "Configured with " + formMemberIds.length + " initial member(s)"}</span>
            </div>
            
            <div className="flex items-center gap-2.5 ml-auto">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)} 
                disabled={formLoading}
                className="h-9 rounded-xl text-xs font-semibold px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="team-form"
                disabled={formLoading} 
                className="h-9 rounded-xl text-xs font-bold px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving...
                  </>
                ) : editingTeam ? (
                  "Save Changes"
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Work Team
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* VIEW & ASSIGN MEMBERS MODAL */}
      <Dialog open={isMembersOpen} onOpenChange={(open) => !open && !savingMembers && setIsMembersOpen(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/50 bg-card/95 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-border/40 shrink-0 bg-muted/20">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-2xl flex items-center justify-center border shrink-0"
                style={{ 
                  backgroundColor: `${selectedTeam?.color || "#10b981"}18`, 
                  borderColor: `${selectedTeam?.color || "#10b981"}35`,
                  color: selectedTeam?.color || "#10b981" 
                }}
              >
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  Assign Team Members
                  <span 
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase border"
                    style={{ 
                      backgroundColor: `${selectedTeam?.color || "#10b981"}15`, 
                      borderColor: `${selectedTeam?.color || "#10b981"}30`,
                      color: selectedTeam?.color || "#10b981" 
                    }}
                  >
                    {selectedTeam?.code}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Select employee personnel assigned to <span className="font-semibold text-foreground">{selectedTeam?.name}</span>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Member Search & Filters */}
          <div className="p-4 bg-muted/20 border-b border-border/40 space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name or custom ID..."
                className="pl-9 h-9.5 text-xs rounded-xl bg-background/80 border-border/50"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background/80 border-border/50">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="ALL" className="text-xs cursor-pointer">All Departments</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d} value={d} className="text-xs cursor-pointer">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={titleFilter} onValueChange={setTitleFilter}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background/80 border-border/50">
                  <SelectValue placeholder="Job Title" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="ALL" className="text-xs cursor-pointer">All Job Titles</SelectItem>
                  {jobTitles.map(t => (
                    <SelectItem key={t} value={t} className="text-xs cursor-pointer">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Searchable Employees List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingEmployees ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs">Loading directory...</span>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs border border-dashed border-border/60 rounded-2xl">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50 text-emerald-500" />
                <p>No employees match your search criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40 border border-border/40 rounded-2xl overflow-hidden bg-background/40">
                {filteredEmployees.map((emp) => {
                  const isChecked = assignMemberIds.includes(emp.id);
                  return (
                    <div 
                      key={emp.id}
                      onClick={() => handleToggleMember(emp.id)}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/40 transition-colors ${isChecked ? "bg-primary/[0.04]" : ""}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shrink-0">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground truncate">{emp.first_name} {emp.last_name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {emp.job_title || "Consultant"} • <span className="font-medium text-muted-foreground/80">{emp.department?.name || "General"}</span>
                          </p>
                        </div>
                      </div>
                      <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${isChecked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                        {isChecked && <Check className="h-3 w-3 stroke-[3px]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Save Controls */}
          <DialogFooter className="p-4 border-t border-border/40 bg-muted/20 shrink-0 flex flex-row items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {assignMemberIds.length} staff member{assignMemberIds.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsMembersOpen(false)} disabled={savingMembers} className="h-9 rounded-xl text-xs font-semibold px-4 cursor-pointer">
                Cancel
              </Button>
              <Button onClick={handleSaveMembers} disabled={savingMembers} className="h-9 rounded-xl text-xs font-bold px-5 shadow-sm cursor-pointer">
                {savingMembers ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Save Membership
              </Button>
            </div>
          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  );
}
