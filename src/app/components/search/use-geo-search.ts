import { useState, useCallback, useRef } from "react";
import type { GeoBoundingBox, GeoDeviceResult, GeoCluster } from "@/lib/opensearch-types";

// =============================================================================
// Story 18.6 — useGeoSearch Hook
// Manages viewport-based geo queries with debouncing and clustering support.
// Falls back to DynamoDB when OpenSearch is unavailable.
// =============================================================================

const DEBOUNCE_MS = 300;
const VIEWPORT_BUFFER = 0.1; // 10% buffer beyond visible edges

/** Mock geo device data for development */
const MOCK_GEO_DEVICES: GeoDeviceResult[] = [
  {
    id: "d1",
    deviceName: "INV-3200A",
    serialNumber: "SN-4821",
    status: "online",
    healthScore: 98,
    geoLocation: { lat: 39.74, lon: -104.99 },
    location: "Denver, CO",
  },
  {
    id: "d2",
    deviceName: "INV-3200B",
    serialNumber: "SN-4822",
    status: "online",
    healthScore: 95,
    geoLocation: { lat: 29.76, lon: -95.37 },
    location: "Houston, TX",
  },
  {
    id: "d3",
    deviceName: "INV-3100C",
    serialNumber: "SN-3901",
    status: "maintenance",
    healthScore: 72,
    geoLocation: { lat: 41.88, lon: -87.63 },
    location: "Chicago, IL",
  },
  {
    id: "d4",
    deviceName: "INV-3200D",
    serialNumber: "SN-4892",
    status: "offline",
    healthScore: 0,
    geoLocation: { lat: 39.74, lon: -104.99 },
    location: "Denver, CO",
  },
  {
    id: "d5",
    deviceName: "INV-3100E",
    serialNumber: "SN-3455",
    status: "online",
    healthScore: 91,
    geoLocation: { lat: 40.71, lon: -74.01 },
    location: "New York, NY",
  },
  {
    id: "d6",
    deviceName: "INV-3200F",
    serialNumber: "SN-5001",
    status: "online",
    healthScore: 99,
    geoLocation: { lat: 32.78, lon: -96.8 },
    location: "Dallas, TX",
  },
  {
    id: "d8",
    deviceName: "INV-3200H",
    serialNumber: "SN-5102",
    status: "online",
    healthScore: 97,
    geoLocation: { lat: 31.23, lon: 121.47 },
    location: "Shanghai, CN",
  },
  {
    id: "d9",
    deviceName: "INV-3100J",
    serialNumber: "SN-3210",
    status: "maintenance",
    healthScore: 65,
    geoLocation: { lat: 48.14, lon: 11.58 },
    location: "Munich, DE",
  },
  {
    id: "d10",
    deviceName: "INV-3200K",
    serialNumber: "SN-5201",
    status: "online",
    healthScore: 94,
    geoLocation: { lat: 1.35, lon: 103.82 },
    location: "Singapore, SG",
  },
  {
    id: "d11",
    deviceName: "INV-3100L",
    serialNumber: "SN-3301",
    status: "offline",
    healthScore: 0,
    geoLocation: { lat: -23.55, lon: -46.63 },
    location: "Sao Paulo, BR",
  },
  {
    id: "d12",
    deviceName: "INV-3200M",
    serialNumber: "SN-5301",
    status: "online",
    healthScore: 88,
    geoLocation: { lat: 39.74, lon: -104.99 },
    location: "Denver, CO",
  },
];

/** Mock geo clusters */
const MOCK_CLUSTERS: GeoCluster[] = [
  {
    geohash: "9xj",
    docCount: 3,
    center: { lat: 39.74, lon: -104.99 },
    statusBreakdown: { online: 2, offline: 1 },
    avgHealth: 62,
  },
  {
    geohash: "9v6",
    docCount: 2,
    center: { lat: 31.02, lon: -96.08 },
    statusBreakdown: { online: 2 },
    avgHealth: 97,
  },
  {
    geohash: "dp3",
    docCount: 1,
    center: { lat: 41.88, lon: -87.63 },
    statusBreakdown: { maintenance: 1 },
    avgHealth: 72,
  },
];

export interface GeoSearchState {
  devices: GeoDeviceResult[];
  clusters: GeoCluster[];
  isLoading: boolean;
  error: string | null;
  isUsingFallback: boolean;
  currentBounds: GeoBoundingBox | null;
}

interface UseGeoSearchReturn extends GeoSearchState {
  searchByBounds: (bounds: GeoBoundingBox, statusFilter?: string) => void;
  searchByDistance: (lat: number, lon: number, radiusKm?: number) => void;
  setStatusFilter: (status: string | undefined) => void;
}

/** Add viewport buffer to bounds (10% beyond visible edges) */
function addBuffer(bounds: GeoBoundingBox): GeoBoundingBox {
  const latRange = bounds.topLat - bounds.bottomLat;
  const lonRange = bounds.rightLon - bounds.leftLon;
  return {
    topLat: bounds.topLat + latRange * VIEWPORT_BUFFER,
    bottomLat: bounds.bottomLat - latRange * VIEWPORT_BUFFER,
    leftLon: bounds.leftLon - lonRange * VIEWPORT_BUFFER,
    rightLon: bounds.rightLon + lonRange * VIEWPORT_BUFFER,
  };
}

export function useGeoSearch(): UseGeoSearchReturn {
  const [state, setState] = useState<GeoSearchState>({
    devices: MOCK_GEO_DEVICES,
    clusters: [],
    isLoading: false,
    error: null,
    isUsingFallback: false,
    currentBounds: null,
  });
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchByBounds = useCallback(
    (bounds: GeoBoundingBox, status?: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, isLoading: true, currentBounds: bounds }));

        // Mock implementation — in production, call searchDevicesByBounds from hlm-api
        const bufferedBounds = addBuffer(bounds);
        const activeStatus = status ?? statusFilter;

        let filtered = MOCK_GEO_DEVICES.filter(
          (d) =>
            d.geoLocation.lat >= bufferedBounds.bottomLat &&
            d.geoLocation.lat <= bufferedBounds.topLat &&
            d.geoLocation.lon >= bufferedBounds.leftLon &&
            d.geoLocation.lon <= bufferedBounds.rightLon,
        );

        if (activeStatus) {
          filtered = filtered.filter((d) => d.status === activeStatus);
        }

        // If more than 100 devices, switch to clustering
        const useClusters = filtered.length > 100;

        setState({
          devices: useClusters ? [] : filtered,
          clusters: useClusters ? MOCK_CLUSTERS : [],
          isLoading: false,
          error: null,
          isUsingFallback: false,
          currentBounds: bounds,
        });
      }, DEBOUNCE_MS);
    },
    [statusFilter],
  );

  const searchByDistance = useCallback((lat: number, lon: number, radiusKm: number = 50) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    // Mock implementation — in production, call searchDevicesByDistance from hlm-api
    setTimeout(() => {
      const filtered = MOCK_GEO_DEVICES.filter((d) => {
        const dlat = d.geoLocation.lat - lat;
        const dlon = d.geoLocation.lon - lon;
        // Rough approximation: 1 degree latitude ~= 111 km
        const distKm = Math.sqrt(dlat * dlat + dlon * dlon) * 111;
        return distKm <= radiusKm;
      }).map((d) => ({
        ...d,
        distanceKm: Math.sqrt(
          Math.pow((d.geoLocation.lat - lat) * 111, 2) +
            Math.pow((d.geoLocation.lon - lon) * 111 * Math.cos((lat * Math.PI) / 180), 2),
        ),
      }));

      setState((prev) => ({
        ...prev,
        devices: filtered,
        clusters: [],
        isLoading: false,
        error: null,
      }));
    }, 200);
  }, []);

  return {
    ...state,
    searchByBounds,
    searchByDistance,
    setStatusFilter,
  };
}
