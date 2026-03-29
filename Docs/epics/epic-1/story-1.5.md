# Story 1.5: User Management (Admin)

**Epic:** Epic 1 — Authentication & User Management
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 8
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-19-user-management`
**GitHub Issue:** #19

## User Story

As a platform admin, I want to manage users (invite, edit roles, disable accounts) from a dedicated page, so that I can control who has access to the platform and what they can do.

## Acceptance Criteria

- [x] AC1: User Management page with table: Name (with avatar), Email, Role (badge), Department, Status (Active/Invited/Disabled), Last Login
- [x] AC2: Real-time search filtering by name or email
- [x] AC3: Role filter dropdown (All Roles + 5 roles)
- [x] AC4: "Invite User" modal: Email, First Name, Last Name, Role, Department, Customer (for CustomerAdmin)
- [x] AC5: Invite creates user with "Invited" status + success toast
- [x] AC6: Edit User modal to change Role and Department
- [x] AC7: Disable/Enable toggle per user row

## Implementation Notes

- 8 mock users with varied roles, departments, and statuses
- Sidebar nav: "Admin" section with "User Management" visible only to Admin role
- Route: `/user-management` in App.tsx
- Action buttons (Invite, Edit, Disable) visible only to Admin via getPrimaryRole check
- InviteUserModal: email validation, all fields required, Customer field conditional on CustomerAdmin role
- EditUserModal: read-only name/email card, Role + Department dropdowns
- Includes Stories 1.1 + 1.2 + 1.3 + 1.4 changes as base

## Out of Scope

- Bulk operations (multi-select)
- Pagination / server-side filtering
- User deletion (soft disable only)

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for Cognito user pool management and DynamoDB user model.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
