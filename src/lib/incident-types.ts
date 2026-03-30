/**
 * IMS Gen 2 — Epic 14: Incident Response & Quarantine Management
 * Type definitions for incidents, quarantine zones, playbooks, and topology.
 */

// ---------------------------------------------------------------------------
// Severity & Status Enums
// ---------------------------------------------------------------------------
export type IncidentSeverity = "Critical" | "High" | "Medium" | "Low";
export type IncidentStatus = "Open" | "Investigating" | "Contained" | "Resolved" | "Closed";
export type IncidentCategory = "Security" | "Hardware" | "Network" | "Firmware" | "Environmental";
export type IsolationPolicy = "NetworkBlock" | "ReadOnly" | "FirmwareLock";
export type QuarantineZoneStatus = "Active" | "Lifted";
export type PlaybookStatus = "Active" | "Draft" | "Deprecated";
export type PlaybookActionType = "manual" | "automated";
export type AutomatedAction =
  | "isolate_device"
  | "lock_firmware"
  | "notify_team"
  | "create_quarantine";

export type IncidentEventAction =
  | "created"
  | "status_changed"
  | "device_isolated"
  | "device_released"
  | "quarantine_applied"
  | "quarantine_lifted"
  | "playbook_started"
  | "playbook_completed"
  | "note_added"
  | "assigned"
  | "escalated";

// ---------------------------------------------------------------------------
// Incident
// ---------------------------------------------------------------------------
export interface IncidentEvent {
  timestamp: string;
  action: IncidentEventAction;
  performedBy: string;
  performedByName: string;
  fromStatus?: IncidentStatus;
  toStatus?: IncidentStatus;
  note?: string;
  deviceId?: string;
  deviceName?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: IncidentCategory;
  affectedDevices: AffectedDevice[];
  affectedDeviceCount: number;
  originDeviceId: string;
  assignedTo: string;
  assignedToName: string;
  reportedBy: string;
  reportedByName: string;
  quarantineZoneId?: string;
  playbookId?: string;
  playbookProgress?: PlaybookProgress;
  timelineEvents: IncidentEvent[];
  containedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AffectedDevice {
  id: string;
  name: string;
  status: "Online" | "Offline" | "Maintenance" | "Isolated";
  location: string;
  firmwareVersion: string;
  isolatedAt?: string;
  isolationPolicy?: IsolationPolicy;
  riskScore: number;
}

// ---------------------------------------------------------------------------
// Quarantine Zone
// ---------------------------------------------------------------------------
export interface QuarantineZone {
  id: string;
  name: string;
  description: string;
  status: QuarantineZoneStatus;
  isolatedDeviceIds: string[];
  isolatedDeviceCount: number;
  incidentId: string;
  incidentTitle: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  isolationPolicy: IsolationPolicy;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  liftedAt?: string;
  liftedBy?: string;
  liftedByName?: string;
  liftReason?: string;
}

// ---------------------------------------------------------------------------
// Playbook
// ---------------------------------------------------------------------------
export interface PlaybookStep {
  stepNumber: number;
  title: string;
  description: string;
  actionType: PlaybookActionType;
  automatedAction?: AutomatedAction;
  isCompleted: boolean;
  completedBy?: string;
  completedByName?: string;
  completedAt?: string;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  category: IncidentCategory;
  steps: PlaybookStep[];
  stepCount: number;
  estimatedDurationMinutes: number;
  severity: IncidentSeverity;
  status: PlaybookStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaybookProgress {
  playbookId: string;
  playbookName: string;
  totalSteps: number;
  completedSteps: number;
  steps: PlaybookStep[];
}

// ---------------------------------------------------------------------------
// Network Topology
// ---------------------------------------------------------------------------
export interface TopologyNode {
  id: string;
  deviceName: string;
  status: "Online" | "Offline" | "Maintenance" | "Isolated";
  riskScore: number;
  lat: number;
  lng: number;
  firmwareVersion: string;
  location: string;
  isOrigin: boolean;
  isIsolated: boolean;
  quarantineZoneId?: string;
  cx?: number;
  cy?: number;
}

export interface TopologyEdge {
  source: string;
  target: string;
  relationshipType: "same_location" | "same_firmware" | "same_customer" | "geographic_proximity";
  weight: number;
  isLateralPath?: boolean;
}

export interface TopologyGraph {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export interface LateralMovementDevice {
  deviceId: string;
  deviceName: string;
  probability: number;
  primaryRiskFactor: string;
  status: "Online" | "Offline" | "Maintenance" | "Isolated";
}

// ---------------------------------------------------------------------------
// Dashboard Metrics (Story 14.6)
// ---------------------------------------------------------------------------
export interface IncidentMetrics {
  openIncidents: number;
  isolatedDevices: number;
  activeQuarantineZones: number;
  hasCritical: boolean;
  meanTimeToContainHours: number;
  meanTimeToResolveHours: number;
  mttcTrend: number;
  mttrTrend: number;
  bySeverity: { severity: IncidentSeverity; count: number }[];
}

// ---------------------------------------------------------------------------
// Valid status transitions
// ---------------------------------------------------------------------------
export const VALID_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  Open: ["Investigating", "Resolved"],
  Investigating: ["Contained", "Resolved"],
  Contained: ["Investigating", "Resolved"],
  Resolved: ["Open", "Closed"],
  Closed: [],
};

export const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#3b82f6",
};

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  Open: "#ef4444",
  Investigating: "#f97316",
  Contained: "#f59e0b",
  Resolved: "#10b981",
  Closed: "#6b7280",
};
