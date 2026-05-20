"use client"

import { useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { translations } from "@/lib/translations"
import { LanguageSwitcher } from "@/components/language-switcher"
import { usePathname } from "next/navigation"
import { AskLogo } from "@/components/ask-logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false)
  const { language } = useLanguage()
  const t = translations[language]
  const pathname = usePathname()

  const navItems = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.announcement, href: "/announcements" },
    { label: t.nav.contact, href: "/contact" },
  ]

  const servicesItems = [
    { label: t.services.dropdown.establishment, href: "/services/establishment" },
    { label: t.services.dropdown.businessLicense, href: "/services/business-license" },
    { label: t.services.dropdown.companyChanges, href: "/services/company-changes" },
    { label: t.services.dropdown.agreements, href: "/services/agreements" },
    { label: t.services.dropdown.virtualOffice, href: "/services/virtual-office" },
    { label: t.services.dropdown.workPermit, href: "/services/work-permit" },
    { label: t.services.dropdown.intellectualProperty, href: "/services/intellectual-property" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex py-4 items-center justify-between px-4 lg:px-8">
        <Link href="/" className="group flex items-center gap-3 transition-all duration-300">
          <AskLogo className="h-28 w-auto transition-transform duration-300 group-hover:scale-105" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.slice(0, 2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative px-5 py-2 text-[16px] font-semibold tracking-wide transition-colors duration-300 ${pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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
              href="/services"
              className={`group relative flex items-center gap-1 px-5 py-2 text-[16px] font-semibold tracking-wide transition-colors duration-300 ${pathname.startsWith("/services") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.nav.services}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${servicesDropdownOpen ? "rotate-180" : ""}`}
              />
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${pathname.startsWith("/services") ? "w-full" : "w-0 group-hover:w-full"
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
              className={`group relative px-5 py-2 text-[16px] font-semibold tracking-wide transition-colors duration-300 ${pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {item.label}
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${pathname === item.href ? "w-full" : "w-0 group-hover:w-full"
                  }`}
              />
            </Link>
          ))}

          <div className="ml-4 border-l border-border/40 pl-4 flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2 transition-colors hover:bg-muted md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="animate-fade-in border-t border-border/40 bg-background/95 backdrop-blur-md md:hidden">
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
                className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors ${pathname.startsWith("/services")
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

            <div className="mt-6 border-t border-border/40 pt-6 flex items-center justify-around gap-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
