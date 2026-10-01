"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { CART_DRAWER_TRANSLATIONS } from "@/lib/catalog-services";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Lock,
  X,
} from "lucide-react";

export function CartDrawer() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    taxAmount,
    totalAmount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();
  const { language } = useLanguage();
  const activeLang = (language === "id" || language === "cn" ? language : "en") as "en" | "id" | "cn";
  const t = CART_DRAWER_TRANSLATIONS[activeLang] || CART_DRAWER_TRANSLATIONS.en;

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Lock body scroll when drawer is open and listen for Escape key
  useEffect(() => {
    if (!isCartOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCartOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className="relative z-10 w-full sm:max-w-md h-full flex flex-col bg-background border-l border-border/60 shadow-2xl animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart Drawer"
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-border/40 bg-muted/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{t.cartTitle}</h3>
              <p className="text-xs text-muted-foreground">
                {totalItems} {t.itemsSelected}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
              >
                {t.clearAll}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(false)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              aria-label="Close cart"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 [scrollbar-width:thin]">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-muted/40 mx-auto flex items-center justify-center text-muted-foreground/60">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <h4 className="font-bold text-foreground text-sm">{t.emptyTitle}</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {t.emptyDesc}
              </p>
              <Button
                size="sm"
                onClick={() => setIsCartOpen(false)}
                asChild
                className="mt-2 text-xs"
              >
                <Link href={`/${language}/services/catalog`}>{t.browseCatalog}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => {
                const localizedTitle =
                  item.service.translations?.[activeLang]?.title || item.service.title;
                const localizedCategory =
                  item.service.translations?.[activeLang]?.categoryLabel || item.service.categoryLabel;

                return (
                  <div
                    key={item.service.id}
                    className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2.5 shadow-2xs hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                          {item.service.id} • {localizedCategory}
                        </span>
                        <h5 className="text-xs font-bold text-foreground leading-snug pt-1">
                          {localizedTitle}
                        </h5>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeFromCart(item.service.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 border border-border/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            updateQuantity(item.service.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-2 font-mono font-bold text-xs">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            updateQuantity(item.service.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-foreground">
                          {formatIDR(item.service.basePrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer & Checkout */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-border/50 bg-muted/10 space-y-3.5 shrink-0">
            <div className="w-full space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{t.subtotal}</span>
                <span className="font-mono">{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  {t.taxLabel}
                  <span className="text-[10px] bg-muted px-1 rounded font-mono">Tax</span>
                </span>
                <span className="font-mono">{formatIDR(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-1.5 border-t border-border/40">
                <span>{t.totalAmount}</span>
                <span className="font-mono text-primary text-base">
                  {formatIDR(totalAmount)}
                </span>
              </div>
            </div>

            <div className="w-full space-y-2 pt-1">
              <Button
                asChild
                className="w-full gap-2 font-bold text-xs h-10 shadow-sm"
                onClick={() => setIsCartOpen(false)}
              >
                <Link href={`/${language}/services/catalog/checkout`}>
                  {t.proceedToCheckout}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>

              <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> {t.officialGuarantee}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-muted-foreground" /> {t.secureCheckout}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
