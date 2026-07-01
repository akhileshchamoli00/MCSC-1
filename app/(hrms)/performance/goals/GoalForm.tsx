"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Target } from "lucide-react";
import { toast } from "sonner";

interface GoalFormProps {
  goalId?: string;
}

export default function GoalForm({ goalId }: GoalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cycles, setCycles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Form Fields
  const [goalEmployeeId, setGoalEmployeeId] = useState("");
  const [goalCycleId, setGoalCycleId] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalPriority, setGoalPriority] = useState("Medium");
  const [goalStatus, setGoalStatus] = useState("Not Started");
  const [goalProgress, setGoalProgress] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("hrms_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const loadFormData = async () => {
      try {
        const [cycleRes, empRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/review-cycles`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { headers })
        ]);

        if (cycleRes.ok) setCycles(await cycleRes.json());
        if (empRes.ok) setEmployees(await empRes.json());

        // If editing, load the goal data
        if (goalId) {
          const goalRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/goals`, { headers });
          if (goalRes.ok) {
            const allGoals = await goalRes.json();
            const goal = allGoals.find((g: any) => g.id.toString() === goalId);
            if (goal) {
              setGoalEmployeeId(goal.employee_id.toString());
              setGoalCycleId(goal.review_cycle_id ? goal.review_cycle_id.toString() : "");
              setGoalTitle(goal.title || "");
              setGoalDesc(goal.description || "");
              setGoalTargetDate(goal.target_date || "");
              setGoalPriority(goal.priority || "Medium");
              setGoalStatus(goal.status || "Not Started");
              setGoalProgress(goal.progress_pct || 0);
            } else {
              toast.error("Goal not found");
              router.push("/performance");
            }
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load goal form reference data");
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [goalId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalEmployeeId) {
      toast.error("Please add a title and select an employee");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("hrms_token");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const payload = {
      employee_id: parseInt(goalEmployeeId),
      review_cycle_id: goalCycleId ? parseInt(goalCycleId) : null,
      title: goalTitle,
      description: goalDesc,
      target_date: goalTargetDate || null,
      priority: goalPriority,
      status: goalStatus,
      progress_pct: goalProgress
    };

    try {
      let res;
      if (goalId) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/goals/${goalId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            title: goalTitle,
            description: goalDesc,
            target_date: goalTargetDate || null,
            priority: goalPriority,
            status: goalStatus,
            progress_pct: goalProgress
          })
        });
      } else {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/goals`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        toast.success(goalId ? "Goal updated successfully" : "New goal created successfully");
        router.push("/performance");
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to submit goal");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error submitting goal");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading goal workspace...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <ShadcnButton variant="ghost" size="icon" className="rounded-full" onClick={() => router.push("/performance")}>
          <ArrowLeft className="h-5 w-5" />
        </ShadcnButton>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{goalId ? "Edit Goal" : "Create New Goal"}</h1>
          <p className="text-sm text-muted-foreground">Define key targets and monitor milestone execution.</p>
        </div>
      </div>

      <Card className="border-border/50 bg-card/30 backdrop-blur-md shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Target & Performance Goal</span>
          </CardTitle>
          <CardDescription>
            Outline critical targets, action points, and timelines for employee execution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-border/20">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Employee *</label>
                <Select value={goalEmployeeId} onValueChange={setGoalEmployeeId} disabled={!!goalId}>
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Review Cycle (Optional)</label>
                <Select value={goalCycleId} onValueChange={setGoalCycleId} disabled={!!goalId}>
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
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Goal Title *</label>
              <Input
                value={goalTitle}
                onChange={e => setGoalTitle(e.target.value)}
                placeholder="e.g. Automate monthly payroll reports"
                required
              />
            </div>

            {/* EXPANDED TEXT AREA FOR DESCRIPTION */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Detailed Description *</label>
              <textarea
                value={goalDesc}
                onChange={e => setGoalDesc(e.target.value)}
                placeholder="Detail what is expected, deliverables, measurable standards of success, and resources needed."
                rows={6}
                required
                className="w-full border border-zinc-200 dark:border-zinc-800 bg-background/50 px-3.5 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Target Date</label>
                <Input type="date" value={goalTargetDate} onChange={e => setGoalTargetDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Priority</label>
                <Select value={goalPriority} onValueChange={setGoalPriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
                <Select value={goalStatus} onValueChange={setGoalStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground flex justify-between">
                  <span>Milestone Progress</span>
                  <span className="font-bold">{goalProgress}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={goalProgress}
                  onChange={e => setGoalProgress(parseInt(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary mt-3"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/20">
              <ShadcnButton type="button" variant="outline" onClick={() => router.push("/performance")} disabled={saving}>
                Cancel
              </ShadcnButton>
              <ShadcnButton type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                {goalId ? "Save Goal" : "Create Goal"}
              </ShadcnButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
