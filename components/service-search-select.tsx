"use client";

import React, { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ChevronsUpDown, Check, X, Tag, PlusCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ServiceItem {
  id: string | number;
  job_title: string;
  job_id: string;
  base_price?: number;
  [key: string]: any;
}

interface ServiceSearchSelectProps {
  services: ServiceItem[];
  value: string;
  customTitle?: string;
  onChange: (serviceId: string, customTitle?: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ServiceSearchSelect({
  services = [],
  value,
  customTitle,
  onChange,
  required = false,
  disabled = false,
  placeholder = "-- Choose Service Package / Job Title * --",
  className,
}: ServiceSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedService = useMemo(() => {
    if (value === "CUSTOM") return null;
    return services.find((s) => String(s.id) === String(value));
  }, [services, value]);

  const isCustom = value === "CUSTOM" || (!selectedService && !!customTitle);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase().trim();
    return services.filter((s) => {
      const nameMatch = (s.job_title || "").toLowerCase().includes(q);
      const codeMatch = (s.job_id || "").toLowerCase().includes(q);
      return nameMatch || codeMatch;
    });
  }, [services, searchQuery]);

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return "-";
    return "IDR " + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(val);
  };

  const handleSelectCatalog = (s: ServiceItem) => {
    onChange(String(s.id), s.job_title);
    setOpen(false);
    setSearchQuery("");
  };

  const handleSelectCustom = (typedText: string) => {
    const trimmed = typedText.trim();
    if (!trimmed) return;
    onChange("CUSTOM", trimmed);
    setOpen(false);
    setSearchQuery("");
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      const q = searchQuery.trim();
      if (!q) return;

      const exactMatch = filteredServices.find(
        (s) => s.job_title.toLowerCase() === q.toLowerCase() || s.job_id.toLowerCase() === q.toLowerCase()
      );
      if (exactMatch) {
        handleSelectCatalog(exactMatch);
      } else if (filteredServices.length === 1) {
        handleSelectCatalog(filteredServices[0]);
      } else {
        handleSelectCustom(q);
      }
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Hidden input to support HTML5 required form validation if needed */}
      <input
        type="text"
        required={required}
        value={value || (isCustom ? customTitle || "CUSTOM" : "")}
        onChange={() => {}}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "flex h-8 w-full items-center justify-between rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors hover:bg-muted/30 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              !selectedService && !isCustom && "text-muted-foreground font-normal"
            )}
          >
            {selectedService ? (
              <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                <span className="truncate font-semibold text-foreground">
                  {selectedService.job_title}
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[9px] px-1 py-0 bg-muted/60 text-muted-foreground border-border/70 shrink-0 pointer-events-none"
                >
                  {selectedService.job_id}
                </Badge>
              </div>
            ) : isCustom ? (
              <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="truncate font-semibold text-foreground">
                  {customTitle || "Custom One-Time Service"}
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[9px] px-1.5 py-0 bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 shrink-0 pointer-events-none font-bold"
                >
                  Custom
                </Badge>
              </div>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50 ml-1 text-muted-foreground" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className="p-2 w-[340px] sm:w-[400px] md:w-[460px] max-w-[95vw] rounded-xl border border-border/70 bg-popover/98 backdrop-blur-md shadow-xl text-foreground"
        >
          {/* Search Header Input */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search catalog or type custom service name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="h-8 pl-8 pr-7 text-xs bg-background/80 rounded-lg border-border/60 focus-visible:ring-1 focus-visible:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Quick Custom One-Time Service Action when user types */}
          {searchQuery.trim() && (
            <div className="mb-2 p-1 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <button
                type="button"
                onClick={() => handleSelectCustom(searchQuery)}
                className="w-full text-left p-1.5 rounded-md text-xs font-semibold flex items-center justify-between gap-2 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <PlusCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">
                    Use &ldquo;<span className="font-bold underline">{searchQuery.trim()}</span>&rdquo; as Custom Service
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 bg-amber-500/25 text-amber-800 dark:text-amber-300 border-amber-500/40 shrink-0 font-bold"
                  >
                    One-Time
                  </Badge>
                  <kbd className="hidden sm:inline-flex text-[9px] font-mono px-1 py-0.2 rounded bg-background/80 border border-amber-500/30 text-muted-foreground">
                    ↵
                  </kbd>
                </div>
              </button>
            </div>
          )}

          {/* Search Info Bar */}
          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-border/40 text-[10px] font-mono text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">
              {filteredServices.length} {filteredServices.length === 1 ? "Catalog Service" : "Catalog Services"}
            </span>
            {searchQuery ? (
              <span className="truncate max-w-[160px] text-primary font-medium">
                &ldquo;{searchQuery}&rdquo;
              </span>
            ) : (
              <span className="text-[9px] text-muted-foreground/70">
                Or type custom name &amp; press Enter
              </span>
            )}
          </div>

          {/* Services List */}
          <div className="mt-1.5 max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
            {filteredServices.length === 0 ? (
              <div className="py-5 text-center text-xs space-y-2 px-2">
                <Tag className="h-6 w-6 mx-auto text-muted-foreground/40" />
                <div>
                  <p className="font-semibold text-foreground">No catalog package matched</p>
                  <p className="text-[11px] text-muted-foreground">
                    You can use this typed text directly as a custom one-time service.
                  </p>
                </div>
                {searchQuery.trim() && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSelectCustom(searchQuery)}
                    className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs gap-1.5 cursor-pointer inline-flex"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Use &ldquo;{searchQuery.trim()}&rdquo;
                  </Button>
                )}
              </div>
            ) : (
              filteredServices.map((s) => {
                const isSelected = String(s.id) === String(value);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectCatalog(s)}
                    className={cn(
                      "w-full text-left p-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer group",
                      isSelected
                        ? "bg-primary/15 text-primary font-semibold border border-primary/30"
                        : "hover:bg-muted/70 text-foreground"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold">{s.job_title}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[9px] px-1 py-0 shrink-0 font-bold",
                            isSelected
                              ? "bg-primary/20 text-primary border-primary/40"
                              : "bg-muted text-muted-foreground group-hover:border-primary/30"
                          )}
                        >
                          {s.job_id}
                        </Badge>
                      </div>
                      {s.description && (
                        <p className="text-[10.5px] text-muted-foreground truncate mt-0.5 font-normal">
                          {s.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.base_price !== undefined && s.base_price !== null && (
                        <span className="font-mono text-[10.5px] font-bold text-muted-foreground">
                          {formatCurrency(s.base_price)}
                        </span>
                      )}
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <div className="w-3.5" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
