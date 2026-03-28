/**
 * Generate a CSV string from an array of objects.
 * Stub — returns placeholder content with a console warning.
 */
export function generateCSV(
  _data: Record<string, unknown>[],
  _columns?: string[]
): string {
  console.warn("[report-generator] generateCSV is a stub — not yet implemented");
  return "col1,col2,col3\nplaceholder,data,here\n";
}

/**
 * Generate a JSON string from data. Working implementation.
 */
export function generateJSON(
  data: unknown,
  pretty: boolean = true
): string {
  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

/**
 * Generate a regulatory compliance report.
 * Stub — returns placeholder content with a console warning.
 */
export function generateRegulatoryReport(
  _complianceIds: string[],
  _format: "pdf" | "csv" | "json" = "json"
): string {
  console.warn(
    "[report-generator] generateRegulatoryReport is a stub — not yet implemented"
  );
  return generateJSON({
    report: "regulatory-compliance",
    status: "stub",
    generatedAt: new Date().toISOString(),
  });
}
