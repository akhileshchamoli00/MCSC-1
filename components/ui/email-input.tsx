"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Mail, AlertCircle } from "lucide-react";
import { isValidEmail } from "./phone-input";

export interface EmailInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  showIcon?: boolean;
}

export function EmailInput({
  id = "email-input",
  value,
  onChange,
  placeholder = "name@company.com",
  required = false,
  disabled = false,
  className = "",
  error,
  showIcon = true,
  ...props
}: EmailInputProps) {
  const [touched, setTouched] = useState(false);

  const isInvalid = touched && (
    (required && !value.trim()) ||
    (value.trim().length > 0 && !isValidEmail(value))
  );

  return (
    <div className="w-full">
      <div className="relative flex items-center">
        {showIcon && (
          <Mail className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <Input
          id={id}
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`h-10 text-sm font-medium transition-all ${showIcon ? "pl-10" : ""} ${
            error || isInvalid
              ? "border-destructive focus-visible:ring-destructive/30"
              : "border-border/60 focus-visible:border-primary/50 focus-visible:ring-primary/25"
          } ${disabled ? "bg-muted/50 text-foreground cursor-not-allowed opacity-90 select-none" : "bg-background"} ${className}`}
          {...props}
        />
      </div>

      {(error || isInvalid) && (
        <p className="text-[11px] text-destructive font-medium flex items-center gap-1 mt-1.5 animate-in fade-in duration-200">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>
            {error || (!value.trim() ? "Email address is required." : "Please enter a valid email address (e.g. name@domain.com).")}
          </span>
        </p>
      )}
    </div>
  );
}
