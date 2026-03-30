/**
 * Generate a CSV string from an array of objects.
 *
 * @param data - Array of row objects
 * @param columns - Optional ordered list of column keys to include.
 *                  If omitted, uses keys from the first row.
 * @param headers - Optional display headers (same length as columns).
 *                  If omitted, uses column keys as headers.
 * @returns CSV string with proper escaping
 */
export function generateCSV(
  data: Record<string, unknown>[],
  columns?: string[],
  headers?: string[],
): string {
  if (data.length === 0) return "";

  const firstRow = data[0];
  if (!firstRow) return "";
  const cols = columns || Object.keys(firstRow);
  const headerRow = headers || cols;

  const escapeField = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines: string[] = [headerRow.map(escapeField).join(",")];

  for (const row of data) {
    const fields = cols.map((col) => escapeField(row[col]));
    lines.push(fields.join(","));
  }

  return lines.join("\n") + "\n";
}

/**
 * Generate a JSON string from data. Working implementation.
 */
export function generateJSON(data: unknown, pretty: boolean = true): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

/**
 * Generate a regulatory compliance report.
 * Stub — returns placeholder content with a console warning.
 */
export function generateRegulatoryReport(
  _complianceIds: string[],
  _format: "pdf" | "csv" | "json" = "json",
): string {
  console.warn("[report-generator] generateRegulatoryReport is a stub — not yet implemented");
  return generateJSON({
    report: "regulatory-compliance",
    status: "stub",
    generatedAt: new Date().toISOString(),
  });
}
