"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Download,
  X,
  FileCheck,
  CheckCircle2,
  Building,
  User,
  Calendar,
  Phone,
  Mail,
  Loader2,
  CheckSquare,
  FileText,
  ShieldCheck,
  Briefcase
} from "lucide-react";
import domToImage from "dom-to-image";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export interface JobDetailsPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any | null;
  services?: any[];
}

export function JobDetailsPrintDialog({
  open,
  onOpenChange,
  order,
  services = []
}: JobDetailsPrintDialogProps) {
  const [downloading, setDownloading] = useState(false);

  if (!order) return null;

  const orderNumber = order.order_number || `ORD-${order.id || "0000"}`;
  const companyName = order.company_name || order.client_name || "Client Entity";
  const clientName = order.client_name || "Client Representative";
  const items = order.items || [];

  // Parse lines for document checklist
  const parseChecklist = (desc?: string | null): string[] => {
    if (!desc) return [];
    let processed = desc.replace(/\s+([a-zA-Z]|\d+)\.\s+/g, "\n$1. ");
    processed = processed.replace(/\s+([•\-\*])\s+/g, "\n$1 ");
    const lines = processed
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines;
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("job-checklist-print-doc");
    if (!element || !order) return;
    setDownloading(true);

    const rawFileName = `Job_Details_Checklist_${companyName}_${orderNumber}`;
    const cleanFileName = rawFileName.replace(/[/\\?%*:|"<> ]/g, "_");
    const fileName = `${cleanFileName}.pdf`;

    try {
      const imgData = await domToImage.toJpeg(element, {
        quality: 0.98,
        bgcolor: "#ffffff"
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 190;
      const imgHeight = (element.clientHeight * imgWidth) / element.clientWidth;

      pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);
      pdf.save(fileName);
      toast.success(`Downloaded ${fileName} successfully!`);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF. Falling back to print...");
      handlePrint();
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const docElem = document.getElementById("job-checklist-print-doc");
    if (!docElem) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const title = `Job_Checklist_${companyName}_${orderNumber}`.replace(/[/\\?%*:|"<> ]/g, "_");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 10mm;
            }
            body {
              background: #ffffff !important;
              color: #18181b !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print { display: none !important; }
          </style>
        </head>
        <body class="p-2">
          ${docElem.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 350);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formattedDeliveryDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-4xl md:max-w-5xl lg:max-w-5xl w-[96vw] max-h-[92vh] h-[92vh] p-0 !gap-0 bg-card dark:bg-zinc-900 border border-border dark:border-zinc-700 text-foreground rounded-2xl shadow-2xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden flex flex-col"
      >
        {/* Top Control Bar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-border/80 dark:border-zinc-800 bg-muted/40 dark:bg-zinc-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 shadow-xs">
              <Printer className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground truncate">
                  Job Details & Deliverables Checklist
                </DialogTitle>
                <Badge variant="outline" className="font-mono text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30">
                  {orderNumber}
                </Badge>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10.5px] font-semibold">
                  Soft Copy Delivered
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                Preview and print job checklist to accompany hard copy deliverables handover.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={downloading}
              onClick={handleDownloadPDF}
              className="h-8.5 px-3.5 gap-1.5 text-xs font-bold shadow-xs bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
            >
              {downloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>Download PDF</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8.5 px-3.5 gap-1.5 text-xs font-bold border-border/80 dark:border-zinc-700 hover:bg-muted cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8.5 w-8.5 rounded-xl border border-border/80 dark:border-zinc-700 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 text-muted-foreground hover:opacity-100 transition-all cursor-pointer shadow-xs ml-1"
              title="Close Dialog (Esc)"
            >
              <X className="h-4.5 w-4.5 stroke-[2.5]" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Printable Document Canvas Desk */}
        <div className="flex-1 w-full overflow-y-auto p-4 sm:p-6 md:p-8 bg-zinc-200/70 dark:bg-zinc-950 flex justify-center border-t border-border/40 dark:border-zinc-800/80">
          <div
            id="job-checklist-print-doc"
            className="w-full max-w-3xl bg-white text-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-xl shadow-2xl p-7 sm:p-10 space-y-6 self-start text-xs leading-normal ring-1 ring-black/5 dark:ring-white/10"
            style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
          >
            {/* 1. Header / Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4 gap-6">
              <div>
                <img
                  src="/logo.png"
                  alt="MCSC Logo"
                  className="h-14 sm:h-16 w-auto object-contain shrink-0 mb-1.5"
                />
                <p className="text-[11px] text-zinc-600 leading-relaxed max-w-md">
                  Springhill Office Tower Lantai 9 Unit 9C, Jalan Benyamin Suaeb Blok D7-Kemayoran, Jakarta Utara 14410<br />
                  Tel: +62 878-7796-7799 | Email: admin@mcsc.co.id | www.mcsc.co.id
                </p>
              </div>

              <div className="text-right shrink-0 space-y-1">
                <div className="inline-block px-3 py-1 bg-zinc-900 text-white font-black font-mono text-[11px] rounded uppercase tracking-wider">
                  JOB COMPLETION TRANSMITTAL
                </div>
                <h3 className="font-mono text-lg font-black text-zinc-950">
                  {orderNumber}
                </h3>
                <p className="text-[11px] text-zinc-600 font-medium">
                  Date: <span className="font-mono text-zinc-950 font-bold">{formattedDeliveryDate}</span>
                </p>
                <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                  ✓ Soft Copy Delivered
                </p>
              </div>
            </div>

            {/* 2. Client & Project Overview Box */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <span className="text-[10px] uppercase font-extrabold text-zinc-500 tracking-wider">
                  Client & Order Information
                </span>
                <span className="font-mono text-[11px] font-bold text-sky-700">
                  Handover Ref: {orderNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Company / Client Entity
                  </span>
                  <span className="font-bold text-zinc-950 text-sm block">
                    {companyName}
                  </span>
                  {clientName && clientName !== companyName && (
                    <span className="text-zinc-600 text-[11px] block mt-0.5">
                      Attn: {clientName}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5 sm:text-right">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Assigned Advisory Team
                  </span>
                  <span className="font-semibold text-zinc-800 text-[11px] block">
                    {order.consultants && order.consultants.length > 0
                      ? order.consultants.map((c: any) => c.name).join(", ")
                      : "MCSC Corporate Advisory"}
                  </span>
                  {order.reviewer?.name && (
                    <span className="text-zinc-500 text-[10px] block">
                      Reviewer: {order.reviewer.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Deliverables & Checklist Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-300">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-sky-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                    Deliverables & Documents Checklist (Documents Provided)
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  {items.length} {items.length === 1 ? "Job Scope" : "Job Scopes"}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-center text-zinc-500 italic">
                  No line items recorded for this order.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {items.map((item: any, idx: number) => {
                    const matchedService = services.find((s) => s.id === item.service_id);
                    const desc = item.description || matchedService?.description;
                    const checklistItems = parseChecklist(desc);

                    return (
                      <div
                        key={item.id || idx}
                        className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3"
                      >
                        {/* Scope Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="h-5 w-5 rounded-full bg-zinc-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-zinc-950 text-sm">
                                {item.job_title}
                              </span>
                              {item.job_id && (
                                <span className="font-mono text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border border-zinc-300 text-zinc-700">
                                  {item.job_id}
                                </span>
                              )}
                              {item.pricing_tier && (
                                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
                                  {item.pricing_tier.toLowerCase().replace("_", " ")}
                                </span>
                              )}
                            </div>
                            {item.branch_name && (
                              <p className="text-[11px] text-amber-800 font-medium pl-7">
                                Memo: {item.branch_name}
                              </p>
                            )}
                          </div>

                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0 border border-emerald-300">
                            Completed & Ready
                          </span>
                        </div>

                        {/* Checklist of Documents */}
                        <div className="pl-7 space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 block">
                            Documents & Deliverables Checklist:
                          </span>

                          {checklistItems.length > 0 ? (
                            <div className="space-y-1.5 bg-white rounded-lg p-3 border border-zinc-200">
                              {checklistItems.map((chk, chkIdx) => (
                                <div
                                  key={chkIdx}
                                  className="flex items-start gap-2 text-xs text-zinc-800 py-0.5 border-b border-zinc-100 last:border-0"
                                >
                                  <div className="h-4 w-4 rounded border border-zinc-400 bg-white flex items-center justify-center shrink-0 mt-0.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  </div>
                                  <span className="leading-snug text-[11px] font-medium text-zinc-900">
                                    {chk}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg bg-white border border-zinc-200 text-[11px] text-zinc-600 italic">
                              Official document set and certificate ready for physical handover.
                            </div>
                          )}

                          {/* Service Instructions / Notes if any */}
                          {item.service_instructions && (
                            <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                              <span className="font-bold text-[10px] uppercase text-amber-800 block">
                                Special Instructions / Handover Notes:
                              </span>
                              <p className="whitespace-pre-line leading-relaxed">
                                {item.service_instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Hard Copy Handover & Receipt Acknowledgment Form */}
            <div className="pt-4 border-t-2 border-zinc-300 space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  Hard Copy Handover & Receipt Acknowledgment
                </h4>
                <p className="text-[10.5px] text-zinc-600 leading-relaxed italic">
                  I hereby confirm that the official hard copies, certificates, permits, and documents
                  listed in the deliverables checklist above have been received in complete, verified,
                  and satisfactory condition.
                </p>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-2 gap-8 pt-2">
                {/* Delivered by */}
                <div className="p-4 rounded-xl border border-zinc-300 bg-zinc-50/50 space-y-8 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 block">
                      Delivered By (MCSC Team / Courier)
                    </span>
                    <span className="text-xs font-bold text-zinc-900 block">
                      PT Mitra Cipta Solusi Bisnis
                    </span>
                  </div>

                  <div className="space-y-1 pt-6 border-t border-dashed border-zinc-400 text-[10.5px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Authorized Signature:</span>
                      <span className="font-mono text-zinc-400">_________________</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Staff Name:</span>
                      <span className="font-semibold text-zinc-800">
                        {order.consultants?.[0]?.name || "MCSC Advisory"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Date:</span>
                      <span className="font-mono text-zinc-800">{formattedDeliveryDate}</span>
                    </div>
                  </div>
                </div>

                {/* Received by */}
                <div className="p-4 rounded-xl border border-zinc-300 bg-zinc-50/50 space-y-8 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 block">
                      Received & Acknowledged By (Client)
                    </span>
                    <span className="text-xs font-bold text-zinc-900 block">
                      {companyName}
                    </span>
                  </div>

                  <div className="space-y-1 pt-6 border-t border-dashed border-zinc-400 text-[10.5px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Authorized Signature:</span>
                      <span className="font-mono text-zinc-400">_________________</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Recipient Name:</span>
                      <span className="font-semibold text-zinc-800">{clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Date Received:</span>
                      <span className="font-mono text-zinc-400">____ / ____ / 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Footer */}
            <div className="pt-3 border-t border-zinc-200 text-center text-[9.5px] text-zinc-500 space-y-0.5">
              <p className="font-medium">
                Please retain this checklist together with your company's original document binder.
              </p>
              <p className="font-mono text-[9px] text-zinc-400">
                PT MITRA CIPTA SOLUSI BISNIS · Order Ref: {orderNumber} · Generated: {formattedDeliveryDate}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
