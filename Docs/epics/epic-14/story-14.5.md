# Story 14.5: Incident Response Playbooks

**Epic:** Epic 14 — Incident Isolation & Lateral Movement
**Persona:** Raj (Operations Manager)
**Priority:** Medium
**Story Points:** 5

## User Story

As an Operations Manager, I want to create and execute standardized incident response playbooks with step-by-step instructions, so that my team follows a consistent process during incidents and critical steps are not missed.

## Acceptance Criteria

- [x] AC1: When I navigate to the Playbooks section (tab within Incidents page), I see a list of available playbooks with: name, category, severity match, number of steps, and status (Active/Draft/Deprecated)
- [ ] AC2: When I click "Create Playbook", a dialog lets me define: name, description, category, recommended severity, and an ordered list of steps (each with title, description, and action type: manual or automated)
- [x] AC3: When I attach a playbook to an incident, the incident detail panel shows a "Playbook Execution" section with a checklist of all steps
- [x] AC4: When I mark a playbook step as complete, it records who completed it and when, and the progress bar updates
- [x] AC5: When all playbook steps are completed, a "Playbook Complete" badge appears on the incident and a notification is sent to the incident assignee
- [x] AC6: When a playbook step has an automated action type (e.g., "isolate_device", "notify_team"), clicking "Execute" on that step triggers the corresponding system action automatically
- [x] AC7: When I filter playbooks by category, only matching playbooks are shown
- [ ] AC8: When I attempt to delete a playbook that is currently attached to an open incident, I see an error message explaining it cannot be deleted while in use

## UI Behavior

- Playbook list uses a card layout showing name, description preview, step count, and category badge
- Playbook creation dialog has a dynamic step builder: add/remove/reorder steps via drag handles
- Each step in the builder has: title input, description textarea, action type radio (manual/automated), and automated action dropdown (if automated selected)
- Playbook execution section in incident detail shows a vertical checklist with step numbers, checkboxes, and expandable descriptions
- Progress bar at the top shows "3 of 7 steps complete" with percentage
- Completed steps show a green checkmark with the completer's name and timestamp

## Out of Scope

- Playbook versioning (editing creates a new version)
- Playbook analytics (most used, average completion time)
- Conditional/branching steps (all steps are sequential)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for Playbook and PlaybookStep entities, `createPlaybook` and `executePlaybookStep` mutations.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
