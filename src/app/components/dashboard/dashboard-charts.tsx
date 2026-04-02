import { cn } from "../../../lib/utils";

// ---------------------------------------------------------------------------
// GaugeChart — SVG semi-circle gauge
// ---------------------------------------------------------------------------
function GaugeChart({ value, size = 160 }: { value: number; size?: number }) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const halfCircumference = Math.PI * radius;
  const offset = halfCircumference - (value / 100) * halfCircumference;
  const color = value >= 90 ? "#10b981" : value >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <svg
      width={size}
      height={size / 2 + 20}
      viewBox={`0 0 ${size} ${size / 2 + 20}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#FF7900" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {/* Background arc */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Value arc with gradient */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={halfCircumference}
        strokeDashoffset={offset}
      />
      {/* Needle dot */}
      {(() => {
        const angle = Math.PI - (value / 100) * Math.PI;
        const cx = size / 2 + radius * Math.cos(angle);
        const cy = size / 2 - radius * Math.sin(angle);
        return <circle cx={cx} cy={cy} r={6} fill={color} stroke="white" strokeWidth={2} />;
      })()}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// FleetDonut — ring chart with gap segments
// ---------------------------------------------------------------------------
function FleetDonut({
  segments,
  size = 140,
}: {
  segments: { label: string; value: number; color: string; pct: number }[];
  size?: number;
}) {
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 4;
  const totalGap = gap * segments.length;
  const availableDeg = 360 - totalGap;

  let cumulativeAngle = -90;

  return (
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
        const segDeg = (seg.pct / 100) * availableDeg;
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
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const FLEET_SEGMENTS = [
  { label: "Online", value: 973, color: "#10b981", pct: 78 },
  { label: "Offline", value: 150, color: "#ef4444", pct: 12 },
  { label: "Maintenance", value: 124, color: "#f59e0b", pct: 10 },
];

const TOP_REGIONS = [
  { name: "Shanghai HQ", count: 342, pct: 74 },
  { name: "Denver DC", count: 218, pct: 47 },
  { name: "Munich Office", count: 196, pct: 42 },
  { name: "Singapore Lab", count: 167, pct: 36 },
  { name: "Sao Paulo Site", count: 124, pct: 27 },
];

const HEALTH_MINI_STATS = [
  { label: "Uptime", value: "99.9%" },
  { label: "Avg Response", value: "23ms" },
  { label: "Critical Alerts", value: "2" },
  { label: "Firmware Current", value: "89%" },
];

// ---------------------------------------------------------------------------
// DashboardCharts — Fleet Status + Health Score row
// ---------------------------------------------------------------------------
export function DashboardCharts() {
  return (
    <div className="grid grid-cols-5 gap-5">
      {/* Fleet Status — 3 cols */}
      <div className="col-span-3 card-elevated">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-[16px] font-semibold text-foreground">Fleet Status</h3>
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[14px] font-medium text-accent-text">
            1,247 devices
          </span>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* Donut chart + legend side by side */}
          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative shrink-0">
              <FleetDonut segments={FLEET_SEGMENTS} size={140} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[22px] font-bold tabular-nums text-foreground">1,247</span>
                <span className="text-[12px] text-muted-foreground">Total</span>
              </div>
            </div>
            {/* Legend + values */}
            <div className="flex-1 space-y-3">
              {FLEET_SEGMENTS.map((seg) => (
                <div key={seg.label} className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: seg.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[14px] font-medium text-foreground/80">
                        {seg.label}
                      </span>
                      <span className="text-[15px] font-bold tabular-nums text-foreground">
                        {seg.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Regions */}
          <div>
            <p className="mb-3 text-[14px] font-semibold text-foreground">Device Distribution</p>
            <div className="space-y-2.5">
              {TOP_REGIONS.map((region, i) => (
                <div key={region.name} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded text-[12px] font-bold text-muted-foreground bg-muted">
                    {i + 1}
                  </span>
                  <span className="w-[100px] truncate text-[14px] font-medium text-foreground/80">
                    {region.name}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${region.pct}%`,
                          background: `linear-gradient(90deg, #FF7900, #f59e0b)`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-[40px] text-right text-[14px] font-bold tabular-nums text-foreground/80">
                    {region.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Health Score — 2 cols */}
      <div className="col-span-2 card-elevated">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-[16px] font-semibold text-foreground">Health Score</h3>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[13px] font-semibold text-emerald-700">
            Healthy
          </span>
        </div>

        <div className="flex flex-col items-center px-5 pb-5">
          {/* Gauge */}
          <div className="relative mb-3">
            <GaugeChart value={94.2} />
            <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
              <span className="text-[28px] font-bold tabular-nums text-foreground">94.2%</span>
              <span className="text-[13px] text-muted-foreground">Overall Fleet Health</span>
            </div>
          </div>

          {/* Health tiers breakdown */}
          <div className="w-full space-y-2 mb-4">
            {[
              { label: "Excellent (90-100%)", count: 892, pct: 72, color: "#10b981" },
              { label: "Good (70-89%)", count: 205, pct: 16, color: "#f59e0b" },
              { label: "Fair (50-69%)", count: 108, pct: 9, color: "#FF7900" },
              { label: "Critical (<50%)", count: 42, pct: 3, color: "#ef4444" },
            ].map((tier) => (
              <div key={tier.label} className="flex items-center gap-2.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="flex-1 text-[14px] text-muted-foreground">{tier.label}</span>
                <span className="text-[14px] font-bold tabular-nums text-foreground">
                  {tier.count}
                </span>
              </div>
            ))}
          </div>

          {/* Mini stats 2x2 grid */}
          <div className="grid w-full grid-cols-2 gap-2.5">
            {HEALTH_MINI_STATS.map((stat) => {
              const isAlert = stat.label === "Critical Alerts" && parseInt(stat.value) > 0;
              return (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-center",
                    isAlert ? "border-red-200 bg-red-50" : "border-border/50 bg-muted/50",
                  )}
                >
                  <p
                    className={cn(
                      "text-[16px] font-bold tabular-nums",
                      isAlert ? "text-red-600" : "text-foreground",
                    )}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
