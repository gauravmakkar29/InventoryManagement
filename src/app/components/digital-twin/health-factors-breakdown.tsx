import type { HealthFactors } from "./digital-twin-types";
import { getHealthColor } from "./digital-twin-health-utils";

// Story 15.1 — Health Factors Breakdown bars
export function HealthFactorsBreakdown({ factors }: { factors: HealthFactors }) {
  const factorList: { key: keyof HealthFactors; label: string; weight: number }[] = [
    { key: "firmwareAge", label: "Firmware Age", weight: 0.15 },
    { key: "vulnerabilityExposure", label: "Vulnerability Exposure", weight: 0.25 },
    { key: "uptimeScore", label: "Uptime", weight: 0.15 },
    { key: "telemetryHealth", label: "Telemetry Health", weight: 0.2 },
    { key: "complianceScore", label: "Compliance", weight: 0.1 },
    { key: "incidentHistory", label: "Incident History", weight: 0.15 },
  ];

  return (
    <div className="space-y-2">
      {factorList.map((f) => {
        const value = factors[f.key];
        const color = getHealthColor(value);
        return (
          <div key={f.key} className="flex items-center gap-2">
            <span className="w-[130px] truncate text-[13px] text-muted-foreground">{f.label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${value}%`, backgroundColor: color }}
              />
            </div>
            <span className="w-8 text-right text-[13px] font-semibold tabular-nums text-foreground/80">
              {value}
            </span>
            <span className="text-[12px] text-muted-foreground">
              ({Math.round(f.weight * 100)}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}
