import { ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { DigitalTwin, HealthFactors } from "./digital-twin-types";
import { getHealthColor } from "./digital-twin-health-utils";
import { HealthScoreGauge } from "./health-score-gauge";

// Story 15.1 — Twin Card
export function TwinCard({ twin, onClick }: { twin: DigitalTwin; onClick: () => void }) {
  const topRiskFactor = (
    Object.entries(twin.healthFactors) as [keyof HealthFactors, number][]
  ).sort(([, a], [, b]) => a - b)[0];
  const riskLabel: Record<keyof HealthFactors, string> = {
    firmwareAge: "Firmware Age",
    vulnerabilityExposure: "Vulnerability Exposure",
    uptimeScore: "Uptime",
    telemetryHealth: "Telemetry Health",
    complianceScore: "Compliance",
    incidentHistory: "Incident History",
  };

  return (
    <div
      className="card-elevated px-4 py-3.5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <HealthScoreGauge score={twin.healthScore} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-foreground truncate">{twin.deviceName}</p>
            {Math.abs(twin.healthDelta) > 10 && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[12px] font-bold tabular-nums",
                  twin.healthDelta > 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700",
                )}
              >
                {twin.healthDelta > 0 ? "+" : ""}
                {twin.healthDelta}
              </span>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground truncate">{twin.deviceModel}</p>
          {topRiskFactor && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[12px] text-muted-foreground">Top risk:</span>
              <span
                className="text-[12px] font-medium"
                style={{ color: getHealthColor(topRiskFactor[1]) }}
              >
                {riskLabel[topRiskFactor[0]]} ({topRiskFactor[1]})
              </span>
            </div>
          )}
          <p className="mt-1 text-[12px] text-muted-foreground tabular-nums">
            Synced {new Date(twin.lastSyncedAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[12px] font-semibold",
              twin.configDriftStatus === "InSync"
                ? "bg-emerald-50 text-emerald-700"
                : twin.configDriftStatus === "Drifted"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {twin.configDriftStatus === "InSync" ? "In Sync" : twin.configDriftStatus}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
