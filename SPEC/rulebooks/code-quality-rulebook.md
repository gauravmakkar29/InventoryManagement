# Rulebook: Code Quality Standards

> Component architecture, file size limits, and patterns for the IMS Gen2 frontend.
> This rulebook is enforced by ESLint, pre-commit hooks, and CI.

---

## File Size Limits

| Threshold     | Action                             |
| ------------- | ---------------------------------- |
| **400 lines** | Warning — consider splitting       |
| **600 lines** | Block — must refactor before merge |

Applies to all `.ts` and `.tsx` files in `src/`.

---

## Component Architecture

### Single Responsibility

Each component file should do ONE thing:

- **Page component**: Layout + composition of child components
- **Feature component**: One feature (e.g., FirmwareUpload, not FirmwareUpload + VulnerabilityTracker + AuditLog)
- **Shared component**: Reusable UI element (Badge, StatusChip, DataTable)

### File Organization

```
src/app/components/{module}/
  {Module}Page.tsx          — Page layout, tab routing (max 200 lines)
  {Feature}.tsx             — Individual feature (max 400 lines)
  use-{feature}.ts          — Custom hook for data/state (max 200 lines)

src/app/components/shared/
  StatusBadge.tsx           — Reusable badge component
  DataTable.tsx             — Shared table with sorting/pagination
  ErrorState.tsx            — Error fallback UI
  LoadingState.tsx          — Loading skeleton UI
```

### Anti-Patterns (Do Not)

- Do NOT embed mock data in components — use `src/lib/mock-data/`
- Do NOT have 10+ useState in one component — extract to custom hook
- Do NOT duplicate badge/status rendering — use shared components
- Do NOT mix data fetching with rendering — use custom hooks
- Do NOT skip ErrorBoundary — wrap at layout level minimum

---

## Custom Hooks Pattern

```typescript
// src/lib/hooks/use-devices.ts
export function useDevices(filters?: DeviceFilters) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch, filter, sort logic here
  // Return { devices, loading, error, refetch }
}
```

Every async data source should have a hook returning: `{ data, loading, error, refetch }`.

---

## Accessibility (WCAG 2.1 AA)

### Required on Every Component

- Images: `alt` attribute (descriptive or `alt=""` for decorative + `aria-hidden="true"`)
- Form inputs: `<label htmlFor={id}>` or `aria-label`
- Form errors: `role="alert"` + `aria-describedby` linked to input
- Interactive elements: keyboard accessible (Enter/Space triggers action)
- Color: 4.5:1 contrast ratio for normal text, 3:1 for large text

### Required on Modals/Dialogs

- Focus trap (Radix Dialog provides this — verify it's not bypassed)
- `aria-modal="true"` + `role="dialog"`
- Escape key closes
- Focus returns to trigger element on close

### Required on Loading States

- `aria-busy="true"` on container
- Screen reader announcement via `aria-live="polite"` region

### Enforced by

- `eslint-plugin-jsx-a11y` in ESLint config (errors block CI)
- Pre-commit hook runs ESLint on staged files

---

## Error Handling Pattern

```typescript
// Root level
<ErrorBoundary fallback={<ErrorState />}>
  <App />
</ErrorBoundary>

// Component level
try {
  await api.createDevice(data);
  toast.success("Device created");
} catch (err) {
  toast.error("Failed to create device");
}
```

Every async operation must handle: loading → success → error.

---

## Performance

- `React.memo` on pure display components (badges, cards, table rows)
- `useMemo` for filtered/sorted lists, chart data computations
- `useCallback` for event handlers passed to child components
- Virtualize tables with 50+ rows (`@tanstack/react-virtual`)
- No inline object/array creation in JSX props

---

## Testing

- 85% coverage on new/modified code
- Co-locate tests: `src/__tests__/{module}/{Component}.test.tsx`
- Use React Testing Library — test behavior, not implementation
- Every user-facing feature needs at least one integration test

---

## Naming

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Hooks: `use-{name}.ts` → `useName()`
- Types: `PascalCase` in `src/lib/types.ts`
- Shared components: `src/app/components/shared/`
