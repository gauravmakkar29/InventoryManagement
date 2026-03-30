# Story 18.4: Vulnerability Search

**Epic:** Epic 18 — OpenSearch & Global Search
**Persona:** Lisa (Compliance Auditor)
**Priority:** Medium
**Story Points:** 3

## User Story

As a Compliance Auditor, I want to search across all vulnerabilities by CVE ID, affected component, or description text with optional severity filtering, so that I can quickly find all instances of a specific vulnerability across the entire firmware fleet.

## Acceptance Criteria

- [x] AC1: When I navigate to the Compliance page and use the vulnerability search, I can type a CVE ID (e.g., "CVE-2026-1234") and see all matching vulnerability records across all firmware versions
- [x] AC2: When I search by component name (e.g., "OpenSSL"), all vulnerabilities affecting that component appear regardless of which firmware they belong to
- [x] AC3: When I filter by severity (Critical/High/Medium/Low) alongside a text search, only vulnerabilities matching both criteria are displayed
- [x] AC4: When I click a vulnerability result, I see the full detail including: CVE ID, severity badge, affected component, remediation status, and the parent compliance/firmware record it belongs to
- [x] AC5: When I search for a CVE that does not exist in the system, I see "No vulnerabilities found" with the searched term displayed

## UI Behavior

- Vulnerability search bar appears at the top of the Vulnerability Panel on the Compliance page
- Severity filter is a dropdown next to the search bar with options: All, Critical, High, Medium, Low
- Results display as a table with columns: CVE ID, Severity badge (color-coded), Affected Component, Remediation Status, Firmware Version
- CVE ID column values are clickable and navigate to the vulnerability detail
- Search has 300ms debounce
- Loading state: table shows skeleton rows

## Out of Scope

- CVE database lookup (external API integration)
- Vulnerability trending/analytics
- Bulk vulnerability status updates from search results

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for `searchVulnerabilities` resolver and severity filter implementation.

## Definition of Done

- [x] Code reviewed and approved
- [x] Unit tests passing (>=85% coverage on new code)
- [x] E2E tests passing
- [x] Compliance check green
