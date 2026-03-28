# Epic 8: Audit Trail — Technical Specification

**Epic:** Epic 8 — Audit Trail
**Brief Reference:** FR-5, Section 8 Lambda (Audit Stream Processor)
**Status:** POC — Fresh Build

---

## 1. Overview

The Audit Trail system provides automated, immutable audit logging of all data changes in the platform. A Lambda function processes DynamoDB Streams events and writes structured AUDIT# records back to the same table. The frontend displays these records with date range queries, user filtering, and CSV export. Access is restricted to Admin and Manager roles.

---

## 2. Data Model

### 2.1 AuditLog Entity

```typescript
{
  PK: "AUDIT#<uuid>",
  SK: "AUDIT#<uuid>",
  entityType: "AuditLog",
  action: "Created" | "Modified" | "Deleted",
  resourceType: string,       // "Device", "Firmware", "ServiceOrder", etc.
  resourceId: string,          // The PK of the changed entity (e.g., "DEV#abc123")
  userId: string,              // Who triggered the change (from Cognito context or event metadata)
  ipAddress: string,           // Client IP (from request context if available)
  timestamp: string,           // ISO8601 — when the change occurred
  status: "Success",           // Always "Success" for stream-generated logs
  ttl: number,                 // Unix epoch — 90 days from creation (auto-expiry)

  // GSI Keys
  GSI1PK: "AUDIT_LOG",
  GSI1SK: "Success#<timestamp>",   // Enables list by status + time sort
  GSI2PK: "AUDIT_LOG",
  GSI2SK: "<timestamp>",           // Enables date range queries
  GSI4PK: "USER#<userId>",
  GSI4SK: "AUDIT#<uuid>"           // Enables per-user audit trail
}
```

### 2.2 TTL Configuration

- **TTL attribute:** `ttl`
- **Expiry:** 90 days from record creation (NIST AU-12 compliance)
- **Computation:** `Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)`
- DynamoDB TTL is best-effort; records may persist slightly beyond 90 days

### 2.3 GSI Access Patterns

| Query | GSI | Key Condition |
|---|---|---|
| List all audit logs in date range | GSI2 | `GSI2PK = "AUDIT_LOG" AND GSI2SK BETWEEN startDate AND endDate` |
| List audit logs by user | GSI4 | `GSI4PK = "USER#<userId>"`, SK prefix filter `begins_with(GSI4SK, "AUDIT#")` |
| List audit logs by status (always Success) | GSI1 | `GSI1PK = "AUDIT_LOG" AND begins_with(GSI1SK, "Success#")` |

---

## 3. Lambda — Audit Stream Processor

### 3.1 Function Configuration

| Setting | Value |
|---|---|
| Function Name | `ims-gen2-audit-processor` |
| Runtime | Node.js 20.x |
| Handler | `index.handler` |
| Memory | 256 MB |
| Timeout | 30 seconds |
| Trigger | DynamoDB Streams (DataTable) |
| Batch Size | 25 records |
| Retry Attempts | 3 |
| Starting Position | TRIM_HORIZON |
| Log Retention | 90 days |

### 3.2 Processing Logic

```typescript
// index.ts (Lambda handler)
import { DynamoDBStreamEvent, DynamoDBRecord } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: DynamoDBStreamEvent) => {
  for (const record of event.Records) {
    // Skip audit log records to prevent infinite loop
    const keys = record.dynamodb?.Keys;
    if (keys?.PK?.S?.startsWith("AUDIT#")) continue;
    if (keys?.PK?.S?.startsWith("NOTIF#")) continue;

    const action = mapEventAction(record.eventName);
    const resourcePK = keys?.PK?.S || "UNKNOWN";
    const entityType = extractEntityType(resourcePK);
    const resourceId = resourcePK;

    // Extract userId from new/old image if available
    const image = record.dynamodb?.NewImage || record.dynamodb?.OldImage;
    const userId = image?.userId?.S || image?.uploadedBy?.S || "SYSTEM";

    const auditId = randomUUID();
    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60);

    await client.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: { S: `AUDIT#${auditId}` },
        SK: { S: `AUDIT#${auditId}` },
        entityType: { S: "AuditLog" },
        action: { S: action },
        resourceType: { S: entityType },
        resourceId: { S: resourceId },
        userId: { S: userId },
        ipAddress: { S: "lambda-stream" },
        timestamp: { S: now },
        status: { S: "Success" },
        ttl: { N: String(ttl) },
        GSI1PK: { S: "AUDIT_LOG" },
        GSI1SK: { S: `Success#${now}` },
        GSI2PK: { S: "AUDIT_LOG" },
        GSI2SK: { S: now },
        GSI4PK: { S: `USER#${userId}` },
        GSI4SK: { S: `AUDIT#${auditId}` },
      },
    }));
  }
};

function mapEventAction(eventName?: string): string {
  switch (eventName) {
    case "INSERT": return "Created";
    case "MODIFY": return "Modified";
    case "REMOVE": return "Deleted";
    default: return "Unknown";
  }
}

function extractEntityType(pk: string): string {
  const prefix = pk.split("#")[0];
  const map: Record<string, string> = {
    DEV: "Device", FW: "Firmware", SO: "ServiceOrder",
    COMP: "Compliance", VULN: "Vulnerability", CUST: "Customer", USER: "User",
  };
  return map[prefix] || "Unknown";
}
```

### 3.3 Infinite Loop Prevention

The Lambda MUST skip records where `PK` starts with `AUDIT#` or `NOTIF#` to prevent the audit write from triggering another stream event that triggers another audit write.

### 3.4 IAM Role

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem"
  ],
  "Resource": "arn:aws:dynamodb:*:*:table/DataTable"
}
```

Plus `dynamodb:GetRecords`, `dynamodb:GetShardIterator`, `dynamodb:DescribeStream`, `dynamodb:ListStreams` on the stream ARN.

---

## 4. API Contracts

### 4.1 Queries

```graphql
# List audit logs in a date range (GSI2)
query listAuditLogs(
  $startDate: String!,
  $endDate: String!,
  $limit: Int,
  $nextToken: String
): AuditLogConnection!

# Get audit logs for a specific user (GSI4)
query getAuditLogsByUser(
  $userId: String!
): [AuditLog!]!
```

### 4.2 Resolver: listAuditLogs (queryByGSI2.js)

```javascript
// Request: Query GSI2 with date range
{
  operation: "Query",
  index: "GSI2",
  query: {
    expression: "GSI2PK = :pk AND GSI2SK BETWEEN :start AND :end",
    expressionValues: {
      ":pk": { S: "AUDIT_LOG" },
      ":start": { S: ctx.args.startDate },
      ":end": { S: ctx.args.endDate },
    },
  },
  scanIndexForward: false, // newest first
  limit: ctx.args.limit || 25,
  nextToken: ctx.args.nextToken,
}
```

### 4.3 Resolver: getAuditLogsByUser (queryByGSI4.js)

```javascript
// Request: Query GSI4 for a user's audit trail
{
  operation: "Query",
  index: "GSI4",
  query: {
    expression: "GSI4PK = :pk AND begins_with(GSI4SK, :prefix)",
    expressionValues: {
      ":pk": { S: `USER#${ctx.args.userId}` },
      ":prefix": { S: "AUDIT#" },
    },
  },
  scanIndexForward: false,
}
```

---

## 5. Component Hierarchy

### 5.1 Audit Log Tab (within Deployment page)

```
DeploymentPage (src/app/components/deployment.tsx)
├── Tab: Firmware
└── Tab: Audit Log
    └── AuditLogPanel
        ├── DateRangeFilter (start date, end date pickers)
        ├── UserFilter (optional — search by userId)
        ├── AuditLogTable (DataTable)
        │   ├── Column: User (userId)
        │   ├── Column: Action (Created/Modified/Deleted badge)
        │   ├── Column: Resource (resourceType + short resourceId)
        │   ├── Column: Timestamp (formatted with Intl.DateTimeFormat)
        │   ├── Column: IP Address
        │   └── Column: Status (always "Success" badge)
        ├── Pagination (prev/next with nextToken)
        └── ExportButton (CSV download)
```

### 5.2 Standalone Analytics Audit Section

The Analytics page (`/analytics`) also embeds an audit log table using the same `AuditLogPanel` component.

---

## 6. Access Control

| Role | View Audit Logs | Filter by User | Export CSV |
|---|---|---|---|
| Admin | Yes — full access | Yes | Yes |
| Manager | Yes — full access | Yes | Yes |
| Technician | No | No | No |
| Viewer | No | No | No |
| CustomerAdmin | No | No | No |

Authorization is enforced at two levels:
1. **AppSync resolver:** `listAuditLogs` and `getAuditLogsByUser` check `ctx.identity.groups` contains "Admin" or "Manager"
2. **Frontend:** Audit Log tab is hidden from unauthorized roles via `useAuth()` group check

---

## 7. CSV Export Format

```csv
User,Action,ResourceType,ResourceId,Timestamp,IPAddress,Status
sarah@example.com,Created,Firmware,FW#abc123,2026-03-15T10:30:00Z,203.0.113.42,Success
raj@example.com,Modified,Device,DEV#def456,2026-03-15T10:28:00Z,203.0.113.43,Success
```

Filename pattern: `audit-log-{startDate}-to-{endDate}.csv`

---

## 8. DynamoDB Stream Configuration (Terraform)

```hcl
resource "aws_dynamodb_table" "data_table" {
  # ... existing config
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_lambda_event_source_mapping" "audit_stream" {
  event_source_arn  = aws_dynamodb_table.data_table.stream_arn
  function_name     = aws_lambda_function.audit_processor.arn
  starting_position = "TRIM_HORIZON"
  batch_size        = 25
  maximum_retry_attempts = 3
}
```

---

## 9. Error Handling

| Scenario | Behavior |
|---|---|
| Lambda PutItem fails | Retry up to 3 times (built-in stream retry) |
| Batch partially fails | Remaining records in batch are retried |
| All retries exhausted | Record is lost (acceptable for POC; production adds DLQ) |
| Stream disabled | No audit logs generated; existing logs still queryable |
| TTL deletes old record | Expected behavior — 90-day retention policy |
