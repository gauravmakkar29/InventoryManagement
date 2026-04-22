import { useMemo } from "react";
import { Link, useLocation } from "react-router";

/**
 * Story 16.5: Enterprise Navigation — Breadcrumbs
 *
 * Shows navigation path below the header.
 * Current page segment is non-clickable and bold.
 * Separator: "/" character.
 */

const ROUTE_LABELS: Record<string, string> = {
  "": "Dashboard",
  inventory: "Inventory",
  deployment: "Deployment",
  firmware: "Firmware Catalog",
  compliance: "Compliance",
  sbom: "SBOM",
  "account-service": "Service Orders",
  analytics: "Analytics",
  telemetry: "Telemetry",
  incidents: "Incidents",
  "digital-twin": "Digital Twin",
  "user-management": "User Management",
  "executive-summary": "Executive Summary",
  "access-denied": "Access Denied",
};

interface Crumb {
  label: string;
  path: string;
}

export function Breadcrumbs() {
  const { pathname } = useLocation();

  const crumbs = useMemo((): Crumb[] => {
    if (pathname === "/") return [];

    const segments = pathname.split("/").filter(Boolean);
    const result: Crumb[] = [{ label: "Dashboard", path: "/" }];

    let currentPath = "";
    for (const seg of segments) {
      currentPath += `/${seg}`;
      const label =
        ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
      result.push({ label, path: currentPath });
    }

    return result;
  }, [pathname]);

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-[14px]">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-muted-foreground" aria-hidden="true">
                  /
                </span>
              )}
              {isLast ? (
                <span className="font-semibold text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.path} className="text-muted-foreground hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
