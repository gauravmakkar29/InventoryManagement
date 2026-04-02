/**
 * IMS Gen 2 — Generated GraphQL Input & Operation Variable Types
 *
 * Generated from: src/lib/schema/schema.graphql
 * Do NOT edit manually — changes will be overwritten on next codegen run.
 */

import type {
  ServiceOrderStatus,
  ServiceOrderPriority,
  FailureType,
  AggregationMetric,
} from "./graphql-enums";

// =============================================================================
// Input Types
// =============================================================================

export interface DeviceFiltersInput {
  status?: string | null;
  location?: string | null;
  model?: string | null;
  manufacturer?: string | null;
}

export interface ServiceOrderInput {
  title?: string | null;
  description?: string | null;
  status?: ServiceOrderStatus | null;
  priority?: ServiceOrderPriority | null;
  assignedTo?: string | null;
  customerId?: string | null;
  deviceId?: string | null;
  scheduledDate?: string | null;
  notes?: string[] | null;
}

export interface FirmwareInput {
  version?: string | null;
  name?: string | null;
  releaseNotes?: string | null;
  fileSize?: number | null;
  checksum?: string | null;
  compatibleModels?: string[] | null;
  targetDeviceCount?: number | null;
}

export interface TelemetryInput {
  temperature?: number | null;
  cpuLoad?: number | null;
  memoryUsage?: number | null;
  networkLatency?: number | null;
  errorRate?: number | null;
  powerOutput?: number | null;
  ambientTemperature?: number | null;
  humidity?: number | null;
  riskScore?: number | null;
  lat?: number | null;
  lng?: number | null;
  timestamp?: string | null;
}

export interface HeatmapBoundsInput {
  northLat: number;
  southLat: number;
  eastLng: number;
  westLng: number;
}

export interface GeoBoundingBoxInput {
  topLat: number;
  leftLon: number;
  bottomLat: number;
  rightLon: number;
}

export interface GeoDistanceInput {
  lat: number;
  lon: number;
  radiusKm: number;
  status?: string | null;
}

export interface TimeRangeInput {
  start: string;
  end: string;
}

export interface DeviceSearchFiltersInput {
  status?: string | null;
  location?: string | null;
  model?: string | null;
  healthScoreMin?: number | null;
  healthScoreMax?: number | null;
}

// =============================================================================
// Query Variable Types
// =============================================================================

export interface ListDevicesQueryVariables {
  page?: number | null;
  pageSize?: number | null;
  filters?: DeviceFiltersInput | null;
}

export interface GetDeviceQueryVariables {
  id: string;
}

export interface SearchDevicesQueryVariables {
  query: string;
}

export interface ListFirmwareQueryVariables {
  page?: number | null;
  pageSize?: number | null;
}

export interface GetFirmwareQueryVariables {
  id: string;
}

export interface ListServiceOrdersQueryVariables {
  page?: number | null;
  pageSize?: number | null;
  status?: string | null;
}

export interface ListComplianceQueryVariables {
  status?: string | null;
  certType?: string | null;
}

export interface ListVulnerabilitiesQueryVariables {
  severity?: string | null;
}

export interface ListAuditLogsQueryVariables {
  startDate: string;
  endDate: string;
  limit?: number | null;
  nextToken?: string | null;
}

export interface GetAuditLogsByUserQueryVariables {
  userId: string;
}

export interface GetCustomerQueryVariables {
  id: string;
}

export interface GetDeviceTelemetryQueryVariables {
  deviceId: string;
  startDate: string;
  endDate: string;
}

export interface GetHeatmapAggregationQueryVariables {
  bounds?: HeatmapBoundsInput | null;
  precision?: number | null;
  riskThreshold?: number | null;
}

export interface GetBlastRadiusQueryVariables {
  lat: number;
  lng: number;
  radiusKm: number;
  includeOffline?: boolean | null;
}

export interface GetBlastRadiusHistoryQueryVariables {
  deviceId?: string | null;
}

export interface SearchGlobalQueryVariables {
  query: string;
  entityTypes?: string[] | null;
  limit?: number | null;
}

export interface SearchDevicesAdvancedQueryVariables {
  query: string;
  filters?: DeviceSearchFiltersInput | null;
}

export interface SearchVulnerabilitiesQueryVariables {
  query: string;
  severity?: string | null;
}

export interface GetAggregationQueryVariables {
  metric: AggregationMetric;
  timeRange?: TimeRangeInput | null;
}

export interface SearchDevicesByBoundsQueryVariables {
  bounds: GeoBoundingBoxInput;
  status?: string | null;
}

export interface SearchDevicesByDistanceQueryVariables {
  params: GeoDistanceInput;
}

export interface GetDeviceGeoClustersQueryVariables {
  bounds?: GeoBoundingBoxInput | null;
  precision?: number | null;
}

// =============================================================================
// Mutation Variable Types
// =============================================================================

export interface CreateServiceOrderMutationVariables {
  input: ServiceOrderInput;
}

export interface UpdateServiceOrderMutationVariables {
  id: string;
  input: ServiceOrderInput;
}

export interface UploadFirmwareMutationVariables {
  input: FirmwareInput;
}

export interface ApproveFirmwareMutationVariables {
  id: string;
  stage: string;
}

export interface SubmitComplianceReviewMutationVariables {
  id: string;
}

export interface AcknowledgeNotificationMutationVariables {
  id: string;
}

export interface IngestTelemetryMutationVariables {
  deviceId: string;
  metrics: TelemetryInput;
}

export interface RunBlastRadiusSimulationMutationVariables {
  deviceId: string;
  radiusKm: number;
  failureType: FailureType;
  severity?: number | null;
}
