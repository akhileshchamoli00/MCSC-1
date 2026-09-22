"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { StakeholderRecipientsSelector } from "@/components/stakeholder-recipients-selector"
import {
  Send,
  Building2,
  AlertTriangle,
  Lock,
  FileText,
  FileArchive,
  Loader2,
  Paperclip,
  FileCheck,
  AlertCircle,
} from "lucide-react"

export interface OrderDeliverablesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sendDocsOrder: any | null
  companies: any[]
  selectedDocsEmails: string[]
  setSelectedDocsEmails: React.Dispatch<React.SetStateAction<string[]>>
  setSendDocsRecipientName: (val: string) => void
  sendDocsCustomMessage: string
  setSendDocsCustomMessage: (val: string) => void
  sendDocsDisableZip: boolean
  setSendDocsDisableZip: (val: boolean) => void
  sendDocsZipInfo: any
  sendDocsDocuments: any[]
  fetchingDocsLoading: boolean
  sendingDocsLoading: boolean
  onSend: () => void
  onCancel: () => void
}

export function OrderDeliverablesDialog({
  open,
  onOpenChange,
  sendDocsOrder,
  companies,
  selectedDocsEmails,
  setSelectedDocsEmails,
  setSendDocsRecipientName,
  sendDocsCustomMessage,
  setSendDocsCustomMessage,
  sendDocsDisableZip,
  setSendDocsDisableZip,
  sendDocsZipInfo,
  sendDocsDocuments,
  fetchingDocsLoading,
  sendingDocsLoading,
  onSend,
  onCancel,
}: OrderDeliverablesDialogProps) {
  return (
<Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl w-[96vw] max-h-[88vh] h-[88vh] md:h-auto md:max-h-[86vh] p-0 !gap-0 bg-background border border-border text-foreground rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 pb-3 border-b border-border/60 bg-gradient-to-r from-sky-500/15 via-sky-500/5 to-transparent dark:from-sky-950/50 dark:via-sky-950/20 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2.5 text-sky-600 dark:text-sky-400">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-xs shrink-0">
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <span>Send Final Deliverable Documents</span>
              </DialogTitle>
              {sendDocsOrder && (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs font-bold bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400 px-2.5 py-0.5">
                    {sendDocsOrder.order_number}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                    {sendDocsDocuments.length} files attached
                  </Badge>
                  <span className="text-xs font-bold text-foreground flex items-center gap-1 bg-background/80 px-2.5 py-0.5 rounded-lg border border-border/70 truncate max-w-[220px]">
                    <Building2 className="h-3 w-3 text-sky-600 shrink-0" />
                    <span className="truncate">{sendDocsOrder.company_name || sendDocsOrder.client_name || "Client"}</span>
                  </span>
                </div>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-normal">
              Dispatch official deliverables directly from the Dropbox order folder to the client as an AES-256 password-protected ZIP archive.
            </DialogDescription>
          </div>

          {/* Body: 2-Column Horizontal Layout */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-start">
              {/* Left Column (7 cols): Stakeholders, Custom Message & Encryption Details */}
              <div className="md:col-span-6 lg:col-span-7 space-y-3">
                {/* Unverified Company Warning for Final Deliverables */}
                {sendDocsOrder && (() => {
                  const finalDocsBillingComp = companies.find((c: any) => c.id === (sendDocsOrder.billing_company_id || sendDocsOrder.company_id));
                  const finalDocsTargetComp = companies.find((c: any) => c.id === sendDocsOrder.company_id);
                  const effFinalDocsComp = finalDocsBillingComp || finalDocsTargetComp;
                  const isFinalDocsVerified = sendDocsZipInfo?.is_company_verified !== undefined
                    ? sendDocsZipInfo.is_company_verified
                    : (effFinalDocsComp ? (effFinalDocsComp.validation_status === 'VALIDATED' || effFinalDocsComp.validation_status === 'VERIFIED') : true);
                  const finalDocsStatus = sendDocsZipInfo?.company_validation_status || effFinalDocsComp?.validation_status || 'PENDING_VALIDATION';

                  if (!isFinalDocsVerified) {
                    return (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" /> Company Profile Not Verified
                        </p>
                        <p className="leading-relaxed text-[11px]">
                          Official final deliverable documents cannot be emailed because company <strong>{sendDocsOrder.company_name}</strong> has not been verified (Current status: <strong>{finalDocsStatus}</strong>). Please validate and verify the company profile first.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {sendDocsOrder && (
                  <StakeholderRecipientsSelector
                    companyId={sendDocsOrder.billing_company_id || sendDocsOrder.company_id}
                    selectedEmails={selectedDocsEmails}
                    onChange={(emails, primaryStk) => {
                      setSelectedDocsEmails(emails);
                      if (primaryStk?.name) {
                        setSendDocsRecipientName(primaryStk.name);
                      }
                    }}
                    fallbackContact={{
                      name: companies.find((c: any) => c.id === (sendDocsOrder.billing_company_id || sendDocsOrder.company_id))?.key_contact_person || sendDocsOrder.client_name,
                      email: companies.find((c: any) => c.id === (sendDocsOrder.billing_company_id || sendDocsOrder.company_id))?.key_contact_email,
                      phone: companies.find((c: any) => c.id === (sendDocsOrder.billing_company_id || sendDocsOrder.company_id))?.key_contact_phone,
                      role: "Primary Contact"
                    }}
                    accentColor="sky"
                    title="Deliverables Email Recipients"
                    subtitle="Password-protected final documents will be dispatched exclusively to the selected registered company contacts."
                    compact={true}
                  />
                )}

                {/* Optional Custom Message Note */}
                <div className="space-y-1 bg-muted/30 p-2.5 sm:p-3 rounded-xl border border-border/60">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    Optional Delivery Note / Custom Message
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Please find the legalized articles of association and official deed documents attached..."
                    value={sendDocsCustomMessage}
                    onChange={(e) => setSendDocsCustomMessage(e.target.value)}
                    className="h-8 sm:h-9 text-xs bg-background border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                </div>

                {/* Delivery Mode: Direct Attachments vs Encrypted ZIP Checkbox */}
                <div className="flex items-start space-x-2.5 bg-muted/30 p-2.5 sm:p-3 rounded-xl border border-border/60">
                  <Checkbox
                    id="send-final-docs-disable-zip"
                    checked={sendDocsDisableZip}
                    onCheckedChange={(checked) => setSendDocsDisableZip(!!checked)}
                    className="mt-0.5 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                  />
                  <div className="grid gap-0.5 leading-none cursor-pointer" onClick={() => setSendDocsDisableZip(!sendDocsDisableZip)}>
                    <label
                      htmlFor="send-final-docs-disable-zip"
                      className="text-xs font-bold text-foreground cursor-pointer select-none"
                    >
                      Send as direct attachments (No ZIP & No password protection)
                    </label>
                    <p className="text-[11px] text-muted-foreground select-none">
                      When checked, deliverable files will be sent as standard individual email attachments without ZIP encryption.
                    </p>
                  </div>
                </div>

                {/* Security & Password-Protected ZIP Details Card or Direct Attachment Notice */}
                {!sendDocsDisableZip ? (
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        AES-256 ZIP ({sendDocsZipInfo?.zip_filename || "Documents.zip"})
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/20 border-emerald-500/30 px-2 py-0.5">
                        Auto-Encrypted
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 font-mono text-xs">
                      <span className="text-muted-foreground font-sans font-medium text-[11px]">ZIP Password:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-background/80 px-2 py-0.5 rounded border border-emerald-500/30 text-xs">
                        {sendDocsZipInfo?.zip_password || "Company Code + Order ID"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 dark:bg-sky-950/20 text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-sky-800 dark:text-sky-300">
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        <Paperclip className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        Direct Deliverable Attachments ({sendDocsDocuments.length} files)
                      </span>
                      <Badge variant="outline" className="font-mono text-[10px] text-sky-700 dark:text-sky-400 bg-sky-500/20 border-sky-500/30 px-2 py-0.5">
                        Unencrypted
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-0.5">
                      All final deliverable documents will be attached directly to the email without password protection.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column (5 cols): Final Documents Breakdown */}
              <div className="md:col-span-6 lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-sky-600" /> Deliverables ({sendDocsDocuments.length})
                  </label>
                  <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded">
                    /Final Documents
                  </span>
                </div>

                {fetchingDocsLoading ? (
                  <div className="p-8 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                    <span className="text-xs font-medium">Scanning Dropbox final documents...</span>
                  </div>
                ) : sendDocsDocuments.length === 0 ? (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      No Deliverables Found
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Please upload the completed final documents in the Company Documents section or Dropbox folder before sending.
                    </p>
                  </div>
                ) : (
                  <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40 bg-card max-h-[360px] overflow-y-auto">
                    {sendDocsDocuments.map((doc, idx) => (
                      <div key={idx} className="p-2 sm:p-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
                            <Paperclip className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground block truncate" title={doc.file_name}>{doc.file_name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              {doc.size ? `${(doc.size / 1024).toFixed(1)} KB • ` : ""}{doc.document_type || "Final Document"}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-500/10 border-emerald-500/20 px-2 py-0.5 shrink-0 ml-2">
                          Ready
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-3 sm:p-3.5 px-4 sm:px-6 border-t border-border/60 bg-muted/10 gap-2 shrink-0 flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="text-xs font-semibold h-8 sm:h-9 px-3.5 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSend}
              disabled={
                sendingDocsLoading ||
                fetchingDocsLoading ||
                sendDocsZipInfo?.is_company_verified === false ||
                selectedDocsEmails.length === 0 ||
                sendDocsDocuments.length === 0
              }
              className="text-xs font-bold h-8 sm:h-9 px-4 sm:px-5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white shadow-sm gap-1.5 rounded-lg disabled:opacity-40 transition-all"
            >
              {sendingDocsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Confirm & Send Documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}
