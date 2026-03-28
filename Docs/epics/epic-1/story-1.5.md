# Story 1.5: User Management (Admin)

**Epic:** Epic 1 — Authentication & User Management
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 8

## User Story
As a platform admin, I want to view, search, and manage user accounts, so that I can control who has access to the platform and what role they hold.

## Acceptance Criteria
- [ ] AC1: When I navigate to the User Management page, I see a table listing all users with columns: Name, Email, Role, Department, Status (Active/Disabled), Last Login
- [ ] AC2: When I type in the search bar, the user list filters by name or email in real time
- [ ] AC3: When I select a role from the role filter dropdown (Admin, Manager, Technician, Viewer, CustomerAdmin), only users with that role are shown
- [ ] AC4: When I click "Invite User", a modal opens with fields: Email, First Name, Last Name, Role (dropdown), Department, Customer (dropdown, required for CustomerAdmin role)
- [ ] AC5: When I submit the invite form with valid data, the user receives an email invitation and appears in the table with status "Invited"
- [ ] AC6: When I click "Edit" on a user row, I can change their Role and Department, and after saving the changes take effect immediately
- [ ] AC7: When I click "Disable" on a user row, their account is deactivated and they can no longer log in; their status changes to "Disabled" in the table

## UI Behavior
- User Management is accessible only to Admin users (hidden from navigation for other roles)
- Table supports sorting by Name, Role, and Last Login columns
- Invite modal validates email format and requires all fields before enabling submit
- Role change triggers a confirmation dialog: "Change role for [Name] from [Old] to [New]?"
- Disable action triggers a confirmation dialog: "Disable account for [Name]? They will be unable to log in."
- Success/error toasts for all actions

## Out of Scope
- Bulk user import (CSV upload)
- User self-registration
- Password reset by admin (users use self-service recovery)
- Audit log of user management actions (captured automatically by DynamoDB Streams)

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for User entity model, GSI patterns for `listUsersByRole` and `getUserByEmail`, and Cognito Admin API integration.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
