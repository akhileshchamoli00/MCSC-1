"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Plus, Loader2, Eye, Edit, ShieldCheck, Users, Lock } from "lucide-react";
import { useState, useEffect } from "react";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch roles");
        }
        
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error("Error fetching roles:", err);
        setError("Could not load roles.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoles();
  }, []);

  const totalPages = Math.ceil(roles.length / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;
  const paginatedRoles = roles.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* MINIMALIST METRIC RIBBON & ACTION BUTTON */}
      {/* Minimalist Metrics Strip & Action Button Row */}
      <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
        {/* Minimalist Metric Strip - Expanded Horizontally */}
        <div className="grid grid-cols-2 md:grid-cols-4 items-center bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md border border-border/50 rounded-2xl p-2 sm:px-4 sm:py-2.5 shadow-xs flex-1 gap-2 sm:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
          
          {/* Configured Roles */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Configured Roles</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{roles.length}</p>
            </div>
          </div>

          {/* Admin Tiers */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Admin Tiers</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{roles.filter(r => (r.name || "").toLowerCase().includes("admin")).length}</p>
            </div>
          </div>

          {/* Staff Roles */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Staff Roles</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{roles.filter(r => !(r.name || "").toLowerCase().includes("admin")).length}</p>
            </div>
          </div>

          {/* Permission Grid */}
          <div className="flex items-center gap-3 px-2 sm:px-4 py-1.5 md:py-0 justify-start sm:justify-center">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">Permission Grid</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">Active</p>
            </div>
          </div>
        </div>

        {/* Add Role Button */}
        <Link href="/hrms/roles/new" className="shrink-0 flex items-stretch">
          <Button className="gap-2 font-bold shadow-sm rounded-2xl h-full min-h-[48px] px-6 text-sm">
            <Plus className="h-4 w-4" /> Add Role
          </Button>
        </Link>
      </div>

      <Card className="border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Role ID</th>
                  <th className="px-5 py-3.5">Role Name</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Loading roles...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-rose-500 text-xs">
                      {error}
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      <Shield className="h-10 w-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                      <p className="text-xs">No roles found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-4">
                        <span className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-mono text-zinc-800 dark:text-zinc-200 font-bold text-xs px-2.5 py-0.5 rounded-md inline-block">
                          #{role.id}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {role.name}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-xs">
                        {role.description || "No description provided."}
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5">
                        <Link href={`/roles/${role.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-lg">
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                        </Link>
                        <Link href={`/roles/${role.id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-semibold rounded-lg">
                            <Edit className="h-3.5 w-3.5" /> Edit
                          </Button>
                        </Link>
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
                <span className="font-medium text-foreground">{Math.min(roles.length, endIndex)}</span> of{" "}
                <span className="font-medium text-foreground">{roles.length}</span> entries
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
    </div>
  );
}
