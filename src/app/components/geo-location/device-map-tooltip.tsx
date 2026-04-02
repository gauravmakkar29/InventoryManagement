import { useState, useRef, useEffect } from "react";
import { X, Navigation, EyeOff } from "lucide-react";
import { cn } from "../../../lib/utils";
import { DeviceStatus } from "../../../lib/types";
import type { GeoDevice } from "./geo-location-types";

// ---------------------------------------------------------------------------
// StatusBadge (shared by tooltip and map-controls)
// ---------------------------------------------------------------------------

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; text: string; bg: string }> = {
    [DeviceStatus.Online]: {
      dot: "bg-emerald-500",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    [DeviceStatus.Offline]: {
      dot: "bg-red-500",
      text: "text-red-700",
      bg: "bg-red-50",
    },
    [DeviceStatus.Maintenance]: {
      dot: "bg-amber-500",
      text: "text-amber-700",
      bg: "bg-amber-50",
    },
    [DeviceStatus.Decommissioned]: {
      dot: "bg-gray-400",
      text: "text-muted-foreground",
      bg: "bg-muted",
    },
  };
  const c = config[status] ?? {
    dot: "bg-gray-400",
    text: "text-muted-foreground",
    bg: "bg-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium",
        c.bg,
        c.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// DeviceTooltip
// ---------------------------------------------------------------------------

/** Tooltip card shown when a marker is clicked */
export function DeviceTooltip({
  device,
  position,
  onClose,
  onShowTrail,
  containerRef,
  trailActive,
}: {
  device: GeoDevice;
  position: { x: number; y: number };
  onClose: () => void;
  onShowTrail: (device: GeoDevice) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  trailActive: boolean;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);

  useEffect(() => {
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    if (!tooltip || !container) return;

    const containerRect = container.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let x = position.x;
    let y = position.y;

    if (x + tooltipRect.width > containerRect.width - 8) {
      x = Math.max(8, x - tooltipRect.width - 16);
    }
    if (y + tooltipRect.height > containerRect.height - 8) {
      y = Math.max(8, y - tooltipRect.height - 16);
    }
    if (x < 8) x = 8;
    if (y < 8) y = 8;

    setAdjustedPos({ x, y });
  }, [position, containerRef]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const healthColor =
    device.health >= 90
      ? "text-emerald-600"
      : device.health >= 70
        ? "text-amber-600"
        : device.health >= 50
          ? "text-orange-600"
          : "text-red-600";

  return (
    <div
      ref={tooltipRef}
      className="absolute z-50 w-[220px] rounded-lg border border-border bg-card shadow-lg animate-in fade-in duration-150"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <span className="text-[14px] font-semibold text-foreground truncate pr-2">
          {device.name}
        </span>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground cursor-pointer"
          aria-label="Close tooltip"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-2 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Status</span>
          <StatusBadge status={device.status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Health</span>
          <span className={cn("text-[14px] font-semibold tabular-nums", healthColor)}>
            {device.health}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Firmware</span>
          <span className="text-[13px] font-mono text-foreground/80">{device.firmware}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Location</span>
          <span className="text-[13px] text-foreground/80 text-right truncate max-w-[120px]">
            {device.location}
          </span>
        </div>
      </div>
      {/* Story 10.5: Show/Hide Trail button */}
      <div className="border-t border-border/60 px-3 py-2">
        <button
          onClick={() => onShowTrail(device)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-50 px-2 py-1.5 text-[13px] font-medium text-blue-700 hover:bg-blue-100 cursor-pointer transition-colors"
        >
          {trailActive ? (
            <>
              <EyeOff className="h-3 w-3" />
              Hide Trail
            </>
          ) : (
            <>
              <Navigation className="h-3 w-3" />
              Show Trail
            </>
          )}
        </button>
      </div>
    </div>
  );
}
