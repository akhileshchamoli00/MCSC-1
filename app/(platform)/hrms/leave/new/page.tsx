"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Coffee } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewLeavePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    leave_type: "ANNUAL",
    reason: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leave/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Leave Request Failed: ${err.detail || "Unknown error"}`);
      }

      router.push("/hrms/leave");
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/hrms/leave">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply for Leave</h1>
          <p className="text-muted-foreground mt-1">Submit a new leave request for approval.</p>
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
              <Coffee className="h-5 w-5 text-primary" /> Leave Details
            </CardTitle>
            <CardDescription>
              Please provide the dates and reason for your leave.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date *</label>
                <Input 
                  type="date"
                  name="start_date" 
                  value={formData.start_date} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date *</label>
                <Input 
                  type="date"
                  name="end_date" 
                  value={formData.end_date} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Leave Type *</label>
              <Select 
                value={formData.leave_type} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, leave_type: val }))}
              >
                <SelectTrigger className="w-full h-10 border border-input bg-background px-3 py-2 text-sm">
                  <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                  <SelectItem value="SICK">Sick Leave</SelectItem>
                  <SelectItem value="UNPAID">Unpaid Leave</SelectItem>
                  <SelectItem value="MATERNITY">Maternity/Paternity Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason / Remarks</label>
              <textarea 
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Briefly describe the reason for your leave..."
              ></textarea>
            </div>
          </CardContent>
        </Card>

        <div className="pt-2 flex justify-end gap-3 sticky bottom-4">
          <Link href="/hrms/leave">
            <Button variant="outline" type="button" className="bg-background">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="px-8 shadow-md">
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
