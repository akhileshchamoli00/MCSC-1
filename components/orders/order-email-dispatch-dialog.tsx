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
import { StakeholderRecipientsSelector } from "@/components/stakeholder-recipients-selector"
import { PhoneInput, isValidPhoneNumber } from "@/components/ui/phone-input"
import {
  Receipt,
  Building2,
  AlertTriangle,
  Mail,
  MessageSquare,
  CheckCircle2,
  Lock,
  DollarSign,
  Send,
  Loader2,
  Phone,
  FileText,
} from "lucide-react"

export interface OrderEmailDispatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  emailConfirmType: 'proforma' | 'final' | null
  setEmailConfirmType: (val: 'proforma' | 'final' | null) => void
  selectedOrderGroup: any | null
  companies: any[]
  proformaPercent?: number
  invoiceDeliveryChannel: 'both' | 'email' | 'whatsapp'
  setInvoiceDeliveryChannel: (channel: 'both' | 'email' | 'whatsapp') => void
  selectedInvoiceEmails: string[]
  setSelectedInvoiceEmails: React.Dispatch<React.SetStateAction<string[]>>
  emailConfirmPhone: string
  setEmailConfirmPhone: (val: string) => void
  sendingEmail: boolean
  onSend: () => void
  onCancel: () => void
}

export function OrderEmailDispatchDialog({
  open,
  onOpenChange,
  emailConfirmType,
  setEmailConfirmType,
  selectedOrderGroup,
  companies,
  proformaPercent,
  invoiceDeliveryChannel,
  setInvoiceDeliveryChannel,
  selectedInvoiceEmails,
  setSelectedInvoiceEmails,
  emailConfirmPhone,
  setEmailConfirmPhone,
  sendingEmail,
  onSend,
  onCancel,
}: OrderEmailDispatchDialogProps) {
  return (
<Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-5xl md:max-w-6xl lg:max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1500px] w-[96vw] max-h-[95vh] h-auto p-0 !gap-0 bg-background border border-border text-foreground rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className={`p-4 sm:px-6 sm:py-3.5 border-b border-border/60 shrink-0 ${
            emailConfirmType === 'final'
              ? 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent dark:from-emerald-950/50 dark:via-emerald-950/20'
              : 'bg-gradient-to-r from-sky-500/15 via-sky-500/5 to-transparent dark:from-sky-950/50 dark:via-sky-950/20'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <DialogTitle className={`text-base sm:text-lg font-bold flex items-center gap-2.5 ${
                emailConfirmType === 'final' ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'
              }`}>
                <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-xl border shadow-xs flex items-center justify-center shrink-0 ${
                  emailConfirmType === 'final'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400'
                }`}>
                  <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <span>Dispatch {emailConfirmType === 'final' ? 'Final Tax Invoice' : 'Proforma Invoice'}</span>
              </DialogTitle>
              {selectedOrderGroup && (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Badge variant="outline" className={`font-mono text-xs font-bold px-2.5 py-0.5 ${
                    emailConfirmType === 'final'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400'
                  }`}>
                    {selectedOrderGroup.order_number}
                  </Badge>
                  <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                    {emailConfirmType === 'final' ? '100% Full Total' : `Proforma Stage (${selectedOrderGroup.proforma_stage_percent || proformaPercent || 70}%)`}
                  </Badge>
                  <span className="text-xs font-bold text-foreground flex items-center gap-1 bg-background/80 px-2.5 py-0.5 rounded-lg border border-border/70 truncate max-w-[240px]">
                    <Building2 className={`h-3 w-3 shrink-0 ${emailConfirmType === 'final' ? 'text-emerald-600' : 'text-sky-600'}`} />
                    <span className="truncate">{selectedOrderGroup.company_name || selectedOrderGroup.client_name || "Client"}</span>
                  </span>
                </div>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-normal">
              Dispatches official invoice document and payment notification directly to the client's registered contacts.
            </DialogDescription>
          </div>

          {/* Body: 2-Column Horizontal Layout */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:px-6 sm:py-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-start">
              {/* Left Column (7 cols): Channel Selection, Stakeholder Emails, WhatsApp, Alerts */}
              <div className="md:col-span-6 lg:col-span-7 space-y-2.5 sm:space-y-3">
                {/* Unverified Company Warning for Email Dispatch */}
                {selectedOrderGroup && (() => {
                  const billingComp = companies.find((c: any) => c.id === (selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id));
                  const targetComp = companies.find((c: any) => c.id === selectedOrderGroup.company_id);
                  const effComp = billingComp || targetComp;
                  const isCompVerified = effComp ? (effComp.validation_status === 'VALIDATED' || effComp.validation_status === 'VERIFIED') : true;
                  const compValStatus = effComp?.validation_status || 'PENDING_VALIDATION';

                  if (!isCompVerified && (invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'email')) {
                    return (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" /> Company Profile Not Verified
                        </p>
                        <p className="leading-relaxed text-[11px]">
                          Company <strong>{effComp?.company_name || selectedOrderGroup.company_name}</strong> has not been verified yet (Current status: <strong>{compValStatus}</strong>). Email sending is disabled until the company profile is reviewed and marked as <strong>VALIDATED</strong>. You may still dispatch via WhatsApp only.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Delivery Channel Selector */}
                <div className="space-y-1 bg-muted/30 p-2 sm:p-2.5 rounded-xl border border-border/60">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Delivery Channel Selection</span>
                    <span className="text-[11px] text-muted-foreground/80 font-normal">Choose delivery method</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    <button
                      type="button"
                      onClick={() => setInvoiceDeliveryChannel('both')}
                      className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer select-none gap-0.5 ${invoiceDeliveryChannel === 'both'
                        ? (emailConfirmType === 'final'
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm ring-1 ring-emerald-500/40'
                            : 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm ring-1 ring-sky-500/40')
                        : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-black dark:border-white/40 dark:text-white dark:hover:bg-zinc-900 font-medium'
                        }`}
                    >
                      <div className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold">+</span>
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs leading-tight font-bold">Email & WhatsApp</span>
                      <span className="text-[10px] opacity-80 leading-tight">Both Channels</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInvoiceDeliveryChannel('email')}
                      className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer select-none gap-0.5 ${invoiceDeliveryChannel === 'email'
                        ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm ring-1 ring-sky-500/40'
                        : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-black dark:border-white/40 dark:text-white dark:hover:bg-zinc-900 font-medium'
                        }`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span className="text-xs leading-tight font-bold">Email Only</span>
                      <span className="text-[10px] opacity-80 leading-tight">PDF Attachment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInvoiceDeliveryChannel('whatsapp')}
                      className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer select-none gap-0.5 ${invoiceDeliveryChannel === 'whatsapp'
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm ring-1 ring-emerald-500/40'
                        : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-black dark:border-white/40 dark:text-white dark:hover:bg-zinc-900 font-medium'
                        }`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span className="text-xs leading-tight font-bold">WhatsApp Only</span>
                      <span className="text-[10px] opacity-80 leading-tight">Meta Cloud API</span>
                    </button>
                  </div>
                </div>

                {/* Email Recipients Section (Only for Email or Both) */}
                {(invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'email') && selectedOrderGroup && (
                  <StakeholderRecipientsSelector
                    companyId={selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id}
                    selectedEmails={selectedInvoiceEmails}
                    onChange={(emails) => setSelectedInvoiceEmails(emails)}
                    fallbackContact={{
                      name: companies.find((c: any) => c.id === (selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id))?.key_contact_person || selectedOrderGroup.client_name,
                      email: companies.find((c: any) => c.id === (selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id))?.key_contact_email,
                      phone: companies.find((c: any) => c.id === (selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id))?.key_contact_phone,
                      role: "Primary Contact"
                    }}
                    accentColor={emailConfirmType === 'final' ? 'emerald' : 'sky'}
                    title="Invoice Email Recipients"
                    subtitle="The official PDF invoice will be emailed directly to the selected registered company contacts."
                    compact={true}
                  />
                )}

                {/* WhatsApp Mobile Number Field (Only for WhatsApp or Both) */}
                {(invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'whatsapp') && (
                  <div className="space-y-1.5 bg-muted/30 p-2 sm:p-2.5 rounded-xl border border-border/60">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        WhatsApp Mobile Number <span className="text-destructive">*</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        Meta Cloud API
                      </span>
                    </label>
                    <PhoneInput
                      placeholder="812 3456 789"
                      value={emailConfirmPhone}
                      required
                      onChange={(val) => setEmailConfirmPhone(val)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      The client will receive an automated WhatsApp notification with invoice PDF attachment and payment link.
                    </p>
                  </div>
                )}

                {/* Channel Info Card */}
                <div className={`p-2.5 rounded-xl border text-xs transition-colors ${invoiceDeliveryChannel === 'both'
                  ? (emailConfirmType === 'final'
                      ? 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200'
                      : 'border-sky-500/30 bg-sky-500/10 dark:bg-sky-950/20 text-sky-950 dark:text-sky-200')
                  : invoiceDeliveryChannel === 'email'
                    ? 'border-sky-500/30 bg-sky-500/10 dark:bg-sky-950/20 text-sky-950 dark:text-sky-200'
                    : 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200'
                  }`}>
                  <div className="flex items-center gap-2 font-bold text-xs mb-0.5">
                    {invoiceDeliveryChannel === 'both' ? (
                      <>
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span>Dispatches via Email & WhatsApp Meta Cloud API</span>
                      </>
                    ) : invoiceDeliveryChannel === 'email' ? (
                      <>
                        <Mail className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                        <span>Dispatches PDF invoice attachment to client's email</span>
                      </>
                    ) : (
                      <>
                        <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Dispatches official WhatsApp message with PDF & payment link</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {invoiceDeliveryChannel === 'both'
                      ? 'Client will receive the PDF invoice attachment by email and an interactive WhatsApp notification with secure payment link.'
                      : invoiceDeliveryChannel === 'email'
                        ? 'Official PDF invoice with itemized breakdown and bank details will be delivered straight to client inbox.'
                        : 'Official WhatsApp direct message with attached PDF invoice and instant payment link will be sent.'}
                  </p>
                </div>
              </div>

              {/* Right Column (5 cols): Invoice Summary & Line Items Breakdown */}
              <div className="md:col-span-6 lg:col-span-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Receipt className={`h-3.5 w-3.5 ${emailConfirmType === 'final' ? 'text-emerald-600' : 'text-sky-600'}`} />
                    Invoice Summary & Breakdown
                  </label>
                  <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded">
                    {emailConfirmType === 'final' ? 'Final Tax' : 'Proforma'}
                  </span>
                </div>

                {/* Financial Calculation Card */}
                {selectedOrderGroup && (() => {
                  const effStagePct = selectedOrderGroup.proforma_stage_percent || proformaPercent || 70;
                  const rawTotal = selectedOrderGroup.total_amount || 0;
                  const proformaAmount = (rawTotal * effStagePct) / 100;
                  const payableAmount = emailConfirmType === 'final' ? rawTotal : proformaAmount;

                  return (
                    <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      emailConfirmType === 'final'
                        ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20'
                        : 'bg-sky-500/10 border-sky-500/30 dark:bg-sky-950/20'
                    }`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Billing Entity:</span>
                        <span className="font-bold text-foreground text-right truncate max-w-[200px]">
                          {selectedOrderGroup.company_name || selectedOrderGroup.client_name || "Client Entity"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">Contract Total:</span>
                        <span className="font-mono font-semibold text-foreground">
                          Rp {rawTotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                      {emailConfirmType === 'proforma' && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-medium">Stage Percentage:</span>
                          <Badge variant="outline" className="font-mono text-[10px] bg-sky-500/20 text-sky-700 border-sky-500/30 font-bold px-1.5 py-0">
                            {effStagePct}% Down Payment
                          </Badge>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-border/60 flex justify-between items-center">
                        <span className="font-bold text-foreground text-xs">
                          {emailConfirmType === 'final' ? 'Final Amount Due:' : `Proforma Due (${effStagePct}%):`}
                        </span>
                        <span className={`font-mono font-black text-sm sm:text-base ${
                          emailConfirmType === 'final' ? 'text-emerald-700 dark:text-emerald-300' : 'text-sky-700 dark:text-sky-300'
                        }`}>
                          Rp {Math.round(payableAmount).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Line Items List Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Billed Service Items ({selectedOrderGroup?.items?.length || 0})</span>
                    <span className="text-[10px] text-muted-foreground font-mono">/PDF Invoice</span>
                  </div>
                  {(!selectedOrderGroup?.items || selectedOrderGroup.items.length === 0) ? (
                    <div className="p-3 rounded-xl border border-dashed border-border text-center text-muted-foreground text-xs">
                      <span>Total lump sum service package billed</span>
                    </div>
                  ) : (
                    <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40 bg-card max-h-[170px] lg:max-h-[190px] overflow-y-auto">
                      {selectedOrderGroup.items.map((item: any, idx: number) => {
                        const linePrice = item.unit_price || item.total_price || item.price || 0;
                        const effStagePct = selectedOrderGroup.proforma_stage_percent || proformaPercent || 70;
                        const itemDue = emailConfirmType === 'final' ? linePrice : (linePrice * effStagePct) / 100;

                        return (
                          <div key={item.id || idx} className="p-2 flex items-center justify-between hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${
                                emailConfirmType === 'final'
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
                                  : 'bg-sky-500/10 border border-sky-500/20 text-sky-600'
                              }`}>
                                <FileText className="h-3 w-3" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-foreground block truncate max-w-[200px] sm:max-w-[240px]" title={item.job_title || item.service_name || item.name}>
                                  {item.job_title || item.service_name || item.name || `Service Item #${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono block">
                                  Qty: {item.quantity || 1} • Rp {Math.round(linePrice).toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <span className="font-mono text-xs font-bold text-foreground block">
                                Rp {Math.round(itemDue).toLocaleString("id-ID")}
                              </span>
                              <Badge variant="outline" className={`text-[9px] font-mono px-1 py-0 ${
                                emailConfirmType === 'final'
                                  ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20'
                                  : 'text-sky-700 bg-sky-500/10 border-sky-500/20'
                              }`}>
                                {emailConfirmType === 'final' ? '100%' : `${effStagePct}%`}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-3 sm:px-6 sm:py-3 border-t border-border/60 bg-muted/10 gap-2 shrink-0 flex items-center justify-end">
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
                sendingEmail ||
                (selectedOrderGroup && (() => {
                  const billingComp = companies.find((c: any) => c.id === (selectedOrderGroup.billing_company_id || selectedOrderGroup.company_id));
                  const targetComp = companies.find((c: any) => c.id === selectedOrderGroup.company_id);
                  const effComp = billingComp || targetComp;
                  const isCompVerified = effComp ? (effComp.validation_status === 'VALIDATED' || effComp.validation_status === 'VERIFIED') : true;
                  return !isCompVerified && (invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'email');
                })()) ||
                ((invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'email') && selectedInvoiceEmails.length === 0) ||
                ((invoiceDeliveryChannel === 'both' || invoiceDeliveryChannel === 'whatsapp') && (!emailConfirmPhone.trim() || !isValidPhoneNumber(emailConfirmPhone)))
              }
              className={`text-xs font-bold h-8 sm:h-9 px-4 sm:px-5 text-white shadow-sm gap-1.5 rounded-lg disabled:opacity-40 transition-all ${
                emailConfirmType === 'final'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                  : 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500'
              }`}
            >
              {sendingEmail ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {invoiceDeliveryChannel === 'both'
                ? "Send via Email & WhatsApp"
                : invoiceDeliveryChannel === 'email'
                  ? "Send via Email"
                  : "Send via WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}
