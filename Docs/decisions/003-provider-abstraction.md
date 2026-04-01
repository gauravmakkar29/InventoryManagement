# ADR-003: Provider Abstraction Layer for Cloud-Agnostic Design

**Status:** Accepted
**Date:** 2026-04-01

## Context

The app targets multiple deployment scenarios: AWS (Amplify Gen2, CDK, Terraform), Azure, or local development with mock data. Hardcoding cloud SDK calls in components would make the app vendor-locked and untestable without cloud resources.

## Decision

Create a **provider abstraction layer** in `src/lib/providers/`:

- `IApiProvider` — 35-method interface matching all API operations
- `IStorageProvider` — key-value persistence abstraction
- `AuthProvider` — React component (not plain object) since auth is stateful
- `ProviderRegistry` — single context wrapping auth + API + storage
- `platform.config.ts` — reads `VITE_PLATFORM` env var, returns concrete adapters

Mock adapters wrap existing code. Future cloud adapters implement the same interfaces.

## Consequences

**Easier:**

- Swap cloud provider by changing ONE env var
- Local development with mock data — no cloud account needed
- Unit testing with mock providers — no network calls
- New cloud adapters are additive (new files, not modifications)

**Harder:**

- API interface is large (35 methods) — must be maintained as features grow
- Auth as a component (not object) is less intuitive but necessary for React state management

## Alternatives Considered

- **Direct SDK imports** — Simpler initially but vendor-locked
- **Generic query/mutate interface** — Loses type safety
- **Separate contexts per provider** — Context nesting explosion
