"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building, 
  Mail, 
  Phone, 
  MessageSquare, 
  Loader2, 
  MapPin, 
  ShieldCheck,
  Search,
  Users,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useUser } from "@/contexts/user-context";

export default function MyClients() {
  const { profile } = useUser();
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMyClients = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const clientsData = await response.json();
        const myCompanies = clientsData.flatMap((c: any) => 
          (c.companies || []).map((comp: any) => ({
            ...comp,
            client_contact_person: c.contact_person,
            client_email: c.email,
            client_phone: c.phone
          }))
        );
        setCompanies(myCompanies);
      }
    } catch (err) {
      console.error("Error loading my clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClients();
  }, []);

  const startChatWithCompany = async (company: any) => {
    if (!token || !profile?.id) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          company_id: company.id,
          employee_id: profile.id
        })
      });
      if (response.ok) {
        const newConv = await response.json();
        router.push(`/business/chat?convId=${newConv.id}`);
      }
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Assigned Clients</h1>
        <p className="text-muted-foreground text-sm">
          Clients assigned to you as a primary consultant or advisor. Use actions to view profile details or message them.
        </p>
      </div>

      {/* Search Panel Card */}
      <Card className="border-border/50 shadow-sm overflow-hidden bg-card/60 backdrop-blur-md p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assigned clients..."
            className="pl-8 h-9 text-xs rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">
          Showing {filteredCompanies.length} clients
        </span>
      </Card>

      {filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-2xl bg-muted/30">
          <Users className="h-12 w-12 text-muted-foreground/35 mb-3" />
          <h3 className="font-bold text-lg">No Clients Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            {searchTerm ? "No results match your search." : "You do not have any assigned clients currently."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="relative overflow-hidden hover:border-primary/40 transition-all duration-300 bg-background/50 backdrop-blur-md border-border/40 shadow-lg group rounded-2xl flex flex-col justify-between">
              
              {/* Top-Right Badge matching PRIMARY PARTNER style */}
              <div className="absolute right-0 top-0 flex items-center gap-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1 rounded-bl-lg text-[9px] font-bold tracking-wider uppercase">
                {company.company_code}
              </div>

              <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Company Info Header */}
                  <div className="flex items-center gap-4">
                    {company.logo_url ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}${company.logo_url}`}
                        alt={company.company_name}
                        className="h-16 w-16 rounded-2xl object-cover border border-white/10 shadow-lg group-hover:scale-105 transition-transform duration-300 bg-background"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary font-extrabold text-2xl border border-primary/10 shadow-lg group-hover:scale-105 transition-transform duration-300">
                        {company.company_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-1 overflow-hidden">
                      <h3 className="font-extrabold text-lg text-foreground truncate max-w-[170px]" title={company.company_name}>
                        {company.company_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building className="h-3.5 w-3.5 text-primary/70" />
                        <span className="truncate max-w-[150px] font-medium">{company.industry || "General Consulting"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/40 pt-4" />

                  {/* Representative & Contact Details */}
                  <div className="space-y-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <span className="text-foreground font-semibold">Rep: {company.client_contact_person || "Representative"}</span>
                    </div>
                    {company.client_email && (
                      <div className="flex items-center gap-2.5 truncate hover:text-foreground transition-colors">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="truncate">{company.client_email}</span>
                      </div>
                    )}
                    {company.client_phone && (
                      <div className="flex items-center gap-2.5 hover:text-foreground transition-colors">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{company.client_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Message Button */}
                <div className="pt-2">
                  <Button 
                    onClick={() => startChatWithCompany(company)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 h-11 rounded-xl font-bold transition-all"
                  >
                    <MessageSquare className="h-4 w-4" /> Message Client
                  </Button>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
