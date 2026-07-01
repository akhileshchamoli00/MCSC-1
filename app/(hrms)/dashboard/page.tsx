"use client";

import { useUser } from "@/contexts/user-context";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./admin-dashboard";
import EmployeeDashboard from "./employee-dashboard";

export default function DashboardPage() {
  const { isAdmin, loading } = useUser();

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <EmployeeDashboard />;
}
