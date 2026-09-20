"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Phone, AlertCircle, Search, ChevronDown, Check } from "lucide-react";

export interface CountryDialCode {
  code: string;       // e.g. "+62"
  country: string;    // e.g. "Indonesia"
  flag: string;       // e.g. "🇮🇩"
  iso: string;        // e.g. "ID"
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { code: "+62", country: "Indonesia", flag: "🇮🇩", iso: "ID" },
  { code: "+65", country: "Singapore", flag: "🇸🇬", iso: "SG" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾", iso: "MY" },
  { code: "+61", country: "Australia", flag: "🇦🇺", iso: "AU" },
  { code: "+1", country: "United States", flag: "🇺🇸", iso: "US" },
  { code: "+1", country: "Canada", flag: "🇨🇦", iso: "CA" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧", iso: "GB" },
  { code: "+86", country: "China", flag: "🇨🇳", iso: "CN" },
  { code: "+81", country: "Japan", flag: "🇯🇵", iso: "JP" },
  { code: "+82", country: "South Korea", flag: "🇰🇷", iso: "KR" },
  { code: "+91", country: "India", flag: "🇮🇳", iso: "IN" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪", iso: "AE" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", iso: "SA" },
  { code: "+852", country: "Hong Kong", flag: "🇭🇰", iso: "HK" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼", iso: "TW" },
  { code: "+66", country: "Thailand", flag: "🇹🇭", iso: "TH" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳", iso: "VN" },
  { code: "+63", country: "Philippines", flag: "🇵🇭", iso: "PH" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿", iso: "NZ" },
  { code: "+49", country: "Germany", flag: "🇩🇪", iso: "DE" },
  { code: "+33", country: "France", flag: "🇫🇷", iso: "FR" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱", iso: "NL" },
  { code: "+39", country: "Italy", flag: "🇮🇹", iso: "IT" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭", iso: "CH" },
  { code: "+34", country: "Spain", flag: "🇪🇸", iso: "ES" },
  { code: "+46", country: "Sweden", flag: "🇸🇪", iso: "SE" },
  { code: "+47", country: "Norway", flag: "🇳🇴", iso: "NO" },
  { code: "+45", country: "Denmark", flag: "🇩🇰", iso: "DK" },
  { code: "+358", country: "Finland", flag: "🇫🇮", iso: "FI" },
  { code: "+353", country: "Ireland", flag: "🇮🇪", iso: "IE" },
  { code: "+43", country: "Austria", flag: "🇦🇹", iso: "AT" },
  { code: "+32", country: "Belgium", flag: "🇧🇪", iso: "BE" },
  { code: "+351", country: "Portugal", flag: "🇵🇹", iso: "PT" },
  { code: "+48", country: "Poland", flag: "🇵🇱", iso: "PL" },
  { code: "+7", country: "Russia", flag: "🇷🇺", iso: "RU" },
  { code: "+7", country: "Kazakhstan", flag: "🇰🇿", iso: "KZ" },
  { code: "+55", country: "Brazil", flag: "🇧🇷", iso: "BR" },
  { code: "+52", country: "Mexico", flag: "🇲🇽", iso: "MX" },
  { code: "+27", country: "South Africa", flag: "🇿🇦", iso: "ZA" },
  { code: "+20", country: "Egypt", flag: "🇪🇬", iso: "EG" },
  { code: "+90", country: "Turkey", flag: "🇹🇷", iso: "TR" },
  { code: "+974", country: "Qatar", flag: "🇶🇦", iso: "QA" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼", iso: "KW" },
  { code: "+968", country: "Oman", flag: "🇴🇲", iso: "OM" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭", iso: "BH" }
];

// Format local number with standard hyphen separation as typed.
export function formatLocalPhoneNumber(rawNumber: string): string {
  if (!rawNumber) return "";
  let clean = rawNumber.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = clean.slice(1);
  }
  if (!clean) return "";

  if (clean.length <= 3) {
    return clean;
  }
  if (clean.length <= 7) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  if (clean.length <= 11) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
  }
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}-${clean.slice(11)}`;
}

export { formatPhoneNumber } from "@/lib/utils";

// Helper to parse a full international phone string into { countryCode, localNumber, iso }
export function parsePhoneNumber(raw: string = "", defaultCountryCode = "+62"): { countryCode: string; localNumber: string; iso: string } {
  if (!raw) {
    const defaultCountry = COUNTRY_DIAL_CODES.find(c => c.code === defaultCountryCode) || COUNTRY_DIAL_CODES[0];
    return { countryCode: defaultCountry.code, localNumber: "", iso: defaultCountry.iso };
  }

  const trimmed = raw.trim();

  // If starts with +, try matching against known dial codes (sorted longest code first)
  if (trimmed.startsWith("+")) {
    const sortedCodes = [...COUNTRY_DIAL_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const item of sortedCodes) {
      if (trimmed.startsWith(item.code)) {
        let remainder = trimmed.slice(item.code.length).trim();
        return {
          countryCode: item.code,
          localNumber: formatLocalPhoneNumber(remainder),
          iso: item.iso
        };
      }
    }
    // Fallback: match any +XXX
    const match = trimmed.match(/^(\+\d{1,4})(.*)$/);
    if (match) {
      let remainder = match[2].trim();
      const found = COUNTRY_DIAL_CODES.find(c => c.code === match[1]);
      return {
        countryCode: match[1],
        localNumber: formatLocalPhoneNumber(remainder),
        iso: found ? found.iso : "INT"
      };
    }
  }

  // If starts with 0 (e.g. 0812...), strip leading 0 and use default country code
  if (trimmed.startsWith("0")) {
    const defaultCountry = COUNTRY_DIAL_CODES.find(c => c.code === defaultCountryCode) || COUNTRY_DIAL_CODES[0];
    return {
      countryCode: defaultCountry.code,
      localNumber: formatLocalPhoneNumber(trimmed),
      iso: defaultCountry.iso
    };
  }

  const defaultCountry = COUNTRY_DIAL_CODES.find(c => c.code === defaultCountryCode) || COUNTRY_DIAL_CODES[0];
  return {
    countryCode: defaultCountry.code,
    localNumber: formatLocalPhoneNumber(trimmed),
    iso: defaultCountry.iso
  };
}

// Validate phone number format (must have 6 to 15 digits)
export function isValidPhoneNumber(fullPhone: string): boolean {
  if (!fullPhone) return false;
  const digits = fullPhone.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 16;
}

// Validate standard email format (RFC 5322 compatible)
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

export interface PhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (fullNumber: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string | null;
}

export function PhoneInput({
  id = "phone-input",
  value,
  onChange,
  placeholder = "812-3456-7890",
  required = false,
  disabled = false,
  className = "",
  error
}: PhoneInputProps) {
  const parsed = useMemo(() => parsePhoneNumber(value), [value]);
  const [countryCode, setCountryCode] = useState(parsed.countryCode);
  const [localNumber, setLocalNumber] = useState(parsed.localNumber);
  const [selectedIso, setSelectedIso] = useState(parsed.iso);
  const [touched, setTouched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when external value changes
  useEffect(() => {
    const { countryCode: c, localNumber: l, iso: i } = parsePhoneNumber(value);
    setCountryCode(c);
    setLocalNumber(l);
    setSelectedIso(i);
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelectCountry = (country: CountryDialCode) => {
    setCountryCode(country.code);
    setSelectedIso(country.iso);
    setIsOpen(false);
    setSearchQuery("");
    const combined = localNumber.trim() ? `${country.code} ${localNumber.trim()}` : "";
    onChange(combined);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    const oldDigits = localNumber.replace(/\D/g, "");
    let newDigits = raw.replace(/\D/g, "");

    // Automatically strip leading 0 if user enters domestic format like 0812...
    if (newDigits.startsWith("0")) {
      newDigits = newDigits.slice(1);
    }

    // If user hit backspace on a hyphen in the middle, drop the digit before it
    if (raw.length < localNumber.length && oldDigits === newDigits && newDigits.length > 0) {
      newDigits = newDigits.slice(0, -1);
    }

    const formatted = formatLocalPhoneNumber(newDigits);
    setLocalNumber(formatted);
    setTouched(true);

    const combined = formatted ? `${countryCode} ${formatted}` : "";
    onChange(combined);
  };

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRY_DIAL_CODES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRY_DIAL_CODES.filter(
      item => 
        item.country.toLowerCase().includes(q) || 
        item.code.includes(q) || 
        item.iso.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const digitsOnly = localNumber.replace(/\D/g, "");
  const isInvalid = touched && (
    (required && !digitsOnly) || 
    (digitsOnly.length > 0 && (digitsOnly.length < 6 || digitsOnly.length > 15))
  );

  const activeCountry = COUNTRY_DIAL_CODES.find(c => c.code === countryCode && c.iso === selectedIso) ||
    COUNTRY_DIAL_CODES.find(c => c.code === countryCode) ||
    COUNTRY_DIAL_CODES[0];

  return (
    <div className="w-full relative" ref={containerRef}>
      <div className={`flex items-center rounded-xl border transition-all overflow-hidden ${
        disabled ? "bg-muted/50 opacity-90 cursor-not-allowed" : "bg-background"
      } ${
        error || isInvalid 
          ? "border-destructive ring-1 ring-destructive/30" 
          : "border-border/60 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
      } ${className}`}>
        
        {/* Compact Country Code Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => {
            // Prevent active input from blurring and triggering premature validation layout shifts
            e.preventDefault();
          }}
          onClick={() => {
            if (disabled) return;
            setIsOpen((prev) => !prev);
            setSearchQuery("");
          }}
          className={`h-full min-h-[36px] px-2.5 sm:px-3 flex items-center gap-1.5 bg-zinc-100/70 hover:bg-zinc-200/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-r border-border/60 rounded-l-xl transition-colors shrink-0 focus:outline-none select-none ${
            disabled ? "opacity-70 cursor-not-allowed" : ""
          }`}
          title={disabled ? "Locked" : "Select Country Dial Code"}
        >
          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-xs">
            {activeCountry.iso}
          </span>
          <span className="font-mono text-xs font-bold tracking-tight text-foreground">
            {activeCountry.code}
          </span>
          {!disabled && (
            <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
          )}
        </button>

        {/* Local Number Input */}
        <div className="relative flex-1 h-full min-h-[36px]">
          <Input
            id={id}
            type="tel"
            disabled={disabled}
            value={localNumber}
            onChange={handleNumberChange}
            onBlur={() => setTouched(true)}
            placeholder={placeholder}
            className={`h-full min-h-[36px] border-0 bg-transparent rounded-r-xl rounded-l-none focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 text-sm font-medium placeholder:text-muted-foreground/40 font-mono text-foreground ${
              disabled ? "opacity-80 cursor-not-allowed select-none" : ""
            }`}
          />
        </div>
      </div>

      {/* COMPACT FLOATING SEARCHABLE POPOVER */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-72 sm:w-80 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search Header */}
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search className="h-3.5 w-3.5 absolute left-2.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or dial code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
              />
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-transparent">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground font-medium">
                No matching country found
              </div>
            ) : (
              filteredCountries.map((item) => {
                const isSelected = item.code === countryCode && item.iso === selectedIso;
                return (
                  <button
                    key={`${item.iso}-${item.code}`}
                    type="button"
                    onClick={() => handleSelectCountry(item)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer group ${
                      isSelected
                        ? "bg-primary/10 dark:bg-primary/20 text-primary font-bold"
                        : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-mono text-[10px] font-bold w-6 text-center shrink-0 px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {item.iso}
                      </span>
                      <span className="truncate font-medium">{item.country}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono font-bold text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                        {item.code}
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-0.5" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Validation error message */}
      {(error || isInvalid) && (
        <p className="text-[11px] text-destructive font-medium flex items-center gap-1 mt-1.5 animate-in fade-in duration-200">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>
            {error || (digitsOnly.length === 0 ? "Phone number is required." : "Please enter a valid phone number (6 to 15 digits).")}
          </span>
        </p>
      )}
    </div>
  );
}
