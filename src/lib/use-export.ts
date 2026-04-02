/**
 * useExport — Standardized data export hook (Story 19.20)
 *
 * Supports CSV, JSON, and PDF export with proper escaping,
 * chunked processing for large datasets, and browser download triggers.
 *
 * XLSX is not supported — requires a third-party library (e.g. SheetJS).
 */
import { useState, useCallback } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportFormat = "csv" | "json" | "pdf";

export interface ExportColumn<T> {
  /** Display header in the exported file */
  header: string;
  /** Key on the data object, or a function that extracts the value */
  accessor: keyof T | ((item: T) => string | number);
  /** Optional column width hint (used by PDF layout) */
  width?: number;
}

export interface ExportOptions<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  format: ExportFormat;
  /** Title displayed in the PDF header */
  title?: string;
}

export interface UseExportReturn {
  exportData: <T>(options: ExportOptions<T>) => Promise<void>;
  isExporting: boolean;
}

// ---------------------------------------------------------------------------
// Helpers (pure, testable)
// ---------------------------------------------------------------------------

/** Resolve a column accessor to a string value */
export function resolveAccessor<T>(item: T, accessor: ExportColumn<T>["accessor"]): string {
  if (typeof accessor === "function") {
    return String(accessor(item));
  }
  const raw = item[accessor];
  if (raw === null || raw === undefined) return "";
  return String(raw);
}

/** Escape a single CSV field per RFC 4180 */
export function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Sanitize a filename — strip characters that are unsafe on common OS */
export function sanitizeFilename(name: string): string {
  return (
    name
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 200)
  );
}

/**
 * Generate CSV content from typed data + column definitions.
 * Processes in chunks to avoid blocking the main thread on large datasets.
 */
export async function generateCsvContent<T>(
  data: T[],
  columns: ExportColumn<T>[],
): Promise<string> {
  const CHUNK_SIZE = 500;
  const headerRow = columns.map((c) => escapeCsvField(c.header)).join(",");
  const lines: string[] = [headerRow];

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    for (const item of chunk) {
      const fields = columns.map((col) => escapeCsvField(resolveAccessor(item, col.accessor)));
      lines.push(fields.join(","));
    }
    // Yield to the event loop between chunks so the UI stays responsive
    if (i + CHUNK_SIZE < data.length) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    }
  }

  return lines.join("\n") + "\n";
}

/**
 * Generate pretty-printed JSON from typed data + column definitions.
 */
export function generateJsonContent<T>(data: T[], columns: ExportColumn<T>[]): string {
  const rows = data.map((item) => {
    const row: Record<string, string | number> = {};
    for (const col of columns) {
      const val = resolveAccessor(item, col.accessor);
      row[col.header] = val;
    }
    return row;
  });
  return JSON.stringify(rows, null, 2);
}

/**
 * Trigger a browser file download from in-memory content.
 */
export function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a printable PDF via a hidden iframe using window.print().
 * No third-party dependency required.
 */
function generatePdfViaPrint<T>(data: T[], columns: ExportColumn<T>[], title: string): void {
  const headerCells = columns
    .map(
      (c) =>
        `<th style="border:1px solid #d1d5db;padding:6px 10px;text-align:left;font-size:12px;background:#f1f5f9;white-space:nowrap">${escapeHtml(c.header)}</th>`,
    )
    .join("");

  const bodyRows = data
    .map((item) => {
      const cells = columns
        .map(
          (col) =>
            `<td style="border:1px solid #d1d5db;padding:5px 10px;font-size:11px">${escapeHtml(resolveAccessor(item, col.accessor))}</td>`,
        )
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html><head><title>${escapeHtml(title)}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;margin:20px;color:#0f172a}
  h1{font-size:16px;margin-bottom:4px}
  p{font-size:11px;color:#64748b;margin-bottom:12px}
  table{border-collapse:collapse;width:100%}
  @media print{body{margin:10mm}}
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p>Exported ${data.length} records on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    toast.error("PDF export failed — unable to create print frame");
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to render before printing
  setTimeout(() => {
    iframe.contentWindow?.print();
    // Clean up after a delay to let the print dialog finish
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}

/** Minimal HTML entity escaping for generated markup */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async <T>(options: ExportOptions<T>) => {
    const { data, columns, filename, format, title } = options;

    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);

    try {
      const safeName = sanitizeFilename(filename);
      const dateStr = new Date().toISOString().split("T")[0];

      switch (format) {
        case "csv": {
          const csv = await generateCsvContent(data, columns);
          triggerDownload(csv, `${safeName}-${dateStr}.csv`, "text/csv;charset=utf-8;");
          toast.success(`Exported ${data.length} records to CSV`);
          break;
        }

        case "json": {
          const json = generateJsonContent(data, columns);
          triggerDownload(json, `${safeName}-${dateStr}.json`, "application/json");
          toast.success(`Exported ${data.length} records to JSON`);
          break;
        }

        case "pdf": {
          generatePdfViaPrint(data, columns, title ?? safeName);
          toast.success("PDF print dialog opened");
          break;
        }

        default: {
          const _exhaustive: never = format;
          toast.error(`Unsupported export format: ${String(_exhaustive)}`);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown export error";
      toast.error(`Export failed: ${message}`);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportData, isExporting };
}
