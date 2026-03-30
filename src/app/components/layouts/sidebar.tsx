import { useCallback } from "react";
import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  Rocket,
  Shield,
  FileBox,
  ClipboardList,
  BarChart3,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Thermometer,
  ShieldAlert,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../../lib/use-auth";
import { getPrimaryRole, canAccessPage } from "../../../lib/rbac";

interface NavItem {
  label: string;
  path: string;
  page: string;
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
      { label: "Dashboard", path: "/", page: "dashboard", icon: LayoutDashboard, end: true },
      { label: "Inventory", path: "/inventory", page: "inventory", icon: Package },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Deployment", path: "/deployment", page: "deployment", icon: Rocket },
      { label: "Compliance", path: "/compliance", page: "compliance", icon: Shield },
      { label: "SBOM", path: "/sbom", page: "sbom", icon: FileBox },
      {
        label: "Service Orders",
        path: "/account-service",
        page: "account-service",
        icon: ClipboardList,
      },
      { label: "Analytics", path: "/analytics", page: "analytics", icon: BarChart3 },
      { label: "Telemetry", path: "/telemetry", page: "telemetry", icon: Thermometer },
      { label: "Incidents", path: "/incidents", page: "incidents", icon: ShieldAlert },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "User Management", path: "/user-management", page: "user-management", icon: Users },
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
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, email, groups, signOut } = useAuth();
  const role = getPrimaryRole(groups);

  const displayName = user?.name ?? email ?? "User";
  const displayEmail = email ?? "";
  const initials = getUserInitials(user?.name, email);
  const roleBadge = role;

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessPage(role, item.page)),
  })).filter((group) => group.items.length > 0);

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-white border-r border-gray-200 shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
      aria-label="Primary navigation"
    >
      {/* Logo + Toggle */}
      <div
        className={cn(
          "flex h-14 items-center shrink-0 border-b border-gray-100",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        {collapsed ? (
          <button
            onClick={onToggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold leading-tight tracking-tight text-gray-900">
                IMS <span className="text-[#FF7900]">Gen2</span>
              </span>
              <span className="text-[10px] leading-tight text-gray-400">
                Hardware Lifecycle Mgmt
              </span>
            </div>
            <button
              onClick={onToggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-[18px] w-[18px]" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3"
        aria-label="Main navigation"
      >
        {filteredGroups.map((group, groupIdx) => (
          <div key={group.label} className={cn(groupIdx > 0 && "mt-4")}>
            {groupIdx > 0 && <div className="mx-2 mb-3 border-t border-gray-100" />}
            {!collapsed && (
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                {group.label}
              </div>
            )}

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
                      title={collapsed ? item.label : undefined}
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex cursor-pointer items-center gap-3 rounded-lg text-[13px] font-medium",
                        collapsed ? "h-[40px] justify-center px-0" : "h-[40px] px-3",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7900] focus-visible:ring-offset-0",
                        isActive
                          ? "bg-orange-50 font-semibold text-[#FF7900]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#FF7900]" />
                      )}
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isActive ? "text-[#FF7900]" : "text-gray-400 group-hover:text-gray-600",
                        )}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className={cn("border-t border-gray-100 py-3", collapsed ? "px-2" : "px-3")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF7900] text-[11px] font-semibold text-white"
              title={`${displayName} (${roleBadge})`}
            >
              {initials}
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 px-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF7900] text-[11px] font-semibold text-white">
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
              onClick={handleSignOut}
              className={cn(
                "mt-2 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-medium text-gray-400",
                "hover:bg-gray-50 hover:text-gray-600",
              )}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
