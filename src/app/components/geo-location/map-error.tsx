import { AlertTriangle } from "lucide-react";
import { cn } from "../../../lib/utils";
import { StatusBadge } from "./device-map-tooltip";
import type { GeoDevice } from "./geo-location-types";

// ---------------------------------------------------------------------------
// MapError
// ---------------------------------------------------------------------------

/** Fallback when map fails to load */
export function MapError({ devices, onRetry }: { devices: GeoDevice[]; onRetry: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-warning-bg bg-warning-bg px-4 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning-text" />
        <p className="text-[14px] text-warning-text">
          Unable to load map. Showing device list instead.
        </p>
        <button
          onClick={onRetry}
          className="ml-auto shrink-0 rounded-md border border-warning-bg bg-card px-3 py-1 text-[13px] font-medium text-warning-text hover:bg-warning-bg cursor-pointer"
        >
          Retry
        </button>
      </div>
      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <caption className="sr-only">Device geo-locations</caption>
          <thead>
            <tr className="border-b-2 border-border bg-table-header">
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Device
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Location
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Health
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device, i) => (
              <tr
                key={device.id}
                className={cn(
                  "border-b border-border/60 last:border-0",
                  i % 2 === 1 && "bg-muted/30",
                )}
              >
                <td className="px-4 py-2 text-[14px] font-medium text-foreground">{device.name}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={device.status} />
                </td>
                <td className="px-4 py-2 text-[14px] text-muted-foreground">{device.location}</td>
                <td className="px-4 py-2 text-[14px] font-mono text-muted-foreground">
                  {device.health}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
