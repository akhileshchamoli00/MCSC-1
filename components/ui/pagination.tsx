"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showEdges?: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showEdges = false,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  // Generate pagination items
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, "ellipsis-start", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap sm:flex-nowrap", className)}>
      {showEdges && (
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 rounded-lg text-xs bg-background border-border/70 hover:bg-accent transition-colors"
          title="First Page"
          aria-label="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="h-8 px-2.5 rounded-lg text-xs bg-background border-border/70 hover:bg-accent transition-colors gap-1"
        aria-label="Previous Page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden xs:inline sm:inline">Previous</span>
      </Button>

      {/* Direct Click Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((item, idx) => {
          if (item === "ellipsis-start") {
            return (
              <button
                key={`ellipsis-start-${idx}`}
                type="button"
                onClick={() => onPageChange(Math.max(1, currentPage - 5))}
                className="h-8 w-7 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer"
                title="Jump back 5 pages"
              >
                ...
              </button>
            );
          }

          if (item === "ellipsis-end") {
            return (
              <button
                key={`ellipsis-end-${idx}`}
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 5))}
                className="h-8 w-7 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer"
                title="Jump forward 5 pages"
              >
                ...
              </button>
            );
          }

          const pageNum = Number(item);
          const isActive = pageNum === currentPage;

          return (
            <Button
              key={pageNum}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="icon-sm"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "h-8 w-8 text-xs font-semibold rounded-lg transition-all duration-150 p-0",
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold shadow-xs hover:!bg-zinc-900 hover:!text-white dark:hover:!bg-zinc-100 dark:hover:!text-zinc-900"
                  : "bg-background border-border/70 text-foreground hover:bg-accent"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="h-8 px-2.5 rounded-lg text-xs bg-background border-border/70 hover:bg-accent transition-colors gap-1"
        aria-label="Next Page"
      >
        <span className="hidden xs:inline sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {showEdges && (
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 rounded-lg text-xs bg-background border-border/70 hover:bg-accent transition-colors"
          title="Last Page"
          aria-label="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export interface TablePaginationProps extends PaginationControlsProps {
  startIndex?: number;
  endIndex?: number;
  totalEntries?: number;
  itemName?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  totalEntries,
  itemName = "entries",
  className,
  showEdges = false,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const hasRange =
    startIndex !== undefined &&
    endIndex !== undefined &&
    totalEntries !== undefined;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-border/50 bg-transparent mt-0 gap-3",
        className
      )}
    >
      {hasRange ? (
        <div className="text-xs text-muted-foreground order-2 sm:order-1">
          Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
          <span className="font-medium text-foreground">{Math.min(totalEntries, endIndex)}</span> of{" "}
          <span className="font-medium text-foreground">{totalEntries}</span> {itemName}
        </div>
      ) : (
        <div className="order-2 sm:order-1" />
      )}

      <div className="order-1 sm:order-2">
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          showEdges={showEdges}
        />
      </div>
    </div>
  );
}
