# IMS Gen 2 — Data Schema Versioning Strategy

## Overview

This document describes the schema versioning strategy for IMS Gen 2's DynamoDB data model. The strategy enables safe schema evolution across releases without data loss or downtime.

## Schema Version Tracking

Every DynamoDB item includes a `_schemaVersion` field (integer) that tracks which version of the schema the item conforms to. Items written before versioning was introduced have an implicit version of `0`.

### Versioned Entity Types

| Entity | Table | Description |
|---|---|---|
| Device | `ims-devices` | Hardware inventory items |
| Firmware | `ims-firmware` | Firmware packages and deployment records |
| ServiceOrder | `ims-service-orders` | Field service work orders |
| Compliance | `ims-compliance` | Compliance audit records |
| Vulnerability | `ims-vulnerabilities` | CVE tracking and patch status |
| AuditLog | `ims-audit-logs` | System audit trail |

## Migration Approach

### Dual Strategy

IMS Gen 2 uses two complementary migration strategies:

1. **Batch Migration (Lambda Runner)** — Runs during deployment windows to migrate all items in bulk. Located at `infra/migrations/runner.ts`.

2. **Lazy Migration (On-Read)** — Transparently upgrades items when read by the API layer. Located at `src/lib/schema-migration.ts`.

### Deployment Sequence

```
1. Deploy new app code (includes lazy migration for old → new schema)
2. App serves traffic — old items are migrated lazily on read
3. Run batch migration Lambda to upgrade remaining unread items
4. Monitor CloudWatch — verify 100% of items are at target version
5. Next release can remove backward-compatibility code
```

### Rollback Procedure

```
1. Run batch migration Lambda with direction: "down" and targetVersion: N-1
2. Deploy previous app version
3. Verify item schema versions match the rolled-back code
```

## Compatibility Matrix

| App Version | API Version | Schema Version | Notes |
|---|---|---|---|
| 0.1.0 | v1 | 0 (implicit) | Initial release, no schema versioning |
| 0.2.0 | v1 | 1 | Schema versioning introduced; `_schemaVersion` field added |

### Compatibility Rules

- **App version N** MUST be able to read schema versions **N** and **N-1** (one-version backward compatibility).
- **Schema version N** items are written by app version **N** and the batch migration runner.
- **Lazy migration** handles reading schema version **N-1** items and upgrading them to **N** transparently.
- **Breaking changes** (removing a field, changing a field type) require a two-release migration:
  1. Release N: Add new field, start writing both old and new
  2. Release N+1: Remove old field, batch-migrate any remaining items

## Migration History

| Version | Migration | Description | Release |
|---|---|---|---|
| 1 | `001-add-schema-version` | Bootstrap: adds `_schemaVersion: 1` to all items | 0.2.0 |

## Writing New Migrations

See `infra/migrations/README.md` for detailed instructions on creating a new migration.

### Checklist for New Migrations

- [ ] Create migration file: `infra/migrations/NNN-description.ts`
- [ ] Register in `infra/migrations/registry.ts`
- [ ] Mirror in `src/lib/schema-migration.ts` (lazy migration array)
- [ ] Update TypeScript interfaces in `src/lib/types.ts`
- [ ] Write unit tests for `up` and `down` transforms
- [ ] Update compatibility matrix in this document
- [ ] Test with batch runner against a staging table
- [ ] Verify lazy migration works with mixed-version items

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  App (React/API)                     │
│                                                      │
│  ┌──────────────────┐    ┌────────────────────────┐ │
│  │   API Client      │───▶│  migrateItem<T>()      │ │
│  │   (hlm-api.ts)    │    │  (schema-migration.ts) │ │
│  └──────────────────┘    └────────────────────────┘ │
│           │                         │                │
│           ▼                         ▼                │
│  ┌──────────────────┐    ┌────────────────────────┐ │
│  │   DynamoDB        │    │  Lazy Migration        │ │
│  │   (AppSync)       │    │  (on-read upgrade)     │ │
│  └──────────────────┘    └────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Batch Migration (Lambda)                 │
│                                                      │
│  ┌──────────────────┐    ┌────────────────────────┐ │
│  │   runner.ts       │───▶│  registry.ts           │ │
│  │   (scan + apply)  │    │  (migration list)      │ │
│  └──────────────────┘    └────────────────────────┘ │
│           │                                          │
│           ▼                                          │
│  ┌──────────────────┐                               │
│  │   DynamoDB        │                               │
│  │   (direct write)  │                               │
│  └──────────────────┘                               │
└─────────────────────────────────────────────────────┘
```

## NIST 800-53 Compliance

Schema migrations are logged in the audit trail (AU-2, AU-3) and follow the change management process (CM-3). The batch runner produces structured JSON logs compatible with CloudWatch and the IMS audit pipeline.
