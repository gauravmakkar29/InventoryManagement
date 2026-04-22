/**
 * IMS Gen 2 — Role-Based Access Control (RBAC)
 *
 * 5 roles: Admin, Manager, Technician, Viewer, CustomerAdmin
 * Each role has a set of allowed pages and actions.
 *
 * NIST 800-53 controls enforced by this module:
 * - AC-3 (Access Enforcement): canPerformAction / canAccessPage gate every
 *   sensitive operation. Every compliance primitive (Epic 28) calls
 *   canPerformAction BEFORE side-effects and writes an audit-denial record
 *   on failure (AU-2 / AU-3).
 * - AC-5 (Separation of Duties): submit vs decide, request vs approve,
 *   initiate vs complete are deliberately split across distinct actions so a
 *   single principal cannot both raise and ratify a compliance decision.
 *   Runtime SoD (same-principal-rejection) is additionally enforced at the
 *   compliance engine adapters (see src/lib/compliance/approval/).
 * - AC-6 (Least Privilege): Viewer + CustomerAdmin receive read/submit-only
 *   subsets of the compliance action surface.
 */

export type Role = "Admin" | "Manager" | "Technician" | "Viewer" | "CustomerAdmin";

export type Action =
  | "create"
  | "edit"
  | "delete"
  | "approve"
  // Epic 28 — Compliance primitives (generic, domain-agnostic).
  // NIST AC-3 enforcement points; AC-5 pair splits (submit/decide,
  // request/approve, initiate/complete) are intentional so no single
  // principal can both propose and ratify the same compliance event.
  | "evidence:put"
  | "evidence:read"
  | "checklist:attach"
  | "checklist:waive"
  | "approval:submit" // AC-5: pair with "approval:decide"
  | "approval:decide" // AC-5: pair with "approval:submit"
  | "distribution:request" // AC-5: pair with "distribution:approve"
  | "distribution:approve" // AC-5: pair with "distribution:request"
  | "confirmation:initiate" // AC-5: pair with "confirmation:complete"
  | "confirmation:complete" // AC-5: pair with "confirmation:initiate"
  | "confirmation:abandon"
  | "impact:query";

export interface RolePermissions {
  pages: string[];
  actions: Action[];
  filterByCustomer: boolean;
}

const PERMISSIONS: Record<Role, RolePermissions> = {
  Admin: {
    pages: [
      "dashboard",
      "inventory",
      "deployment",
      "firmware-catalog",
      "compliance",
      "sbom",
      "account-service",
      "analytics",
      "telemetry",
      "incidents",
      "digital-twin",
      "executive-summary",
      "user-management",
      "customers",
    ],
    actions: [
      "create",
      "edit",
      "delete",
      "approve",
      "evidence:put",
      "evidence:read",
      "checklist:attach",
      "checklist:waive",
      "approval:submit",
      "approval:decide",
      "distribution:request",
      "distribution:approve",
      "confirmation:initiate",
      "confirmation:complete",
      "confirmation:abandon",
      "impact:query",
    ],
    filterByCustomer: false,
  },
  Manager: {
    // AC-3: firmware-catalog parallels deployment-scope access (read + author families).
    pages: [
      "dashboard",
      "inventory",
      "deployment",
      "firmware-catalog",
      "compliance",
      "sbom",
      "account-service",
      "analytics",
      "telemetry",
      "incidents",
      "digital-twin",
      "executive-summary",
      "customers",
    ],
    actions: [
      "create",
      "edit",
      "approve",
      "evidence:put",
      "evidence:read",
      "checklist:attach",
      "checklist:waive",
      "approval:decide",
      "distribution:approve",
      "impact:query",
    ],
    filterByCustomer: false,
  },
  Technician: {
    pages: ["dashboard", "inventory", "account-service"],
    actions: [
      "create",
      "edit",
      "evidence:read",
      "checklist:attach",
      "approval:submit",
      "distribution:request",
      "confirmation:initiate",
      "confirmation:complete",
    ],
    filterByCustomer: false,
  },
  Viewer: {
    // AC-3: firmware-catalog read access mirrors deployment — no action grants.
    pages: [
      "dashboard",
      "inventory",
      "deployment",
      "firmware-catalog",
      "compliance",
      "sbom",
      "account-service",
      "analytics",
      "telemetry",
      "incidents",
      "digital-twin",
      "customers",
    ],
    actions: ["evidence:read", "impact:query"],
    filterByCustomer: false,
  },
  CustomerAdmin: {
    pages: ["dashboard", "inventory", "account-service"],
    actions: ["create", "edit", "evidence:read", "approval:submit"],
    filterByCustomer: true,
  },
};

/** Get the primary role from user groups. */
export function getPrimaryRole(groups: string[]): Role {
  const roleOrder: Role[] = ["Admin", "Manager", "Technician", "CustomerAdmin", "Viewer"];
  for (const role of roleOrder) {
    if (groups.includes(role)) return role;
  }
  return "Viewer";
}

/** Check if a role can access a page. */
export function canAccessPage(role: Role, page: string): boolean {
  return PERMISSIONS[role].pages.includes(page);
}

/** Check if a role can perform an action. */
export function canPerformAction(role: Role, action: Action): boolean {
  return PERMISSIONS[role].actions.includes(action);
}

/** Check if data should be filtered by customer. */
export function shouldFilterByCustomer(role: Role): boolean {
  return PERMISSIONS[role].filterByCustomer;
}

/** Get all permissions for a role. */
export function getPermissions(role: Role): RolePermissions {
  return PERMISSIONS[role];
}
