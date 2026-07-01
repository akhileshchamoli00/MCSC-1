"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, ShieldPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("hrms_token");
      if (!token) throw new Error("Authentication token not found. Please log in again.");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Role Creation Failed: ${err.detail || "Unknown error"}`);
      }

      router.push("/roles");
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/roles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Role</h1>
          <p className="text-muted-foreground mt-1">Create a new system role for HRMS users.</p>
        </div>
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
              <ShieldPlus className="h-5 w-5 text-primary" /> Role Details
            </CardTitle>
            <CardDescription>
              Define the name and purpose of the new role. Make sure the name is unique (e.g. "HR_MANAGER").
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
          <Link href="/roles">
            <Button variant="outline" type="button" className="bg-background">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="px-8 shadow-md">
            {loading ? "Saving..." : "Create Role"}
          </Button>
        </div>
      </form>
    </div>
  );
}
