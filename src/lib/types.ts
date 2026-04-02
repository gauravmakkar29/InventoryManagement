// =============================================================================
// IMS Gen 2 — Core Type Definitions (Section 4.4)
// =============================================================================

// --- Status Enums ---

export enum DeviceStatus {
  Online = "online",
  Offline = "offline",
  Maintenance = "maintenance",
  Decommissioned = "decommissioned",
}

export enum FirmwareStatus {
  Uploaded = "uploaded",
  Testing = "testing",
  Approved = "approved",
  Deprecated = "deprecated",
  Rejected = "rejected",
}

export enum ApprovalStage {
  Uploaded = "uploaded",
  Testing = "testing",
  Approved = "approved",
  Rejected = "rejected",
}

export enum ServiceOrderStatus {
  Scheduled = "scheduled",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum ComplianceStatus {
  Approved = "approved",
  Pending = "pending",
  Deprecated = "deprecated",
  NonCompliant = "non_compliant",
}

export enum VulnerabilitySeverity {
  Critical = "critical",
  High = "high",
  Medium = "medium",
  Low = "low",
  Info = "info",
}

export enum AuditAction {
  Created = "Created",
  Modified = "Modified",
  Deleted = "Deleted",
}

export enum NotificationType {
  Info = "info",
  Warning = "warning",
  Error = "error",
  Success = "success",
}

// --- Entity Interfaces ---

export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  status: DeviceStatus;
  firmwareVersion: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  customerId: string;
  healthScore: number; // 0-100
  lastSeen: string; // ISO date
  installedDate: string; // ISO date
  tags: string[];
  metadata: Record<string, string>;
  _schemaVersion?: number;
}

export interface Firmware {
  id: string;
  version: string;
  name: string;
  status: FirmwareStatus;
  approvalStage: ApprovalStage;
  releaseNotes: string;
  fileSize: number; // bytes
  checksum: string;
  uploadedBy: string;
  uploadedAt: string; // ISO date
  approvedBy?: string;
  approvedAt?: string; // ISO date
  compatibleModels: string[];
  targetDeviceCount: number;
  deployedDeviceCount: number;
  _schemaVersion?: number;
}

export interface ServiceOrder {
  id: string;
  title: string;
  description: string;
  status: ServiceOrderStatus;
  priority: "low" | "medium" | "high" | "critical";
  assignedTo: string;
  customerId: string;
  deviceId?: string;
  scheduledDate: string; // ISO date
  completedDate?: string; // ISO date
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  notes: string[];
  _schemaVersion?: number;
}

export interface Compliance {
  id: string;
  name: string;
  description: string;
  status: ComplianceStatus;
  certificationType: string; // e.g., "NIST 800-53", "IEC 62443"
  lastAuditDate: string; // ISO date
  nextAuditDate: string; // ISO date
  findings: number;
  criticalFindings: number;
  assignedTo: string;
  documents: string[];
  _schemaVersion?: number;
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
  patchFirmwareId?: string;
  discoveredAt: string; // ISO date
  resolvedAt?: string; // ISO date
  status: "open" | "mitigated" | "resolved" | "accepted";
  _schemaVersion?: number;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  userId: string;
  ipAddress: string;
  timestamp: string; // ISO date
  status: "Success";
  _schemaVersion?: number;
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
  complianceScore: number; // 0-100
  createdAt: string; // ISO date
}

export interface User {
  id: string;
  email: string;
  name: string;
  groups: string[];
  customerId?: string;
  lastLogin: string; // ISO date
  isActive: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string; // ISO date
}

// --- Telemetry & Environmental Monitoring (Epic 13) ---

export enum RiskLevel {
  Critical = "Critical",
  High = "High",
  Medium = "Medium",
  Low = "Low",
}

export enum SimulationType {
  Actual = "actual",
  Simulated = "simulated",
}

export enum FailureType {
  PowerLoss = "Power Loss",
  NetworkFailure = "Network Failure",
  Overheating = "Overheating",
  FirmwareCrash = "Firmware Crash",
}

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
  failureType?: FailureType;
  severity?: number;
  createdBy: string;
  createdAt: string;
}

export interface TelemetryPipelineStatus {
  recordsIngestedLastHour: number;
  health: "healthy" | "degraded" | "failed";
  lastSuccessfulIngestion: string;
}

// --- Search & Aggregation (OpenSearch) ---

export interface SearchResult<T> {
  hits: T[];
  total: number;
  took: number; // ms
  maxScore: number;
}

export interface AggregationBucket {
  key: string;
  docCount: number;
}

export interface AggregationResult {
  name: string;
  buckets: AggregationBucket[];
}

// --- API Types ---

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

// --- Auth ---

export interface AuthState {
  user: User | null;
  email: string | null;
  groups: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  customerId: string | null;
  signInError: string | null;
  mfaRequired: boolean;
  mfaEnabled: boolean;
  /** True when session is about to expire (T-2 min). Show a warning modal. */
  sessionExpiring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  setupMfa: () => Promise<string>;
  confirmMfaSetup: (code: string) => Promise<void>;
  signOut: () => void;
  /** Extend the current session (dismisses the expiry warning). */
  extendSession: () => Promise<void>;
}
