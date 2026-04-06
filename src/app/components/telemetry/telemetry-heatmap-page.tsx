import { useState, useCallback } from "react";
import {
  Activity,
  Map as MapIcon,
  Target,
  Cpu,
  Thermometer,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DeviceTelemetryChart } from "./device-telemetry-chart";
import { TelemetryIngestStatus } from "./telemetry-ingest-status";
import { HeatmapPage } from "../heatmap/heatmap-page";
import { BlastRadiusPanel } from "../blast-radius/blast-radius-panel";
import { RiskSimulationDialog } from "../risk-simulation/risk-simulation-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TelemetryTab = "overview" | "device" | "heatmap";

// ---------------------------------------------------------------------------
// TelemetryHeatmapPage — Epic 13 integrated view
// ---------------------------------------------------------------------------
export function TelemetryHeatmapPage() {
  const [activeTab, setActiveTab] = useState<TelemetryTab>("overview");
  const [blastRadiusOpen, setBlastRadiusOpen] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState({
    lat: 39.74,
    lng: -104.99,
    name: "INV-3200A",
  });

  const handleSelectDevice = useCallback((lat: number, lng: number, name: string) => {
    setSelectedOrigin({ lat, lng, name });
    setBlastRadiusOpen(true);
  }, []);

  const handleRunSimulation = useCallback(() => {
    setBlastRadiusOpen(false);
    setSimulationOpen(true);
  }, []);

  const tabs: {
    id: TelemetryTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "device", label: "Device Telemetry", icon: Cpu },
    { id: "heatmap", label: "Heatmap & Blast Radius", icon: MapIcon },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Page header */}
      <div>
        <h1 className="text-[20px] font-semibold text-foreground">
          Telemetry & Environmental Monitoring
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Real-time device health, geographic risk heatmaps, and impact analysis
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[14px] font-medium cursor-pointer",
                activeTab === tab.id
                  ? "border-accent-text text-accent-text"
                  : "border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab onNavigateHeatmap={() => setActiveTab("heatmap")} />
      )}
      {activeTab === "device" && <DeviceTelemetryChart deviceId="d1" deviceName="INV-3200A" />}
      {activeTab === "heatmap" && <HeatmapPage onSelectDevice={handleSelectDevice} />}

      {/* Blast Radius Panel */}
      <BlastRadiusPanel
        originDeviceName={selectedOrigin.name}
        originLat={selectedOrigin.lat}
        originLng={selectedOrigin.lng}
        open={blastRadiusOpen}
        onClose={() => setBlastRadiusOpen(false)}
        onRunSimulation={handleRunSimulation}
      />

      {/* Risk Simulation Dialog */}
      <RiskSimulationDialog
        open={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        prefilledDeviceName={selectedOrigin.name}
        prefilledRadius={25}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab — Story 13.6 Dashboard Integration
// ---------------------------------------------------------------------------
function OverviewTab({ onNavigateHeatmap }: { onNavigateHeatmap: () => void }) {
  // Mock environmental risk score
  const fleetRiskScore = 72.4;
  const riskTrend = +3.2;
  const isImproving = riskTrend > 0;

  // Recent blast radius results
  const recentResults = [
    {
      id: "r1",
      originDevice: "INV-3200A",
      affectedCount: 14,
      riskLevel: "High" as const,
      time: "2h ago",
      color: "#f97316",
    },
    {
      id: "r2",
      originDevice: "INV-5100C",
      affectedCount: 28,
      riskLevel: "Critical" as const,
      time: "6h ago",
      color: "#ef4444",
    },
    {
      id: "r3",
      originDevice: "MON-200D",
      affectedCount: 6,
      riskLevel: "Low" as const,
      time: "18h ago",
      color: "#10b981",
    },
  ];

  const getBorderColor = (score: number): string => {
    if (score < 50) return "border-red-400";
    if (score <= 70) return "border-amber-400";
    return "border-emerald-400";
  };

  return (
    <div className="space-y-5">
      {/* Row 1: KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Environmental Risk KPI — Story 13.6 AC1/AC2/AC3 */}
        <button
          onClick={onNavigateHeatmap}
          className={cn(
            "card-elevated px-4 py-3.5 text-left cursor-pointer border-l-4",
            getBorderColor(fleetRiskScore),
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
              <Thermometer className="h-[18px] w-[18px] text-accent-text" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] text-muted-foreground truncate">Environmental Risk</p>
              <p className="text-[22px] font-bold leading-snug text-foreground tabular-nums">
                {fleetRiskScore.toFixed(1)}
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 pl-12">
            <span
              className={cn(
                "text-[13px] font-medium",
                isImproving ? "text-emerald-600" : "text-red-600",
              )}
            >
              {isImproving ? "+" : ""}
              {riskTrend.toFixed(1)}%
            </span>
            <span className="text-[12px] text-muted-foreground">vs last 24h</span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </button>

        {/* Avg Temperature */}
        <div className="card-elevated px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50">
              <Thermometer className="h-[18px] w-[18px] text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] text-muted-foreground truncate">Avg Temperature</p>
              <p className="text-[22px] font-bold leading-snug text-foreground tabular-nums">
                42.8&deg;C
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 pl-12">
            <span className="text-[13px] font-medium text-red-600">+1.2&deg;</span>
            <span className="text-[12px] text-muted-foreground">vs last 24h</span>
          </div>
        </div>

        {/* Avg CPU */}
        <div className="card-elevated px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Cpu className="h-[18px] w-[18px] text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] text-muted-foreground truncate">Avg CPU Load</p>
              <p className="text-[22px] font-bold leading-snug text-foreground tabular-nums">
                37.5%
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 pl-12">
            <span className="text-[13px] font-medium text-emerald-600">-2.3%</span>
            <span className="text-[12px] text-muted-foreground">vs last 24h</span>
          </div>
        </div>

        {/* Critical Devices */}
        <div className="card-elevated px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
              <AlertTriangle className="h-[18px] w-[18px] text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] text-muted-foreground truncate">Critical Devices</p>
              <p className="text-[22px] font-bold leading-snug text-red-600 tabular-nums">12</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2 pl-12">
            <span className="text-[13px] font-medium text-emerald-600">-3</span>
            <span className="text-[12px] text-muted-foreground">vs yesterday</span>
          </div>
        </div>
      </div>

      {/* Row 2: Pipeline Status + Recent Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Telemetry Pipeline — Story 13.2 */}
        <TelemetryIngestStatus />

        {/* Recent Impact Analysis — Story 13.6 AC4/AC5 */}
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent-text" />
              <h3 className="text-[15px] font-semibold text-foreground">Recent Impact Analysis</h3>
            </div>
          </div>

          {recentResults.length === 0 ? (
            <div className="py-6 text-center">
              <Target className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-[14px] text-muted-foreground">No recent impact analyses</p>
              <button className="mt-2 text-[14px] font-medium text-accent-text hover:underline cursor-pointer">
                Run Simulation
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentResults.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted cursor-pointer"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-foreground">{r.originDevice}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {r.affectedCount} affected devices
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-[12px] font-bold"
                      style={{ backgroundColor: `${r.color}15`, color: r.color }}
                    >
                      {r.riskLevel}
                    </span>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{r.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Risk distribution SVG visualization */}
      <div className="card-elevated p-5">
        <h3 className="text-[15px] font-semibold text-foreground mb-4">Fleet Risk Distribution</h3>
        <RiskDistributionChart />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Distribution SVG Bar Chart
// ---------------------------------------------------------------------------
function RiskDistributionChart() {
  const segments = [
    { label: "Healthy (86-100)", count: 487, pct: 39, color: "#10b981" },
    { label: "Low Risk (71-85)", count: 312, pct: 25, color: "#84cc16" },
    { label: "Moderate (51-70)", count: 248, pct: 20, color: "#f59e0b" },
    { label: "High Risk (31-50)", count: 137, pct: 11, color: "#f97316" },
    { label: "Critical (0-30)", count: 63, pct: 5, color: "#ef4444" },
  ];

  // Pre-compute offsets (no mutable variable in render)
  const barWidth = 100; // percentage-based for responsiveness
  const offsets = segments.reduce<number[]>((acc, _seg, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1]! + segments[i - 1]!.pct);
    return acc;
  }, []);

  return (
    <div>
      {/* Stacked bar — percentage-based viewBox for consistent sizing */}
      <svg
        viewBox="0 0 100 6"
        preserveAspectRatio="none"
        className="w-full h-7 rounded-lg overflow-hidden"
        role="img"
        aria-label="Fleet risk distribution bar chart"
      >
        {segments.map((seg, i) => (
          <rect
            key={seg.label}
            x={offsets[i]}
            y={0}
            width={(seg.pct / 100) * barWidth}
            height={6}
            fill={seg.color}
          />
        ))}
      </svg>

      {/* Legend — responsive grid */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: seg.color }}
            />
            <div>
              <p className="text-[13px] text-muted-foreground">{seg.label}</p>
              <p className="text-[14px] font-bold tabular-nums text-foreground">
                {seg.count}{" "}
                <span className="text-[12px] font-medium text-muted-foreground">({seg.pct}%)</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
