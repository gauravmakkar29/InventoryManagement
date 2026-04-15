// =============================================================================
// RBAC — Lifecycle Category Visibility — Story 27.2 (#418)
//
// Maps user roles to the set of lifecycle categories they should see by
// default, and the set they are permitted to enable. This is a VIEW
// concern — it is NOT a substitute for authorization. The underlying
// getChangeHistory / firmware / service APIs still enforce RBAC at the
// data layer (Epic 8 + Story 20.8).
// =============================================================================

import type { Role } from "./rbac";
import type { DeviceLifecycleCategory } from "./types";

/**
 * Categories each role sees pre-selected on initial render. The user can
 * toggle these within the permitted set (see
 * `getPermittedLifecycleCategories`).
 */
export const DEFAULT_LIFECYCLE_CATEGORIES_BY_ROLE: Record<Role, DeviceLifecycleCategory[]> = {
  Admin: ["Firmware", "Service", "Ownership", "Status", "Audit"],
  Manager: ["Firmware", "Service", "Ownership", "Status"],
  Technician: ["Firmware", "Service", "Status"],
  Viewer: ["Firmware", "Service", "Status"],
  CustomerAdmin: ["Firmware", "Service", "Ownership"],
};

/**
 * Categories each role is permitted to enable. Non-permitted categories
 * render disabled with a tooltip explaining why.
 *
 * Rules of thumb:
 * - Admin / Manager see everything (Manager defaults to no Audit but can
 *   opt in).
 * - Technician / Viewer — operational lens only (no Ownership, no Audit).
 * - CustomerAdmin — tenant-scoped; Status is an operational concern their
 *   dashboard doesn't surface, and Audit is cross-tenant so stays hidden.
 */
export const PERMITTED_LIFECYCLE_CATEGORIES_BY_ROLE: Record<Role, DeviceLifecycleCategory[]> = {
  Admin: ["Firmware", "Service", "Ownership", "Status", "Audit"],
  Manager: ["Firmware", "Service", "Ownership", "Status", "Audit"],
  Technician: ["Firmware", "Service", "Status"],
  Viewer: ["Firmware", "Service", "Status"],
  CustomerAdmin: ["Firmware", "Service", "Ownership"],
};

export function getDefaultLifecycleCategories(role: Role): DeviceLifecycleCategory[] {
  return [...(DEFAULT_LIFECYCLE_CATEGORIES_BY_ROLE[role] ?? [])];
}

export function getPermittedLifecycleCategories(role: Role): DeviceLifecycleCategory[] {
  return [...(PERMITTED_LIFECYCLE_CATEGORIES_BY_ROLE[role] ?? [])];
}

/**
 * localStorage key convention: `lifecycle.filter.<role>.<deviceId>`.
 * Exposed so tests can construct the same key for seeding state.
 */
export function lifecycleFilterStorageKey(role: Role, deviceId: string): string {
  return `lifecycle.filter.${role}.${deviceId}`;
}
