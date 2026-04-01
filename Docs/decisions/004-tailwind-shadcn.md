# ADR-004: Tailwind CSS + shadcn/ui for Styling

**Status:** Accepted
**Date:** 2026-04-01

## Context

Enterprise apps need consistent, accessible, performant UI components. Building a custom design system from scratch takes months. CSS-in-JS solutions (styled-components, Emotion) add runtime overhead and bundle size.

## Decision

Use **Tailwind CSS v4** for utility-first styling and **shadcn/ui** (Radix primitives) for accessible component patterns.

- Tailwind utilities only — no custom CSS except `index.css` design tokens
- shadcn/ui components copied into codebase (not npm dependency) — full control
- Skeleton component for loading states
- `cn()` utility (clsx + tailwind-merge) for conditional classes

## Consequences

**Easier:**

- Zero-runtime CSS — all styles compiled at build time
- Consistent spacing, colors, typography via Tailwind config
- Accessible primitives from Radix (focus management, ARIA, keyboard)
- Tree-shaking removes unused styles automatically

**Harder:**

- Long className strings can be hard to read
- Team must learn Tailwind utility naming
- No visual component library (Storybook planned in Story #201)

## Alternatives Considered

- **Material UI** — Opinionated design, large bundle, hard to customize
- **Ant Design** — Enterprise-focused but heavy, Chinese-first documentation
- **CSS Modules** — Good isolation but verbose, no utility shortcuts
- **styled-components** — Runtime CSS-in-JS, bundle overhead
