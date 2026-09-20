'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

// Suppress false-positive hydration warnings in development caused by:
// 1. Script tags injected by next-themes (React 19 / Next.js 15+)
// 2. Browser extensions (e.g. Bitwarden, Password Managers) injecting attributes like bis_skin_checked into DOM
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const orig = console.error;
  console.error = (...args: any[]) => {
    const fullText = args
      .map((a) => (typeof a === 'string' ? a : (a && typeof a === 'object' && 'message' in a ? String(a.message) : '')))
      .join(' ');

    if (
      fullText.includes('Encountered a script tag while rendering React component') ||
      fullText.includes('bis_skin_checked')
    ) {
      return;
    }
    orig.apply(console, args);
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
