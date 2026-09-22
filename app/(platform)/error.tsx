"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, Home, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [showDetails, setShowDetails] = React.useState(false)

  useEffect(() => {
    // Log the error to console / error reporting service
    console.error("Platform Runtime Error caught by error boundary:", error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border/70 rounded-2xl p-8 shadow-xl text-center flex flex-col items-center space-y-5">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred while rendering this module. You can attempt to recover by reloading the view.
          </p>
        </div>

        {error?.digest && (
          <div className="text-[11px] font-mono text-muted-foreground/80 bg-muted/40 px-2.5 py-1 rounded-md border border-border/40">
            Error ID: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:flex-1 font-semibold flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:flex-1 font-semibold flex items-center justify-center gap-2"
          >
            <Link href="/business/clients/orders">
              <Home className="h-4 w-4" /> Dashboard
            </Link>
          </Button>
        </div>

        {error?.message && (
          <div className="w-full pt-3 border-t border-border/40">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto transition-colors font-medium"
            >
              {showDetails ? "Hide technical details" : "Show technical details"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </button>

            {showDetails && (
              <pre className="mt-3 text-[11px] font-mono text-left bg-muted/70 p-3 rounded-lg border border-border/60 overflow-x-auto text-destructive max-h-36 whitespace-pre-wrap break-all">
                {error.message}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
