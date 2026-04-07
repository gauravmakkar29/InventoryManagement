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

/**
 * Semantic chart palette — aligned with IMS design tokens.
 * These hex values match the CSS custom properties in index.css
 * and are used for SVG fills / inline styles where CSS vars aren't practical.
 */
export const SEMANTIC_COLORS = {
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  high: "#f97316",
  info: "#3b82f6",
  muted: "#6b7280",
  mutedLight: "#e5e7eb",
} as const;

/** Threshold-based status colors (no gradients per design principles). */
export const STATUS_COLORS = {
  good: SEMANTIC_COLORS.success,
  warning: SEMANTIC_COLORS.warning,
  critical: SEMANTIC_COLORS.danger,
  accent: SEMANTIC_COLORS.info,
  muted: SEMANTIC_COLORS.mutedLight,
} as const;

/** Pick a status color from a numeric value + thresholds. */
export function statusColor(value: number, thresholds: { good: number; warning: number }): string {
  if (value >= thresholds.good) return STATUS_COLORS.good;
  if (value >= thresholds.warning) return STATUS_COLORS.warning;
  return STATUS_COLORS.critical;
}
