import { useMemo } from "react";
import { useLocation } from "react-router";
import { Bell, Search, Sun, Moon, ChevronRight, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "../../../lib/use-auth";
import { cn } from "../../../lib/utils";

/**
 * Route-to-breadcrumb mapping for the header.
 */
const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/inventory": "Inventory",
  "/deployment": "Deployment",
  "/compliance": "Compliance",
  "/account-service": "Service Orders",
  "/analytics": "Analytics",
};

function useBreadcrumbs(): string[] {
  const { pathname } = useLocation();
  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return ["Dashboard"];

    const crumbs: string[] = [];
    let accumulated = "";

    for (const seg of segments) {
      accumulated += "/" + seg;
      const label = ROUTE_LABELS[accumulated];
      if (label) {
        crumbs.push(label);
      } else {
        // Capitalize unknown segments as fallback
        crumbs.push(seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "));
      }
    }

    return crumbs.length > 0 ? crumbs : ["Dashboard"];
  }, [pathname]);
}

function getUserInitials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, email } = useAuth();
  const breadcrumbs = useBreadcrumbs();

  const initials = getUserInitials(user?.name, email);
  const notificationCount = 3;

  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4",
      )}
      role="banner"
    >
      {/* Left: Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px]">
        {breadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1">
            {idx > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            )}
            <span
              className={cn(
                idx === breadcrumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          className={cn(
            "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground",
            "transition-colors duration-150",
            "hover:border-accent/40 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
          )}
          aria-label="Search (Ctrl+K)"
          title="Search (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        {/* Notification bell */}
        <button
          className={cn(
            "relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground",
            "transition-colors duration-150",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
          )}
          aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white"
              aria-hidden="true"
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground",
            "transition-colors duration-150",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
          )}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Separator */}
        <div className="mx-0.5 h-5 w-px bg-border" aria-hidden="true" />

        {/* User avatar + dropdown trigger */}
        <button
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1",
            "transition-colors duration-150",
            "hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
          )}
          aria-label="User menu"
          aria-haspopup="true"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white"
            aria-hidden="true"
          >
            {initials}
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
