// Story 15.2 — SVG Health Trend Line Chart
export function HealthTrendChart({
  data,
  onPointHover,
}: {
  data: { date: string; score: number; event?: string }[];
  onPointHover?: (
    point: { date: string; score: number; event?: string } | null,
    x: number,
    y: number,
  ) => void;
}) {
  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minScore = Math.min(...data.map((d) => d.score));
  const maxScore = Math.max(...data.map((d) => d.score));
  const scoreRange = maxScore - minScore || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.score - minScore) / scoreRange) * chartH,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]!.x} ${padding.top + chartH} L ${points[0]!.x} ${padding.top + chartH} Z`;

  // Y-axis ticks
  const yTicks = [0, 25, 50, 75, 100].filter((t) => t >= minScore - 10 && t <= maxScore + 10);

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      {/* Grid lines */}
      {yTicks.map((tick) => {
        const y = padding.top + chartH - ((tick - minScore) / scoreRange) * chartH;
        return (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#f1f3f5"
              strokeWidth={1}
            />
            <text
              x={padding.left - 8}
              y={y + 3}
              textAnchor="end"
              className="text-[12px] fill-muted-foreground/70"
            >
              {tick}
            </text>
          </g>
        );
      })}

      {/* Health zone bands */}
      <rect
        x={padding.left}
        y={padding.top + chartH - ((40 - minScore) / scoreRange) * chartH}
        width={chartW}
        height={((40 - minScore) / scoreRange) * chartH}
        fill="#ef4444"
        opacity={0.04}
      />
      <rect
        x={padding.left}
        y={padding.top + chartH - ((70 - minScore) / scoreRange) * chartH}
        width={chartW}
        height={((70 - 40) / scoreRange) * chartH}
        fill="#f59e0b"
        opacity={0.04}
      />

      {/* Area fill */}
      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF7900" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FF7900" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trendGradient)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#FF7900"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.event ? 4 : 2.5}
          fill={p.event ? "#FF7900" : "white"}
          stroke="#FF7900"
          strokeWidth={p.event ? 2 : 1.5}
          className="cursor-pointer"
          onMouseEnter={(e) =>
            onPointHover?.({ date: p.date, score: p.score, event: p.event }, e.clientX, e.clientY)
          }
          onMouseLeave={() => onPointHover?.(null, 0, 0)}
        />
      ))}

      {/* X-axis labels (sparse) */}
      {points
        .filter(
          (_, i) => i % Math.max(1, Math.floor(points.length / 6)) === 0 || i === points.length - 1,
        )
        .map((p) => (
          <text
            key={p.date}
            x={p.x}
            y={height - 5}
            textAnchor="middle"
            className="text-[12px] fill-muted-foreground/70"
          >
            {p.date.slice(5)}
          </text>
        ))}
    </svg>
  );
}
