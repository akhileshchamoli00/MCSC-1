"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  CreditCard,
  Building,
  QrCode,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  Receipt,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export default function CatalogCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal, taxAmount, totalAmount } = useCart();

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    city: "Jakarta",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"va" | "qris" | "card" | "manual">("va");
  const [selectedBank, setSelectedBank] = useState("bca");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedRefund, setAgreedRefund] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Your cart is empty. Please select at least one service.");
      return;
    }

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error("Please fill in all required customer details.");
      return;
    }

    if (!agreedTerms || !agreedRefund) {
      toast.error("Please review and agree to the Terms of Service & Service Delivery Policy.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate clean order reference code
      const orderRef = `MCS-ORD-${Date.now().toString().slice(-6)}`;
      const orderDate = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      // Prepare order summary object
      const orderPayload = {
        orderNumber: orderRef,
        orderDate,
        customer: { ...formData },
        items: cart.map((item) => ({
          id: item.service.id,
          title: item.service.title,
          category: item.service.categoryLabel,
          unitPrice: item.service.basePrice,
          quantity: item.quantity,
          totalPrice: item.service.basePrice * item.quantity,
        })),
        subtotal,
        taxAmount,
        totalAmount,
        paymentMethod,
        selectedBank: paymentMethod === "va" ? selectedBank.toUpperCase() : null,
        status: "PENDING_PAYMENT",
      };

      // Simulate Xendit Invoice generation / API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setCompletedOrder(orderPayload);
      clearCart();
      toast.success("Order created successfully! Proceed with payment instructions.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast.error("Failed to generate checkout invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS / PAYMENT INVOICE STATE
  if (completedOrder) {
    return (
      <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8 text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Order Confirmed & Invoice Issued
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Thank you, <strong className="text-foreground">{completedOrder.customer.fullName}</strong>. Your engagement invoice has been generated via Xendit Payment Gateway.
            </p>
            <div className="inline-block bg-background px-3 py-1.5 rounded-lg border border-border/80 font-mono text-xs font-bold text-primary">
              Order #{completedOrder.orderNumber}
            </div>
          </div>

          {/* Payment Instructions Box */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/40 pb-3">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment Information (Xendit Gateway)
            </h3>

            {completedOrder.paymentMethod === "va" && (
              <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-xs text-muted-foreground block font-medium">
                  Virtual Account Bank: <strong className="text-foreground uppercase">{completedOrder.selectedBank}</strong>
                </span>
                <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-border font-mono">
                  <span className="text-xs text-muted-foreground">VA Number:</span>
                  <span className="text-sm sm:text-base font-bold text-primary tracking-wider">
                    8808 9200 4819 0281
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Transfer exact amount to the virtual account above via mobile banking, ATM, or internet banking. Payment status verifies automatically within seconds.
                </p>
              </div>
            )}

            {completedOrder.paymentMethod === "qris" && (
              <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/60 text-center">
                <span className="text-xs font-bold text-foreground block">
                  Scan QRIS with any e-Wallet or Mobile Banking
                </span>
                <div className="h-44 w-44 mx-auto bg-white rounded-xl p-2 border border-border/80 flex items-center justify-center shadow-inner">
                  {/* QRIS Placeholder illustration */}
                  <div className="text-center space-y-1">
                    <QrCode className="h-28 w-28 text-black mx-auto" />
                    <span className="text-[9px] font-mono text-zinc-600 block uppercase">NMID: ID1020038910</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Compatible with BCA Mobile, GoPay, OVO, Dana, ShopeePay, and LinkAja.
                </p>
              </div>
            )}

            {completedOrder.paymentMethod === "card" && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                <span className="text-xs font-bold text-foreground block">
                  Credit / Debit Card Payment Verified
                </span>
                <p className="text-xs text-muted-foreground">
                  Your 3D-Secure transaction has been initiated. An electronic payment receipt has been sent to <strong>{completedOrder.customer.email}</strong>.
                </p>
              </div>
            )}

            {completedOrder.paymentMethod === "manual" && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2 text-xs">
                <span className="font-bold text-foreground block">
                  Official Corporate Bank Account:
                </span>
                <div className="font-mono space-y-1 bg-background p-2.5 rounded border text-[11.5px]">
                  <div>Bank: <strong>Bank Central Asia (BCA)</strong></div>
                  <div>Account Name: <strong>PT MANDIRI CIPTA SOLUSI</strong></div>
                  <div>Account Number: <strong>527-189-9801</strong></div>
                </div>
              </div>
            )}

            {/* Itemized Breakdown */}
            <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
              <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block">
                Engaged Packages ({completedOrder.items.length})
              </span>
              {completedOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-1">
                  <span>{item.title} <span className="text-muted-foreground">x{item.quantity}</span></span>
                  <span className="font-mono font-medium">{formatIDR(item.totalPrice)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-border/40 flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">{formatIDR(completedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>PPN / VAT (11%)</span>
                <span className="font-mono">{formatIDR(completedOrder.taxAmount)}</span>
              </div>
              <div className="pt-1.5 border-t border-border/50 flex justify-between font-bold text-sm text-foreground">
                <span>Total Amount Due</span>
                <span className="font-mono text-primary text-base">{formatIDR(completedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              asChild
              className="w-full text-xs h-10 gap-1.5"
            >
              <Link href={`/${lang}/services/catalog`}>
                <ArrowLeft className="h-3.5 w-3.5" /> Return to Catalog
              </Link>
            </Button>
            <Button
              asChild
              className="w-full text-xs h-10 gap-1.5 font-bold"
            >
              <Link href={`/${lang}/track-order`}>
                Track Order Status
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART GUARD
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground py-20 px-4 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground/50">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Please select services from our catalog to proceed with your corporate engagement and checkout.
        </p>
        <Button asChild className="text-xs">
          <Link href={`/${lang}/services/catalog`}>Explore Service Catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-10 sm:py-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb & Title */}
        <div className="space-y-2">
          <Link
            href={`/${lang}/services/catalog`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Service Catalog
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Checkout & Service Engagement
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Complete client identification and confirm payment preferences via Xendit Payment Gateway.
          </p>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Customer Information & Payment Methods (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer Identification */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Client & Entity Identification
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-foreground">
                    Contact Person Full Name *
                  </label>
                  <Input
                    required
                    name="fullName"
                    placeholder="e.g. Alexander Wright"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Email Address (For Invoices & Deliverables) *
                  </label>
                  <Input
                    required
                    type="email"
                    name="email"
                    placeholder="alexander@company.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    WhatsApp / Phone Number *
                  </label>
                  <Input
                    required
                    name="phone"
                    placeholder="+62 812 3456 789"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Company / Entity Name (If Applicable)
                  </label>
                  <Input
                    name="companyName"
                    placeholder="e.g. PT Mandiri Nusantara Solusi"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Target City / Domicile
                  </label>
                  <Input
                    name="city"
                    placeholder="e.g. Jakarta Pusat / Bali"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-foreground">
                    Special Service Instructions / Notes
                  </label>
                  <Textarea
                    name="notes"
                    rows={2}
                    placeholder="Provide desired company names, business activity goals, or fast-track timeline requirements..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="text-xs resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method (Xendit Gateway) */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Select Payment Method
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Lock className="h-3 w-3 text-emerald-600" /> Powered by Xendit
                  </span>
                </div>
              </div>

              {/* Payment Type Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Virtual Account */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "va"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="va"
                    checked={paymentMethod === "va"}
                    onChange={() => setPaymentMethod("va")}
                    className="mt-0.5 text-primary"
                  />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-primary" /> Virtual Account (VA)
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      BCA, Mandiri, BNI, BRI, Permata. Automatic verification.
                    </p>
                  </div>
                </label>

                {/* QRIS */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "qris"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="qris"
                    checked={paymentMethod === "qris"}
                    onChange={() => setPaymentMethod("qris")}
                    className="mt-0.5 text-primary"
                  />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-primary" /> QRIS Instant Pay
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Scan via GoPay, OVO, Dana, ShopeePay, or Mobile Banking.
                    </p>
                  </div>
                </label>

                {/* Credit Card */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="mt-0.5 text-primary"
                  />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-primary" /> Credit / Debit Card
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Visa, Mastercard, JCB with 3D Secure verification.
                    </p>
                  </div>
                </label>

                {/* Corporate Bank Transfer */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "manual"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border/70 hover:bg-muted/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="manual"
                    checked={paymentMethod === "manual"}
                    onChange={() => setPaymentMethod("manual")}
                    className="mt-0.5 text-primary"
                  />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-primary" /> Corporate Invoice
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Official proforma invoice for corporate wire transfer.
                    </p>
                  </div>
                </label>
              </div>

              {/* Sub-options for VA */}
              {paymentMethod === "va" && (
                <div className="p-3 bg-muted/20 rounded-xl border border-border/50 space-y-2">
                  <span className="text-[11px] font-bold text-foreground block">
                    Select Virtual Account Destination Bank:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["bca", "mandiri", "bni", "bri"].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold uppercase transition-all ${
                          selectedBank === bank
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border/70 hover:border-foreground/40 text-foreground"
                        }`}
                      >
                        {bank.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Terms & Cancellation Consent (Mandatory for Xendit KYC) */}
            <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 space-y-3 text-xs">
              <span className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
                Legal & Service Policies Agreement
              </span>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-muted-foreground leading-relaxed">
                  I have read and agree to the{" "}
                  <Link href={`/${lang}/resources/faq`} target="_blank" className="text-primary underline font-medium">
                    Terms of Engagement & Service Policy
                  </Link>{" "}
                  and{" "}
                  <Link href={`/${lang}/privacy-policy`} target="_blank" className="text-primary underline font-medium">
                    Privacy Policy
                  </Link>.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedRefund}
                  onChange={(e) => setAgreedRefund(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-muted-foreground leading-relaxed">
                  I understand that government filing fees (PNBP, AHU, OSS) and notary administrative disbursements are non-refundable once registered with the state portal.
                </span>
              </label>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Review & Total Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 space-y-4 shadow-sm sticky top-24">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/40 pb-3">
                <span>Order Summary</span>
                <span className="text-xs font-mono font-normal text-muted-foreground">
                  {cart.length} item{cart.length === 1 ? "" : "s"}
                </span>
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {cart.map((item) => (
                  <div
                    key={item.service.id}
                    className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-primary uppercase">
                          {item.service.id}
                        </span>
                        <h5 className="font-bold text-foreground leading-tight">
                          {item.service.title}
                        </h5>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeFromCart(item.service.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/30">
                      <div className="flex items-center gap-1 bg-background rounded p-0.5 border border-border/50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.service.id, item.quantity - 1)}
                          className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="px-1 font-mono font-bold text-[11px]">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                          className="px-1.5 py-0.5 text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-foreground">
                        {formatIDR(item.service.basePrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="space-y-2 pt-3 border-t border-border/40 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>PPN / VAT (11%)</span>
                  <span className="font-mono">{formatIDR(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-foreground pt-2 border-t border-border/50">
                  <span>Total Payable</span>
                  <span className="font-mono text-primary text-lg">{formatIDR(totalAmount)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 text-xs sm:text-sm font-bold gap-2 shadow-md cursor-pointer"
              >
                {isSubmitting ? (
                  <>Generating Xendit Invoice...</>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Place Order & Pay via Xendit
                  </>
                )}
              </Button>

              <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground text-center">
                <p className="flex items-center justify-center gap-1 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Official Notary & Indonesian Legal Entity Guarantee
                </p>
                <p className="text-[10px]">
                  PT Mandiri Cipta Solusi • Springhill Office Tower Lantai 9 Unit 9C
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
