import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
import {
  LocationSearchBar,
  ZoomControls,
  ScaleBar,
  StatusFilterPills,
} from "./geo-location/map-controls";
import { GeofencePanel, TrailTimeline, MapSkeleton, MapError } from "./geo-location/map-panels";
import type { GeoStatusFilter, ResolvedDevice, Geofence } from "./geo-location/geo-location-types";
import {
  GEO_URL,
  DEFAULT_GEOFENCES,
  generateMockTrail,
  clusterDevices,
  computeGeofences,
} from "./geo-location/geo-location-types";
import type { TrailPoint, DeviceCluster } from "./geo-location/geo-location-types";

// Re-export for external consumers
export type { GeoDevice } from "./geo-location/geo-location-types";

// ---------------------------------------------------------------------------
// Main Component — GeoLocationMap
// ---------------------------------------------------------------------------
export function GeoLocationMap({
  devices,
}: {
  devices: import("./geo-location/geo-location-types").GeoDevice[];
}) {
  const [statusFilter, setStatusFilter] = useState<GeoStatusFilter>("all");
  const [selectedDevice, setSelectedDevice] = useState<
    import("./geo-location/geo-location-types").GeoDevice | null
  >(null);
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
    (device: import("./geo-location/geo-location-types").GeoDevice, event: React.MouseEvent) => {
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

  const handleResetView = useCallback(() => {
    setCenter([0, 20]);
    setZoom(1);
  }, []);

  // Story 10.5: Trail handler
  const handleShowTrail = useCallback(
    (device: import("./geo-location/geo-location-types").GeoDevice) => {
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

  const handleFilterChange = useCallback((filter: GeoStatusFilter) => {
    setStatusFilter(filter);
    setSelectedDevice(null);
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
