# Story 1.4: Role-Based Access Control (RBAC) Enforcement

**Epic:** Epic 1 — Authentication & User Management
**Persona:** Sarah (Platform Admin)
**Priority:** High
**Story Points:** 5

## User Story
As a platform admin, I want the system to enforce role-based permissions across all features, so that users can only access and modify data appropriate to their role.

## Acceptance Criteria
- [ ] AC1: When an Admin logs in, they see all navigation items (Dashboard, Inventory, Deployment, Compliance, Account/Service, Analytics) and all action buttons (create, edit, delete, approve)
- [ ] AC2: When a Manager logs in, they see all navigation items and can create/edit entities but cannot see delete buttons or user management
- [ ] AC3: When a Technician logs in, they see Dashboard, Inventory (read-only), and Account/Service (own orders only); create/edit/delete buttons are hidden for entities they cannot modify
- [ ] AC4: When a Viewer logs in, they see all pages in read-only mode with no create, edit, delete, or approve buttons visible
- [ ] AC5: When a CustomerAdmin logs in, they see only data belonging to their organization (filtered by customerId) across all accessible pages
- [ ] AC6: When a user attempts to access a restricted API operation directly (e.g., via browser dev tools), the API returns a "Forbidden" error and a toast shows "You don't have permission for this action"

## UI Behavior
- Navigation sidebar dynamically shows/hides items based on user role
- Action buttons (Create, Edit, Delete, Approve) are conditionally rendered per role
- If a user navigates to a URL they lack permission for, they see an "Access Denied" page with a link back to Dashboard
- Role badge displayed next to user name in the header dropdown (e.g., "Sarah Chen — Admin")

## Out of Scope
- Changing user roles from the frontend (covered in Story 1.5)
- Field-level permissions (e.g., hiding specific columns)
- Custom permission sets beyond the 5 predefined groups

## Tech Spec Reference
See [tech-spec.md](./tech-spec.md) for RBAC groups, permission matrix (Section 5.3), and RequireRole component pattern.

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Unit tests passing (>=85% coverage on new code)
- [ ] E2E tests passing
- [ ] Compliance check green
