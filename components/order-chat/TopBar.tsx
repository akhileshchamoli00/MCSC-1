"use client";

import React from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  RotateCw,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
  FileDown
} from "lucide-react";
import { formatHumanStatus } from "./utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface TopBarProps {
  orderNumber?: string | null;
  orderStatus?: string | null;
  companyName?: string | null;
  clientName?: string | null;
  showDetails: boolean;
  onToggleDetails: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  refreshing?: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onSaveToDropbox?: () => void;
  isSavingToDropbox?: boolean;
  savingToDropbox?: boolean;
  onDownloadTranscript?: () => void;
  isDownloadingTranscript?: boolean;
  downloadingTranscript?: boolean;
}

export function TopBar({
  orderNumber,
  orderStatus,
  companyName,
  clientName,
  showDetails,
  isAdmin = false,
  onToggleDetails,
  onRefresh,
  isRefreshing,
  refreshing,
  onClose,
  onSaveToDropbox,
  isSavingToDropbox,
  savingToDropbox,
  onDownloadTranscript,
  isDownloadingTranscript,
  downloadingTranscript
}: TopBarProps) {
  const activeRefreshing = Boolean(isRefreshing || refreshing);
  const activeSavingDropbox = Boolean(isSavingToDropbox || savingToDropbox);
  const activeDownloading = Boolean(isDownloadingTranscript || downloadingTranscript);

  const [copied, setCopied] = React.useState(false);
  const statusInfo = formatHumanStatus(orderStatus);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!orderNumber) return;
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    toast.success(`Order #${orderNumber} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-14 sm:h-16 px-3 sm:px-5 border-b border-[var(--oc-border)] bg-[var(--oc-bg-panel)] flex items-center justify-between shrink-0 select-none z-10 transition-colors">
      {/* Left: Back button + Full Order Number + Status Badge + Subtitle */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onClose}
                title="Back to orders"
                aria-label="Back to orders"
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-[var(--oc-radius-sm)] flex items-center justify-center text-[var(--oc-text-secondary)] hover:text-[var(--oc-text-primary)] hover:bg-[var(--oc-bg-subtle)] border border-[var(--oc-border)] transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="z-[100]">Back to Orders</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Full Order Number (Monospace, copy-on-click) */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="group inline-flex items-center gap-1.5 font-mono font-semibold text-sm sm:text-base text-[var(--oc-text-primary)] hover:text-[var(--oc-brand-600)] transition-colors cursor-pointer"
                    aria-label={`Copy order number ${orderNumber}`}
                  >
                    <span>#{orderNumber}</span>
                    <span className="p-0.5 rounded text-[var(--oc-text-tertiary)] group-hover:text-[var(--oc-brand-600)] transition-colors">
                      {copied ? <Check className="h-3.5 w-3.5 text-[var(--oc-status-success-text)]" /> : <Copy className="h-3 w-3" />}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[100]">{copied ? "Copied!" : "Click to copy full order number"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Status badge with a colored dot and human label */}
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-[var(--oc-radius-full)] border"
              style={{
                backgroundColor: `var(--oc-status-${statusInfo.variant}-bg)`,
                color: `var(--oc-status-${statusInfo.variant}-text)`,
                borderColor: `var(--oc-status-${statusInfo.variant}-border)`
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: statusInfo.dotColor }}
              />
              <span>{statusInfo.label}</span>
            </span>
          </div>

          {/* Subtitle: Client Name & Company Name */}
          {(companyName || clientName) && (
            <div className="text-xs text-[var(--oc-text-secondary)] truncate flex items-center gap-1.5 mt-0.5 max-w-[240px] xs:max-w-xs sm:max-w-md">
              <span className="font-medium text-[var(--oc-text-primary)] truncate">{companyName || clientName}</span>
              {companyName && clientName && companyName !== clientName && (
                <>
                  <span className="text-[var(--oc-text-tertiary)]">•</span>
                  <span className="truncate">{clientName}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Secondary toggles & actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Toggle Details Panel */}
        <button
          type="button"
          onClick={onToggleDetails}
          className={`hidden md:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 sm:px-3 h-8 sm:h-8.5 rounded-[var(--oc-radius-sm)] border transition-colors cursor-pointer ${showDetails
              ? "bg-[var(--oc-bg-subtle)] text-[var(--oc-text-primary)] border-[var(--oc-border-strong)]"
              : "bg-[var(--oc-bg-panel)] text-[var(--oc-text-secondary)] hover:text-[var(--oc-text-primary)] border-[var(--oc-border)]"
            }`}
          aria-pressed={showDetails}
        >
          {showDetails ? (
            <>
              <PanelLeftClose className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Hide details</span>
            </>
          ) : (
            <>
              <PanelLeftOpen className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Show details</span>
            </>
          )}
        </button>

        <TooltipProvider delayDuration={100}>
          {/* Refresh Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onRefresh}
                disabled={activeRefreshing}
                title="Refresh conversation"
                aria-label="Refresh conversation"
                className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-[var(--oc-radius-sm)] flex items-center justify-center text-[var(--oc-text-secondary)] hover:text-[var(--oc-text-primary)] hover:bg-[var(--oc-bg-subtle)] border border-[var(--oc-border)] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`h-3.5 w-3.5 ${activeRefreshing ? "animate-spin text-[var(--oc-brand-600)]" : ""}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="z-[100]">Refresh conversation</TooltipContent>
          </Tooltip>

          {/* Dropbox Backup (Admin only) */}
          {isAdmin && onSaveToDropbox && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onSaveToDropbox}
                  disabled={activeSavingDropbox}
                  title="Archive chat to Dropbox"
                  aria-label="Archive chat to Dropbox"
                  className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-[var(--oc-radius-sm)] flex items-center justify-center text-[var(--oc-text-secondary)] hover:text-[var(--oc-brand-600)] hover:bg-[var(--oc-bg-subtle)] border border-[var(--oc-border)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Cloud className={`h-3.5 w-3.5 ${activeSavingDropbox ? "animate-spin text-[var(--oc-brand-600)]" : ""}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="z-[100]">Archive chat to Dropbox</TooltipContent>
            </Tooltip>
          )}

          {/* Download Transcript (Admin only) */}
          {isAdmin && onDownloadTranscript && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onDownloadTranscript}
                  disabled={activeDownloading}
                  title="Download chat transcript"
                  aria-label="Download chat transcript"
                  className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-[var(--oc-radius-sm)] flex items-center justify-center text-[var(--oc-text-secondary)] hover:text-[var(--oc-brand-600)] hover:bg-[var(--oc-bg-subtle)] border border-[var(--oc-border)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FileDown className={`h-3.5 w-3.5 ${activeDownloading ? "animate-spin text-[var(--oc-brand-600)]" : ""}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="z-[100]">Download chat transcript</TooltipContent>
            </Tooltip>
          )}

          {/* Close Dialog */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onClose}
                title="Close"
                aria-label="Close dialog"
                className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-[var(--oc-radius-sm)] flex items-center justify-center text-[var(--oc-text-secondary)] hover:text-[var(--oc-text-primary)] hover:bg-[var(--oc-bg-subtle)] border border-[var(--oc-border)] transition-colors cursor-pointer ml-1"
              >
                <X className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="z-[100]">Close workspace</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
