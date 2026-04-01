# ADR-001: Use TanStack Query for Server State

**Status:** Accepted
**Date:** 2026-04-01

## Context

The app needs to fetch data from APIs (AppSync, REST, etc.) and manage loading, error, caching, and revalidation states. Manual `useState` + `useEffect` patterns led to duplicated boilerplate, no caching, and inconsistent error handling across 10+ data hooks.

## Decision

Use **TanStack Query (React Query v5)** for all server state management — data that originates from an API.

- `useQuery` for reads (devices, firmware, compliance, etc.)
- `useMutation` for writes (create order, upload firmware, etc.)
- Centralized `QueryClient` with enterprise defaults (5min stale, 30min GC, 2 retries)
- Query key factory in `src/lib/query-keys.ts` for type-safe cache invalidation

Client-only state (UI toggles, sidebar, filters) stays in Zustand or `useState`.

## Consequences

**Easier:**

- Automatic caching — no duplicate API calls
- Background revalidation on window focus
- Optimistic updates with rollback
- DevTools for debugging cache state
- Consistent loading/error patterns across all pages

**Harder:**

- Learning curve for developers unfamiliar with TanStack Query
- Must distinguish server state (Query) from client state (Zustand/useState)

## Alternatives Considered

- **SWR** — Similar but fewer features (no mutation management, no devtools)
- **Redux Toolkit Query** — Heavier, requires Redux boilerplate
- **Manual useState/useEffect** — Current approach; no caching, lots of boilerplate
