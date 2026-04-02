import { useState, useCallback, useEffect, useRef } from "react";
import {
  Activity,
  ChevronRight,
  Clock,
  Cpu,
  GitCompare,
  Heart,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Zap,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import type { DigitalTwin, TimeRange } from "./digital-twin-types";
import { getHealthColor, getHealthLabel } from "./digital-twin-health-utils";
import { generateHealthTrend, generateSnapshots } from "./digital-twin-mock-data";
import { HealthScoreGauge } from "./health-score-gauge";
import { HealthFactorsBreakdown } from "./health-factors-breakdown";
import { HealthTrendChart } from "./health-trend-chart";
import { StateReplayTimeline } from "./state-replay-timeline";
import { StateSnapshotCard } from "./state-snapshot-card";
import { StateComparisonView } from "./state-comparison-view";
import { FirmwareSimulationDialog } from "./firmware-simulation-dialog";
import { ConfigDriftPanel } from "./config-drift-panel";

// ---------------------------------------------------------------------------
// Twin Detail View (combines stories 15.1, 15.2, 15.3, 15.4)
// ---------------------------------------------------------------------------
export function TwinDetailView({ twin, onBack }: { twin: DigitalTwin; onBack: () => void }) {
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
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted cursor-pointer"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
        <div>
          <h2 className="text-[18px] font-semibold text-foreground">{twin.deviceName}</h2>
          <p className="text-[14px] text-muted-foreground">
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
                  : "bg-muted text-muted-foreground",
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
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-medium border-b-2 cursor-pointer transition-colors",
                activeTab === tab.id
                  ? "border-accent-text text-accent-text"
                  : "border-transparent text-muted-foreground hover:text-foreground/80",
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
            <p className="text-[13px] text-muted-foreground">Composite Health Score</p>
          </div>
          {/* Factors Breakdown */}
          <div className="card-elevated p-5">
            <h4 className="text-[14px] font-semibold text-foreground mb-3">Health Factors</h4>
            <HealthFactorsBreakdown factors={twin.healthFactors} />
          </div>
        </div>
      )}

      {activeTab === "trend" && (
        <div className="card-elevated p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[15px] font-semibold text-foreground">Health Score Trend</h4>
            <div className="flex gap-1">
              {(["7d", "30d", "90d", "180d"] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[13px] font-medium cursor-pointer",
                    timeRange === r
                      ? "bg-accent text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
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
                className="fixed z-50 rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-[13px]"
                style={{ left: tooltip.x + 10, top: tooltip.y - 50 }}
              >
                <p className="font-semibold text-foreground">{tooltip.point.score}</p>
                <p className="text-muted-foreground">{tooltip.point.date}</p>
                {tooltip.point.event && (
                  <p className="text-accent-text font-medium mt-0.5">{tooltip.point.event}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "replay" && (
        <div className="card-elevated p-5 space-y-4">
          <h4 className="text-[15px] font-semibold text-foreground">State Replay</h4>
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-hover cursor-pointer"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <button
              onClick={() => {
                const idx = snapshots.findIndex((s) => s.id === activeSnapId);
                if (idx < snapshots.length - 1) setActiveSnapId(snapshots[idx + 1]!.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted cursor-pointer"
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
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
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
            <h4 className="text-[15px] font-semibold text-foreground">
              Firmware Upgrade Simulation
            </h4>
            <button
              onClick={() => setShowSimDialog(true)}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[14px] font-semibold text-white hover:bg-accent-hover cursor-pointer"
            >
              <Zap className="h-4 w-4" /> Simulate Upgrade
            </button>
          </div>
          <div className="rounded-lg border border-border bg-muted p-6 flex flex-col items-center">
            <Cpu className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-[15px] font-medium text-muted-foreground">
              Run a firmware upgrade simulation
            </p>
            <p className="text-[14px] text-muted-foreground mt-1">
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
