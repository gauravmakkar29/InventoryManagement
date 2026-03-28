# Epic 14: Incident Isolation & Lateral Movement — Technical Specification

**Epic:** Epic 14 — Incident Isolation & Lateral Movement
**Brief Reference:** Section 12 (Planned), Section 9.9 (Geo Queries for lateral movement radius)
**Status:** Awaiting Approval
**Dependencies:** Epic 11 (Firmware Security), Epic 12 (SBOM), Epic 13 (Heatmaps/Blast Radius)

---

## 1. Overview

This epic introduces a full incident lifecycle management system: incident creation, device isolation/quarantine, network topology visualization showing lateral movement paths, quarantine zone management, and runbook/playbook execution for standardized incident response.

---

## 2. Data Models

### 2.1 Incident Entity (New)

```typescript
{
  PK: "INC#<uuid>",
  SK: "INC#<uuid>",
  entityType: "Incident",
  title: string,
  description: string,
  severity: "Critical" | "High" | "Medium" | "Low",
  status: "Open" | "Investigating" | "Contained" | "Resolved" | "Closed",
  category: "Security" | "Hardware" | "Network" | "Firmware" | "Environmental",
  affectedDeviceIds: string[],         // DEV#<uuid> references
  affectedDeviceCount: number,
  originDeviceId: string,              // DEV#<uuid> — initial source
  assignedTo: string,                  // USER#<uuid>
  reportedBy: string,                  // USER#<uuid>
  quarantineZoneId: string,            // QZ#<uuid> reference (if quarantine applied)
  playbookId: string,                  // PB#<uuid> reference (if playbook assigned)
  timelineEvents: IncidentEvent[],     // embedded array of status changes
  containedAt: string,                 // ISO8601
  resolvedAt: string,                  // ISO8601
  createdAt: string,                   // ISO8601
  updatedAt: string,                   // ISO8601
  ttl: number,                         // 365-day retention for resolved incidents
  GSI1PK: "INCIDENT",
  GSI1SK: "<status>#<createdAt>",
  GSI2PK: "INCIDENT",
  GSI2SK: "<createdAt>",
  GSI3PK: "<severity>",
  GSI3SK: "INC#<uuid>",
  GSI4PK: "USER#<assignedTo>",
  GSI4SK: "INC#<uuid>"
}
```

### 2.2 IncidentEvent (Embedded in Incident timeline)

```typescript
interface IncidentEvent {
  timestamp: string;                   // ISO8601
  action: "created" | "status_changed" | "device_isolated" | "device_released" |
          "quarantine_applied" | "quarantine_lifted" | "playbook_started" |
          "playbook_completed" | "note_added" | "assigned" | "escalated";
  performedBy: string;                 // USER#<uuid>
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  deviceId?: string;                   // for device-specific events
}
```

### 2.3 QuarantineZone Entity (New)

```typescript
{
  PK: "QZ#<uuid>",
  SK: "QZ#<uuid>",
  entityType: "QuarantineZone",
  name: string,                        // e.g., "Sydney West Quarantine"
  description: string,
  status: "Active" | "Lifted",
  isolatedDeviceIds: string[],         // DEV#<uuid> references
  isolatedDeviceCount: number,
  incidentId: string,                  // INC#<uuid> reference
  centerLat: number,
  centerLng: number,
  radiusKm: number,                    // geographic quarantine boundary
  isolationPolicy: "NetworkBlock" | "ReadOnly" | "FirmwareLock",
  createdBy: string,
  createdAt: string,
  liftedAt: string,
  liftedBy: string,
  GSI1PK: "QUARANTINE_ZONE",
  GSI1SK: "<status>#<createdAt>",
  GSI4PK: "INC#<incidentId>",
  GSI4SK: "QZ#<uuid>"
}
```

### 2.4 Playbook Entity (New)

```typescript
{
  PK: "PB#<uuid>",
  SK: "PB#<uuid>",
  entityType: "Playbook",
  name: string,                        // e.g., "Critical Firmware Vulnerability Response"
  description: string,
  category: "Security" | "Hardware" | "Network" | "Firmware" | "Environmental",
  steps: PlaybookStep[],               // ordered list of steps
  estimatedDurationMinutes: number,
  severity: "Critical" | "High" | "Medium" | "Low",  // recommended severity match
  status: "Active" | "Draft" | "Deprecated",
  createdBy: string,
  createdAt: string,
  updatedAt: string,
  GSI1PK: "PLAYBOOK",
  GSI1SK: "<status>#<createdAt>",
  GSI3PK: "<category>",
  GSI3SK: "PB#<uuid>"
}
```

### 2.5 PlaybookStep (Embedded)

```typescript
interface PlaybookStep {
  stepNumber: number;
  title: string;
  description: string;
  actionType: "manual" | "automated";  // manual = human action, automated = system action
  automatedAction?: "isolate_device" | "lock_firmware" | "notify_team" | "create_quarantine";
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
}
```

---

## 3. Network Topology Graph

### 3.1 Data Structure

The network topology is derived from device relationships (same location, same customer, same firmware version, geographic proximity). It is not a separate entity but computed on-the-fly.

```typescript
interface TopologyNode {
  id: string;                          // DEV#<uuid>
  deviceName: string;
  status: "Online" | "Offline" | "Maintenance" | "Isolated";
  riskScore: number;
  lat: number;
  lng: number;
  isIsolated: boolean;
  quarantineZoneId?: string;
}

interface TopologyEdge {
  source: string;                      // DEV#<uuid>
  target: string;                      // DEV#<uuid>
  relationshipType: "same_location" | "same_firmware" | "same_customer" | "geographic_proximity";
  weight: number;                      // 0-1, strength of relationship
}

interface TopologyGraph {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  clusters: TopologyCluster[];         // auto-detected groupings
}
```

### 3.2 Lateral Movement Calculation

Uses OpenSearch `geo_distance` to find devices within proximity, then scores lateral movement risk:

```typescript
function calculateLateralMovementRisk(originDevice: Device, nearbyDevices: Device[]): LateralMovementResult {
  // Factors:
  // 1. Same firmware version = high lateral risk (shared vulnerability)
  // 2. Same location = high lateral risk (shared environment)
  // 3. Geographic proximity < 1km = medium lateral risk
  // 4. Same customer = elevated risk (shared network segment assumed)
  // Result: list of devices sorted by lateral movement probability
}
```

---

## 4. AppSync API Additions

### 4.1 New Queries

| Query | Arguments | Returns | Data Source |
|-------|-----------|---------|-------------|
| `getIncident(id)` | Incident ID | `Incident` | DynamoDB (Primary) |
| `listIncidents(status?, severity?, limit?, nextToken?)` | Filters | `[Incident]` | DynamoDB (GSI1) |
| `listIncidentsByDate(startDate, endDate)` | Date range | `[Incident]` | DynamoDB (GSI2) |
| `getIncidentsByAssignee(userId)` | User ID | `[Incident]` | DynamoDB (GSI4) |
| `getQuarantineZone(id)` | Zone ID | `QuarantineZone` | DynamoDB (Primary) |
| `listQuarantineZones(status?)` | Optional status filter | `[QuarantineZone]` | DynamoDB (GSI1) |
| `getPlaybook(id)` | Playbook ID | `Playbook` | DynamoDB (Primary) |
| `listPlaybooks(category?, status?)` | Filters | `[Playbook]` | DynamoDB (GSI1) |
| `getNetworkTopology(centerDeviceId, radiusKm?)` | Device + radius | `TopologyGraph` | OpenSearch + DynamoDB |
| `getLateralMovementRisk(deviceId)` | Device ID | `LateralMovementResult` | OpenSearch |

### 4.2 New Mutations

| Mutation | Arguments | Authorization |
|----------|-----------|---------------|
| `createIncident(input)` | Title, description, severity, category, affected devices | Admin, Manager |
| `updateIncidentStatus(id, newStatus, note?)` | Status transition with optional note | Admin, Manager |
| `assignIncident(id, assigneeId)` | Assign to user | Admin, Manager |
| `isolateDevice(deviceId, incidentId, policy)` | Isolation action | Admin only |
| `releaseDevice(deviceId, incidentId)` | Release from isolation | Admin only |
| `createQuarantineZone(input)` | Zone params + device list | Admin only |
| `liftQuarantineZone(zoneId)` | Lift quarantine | Admin only |
| `createPlaybook(input)` | Playbook definition | Admin, Manager |
| `executePlaybookStep(incidentId, playbookId, stepNumber)` | Mark step complete | Admin, Manager |

---

## 5. Frontend Component Hierarchy

```
src/app/components/
  incidents/
    IncidentListPage.tsx               # Main incidents page with filters
    IncidentCard.tsx                    # Summary card in list view
    IncidentDetailPanel.tsx            # Full incident detail with timeline
    IncidentTimeline.tsx               # Vertical timeline of events
    IncidentCreateDialog.tsx           # Create new incident modal
    IncidentStatusBadge.tsx            # Color-coded status badge
    IncidentSeverityBadge.tsx          # Severity indicator
  isolation/
    DeviceIsolationDialog.tsx          # Confirm isolation modal
    DeviceIsolationBanner.tsx          # Banner on isolated device detail
    IsolatedDevicesList.tsx            # Table of currently isolated devices
  quarantine/
    QuarantineZonePanel.tsx            # Zone management side panel
    QuarantineZoneMap.tsx              # Map overlay showing quarantine boundaries
    QuarantineDeviceList.tsx           # Devices within a quarantine zone
    CreateQuarantineDialog.tsx         # Create zone modal with map selection
  topology/
    NetworkTopologyGraph.tsx           # Force-directed graph visualization
    TopologyNode.tsx                   # Individual node in graph
    TopologyEdge.tsx                   # Edge line with relationship label
    TopologyLegend.tsx                 # Legend for node/edge colors
    LateralMovementPanel.tsx           # Panel showing movement risk analysis
  playbooks/
    PlaybookList.tsx                   # Available playbooks list
    PlaybookDetail.tsx                 # Playbook steps view
    PlaybookExecutor.tsx               # Step-by-step execution tracker
    PlaybookCreateDialog.tsx           # Create/edit playbook modal
```

---

## 6. Incident Status State Machine

```
Open → Investigating → Contained → Resolved → Closed
  │         │              │           │
  │         │              │           └── Can reopen → Open
  │         │              └── Can escalate → Investigating
  │         └── Can contain directly → Contained
  └── Can resolve directly (false alarm) → Resolved
```

Valid transitions enforced at the resolver level.

---

## 7. Device Isolation Mechanism

When a device is isolated:
1. Device `status` field updated to `"Isolated"` (new status value)
2. Device `GSI1SK` recomputed as `"Isolated#<timestamp>"`
3. Incident timeline event recorded: `"device_isolated"`
4. Notification sent to Admin and assigned Manager
5. Device appears with a distinct visual marker (lock icon overlay) on all map views

When released:
1. Device `status` reverted to previous status (stored in isolation record)
2. Incident timeline event: `"device_released"`
3. Lock icon removed from map views

---

## 8. Network Topology Graph Rendering

Uses a force-directed graph layout (D3.js force simulation or react-force-graph):
- **Nodes**: Circles colored by status (green=online, red=critical, gray=offline, orange=isolated)
- **Edges**: Lines colored by relationship type, thickness by weight
- **Layout**: Force simulation with collision detection, centered on the origin device
- **Interaction**: Click node to see device details, hover edge to see relationship type
- **Highlight**: When viewing lateral movement, affected path edges glow red with animated pulse
