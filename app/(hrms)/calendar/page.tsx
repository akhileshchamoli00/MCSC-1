"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !profile?.has_calendar_access) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view the Calendar.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-2 pb-6 md:px-6 md:pt-2 lg:px-8 lg:pt-0 space-y-2 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Manage your Google Appointment Schedule.</p>
      </div>
      
      {/* 
        We reuse the BookingSection component with isEmbedded=true
        to align it cleanly within the dashboard.
      */}
      <div className="mt-4">
        <BookingSection isEmbedded={true} />
      </div>
    </div>
  );
}
