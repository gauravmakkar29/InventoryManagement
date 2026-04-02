import { useState, useMemo, useCallback, useEffect } from "react";
import {
  X,
  Play,
  Save,
  History,
  AlertTriangle,
  Zap,
  WifiOff,
  Thermometer,
  Cpu,
  Clock,
  Eye,
  Activity,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { FailureType, RiskLevel, SimulationType, DeviceStatus } from "../../../lib/types";
import type { BlastRadiusResult, BlastRadiusDevice } from "../../../lib/types";
import { formatDateTime } from "../../../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SimulationParams {
  deviceName: string;
  failureType: FailureType;
  radiusKm: number;
  severity: number; // 1-10
}

type SimTab = "results" | "history";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FAILURE_TYPES: {
  id: FailureType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { id: FailureType.PowerLoss, label: "Power Loss", icon: Zap, color: "text-amber-500" },
  {
    id: FailureType.NetworkFailure,
    label: "Network Failure",
    icon: WifiOff,
    color: "text-red-500",
  },
  {
    id: FailureType.Overheating,
    label: "Overheating",
    icon: Thermometer,
    color: "text-orange-500",
  },
  { id: FailureType.FirmwareCrash, label: "Firmware Crash", icon: Cpu, color: "text-purple-500" },
];

// ---------------------------------------------------------------------------
// Mock simulation results
// ---------------------------------------------------------------------------
function generateSimulationResult(params: SimulationParams): BlastRadiusResult {
  const affectedCount = Math.floor(3 + params.severity * 2 + (params.radiusKm / 10) * 3);
  const devices: BlastRadiusDevice[] = Array.from(
    { length: Math.min(affectedCount, 12) },
    (_, i) => ({
      id: `sim-d${i}`,
      name: `INV-${3000 + i * 100}${String.fromCharCode(65 + i)}`,
      distanceKm: Math.round((1 + Math.random() * params.radiusKm) * 10) / 10,
      status:
        i % 5 === 0
          ? DeviceStatus.Offline
          : i % 3 === 0
            ? DeviceStatus.Maintenance
            : DeviceStatus.Online,
      riskScore: Math.max(10, Math.round(90 - params.severity * 6 - Math.random() * 20)),
      estimatedDowntimeMinutes: Math.round(15 + params.severity * 12 + Math.random() * 60),
    }),
  );
  devices.sort((a, b) => a.distanceKm - b.distanceKm);

  const avgRisk = devices.reduce((s, d) => s + d.riskScore, 0) / (devices.length || 1);
  let riskLevel: RiskLevel;
  if (avgRisk <= 30 || params.severity >= 8) riskLevel = RiskLevel.Critical;
  else if (avgRisk <= 50 || params.severity >= 6) riskLevel = RiskLevel.High;
  else if (avgRisk <= 70) riskLevel = RiskLevel.Medium;
  else riskLevel = RiskLevel.Low;

  return {
    id: `blast-${Date.now()}`,
    originDeviceId: "mock-origin",
    originDeviceName: params.deviceName,
    radiusKm: params.radiusKm,
    affectedDevices: devices,
    affectedDeviceCount: devices.length,
    estimatedDowntimeMinutes: devices.reduce((s, d) => s + d.estimatedDowntimeMinutes, 0),
    riskLevel,
    simulationType: SimulationType.Simulated,
    failureType: params.failureType,
    severity: params.severity,
    createdBy: "admin@ims.io",
    createdAt: new Date().toISOString(),
  };
}

const MOCK_HISTORY: BlastRadiusResult[] = [
  {
    id: "blast-h1",
    originDeviceId: "d1",
    originDeviceName: "INV-3200A",
    radiusKm: 25,
    affectedDevices: [],
    affectedDeviceCount: 14,
    estimatedDowntimeMinutes: 420,
    riskLevel: RiskLevel.High,
    simulationType: SimulationType.Simulated,
    failureType: FailureType.PowerLoss,
    severity: 7,
    createdBy: "admin@ims.io",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "blast-h2",
    originDeviceId: "d3",
    originDeviceName: "INV-5100C",
    radiusKm: 50,
    affectedDevices: [],
    affectedDeviceCount: 28,
    estimatedDowntimeMinutes: 840,
    riskLevel: RiskLevel.Critical,
    simulationType: SimulationType.Simulated,
    failureType: FailureType.NetworkFailure,
    severity: 9,
    createdBy: "admin@ims.io",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "blast-h3",
    originDeviceId: "d5",
    originDeviceName: "INV-3200E",
    radiusKm: 10,
    affectedDevices: [],
    affectedDeviceCount: 6,
    estimatedDowntimeMinutes: 180,
    riskLevel: RiskLevel.Medium,
    simulationType: SimulationType.Simulated,
    failureType: FailureType.Overheating,
    severity: 5,
    createdBy: "raj@ims.io",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Risk badge
// ---------------------------------------------------------------------------
function getRiskBadge(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.Critical:
      return "bg-red-500 text-white";
    case RiskLevel.High:
      return "bg-orange-500 text-white";
    case RiskLevel.Medium:
      return "bg-amber-500 text-white";
    case RiskLevel.Low:
      return "bg-emerald-500 text-white";
  }
}

function getRiskLevelBg(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.Critical:
      return "bg-red-50 text-red-700";
    case RiskLevel.High:
      return "bg-orange-50 text-orange-700";
    case RiskLevel.Medium:
      return "bg-amber-50 text-amber-700";
    case RiskLevel.Low:
      return "bg-emerald-50 text-emerald-700";
  }
}

// ---------------------------------------------------------------------------
// SimulationResultsPanel
// ---------------------------------------------------------------------------
function SimulationResultsPanel({ result }: { result: BlastRadiusResult }) {
  return (
    <div className="space-y-4">
      {/* Impact rating */}
      <div className="flex justify-center py-3">
        <span
          className={cn(
            "rounded-xl px-6 py-3 text-[20px] font-bold",
            getRiskBadge(result.riskLevel),
          )}
        >
          {result.riskLevel}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/60 bg-muted px-3 py-3 text-center">
          <p className="text-[18px] font-bold tabular-nums text-foreground">
            {result.affectedDeviceCount}
          </p>
          <p className="text-[12px] text-muted-foreground">Affected Devices</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted px-3 py-3 text-center">
          <p className="text-[18px] font-bold tabular-nums text-foreground">
            {result.estimatedDowntimeMinutes}m
          </p>
          <p className="text-[12px] text-muted-foreground">Cascade Downtime</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted px-3 py-3 text-center">
          <p className="text-[18px] font-bold tabular-nums text-foreground">{result.radiusKm}km</p>
          <p className="text-[12px] text-muted-foreground">Blast Radius</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted px-3 py-3 text-center">
          <p className="text-[18px] font-bold tabular-nums text-accent-text">
            {result.severity ?? "N/A"}
          </p>
          <p className="text-[12px] text-muted-foreground">Severity</p>
        </div>
      </div>

      {/* Affected device list */}
      <div>
        <h4 className="text-[14px] font-semibold text-foreground/80 mb-2">
          Affected Devices ({result.affectedDevices.length})
        </h4>
        <div className="max-h-[240px] overflow-y-auto space-y-1">
          {result.affectedDevices.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted"
            >
              <div>
                <p className="text-[14px] font-medium text-foreground">{d.name}</p>
                <p className="text-[13px] text-muted-foreground">
                  {d.distanceKm} km | {d.estimatedDowntimeMinutes}m downtime
                </p>
              </div>
              <span
                className={cn(
                  "text-[13px] font-bold tabular-nums",
                  d.riskScore <= 30
                    ? "text-red-600"
                    : d.riskScore <= 50
                      ? "text-orange-600"
                      : d.riskScore <= 70
                        ? "text-amber-600"
                        : "text-emerald-600",
                )}
              >
                {d.riskScore}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SimulationHistory
// ---------------------------------------------------------------------------
function SimulationHistory({
  history,
  onView,
}: {
  history: BlastRadiusResult[];
  onView: (result: BlastRadiusResult) => void;
}) {
  const [sortField, setSortField] = useState<"date" | "risk">("date");

  const sorted = useMemo(() => {
    const items = [...history];
    if (sortField === "date") {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      const riskOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      items.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
    }
    return items;
  }, [history, sortField]);

  if (history.length === 0) {
    return (
      <div className="py-12 text-center">
        <History className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-[14px] text-muted-foreground">No simulation history</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSortField("date")}
          className={cn(
            "rounded-md px-2.5 py-1 text-[13px] font-medium cursor-pointer",
            sortField === "date"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted",
          )}
        >
          By Date
        </button>
        <button
          onClick={() => setSortField("risk")}
          className={cn(
            "rounded-md px-2.5 py-1 text-[13px] font-medium cursor-pointer",
            sortField === "risk"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted",
          )}
        >
          By Risk
        </button>
      </div>

      {sorted.map((item) => (
        <div
          key={item.id}
          className="card-flat rounded-xl px-4 py-3 hover:shadow-md cursor-pointer"
          onClick={() => onView(item)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-medium text-foreground">{item.originDeviceName}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[12px] font-bold",
                getRiskLevelBg(item.riskLevel),
              )}
            >
              {item.riskLevel}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(item.createdAt)}
            </span>
            <span>{item.failureType}</span>
            <span>{item.affectedDeviceCount} affected</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[13px] text-accent-text font-medium">
            <Eye className="h-3 w-3" />
            View Details
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RiskSimulationDialog — Story 13.5
// ---------------------------------------------------------------------------
interface RiskSimulationDialogProps {
  open: boolean;
  onClose: () => void;
  prefilledDeviceName?: string;
  prefilledRadius?: number;
}

export function RiskSimulationDialog({
  open,
  onClose,
  prefilledDeviceName,
  prefilledRadius,
}: RiskSimulationDialogProps) {
  const [activeTab, setActiveTab] = useState<SimTab>("results");
  const [params, setParams] = useState<SimulationParams>({
    deviceName: prefilledDeviceName ?? "INV-3200A",
    failureType: FailureType.PowerLoss,
    radiusKm: prefilledRadius ?? 25,
    severity: 5,
  });
  const [result, setResult] = useState<BlastRadiusResult | null>(null);
  const [history, setHistory] = useState<BlastRadiusResult[]>(MOCK_HISTORY);
  const [isRunning, setIsRunning] = useState(false);

  const handleSimulate = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      const simResult = generateSimulationResult(params);
      setResult(simResult);
      setIsRunning(false);
      setActiveTab("results");
    }, 1200);
  }, [params]);

  const handleSave = useCallback(() => {
    if (result) {
      setHistory((prev) => [result, ...prev]);
    }
  }, [result]);

  const handleViewHistory = useCallback((item: BlastRadiusResult) => {
    setResult(item);
    setActiveTab("results");
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative z-10 w-[560px] max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Risk simulation"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent-text" />
            <h2 className="text-[16px] font-semibold text-foreground">Risk Simulation</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-muted cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Parameter form */}
        <div className="border-b border-border/60 px-6 py-4 space-y-4">
          {/* Device name */}
          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-1">
              Device
            </label>
            <input
              type="text"
              value={params.deviceName}
              onChange={(e) => setParams((p) => ({ ...p, deviceName: e.target.value }))}
              className="w-full rounded-lg border border-border px-3 py-2 text-[14px] text-foreground focus:border-accent-text focus:ring-1 focus:ring-ring outline-none"
            />
          </div>

          {/* Failure type */}
          <div>
            <label className="block text-[13px] font-semibold text-muted-foreground mb-1">
              Failure Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FAILURE_TYPES.map((ft) => {
                const Icon = ft.icon;
                return (
                  <button
                    key={ft.id}
                    onClick={() => setParams((p) => ({ ...p, failureType: ft.id }))}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-[14px] font-medium cursor-pointer",
                      params.failureType === ft.id
                        ? "border-accent-text bg-orange-50 text-foreground"
                        : "border-border text-muted-foreground hover:border-border",
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", ft.color)} />
                    {ft.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Radius */}
            <div>
              <label className="flex items-center justify-between text-[13px] font-semibold text-muted-foreground mb-1">
                Radius
                <span className="text-[14px] font-bold tabular-nums text-accent-text">
                  {params.radiusKm} km
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={params.radiusKm}
                onChange={(e) => setParams((p) => ({ ...p, radiusKm: Number(e.target.value) }))}
                className="w-full accent-[#FF7900]"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="flex items-center justify-between text-[13px] font-semibold text-muted-foreground mb-1">
                Severity
                <span className="text-[14px] font-bold tabular-nums text-accent-text">
                  {params.severity}/10
                </span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={params.severity}
                onChange={(e) => setParams((p) => ({ ...p, severity: Number(e.target.value) }))}
                className="w-full accent-[#FF7900]"
              />
            </div>
          </div>

          {/* Simulate button */}
          <button
            onClick={handleSimulate}
            disabled={isRunning}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[14px] font-medium text-white cursor-pointer",
              isRunning ? "bg-muted cursor-not-allowed" : "bg-accent hover:bg-accent-hover",
            )}
          >
            {isRunning ? (
              <>
                <Activity className="h-4 w-4 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Simulate
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/60">
          <button
            onClick={() => setActiveTab("results")}
            className={cn(
              "flex-1 py-2.5 text-center text-[14px] font-medium cursor-pointer",
              activeTab === "results"
                ? "border-b-2 border-accent-text text-accent-text"
                : "text-muted-foreground hover:text-foreground/80",
            )}
          >
            Results
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex-1 py-2.5 text-center text-[14px] font-medium cursor-pointer flex items-center justify-center gap-1",
              activeTab === "history"
                ? "border-b-2 border-accent-text text-accent-text"
                : "text-muted-foreground hover:text-foreground/80",
            )}
          >
            <History className="h-3 w-3" />
            History ({history.length})
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[350px]">
          {activeTab === "results" ? (
            result ? (
              <SimulationResultsPanel result={result} />
            ) : (
              <div className="py-12 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-[14px] text-muted-foreground">
                  Configure parameters and click Simulate
                </p>
              </div>
            )
          ) : (
            <SimulationHistory history={history} onView={handleViewHistory} />
          )}
        </div>

        {/* Footer */}
        {result && activeTab === "results" && (
          <div className="border-t border-border/60 px-6 py-3 flex justify-end gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[14px] font-medium text-foreground/80 hover:bg-muted cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              Save Simulation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
