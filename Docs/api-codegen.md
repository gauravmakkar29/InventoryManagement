# API Code Generation

This document describes the API schema infrastructure and code generation process for IMS Gen 2.

## Overview

The API shape is defined in two schema formats that serve as the single source of truth:

| Schema      | Location                        | Purpose                                      |
| ----------- | ------------------------------- | -------------------------------------------- |
| GraphQL     | `src/lib/schema/schema.graphql` | Primary schema for AppSync/GraphQL consumers |
| OpenAPI 3.0 | `src/lib/schema/openapi.yaml`   | REST equivalent for teams using REST APIs    |

Both schemas mirror the `IApiProvider` interface defined in `src/lib/providers/types.ts`.

## Generated Types

Generated TypeScript types are committed to the repository at:

```
src/lib/schema/generated/
  graphql.ts      — Types generated from the GraphQL schema
```

Generated code IS committed (not runtime generation) so that:

- CI builds do not require codegen tools
- Type changes are visible in pull request diffs
- Developers without codegen installed can still build the project

## How to Regenerate

### GraphQL Types

```bash
npm run codegen
```

This uses `@graphql-codegen/cli` with the config in `codegen.ts` to read `schema.graphql` and output TypeScript types to `src/lib/schema/generated/graphql.ts`.

### OpenAPI Types

```bash
npm run codegen:openapi
```

This uses `openapi-typescript` to read `openapi.yaml` and output TypeScript types to `src/lib/schema/generated/openapi.ts`.

## When to Regenerate

Regenerate after any of these changes:

1. **New API operation** added to `IApiProvider` in `src/lib/providers/types.ts`
2. **Schema field changes** (added/removed/renamed fields on any entity)
3. **New entity types** added to the domain model in `src/lib/types.ts`
4. **Enum value changes** in `src/lib/types.ts`

## Relationship to IApiProvider

The type flow is:

```
schema.graphql / openapi.yaml   (source of truth for API shape)
        |
        v
  npm run codegen               (generate TypeScript types)
        |
        v
  generated/graphql.ts          (generated types — committed)
        |
        v
  src/lib/providers/types.ts    (IApiProvider interface — hand-maintained)
        |
        v
  src/lib/hlm-api.ts            (stub implementation)
  src/lib/providers/mock/       (mock adapter)
  src/lib/providers/aws/        (AWS adapter — future)
```

When adding a new API operation:

1. Add the operation to `schema.graphql` (Query or Mutation)
2. Add corresponding path to `openapi.yaml`
3. Run `npm run codegen` to regenerate types
4. Add the method signature to `IApiProvider` in `types.ts`
5. Implement in `hlm-api.ts` and any active adapters

## Codegen Configuration

The GraphQL codegen config is in `codegen.ts` at the project root:

- **Schema source:** `src/lib/schema/schema.graphql`
- **Output:** `src/lib/schema/generated/graphql.ts`
- **Plugins:** `typescript`, `typescript-operations`
- **Settings:** enums as union types, no `__typename`, interfaces for object types

## Required Dev Dependencies

```json
{
  "@graphql-codegen/cli": "^5.x",
  "@graphql-codegen/typescript": "^4.x",
  "@graphql-codegen/typescript-operations": "^4.x",
  "openapi-typescript": "^7.x"
}
```

## CI Integration

The CI pipeline should verify that generated types are up to date:

```yaml
- name: Verify codegen is current
  run: |
    npm run codegen
    git diff --exit-code src/lib/schema/generated/
```

If this step fails, the developer forgot to regenerate after a schema change.
