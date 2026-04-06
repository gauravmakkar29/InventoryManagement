import { Navigation, Clock } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { GeoDevice, TrailPoint } from "./geo-location-types";

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
