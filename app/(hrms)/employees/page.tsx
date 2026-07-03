"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, Mail, Phone, Briefcase, Loader2, Eye, Edit, Download, Filter, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolveImageUrl } from "@/lib/utils";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [sortField, setSortField] = useState("employee_id_custom");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Load cached values for instant render
    const cachedEmp = localStorage.getItem("hrms_employees_data");
    const cachedDept = localStorage.getItem("hrms_departments_data");
    const cachedRoles = localStorage.getItem("hrms_roles_data");
    if (cachedEmp && cachedDept && cachedRoles) {
      try {
        setEmployees(JSON.parse(cachedEmp));
        setDepartments(JSON.parse(cachedDept));
        setRoles(JSON.parse(cachedRoles));
        setLoading(false);
      } catch (e) { }
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        const headers = { "Authorization": `Bearer ${token}` };

        const [empRes, deptRes, roleRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employees/`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments/`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/`, { headers })
        ]);

        if (empRes.ok) {
          const freshEmp = await empRes.json();
          setEmployees(freshEmp);
          localStorage.setItem("hrms_employees_data", JSON.stringify(freshEmp));
        }
        if (deptRes.ok) {
          const freshDept = await deptRes.json();
          setDepartments(freshDept);
          localStorage.setItem("hrms_departments_data", JSON.stringify(freshDept));
        }
        if (roleRes.ok) {
          const freshRoles = await roleRes.json();
          setRoles(freshRoles);
          localStorage.setItem("hrms_roles_data", JSON.stringify(freshRoles));
        }

      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedEmployees = useMemo(() => {
    let result = employees.filter(emp => {
      const searchStr = `${emp.first_name} ${emp.last_name} ${emp.user?.email || ""} ${emp.employee_id_custom || ""}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchQuery.toLowerCase());

      const matchesDept = deptFilter === "ALL" || emp.department_id?.toString() === deptFilter;
      const matchesRole = roleFilter === "ALL" || emp.user?.role_id?.toString() === roleFilter;
      const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;

      return matchesSearch && matchesDept && matchesRole && matchesStatus;
    });

    result.sort((a, b) => {
      // Keep terminated employees at the bottom of the list
      const aTerminated = a.status === "TERMINATED";
      const bTerminated = b.status === "TERMINATED";

      if (aTerminated && !bTerminated) return 1;
      if (!aTerminated && bTerminated) return -1;

      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "employee_id_custom") {
        if (!aVal && bVal) return 1;
        if (aVal && !bVal) return -1;
        if (!aVal && !bVal) return 0;
      }

      // Handle nested fields
      if (sortField === "department") {
        aVal = a.department?.name || "";
        bVal = b.department?.name || "";
      } else if (sortField === "role") {
        aVal = a.user?.role?.name || "";
        bVal = b.user?.role?.name || "";
      } else if (sortField === "email") {
        aVal = a.user?.email || "";
        bVal = b.user?.email || "";
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [employees, searchQuery, deptFilter, roleFilter, statusFilter, sortField, sortDirection]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredAndSortedEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportCSV = () => {
    if (filteredAndSortedEmployees.length === 0) return;

    const headers = ["Employee ID", "First Name", "Last Name", "Email", "Phone", "Department", "Designation", "Join Date", "Status"];
    const rows = filteredAndSortedEmployees.map(emp => [
      emp.employee_id_custom || emp.id,
      emp.first_name,
      emp.last_name,
      emp.user?.email || "",
      emp.phone || "",
      emp.department?.name || "",
      emp.user?.role?.name || "",
      emp.hire_date || "",
      emp.status || ""
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.map(item => `"${item}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employees_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4 ml-1 inline" /> : <ChevronDown className="h-4 w-4 ml-1 inline" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Directory</h1>
          <p className="text-muted-foreground mt-1">Manage your team members, designations, and statuses.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportCSV} className="flex items-center gap-2 bg-background">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Link href="/employees/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Filter & Search</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); setCurrentPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Designation (Role)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Designations</SelectItem>
              {roles.map(r => (
                <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PROBATION">Probation</SelectItem>
              <SelectItem value="RESIGNED">Resigned</SelectItem>
              <SelectItem value="TERMINATED">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('employee_id_custom')}>
                  Employee <SortIcon field="employee_id_custom" />
                </th>
                <th className="px-6 py-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('email')}>
                  Contact <SortIcon field="email" />
                </th>
                <th className="px-6 py-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('role')}>
                  Designation & Dept <SortIcon field="role" />
                </th>
                <th className="px-6 py-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('hire_date')}>
                  Join Date <SortIcon field="hire_date" />
                </th>
                <th className="px-6 py-3.5 font-medium cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('status')}>
                  Status <SortIcon field="status" />
                </th>
                <th className="px-6 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading directory...
                  </td>
                </tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No employees found matching filters.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0 border border-primary/20">
                          {employee.profile_photo ? (
                            <img src={resolveImageUrl(employee.profile_photo)} alt={`${employee.first_name} ${employee.last_name}`} className="h-full w-full object-cover" />
                          ) : (
                            `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`
                          )}
                        </div>
                        <div>
                          <Link href={`/employees/${employee.id}`} className="font-medium text-foreground hover:underline">
                            {employee.first_name} {employee.last_name}
                          </Link>
                          <div className="text-muted-foreground text-xs font-mono mt-0.5">{employee.employee_id_custom || employee.id.toString().padStart(4, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs truncate max-w-[150px]">{employee.user?.email || "No email"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span className="text-xs">{employee.phone || "No phone"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate max-w-[150px]">{employee.user?.role?.name || "No Designation"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-5.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></span>
                          {employee.department?.name || "No Department"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {employee.hire_date || "-"}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={
                        employee.status === "ACTIVE" ? "default" :
                        employee.status === "PROBATION" ? "secondary" :
                        employee.status === "TERMINATED" ? "destructive" : "outline"
                      }>
                        {employee.status || "ACTIVE"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/employees/${employee.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/employees/${employee.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedEmployees.length)} of {filteredAndSortedEmployees.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="px-2">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
