// =============================================================================
// IMS Gen 2 — OpenSearch Types (Epic 18)
// =============================================================================

/** Entity types indexed in OpenSearch */
export type SearchEntityType =
  | "Device"
  | "Firmware"
  | "ServiceOrder"
  | "Compliance"
  | "Vulnerability";

/** Global search result from OpenSearch multi_match */
export interface GlobalSearchResult {
  id: string;
  entityType: SearchEntityType;
  title: string;
  subtitle: string;
  _score: number;
  _highlights: Record<string, string[]>;
}

/** Response from the searchGlobal resolver */
export interface GlobalSearchResponse {
  total: number;
  results: GlobalSearchResult[];
}

/** Filters for advanced device search (Story 18.3) */
export interface DeviceSearchFilters {
  status?: string;
  location?: string;
  model?: string;
  healthScoreMin?: number;
  healthScoreMax?: number;
}

/** Supported aggregation metric names (Story 18.5) */
export type AggregationMetric =
  | "devicesByStatus"
  | "deviceCount"
  | "activeDeployments"
  | "pendingApprovals"
  | "avgHealthScore"
  | "complianceByStatus"
  | "deploymentTrend"
  | "topVulnerabilities"
  | "healthScoreDistribution";

/** Time range for scoping aggregation queries */
export interface TimeRange {
  start: string;
  end: string;
}

/** Response from the getAggregations resolver */
export interface AggregationResponse {
  metric: AggregationMetric;
  data: Record<string, unknown>;
}

/** Aggregation bucket from terms/histogram aggregations */
export interface AggregationBucketEntry {
  key: string;
  doc_count: number;
}

/** Geo bounding box for viewport queries (Story 18.6) */
export interface GeoBoundingBox {
  topLat: number;
  leftLon: number;
  bottomLat: number;
  rightLon: number;
}

/** Geo distance query parameters (Story 18.6) */
export interface GeoDistanceQuery {
  lat: number;
  lon: number;
  radiusKm: number;
  status?: string;
}

/** Geo device result from OpenSearch */
export interface GeoDeviceResult {
  id: string;
  deviceName: string;
  serialNumber: string;
  status: string;
  healthScore: number;
  geoLocation: { lat: number; lon: number };
  location: string;
  distanceKm?: number;
}

/** Geo cluster from geohash_grid aggregation */
export interface GeoCluster {
  geohash: string;
  docCount: number;
  center: { lat: number; lon: number };
  statusBreakdown: Record<string, number>;
  avgHealth: number;
}

/** OSIS pipeline health status (Story 18.1) */
export interface PipelineHealthStatus {
  state: "Running" | "Stopped" | "Error";
  recordsSyncedLastHour: number;
  currentLagSeconds: number;
  lastUpdated: string;
}
