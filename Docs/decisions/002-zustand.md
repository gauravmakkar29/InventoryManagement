# ADR-002: Use Zustand for Client State

**Status:** Accepted
**Date:** 2026-04-01

## Context

Cross-component UI state (sidebar collapse, notification panel, user preferences) was managed via `localStorage` + `useState` with prop drilling. This led to scattered persistence logic and components tightly coupled to layout.

## Decision

Use **Zustand** for global client state — UI state that doesn't come from an API.

- `src/stores/ui-store.ts` — sidebar, notification panel, layout preferences
- Zustand `persist` middleware for localStorage persistence
- `partialize` to persist only relevant fields (not transient UI state)

Rule: **Server data → TanStack Query. UI state → Zustand or useState.**

## Consequences

**Easier:**

- Any component can read sidebar state without prop drilling
- Persistence is declarative (middleware, not manual localStorage calls)
- DevTools integration for debugging
- Tiny bundle size (~1KB)

**Harder:**

- Must decide if state belongs in Query vs Zustand vs local useState
- Team must follow the convention consistently

## Alternatives Considered

- **Redux Toolkit** — More ecosystem support but 5x more boilerplate for same result
- **Jotai** — Atomic model; good for complex derived state, overkill for our needs
- **React Context** — Built-in but causes unnecessary re-renders without careful memoization
