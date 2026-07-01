"use client";

import React, { useEffect, useState } from "react";
import { useClient } from "../layout";
import { useRouter } from "next/navigation";
import { 
  Users, 
  MessageSquare, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Loader2,
  Building,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/lib/utils";

export default function ConsultantsPage() {
  const { clientProfile, activeCompany, loading: contextLoading } = useClient();
  const router = useRouter();
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contextLoading) return;
    if (!clientProfile || !activeCompany) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("hrms_token");
    
    const fetchConsultants = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${activeCompany.id}/consultants`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          setConsultants(await response.json());
        }
      } catch (err) {
        console.error("Error fetching consultants:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultants();
  }, [clientProfile, activeCompany, contextLoading]);

  const startChatWithConsultant = async (consultantId: number) => {
    const token = localStorage.getItem("hrms_token");
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          company_id: activeCompany.id,
          employee_id: consultantId
        })
      });
      if (response.ok) {
        const newConv = await response.json();
        router.push(`/client/chat?convId=${newConv.id}`);
      }
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Syncing consulting roster...</p>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="flex h-[500px] items-center justify-center animate-in fade-in">
        <div className="flex flex-col items-center gap-3 text-center max-w-md p-8 rounded-2xl border border-dashed border-border bg-background/50">
          <ShieldAlert className="h-12 w-12 text-muted-foreground/30" />
          <h2 className="text-xl font-bold text-foreground">No Company Assigned</h2>
          <p className="text-sm text-muted-foreground">
            Please contact your system administrator to link a company to your profile before accessing consultants.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Assigned Consultants</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your dedicated account team representing MCS Consulting. Contact them for help with your projects and operations.
        </p>
      </div>

      {consultants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/80 rounded-2xl bg-white/5 backdrop-blur-md">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-bold text-lg text-foreground">No Consultants Assigned</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            An administrator has not assigned any consultants to your company profile yet. Please reach out to your administrator to configure assignments.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {consultants.map((consultant) => (
            <Card key={consultant.id} className="relative overflow-hidden hover:border-primary/40 transition-all duration-300 group bg-background/50 backdrop-blur-md">
              {consultant.is_primary && (
                <div className="absolute right-0 top-0 flex items-center gap-1 bg-primary px-3 py-1 rounded-bl-lg text-[10px] font-bold text-primary-foreground tracking-wide">
                  <ShieldCheck className="h-3 w-3" /> PRIMARY PARTNER
                </div>
              )}
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  {consultant.profile_photo ? (
                    <img
                      src={resolveImageUrl(consultant.profile_photo)}
                      alt={consultant.first_name}
                      className="h-16 w-16 rounded-2xl object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary font-bold text-2xl border border-primary/10 shadow-lg group-hover:scale-105 transition-transform duration-300">
                      {consultant.first_name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-foreground truncate max-w-[150px]">
                      {consultant.first_name} {consultant.last_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building className="h-3.5 w-3.5 text-primary/70" />
                      <span className="truncate max-w-[150px]">{consultant.job_title || "Consultant"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/40 text-xs">
                  {consultant.email && (
                    <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="truncate">{consultant.email}</span>
                    </div>
                  )}
                  {consultant.phone && (
                    <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>{consultant.phone}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => startChatWithConsultant(consultant.id)}
                >
                  <MessageSquare className="h-4 w-4" /> Message Advisor
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
