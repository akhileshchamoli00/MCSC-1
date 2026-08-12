"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Plus, Loader2, Eye, Edit } from "lucide-react";
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Roles</h1>
          <p className="text-muted-foreground mt-1">Manage access levels and permissions for the HRMS.</p>
        </div>
        <Link href="/hrms/roles/new">
          <Button className="shadow-md transition-transform hover:scale-[1.02]">
            <Plus className="h-4 w-4 mr-2" /> Add Role
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Role ID</th>
                <th className="px-6 py-4 font-medium">Role Name</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                      <p>Loading roles...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-destructive">
                    {error}
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No roles found</p>
                  </td>
                </tr>
              ) : (
                paginatedRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      #{role.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{role.name}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {role.description || "No description provided."}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/roles/${role.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/roles/${role.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
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
              <span className="font-medium text-foreground">{Math.min(roles.length, endIndex)}</span> of{" "}
              <span className="font-medium text-foreground">{roles.length}</span> entries
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
      </div>
    </div>
  );
}
