# Epic 3: Inventory & Device Management — Technical Specification

**Epic:** Epic 3 — Inventory & Device Management
**Brief Reference:** FR-1, Section 10.2 Inventory (3 tabs: Hardware table, Firmware status, Geo location map)

---

## 1. Overview

This epic implements the Inventory page with three tabs: Hardware Inventory (searchable data table), Firmware Status (device firmware grid), and Geo Location (interactive world map). It covers device listing, filtering, pagination, CSV export, and geographic visualization.

---

## 2. Data Models

### 2.1 Device Entity

```typescript
{
  PK: "DEV#<uuid>",
  SK: "DEV#<uuid>",
  entityType: "Device",
  deviceName: string,
  serialNumber: string,
  deviceModel: string,
  firmwareVersion: string,
  status: "Online" | "Offline" | "Maintenance",
  location: string,
  lat: number,
  lng: number,
  customerId: string,
  healthScore: number,         // 0-100
  lastSeen: string,            // ISO8601
  GSI1PK: "DEVICE",
  GSI1SK: "<status>#<timestamp>",
  GSI3PK: "<location>",
  GSI3SK: "DEV#<uuid>",
  GSI4PK: "FW#<firmwareId>",
  GSI4SK: "DEV#<uuid>"
}
```

### 2.2 Firmware Entity (for Firmware Status tab)

```typescript
{
  PK: "FW#<uuid>",
  SK: "FW#<uuid>",
  entityType: "Firmware",
  name: string,
  version: string,
  deviceModel: string,
  status: "Active" | "Deprecated" | "Pending",
  approvalStage: "Uploaded" | "Testing" | "Approved",
  // ... (full definition in Epic 4 tech spec)
}
```

### 2.3 GSI Access Patterns

| GSI | Query | Purpose |
|-----|-------|---------|
| GSI1 | `listDevices(status?, limit?, nextToken?)` | List devices, optional status filter, paginated |
| GSI3 | `getDevicesByLocation(location)` | Devices at a specific location |
| Primary | `getDevice(id)` | Single device by ID |
| Primary | `getDevicesByCustomer(customerId)` | Devices for a customer (CustomerAdmin scoping) |

---

## 3. API Contracts

### 3.1 Queries

| Query | Arguments | Returns | Auth |
|-------|-----------|---------|------|
| `listDevices(status?, limit?, nextToken?)` | Optional status filter, pagination | `{ items: Device[], nextToken? }` | All roles |
| `getDevice(id)` | Device ID | `Device` | All roles |
| `getDevicesByLocation(location)` | Location string | `Device[]` | All roles |
| `getDevicesByCustomer(customerId)` | Customer ID | `Device[]` | All roles (auto-filtered for CustomerAdmin) |

### 3.2 Mutations

| Mutation | Arguments | Returns | Auth |
|----------|-----------|---------|------|
| `createDevice(input)` | Device fields | `Device` | Admin, Manager |
| `updateEntityStatus("Device", id, newStatus)` | Entity type, ID, new status | `Device` | Admin, Manager |

---

## 4. Component Hierarchy

```
src/app/components/
├── inventory.tsx                    # Main page with tab container
│   ├── Tabs (shadcn)
│   │   ├── HardwareInventoryTab
│   │   │   ├── SearchBar
│   │   │   ├── FilterDropdowns (status, location, model, customer)
│   │   │   ├── DataTable (shadcn Table)
│   │   │   │   ├── TableHeader (sortable columns)
│   │   │   │   └── TableRow (per device)
│   │   │   ├── Pagination (6 items/page)
│   │   │   └── ExportCSVButton
│   │   ├── FirmwareStatusTab
│   │   │   └── DeviceFirmwareGrid
│   │   │       └── DeviceFirmwareCard (repeated)
│   │   │           ├── DeviceName + FirmwareVersion
│   │   │           └── HealthScoreBar (color-coded)
│   │   └── GeoLocationTab
│   │       ├── StatusFilterPills
│   │       └── GeoLocationMap (react-simple-maps)
│   │           └── DeviceMarker (per device with lat/lng)
│   │               └── Tooltip (name, status, health, firmware)
```

---

## 5. Hardware Inventory Tab

### 5.1 Table Columns

| Column | Field | Sortable | Width |
|--------|-------|----------|-------|
| Device Name | `deviceName` | Yes | 25% |
| Serial Number | `serialNumber` | Yes | 20% |
| Model | `deviceModel` | No | 15% |
| Status | `status` | Yes | 10% |
| Location | `location` | Yes | 15% |
| Health Score | `healthScore` | Yes | 15% |

### 5.2 Filters

- **Status:** Dropdown — All, Online, Offline, Maintenance
- **Location:** Dropdown — dynamically populated from device locations
- **Model:** Dropdown — dynamically populated from device models
- **Customer:** Dropdown — Admin/Manager see all; CustomerAdmin sees own only
- **Search:** Text input filtering by device name or serial number (client-side)

### 5.3 Pagination

- 6 items per page (compact, data-dense per design principles)
- "Showing 1-6 of 43" text
- Previous/Next buttons
- Server-side pagination via `nextToken` for large datasets

### 5.4 CSV Export

Uses `report-generator.ts` → `generateCSV()` with current filter state applied. Exports visible columns only. Disabled when no data.

---

## 6. Firmware Status Tab

Grid of device cards showing firmware version and a color-coded health score bar.

### 6.1 Health Score Bar Colors

| Range | Color | Label |
|-------|-------|-------|
| 90-100 | Green (#10b981) | Excellent |
| 70-89 | Amber (#f59e0b) | Good |
| 50-69 | Orange (#f97316) | Fair |
| 0-49 | Red (#ef4444) | Poor |

---

## 7. Geo Location Tab

### 7.1 Map Component

- Library: `react-simple-maps` with world topology
- Device markers plotted from `lat`/`lng` fields
- Fallback: If device lacks lat/lng, `location-coords.ts` resolves from location string
- Status filter pills above map: All | Online | Offline | Maintenance

### 7.2 Device Marker Tooltip

On hover/click, shows:
- Device name
- Status (with colored badge)
- Health score
- Firmware version
- Location name

### 7.3 Performance

- Target: < 2s render with 1,000 markers
- Marker clustering for dense areas (future enhancement)

---

## 8. CustomerAdmin Scoping

- All device queries auto-filter by `customerId` when user is CustomerAdmin
- Filter dropdowns only show values relevant to the customer's devices
- Map shows only the customer's devices
