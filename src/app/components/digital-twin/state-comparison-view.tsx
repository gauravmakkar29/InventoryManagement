import { X } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { TwinStateSnapshot } from "./digital-twin-types";

// Story 15.2 — State Comparison View
export function StateComparisonView({
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
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[14px] font-semibold text-foreground">State Comparison</h4>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-muted-foreground cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-[120px_1fr_1fr] gap-y-1.5 text-[14px]">
        <div className="font-semibold text-muted-foreground text-[12px] uppercase">Field</div>
        <div className="font-semibold text-muted-foreground text-[12px] uppercase">
          {new Date(left.timestamp).toLocaleDateString()}
        </div>
        <div className="font-semibold text-muted-foreground text-[12px] uppercase">
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
              <span className="text-muted-foreground font-medium">{f.label}</span>
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
