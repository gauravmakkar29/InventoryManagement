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
} from "./types";

function stub<T>(name: string, fallback: T): T {
  console.warn(`[hlm-api] ${name}() — returning mock data`);
  return fallback;
}

const emptyPage = <T,>(): PaginatedResponse<T> => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 25,
  hasMore: false,
});

const emptySearch = <T,>(): SearchResult<T> => ({
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
  _filters?: Record<string, string>
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
  _pageSize?: number
): Promise<PaginatedResponse<Firmware>> {
  return stub("listFirmware", emptyPage<Firmware>());
}

export async function getFirmware(_id: string): Promise<Firmware | null> {
  return stub("getFirmware", null);
}

export async function listServiceOrders(
  _page?: number,
  _pageSize?: number,
  _status?: string
): Promise<PaginatedResponse<ServiceOrder>> {
  return stub("listServiceOrders", emptyPage<ServiceOrder>());
}

export async function listCompliance(
  _status?: string,
  _certType?: string
): Promise<PaginatedResponse<Compliance>> {
  return stub("listCompliance", emptyPage<Compliance>());
}

export async function listVulnerabilities(
  _severity?: string
): Promise<PaginatedResponse<Vulnerability>> {
  return stub("listVulnerabilities", emptyPage<Vulnerability>());
}

export async function listAuditLogs(
  _page?: number,
  _pageSize?: number
): Promise<PaginatedResponse<AuditLog>> {
  return stub("listAuditLogs", emptyPage<AuditLog>());
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
// =============================================================================

export async function createServiceOrder(
  _input: Partial<ServiceOrder>
): Promise<ServiceOrder | null> {
  return stub("createServiceOrder", null);
}

export async function updateServiceOrder(
  _id: string,
  _input: Partial<ServiceOrder>
): Promise<ServiceOrder | null> {
  return stub("updateServiceOrder", null);
}

export async function uploadFirmware(
  _input: Partial<Firmware>
): Promise<Firmware | null> {
  return stub("uploadFirmware", null);
}

export async function approveFirmware(
  _id: string,
  _stage: string
): Promise<Firmware | null> {
  return stub("approveFirmware", null);
}

export async function submitComplianceReview(
  _id: string
): Promise<Compliance | null> {
  return stub("submitComplianceReview", null);
}

export async function acknowledgeNotification(
  _id: string
): Promise<boolean> {
  return stub("acknowledgeNotification", true);
}
