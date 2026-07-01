"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function RoleProfilePage() {
  const params = useParams();
  const roleId = params.id as string;
  const [role, setRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const token = localStorage.getItem("hrms_token");
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/${roleId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setRole(await res.json());
        } else {
          setError("Failed to fetch role details.");
        }
      } catch (err) {
        console.error("Failed to load role:", err);
        setError("Network error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [roleId]);

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading role profile...</div>;
  }

  if (error || !role) {
    return (
      <div className="p-10 text-center">
        <div className="text-destructive mb-4">{error || "Role not found"}</div>
        <Link href="/roles">
          <Button variant="outline">Back to Roles Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/roles">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Role Details</h1>
      </div>

      <div className="max-w-3xl">
        <Card className="border-border/50 shadow-sm relative overflow-hidden">
          <div className="h-24 bg-primary/10 w-full relative">
            <Link href={`/roles/${role.id}/edit`}>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-background/50 backdrop-blur-sm rounded-full h-8 w-8 hover:bg-background/80">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <CardContent className="pt-0 relative pb-10">
            <div className="absolute -top-12 left-6 h-24 w-24 rounded-full border-4 border-card bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Shield className="h-10 w-10" />
            </div>
            
            <div className="pt-16 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">ID: {role.id}</span>
                </div>
                <h2 className="text-2xl font-bold">{role.name}</h2>
              </div>
              
              <div className="space-y-2 border-t border-border/50 pt-6">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {role.description || "No description has been provided for this role."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
