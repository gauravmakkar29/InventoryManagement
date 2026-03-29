# Story 1.4: Role-Based Access Control (RBAC) Enforcement

**Epic:** Epic 1 — Authentication & User Management
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5
**Status:** In Review (PR pending)
**Branch:** `feature/IMS-15-rbac-enforcement`
**GitHub Issue:** #15

## User Story

As a platform admin, I want the system to enforce role-based permissions across all features, so that users can only access and modify data appropriate to their role.

## Acceptance Criteria

- [x] AC1: When an Admin logs in, they see all navigation items and all action buttons (create, edit, delete, approve)
- [x] AC2: When a Manager logs in, they see all navigation items and can create/edit but cannot delete or access user management
- [x] AC3: When a Technician logs in, they see Dashboard, Inventory, and Account/Service only
- [x] AC4: When a Viewer logs in, they see all pages in read-only mode with no action buttons
- [x] AC5: When a CustomerAdmin logs in, data is flagged for customer-scoped filtering (filterByCustomer)
- [x] AC6: Access Denied page rendered when navigating to restricted URL; toast on API-level forbidden

## Implementation Notes

- `src/lib/rbac.ts`: Permission matrix with 5 roles, pages, actions, and customer filter flag
- `src/app/components/require-role.tsx`: Declarative guard component for roles, pages, and actions
- `src/app/components/access-denied.tsx`: Full page with ShieldX icon and link back to Dashboard
- Sidebar dynamically filters nav items by `canAccessPage(role, page)`
- Role badge in sidebar user section derived from `getPrimaryRole(groups)`
- Includes all Story 1.1 + 1.3 changes as base

## Out of Scope

- Changing user roles from the frontend (covered in Story 1.5)
- Field-level permissions
- Custom permission sets beyond the 5 predefined groups

## Tech Spec Reference

See [tech-spec.md](./tech-spec.md) for RBAC groups, permission matrix (Section 5.3), and RequireRole component pattern.

## Definition of Done

- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
