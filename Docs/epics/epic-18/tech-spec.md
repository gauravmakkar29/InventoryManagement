# Epic 18: OpenSearch & Global Search — Technical Specification

**Epic:** Epic 18 — OpenSearch & Global Search
**Brief Reference:** Section 9 (Complete), FR-9
**Status:** Draft
**Dependencies:** Epic 17 (Terraform provisions the OpenSearch collection and OSIS pipeline)

---

## 1. Overview

This epic implements the full search layer for the IMS Gen2 platform: OpenSearch Serverless with an OSIS ingestion pipeline syncing from DynamoDB, 4 AppSync search resolvers, full-text search across all 8 entity types, server-side aggregations for analytics, geospatial queries, and the GlobalSearchBar UI component with Cmd+K command palette.

---

## 2. OpenSearch Architecture (Section 9.2)

```
DynamoDB (DataTable)
    |
    +-- Streams (NEW_AND_OLD_IMAGES)
    |
    v
OpenSearch Ingestion Pipeline (OSIS)
    |  +-- Initial load: DynamoDB Export -> S3 -> OSIS
    |  +-- Ongoing sync: DynamoDB Streams -> OSIS
    v
OpenSearch Serverless Collection ("ims-gen2-search")
    |  +-- Encryption policy (aws/opensearchserverless)
    |  +-- Network policy (public or VPC endpoint)
    |  +-- Data access policy (AppSync role + OSIS pipeline role)
    v
AppSync HTTP DataSource (IAM-signed, service: "aoss")
    |
    v
Custom Search Resolvers -> React Frontend
```

### 2.1 Why Serverless (Section 9.3)

- No cluster management (fully managed)
- Pay-per-use OCU model (aligns with DynamoDB PAY_PER_REQUEST)
- Automatic scaling
- Production: Serverless (~$350/mo min when active)
- Dev/Staging: Use managed domain (t3.small.search, ~$27/mo) via Terraform tfvars

### 2.2 Single-Table Advantage (Section 9.4)

Since all 8 entity types live in one DynamoDB table, only one OSIS pipeline is needed. The `entityType` discriminator field enables filtered search per type.

---

## 3. Index Mapping (Section 9.5)

All entity types indexed into a single OpenSearch index: `ims-data`.

| Field | OpenSearch Type | Purpose |
|-------|----------------|---------|
| `entityType` | `keyword` | Filter results by entity type |
| `deviceName`, `name`, `title` | `text` + `keyword` subfield | Full-text search + exact match |
| `serialNumber`, `vulnCveId` | `keyword` | Exact match lookups |
| `description`, `vulnAffectedComponent` | `text` | Full-text search |
| `status`, `vulnSeverity`, `approvalStage` | `keyword` | Faceted filtering |
| `location` | `text` + `keyword` subfield | Full-text + exact match |
| `lat`, `lng` | `geo_point` (combined as `location` field) | Geospatial queries |
| `createdAt`, `timestamp`, `scheduledDate` | `date` | Date range queries + date_histogram |
| `healthScore`, `vulnerabilityCount` | `float` / `integer` | Range queries + numeric aggregations |

### 3.1 Index Template

```json
{
  "index_patterns": ["ims-data*"],
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1,
      "analysis": {
        "analyzer": {
          "ims_analyzer": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": ["lowercase", "asciifolding", "edge_ngram_filter"]
          }
        },
        "filter": {
          "edge_ngram_filter": {
            "type": "edge_ngram",
            "min_gram": 2,
            "max_gram": 20
          }
        }
      }
    },
    "mappings": {
      "properties": {
        "entityType": { "type": "keyword" },
        "deviceName": { "type": "text", "analyzer": "ims_analyzer", "fields": { "keyword": { "type": "keyword" } } },
        "name": { "type": "text", "analyzer": "ims_analyzer", "fields": { "keyword": { "type": "keyword" } } },
        "title": { "type": "text", "analyzer": "ims_analyzer", "fields": { "keyword": { "type": "keyword" } } },
        "serialNumber": { "type": "keyword" },
        "vulnCveId": { "type": "keyword" },
        "description": { "type": "text" },
        "vulnAffectedComponent": { "type": "text" },
        "status": { "type": "keyword" },
        "vulnSeverity": { "type": "keyword" },
        "approvalStage": { "type": "keyword" },
        "location": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
        "geoLocation": { "type": "geo_point" },
        "createdAt": { "type": "date" },
        "timestamp": { "type": "date" },
        "scheduledDate": { "type": "date" },
        "releaseDate": { "type": "date" },
        "healthScore": { "type": "float" },
        "vulnerabilityCount": { "type": "integer" }
      }
    }
  }
}
```

---

## 4. OSIS Pipeline Configuration

```yaml
version: "2"
dynamodb-pipeline:
  source:
    dynamodb:
      tables:
        - table_arn: "${data_table_arn}"
          stream:
            start_position: "LATEST"
          export:
            s3_bucket: "${export_bucket}"
            s3_region: "${region}"
            s3_prefix: "ims-export/"
      aws:
        sts_role_arn: "${osis_role_arn}"
        region: "${region}"
  processor:
    - date:
        from_time_received: true
        destination: "@timestamp"
  sink:
    - opensearch:
        hosts: ["${collection_endpoint}"]
        index: "ims-data"
        aws:
          sts_role_arn: "${osis_role_arn}"
          region: "${region}"
          serverless: true
```

### 4.1 Pipeline Behavior

1. **Initial load**: Exports entire DynamoDB table to S3, then OSIS reads the export and indexes all records
2. **Ongoing sync**: OSIS reads from DynamoDB Streams and indexes changes in near-real-time (< 60 second lag)
3. **Deletes**: When a record is deleted from DynamoDB, OSIS removes it from the OpenSearch index
4. **Updates**: When a record is modified, OSIS re-indexes the updated version (upsert by document ID)

---

## 5. AppSync Search Resolvers (Section 9.6-9.8)

### 5.1 searchGlobal Resolver

Full-text search across all entity types using `multi_match` with fuzziness.

```javascript
// searchGlobal.js
export function request(ctx) {
  const { query, entityTypes, limit } = ctx.args;
  const body = {
    from: 0,
    size: limit || 25,
    query: {
      bool: {
        must: [{
          multi_match: {
            query,
            fields: [
              "deviceName^3", "name^3", "title^3",
              "serialNumber^2", "vulnCveId^2",
              "location", "email", "description",
              "vulnAffectedComponent", "*"
            ],
            fuzziness: "AUTO",
            type: "best_fields"
          }
        }],
        ...(entityTypes && {
          filter: [{ terms: { "entityType.keyword": entityTypes } }]
        })
      }
    },
    highlight: {
      fields: { "*": {} },
      pre_tags: ["<mark>"],
      post_tags: ["</mark>"]
    }
  };

  return {
    version: "2018-05-29",
    method: "POST",
    params: {
      headers: { "Content-Type": "application/json" },
      body
    },
    resourcePath: "/ims-data/_search"
  };
}

export function response(ctx) {
  if (ctx.result.statusCode === 200) {
    const parsed = JSON.parse(ctx.result.body);
    return {
      total: parsed.hits.total.value,
      results: parsed.hits.hits.map((hit) => ({
        ...hit._source,
        id: hit._id,
        _score: hit._score,
        _highlights: hit.highlight
      }))
    };
  }
  util.error("Search failed", "OpenSearchError", ctx.result.body);
}
```

### 5.2 searchDevices Resolver

Device-scoped search with optional filters.

```javascript
// searchDevices.js
export function request(ctx) {
  const { query, filters } = ctx.args;
  const must = [
    { term: { "entityType.keyword": "Device" } }
  ];
  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ["deviceName^3", "serialNumber^2", "location", "deviceModel"],
        fuzziness: "AUTO"
      }
    });
  }

  const filterClauses = [];
  if (filters?.status) filterClauses.push({ term: { "status.keyword": filters.status } });
  if (filters?.location) filterClauses.push({ match: { location: filters.location } });
  if (filters?.model) filterClauses.push({ term: { "deviceModel.keyword": filters.model } });
  if (filters?.healthScoreMin != null) filterClauses.push({ range: { healthScore: { gte: filters.healthScoreMin } } });
  if (filters?.healthScoreMax != null) filterClauses.push({ range: { healthScore: { lte: filters.healthScoreMax } } });

  return {
    version: "2018-05-29",
    method: "POST",
    params: {
      headers: { "Content-Type": "application/json" },
      body: {
        size: 50,
        query: { bool: { must, filter: filterClauses } },
        sort: [{ _score: "desc" }, { "deviceName.keyword": "asc" }]
      }
    },
    resourcePath: "/ims-data/_search"
  };
}
```

### 5.3 searchVulnerabilities Resolver

```javascript
// searchVulnerabilities.js
export function request(ctx) {
  const { query, severity } = ctx.args;
  const must = [
    { term: { "entityType.keyword": "Vulnerability" } }
  ];
  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ["vulnCveId^3", "vulnAffectedComponent^2", "description"],
        fuzziness: "AUTO"
      }
    });
  }
  const filter = severity ? [{ term: { "vulnSeverity.keyword": severity } }] : [];

  return {
    version: "2018-05-29",
    method: "POST",
    params: {
      headers: { "Content-Type": "application/json" },
      body: {
        size: 50,
        query: { bool: { must, filter } },
        sort: [{ _score: "desc" }]
      }
    },
    resourcePath: "/ims-data/_search"
  };
}
```

### 5.4 getAggregations Resolver (Section 9.8)

```javascript
// getAggregations.js
export function request(ctx) {
  const { metric, timeRange } = ctx.args;

  const aggregations = {
    devicesByStatus: {
      filter: { term: { "entityType.keyword": "Device" } },
      aggs: { statuses: { terms: { field: "status.keyword" } } }
    },
    deviceCount: {
      filter: { term: { "entityType.keyword": "Device" } },
      aggs: { count: { value_count: { field: "entityType.keyword" } } }
    },
    activeDeployments: {
      filter: {
        bool: {
          must: [
            { term: { "entityType.keyword": "Firmware" } },
            { term: { "status.keyword": "Active" } }
          ]
        }
      }
    },
    pendingApprovals: {
      filter: {
        bool: {
          must: [
            { term: { "entityType.keyword": "Firmware" } },
            { term: { "approvalStage.keyword": "Uploaded" } }
          ]
        }
      }
    },
    avgHealthScore: {
      filter: { term: { "entityType.keyword": "Device" } },
      aggs: { avg_health: { avg: { field: "healthScore" } } }
    },
    complianceByStatus: {
      filter: { term: { "entityType.keyword": "Compliance" } },
      aggs: { statuses: { terms: { field: "status.keyword" } } }
    },
    deploymentTrend: {
      filter: { term: { "entityType.keyword": "Firmware" } },
      aggs: {
        trend: {
          date_histogram: {
            field: "releaseDate",
            calendar_interval: "week"
          }
        }
      }
    },
    topVulnerabilities: {
      filter: { term: { "entityType.keyword": "Vulnerability" } },
      aggs: { severity: { terms: { field: "vulnSeverity.keyword", size: 10 } } }
    },
    healthScoreDistribution: {
      filter: { term: { "entityType.keyword": "Device" } },
      aggs: { scores: { histogram: { field: "healthScore", interval: 10 } } }
    }
  };

  const agg = aggregations[metric];
  if (!agg) util.error(`Unknown metric: ${metric}`, "ValidationError");

  // Apply time range filter if provided
  const timeFilter = timeRange ? {
    range: { createdAt: { gte: timeRange.start, lte: timeRange.end } }
  } : null;

  return {
    version: "2018-05-29",
    method: "POST",
    params: {
      headers: { "Content-Type": "application/json" },
      body: {
        size: 0,
        query: timeFilter ? { bool: { must: [timeFilter] } } : { match_all: {} },
        aggs: { [metric]: agg }
      }
    },
    resourcePath: "/ims-data/_search"
  };
}

export function response(ctx) {
  if (ctx.result.statusCode === 200) {
    const parsed = JSON.parse(ctx.result.body);
    return {
      metric: ctx.args.metric,
      data: parsed.aggregations
    };
  }
  util.error("Aggregation failed", "OpenSearchError", ctx.result.body);
}
```

---

## 6. Geospatial Queries (Section 9.9)

OpenSearch indexes device `lat` and `lng` as a combined `geo_point` field (`geoLocation`).

| Query Type | OpenSearch DSL | Use Case |
|------------|---------------|----------|
| `geo_distance` | `{ "geo_distance": { "distance": "50km", "geoLocation": { "lat": -33.8, "lon": 151.2 } } }` | Blast radius, nearby devices |
| `geo_bounding_box` | `{ "geo_bounding_box": { "geoLocation": { "top_left": {...}, "bottom_right": {...} } } }` | Devices in map viewport |
| `geohash_grid` agg | `{ "geohash_grid": { "field": "geoLocation", "precision": 5 } }` | Heatmap tiles |
| `geo_centroid` agg | `{ "geo_centroid": { "field": "geoLocation" } }` | Cluster center points |

---

## 7. Frontend: GlobalSearchBar Component

### 7.1 Component Hierarchy

```
src/app/components/
  search/
    GlobalSearchBar.tsx                # Main search input in header
    SearchCommandPalette.tsx           # Command palette dialog (shadcn Command)
    SearchResultGroup.tsx              # Grouped results by entity type
    SearchResultItem.tsx               # Individual result row
    SearchEmptyState.tsx               # "No results" with suggestions
    SearchRecentList.tsx               # Recent searches from localStorage
    useGlobalSearch.ts                 # Custom hook: debounce + query + state
```

### 7.2 GlobalSearchBar Behavior

```typescript
// useGlobalSearch.ts
interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  isOpen: boolean;
  recentSearches: string[];           // last 5, from localStorage
  selectedEntityTypes: string[];       // optional filter
}

// Debounce: 300ms after last keystroke before firing query
// Minimum query length: 2 characters
// Max results: 25 per query
// Results grouped by entityType with section headers
// Keyboard navigation: Arrow keys to move, Enter to select, Escape to close
```

### 7.3 Search Result Display

Each result shows:
- Entity type icon (Device=server, Firmware=package, ServiceOrder=clipboard, Compliance=shield, Vulnerability=alert-triangle)
- Title (primary field: deviceName, name, title, vulnCveId)
- Subtitle (secondary field: serialNumber, version, location, severity)
- Entity type badge (colored pill)
- Highlighted matching text (from OpenSearch `highlight` response)

### 7.4 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open search palette |
| `Escape` | Close search palette |
| `Arrow Up/Down` | Navigate results |
| `Enter` | Navigate to selected result |
| `Cmd+Shift+K` | Open search with entity type filter |

### 7.5 Recent Searches

- Stored in `localStorage` under key `ims-recent-searches`
- Maximum 5 entries (FIFO)
- Displayed when search palette is opened with empty query
- Click recent search to re-execute the query
- "Clear recent searches" link at bottom

---

## 8. Frontend API Client Additions (`hlm-api.ts`)

```typescript
// New query wrappers
export async function searchGlobal(
  query: string,
  entityTypes?: string[],
  limit?: number
): Promise<SearchResponse> { ... }

export async function searchDevices(
  query: string,
  filters?: DeviceSearchFilters
): Promise<Device[]> { ... }

export async function searchVulnerabilities(
  query: string,
  severity?: string
): Promise<Vulnerability[]> { ... }

export async function getAggregations(
  metric: string,
  timeRange?: { start: string; end: string }
): Promise<AggregationResponse> { ... }

// New interfaces
interface SearchResponse {
  total: number;
  results: SearchResult[];
}

interface SearchResult {
  id: string;
  entityType: string;
  _score: number;
  _highlights: Record<string, string[]>;
  [key: string]: any;                  // entity-specific fields
}

interface DeviceSearchFilters {
  status?: string;
  location?: string;
  model?: string;
  healthScoreMin?: number;
  healthScoreMax?: number;
}

interface AggregationResponse {
  metric: string;
  data: any;                           // aggregation-specific structure
}
```

---

## 9. Graceful Degradation

When OpenSearch is unavailable:
1. GlobalSearchBar shows "Search temporarily unavailable" placeholder
2. Inventory page falls back to DynamoDB GSI queries (less fuzzy, but functional)
3. Analytics page shows cached data or "Unable to load charts" with retry
4. A `useConnectivityMonitor` hook checks OpenSearch health every 60s
5. When OpenSearch recovers, full search functionality restores automatically
