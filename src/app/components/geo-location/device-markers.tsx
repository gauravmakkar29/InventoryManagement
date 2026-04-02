import { Marker } from "react-simple-maps";
import type { DeviceCluster, Geofence, ResolvedDevice, TrailPoint } from "./geo-location-types";
import { STATUS_COLORS } from "./geo-location-types";
import type { GeoDevice } from "./geo-location-types";

// ---------------------------------------------------------------------------
// ClusterMarker (Story 10.2)
// ---------------------------------------------------------------------------

/** Story 10.2: Cluster marker showing grouped device count */
export function ClusterMarker({
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

// ---------------------------------------------------------------------------
// GeofenceOverlays (Story 10.4)
// ---------------------------------------------------------------------------

export function GeofenceOverlays({
  geofences,
  zoom,
  geofenceCircleRadius,
}: {
  geofences: Geofence[];
  zoom: number;
  geofenceCircleRadius: (radiusKm: number) => number;
}) {
  return (
    <>
      {geofences.map((gf) => (
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
    </>
  );
}

// ---------------------------------------------------------------------------
// TrailDots (Story 10.5)
// ---------------------------------------------------------------------------

export function TrailDots({ trailPoints, zoom }: { trailPoints: TrailPoint[]; zoom: number }) {
  return (
    <>
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
  );
}

// ---------------------------------------------------------------------------
// SingleDeviceMarker (Story 10.2)
// ---------------------------------------------------------------------------

export function SingleDeviceMarkers({
  devices,
  zoom,
  onMarkerClick,
}: {
  devices: ResolvedDevice[];
  zoom: number;
  onMarkerClick: (device: GeoDevice, event: React.MouseEvent) => void;
}) {
  return (
    <>
      {devices.map((device) => (
        <Marker key={device.id} coordinates={[device.resolvedLng, device.resolvedLat]}>
          <circle
            r={5 / Math.sqrt(zoom)}
            fill={STATUS_COLORS[device.status] ?? "#6b7280"}
            stroke="#ffffff"
            strokeWidth={1.5 / Math.sqrt(zoom)}
            style={{ cursor: "pointer" }}
            onClick={(e) => onMarkerClick(device, e as unknown as React.MouseEvent)}
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
    </>
  );
}
