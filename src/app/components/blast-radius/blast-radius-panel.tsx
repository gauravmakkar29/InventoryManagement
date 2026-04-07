import { useState, useMemo } from "react";
import { Target, X, MapPin, Activity, SlidersHorizontal, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { RiskLevel, DeviceStatus } from "@/lib/types";
import type { BlastRadiusDevice } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const MOCK_AFFECTED_DEVICES: BlastRadiusDevice[] = [
  {
    id: "d1",
    name: "INV-3200A",
    distanceKm: 2.3,
    status: DeviceStatus.Online,
    riskScore: 45,
    estimatedDowntimeMinutes: 120,
  },
  {
    id: "d2",
    name: "INV-3200B",
    distanceKm: 5.1,
    status: DeviceStatus.Online,
    riskScore: 72,
    estimatedDowntimeMinutes: 60,
  },
  {
    id: "d3",
    name: "INV-5100C",
    distanceKm: 7.8,
    status: DeviceStatus.Offline,
    riskScore: 28,
    estimatedDowntimeMinutes: 240,
  },
  {
    id: "d4",
    name: "MON-200D",
    distanceKm: 9.2,
    status: DeviceStatus.Online,
    riskScore: 85,
    estimatedDowntimeMinutes: 30,
  },
  {
    id: "d5",
    name: "INV-3200E",
    distanceKm: 12.4,
    status: DeviceStatus.Maintenance,
    riskScore: 55,
    estimatedDowntimeMinutes: 90,
  },
  {
    id: "d6",
    name: "INV-5100F",
    distanceKm: 15.7,
    status: DeviceStatus.Online,
    riskScore: 38,
    estimatedDowntimeMinutes: 180,
  },
  {
    id: "d7",
    name: "GW-100G",
    distanceKm: 18.3,
    status: DeviceStatus.Online,
    riskScore: 91,
    estimatedDowntimeMinutes: 15,
  },
  {
    id: "d8",
    name: "INV-3200H",
    distanceKm: 22.1,
    status: DeviceStatus.Offline,
    riskScore: 22,
    estimatedDowntimeMinutes: 300,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getRiskLevelBg(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.Critical:
      return "bg-danger-bg text-danger-text";
    case RiskLevel.High:
      return "bg-high-bg text-high-text";
    case RiskLevel.Medium:
      return "bg-warning-bg text-warning-text";
    case RiskLevel.Low:
      return "bg-success-bg text-success-text";
  }
}

function computeRiskLevel(devices: BlastRadiusDevice[]): RiskLevel {
  if (devices.length === 0) return RiskLevel.Low;
  const avgRisk = devices.reduce((s, d) => s + d.riskScore, 0) / devices.length;
  const criticalCount = devices.filter((d) => d.riskScore <= 30).length;
  if (criticalCount >= 3 || avgRisk <= 30) return RiskLevel.Critical;
  if (criticalCount >= 1 || avgRisk <= 50) return RiskLevel.High;
  if (avgRisk <= 70) return RiskLevel.Medium;
  return RiskLevel.Low;
}

function getStatusColor(status: DeviceStatus): string {
  switch (status) {
    case DeviceStatus.Online:
      return "bg-success";
    case DeviceStatus.Offline:
      return "bg-danger";
    case DeviceStatus.Maintenance:
      return "bg-warning";
    default:
      return "bg-muted-foreground";
  }
}

// ---------------------------------------------------------------------------
// BlastRadiusSummary
// ---------------------------------------------------------------------------
function BlastRadiusSummary({
  affectedCount,
  estimatedDowntime,
  riskLevel,
  radiusKm,
}: {
  affectedCount: number;
  estimatedDowntime: number;
  riskLevel: RiskLevel;
  radiusKm: number;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] font-semibold text-foreground/80">Impact Summary</span>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[13px] font-bold",
            getRiskLevelBg(riskLevel),
          )}
        >
          {riskLevel}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-[18px] font-bold tabular-nums text-foreground">{affectedCount}</p>
          <p className="text-[12px] text-muted-foreground">Affected</p>
        </div>
        <div className="text-center">
          <p className="text-[18px] font-bold tabular-nums text-foreground">{estimatedDowntime}m</p>
          <p className="text-[12px] text-muted-foreground">Est. Downtime</p>
        </div>
        <div className="text-center">
          <p className="text-[18px] font-bold tabular-nums text-foreground">{radiusKm}km</p>
          <p className="text-[12px] text-muted-foreground">Radius</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlastRadiusDeviceList
// ---------------------------------------------------------------------------
function BlastRadiusDeviceList({ devices }: { devices: BlastRadiusDevice[] }) {
  return (
    <div className="space-y-1">
      {devices.map((device) => (
        <div
          key={device.id}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted cursor-pointer",
            device.riskScore <= 30 && "bg-danger-bg/50",
          )}
        >
          <div className="relative">
            <MapPin
              className={cn(
                "h-4 w-4",
                device.riskScore <= 30 ? "text-danger" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white",
                getStatusColor(device.status),
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-foreground truncate">{device.name}</p>
            <p className="text-[13px] text-muted-foreground">
              {device.distanceKm.toFixed(1)} km away
            </p>
          </div>
          <div className="text-right shrink-0">
            <p
              className={cn(
                "text-[14px] font-bold tabular-nums",
                device.riskScore <= 30
                  ? "text-danger-text"
                  : device.riskScore <= 50
                    ? "text-high-text"
                    : device.riskScore <= 70
                      ? "text-warning-text"
                      : "text-success-text",
              )}
            >
              {device.riskScore}
            </p>
            <p className="text-[12px] text-muted-foreground">{device.estimatedDowntimeMinutes}m</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlastRadiusOverlay (SVG circle for map integration)
// ---------------------------------------------------------------------------
export function BlastRadiusOverlay({
  centerX,
  centerY,
  radius,
}: {
  centerX: number;
  centerY: number;
  radius: number;
}) {
  return (
    <g>
      {/* Outer fill */}
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        fill="rgba(37, 99, 235, 0.15)"
        stroke="#2563eb"
        strokeWidth="2"
        strokeDasharray="8 4"
      />
      {/* Pulse ring */}
      <circle cx={centerX} cy={centerY} r={radius * 0.1} fill="#2563eb" opacity="0.5" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// BlastRadiusPanel — Story 13.4
// ---------------------------------------------------------------------------
interface BlastRadiusPanelProps {
  originDeviceName: string;
  originLat: number;
  originLng: number;
  open: boolean;
  onClose: () => void;
  onRunSimulation?: () => void;
}

export function BlastRadiusPanel({
  originDeviceName,
  originLat,
  originLng,
  open,
  onClose,
  onRunSimulation,
}: BlastRadiusPanelProps) {
  const [radiusKm, setRadiusKm] = useState(25);

  const affectedDevices = useMemo(
    () => MOCK_AFFECTED_DEVICES.filter((d) => d.distanceKm <= radiusKm),
    [radiusKm],
  );

  const totalDowntime = useMemo(
    () => affectedDevices.reduce((s, d) => s + d.estimatedDowntimeMinutes, 0),
    [affectedDevices],
  );

  const riskLevel = useMemo(() => computeRiskLevel(affectedDevices), [affectedDevices]);

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col border-l border-border bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-accent-text" />
          <h3 className="text-[15px] font-semibold text-foreground">Blast Radius</h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-muted-foreground hover:bg-muted cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Origin device */}
      <div className="px-5 py-3 border-b border-border/60 bg-muted">
        <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">
          Origin Device
        </p>
        <p className="mt-1 text-[15px] font-semibold text-foreground">{originDeviceName}</p>
        <p className="text-[13px] text-muted-foreground">
          {originLat.toFixed(4)}, {originLng.toFixed(4)}
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Summary */}
        <BlastRadiusSummary
          affectedCount={affectedDevices.length}
          estimatedDowntime={totalDowntime}
          riskLevel={riskLevel}
          radiusKm={radiusKm}
        />

        {/* Radius slider */}
        <div>
          <label className="flex items-center justify-between text-[13px] font-semibold text-foreground/80 mb-2">
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" />
              Radius
            </span>
            <span className="text-[14px] font-bold tabular-nums text-accent-text">
              {radiusKm} km
            </span>
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full accent-[#FF7900]"
          />
          <div className="flex justify-between text-[12px] text-muted-foreground mt-0.5">
            <span>1 km</span>
            <span>100 km</span>
          </div>
        </div>

        {/* Affected devices list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-semibold text-foreground/80">
              Affected Devices ({affectedDevices.length})
            </span>
          </div>
          {affectedDevices.length === 0 ? (
            <div className="py-8 text-center">
              <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-[14px] text-muted-foreground">No devices within radius</p>
            </div>
          ) : (
            <BlastRadiusDeviceList devices={affectedDevices} />
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-border/60 px-5 py-3 flex gap-2">
        <button
          onClick={onRunSimulation}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[14px] font-medium text-white hover:bg-accent-hover cursor-pointer"
        >
          <Play className="h-3.5 w-3.5" />
          Run Simulation
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2.5 text-[14px] font-medium text-foreground/80 hover:bg-muted cursor-pointer"
        >
          Clear Radius
        </button>
      </div>
    </div>
  );
}
