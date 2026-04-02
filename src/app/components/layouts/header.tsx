import { useMemo, useState } from "react";
import { useLocation } from "react-router";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { NotificationPanel, useNotificationCount } from "../notification-panel";
import { ThemeToggle } from "../theme/theme-toggle";
import { GlobalSearchBar } from "../search/global-search-bar";

const ROUTE_META: Record<string, { title: string }> = {
  "/": { title: "Dashboard" },
  "/inventory": { title: "Inventory & Assets" },
  "/deployment": { title: "Deployment" },
  "/compliance": { title: "Compliance" },
  "/account-service": { title: "Service Orders" },
  "/analytics": { title: "Analytics" },
  "/user-management": { title: "User Management" },
  "/executive-summary": { title: "Executive Summary" },
};

function usePageTitle(): string {
  const { pathname } = useLocation();
  return useMemo(() => {
    const meta = ROUTE_META[pathname];
    if (meta) return meta.title;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Dashboard";
    const last = segments[segments.length - 1]!;
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
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
  const { user, email } = useAuth();
  const title = usePageTitle();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useNotificationCount();

  const initials = getUserInitials(user?.name, email);
  const displayName = user?.name ?? email ?? "User";
  const roleBadge = user?.groups?.[0] ?? "Operator";

  return (
    <>
      <header
        className="flex h-14 shrink-0 items-center justify-between bg-card px-5 border-b border-border"
        role="banner"
      >
        {/* Left: Page title */}
        <h1 className="text-[17px] font-semibold leading-snug text-foreground">{title}</h1>

        {/* Right: Search + Theme + Bell + Divider + User */}
        <div className="flex items-center gap-2">
          <GlobalSearchBar />

          <ThemeToggle />

          <button
            onClick={() => setNotifOpen(true)}
            className={cn(
              "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground",
              "hover:bg-muted hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
            )}
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[12px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-white">
              {initials}
            </div>
            <div className="hidden md:block">
              <div className="text-[14px] font-medium leading-snug text-foreground">
                {displayName}
              </div>
              <div className="text-[13px] leading-snug text-muted-foreground">{roleBadge}</div>
            </div>
          </div>
        </div>
      </header>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
