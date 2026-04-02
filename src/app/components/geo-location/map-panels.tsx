import { useState } from "react";
import {
  MapPin,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Shield,
  Navigation,
  Clock,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Skeleton } from "../../../components/skeleton";
import { StatusBadge } from "./device-map-tooltip";
import type { GeoDevice, Geofence, TrailPoint } from "./geo-location-types";

// ---------------------------------------------------------------------------
// GeofencePanel (Story 10.4)
// ---------------------------------------------------------------------------

/** Story 10.4: Geofence panel — collapsible sidebar listing all geofences */
export function GeofencePanel({
  geofences,
  showGeofences,
  onToggleGeofences,
  onSelectGeofence,
  onCreateGeofence,
}: {
  geofences: Geofence[];
  showGeofences: boolean;
  onToggleGeofences: () => void;
  onSelectGeofence: (geofence: Geofence) => void;
  onCreateGeofence: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="card-elevated overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-[14px] font-semibold text-foreground">Geofence Zones</span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[12px] font-medium text-blue-700">
            {geofences.length}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border/60">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
            <button
              onClick={onToggleGeofences}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium cursor-pointer transition-colors",
                showGeofences ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground",
              )}
            >
              {showGeofences ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {showGeofences ? "Visible" : "Hidden"}
            </button>
            <button
              onClick={onCreateGeofence}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[13px] font-medium text-white hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Plus className="h-3 w-3" />
              Create
            </button>
          </div>

          <div className="max-h-[200px] overflow-y-auto">
            {geofences.map((gf) => (
              <button
                key={gf.id}
                onClick={() => onSelectGeofence(gf)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted cursor-pointer transition-colors"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: gf.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-foreground truncate">{gf.name}</p>
                  <p className="text-[12px] text-muted-foreground">{gf.radiusKm}km radius</p>
                </div>
                <span className="text-[13px] font-medium text-muted-foreground tabular-nums">
                  {gf.deviceCount} devices
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TrailTimeline (Story 10.5)
// ---------------------------------------------------------------------------

/** Story 10.5: Device position history trail timeline */
export function TrailTimeline({
  device,
  trail,
  onHideTrail,
}: {
  device: GeoDevice;
  trail: TrailPoint[];
  onHideTrail: () => void;
}) {
  return (
    <div className="card-elevated overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-blue-600" />
          <span className="text-[14px] font-semibold text-foreground">
            Position Trail — {device.name}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[12px] font-medium text-muted-foreground">
            {trail.length} points
          </span>
        </div>
        <button
          onClick={onHideTrail}
          className="rounded-md px-2.5 py-1 text-[13px] font-medium text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
        >
          Hide Trail
        </button>
      </div>
      <div className="max-h-[180px] overflow-y-auto px-4 py-2">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-blue-200" />
          {trail
            .slice(-10)
            .reverse()
            .map((point, idx) => {
              const date = new Date(point.timestamp);
              const isLatest = idx === 0;
              return (
                <div key={point.timestamp} className="relative flex items-start gap-3 pb-3">
                  <div
                    className={cn(
                      "relative z-10 mt-0.5 shrink-0 rounded-full",
                      isLatest ? "h-3 w-3 bg-blue-600" : "h-2.5 w-2.5 bg-blue-300",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground/80">
                        {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                      </span>
                      {isLatest && (
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[12px] font-medium text-blue-700">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[12px] text-muted-foreground">
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                        {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MapSkeleton
// ---------------------------------------------------------------------------

/** Skeleton placeholder while map loads */
export function MapSkeleton() {
  return (
    <div className="relative h-[450px] w-full rounded-lg overflow-hidden">
      <Skeleton className="h-full w-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <MapPin className="h-8 w-8 text-muted-foreground animate-pulse" />
          <span className="text-[14px] text-muted-foreground">Loading map...</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MapError
// ---------------------------------------------------------------------------

/** Fallback when map fails to load */
export function MapError({ devices, onRetry }: { devices: GeoDevice[]; onRetry: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-[14px] text-amber-800">
          Unable to load map. Showing device list instead.
        </p>
        <button
          onClick={onRetry}
          className="ml-auto shrink-0 rounded-md border border-amber-300 bg-card px-3 py-1 text-[13px] font-medium text-amber-700 hover:bg-amber-50 cursor-pointer"
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
