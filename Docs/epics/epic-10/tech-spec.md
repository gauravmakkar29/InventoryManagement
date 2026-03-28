# Epic 10: Amazon Location Service — Technical Specification

**Epic:** Epic 10 — Amazon Location Service
**Brief Reference:** Section 12 Planned Epics — replaces static map with interactive MapLibre GL JS
**Status:** POC — Fresh Build

---

## 1. Overview

This epic replaces the static `react-simple-maps` world map (Epic 9) with a fully interactive map powered by Amazon Location Service and MapLibre GL JS. It adds Places API geocoding (forward/reverse), geofencing for location-based alerts, and device tracking visualization. This is a significant upgrade from the static pin-on-map approach to a real-time, interactive mapping experience.

---

## 2. AWS Resources (Terraform)

### 2.1 Amazon Location Service Resources

| Resource | Terraform Resource | Configuration |
|---|---|---|
| Map Resource | `aws_location_map` | Style: `VectorEsriNavigation` or `VectorHereExplore` |
| Place Index | `aws_location_place_index` | Data provider: Esri or HERE, for geocoding |
| Geofence Collection | `aws_location_geofence_collection` | Named geofence areas (warehouses, service zones) |
| Tracker | `aws_location_tracker` | Device position tracking |
| Tracker-Geofence Association | `aws_location_tracker_consumer` | Links tracker to geofence collection for ENTER/EXIT events |

### 2.2 Terraform Definitions

```hcl
resource "aws_location_map" "ims_map" {
  map_name = "ims-gen2-map"
  configuration {
    style = "VectorEsriNavigation"
  }
}

resource "aws_location_place_index" "ims_places" {
  index_name  = "ims-gen2-places"
  data_source = "Esri"
  data_source_configuration {
    intended_use = "SingleUse"
  }
}

resource "aws_location_geofence_collection" "ims_geofences" {
  collection_name = "ims-gen2-geofences"
}

resource "aws_location_tracker" "ims_tracker" {
  tracker_name = "ims-gen2-tracker"
}

resource "aws_location_tracker_consumer" "tracker_geofence" {
  tracker_name      = aws_location_tracker.ims_tracker.tracker_name
  consumer_arn      = aws_location_geofence_collection.ims_geofences.collection_arn
}
```

### 2.3 IAM Permissions

The Cognito Identity Pool (or AppSync role) needs:

```json
{
  "Effect": "Allow",
  "Action": [
    "geo:GetMapTile",
    "geo:GetMapSprites",
    "geo:GetMapGlyphs",
    "geo:GetMapStyleDescriptor",
    "geo:SearchPlaceIndexForText",
    "geo:SearchPlaceIndexForPosition",
    "geo:GetGeofence",
    "geo:ListGeofences",
    "geo:BatchUpdateDevicePosition",
    "geo:GetDevicePosition",
    "geo:ListDevicePositions"
  ],
  "Resource": [
    "arn:aws:geo:*:*:map/ims-gen2-map",
    "arn:aws:geo:*:*:place-index/ims-gen2-places",
    "arn:aws:geo:*:*:geofence-collection/ims-gen2-geofences",
    "arn:aws:geo:*:*:tracker/ims-gen2-tracker"
  ]
}
```

---

## 3. Frontend Libraries

| Library | Version | Purpose |
|---|---|---|
| `maplibre-gl` | ^4.x | WebGL map renderer |
| `@aws/amazon-location-utilities-auth-helper` | ^1.x | Cognito credential signing for Amazon Location |
| `@aws/amazon-location-utilities-datatypes` | ^1.x | GeoJSON converters for Location API responses |

### 3.1 MapLibre Initialization

```typescript
import maplibregl from "maplibre-gl";
import { withIdentityPoolId } from "@aws/amazon-location-utilities-auth-helper";

const authHelper = await withIdentityPoolId(IDENTITY_POOL_ID);

const map = new maplibregl.Map({
  container: "map-container",
  style: `https://maps.geo.${REGION}.amazonaws.com/maps/v0/maps/ims-gen2-map/style-descriptor`,
  center: [151.2093, -33.8688], // Sydney default
  zoom: 3,
  transformRequest: authHelper.transformRequest,
});
```

---

## 4. Component Hierarchy

```
InventoryPage
├── Tab: Hardware Inventory
├── Tab: Firmware Status
└── Tab: Geo Location
    └── InteractiveMapPanel
        ├── StatusFilterPills (same as Epic 9)
        ├── SearchLocationBar (Places API geocoding)
        │   └── Input with autocomplete suggestions
        ├── MapContainer (MapLibre GL JS)
        │   ├── Map tiles (vector, Amazon Location Service)
        │   ├── DeviceMarkers[] (GeoJSON source + circle/symbol layers)
        │   │   └── Popup (on click — device details)
        │   ├── GeofenceOverlays[] (polygon fills for geofence boundaries)
        │   ├── NavigationControl (zoom +/-, compass)
        │   └── ScaleControl
        ├── GeofencePanel (collapsible sidebar)
        │   ├── GeofenceList (named geofences with device counts)
        │   └── CreateGeofenceButton
        ├── DeviceTrackingToggle
        │   └── Shows movement trail for selected device
        └── DeviceCountBadge
```

---

## 5. Features

### 5.1 Interactive Map (replaces react-simple-maps)

- Vector tile rendering via MapLibre GL JS (WebGL, smooth zoom/pan)
- Device markers as a GeoJSON layer with clustering at zoom-out levels
- Marker color by device status (Online=green, Offline=red, Maintenance=amber)
- Click marker opens a Popup with device name, status, health score, firmware version, location
- Zoom to fit all device markers on initial load

### 5.2 Places API Geocoding

```typescript
// Forward geocoding — search location string to coordinates
import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";

const client = new LocationClient({ region: REGION, credentials: authHelper.getCredentials() });

async function geocodeLocation(query: string): Promise<{ lat: number; lng: number } | null> {
  const response = await client.send(new SearchPlaceIndexForTextCommand({
    IndexName: "ims-gen2-places",
    Text: query,
    MaxResults: 5,
  }));
  const result = response.Results?.[0];
  if (result) {
    const [lng, lat] = result.Place!.Geometry!.Point!;
    return { lat, lng };
  }
  return null;
}

// Reverse geocoding — coordinates to address
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const response = await client.send(new SearchPlaceIndexForPositionCommand({
    IndexName: "ims-gen2-places",
    Position: [lng, lat],
    MaxResults: 1,
  }));
  return response.Results?.[0]?.Place?.Label || "Unknown location";
}
```

### 5.3 Geofencing

Geofences define named geographic areas (e.g., "Sydney Warehouse", "Melbourne Service Zone"):

```typescript
// Create a geofence
await client.send(new PutGeofenceCommand({
  CollectionName: "ims-gen2-geofences",
  GeofenceId: "sydney-warehouse",
  Geometry: {
    Polygon: [[
      [151.19, -33.88], [151.22, -33.88],
      [151.22, -33.86], [151.19, -33.86],
      [151.19, -33.88], // close the polygon
    ]],
  },
}));
```

- Geofence boundaries rendered as semi-transparent polygon overlays on the map
- When a device tracker reports a position inside/outside a geofence, EventBridge triggers a notification
- Admin/Manager can create geofences via a draw-on-map interface or manual coordinate entry

### 5.4 Device Tracking

```typescript
// Report device position (called from IoT or batch update)
await client.send(new BatchUpdateDevicePositionCommand({
  TrackerName: "ims-gen2-tracker",
  Updates: [{
    DeviceId: "DEV#abc123",
    Position: [151.2093, -33.8688],
    SampleTime: new Date(),
  }],
}));

// Get device position history (for trail visualization)
const history = await client.send(new GetDevicePositionHistoryCommand({
  TrackerName: "ims-gen2-tracker",
  DeviceId: "DEV#abc123",
  StartTimeInclusive: new Date("2026-03-01"),
  EndTimeExclusive: new Date("2026-03-28"),
}));
```

---

## 6. Data Flow

```
Device lat/lng in DynamoDB
    │
    ├── Initial load: listDevices() → plot on MapLibre map
    │
    ├── Search: User types location → Places API → map pans to result
    │
    ├── Geofence: Admin draws boundary → PutGeofence → rendered on map
    │
    └── Tracking: Device position updates → Tracker API → trail on map
                                         → Geofence evaluation → EventBridge → Notification
```

---

## 7. Migration from Epic 9

| Aspect | Epic 9 (react-simple-maps) | Epic 10 (Amazon Location Service) |
|---|---|---|
| Rendering | SVG-based, static | WebGL (MapLibre GL JS), smooth zoom/pan |
| Tiles | TopoJSON file (bundled) | Vector tiles (streamed from Amazon Location) |
| Geocoding | Client-side lookup table | Places API (Esri/HERE data) |
| Geofencing | Not available | Amazon Location Geofence Collection |
| Device tracking | Not available | Amazon Location Tracker |
| Markers | SVG circles | GeoJSON layers with clustering |
| Coordinate resolution | `location-coords.ts` fallback | Places API geocoding + fallback |
| Performance at scale | Degrades at 1000+ markers | WebGL handles 10,000+ markers via clustering |

The `StatusFilterPills` component and tooltip content are reused from Epic 9.

---

## 8. Access Control

| Role | View Map | Search Locations | Create Geofences | View Tracking |
|---|---|---|---|---|
| Admin | Yes | Yes | Yes | Yes |
| Manager | Yes | Yes | Yes | Yes |
| Technician | Yes | Yes | No | Own device only |
| Viewer | Yes | Yes | No | No |
| CustomerAdmin | Yes (own devices) | Yes | No | Own devices |

---

## 9. Performance

| Concern | Mitigation |
|---|---|
| MapLibre bundle size | Tree-shake; ~200KB gzipped |
| 10,000+ device markers | GeoJSON clustering via `maplibregl.supercluster` |
| Places API rate limits | Debounce search input (300ms), cache recent results |
| Tile loading latency | MapLibre prefetches visible tiles, progressive rendering |
| Mobile support | MapLibre is touch-enabled (pinch zoom, pan) |

---

## 10. Terraform Module Structure

```
infra/modules/location-service/
├── main.tf        # Map, Place Index, Geofence Collection, Tracker resources
├── variables.tf   # map_name, index_name, region
├── outputs.tf     # Map ARN, Place Index ARN, Tracker ARN
└── iam.tf         # Cognito identity pool role policies
```
