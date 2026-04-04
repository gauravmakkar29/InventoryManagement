// ---------------------------------------------------------------------------
// Chart utilities — shared helpers for SVG chart components
// ---------------------------------------------------------------------------

/**
 * Normalize an array of numbers to the 0–1 range.
 * Returns an empty array when input is empty.
 */
export function normalizeData(data: number[]): number[] {
  if (data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  if (range === 0) return data.map(() => 0.5);
  return data.map((v) => (v - min) / range);
}

/**
 * Describe an SVG arc path between two angles (in degrees).
 * Angles are measured clockwise from 12-o'clock (−90° offset applied internally).
 */
export function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const start = {
    x: cx + radius * Math.cos(toRad(endAngleDeg)),
    y: cy + radius * Math.sin(toRad(endAngleDeg)),
  };
  const end = {
    x: cx + radius * Math.cos(toRad(startAngleDeg)),
    y: cy + radius * Math.sin(toRad(startAngleDeg)),
  };
  const largeArc = endAngleDeg - startAngleDeg <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

// ---------------------------------------------------------------------------
// Color constants — aligned with IMS design tokens
// ---------------------------------------------------------------------------

/** Threshold-based status colors (no gradients per design principles). */
export const STATUS_COLORS = {
  good: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
  accent: "#2563eb",
  muted: "#e5e7eb",
} as const;

/** Pick a status color from a numeric value + thresholds. */
export function statusColor(value: number, thresholds: { good: number; warning: number }): string {
  if (value >= thresholds.good) return STATUS_COLORS.good;
  if (value >= thresholds.warning) return STATUS_COLORS.warning;
  return STATUS_COLORS.critical;
}
