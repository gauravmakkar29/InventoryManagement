import { Zap } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { TwinStateSnapshot } from "./digital-twin-types";
import { getHealthColor } from "./digital-twin-health-utils";

// Story 15.2 — State Snapshot Card
export function StateSnapshotCard({ snapshot }: { snapshot: TwinStateSnapshot }) {
  return (
    <div className="rounded-lg border border-border bg-muted p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] font-semibold text-foreground">
          State at {new Date(snapshot.timestamp).toLocaleString()}
        </h4>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[12px] font-medium",
            snapshot.triggeredBy === "event"
              ? "bg-orange-50 text-accent-text"
              : snapshot.triggeredBy === "manual"
                ? "bg-blue-50 text-blue-700"
                : "bg-muted text-muted-foreground",
          )}
        >
          {snapshot.triggeredBy}
        </span>
      </div>
      {snapshot.event && (
        <div className="flex items-center gap-1.5 text-[13px] text-accent-text font-medium">
          <Zap className="h-3 w-3" />
          {snapshot.event}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 text-[14px]">
        <div>
          <p className="text-muted-foreground">Firmware</p>
          <p className="font-medium text-foreground/80">{snapshot.firmwareVersion}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Health Score</p>
          <p className="font-medium" style={{ color: getHealthColor(snapshot.healthScore) }}>
            {snapshot.healthScore}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Status</p>
          <p className="font-medium text-foreground/80 capitalize">{snapshot.status}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Config Hash</p>
          <p className="font-mono text-muted-foreground truncate">
            {snapshot.configHash.slice(0, 16)}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card border border-border/60 px-2.5 py-2 text-center">
          <p className="text-[15px] font-bold tabular-nums text-foreground">
            {snapshot.telemetrySummary.avgTemperature.toFixed(1)}
          </p>
          <p className="text-[12px] text-muted-foreground">Avg Temp</p>
        </div>
        <div className="rounded-lg bg-card border border-border/60 px-2.5 py-2 text-center">
          <p className="text-[15px] font-bold tabular-nums text-foreground">
            {snapshot.telemetrySummary.avgCpuLoad.toFixed(1)}%
          </p>
          <p className="text-[12px] text-muted-foreground">CPU Load</p>
        </div>
        <div className="rounded-lg bg-card border border-border/60 px-2.5 py-2 text-center">
          <p className="text-[15px] font-bold tabular-nums text-foreground">
            {snapshot.telemetrySummary.avgErrorRate.toFixed(2)}%
          </p>
          <p className="text-[12px] text-muted-foreground">Error Rate</p>
        </div>
      </div>
    </div>
  );
}
