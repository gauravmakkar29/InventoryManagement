# ADR-005: CSS Variables for Theming (Not Hardcoded Colors)

**Status:** Accepted
**Date:** 2026-04-01

## Context

Brand colors (`#FF7900`, `#c2410c`) were hardcoded across 50+ component files as Tailwind arbitrary values (`text-[#c2410c]`, `bg-[#FF7900]`). Changing the brand required editing every file. Dark mode needed duplicate color definitions.

## Decision

Centralize ALL brand colors as **CSS custom properties** in `src/index.css` and reference them via Tailwind theme tokens:

```css
/* index.css */
--color-accent: #ff7900; /* Button backgrounds */
--color-accent-hover: #e86e00; /* Button hover */
--color-accent-text: #c2410c; /* Text links, active tabs */
--color-accent-text-hover: #9a3412;
```

```tsx
/* Components use tokens, not hex values */
className = "text-accent-text hover:text-accent-text-hover";
className = "bg-accent hover:bg-accent-hover";
```

Dark mode overrides the same variables — components don't change.

## Consequences

**Easier:**

- Change brand color in ONE place → entire app updates
- Dark mode is automatic (CSS variables swap in `.dark` class)
- White-labeling: customer provides colors, drop into CSS
- WCAG contrast audit: check one file, not 50

**Harder:**

- Developers must use `text-accent-text` not `text-[#c2410c]`
- New token names to learn (accent vs accent-text vs accent-hover)

## Alternatives Considered

- **Tailwind config extend** — Works for static colors but CSS variables support runtime theming
- **CSS-in-JS theming** — Runtime overhead, not compatible with Tailwind utility approach
- **Hardcoded hex values** — Previous approach; 50+ files to edit per brand change
