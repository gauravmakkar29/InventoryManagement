# Story 12.5: License Compliance Dashboard

**Epic:** Epic 12 — SBOM & Supply Chain Security
**Persona:** Lisa (Compliance Auditor)
**Priority:** Medium
**Story Points:** 3

## User Story
As a Compliance Auditor, I want to view a license compliance dashboard showing the distribution of software licenses across all SBOM components and highlighting non-compliant licenses, so that I can ensure our firmware does not include software with incompatible license terms.

## Acceptance Criteria
- [ ] AC1: When I click the "License Compliance" tab, I see a policy status card showing: X approved licenses, Y restricted licenses, Z unknown licenses
- [ ] AC2: When the dashboard loads, I see a pie chart showing the distribution of licenses across all components (e.g., 45% Apache-2.0, 30% MIT, 15% BSD, 10% Other)
- [ ] AC3: When there are components with restricted licenses (e.g., GPL), I see a "Non-Compliant Components" list below the pie chart
- [ ] AC4: When I view the non-compliant list, each row shows: component name, version, license, firmware version, and recommended action
- [ ] AC5: When all components have approved licenses, the policy status card shows a green "All Compliant" indicator
- [ ] AC6: When I click "Export" on the license compliance view, a CSV file downloads with all component license information

## UI Behavior
- Policy status card at the top with three counters: Approved (green number), Restricted (red number), Unknown (gray number)
- License distribution pie chart (Recharts PieChart) below the status card
- Pie chart legend shows license names with their counts and percentages
- Non-compliant components list is a data table with red left-border for visual emphasis
- Each non-compliant row has a recommended action (e.g., "Replace component" or "Obtain commercial license")
- Export button (CSV) positioned above the non-compliant list

## Out of Scope
- Editing the approved/restricted license lists (policy configuration)
- Automatic license detection from source code
- License compatibility matrix analysis
- SPDX license expression parsing (only simple identifiers)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for license policy configuration and LicenseCompliancePanel component.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
