"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, User, Mail, Building2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface SearchableEmployee {
  id: number | string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  employee_id?: string | number;
  employee_id_custom?: string | number;
  department?: any;
  department_name?: string;
  job_title?: any;
  role?: any;
  user?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

interface SearchableEmployeeSelectProps {
  employees: SearchableEmployee[];
  value: string;
  onChange: (employeeId: string, employee?: SearchableEmployee) => void;
  placeholder?: string;
  accentColor?: "indigo" | "emerald" | "blue";
  disabled?: boolean;
}

const getDeptName = (dept: any) => {
  if (!dept) return "General";
  if (typeof dept === "string") return dept;
  if (typeof dept === "object") return dept.name || dept.title || "General";
  return "General";
};

const getJobTitle = (title: any, role?: any) => {
  if (typeof title === "string" && title.trim()) return title;
  if (typeof title === "object" && title?.name) return title.name;
  if (typeof role === "string" && role.trim()) return role;
  if (typeof role === "object" && role?.name) return role.name;
  return "Staff";
};

export function SearchableEmployeeSelect({
  employees = [],
  value,
  onChange,
  placeholder = "Search or select an employee...",
  accentColor = "indigo",
  disabled = false,
}: SearchableEmployeeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const selectedEmployee = useMemo(() => {
    if (!value) return null;
    return employees.find((emp) => emp.id.toString() === value.toString()) || null;
  }, [employees, value]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter((emp) => {
      const firstName = (emp.first_name || "").toLowerCase();
      const lastName = (emp.last_name || "").toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      const email = (emp.email || emp.user?.email || "").toLowerCase();
      const empId = (emp.employee_id || emp.employee_id_custom || emp.id || "").toString().toLowerCase();
      const dept = getDeptName(emp.department || emp.department_name).toLowerCase();
      const title = getJobTitle(emp.job_title, emp.role).toLowerCase();

      return (
        fullName.includes(q) ||
        firstName.includes(q) ||
        lastName.includes(q) ||
        email.includes(q) ||
        empId.includes(q) ||
        dept.includes(q) ||
        title.includes(q)
      );
    });
  }, [employees, searchQuery]);

  const accentStyles = {
    indigo: {
      borderFocus: "focus-within:border-indigo-500/60 focus:border-indigo-500/60",
      selectedBg: "bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 border-indigo-500/30",
      hoverBg: "hover:bg-indigo-50/90 dark:hover:bg-indigo-950/50",
      badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
      avatarBg: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
      indicator: "text-indigo-600 dark:text-indigo-400",
    },
    emerald: {
      borderFocus: "focus-within:border-emerald-500/60 focus:border-emerald-500/60",
      selectedBg: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border-emerald-500/30",
      hoverBg: "hover:bg-emerald-50/90 dark:hover:bg-emerald-950/50",
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      avatarBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      indicator: "text-emerald-600 dark:text-emerald-400",
    },
    blue: {
      borderFocus: "focus-within:border-blue-500/60 focus:border-blue-500/60",
      selectedBg: "bg-blue-500/10 text-blue-900 dark:text-blue-200 border-blue-500/30",
      hoverBg: "hover:bg-blue-50/90 dark:hover:bg-blue-950/50",
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      avatarBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
      indicator: "text-blue-600 dark:text-blue-400",
    },
  }[accentColor];

  const handleSelect = (emp: SearchableEmployee) => {
    onChange(emp.id.toString(), emp);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-h-[48px] px-4 py-2.5 rounded-2xl border border-border/70 bg-background/80 hover:bg-background transition-all flex items-center justify-between gap-3 text-left shadow-xs cursor-pointer select-none ${
          isOpen ? `${accentStyles.borderFocus} ring-2 ring-indigo-500/20 shadow-md` : "hover:border-border"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectedEmployee ? (
            <>
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${accentStyles.avatarBg}`}
              >
                {(selectedEmployee.first_name?.[0] || "").toUpperCase()}
                {(selectedEmployee.last_name?.[0] || "").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-foreground truncate">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${accentStyles.badge}`}>
                    {getDeptName(selectedEmployee.department || selectedEmployee.department_name)}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {selectedEmployee.email || selectedEmployee.user?.email || "No email"}
                  {selectedEmployee.employee_id_custom && (
                    <span className="ml-1.5 opacity-80 font-mono">#{selectedEmployee.employee_id_custom}</span>
                  )}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 text-muted-foreground text-xs font-medium">
              <User className="h-4 w-4 shrink-0 opacity-60" />
              <span>{placeholder}</span>
            </div>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-foreground" : ""
          }`}
        />
      </button>

      {/* Downwards Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-border/80 bg-popover/95 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col">
          {/* Integrated Search Box */}
          <div className="p-2.5 border-b border-border/50 bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to filter employees by name, email, department..."
                className="pl-8 pr-8 h-9 text-xs rounded-xl bg-background/80 border-border/60 focus:border-indigo-500/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-md hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Employee List */}
          <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-1 divide-y divide-border/20">
            {filteredEmployees.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <User className="h-6 w-6 mx-auto text-muted-foreground/50 mb-1.5" />
                <p className="text-xs font-semibold text-foreground">No employees found</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  No staff member matches "{searchQuery}"
                </p>
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = value.toString() === emp.id.toString();
                const deptDisplay = getDeptName(emp.department || emp.department_name);
                const titleDisplay = getJobTitle(emp.job_title, emp.role);
                const empEmail = emp.email || emp.user?.email || "No email registered";

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    className={`group w-full p-2.5 rounded-xl text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? `${accentStyles.selectedBg} border`
                        : `${accentStyles.hoverBg} hover:border-border/40 border border-transparent`
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Initials Avatar */}
                      <div
                        className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                          isSelected
                            ? accentStyles.avatarBg
                            : "bg-muted/60 group-hover:bg-background text-foreground border-border/50"
                        }`}
                      >
                        {(emp.first_name?.[0] || "").toUpperCase()}
                        {(emp.last_name?.[0] || "").toUpperCase()}
                      </div>

                      {/* Details - Clear High-Contrast Typography */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-foreground group-hover:text-foreground">
                            {emp.first_name} {emp.last_name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/60 group-hover:bg-background/80 text-muted-foreground font-medium border border-border/40">
                            {deptDisplay}
                          </span>
                          {emp.employee_id_custom && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              #{emp.employee_id_custom}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground group-hover:text-foreground/80 mt-0.5">
                          <span className="truncate">{titleDisplay}</span>
                          <span>•</span>
                          <span className="truncate flex items-center gap-1">
                            <Mail className="h-3 w-3 opacity-60 inline" />
                            {empEmail}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className={`shrink-0 ${accentStyles.indicator}`}>
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info if scrollable */}
          {filteredEmployees.length > 8 && (
            <div className="px-3.5 py-1.5 border-t border-border/40 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{filteredEmployees.length} employees available</span>
              <span>Scroll for more</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
