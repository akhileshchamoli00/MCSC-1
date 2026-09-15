"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/${roleId}`, {
      credentials: "include",
          });
        
        if (response.ok) {
          const data = await response.json();
          setFormData({
            name: data.name || "",
            description: data.description || ""
          });
        } else {
          setError("Failed to load role data");
        }
      } catch (err) {
        console.error("Failed to fetch role", err);
        setError("Network error occurred while loading data");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [roleId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/${roleId}`, {
      credentials: "include",
        method: "PUT",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Role Update Failed: ${err.detail || "Unknown error"}`);
      }

      router.push("/hrms/roles");
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-10 text-center text-muted-foreground animate-pulse">Loading role data...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto pb-10">
      {/* Top Back Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/hrms/roles">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 h-10 px-4 text-xs font-semibold bg-card/60 backdrop-blur-md border-border/50 shadow-xs hover:bg-muted cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Back to Roles
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Role Details
            </CardTitle>
            <CardDescription>
              Update the name and purpose of the role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Name *</label>
              <Input 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
                placeholder="e.g. IT_ADMIN" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Briefly describe the access level or purpose of this role..."
              ></textarea>
            </div>
          </CardContent>
        </Card>

        <div className="pt-2 flex justify-end gap-3 sticky bottom-4">
          <Link href="/hrms/roles">
            <Button variant="outline" type="button" className="bg-background">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="px-8 shadow-md">
            {loading ? "Updating..." : "Update Role"}
          </Button>
        </div>
      </form>
    </div>
  );
}
