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
