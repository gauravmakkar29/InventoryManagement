/**
 * IMS Gen 2 — Role-Based Access Control (RBAC)
 *
 * 5 roles: Admin, Manager, Technician, Viewer, CustomerAdmin
 * Each role has a set of allowed pages and actions.
 */

export type Role = "Admin" | "Manager" | "Technician" | "Viewer" | "CustomerAdmin";

export type Action = "create" | "edit" | "delete" | "approve";

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
      "compliance",
      "sbom",
      "account-service",
      "analytics",
      "telemetry",
      "incidents",
      "digital-twin",
      "user-management",
    ],
    actions: ["create", "edit", "delete", "approve"],
    filterByCustomer: false,
  },
  Manager: {
    pages: [
      "dashboard",
      "inventory",
      "deployment",
      "compliance",
      "sbom",
      "account-service",
      "analytics",
      "telemetry",
      "incidents",
      "digital-twin",
    ],
    actions: ["create", "edit", "approve"],
    filterByCustomer: false,
  },
  Technician: {
    pages: ["dashboard", "inventory", "account-service"],
    actions: ["create", "edit"],
    filterByCustomer: false,
  },
  Viewer: {
    pages: [
      "dashboard",
      "inventory",
      "deployment",
      "compliance",
      "sbom",
      "account-service",
      "analytics",
      "telemetry",
      "incidents",
      "digital-twin",
    ],
    actions: [],
    filterByCustomer: false,
  },
  CustomerAdmin: {
    pages: ["dashboard", "inventory", "account-service"],
    actions: ["create", "edit"],
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
