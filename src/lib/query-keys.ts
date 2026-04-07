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

  // Artifacts (Epic 20 — IArtifactProvider)
  artifacts: {
    all: ["artifacts"] as const,
    detail: (id: string) => [...queryKeys.artifacts.all, "detail", id] as const,
    versions: (id: string) => [...queryKeys.artifacts.all, "versions", id] as const,
  },

  // CRM (Epic 20 — ICRMProvider)
  crm: {
    all: ["crm"] as const,
    customers: (filters?: Record<string, unknown>) =>
      [...queryKeys.crm.all, "customers", filters] as const,
    customer: (id: string) => [...queryKeys.crm.all, "customer", id] as const,
    tickets: (filters?: Record<string, unknown>) =>
      [...queryKeys.crm.all, "tickets", filters] as const,
    ticket: (id: string) => [...queryKeys.crm.all, "ticket", id] as const,
  },

  // Compliance Scans (Epic 20 — IComplianceScannerProvider)
  scans: {
    all: ["scans"] as const,
    status: (scanId: string) => [...queryKeys.scans.all, "status", scanId] as const,
    report: (scanId: string) => [...queryKeys.scans.all, "report", scanId] as const,
    history: (artifactId: string) => [...queryKeys.scans.all, "history", artifactId] as const,
  },

  // CDC (Epic 20 — ICDCProvider)
  cdc: {
    all: ["cdc"] as const,
    history: (entityId: string) => [...queryKeys.cdc.all, "history", entityId] as const,
    recent: (entityType: string) => [...queryKeys.cdc.all, "recent", entityType] as const,
    stats: (range?: Record<string, unknown>) => [...queryKeys.cdc.all, "stats", range] as const,
  },

  // DNS (Epic 20 — IDNSProvider)
  dns: {
    all: ["dns"] as const,
    records: () => [...queryKeys.dns.all, "records"] as const,
    propagation: (name: string) => [...queryKeys.dns.all, "propagation", name] as const,
  },

  // Firmware Families / Versions (Story #388)
  firmwareFamilies: {
    all: ["firmwareFamilies"] as const,
    detail: (familyId: string) => [...queryKeys.firmwareFamilies.all, "detail", familyId] as const,
    versions: (familyId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.firmwareFamilies.all, "versions", familyId, filters] as const,
    version: (familyId: string, versionId: string) =>
      [...queryKeys.firmwareFamilies.all, "version", familyId, versionId] as const,
  },

  // Customers (Story #389)
  customers: {
    all: ["customers"] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.customers.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.customers.all, "detail", id] as const,
  },

  // Sites (Story #389)
  sites: {
    all: ["sites"] as const,
    list: (customerId: string) => [...queryKeys.sites.all, "list", customerId] as const,
    detail: (id: string) => [...queryKeys.sites.all, "detail", id] as const,
    deployments: (siteId: string) => [...queryKeys.sites.all, "deployments", siteId] as const,
    byFirmwareVersion: (fwVersionId: string) =>
      [...queryKeys.sites.all, "byFirmwareVersion", fwVersionId] as const,
  },
};
