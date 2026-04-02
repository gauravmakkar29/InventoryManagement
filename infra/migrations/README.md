# IMS Gen 2 — DynamoDB Schema Migration Strategy

## Overview

DynamoDB is schemaless at the database level, but the application enforces a logical schema through TypeScript interfaces. As the data model evolves across releases, items written by older versions may lack new fields or have different structures. This migration framework provides a safe, versioned approach to evolving the schema without data loss or downtime.

## Key Concepts

### Schema Version (`_schemaVersion`)

Every DynamoDB item carries a `_schemaVersion` field (integer). Items written before versioning was introduced have an implicit version of `0`. The current schema version is tracked in `registry.ts`.

### Migration Files

Each migration is a TypeScript file in this directory following the naming convention:

```
NNN-short-description.ts
```

For example: `001-add-schema-version.ts`, `002-add-device-region.ts`

Each migration exports an object implementing the `Migration` interface:

```typescript
interface Migration {
  version: number;          // Target version after applying this migration
  name: string;             // Kebab-case identifier
  description: string;      // Human-readable description
  up: (item) => item;       // Forward transform (version N-1 → N)
  down: (item) => item;     // Rollback transform (version N → N-1)
}
```

### Migration Registry (`registry.ts`)

Central file that imports all migration files and exports them as an ordered array. The runner and lazy migration layer both reference this registry.

### Migration Runner (`runner.ts`)

Lambda-compatible module that:

1. Scans all items in configured DynamoDB tables
2. Checks each item's `_schemaVersion`
3. Applies pending migrations in order
4. Writes updated items back in batches
5. Logs progress (percentage complete) for monitoring
6. Handles errors per-item (does not abort the entire run on individual failures)

### Lazy Migration (`src/lib/schema-migration.ts`)

Frontend/API-layer module that migrates items on-read. When the application reads an item from DynamoDB, it calls `migrateItem()` to transparently upgrade it to the current schema version. This enables zero-downtime migration — items upgrade lazily as they are accessed.

## Migration Strategy: Dual Approach

We use **two complementary strategies**:

| Strategy | When | How | Speed |
|---|---|---|---|
| **Batch Runner** | During deployment | Lambda scans all items | Fast, complete |
| **Lazy Migration** | At read-time | `migrateItem()` in API layer | Gradual, zero-downtime |

**Recommended flow for a new release:**

1. Deploy new code with lazy migration support (reads handle old + new schema)
2. Run batch migration Lambda to upgrade all items
3. Verify via CloudWatch metrics that all items are at the target version
4. Remove backward-compatibility code in the next release

## How to Write a New Migration

1. **Create the migration file:**
   ```
   infra/migrations/NNN-short-description.ts
   ```

2. **Implement `up` and `down` transforms:**
   ```typescript
   import type { Migration } from "./registry";

   export const migrationNNN: Migration = {
     version: N,
     name: "short-description",
     description: "What this migration does",
     up(item) {
       return { ...item, newField: "defaultValue", _schemaVersion: N };
     },
     down(item) {
       const { newField: _, ...rest } = item;
       return { ...rest, _schemaVersion: N - 1 };
     },
   };
   ```

3. **Register in `registry.ts`:**
   ```typescript
   import { migrationNNN } from "./NNN-short-description";
   export const MIGRATIONS: readonly Migration[] = [migration001, ..., migrationNNN];
   ```

4. **Mirror in `src/lib/schema-migration.ts`:**
   Add the same `up`/`down` logic to the `LAZY_MIGRATIONS` array.

5. **Update `src/lib/types.ts`:**
   Add/modify the field in the relevant TypeScript interface.

6. **Write unit tests** for both the infra migration and the lazy migration.

7. **Update the compatibility matrix** in `Docs/schema-versioning.md`.

## Design Principles

- **Idempotent**: Migrations can be re-run safely. `up` checks if the transform has already been applied.
- **Reversible**: Every migration has a `down` function for rollback.
- **Non-destructive**: Migrations never delete data — they add, rename, or restructure.
- **Decoupled from infra**: The runner accepts a `DynamoAdapter` interface, not a concrete AWS SDK import, enabling testing with mocks.
- **Progressive**: The lazy migration layer ensures the app works with items at any schema version.
