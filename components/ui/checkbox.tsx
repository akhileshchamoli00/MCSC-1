"use client"

import * as React from "react"
import { CheckIcon, Minus } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer group size-4 shrink-0 rounded-[4px] border border-input bg-background/80 shadow-xs transition-colors outline-none cursor-pointer",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "hover:border-foreground/60",
        // High visibility in dark theme: distinct border and surface so it doesn't blend into dark rows/cards
        "dark:border-zinc-500/90 dark:bg-zinc-900/80 dark:hover:border-zinc-200 dark:hover:bg-zinc-900 dark:aria-invalid:ring-destructive/40",
        // Checked state
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        "dark:data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary dark:data-[state=checked]:text-primary-foreground",
        // Indeterminate state
        "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        "dark:data-[state=indeterminate]:border-primary dark:data-[state=indeterminate]:bg-primary dark:data-[state=indeterminate]:text-primary-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5 group-data-[state=indeterminate]:hidden" />
        <Minus className="size-3 hidden group-data-[state=indeterminate]:block stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
