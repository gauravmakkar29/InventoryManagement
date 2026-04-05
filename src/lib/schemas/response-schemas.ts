/**
 * IMS Gen 2 — Zod Response Schemas (Story 22.1)
 *
 * Runtime validation for API responses. Prevents malformed backend data
 * from crashing the component tree. All schemas use `.passthrough()` to
 * allow forward-compatible fields while enforcing required structure.
 *
 * @see NIST 800-53 SI-10 (input validation at system boundaries)
 */

import { z } from "zod";

// =============================================================================
// Shared primitives
// =============================================================================

const isoDateString = z.string().min(1);
const optionalIsoDate = z.string().nullish();

// =============================================================================
// Device
// =============================================================================

export const deviceResponseSchema = z
  .object({
    id: z.string().min(1),
    name: z.string(),
    serialNumber: z.string(),
    model: z.string(),
    manufacturer: z.string(),
    status: z.enum(["online", "offline", "maintenance", "decommissioned"]),
    firmwareVersion: z.string(),
    location: z.string(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).nullable().optional(),
    customerId: z.string(),
    healthScore: z.number().min(0).max(100),
    lastSeen: isoDateString,
    installedDate: isoDateString,
    tags: z.array(z.string()),
    metadata: z.record(z.string(), z.string()),
  })
  .passthrough();

export type DeviceResponse = z.infer<typeof deviceResponseSchema>;

// =============================================================================
// Firmware
// =============================================================================

export const firmwareResponseSchema = z
  .object({
    id: z.string().min(1),
    version: z.string(),
    name: z.string(),
    status: z.enum(["uploaded", "testing", "approved", "deprecated", "rejected"]),
    approvalStage: z.enum(["uploaded", "testing", "approved", "rejected"]),
    releaseNotes: z.string(),
    fileSize: z.number(),
    checksum: z.string(),
    uploadedBy: z.string(),
    uploadedAt: isoDateString,
    approvedBy: z.string().nullish(),
    approvedAt: optionalIsoDate,
    compatibleModels: z.array(z.string()),
    targetDeviceCount: z.number(),
    deployedDeviceCount: z.number(),
  })
  .passthrough();

export type FirmwareResponse = z.infer<typeof firmwareResponseSchema>;

// =============================================================================
// Service Order
// =============================================================================

export const serviceOrderResponseSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    description: z.string(),
    status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
    priority: z.enum(["low", "medium", "high", "critical"]),
    assignedTo: z.string(),
    customerId: z.string(),
    deviceId: z.string().nullish(),
    scheduledDate: isoDateString,
    completedDate: optionalIsoDate,
    createdAt: isoDateString,
    updatedAt: isoDateString,
    notes: z.array(z.string()),
  })
  .passthrough();

export type ServiceOrderResponse = z.infer<typeof serviceOrderResponseSchema>;

// =============================================================================
// Compliance
// =============================================================================

export const complianceResponseSchema = z
  .object({
    id: z.string().min(1),
    name: z.string(),
    description: z.string(),
    status: z.enum(["approved", "pending", "deprecated", "non_compliant"]),
    certificationType: z.string(),
    lastAuditDate: isoDateString,
    nextAuditDate: isoDateString,
    findings: z.number(),
    criticalFindings: z.number(),
    assignedTo: z.string(),
    documents: z.array(z.string()),
  })
  .passthrough();

export type ComplianceResponse = z.infer<typeof complianceResponseSchema>;

// =============================================================================
// Vulnerability
// =============================================================================

export const vulnerabilityResponseSchema = z
  .object({
    id: z.string().min(1),
    cveId: z.string(),
    title: z.string(),
    description: z.string(),
    severity: z.enum(["critical", "high", "medium", "low", "info"]),
    cvssScore: z.number().min(0).max(10),
    affectedDevices: z.number(),
    patchAvailable: z.boolean(),
    patchFirmwareId: z.string().nullish(),
    discoveredAt: isoDateString,
    resolvedAt: optionalIsoDate,
    status: z.enum(["open", "mitigated", "resolved", "accepted"]),
  })
  .passthrough();

export type VulnerabilityResponse = z.infer<typeof vulnerabilityResponseSchema>;

// =============================================================================
// Audit Log
// =============================================================================

export const auditLogResponseSchema = z
  .object({
    id: z.string().min(1),
    action: z.enum(["Created", "Modified", "Deleted"]),
    resourceType: z.string(),
    resourceId: z.string(),
    userId: z.string(),
    ipAddress: z.string(),
    timestamp: isoDateString,
    status: z.string(),
  })
  .passthrough();

export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;

// =============================================================================
// Dashboard Metrics
// =============================================================================

export const dashboardMetricsResponseSchema = z.object({
  totalDevices: z.number(),
  onlineDevices: z.number(),
  activeDeployments: z.number(),
  pendingApprovals: z.number(),
  healthScore: z.number(),
});

export type DashboardMetricsResponse = z.infer<typeof dashboardMetricsResponseSchema>;

// =============================================================================
// Telemetry Reading
// =============================================================================

export const telemetryReadingResponseSchema = z
  .object({
    deviceId: z.string().min(1),
    temperature: z.number(),
    cpuLoad: z.number(),
    memoryUsage: z.number(),
    networkLatency: z.number(),
    errorRate: z.number(),
    powerOutput: z.number(),
    ambientTemperature: z.number(),
    humidity: z.number(),
    riskScore: z.number(),
    lat: z.number(),
    lng: z.number(),
    timestamp: isoDateString,
  })
  .passthrough();

export type TelemetryReadingResponse = z.infer<typeof telemetryReadingResponseSchema>;

// =============================================================================
// Customer
// =============================================================================

export const customerResponseSchema = z
  .object({
    id: z.string().min(1),
    name: z.string(),
    code: z.string(),
    contactEmail: z.string(),
    contactPhone: z.string(),
    address: z.string(),
    deviceCount: z.number(),
    activeServiceOrders: z.number(),
    complianceScore: z.number().min(0).max(100),
    createdAt: isoDateString,
  })
  .passthrough();

export type CustomerResponse = z.infer<typeof customerResponseSchema>;

// =============================================================================
// Notification
// =============================================================================

export const notificationResponseSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["info", "warning", "error", "success"]),
    title: z.string(),
    message: z.string(),
    read: z.boolean(),
    actionUrl: z.string().nullish(),
    createdAt: isoDateString,
  })
  .passthrough();

export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

// =============================================================================
// Paginated Response (generic wrapper)
// =============================================================================

export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z.boolean(),
  });
}

// =============================================================================
// Validation helper
// =============================================================================

/**
 * Safely parse an API response with a Zod schema.
 * Returns the parsed data on success, or logs a warning and returns
 * the raw data (passthrough) on failure — never crashes the UI.
 */
export function safeParseResponse<T>(schema: z.ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  // Log validation failures for debugging but don't crash
  console.warn(
    `[ResponseValidation] ${context}: schema validation failed`,
    result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  );

  // Return raw data as fallback — the UI may still work with partial data
  return data as T;
}
