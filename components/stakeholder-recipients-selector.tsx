"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Users, Mail, CheckSquare, Square, Loader2, AlertCircle, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp, UserPlus, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Stakeholder {
  id?: number | string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  is_key_contact?: boolean;
}

interface StakeholderRecipientsSelectorProps {
  companyId?: number;
  selectedEmails: string[];
  onChange: (emails: string[], primaryStakeholder?: Stakeholder) => void;
  fallbackContact?: {
    name?: string;
    email?: string;
    role?: string;
    phone?: string;
  };
  accentColor?: "primary" | "sky" | "emerald";
  title?: string;
  subtitle?: string;
}

export function StakeholderRecipientsSelector({
  companyId,
  selectedEmails,
  onChange,
  fallbackContact,
  accentColor = "primary",
  title = "Recipient Email Selection (Registered Contacts)",
  subtitle = "Emails are sent strictly to verified company contacts stored in the system."
}: StakeholderRecipientsSelectorProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [isCcEnabled, setIsCcEnabled] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setStakeholders([]);
      setLoading(false);
      return;
    }

    const fetchStakeholders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clients/companies/${companyId}/stakeholders`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setStakeholders(Array.isArray(data) ? data : []);
        } else {
          setStakeholders([]);
        }
      } catch (err) {
        console.error("Failed to load company stakeholders for email dispatch:", err);
        setStakeholders([]);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };

    fetchStakeholders();
  }, [companyId]);

  // Combine fetched stakeholders with fallback contact (e.g. key_contact_email on the company)
  const combinedContacts: Stakeholder[] = useMemo(() => {
    const list = [...stakeholders];
    if (fallbackContact && fallbackContact.email && fallbackContact.email.trim()) {
      const fbEmail = fallbackContact.email.trim().toLowerCase();
      const exists = list.some(s => s.email && s.email.trim().toLowerCase() === fbEmail);
      if (!exists) {
        list.unshift({
          id: "fallback-primary",
          name: fallbackContact.name || "Primary Contact",
          role: fallbackContact.role || "Key Contact",
          email: fallbackContact.email.trim(),
          phone: fallbackContact.phone,
          is_key_contact: true
        });
      }
    }
    return list;
  }, [stakeholders, fallbackContact]);

  const validContacts = useMemo(() => {
    return combinedContacts.filter(s => !!s.email && s.email.trim().length > 0);
  }, [combinedContacts]);

  // Determine Primary Contact (Key Contact or first valid contact)
  const primaryContact = useMemo(() => {
    if (validContacts.length === 0) return null;
    return validContacts.find(s => s.is_key_contact) || validContacts[0];
  }, [validContacts]);

  // Other contacts available for CC
  const otherContacts = useMemo(() => {
    if (!primaryContact || !primaryContact.email) return [];
    const primaryEmailLower = primaryContact.email.trim().toLowerCase();
    return validContacts.filter(s => s.email && s.email.trim().toLowerCase() !== primaryEmailLower);
  }, [validContacts, primaryContact]);

  // Auto-select the Primary Key Contact if nothing is selected yet
  useEffect(() => {
    if (primaryContact && primaryContact.email && selectedEmails.length === 0) {
      onChange([primaryContact.email.trim()], primaryContact);
    }
  }, [primaryContact, selectedEmails.length, onChange]);

  // Synchronize isCcEnabled if selectedEmails has CC recipients
  useEffect(() => {
    if (selectedEmails.length > 1) {
      setIsCcEnabled(true);
    }
  }, [selectedEmails.length]);

  const primaryEmail = primaryContact?.email?.trim() || "";
  const selectedCcEmails = useMemo(() => {
    if (selectedEmails.length <= 1 || !primaryEmail) return [];
    return selectedEmails.slice(1);
  }, [selectedEmails, primaryEmail]);

  // Handle CC Checkbox Toggle
  const handleToggleCcCheckbox = (enable: boolean) => {
    setIsCcEnabled(enable);
    if (!primaryEmail) return;

    if (!enable) {
      // Collapse & Reset to Primary Only
      onChange([primaryEmail], primaryContact || undefined);
    }
  };

  // Handle toggling individual CC email
  const handleToggleCcEmail = (email: string) => {
    if (!primaryEmail) return;
    const clean = email.trim();
    const cleanLower = clean.toLowerCase();

    let nextCc: string[];
    if (selectedCcEmails.some(e => e.toLowerCase() === cleanLower)) {
      nextCc = selectedCcEmails.filter(e => e.toLowerCase() !== cleanLower);
    } else {
      nextCc = [...selectedCcEmails, clean];
    }

    const nextAll = [primaryEmail, ...nextCc];
    onChange(nextAll, primaryContact || undefined);
  };

  // Handle Select All CC
  const handleSelectAllCc = () => {
    if (!primaryEmail) return;
    const allCc = otherContacts.map(s => s.email?.trim() || "").filter(Boolean);
    const uniqueCc = Array.from(new Set(allCc));
    onChange([primaryEmail, ...uniqueCc], primaryContact || undefined);
  };

  // Handle Clear CC
  const handleClearCc = () => {
    if (!primaryEmail) return;
    onChange([primaryEmail], primaryContact || undefined);
  };

  const ringColorClass = accentColor === "sky"
    ? "focus:ring-sky-500 text-sky-600 dark:text-sky-400 accent-sky-600"
    : accentColor === "emerald"
    ? "focus:ring-emerald-500 text-emerald-600 dark:text-emerald-400 accent-emerald-600"
    : "focus:ring-primary text-primary accent-primary";

  const primaryBadgeClass = accentColor === "sky"
    ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40"
    : accentColor === "emerald"
    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
    : "bg-primary/20 text-primary border-primary/40";

  const primaryCardBorder = accentColor === "sky"
    ? "border-sky-500/40 bg-sky-500/5 dark:bg-sky-950/20"
    : accentColor === "emerald"
    ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20"
    : "border-primary/40 bg-primary/5 dark:bg-primary/10";

  const isCcSelected = (email?: string) => {
    if (!email) return false;
    const cleanLower = email.trim().toLowerCase();
    return selectedCcEmails.some(e => e.toLowerCase() === cleanLower);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-muted/20 dark:bg-zinc-950/40 p-4 sm:p-5 space-y-4 transition-all">
      {/* Header section */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <h4 className="text-sm font-bold text-foreground truncate">{title}</h4>
            <Badge variant="outline" className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-background shadow-2xs">
              {selectedEmails.length} {selectedEmails.length === 1 ? "recipient" : "recipients"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">System Registered</span>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2 bg-background/50 rounded-xl border border-border/40">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading registered company contacts...</span>
        </div>
      ) : validContacts.length === 0 ? (
        /* Empty state: No contacts found */
        <div className="py-4 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">No registered contacts with email found for this company.</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              To send emails, please register stakeholder or company contacts with valid email addresses under Company Management. Free-text email entry is disabled for compliance and security.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* PRIMARY RECIPIENT CARD (Always To) */}
          {primaryContact && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                Primary Recipient (To)
              </label>

              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${primaryCardBorder}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-background border border-border flex items-center justify-center text-primary font-bold text-xs shrink-0 shadow-2xs">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-foreground truncate">{primaryContact.name}</span>
                      {primaryContact.role && (
                        <Badge variant="secondary" className="text-[9px] py-0 px-1.5 font-semibold">
                          {primaryContact.role}
                        </Badge>
                      )}
                      {primaryContact.is_key_contact && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                          Key Contact
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground truncate block mt-0.5">
                      {primaryContact.email}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <Badge variant="outline" className={`text-[10px] font-semibold py-0.5 px-2.5 shadow-2xs ${primaryBadgeClass}`}>
                    Primary (To)
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* CC EXPANSION CHECKBOX (Toggles other available contacts) */}
          {otherContacts.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between bg-background/60 dark:bg-zinc-900/60 p-3 rounded-xl border border-border/70 hover:border-border transition-colors">
                <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={isCcEnabled}
                    onChange={(e) => handleToggleCcCheckbox(e.target.checked)}
                    className={`h-4 w-4 rounded border-border cursor-pointer shrink-0 ${ringColorClass}`}
                  />
                  <span>Send copy to additional company contacts (CC)</span>
                </label>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-mono font-medium px-2 py-0.5">
                    {otherContacts.length} {otherContacts.length === 1 ? "contact available" : "contacts available"}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleToggleCcCheckbox(!isCcEnabled)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded transition-colors"
                  >
                    {isCcEnabled ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* EXPANDED CC CONTACTS LIST (Shows 3 items, scroll for the rest) */}
              {isCcEnabled && (
                <div className="space-y-2 pl-2 sm:pl-3 border-l-2 border-primary/30 pt-1 animate-in fade-in-50 duration-200">
                  {/* CC Toolbar / Controls */}
                  <div className="flex items-center justify-between text-xs pb-1">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Select contacts to include as CC:
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleSelectAllCc}
                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer transition-colors"
                      >
                        Select All
                      </button>
                      <span className="text-muted-foreground text-[10px]">•</span>
                      <button
                        type="button"
                        onClick={handleClearCc}
                        className="text-[11px] font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      >
                        Clear CC
                      </button>
                    </div>
                  </div>

                  {/* Scrollable list: Exactly 3 items visible (~176px), scrollable with scrollbar */}
                  <div
                    className="max-h-[176px] overflow-y-auto space-y-2 pr-1.5"
                    style={{ scrollbarWidth: "thin" }}
                  >
                    {otherContacts.map((stk, idx) => {
                      const hasEmail = !!stk.email && stk.email.trim().length > 0;
                      const selected = isCcSelected(stk.email);

                      return (
                        <div
                          key={stk.id || `${stk.name}-${idx}`}
                          onClick={() => {
                            if (hasEmail && stk.email) {
                              handleToggleCcEmail(stk.email);
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all select-none ${
                            !hasEmail
                              ? "bg-muted/10 border-border/30 opacity-40 cursor-not-allowed"
                              : selected
                              ? "bg-primary/10 border-primary/50 text-foreground shadow-2xs ring-1 ring-primary/20 cursor-pointer"
                              : "bg-background/90 hover:bg-muted/50 border-border/70 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              disabled={!hasEmail}
                              checked={selected}
                              onChange={() => {
                                if (hasEmail && stk.email) {
                                  handleToggleCcEmail(stk.email);
                                }
                              }}
                              className={`h-4 w-4 rounded border-border cursor-pointer shrink-0 ${ringColorClass}`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-foreground truncate">{stk.name}</span>
                                {stk.role && (
                                  <Badge variant="secondary" className="text-[9px] py-0 px-1.5 font-semibold">
                                    {stk.role}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground font-mono truncate block mt-0.5">
                                {stk.email}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 pl-2">
                            {selected ? (
                              <Badge variant="outline" className="text-[10px] font-semibold py-0.5 px-2 bg-primary/20 text-primary border-primary/30">
                                Copy (CC)
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground hover:text-foreground">
                                + Add CC
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground italic px-1">
              No additional registered contacts available for CC for this company.
            </div>
          )}
        </div>
      )}

      {/* Recipient summary footer */}
      {selectedEmails.length > 0 && (
        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-mono text-[11px] text-foreground font-semibold truncate">
              To: {selectedEmails[0]}
            </span>
            {selectedEmails.length > 1 && (
              <span className="text-[10px] text-primary font-mono font-medium">
                (+{selectedEmails.length - 1} CC: {selectedEmails.slice(1).join(", ")})
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {selectedEmails.length} Registered Recipient{selectedEmails.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
