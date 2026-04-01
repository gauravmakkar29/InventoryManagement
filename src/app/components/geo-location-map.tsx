import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  Shield,
  Navigation,
  Clock,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { DeviceStatus } from "../../lib/types";
import {
  resolveDeviceCoordinates,
  getCityCoordinates,
  type CityCoordinates,
} from "../../lib/location-coords";
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

/** Story 10.2: Cluster of nearby devices grouped by location */
interface DeviceCluster {
  id: string;
  location: string;
  lat: number;
  lng: number;
  devices: ResolvedDevice[];
  count: number;
}

/** Story 10.4: Geofence boundary definition */
interface Geofence {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  deviceCount: number;
  color: string;
}

/** Story 10.5: Device position history point */
interface TrailPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

type ResolvedDevice = GeoDevice & { resolvedLat: number; resolvedLng: number };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

/** Story 10.4: Default geofence zones around major device clusters */
const DEFAULT_GEOFENCES: Geofence[] = [
  {
    id: "gf-sydney",
    name: "Sydney Warehouse",
    centerLat: -33.8688,
    centerLng: 151.2093,
    radiusKm: 50,
    deviceCount: 0,
    color: "#2563eb",
  },
  {
    id: "gf-singapore",
    name: "Singapore Hub",
    centerLat: 1.3521,
    centerLng: 103.8198,
    radiusKm: 40,
    deviceCount: 0,
    color: "#7c3aed",
  },
  {
    id: "gf-london",
    name: "London Service Zone",
    centerLat: 51.5074,
    centerLng: -0.1278,
    radiusKm: 60,
    deviceCount: 0,
    color: "#0891b2",
  },
  {
    id: "gf-newyork",
    name: "New York Region",
    centerLat: 40.7128,
    centerLng: -74.006,
    radiusKm: 50,
    deviceCount: 0,
    color: "#059669",
  },
  {
    id: "gf-tokyo",
    name: "Tokyo Data Center",
    centerLat: 35.6762,
    centerLng: 139.6503,
    radiusKm: 35,
    deviceCount: 0,
    color: "#dc2626",
  },
];

/**
 * Story 10.5: Generate mock position trail for a device.
 * In production this would come from Amazon Location Tracker API.
 */
function generateMockTrail(device: ResolvedDevice): TrailPoint[] {
  const points: TrailPoint[] = [];
  const baseDate = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);
    // Simulate small movements around current position
    const jitterLat = Math.sin(i * 0.7 + device.resolvedLat) * 0.5;
    const jitterLng = Math.cos(i * 0.5 + device.resolvedLng) * 0.5;
    points.push({
      lat: device.resolvedLat + jitterLat,
      lng: device.resolvedLng + jitterLng,
      timestamp: date.toISOString(),
    });
  }
  // Last point is current position
  points.push({
    lat: device.resolvedLat,
    lng: device.resolvedLng,
    timestamp: new Date().toISOString(),
  });
  return points;
}

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

/** Story 10.3: Location search bar with autocomplete */
function LocationSearchBar({
  onLocationSelect,
  onClear,
}: {
  onLocationSelect: (coords: CityCoordinates) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CityCoordinates[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setNoResults(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      // Client-side geocoding against known cities (mock for Places API)
      const normalizedQuery = value.toLowerCase().trim();
      const matches: CityCoordinates[] = [];

      const knownNames = [
        "new york",
        "los angeles",
        "chicago",
        "houston",
        "phoenix",
        "dallas",
        "denver",
        "sydney",
        "melbourne",
        "singapore",
        "tokyo",
        "shanghai",
        "london",
        "munich",
        "sao paulo",
      ];

      for (const name of knownNames) {
        if (name.includes(normalizedQuery)) {
          const coords = getCityCoordinates(name);
          if (coords) matches.push(coords);
        }
      }

      if (matches.length === 0) {
        setNoResults(true);
        setSuggestions([]);
      } else {
        setSuggestions(matches.slice(0, 5));
        setNoResults(false);
      }
      setShowSuggestions(true);
    }, 300);
  }, []);

  const handleSelect = useCallback(
    (coords: CityCoordinates) => {
      setQuery(coords.label);
      setSuggestions([]);
      setShowSuggestions(false);
      setNoResults(false);
      onLocationSelect(coords);
    },
    [onLocationSelect],
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setNoResults(false);
    onClear();
    inputRef.current?.focus();
  }, [onClear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const first = suggestions[0];
      if (e.key === "Enter" && first) {
        handleSelect(first);
      }
    },
    [suggestions, handleSelect],
  );

  return (
    <div className="absolute top-3 left-3 z-20 w-[240px]">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 || noResults) setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search location..."
          className="w-full rounded-md border border-gray-200 bg-white/95 py-1.5 pl-8 pr-8 text-[14px] text-gray-900 shadow-sm backdrop-blur-sm placeholder:text-gray-600 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          aria-label="Search location"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-600 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showSuggestions && (suggestions.length > 0 || noResults) && (
        <div className="mt-1 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
          {noResults ? (
            <div className="px-3 py-2 text-[13px] text-gray-600">Location not found</div>
          ) : (
            suggestions.map((s) => (
              <button
                key={s.label}
                onMouseDown={() => handleSelect(s)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-gray-700 hover:bg-blue-50 cursor-pointer"
              >
                <MapPin className="h-3 w-3 shrink-0 text-gray-600" />
                <span>{s.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Tooltip card shown when a marker is clicked */
function DeviceTooltip({
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
      className="absolute z-50 w-[220px] rounded-lg border border-gray-200 bg-white shadow-lg animate-in fade-in duration-150"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="text-[14px] font-semibold text-gray-900 truncate pr-2">{device.name}</span>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-0.5 text-gray-600 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
          aria-label="Close tooltip"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-2 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-600">Status</span>
          <StatusBadge status={device.status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-600">Health</span>
          <span className={cn("text-[14px] font-semibold tabular-nums", healthColor)}>
            {device.health}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-600">Firmware</span>
          <span className="text-[13px] font-mono text-gray-700">{device.firmware}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-600">Location</span>
          <span className="text-[13px] text-gray-700 text-right truncate max-w-[120px]">
            {device.location}
          </span>
        </div>
      </div>
      {/* Story 10.5: Show/Hide Trail button */}
      <div className="border-t border-gray-100 px-3 py-2">
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

/** Story 10.2: Cluster marker showing grouped device count */
function ClusterMarker({
  cluster,
  zoom,
  onClick,
}: {
  cluster: DeviceCluster;
  zoom: number;
  onClick: (cluster: DeviceCluster, event: React.MouseEvent) => void;
}) {
  const size = Math.min(16 + cluster.count * 2, 36) / Math.sqrt(zoom);
  const fontSize = Math.max(8, 11 / Math.sqrt(zoom));

  return (
    <Marker coordinates={[cluster.lng, cluster.lat]}>
      <g
        style={{ cursor: "pointer" }}
        onClick={(e) => onClick(cluster, e as unknown as React.MouseEvent)}
      >
        <circle
          r={size}
          fill="#2563eb"
          fillOpacity={0.25}
          stroke="#2563eb"
          strokeWidth={1.5 / Math.sqrt(zoom)}
        />
        <circle
          r={size * 0.7}
          fill="#2563eb"
          fillOpacity={0.6}
          stroke="#ffffff"
          strokeWidth={1 / Math.sqrt(zoom)}
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="#ffffff"
          fontSize={fontSize}
          fontWeight="bold"
          style={{ pointerEvents: "none" }}
        >
          {cluster.count}
        </text>
      </g>
    </Marker>
  );
}

/** Story 10.4: Geofence panel — collapsible sidebar listing all geofences */
function GeofencePanel({
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
        className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-[14px] font-semibold text-gray-900">Geofence Zones</span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[12px] font-medium text-blue-700">
            {geofences.length}
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50">
            <button
              onClick={onToggleGeofences}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium cursor-pointer transition-colors",
                showGeofences ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600",
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
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: gf.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-gray-900 truncate">{gf.name}</p>
                  <p className="text-[12px] text-gray-600">{gf.radiusKm}km radius</p>
                </div>
                <span className="text-[13px] font-medium text-gray-600 tabular-nums">
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

/** Story 10.5: Device position history trail timeline */
function TrailTimeline({
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-blue-600" />
          <span className="text-[14px] font-semibold text-gray-900">
            Position Trail — {device.name}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[12px] font-medium text-gray-600">
            {trail.length} points
          </span>
        </div>
        <button
          onClick={onHideTrail}
          className="rounded-md px-2.5 py-1 text-[13px] font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
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
                      <span className="text-[13px] font-medium text-gray-700">
                        {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                      </span>
                      {isLatest && (
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[12px] font-medium text-blue-700">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-2.5 w-2.5 text-gray-600" />
                      <span className="text-[12px] text-gray-600">
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

/** Skeleton placeholder while map loads */
function MapSkeleton() {
  return (
    <div className="relative h-[450px] w-full rounded-lg overflow-hidden">
      <Skeleton className="h-full w-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <MapPin className="h-8 w-8 text-gray-600 animate-pulse" />
          <span className="text-[14px] text-gray-600">Loading map...</span>
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
        <p className="text-[14px] text-amber-800">
          Unable to load map. Showing device list instead.
        </p>
        <button
          onClick={onRetry}
          className="ml-auto shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1 text-[13px] font-medium text-amber-700 hover:bg-amber-50 cursor-pointer"
        >
          Retry
        </button>
      </div>
      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <caption className="sr-only">Device geo-locations</caption>
          <thead>
            <tr className="border-b-2 border-gray-200 bg-[#f1f3f5]">
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-gray-600"
              >
                Device
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-gray-600"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-gray-600"
              >
                Location
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-gray-600"
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
                  "border-b border-gray-50 last:border-0",
                  i % 2 === 1 && "bg-gray-50/30",
                )}
              >
                <td className="px-4 py-2 text-[14px] font-medium text-gray-900">{device.name}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={device.status} />
                </td>
                <td className="px-4 py-2 text-[14px] text-gray-600">{device.location}</td>
                <td className="px-4 py-2 text-[14px] font-mono text-gray-600">{device.health}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility: Clustering (Story 10.2)
// ---------------------------------------------------------------------------

/** Group resolved devices into clusters by proximity */
function clusterDevices(
  devices: ResolvedDevice[],
  zoom: number,
): { clusters: DeviceCluster[]; singles: ResolvedDevice[] } {
  const assigned = new Set<string>();
  const clusters: DeviceCluster[] = [];
  const singles: ResolvedDevice[] = [];

  // Group by approximate location (most devices share a city)
  const byLocation = new Map<string, ResolvedDevice[]>();
  for (const d of devices) {
    const key = `${d.resolvedLat.toFixed(2)},${d.resolvedLng.toFixed(2)}`;
    const existing = byLocation.get(key);
    if (existing) {
      existing.push(d);
    } else {
      byLocation.set(key, [d]);
    }
  }

  for (const [, group] of byLocation) {
    const firstDevice = group[0];
    if (group.length >= 2 && zoom < 4 && firstDevice) {
      // Cluster these devices
      const avgLat = group.reduce((s, d) => s + d.resolvedLat, 0) / group.length;
      const avgLng = group.reduce((s, d) => s + d.resolvedLng, 0) / group.length;
      clusters.push({
        id: `cluster-${avgLat.toFixed(2)}-${avgLng.toFixed(2)}`,
        location: firstDevice.location,
        lat: avgLat,
        lng: avgLng,
        devices: group,
        count: group.length,
      });
      for (const d of group) assigned.add(d.id);
    }
  }

  // Remaining devices become singles
  for (const d of devices) {
    if (!assigned.has(d.id)) {
      singles.push(d);
    }
  }

  return { clusters, singles };
}

/** Compute geofences with device counts */
function computeGeofences(devices: ResolvedDevice[], baseGeofences: Geofence[]): Geofence[] {
  return baseGeofences.map((gf) => {
    const count = devices.filter((d) => {
      const dLat = d.resolvedLat - gf.centerLat;
      const dLng = d.resolvedLng - gf.centerLng;
      // Approximate degree-to-km conversion at this latitude
      const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
      return dist <= gf.radiusKm;
    }).length;
    return { ...gf, deviceCount: count };
  });
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

  // Story 10.4: Geofence state
  const [showGeofences, setShowGeofences] = useState(true);

  // Story 10.5: Trail state
  const [trailDevice, setTrailDevice] = useState<ResolvedDevice | null>(null);
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);

  // Story 9.3: Status filter pills
  const filteredDevices = useMemo(() => {
    if (statusFilter === "all") return devices;
    return devices.filter((d) => d.status === statusFilter);
  }, [devices, statusFilter]);

  // Resolve coordinates for all filtered devices
  const mappableDevices = useMemo(() => {
    return filteredDevices
      .map((device) => {
        const coords = resolveDeviceCoordinates(device);
        if (!coords) return null;
        return { ...device, resolvedLat: coords.lat, resolvedLng: coords.lng };
      })
      .filter((d): d is ResolvedDevice => d !== null);
  }, [filteredDevices]);

  // Story 10.2: Compute clusters
  const { clusters, singles } = useMemo(
    () => clusterDevices(mappableDevices, zoom),
    [mappableDevices, zoom],
  );

  // Story 10.4: Compute geofences with device counts
  const geofences = useMemo(
    () => computeGeofences(mappableDevices, DEFAULT_GEOFENCES),
    [mappableDevices],
  );

  // Count devices per status
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

      if (selectedDevice?.id === device.id) {
        setSelectedDevice(null);
        return;
      }

      setSelectedDevice(device);
      setTooltipPosition({ x, y });
    },
    [selectedDevice],
  );

  // Story 10.2: Cluster click — zoom in on cluster
  const handleClusterClick = useCallback((cluster: DeviceCluster, event: React.MouseEvent) => {
    event.stopPropagation();
    setCenter([cluster.lng, cluster.lat]);
    setZoom((z) => Math.min(z * 2, 8));
    setSelectedDevice(null);
  }, []);

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

  // Story 10.3: Location search handler
  const handleLocationSelect = useCallback((coords: CityCoordinates) => {
    setCenter([coords.lng, coords.lat]);
    setZoom(4);
    setSelectedDevice(null);
  }, []);

  const handleLocationClear = useCallback(() => {
    setCenter([0, 20]);
    setZoom(1);
  }, []);

  // Story 10.4: Geofence handlers
  const handleSelectGeofence = useCallback((gf: Geofence) => {
    setCenter([gf.centerLng, gf.centerLat]);
    setZoom(4);
    setSelectedDevice(null);
  }, []);

  // Story 10.5: Trail handler
  const handleShowTrail = useCallback(
    (device: GeoDevice) => {
      // If trail is active for this device, hide it
      if (trailDevice?.id === device.id) {
        setTrailDevice(null);
        setTrailPoints([]);
        return;
      }

      const resolved = mappableDevices.find((d) => d.id === device.id);
      if (!resolved) {
        setTrailDevice(null);
        setTrailPoints([]);
        return;
      }

      const trail = generateMockTrail(resolved);
      setTrailDevice(resolved);
      setTrailPoints(trail);
    },
    [trailDevice, mappableDevices],
  );

  const handleHideTrail = useCallback(() => {
    setTrailDevice(null);
    setTrailPoints([]);
  }, []);

  // Handle geography load error
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

  // Story 10.4: Compute geofence SVG circles (radius in projection coordinates)
  const geofenceCircleRadius = useCallback(
    (radiusKm: number) => {
      // Approximate: 1 degree ~ 111km, scale with projection
      return (radiusKm / 111) * 147 * zoom * 0.8;
    },
    [zoom],
  );

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
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[14px] font-medium cursor-pointer transition-colors",
                isActive ? opt.activeColor : opt.color,
              )}
              aria-pressed={isActive}
            >
              {opt.dotColor && !isActive && (
                <span className={cn("h-2 w-2 rounded-full", opt.dotColor)} />
              )}
              {opt.label}
              <span className={cn("text-[13px]", isActive ? "opacity-80" : "text-gray-600")}>
                ({count})
              </span>
            </button>
          );
        })}
        {/* Device count badge */}
        <span className="ml-auto text-[14px] text-gray-600">
          Showing {mappableDevices.length} of {devices.length} devices
          {clusters.length > 0 && (
            <>
              {" "}
              &middot; {clusters.length} cluster{clusters.length !== 1 ? "s" : ""}
            </>
          )}
        </span>
      </div>

      {/* Map error fallback */}
      {mapError ? (
        <MapError devices={filteredDevices} onRetry={handleRetry} />
      ) : (
        <div className="flex gap-4">
          {/* Main map area */}
          <div className="flex-1 space-y-4">
            {/* Map container */}
            <div
              ref={containerRef}
              className="card-elevated relative overflow-hidden"
              style={{ minHeight: 500 }}
            >
              {/* Loading skeleton */}
              {!mapLoaded && !mapError && (
                <div className="absolute inset-0 z-10" aria-busy="true">
                  <span className="sr-only" aria-live="polite">
                    Loading map...
                  </span>
                  <MapSkeleton />
                </div>
              )}

              {/* Story 10.3: Location search bar */}
              <LocationSearchBar
                onLocationSelect={handleLocationSelect}
                onClear={handleLocationClear}
              />

              {/* Zoom controls + compass */}
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
                {/* Story 10.1: Compass / reset view */}
                <button
                  onClick={() => {
                    setCenter([0, 20]);
                    setZoom(1);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 cursor-pointer mt-1"
                  aria-label="Reset view"
                >
                  <Navigation className="h-4 w-4" />
                </button>
              </div>

              {/* Story 10.1: Scale bar */}
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 rounded bg-white/80 px-2 py-1 backdrop-blur-sm">
                <div className="h-[2px] w-12 bg-gray-600" />
                <span className="text-[12px] text-gray-600 font-medium">
                  {zoom >= 4 ? "100km" : zoom >= 2 ? "500km" : "1000km"}
                </span>
              </div>

              {/* World map rendering */}
              <div onClick={handleMapClick}>
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ scale: 147, center: [0, 20] }}
                  width={800}
                  height={500}
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
                        if (!mapLoaded && geographies.length > 0) {
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

                    {/* Story 10.4: Geofence overlays */}
                    {showGeofences &&
                      geofences.map((gf) => (
                        <Marker key={gf.id} coordinates={[gf.centerLng, gf.centerLat]}>
                          <circle
                            r={geofenceCircleRadius(gf.radiusKm)}
                            fill={gf.color}
                            fillOpacity={0.12}
                            stroke={gf.color}
                            strokeWidth={1.5 / Math.sqrt(zoom)}
                            strokeDasharray={`${4 / Math.sqrt(zoom)},${2 / Math.sqrt(zoom)}`}
                            style={{ pointerEvents: "none" }}
                          />
                          <text
                            y={-geofenceCircleRadius(gf.radiusKm) - 4 / Math.sqrt(zoom)}
                            textAnchor="middle"
                            fill={gf.color}
                            fontSize={8 / Math.sqrt(zoom)}
                            fontWeight="600"
                            style={{ pointerEvents: "none" }}
                          >
                            {gf.name}
                          </text>
                        </Marker>
                      ))}

                    {/* Story 10.5: Device position trail */}
                    {trailDevice && trailPoints.length > 1 && (
                      <>
                        {/* Trail dots with connecting visual */}
                        {trailPoints.map((point, idx) => {
                          const isLast = idx === trailPoints.length - 1;
                          const opacity = 0.3 + (idx / trailPoints.length) * 0.7;
                          return (
                            <Marker key={`trail-dot-${idx}`} coordinates={[point.lng, point.lat]}>
                              <circle
                                r={isLast ? 5 / Math.sqrt(zoom) : 3 / Math.sqrt(zoom)}
                                fill={isLast ? "#2563eb" : "#93c5fd"}
                                fillOpacity={opacity}
                                stroke="#ffffff"
                                strokeWidth={isLast ? 1.5 / Math.sqrt(zoom) : 0.5 / Math.sqrt(zoom)}
                              />
                            </Marker>
                          );
                        })}
                      </>
                    )}

                    {/* Story 10.2: Cluster markers */}
                    {clusters.map((cluster) => (
                      <ClusterMarker
                        key={cluster.id}
                        cluster={cluster}
                        zoom={zoom}
                        onClick={handleClusterClick}
                      />
                    ))}

                    {/* Story 10.2: Individual device markers (unclustered) */}
                    {singles.map((device) => (
                      <Marker
                        key={device.id}
                        coordinates={[device.resolvedLng, device.resolvedLat]}
                      >
                        <circle
                          r={5 / Math.sqrt(zoom)}
                          fill={STATUS_COLORS[device.status] ?? "#6b7280"}
                          stroke="#ffffff"
                          strokeWidth={1.5 / Math.sqrt(zoom)}
                          style={{ cursor: "pointer" }}
                          onClick={(e) =>
                            handleMarkerClick(device, e as unknown as React.MouseEvent)
                          }
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

              {/* Device marker tooltip (with trail button) */}
              {selectedDevice && (
                <DeviceTooltip
                  device={selectedDevice}
                  position={tooltipPosition}
                  onClose={() => setSelectedDevice(null)}
                  onShowTrail={handleShowTrail}
                  containerRef={containerRef}
                  trailActive={trailDevice?.id === selectedDevice.id}
                />
              )}
            </div>

            {/* Story 10.5: Trail timeline (below map) */}
            {trailDevice && trailPoints.length > 0 && (
              <TrailTimeline
                device={trailDevice}
                trail={trailPoints}
                onHideTrail={handleHideTrail}
              />
            )}

            {/* Empty filter state */}
            {mappableDevices.length === 0 && (
              <div className="flex h-32 items-center justify-center card-elevated">
                <div className="text-center">
                  <MapPin className="mx-auto h-8 w-8 text-gray-200 mb-2" />
                  <p className="text-[14px] font-medium text-gray-600">
                    No devices match the selected filter
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Story 10.4: Geofence panel (right sidebar) */}
          <div className="w-[280px] shrink-0 hidden lg:block">
            <GeofencePanel
              geofences={geofences}
              showGeofences={showGeofences}
              onToggleGeofences={() => setShowGeofences(!showGeofences)}
              onSelectGeofence={handleSelectGeofence}
              onCreateGeofence={() => {
                // In production: open create geofence modal
                // For now: no-op placeholder (Amazon Location PutGeofence API)
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
