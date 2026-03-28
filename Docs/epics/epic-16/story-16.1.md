# Story 16.1: Dual-Theme System (Light & Dark Mode)

**Epic:** Epic 16 — Dual-Theme UI, Connectivity & KPI
**Persona:** Raj (Operations Manager)
**Priority:** High
**Story Points:** 5

## User Story
As an Operations Manager, I want to switch between light and dark mode with a single click, and have my preference remembered across sessions, so that I can use the platform comfortably in different lighting conditions and during extended work hours.

## Acceptance Criteria
- [ ] AC1: When I click the theme toggle icon (Sun/Moon) in the header, the entire application switches between light and dark mode with a smooth 150ms transition
- [ ] AC2: When I set a theme preference, it is persisted across browser sessions (page reload and new tabs retain my choice)
- [ ] AC3: When I have not set a preference, the platform defaults to my operating system's theme preference (system light/dark setting)
- [ ] AC4: When I switch to dark mode, all pages (Dashboard, Inventory, Deployment, Compliance, Account/Service, Analytics) render correctly with proper contrast and no invisible text or broken UI elements
- [ ] AC5: When I view the platform in dark mode, status colors (green/amber/red) remain clearly distinguishable and meet WCAG 2.1 AA contrast requirements (4.5:1 minimum for text, 3:1 for UI components)
- [ ] AC6: When I use keyboard navigation, I can toggle the theme using Enter or Space on the focused toggle button
- [ ] AC7: When I have the "reduce motion" OS setting enabled, the theme transition happens instantly without animation

## UI Behavior
- Theme toggle is a compact icon button in the fixed header bar (48px header height), positioned to the right near the user avatar
- Light mode icon: Sun (Lucide `Sun` icon)
- Dark mode icon: Moon (Lucide `Moon` icon)
- Transition: background colors, text colors, and borders all transition together (no flash of wrong colors)
- Sidebar, header, cards, tables, modals, and dropdowns all respond to theme change
- Charts (Recharts) update their axis labels, grid lines, and tooltip backgrounds to match the active theme

## Out of Scope
- Custom theme colors (users cannot choose their own accent color)
- Per-page theme overrides
- High contrast mode (beyond WCAG AA compliance)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for CSS custom property definitions, light/dark color tokens, and theme provider architecture.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
