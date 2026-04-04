import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Donut — ring chart for status / category distribution
// ---------------------------------------------------------------------------

export interface DonutSegment {
  /** Numeric value (absolute — percentages computed internally). */
  value: number;
  /** CSS color for the segment. */
  color: string;
  /** Human-readable label for the segment. */
  label: string;
}

export interface DonutProps {
  segments: DonutSegment[];
  /** Outer diameter in px. @default 140 */
  size?: number;
  /** Ring thickness in px. @default 16 */
  strokeWidth?: number;
  /** Gap between segments in degrees. @default 4 */
  gap?: number;
  /** Optional center text (e.g. total count). */
  centerLabel?: string;
  /** Optional secondary center text. */
  centerSublabel?: string;
  /** Accessible label. */
  "aria-label"?: string;
  className?: string;
}

export function Donut({
  segments,
  size = 140,
  strokeWidth = 16,
  gap = 4,
  centerLabel,
  centerSublabel,
  "aria-label": ariaLabel,
  className,
}: DonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const totalGapDeg = gap * segments.length;
  const availableDeg = 360 - totalGapDeg;

  let cumulativeAngle = -90;

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? "Donut chart"}
      className={cn("relative inline-flex", className)}
    >
      <svg width={size} height={size} aria-hidden="true">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f1f3f5"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {segments.map((seg) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          const segDeg = (pct / 100) * availableDeg;
          const segLength = (segDeg / 360) * circumference;
          const rotation = cumulativeAngle;
          cumulativeAngle += segDeg + gap;

          return (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segLength} ${circumference - segLength}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            />
          );
        })}
        {/* Optional center labels rendered inside SVG for alignment */}
        {centerLabel != null && (
          <text
            x={size / 2}
            y={centerSublabel ? size / 2 - 6 : size / 2 + 5}
            textAnchor="middle"
            className="fill-foreground text-[22px] font-bold"
          >
            {centerLabel}
          </text>
        )}
        {centerSublabel != null && (
          <text
            x={size / 2}
            y={size / 2 + 14}
            textAnchor="middle"
            className="fill-muted-foreground text-[12px]"
          >
            {centerSublabel}
          </text>
        )}
      </svg>
    </div>
  );
}
