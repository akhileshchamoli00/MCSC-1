"use client";

import { Facebook, Instagram, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";
import { translations } from "@/lib/translations";
import { AskLogo } from "@/components/ask-logo";

const renderDisclaimerText = (text: string) => {
  const parts = text.split("**");
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-muted-foreground/80">
        {part}
      </strong>
    ) : (
      part
    )
  );
};

export function Footer() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="border-t border-border/20 bg-background/30 backdrop-blur-md pt-6 pb-4 relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <AskLogo className="h-16 w-auto" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground lg:pr-8">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.nav.intellectualProperty}
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.nav.services}
                </Link>
              </li>
              <li>
                <Link
                  href="/announcements"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.nav.announcement}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">
              {t.footer.servicesTitle}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/services/establishment"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.services.dropdown.establishment}
                </Link>
              </li>
              <li>
                <Link
                  href="/services/business-license"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.services.dropdown.businessLicense}
                </Link>
              </li>
              <li>
                <Link
                  href="/services/company-changes"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.services.dropdown.companyChanges}
                </Link>
              </li>
              <li>
                <Link
                  href="/services/agreements"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.services.dropdown.agreements}
                </Link>
              </li>
              <li>
                <Link
                  href="/services/virtual-office"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.services.dropdown.virtualOffice}
                </Link>
              </li>
              <li>
                <Link
                  href="/services/work-permit"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.services.dropdown.workPermit}
                </Link>
              </li>
              <li>
                <Link
                  href="/services/intellectual-property"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.services.dropdown.intellectualProperty}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">
              {t.nav.intellectualProperty}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/resources/brand-classification"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.nav.brandClassification}
                </Link>
              </li>
              <li>
                <Link
                  href="/resources/check-application-status"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.nav.checkApplicationStatus}
                </Link>
              </li>
              <li>
                <Link
                  href="/resources/kbli"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.nav.kbliDirectory}
                </Link>
              </li>
              <li>
                <Link
                  href="/resources/faq"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">
              {t.footer.connect}
            </h3>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/mcsc.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/6285718189799"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:scale-110"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">
            © {new Date().getFullYear()} MCS Consulting. {t.footer.rights}
          </p>
          {t.footer.disclaimer && (
            <p className="mt-2 border-t border-border/10 pt-2 text-[11px] leading-relaxed text-muted-foreground/50 max-w-5xl mx-auto text-justify md:text-center">
              {renderDisclaimerText(t.footer.disclaimer)}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
