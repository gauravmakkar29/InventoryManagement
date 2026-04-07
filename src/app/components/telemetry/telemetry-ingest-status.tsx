import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, Clock, Database, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import { Skeleton } from "@/components/skeleton";

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
    color: "text-success-text",
    bg: "bg-success-bg",
    dot: "bg-success",
  },
  degraded: {
    label: "Degraded",
    color: "text-warning-text",
    bg: "bg-warning-bg",
    dot: "bg-warning",
  },
  failed: { label: "Failed", color: "text-danger-text", bg: "bg-danger-bg", dot: "bg-danger" },
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
          <Activity className="h-4 w-4 text-accent-text" />
          <h3 className="text-[15px] font-semibold text-foreground">Telemetry Pipeline</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold",
              healthCfg.bg,
              healthCfg.color,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", healthCfg.dot)} />
            {healthCfg.label}
          </span>
          <button
            onClick={fetchStatus}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-muted-foreground hover:bg-muted cursor-pointer"
            aria-label="Refresh pipeline status"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Records ingested */}
        <div className="rounded-xl border border-border/60 bg-muted px-3 py-3 text-center">
          <Database className="mx-auto h-4 w-4 text-info mb-1.5" />
          <p className="text-[16px] font-bold tabular-nums text-foreground">
            {status.recordsIngestedLastHour.toLocaleString()}
          </p>
          <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">Records / hr</p>
        </div>

        {/* Average latency */}
        <div className="rounded-xl border border-border/60 bg-muted px-3 py-3 text-center">
          <Clock className="mx-auto h-4 w-4 text-accent-text mb-1.5" />
          <p className="text-[16px] font-bold tabular-nums text-foreground">
            {status.avgLatencyMs}ms
          </p>
          <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">Avg Latency</p>
        </div>

        {/* Errors */}
        <div
          className={cn(
            "rounded-xl border px-3 py-3 text-center",
            status.errorCount > 0
              ? "border-danger-border bg-danger-bg"
              : "border-border/60 bg-muted",
          )}
        >
          <AlertCircle
            className={cn(
              "mx-auto h-4 w-4 mb-1.5",
              status.errorCount > 0 ? "text-danger-text" : "text-muted-foreground",
            )}
          />
          <p
            className={cn(
              "text-[16px] font-bold tabular-nums",
              status.errorCount > 0 ? "text-danger-text" : "text-foreground",
            )}
          >
            {status.errorCount}
          </p>
          <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">Errors / hr</p>
        </div>
      </div>

      {/* Last ingestion timestamp */}
      <div className="mt-3 flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Last ingestion: {formatRelativeTime(status.lastSuccessfulIngestion)}</span>
      </div>
    </div>
  );
}
