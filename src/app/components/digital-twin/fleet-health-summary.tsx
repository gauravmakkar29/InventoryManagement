import type { DigitalTwin, HealthFactors } from "./digital-twin-types";
import { HealthScoreGauge } from "./health-score-gauge";

// Story 15.5 — Fleet Health Summary Cards
export function FleetHealthSummary({ twins }: { twins: DigitalTwin[] }) {
  const critical = twins.filter((t) => t.healthScore <= 40).length;
  const warning = twins.filter((t) => t.healthScore > 40 && t.healthScore <= 70).length;
  const healthy = twins.filter((t) => t.healthScore > 70).length;
  const avgScore =
    twins.length > 0 ? Math.round(twins.reduce((s, t) => s + t.healthScore, 0) / twins.length) : 0;
  const drifted = twins.filter((t) => t.configDriftStatus === "Drifted").length;

  // Fleet health factor averages for radar
  const factorKeys: (keyof HealthFactors)[] = [
    "firmwareAge",
    "vulnerabilityExposure",
    "uptimeScore",
    "telemetryHealth",
    "complianceScore",
    "incidentHistory",
  ];
  const factorLabels = ["FW Age", "Vuln Exp", "Uptime", "Telemetry", "Compliance", "Incidents"];
  const factorAvgs = factorKeys.map((k) =>
    twins.length > 0
      ? Math.round(twins.reduce((s, t) => s + t.healthFactors[k], 0) / twins.length)
      : 0,
  );

  // SVG Radar chart
  const radarSize = 160;
  const radarCenter = radarSize / 2;
  const radarRadius = 60;
  const angleStep = (2 * Math.PI) / factorKeys.length;

  const radarPoints = factorAvgs
    .map((v, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const r = (v / 100) * radarRadius;
      return `${radarCenter + r * Math.cos(angle)},${radarCenter + r * Math.sin(angle)}`;
    })
    .join(" ");

  // Distribution bar chart
  const maxBucket = Math.max(critical, warning, healthy, 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
      {/* Average Health KPI */}
      <div className="card-elevated px-4 py-3.5">
        <div className="flex items-center gap-3">
          <HealthScoreGauge score={avgScore} size={52} />
          <div>
            <p className="text-[14px] text-muted-foreground">Fleet Avg Health</p>
            <p className="text-[22px] font-bold leading-snug text-foreground tabular-nums">
              {avgScore}
            </p>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-high-bg px-1.5 py-0.5 text-[12px] font-semibold text-accent-text">
              Twin
            </span>
          </div>
        </div>
      </div>

      {/* Distribution Bar Chart (Story 15.5 AC2) */}
      <div className="card-elevated px-4 py-3.5">
        <p className="text-[12px] font-semibold uppercase text-muted-foreground mb-2">
          Health Distribution
        </p>
        {/* Bar area — fixed height with bottom-aligned bars */}
        <div className="flex items-end gap-3 h-[44px] mb-1.5">
          {[
            { value: critical, color: "#ef4444" },
            { value: warning, color: "#f59e0b" },
            { value: healthy, color: "#10b981" },
          ].map(({ value, color }) => (
            <div key={color} className="flex-1">
              <div
                className="w-full rounded-t"
                style={{
                  height: `${maxBucket > 0 ? (value / maxBucket) * 40 : 0}px`,
                  backgroundColor: color,
                  minHeight: value > 0 ? 4 : 0,
                }}
              />
            </div>
          ))}
        </div>
        {/* Labels — separate row for consistent alignment */}
        <div className="flex gap-3">
          {[
            { label: "Crit", value: critical },
            { label: "Warn", value: warning },
            { label: "OK", value: healthy },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 text-center">
              <span className="text-[12px] text-muted-foreground block">{label}</span>
              <span className="text-[14px] font-bold tabular-nums text-foreground/80">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Radar Chart (Story 15.5 AC3) */}
      <div className="card-elevated px-4 py-3.5">
        <p className="text-[12px] font-semibold uppercase text-muted-foreground mb-1">
          Factor Analysis
        </p>
        <svg
          width={radarSize}
          height={radarSize}
          viewBox={`0 0 ${radarSize} ${radarSize}`}
          className="mx-auto"
        >
          {/* Grid circles */}
          {[0.25, 0.5, 0.75, 1].map((scale) => (
            <circle
              key={scale}
              cx={radarCenter}
              cy={radarCenter}
              r={radarRadius * scale}
              fill="none"
              stroke="#f1f3f5"
              strokeWidth={1}
            />
          ))}
          {/* Axis lines + labels */}
          {factorLabels.map((label, i) => {
            const angle = angleStep * i - Math.PI / 2;
            const x = radarCenter + radarRadius * Math.cos(angle);
            const y = radarCenter + radarRadius * Math.sin(angle);
            const lx = radarCenter + (radarRadius + 14) * Math.cos(angle);
            const ly = radarCenter + (radarRadius + 14) * Math.sin(angle);
            return (
              <g key={label}>
                <line
                  x1={radarCenter}
                  y1={radarCenter}
                  x2={x}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
                <text
                  x={lx}
                  y={ly + 3}
                  textAnchor="middle"
                  className="text-[10px] fill-muted-foreground/70"
                >
                  {label}
                </text>
              </g>
            );
          })}
          {/* Data polygon */}
          <polygon
            points={radarPoints}
            fill="#FF7900"
            fillOpacity={0.15}
            stroke="#FF7900"
            strokeWidth={1.5}
          />
          {/* Data points */}
          {factorAvgs.map((v, i) => {
            const angle = angleStep * i - Math.PI / 2;
            const r = (v / 100) * radarRadius;
            return (
              <circle
                key={i}
                cx={radarCenter + r * Math.cos(angle)}
                cy={radarCenter + r * Math.sin(angle)}
                r={2.5}
                fill="#FF7900"
                stroke="white"
                strokeWidth={1}
              />
            );
          })}
        </svg>
      </div>

      {/* Config Drift Summary */}
      <div className="card-elevated px-4 py-3.5">
        <p className="text-[12px] font-semibold uppercase text-muted-foreground mb-2">
          Config Status
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-muted-foreground">In Sync</span>
            <span className="text-[15px] font-bold tabular-nums text-success-text">
              {twins.filter((t) => t.configDriftStatus === "InSync").length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-muted-foreground">Drifted</span>
            <span className="text-[15px] font-bold tabular-nums text-warning-text">{drifted}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-muted-foreground">Unknown</span>
            <span className="text-[15px] font-bold tabular-nums text-muted-foreground">
              {twins.filter((t) => t.configDriftStatus === "Unknown").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
