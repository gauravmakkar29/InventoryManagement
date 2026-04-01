/**
 * Centralized query key factory.
 *
 * Convention: [domain, scope, ...params]
 * - queryKeys.dashboard.metrics() → ["dashboard", "metrics"]
 * - queryKeys.devices.list({ status: "Online" }) → ["devices", "list", { status: "Online" }]
 * - queryKeys.devices.detail("d1") → ["devices", "detail", "d1"]
 *
 * Benefits:
 * - Type-safe invalidation: queryClient.invalidateQueries({ queryKey: queryKeys.devices.all })
 * - Hierarchical: invalidating "devices" invalidates all device queries
 */
export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ["dashboard"] as const,
    metrics: () => [...queryKeys.dashboard.all, "metrics"] as const,
  },

  // Devices / Inventory
  devices: {
    all: ["devices"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.devices.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.devices.all, "detail", id] as const,
  },

  // Firmware / Deployment
  firmware: {
    all: ["firmware"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.firmware.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.firmware.all, "detail", id] as const,
  },

  // Vulnerabilities
  vulnerabilities: {
    all: ["vulnerabilities"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.vulnerabilities.all, "list", filters] as const,
  },

  // Compliance
  compliance: {
    all: ["compliance"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.compliance.all, "list", filters] as const,
  },

  // Service Orders
  serviceOrders: {
    all: ["serviceOrders"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.serviceOrders.all, "list", filters] as const,
  },

  // Audit Logs
  auditLogs: {
    all: ["auditLogs"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.auditLogs.all, "list", filters] as const,
  },

  // SBOM
  sbom: {
    all: ["sbom"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.sbom.all, "list", filters] as const,
  },

  // Incidents
  incidents: {
    all: ["incidents"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.incidents.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.incidents.all, "detail", id] as const,
  },

  // Telemetry
  telemetry: {
    all: ["telemetry"] as const,
    device: (deviceId: string, range?: Record<string, unknown>) =>
      [...queryKeys.telemetry.all, "device", deviceId, range] as const,
    pipeline: () => [...queryKeys.telemetry.all, "pipeline"] as const,
  },

  // Notifications
  notifications: {
    all: ["notifications"] as const,
  },
};
