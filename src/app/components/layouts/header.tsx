import { useMemo } from "react";
import { useLocation } from "react-router";
import { Bell, Search, Menu } from "lucide-react";
import { useAuth } from "../../../lib/use-auth";
import { cn } from "../../../lib/utils";

/**
 * Route-to-title mapping for the header.
 */
const ROUTE_META: Record<string, { title: string }> = {
  "/": { title: "Dashboard" },
  "/inventory": { title: "Inventory & Assets" },
  "/deployment": { title: "Deployment" },
  "/compliance": { title: "Compliance" },
  "/account-service": { title: "Service Orders" },
  "/analytics": { title: "Analytics" },
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

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, email } = useAuth();
  const title = usePageTitle();

  const initials = getUserInitials(user?.name, email);
  const displayName = user?.name ?? email ?? "User";
  const roleBadge = user?.groups?.[0] ?? "Operator";

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between bg-white px-5"
      style={{
        boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
      }}
      role="banner"
    >
      {/* Left: Hamburger + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className={cn(
            "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500",
            "hover:bg-gray-100 hover:text-gray-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900]",
          )}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-[18px] font-semibold leading-tight text-gray-900">{title}</h1>
      </div>

      {/* Right: Search + Bell + Divider + User */}
      <div className="flex items-center gap-2">
        {/* Search bar — pill shape */}
        <button
          className={cn(
            "flex h-9 w-[240px] cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3.5",
            "hover:border-gray-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900] focus-visible:ring-offset-1",
          )}
          aria-label="Search (Cmd+K)"
          title="Search (Cmd+K)"
        >
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="flex-1 text-left text-[13px] text-gray-400">Search anything...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-gray-200 bg-white px-1.5 text-[10px] font-medium text-gray-400">
            Cmd+K
          </kbd>
        </button>

        {/* Notification bell */}
        <button
          className={cn(
            "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500",
            "hover:bg-gray-100 hover:text-gray-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900] focus-visible:ring-offset-1",
          )}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Tiny red dot indicator */}
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"
            aria-hidden="true"
          />
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-gray-200" aria-hidden="true" />

        {/* User avatar + info */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF7900] text-[11px] font-semibold text-white"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="hidden md:block">
            <div className="text-[14px] font-medium leading-tight text-gray-900">{displayName}</div>
            <div className="text-[12px] leading-tight text-gray-500">{roleBadge}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
