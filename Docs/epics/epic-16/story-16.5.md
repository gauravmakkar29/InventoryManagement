# Story 16.5: Enterprise Navigation & UX Polish

**Epic:** Epic 16 — Dual-Theme UI, Connectivity & KPI
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 5

## User Story
As an Operations Manager, I want a polished enterprise navigation experience with a collapsible sidebar, breadcrumbs, and keyboard shortcuts, so that I can navigate the platform efficiently and maximize screen space for data.

## Acceptance Criteria
- [ ] AC1: When I click the sidebar collapse toggle, the sidebar shrinks from 240px (expanded with labels) to 56px (icon-only), and my preference is remembered across sessions
- [ ] AC2: When the sidebar is collapsed, hovering over an icon shows a tooltip with the page name
- [ ] AC3: When I navigate to any sub-page, a breadcrumb trail appears below the header showing the navigation path (e.g., "Dashboard > Inventory > Geo Location") with clickable parent segments
- [ ] AC4: When I press Cmd+K (Mac) or Ctrl+K (Windows), the global search command palette opens immediately
- [ ] AC5: When I use the command palette, I can type to search across all entity types and navigate to results using keyboard only (arrow keys to select, Enter to navigate, Escape to close)
- [ ] AC6: When I view any data table in the platform, it uses compact row height (36px), professional sans-serif font, and maximizes the number of visible rows
- [ ] AC7: When I resize the browser window, the layout responds appropriately: tables scroll horizontally on small screens, sidebar auto-collapses below 1024px viewport, cards stack vertically on mobile
- [ ] AC8: When I interact with any button, link, or card, the hover and focus states are subtle (150-200ms transitions, no bouncy or exaggerated animations)

## UI Behavior
- Sidebar: icon-only collapsed state with 56px width, full labels on expand with 240px width
- Sidebar toggle button is a chevron at the bottom of the sidebar
- Breadcrumb separator: "/" character, current page segment is non-clickable and bold
- Command palette uses shadcn Command component with grouped results by entity type
- Data tables use alternating row backgrounds (subtle) for readability in both themes
- All transitions are 150ms ease-out; buttons have a subtle scale(0.98) on active press
- Header is fixed at 48px with: hamburger/collapse button, logo, search bar, notification bell, user menu, theme toggle
- Mobile (< 768px): sidebar becomes a slide-out overlay triggered by hamburger menu

## Out of Scope
- Custom keyboard shortcut configuration
- Multi-language navigation labels
- Sidebar section grouping or collapsible groups within sidebar

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for enterprise UX compliance checklist, navigation architecture, and accessibility requirements.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
