import { useState, useCallback, useEffect, useRef } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Clock,
  Cpu,
  GitCompare,
  Heart,
  Pause,
  Play,
  Search,
  SkipBack,
  SkipForward,
  Zap,
  X,
  AlertTriangle,
  CheckCircle,
  Save,
} from "lucide-react";
import { cn } from "../../../lib/utils";

// ---------------------------------------------------------------------------
// Types (Story 15.1 - DigitalTwin, HealthFactors, ConfigDriftItem)
// ---------------------------------------------------------------------------
interface HealthFactors {
  firmwareAge: number;
  vulnerabilityExposure: number;
  uptimeScore: number;
  telemetryHealth: number;
  complianceScore: number;
  incidentHistory: number;
}

interface ConfigDriftItem {
  configKey: string;
  expectedValue: string;
  actualValue: string;
  severity: "Critical" | "Warning" | "Info";
  detectedAt: string;
}

interface DigitalTwin {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  currentFirmwareVersion: string;
  currentConfigHash: string;
  healthScore: number;
  healthFactors: HealthFactors;
  uptimePercentage: number;
  configDriftStatus: "InSync" | "Drifted" | "Unknown";
  configDriftDetails: ConfigDriftItem[];
  lastSyncedAt: string;
  healthDelta: number;
}

// Story 15.2 types
interface TwinStateSnapshot {
  id: string;
  timestamp: string;
  firmwareVersion: string;
  configHash: string;
  healthScore: number;
  healthFactors: HealthFactors;
  status: string;
  telemetrySummary: {
    avgTemperature: number;
    avgCpuLoad: number;
    avgErrorRate: number;
  };
  triggeredBy: "scheduled" | "event" | "manual";
  event?: string;
}

// Story 15.3 types
interface FirmwareSimulationResult {
  id: string;
  deviceId: string;
  currentFirmwareVersion: string;
  targetFirmwareVersion: string;
  compatibilityStatus: "Compatible" | "Incompatible" | "CompatibleWithWarnings";
  warnings: string[];
  predictedHealthScoreChange: number;
  predictedDowntimeMinutes: number;
  rollbackRisk: "Low" | "Medium" | "High";
  newVulnerabilities: { cveId: string; severity: string; component: string }[];
  resolvedVulnerabilities: { cveId: string; severity: string; component: string }[];
  simulatedAt: string;
}

type HealthBucket = "all" | "critical" | "warning" | "healthy";
type SortField = "healthScore" | "deviceName" | "lastSyncedAt";
type TimeRange = "7d" | "30d" | "90d" | "180d";

// ---------------------------------------------------------------------------
// Health Score Computation (Tech Spec Section 3)
// ---------------------------------------------------------------------------
function computeHealthScore(factors: HealthFactors): number {
  const weights = {
    firmwareAge: 0.15,
    vulnerabilityExposure: 0.25,
    uptimeScore: 0.15,
    telemetryHealth: 0.2,
    complianceScore: 0.1,
    incidentHistory: 0.15,
  };
  return Math.round(
    Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + factors[key as keyof HealthFactors] * weight,
      0,
    ),
  );
}

function getHealthBucket(score: number): "critical" | "warning" | "healthy" {
  if (score <= 40) return "critical";
  if (score <= 70) return "warning";
  return "healthy";
}

function getHealthColor(score: number): string {
  if (score <= 40) return "#ef4444";
  if (score <= 70) return "#f59e0b";
  return "#10b981";
}

function getHealthLabel(score: number): string {
  if (score <= 40) return "Critical";
  if (score <= 70) return "Warning";
  return "Healthy";
}

// ---------------------------------------------------------------------------
// Mock Data (Story 15.1)
// ---------------------------------------------------------------------------
function generateMockTwins(): DigitalTwin[] {
  const models = ["SG-3600", "SG-5000", "SG-8000", "SG-2200", "SG-1100"];
  const locations = ["Shanghai HQ", "Denver DC", "Munich Office", "Singapore Lab", "Sao Paulo"];
  const firmwares = ["v4.1.2", "v4.0.8", "v3.9.5", "v4.2.0-rc1", "v3.8.2"];

  return Array.from({ length: 24 }, (_, i) => {
    const factors: HealthFactors = {
      firmwareAge: Math.floor(Math.random() * 40 + 60),
      vulnerabilityExposure: Math.floor(Math.random() * 50 + 50),
      uptimeScore: Math.floor(Math.random() * 30 + 70),
      telemetryHealth: Math.floor(Math.random() * 40 + 60),
      complianceScore: Math.floor(Math.random() * 50 + 50),
      incidentHistory: Math.floor(Math.random() * 40 + 60),
    };
    // Override some to create variety in health buckets
    if (i < 3) {
      factors.vulnerabilityExposure = Math.floor(Math.random() * 20 + 10);
      factors.telemetryHealth = Math.floor(Math.random() * 20 + 15);
      factors.incidentHistory = Math.floor(Math.random() * 20 + 10);
    } else if (i < 8) {
      factors.firmwareAge = Math.floor(Math.random() * 20 + 40);
      factors.complianceScore = Math.floor(Math.random() * 20 + 35);
    }

    const healthScore = computeHealthScore(factors);
    const driftItems: ConfigDriftItem[] =
      i % 3 === 0
        ? [
            {
              configKey: "network.dns.primary",
              expectedValue: "10.0.1.1",
              actualValue: "8.8.8.8",
              severity: "Warning",
              detectedAt: "2026-03-28T14:30:00Z",
            },
            {
              configKey: "security.tls.version",
              expectedValue: "1.3",
              actualValue: "1.2",
              severity: "Critical",
              detectedAt: "2026-03-27T09:15:00Z",
            },
          ]
        : [];

    return {
      deviceId: `DEV-${String(i + 1).padStart(4, "0")}`,
      deviceName: `${locations[i % locations.length]}-${models[i % models.length]}-${String(i + 1).padStart(3, "0")}`,
      deviceModel: models[i % models.length]!,
      currentFirmwareVersion: firmwares[i % firmwares.length]!,
      currentConfigHash: `sha256:${Math.random().toString(36).slice(2, 14)}`,
      healthScore,
      healthFactors: factors,
      uptimePercentage: parseFloat((95 + Math.random() * 5).toFixed(1)),
      configDriftStatus: driftItems.length > 0 ? "Drifted" : i % 5 === 4 ? "Unknown" : "InSync",
      configDriftDetails: driftItems,
      lastSyncedAt: new Date(Date.now() - Math.random() * 3600000 * 4).toISOString(),
      healthDelta: Math.floor(Math.random() * 20 - 5),
    };
  });
}

// Story 15.2 - Mock health trend data
function generateHealthTrend(days: number): { date: string; score: number; event?: string }[] {
  const points: { date: string; score: number; event?: string }[] = [];
  let score = 72;
  const events = [
    "Firmware updated",
    "Incident created",
    "Config changed",
    "Compliance review",
    "Telemetry spike",
  ];
  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    score = Math.max(15, Math.min(100, score + Math.floor(Math.random() * 12 - 5)));
    const event =
      Math.random() > 0.85 ? events[Math.floor(Math.random() * events.length)] : undefined;
    points.push({
      date: date.toISOString().split("T")[0]!,
      score,
      event,
    });
  }
  return points;
}

// Story 15.2 - Mock snapshots
function generateSnapshots(): TwinStateSnapshot[] {
  const firmwares = ["v4.0.8", "v4.1.0", "v4.1.2"];
  return Array.from({ length: 8 }, (_, i) => {
    const factors: HealthFactors = {
      firmwareAge: 60 + i * 4,
      vulnerabilityExposure: 55 + i * 3,
      uptimeScore: 70 + i * 2,
      telemetryHealth: 65 + i * 3,
      complianceScore: 50 + i * 5,
      incidentHistory: 60 + i * 4,
    };
    return {
      id: `SNAP-${i + 1}`,
      timestamp: new Date(Date.now() - (7 - i) * 86400000 * 3).toISOString(),
      firmwareVersion: firmwares[Math.min(i, firmwares.length - 1)]!,
      configHash: `sha256:${Math.random().toString(36).slice(2, 14)}`,
      healthScore: computeHealthScore(factors),
      healthFactors: factors,
      status: i < 2 ? "degraded" : "operational",
      telemetrySummary: {
        avgTemperature: 42 + Math.random() * 15,
        avgCpuLoad: 30 + Math.random() * 40,
        avgErrorRate: Math.random() * 2,
      },
      triggeredBy: i % 3 === 0 ? "event" : i % 3 === 1 ? "manual" : "scheduled",
      event:
        i === 3 ? "Firmware updated to v4.1.2" : i === 5 ? "Incident INC-042 created" : undefined,
    };
  });
}

// Story 15.3 - Mock firmware versions
const AVAILABLE_FIRMWARES = [
  { version: "v4.2.0", model: "SG-3600", releaseDate: "2026-03-15" },
  { version: "v4.1.3-hotfix", model: "SG-3600", releaseDate: "2026-03-10" },
  { version: "v4.2.0", model: "SG-5000", releaseDate: "2026-03-15" },
  { version: "v4.1.5", model: "SG-5000", releaseDate: "2026-03-01" },
  { version: "v4.2.0", model: "SG-8000", releaseDate: "2026-03-15" },
  { version: "v3.9.8-patch", model: "SG-2200", releaseDate: "2026-02-28" },
  { version: "v4.0.0", model: "SG-1100", releaseDate: "2026-03-20" },
];

const MOCK_TWINS = generateMockTwins();

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

// Story 15.1 — Circular Health Score Gauge
function HealthScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = size > 60 ? 8 : 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getHealthColor(score);

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f1f3f5"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-500"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-gray-900 font-bold"
        style={{ fontSize: size > 60 ? 18 : 14 }}
      >
        {score}
      </text>
    </svg>
  );
}

// Story 15.1 — Health Factors Breakdown bars
function HealthFactorsBreakdown({ factors }: { factors: HealthFactors }) {
  const factorList: { key: keyof HealthFactors; label: string; weight: number }[] = [
    { key: "firmwareAge", label: "Firmware Age", weight: 0.15 },
    { key: "vulnerabilityExposure", label: "Vulnerability Exposure", weight: 0.25 },
    { key: "uptimeScore", label: "Uptime", weight: 0.15 },
    { key: "telemetryHealth", label: "Telemetry Health", weight: 0.2 },
    { key: "complianceScore", label: "Compliance", weight: 0.1 },
    { key: "incidentHistory", label: "Incident History", weight: 0.15 },
  ];

  return (
    <div className="space-y-2">
      {factorList.map((f) => {
        const value = factors[f.key];
        const color = getHealthColor(value);
        return (
          <div key={f.key} className="flex items-center gap-2">
            <span className="w-[130px] truncate text-[13px] text-gray-500">{f.label}</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${value}%`, backgroundColor: color }}
              />
            </div>
            <span className="w-8 text-right text-[13px] font-semibold tabular-nums text-gray-700">
              {value}
            </span>
            <span className="text-[12px] text-gray-500">({Math.round(f.weight * 100)}%)</span>
          </div>
        );
      })}
    </div>
  );
}

// Story 15.2 — SVG Health Trend Line Chart
function HealthTrendChart({
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
              className="text-[12px] fill-gray-400"
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
            className="text-[12px] fill-gray-400"
          >
            {p.date.slice(5)}
          </text>
        ))}
    </svg>
  );
}

// Story 15.2 — State Replay Timeline
function StateReplayTimeline({
  snapshots,
  selectedIds,
  activeId,
  onSelect,
}: {
  snapshots: TwinStateSnapshot[];
  selectedIds: string[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative px-4 py-3">
      {/* Timeline bar */}
      <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gray-200 -translate-y-1/2" />
      <div className="flex justify-between relative z-10">
        {snapshots.map((snap) => {
          const isActive = activeId === snap.id;
          const isSelected = selectedIds.includes(snap.id);
          return (
            <button
              key={snap.id}
              onClick={() => onSelect(snap.id)}
              className={cn(
                "flex flex-col items-center gap-1 cursor-pointer group",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900]",
              )}
              title={new Date(snap.timestamp).toLocaleString()}
            >
              <div
                className={cn(
                  "rounded-full border-2 transition-all",
                  isActive
                    ? "h-4 w-4 border-[#FF7900] bg-[#FF7900]"
                    : isSelected
                      ? "h-3.5 w-3.5 border-[#FF7900] bg-orange-100"
                      : "h-3 w-3 border-gray-300 bg-white group-hover:border-[#FF7900]",
                )}
              />
              <span className="text-[11px] text-gray-500 tabular-nums">
                {new Date(snap.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Story 15.2 — State Snapshot Card
function StateSnapshotCard({ snapshot }: { snapshot: TwinStateSnapshot }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] font-semibold text-gray-900">
          State at {new Date(snapshot.timestamp).toLocaleString()}
        </h4>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[12px] font-medium",
            snapshot.triggeredBy === "event"
              ? "bg-orange-50 text-[#FF7900]"
              : snapshot.triggeredBy === "manual"
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-100 text-gray-600",
          )}
        >
          {snapshot.triggeredBy}
        </span>
      </div>
      {snapshot.event && (
        <div className="flex items-center gap-1.5 text-[13px] text-[#FF7900] font-medium">
          <Zap className="h-3 w-3" />
          {snapshot.event}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-[14px]">
        <div>
          <p className="text-gray-500">Firmware</p>
          <p className="font-medium text-gray-700">{snapshot.firmwareVersion}</p>
        </div>
        <div>
          <p className="text-gray-500">Health Score</p>
          <p className="font-medium" style={{ color: getHealthColor(snapshot.healthScore) }}>
            {snapshot.healthScore}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <p className="font-medium text-gray-700 capitalize">{snapshot.status}</p>
        </div>
        <div>
          <p className="text-gray-500">Config Hash</p>
          <p className="font-mono text-gray-500 truncate">{snapshot.configHash.slice(0, 16)}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2 text-center">
          <p className="text-[15px] font-bold tabular-nums text-gray-900">
            {snapshot.telemetrySummary.avgTemperature.toFixed(1)}
          </p>
          <p className="text-[12px] text-gray-500">Avg Temp</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2 text-center">
          <p className="text-[15px] font-bold tabular-nums text-gray-900">
            {snapshot.telemetrySummary.avgCpuLoad.toFixed(1)}%
          </p>
          <p className="text-[12px] text-gray-500">CPU Load</p>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2 text-center">
          <p className="text-[15px] font-bold tabular-nums text-gray-900">
            {snapshot.telemetrySummary.avgErrorRate.toFixed(2)}%
          </p>
          <p className="text-[12px] text-gray-500">Error Rate</p>
        </div>
      </div>
    </div>
  );
}

// Story 15.2 — State Comparison View
function StateComparisonView({
  left,
  right,
  onClose,
}: {
  left: TwinStateSnapshot;
  right: TwinStateSnapshot;
  onClose: () => void;
}) {
  const fields: { label: string; getLeft: () => string; getRight: () => string }[] = [
    {
      label: "Firmware",
      getLeft: () => left.firmwareVersion,
      getRight: () => right.firmwareVersion,
    },
    {
      label: "Health Score",
      getLeft: () => String(left.healthScore),
      getRight: () => String(right.healthScore),
    },
    { label: "Status", getLeft: () => left.status, getRight: () => right.status },
    { label: "Config Hash", getLeft: () => left.configHash, getRight: () => right.configHash },
    {
      label: "Avg Temp",
      getLeft: () => left.telemetrySummary.avgTemperature.toFixed(1),
      getRight: () => right.telemetrySummary.avgTemperature.toFixed(1),
    },
    {
      label: "CPU Load",
      getLeft: () => left.telemetrySummary.avgCpuLoad.toFixed(1) + "%",
      getRight: () => right.telemetrySummary.avgCpuLoad.toFixed(1) + "%",
    },
    {
      label: "Error Rate",
      getLeft: () => left.telemetrySummary.avgErrorRate.toFixed(2) + "%",
      getRight: () => right.telemetrySummary.avgErrorRate.toFixed(2) + "%",
    },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] font-semibold text-gray-900">State Comparison</h4>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-600 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-[120px_1fr_1fr] gap-y-1.5 text-[14px]">
        <div className="font-semibold text-gray-500 text-[12px] uppercase">Field</div>
        <div className="font-semibold text-gray-500 text-[12px] uppercase">
          {new Date(left.timestamp).toLocaleDateString()}
        </div>
        <div className="font-semibold text-gray-500 text-[12px] uppercase">
          {new Date(right.timestamp).toLocaleDateString()}
        </div>
        {fields.map((f) => {
          const l = f.getLeft();
          const r = f.getRight();
          const changed = l !== r;
          const numL = parseFloat(l);
          const numR = parseFloat(r);
          const improved = !isNaN(numL) && !isNaN(numR) && numR > numL;
          return (
            <div key={f.label} className="contents">
              <span className="text-gray-500 font-medium">{f.label}</span>
              <span className={cn("font-mono", changed ? "bg-red-50 px-1 rounded" : "")}>{l}</span>
              <span
                className={cn(
                  "font-mono",
                  changed ? (improved ? "bg-green-50" : "bg-red-50") + " px-1 rounded" : "",
                )}
              >
                {r}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Story 15.3 — Firmware Simulation Dialog
function FirmwareSimulationDialog({ twin, onClose }: { twin: DigitalTwin; onClose: () => void }) {
  const [targetVersion, setTargetVersion] = useState("");
  const [result, setResult] = useState<FirmwareSimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState<FirmwareSimulationResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const compatibleFirmwares = AVAILABLE_FIRMWARES.filter(
    (fw) => fw.model === twin.deviceModel && fw.version !== twin.currentFirmwareVersion,
  );

  const runSimulation = useCallback(() => {
    if (!targetVersion) return;
    setSimulating(true);
    // Simulate async
    setTimeout(() => {
      const isIncompatible = !compatibleFirmwares.some((fw) => fw.version === targetVersion);
      const sim: FirmwareSimulationResult = isIncompatible
        ? {
            id: `FWSIM-${Date.now()}`,
            deviceId: twin.deviceId,
            currentFirmwareVersion: twin.currentFirmwareVersion,
            targetFirmwareVersion: targetVersion,
            compatibilityStatus: "Incompatible",
            warnings: ["Device model mismatch — target firmware not supported"],
            predictedHealthScoreChange: 0,
            predictedDowntimeMinutes: 0,
            rollbackRisk: "High",
            newVulnerabilities: [],
            resolvedVulnerabilities: [],
            simulatedAt: new Date().toISOString(),
          }
        : {
            id: `FWSIM-${Date.now()}`,
            deviceId: twin.deviceId,
            currentFirmwareVersion: twin.currentFirmwareVersion,
            targetFirmwareVersion: targetVersion,
            compatibilityStatus: Math.random() > 0.3 ? "Compatible" : "CompatibleWithWarnings",
            warnings:
              Math.random() > 0.5
                ? ["Config key network.dns.primary deprecated in target version"]
                : [],
            predictedHealthScoreChange: Math.floor(Math.random() * 20 - 3),
            predictedDowntimeMinutes: Math.floor(Math.random() * 15 + 3),
            rollbackRisk: Math.random() > 0.6 ? "Low" : Math.random() > 0.3 ? "Medium" : "High",
            newVulnerabilities:
              Math.random() > 0.6
                ? [{ cveId: "CVE-2026-4521", severity: "Medium", component: "openssl" }]
                : [],
            resolvedVulnerabilities: [
              { cveId: "CVE-2026-1234", severity: "Critical", component: "kernel" },
              { cveId: "CVE-2026-2891", severity: "High", component: "busybox" },
            ],
            simulatedAt: new Date().toISOString(),
          };
      setResult(sim);
      setSimulating(false);
    }, 1200);
  }, [targetVersion, twin, compatibleFirmwares]);

  const saveSimulation = useCallback(() => {
    if (result) {
      setSavedSimulations((prev) => [result, ...prev]);
    }
  }, [result]);

  const compatBadge = (status: FirmwareSimulationResult["compatibilityStatus"]) => {
    if (status === "Compatible") return "bg-emerald-50 text-emerald-700";
    if (status === "CompatibleWithWarnings") return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
  };

  const riskBadge = (risk: string) => {
    if (risk === "Low") return "bg-emerald-50 text-emerald-700";
    if (risk === "Medium") return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[680px] max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900">Firmware Upgrade Simulation</h3>
            <p className="text-[14px] text-gray-500 mt-0.5">{twin.deviceName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!result ? (
          <div className="p-6 space-y-5">
            {/* Current firmware */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-[12px] font-semibold uppercase text-gray-500 mb-2">
                Current Firmware
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200">
                  <Cpu className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-gray-900">
                    {twin.currentFirmwareVersion}
                  </p>
                  <p className="text-[13px] text-gray-500">{twin.deviceModel}</p>
                </div>
              </div>
            </div>

            {/* Target selector */}
            <div>
              <label className="text-[14px] font-medium text-gray-700 mb-1.5 block">
                Target Firmware
              </label>
              <select
                value={targetVersion}
                onChange={(e) => setTargetVersion(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-gray-700 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none"
              >
                <option value="">Select target version...</option>
                {compatibleFirmwares.map((fw) => (
                  <option key={fw.version} value={fw.version}>
                    {fw.version} ({fw.releaseDate})
                  </option>
                ))}
              </select>
              {compatibleFirmwares.length === 0 && (
                <p className="mt-1.5 text-[13px] text-amber-600">
                  No compatible firmware versions available for this model.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-[14px] font-medium text-[#FF7900] hover:underline cursor-pointer"
              >
                {showHistory ? "Hide" : "View"} Simulation History ({savedSimulations.length})
              </button>
              <button
                onClick={runSimulation}
                disabled={!targetVersion || simulating}
                className={cn(
                  "rounded-lg px-5 py-2.5 text-[14px] font-semibold text-white cursor-pointer",
                  targetVersion
                    ? "bg-[#FF7900] hover:bg-[#e66d00]"
                    : "bg-gray-300 cursor-not-allowed",
                )}
              >
                {simulating ? "Simulating..." : "Run Simulation"}
              </button>
            </div>

            {/* Simulation History */}
            {showHistory && savedSimulations.length > 0 && (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-[14px]">
                  <caption className="sr-only">Digital twin simulation history</caption>
                  <thead>
                    <tr className="bg-[#f1f3f5] border-b-2 border-gray-200">
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-bold uppercase text-[12px] text-gray-600"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-bold uppercase text-[12px] text-gray-600"
                      >
                        Target FW
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-bold uppercase text-[12px] text-gray-600"
                      >
                        Compat.
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-bold uppercase text-[12px] text-gray-600"
                      >
                        Health Delta
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedSimulations.map((sim) => (
                      <tr key={sim.id} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-gray-500">
                          {new Date(sim.simulatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-700">
                          {sim.targetFirmwareVersion}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[12px] font-medium",
                              compatBadge(sim.compatibilityStatus),
                            )}
                          >
                            {sim.compatibilityStatus === "CompatibleWithWarnings"
                              ? "Warnings"
                              : sim.compatibilityStatus}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">
                          <span
                            className={
                              sim.predictedHealthScoreChange >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }
                          >
                            {sim.predictedHealthScoreChange >= 0 ? "+" : ""}
                            {sim.predictedHealthScoreChange}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Results */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setResult(null)}
                className="text-[14px] font-medium text-gray-500 hover:text-gray-700 cursor-pointer flex items-center gap-1"
              >
                <SkipBack className="h-3 w-3" /> Back
              </button>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[13px] font-semibold",
                  compatBadge(result.compatibilityStatus),
                )}
              >
                {result.compatibilityStatus === "CompatibleWithWarnings"
                  ? "Compatible with Warnings"
                  : result.compatibilityStatus}
              </span>
            </div>

            {/* Health Delta large display */}
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="text-center">
                <p className="text-[13px] text-gray-500 mb-1">Health Score Change</p>
                <div className="flex items-center gap-2">
                  {result.predictedHealthScoreChange >= 0 ? (
                    <ArrowUp className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <ArrowDown className="h-6 w-6 text-red-500" />
                  )}
                  <span
                    className={cn(
                      "text-[32px] font-bold tabular-nums",
                      result.predictedHealthScoreChange >= 0 ? "text-emerald-600" : "text-red-600",
                    )}
                  >
                    {result.predictedHealthScoreChange >= 0 ? "+" : ""}
                    {result.predictedHealthScoreChange}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
                <p className="text-[15px] font-bold text-gray-900 tabular-nums">
                  {result.predictedDowntimeMinutes}m
                </p>
                <p className="text-[12px] text-gray-500">Est. Downtime</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
                <span
                  className={cn(
                    "text-[14px] font-bold",
                    riskBadge(result.rollbackRisk).includes("emerald")
                      ? "text-emerald-700"
                      : riskBadge(result.rollbackRisk).includes("amber")
                        ? "text-amber-700"
                        : "text-red-700",
                  )}
                >
                  {result.rollbackRisk}
                </span>
                <p className="text-[12px] text-gray-500">Rollback Risk</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-center">
                <p className="text-[15px] font-bold text-gray-900">
                  {result.targetFirmwareVersion}
                </p>
                <p className="text-[12px] text-gray-500">Target FW</p>
              </div>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1.5">
                <p className="text-[13px] font-semibold text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Warnings
                </p>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-[14px] text-amber-700 pl-5">
                    {w}
                  </p>
                ))}
              </div>
            )}

            {/* Vulnerabilities */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[13px] font-semibold text-emerald-800 mb-2 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Resolved (
                  {result.resolvedVulnerabilities.length})
                </p>
                {result.resolvedVulnerabilities.map((v) => (
                  <div
                    key={v.cveId}
                    className="flex items-center justify-between text-[13px] py-0.5"
                  >
                    <span className="font-mono text-emerald-700">{v.cveId}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[12px] font-semibold",
                        v.severity === "Critical"
                          ? "bg-red-100 text-red-700"
                          : v.severity === "High"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700",
                      )}
                    >
                      {v.severity}
                    </span>
                  </div>
                ))}
                {result.resolvedVulnerabilities.length === 0 && (
                  <p className="text-[13px] text-emerald-600">None</p>
                )}
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-[13px] font-semibold text-red-800 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Introduced (
                  {result.newVulnerabilities.length})
                </p>
                {result.newVulnerabilities.map((v) => (
                  <div
                    key={v.cveId}
                    className="flex items-center justify-between text-[13px] py-0.5"
                  >
                    <span className="font-mono text-red-700">{v.cveId}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[12px] font-semibold",
                        v.severity === "Critical"
                          ? "bg-red-100 text-red-700"
                          : v.severity === "High"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700",
                      )}
                    >
                      {v.severity}
                    </span>
                  </div>
                ))}
                {result.newVulnerabilities.length === 0 && (
                  <p className="text-[13px] text-red-600">None</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={saveSimulation}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-[14px] font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" /> Save Simulation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Story 15.4 — Config Drift Panel
function ConfigDriftPanel({ twin, onClose }: { twin: DigitalTwin; onClose: () => void }) {
  const [selectedItem, setSelectedItem] = useState<ConfigDriftItem | null>(null);

  const severityBorder = (s: string) => {
    if (s === "Critical") return "border-l-red-500";
    if (s === "Warning") return "border-l-amber-500";
    return "border-l-blue-500";
  };

  const severityBadge = (s: string) => {
    if (s === "Critical") return "bg-red-50 text-red-700";
    if (s === "Warning") return "bg-amber-50 text-amber-700";
    return "bg-blue-50 text-blue-700";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[15px] font-semibold text-gray-900">Configuration Drift Analysis</h4>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-600 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      {twin.configDriftDetails.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle className="h-8 w-8 text-emerald-400 mb-2" />
          <p className="text-[15px] font-medium text-gray-700">Configuration In Sync</p>
          <p className="text-[14px] text-gray-500 mt-1">
            All config keys match the golden baseline
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {twin.configDriftDetails.map((item) => (
            <div
              key={item.configKey}
              className={cn(
                "rounded-lg border border-gray-200 border-l-4 bg-white p-3 cursor-pointer hover:shadow-sm",
                severityBorder(item.severity),
              )}
              onClick={() =>
                setSelectedItem(selectedItem?.configKey === item.configKey ? null : item)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <code className="text-[14px] font-mono font-semibold text-gray-800">
                    {item.configKey}
                  </code>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[12px] font-semibold",
                      severityBadge(item.severity),
                    )}
                  >
                    {item.severity}
                  </span>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-gray-500 transition-transform",
                    selectedItem?.configKey === item.configKey && "rotate-90",
                  )}
                />
              </div>
              <p className="text-[13px] text-gray-500 mt-1">
                Detected {new Date(item.detectedAt).toLocaleDateString()}
              </p>

              {selectedItem?.configKey === item.configKey && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
                    <p className="text-[12px] font-semibold text-emerald-700 mb-1">Expected</p>
                    <code className="text-[14px] font-mono text-emerald-800">
                      {item.expectedValue}
                    </code>
                  </div>
                  <div className="rounded-lg bg-red-50 border border-red-200 p-2.5">
                    <p className="text-[12px] font-semibold text-red-700 mb-1">Actual</p>
                    <code className="text-[14px] font-mono text-red-800">{item.actualValue}</code>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Story 15.5 — Fleet Health Summary Cards
function FleetHealthSummary({ twins }: { twins: DigitalTwin[] }) {
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
            <p className="text-[14px] text-gray-500">Fleet Avg Health</p>
            <p className="text-[22px] font-bold leading-snug text-gray-900 tabular-nums">
              {avgScore}
            </p>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-50 px-1.5 py-0.5 text-[12px] font-semibold text-[#FF7900]">
              Twin
            </span>
          </div>
        </div>
      </div>

      {/* Distribution Bar Chart (Story 15.5 AC2) */}
      <div className="card-elevated px-4 py-3.5">
        <p className="text-[12px] font-semibold uppercase text-gray-500 mb-2">
          Health Distribution
        </p>
        <div className="flex items-end gap-3 h-[48px]">
          <div className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-t"
              style={{
                height: `${(critical / maxBucket) * 40}px`,
                backgroundColor: "#ef4444",
                minHeight: critical > 0 ? 4 : 0,
              }}
            />
            <span className="text-[12px] text-gray-500">Crit</span>
            <span className="text-[14px] font-bold tabular-nums text-gray-700">{critical}</span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-t"
              style={{
                height: `${(warning / maxBucket) * 40}px`,
                backgroundColor: "#f59e0b",
                minHeight: warning > 0 ? 4 : 0,
              }}
            />
            <span className="text-[12px] text-gray-500">Warn</span>
            <span className="text-[14px] font-bold tabular-nums text-gray-700">{warning}</span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <div
              className="w-full rounded-t"
              style={{
                height: `${(healthy / maxBucket) * 40}px`,
                backgroundColor: "#10b981",
                minHeight: healthy > 0 ? 4 : 0,
              }}
            />
            <span className="text-[12px] text-gray-500">OK</span>
            <span className="text-[14px] font-bold tabular-nums text-gray-700">{healthy}</span>
          </div>
        </div>
      </div>

      {/* Radar Chart (Story 15.5 AC3) */}
      <div className="card-elevated px-4 py-3.5">
        <p className="text-[12px] font-semibold uppercase text-gray-500 mb-1">Factor Analysis</p>
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
                <text x={lx} y={ly + 3} textAnchor="middle" className="text-[10px] fill-gray-400">
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
        <p className="text-[12px] font-semibold uppercase text-gray-500 mb-2">Config Status</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-gray-500">In Sync</span>
            <span className="text-[15px] font-bold tabular-nums text-emerald-600">
              {twins.filter((t) => t.configDriftStatus === "InSync").length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-gray-500">Drifted</span>
            <span className="text-[15px] font-bold tabular-nums text-amber-600">{drifted}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-gray-500">Unknown</span>
            <span className="text-[15px] font-bold tabular-nums text-gray-500">
              {twins.filter((t) => t.configDriftStatus === "Unknown").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Twin Detail View (combines stories 15.1, 15.2, 15.3, 15.4)
// ---------------------------------------------------------------------------
function TwinDetailView({ twin, onBack }: { twin: DigitalTwin; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "trend" | "replay" | "simulate" | "drift"
  >("overview");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [tooltip, setTooltip] = useState<{
    point: { date: string; score: number; event?: string };
    x: number;
    y: number;
  } | null>(null);
  const [showSimDialog, setShowSimDialog] = useState(false);

  // Story 15.2
  const trendData = generateHealthTrend(
    timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 180,
  );
  const snapshots = generateSnapshots();
  const [selectedSnapIds, setSelectedSnapIds] = useState<string[]>([]);
  const [activeSnapId, setActiveSnapId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSnapshot = snapshots.find((s) => s.id === activeSnapId);

  const handleSnapSelect = useCallback((id: string) => {
    setActiveSnapId(id);
    setSelectedSnapIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1]!, id];
      return [...prev, id];
    });
  }, []);

  // Playback
  useEffect(() => {
    if (isPlaying) {
      let idx = snapshots.findIndex((s) => s.id === activeSnapId);
      playIntervalRef.current = setInterval(() => {
        idx = (idx + 1) % snapshots.length;
        setActiveSnapId(snapshots[idx]!.id);
      }, 2000);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, activeSnapId, snapshots]);

  const handlePointHover = useCallback(
    (point: { date: string; score: number; event?: string } | null, x: number, y: number) => {
      if (point) setTooltip({ point, x, y });
      else setTooltip(null);
    },
    [],
  );

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Heart },
    { id: "trend" as const, label: "Health Trend", icon: Activity },
    { id: "replay" as const, label: "State Replay", icon: Clock },
    { id: "simulate" as const, label: "Simulate Upgrade", icon: Zap },
    { id: "drift" as const, label: "Config Drift", icon: GitCompare },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900">{twin.deviceName}</h2>
          <p className="text-[14px] text-gray-500">
            {twin.deviceModel} &middot; {twin.currentFirmwareVersion} &middot; Last synced{" "}
            {new Date(twin.lastSyncedAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[13px] font-semibold",
              twin.configDriftStatus === "InSync"
                ? "bg-emerald-50 text-emerald-700"
                : twin.configDriftStatus === "Drifted"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-gray-100 text-gray-500",
            )}
          >
            {twin.configDriftStatus === "InSync" ? "In Sync" : twin.configDriftStatus}
          </span>
          {Math.abs(twin.healthDelta) > 10 && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[12px] font-bold tabular-nums",
                twin.healthDelta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
              )}
            >
              {twin.healthDelta > 0 ? "+" : ""}
              {twin.healthDelta}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-medium border-b-2 cursor-pointer transition-colors",
                activeTab === tab.id
                  ? "border-[#FF7900] text-[#FF7900]"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Health Gauge */}
          <div className="card-elevated p-5 flex flex-col items-center">
            <HealthScoreGauge score={twin.healthScore} size={120} />
            <p
              className="mt-2 text-[15px] font-semibold"
              style={{ color: getHealthColor(twin.healthScore) }}
            >
              {getHealthLabel(twin.healthScore)}
            </p>
            <p className="text-[13px] text-gray-500">Composite Health Score</p>
          </div>
          {/* Factors Breakdown */}
          <div className="card-elevated p-5">
            <h4 className="text-[14px] font-semibold text-gray-900 mb-3">Health Factors</h4>
            <HealthFactorsBreakdown factors={twin.healthFactors} />
          </div>
        </div>
      )}

      {activeTab === "trend" && (
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[15px] font-semibold text-gray-900">Health Score Trend</h4>
            <div className="flex gap-1">
              {(["7d", "30d", "90d", "180d"] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[13px] font-medium cursor-pointer",
                    timeRange === r
                      ? "bg-[#FF7900] text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <HealthTrendChart data={trendData} onPointHover={handlePointHover} />
            {tooltip && (
              <div
                className="fixed z-50 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-[13px]"
                style={{ left: tooltip.x + 10, top: tooltip.y - 50 }}
              >
                <p className="font-semibold text-gray-900">{tooltip.point.score}</p>
                <p className="text-gray-500">{tooltip.point.date}</p>
                {tooltip.point.event && (
                  <p className="text-[#FF7900] font-medium mt-0.5">{tooltip.point.event}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "replay" && (
        <div className="card-elevated p-5 space-y-4">
          <h4 className="text-[15px] font-semibold text-gray-900">State Replay</h4>
          <StateReplayTimeline
            snapshots={snapshots}
            selectedIds={selectedSnapIds}
            activeId={activeSnapId}
            onSelect={handleSnapSelect}
          />
          {/* Playback controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                const idx = snapshots.findIndex((s) => s.id === activeSnapId);
                if (idx > 0) setActiveSnapId(snapshots[idx - 1]!.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF7900] text-white hover:bg-[#e66d00] cursor-pointer"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <button
              onClick={() => {
                const idx = snapshots.findIndex((s) => s.id === activeSnapId);
                if (idx < snapshots.length - 1) setActiveSnapId(snapshots[idx + 1]!.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <div className="ml-4">
              <button
                onClick={() => setShowComparison(true)}
                disabled={selectedSnapIds.length < 2}
                title={
                  selectedSnapIds.length < 2
                    ? "Need at least 2 snapshots to compare"
                    : "Compare selected snapshots"
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-[14px] font-medium cursor-pointer",
                  selectedSnapIds.length >= 2
                    ? "bg-[#FF7900] text-white hover:bg-[#e66d00]"
                    : "bg-gray-100 text-gray-500 cursor-not-allowed",
                )}
              >
                <GitCompare className="h-3.5 w-3.5" /> Compare
              </button>
            </div>
          </div>
          {activeSnapshot && <StateSnapshotCard snapshot={activeSnapshot} />}
          {showComparison && selectedSnapIds.length >= 2 && (
            <StateComparisonView
              left={snapshots.find((s) => s.id === selectedSnapIds[0])!}
              right={snapshots.find((s) => s.id === selectedSnapIds[1])!}
              onClose={() => setShowComparison(false)}
            />
          )}
        </div>
      )}

      {activeTab === "simulate" && (
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[15px] font-semibold text-gray-900">Firmware Upgrade Simulation</h4>
            <button
              onClick={() => setShowSimDialog(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#FF7900] px-4 py-2 text-[14px] font-semibold text-white hover:bg-[#e66d00] cursor-pointer"
            >
              <Zap className="h-4 w-4" /> Simulate Upgrade
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 flex flex-col items-center">
            <Cpu className="h-10 w-10 text-gray-500 mb-3" />
            <p className="text-[15px] font-medium text-gray-600">
              Run a firmware upgrade simulation
            </p>
            <p className="text-[14px] text-gray-500 mt-1">
              Preview health score impact, vulnerabilities, and rollback risk before deploying
            </p>
          </div>
          {showSimDialog && (
            <FirmwareSimulationDialog twin={twin} onClose={() => setShowSimDialog(false)} />
          )}
        </div>
      )}

      {activeTab === "drift" && (
        <div className="card-elevated p-5">
          <ConfigDriftPanel twin={twin} onClose={onBack} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Twin Card (Story 15.1)
// ---------------------------------------------------------------------------
function TwinCard({ twin, onClick }: { twin: DigitalTwin; onClick: () => void }) {
  const topRiskFactor = (
    Object.entries(twin.healthFactors) as [keyof HealthFactors, number][]
  ).sort(([, a], [, b]) => a - b)[0];
  const riskLabel: Record<keyof HealthFactors, string> = {
    firmwareAge: "Firmware Age",
    vulnerabilityExposure: "Vulnerability Exposure",
    uptimeScore: "Uptime",
    telemetryHealth: "Telemetry Health",
    complianceScore: "Compliance",
    incidentHistory: "Incident History",
  };

  return (
    <div
      className="card-elevated px-4 py-3.5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <HealthScoreGauge score={twin.healthScore} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-gray-900 truncate">{twin.deviceName}</p>
            {Math.abs(twin.healthDelta) > 10 && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[12px] font-bold tabular-nums",
                  twin.healthDelta > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700",
                )}
              >
                {twin.healthDelta > 0 ? "+" : ""}
                {twin.healthDelta}
              </span>
            )}
          </div>
          <p className="text-[13px] text-gray-500 truncate">{twin.deviceModel}</p>
          {topRiskFactor && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[12px] text-gray-500">Top risk:</span>
              <span
                className="text-[12px] font-medium"
                style={{ color: getHealthColor(topRiskFactor[1]) }}
              >
                {riskLabel[topRiskFactor[0]]} ({topRiskFactor[1]})
              </span>
            </div>
          )}
          <p className="mt-1 text-[12px] text-gray-500 tabular-nums">
            Synced {new Date(twin.lastSyncedAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[12px] font-semibold",
              twin.configDriftStatus === "InSync"
                ? "bg-emerald-50 text-emerald-700"
                : twin.configDriftStatus === "Drifted"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-gray-100 text-gray-500",
            )}
          >
            {twin.configDriftStatus === "InSync" ? "In Sync" : twin.configDriftStatus}
          </span>
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page (Story 15.1 + 15.5)
// ---------------------------------------------------------------------------
export function DigitalTwinPage() {
  const [twins] = useState<DigitalTwin[]>(MOCK_TWINS);
  const [selectedTwin, setSelectedTwin] = useState<DigitalTwin | null>(null);
  const [healthFilter, setHealthFilter] = useState<HealthBucket>("all");
  const [driftFilter, setDriftFilter] = useState<"all" | "InSync" | "Drifted" | "Unknown">("all");
  const [sortField, setSortField] = useState<SortField>("healthScore");
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTwins = twins
    .filter((t) => {
      if (healthFilter !== "all" && getHealthBucket(t.healthScore) !== healthFilter) return false;
      if (driftFilter !== "all" && t.configDriftStatus !== driftFilter) return false;
      if (searchQuery && !t.deviceName.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "healthScore") cmp = a.healthScore - b.healthScore;
      else if (sortField === "deviceName") cmp = a.deviceName.localeCompare(b.deviceName);
      else cmp = new Date(a.lastSyncedAt).getTime() - new Date(b.lastSyncedAt).getTime();
      return sortAsc ? cmp : -cmp;
    });

  if (selectedTwin) {
    return <TwinDetailView twin={selectedTwin} onBack={() => setSelectedTwin(null)} />;
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-gray-900">Digital Twin</h2>
          <p className="mt-0.5 text-[14px] text-gray-500">
            Fleet-wide device health monitoring, simulation, and configuration analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[14px] font-medium text-[#FF7900]">
            {twins.length} twins
          </span>
        </div>
      </div>

      {/* Story 15.5 — Fleet Summary */}
      <FleetHealthSummary twins={twins} />

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search devices..."
            aria-label="Search devices"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-[14px] text-gray-700 placeholder:text-gray-500 focus:border-[#FF7900] focus:ring-1 focus:ring-[#FF7900] focus:outline-none w-[220px]"
          />
        </div>

        {/* Health filter */}
        <div className="flex gap-1">
          {(
            [
              { key: "all", label: "All" },
              { key: "critical", label: "Critical" },
              { key: "warning", label: "Warning" },
              { key: "healthy", label: "Healthy" },
            ] as { key: HealthBucket; label: string }[]
          ).map((bucket) => (
            <button
              key={bucket.key}
              onClick={() => setHealthFilter(bucket.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[14px] font-medium cursor-pointer",
                healthFilter === bucket.key
                  ? bucket.key === "critical"
                    ? "bg-red-50 text-red-700"
                    : bucket.key === "warning"
                      ? "bg-amber-50 text-amber-700"
                      : bucket.key === "healthy"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-[#FF7900] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200",
              )}
            >
              {bucket.label}
            </button>
          ))}
        </div>

        {/* Drift filter (Story 15.4 AC6) */}
        <select
          value={driftFilter}
          onChange={(e) => setDriftFilter(e.target.value as typeof driftFilter)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[14px] text-gray-600 focus:border-[#FF7900] focus:outline-none"
        >
          <option value="all">All Drift Status</option>
          <option value="InSync">In Sync</option>
          <option value="Drifted">Drifted</option>
          <option value="Unknown">Unknown</option>
        </select>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[13px] text-gray-500">Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[14px] text-gray-600 focus:border-[#FF7900] focus:outline-none"
          >
            <option value="healthScore">Health Score</option>
            <option value="deviceName">Device Name</option>
            <option value="lastSyncedAt">Last Synced</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 cursor-pointer"
            title={sortAsc ? "Ascending" : "Descending"}
          >
            {sortAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Twin Grid (Story 15.1 AC4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTwins.map((twin) => (
          <TwinCard key={twin.deviceId} twin={twin} onClick={() => setSelectedTwin(twin)} />
        ))}
      </div>

      {filteredTwins.length === 0 && (
        <div className="card-elevated flex flex-col items-center justify-center py-12 px-5">
          <Search className="h-8 w-8 text-gray-500 mb-3" />
          <p className="text-[15px] font-medium text-gray-700">No devices match your filters</p>
          <p className="text-[14px] text-gray-500 mt-1">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
