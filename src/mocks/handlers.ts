/**
 * IMS Gen 2 — MSW Request Handlers
 *
 * Mock API handlers matching the IApiProvider interface.
 * Used in Vitest tests and Storybook. Handlers are co-located
 * by feature domain for easy discovery.
 *
 * @see Story #195 — MSW for API mocking in tests
 */

import { http, HttpResponse } from "msw";
import { DeviceStatus, FirmwareStatus, ServiceOrderStatus } from "../lib/types";
import type { Device, Firmware, ServiceOrder, PaginatedResponse } from "../lib/types";

// =============================================================================
// Mock Data Factories
// =============================================================================

let deviceIdCounter = 1;

export function createMockDevice(overrides?: Partial<Device>): Device {
  const id = `dev-${String(deviceIdCounter++).padStart(3, "0")}`;
  return {
    id,
    name: `Device ${id}`,
    serialNumber: `SN-${id.toUpperCase()}`,
    model: "HW-3000",
    firmwareVersion: "2.1.0",
    status: "online",
    location: "Building A",
    healthScore: 92,
    lastSeen: new Date().toISOString(),
    ...overrides,
  } as Device;
}

export function createMockFirmware(overrides?: Partial<Firmware>): Firmware {
  return {
    id: `fw-${Date.now().toString(36)}`,
    name: "Firmware v2.1.0",
    version: "2.1.0",
    status: "approved",
    uploadedAt: new Date().toISOString(),
    checksum: "sha256:abc123",
    size: 1024000,
    ...overrides,
  } as Firmware;
}

export function createMockServiceOrder(overrides?: Partial<ServiceOrder>): ServiceOrder {
  return {
    id: `so-${Date.now().toString(36)}`,
    title: "Firmware Update",
    status: "open",
    priority: "medium",
    assignee: "admin@company.com",
    createdAt: new Date().toISOString(),
    ...overrides,
  } as ServiceOrder;
}

function paginate<T>(items: T[], page = 1, pageSize = 10): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return {
    items: paged,
    total: items.length,
    page,
    pageSize,
    hasMore: start + pageSize < items.length,
  };
}

// =============================================================================
// Seed Data
// =============================================================================

const devices = Array.from({ length: 25 }, (_, i) =>
  createMockDevice({
    status: i % 5 === 0 ? DeviceStatus.Offline : DeviceStatus.Online,
    healthScore: 70 + (i % 30),
  }),
);

const firmware = [
  createMockFirmware({ version: "2.1.0", status: FirmwareStatus.Approved }),
  createMockFirmware({ version: "2.0.5", status: FirmwareStatus.Deprecated }),
  createMockFirmware({ version: "2.2.0-rc1", status: FirmwareStatus.Testing }),
];

const ORDER_STATUSES = [
  ServiceOrderStatus.Scheduled,
  ServiceOrderStatus.InProgress,
  ServiceOrderStatus.Completed,
  ServiceOrderStatus.Cancelled,
] as const;

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

const serviceOrders = Array.from({ length: 12 }, (_, i) =>
  createMockServiceOrder({
    status: ORDER_STATUSES[i % 4],
    priority: PRIORITIES[i % 4],
  }),
);

// =============================================================================
// Device Handlers
// =============================================================================

export const deviceHandlers = [
  http.get("*/api/devices", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    return HttpResponse.json(paginate(devices, page, pageSize));
  }),

  http.get("*/api/devices/:id", ({ params }) => {
    const device = devices.find((d) => d.id === params["id"]);
    if (!device) return HttpResponse.json(null, { status: 404 });
    return HttpResponse.json(device);
  }),

  http.patch("*/api/devices/:id", async ({ params, request }) => {
    const device = devices.find((d) => d.id === params["id"]);
    if (!device) return HttpResponse.json(null, { status: 404 });
    const body = (await request.json()) as Partial<Device>;
    Object.assign(device, body);
    return HttpResponse.json(device);
  }),
];

// =============================================================================
// Firmware Handlers
// =============================================================================

export const firmwareHandlers = [
  http.get("*/api/firmware", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    return HttpResponse.json(paginate(firmware, page, pageSize));
  }),
];

// =============================================================================
// Service Order Handlers
// =============================================================================

export const serviceOrderHandlers = [
  http.get("*/api/service-orders", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const status = url.searchParams.get("status");
    const filtered = status ? serviceOrders.filter((o) => o.status === status) : serviceOrders;
    return HttpResponse.json(paginate(filtered, page, pageSize));
  }),

  http.patch("*/api/service-orders/:id", async ({ params, request }) => {
    const order = serviceOrders.find((o) => o.id === params["id"]);
    if (!order) return HttpResponse.json(null, { status: 404 });
    const body = (await request.json()) as Partial<ServiceOrder>;
    Object.assign(order, body);
    return HttpResponse.json(order);
  }),
];

// =============================================================================
// Dashboard Handlers
// =============================================================================

export const dashboardHandlers = [
  http.get("*/api/dashboard/metrics", () => {
    return HttpResponse.json({
      totalDevices: devices.length,
      onlineDevices: devices.filter((d) => d.status === "online").length,
      activeDeployments: 3,
      pendingApprovals: 2,
      healthScore: 87,
    });
  }),
];

// =============================================================================
// All Handlers (combine for server setup)
// =============================================================================

export const handlers = [
  ...deviceHandlers,
  ...firmwareHandlers,
  ...serviceOrderHandlers,
  ...dashboardHandlers,
];
