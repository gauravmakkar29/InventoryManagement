import type { ReactNode } from "react";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, canAccessPage, canPerformAction } from "@/lib/rbac";
import type { Role, Action } from "@/lib/rbac";

interface RequireRoleProps {
  /** Allowed roles — if provided, checks that user has one of these roles. */
  roles?: Role[];
  /** Allowed page — if provided, checks canAccessPage for user's role. */
  page?: string;
  /** Required action — if provided, checks canPerformAction for user's role. */
  action?: Action;
  /** Content to render when authorized. */
  children: ReactNode;
  /** Optional fallback when not authorized (defaults to null). */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on user role and permissions.
 *
 * Usage:
 *   <RequireRole roles={["Admin", "Manager"]}>...</RequireRole>
 *   <RequireRole page="user-management">...</RequireRole>
 *   <RequireRole action="delete">...</RequireRole>
 */
export function RequireRole({ roles, page, action, children, fallback = null }: RequireRoleProps) {
  const { groups } = useAuth();
  const role = getPrimaryRole(groups);

  if (roles && !roles.includes(role)) {
    return <>{fallback}</>;
  }

  if (page && !canAccessPage(role, page)) {
    return <>{fallback}</>;
  }

  if (action && !canPerformAction(role, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
