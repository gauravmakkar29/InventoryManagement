# Epic 9: Geo-Location Formalization — Technical Specification

**Epic:** Epic 9 — Geo-Location Formalization
**Brief Reference:** Section 10.2 Inventory & Assets — Geo Location Tab
**Status:** POC — Fresh Build

---

## 1. Overview

This epic formalizes the Geo Location tab within the Inventory page. It renders an interactive world map using `react-simple-maps` with device markers positioned by `lat`/`lng` fields from the Device entity. Users can filter devices by status using pill buttons and click markers to see device details in a tooltip. Coordinate resolution falls back to a client-side lookup when device records lack explicit lat/lng.

---

## 2. Data Model

### 2.1 Device Entity — Geo Fields

The Device entity already includes geo-location fields:

```typescript
{
  PK: "DEV#<uuid>",
  SK: "DEV#<uuid>",
  // ... other fields
  location: string,       // Human-readable: "Sydney", "Melbourne", "Singapore"
  lat: number,            // Latitude: -33.8688 (Sydney)
  lng: number,            // Longitude: 151.2093 (Sydney)
}
```

### 2.2 Coordinate Resolution Strategy

1. **Primary:** Use `device.lat` and `device.lng` directly from DynamoDB
2. **Fallback:** If lat/lng are `null`, `0`, or missing, resolve from `device.location` using the `location-coords.ts` client-side lookup table

### 2.3 Location Coordinates Lookup (`src/lib/location-coords.ts`)

```typescript
// Client-side fallback mapping
const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  "Sydney": { lat: -33.8688, lng: 151.2093 },
  "Melbourne": { lat: -37.8136, lng: 144.9631 },
  "Singapore": { lat: 1.3521, lng: 103.8198 },
  "Tokyo": { lat: 35.6762, lng: 139.6503 },
  "London": { lat: 51.5074, lng: -0.1278 },
  "New York": { lat: 40.7128, lng: -74.0060 },
  // ... extensible
};

export function resolveCoordinates(device: Device): { lat: number; lng: number } | null {
  if (device.lat && device.lng && device.lat !== 0 && device.lng !== 0) {
    return { lat: device.lat, lng: device.lng };
  }
  return LOCATION_COORDS[device.location] || null;
}
```

---

## 3. API Contracts

### 3.1 Queries Used

```graphql
# Primary — all devices for map rendering
query listDevices($status: String, $limit: Int, $nextToken: String): DeviceConnection

# Optional — devices at a specific location
query getDevicesByLocation($location: String!): [Device]
```

No new resolvers or mutations are needed for this epic.

---

## 4. Component Hierarchy

```
InventoryPage (src/app/components/inventory.tsx)
├── Tab: Hardware Inventory
├── Tab: Firmware Status
└── Tab: Geo Location
    └── GeoLocationPanel
        ├── StatusFilterPills
        │   ├── Pill: "All" (default, selected state)
        │   ├── Pill: "Online" (green)
        │   ├── Pill: "Offline" (red)
        │   └── Pill: "Maintenance" (amber)
        ├── GeoLocationMap (src/app/components/geo-location-map.tsx)
        │   ├── ComposableMap (react-simple-maps)
        │   │   └── Geographies (world-110m topojson)
        │   └── DeviceMarkers[]
        │       └── Marker (circle positioned by [lng, lat])
        │           ├── Circle (color-coded by status)
        │           └── Tooltip (on click/hover)
        │               ├── Device Name
        │               ├── Status Badge
        │               ├── Health Score
        │               ├── Firmware Version
        │               └── Location String
        ├── DeviceCountBadge ("Showing 23 of 47 devices")
        └── EmptyState ("No devices match the selected filter")
```

---

## 5. Map Implementation Details

### 5.1 Library: react-simple-maps v3.0.0

```typescript
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
```

### 5.2 Map Configuration

```typescript
<ComposableMap
  projection="geoMercator"
  projectionConfig={{ scale: 147, center: [0, 20] }}
  width={800}
  height={400}
>
  <ZoomableGroup>
    <Geographies geography="/world-110m.json">
      {({ geographies }) =>
        geographies.map((geo) => (
          <Geography
            key={geo.rpiProperties.NAME}
            geography={geo}
            fill="#e2e8f0"       // light mode land
            stroke="#cbd5e1"     // borders
            strokeWidth={0.5}
          />
        ))
      }
    </Geographies>
    {filteredDevices.map((device) => {
      const coords = resolveCoordinates(device);
      if (!coords) return null;
      return (
        <Marker key={device.id} coordinates={[coords.lng, coords.lat]}>
          <circle
            r={5}
            fill={statusColor(device.status)}
            stroke="#fff"
            strokeWidth={1.5}
            onClick={() => setSelectedDevice(device)}
            style={{ cursor: "pointer" }}
          />
        </Marker>
      );
    })}
  </ZoomableGroup>
</ComposableMap>
```

### 5.3 Status Colors

```typescript
function statusColor(status: string): string {
  switch (status) {
    case "Online": return "#10b981";      // green
    case "Offline": return "#ef4444";      // red
    case "Maintenance": return "#f59e0b";  // amber
    default: return "#6b7280";             // gray
  }
}
```

### 5.4 Tooltip Implementation

Use Radix UI `Popover` or `HoverCard` positioned near the clicked marker:

```typescript
{selectedDevice && (
  <DeviceTooltip
    device={selectedDevice}
    onClose={() => setSelectedDevice(null)}
  />
)}
```

---

## 6. State Management

```typescript
// GeoLocationPanel state
const [devices, setDevices] = useState<Device[]>([]);
const [statusFilter, setStatusFilter] = useState<string>("All");
const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
const [loading, setLoading] = useState(true);

const filteredDevices = useMemo(() => {
  if (statusFilter === "All") return devices;
  return devices.filter(d => d.status === statusFilter);
}, [devices, statusFilter]);

const mappableDevices = useMemo(() => {
  return filteredDevices.filter(d => resolveCoordinates(d) !== null);
}, [filteredDevices]);
```

---

## 7. Performance Considerations

| Concern | Mitigation |
|---|---|
| 1000+ device markers | Marker clustering (group nearby markers at zoom-out levels) |
| Map re-renders on filter change | `useMemo` for filteredDevices, React.memo on Marker components |
| Large topojson file | Use world-110m (110m resolution, ~200KB) not world-50m |
| Map load failure | Error boundary wrapping GeoLocationMap, fallback to device list table |
| Mobile viewport | Responsive: map takes full width, reduce projection scale |

---

## 8. Access Control

| Role | View Map | Filter | Click Markers |
|---|---|---|---|
| Admin | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes |
| Technician | Yes | Yes | Yes |
| Viewer | Yes | Yes | Yes |
| CustomerAdmin | Yes (own devices only) | Yes | Yes |

CustomerAdmin filtering is applied at the API level — `listDevices` returns only tenant-scoped devices.

---

## 9. Dark Mode Support

| Element | Light Mode | Dark Mode |
|---|---|---|
| Land fill | `#e2e8f0` | `#334155` |
| Land borders | `#cbd5e1` | `#475569` |
| Ocean/background | `#f8f9fb` | `#0f172a` |
| Marker stroke | `#fff` | `#1e293b` |
| Tooltip card | White bg, dark text | `#1e293b` bg, light text |

---

## 10. Static Assets

- **World topology:** `public/world-110m.json` (TopoJSON, Natural Earth data)
- Loaded via fetch in `Geographies` component
- Cached by browser after first load
