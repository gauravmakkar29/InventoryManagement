/**
 * IMS Gen 2 — Audit Stream Processor (Lambda)
 *
 * Processes DynamoDB Streams events and writes structured AUDIT# records
 * back to the same table for compliance audit trail.
 *
 * Story 8.1: Audit Stream Lambda Processor (#13)
 *
 * Key behaviors:
 * - Skips AUDIT# and NOTIF# records to prevent infinite loops
 * - Maps INSERT/MODIFY/REMOVE to Created/Modified/Deleted actions
 * - Extracts entity type from PK prefix
 * - Sets 90-day TTL for automatic record expiry (NIST AU-12)
 * - Retries up to 3 times via DynamoDB Streams retry config
 */

import type { DynamoDBStreamEvent, DynamoDBRecord } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

/** 90 days in seconds */
const TTL_DAYS = 90;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;

/**
 * Prefixes to skip — prevents infinite loop when audit/notification
 * records are written back to the same table.
 */
const SKIP_PREFIXES = ["AUDIT#", "NOTIF#"];

/**
 * Maps DynamoDB Stream event names to human-readable audit actions.
 */
function mapEventAction(eventName: string | undefined): string {
  switch (eventName) {
    case "INSERT":
      return "Created";
    case "MODIFY":
      return "Modified";
    case "REMOVE":
      return "Deleted";
    default:
      return "Unknown";
  }
}

/**
 * Extracts a human-readable entity type from the DynamoDB PK prefix.
 */
function extractEntityType(pk: string): string {
  const prefix = pk.split("#")[0];
  const entityMap: Record<string, string> = {
    DEV: "Device",
    FW: "Firmware",
    SO: "ServiceOrder",
    COMP: "Compliance",
    VULN: "Vulnerability",
    CUST: "Customer",
    USER: "User",
  };
  return entityMap[prefix] || "Unknown";
}

/**
 * Determines whether a stream record should be skipped to prevent
 * infinite loop processing (audit writing audit, etc.).
 */
function shouldSkipRecord(record: DynamoDBRecord): boolean {
  const pk = record.dynamodb?.Keys?.PK?.S;
  if (!pk) return true;
  return SKIP_PREFIXES.some((prefix) => pk.startsWith(prefix));
}

/**
 * Extracts the userId from the DynamoDB image (new or old).
 * Falls back to "SYSTEM" if no user attribution is found.
 */
function extractUserId(record: DynamoDBRecord): string {
  const image = record.dynamodb?.NewImage || record.dynamodb?.OldImage;
  if (!image) return "SYSTEM";
  return image.userId?.S || image.uploadedBy?.S || image.assignedTo?.S || "SYSTEM";
}

/**
 * Builds and writes a single audit log entry to DynamoDB.
 */
async function writeAuditEntry(record: DynamoDBRecord): Promise<void> {
  const keys = record.dynamodb?.Keys;
  const resourcePK = keys?.PK?.S || "UNKNOWN";
  const action = mapEventAction(record.eventName);
  const entityType = extractEntityType(resourcePK);
  const userId = extractUserId(record);

  const auditId = randomUUID();
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + TTL_SECONDS;

  await client.send(
    new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: { S: `AUDIT#${auditId}` },
        SK: { S: `AUDIT#${auditId}` },
        entityType: { S: "AuditLog" },
        action: { S: action },
        resourceType: { S: entityType },
        resourceId: { S: resourcePK },
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
    }),
  );
}

/**
 * Lambda handler — entry point for DynamoDB Stream events.
 *
 * Processes each record in the batch:
 * 1. Skips AUDIT# and NOTIF# records (infinite loop prevention)
 * 2. Maps the stream event to a structured audit log entry
 * 3. Writes the audit entry back to the same DynamoDB table
 *
 * Retry behavior: DynamoDB Streams retries the entire batch up to 3 times
 * (configured in the event source mapping). Individual record failures
 * cause the batch to be retried.
 */
export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const records = event.Records || [];
  let processed = 0;
  let skipped = 0;

  for (const record of records) {
    if (shouldSkipRecord(record)) {
      skipped++;
      continue;
    }

    await writeAuditEntry(record);
    processed++;
  }

  // Structured logging for CloudWatch
  console.info(
    JSON.stringify({
      message: "Audit stream batch complete",
      totalRecords: records.length,
      processed,
      skipped,
    }),
  );
};
