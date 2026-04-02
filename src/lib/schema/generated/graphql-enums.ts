/**
 * IMS Gen 2 — Generated GraphQL Enum Types
 *
 * Generated from: src/lib/schema/schema.graphql
 * Do NOT edit manually — changes will be overwritten on next codegen run.
 */

export type DeviceStatus = "online" | "offline" | "maintenance" | "decommissioned";

export type FirmwareStatus = "uploaded" | "testing" | "approved" | "deprecated" | "rejected";

export type ApprovalStage = "uploaded" | "testing" | "approved" | "rejected";

export type ServiceOrderStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type ComplianceStatus = "approved" | "pending" | "deprecated" | "non_compliant";

export type VulnerabilitySeverity = "critical" | "high" | "medium" | "low" | "info";

export type AuditAction = "Created" | "Modified" | "Deleted";

export type NotificationType = "info" | "warning" | "error" | "success";

export type RiskLevel = "Critical" | "High" | "Medium" | "Low";

export type SimulationType = "actual" | "simulated";

export type FailureType = "PowerLoss" | "NetworkFailure" | "Overheating" | "FirmwareCrash";

export type VulnerabilityStatus = "open" | "mitigated" | "resolved" | "accepted";

export type ServiceOrderPriority = "low" | "medium" | "high" | "critical";

export type TelemetryHealth = "healthy" | "degraded" | "failed";

export type PipelineState = "Running" | "Stopped" | "Error";

export type AggregationMetric =
  | "devicesByStatus"
  | "deviceCount"
  | "activeDeployments"
  | "pendingApprovals"
  | "avgHealthScore"
  | "complianceByStatus"
  | "deploymentTrend"
  | "topVulnerabilities"
  | "healthScoreDistribution";

export type SearchEntityType =
  | "Device"
  | "Firmware"
  | "ServiceOrder"
  | "Compliance"
  | "Vulnerability";
