# Story 6.1: Compliance Item List with Status Filters

**Epic:** Epic 6 — Compliance & Vulnerability Tracking
**Persona:** Lisa (Compliance Auditor)
**Priority:** High
**Story Points:** 5

## User Story

As a compliance auditor, I want to view compliance items filtered by status and certification type, so that I can quickly assess the compliance posture of the device fleet.

## Acceptance Criteria

- [x] AC1: When I navigate to `/compliance`, I see a list of compliance items with status filter tabs: Approved, Pending, Deprecated
- [x] AC2: Each tab shows a count of items in that status (e.g., "Approved (12)")
- [x] AC3: Each compliance item displays: firmware version, device model, certification name, status badge (color-coded), and vulnerability count
- [x] AC4: When I select the "Pending" tab, only items with status "Pending" are shown
- [x] AC5: When I select a certification from the certification filter dropdown (e.g., "IEC 62109"), only items with that certification are shown
- [ ] AC6: When I select a device model from the model filter, results are further narrowed to that model
- [x] AC7: When no items match the active filters, I see "No compliance items found" with a suggestion to adjust filters
- [ ] AC8: When data is loading, skeleton placeholders are shown

## UI Behavior

- Status filter tabs are displayed as a tab bar at the top of the list
- Additional filters (certification, device model) appear in a filter bar below the tabs
- Status badges use: green for Approved, amber for Pending, gray for Deprecated
- Vulnerability count shows as a small number badge; counts above 0 for Critical/High vulnerabilities are highlighted in red
- Items are sorted by most recently updated first

## Out of Scope

- Creating or editing compliance items (covered in Story 6.3)
- Vulnerability details (covered in Story 6.2)
- Approving or deprecating items (covered in Story 6.4)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for Compliance entity model, `listComplianceByStatus` query, and filter configuration.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [x] Compliance check green
