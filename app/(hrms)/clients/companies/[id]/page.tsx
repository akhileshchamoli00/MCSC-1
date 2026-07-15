"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Building2, UploadCloud, Plus, X, Download, Users, Trash2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";

export default function CompanyManagementPage() {
  const params = useParams();
  const companyId = params.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [companyForm, setCompanyForm] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("none");

  // Employees & Assignment
  const [assignedEmployees, setAssignedEmployees] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);



  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  const fetchInitialData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [compRes, clientsRes, empRes, assignRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/all`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees`, { headers: { "Authorization": `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/consultants`, { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (clientsRes.ok) setClients(await clientsRes.json());
      if (empRes.ok) setAllEmployees(await empRes.json());
      if (assignRes.ok) setAssignedEmployees(await assignRes.json());

      if (compRes.ok) {
        const allCompanies = await compRes.json();
        const thisCompany = allCompanies.find((c: any) => c.id.toString() === companyId);
        if (thisCompany) {
          setCompanyForm({
            company_name: thisCompany.company_name || "",
            company_code: thisCompany.company_code || "",
            industry: thisCompany.industry || "",
            tax_number: thisCompany.tax_number || "",
            address: thisCompany.address || "",
            key_contact_person: thisCompany.key_contact_person || "",
            key_contact_email: thisCompany.key_contact_email || "",
            key_contact_phone: thisCompany.key_contact_phone || "",
            status: thisCompany.status || "ACTIVE"
          });
          setSelectedClientId(thisCompany.client_id ? thisCompany.client_id.toString() : "none");
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setErrorMsg("Failed to load company data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [companyId, token]);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...companyForm,
          client_id: selectedClientId && selectedClientId !== "none" ? parseInt(selectedClientId) : null
        })
      });

      if (!response.ok) throw new Error("Failed to update company");
      setSuccessMsg("Company details updated successfully!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update company");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignEmployees = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_ids: selectedEmployeeIds,
          primary_employee_id: selectedEmployeeIds[0] || null
        })
      });
      if (response.ok) {
        setIsAssignModalOpen(false);
        const assignRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/consultants`, { headers: { "Authorization": `Bearer ${token}` } });
        if (assignRes.ok) setAssignedEmployees(await assignRes.json());
      } else {
        alert("Failed to assign employees");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleEmployeeSelection = (empId: number) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };


  if (loading || !companyForm) {
    return <div className="p-8 text-center text-muted-foreground">Loading company data...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/clients/companies">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{companyForm.company_name}</h1>
              <p className="text-sm text-muted-foreground">Manage profile, assignments, and documents</p>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md border border-red-200 dark:border-red-900/30">{errorMsg}</div>}
      {successMsg && <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-md border border-green-200 dark:border-green-900/30">{successMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile & Contact (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <div>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>Update corporate details, operational status, and key contact settings.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateCompany} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name *</label>
                    <Input required value={companyForm.company_name} onChange={(e) => setCompanyForm({...companyForm, company_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Parent Client</label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger><SelectValue placeholder="No Parent Client" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- No Parent Client (Standalone) --</SelectItem>
                        {clients.map((cl) => (
                          <SelectItem key={cl.id} value={cl.id.toString()}>
                            {cl.contact_person} ({cl.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Code * (Username)</label>
                    <Input required value={companyForm.company_code} onChange={(e) => setCompanyForm({...companyForm, company_code: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Industry</label>
                    <Input value={companyForm.industry} onChange={(e) => setCompanyForm({...companyForm, industry: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tax ID / NPWP</label>
                    <Input value={companyForm.tax_number} onChange={(e) => setCompanyForm({...companyForm, tax_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Registered Address</label>
                    <Input value={companyForm.address} onChange={(e) => setCompanyForm({...companyForm, address: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Operational Status</label>
                    <Select value={companyForm.status} onValueChange={(val) => setCompanyForm({...companyForm, status: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                        <SelectItem value="DISABLED">DISABLED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-6 mt-6">
                  <h3 className="text-sm font-bold mb-4">Key Contact Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Contact Person Name</label>
                      <Input placeholder="John Doe" value={companyForm.key_contact_person} onChange={(e) => setCompanyForm({...companyForm, key_contact_person: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contact Email</label>
                      <Input type="email" placeholder="john@example.com" value={companyForm.key_contact_email} onChange={(e) => setCompanyForm({...companyForm, key_contact_email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Contact Phone</label>
                      <Input placeholder="+62 812..." value={companyForm.key_contact_phone} onChange={(e) => setCompanyForm({...companyForm, key_contact_phone: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Employee Assignment (1/3 width) */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Assigned Employees</CardTitle>
                <CardDescription>Staff members assigned to manage this company.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {assignedEmployees.length === 0 ? (
                  <div className="text-center py-6 border border-dashed rounded-lg bg-muted/20">
                    <Users className="mx-auto h-6 w-6 text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground font-medium">No employees assigned</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignedEmployees.map((emp) => (
                      <div key={emp.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/40 border border-border/50">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold truncate text-foreground">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{emp.job_title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full gap-2 border-dashed"
                  onClick={() => {
                    setSelectedEmployeeIds(assignedEmployees.map(e => e.id));
                    setIsAssignModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Manage Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>


      {/* Assignment Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Employees</DialogTitle>
            <DialogDescription>Select which employees are responsible for managing this company's profile and documents.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
            {allEmployees.map(emp => (
              <div key={emp.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer" onClick={() => handleToggleEmployeeSelection(emp.id)}>
                <input 
                  type="checkbox" 
                  checked={selectedEmployeeIds.includes(emp.id)}
                  onChange={() => {}}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{emp.first_name} {emp.last_name}</p>
                  <p className="text-xs text-muted-foreground">{emp.job_title}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignEmployees}>Save Assignments</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
