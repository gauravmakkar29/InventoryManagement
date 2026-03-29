import { useCallback } from "react";
import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  Rocket,
  Shield,
  ClipboardList,
  BarChart3,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../../lib/use-auth";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard, end: true },
      { label: "Inventory", path: "/inventory", icon: Package },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Deployment", path: "/deployment", icon: Rocket },
      { label: "Compliance", path: "/compliance", icon: Shield },
      { label: "Service Orders", path: "/account-service", icon: ClipboardList },
      { label: "Analytics", path: "/analytics", icon: BarChart3 },
    ],
  },
];

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

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, email, signOut } = useAuth();

  const handleNavClick = useCallback(() => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  }, [onClose]);

  const displayName = user?.name ?? email ?? "User";
  const displayEmail = email ?? "";
  const initials = getUserInitials(user?.name, email);
  const roleBadge = user?.groups?.[0] ?? "Operator";

  return (
    <>
      {/* Backdrop — visible on mobile when sidebar open */}
      {open && (
        <div
          className="sidebar-backdrop fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col bg-white",
          "sidebar-panel",
          "shadow-[4px_0_24px_rgba(0,0,0,0.06)]",
        )}
        data-state={open ? "open" : "closed"}
        style={{
          borderRight: "1px solid #e5e7eb",
        }}
        aria-label="Primary navigation"
        aria-hidden={!open}
      >
        {/* Logo + Close */}
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex flex-col">
            <span className="text-[15px] font-bold leading-tight tracking-tight text-gray-900">
              IMS <span className="text-[#FF7900]">Gen2</span>
            </span>
            <span className="text-[10px] leading-tight text-gray-400">Hardware Lifecycle Mgmt</span>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400",
              "hover:bg-gray-100 hover:text-gray-600",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900]",
            )}
            aria-label="Close navigation"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Navigation groups */}
        <nav
          className="sidebar-nav flex-1 overflow-y-auto overflow-x-hidden px-3 py-4"
          aria-label="Main navigation"
        >
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={group.label} className={cn(groupIdx > 0 && "mt-5")}>
              {groupIdx > 0 && <div className="mx-2 mb-3 border-t border-gray-100" />}
              <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                {group.label}
              </div>

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.end
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);

                  return (
                    <li key={item.path} className="relative">
                      <NavLink
                        to={item.path}
                        end={item.end}
                        onClick={handleNavClick}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group relative flex h-[44px] cursor-pointer items-center gap-3 rounded-lg px-3 text-[14px] font-medium",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900] focus-visible:ring-offset-0",
                          isActive
                            ? "bg-orange-50 font-semibold text-[#FF7900]"
                            : "text-gray-600 hover:bg-orange-50 hover:text-[#FF7900]",
                        )}
                      >
                        {/* Active left indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#FF7900]" />
                        )}
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0",
                            isActive
                              ? "text-[#FF7900]"
                              : "text-gray-400 group-hover:text-[#FF7900]",
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF7900] text-[12px] font-semibold text-white"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium leading-tight text-gray-900">
                {displayName}
              </div>
              <div className="truncate text-[11px] leading-tight text-gray-400">
                {displayEmail || roleBadge}
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className={cn(
              "mt-3 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500",
              "hover:bg-gray-50 hover:text-gray-700",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900]",
            )}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
