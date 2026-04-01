# Architecture Decision Records (ADRs)

This directory contains architectural decisions made during IMS Gen2 development.

Each ADR documents **why** a decision was made — not just what.

## Index

| #   | Title                                                                                 | Status   | Date       |
| --- | ------------------------------------------------------------------------------------- | -------- | ---------- |
| 001 | [Use TanStack Query for server state](./001-tanstack-query.md)                        | Accepted | 2026-04-01 |
| 002 | [Use Zustand for client state](./002-zustand.md)                                      | Accepted | 2026-04-01 |
| 003 | [Provider abstraction layer for cloud-agnostic design](./003-provider-abstraction.md) | Accepted | 2026-04-01 |
| 004 | [Tailwind CSS + shadcn/ui for styling](./004-tailwind-shadcn.md)                      | Accepted | 2026-04-01 |
| 005 | [CSS variables for theming (not hardcoded colors)](./005-css-theme-tokens.md)         | Accepted | 2026-04-01 |

## ADR Template

```markdown
# ADR-NNN: Title

**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** YYYY-MM-DD

## Context

What is the issue that we're seeing that is motivating this decision?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

## Alternatives Considered

What other approaches were evaluated?
```
