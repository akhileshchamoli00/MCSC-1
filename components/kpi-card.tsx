"use client";

import { FC, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface KpiCardProps {
  title: string;
  value?: string | number | ReactNode;
  icon?: any;
  colorTheme?: "sky" | "emerald" | "amber" | "rose" | "indigo" | "purple" | "blue" | "pink" | string;
  pulseIcon?: boolean;
  className?: string;
  borderClass?: string;
  iconClass?: string;
  children?: ReactNode;
}

const themeStyles: Record<string, { border: string; bg: string; text: string }> = {
  sky: {
    border: "bg-sky-500/80",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-600 dark:text-sky-400"
  },
  emerald: {
    border: "bg-emerald-500/80",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400"
  },
  amber: {
    border: "bg-amber-500/80",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400"
  },
  rose: {
    border: "bg-rose-500/80",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-600 dark:text-rose-400"
  },
  indigo: {
    border: "bg-indigo-500/80",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-600 dark:text-indigo-400"
  },
  purple: {
    border: "bg-purple-500/80",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-600 dark:text-purple-400"
  },
  blue: {
    border: "bg-blue-500/80",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400"
  },
  pink: {
    border: "bg-pink-500/80",
    bg: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-600 dark:text-pink-400"
  }
};

export const KpiCard: FC<KpiCardProps> = ({
  title,
  value,
  icon: Icon,
  colorTheme = "sky",
  pulseIcon = false,
  className = "",
  borderClass,
  iconClass,
  children
}) => {
  const theme = themeStyles[colorTheme] || themeStyles.sky;

  return (
    <Card className={`border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${className}`}>
      <div className={`absolute top-0 left-0 w-1.5 h-full ${borderClass || theme.border}`} />
      <CardContent className="py-2 px-3 flex items-center justify-between">
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{title}</p>
          {value !== undefined && (
            <h3 className="text-lg md:text-xl font-bold text-foreground mt-0 truncate leading-tight">{value}</h3>
          )}
          {children}
        </div>
        {Icon && (
          <div className={`p-1.5 rounded-lg shrink-0 group-hover:scale-110 transition-transform hidden sm:block ${
            iconClass || `${theme.bg} ${theme.text}`
          } ${pulseIcon ? "animate-pulse" : ""}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
