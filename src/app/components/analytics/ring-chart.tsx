import type { RingSegment } from "../../../lib/mock-data/analytics-data";

export function RingChart({
  segments,
  size = 160,
  strokeWidth = 20,
}: {
  segments: RingSegment[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const gap = 3;
  const totalGapDeg = gap * segments.length;
  const availableDeg = 360 - totalGapDeg;

  let cumulativeAngle = -90;

  return (
    <svg width={size} height={size} role="img" aria-label="Ring chart">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border)"
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
      {/* Center label */}
      <text
        x={size / 2}
        y={size / 2 - 6}
        textAnchor="middle"
        className="fill-foreground text-[22px] font-bold"
      >
        {total.toLocaleString()}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 14}
        textAnchor="middle"
        className="fill-muted-foreground/70 text-[13px]"
      >
        Total
      </text>
    </svg>
  );
}
