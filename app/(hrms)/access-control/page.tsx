"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";
import { 
  Shield, 
  Key, 
  Search, 
  Save, 
  RotateCcw, 
  Copy, 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  Check, 
  Loader2, 
  History,
  CheckSquare,
  Square,
  ChevronsUpDown,
  CornerDownRight,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface Module {
  id: number;
  name: string;
  code: string;
  parent_id: number | null;
  sub_modules: Module[];
}

interface Permission {
  id: number;
  name: string;
  code: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

interface AuditLog {
  id: number;
  employee_name: string;
  activity: string;
  created_at: string;
}

export default function AccessControlPage() {
  const router = useRouter();
  const { isAdmin, loading: userLoading } = useUser();

  // Data states
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Selection state: role_permission matrix mapping `{moduleId}:{permissionId}` -> boolean
  const [matrix, setMatrix] = useState<Record<string, boolean>>({});
  
  // UI states
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [cloneSourceId, setCloneSourceId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState("permissions");
  const [auditLogsPage, setAuditLogsPage] = useState(1);

  useEffect(() => {
    setAuditLogsPage(1);
  }, [activeTab]);

  // Redirect if not admin
  useEffect(() => {
    if (!userLoading && !isAdmin) {
      toast.error("Access denied. Admin permissions required.");
      router.push("/dashboard");
    }
  }, [isAdmin, userLoading, router]);

  // Initial Fetch: Roles, Modules, Permissions
  useEffect(() => {
    if (!isAdmin) return;

    const fetchInitialData = async () => {
      try {
        setLoadingData(true);
        const token = localStorage.getItem("hrms_token");
        const headers = { "Authorization": `Bearer ${token}` };

        const [rolesRes, modulesRes, permsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access-control/modules`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access-control/permissions`, { headers })
        ]);

        if (!rolesRes.ok || !modulesRes.ok || !permsRes.ok) {
          throw new Error("Failed to load setup tables");
        }

        const rolesData = await rolesRes.json();
        const modulesData = await modulesRes.json();
        const permsData = await permsRes.json();

        setRoles(rolesData);
        setModules(modulesData);
        setPermissions(permsData);

        // Expand all modules by default
        const initialExpanded: Record<number, boolean> = {};
        modulesData.forEach((m: Module) => {
          initialExpanded[m.id] = true;
        });
        setExpandedModules(initialExpanded);

        // Auto-select first role if available
        if (rolesData.length > 0) {
          setSelectedRoleId(rolesData[0].id.toString());
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load Access Control configuration details.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchInitialData();
  }, [isAdmin]);

  // Fetch Matrix Permissions when role changes
  useEffect(() => {
    if (!selectedRoleId || !isAdmin) return;

    const fetchRolePermissions = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access-control/role-permissions/${selectedRoleId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch role permissions");

        const data = await res.json();
        
        // Build matrix
        const newMatrix: Record<string, boolean> = {};
        data.forEach((rp: any) => {
          newMatrix[`${rp.module_id}:${rp.permission_id}`] = true;
        });
        setMatrix(newMatrix);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load permissions for selected role.");
      }
    };

    fetchRolePermissions();
  }, [selectedRoleId, isAdmin]);

  // Fetch Audit Logs when tab changes to audit-logs
  useEffect(() => {
    if (activeTab !== "audit-logs" || !isAdmin) return;

    const fetchAuditLogs = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access-control/audit-logs`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch audit logs");
        const data = await res.json();
        setAuditLogs(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load audit logs.");
      }
    };

    fetchAuditLogs();
  }, [activeTab, isAdmin]);

  if (userLoading || !isAdmin) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Helper to handle checkbox change
  const handleCheckboxChange = (moduleId: number, permissionId: number, checked: boolean) => {
    const key = `${moduleId}:${permissionId}`;
    setMatrix(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  // Helper to check if a checkbox is checked
  const isChecked = (moduleId: number, permissionId: number) => {
    return !!matrix[`${moduleId}:${permissionId}`];
  };

  // Toggle dynamic column (Bulk check all modules for a single action)
  const toggleColumn = (permissionId: number, checkAll: boolean) => {
    const newMatrix = { ...matrix };
    const traverseAndSet = (list: Module[]) => {
      list.forEach(m => {
        newMatrix[`${m.id}:${permissionId}`] = checkAll;
        if (m.sub_modules && m.sub_modules.length > 0) {
          traverseAndSet(m.sub_modules);
        }
      });
    };
    traverseAndSet(modules);
    setMatrix(newMatrix);
    toast.info(`${checkAll ? 'Checked' : 'Unchecked'} this permission column for all modules.`);
  };

  // Toggle dynamic row (Bulk check all actions for a single module)
  const toggleRow = (moduleId: number, checkAll: boolean) => {
    const viewPermission = permissions.find(p => p.code === "view");
    if (!viewPermission) return;
    setMatrix(prev => ({
      ...prev,
      [`${moduleId}:${viewPermission.id}`]: checkAll
    }));
  };

  // Save Permissions to Backend
  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("hrms_token");

      // Format payload
      const permissionsList: { role_id: number; module_id: number; permission_id: number }[] = [];
      Object.entries(matrix).forEach(([key, val]) => {
        if (val) {
          const [moduleId, permissionId] = key.split(":").map(Number);
          permissionsList.push({
            role_id: Number(selectedRoleId),
            module_id: moduleId,
            permission_id: permissionId
          });
        }
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access-control/role-permissions/${selectedRoleId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ permissions: permissionsList })
      });

      if (!res.ok) throw new Error("Failed to save permissions");

      toast.success("Role permissions updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // Reset/Wipe Permissions
  const handleResetPermissions = async () => {
    if (!selectedRoleId) return;
    if (!confirm("Are you sure you want to clear all permissions for this role?")) return;

    try {
      setResetting(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access-control/reset-permissions/${selectedRoleId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed to reset permissions");

      setMatrix({});
      toast.success("Wiped all permissions for this role successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reset permissions.");
    } finally {
      setResetting(false);
    }
  };

  // Clone Permissions
  const handleClonePermissions = async () => {
    if (!cloneSourceId || !selectedRoleId) {
      toast.error("Please select a valid source role.");
      return;
    }
    if (cloneSourceId === selectedRoleId) {
      toast.error("Cannot clone permissions to the same role.");
      return;
    }

    try {
      setCloning(true);
      const token = localStorage.getItem("hrms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access-control/clone-permissions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from_role_id: Number(cloneSourceId),
          to_role_id: Number(selectedRoleId)
        })
      });

      if (!res.ok) throw new Error("Failed to clone permissions");

      // Reload matrix
      const matrixRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/access-control/role-permissions/${selectedRoleId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (matrixRes.ok) {
        const data = await matrixRes.json();
        const newMatrix: Record<string, boolean> = {};
        data.forEach((rp: any) => {
          newMatrix[`${rp.module_id}:${rp.permission_id}`] = true;
        });
        setMatrix(newMatrix);
      }

      toast.success("Cloned permissions successfully!");
      setCloneSourceId("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clone permissions.");
    } finally {
      setCloning(false);
    }
  };

  // Filtering modules
  const filterModules = (list: Module[]): Module[] => {
    if (!searchQuery) return list;
    return list.reduce((acc: Module[], m) => {
      const matchesParent = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const filteredSubs = filterModules(m.sub_modules || []);
      
      if (matchesParent || filteredSubs.length > 0) {
        acc.push({
          ...m,
          sub_modules: filteredSubs
        });
      }
      return acc;
    }, []);
  };

  const filteredModulesList = filterModules(modules);

  const toggleExpand = (id: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const updated: Record<number, boolean> = {};
    modules.forEach(m => {
      updated[m.id] = true;
    });
    setExpandedModules(updated);
  };

  const collapseAll = () => {
    setExpandedModules({});
  };

  const currentRoleName = roles.find(r => r.id.toString() === selectedRoleId)?.name || "Selected Role";

  const auditLogsTotalPages = Math.ceil(auditLogs.length / 10);
  const auditLogsStartIndex = (auditLogsPage - 1) * 10;
  const auditLogsEndIndex = auditLogsStartIndex + 10;
  const paginatedAuditLogs = auditLogs.slice(auditLogsStartIndex, auditLogsEndIndex);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-xl text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Access Control Center</h1>
          </div>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm">
            Control dynamic system permissions and accessibility for user roles. Adjust visual flags, bulk actions, and view changes instantly.
          </p>
        </div>
        
        {/* Quick Audit tab trigger */}
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-muted/80 backdrop-blur-sm border border-border/40">
              <TabsTrigger value="permissions" className="flex items-center gap-1.5 cursor-pointer">
                <Key className="w-4 h-4" />
                <span>Permission Matrix</span>
              </TabsTrigger>
              <TabsTrigger value="audit-logs" className="flex items-center gap-1.5 cursor-pointer">
                <History className="w-4 h-4" />
                <span>Audit Logs</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loadingData ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
          <p className="text-lg">Initializing Access Control matrices...</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* PERMISSIONS TAB CONTENT */}
          <TabsContent value="permissions" className="space-y-6 outline-none">
            
            {/* Top Toolbar Control Card */}
            <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <span>Role Configuration</span>
                </CardTitle>
                <CardDescription>Select a dynamic system role to preview and override access policies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  
                  {/* Left: Select box */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="w-[280px]">
                      <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                        <SelectTrigger className="w-full h-11 bg-background/50 border-border/50">
                          <SelectValue placeholder="Select target role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.id.toString()} className="cursor-pointer">
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Clone dialog trigger */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-11 border-border/50 bg-background/40 hover:bg-muted cursor-pointer">
                          <Copy className="h-4 w-4 mr-2" /> Clone Permissions
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Clone Access Policies</DialogTitle>
                          <DialogDescription>
                            Copy permissions from another role directly onto <strong className="text-foreground">{currentRoleName}</strong>. This replaces all its current rules.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Select value={cloneSourceId} onValueChange={setCloneSourceId}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select source role to copy from" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.filter(r => r.id.toString() !== selectedRoleId).map(role => (
                                <SelectItem key={role.id} value={role.id.toString()} className="cursor-pointer">
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCloneSourceId("")} className="cursor-pointer">
                            Cancel
                          </Button>
                          <Button onClick={handleClonePermissions} disabled={cloning || !cloneSourceId} className="cursor-pointer">
                            {cloning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Confirm Clone
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Reset Button */}
                    <Button 
                      variant="destructive" 
                      onClick={handleResetPermissions} 
                      disabled={resetting || !selectedRoleId}
                      className="h-11 border border-destructive/20 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white transition-all cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" /> Reset Role
                    </Button>
                  </div>

                  {/* Right: Save actions */}
                  <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    <Button 
                      onClick={handleSavePermissions} 
                      disabled={saving || !selectedRoleId} 
                      className="h-11 shadow-md bg-primary hover:bg-primary/95 text-white transition-transform hover:scale-[1.02] cursor-pointer"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Permissions Matrix
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matrix Search & Toggle Options */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/75" />
                <Input 
                  placeholder="Filter system modules..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-border/50 bg-card/40 backdrop-blur-sm"
                />
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={expandAll} className="h-9 px-3 text-muted-foreground hover:text-foreground cursor-pointer">
                  Expand All
                </Button>
                <Separator orientation="vertical" className="h-4" />
                <Button variant="ghost" size="sm" onClick={collapseAll} className="h-9 px-3 text-muted-foreground hover:text-foreground cursor-pointer">
                  Collapse All
                </Button>
              </div>
            </div>

            {/* Matrix Table */}
            <Card className="border border-border/30 shadow-md bg-card/30 backdrop-blur-md overflow-hidden">
              <div className="overflow-x-auto w-full">
                <Table className="w-full min-w-[700px]">
                  <TableHeader className="bg-muted/50 dark:bg-muted/10 border-b border-border/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[50%] py-4 font-semibold text-foreground text-left pl-6">
                        Modules & Sub-Modules
                      </TableHead>
                      <TableHead className="w-[30%] py-4 text-center text-xs font-bold text-foreground">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="uppercase tracking-wider">Access Allowed</span>
                          {permissions.find(p => p.code === "view") && (
                            <div className="flex gap-1">
                              <button 
                                onClick={() => {
                                  const viewPerm = permissions.find(p => p.code === "view");
                                  if (viewPerm) toggleColumn(viewPerm.id, true);
                                }} 
                                className="text-[10px] text-primary hover:underline hover:text-primary/80 focus:outline-none"
                                title="Grant access to all modules"
                              >
                                All
                              </button>
                              <span className="text-[10px] text-muted-foreground">/</span>
                              <button 
                                onClick={() => {
                                  const viewPerm = permissions.find(p => p.code === "view");
                                  if (viewPerm) toggleColumn(viewPerm.id, false);
                                }} 
                                className="text-[10px] text-destructive hover:underline hover:text-destructive/80 focus:outline-none"
                                title="Revoke access from all modules"
                              >
                                None
                              </button>
                            </div>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[20%] text-right pr-6 font-semibold text-foreground">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/20">
                    {filteredModulesList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                          <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                          <p className="text-base font-semibold">No modules match your query</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredModulesList.map(module => {
                        const isExpanded = !!expandedModules[module.id];
                        const hasSubs = module.sub_modules && module.sub_modules.length > 0;
                        const viewPerm = permissions.find(p => p.code === "view");
                        
                        return (
                          <React.Fragment key={module.id}>
                            {/* Parent Module Row */}
                            <TableRow className="hover:bg-primary/5 transition-colors group/row bg-background/20">
                              <TableCell className="font-semibold py-4 pl-6 text-foreground">
                                <div className="flex items-center gap-2">
                                  {hasSubs ? (
                                    <button 
                                      onClick={() => toggleExpand(module.id)} 
                                      className="p-1 hover:bg-muted/80 rounded-lg text-muted-foreground/80 hover:text-foreground transition-all focus:outline-none"
                                    >
                                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </button>
                                  ) : (
                                    <span className="w-6" />
                                  )}
                                  
                                  <span className="text-slate-400 mr-1 shrink-0">
                                    {isExpanded ? <FolderOpen className="h-4 w-4 text-primary/60" /> : <Folder className="h-4 w-4 text-muted-foreground/60" />}
                                  </span>

                                  <div className="flex flex-col">
                                    <span className="text-[14px] leading-tight">{module.name}</span>
                                    <span className="text-[10px] text-muted-foreground/60 font-mono tracking-tight">{module.code}</span>
                                  </div>
                                </div>
                              </TableCell>
                              
                              {/* View permission checkbox */}
                              <TableCell className="text-center py-4">
                                <div className="flex justify-center items-center">
                                  {viewPerm && (
                                    <Checkbox 
                                      checked={isChecked(module.id, viewPerm.id)}
                                      onCheckedChange={(checked) => 
                                        handleCheckboxChange(module.id, viewPerm.id, !!checked)
                                      }
                                      className="data-[state=checked]:bg-primary cursor-pointer border-muted-foreground/40 hover:border-primary/80"
                                    />
                                  )}
                                </div>
                              </TableCell>

                              {/* Row shortcuts */}
                              <TableCell className="text-right py-4 pr-6">
                                <div className="flex justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => toggleRow(module.id, true)} 
                                    className="h-7 text-[10px] font-bold text-primary hover:text-primary/80 px-2 rounded-md hover:bg-primary/10 cursor-pointer"
                                  >
                                    Enable
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => toggleRow(module.id, false)} 
                                    className="h-7 text-[10px] font-bold text-destructive hover:text-destructive/80 px-2 rounded-md hover:bg-destructive/10 cursor-pointer"
                                  >
                                    Disable
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Sub-module Rows */}
                            {hasSubs && isExpanded && module.sub_modules.map(subMod => (
                              <TableRow key={subMod.id} className="hover:bg-primary/5 transition-colors group/row border-l-2 border-primary/10">
                                <TableCell className="py-3 pl-12 text-foreground font-normal">
                                  <div className="flex items-center gap-2">
                                    <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                                    <div className="flex flex-col">
                                      <span className="text-[13px] leading-tight font-medium text-foreground/90">{subMod.name}</span>
                                      <span className="text-[9px] text-muted-foreground/60 font-mono tracking-tight">{subMod.code}</span>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell className="text-center py-3">
                                  <div className="flex justify-center items-center">
                                    {viewPerm && (
                                      <Checkbox 
                                        checked={isChecked(subMod.id, viewPerm.id)}
                                        onCheckedChange={(checked) => 
                                          handleCheckboxChange(subMod.id, viewPerm.id, !!checked)
                                        }
                                        className="data-[state=checked]:bg-primary cursor-pointer border-muted-foreground/40 hover:border-primary/80 scale-90"
                                      />
                                    )}
                                  </div>
                                </TableCell>

                                <TableCell className="text-right py-3 pr-6">
                                  <div className="flex justify-end gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => toggleRow(subMod.id, true)} 
                                      className="h-7 text-[10px] font-bold text-primary hover:text-primary/80 px-2 rounded-md hover:bg-primary/10 cursor-pointer"
                                    >
                                      Enable
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => toggleRow(subMod.id, false)} 
                                      className="h-7 text-[10px] font-bold text-destructive hover:text-destructive/80 px-2 rounded-md hover:bg-destructive/10 cursor-pointer"
                                    >
                                      Disable
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* AUDIT LOGS TAB CONTENT */}
          <TabsContent value="audit-logs" className="outline-none">
            <Card className="border border-border/30 bg-card/60 backdrop-blur-md shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <span>Access Control Audit Trail</span>
                </CardTitle>
                <CardDescription>Review historic logging of all roles, assignments, and matrix overrides.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                  <Table className="w-full">
                    <TableHeader className="bg-muted/50 border-b border-border/30">
                      <TableRow>
                        <TableHead className="w-[15%] py-3 pl-6 font-semibold">Log ID</TableHead>
                        <TableHead className="w-[20%] py-3 font-semibold">User / Employee</TableHead>
                        <TableHead className="w-[45%] py-3 font-semibold">Activity Details</TableHead>
                        <TableHead className="w-[20%] py-3 pr-6 font-semibold text-right">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.length === 0 ? (
                        <TableRow>
                          <td colSpan={4} className="text-center py-12 text-muted-foreground text-sm">
                            No permission change logs found.
                          </td>
                        </TableRow>
                      ) : (
                        paginatedAuditLogs.map(log => (
                          <TableRow key={log.id} className="hover:bg-muted/20">
                            <td className="py-4 pl-6 font-mono text-muted-foreground text-xs">#{log.id}</td>
                            <td className="py-4 font-semibold text-sm">{log.employee_name}</td>
                            <td className="py-4 text-muted-foreground text-sm">{log.activity}</td>
                            <td className="py-4 pr-6 text-right font-mono text-muted-foreground text-xs">
                              {new Date(log.created_at).toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })}
                            </td>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {auditLogsTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
                    <div className="text-xs text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{auditLogsStartIndex + 1}</span> to{" "}
                      <span className="font-medium text-foreground">{Math.min(auditLogs.length, auditLogsEndIndex)}</span> of{" "}
                      <span className="font-medium text-foreground">{auditLogs.length}</span> entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditLogsPage(prev => Math.max(1, prev - 1))}
                        disabled={auditLogsPage === 1}
                        className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800 animate-none shrink-0"
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground px-2">
                        Page {auditLogsPage} of {auditLogsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditLogsPage(prev => Math.min(auditLogsTotalPages, prev + 1))}
                        disabled={auditLogsPage === auditLogsTotalPages}
                        className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800 animate-none shrink-0"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
