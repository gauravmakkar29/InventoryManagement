import { useMemo, useCallback, useRef, useEffect, useReducer } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { MapPin } from "lucide-react";
import { resolveDeviceCoordinates } from "../../lib/location-coords";
import type { CityCoordinates } from "../../lib/location-coords";
import {
  ClusterMarker,
  GeofenceOverlays,
  TrailDots,
  SingleDeviceMarkers,
} from "./geo-location/device-markers";
import { DeviceTooltip } from "./geo-location/device-map-tooltip";
import { LocationSearchBar } from "./geo-location/location-search-bar";
import { ZoomControls } from "./geo-location/zoom-controls";
import { ScaleBar } from "./geo-location/scale-bar";
import { StatusFilterPills } from "./geo-location/status-filter-pills";
import { GeofencePanel } from "./geo-location/geofence-panel";
import { TrailTimeline } from "./geo-location/trail-timeline";
import { MapSkeleton } from "./geo-location/map-skeleton";
import { MapError } from "./geo-location/map-error";
import type {
  GeoDevice,
  GeoStatusFilter,
  ResolvedDevice,
  Geofence,
  TrailPoint,
  DeviceCluster,
} from "./geo-location/geo-location-types";
import {
  GEO_URL,
  DEFAULT_GEOFENCES,
  generateMockTrail,
  clusterDevices,
  computeGeofences,
  filterByViewport,
} from "./geo-location/geo-location-types";

// Re-export for external consumers
export type { GeoDevice } from "./geo-location/geo-location-types";

// ---------------------------------------------------------------------------
// Story 21.1: Consolidated map state via useReducer
// ---------------------------------------------------------------------------
interface MapState {
  statusFilter: GeoStatusFilter;
  selectedDevice: GeoDevice | null;
  tooltipPosition: { x: number; y: number };
  mapLoaded: boolean;
  mapError: boolean;
  zoom: number;
  center: [number, number];
  showGeofences: boolean;
  trailDevice: ResolvedDevice | null;
  trailPoints: TrailPoint[];
}

const INITIAL_MAP_STATE: MapState = {
  statusFilter: "all",
  selectedDevice: null,
  tooltipPosition: { x: 0, y: 0 },
  mapLoaded: false,
  mapError: false,
  zoom: 1,
  center: [0, 20],
  showGeofences: true,
  trailDevice: null,
  trailPoints: [],
};

type MapAction =
  | { type: "SELECT_DEVICE"; device: GeoDevice; position: { x: number; y: number } }
  | { type: "DESELECT_DEVICE" }
  | { type: "SET_VIEW"; center: [number, number]; zoom: number }
  | { type: "NAVIGATE"; center: [number, number]; zoom: number }
  | { type: "ZOOM_IN" }
  | { type: "ZOOM_OUT" }
  | { type: "RESET_VIEW" }
  | { type: "SET_FILTER"; filter: GeoStatusFilter }
  | { type: "MAP_LOADED" }
  | { type: "MAP_ERROR" }
  | { type: "RETRY_MAP" }
  | { type: "TOGGLE_GEOFENCES" }
  | { type: "SHOW_TRAIL"; device: ResolvedDevice; points: TrailPoint[] }
  | { type: "HIDE_TRAIL" };

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case "SELECT_DEVICE":
      return { ...state, selectedDevice: action.device, tooltipPosition: action.position };
    case "DESELECT_DEVICE":
      return { ...state, selectedDevice: null };
    case "SET_VIEW":
      return { ...state, center: action.center, zoom: action.zoom };
    case "NAVIGATE":
      return { ...state, center: action.center, zoom: action.zoom, selectedDevice: null };
    case "ZOOM_IN":
      return { ...state, zoom: Math.min(state.zoom * 1.5, 8) };
    case "ZOOM_OUT":
      return { ...state, zoom: Math.max(state.zoom / 1.5, 1) };
    case "RESET_VIEW":
      return { ...state, center: [0, 20], zoom: 1 };
    case "SET_FILTER":
      return { ...state, statusFilter: action.filter, selectedDevice: null };
    case "MAP_LOADED":
      return { ...state, mapLoaded: true };
    case "MAP_ERROR":
      return { ...state, mapError: true };
    case "RETRY_MAP":
      return { ...state, mapError: false, mapLoaded: false };
    case "TOGGLE_GEOFENCES":
      return { ...state, showGeofences: !state.showGeofences };
    case "SHOW_TRAIL":
      return { ...state, trailDevice: action.device, trailPoints: action.points };
    case "HIDE_TRAIL":
      return { ...state, trailDevice: null, trailPoints: [] };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Main Component — GeoLocationMap
// ---------------------------------------------------------------------------
export function GeoLocationMap({ devices }: { devices: GeoDevice[] }) {
  const [state, dispatch] = useReducer(mapReducer, INITIAL_MAP_STATE);
  const {
    statusFilter,
    selectedDevice,
    tooltipPosition,
    mapLoaded,
    mapError,
    zoom,
    center,
    showGeofences,
    trailDevice,
    trailPoints,
  } = state;
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Story #374: Viewport culling — only process visible devices for clustering/rendering
  const viewportDevices = useMemo(
    () => filterByViewport(mappableDevices, center, zoom),
    [mappableDevices, center, zoom],
  );

  // Story 10.2: Compute clusters (from viewport-filtered devices)
  const { clusters, singles } = useMemo(
    () => clusterDevices(viewportDevices, zoom),
    [viewportDevices, zoom],
  );

  // Story 10.4: Compute geofences with device counts (full dataset for accurate counts)
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
      if (selectedDevice?.id === device.id) {
        dispatch({ type: "DESELECT_DEVICE" });
        return;
      }
      dispatch({
        type: "SELECT_DEVICE",
        device,
        position: { x: event.clientX - rect.left + 12, y: event.clientY - rect.top + 12 },
      });
    },
    [selectedDevice],
  );

  const handleClusterClick = useCallback(
    (cluster: DeviceCluster, event: React.MouseEvent) => {
      event.stopPropagation();
      dispatch({
        type: "NAVIGATE",
        center: [cluster.lng, cluster.lat],
        zoom: Math.min(zoom * 2, 8),
      });
    },
    [zoom],
  );

  const handleMapClick = useCallback(() => dispatch({ type: "DESELECT_DEVICE" }), []);
  const handleZoomIn = useCallback(() => dispatch({ type: "ZOOM_IN" }), []);
  const handleZoomOut = useCallback(() => dispatch({ type: "ZOOM_OUT" }), []);

  const handleMoveEnd = useCallback((position: { coordinates: [number, number]; zoom: number }) => {
    dispatch({ type: "SET_VIEW", center: position.coordinates, zoom: position.zoom });
  }, []);

  const handleRetry = useCallback(() => dispatch({ type: "RETRY_MAP" }), []);

  const handleLocationSelect = useCallback((coords: CityCoordinates) => {
    dispatch({ type: "NAVIGATE", center: [coords.lng, coords.lat], zoom: 4 });
  }, []);

  const handleLocationClear = useCallback(() => dispatch({ type: "RESET_VIEW" }), []);

  const handleSelectGeofence = useCallback((gf: Geofence) => {
    dispatch({ type: "NAVIGATE", center: [gf.centerLng, gf.centerLat], zoom: 4 });
  }, []);

  const handleResetView = useCallback(() => dispatch({ type: "RESET_VIEW" }), []);

  const handleShowTrail = useCallback(
    (device: GeoDevice) => {
      if (trailDevice?.id === device.id) {
        dispatch({ type: "HIDE_TRAIL" });
        return;
      }
      const resolved = mappableDevices.find((d) => d.id === device.id);
      if (!resolved) {
        dispatch({ type: "HIDE_TRAIL" });
        return;
      }
      dispatch({ type: "SHOW_TRAIL", device: resolved, points: generateMockTrail(resolved) });
    },
    [trailDevice, mappableDevices],
  );

  const handleHideTrail = useCallback(() => dispatch({ type: "HIDE_TRAIL" }), []);

  // Handle geography load error
  useEffect(() => {
    if (mapError) return;
    let cancelled = false;

    // Story 22.2: Route through resilient-fetch for timeout handling
    import("../../lib/resilient-fetch").then(({ checkGeoAvailability }) =>
      checkGeoAvailability(GEO_URL).then((ok) => {
        if (!cancelled && !ok) dispatch({ type: "MAP_ERROR" });
      }),
    );

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

  const handleFilterChange = useCallback((filter: GeoStatusFilter) => {
    dispatch({ type: "SET_FILTER", filter });
  }, []);

  return (
    <div className="space-y-4">
      {/* Story 9.3: Status filter pills */}
      <StatusFilterPills
        statusFilter={statusFilter}
        statusCounts={statusCounts}
        mappableCount={mappableDevices.length}
        totalCount={devices.length}
        clusterCount={clusters.length}
        onFilterChange={handleFilterChange}
      />

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
              <ZoomControls
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetView={handleResetView}
              />

              {/* Story 10.1: Scale bar */}
              <ScaleBar zoom={zoom} />

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
                          queueMicrotask(() => dispatch({ type: "MAP_LOADED" }));
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
                    {showGeofences && (
                      <GeofenceOverlays
                        geofences={geofences}
                        zoom={zoom}
                        geofenceCircleRadius={geofenceCircleRadius}
                      />
                    )}

                    {/* Story 10.5: Device position trail */}
                    {trailDevice && trailPoints.length > 1 && (
                      <TrailDots trailPoints={trailPoints} zoom={zoom} />
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
                    <SingleDeviceMarkers
                      devices={singles}
                      zoom={zoom}
                      onMarkerClick={handleMarkerClick}
                    />
                  </ZoomableGroup>
                </ComposableMap>
              </div>

              {/* Device marker tooltip (with trail button) */}
              {selectedDevice && (
                <DeviceTooltip
                  device={selectedDevice}
                  position={tooltipPosition}
                  onClose={() => dispatch({ type: "DESELECT_DEVICE" })}
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
                  <MapPin className="mx-auto h-8 w-8 text-muted-foreground/70 mb-2" />
                  <p className="text-[14px] font-medium text-muted-foreground">
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
              onToggleGeofences={() => dispatch({ type: "TOGGLE_GEOFENCES" })}
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
