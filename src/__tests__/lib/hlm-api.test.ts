import { describe, it, expect } from "vitest";
import {
  getDefaultHeaders,
  listDevices,
  getDevice,
  searchDevices,
  listFirmware,
  getFirmware,
  listServiceOrders,
  listCompliance,
  listVulnerabilities,
  listAuditLogs,
  getAuditLogsByUser,
  getCustomer,
  listNotifications,
  getDeviceAggregations,
  getDashboardMetrics,
  createServiceOrder,
  updateServiceOrder,
  uploadFirmware,
  approveFirmware,
  submitComplianceReview,
  acknowledgeNotification,
  getDeviceTelemetry,
  getHeatmapAggregation,
  getBlastRadius,
  getBlastRadiusHistory,
  ingestTelemetry,
  runBlastRadiusSimulation,
  getTelemetryPipelineStatus,
  searchGlobal,
  searchDevicesAdvanced,
  searchVulnerabilities,
  getAggregation,
  searchDevicesByBounds,
  searchDevicesByDistance,
  getDeviceGeoClusters,
  getOsisPipelineHealth,
  triggerReindex,
} from "../../lib/hlm-api";
import { APP_BUILD_INFO } from "../../lib/app-version";

// =============================================================================
// getDefaultHeaders
// =============================================================================

describe("getDefaultHeaders", () => {
  it("includes Content-Type application/json", () => {
    const headers = getDefaultHeaders();
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("includes X-App-Version header", () => {
    const headers = getDefaultHeaders();
    expect(headers["X-App-Version"]).toBe(APP_BUILD_INFO.full);
  });
});

// =============================================================================
// Query stubs — all return empty/mock data
// =============================================================================

describe("HLM API query stubs", () => {
  it("listDevices returns empty paginated response", async () => {
    const result = await listDevices();
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 25, hasMore: false });
  });

  it("getDevice returns null", async () => {
    const result = await getDevice("d1");
    expect(result).toBeNull();
  });

  it("searchDevices returns empty search result", async () => {
    const result = await searchDevices("test");
    expect(result).toEqual({ hits: [], total: 0, took: 0, maxScore: 0 });
  });

  it("listFirmware returns empty paginated response", async () => {
    const result = await listFirmware();
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 25, hasMore: false });
  });

  it("getFirmware returns null", async () => {
    const result = await getFirmware("fw1");
    expect(result).toBeNull();
  });

  it("listServiceOrders returns empty paginated response", async () => {
    const result = await listServiceOrders();
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 25, hasMore: false });
  });

  it("listCompliance returns empty paginated response", async () => {
    const result = await listCompliance();
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 25, hasMore: false });
  });

  it("listVulnerabilities returns empty paginated response", async () => {
    const result = await listVulnerabilities();
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 25, hasMore: false });
  });

  it("listAuditLogs returns empty paginated response", async () => {
    const result = await listAuditLogs("2026-01-01", "2026-12-31");
    expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 25, hasMore: false });
  });

  it("getAuditLogsByUser returns empty array", async () => {
    const result = await getAuditLogsByUser("usr-1");
    expect(result).toEqual([]);
  });

  it("getCustomer returns null", async () => {
    const result = await getCustomer("cust-1");
    expect(result).toBeNull();
  });

  it("listNotifications returns empty array", async () => {
    const result = await listNotifications();
    expect(result).toEqual([]);
  });

  it("getDeviceAggregations returns empty array", async () => {
    const result = await getDeviceAggregations();
    expect(result).toEqual([]);
  });

  it("getDashboardMetrics returns zero-value metrics", async () => {
    const result = await getDashboardMetrics();
    expect(result).toEqual({
      totalDevices: 0,
      onlineDevices: 0,
      activeDeployments: 0,
      pendingApprovals: 0,
      healthScore: 0,
    });
  });
});

// =============================================================================
// Mutation stubs
// =============================================================================

describe("HLM API mutation stubs", () => {
  it("createServiceOrder returns null", async () => {
    const result = await createServiceOrder({});
    expect(result).toBeNull();
  });

  it("updateServiceOrder returns null", async () => {
    const result = await updateServiceOrder("so-1", {});
    expect(result).toBeNull();
  });

  it("uploadFirmware returns null", async () => {
    const result = await uploadFirmware({});
    expect(result).toBeNull();
  });

  it("approveFirmware returns null", async () => {
    const result = await approveFirmware("fw-1", "testing");
    expect(result).toBeNull();
  });

  it("submitComplianceReview returns null", async () => {
    const result = await submitComplianceReview("c-1");
    expect(result).toBeNull();
  });

  it("acknowledgeNotification returns true", async () => {
    const result = await acknowledgeNotification("n-1");
    expect(result).toBe(true);
  });
});

// =============================================================================
// Telemetry stubs
// =============================================================================

describe("HLM API telemetry stubs", () => {
  it("getDeviceTelemetry returns empty array", async () => {
    const result = await getDeviceTelemetry("d1", "2026-01-01", "2026-12-31");
    expect(result).toEqual([]);
  });

  it("getHeatmapAggregation returns empty aggregation", async () => {
    const result = await getHeatmapAggregation();
    expect(result).toEqual({ cells: [], totalDevices: 0 });
  });

  it("getBlastRadius returns null", async () => {
    const result = await getBlastRadius(39.74, -104.99, 10);
    expect(result).toBeNull();
  });

  it("getBlastRadiusHistory returns empty array", async () => {
    const result = await getBlastRadiusHistory();
    expect(result).toEqual([]);
  });

  it("ingestTelemetry returns null", async () => {
    const result = await ingestTelemetry("d1", {});
    expect(result).toBeNull();
  });

  it("runBlastRadiusSimulation returns null", async () => {
    const result = await runBlastRadiusSimulation("d1", 10, "power_failure");
    expect(result).toBeNull();
  });

  it("getTelemetryPipelineStatus returns healthy status", async () => {
    const result = await getTelemetryPipelineStatus();
    expect(result.health).toBe("healthy");
    expect(result.recordsIngestedLastHour).toBe(0);
    expect(result.lastSuccessfulIngestion).toBeDefined();
  });
});

// =============================================================================
// OpenSearch stubs
// =============================================================================

describe("HLM API OpenSearch stubs", () => {
  it("searchGlobal returns empty response", async () => {
    const result = await searchGlobal("test");
    expect(result).toEqual({ total: 0, results: [] });
  });

  it("searchDevicesAdvanced returns empty search result", async () => {
    const result = await searchDevicesAdvanced("test");
    expect(result).toEqual({ hits: [], total: 0, took: 0, maxScore: 0 });
  });

  it("searchVulnerabilities returns empty search result", async () => {
    const result = await searchVulnerabilities("CVE-2026-001");
    expect(result).toEqual({ hits: [], total: 0, took: 0, maxScore: 0 });
  });

  it("getAggregation returns empty aggregation", async () => {
    const result = await getAggregation("device_status");
    expect(result).toEqual({ metric: "device_status", data: {} });
  });

  it("searchDevicesByBounds returns empty array", async () => {
    const result = await searchDevicesByBounds({
      topLeft: { lat: 40, lon: -105 },
      bottomRight: { lat: 39, lon: -104 },
    });
    expect(result).toEqual([]);
  });

  it("searchDevicesByDistance returns empty array", async () => {
    const result = await searchDevicesByDistance({
      center: { lat: 39.74, lon: -104.99 },
      distance: "10km",
    });
    expect(result).toEqual([]);
  });

  it("getDeviceGeoClusters returns empty array", async () => {
    const result = await getDeviceGeoClusters();
    expect(result).toEqual([]);
  });

  it("getOsisPipelineHealth returns running status", async () => {
    const result = await getOsisPipelineHealth();
    expect(result.state).toBe("Running");
    expect(result.recordsSyncedLastHour).toBe(0);
  });

  it("triggerReindex returns true", async () => {
    const result = await triggerReindex();
    expect(result).toBe(true);
  });
});
