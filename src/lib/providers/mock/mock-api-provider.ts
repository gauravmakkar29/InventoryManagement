import type { IApiProvider, DashboardMetrics, HeatmapBounds } from "../types";
import type {
  PaginatedResponse,
  SearchResult,
  Device,
  Firmware,
  ServiceOrder,
  Compliance,
  Vulnerability,
  AuditLog,
  Customer,
  Notification,
  AggregationResult,
  TelemetryReading,
  HeatmapAggregation,
  BlastRadiusResult,
  TelemetryPipelineStatus,
  FailureType,
} from "@/lib/types";
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
} from "@/lib/opensearch-types";
import {
  handleMutationResult,
  handleBooleanMutationResult,
  type MutationResult,
} from "@/lib/api-error-handler";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/**
 * Mock API Provider — self-contained mock implementations for all 35
 * IApiProvider methods. Returns empty/zero-value data for queries and
 * processes mutations through the standard error handler pipeline.
 */
export function createMockApiProvider(): IApiProvider {
  return {
    // =========================================================================
    // Queries
    // =========================================================================

    async listDevices(
      _page?: number,
      _pageSize?: number,
      _filters?: Record<string, string>,
    ): Promise<PaginatedResponse<Device>> {
      return emptyPage<Device>();
    },

    async getDevice(_id: string): Promise<Device | null> {
      return null;
    },

    async searchDevices(_query: string): Promise<SearchResult<Device>> {
      return emptySearch<Device>();
    },

    async listFirmware(_page?: number, _pageSize?: number): Promise<PaginatedResponse<Firmware>> {
      return emptyPage<Firmware>();
    },

    async getFirmware(_id: string): Promise<Firmware | null> {
      return null;
    },

    async listServiceOrders(
      _page?: number,
      _pageSize?: number,
      _status?: string,
    ): Promise<PaginatedResponse<ServiceOrder>> {
      return emptyPage<ServiceOrder>();
    },

    async listCompliance(
      _status?: string,
      _certType?: string,
    ): Promise<PaginatedResponse<Compliance>> {
      return emptyPage<Compliance>();
    },

    async listVulnerabilities(_severity?: string): Promise<PaginatedResponse<Vulnerability>> {
      return emptyPage<Vulnerability>();
    },

    async listAuditLogs(
      _startDate: string,
      _endDate: string,
      _limit?: number,
      _nextToken?: string,
    ): Promise<PaginatedResponse<AuditLog>> {
      return emptyPage<AuditLog>();
    },

    async getAuditLogsByUser(_userId: string): Promise<AuditLog[]> {
      return [];
    },

    async getCustomer(_id: string): Promise<Customer | null> {
      return null;
    },

    async listNotifications(): Promise<Notification[]> {
      return [];
    },

    async getDeviceAggregations(): Promise<AggregationResult[]> {
      return [];
    },

    async getDashboardMetrics(): Promise<DashboardMetrics> {
      return {
        totalDevices: 0,
        onlineDevices: 0,
        activeDeployments: 0,
        pendingApprovals: 0,
        healthScore: 0,
      };
    },

    // =========================================================================
    // Mutations
    // =========================================================================

    async createServiceOrder(_input: Partial<ServiceOrder>): Promise<ServiceOrder> {
      const raw: MutationResult<ServiceOrder> = { data: null };
      return handleMutationResult(raw, "createServiceOrder");
    },

    async updateServiceOrder(_id: string, _input: Partial<ServiceOrder>): Promise<ServiceOrder> {
      const raw: MutationResult<ServiceOrder> = { data: null };
      return handleMutationResult(raw, "updateServiceOrder");
    },

    async uploadFirmware(_input: Partial<Firmware>): Promise<Firmware> {
      const raw: MutationResult<Firmware> = { data: null };
      return handleMutationResult(raw, "uploadFirmware");
    },

    async approveFirmware(_id: string, _stage: string): Promise<Firmware> {
      const raw: MutationResult<Firmware> = { data: null };
      return handleMutationResult(raw, "approveFirmware");
    },

    async submitComplianceReview(_id: string): Promise<Compliance> {
      const raw: MutationResult<Compliance> = { data: null };
      return handleMutationResult(raw, "submitComplianceReview");
    },

    async acknowledgeNotification(_id: string): Promise<boolean> {
      const raw: MutationResult<boolean> = { data: true };
      return handleBooleanMutationResult(raw, "acknowledgeNotification");
    },

    // =========================================================================
    // Telemetry & Environmental Monitoring
    // =========================================================================

    async getDeviceTelemetry(
      _deviceId: string,
      _startDate: string,
      _endDate: string,
    ): Promise<TelemetryReading[]> {
      return [];
    },

    async getHeatmapAggregation(
      _bounds?: HeatmapBounds,
      _precision?: number,
      _riskThreshold?: number,
    ): Promise<HeatmapAggregation> {
      return { cells: [], totalDevices: 0 };
    },

    async getBlastRadius(
      _lat: number,
      _lng: number,
      _radiusKm: number,
      _includeOffline?: boolean,
    ): Promise<BlastRadiusResult | null> {
      return null;
    },

    async getBlastRadiusHistory(_deviceId?: string): Promise<BlastRadiusResult[]> {
      return [];
    },

    async ingestTelemetry(
      _deviceId: string,
      _metrics: Partial<TelemetryReading>,
    ): Promise<TelemetryReading | null> {
      return null;
    },

    async runBlastRadiusSimulation(
      _deviceId: string,
      _radiusKm: number,
      _failureType: FailureType,
      _severity?: number,
    ): Promise<BlastRadiusResult | null> {
      return null;
    },

    async getTelemetryPipelineStatus(): Promise<TelemetryPipelineStatus> {
      return {
        recordsIngestedLastHour: 0,
        health: "healthy" as const,
        lastSuccessfulIngestion: new Date().toISOString(),
      };
    },

    // =========================================================================
    // OpenSearch — Global Search, Advanced Search, Aggregations, Geo
    // =========================================================================

    async searchGlobal(
      _query: string,
      _entityTypes?: string[],
      _limit?: number,
    ): Promise<GlobalSearchResponse> {
      return { total: 0, results: [] };
    },

    async searchDevicesAdvanced(
      _query: string,
      _filters?: DeviceSearchFilters,
    ): Promise<SearchResult<Device>> {
      return emptySearch<Device>();
    },

    async searchVulnerabilities(
      _query: string,
      _severity?: string,
    ): Promise<SearchResult<Vulnerability>> {
      return emptySearch<Vulnerability>();
    },

    async getAggregation(
      _metric: AggregationMetric,
      _timeRange?: TimeRange,
    ): Promise<AggregationResponse> {
      return { metric: _metric, data: {} };
    },

    async searchDevicesByBounds(
      _bounds: GeoBoundingBox,
      _status?: string,
    ): Promise<GeoDeviceResult[]> {
      return [];
    },

    async searchDevicesByDistance(_params: GeoDistanceQuery): Promise<GeoDeviceResult[]> {
      return [];
    },

    async getDeviceGeoClusters(
      _bounds?: GeoBoundingBox,
      _precision?: number,
    ): Promise<GeoCluster[]> {
      return [];
    },

    async getOsisPipelineHealth(): Promise<PipelineHealthStatus> {
      return {
        state: "Running" as const,
        recordsSyncedLastHour: 0,
        currentLagSeconds: 0,
        lastUpdated: new Date().toISOString(),
      };
    },

    async triggerReindex(): Promise<boolean> {
      return true;
    },
  };
}
