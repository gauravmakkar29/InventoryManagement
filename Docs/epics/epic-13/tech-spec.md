# Epic 13: Environmental Heatmaps & Blast Radius — Technical Specification

**Epic:** Epic 13 — Environmental Heatmaps & Blast Radius
**Brief Reference:** Section 12 (Planned), Section 9.9 (Geo Queries)
**Status:** Awaiting Approval
**Dependencies:** Epic 9 (Geo), Epic 10 (Location Service), Epic 18 (OpenSearch geo queries)

---

## 1. Overview

This epic introduces telemetry ingestion for devices, heatmap visualization of device health/risk on the geo map, a blast radius engine that calculates impact zones around critical devices, and a risk simulation tool that lets operators model what-if failure scenarios.

---

## 2. Data Models

### 2.1 Telemetry Entity (New)

```typescript
{
  PK: "TELEM#<deviceId>",
  SK: "TELEM#<timestamp>",           // ISO8601 — enables time-range queries
  entityType: "Telemetry",
  deviceId: string,                   // DEV#<uuid> reference
  temperature: number,                // Celsius
  cpuLoad: number,                    // 0-100 percentage
  memoryUsage: number,                // 0-100 percentage
  networkLatency: number,             // milliseconds
  errorRate: number,                  // errors per minute
  powerOutput: number,                // watts (for solar inverters)
  ambientTemperature: number,         // Celsius — environmental
  humidity: number,                   // 0-100 percentage
  riskScore: number,                  // 0-100, computed from telemetry inputs
  lat: number,
  lng: number,
  timestamp: string,                  // ISO8601
  ttl: number,                        // 30-day auto-expiry for raw telemetry
  GSI1PK: "TELEMETRY",
  GSI1SK: "<riskBucket>#<timestamp>", // riskBucket: "critical"|"warning"|"normal"
  GSI4PK: "DEV#<deviceId>",
  GSI4SK: "TELEM#<timestamp>"
}
```

### 2.2 HeatmapSnapshot Entity (New)

Pre-computed heatmap data, aggregated hourly by Lambda.

```typescript
{
  PK: "HEATMAP#<regionId>",
  SK: "HEATMAP#<timestamp>",          // hourly snapshots
  entityType: "HeatmapSnapshot",
  regionId: string,                   // geohash tile ID
  centerLat: number,
  centerLng: number,
  deviceCount: number,
  avgRiskScore: number,
  maxRiskScore: number,
  avgTemperature: number,
  avgCpuLoad: number,
  offlineCount: number,
  criticalCount: number,
  timestamp: string,
  ttl: number,                        // 90-day retention
  GSI1PK: "HEATMAP",
  GSI1SK: "<riskBucket>#<timestamp>"
}
```

### 2.3 BlastRadiusResult Entity (New)

Persisted results of blast radius calculations.

```typescript
{
  PK: "BLAST#<uuid>",
  SK: "BLAST#<uuid>",
  entityType: "BlastRadiusResult",
  originDeviceId: string,             // DEV#<uuid> — the failing device
  radiusKm: number,                   // blast radius in km
  affectedDeviceIds: string[],        // list of DEV#<uuid> within radius
  affectedDeviceCount: number,
  estimatedDowntimeMinutes: number,
  riskLevel: "Critical" | "High" | "Medium" | "Low",
  simulationType: "actual" | "simulated",
  createdBy: string,
  createdAt: string,
  GSI1PK: "BLAST_RADIUS",
  GSI1SK: "<riskLevel>#<createdAt>",
  GSI4PK: "DEV#<originDeviceId>",
  GSI4SK: "BLAST#<uuid>"
}
```

---

## 3. OpenSearch Integration

### 3.1 Geo Queries (from Section 9.9)

All device telemetry with lat/lng is indexed as `geo_point` in OpenSearch. The following query types power this epic:

| Query Type | Use Case | Resolver |
|------------|----------|----------|
| `geohash_grid` aggregation | Aggregate device risk by geographic tile for heatmaps | `getHeatmapAggregation.js` |
| `geo_centroid` aggregation | Find center point of device clusters | `getHeatmapAggregation.js` |
| `geo_distance` | Find all devices within N km of a point (blast radius) | `getBlastRadius.js` |
| `geo_bounding_box` | Devices within the current map viewport | `getDevicesInViewport.js` |

### 3.2 Heatmap Aggregation Resolver

```javascript
// getHeatmapAggregation.js
export function request(ctx) {
  const { bounds, precision, riskThreshold } = ctx.args;
  return {
    version: "2018-05-29",
    method: "POST",
    params: {
      headers: { "Content-Type": "application/json" },
      body: {
        size: 0,
        query: {
          bool: {
            must: [
              { term: { "entityType.keyword": "Device" } },
              ...(riskThreshold ? [{ range: { healthScore: { lte: riskThreshold } } }] : [])
            ],
            filter: bounds ? [{
              geo_bounding_box: {
                location: {
                  top_left: { lat: bounds.northLat, lon: bounds.westLng },
                  bottom_right: { lat: bounds.southLat, lon: bounds.eastLng }
                }
              }
            }] : []
          }
        },
        aggs: {
          grid: {
            geohash_grid: { field: "location", precision: precision || 5 },
            aggs: {
              center: { geo_centroid: { field: "location" } },
              avgRisk: { avg: { field: "healthScore" } },
              criticalCount: {
                filter: { range: { healthScore: { lte: 30 } } }
              }
            }
          }
        }
      }
    },
    resourcePath: "/ims-data/_search"
  };
}
```

### 3.3 Blast Radius Resolver

```javascript
// getBlastRadius.js
export function request(ctx) {
  const { lat, lng, radiusKm, includeOffline } = ctx.args;
  return {
    version: "2018-05-29",
    method: "POST",
    params: {
      headers: { "Content-Type": "application/json" },
      body: {
        size: 500,
        query: {
          bool: {
            must: [
              { term: { "entityType.keyword": "Device" } },
              { geo_distance: { distance: `${radiusKm}km`, location: { lat, lon: lng } } }
            ],
            ...(includeOffline ? {} : { must_not: [{ term: { "status.keyword": "Offline" } }] })
          }
        },
        sort: [{ _geo_distance: { location: { lat, lon: lng }, order: "asc", unit: "km" } }]
      }
    },
    resourcePath: "/ims-data/_search"
  };
}
```

---

## 4. AppSync API Additions

### 4.1 New Queries

| Query | Arguments | Returns | Data Source |
|-------|-----------|---------|-------------|
| `getHeatmapAggregation(bounds?, precision?, riskThreshold?)` | Map viewport bounds, geohash precision (1-12), risk filter | `HeatmapAggregation` | OpenSearch |
| `getBlastRadius(lat, lng, radiusKm, includeOffline?)` | Center point, radius, filter | `BlastRadiusResult` | OpenSearch |
| `getDeviceTelemetry(deviceId, startDate, endDate)` | Device ID, time range | `[Telemetry]` | DynamoDB (GSI4) |
| `getBlastRadiusHistory(deviceId?)` | Optional device filter | `[BlastRadiusResult]` | DynamoDB (GSI1) |

### 4.2 New Mutations

| Mutation | Arguments | Description |
|----------|-----------|-------------|
| `ingestTelemetry(deviceId, metrics)` | Device ID + metric payload | Writes telemetry record, computes riskScore |
| `runBlastRadiusSimulation(deviceId, radiusKm, failureType)` | Simulation params | Calculates and persists blast radius result |

### 4.3 GraphQL Schema Additions

```graphql
type Telemetry {
  deviceId: ID!
  temperature: Float
  cpuLoad: Float
  memoryUsage: Float
  networkLatency: Float
  errorRate: Float
  powerOutput: Float
  riskScore: Float!
  lat: Float
  lng: Float
  timestamp: AWSDateTime!
}

type HeatmapCell {
  geohash: String!
  centerLat: Float!
  centerLng: Float!
  deviceCount: Int!
  avgRiskScore: Float!
  criticalCount: Int!
}

type HeatmapAggregation {
  cells: [HeatmapCell!]!
  totalDevices: Int!
  viewport: Bounds
}

type BlastRadiusResult {
  id: ID!
  originDeviceId: ID!
  radiusKm: Float!
  affectedDevices: [Device!]!
  affectedDeviceCount: Int!
  estimatedDowntimeMinutes: Int
  riskLevel: RiskLevel!
  simulationType: SimulationType!
  createdAt: AWSDateTime!
}

enum RiskLevel { Critical High Medium Low }
enum SimulationType { actual simulated }

input BoundsInput {
  northLat: Float!
  southLat: Float!
  eastLng: Float!
  westLng: Float!
}
```

---

## 5. Frontend Component Hierarchy

```
src/app/components/
  heatmap/
    HeatmapPage.tsx                   # Main page wrapper with controls
    HeatmapMap.tsx                    # Map with heatmap overlay layer
    HeatmapLegend.tsx                 # Color scale legend (green-yellow-red)
    HeatmapControls.tsx               # Precision slider, risk threshold, time range
    HeatmapTooltip.tsx                # Hover tooltip on heatmap cell
  blast-radius/
    BlastRadiusPanel.tsx              # Side panel for blast radius controls
    BlastRadiusOverlay.tsx            # Circle overlay on map showing radius
    BlastRadiusDeviceList.tsx         # List of affected devices within radius
    BlastRadiusSummary.tsx            # Impact summary card (count, downtime, risk)
  risk-simulation/
    RiskSimulationDialog.tsx          # Modal for running what-if simulations
    SimulationParameterForm.tsx       # Failure type, radius, severity inputs
    SimulationResultsPanel.tsx        # Results display with affected device grid
    SimulationHistory.tsx             # Past simulation results table
  telemetry/
    TelemetryIngestStatus.tsx         # Status indicator for telemetry pipeline
    DeviceTelemetryChart.tsx          # Time-series chart for individual device metrics
```

---

## 6. Heatmap Color Scale

| Risk Score Range | Color | Label |
|-----------------|-------|-------|
| 0-30 | Red (#ef4444) | Critical |
| 31-50 | Orange (#f97316) | High Risk |
| 51-70 | Amber (#f59e0b) | Moderate |
| 71-85 | Light Green (#84cc16) | Low Risk |
| 86-100 | Green (#10b981) | Healthy |

Opacity varies by device density: more devices in a cell = higher opacity (0.3 to 0.9).

---

## 7. Risk Score Computation

The `riskScore` is computed from telemetry inputs using a weighted formula:

```typescript
function computeRiskScore(metrics: TelemetryInput): number {
  const weights = {
    temperature: 0.20,    // normalized: (value - 20) / 80, clamped 0-1
    cpuLoad: 0.15,        // value / 100
    memoryUsage: 0.10,    // value / 100
    errorRate: 0.25,      // min(value / 10, 1)
    networkLatency: 0.10, // min(value / 1000, 1)
    powerOutput: 0.20,    // deviation from expected, normalized
  };
  // riskScore = 100 - weighted_sum * 100 (higher = healthier)
}
```

---

## 8. Lambda: Telemetry Aggregator

A scheduled Lambda (every 60 minutes) that:
1. Queries recent telemetry from DynamoDB (last hour, via GSI4)
2. Groups by geohash region
3. Computes averages (riskScore, temperature, cpuLoad)
4. Writes HeatmapSnapshot records for each region
5. Prunes snapshots older than 90 days (TTL handles this)

| Setting | Value |
|---------|-------|
| Runtime | Node.js 20.x |
| Schedule | EventBridge rule, every 60 min |
| Timeout | 120 seconds |
| Memory | 512 MB |
