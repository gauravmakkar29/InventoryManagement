# Story 20.8: CDC Event Provider Interface + DDB Streams Adapter

**Epic:** Epic 20 — Pluggable External Integrations & Firmware Lifecycle
**Phase:** PHASE 3: OBSERVABILITY
**Persona:** Justin (DevOps) / Template Consumer
**Priority:** P1
**Story Points:** 5
**Status:** New
**GitHub Issue:** #390
**Target URL:** N/A (library + backend pattern — minimal UI)

## User Story

As a platform developer, I want a pluggable `ICDCProvider` interface with a DynamoDB Streams adapter, so that every data change in the system is captured for audit, and the template supports alternative CDC sources (Kinesis, EventBridge, Kafka).

## Preconditions

- DynamoDB Streams is a feature of DynamoDB (not a separate service — per Prince's clarification in standup)
- Epic 8 audit trail infrastructure exists
- Lambda trigger pattern for DDB Streams is established

## Context / Business Rules

- **CDC requirement (Abdul):** "We want to track every single change in the system and put that in another table in DynamoDB." This is the auditability backbone for NIST compliance.
- **DDB Streams → Lambda → Audit table:** Stream fires on any DynamoDB insert/update/delete. Lambda processes the event and writes to an audit table. No Kinesis needed for initial implementation.
- **Frontend subscription:** The interface supports real-time event subscriptions so the UI can show live updates (e.g., firmware status changed, new deployment completed).
- **Pluggable CDC:** The interface abstracts the event source. DDB Streams is the default adapter. Future adapters: Kinesis, EventBridge, Kafka, or a generic webhook source.

## Acceptance Criteria

- [ ] AC1: `ICDCProvider` interface defined in `src/lib/providers/types.ts` with methods: `subscribe(entityType, callback)`, `unsubscribe(subscriptionId)`, `getChangeHistory(entityId, timeRange)`, `listRecentChanges(entityType, limit)`, `getChangeStats(timeRange)`
- [ ] AC2: Generic types: `CDCEvent` (entityType, entityId, action: create/update/delete, oldValue, newValue, changedBy, timestamp), `CDCSubscription`, `CDCChangeStats`, `CDCProviderConfig`
- [ ] AC3: `MockCDCProvider` in `src/lib/providers/mock/mock-cdc-provider.ts` — simulates change events with configurable interval, returns realistic audit history
- [ ] AC4: `DDBStreamsCDCProvider` in `src/lib/providers/aws-amplify/amplify-cdc-provider.ts` — subscribes to AppSync real-time subscriptions that are triggered by DDB Streams → Lambda → AppSync mutation
- [ ] AC5: `PlatformConfig` extended with `cdc: ICDCProvider`
- [ ] AC6: `useCDCEvents()` hook with real-time subscription support (auto-subscribe on mount, cleanup on unmount)
- [ ] AC7: Unit tests ≥ 85% for mock adapter including subscription lifecycle

## Out of Scope

- Lambda function for DDB Streams processing (infra layer — Epic 17)
- Kinesis, EventBridge, or Kafka adapters (future)
- Audit log UI (Epic 8 already covers this — this story provides the data feed)
- CDC-triggered notifications (Story 20.9 or notification system)

## Dev Checklist (NOT for QA)

1. Add `ICDCProvider` + types to `src/lib/providers/types.ts`
2. Create `src/lib/providers/mock/mock-cdc-provider.ts`
3. Create `src/lib/providers/aws-amplify/amplify-cdc-provider.ts`
4. Extend `PlatformConfig` with `cdc` field
5. Create `src/lib/hooks/use-cdc-events.ts`
6. Wire mock adapter in `platform.config.ts`
7. Write unit tests for mock adapter and subscription lifecycle

## AutoGent Test Prompts

1. **AC1-AC2 — Interface contract:** "Import ICDCProvider. Verify 5 methods. Verify CDCEvent has: entityType, entityId, action (enum: create/update/delete), oldValue, newValue, changedBy, timestamp."

2. **AC3 — Mock subscription:** "Create MockCDCProvider. Call subscribe('firmware', callback). Verify callback is invoked within 5 seconds with a CDCEvent for firmware entity. Call unsubscribe(). Verify no more events are received."

3. **AC3 — Change history:** "Call getChangeHistory('fw-001', { start: '2026-01-01', end: '2026-04-06' }). Verify at least 3 change events returned. Verify events are ordered by timestamp descending."

4. **AC6 — Hook lifecycle:** "Render a component using useCDCEvents('firmware'). Verify it auto-subscribes on mount. Verify events appear in the hook's data array. Unmount the component. Verify unsubscribe is called (no memory leaks)."

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (≥ 85% coverage on new code)
- [ ] No vendor-specific imports in interface file
- [ ] Subscription cleanup verified (no memory leaks)
- [ ] TypeScript strict — no `any` types
- [ ] Compliance check green
