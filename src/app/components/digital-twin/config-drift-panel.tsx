import { useState } from "react";
import { CheckCircle, ChevronRight, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { DigitalTwin, ConfigDriftItem } from "./digital-twin-types";

// Story 15.4 — Config Drift Panel
export function ConfigDriftPanel({ twin, onClose }: { twin: DigitalTwin; onClose: () => void }) {
  const [selectedItem, setSelectedItem] = useState<ConfigDriftItem | null>(null);

  const severityBorder = (s: string) => {
    if (s === "Critical") return "border-l-red-500";
    if (s === "Warning") return "border-l-amber-500";
    return "border-l-blue-500";
  };

  const severityBadge = (s: string) => {
    if (s === "Critical") return "bg-danger-bg text-danger-text";
    if (s === "Warning") return "bg-warning-bg text-warning-text";
    return "bg-info-bg text-info-text";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[15px] font-semibold text-foreground">Configuration Drift Analysis</h4>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-muted-foreground cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {twin.configDriftDetails.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle className="h-8 w-8 text-success mb-2" />
          <p className="text-[15px] font-medium text-foreground/80">Configuration In Sync</p>
          <p className="text-[14px] text-muted-foreground mt-1">
            All config keys match the golden baseline
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {twin.configDriftDetails.map((item) => (
            <div
              key={item.configKey}
              className={cn(
                "rounded-lg border border-border border-l-4 bg-card p-3 cursor-pointer hover:shadow-sm",
                severityBorder(item.severity),
              )}
              onClick={() =>
                setSelectedItem(selectedItem?.configKey === item.configKey ? null : item)
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <code className="text-[14px] font-mono font-semibold text-foreground">
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
                    "h-4 w-4 text-muted-foreground transition-transform",
                    selectedItem?.configKey === item.configKey && "rotate-90",
                  )}
                />
              </div>
              <p className="text-[13px] text-muted-foreground mt-1">
                Detected {new Date(item.detectedAt).toLocaleDateString()}
              </p>

              {selectedItem?.configKey === item.configKey && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-success-bg border border-success-bg p-2.5">
                    <p className="text-[12px] font-semibold text-success-text mb-1">Expected</p>
                    <code className="text-[14px] font-mono text-success-text">
                      {item.expectedValue}
                    </code>
                  </div>
                  <div className="rounded-lg bg-danger-bg border border-danger-border p-2.5">
                    <p className="text-[12px] font-semibold text-danger-text mb-1">Actual</p>
                    <code className="text-[14px] font-mono text-danger-text">
                      {item.actualValue}
                    </code>
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
