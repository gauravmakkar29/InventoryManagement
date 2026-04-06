/**
 * IMS Gen 2 — HLM API Client (Facade)
 *
 * Thin delegation layer: every function forwards to the active IApiProvider
 * registered by ProviderRegistry. The provider is resolved at call time via
 * the module-level singleton in registry.tsx.
 *
 * Components import from this file — the underlying provider (mock, Amplify,
 * Terraform, CDK) is transparent to callers.
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
import { getApiProvider } from "./providers/registry";
import {
  safeParseResponse,
  paginatedResponseSchema,
  deviceResponseSchema,
  firmwareResponseSchema,
  serviceOrderResponseSchema,
  complianceResponseSchema,
  vulnerabilityResponseSchema,
  auditLogResponseSchema,
  customerResponseSchema,
  dashboardMetricsResponseSchema,
} from "./schemas/response-schemas";

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

// =============================================================================
// Queries
// =============================================================================

export async function listDevices(
  page?: number,
  pageSize?: number,
  filters?: Record<string, string>,
): Promise<PaginatedResponse<Device>> {
  const result = await getApiProvider().listDevices(page, pageSize, filters);
  safeParseResponse(paginatedResponseSchema(deviceResponseSchema), result, "listDevices");
  return result;
}

export async function getDevice(id: string): Promise<Device | null> {
  const result = await getApiProvider().getDevice(id);
  if (result) safeParseResponse(deviceResponseSchema, result, "getDevice");
  return result;
}

export async function searchDevices(query: string): Promise<SearchResult<Device>> {
  return getApiProvider().searchDevices(query);
}

export async function listFirmware(
  page?: number,
  pageSize?: number,
): Promise<PaginatedResponse<Firmware>> {
  const result = await getApiProvider().listFirmware(page, pageSize);
  safeParseResponse(paginatedResponseSchema(firmwareResponseSchema), result, "listFirmware");
  return result;
}

export async function getFirmware(id: string): Promise<Firmware | null> {
  const result = await getApiProvider().getFirmware(id);
  if (result) safeParseResponse(firmwareResponseSchema, result, "getFirmware");
  return result;
}

export async function listServiceOrders(
  page?: number,
  pageSize?: number,
  status?: string,
): Promise<PaginatedResponse<ServiceOrder>> {
  const result = await getApiProvider().listServiceOrders(page, pageSize, status);
  safeParseResponse(
    paginatedResponseSchema(serviceOrderResponseSchema),
    result,
    "listServiceOrders",
  );
  return result;
}

export async function listCompliance(
  status?: string,
  certType?: string,
): Promise<PaginatedResponse<Compliance>> {
  const result = await getApiProvider().listCompliance(status, certType);
  safeParseResponse(paginatedResponseSchema(complianceResponseSchema), result, "listCompliance");
  return result;
}

export async function listVulnerabilities(
  severity?: string,
): Promise<PaginatedResponse<Vulnerability>> {
  const result = await getApiProvider().listVulnerabilities(severity);
  safeParseResponse(
    paginatedResponseSchema(vulnerabilityResponseSchema),
    result,
    "listVulnerabilities",
  );
  return result;
}

export async function listAuditLogs(
  startDate: string,
  endDate: string,
  limit?: number,
  nextToken?: string,
): Promise<PaginatedResponse<AuditLog>> {
  const result = await getApiProvider().listAuditLogs(startDate, endDate, limit, nextToken);
  safeParseResponse(paginatedResponseSchema(auditLogResponseSchema), result, "listAuditLogs");
  return result;
}

export async function getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
  return getApiProvider().getAuditLogsByUser(userId);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const result = await getApiProvider().getCustomer(id);
  if (result) safeParseResponse(customerResponseSchema, result, "getCustomer");
  return result;
}

export async function listNotifications(): Promise<Notification[]> {
  return getApiProvider().listNotifications();
}

export async function getDeviceAggregations(): Promise<AggregationResult[]> {
  return getApiProvider().getDeviceAggregations();
}

export async function getDashboardMetrics(): Promise<{
  totalDevices: number;
  onlineDevices: number;
  activeDeployments: number;
  pendingApprovals: number;
  healthScore: number;
}> {
  const result = await getApiProvider().getDashboardMetrics();
  safeParseResponse(dashboardMetricsResponseSchema, result, "getDashboardMetrics");
  return result;
}

// =============================================================================
// Mutations
// =============================================================================

export async function createServiceOrder(input: Partial<ServiceOrder>): Promise<ServiceOrder> {
  return getApiProvider().createServiceOrder(input);
}

export async function updateServiceOrder(
  id: string,
  input: Partial<ServiceOrder>,
): Promise<ServiceOrder> {
  return getApiProvider().updateServiceOrder(id, input);
}

export async function uploadFirmware(input: Partial<Firmware>): Promise<Firmware> {
  return getApiProvider().uploadFirmware(input);
}

export async function approveFirmware(id: string, stage: string): Promise<Firmware> {
  return getApiProvider().approveFirmware(id, stage);
}

export async function submitComplianceReview(id: string): Promise<Compliance> {
  return getApiProvider().submitComplianceReview(id);
}

export async function acknowledgeNotification(id: string): Promise<boolean> {
  return getApiProvider().acknowledgeNotification(id);
}

// =============================================================================
// Telemetry & Environmental Monitoring — Epic 13
// =============================================================================

export async function getDeviceTelemetry(
  deviceId: string,
  startDate: string,
  endDate: string,
): Promise<TelemetryReading[]> {
  return getApiProvider().getDeviceTelemetry(deviceId, startDate, endDate);
}

export async function getHeatmapAggregation(
  bounds?: { northLat: number; southLat: number; eastLng: number; westLng: number },
  precision?: number,
  riskThreshold?: number,
): Promise<HeatmapAggregation> {
  return getApiProvider().getHeatmapAggregation(bounds, precision, riskThreshold);
}

export async function getBlastRadius(
  lat: number,
  lng: number,
  radiusKm: number,
  includeOffline?: boolean,
): Promise<BlastRadiusResult | null> {
  return getApiProvider().getBlastRadius(lat, lng, radiusKm, includeOffline);
}

export async function getBlastRadiusHistory(deviceId?: string): Promise<BlastRadiusResult[]> {
  return getApiProvider().getBlastRadiusHistory(deviceId);
}

export async function ingestTelemetry(
  deviceId: string,
  metrics: Partial<TelemetryReading>,
): Promise<TelemetryReading | null> {
  return getApiProvider().ingestTelemetry(deviceId, metrics);
}

export async function runBlastRadiusSimulation(
  deviceId: string,
  radiusKm: number,
  failureType: FailureType,
  severity?: number,
): Promise<BlastRadiusResult | null> {
  return getApiProvider().runBlastRadiusSimulation(deviceId, radiusKm, failureType, severity);
}

export async function getTelemetryPipelineStatus(): Promise<TelemetryPipelineStatus> {
  return getApiProvider().getTelemetryPipelineStatus();
}

// =============================================================================
// OpenSearch — Global Search, Advanced Search, Aggregations, Geo — Epic 18
// =============================================================================

/** Story 18.2: Global search across all entity types with fuzzy matching */
export async function searchGlobal(
  query: string,
  entityTypes?: string[],
  limit?: number,
): Promise<GlobalSearchResponse> {
  return getApiProvider().searchGlobal(query, entityTypes, limit);
}

/** Story 18.3: Advanced device search with combined text + filter criteria */
export async function searchDevicesAdvanced(
  query: string,
  filters?: DeviceSearchFilters,
): Promise<SearchResult<Device>> {
  return getApiProvider().searchDevicesAdvanced(query, filters);
}

/** Story 18.4: Vulnerability search by CVE ID, component, or description */
export async function searchVulnerabilities(
  query: string,
  severity?: string,
): Promise<SearchResult<Vulnerability>> {
  return getApiProvider().searchVulnerabilities(query, severity);
}

/** Story 18.5: Server-side aggregations for analytics charts */
export async function getAggregation(
  metric: AggregationMetric,
  timeRange?: TimeRange,
): Promise<AggregationResponse> {
  return getApiProvider().getAggregation(metric, timeRange);
}

/** Story 18.6: Geo bounding box query — devices in map viewport */
export async function searchDevicesByBounds(
  bounds: GeoBoundingBox,
  status?: string,
): Promise<GeoDeviceResult[]> {
  return getApiProvider().searchDevicesByBounds(bounds, status);
}

/** Story 18.6: Geo distance query — devices within radius of a point */
export async function searchDevicesByDistance(
  params: GeoDistanceQuery,
): Promise<GeoDeviceResult[]> {
  return getApiProvider().searchDevicesByDistance(params);
}

/** Story 18.6: Geo clustering — geohash_grid aggregation for map clusters */
export async function getDeviceGeoClusters(
  bounds?: GeoBoundingBox,
  precision?: number,
): Promise<GeoCluster[]> {
  return getApiProvider().getDeviceGeoClusters(bounds, precision);
}

/** Story 18.1: OSIS pipeline health status */
export async function getOsisPipelineHealth(): Promise<PipelineHealthStatus> {
  return getApiProvider().getOsisPipelineHealth();
}

/** Story 18.1: Trigger full re-index from DynamoDB (Admin only) */
export async function triggerReindex(): Promise<boolean> {
  return getApiProvider().triggerReindex();
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
