import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { MapPin, ZoomIn, ZoomOut, AlertTriangle, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { DeviceStatus } from "../../lib/types";
import { resolveDeviceCoordinates } from "../../lib/location-coords";
import { Skeleton } from "../../components/skeleton";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface GeoDevice {
  id: string;
  name: string;
  serial: string;
  model: string;
  status: DeviceStatus;
  location: string;
  health: number;
  firmware: string;
  lastSeen: string;
  lat?: number;
  lng?: number;
}

type GeoStatusFilter =
  | "all"
  | DeviceStatus.Online
  | DeviceStatus.Offline
  | DeviceStatus.Maintenance;

interface FilterOption {
  id: GeoStatusFilter;
  label: string;
  color: string;
  activeColor: string;
  dotColor: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// World Atlas TopoJSON — lightweight 110m resolution (~200 KB, cached by browser)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const STATUS_COLORS: Record<string, string> = {
  [DeviceStatus.Online]: "#10b981",
  [DeviceStatus.Offline]: "#ef4444",
  [DeviceStatus.Maintenance]: "#f59e0b",
  [DeviceStatus.Decommissioned]: "#6b7280",
};

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: "all",
    label: "All",
    color: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    activeColor: "bg-[#FF7900] text-white",
    dotColor: "",
  },
  {
    id: DeviceStatus.Online,
    label: "Online",
    color: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    activeColor: "bg-emerald-600 text-white",
    dotColor: "bg-emerald-500",
  },
  {
    id: DeviceStatus.Offline,
    label: "Offline",
    color: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    activeColor: "bg-red-600 text-white",
    dotColor: "bg-red-500",
  },
  {
    id: DeviceStatus.Maintenance,
    label: "Maintenance",
    color: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    activeColor: "bg-amber-600 text-white",
    dotColor: "bg-amber-500",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
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
      text: "text-gray-600",
      bg: "bg-gray-100",
    },
  };
  const c = config[status] ?? {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
        c.bg,
        c.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {status}
    </span>
  );
}

/** Tooltip card shown when a marker is clicked */
function DeviceTooltip({
  device,
  position,
  onClose,
  containerRef,
}: {
  device: GeoDevice;
  position: { x: number; y: number };
  onClose: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState(position);

  // Smart positioning to keep tooltip within container bounds
  useEffect(() => {
    const tooltip = tooltipRef.current;
    const container = containerRef.current;
    if (!tooltip || !container) return;

    const containerRect = container.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let x = position.x;
    let y = position.y;

    // Prevent overflow right
    if (x + tooltipRect.width > containerRect.width - 8) {
      x = Math.max(8, x - tooltipRect.width - 16);
    }
    // Prevent overflow bottom
    if (y + tooltipRect.height > containerRect.height - 8) {
      y = Math.max(8, y - tooltipRect.height - 16);
    }
    // Prevent overflow left
    if (x < 8) x = 8;
    // Prevent overflow top
    if (y < 8) y = 8;

    setAdjustedPos({ x, y });
  }, [position, containerRef]);

  // Close tooltip on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay to avoid immediate close from the marker click itself
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
      className="absolute z-50 w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg animate-in fade-in duration-150"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="text-[13px] font-semibold text-gray-900 truncate pr-2">{device.name}</span>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          aria-label="Close tooltip"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-2 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Status</span>
          <StatusBadge status={device.status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Health</span>
          <span className={cn("text-[12px] font-semibold tabular-nums", healthColor)}>
            {device.health}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Firmware</span>
          <span className="text-[11px] font-mono text-gray-700">{device.firmware}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Location</span>
          <span className="text-[11px] text-gray-700 text-right truncate max-w-[120px]">
            {device.location}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Skeleton placeholder while map loads */
function MapSkeleton() {
  return (
    <div className="relative h-[450px] w-full rounded-lg overflow-hidden">
      <Skeleton className="h-full w-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <MapPin className="h-8 w-8 text-gray-300 animate-pulse" />
          <span className="text-[12px] text-gray-400">Loading map...</span>
        </div>
      </div>
    </div>
  );
}

/** Fallback when map fails to load */
function MapError({ devices, onRetry }: { devices: GeoDevice[]; onRetry: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-[12px] text-amber-800">
          Unable to load map. Showing device list instead.
        </p>
        <button
          onClick={onRetry}
          className="ml-auto shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50 cursor-pointer"
        >
          Retry
        </button>
      </div>
      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-[#f1f3f5]">
              <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Device
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Status
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Location
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-600">
                Health
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device, i) => (
              <tr
                key={device.id}
                className={cn(
                  "border-b border-gray-50 last:border-0",
                  i % 2 === 1 && "bg-gray-50/30",
                )}
              >
                <td className="px-4 py-2 text-[13px] font-medium text-gray-900">{device.name}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={device.status} />
                </td>
                <td className="px-4 py-2 text-[12px] text-gray-600">{device.location}</td>
                <td className="px-4 py-2 text-[12px] font-mono text-gray-500">{device.health}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component — GeoLocationMap
// ---------------------------------------------------------------------------
export function GeoLocationMap({ devices }: { devices: GeoDevice[] }) {
  const [statusFilter, setStatusFilter] = useState<GeoStatusFilter>("all");
  const [selectedDevice, setSelectedDevice] = useState<GeoDevice | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Story 9.3: Status filter pills — compute filtered device list
  const filteredDevices = useMemo(() => {
    if (statusFilter === "all") return devices;
    return devices.filter((d) => d.status === statusFilter);
  }, [devices, statusFilter]);

  // Story 9.5: Coordinate resolution — resolve coordinates for all filtered devices
  const mappableDevices = useMemo(() => {
    return filteredDevices
      .map((device) => {
        const coords = resolveDeviceCoordinates(device);
        if (!coords) return null;
        return { ...device, resolvedLat: coords.lat, resolvedLng: coords.lng };
      })
      .filter((d): d is GeoDevice & { resolvedLat: number; resolvedLng: number } => d !== null);
  }, [filteredDevices]);

  // Count devices per status for pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: devices.length };
    for (const d of devices) {
      counts[d.status] = (counts[d.status] || 0) + 1;
    }
    return counts;
  }, [devices]);

  const handleMarkerClick = useCallback(
    (device: GeoDevice, event: React.MouseEvent) => {
      event.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left + 12;
      const y = event.clientY - rect.top + 12;

      // Toggle if same device
      if (selectedDevice?.id === device.id) {
        setSelectedDevice(null);
        return;
      }

      setSelectedDevice(device);
      setTooltipPosition({ x, y });
    },
    [selectedDevice],
  );

  const handleMapClick = useCallback(() => {
    setSelectedDevice(null);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.5, 8));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.5, 1));
  }, []);

  const handleMoveEnd = useCallback((position: { coordinates: [number, number]; zoom: number }) => {
    setCenter(position.coordinates);
    setZoom(position.zoom);
  }, []);

  const handleRetry = useCallback(() => {
    setMapError(false);
    setMapLoaded(false);
  }, []);

  // Handle geography load error detection via fetch test
  useEffect(() => {
    if (mapError) return;
    let cancelled = false;

    fetch(GEO_URL, { method: "HEAD" })
      .then((res) => {
        if (!cancelled && !res.ok) setMapError(true);
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [mapError]);

  return (
    <div className="space-y-4">
      {/* Story 9.3: Status filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt.id;
          const count = statusCounts[opt.id] ?? 0;
          return (
            <button
              key={opt.id}
              onClick={() => {
                setStatusFilter(opt.id);
                setSelectedDevice(null);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-medium cursor-pointer transition-colors",
                isActive ? opt.activeColor : opt.color,
              )}
              aria-pressed={isActive}
            >
              {opt.dotColor && !isActive && (
                <span className={cn("h-2 w-2 rounded-full", opt.dotColor)} />
              )}
              {opt.label}
              <span className={cn("text-[11px]", isActive ? "opacity-80" : "text-gray-400")}>
                ({count})
              </span>
            </button>
          );
        })}
        {/* Device count badge */}
        <span className="ml-auto text-[12px] text-gray-400">
          Showing {mappableDevices.length} of {devices.length} devices
        </span>
      </div>

      {/* Map error fallback (Story 9.1 AC5) */}
      {mapError ? (
        <MapError devices={filteredDevices} onRetry={handleRetry} />
      ) : (
        <>
          {/* Map container */}
          <div
            ref={containerRef}
            className="card-elevated relative overflow-hidden"
            style={{ minHeight: 450 }}
          >
            {/* Loading skeleton (Story 9.1 AC6) */}
            {!mapLoaded && !mapError && (
              <div className="absolute inset-0 z-10">
                <MapSkeleton />
              </div>
            )}

            {/* Zoom controls (Story 9.1 AC3) */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
              <button
                onClick={handleZoomIn}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 cursor-pointer"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 cursor-pointer"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
            </div>

            {/* Story 9.1: World map rendering */}
            <div onClick={handleMapClick}>
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 147, center: [0, 20] }}
                width={800}
                height={450}
                style={{ width: "100%", height: "auto" }}
              >
                <ZoomableGroup
                  center={center}
                  zoom={zoom}
                  minZoom={1}
                  maxZoom={8}
                  onMoveEnd={handleMoveEnd}
                >
                  {/* Land areas */}
                  <Geographies geography={GEO_URL}>
                    {({ geographies }) => {
                      // Mark map as loaded once geographies render
                      if (!mapLoaded && geographies.length > 0) {
                        // Use a microtask to avoid setState during render
                        queueMicrotask(() => setMapLoaded(true));
                      }
                      return geographies.map((geo) => (
                        <Geography
                          key={(geo.rpiProperties?.NAME as string) ?? geo.id}
                          geography={geo}
                          fill="#e2e8f0"
                          stroke="#cbd5e1"
                          strokeWidth={0.5}
                          style={{ outline: "none" }}
                        />
                      ));
                    }}
                  </Geographies>

                  {/* Story 9.2: Device markers */}
                  {mappableDevices.map((device) => (
                    <Marker key={device.id} coordinates={[device.resolvedLng, device.resolvedLat]}>
                      <circle
                        r={5 / Math.sqrt(zoom)}
                        fill={STATUS_COLORS[device.status] ?? "#6b7280"}
                        stroke="#ffffff"
                        strokeWidth={1.5 / Math.sqrt(zoom)}
                        style={{ cursor: "pointer" }}
                        onClick={(e) => handleMarkerClick(device, e as unknown as React.MouseEvent)}
                        onMouseEnter={(e) => {
                          const target = e.target as SVGCircleElement;
                          target.setAttribute("r", String((7 / Math.sqrt(zoom)).toFixed(2)));
                        }}
                        onMouseLeave={(e) => {
                          const target = e.target as SVGCircleElement;
                          target.setAttribute("r", String((5 / Math.sqrt(zoom)).toFixed(2)));
                        }}
                      />
                    </Marker>
                  ))}
                </ZoomableGroup>
              </ComposableMap>
            </div>

            {/* Story 9.4: Device marker tooltip */}
            {selectedDevice && (
              <DeviceTooltip
                device={selectedDevice}
                position={tooltipPosition}
                onClose={() => setSelectedDevice(null)}
                containerRef={containerRef}
              />
            )}
          </div>

          {/* Story 9.3 AC6: Empty filter state */}
          {mappableDevices.length === 0 && (
            <div className="flex h-32 items-center justify-center card-elevated">
              <div className="text-center">
                <MapPin className="mx-auto h-8 w-8 text-gray-200 mb-2" />
                <p className="text-[13px] font-medium text-gray-500">
                  No devices match the selected filter
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
