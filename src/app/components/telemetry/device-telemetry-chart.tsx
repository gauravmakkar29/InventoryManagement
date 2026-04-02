import { useState, useMemo } from "react";
import {
  Thermometer,
  Cpu,
  HardDrive,
  Zap,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import type { TelemetryReading } from "../../../lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TimeRange = "1h" | "6h" | "24h" | "7d";

interface MetricConfig {
  key: keyof TelemetryReading;
  label: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  warningThreshold: number;
  criticalThreshold: number;
  color: string;
}

// ---------------------------------------------------------------------------
// Metric Definitions
// ---------------------------------------------------------------------------
const METRICS: MetricConfig[] = [
  {
    key: "temperature",
    label: "Temperature",
    unit: "\u00B0C",
    icon: Thermometer,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    warningThreshold: 70,
    criticalThreshold: 85,
    color: "#ef4444",
  },
  {
    key: "cpuLoad",
    label: "CPU Load",
    unit: "%",
    icon: Cpu,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    warningThreshold: 80,
    criticalThreshold: 95,
    color: "#3b82f6",
  },
  {
    key: "memoryUsage",
    label: "Memory",
    unit: "%",
    icon: HardDrive,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
    warningThreshold: 80,
    criticalThreshold: 95,
    color: "#8b5cf6",
  },
  {
    key: "errorRate",
    label: "Error Rate",
    unit: "/min",
    icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    warningThreshold: 5,
    criticalThreshold: 10,
    color: "#f59e0b",
  },
  {
    key: "powerOutput",
    label: "Power",
    unit: "W",
    icon: Zap,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    warningThreshold: 4500,
    criticalThreshold: 5000,
    color: "#10b981",
  },
];

const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: "1h", label: "1H" },
  { id: "6h", label: "6H" },
  { id: "24h", label: "24H" },
  { id: "7d", label: "7D" },
];

// ---------------------------------------------------------------------------
// Mock telemetry data generator
// ---------------------------------------------------------------------------
function generateMockTelemetry(range: TimeRange): TelemetryReading[] {
  const now = Date.now();
  const rangeMs: Record<TimeRange, number> = {
    "1h": 3600000,
    "6h": 21600000,
    "24h": 86400000,
    "7d": 604800000,
  };
  const points = range === "7d" ? 168 : range === "24h" ? 96 : range === "6h" ? 72 : 60;
  const interval = rangeMs[range] / points;

  return Array.from({ length: points }, (_, i) => {
    const t = now - rangeMs[range] + i * interval;
    const noise = () => Math.random() * 10 - 5;
    return {
      deviceId: "mock-device",
      temperature: 45 + Math.sin(i / 10) * 15 + noise(),
      cpuLoad: 35 + Math.sin(i / 8) * 25 + noise(),
      memoryUsage: 55 + Math.sin(i / 12) * 15 + noise(),
      networkLatency: 20 + Math.random() * 30,
      errorRate: Math.max(0, 2 + Math.sin(i / 6) * 3 + Math.random() * 2),
      powerOutput: 3200 + Math.sin(i / 15) * 800 + noise() * 50,
      ambientTemperature: 25 + Math.sin(i / 20) * 5,
      humidity: 45 + Math.sin(i / 18) * 10,
      riskScore: 72 + Math.sin(i / 10) * 15,
      lat: 39.74,
      lng: -104.99,
      timestamp: new Date(t).toISOString(),
    };
  });
}

// ---------------------------------------------------------------------------
// Sparkline SVG for metric cards
// ---------------------------------------------------------------------------
function MetricSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 64;
  const h = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Time-series chart (SVG)
// ---------------------------------------------------------------------------
function TimeSeriesChart({
  data,
  activeMetrics,
  metrics,
}: {
  data: TelemetryReading[];
  activeMetrics: Set<string>;
  metrics: MetricConfig[];
}) {
  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 60, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const visibleMetrics = metrics.filter((m) => activeMetrics.has(m.key));

  // Compute y-axis range per metric (normalize all to 0-1 for overlay)
  const paths = visibleMetrics.map((metric) => {
    const values = data.map((d) => d[metric.key] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values
      .map((v, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartW;
        const y = padding.top + chartH - ((v - min) / range) * chartH;
        return `${x},${y}`;
      })
      .join(" ");

    return { metric, points, min, max };
  });

  // X-axis labels
  const xLabels = useMemo(() => {
    if (data.length === 0) return [];
    const count = 6;
    const step = Math.floor(data.length / count);
    return Array.from({ length: count + 1 }, (_, i) => {
      const idx = Math.min(i * step, data.length - 1);
      const d = new Date(data[idx]!.timestamp);
      return {
        x: padding.left + (idx / (data.length - 1)) * chartW,
        label: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
    });
  }, [data, chartW]);

  if (data.length === 0 || visibleMetrics.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-[14px] text-muted-foreground">
        Select a metric to display the chart
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid lines */}
      {Array.from({ length: 5 }, (_, i) => {
        const y = padding.top + (i / 4) * chartH;
        return (
          <line
            key={i}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}

      {/* X-axis labels */}
      {xLabels.map((lbl, i) => (
        <text
          key={i}
          x={lbl.x}
          y={height - 8}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="10"
        >
          {lbl.label}
        </text>
      ))}

      {/* Data lines */}
      {paths.map(({ metric, points }) => (
        <polyline
          key={metric.key}
          fill="none"
          stroke={metric.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          opacity="0.85"
        />
      ))}

      {/* Y-axis labels (first visible metric) */}
      {paths.length > 0 &&
        Array.from({ length: 5 }, (_, i) => {
          const p = paths[0]!;
          const val = p.min + ((4 - i) / 4) * (p.max - p.min);
          const y = padding.top + (i / 4) * chartH;
          return (
            <text
              key={i}
              x={padding.left - 8}
              y={y + 3}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="10"
            >
              {val.toFixed(1)}
            </text>
          );
        })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Threshold indicator
// ---------------------------------------------------------------------------
function getThresholdStatus(
  value: number,
  warning: number,
  critical: number,
): "normal" | "warning" | "critical" {
  // For metrics where higher is worse (temp, cpu, memory, errors)
  if (value >= critical) return "critical";
  if (value >= warning) return "warning";
  return "normal";
}

function getTrend(current: number, previous: number): "up" | "down" | "stable" {
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return "stable";
  return diff > 0 ? "up" : "down";
}

// ---------------------------------------------------------------------------
// DeviceTelemetryChart — Story 13.1
// ---------------------------------------------------------------------------
interface DeviceTelemetryChartProps {
  deviceId: string;
  deviceName?: string;
}

export function DeviceTelemetryChart({ deviceId, deviceName }: DeviceTelemetryChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [activeMetrics, setActiveMetrics] = useState<Set<string>>(
    new Set(["temperature", "cpuLoad"]),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const telemetryData = useMemo(() => generateMockTelemetry(timeRange), [timeRange]);

  const latestReading = telemetryData.length > 0 ? telemetryData[telemetryData.length - 1]! : null;
  const previousReading =
    telemetryData.length > 1 ? telemetryData[telemetryData.length - 2]! : null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (!latestReading) {
    return (
      <div className="card-elevated p-8 text-center">
        <Activity className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-[15px] font-medium text-muted-foreground">No telemetry data available</p>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Telemetry data will appear here once the device begins reporting
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-foreground">Device Telemetry</h3>
          <p className="text-[14px] text-muted-foreground">
            {deviceName ?? deviceId} - Real-time health metrics
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted cursor-pointer",
            isRefreshing && "animate-spin",
          )}
          aria-label="Refresh telemetry"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Metric cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {METRICS.map((metric) => {
          const currentVal = latestReading[metric.key] as number;
          const prevVal = previousReading ? (previousReading[metric.key] as number) : currentVal;
          const status = getThresholdStatus(
            currentVal,
            metric.warningThreshold,
            metric.criticalThreshold,
          );
          const trend = getTrend(currentVal, prevVal);
          const isActive = activeMetrics.has(metric.key);
          const Icon = metric.icon;

          const recentValues = telemetryData.slice(-20).map((d) => d[metric.key] as number);

          return (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              className={cn(
                "card-elevated px-3 py-3 text-left cursor-pointer relative",
                isActive && "ring-2",
                isActive && `ring-[${metric.color}]`,
                status === "critical" && "border-red-300",
              )}
              style={
                isActive
                  ? { borderColor: metric.color, boxShadow: `0 0 0 2px ${metric.color}22` }
                  : undefined
              }
            >
              {/* Critical badge */}
              {status === "critical" && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                  <AlertTriangle className="h-2.5 w-2.5 text-white" />
                </span>
              )}

              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    metric.iconBg,
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", metric.iconColor)} />
                </div>
                <span className="text-[13px] text-muted-foreground truncate">{metric.label}</span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <span
                    className={cn(
                      "text-[18px] font-bold tabular-nums leading-snug",
                      status === "critical"
                        ? "text-red-600"
                        : status === "warning"
                          ? "text-amber-600"
                          : "text-foreground",
                    )}
                  >
                    {currentVal.toFixed(1)}
                  </span>
                  <span className="ml-0.5 text-[13px] text-muted-foreground">{metric.unit}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <MetricSparkline data={recentValues} color={metric.color} />
                  <div className="flex items-center gap-0.5">
                    {trend === "up" ? (
                      <TrendingUp className="h-2.5 w-2.5 text-red-400" />
                    ) : trend === "down" ? (
                      <TrendingDown className="h-2.5 w-2.5 text-emerald-400" />
                    ) : (
                      <Minus className="h-2.5 w-2.5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Time range selector + Chart */}
      <div className="card-elevated">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-1.5">
            {METRICS.filter((m) => activeMetrics.has(m.key)).map((m) => (
              <span
                key={m.key}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium"
                style={{ backgroundColor: `${m.color}15`, color: m.color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.id}
                onClick={() => setTimeRange(tr.id)}
                className={cn(
                  "rounded-md px-3 py-1 text-[13px] font-medium cursor-pointer",
                  timeRange === tr.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3">
          <TimeSeriesChart data={telemetryData} activeMetrics={activeMetrics} metrics={METRICS} />
        </div>
      </div>
    </div>
  );
}
