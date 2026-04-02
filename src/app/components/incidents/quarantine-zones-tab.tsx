/**
 * IMS Gen 2 — Epic 14: Quarantine Zones Tab (Story 14.4)
 */
import { useState, useMemo } from "react";
import { cn } from "../../../lib/utils";
import { formatRelativeTime } from "../../../lib/utils";
import type { QuarantineZone } from "../../../lib/incident-types";

export function QuarantineZonesTab({
  zones,
  onLift,
}: {
  zones: QuarantineZone[];
  onLift: (zoneId: string) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Lifted">("All");

  const filtered = useMemo(() => {
    if (filterStatus === "All") return zones;
    return zones.filter((z) => z.status === filterStatus);
  }, [zones, filterStatus]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "All" | "Active" | "Lifted")}
          className="rounded-lg border border-border px-3 py-2 text-[14px] text-foreground/80 focus:outline-none focus:border-accent-text"
        >
          <option value="All">All Zones</option>
          <option value="Active">Active</option>
          <option value="Lifted">Lifted</option>
        </select>
      </div>

      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <caption className="sr-only">Containment zones</caption>
          <thead>
            <tr className="border-b-2 border-border bg-table-header">
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Zone Name
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-center text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Devices
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Incident
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Policy
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Radius
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Created
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-right text-[13px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((zone, i) => (
              <tr
                key={zone.id}
                className={cn(
                  "h-[48px]",
                  zone.status === "Lifted" && "opacity-60",
                  i % 2 === 1 && "bg-muted/50",
                )}
              >
                <td className="px-4">
                  <div>
                    <p className="text-[14px] font-medium text-foreground">{zone.name}</p>
                    <p className="text-[13px] text-muted-foreground">{zone.id}</p>
                  </div>
                </td>
                <td className="px-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[13px] font-semibold",
                      zone.status === "Active"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        zone.status === "Active" ? "bg-red-500" : "bg-muted-foreground/70",
                      )}
                    />
                    {zone.status}
                  </span>
                </td>
                <td className="px-4 text-center text-[14px] font-medium text-foreground/80">
                  {zone.isolatedDeviceCount}
                </td>
                <td className="px-4 text-[14px] text-blue-600 font-medium">{zone.incidentId}</td>
                <td className="px-4">
                  <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[12px] font-medium text-amber-700">
                    {zone.isolationPolicy}
                  </span>
                </td>
                <td className="px-4 text-[14px] text-muted-foreground">{zone.radiusKm} km</td>
                <td className="px-4 text-[14px] text-muted-foreground">
                  {formatRelativeTime(zone.createdAt)}
                </td>
                <td className="px-4 text-right">
                  {zone.status === "Active" ? (
                    <button
                      onClick={() => onLift(zone.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium text-foreground/80 hover:bg-muted cursor-pointer"
                    >
                      Lift Quarantine
                    </button>
                  ) : (
                    <span className="text-[13px] text-muted-foreground">
                      Lifted {zone.liftedAt ? formatRelativeTime(zone.liftedAt) : ""}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quarantine Map Preview */}
      <div className="card-elevated p-5">
        <h3 className="text-[15px] font-semibold text-foreground mb-3">Quarantine Zone Map</h3>
        <div className="relative h-[300px] rounded-lg bg-muted border border-border overflow-hidden">
          <svg viewBox="0 0 800 300" className="w-full h-full">
            {/* World map simple backdrop */}
            <rect width="800" height="300" fill="#f1f3f5" />
            <text
              x="400"
              y="20"
              textAnchor="middle"
              className="text-[13px] fill-muted-foreground/70 font-medium"
            >
              Active Quarantine Zones
            </text>
            {/* Singapore zone */}
            <circle
              cx="620"
              cy="170"
              r="30"
              fill="rgba(239,68,68,0.1)"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            <text
              x="620"
              y="170"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[12px] fill-red-600 font-semibold"
            >
              Singapore Lab
            </text>
            <circle cx="620" cy="170" r="3" fill="#ef4444" />
            {/* Shanghai zone */}
            <circle
              cx="580"
              cy="100"
              r="45"
              fill="rgba(239,68,68,0.1)"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            <text
              x="580"
              y="100"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[12px] fill-red-600 font-semibold"
            >
              Shanghai West
            </text>
            <circle cx="580" cy="100" r="3" fill="#ef4444" />
            {/* Denver (lifted) */}
            <circle
              cx="180"
              cy="110"
              r="20"
              fill="rgba(156,163,175,0.1)"
              stroke="#9ca3af"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x="180"
              y="110"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] fill-muted-foreground/70"
            >
              Denver (Lifted)
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
