"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  UserCheck, 
  Loader2, 
  Building, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function AssignConsultants() {
  const [clients, setClients] = useState<any[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [primaryEmployeeId, setPrimaryEmployeeId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  useEffect(() => {
    if (!token) return;
    
    const loadInitialData = async () => {
      try {
        // Fetch clients
        const clientsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const clientsData = await clientsRes.json();
        const activeClients = clientsData.filter((c: any) => c.status === "ACTIVE");
        setClients(activeClients);

        // Fetch employees
        const employeesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const employeesData = await employeesRes.json();
        // Keep only active employees
        setEmployees(employeesData.filter((e: any) => e.status === "ACTIVE"));

      } catch (err) {
        console.error("Error loading assignment page:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Fetch current assignments when client changes
  useEffect(() => {
    if (!selectedCompanyId || !token) {
      setSelectedEmployeeIds([]);
      setPrimaryEmployeeId(null);
      return;
    }

    const fetchCurrentAssignments = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${selectedCompanyId}/consultants`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const current = await response.json();
          const empIds = current.map((c: any) => c.id);
          setSelectedEmployeeIds(empIds);
          
          const primary = current.find((c: any) => c.is_primary);
          setPrimaryEmployeeId(primary ? primary.id : (empIds.length > 0 ? empIds[0] : null));
        }
      } catch (err) {
        console.error("Error loading client assignments:", err);
      }
    };
    
    fetchCurrentAssignments();
  }, [selectedCompanyId]);

  const handleCheckboxChange = (checked: boolean, employeeId: number) => {
    if (checked) {
      setSelectedEmployeeIds(prev => [...prev, employeeId]);
      // If no primary is selected yet, make this one primary
      if (primaryEmployeeId === null) {
        setPrimaryEmployeeId(employeeId);
      }
    } else {
      setSelectedEmployeeIds(prev => prev.filter(id => id !== employeeId));
      if (primaryEmployeeId === employeeId) {
        // Find another selected employee to be primary, or set to null
        const remaining = selectedEmployeeIds.filter(id => id !== employeeId);
        setPrimaryEmployeeId(remaining.length > 0 ? remaining[0] : null);
      }
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedCompanyId || !token) return;
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${selectedCompanyId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_ids: selectedEmployeeIds,
          primary_employee_id: primaryEmployeeId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update assignments");
      }

      setSuccessMsg("Consultant assignments saved successfully");
    } catch (err: any) {
      console.error("Error saving assignments:", err);
      setErrorMsg(err.message || "Failed to save assignments");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assign Consultants</h1>
        <p className="text-muted-foreground text-sm">
          Map MCS employee accounts as advisors or primary managers to registered clients.
        </p>
      </div>

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-xs font-medium">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/25 text-destructive p-3 rounded-lg text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Consultant Manager</CardTitle>
          <CardDescription>Select a partner and toggle consultant roles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Select Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Select Partner Client Representative</label>
            <Select 
              value={selectedClientId} 
              onValueChange={(val) => {
                setSelectedClientId(val);
                const parentClient = clients.find(c => c.id.toString() === val);
                const comps = parentClient?.companies || [];
                setAvailableCompanies(comps);
                if (comps.length === 1) {
                  setSelectedCompanyId(comps[0].id.toString());
                } else {
                  setSelectedCompanyId("");
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a representative..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.contact_person} ({c.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company Dropdown (only if multiple companies exist) */}
          {selectedClientId && availableCompanies.length > 1 && (
            <div className="space-y-1.5 pt-2 animate-in fade-in duration-350">
              <label className="text-xs font-semibold text-muted-foreground">Select Company</label>
              <Select 
                value={selectedCompanyId} 
                onValueChange={setSelectedCompanyId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a company..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id.toString()}>
                      {comp.company_name} ({comp.company_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Case when representative has no companies registered */}
          {selectedClientId && availableCompanies.length === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-lg text-xs font-medium">
              This representative has no associated companies. You must register a company for this client in the Company Directory first.
            </div>
          )}

          {selectedCompanyId ? (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Active Employee Roster
              </h3>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {employees.map((emp) => {
                  const isChecked = selectedEmployeeIds.includes(emp.id);
                  const isPrimary = primaryEmployeeId === emp.id;
                  
                  return (
                    <div 
                      key={emp.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all
                        ${isChecked 
                          ? "bg-primary/5 border-primary/20" 
                          : "hover:bg-muted/30 border-border/40"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <Checkbox 
                          id={`emp-${emp.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleCheckboxChange(!!checked, emp.id)}
                        />
                        <div className="flex flex-col">
                          <label 
                            htmlFor={`emp-${emp.id}`}
                            className="text-xs font-semibold text-foreground cursor-pointer select-none"
                          >
                            {emp.first_name} {emp.last_name || ""}
                          </label>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{emp.job_title || "Consultant"}</span>
                        </div>
                      </div>

                      {isChecked && (
                        <button
                          type="button"
                          onClick={() => setPrimaryEmployeeId(emp.id)}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all border
                            ${isPrimary 
                              ? "bg-primary text-primary-foreground border-primary" 
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5 border-border/40"
                            }
                          `}
                        >
                          {isPrimary ? "PRIMARY" : "SET PRIMARY"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              <HelpCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs">Select a partner client above to configure consultants.</p>
            </div>
          )}
        </CardContent>
        {selectedCompanyId && (
          <CardFooter className="flex justify-end border-t pt-4">
            <Button 
              disabled={saving} 
              onClick={handleSaveAssignments}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Consultant Setup
            </Button>
          </CardFooter>
        )}
      </Card>

    </div>
  );
}
