/**
 * IMS Gen 2 — HLM API Client (Stub)
 *
 * All methods return empty/mock data and log a warning.
 * Replace with real AppSync/GraphQL calls in production.
 */

import type {
  Device,
  Firmware,
  ServiceOrder,
  Compliance,
  Vulnerability,
  AuditLog,
  Customer,
  Notification,
  PaginatedResponse,
  SearchResult,
  AggregationResult,
  TelemetryReading,
  HeatmapAggregation,
  BlastRadiusResult,
  TelemetryPipelineStatus,
  FailureType,
} from "./types";

import type {
  GlobalSearchResponse,
  GlobalSearchResult,
  DeviceSearchFilters,
  AggregationMetric,
  AggregationResponse,
  TimeRange,
  GeoBoundingBox,
  GeoDistanceQuery,
  GeoDeviceResult,
  GeoCluster,
  PipelineHealthStatus,
} from "./opensearch-types";

import { APP_BUILD_INFO } from "./app-version";
import {
  handleMutationResult,
  handleBooleanMutationResult,
  type MutationResult,
} from "./api-error-handler";

// Re-export for consumers that need to catch specific errors
export { ApiMutationError } from "./api-error-handler";
export type { MutationResult } from "./api-error-handler";

/**
 * Default headers attached to every API request, including the
 * X-App-Version header for build traceability and stale client detection.
 */
export function getDefaultHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-App-Version": APP_BUILD_INFO.full,
  };
}

function stub<T>(name: string, fallback: T): T {
  // Structured log context includes app version for traceability
  const ctx = { source: "hlm-api", method: name, version: APP_BUILD_INFO.full };
  const logger = (globalThis as Record<string, unknown>)["structuredLog"];
  if (typeof logger === "function") {
    (logger as (level: string, meta: Record<string, string>) => void)("warn", {
      ...ctx,
      message: `${name}() — returning mock data`,
    });
  }
  return fallback;
}

const emptyPage = <T>(): PaginatedResponse<T> => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 25,
  hasMore: false,
});

const emptySearch = <T>(): SearchResult<T> => ({
  hits: [],
  total: 0,
  took: 0,
  maxScore: 0,
});

// =============================================================================
// Queries (13)
// =============================================================================

export async function listDevices(
  _page?: number,
  _pageSize?: number,
  _filters?: Record<string, string>,
): Promise<PaginatedResponse<Device>> {
  return stub("listDevices", emptyPage<Device>());
}

export async function getDevice(_id: string): Promise<Device | null> {
  return stub("getDevice", null);
}

export async function searchDevices(_query: string): Promise<SearchResult<Device>> {
  return stub("searchDevices", emptySearch<Device>());
}

export async function listFirmware(
  _page?: number,
  _pageSize?: number,
): Promise<PaginatedResponse<Firmware>> {
  return stub("listFirmware", emptyPage<Firmware>());
}

export async function getFirmware(_id: string): Promise<Firmware | null> {
  return stub("getFirmware", null);
}

export async function listServiceOrders(
  _page?: number,
  _pageSize?: number,
  _status?: string,
): Promise<PaginatedResponse<ServiceOrder>> {
  return stub("listServiceOrders", emptyPage<ServiceOrder>());
}

export async function listCompliance(
  _status?: string,
  _certType?: string,
): Promise<PaginatedResponse<Compliance>> {
  return stub("listCompliance", emptyPage<Compliance>());
}

export async function listVulnerabilities(
  _severity?: string,
): Promise<PaginatedResponse<Vulnerability>> {
  return stub("listVulnerabilities", emptyPage<Vulnerability>());
}

export async function listAuditLogs(
  _startDate: string,
  _endDate: string,
  _limit?: number,
  _nextToken?: string,
): Promise<PaginatedResponse<AuditLog>> {
  return stub("listAuditLogs", emptyPage<AuditLog>());
}

export async function getAuditLogsByUser(_userId: string): Promise<AuditLog[]> {
  return stub("getAuditLogsByUser", []);
}

export async function getCustomer(_id: string): Promise<Customer | null> {
  return stub("getCustomer", null);
}

export async function listNotifications(): Promise<Notification[]> {
  return stub("listNotifications", []);
}

export async function getDeviceAggregations(): Promise<AggregationResult[]> {
  return stub("getDeviceAggregations", []);
}

export async function getDashboardMetrics(): Promise<{
  totalDevices: number;
  onlineDevices: number;
  activeDeployments: number;
  pendingApprovals: number;
  healthScore: number;
}> {
  return stub("getDashboardMetrics", {
    totalDevices: 0,
    onlineDevices: 0,
    activeDeployments: 0,
    pendingApprovals: 0,
    healthScore: 0,
  });
}

// =============================================================================
// Mutations (6)
//
// Each mutation processes its result through handleMutationResult /
// handleBooleanMutationResult so that GraphQL errors, authorization
// failures, and unexpected null responses surface as toast notifications
// and thrown ApiMutationError instances. Callers MUST wrap calls in
// try/catch to keep modals open on failure.
// =============================================================================

export async function createServiceOrder(_input: Partial<ServiceOrder>): Promise<ServiceOrder> {
  // TODO: replace stub with real GraphQL call that returns MutationResult<ServiceOrder>
  const raw: MutationResult<ServiceOrder> = { data: stub("createServiceOrder", null) };
  return handleMutationResult(raw, "createServiceOrder");
}

export async function updateServiceOrder(
  _id: string,
  _input: Partial<ServiceOrder>,
): Promise<ServiceOrder> {
  const raw: MutationResult<ServiceOrder> = { data: stub("updateServiceOrder", null) };
  return handleMutationResult(raw, "updateServiceOrder");
}

export async function uploadFirmware(_input: Partial<Firmware>): Promise<Firmware> {
  const raw: MutationResult<Firmware> = { data: stub("uploadFirmware", null) };
  return handleMutationResult(raw, "uploadFirmware");
}

export async function approveFirmware(_id: string, _stage: string): Promise<Firmware> {
  const raw: MutationResult<Firmware> = { data: stub("approveFirmware", null) };
  return handleMutationResult(raw, "approveFirmware");
}

export async function submitComplianceReview(_id: string): Promise<Compliance> {
  const raw: MutationResult<Compliance> = { data: stub("submitComplianceReview", null) };
  return handleMutationResult(raw, "submitComplianceReview");
}

export async function acknowledgeNotification(_id: string): Promise<boolean> {
  const raw: MutationResult<boolean> = { data: stub("acknowledgeNotification", true) };
  return handleBooleanMutationResult(raw, "acknowledgeNotification");
}

// =============================================================================
// Telemetry & Environmental Monitoring — Epic 13
// =============================================================================

export async function getDeviceTelemetry(
  _deviceId: string,
  _startDate: string,
  _endDate: string,
): Promise<TelemetryReading[]> {
  return stub("getDeviceTelemetry", []);
}

export async function getHeatmapAggregation(
  _bounds?: { northLat: number; southLat: number; eastLng: number; westLng: number },
  _precision?: number,
  _riskThreshold?: number,
): Promise<HeatmapAggregation> {
  return stub("getHeatmapAggregation", { cells: [], totalDevices: 0 });
}

export async function getBlastRadius(
  _lat: number,
  _lng: number,
  _radiusKm: number,
  _includeOffline?: boolean,
): Promise<BlastRadiusResult | null> {
  return stub("getBlastRadius", null);
}

export async function getBlastRadiusHistory(_deviceId?: string): Promise<BlastRadiusResult[]> {
  return stub("getBlastRadiusHistory", []);
}

export async function ingestTelemetry(
  _deviceId: string,
  _metrics: Partial<TelemetryReading>,
): Promise<TelemetryReading | null> {
  return stub("ingestTelemetry", null);
}

export async function runBlastRadiusSimulation(
  _deviceId: string,
  _radiusKm: number,
  _failureType: FailureType,
  _severity?: number,
): Promise<BlastRadiusResult | null> {
  return stub("runBlastRadiusSimulation", null);
}

export async function getTelemetryPipelineStatus(): Promise<TelemetryPipelineStatus> {
  return stub("getTelemetryPipelineStatus", {
    recordsIngestedLastHour: 0,
    health: "healthy" as const,
    lastSuccessfulIngestion: new Date().toISOString(),
  });
}

// =============================================================================
// OpenSearch — Global Search, Advanced Search, Aggregations, Geo — Epic 18
// =============================================================================

/** Story 18.2: Global search across all entity types with fuzzy matching */
export async function searchGlobal(
  _query: string,
  _entityTypes?: string[],
  _limit?: number,
): Promise<GlobalSearchResponse> {
  return stub("searchGlobal", { total: 0, results: [] });
}

/** Story 18.3: Advanced device search with combined text + filter criteria */
export async function searchDevicesAdvanced(
  _query: string,
  _filters?: DeviceSearchFilters,
): Promise<SearchResult<Device>> {
  return stub("searchDevicesAdvanced", emptySearch<Device>());
}

/** Story 18.4: Vulnerability search by CVE ID, component, or description */
export async function searchVulnerabilities(
  _query: string,
  _severity?: string,
): Promise<SearchResult<Vulnerability>> {
  return stub("searchVulnerabilities", emptySearch<Vulnerability>());
}

/** Story 18.5: Server-side aggregations for analytics charts */
export async function getAggregation(
  _metric: AggregationMetric,
  _timeRange?: TimeRange,
): Promise<AggregationResponse> {
  return stub("getAggregation", { metric: _metric, data: {} });
}

/** Story 18.6: Geo bounding box query — devices in map viewport */
export async function searchDevicesByBounds(
  _bounds: GeoBoundingBox,
  _status?: string,
): Promise<GeoDeviceResult[]> {
  return stub("searchDevicesByBounds", []);
}

/** Story 18.6: Geo distance query — devices within radius of a point */
export async function searchDevicesByDistance(
  _params: GeoDistanceQuery,
): Promise<GeoDeviceResult[]> {
  return stub("searchDevicesByDistance", []);
}

/** Story 18.6: Geo clustering — geohash_grid aggregation for map clusters */
export async function getDeviceGeoClusters(
  _bounds?: GeoBoundingBox,
  _precision?: number,
): Promise<GeoCluster[]> {
  return stub("getDeviceGeoClusters", []);
}

/** Story 18.1: OSIS pipeline health status */
export async function getOsisPipelineHealth(): Promise<PipelineHealthStatus> {
  return stub("getOsisPipelineHealth", {
    state: "Running" as const,
    recordsSyncedLastHour: 0,
    currentLagSeconds: 0,
    lastUpdated: new Date().toISOString(),
  });
}

/** Story 18.1: Trigger full re-index from DynamoDB (Admin only) */
export async function triggerReindex(): Promise<boolean> {
  return stub("triggerReindex", true);
}

// Re-export OpenSearch types for convenience
export type {
  GlobalSearchResponse,
  GlobalSearchResult,
  DeviceSearchFilters,
  AggregationMetric,
  AggregationResponse,
  TimeRange,
  GeoBoundingBox,
  GeoDistanceQuery,
  GeoDeviceResult,
  GeoCluster,
  PipelineHealthStatus,
};
