"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  FileSpreadsheet,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Loader2,
  AlertCircle,
  Table as TableIcon,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  Layers,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ExcelPreviewProps {
  fileUrl: string;
  fileName?: string;
  onDownload?: () => void;
  className?: string;
}

interface SheetData {
  trimmedHtml: string;
  fullHtml: string;
  trimmedRows: number;
  fullRows: number;
  colCount: number;
}

export function ExcelPreview({ fileUrl, fileName, onDownload, className = "" }: ExcelPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [sheetsData, setSheetsData] = useState<Record<string, SheetData>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [showEntireSheet, setShowEntireSheet] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Close fullscreen on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setSearchQuery("");
    setMatchCount(0);

    async function loadWorkbook() {
      try {
        const res = await fetch(fileUrl, { credentials: "include" });
        if (!res.ok) {
          throw new Error(`Failed to fetch spreadsheet (${res.status} ${res.statusText})`);
        }

        const arrayBuffer = await res.arrayBuffer();
        if (!isMounted) return;

        const XLSX = await import("xlsx");
        const workbook = XLSX.read(arrayBuffer, {
          type: "array",
          cellDates: true,
          dateNF: "yyyy-mm-dd",
        });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("No sheets found in this Excel workbook.");
        }

        const parsedSheets: Record<string, SheetData> = {};

        workbook.SheetNames.forEach((sheetName) => {
          const ws = workbook.Sheets[sheetName];
          if (!ws) return;

          const rawRange = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
          let maxR = rawRange.s.r;
          let maxC = rawRange.s.c;
          let minR = rawRange.e.r;
          let minC = rawRange.e.c;
          let hasData = false;

          for (let R = rawRange.s.r; R <= rawRange.e.r; ++R) {
            for (let C = rawRange.s.c; C <= rawRange.e.c; ++C) {
              const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
              if (cell && cell.v !== undefined && cell.v !== "" && cell.v !== null) {
                hasData = true;
                if (R > maxR) maxR = R;
                if (C > maxC) maxC = C;
                if (R < minR) minR = R;
                if (C < minC) minC = C;
              }
            }
          }

          const fullRowCount = rawRange.e.r - rawRange.s.r + 1;
          const colCount = Math.max(1, rawRange.e.c - rawRange.s.c + 1);

          // 1. Generate Full HTML (All rows in file)
          ws["!ref"] = XLSX.utils.encode_range(rawRange);
          const rawFullHtml = XLSX.utils.sheet_to_html(ws, { editable: false, id: `excel-full-${sheetName}` });
          const enhancedFullHtml = enhanceTableHtml(XLSX, rawFullHtml, rawRange);

          // 2. Generate Trimmed HTML (Populated content rows + buffer)
          let trimmedRowCount = fullRowCount;
          let enhancedTrimmedHtml = enhancedFullHtml;

          if (hasData) {
            const trimmedEndRow = Math.min(rawRange.e.r, maxR + 2);
            const trimmedRange = {
              s: { r: Math.max(0, minR), c: Math.max(0, minC) },
              e: { r: trimmedEndRow, c: maxC },
            };
            trimmedRowCount = trimmedRange.e.r - trimmedRange.s.r + 1;
            ws["!ref"] = XLSX.utils.encode_range(trimmedRange);
            const rawTrimmedHtml = XLSX.utils.sheet_to_html(ws, { editable: false, id: `excel-trim-${sheetName}` });
            enhancedTrimmedHtml = enhanceTableHtml(XLSX, rawTrimmedHtml, trimmedRange);
          }

          parsedSheets[sheetName] = {
            trimmedHtml: enhancedTrimmedHtml,
            fullHtml: enhancedFullHtml,
            trimmedRows: trimmedRowCount,
            fullRows: fullRowCount,
            colCount,
          };
        });

        if (isMounted) {
          setSheetNames(workbook.SheetNames);
          setActiveSheet(workbook.SheetNames[0]);
          setSheetsData(parsedSheets);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Spreadsheet loading error:", err);
        if (isMounted) {
          const msg = err?.message || "";
          if (
            msg.toLowerCase().includes("password") ||
            msg.toLowerCase().includes("encrypt") ||
            msg.toLowerCase().includes("unsupported") ||
            msg.toLowerCase().includes("cfb") ||
            msg.toLowerCase().includes("zip")
          ) {
            setError("This Excel spreadsheet is password-protected or encrypted. Please download the file to open and enter the password.");
          } else {
            setError(msg || "Failed to parse and render spreadsheet file.");
          }
          setLoading(false);
        }
      }
    }

    loadWorkbook();

    return () => {
      isMounted = false;
    };
  }, [fileUrl]);

  // Helper function to build styled header row, row numbers, and cell alignment
  function enhanceTableHtml(XLSX: any, rawHtml: string, range: any): string {
    if (typeof window === "undefined") return rawHtml;
    try {
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(rawHtml, "text/html");
      const table = parsedDoc.querySelector("table");
      if (!table) return rawHtml;

      table.className = "w-full border-collapse text-xs select-text";

      // 1. Build Sticky Column Header Row (Top)
      const thead = parsedDoc.createElement("thead");
      const headerRow = parsedDoc.createElement("tr");

      // Top-left corner cell (#)
      const cornerTh = parsedDoc.createElement("th");
      cornerTh.className =
        "sticky top-0 left-0 z-30 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px] font-bold text-center border border-slate-300 dark:border-slate-700 px-2 py-1.5 w-12 min-w-[48px] select-none shadow-xs";
      cornerTh.textContent = "#";
      headerRow.appendChild(cornerTh);

      // Column letters A, B, C...
      for (let c = range.s.c; c <= range.e.c; c++) {
        const colTh = parsedDoc.createElement("th");
        colTh.className =
          "sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold text-center border border-slate-300 dark:border-slate-700 px-3 py-1.5 min-w-[95px] select-none shadow-xs";
        colTh.textContent = XLSX.utils.encode_col(c);
        headerRow.appendChild(colTh);
      }
      thead.appendChild(headerRow);
      table.insertBefore(thead, table.firstChild);

      // 2. Add Sticky Row Header Column (Left) & Format Cells
      const trElements = table.querySelectorAll("tbody tr, tr");
      let rowIndex = range.s.r + 1;

      trElements.forEach((tr) => {
        if (tr.parentElement?.tagName === "THEAD") return;

        const rowTh = parsedDoc.createElement("th");
        rowTh.className =
          "sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-[11px] font-semibold text-center border border-slate-300 dark:border-slate-700 px-2 py-1 w-12 min-w-[48px] select-none";
        rowTh.textContent = String(rowIndex++);
        tr.insertBefore(rowTh, tr.firstChild);

        tr.querySelectorAll("td").forEach((td) => {
          const text = td.textContent?.trim() || "";
          const isNumeric = /^-?[\$Rp\s]?[\d,]+(\.\d+)?$/.test(text) && text.length > 0;
          const isSectionHeader = /^(Akta|Modal|Pengurus|Pemegang|Alamat|Total|Lama|Baru|Jabatan|Nama|Email|No Telp|[I|V|X]+|\d+)$/i.test(text);

          let alignmentClass = "text-left";
          if (isNumeric) {
            alignmentClass = "text-right font-mono font-medium";
          } else if (text === "I" || text === "II" || text === "III" || text === "Tidak Berubah" || text === "Baru" || text === "Lama") {
            alignmentClass = "text-center font-bold";
          } else if (isSectionHeader && text.length < 25) {
            alignmentClass = "font-bold text-slate-900 dark:text-white";
          }

          td.className =
            `border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950/70 align-top transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60 leading-relaxed font-sans ${alignmentClass}`;

          if (!text) {
            td.innerHTML = "&nbsp;";
          }
        });
      });

      return table.outerHTML;
    } catch {
      return rawHtml;
    }
  }

  // Active Sheet Content with Search & Highlight
  const currentSheetData = sheetsData[activeSheet];
  const activeBaseHtml = useMemo(() => {
    if (!currentSheetData) return "";
    return showEntireSheet ? currentSheetData.fullHtml : currentSheetData.trimmedHtml;
  }, [currentSheetData, showEntireSheet]);

  const activeHtmlWithSearch = useMemo(() => {
    if (!activeBaseHtml) return "";
    if (!searchQuery.trim() || typeof window === "undefined") {
      setMatchCount(0);
      return activeBaseHtml;
    }

    try {
      const q = searchQuery.toLowerCase().trim();
      const parser = new DOMParser();
      const doc = parser.parseFromString(activeBaseHtml, "text/html");
      let count = 0;

      doc.querySelectorAll("td").forEach((td) => {
        const text = td.textContent || "";
        if (text.toLowerCase().includes(q)) {
          td.classList.remove("bg-white", "dark:bg-slate-950/70");
          td.classList.add("bg-amber-100", "dark:bg-amber-950/80", "border-amber-400", "font-medium");
          count++;
        }
      });

      setMatchCount(count);
      return doc.body.innerHTML;
    } catch {
      return activeBaseHtml;
    }
  }, [activeBaseHtml, searchQuery]);

  const getFormatBadge = () => {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (ext === "xls") return "Excel (.xls)";
    if (ext === "csv") return "Spreadsheet (.csv)";
    return "Excel (.xlsx)";
  };

  const handleScrollToTop = () => {
    tableWrapperRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollToBottom = () => {
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollTo({
        top: tableWrapperRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const displayedRows = showEntireSheet
    ? currentSheetData?.fullRows || 0
    : currentSheetData?.trimmedRows || 0;

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col bg-background rounded-xl border border-border shadow-md overflow-hidden ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none border-0 p-4 sm:p-6 bg-background/98 backdrop-blur-md"
          : `h-full min-h-0 flex-1 ${className}`
      }`}
    >
      {/* Top Header / Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800 shrink-0 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm truncate text-white max-w-xs sm:max-w-md">
                {fileName || "Spreadsheet Preview"}
              </span>
              <Badge
                variant="outline"
                className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-mono px-1.5 py-0 hidden sm:inline-flex"
              >
                {getFormatBadge()}
              </Badge>
            </div>
            {currentSheetData && (
              <span className="text-[11px] text-slate-400">
                Viewing {displayedRows} rows × {currentSheetData.colCount} columns
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search sheet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-8 pr-7 w-32 sm:w-44 text-xs bg-slate-800/90 text-white placeholder:text-slate-400 border-slate-700 rounded-lg focus-visible:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {searchQuery.trim() && (
            <Badge
              variant="outline"
              className={`text-[10px] font-mono px-2 py-0.5 border ${
                matchCount > 0
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {matchCount} {matchCount === 1 ? "match" : "matches"}
            </Badge>
          )}

          {/* Quick Row Navigation (Top / Bottom) */}
          <div className="flex items-center bg-slate-800/90 rounded-lg border border-slate-700 p-0.5" title="Quick Scroll">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              onClick={handleScrollToTop}
              title="Scroll to Top (Row 1)"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              onClick={handleScrollToBottom}
              title="Scroll to Bottom"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>

          {/* View Mode Toggle: Populated vs Entire File */}
          {currentSheetData && currentSheetData.fullRows > currentSheetData.trimmedRows && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEntireSheet((prev) => !prev)}
              className={`h-7 px-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer gap-1.5 ${
                showEntireSheet
                  ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/40"
                  : "bg-slate-800/90 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800"
              }`}
              title={showEntireSheet ? "Switch to Content Rows Only" : "View Entire Sheet Range (All Rows)"}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{showEntireSheet ? `All Rows (${currentSheetData.fullRows})` : `Data Rows (${currentSheetData.trimmedRows})`}</span>
            </Button>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800/90 rounded-lg border border-slate-700 p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              onClick={() => setZoomLevel((prev) => Math.max(70, prev - 10))}
              title="Zoom Out"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-[10px] font-mono font-medium px-1.5 text-slate-300 select-none">
              {zoomLevel}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              onClick={() => setZoomLevel((prev) => Math.min(150, prev + 10))}
              title="Zoom In"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            {zoomLevel !== 100 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                onClick={() => setZoomLevel(100)}
                title="Reset Zoom"
              >
                <RotateCcw className="h-2.5 w-2.5" />
              </Button>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>

          {/* Direct Download Button */}
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="h-7 px-2.5 gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800 text-xs rounded-lg border border-slate-700 cursor-pointer"
              title="Download Original File"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden md:inline">Download</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Table / State Body */}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-slate-100/60 dark:bg-slate-900/60 flex flex-col">
        {loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-xs font-semibold text-muted-foreground">Reading spreadsheet data...</p>
          </div>
        )}

        {error && (
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center p-8 bg-background rounded-2xl border border-border space-y-3 max-w-md shadow-sm">
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-foreground">Could not preview Excel document</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
              {onDownload && (
                <Button size="sm" onClick={onDownload} className="font-bold gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="h-4 w-4" /> Download File
                </Button>
              )}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div
            ref={tableWrapperRef}
            className="w-full h-full min-h-0 flex-1 overflow-y-scroll overflow-x-auto select-text scroll-smooth p-3 sm:p-5 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-slate-100 dark:[&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-thumb]:bg-slate-400/80 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-500"
            style={{
              fontSize: `${(zoomLevel / 100) * 0.75}rem`,
            }}
          >
            <div
              className="excel-table-container inline-block min-w-full bg-white dark:bg-slate-950 shadow-md rounded-lg overflow-visible border border-slate-300 dark:border-slate-800"
              dangerouslySetInnerHTML={{ __html: activeHtmlWithSearch }}
            />
          </div>
        )}
      </div>

      {/* Bottom Sheet Navigation Bar (Excel Style Tabs) */}
      {!loading && !error && sheetNames.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-900 border-t border-border shrink-0 select-none overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground px-2 mr-1 shrink-0">
              <TableIcon className="h-3.5 w-3.5" />
              <span>Sheets:</span>
            </div>
            {sheetNames.map((sheet) => {
              const isActive = sheet === activeSheet;
              return (
                <button
                  key={sheet}
                  type="button"
                  onClick={() => {
                    setActiveSheet(sheet);
                    setSearchQuery("");
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-emerald-500/40 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-transparent"}`} />
                  {sheet}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground hidden sm:flex shrink-0 px-2">
            <span>Scrollable: Rows 1 to {displayedRows}</span>
            <span>•</span>
            <span>Active Sheet: <strong className="text-foreground">{activeSheet}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
