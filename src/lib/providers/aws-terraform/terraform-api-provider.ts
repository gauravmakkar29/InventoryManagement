/**
 * IMS Gen 2 — AWS Terraform API Provider
 *
 * Connects to a Terraform-provisioned AppSync GraphQL API or REST API Gateway
 * using the resilient API client. No AWS SDK dependency — just HTTP calls
 * with JWT auth headers.
 *
 * Terraform and CDK both deploy the same AppSync service, so this provider
 * follows the same patterns as the CDK API provider.
 *
 * Required env vars (from Terraform outputs — see Docs/integration-contract.md):
 *   VITE_API_ENDPOINT — AppSync or API Gateway URL
 *   VITE_API_TYPE     — "graphql" or "rest" (default: "graphql")
 *
 * @see Story #207 — Terraform adapter package
 */

import type { IApiProvider, DashboardMetrics, HeatmapBounds } from "../types";
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
} from "@/lib/types";
import { createApiClient, type IApiClient } from "@/lib/api-client";
import { createAppVersionInterceptor } from "@/lib/app-version";

// =============================================================================
// Config
// =============================================================================

interface TerraformApiConfig {
  endpoint: string;
  apiType: "graphql" | "rest";
}

function loadApiConfig(): TerraformApiConfig {
  const endpoint = import.meta.env.VITE_API_ENDPOINT;
  const apiType = (import.meta.env.VITE_API_TYPE ?? "graphql") as "graphql" | "rest";

  if (!endpoint) {
    throw new Error(
      "Terraform API Provider requires VITE_API_ENDPOINT. " +
        "This value comes from Terraform outputs. See Docs/integration-contract.md.",
    );
  }

  return { endpoint, apiType };
}

// =============================================================================
// GraphQL helper
// =============================================================================

const AUTH_SESSION_KEY = "ims-terraform-auth-session";

function getAuthToken(): string | null {
  const stored = localStorage.getItem(AUTH_SESSION_KEY);
  if (!stored) return null;
  try {
    const session = JSON.parse(stored) as { accessToken?: string };
    return session.accessToken ?? null;
  } catch {
    return null;
  }
}

async function gql<T>(
  client: IApiClient,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = getAuthToken();
  const response = await client.execute<{ data: T; errors?: Array<{ message: string }> }>({
    url: "",
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: { query, variables },
    type: "query",
  });

  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0]?.message ?? "GraphQL error");
  }

  return response.data.data;
}

// =============================================================================
// Provider implementation
// =============================================================================

/**
 * Create a Terraform API provider that calls AppSync/API Gateway.
 *
 * This is a skeleton implementation — each method shows the expected
 * GraphQL query shape. Teams must update the queries to match their
 * actual AppSync schema deployed via Terraform.
 */
export function createTerraformApiProvider(): IApiProvider {
  const config = loadApiConfig();

  const client = createApiClient({
    baseUrl: config.endpoint,
    requestInterceptors: [createAppVersionInterceptor()],
  });

  // Helper for methods not yet connected to a live backend
  function notImplemented(method: string): never {
    throw new Error(
      `[Terraform API] ${method} is not yet connected to a live backend. ` +
        `Implement the GraphQL query/mutation in terraform-api-provider.ts.`,
    );
  }

  return {
    // --- Queries ---
    async listDevices(
      page?: number,
      pageSize?: number,
      filters?: Record<string, string>,
    ): Promise<PaginatedResponse<Device>> {
      if (config.apiType === "graphql") {
        const result = await gql<{ listDevices: PaginatedResponse<Device> }>(
          client,
          `query ListDevices($page: Int, $pageSize: Int, $filters: AWSJSON) {
            listDevices(page: $page, pageSize: $pageSize, filters: $filters) {
              items { id name serialNumber status firmwareVersion location healthScore lastSeen }
              totalCount
              nextToken
            }
          }`,
          { page, pageSize, filters: filters ? JSON.stringify(filters) : undefined },
        );
        return result.listDevices;
      }
      // REST fallback
      const response = await client.execute<PaginatedResponse<Device>>({
        url: `/devices?page=${page ?? 1}&pageSize=${pageSize ?? 20}`,
        type: "query",
      });
      return response.data;
    },

    async getDevice(id: string): Promise<Device | null> {
      if (config.apiType === "graphql") {
        const result = await gql<{ getDevice: Device | null }>(
          client,
          `query GetDevice($id: ID!) {
            getDevice(id: $id) { id name serialNumber status firmwareVersion location healthScore lastSeen coordinates { lat lng } }
          }`,
          { id },
        );
        return result.getDevice;
      }
      const response = await client.execute<Device>({ url: `/devices/${id}`, type: "query" });
      return response.data;
    },

    async searchDevices(_query: string): Promise<SearchResult<Device>> {
      return notImplemented("searchDevices");
    },

    async listFirmware(_page?: number, _pageSize?: number): Promise<PaginatedResponse<Firmware>> {
      return notImplemented("listFirmware");
    },

    async getFirmware(_id: string): Promise<Firmware | null> {
      return notImplemented("getFirmware");
    },

    async listServiceOrders(
      _page?: number,
      _pageSize?: number,
      _status?: string,
    ): Promise<PaginatedResponse<ServiceOrder>> {
      return notImplemented("listServiceOrders");
    },

    async listCompliance(
      _status?: string,
      _certType?: string,
    ): Promise<PaginatedResponse<Compliance>> {
      return notImplemented("listCompliance");
    },

    async listVulnerabilities(_severity?: string): Promise<PaginatedResponse<Vulnerability>> {
      return notImplemented("listVulnerabilities");
    },

    async listAuditLogs(
      _startDate: string,
      _endDate: string,
      _limit?: number,
      _nextToken?: string,
    ): Promise<PaginatedResponse<AuditLog>> {
      return notImplemented("listAuditLogs");
    },

    async getAuditLogsByUser(_userId: string): Promise<AuditLog[]> {
      return notImplemented("getAuditLogsByUser");
    },

    async getCustomer(_id: string): Promise<Customer | null> {
      return notImplemented("getCustomer");
    },

    async listNotifications(): Promise<Notification[]> {
      return notImplemented("listNotifications");
    },

    async getDeviceAggregations(): Promise<AggregationResult[]> {
      return notImplemented("getDeviceAggregations");
    },

    async getDashboardMetrics(): Promise<DashboardMetrics> {
      return notImplemented("getDashboardMetrics");
    },

    // --- Mutations (throw ApiMutationError on failure) ---
    async createServiceOrder(_input: Partial<ServiceOrder>): Promise<ServiceOrder> {
      return notImplemented("createServiceOrder");
    },

    async updateServiceOrder(_id: string, _input: Partial<ServiceOrder>): Promise<ServiceOrder> {
      return notImplemented("updateServiceOrder");
    },

    async uploadFirmware(_input: Partial<Firmware>): Promise<Firmware> {
      return notImplemented("uploadFirmware");
    },

    async approveFirmware(_id: string, _stage: string): Promise<Firmware> {
      return notImplemented("approveFirmware");
    },

    async submitComplianceReview(_id: string): Promise<Compliance> {
      return notImplemented("submitComplianceReview");
    },

    async acknowledgeNotification(_id: string): Promise<boolean> {
      return notImplemented("acknowledgeNotification");
    },

    // --- Telemetry ---
    async getDeviceTelemetry(
      _deviceId: string,
      _startDate: string,
      _endDate: string,
    ): Promise<TelemetryReading[]> {
      return notImplemented("getDeviceTelemetry");
    },

    async getHeatmapAggregation(
      _bounds?: HeatmapBounds,
      _precision?: number,
      _riskThreshold?: number,
    ): Promise<HeatmapAggregation> {
      return notImplemented("getHeatmapAggregation");
    },

    async getBlastRadius(
      _lat: number,
      _lng: number,
      _radiusKm: number,
      _includeOffline?: boolean,
    ): Promise<BlastRadiusResult | null> {
      return notImplemented("getBlastRadius");
    },

    async getBlastRadiusHistory(_deviceId?: string): Promise<BlastRadiusResult[]> {
      return notImplemented("getBlastRadiusHistory");
    },

    async ingestTelemetry(
      _deviceId: string,
      _metrics: Partial<TelemetryReading>,
    ): Promise<TelemetryReading | null> {
      return notImplemented("ingestTelemetry");
    },

    async runBlastRadiusSimulation(
      _deviceId: string,
      _radiusKm: number,
      _failureType: FailureType,
      _severity?: number,
    ): Promise<BlastRadiusResult | null> {
      return notImplemented("runBlastRadiusSimulation");
    },

    async getTelemetryPipelineStatus(): Promise<TelemetryPipelineStatus> {
      return notImplemented("getTelemetryPipelineStatus");
    },

    // --- Search ---
    async searchGlobal(
      _query: string,
      _entityTypes?: string[],
      _limit?: number,
    ): Promise<GlobalSearchResponse> {
      return notImplemented("searchGlobal");
    },

    async searchDevicesAdvanced(
      _query: string,
      _filters?: DeviceSearchFilters,
    ): Promise<SearchResult<Device>> {
      return notImplemented("searchDevicesAdvanced");
    },

    async searchVulnerabilities(
      _query: string,
      _severity?: string,
    ): Promise<SearchResult<Vulnerability>> {
      return notImplemented("searchVulnerabilities");
    },

    async getAggregation(
      _metric: AggregationMetric,
      _timeRange?: TimeRange,
    ): Promise<AggregationResponse> {
      return notImplemented("getAggregation");
    },

    async searchDevicesByBounds(
      _bounds: GeoBoundingBox,
      _status?: string,
    ): Promise<GeoDeviceResult[]> {
      return notImplemented("searchDevicesByBounds");
    },

    async searchDevicesByDistance(_params: GeoDistanceQuery): Promise<GeoDeviceResult[]> {
      return notImplemented("searchDevicesByDistance");
    },

    async getDeviceGeoClusters(
      _bounds?: GeoBoundingBox,
      _precision?: number,
    ): Promise<GeoCluster[]> {
      return notImplemented("getDeviceGeoClusters");
    },

    async getOsisPipelineHealth(): Promise<PipelineHealthStatus> {
      return notImplemented("getOsisPipelineHealth");
    },

    async triggerReindex(): Promise<boolean> {
      return notImplemented("triggerReindex");
    },
  };
}
