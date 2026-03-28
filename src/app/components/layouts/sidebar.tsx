import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  Rocket,
  Shield,
  ClipboardList,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "../../../lib/utils";

const STORAGE_KEY = "ims-sidebar-collapsed";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, end: true },
  { label: "Inventory", path: "/inventory", icon: Package },
  { label: "Deployment", path: "/deployment", icon: Rocket },
  { label: "Compliance", path: "/compliance", icon: Shield },
  { label: "Account & Service", path: "/account-service", icon: ClipboardList },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore storage errors
    }
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card",
        "transition-[width] duration-200 ease-in-out",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Logo area */}
      <div className="flex h-12 items-center border-b border-border px-3">
        {collapsed ? (
          <span className="text-sm font-bold text-accent">IMS</span>
        ) : (
          <span className="text-sm font-bold text-foreground">
            IMS <span className="text-accent">Gen2</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-2" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-sm px-2.5 py-2 text-sm font-medium",
                "hover:bg-muted",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <span
                  role="tooltip"
                  className={cn(
                    "pointer-events-none absolute left-full ml-2 rounded bg-foreground px-2 py-1 text-xs text-background",
                    "opacity-0 group-hover:opacity-100",
                    "whitespace-nowrap z-50"
                  )}
                >
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-3 rounded-sm px-2.5 py-2 text-sm text-muted-foreground",
            "hover:bg-muted hover:text-foreground"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
