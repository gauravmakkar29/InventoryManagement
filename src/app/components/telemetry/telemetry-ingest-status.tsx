import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, Clock, Database, AlertCircle } from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatRelativeTime } from "../../../lib/utils";
import { Skeleton } from "../../../components/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PipelineHealth = "healthy" | "degraded" | "failed";

interface PipelineStatus {
  recordsIngestedLastHour: number;
  health: PipelineHealth;
  lastSuccessfulIngestion: string;
  avgLatencyMs: number;
  errorCount: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------
const MOCK_STATUS: PipelineStatus = {
  recordsIngestedLastHour: 12847,
  health: "healthy",
  lastSuccessfulIngestion: new Date(Date.now() - 90000).toISOString(),
  avgLatencyMs: 127,
  errorCount: 3,
};

// ---------------------------------------------------------------------------
// Health Config
// ---------------------------------------------------------------------------
const HEALTH_CONFIG: Record<
  PipelineHealth,
  { label: string; color: string; bg: string; dot: string }
> = {
  healthy: {
    label: "Healthy",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
  },
  degraded: { label: "Degraded", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  failed: { label: "Failed", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-500" },
};

// ---------------------------------------------------------------------------
// TelemetryIngestStatus — Story 13.2
// ---------------------------------------------------------------------------
export function TelemetryIngestStatus() {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setStatus(MOCK_STATUS);
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading || !status) {
    return (
      <div className="card-elevated p-5" aria-busy="true">
        <span className="sr-only" aria-live="polite">
          Loading telemetry status...
        </span>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const healthCfg = HEALTH_CONFIG[status.health];

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#FF7900]" />
          <h3 className="text-[14px] font-semibold text-gray-900">Telemetry Pipeline</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              healthCfg.bg,
              healthCfg.color,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", healthCfg.dot)} />
            {healthCfg.label}
          </span>
          <button
            onClick={fetchStatus}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-600 hover:bg-gray-50 cursor-pointer"
            aria-label="Refresh pipeline status"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Records ingested */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-center">
          <Database className="mx-auto h-4 w-4 text-blue-500 mb-1.5" />
          <p className="text-[16px] font-bold tabular-nums text-gray-900">
            {status.recordsIngestedLastHour.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-gray-500">Records / hr</p>
        </div>

        {/* Average latency */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-center">
          <Clock className="mx-auto h-4 w-4 text-[#FF7900] mb-1.5" />
          <p className="text-[16px] font-bold tabular-nums text-gray-900">
            {status.avgLatencyMs}ms
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-gray-500">Avg Latency</p>
        </div>

        {/* Errors */}
        <div
          className={cn(
            "rounded-xl border px-3 py-3 text-center",
            status.errorCount > 0 ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50",
          )}
        >
          <AlertCircle
            className={cn(
              "mx-auto h-4 w-4 mb-1.5",
              status.errorCount > 0 ? "text-red-500" : "text-gray-500",
            )}
          />
          <p
            className={cn(
              "text-[16px] font-bold tabular-nums",
              status.errorCount > 0 ? "text-red-600" : "text-gray-900",
            )}
          >
            {status.errorCount}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-gray-500">Errors / hr</p>
        </div>
      </div>

      {/* Last ingestion timestamp */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500">
        <Clock className="h-3 w-3" />
        <span>Last ingestion: {formatRelativeTime(status.lastSuccessfulIngestion)}</span>
      </div>
    </div>
  );
}
