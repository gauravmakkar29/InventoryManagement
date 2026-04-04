# /review-performance — Performance Audit

**Usage:** `/review-performance` or `/review-performance src/app/components/dashboard/`

**Argument:** `$ARGUMENTS` (optional — specific module to audit. Defaults to full `src/`)

---

## Instructions

You are a **React Performance Optimization Expert** auditing the IMS Gen2 platform.

1. **Read** the rulebook: `SPEC/rulebooks/performance-rulebook.md`
2. **Scope** the audit to `$ARGUMENTS` if provided, otherwise audit all of `src/`

---

## Audit Checklist

### 1. Re-Render Analysis

- Find components with excessive re-renders (inline objects/arrays in JSX props)
- Check memoization: are `React.memo`, `useMemo`, `useCallback` used appropriately?
- Identify unnecessary re-renders from parent state changes

```bash
# Inline objects in JSX (potential re-render triggers)
grep -rn "={{" src/app/components/ --include="*.tsx" | grep -v "className\|style=" | head -30

# Memoization usage
grep -c "React\.memo\|useMemo\|useCallback" src/app/components/**/*.tsx | grep -v ":0$"
```

### 2. Bundle Size

- Check for heavy dependencies imported eagerly
- Verify route-level code splitting (React.lazy)
- Look for full library imports instead of tree-shaken imports

```bash
# Check lazy loading
grep -rn "React\.lazy" src/app/
grep -rn "import.*from" src/app/App.tsx | head -30

# Full library imports (bad)
grep -rn "import \* as" src/ --include="*.ts" --include="*.tsx"
```

### 3. List Performance

- Tables with 50+ rows — are they virtualized?
- Search/filter — is input debounced?
- Pagination — cursor-based or offset?

```bash
# Debounce usage
grep -rn "debounce\|useDebounce\|useDebouncedValue" src/

# Virtualization
grep -rn "useVirtualizer\|react-virtual\|react-window" src/
```

### 4. API Performance

- Are independent API calls parallelized (`Promise.all`)?
- Is there unnecessary sequential fetching?
- Are inflight requests cancelled on unmount (`AbortController`)?
- Is data prefetched on hover for navigation targets?

```bash
# AbortController usage
grep -rn "AbortController\|signal" src/lib/ src/app/

# Prefetch patterns
grep -rn "prefetchQuery" src/
```

### 5. Image & Asset Performance

- Images: do they have explicit width/height?
- Are below-fold images lazy-loaded?
- Are large assets (icons, fonts) optimized?

### 6. Animation Performance

- Are only `transform` and `opacity` animated?
- Are transitions 150-200ms as per design standards?
- Is `prefers-reduced-motion` respected?

```bash
grep -rn "prefers-reduced-motion" src/
grep -rn "transition-duration\|animation-duration" src/ --include="*.css"
```

### 7. Memory Leaks

- Are `useEffect` cleanups present for timers, subscriptions, event listeners?
- Are `AbortController`s used for fetch cleanup?
- Are object URLs revoked?

```bash
# Effects without cleanup
grep -A5 "useEffect" src/app/components/**/*.tsx | grep -B2 "setInterval\|addEventListener\|subscribe" | grep -v "return\|clearInterval\|removeEventListener\|unsubscribe"
```

---

## Output Format

### 🔴 Critical Issues (Performance Blockers)

Measurable impact on LCP/TTI/bundle size. Include file:line and estimated impact.

### 🟠 Improvements (Optimization Opportunities)

Would improve UX but not blocking. Include estimated gain.

### 🟢 Good Practices (Optimized)

What's already performant — reinforce these patterns.

### 📊 Performance Scorecard

| Area              | Score   | Notes |
| ----------------- | ------- | ----- |
| Rendering         | A/B/C/D |       |
| Bundle Size       | A/B/C/D |       |
| Code Splitting    | A/B/C/D |       |
| List Performance  | A/B/C/D |       |
| API Efficiency    | A/B/C/D |       |
| Animation         | A/B/C/D |       |
| Memory Management | A/B/C/D |       |

### 🚀 Performance Optimization Plan

Ordered by impact (highest first). Include estimated effort for each fix.
