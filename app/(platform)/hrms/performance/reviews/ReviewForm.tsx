"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ReviewFormProps {
  reviewId?: string;
}

export default function ReviewForm({ reviewId }: ReviewFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cycles, setCycles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Form Fields
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [reviewRating, setReviewRating] = useState("Good");
  const [reviewStrengths, setReviewStrengths] = useState("");
  const [reviewImprovements, setReviewImprovements] = useState("");
  const [reviewDevPlan, setReviewDevPlan] = useState("");
  const [reviewTraining, setReviewTraining] = useState("");
  const [reviewComments, setReviewComments] = useState("");
  const [reviewStatus, setReviewStatus] = useState("Draft");
  const [reviewerId, setReviewerId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("hrms_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const loadFormData = async () => {
      try {
        // Fetch cycles and employees
        const [cycleRes, empRes, profileRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/review-cycles`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, { headers })
        ]);

        if (cycleRes.ok) setCycles(await cycleRes.json());
        if (empRes.ok) setEmployees(await empRes.json());
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setReviewerId(profile.user?.id || null);
        }

        // If editing, load the review data
        if (reviewId) {
          const reviewRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/reviews`, { headers });
          if (reviewRes.ok) {
            const allReviews = await reviewRes.json();
            const review = allReviews.find((r: any) => r.id.toString() === reviewId);
            if (review) {
              setSelectedCycleId(review.review_cycle_id.toString());
              setSelectedEmployeeId(review.employee_id.toString());
              setReviewRating(review.overall_rating || "Good");
              setReviewStrengths(review.key_strengths || "");
              setReviewImprovements(review.improvement_areas || "");
              setReviewDevPlan(review.development_plan || "");
              setReviewTraining(review.training_recommendation || "");
              setReviewComments(review.comments || "");
              setReviewStatus(review.status || "Draft");
            } else {
              toast.error("Evaluation record not found");
              router.push("/hrms/performance");
            }
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load evaluation form reference data");
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [reviewId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleId || !selectedEmployeeId) {
      toast.error("Please select a cycle and employee first");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("hrms_token");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const payload = {
      review_cycle_id: parseInt(selectedCycleId),
      employee_id: parseInt(selectedEmployeeId),
      reviewer_id: reviewerId || 0,
      overall_rating: reviewRating,
      key_strengths: reviewStrengths,
      improvement_areas: reviewImprovements,
      comments: reviewComments,
      development_plan: reviewDevPlan,
      training_recommendation: reviewTraining,
      status: reviewStatus
    };

    try {
      let res;
      if (reviewId) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/reviews/${reviewId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            overall_rating: reviewRating,
            key_strengths: reviewStrengths,
            improvement_areas: reviewImprovements,
            comments: reviewComments,
            development_plan: reviewDevPlan,
            training_recommendation: reviewTraining,
            status: reviewStatus
          })
        });
      } else {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/reviews`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        toast.success(reviewStatus === "Submitted" ? "Performance evaluation finalized" : "Draft evaluation saved");
        router.push("/hrms/performance");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to save evaluation");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error submitting review");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading evaluation form...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <ShadcnButton variant="ghost" size="icon" className="rounded-full" onClick={() => router.push("/hrms/performance")}>
          <ArrowLeft className="h-5 w-5" />
        </ShadcnButton>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{reviewId ? "Edit Evaluation" : "New Performance Evaluation"}</h1>
          <p className="text-sm text-muted-foreground">Comprehensive professional evaluation workspace for employees.</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/30 backdrop-blur-md shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <span>Employee Evaluation Form</span>
          </CardTitle>
          <CardDescription>
            Input detailed, constructive feedback. Use the expanded text areas below to record achievements, growth points, and specific training plans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header info dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-border/20">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Review Cycle *</label>
                <Select value={selectedCycleId} onValueChange={setSelectedCycleId} disabled={!!reviewId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Cycle" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {cycles.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Employee *</label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} disabled={!!reviewId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id.toString()}>{e.first_name} {e.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ratings */}
            <div className="space-y-1.5 md:max-w-md">
              <label className="text-xs font-bold uppercase text-muted-foreground">Overall Rating *</label>
              <Select value={reviewRating} onValueChange={setReviewRating}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Rating" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Average">Average</SelectItem>
                  <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* EXPANDED TEXT AREAS */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Key Strengths *</label>
              <textarea
                value={reviewStrengths}
                onChange={e => setReviewStrengths(e.target.value)}
                placeholder="Detail what the employee did exceptionally well. Highlight specific achievements, contributions, and leadership moments."
                rows={5}
                required
                className="w-full border border-zinc-200 dark:border-zinc-800 bg-background/50 px-3.5 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Areas for Improvement *</label>
              <textarea
                value={reviewImprovements}
                onChange={e => setReviewImprovements(e.target.value)}
                placeholder="Give constructive feedback on areas needing growth, operational gaps, or skills to build."
                rows={5}
                required
                className="w-full border border-zinc-200 dark:border-zinc-800 bg-background/50 px-3.5 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>



            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Development & Action Plan</label>
              <textarea
                value={reviewDevPlan}
                onChange={e => setReviewDevPlan(e.target.value)}
                placeholder="Define action items, support required, timelines, or mentorship paths."
                rows={4}
                className="w-full border border-zinc-200 dark:border-zinc-800 bg-background/50 px-3.5 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Training Recommendations</label>
              <textarea
                value={reviewTraining}
                onChange={e => setReviewTraining(e.target.value)}
                placeholder="Courses, certifications, or specific skill coaching recommended."
                rows={3}
                className="w-full border border-zinc-200 dark:border-zinc-800 bg-background/50 px-3.5 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">General Manager Comments</label>
              <textarea
                value={reviewComments}
                onChange={e => setReviewComments(e.target.value)}
                placeholder="Any additional observations, cultural contributions, or general feedback."
                rows={4}
                className="w-full border border-zinc-200 dark:border-zinc-800 bg-background/50 px-3.5 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            {/* Status Selector */}
            <div className="space-y-1.5 pt-4 border-t border-border/20">
              <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="Draft">Save as Draft</SelectItem>
                  <SelectItem value="Submitted">Submit & Finalize</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/20">
              <ShadcnButton type="button" variant="outline" onClick={() => router.push("/hrms/performance")} disabled={saving}>
                Cancel
              </ShadcnButton>
              <ShadcnButton type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                {reviewId ? "Save Evaluation" : "Create Evaluation"}
              </ShadcnButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
