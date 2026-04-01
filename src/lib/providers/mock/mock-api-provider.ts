import type { IApiProvider } from "../types";
import * as hlmApi from "../../hlm-api";

/**
 * Mock API Provider — wraps the existing hlm-api.ts stub functions
 * behind the IApiProvider interface. Pure delegation, no logic copied.
 */
export function createMockApiProvider(): IApiProvider {
  return {
    // Queries
    listDevices: hlmApi.listDevices,
    getDevice: hlmApi.getDevice,
    searchDevices: hlmApi.searchDevices,
    listFirmware: hlmApi.listFirmware,
    getFirmware: hlmApi.getFirmware,
    listServiceOrders: hlmApi.listServiceOrders,
    listCompliance: hlmApi.listCompliance,
    listVulnerabilities: hlmApi.listVulnerabilities,
    listAuditLogs: hlmApi.listAuditLogs,
    getAuditLogsByUser: hlmApi.getAuditLogsByUser,
    getCustomer: hlmApi.getCustomer,
    listNotifications: hlmApi.listNotifications,
    getDeviceAggregations: hlmApi.getDeviceAggregations,
    getDashboardMetrics: hlmApi.getDashboardMetrics,

    // Mutations
    createServiceOrder: hlmApi.createServiceOrder,
    updateServiceOrder: hlmApi.updateServiceOrder,
    uploadFirmware: hlmApi.uploadFirmware,
    approveFirmware: hlmApi.approveFirmware,
    submitComplianceReview: hlmApi.submitComplianceReview,
    acknowledgeNotification: hlmApi.acknowledgeNotification,

    // Telemetry
    getDeviceTelemetry: hlmApi.getDeviceTelemetry,
    getHeatmapAggregation: hlmApi.getHeatmapAggregation,
    getBlastRadius: hlmApi.getBlastRadius,
    getBlastRadiusHistory: hlmApi.getBlastRadiusHistory,
    ingestTelemetry: hlmApi.ingestTelemetry,
    runBlastRadiusSimulation: hlmApi.runBlastRadiusSimulation,
    getTelemetryPipelineStatus: hlmApi.getTelemetryPipelineStatus,

    // OpenSearch
    searchGlobal: hlmApi.searchGlobal,
    searchDevicesAdvanced: hlmApi.searchDevicesAdvanced,
    searchVulnerabilities: hlmApi.searchVulnerabilities,
    getAggregation: hlmApi.getAggregation,
    searchDevicesByBounds: hlmApi.searchDevicesByBounds,
    searchDevicesByDistance: hlmApi.searchDevicesByDistance,
    getDeviceGeoClusters: hlmApi.getDeviceGeoClusters,
    getOsisPipelineHealth: hlmApi.getOsisPipelineHealth,
    triggerReindex: hlmApi.triggerReindex,
  };
}
