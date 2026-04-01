/**
 * IMS Gen 2 — Provider Interfaces
 *
 * These interfaces define the contracts that cloud adapters must implement.
 * Swap adapters in platform.config.ts to switch between AWS, Azure, mock, etc.
 */

import type { ComponentType, ReactNode } from "react";
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
} from "../types";
import type {
  GlobalSearchResponse,
  DeviceSearchFilters,
  AggregationMetric,
  AggregationResponse,
  TimeRange,
  GeoBoundingBox,
  GeoDistanceQuery,
  GeoDeviceResult,
  GeoCluster,
  PipelineHealthStatus,
} from "../opensearch-types";

// =============================================================================
// Auth Adapter (re-exported for convenience)
// =============================================================================

export type { IAuthAdapter, AuthSession, SignInResult } from "./auth-adapter";

// =============================================================================
// API Provider
// =============================================================================

/** Dashboard metrics shape */
export interface DashboardMetrics {
  totalDevices: number;
  onlineDevices: number;
  activeDeployments: number;
  pendingApprovals: number;
  healthScore: number;
}

/** Heatmap bounds parameter */
export interface HeatmapBounds {
  northLat: number;
  southLat: number;
  eastLng: number;
  westLng: number;
}

/**
 * API provider interface — all data operations the app needs.
 * Each method matches the corresponding function in hlm-api.ts.
 */
export interface IApiProvider {
  // --- Queries ---
  listDevices(
    page?: number,
    pageSize?: number,
    filters?: Record<string, string>,
  ): Promise<PaginatedResponse<Device>>;
  getDevice(id: string): Promise<Device | null>;
  searchDevices(query: string): Promise<SearchResult<Device>>;
  listFirmware(page?: number, pageSize?: number): Promise<PaginatedResponse<Firmware>>;
  getFirmware(id: string): Promise<Firmware | null>;
  listServiceOrders(
    page?: number,
    pageSize?: number,
    status?: string,
  ): Promise<PaginatedResponse<ServiceOrder>>;
  listCompliance(status?: string, certType?: string): Promise<PaginatedResponse<Compliance>>;
  listVulnerabilities(severity?: string): Promise<PaginatedResponse<Vulnerability>>;
  listAuditLogs(
    startDate: string,
    endDate: string,
    limit?: number,
    nextToken?: string,
  ): Promise<PaginatedResponse<AuditLog>>;
  getAuditLogsByUser(userId: string): Promise<AuditLog[]>;
  getCustomer(id: string): Promise<Customer | null>;
  listNotifications(): Promise<Notification[]>;
  getDeviceAggregations(): Promise<AggregationResult[]>;
  getDashboardMetrics(): Promise<DashboardMetrics>;

  // --- Mutations ---
  createServiceOrder(input: Partial<ServiceOrder>): Promise<ServiceOrder | null>;
  updateServiceOrder(id: string, input: Partial<ServiceOrder>): Promise<ServiceOrder | null>;
  uploadFirmware(input: Partial<Firmware>): Promise<Firmware | null>;
  approveFirmware(id: string, stage: string): Promise<Firmware | null>;
  submitComplianceReview(id: string): Promise<Compliance | null>;
  acknowledgeNotification(id: string): Promise<boolean>;

  // --- Telemetry & Environmental Monitoring ---
  getDeviceTelemetry(
    deviceId: string,
    startDate: string,
    endDate: string,
  ): Promise<TelemetryReading[]>;
  getHeatmapAggregation(
    bounds?: HeatmapBounds,
    precision?: number,
    riskThreshold?: number,
  ): Promise<HeatmapAggregation>;
  getBlastRadius(
    lat: number,
    lng: number,
    radiusKm: number,
    includeOffline?: boolean,
  ): Promise<BlastRadiusResult | null>;
  getBlastRadiusHistory(deviceId?: string): Promise<BlastRadiusResult[]>;
  ingestTelemetry(
    deviceId: string,
    metrics: Partial<TelemetryReading>,
  ): Promise<TelemetryReading | null>;
  runBlastRadiusSimulation(
    deviceId: string,
    radiusKm: number,
    failureType: FailureType,
    severity?: number,
  ): Promise<BlastRadiusResult | null>;
  getTelemetryPipelineStatus(): Promise<TelemetryPipelineStatus>;

  // --- OpenSearch / Global Search ---
  searchGlobal(
    query: string,
    entityTypes?: string[],
    limit?: number,
  ): Promise<GlobalSearchResponse>;
  searchDevicesAdvanced(
    query: string,
    filters?: DeviceSearchFilters,
  ): Promise<SearchResult<Device>>;
  searchVulnerabilities(query: string, severity?: string): Promise<SearchResult<Vulnerability>>;
  getAggregation(metric: AggregationMetric, timeRange?: TimeRange): Promise<AggregationResponse>;
  searchDevicesByBounds(bounds: GeoBoundingBox, status?: string): Promise<GeoDeviceResult[]>;
  searchDevicesByDistance(params: GeoDistanceQuery): Promise<GeoDeviceResult[]>;
  getDeviceGeoClusters(bounds?: GeoBoundingBox, precision?: number): Promise<GeoCluster[]>;
  getOsisPipelineHealth(): Promise<PipelineHealthStatus>;
  triggerReindex(): Promise<boolean>;
}

// =============================================================================
// Storage Provider
// =============================================================================

/**
 * Storage provider interface — key-value persistence abstraction.
 * Current implementation: localStorage. Future: sessionStorage, IndexedDB, etc.
 */
export interface IStorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// =============================================================================
// Platform Config
// =============================================================================

export type PlatformId = "mock" | "aws-amplify" | "aws-cdk" | "aws-terraform" | "azure";

export interface PlatformConfig {
  api: IApiProvider;
  storage: IStorageProvider;
  AuthProvider: ComponentType<{ children: ReactNode }>;
}
