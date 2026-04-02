// ---------------------------------------------------------------------------
// Types (Story 15.1 - DigitalTwin, HealthFactors, ConfigDriftItem)
// ---------------------------------------------------------------------------
export interface HealthFactors {
  firmwareAge: number;
  vulnerabilityExposure: number;
  uptimeScore: number;
  telemetryHealth: number;
  complianceScore: number;
  incidentHistory: number;
}

export interface ConfigDriftItem {
  configKey: string;
  expectedValue: string;
  actualValue: string;
  severity: "Critical" | "Warning" | "Info";
  detectedAt: string;
}

export interface DigitalTwin {
  deviceId: string;
  deviceName: string;
  deviceModel: string;
  currentFirmwareVersion: string;
  currentConfigHash: string;
  healthScore: number;
  healthFactors: HealthFactors;
  uptimePercentage: number;
  configDriftStatus: "InSync" | "Drifted" | "Unknown";
  configDriftDetails: ConfigDriftItem[];
  lastSyncedAt: string;
  healthDelta: number;
}

// Story 15.2 types
export interface TwinStateSnapshot {
  id: string;
  timestamp: string;
  firmwareVersion: string;
  configHash: string;
  healthScore: number;
  healthFactors: HealthFactors;
  status: string;
  telemetrySummary: {
    avgTemperature: number;
    avgCpuLoad: number;
    avgErrorRate: number;
  };
  triggeredBy: "scheduled" | "event" | "manual";
  event?: string;
}

// Story 15.3 types
export interface FirmwareSimulationResult {
  id: string;
  deviceId: string;
  currentFirmwareVersion: string;
  targetFirmwareVersion: string;
  compatibilityStatus: "Compatible" | "Incompatible" | "CompatibleWithWarnings";
  warnings: string[];
  predictedHealthScoreChange: number;
  predictedDowntimeMinutes: number;
  rollbackRisk: "Low" | "Medium" | "High";
  newVulnerabilities: { cveId: string; severity: string; component: string }[];
  resolvedVulnerabilities: { cveId: string; severity: string; component: string }[];
  simulatedAt: string;
}

export type HealthBucket = "all" | "critical" | "warning" | "healthy";
export type SortField = "healthScore" | "deviceName" | "lastSyncedAt";
export type TimeRange = "7d" | "30d" | "90d" | "180d";
