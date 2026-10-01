"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart, CatalogServiceItem } from "@/contexts/cart-context";
import { TOP_CATALOG_SERVICES, CATALOG_CATEGORIES } from "@/lib/catalog-services";
import {
  Building2,
  FileText,
  Award,
  Calculator,
  Globe,
  Users,
  LayoutGrid,
  Search,
  ShoppingCart,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  PhoneCall,
  HelpCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ServiceCatalogPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const { cart, addToCart, setIsCartOpen, totalItems, totalAmount } = useCart();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Building2":
        return <Building2 className="h-3.5 w-3.5" />;
      case "FileText":
        return <FileText className="h-3.5 w-3.5" />;
      case "Award":
        return <Award className="h-3.5 w-3.5" />;
      case "Calculator":
        return <Calculator className="h-3.5 w-3.5" />;
      case "Globe":
        return <Globe className="h-3.5 w-3.5" />;
      case "Users":
        return <Users className="h-3.5 w-3.5" />;
      default:
        return <LayoutGrid className="h-3.5 w-3.5" />;
    }
  };

  // Filtered Services
  const filteredServices = useMemo(() => {
    return TOP_CATALOG_SERVICES.filter((svc) => {
      const matchesCategory =
        selectedCategory === "all" || svc.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        svc.title.toLowerCase().includes(q) ||
        svc.id.toLowerCase().includes(q) ||
        svc.description.toLowerCase().includes(q) ||
        svc.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const getItemCartQuantity = (serviceId: string) => {
    const item = cart.find((i) => i.service.id === serviceId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-muted/50 via-background to-background py-14 sm:py-20">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-5 text-center">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border-primary/30 inline-flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Official Service Catalog & Base Pricing
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Corporate Legal & Business Licensing Packages
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Browse our most requested Indonesian incorporation, RUPS, OSS-RBA licensing, and KITAS immigration services. Select packages, review exact deliverables, and engage our licensed consultants directly.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative pt-2">
            <Search className="absolute left-3.5 top-5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search service by name or code (e.g. PT PMA, RUPS, KITAS)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 text-xs sm:text-sm bg-background/90 shadow-sm border-border/70 rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full">
          {CATALOG_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50"
                }`}
              >
                {getCategoryIcon(cat.icon)}
                <span>{cat.label}</span>
                {cat.id === "all" ? (
                  <span className="text-[9.5px] sm:text-[10px] opacity-75 font-mono">
                    ({TOP_CATALOG_SERVICES.length})
                  </span>
                ) : (
                  <span className="text-[9.5px] sm:text-[10px] opacity-75 font-mono">
                    ({
                      TOP_CATALOG_SERVICES.filter((s) => s.category === cat.id)
                        .length
                    })
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3">
          <span>
            Showing <strong className="text-foreground">{filteredServices.length}</strong> service packages
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Verified Government Domicile & AHU Compliance Included
          </span>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const cartQty = getItemCartQuantity(service.id);
            const inCart = cartQty > 0;

            return (
              <div
                key={service.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card hover:border-primary/40 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Popular Pill */}
                {service.popular && (
                  <div className="absolute top-0 right-0">
                    <span className="inline-flex items-center gap-1 rounded-bl-xl bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 shadow-sm uppercase tracking-wider">
                      <Sparkles className="h-2.5 w-2.5" /> Popular
                    </span>
                  </div>
                )}

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Service Code & Category */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/60">
                      {service.id}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {service.categoryLabel}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Estimated Timeline */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/40 w-fit">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>Est. Turnaround: <strong className="text-foreground">{service.timeline}</strong></span>
                  </div>

                  {/* Deliverables Checklist */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Package Deliverables:
                    </span>
                    <ul className="space-y-1.5 text-xs">
                      {service.deliverables.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-foreground/90">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-[11.5px] leading-tight">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Pricing & Add to Cart Footer */}
                <div className="p-5 sm:p-6 pt-4 border-t border-border/50 bg-muted/15 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Official Base Rate
                    </span>
                    <span className="text-lg font-extrabold text-foreground font-mono">
                      {service.priceFormatted}
                    </span>
                  </div>

                  <Button
                    onClick={() => addToCart(service)}
                    size="sm"
                    className={`gap-1.5 font-bold text-xs h-9 px-3.5 transition-all cursor-pointer ${
                      inCart
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                    }`}
                  >
                    {inCart ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        In Cart ({cartQty})
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search Results */}
        {filteredServices.length === 0 && (
          <div className="py-16 text-center space-y-3 bg-muted/10 rounded-2xl border border-dashed border-border/80 p-8">
            <HelpCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <h4 className="text-base font-bold text-foreground">No matching services found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              We couldn't find any packages matching &ldquo;{searchQuery}&rdquo;. Try clearing your query or select &ldquo;All Services&rdquo;.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="text-xs mt-2"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Xendit Compliance & Service Guarantee Section */}
        <div className="mt-12 rounded-2xl border border-border/60 bg-gradient-to-r from-muted/30 via-background to-muted/30 p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Official Government Filings</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All incorporations, deeds, and licensing documents are executed by licensed Indonesian Notaries and registered on official AHU & OSS portals.
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Secure Xendit Payment Gateway</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Seamless multi-channel checkout supporting Virtual Accounts (BCA, Mandiri, BNI, BRI), QRIS, and International Credit/Debit Cards.
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <PhoneCall className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Direct Legal Consultant Support</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every order is assigned a designated Corporate Consultant and Reviewer tracking your file to completion. Inquiries: contact@mcsc.co.id.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
            <span>
              PT Mandiri Cipta Solusi (MCS Consulting) • Springhill Office Tower Lantai 9 Unit 9C, Kemayoran, Jakarta Pusat
            </span>
            <div className="flex items-center gap-4">
              <Link href={`/${lang}/privacy-policy`} className="hover:underline">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href={`/${lang}/resources/faq`} className="hover:underline">
                Terms of Engagement
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Bottom Cart Bar (Appears when items are in cart) */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-md p-3.5 sm:p-4 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {totalItems} service{totalItems === 1 ? "" : "s"} in cart
                </span>
                <span className="text-xs font-mono font-extrabold text-primary">
                  {formatIDR(totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="h-9 text-xs font-semibold cursor-pointer"
              >
                View Cart
              </Button>
              <Button
                asChild
                size="sm"
                className="h-9 gap-1.5 font-bold text-xs shadow-sm cursor-pointer"
              >
                <Link href={`/${lang}/services/catalog/checkout`}>
                  Checkout
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
