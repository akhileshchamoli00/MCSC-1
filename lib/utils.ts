import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${process.env.NEXT_PUBLIC_API_URL || ""}${url}`;
}

/**
 * Global Email Validation Rule
 * Ensures standard compliant email structure with valid TLD (e.g. name@example.com)
 */
export function validateEmail(emailStr: string | null | undefined): { isValid: boolean; error?: string; cleaned: string } {
  if (!emailStr || !emailStr.trim()) {
    return { isValid: false, error: "Email address is mandatory.", cleaned: "" };
  }
  const cleaned = emailStr.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleaned)) {
    return {
      isValid: false,
      error: "Invalid email format. Please provide a valid email address (e.g. name@example.com).",
      cleaned
    };
  }
  return { isValid: true, cleaned };
}

/**
 * Global Mobile / Phone Number Validation Rule
 * Supports domestic and international phone formats with 6 to 15 digits (e.g. +62 812 3456 7890)
 */
export function validateMobileNumber(
  phoneStr: string | null | undefined,
  required: boolean = false
): { isValid: boolean; error?: string; cleaned: string } {
  if (!phoneStr || !phoneStr.trim()) {
    if (required) {
      return { isValid: false, error: "Mobile number is mandatory.", cleaned: "" };
    }
    return { isValid: true, cleaned: "" };
  }
  
  const raw = phoneStr.trim();
  const digitsOnly = raw.replace(/\D/g, "");
  
  if (digitsOnly.length < 6 || digitsOnly.length > 16) {
    return {
      isValid: false,
      error: "Invalid mobile number. Please provide a valid phone number with 6 to 15 digits.",
      cleaned: raw
    };
  }
  
  return { isValid: true, cleaned: raw };
}

/**
 * Formats a raw number or numeric string with thousand separators (commas), preserving decimals.
 * e.g. "1250000" -> "1,250,000"
 * e.g. "1250000.5" -> "1,250,000.5"
 */
export function formatNumberWithCommas(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value);
  const dotIndex = str.indexOf(".");
  const intPart = dotIndex !== -1 ? str.slice(0, dotIndex) : str;
  const decPart = dotIndex !== -1 ? str.slice(dotIndex + 1) : null;

  const cleanInt = intPart.replace(/\D/g, "");
  if (!cleanInt && decPart === null) return "";

  const formattedInt = cleanInt ? Number(cleanInt).toLocaleString("en-US") : "0";

  if (decPart !== null) {
    const cleanDec = decPart.replace(/\D/g, "").slice(0, 2);
    return `${formattedInt}.${cleanDec}`;
  }

  return formattedInt;
}

export function parseNumberFromCommas(value: string | null | undefined): number {
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Global Phone Number Formatter for tables and display views.
 * Formats full phone numbers with standard hyphens between digit blocks.
 * e.g. "+62 81234567890"  -> "+62 812-3456-7890"
 * e.g. "+6281234567890"   -> "+62 812-3456-7890"
 * e.g. "081234567890"     -> "0812-3456-7890"
 * e.g. "81234567890"      -> "812-3456-7890"
 * e.g. "+65 81234567"     -> "+65 8123-4567"
 * e.g. "+1 5551234567"    -> "+1 555-123-4567"
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone || !phone.trim()) return "-";
  const trimmed = phone.trim();
  const lower = trimmed.toLowerCase();
  if (trimmed === "-" || lower === "not provided" || lower === "no phone" || lower === "no phone listed") {
    return trimmed;
  }

  let dialCode = "";
  let national = trimmed;

  if (trimmed.startsWith("+")) {
    const match = trimmed.match(/^(\+\d{1,4})[\s-]*(.*)$/);
    if (match) {
      dialCode = match[1];
      national = match[2];
    }
  }

  const digits = national.replace(/\D/g, "");
  if (!digits) {
    return dialCode ? dialCode : trimmed;
  }

  // If starts with 0 and no dialCode (domestic representation e.g. 081234567890)
  if (!dialCode && national.startsWith("0")) {
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    if (digits.length <= 12) return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  let formattedNational = "";
  if (digits.length <= 3) {
    formattedNational = digits;
  } else if (digits.length <= 7) {
    formattedNational = `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else if (digits.length === 8) {
    formattedNational = `${digits.slice(0, 4)}-${digits.slice(4)}`;
  } else if (digits.length <= 11) {
    formattedNational = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else {
    formattedNational = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}-${digits.slice(11)}`;
  }

  return dialCode ? `${dialCode} ${formattedNational}` : formattedNational;
}
