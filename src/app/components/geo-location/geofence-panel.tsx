import { useState } from "react";
import { Shield, ChevronRight, ChevronDown, Plus, Eye, EyeOff } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { Geofence } from "./geo-location-types";

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
          <Shield className="h-4 w-4 text-info" />
          <span className="text-[14px] font-semibold text-foreground">Geofence Zones</span>
          <span className="rounded-full bg-info-bg px-2 py-0.5 text-[12px] font-medium text-info-text">
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
                showGeofences ? "bg-info-bg text-info-text" : "bg-muted text-muted-foreground",
              )}
            >
              {showGeofences ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {showGeofences ? "Visible" : "Hidden"}
            </button>
            <button
              onClick={onCreateGeofence}
              className="flex items-center gap-1 rounded-md bg-info px-2.5 py-1 text-[13px] font-medium text-white hover:bg-info-text cursor-pointer transition-colors"
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
