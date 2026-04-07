import { DeviceStatus } from "../../../lib/types";

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

export type GeoStatusFilter =
  | "all"
  | DeviceStatus.Online
  | DeviceStatus.Offline
  | DeviceStatus.Maintenance;

export interface FilterOption {
  id: GeoStatusFilter;
  label: string;
  color: string;
  activeColor: string;
  dotColor: string;
}

/** Story 10.2: Cluster of nearby devices grouped by location */
export interface DeviceCluster {
  id: string;
  location: string;
  lat: number;
  lng: number;
  devices: ResolvedDevice[];
  count: number;
}

/** Story 10.4: Geofence boundary definition */
export interface Geofence {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  deviceCount: number;
  color: string;
}

/** Story 10.5: Device position history point */
export interface TrailPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

export type ResolvedDevice = GeoDevice & { resolvedLat: number; resolvedLng: number };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Self-hosted world-atlas — no CDN dependency (NIST SI-10, Story 25.9) */
export const GEO_URL = "/geo/countries-110m.json";

export const STATUS_COLORS: Record<string, string> = {
  [DeviceStatus.Online]: "#10b981",
  [DeviceStatus.Offline]: "#ef4444",
  [DeviceStatus.Maintenance]: "#f59e0b",
  [DeviceStatus.Decommissioned]: "#6b7280",
};

export const FILTER_OPTIONS: FilterOption[] = [
  {
    id: "all",
    label: "All",
    color: "bg-muted text-muted-foreground hover:bg-muted",
    activeColor: "bg-accent text-white",
    dotColor: "",
  },
  {
    id: DeviceStatus.Online,
    label: "Online",
    color: "bg-muted text-muted-foreground hover:bg-muted",
    activeColor: "bg-success text-white",
    dotColor: "bg-success",
  },
  {
    id: DeviceStatus.Offline,
    label: "Offline",
    color: "bg-muted text-muted-foreground hover:bg-muted",
    activeColor: "bg-danger text-white",
    dotColor: "bg-danger",
  },
  {
    id: DeviceStatus.Maintenance,
    label: "Maintenance",
    color: "bg-muted text-muted-foreground hover:bg-muted",
    activeColor: "bg-warning text-white",
    dotColor: "bg-warning",
  },
];

/** Story 10.4: Default geofence zones around major device clusters */
export const DEFAULT_GEOFENCES: Geofence[] = [
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

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Story 10.5: Generate mock position trail for a device.
 * In production this would come from Amazon Location Tracker API.
 */
export function generateMockTrail(device: ResolvedDevice): TrailPoint[] {
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

/** Group resolved devices into clusters by proximity */
export function clusterDevices(
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

/**
 * Filter devices to those visible in the current map viewport plus a buffer.
 * Prevents processing off-screen devices in clustering and geofence calculations.
 * @see Story #374 — Viewport culling for 500+ device scale
 */
export function filterByViewport(
  devices: ResolvedDevice[],
  center: [number, number],
  zoom: number,
  bufferFactor = 0.1,
): ResolvedDevice[] {
  // Mercator projection: visible lat/lng range shrinks with zoom
  const latRange = 180 / zoom;
  const lngRange = 360 / zoom;
  const latBuffer = latRange * bufferFactor;
  const lngBuffer = lngRange * bufferFactor;
  const minLat = center[1] - latRange / 2 - latBuffer;
  const maxLat = center[1] + latRange / 2 + latBuffer;
  const minLng = center[0] - lngRange / 2 - lngBuffer;
  const maxLng = center[0] + lngRange / 2 + lngBuffer;

  return devices.filter(
    (d) =>
      d.resolvedLat >= minLat &&
      d.resolvedLat <= maxLat &&
      d.resolvedLng >= minLng &&
      d.resolvedLng <= maxLng,
  );
}

/** Compute geofences with device counts */
export function computeGeofences(devices: ResolvedDevice[], baseGeofences: Geofence[]): Geofence[] {
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
