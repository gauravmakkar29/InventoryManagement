# Story 14.1: Incident Creation & Lifecycle Management

**Epic:** Epic 14 — Incident Isolation & Lateral Movement
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 8

## User Story

As a Platform Admin, I want to create, track, and manage security and operational incidents through their full lifecycle (Open to Closed), so that I have a structured process for handling device failures and security events.

## Acceptance Criteria

- [x] AC1: When I click "Create Incident" on the Incidents page, a dialog opens where I can enter: title, description, severity (Critical/High/Medium/Low), category (Security/Hardware/Network/Firmware/Environmental), and select affected devices from a searchable dropdown
- [x] AC2: When I submit a new incident, it appears in the incident list with status "Open" and a timestamp
- [x] AC3: When I open an incident, I see a detail panel with: title, description, severity badge, status badge, assigned user, affected device count, and a timeline of all events
- [x] AC4: When I change an incident's status (e.g., Open to Investigating), the timeline records the transition with my name, timestamp, and optional note
- [ ] AC5: When I assign an incident to a team member, they receive a notification and the incident appears in their "My Incidents" filtered view
- [x] AC6: When I filter the incident list by status or severity, only matching incidents are displayed
- [x] AC7: When an incident is resolved, I must provide a resolution note before the status change is accepted

## UI Behavior

- Incidents page has a table/list layout with columns: Severity icon, Title, Status badge, Category, Affected Devices count, Assigned To, Created date
- Filters appear above the table: Status dropdown (All/Open/Investigating/Contained/Resolved/Closed), Severity dropdown, Category dropdown
- Detail panel slides in from the right when clicking an incident row
- Timeline is a vertical list with alternating left/right alignment, each event showing icon + text + timestamp
- Status transitions are via a dropdown button on the detail panel header
- Severity badge colors: Critical=red, High=orange, Medium=amber, Low=blue

## Out of Scope

- Device isolation (Story 14.2)
- Quarantine zones (Story 14.4)
- Playbook execution (Story 14.5)
- Automated incident creation from telemetry alerts

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for Incident entity, status state machine, and API mutations.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
