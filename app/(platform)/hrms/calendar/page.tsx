"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CalendarDays, Loader2, ShieldAlert } from "lucide-react";
import { BookingSection } from "@/components/booking-section";
import { useUser } from "@/contexts/user-context";

export default function CalendarPage() {
  const router = useRouter();
  const { isAdmin, profile, loading } = useUser();

  useEffect(() => {
    if (!loading) {
      if (!isAdmin && !profile?.has_calendar_access) {
        // We handle the UI state below instead of redirecting
      }
    }
  }, [loading, isAdmin, profile, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isAdmin && !profile?.has_calendar_access) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center p-8 bg-background/50 backdrop-blur-md rounded-2xl border border-border/40 max-w-xl mx-auto my-12">
        <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-3">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Access Denied</h2>
        <p className="text-xs text-muted-foreground">You do not have permission to view the Calendar appointment scheduler.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none animate-in fade-in duration-500 pb-8">
      {/* Embedded Booking Section Card */}
      <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-background/50 backdrop-blur-md w-full">
        <BookingSection isEmbedded={true} />
      </div>
    </div>
  );
}
