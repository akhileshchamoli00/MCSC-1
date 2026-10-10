"use client";

import React from "react";
import {
  Building2,
  Copy,
  Check,
  Layers,
  Users,
  Scale,
  Clock,
  CheckSquare,
  FileText,
  Mail,
  Phone,
  PanelLeftClose,
  ChevronRight
} from "lucide-react";
import { OrderSummaryData, ChatMessage } from "./types";
import { StatusTimeline } from "./StatusTimeline";
import { isSystemMessage } from "./utils";
import { toast } from "sonner";
import { resolveImageUrl } from "@/lib/utils";

interface OrderDetailsPanelProps {
  orderSummary: OrderSummaryData | null;
  loading?: boolean;
  isOpen?: boolean;
  fallbackCompanyName?: string | null;
  fallbackOrderTitle?: string | null;
  orderTitle?: string | null;
  companyName?: string | null;
  clientName?: string | null;
  orderStatus?: string | null;
  systemEvents?: ChatMessage[];
  clientMessages?: ChatMessage[];
  internalMessages?: ChatMessage[];
  onCollapse?: () => void;
}

export function OrderDetailsPanel({
  orderSummary,
  loading = false,
  isOpen = true,
  fallbackCompanyName,
  fallbackOrderTitle,
  orderTitle,
  companyName: propCompanyName,
  clientName: propClientName,
  orderStatus: propOrderStatus,
  systemEvents: propSystemEvents,
  clientMessages = [],
  internalMessages = [],
  onCollapse
}: OrderDetailsPanelProps) {
  const [copiedCode, setCopiedCode] = React.useState(false);

  // Extract combined system events if not provided explicitly
  const systemEvents = React.useMemo(() => {
    if (propSystemEvents && propSystemEvents.length > 0) return propSystemEvents;
    const combined = [...clientMessages, ...internalMessages];
    const seen = new Set<string | number>();
    const events: ChatMessage[] = [];
    for (const msg of combined) {
      if (msg && isSystemMessage(msg)) {
        const key =
          msg.id !== undefined && msg.id !== null
            ? `id-${msg.id}`
            : `msg-${msg.message}-${msg.created_at}`;
        if (!seen.has(key)) {
          seen.add(key);
          events.push(msg);
        }
      }
    }
    return events;
  }, [propSystemEvents, clientMessages, internalMessages]);

  if (!isOpen) return null;

  const company = orderSummary?.company;
  const companyName =
    company?.company_name || propCompanyName || fallbackCompanyName || "Client Company";
  const companyCode = company?.company_code;
  const clientContact = company?.client || orderSummary?.client;
  const deliverables = orderSummary?.items || [];
  const consultants = orderSummary?.consultants || [];
  const notaries = orderSummary?.notaries || [];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success(`Company Code ${code} copied`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <aside
      className="w-full lg:w-[310px] xl:w-[320px] shrink-0 flex flex-col h-full min-h-0 bg-[#F8F9FA] dark:bg-[#0F0F12] bg-[var(--oc-bg-app)] border-r border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] overflow-hidden select-none transition-colors"
      aria-label="Order Details Panel"
    >
      {/* Header */}
      <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)] flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--oc-text-secondary)]">
          Order Details
        </span>
        <button
          type="button"
          onClick={onCollapse}
          className="h-7 w-7 rounded-[var(--oc-radius-xs)] flex items-center justify-center text-[var(--oc-text-tertiary)] hover:text-[var(--oc-text-primary)] hover:bg-[var(--oc-bg-subtle)] transition-colors cursor-pointer"
          title="Collapse details panel"
          aria-label="Collapse details panel"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Body: Stacked Cards */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3.5 overscroll-contain"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(125, 125, 125, 0.3) transparent"
        }}
      >
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-28 bg-[var(--oc-bg-subtle)] rounded-[var(--oc-radius-md)]" />
            <div className="h-36 bg-[var(--oc-bg-subtle)] rounded-[var(--oc-radius-md)]" />
            <div className="h-28 bg-[var(--oc-bg-subtle)] rounded-[var(--oc-radius-md)]" />
            <div className="h-32 bg-[var(--oc-bg-subtle)] rounded-[var(--oc-radius-md)]" />
          </div>
        ) : (
          <>
            {/* CARD 1: Client & Company */}
            <div className="p-3.5 rounded-[var(--oc-radius-md)] bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)] border border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] shadow-[var(--oc-shadow-xs)] space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="h-8 w-8 rounded-[var(--oc-radius-sm)] bg-[var(--oc-brand-50)] text-[var(--oc-brand-600)] flex items-center justify-center border border-[var(--oc-brand-100)] shrink-0 mt-0.5">
                  <Building2 className="h-4 w-4" />
                </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-[var(--oc-text-primary)] leading-tight truncate">
                {companyName}
              </h4>
              {companyCode && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-mono font-medium text-[var(--oc-brand-600)] bg-[var(--oc-brand-50)] border border-[var(--oc-brand-100)] px-1.5 py-0.2 rounded-[var(--oc-radius-xs)]">
                    {companyCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(companyCode)}
                    className="text-[var(--oc-text-tertiary)] hover:text-[var(--oc-text-primary)] transition-colors p-0.5 cursor-pointer"
                    title="Copy Company Code"
                  >
                    {copiedCode ? <Check className="h-3 w-3 text-[var(--oc-status-success-text)]" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contact Details */}
          {clientContact && (
            <div className="pt-2 border-t border-[var(--oc-border)] space-y-1 text-xs text-[var(--oc-text-secondary)]">
              {(clientContact.name || clientContact.first_name) && (
                <div className="font-medium text-[var(--oc-text-primary)] truncate">
                  {clientContact.name || `${clientContact.first_name || ""} ${clientContact.last_name || ""}`.trim()}
                </div>
              )}
              {clientContact.email && (
                <div className="flex items-center gap-1.5 text-[11px] truncate">
                  <Mail className="h-3 w-3 text-[var(--oc-text-tertiary)] shrink-0" />
                  <span className="truncate">{clientContact.email}</span>
                </div>
              )}
              {clientContact.phone && (
                <div className="flex items-center gap-1.5 text-[11px] truncate">
                  <Phone className="h-3 w-3 text-[var(--oc-text-tertiary)] shrink-0" />
                  <span className="truncate">{clientContact.phone}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CARD 2: Scope & Deliverables (Checklist style) */}
        <div className="p-3.5 rounded-[var(--oc-radius-md)] bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)] border border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] shadow-[var(--oc-shadow-xs)] space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--oc-border)]">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[var(--oc-brand-600)]" />
              <span className="text-xs font-semibold text-[var(--oc-text-primary)]">Scope & Deliverables</span>
            </div>
            <span className="text-[10px] font-mono font-medium text-[var(--oc-text-secondary)] bg-[var(--oc-bg-subtle)] px-1.5 py-0.2 rounded-[var(--oc-radius-xs)]">
              {deliverables.length || 1}
            </span>
          </div>

          <div className="space-y-2.5">
            {deliverables.length > 0 ? (
              deliverables.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 rounded-[var(--oc-radius-sm)] bg-[var(--oc-bg-subtle)] border border-[var(--oc-border)] space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-start gap-1.5 min-w-0 flex-1">
                      <CheckSquare className="h-3.5 w-3.5 text-[var(--oc-status-success-text)] shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-[var(--oc-text-primary)] leading-snug break-words">
                        {item.job_title}
                      </span>
                    </div>
                    {item.job_id && (
                      <span className="text-[9px] font-mono font-semibold text-[var(--oc-brand-600)] bg-[var(--oc-brand-50)] border border-[var(--oc-brand-100)] px-1.5 py-0.2 rounded-[var(--oc-radius-xs)] shrink-0">
                        {item.job_id}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-[var(--oc-text-secondary)] leading-relaxed pl-5 whitespace-pre-line line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  {(item.service_instructions || item.notes) && (
                    <div className="mt-1.5 p-2 rounded-[var(--oc-radius-xs)] bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)] border border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] text-[11px] text-[var(--oc-text-secondary)] space-y-0.5">
                      <div className="flex items-center gap-1 font-medium text-[var(--oc-text-primary)] text-[10px]">
                        <FileText className="h-3 w-3 text-[var(--oc-text-tertiary)]" />
                        <span>Instructions:</span>
                      </div>
                      <p className="text-[11px] line-clamp-3 leading-relaxed">
                        {item.service_instructions || item.notes}
                      </p>
                    </div>
                  )}

                  {/* Badges / Tags */}
                  {(item.needs_notary || item.needs_gov_officer || item.needs_other_vendors || item.notary_name) && (
                    <div className="flex items-center gap-1 flex-wrap pt-1 pl-5">
                      {item.notary_name ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-semibold inline-flex items-center gap-1">
                          <Scale className="h-2.5 w-2.5 shrink-0" />
                          Notary: {item.notary_name}
                        </span>
                      ) : item.needs_notary ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-medium">
                          Notary
                        </span>
                      ) : null}
                      {item.needs_gov_officer && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium">
                          Gov Approval
                        </span>
                      )}
                      {item.needs_other_vendors && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                          Vendor
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-2.5 rounded-[var(--oc-radius-sm)] bg-[var(--oc-bg-subtle)] text-xs text-[var(--oc-text-secondary)]">
                <span className="font-medium text-[var(--oc-text-primary)] block">
                  {fallbackOrderTitle || "Corporate Licensing Scope"}
                </span>
                <span className="text-[11px] text-[var(--oc-text-tertiary)] mt-0.5 block">
                  Deliverables tracking active.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: Assigned Consultants & Team */}
        <div className="p-3.5 rounded-[var(--oc-radius-md)] bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)] border border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] shadow-[var(--oc-shadow-xs)] space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--oc-border)]">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[var(--oc-brand-600)]" />
              <span className="text-xs font-semibold text-[var(--oc-text-primary)]">Assigned Consultants</span>
            </div>
            {consultants.length > 0 && (
              <span className="text-[10px] font-mono font-medium text-[var(--oc-text-secondary)] bg-[var(--oc-bg-subtle)] px-1.5 py-0.2 rounded-[var(--oc-radius-xs)]">
                {consultants.length}
              </span>
            )}
          </div>

          {consultants.length > 0 ? (
            <div className="space-y-1.5">
              {consultants.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="flex items-center gap-2 p-1.5 rounded-[var(--oc-radius-sm)] hover:bg-[var(--oc-bg-subtle)] transition-colors"
                >
                  {c.profile_photo ? (
                    <img
                      src={resolveImageUrl(c.profile_photo)}
                      alt={c.name}
                      className="h-6 w-6 rounded-full object-cover border border-[var(--oc-border)] shrink-0"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-[var(--oc-brand-50)] text-[var(--oc-brand-600)] flex items-center justify-center font-semibold text-[10px] border border-[var(--oc-brand-100)] shrink-0">
                      {c.name?.charAt(0) || "C"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-[var(--oc-text-primary)] truncate block leading-tight">
                      {c.name}
                    </span>
                    <span className="text-[10px] text-[var(--oc-text-tertiary)] truncate block">
                      {c.job_title || c.position || "Consultant"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[var(--oc-text-tertiary)] italic p-1.5 text-center">
              No specific consultant assigned yet
            </div>
          )}

          {/* Notaries if assigned */}
          {notaries.length > 0 && (
            <div className="pt-2 border-t border-[var(--oc-border)] space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--oc-text-tertiary)] flex items-center gap-1">
                <Scale className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                <span>Appointed Notary / Officials</span>
              </div>
              {notaries.map((n, idx) => (
                <div key={n.id || idx} className="flex items-center gap-2 p-1.5 rounded-[var(--oc-radius-sm)]">
                  <div className="h-6 w-6 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-semibold border border-indigo-200 dark:border-indigo-800 shrink-0">
                    <Scale className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-[var(--oc-text-primary)] truncate block leading-tight">
                      {n.name}
                    </span>
                    <span className="text-[10px] text-[var(--oc-text-tertiary)] truncate block">
                      {n.vendor_type === "GOVERNMENT_OFFICER" || n.is_gov_officer
                        ? "Government Official"
                        : "Appointed Notary"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CARD 4: Status Timeline (Status history lives here!) */}
        <div className="p-3.5 rounded-[var(--oc-radius-md)] bg-white dark:bg-[#18181C] bg-[var(--oc-bg-panel)] border border-zinc-200 dark:border-zinc-800 border-[var(--oc-border)] shadow-[var(--oc-shadow-xs)] space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--oc-border)]">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[var(--oc-brand-600)]" />
              <span className="text-xs font-semibold text-[var(--oc-text-primary)]">Status History</span>
            </div>
            <span className="text-[10px] text-[var(--oc-text-tertiary)]">Timeline</span>
          </div>

          <StatusTimeline
            currentStatus={orderSummary?.status}
            systemEvents={systemEvents}
            createdAt={orderSummary?.created_at}
          />
        </div>
        </>
        )}
      </div>
    </aside>
  );
}
