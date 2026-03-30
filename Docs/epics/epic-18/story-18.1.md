# Story 18.1: OSIS Pipeline & Data Sync Verification

**Epic:** Epic 18 — OpenSearch & Global Search
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story

As a Platform Admin, I want all DynamoDB data to be automatically synced to OpenSearch via the OSIS pipeline, so that the search index is always up-to-date and reflects the current state of all devices, firmware, service orders, and other entities.

## Acceptance Criteria

- [x] AC1: When the OSIS pipeline is deployed and running, all existing DynamoDB records are indexed in OpenSearch via the initial export (backfill)
- [x] AC2: When a new device is created in DynamoDB, it appears in OpenSearch search results within 60 seconds
- [x] AC3: When a device's status is updated in DynamoDB (e.g., Online to Offline), the updated status is reflected in OpenSearch search results within 60 seconds
- [x] AC4: When a record is deleted from DynamoDB, it is removed from the OpenSearch index within 60 seconds
- [x] AC5: When I view the admin system status, I can see the OSIS pipeline health: running/stopped, records processed, lag time
- [x] AC6: When the OSIS pipeline encounters an error (e.g., malformed record), it logs the error and continues processing remaining records without stopping

## UI Behavior

- Pipeline health is displayed in the System Status section of the dashboard (for Admin and Manager roles)
- Status card shows: pipeline state (Running/Stopped/Error), records synced (last hour), current lag (seconds behind real-time)
- If lag exceeds 5 minutes, the status card turns amber; if pipeline is stopped, it turns red
- A "Reindex" button (Admin only) triggers a full re-export and re-index from DynamoDB

## Out of Scope

- Custom index mapping changes (uses default OSIS pipeline mappings)
- Manual record-level sync (sync is automatic and continuous)
- OpenSearch dashboard access (Kibana)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for OSIS pipeline configuration, index mapping, and sync behavior.

## Definition of Done

- [x] Code reviewed and approved
- [x] Unit tests passing (>=85% coverage on new code)
- [x] E2E tests passing
- [x] Compliance check green
