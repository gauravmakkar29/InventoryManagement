import { statusColor, STATUS_COLORS } from "./chart-utils";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Gauge — semi-circular gauge for health / compliance scores
// ---------------------------------------------------------------------------

export interface GaugeProps {
  /** Current value (0–max). */
  value: number;
  /** Maximum value. @default 100 */
  max?: number;
  /** SVG width/height basis in px. @default 160 */
  size?: number;
  /** Thresholds that determine the arc color. */
  thresholds?: { good: number; warning: number };
  /** Accessible label. */
  "aria-label"?: string;
  className?: string;
}

export function Gauge({
  value,
  max = 100,
  size = 160,
  thresholds = { good: 90, warning: 70 },
  "aria-label": ariaLabel,
  className,
}: GaugeProps) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const halfCircumference = Math.PI * radius;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const offset = halfCircumference - pct * halfCircumference;

  // Scale thresholds to percentage for color logic
  const pctValue = (value / max) * 100;
  const color = statusColor(pctValue, thresholds);

  // Needle position
  const needleAngle = Math.PI - pct * Math.PI;
  const needleCx = size / 2 + radius * Math.cos(needleAngle);
  const needleCy = size / 2 - radius * Math.sin(needleAngle);

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `Gauge at ${value} of ${max}`}
      className={cn("inline-flex", className)}
    >
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        aria-hidden="true"
      >
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={STATUS_COLORS.muted}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={halfCircumference}
          strokeDashoffset={offset}
        />
        {/* Needle dot */}
        <circle cx={needleCx} cy={needleCy} r={6} fill={color} stroke="white" strokeWidth={2} />
        {/* Center value label */}
        <text
          x={size / 2}
          y={size / 2 + 2}
          textAnchor="middle"
          className="fill-foreground text-[22px] font-bold"
        >
          {value}
          {max === 100 ? "%" : ""}
        </text>
      </svg>
    </div>
  );
}
