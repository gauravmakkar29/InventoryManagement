import { normalizeData } from "./chart-utils";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Sparkline — mini inline line chart for KPI trend indicators
// ---------------------------------------------------------------------------

export interface SparklineProps {
  /** Raw numeric data points (minimum 2). */
  data: number[];
  /** Total SVG width in px. @default 48 */
  width?: number;
  /** Total SVG height in px. @default 20 */
  height?: number;
  /** Stroke color (CSS value). @default "#10b981" */
  color?: string;
  /** Accessible label describing the trend. */
  "aria-label"?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 48,
  height = 20,
  color = "#10b981",
  "aria-label": ariaLabel,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const normalized = normalizeData(data);
  const points = normalized
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - v * height}`)
    .join(" ");

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? "Sparkline trend"}
      className={cn("inline-flex shrink-0", className)}
    >
      <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}
