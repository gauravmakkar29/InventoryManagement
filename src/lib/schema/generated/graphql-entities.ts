/**
 * IMS Gen 2 — Generated GraphQL Entity & Response Types
 *
 * Generated from: src/lib/schema/schema.graphql
 * Do NOT edit manually — changes will be overwritten on next codegen run.
 */

import type {
  DeviceStatus,
  FirmwareStatus,
  ApprovalStage,
  ServiceOrderStatus,
  ComplianceStatus,
  VulnerabilitySeverity,
  NotificationType,
  RiskLevel,
  SimulationType,
  FailureType,
  VulnerabilityStatus,
  ServiceOrderPriority,
  TelemetryHealth,
  PipelineState,
  AggregationMetric,
  SearchEntityType,
} from "./graphql-enums";

// =============================================================================
// Shared Scalar Types
// =============================================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeoLocation {
  lat: number;
  lon: number;
}

export interface KeyValuePair {
  key: string;
  value: string;
}

// =============================================================================
// Core Entity Types
// =============================================================================

export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  status: DeviceStatus;
  firmwareVersion: string;
  location: string;
  coordinates?: Coordinates | null;
  customerId: string;
  healthScore: number;
  lastSeen: string;
  installedDate: string;
  tags: string[];
  metadata: KeyValuePair[];
}

export interface Firmware {
  id: string;
  version: string;
  name: string;
  status: FirmwareStatus;
  approvalStage: ApprovalStage;
  releaseNotes: string;
  fileSize: number;
  checksum: string;
  uploadedBy: string;
  uploadedAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  compatibleModels: string[];
  targetDeviceCount: number;
  deployedDeviceCount: number;
}

export interface ServiceOrder {
  id: string;
  title: string;
  description: string;
  status: ServiceOrderStatus;
  priority: ServiceOrderPriority;
  assignedTo: string;
  customerId: string;
  deviceId?: string | null;
  scheduledDate: string;
  completedDate?: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string[];
}

export interface Compliance {
  id: string;
  name: string;
  description: string;
  status: ComplianceStatus;
  certificationType: string;
  lastAuditDate: string;
  nextAuditDate: string;
  findings: number;
  criticalFindings: number;
  assignedTo: string;
  documents: string[];
}

export interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  description: string;
  severity: VulnerabilitySeverity;
  cvssScore: number;
  affectedDevices: number;
  patchAvailable: boolean;
  patchFirmwareId?: string | null;
  discoveredAt: string;
  resolvedAt?: string | null;
  status: VulnerabilityStatus;
}

export interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  ipAddress: string;
  timestamp: string;
  status: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  deviceCount: number;
  activeServiceOrders: number;
  complianceScore: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string | null;
  createdAt: string;
}

// =============================================================================
// Telemetry & Environmental Monitoring (Epic 13)
// =============================================================================

export interface TelemetryReading {
  deviceId: string;
  temperature: number;
  cpuLoad: number;
  memoryUsage: number;
  networkLatency: number;
  errorRate: number;
  powerOutput: number;
  ambientTemperature: number;
  humidity: number;
  riskScore: number;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface HeatmapCell {
  geohash: string;
  centerLat: number;
  centerLng: number;
  deviceCount: number;
  avgRiskScore: number;
  maxRiskScore: number;
  criticalCount: number;
  regionName: string;
}

export interface HeatmapAggregation {
  cells: HeatmapCell[];
  totalDevices: number;
}

export interface BlastRadiusDevice {
  id: string;
  name: string;
  distanceKm: number;
  status: DeviceStatus;
  riskScore: number;
  estimatedDowntimeMinutes: number;
}

export interface BlastRadiusResult {
  id: string;
  originDeviceId: string;
  originDeviceName: string;
  radiusKm: number;
  affectedDevices: BlastRadiusDevice[];
  affectedDeviceCount: number;
  estimatedDowntimeMinutes: number;
  riskLevel: RiskLevel;
  simulationType: SimulationType;
  failureType?: FailureType | null;
  severity?: number | null;
  createdBy: string;
  createdAt: string;
}

export interface TelemetryPipelineStatus {
  recordsIngestedLastHour: number;
  health: TelemetryHealth;
  lastSuccessfulIngestion: string;
}

// =============================================================================
// OpenSearch Types (Epic 18)
// =============================================================================

export interface HighlightEntry {
  field: string;
  fragments: string[];
}

export interface GlobalSearchResult {
  id: string;
  entityType: SearchEntityType;
  title: string;
  subtitle: string;
  _score: number;
  _highlights: HighlightEntry[];
}

export interface GlobalSearchResponse {
  total: number;
  results: GlobalSearchResult[];
}

export interface GeoDeviceResult {
  id: string;
  deviceName: string;
  serialNumber: string;
  status: string;
  healthScore: number;
  geoLocation: GeoLocation;
  location: string;
  distanceKm?: number | null;
}

export interface StatusBreakdownEntry {
  status: string;
  count: number;
}

export interface GeoCluster {
  geohash: string;
  docCount: number;
  center: GeoLocation;
  statusBreakdown: StatusBreakdownEntry[];
  avgHealth: number;
}

export interface AggregationResponse {
  metric: AggregationMetric;
  data: string;
}

export interface AggregationBucket {
  key: string;
  docCount: number;
}

export interface AggregationResult {
  name: string;
  buckets: AggregationBucket[];
}

export interface PipelineHealthStatus {
  state: PipelineState;
  recordsSyncedLastHour: number;
  currentLagSeconds: number;
  lastUpdated: string;
}

// =============================================================================
// Paginated / Search Response Wrappers
// =============================================================================

export interface DevicePage {
  items: Device[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface FirmwarePage {
  items: Firmware[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ServiceOrderPage {
  items: ServiceOrder[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CompliancePage {
  items: Compliance[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface VulnerabilityPage {
  items: Vulnerability[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface DeviceSearchResult {
  hits: Device[];
  total: number;
  took: number;
  maxScore: number;
}

export interface VulnerabilitySearchResult {
  hits: Vulnerability[];
  total: number;
  took: number;
  maxScore: number;
}

// =============================================================================
// Dashboard
// =============================================================================

export interface DashboardMetrics {
  totalDevices: number;
  onlineDevices: number;
  activeDeployments: number;
  pendingApprovals: number;
  healthScore: number;
}
