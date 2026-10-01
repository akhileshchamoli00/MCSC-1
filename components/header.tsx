"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { translations } from "@/lib/translations";
import { LanguageSwitcher } from "@/components/language-switcher";
import { usePathname } from "next/navigation";
import { AskLogo } from "@/components/ask-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCart } from "@/contexts/cart-context";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [ipDropdownOpen, setIpDropdownOpen] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  const navItems = [
    { label: t.nav.home, href: `/${language}` },
    { label: t.nav.about, href: `/${language}/about` },
    { label: t.nav.announcement, href: `/${language}/announcements` },
    { label: t.nav.contact, href: `/${language}/contact` },
  ];

  const servicesItems = [
    {
      label: t.services.dropdown.catalog || "Service Catalog & Pricing",
      href: `/${language}/services/catalog`,
      isCatalog: true,
    },
    {
      label: t.services.dropdown.establishment,
      href: `/${language}/services/establishment`,
    },
    {
      label: t.services.dropdown.businessLicense,
      href: `/${language}/services/business-license`,
    },
    {
      label: t.services.dropdown.companyChanges,
      href: `/${language}/services/company-changes`,
    },
    { label: t.services.dropdown.agreements, href: `/${language}/services/agreements` },
    {
      label: t.services.dropdown.virtualOffice,
      href: `/${language}/services/virtual-office`,
    },
    { label: t.services.dropdown.workPermit, href: `/${language}/services/work-permit` },
    {
      label: t.services.dropdown.intellectualProperty,
      href: `/${language}/services/intellectual-property`,
    },
  ];

  const ipItems = [
    {
      label: t.nav.brandClassification,
      href: `/${language}/resources/brand-classification`,
    },
    {
      label: t.nav.checkApplicationStatus,
      href: `/${language}/resources/check-application-status`,
    },
    {
      label: t.nav.trackOrder,
      href: `/${language}/track-order`,
    },
    {
      label: t.nav.kbliDirectory,
      href: `/${language}/resources/kbli`,
    },
    {
      label: "FAQ",
      href: `/${language}/resources/faq`,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1600px] mx-auto flex py-2.5 sm:py-3.5 items-center justify-between px-3 sm:px-4 lg:px-6 2xl:px-8">
        <Link
          href={`/${language}`}
          className="group flex items-center gap-2 2xl:gap-3 transition-all duration-300 shrink-0"
        >
          <AskLogo className="h-9 sm:h-10 xl:h-11 2xl:h-13 w-auto transition-transform duration-300 group-hover:scale-105" />
        </Link>

        {/* Desktop Navigation (Visible on Large Desktops & Widescreens >= 1280px) */}
        <nav className="hidden items-center gap-0.5 2xl:gap-1.5 xl:flex shrink-0">
          {navItems.slice(0, 2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative px-1.5 xl:px-2.5 2xl:px-3.5 py-1.5 2xl:py-2 text-[12px] xl:text-[12.5px] 2xl:text-[14px] font-semibold tracking-wide transition-colors duration-300 whitespace-nowrap ${pathname === item.href
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {item.label}
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${pathname === item.href ? "w-full" : "w-0 group-hover:w-full"
                  }`}
              />
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setServicesDropdownOpen(true)}
            onMouseLeave={() => setServicesDropdownOpen(false)}
          >
            <Link
              href={`/${language}/services`}
              className={`group relative flex items-center gap-1 px-1.5 xl:px-2.5 2xl:px-3.5 py-1.5 2xl:py-2 text-[12px] xl:text-[12.5px] 2xl:text-[14px] font-semibold tracking-wide transition-colors duration-300 whitespace-nowrap ${pathname.startsWith(`/${language}/services`)
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.nav.services}
              <ChevronDown
                className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 transition-transform duration-300 ${servicesDropdownOpen ? "rotate-180" : ""}`}
              />
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${pathname.startsWith(`/${language}/services`)
                  ? "w-full"
                  : "w-0 group-hover:w-full"
                  }`}
              />
            </Link>

            {/* Dropdown menu */}
            {servicesDropdownOpen && (
              <div className="absolute left-0 top-full w-72 pt-2 animate-fade-in">
                <div className="rounded-lg border border-border/40 bg-background/95 shadow-lg backdrop-blur-md overflow-hidden">
                  <div className="py-2">
                    {servicesItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-200 ${item.isCatalog
                          ? "bg-primary/5 font-semibold text-primary hover:bg-primary/10 border-b border-border/40 mb-1"
                          : pathname === item.href
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                      >
                        <span>{item.label}</span>
                        {item.isCatalog && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                            Catalog
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setIpDropdownOpen(true)}
            onMouseLeave={() => setIpDropdownOpen(false)}
          >
            <Link
              href={`/${language}/resources`}
              className={`group relative flex items-center gap-1 px-1.5 xl:px-2.5 2xl:px-3.5 py-1.5 2xl:py-2 text-[12px] xl:text-[12.5px] 2xl:text-[14px] font-semibold tracking-wide transition-colors duration-300 whitespace-nowrap ${pathname.startsWith(`/${language}/resources`)
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.nav.intellectualProperty}
              <ChevronDown
                className={`h-3.5 w-3.5 2xl:h-4 2xl:w-4 transition-transform duration-300 ${ipDropdownOpen ? "rotate-180" : ""}`}
              />
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${pathname.startsWith(`/${language}/resources`)
                  ? "w-full"
                  : "w-0 group-hover:w-full"
                  }`}
              />
            </Link>

            {/* Dropdown menu */}
            {ipDropdownOpen && (
              <div className="absolute left-0 top-full w-72 pt-2 animate-fade-in">
                <div className="rounded-lg border border-border/40 bg-background/95 shadow-lg backdrop-blur-md overflow-hidden">
                  <div className="py-2">
                    {ipItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block px-4 py-2.5 text-sm transition-colors duration-200 ${pathname === item.href
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {navItems.slice(2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative px-1.5 xl:px-2.5 2xl:px-3.5 py-1.5 2xl:py-2 text-[12px] xl:text-[12.5px] 2xl:text-[14px] font-semibold tracking-wide transition-colors duration-300 whitespace-nowrap ${pathname === item.href
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {item.label}
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${pathname === item.href ? "w-full" : "w-0 group-hover:w-full"
                  }`}
              />
            </Link>
          ))}

          <div className="ml-2 xl:ml-2.5 2xl:ml-4 border-l border-border/40 pl-2 xl:pl-2.5 2xl:pl-4 flex items-center gap-1.5 xl:gap-2 2xl:gap-3 shrink-0">
            {/* Cart Trigger */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
              aria-label="View Shopping Cart"
              title="Shopping Cart"
            >
              <ShoppingCart className="h-4.5 w-4.5 2xl:h-5 2xl:w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs animate-scale-in">
                  {totalItems}
                </span>
              )}
            </button>

            <LanguageSwitcher />
            <ThemeToggle variant="segmented" showLabel={true} />
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <span className="text-[8px] 2xl:text-[8.5px] font-mono font-semibold tracking-wider text-muted-foreground uppercase opacity-75 select-none">
                Portal
              </span>
              <Link
                href="/login"
                className="rounded-full bg-primary px-3 2xl:px-3.5 py-0.5 2xl:py-1 text-[10.5px] 2xl:text-[11px] font-bold text-primary-foreground transition-all duration-200 hover:bg-foreground hover:text-background dark:hover:bg-white dark:hover:text-black shadow-xs hover:scale-105 uppercase tracking-wide flex items-center justify-center h-[24px] 2xl:h-[26px] whitespace-nowrap"
              >
                Login
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile / Tablet Cart & Menu Buttons (Visible on screens < 1280px) */}
        <div className="flex items-center gap-1 xl:hidden">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="View Shopping Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs">
                {totalItems}
              </span>
            )}
          </button>
          <button
            className="rounded-lg p-2 transition-colors hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="animate-fade-in border-t border-border/40 bg-background/95 backdrop-blur-md xl:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-6">
            {navItems.slice(0, 2).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${pathname === item.href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="flex flex-col">
              <button
                onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${pathname.startsWith(`/${language}/services`)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
              >
                {t.nav.services}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${servicesDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {servicesDropdownOpen && (
                <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-border/40 pl-4">
                  {servicesItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors ${item.isCatalog
                        ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15"
                        : pathname === item.href
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{item.label}</span>
                      {item.isCatalog && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                          Catalog
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <button
                onClick={() => setIpDropdownOpen(!ipDropdownOpen)}
                className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${pathname.startsWith(`/${language}/resources`)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
              >
                {t.nav.intellectualProperty}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${ipDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {ipDropdownOpen && (
                <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-border/40 pl-4">
                  {ipItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-lg px-4 py-2.5 text-sm transition-colors ${pathname === item.href
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navItems.slice(2).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${pathname === item.href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-6 border-t border-border/40 pt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsCartOpen(true);
                }}
                className="w-full flex items-center justify-between rounded-lg border border-border/80 bg-background/80 px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted text-foreground"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  View Shopping Cart
                </span>
                {totalItems > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                    {totalItems}
                  </span>
                )}
              </button>

              <Link
                href="/login"
                className="w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-foreground hover:text-background dark:hover:bg-white dark:hover:text-black"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <div className="flex items-center justify-around gap-4 pt-1">
                <LanguageSwitcher />
                <ThemeToggle variant="segmented" showLabel={true} />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
