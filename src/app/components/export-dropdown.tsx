/**
 * ExportDropdown — Reusable export button with format menu (Story 19.20)
 *
 * Renders a compact "Export" dropdown with CSV, JSON, and PDF options.
 * Uses the standardized useExport() hook for all downloads.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Download, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExport } from "@/lib/use-export";
import type { ExportFormat, ExportColumn } from "@/lib/use-export";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportDropdownProps<T> {
  /** Data rows to export */
  data: T[];
  /** Column definitions for all export formats */
  columns: ExportColumn<T>[];
  /** Base filename (without extension or date suffix) */
  filename: string;
  /** Title for the PDF header; defaults to filename if omitted */
  title?: string;
  /** Disable the button (e.g. when no data is loaded yet) */
  disabled?: boolean;
  /** Additional CSS classes on the trigger button */
  className?: string;
}

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "csv", label: "Export CSV" },
  { value: "json", label: "Export JSON" },
  { value: "pdf", label: "Export PDF" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExportDropdown<T>({
  data,
  columns,
  filename,
  title,
  disabled,
  className,
}: ExportDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { exportData, isExporting } = useExport();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setOpen(false);
      await exportData({ data, columns, filename, format, title });
    },
    [data, columns, filename, title, exportData],
  );

  const isDisabled = disabled || data.length === 0 || isExporting;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={isDisabled}
        aria-haspopup="true"
        aria-expanded={open}
        title={data.length === 0 ? "No data to export" : "Export data"}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[14px] font-medium text-muted-foreground cursor-pointer",
          "hover:bg-muted hover:text-foreground/80",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        {isExporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Export
        <ChevronDown className="h-3 w-3" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {FORMATS.map(({ value, label }) => (
            <button
              key={value}
              role="menuitem"
              onClick={() => handleExport(value)}
              className="flex w-full items-center gap-2 px-3 py-2 text-[14px] text-foreground/80 hover:bg-muted cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
