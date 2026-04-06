import { useState, useCallback } from "react";
import { Activity, RefreshCw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getOsisPipelineHealth, triggerReindex } from "@/lib/hlm-api";
import type { PipelineHealthStatus } from "@/lib/opensearch-types";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, canPerformAction } from "@/lib/rbac";
import { usePolling } from "@/lib/hooks/use-polling";

// =============================================================================
// Story 18.1 — PipelineStatusCard
// Displays OSIS pipeline health in the System Status section of the dashboard.
// Shows: pipeline state, records synced, lag time.
// Admin-only "Reindex" button triggers full re-export.
// =============================================================================

/** Mock pipeline status for development */
const MOCK_STATUS: PipelineHealthStatus = {
  state: "Running",
  recordsSyncedLastHour: 1247,
  currentLagSeconds: 12,
  lastUpdated: new Date().toISOString(),
};

function StateIcon({ state }: { state: PipelineHealthStatus["state"] }) {
  switch (state) {
    case "Running":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "Error":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case "Stopped":
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
}

function getCardBorderColor(status: PipelineHealthStatus): string {
  if (status.state === "Stopped") return "border-l-red-500";
  if (status.state === "Error" || status.currentLagSeconds > 300) return "border-l-amber-500";
  return "border-l-emerald-500";
}

export function PipelineStatusCard() {
  const { groups } = useAuth();
  const isAdmin = canPerformAction(getPrimaryRole(groups), "delete");
  const [status, setStatus] = useState<PipelineHealthStatus>(MOCK_STATUS);
  const [isReindexing, setIsReindexing] = useState(false);

  // Poll pipeline health every 60 seconds with visibility-aware backoff
  usePolling(
    useCallback(async () => {
      const result = await getOsisPipelineHealth();
      if (result) setStatus(result);
    }, []),
    60_000,
  );

  const handleReindex = useCallback(async () => {
    setIsReindexing(true);
    try {
      await triggerReindex();
      toast.success("Reindex initiated. This may take several minutes.");
    } catch {
      toast.error("Failed to trigger reindex. Please try again.");
    } finally {
      setIsReindexing(false);
    }
  }, []);

  const lagWarning = status.currentLagSeconds > 300;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 border-l-4 transition-colors",
        getCardBorderColor(status),
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-[14px] font-semibold text-foreground">OSIS Pipeline</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <StateIcon state={status.state} />
          <span
            className={cn(
              "text-[14px] font-medium",
              status.state === "Running" && "text-emerald-600 dark:text-emerald-400",
              status.state === "Error" && "text-amber-600 dark:text-amber-400",
              status.state === "Stopped" && "text-red-600 dark:text-red-400",
            )}
          >
            {status.state}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-[13px] text-muted-foreground">Records Synced (1h)</div>
          <div className="text-[16px] font-semibold tabular-nums text-foreground">
            {status.recordsSyncedLastHour.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[13px] text-muted-foreground">Current Lag</div>
          <div
            className={cn(
              "text-[16px] font-semibold tabular-nums",
              lagWarning ? "text-amber-600 dark:text-amber-400" : "text-foreground",
            )}
          >
            {status.currentLagSeconds}s
          </div>
        </div>
      </div>

      {/* Lag warning */}
      {lagWarning && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950 px-2.5 py-1.5 mb-3">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-[13px] text-amber-700 dark:text-amber-300">
            Pipeline lag exceeds 5 minutes
          </span>
        </div>
      )}

      {/* Admin reindex button */}
      {isAdmin && (
        <button
          type="button"
          onClick={handleReindex}
          disabled={isReindexing}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-[14px] font-medium text-foreground cursor-pointer",
            "hover:bg-muted/80 transition-colors",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isReindexing && "animate-spin")} />
          {isReindexing ? "Reindexing..." : "Trigger Reindex"}
        </button>
      )}
    </div>
  );
}
