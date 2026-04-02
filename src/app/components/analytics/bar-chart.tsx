import type { MonthlyDeployment } from "@/lib/mock-data/analytics-data";

export function BarChart({ data, height = 180 }: { data: MonthlyDeployment[]; height?: number }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barWidth = 36;
  const gap = 16;
  const chartWidth = data.length * (barWidth + gap) - gap;
  const paddingTop = 20;
  const paddingBottom = 28;
  const barAreaHeight = height - paddingTop - paddingBottom;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${chartWidth + 20} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Monthly deployment bar chart"
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = paddingTop + barAreaHeight * (1 - pct);
        return (
          <g key={pct}>
            <line
              x1={0}
              x2={chartWidth + 20}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray={pct === 0 ? "0" : "4 4"}
            />
            <text
              x={chartWidth + 18}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground/70 text-[12px]"
            >
              {Math.round(maxCount * pct)}
            </text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const barHeight = (d.count / maxCount) * barAreaHeight;
        const x = i * (barWidth + gap) + 10;
        const y = paddingTop + barAreaHeight - barHeight;
        return (
          <g key={d.month}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill="#2563eb"
              opacity={0.85}
            />
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[12px] font-semibold"
            >
              {d.count}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[12px]"
            >
              {d.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
