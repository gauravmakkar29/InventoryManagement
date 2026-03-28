# Epic 15: Digital Twin — Technical Specification

**Epic:** Epic 15 — Digital Twin
**Brief Reference:** Section 12 (Planned)
**Status:** Awaiting Approval
**Dependencies:** Epic 11 (Firmware Security), Epic 12 (SBOM), Epic 13 (Heatmaps — telemetry data), Epic 14 (Incidents)

---

## 1. Overview

This epic introduces a digital twin representation for each device in the fleet. A digital twin is a virtual replica that mirrors the real device's state, firmware, configuration, and health history. It enables health scoring, firmware upgrade simulation ("what would happen if I upgrade this device?"), configuration drift analysis, and historical state replay for root cause investigation.

---

## 2. Data Models

### 2.1 DigitalTwin Entity (New)

One-to-one relationship with Device. The twin persists derived/computed state that goes beyond raw device fields.

```typescript
{
  PK: "TWIN#<deviceId>",
  SK: "TWIN#<deviceId>",
  entityType: "DigitalTwin",
  deviceId: string,                    // DEV#<uuid> reference
  deviceName: string,                  // denormalized for display
  deviceModel: string,                 // denormalized
  currentFirmwareVersion: string,
  currentConfigHash: string,           // SHA-256 of current config
  healthScore: number,                 // 0-100, composite score
  healthFactors: HealthFactors,        // breakdown of score components
  predictedFailureDate: string,        // ISO8601, ML-based estimate (nullable)
  uptimePercentage: number,            // last 30 days
  lastIncidentId: string,              // most recent INC#<uuid>
  firmwareCompatibility: FirmwareCompatibility[], // list of compatible FW versions
  configDriftStatus: "InSync" | "Drifted" | "Unknown",
  configDriftDetails: ConfigDriftItem[],
  lastSyncedAt: string,               // ISO8601, when twin was last updated from device
  createdAt: string,
  updatedAt: string,
  GSI1PK: "DIGITAL_TWIN",
  GSI1SK: "<healthBucket>#<updatedAt>", // healthBucket: "critical"|"warning"|"healthy"
  GSI3PK: "<deviceModel>",
  GSI3SK: "TWIN#<deviceId>",
  GSI4PK: "DEV#<deviceId>",
  GSI4SK: "TWIN#<deviceId>"
}
```

### 2.2 HealthFactors (Embedded)

```typescript
interface HealthFactors {
  firmwareAge: number;                 // 0-100, newer = higher
  vulnerabilityExposure: number;       // 0-100, fewer vulns = higher
  uptimeScore: number;                 // 0-100, more uptime = higher
  telemetryHealth: number;             // 0-100, from latest telemetry
  complianceScore: number;             // 0-100, more certifications = higher
  incidentHistory: number;             // 0-100, fewer recent incidents = higher
}
```

### 2.3 TwinStateSnapshot Entity (New)

Point-in-time snapshots for state replay.

```typescript
{
  PK: "TWINSNAP#<deviceId>",
  SK: "TWINSNAP#<timestamp>",         // ISO8601 — enables time-range replay
  entityType: "TwinStateSnapshot",
  deviceId: string,
  firmwareVersion: string,
  configHash: string,
  healthScore: number,
  healthFactors: HealthFactors,
  status: string,                      // device status at snapshot time
  telemetrySummary: {                  // aggregated metrics at snapshot time
    avgTemperature: number,
    avgCpuLoad: number,
    avgErrorRate: number,
  },
  triggeredBy: "scheduled" | "event" | "manual",
  timestamp: string,
  ttl: number,                         // 180-day retention
  GSI4PK: "DEV#<deviceId>",
  GSI4SK: "TWINSNAP#<timestamp>"
}
```

### 2.4 FirmwareSimulationResult Entity (New)

```typescript
{
  PK: "FWSIM#<uuid>",
  SK: "FWSIM#<uuid>",
  entityType: "FirmwareSimulationResult",
  deviceId: string,
  currentFirmwareVersion: string,
  targetFirmwareVersion: string,
  compatibilityStatus: "Compatible" | "Incompatible" | "CompatibleWithWarnings",
  warnings: string[],                  // e.g., ["Config key X deprecated in target version"]
  predictedHealthScoreChange: number,  // delta (e.g., +12 or -5)
  predictedDowntimeMinutes: number,
  rollbackRisk: "Low" | "Medium" | "High",
  newVulnerabilities: string[],        // CVEs introduced by target firmware
  resolvedVulnerabilities: string[],   // CVEs fixed by target firmware
  simulatedBy: string,
  simulatedAt: string,
  GSI1PK: "FW_SIMULATION",
  GSI1SK: "<compatibilityStatus>#<simulatedAt>",
  GSI4PK: "DEV#<deviceId>",
  GSI4SK: "FWSIM#<uuid>"
}
```

### 2.5 ConfigDriftItem (Embedded in DigitalTwin)

```typescript
interface ConfigDriftItem {
  configKey: string;                   // e.g., "network.dns.primary"
  expectedValue: string;               // from golden config template
  actualValue: string;                 // from device
  severity: "Critical" | "Warning" | "Info";
  detectedAt: string;                  // ISO8601
}
```

---

## 3. Health Score Computation

The composite health score is computed from 6 weighted factors:

```typescript
function computeHealthScore(factors: HealthFactors): number {
  const weights = {
    firmwareAge: 0.15,
    vulnerabilityExposure: 0.25,
    uptimeScore: 0.15,
    telemetryHealth: 0.20,
    complianceScore: 0.10,
    incidentHistory: 0.15,
  };

  return Math.round(
    Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + factors[key] * weight, 0
    )
  );
}

// Health buckets for GSI1SK:
// 0-40: "critical"
// 41-70: "warning"
// 71-100: "healthy"
```

---

## 4. AppSync API Additions

### 4.1 New Queries

| Query | Arguments | Returns | Data Source |
|-------|-----------|---------|-------------|
| `getDigitalTwin(deviceId)` | Device ID | `DigitalTwin` | DynamoDB (GSI4) |
| `listDigitalTwins(healthBucket?, model?, limit?, nextToken?)` | Filters | `[DigitalTwin]` | DynamoDB (GSI1, GSI3) |
| `getTwinStateHistory(deviceId, startDate, endDate)` | Device ID + range | `[TwinStateSnapshot]` | DynamoDB (GSI4) |
| `simulateFirmwareUpgrade(deviceId, targetFirmwareId)` | Device + target FW | `FirmwareSimulationResult` | Lambda (compute) |
| `getConfigDrift(deviceId)` | Device ID | `ConfigDriftResult` | DynamoDB (from twin) |
| `getFirmwareSimulationHistory(deviceId?)` | Optional device filter | `[FirmwareSimulationResult]` | DynamoDB (GSI4) |

### 4.2 New Mutations

| Mutation | Arguments | Authorization |
|----------|-----------|---------------|
| `syncDigitalTwin(deviceId)` | Force-sync twin from device data | Admin, Manager |
| `runFirmwareSimulation(deviceId, targetFirmwareId)` | Run firmware upgrade simulation | Admin, Manager |
| `createTwinSnapshot(deviceId, reason?)` | Manual snapshot creation | Admin, Manager |
| `updateGoldenConfig(deviceModel, config)` | Update baseline config template | Admin only |

---

## 5. Frontend Component Hierarchy

```
src/app/components/
  digital-twin/
    TwinDashboard.tsx                  # Main twin overview page
    TwinCard.tsx                       # Summary card for a device's twin
    TwinDetailPanel.tsx                # Full twin detail with tabs
    HealthScoreGauge.tsx               # Circular gauge (0-100) with color
    HealthFactorsBreakdown.tsx         # Bar chart of 6 health factor scores
    HealthScoreTrend.tsx               # Line chart of health score over time
  firmware-simulation/
    FirmwareSimulationDialog.tsx       # Modal to configure and run simulation
    SimulationResultPanel.tsx          # Results display with compatibility details
    SimulationComparisonView.tsx       # Side-by-side current vs. target state
    VulnerabilityDelta.tsx             # Shows CVEs added/resolved by upgrade
  config-analysis/
    ConfigDriftPanel.tsx               # Table of drifted config items
    ConfigDiffViewer.tsx               # Side-by-side expected vs. actual values
    GoldenConfigEditor.tsx             # Admin editor for baseline config template
  state-replay/
    StateReplayTimeline.tsx            # Horizontal timeline with snapshot markers
    StateReplayPlayer.tsx              # Playback controls (play/pause/step)
    StateSnapshotCard.tsx              # Point-in-time state display
    StateComparisonView.tsx            # Compare two snapshots side-by-side
```

---

## 6. Twin Sync Lambda

A scheduled Lambda that updates all digital twins:

| Setting | Value |
|---------|-------|
| Runtime | Node.js 20.x |
| Schedule | EventBridge rule, every 15 minutes |
| Timeout | 300 seconds |
| Memory | 1024 MB |

Logic:
1. Scan all devices (paginated, 100 per batch)
2. For each device, gather: latest telemetry, firmware info, compliance status, incident history, uptime stats
3. Compute health factors and composite health score
4. Update DigitalTwin entity with new values
5. If health score changed by > 10 points, create a TwinStateSnapshot
6. Hourly: create scheduled snapshots for all devices

---

## 7. Firmware Simulation Engine

The simulation is handled by a Lambda function (not a simple resolver) because it requires:
1. Fetching current device state, firmware metadata, SBOM data, and compliance records
2. Cross-referencing target firmware vulnerabilities
3. Computing predicted health score delta
4. Evaluating config compatibility

```typescript
// Lambda: firmwareSimulationEngine
async function handler(event) {
  const { deviceId, targetFirmwareId } = event.arguments;

  // 1. Get current device + twin state
  const device = await getDevice(deviceId);
  const twin = await getDigitalTwin(deviceId);
  const currentFW = await getFirmware(device.firmwareVersion);
  const targetFW = await getFirmware(targetFirmwareId);

  // 2. Check compatibility (device model must match)
  if (targetFW.deviceModel !== device.deviceModel) {
    return { compatibilityStatus: "Incompatible", warnings: ["Device model mismatch"] };
  }

  // 3. Compare vulnerabilities
  const currentVulns = await getVulnerabilitiesByFirmware(currentFW.id);
  const targetVulns = await getVulnerabilitiesByFirmware(targetFW.id);
  const resolved = currentVulns.filter(v => !targetVulns.includes(v));
  const introduced = targetVulns.filter(v => !currentVulns.includes(v));

  // 4. Compute predicted health delta
  const predictedHealthDelta = computeHealthDelta(twin, resolved, introduced);

  // 5. Persist result
  return persistSimulationResult({ ... });
}
```

---

## 8. State Replay Mechanism

State replay allows operators to "rewind" a device to see its state at any point in the past 180 days:

1. Query `TwinStateSnapshot` records for a device within a time range (GSI4)
2. Display snapshots on a horizontal timeline (markers at each snapshot)
3. Click a snapshot to view the full state at that time
4. Use playback controls to step through snapshots chronologically
5. Compare any two snapshots side-by-side (diff view) highlighting changes
