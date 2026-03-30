import { useMemo, useState } from "react";
import { useLocation } from "react-router";
import { Bell, Search } from "lucide-react";
import { useAuth } from "../../../lib/use-auth";
import { cn } from "../../../lib/utils";
import { NotificationPanel, useNotificationCount } from "../notification-panel";

const ROUTE_META: Record<string, { title: string }> = {
  "/": { title: "Dashboard" },
  "/inventory": { title: "Inventory & Assets" },
  "/deployment": { title: "Deployment" },
  "/compliance": { title: "Compliance" },
  "/account-service": { title: "Service Orders" },
  "/analytics": { title: "Analytics" },
  "/user-management": { title: "User Management" },
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
        className="flex h-14 shrink-0 items-center justify-between bg-white px-5 border-b border-gray-200"
        role="banner"
      >
        {/* Left: Page title */}
        <h1 className="text-[17px] font-semibold leading-tight text-gray-900">{title}</h1>

        {/* Right: Search + Bell + Divider + User */}
        <div className="flex items-center gap-2">
          <button
            className={cn(
              "flex h-9 w-[220px] cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3.5",
              "hover:border-gray-300",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900] focus-visible:ring-offset-1",
            )}
            aria-label="Search (Cmd+K)"
            title="Search (Cmd+K)"
          >
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="flex-1 text-left text-[13px] text-gray-400">Search...</span>
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-gray-200 bg-white px-1.5 text-[10px] font-medium text-gray-400">
              /
            </kbd>
          </button>

          <button
            onClick={() => setNotifOpen(true)}
            className={cn(
              "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500",
              "hover:bg-gray-100 hover:text-gray-700",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900] focus-visible:ring-offset-1",
            )}
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          <div className="mx-1 h-6 w-px bg-gray-200" aria-hidden="true" />

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF7900] text-[11px] font-semibold text-white">
              {initials}
            </div>
            <div className="hidden md:block">
              <div className="text-[13px] font-medium leading-tight text-gray-900">
                {displayName}
              </div>
              <div className="text-[11px] leading-tight text-gray-500">{roleBadge}</div>
            </div>
          </div>
        </div>
      </header>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
