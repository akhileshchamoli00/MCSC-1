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
  Building2,
  UserCheck,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { resolveImageUrl } from "@/lib/utils";
import { useUser } from "@/contexts/user-context";

export default function AssignedCompaniesPage() {
  const { profile, isAdmin: userContextIsAdmin, loading: sessionLoading } = useUser();
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentEmpId, setCurrentEmpId] = useState<number | null>(null);

  // Admin Start Chat Dialog States
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [companyConsultants, setCompanyConsultants] = useState<any[]>([]);
  const [loadingConsultants, setLoadingConsultants] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchInitialData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const adminOrHr = userContextIsAdmin;
      setIsAdmin(adminOrHr);
      
      let empId: number | null = profile?.id || null;
      setCurrentEmpId(empId);

      // 2. Fetch Clients & Companies
      const clientsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        
        let allComps: any[] = [];
        clientsData.forEach((client: any) => {
          (client.companies || []).forEach((comp: any) => {
            allComps.push({
              ...comp,
              client_contact_person: client.contact_person,
              client_email: client.email,
              client_phone: client.phone
            });
          });
        });

        // If employee, we can also filter companies to ensure the employee is assigned to them.
        // Even though the backend filters the client list for employee, some clients might have multiple companies.
        if (!adminOrHr && empId) {
          // We will verify assignments inline or keep the clients-based companies list.
          // Let's check each company's consultants list to perform strict local filtering.
          const filteredComps: any[] = [];
          for (const comp of allComps) {
            try {
              const consultantsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${comp.id}/consultants`, {
                headers: { "Authorization": `Bearer ${token}` }
              });
              if (consultantsRes.ok) {
                const consultantsData = await consultantsRes.json();
                const isAssigned = consultantsData.some((c: any) => c.id === empId);
                if (isAssigned) {
                  filteredComps.push({
                    ...comp,
                    assigned_consultants: consultantsData
                  });
                }
              }
            } catch (err) {
              console.error(`Error loading consultants for company ${comp.id}:`, err);
            }
          }
          setCompanies(filteredComps);
        } else {
          // Admin sees all companies. We can optionally fetch consultants for them on demand.
          setCompanies(allComps);
        }
      }

      // 3. Preload all employees for Admin override
      if (adminOrHr) {
        const empRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (empRes.ok) {
          const empData = await empRes.json();
          setAllEmployees(empData.filter((e: any) => e.status === "ACTIVE"));
        }
      }

    } catch (err) {
      console.error("Error loading assigned companies data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionLoading) {
      fetchInitialData();
    }
  }, [sessionLoading]);

  const handleStartChatEmployee = async (companyId: number) => {
    if (!token || !currentEmpId) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          company_id: companyId,
          employee_id: currentEmpId
        })
      });
      if (response.ok) {
        const newConv = await response.json();
        router.push(`/chat?convId=${newConv.id}`);
      } else {
        alert("Failed to initialize conversation thread.");
      }
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };

  const openAdminChatDialog = async (company: any) => {
    setSelectedCompany(company);
    setSelectedEmpId("");
    setErrorMsg("");
    setIsChatDialogOpen(true);
    setLoadingConsultants(true);

    try {
      const consultantsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${company.id}/consultants`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (consultantsRes.ok) {
        const consultantsData = await consultantsRes.json();
        setCompanyConsultants(consultantsData);
        // Pre-select the primary consultant if available
        const primary = consultantsData.find((c: any) => c.is_primary);
        if (primary) {
          setSelectedEmpId(primary.id.toString());
        } else if (consultantsData.length > 0) {
          setSelectedEmpId(consultantsData[0].id.toString());
        }
      }
    } catch (err) {
      console.error("Error fetching consultants for company:", err);
    } finally {
      setLoadingConsultants(false);
    }
  };

  const handleAdminStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCompany || !selectedEmpId) return;
    setErrorMsg("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          company_id: selectedCompany.id,
          employee_id: Number(selectedEmpId)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to establish chat thread.");
      }

      const newConv = await response.json();
      setIsChatDialogOpen(false);
      router.push(`/chat-center?convId=${newConv.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start thread.");
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.client_contact_person && c.client_contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Syncing company registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Assigned Companies</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin 
              ? "All registered corporate profiles in the system. Monitor active consultations or moderate advice threads." 
              : "Companies assigned to your consultant profile. Click action to initiate advice chats with representatives."
            }
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies by name or code..."
          className="pl-8 bg-background/50 border-border/40"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/80 rounded-3xl bg-white/5 backdrop-blur-md">
          <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="font-bold text-xl text-foreground">No Companies Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1.5">
            {searchTerm 
              ? "No companies match the filter term." 
              : (isAdmin 
                  ? "No corporate records exist in the database." 
                  : "You are not assigned to any client companies."
                )
            }
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
                  {isAdmin ? (
                    <Button 
                      onClick={() => openAdminChatDialog(company)}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 h-11 rounded-xl font-bold transition-all"
                    >
                      <MessageSquare className="h-4 w-4" /> Message Company
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleStartChatEmployee(company.id)}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 h-11 rounded-xl font-bold transition-all"
                    >
                      <MessageSquare className="h-4 w-4" /> Message Client
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Admin Start Chat Dialog */}
      <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
        <DialogContent className="max-w-md bg-[#15162b] border-white/5 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Initiate Advice Connection</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Select a consultant to host this thread. This connects the client company representitive and the consultant via a live channel.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminStartChat} className="space-y-5 pt-3">
            {errorMsg && (
              <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-lg border border-destructive/20 font-medium">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center gap-3">
                <Building className="h-8 w-8 text-primary shrink-0" />
                <div className="overflow-hidden">
                  <h4 className="text-sm font-bold text-foreground truncate">{selectedCompany?.company_name}</h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{selectedCompany?.company_code}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" /> Select Advisor / Consultant *
                </label>
                
                {loadingConsultants ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading company's assigned consultants...</span>
                  </div>
                ) : (
                  <Select 
                    value={selectedEmpId} 
                    onValueChange={setSelectedEmpId}
                    required
                  >
                    <SelectTrigger className="w-full bg-[#1c1d35] border-white/5 rounded-xl">
                      <SelectValue placeholder="Choose a consultant..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1c1d35] border-white/5">
                      {companyConsultants.length > 0 && (
                        <div className="px-2 py-1.5 text-[10px] font-bold text-primary tracking-wider uppercase bg-primary/5">
                          Assigned Consultants
                        </div>
                      )}
                      {companyConsultants.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.first_name} {c.last_name || ""} ({c.job_title || "Consultant"}) {c.is_primary ? "⭐ Primary" : ""}
                        </SelectItem>
                      ))}
                      
                      <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground tracking-wider uppercase border-t border-white/5 bg-white/[0.01]">
                        All Active Consultants
                      </div>
                      {allEmployees.filter(e => !companyConsultants.some(c => c.id === e.id)).map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.first_name} {emp.last_name || ""} ({emp.job_title || "Consultant"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="bg-transparent border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl"
                onClick={() => setIsChatDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedEmpId} className="rounded-xl">
                Create & Redirect
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
