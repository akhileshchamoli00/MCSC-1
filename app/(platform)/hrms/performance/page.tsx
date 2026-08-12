"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/contexts/user-context";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Award,
  Calendar,
  CheckCircle,
  Plus,
  Loader2,
  TrendingUp,
  FileText,
  User,
  Activity,
  AlertCircle,
  Clock,
  Target,
  Sparkles,
  BarChart,
  Edit,
  ClipboardList,
  BookOpen,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolveImageUrl } from "@/lib/utils";
import Link from "next/link";

export default function PerformancePage() {
  const { profile } = useUser();
  const { resolvedTheme } = useTheme();
  const [role, setRole] = useState("EMPLOYEE");
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [reviewsPage, setReviewsPage] = useState(1);
  const [cyclesPage, setCyclesPage] = useState(1);
  const [selfReviewsPage, setSelfReviewsPage] = useState(1);

  // Lists
  const [cycles, setCycles] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [selfReviews, setSelfReviews] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    pending_reviews: 0,
    completed_reviews: 0,
    needing_improvement: 0,
    top_performers: 0,
    upcoming_goals: [],
    department_summary: []
  });

  // Modal Dialog states
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selfReviewDialogOpen, setSelfReviewDialogOpen] = useState(false);

  // Form Fields - Cycles
  const [cycleName, setCycleName] = useState("");
  const [cycleStart, setCycleStart] = useState("");
  const [cycleEnd, setCycleEnd] = useState("");
  const [cycleDept, setCycleDept] = useState<string>("all");
  const [cycleStatus, setCycleStatus] = useState("Draft");
  const [editingCycleId, setEditingCycleId] = useState<number | null>(null);
  
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");
  const [selectedYear, setSelectedYear] = useState("2026");

  const updateCycleDates = (quarter: string, year: string) => {
    setCycleName(`${quarter} ${year}`);
    if (quarter === "Q1") {
      setCycleStart(`${year}-01-01`);
      setCycleEnd(`${year}-03-31`);
    } else if (quarter === "Q2") {
      setCycleStart(`${year}-04-01`);
      setCycleEnd(`${year}-06-30`);
    } else if (quarter === "Q3") {
      setCycleStart(`${year}-07-01`);
      setCycleEnd(`${year}-09-30`);
    } else if (quarter === "Q4") {
      setCycleStart(`${year}-10-01`);
      setCycleEnd(`${year}-12-31`);
    } else if (quarter === "Yearly") {
      setCycleStart(`${year}-01-01`);
      setCycleEnd(`${year}-12-31`);
    }
  };

  // Form Fields - Reviews
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [reviewRating, setReviewRating] = useState("Good");
  const [reviewStrengths, setReviewStrengths] = useState("");
  const [reviewImprovements, setReviewImprovements] = useState("");
  const [reviewComments, setReviewComments] = useState("");
  const [reviewDevPlan, setReviewDevPlan] = useState("");
  const [reviewTraining, setReviewTraining] = useState("");
  const [reviewStatus, setReviewStatus] = useState("Draft");
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  // Form Fields - Goals
  const [goalEmployeeId, setGoalEmployeeId] = useState<string>("");
  const [goalCycleId, setGoalCycleId] = useState<string>("");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalPriority, setGoalPriority] = useState("Medium");
  const [goalStatus, setGoalStatus] = useState("Not Started");
  const [goalProgress, setGoalProgress] = useState(0);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);

  // Form Fields - Self Reviews
  const [selfCycleId, setSelfCycleId] = useState<string>("");
  const [selfAchievements, setSelfAchievements] = useState("");
  const [selfChallenges, setSelfChallenges] = useState("");
  const [selfSupport, setSelfSupport] = useState("");
  const [selfSkills, setSelfSkills] = useState("");
  const [selfRating, setSelfRating] = useState("Good");

  // Read-only Details view
  const [selectedReviewDetails, setSelectedReviewDetails] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedMyReview, setSelectedMyReview] = useState<any>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role") || "EMPLOYEE";
    setRole(savedRole.toUpperCase());
    fetchData();
  }, []);

  useEffect(() => {
    if (reviews.length > 0 && profile) {
      const mySubmitted = reviews.filter((r: any) => r.employee_id === profile.id && r.status === "Submitted");
      if (mySubmitted.length > 0 && !selectedMyReview) {
        setSelectedMyReview(mySubmitted[0]);
      }
    }
  }, [reviews, profile]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const endpoints = [
        `${process.env.NEXT_PUBLIC_API_URL}/api/performance/dashboard-stats`,
        `${process.env.NEXT_PUBLIC_API_URL}/api/performance/review-cycles`,
        `${process.env.NEXT_PUBLIC_API_URL}/api/performance/reviews`,
        `${process.env.NEXT_PUBLIC_API_URL}/api/performance/goals`,
        `${process.env.NEXT_PUBLIC_API_URL}/api/performance/self-reviews`,
        `${process.env.NEXT_PUBLIC_API_URL}/api/departments`,
        `${process.env.NEXT_PUBLIC_API_URL}/api/employees`
      ];

      const responses = await Promise.all(
        endpoints.map(url => fetch(url, { headers }))
      );

      const dataPromises = responses.map(async (res, idx) => {
        if (res.ok) {
          const data = await res.json();
          if (idx === 0) setStats(data);
          else if (idx === 1) setCycles(data);
          else if (idx === 2) setReviews(data);
          else if (idx === 3) setGoals(data);
          else if (idx === 4) setSelfReviews(data);
          else if (idx === 5) setDepartments(data);
          else if (idx === 6) setEmployees(data);
        } else {
          console.error(`Failed to fetch endpoint ${endpoints[idx]}: ${res.status}`);
        }
      });

      await Promise.all(dataPromises);

    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      toast.error("Failed to load performance metrics");
    } finally {
      setLoading(false);
    }
  };

  // Helper Check for Manager
  const isManager = role === "ADMIN" || employees.some(e => e.manager_id === profile?.id);

  // Submit Cycle
  const handleCycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName || !cycleStart || !cycleEnd) {
      toast.error("Please fill all required cycle fields");
      return;
    }

    const token = localStorage.getItem("hrms_token");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const payload = {
      name: cycleName,
      start_date: cycleStart,
      end_date: cycleEnd,
      department_id: cycleDept === "all" ? null : parseInt(cycleDept),
      status: cycleStatus
    };

    try {
      let res;
      if (editingCycleId) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/review-cycles/${editingCycleId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/review-cycles`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        toast.success(editingCycleId ? "Review cycle updated" : "Review cycle created successfully");
        setCycleDialogOpen(false);
        resetCycleForm();
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to submit review cycle");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error submitting review cycle");
    }
  };

  const resetCycleForm = () => {
    setSelectedQuarter("Q1");
    setSelectedYear("2026");
    setCycleName("Q1 2026");
    setCycleStart("2026-01-01");
    setCycleEnd("2026-03-31");
    setCycleDept("all");
    setCycleStatus("Draft");
    setEditingCycleId(null);
  };

  // Submit Manager Evaluation
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleId || !selectedEmployeeId) {
      toast.error("Please select a cycle and employee first");
      return;
    }

    const token = localStorage.getItem("hrms_token");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const payload = {
      review_cycle_id: parseInt(selectedCycleId),
      employee_id: parseInt(selectedEmployeeId),
      reviewer_id: profile?.user?.id || 0,
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
      if (editingReviewId) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/reviews/${editingReviewId}`, {
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
        setReviewDialogOpen(false);
        resetReviewForm();
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to save evaluation");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error submitting review");
    }
  };

  const resetReviewForm = () => {
    setSelectedCycleId("");
    setSelectedEmployeeId("");
    setReviewRating("Good");
    setReviewStrengths("");
    setReviewImprovements("");
    setReviewComments("");
    setReviewDevPlan("");
    setReviewTraining("");
    setReviewStatus("Draft");
    setEditingReviewId(null);
  };

  // Submit Goal
  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalEmployeeId) {
      toast.error("Please add a title and select an employee");
      return;
    }

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
      if (editingGoalId) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/goals/${editingGoalId}`, {
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
        toast.success(editingGoalId ? "Goal updated successfully" : "New goal created successfully");
        setGoalDialogOpen(false);
        resetGoalForm();
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to submit goal");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error creating goal");
    }
  };

  const resetGoalForm = () => {
    setGoalEmployeeId("");
    setGoalCycleId("");
    setGoalTitle("");
    setGoalDesc("");
    setGoalTargetDate("");
    setGoalPriority("Medium");
    setGoalStatus("Not Started");
    setGoalProgress(0);
    setEditingGoalId(null);
  };

  // Submit Self Review
  const handleSelfReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfCycleId) {
      toast.error("Please select a review cycle");
      return;
    }

    const token = localStorage.getItem("hrms_token");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const payload = {
      review_cycle_id: parseInt(selfCycleId),
      employee_id: profile?.id || 0,
      achievements: selfAchievements,
      challenges: selfChallenges,
      support_needed: selfSupport,
      skills_to_improve: selfSkills,
      self_rating: selfRating
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/self-review`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success("Self review submitted successfully!");
        setSelfReviewDialogOpen(false);
        resetSelfForm();
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to submit self evaluation");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error submitting self review");
    }
  };

  const resetSelfForm = () => {
    setSelfCycleId("");
    setSelfAchievements("");
    setSelfChallenges("");
    setSelfSupport("");
    setSelfSkills("");
    setSelfRating("Good");
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-border/50 bg-card/30 backdrop-blur-md">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Aggregating performance metrics...</p>
        </div>
      </div>
    );
  }

  // Reviews Pagination
  const reviewsTotalPages = Math.ceil(reviews.length / 10);
  const reviewsStartIndex = (reviewsPage - 1) * 10;
  const reviewsEndIndex = reviewsStartIndex + 10;
  const paginatedReviews = reviews.slice(reviewsStartIndex, reviewsEndIndex);

  // Cycles Pagination
  const cyclesTotalPages = Math.ceil(cycles.length / 10);
  const cyclesStartIndex = (cyclesPage - 1) * 10;
  const cyclesEndIndex = cyclesStartIndex + 10;
  const paginatedCycles = cycles.slice(cyclesStartIndex, cyclesEndIndex);

  // Self-Reviews Pagination
  const mySelfReviews = selfReviews.filter(sr => sr.employee_id === profile?.id);
  const selfReviewsTotalPages = Math.ceil(mySelfReviews.length / 10);
  const selfReviewsStartIndex = (selfReviewsPage - 1) * 10;
  const selfReviewsEndIndex = selfReviewsStartIndex + 10;
  const paginatedSelfReviews = mySelfReviews.slice(selfReviewsStartIndex, selfReviewsEndIndex);

  return (
    <div className="flex-1 space-y-8 pb-10">
      
      {/* Visual Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-zinc-100 via-slate-100/80 to-zinc-200/60 dark:from-[#030712] dark:via-[#09152b] dark:to-[#030712] border border-zinc-200/80 dark:border-slate-800/40">
        <div className="absolute top-[-50%] right-[-10%] w-[380px] h-[380px] rounded-full blur-[95px] pointer-events-none -z-10 animate-float-slow bg-zinc-300/30 dark:bg-sky-500/5" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs backdrop-blur-md rounded-full font-semibold flex items-center gap-1.5 w-fit">
              <Award className="h-4 w-4" />
              <span>Performance Evaluation Center</span>
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-zinc-700 via-slate-700 to-zinc-900 dark:from-sky-300 dark:via-blue-200 dark:to-indigo-300 pb-1">
              Evaluations & Goals
            </h1>
            <p className="text-zinc-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
              Review accomplishments, record constructive feedback, set milestones, and tracks employee development.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:flex md:w-fit gap-1 bg-background border border-border p-1 rounded-xl">
          <TabsTrigger value="dashboard" className="rounded-lg text-xs font-semibold px-4 py-2">Dashboard</TabsTrigger>
          {(role === "ADMIN" || isManager) && (
            <TabsTrigger value="evaluations" className="rounded-lg text-xs font-semibold px-4 py-2">Evaluations</TabsTrigger>
          )}
          <TabsTrigger value="goals" className="rounded-lg text-xs font-semibold px-4 py-2">Goals</TabsTrigger>
          {role === "ADMIN" && (
            <TabsTrigger value="cycles" className="rounded-lg text-xs font-semibold px-4 py-2">Review Cycles</TabsTrigger>
          )}
          {role === "EMPLOYEE" && (
            <>
              <TabsTrigger value="my-reviews" className="rounded-lg text-xs font-semibold px-4 py-2">My Reviews</TabsTrigger>
              <TabsTrigger value="self-reviews" className="rounded-lg text-xs font-semibold px-4 py-2">Self-Evaluations</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* 1. DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-border/50 bg-card/30 backdrop-blur-md shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Pending Reviews</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-amber-500 flex items-center gap-2">
                  <Clock className="h-6 w-6" /> {stats.pending_reviews}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border/50 bg-card/30 backdrop-blur-md shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Completed Reviews</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-emerald-500 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6" /> {stats.completed_reviews}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border/50 bg-card/30 backdrop-blur-md shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Top Performers</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-blue-500 flex items-center gap-2">
                  <Sparkles className="h-6 w-6" /> {stats.top_performers}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border/50 bg-card/30 backdrop-blur-md shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-wider">Improvement Required</CardDescription>
                <CardTitle className="text-3xl font-extrabold text-rose-500 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6" /> {stats.needing_improvement}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Goals Deadlines */}
            <Card className="lg:col-span-2 border-border/50 bg-card/30 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> Active Goals Progress
                </CardTitle>
                <CardDescription>Top employee milestones and targeted dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.upcoming_goals && stats.upcoming_goals.length > 0 ? (
                  stats.upcoming_goals.map((g: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border border-border/40 bg-background/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{g.title}</p>
                          <p className="text-[10px] text-muted-foreground">Assignee: {g.employee_name}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          Target: {g.target_date || "N/A"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={g.progress_pct} className="h-1.5 flex-1" />
                        <span className="text-xs font-bold">{g.progress_pct}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm italic text-muted-foreground py-4 text-center">No active goals listed.</p>
                )}
              </CardContent>
            </Card>

            {/* Department Summary */}
            <Card className="border-border/50 bg-card/30 backdrop-blur-md shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" /> Department Summary
                </CardTitle>
                <CardDescription>Completed reviews per department</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.department_summary && stats.department_summary.length > 0 ? (
                  stats.department_summary.map((d: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border-b border-border/20 pb-2">
                      <span className="text-sm font-semibold">{d.department_name}</span>
                      <Badge variant="outline" className="font-bold">{d.completed_reviews} Finished</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs italic text-muted-foreground text-center py-4">No completion aggregates found.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. EVALUATIONS TAB */}
        <TabsContent value="evaluations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Manager Performance Evaluations</h2>
            {(role === "ADMIN" || isManager) && (
              <Link href="/hrms/performance/reviews/new">
                <Button className="h-9 text-xs font-semibold gap-1.5">
                  <Plus className="h-4 w-4" /> Create Review
                </Button>
              </Link>
            )}
          </div>

          <Card className="border-border/50 bg-card/30 backdrop-blur-md shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/40">
                    <tr>
                      <th className="px-5 py-4 font-semibold tracking-wider">Employee</th>
                      <th className="px-5 py-4 font-semibold tracking-wider">Review Cycle</th>
                      <th className="px-5 py-4 font-semibold tracking-wider">Overall Rating</th>
                      <th className="px-5 py-4 font-semibold tracking-wider">Status</th>
                      <th className="px-5 py-4 font-semibold tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {reviews.length > 0 ? (
                      paginatedReviews.map((r) => (
                        <tr key={r.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-5 py-4 font-bold text-foreground">
                            {r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : "Unknown"}
                          </td>
                          <td className="px-5 py-4 font-medium text-muted-foreground">
                            {r.cycle?.name || "N/A"}
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant="outline" className={`font-bold ${
                              r.overall_rating === "Excellent" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              r.overall_rating === "Good" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              r.overall_rating === "Average" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                              "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            }`}>
                              {r.overall_rating || "N/A"}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant="outline" className={r.status === "Submitted" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-right space-x-2">
                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => {
                              setSelectedReviewDetails(r);
                              setDetailsDialogOpen(true);
                            }}>
                              View
                            </Button>
                            {r.status === "Draft" && (r.reviewer_id === profile?.user?.id || role === "ADMIN") && (
                              <Link href={`/performance/reviews/${r.id}/edit`}>
                                <Button size="sm" variant="ghost" className="h-8 text-xs gap-1">
                                  <Edit className="h-3 w-3" /> Edit
                                </Button>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground italic">No evaluations found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {reviewsTotalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
                  <div className="text-xs text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{reviewsStartIndex + 1}</span> to{" "}
                    <span className="font-medium text-foreground">{Math.min(reviews.length, reviewsEndIndex)}</span> of{" "}
                    <span className="font-medium text-foreground">{reviews.length}</span> entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewsPage(prev => Math.max(1, prev - 1))}
                      disabled={reviewsPage === 1}
                      className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground px-2">
                      Page {reviewsPage} of {reviewsTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewsPage(prev => Math.min(reviewsTotalPages, prev + 1))}
                      disabled={reviewsPage === reviewsTotalPages}
                      className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. GOALS TAB */}
        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Goals & Milestones Tracker</h2>
            {(role === "ADMIN" || isManager) && (
              <Link href="/hrms/performance/goals/new">
                <Button className="h-9 text-xs font-semibold gap-1.5">
                  <Plus className="h-4 w-4" /> Create Goal
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.length > 0 ? (
              goals.map((g) => (
                <Card key={g.id} className="border-border/50 bg-card/30 backdrop-blur-md shadow-sm flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={`font-bold ${
                        g.priority === "High" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                        g.priority === "Medium" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                      }`}>
                        {g.priority} Priority
                      </Badge>
                      <Badge variant="outline" className={`font-bold ${
                        g.status === "Completed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        g.status === "In Progress" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                        g.status === "Delayed" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                        "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                      }`}>
                        {g.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold leading-tight">{g.title}</CardTitle>
                    {g.description && <CardDescription className="text-xs mt-1">{g.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>Milestone Progress</span>
                        <span>{g.progress_pct}%</span>
                      </div>
                      <Progress value={g.progress_pct} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border/20 text-muted-foreground">
                      <span>Target: {g.target_date || "N/A"}</span>
                      {g.review_cycle_id && <span>Cycle ID: {g.review_cycle_id}</span>}
                    </div>

                    {/* Quick update for Employee on their own goal */}
                    {role === "EMPLOYEE" && g.employee_id === profile?.id && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="w-full text-xs font-semibold h-8 mt-2">
                            Update Progress
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Goal Progress</DialogTitle>
                            <DialogDescription>Update the completion status and percentage of this milestone.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            const token = localStorage.getItem("hrms_token");
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/performance/goals/${g.id}`, {
                              method: "PUT",
                              headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json"
                              },
                              body: JSON.stringify({
                                progress_pct: g.progress_pct,
                                status: g.status
                              })
                            });
                            if (res.ok) {
                              toast.success("Progress saved");
                              fetchData();
                            }
                          }} className="space-y-4 py-2">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
                              <Select defaultValue={g.status} onValueChange={(val) => { g.status = val; }}>
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
                              <label className="text-xs font-bold uppercase text-muted-foreground">Progress %</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                defaultValue={g.progress_pct}
                                onChange={e => { g.progress_pct = parseInt(e.target.value); }}
                                className="w-full h-10 border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm rounded-md"
                              />
                            </div>
                            <DialogFooter>
                              <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Edit for Manager/Admin */}
                    {(role === "ADMIN" || isManager) && (
                      <Link href={`/performance/goals/${g.id}/edit`} className="block w-full">
                        <Button size="sm" variant="ghost" className="w-full text-xs font-semibold h-8 mt-2 border border-border/40 hover:bg-muted/20">
                          Edit Goal Details
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-muted-foreground italic">No goals registered.</div>
            )}
          </div>
        </TabsContent>

        {/* 4. ADMIN REVIEW CYCLES TAB */}
        {role === "ADMIN" && (
          <TabsContent value="cycles" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Evaluation Review Cycles</h2>
              <Dialog open={cycleDialogOpen} onOpenChange={(open) => { setCycleDialogOpen(open); if(!open) resetCycleForm(); }}>
                <DialogTrigger asChild>
                  <Button className="h-9 text-xs font-semibold gap-1.5">
                    <Plus className="h-4 w-4" /> Create Cycle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCycleId ? "Edit Review Cycle" : "Create Review Cycle"}</DialogTitle>
                    <DialogDescription>Define the start, end, and targeting status of this performance review schedule.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCycleSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Review Cycle *</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-muted-foreground">Quarter</span>
                          <Select value={selectedQuarter} onValueChange={(val) => {
                            setSelectedQuarter(val);
                            updateCycleDates(val, selectedYear);
                          }}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Quarter" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value="Q1">Q1 (Jan - Mar)</SelectItem>
                              <SelectItem value="Q2">Q2 (Apr - Jun)</SelectItem>
                              <SelectItem value="Q3">Q3 (Jul - Sep)</SelectItem>
                              <SelectItem value="Q4">Q4 (Oct - Dec)</SelectItem>
                              <SelectItem value="Yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-muted-foreground">Year</span>
                          <Select value={selectedYear} onValueChange={(val) => {
                            setSelectedYear(val);
                            updateCycleDates(selectedQuarter, val);
                          }}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value="2026">2026</SelectItem>
                              <SelectItem value="2027">2027</SelectItem>
                              <SelectItem value="2028">2028</SelectItem>
                              <SelectItem value="2029">2029</SelectItem>
                              <SelectItem value="2030">2030</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Start Date *</label>
                        <Input type="date" value={cycleStart} onChange={e => setCycleStart(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">End Date *</label>
                        <Input type="date" value={cycleEnd} onChange={e => setCycleEnd(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Target Department</label>
                        <Select value={cycleDept} onValueChange={setCycleDept}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Departments" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map(d => (
                              <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Status</label>
                        <Select value={cycleStatus} onValueChange={setCycleStatus}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCycleDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Submit</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-border/50 bg-card/30 backdrop-blur-md shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/40">
                      <tr>
                        <th className="px-5 py-4 font-semibold tracking-wider">Cycle Name</th>
                        <th className="px-5 py-4 font-semibold tracking-wider text-center">Start Date</th>
                        <th className="px-5 py-4 font-semibold tracking-wider text-center">End Date</th>
                        <th className="px-5 py-4 font-semibold tracking-wider text-center">Status</th>
                        <th className="px-5 py-4 font-semibold tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {cycles.length > 0 ? (
                        paginatedCycles.map((c) => (
                          <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-5 py-4 font-bold text-foreground">{c.name}</td>
                            <td className="px-5 py-4 text-center font-medium text-muted-foreground">{c.start_date}</td>
                            <td className="px-5 py-4 text-center font-medium text-muted-foreground">{c.end_date}</td>
                            <td className="px-5 py-4 text-center">
                              <Badge variant="outline" className={`font-bold ${
                                c.status === "Active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                c.status === "Closed" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                              }`}>
                                {c.status}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Button size="sm" variant="ghost" className="h-8 text-xs gap-1" onClick={() => {
                                setEditingCycleId(c.id);
                                setCycleName(c.name);
                                setCycleStart(c.start_date);
                                setCycleEnd(c.end_date);
                                setCycleDept(c.department_id ? c.department_id.toString() : "all");
                                setCycleStatus(c.status);
                                const parts = c.name.split(" ");
                                if (parts.length >= 2) {
                                  setSelectedQuarter(parts[0]);
                                  setSelectedYear(parts[1]);
                                }
                                setCycleDialogOpen(true);
                              }}>
                                <Edit className="h-3 w-3" /> Edit
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground italic">No review cycles configured.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {cyclesTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
                    <div className="text-xs text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{cyclesStartIndex + 1}</span> to{" "}
                      <span className="font-medium text-foreground">{Math.min(cycles.length, cyclesEndIndex)}</span> of{" "}
                      <span className="font-medium text-foreground">{cycles.length}</span> entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCyclesPage(prev => Math.max(1, prev - 1))}
                        disabled={cyclesPage === 1}
                        className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground px-2">
                        Page {cyclesPage} of {cyclesTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCyclesPage(prev => Math.min(cyclesTotalPages, prev + 1))}
                        disabled={cyclesPage === cyclesTotalPages}
                        className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* 5. EMPLOYEE MY REVIEWS TAB */}
        {role === "EMPLOYEE" && (
          <TabsContent value="my-reviews" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">My Performance Reviews</h2>
              <p className="text-sm text-muted-foreground">Select a cycle to view your manager's evaluation feedback.</p>
            </div>
            
            {reviews.filter(r => r.employee_id === profile?.id && r.status === "Submitted").length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Side: Cycle List */}
                <div className="space-y-3 lg:col-span-1">
                  {reviews
                    .filter(r => r.employee_id === profile?.id && r.status === "Submitted")
                    .map((r) => {
                      const isSelected = selectedMyReview?.id === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setSelectedMyReview(r)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                              : "bg-card hover:bg-muted/30 border-border/60 hover:border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {r.cycle?.name || "Review Cycle"}
                            </span>
                            <Badge variant="outline" className={`font-semibold text-[10px] ${
                              r.overall_rating === "Excellent" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              r.overall_rating === "Good" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              r.overall_rating === "Average" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                              "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            }`}>
                              {r.overall_rating}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>By: {r.reviewer?.first_name ? `${r.reviewer.first_name} ${r.reviewer.last_name}` : (r.reviewer?.email || "Manager")}</span>
                            <span>{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Right Side: Review Details */}
                <div className="lg:col-span-2">
                  {selectedMyReview ? (
                    <Card className="border border-border/50 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
                      {/* Header bar */}
                      <div className="p-6 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Performance Review Details</p>
                          <h3 className="text-xl font-bold mt-1 text-foreground">{selectedMyReview.cycle?.name || "Review"}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Overall Score:</span>
                          <Badge variant="outline" className={`px-3 py-1 text-xs font-black tracking-wide ${
                            selectedMyReview.overall_rating === "Excellent" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            selectedMyReview.overall_rating === "Good" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                            selectedMyReview.overall_rating === "Average" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          }`}>
                            {selectedMyReview.overall_rating}
                          </Badge>
                        </div>
                      </div>

                      {/* Detail segments */}
                      <CardContent className="p-6 space-y-6">
                        {/* 1. Key Strengths */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <Award className="h-4 w-4 text-emerald-500" />
                            <span>Key Strengths & Highlights</span>
                          </div>
                          <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/5 text-sm leading-relaxed text-foreground">
                            {selectedMyReview.key_strengths || "No highlights entered by your manager."}
                          </div>
                        </div>

                        {/* 2. Areas for Improvement */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                            <span>Areas for Development</span>
                          </div>
                          <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-950/40 bg-amber-50/20 dark:bg-amber-950/5 text-sm leading-relaxed text-foreground">
                            {selectedMyReview.improvement_areas || "No improvement points entered by your manager."}
                          </div>
                        </div>

                        {/* 3. Action / Development Plan */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <Target className="h-4 w-4 text-blue-500" />
                            <span>Development & Action Plan</span>
                          </div>
                          <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-950/40 bg-blue-50/20 dark:bg-blue-950/5 text-sm leading-relaxed text-foreground">
                            {selectedMyReview.development_plan || "No action plan entered by your manager."}
                          </div>
                        </div>

                        {/* 4. Training Recommendations */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                            <BookOpen className="h-4 w-4 text-indigo-500" />
                            <span>Training & Certification Guidance</span>
                          </div>
                          <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/20 dark:bg-indigo-950/5 text-sm leading-relaxed text-foreground">
                            {selectedMyReview.training_recommendation || "No training courses recommended by your manager."}
                          </div>
                        </div>

                        {/* 5. General Comments */}
                        {selectedMyReview.comments && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                              <MessageSquare className="h-4 w-4 text-slate-500" />
                              <span>Evaluator Comments</span>
                            </div>
                            <div className="p-4 rounded-xl border border-border bg-muted/10 text-sm leading-relaxed text-foreground italic">
                              "{selectedMyReview.comments}"
                            </div>
                          </div>
                        )}

                        {/* Footer details */}
                        <div className="pt-4 border-t border-border/20 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-muted-foreground gap-2">
                          <span>Evaluated by: <span className="font-semibold">{selectedMyReview.reviewer?.first_name ? `${selectedMyReview.reviewer.first_name} ${selectedMyReview.reviewer.last_name}` : (selectedMyReview.reviewer?.email || "Manager")}</span></span>
                          <span>Audit Timestamp: {new Date(selectedMyReview.created_at).toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="p-8 border border-dashed border-border/60 rounded-xl text-center text-muted-foreground bg-card">
                      Select a cycle review card on the left to see detailed feedback.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Card className="border border-border/45 p-8 text-center text-muted-foreground bg-card/30 backdrop-blur-md">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No finalized performance reviews found.</p>
                <p className="text-xs text-muted-foreground/85 mt-1">Once your manager submits an evaluation for you, it will appear here.</p>
              </Card>
            )}
          </TabsContent>
        )}

        {/* 6. EMPLOYEE SELF-EVALUATIONS TAB */}
        {role === "EMPLOYEE" && (
          <TabsContent value="self-reviews" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">My Self-Evaluations</h2>
              <Dialog open={selfReviewDialogOpen} onOpenChange={(open) => { setSelfReviewDialogOpen(open); if(!open) resetSelfForm(); }}>
                <DialogTrigger asChild>
                  <Button className="h-9 text-xs font-semibold gap-1.5">
                    <Plus className="h-4 w-4" /> Submit Self-Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit Self-Evaluation</DialogTitle>
                    <DialogDescription>Submit your feedback and goals before the manager review is scheduled.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSelfReviewSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Review Cycle *</label>
                      <Select value={selfCycleId} onValueChange={setSelfCycleId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Active Cycle" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {cycles.filter(c => c.status === "Active").map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">What did you achieve? *</label>
                      <textarea
                        value={selfAchievements}
                        onChange={e => setSelfAchievements(e.target.value)}
                        placeholder="List major accomplishments"
                        rows={3}
                        className="w-full border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm rounded-md"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">What challenges did you face?</label>
                      <textarea
                        value={selfChallenges}
                        onChange={e => setSelfChallenges(e.target.value)}
                        placeholder="List blockers or difficulties"
                        rows={3}
                        className="w-full border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm rounded-md"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">What support do you need from management?</label>
                      <textarea
                        value={selfSupport}
                        onChange={e => setSelfSupport(e.target.value)}
                        placeholder="Tooling, guidelines, or timeline support"
                        rows={2}
                        className="w-full border border-zinc-300 dark:border-zinc-700 bg-background px-3 py-2 text-sm rounded-md"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Skills you want to improve</label>
                      <Input value={selfSkills} onChange={e => setSelfSkills(e.target.value)} placeholder="e.g. System designs, Cloud computing" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Self Rating</label>
                      <Select value={selfRating} onValueChange={setSelfRating}>
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

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setSelfReviewDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Submit Evaluation</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-border/50 bg-card/30 backdrop-blur-md shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/40">
                      <tr>
                        <th className="px-5 py-4 font-semibold tracking-wider">Review Cycle</th>
                        <th className="px-5 py-4 font-semibold tracking-wider">Self Rating</th>
                        <th className="px-5 py-4 font-semibold tracking-wider">Achievements</th>
                        <th className="px-5 py-4 font-semibold tracking-wider">Challenges</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {mySelfReviews.length > 0 ? (
                        paginatedSelfReviews.map((sr) => (
                          <tr key={sr.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-5 py-4 font-bold text-foreground">Cycle ID: {sr.review_cycle_id}</td>
                            <td className="px-5 py-4">
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold">{sr.self_rating}</Badge>
                            </td>
                            <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">{sr.achievements}</td>
                            <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">{sr.challenges || "None"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground italic">No self evaluations submitted yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selfReviewsTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0">
                    <div className="text-xs text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{selfReviewsStartIndex + 1}</span> to{" "}
                      <span className="font-medium text-foreground">{Math.min(mySelfReviews.length, selfReviewsEndIndex)}</span> of{" "}
                      <span className="font-medium text-foreground">{mySelfReviews.length}</span> entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelfReviewsPage(prev => Math.max(1, prev - 1))}
                        disabled={selfReviewsPage === 1}
                        className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground px-2">
                        Page {selfReviewsPage} of {selfReviewsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelfReviewsPage(prev => Math.min(selfReviewsTotalPages, prev + 1))}
                        disabled={selfReviewsPage === selfReviewsTotalPages}
                        className="h-8 text-xs bg-background border-zinc-200 dark:border-zinc-800"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* READ-ONLY REVIEW DETAILS DIALOG */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 border-b border-border/40 bg-muted/20 pb-4">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Performance Review Breakdown
            </DialogTitle>
            <DialogDescription className="text-xs">
              Detailed performance assessment and career development blueprint.
            </DialogDescription>
          </DialogHeader>

          {selectedReviewDetails && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Meta Stats Panel */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-border/50 bg-muted/10">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Employee</p>
                  <p className="font-bold text-sm text-foreground mt-0.5">
                    {selectedReviewDetails.employee ? `${selectedReviewDetails.employee.first_name} ${selectedReviewDetails.employee.last_name}` : "Unknown"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{selectedReviewDetails.employee?.department?.name || "No Department"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Reviewer</p>
                  <p className="font-bold text-sm text-foreground mt-0.5">
                    {selectedReviewDetails.reviewer?.first_name ? `${selectedReviewDetails.reviewer.first_name} ${selectedReviewDetails.reviewer.last_name}` : (selectedReviewDetails.reviewer?.email || "Manager")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Review Cycle</p>
                  <p className="font-bold text-sm text-foreground mt-0.5">
                    {selectedReviewDetails.cycle?.name || "Review"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Overall Score</p>
                  <Badge variant="outline" className={`mt-0.5 font-black text-xs px-2.5 py-0.5 ${
                    selectedReviewDetails.overall_rating === "Excellent" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                    selectedReviewDetails.overall_rating === "Good" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                    selectedReviewDetails.overall_rating === "Average" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  }`}>
                    {selectedReviewDetails.overall_rating}
                  </Badge>
                </div>
              </div>

              {/* Grid feedback blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side */}
                <div className="space-y-6">
                  {/* 1. Key Strengths */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Award className="h-4 w-4 text-emerald-500" />
                      <span>Key Strengths & Achievements</span>
                    </div>
                    <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/5 text-sm leading-relaxed text-foreground min-h-[120px]">
                      {selectedReviewDetails.key_strengths || "No strengths noted."}
                    </div>
                  </div>

                  {/* 2. Development & Action Plan */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span>Development & Action Plan</span>
                    </div>
                    <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-950/40 bg-blue-50/20 dark:bg-blue-950/5 text-sm leading-relaxed text-foreground min-h-[120px]">
                      {selectedReviewDetails.development_plan || "No development plan noted."}
                    </div>
                  </div>
                </div>

                {/* Right side */}
                <div className="space-y-6">
                  {/* 3. Areas for Improvement */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <TrendingUp className="h-4 w-4 text-amber-500" />
                      <span>Areas for Development</span>
                    </div>
                    <div className="p-4 rounded-xl border border-amber-100 dark:border-amber-950/40 bg-amber-50/20 dark:bg-amber-950/5 text-sm leading-relaxed text-foreground min-h-[120px]">
                      {selectedReviewDetails.improvement_areas || "No areas for improvement noted."}
                    </div>
                  </div>

                  {/* 4. Training Recommendations */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <BookOpen className="h-4 w-4 text-indigo-500" />
                      <span>Training & Certification Guidance</span>
                    </div>
                    <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/20 dark:bg-indigo-950/5 text-sm leading-relaxed text-foreground min-h-[120px]">
                      {selectedReviewDetails.training_recommendation || "No training recommendations noted."}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. General Comments */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <MessageSquare className="h-4 w-4 text-slate-500" />
                  <span>General Evaluator Comments</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/10 text-sm leading-relaxed text-foreground italic">
                  {selectedReviewDetails.comments ? `"${selectedReviewDetails.comments}"` : "No additional comments noted."}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="p-6 border-t border-border/40 bg-muted/20">
            <Button onClick={() => setDetailsDialogOpen(false)} className="w-full sm:w-auto">Close Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
