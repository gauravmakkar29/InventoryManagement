import type { VulnSeverity } from "../../../lib/mock-data/analytics-data";

export function HorizontalBarChart({ data }: { data: VulnSeverity[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barHeight = 24;
  const gap = 12;
  const labelWidth = 70;
  const valueWidth = 40;
  const chartHeight = data.length * (barHeight + gap) - gap;

  return (
    <svg
      width="100%"
      height={chartHeight + 8}
      viewBox={`0 0 340 ${chartHeight + 8}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Vulnerability severity breakdown"
    >
      {data.map((d, i) => {
        const y = i * (barHeight + gap) + 4;
        const barMaxWidth = 340 - labelWidth - valueWidth - 16;
        const barW = (d.count / maxCount) * barMaxWidth;
        return (
          <g key={d.severity}>
            <text
              x={0}
              y={y + barHeight / 2 + 4}
              className="fill-muted-foreground text-[13px] font-medium"
            >
              {d.severity}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={barW}
              height={barHeight}
              rx={4}
              fill={d.color}
              opacity={0.85}
            />
            <text
              x={labelWidth + barW + 8}
              y={y + barHeight / 2 + 4}
              className="fill-foreground/80 text-[13px] font-bold"
            >
              {d.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
