import { useState, useEffect, useCallback } from "react";
import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  Rocket,
  Shield,
  ClipboardList,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../../lib/use-auth";

const STORAGE_KEY = "ims-sidebar-collapsed";

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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const location = useLocation();
  const { user, email } = useAuth();

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Storage unavailable
    }
  }, [collapsed]);

  const displayName = user?.name ?? email ?? "User";
  const initials = getUserInitials(user?.name, email);
  const roleBadge = user?.groups?.[0] ?? "Operator";

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-[#0f172a] select-none",
        "transition-[width] duration-200",
        collapsed ? "w-14" : "w-[220px]",
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
      aria-label="Primary navigation"
    >
      {/* ---- Logo ---- */}
      <div className="flex h-12 items-center overflow-hidden border-b border-slate-700/50 px-3">
        {collapsed ? (
          <span className="mx-auto text-[13px] font-bold tracking-tight text-white">IMS</span>
        ) : (
          <div className="flex flex-col justify-center">
            <span className="text-[13px] font-bold leading-tight text-white">
              IMS <span className="text-blue-400">Gen2</span>
            </span>
            <span className="text-[10px] leading-tight text-slate-500">
              Hardware Lifecycle Management
            </span>
          </div>
        )}
      </div>

      {/* ---- Navigation groups ---- */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3" aria-label="Main navigation">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.label} className={cn(groupIdx > 0 && "mt-4")}>
            {/* Section label */}
            {!collapsed && (
              <div className="mb-1 px-4 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {group.label}
              </div>
            )}
            {collapsed && groupIdx > 0 && (
              <div className="mx-3 mb-2 border-t border-slate-700/50" />
            )}

            <ul className="space-y-0.5 px-2">
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
                      aria-label={item.label}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex h-10 cursor-pointer items-center gap-3 rounded px-2.5 text-[13px] font-medium",
                        "transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                        isActive
                          ? "border-l-2 border-[#2563eb] bg-[rgba(37,99,235,0.1)] text-white"
                          : "border-l-2 border-transparent text-slate-400 hover:bg-[rgba(255,255,255,0.08)] hover:text-slate-100",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}

                      {/* Tooltip (collapsed state) */}
                      {collapsed && (
                        <span
                          role="tooltip"
                          className={cn(
                            "pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded bg-slate-800 px-2.5 py-1.5 text-[12px] font-medium text-white shadow-lg",
                            "opacity-0 transition-opacity duration-150 delay-200 group-hover:opacity-100",
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ---- User section ---- */}
      <div
        className={cn(
          "border-t border-slate-700/50 px-2 py-2",
          collapsed ? "flex justify-center" : "",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2.5 rounded px-2 py-1.5",
            collapsed && "justify-center px-0",
          )}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white"
            aria-hidden="true"
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium leading-tight text-slate-200">
                {displayName}
              </div>
              <div className="truncate text-[10px] leading-tight text-slate-500">{roleBadge}</div>
            </div>
          )}
        </div>
      </div>

      {/* ---- Collapse toggle ---- */}
      <div className="border-t border-slate-700/50 px-2 py-2">
        <button
          onClick={toggle}
          className={cn(
            "flex h-8 w-full cursor-pointer items-center justify-center rounded text-slate-400",
            "transition-colors duration-150",
            "hover:bg-[rgba(255,255,255,0.08)] hover:text-slate-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
