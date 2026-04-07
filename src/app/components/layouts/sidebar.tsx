import { useCallback, useRef } from "react";
import { NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
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
  Fingerprint,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/use-auth";
import { getPrimaryRole, canAccessPage } from "@/lib/rbac";
import { AppVersionBadge } from "../app-version-badge";

interface NavItem {
  labelKey: string;
  path: string;
  page: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

interface NavGroup {
  labelKey: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "nav.main",
    items: [
      { labelKey: "nav.dashboard", path: "/", page: "dashboard", icon: LayoutDashboard, end: true },
      { labelKey: "nav.inventory", path: "/inventory", page: "inventory", icon: Package },
    ],
  },
  {
    labelKey: "nav.operations",
    items: [
      { labelKey: "nav.deployment", path: "/deployment", page: "deployment", icon: Rocket },
      { labelKey: "nav.compliance", path: "/compliance", page: "compliance", icon: Shield },
      { labelKey: "nav.sbom", path: "/sbom", page: "sbom", icon: FileBox },
      {
        labelKey: "nav.serviceOrders",
        path: "/account-service",
        page: "account-service",
        icon: ClipboardList,
      },
      { labelKey: "nav.analytics", path: "/analytics", page: "analytics", icon: BarChart3 },
      { labelKey: "nav.telemetry", path: "/telemetry", page: "telemetry", icon: Thermometer },
      { labelKey: "nav.incidents", path: "/incidents", page: "incidents", icon: ShieldAlert },
      {
        labelKey: "nav.digitalTwin",
        path: "/digital-twin",
        page: "digital-twin",
        icon: Fingerprint,
      },
      {
        labelKey: "nav.executiveSummary",
        path: "/executive-summary",
        page: "executive-summary",
        icon: FileText,
      },
    ],
  },
  {
    labelKey: "nav.admin",
    items: [
      {
        labelKey: "nav.userManagement",
        path: "/user-management",
        page: "user-management",
        icon: Users,
      },
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
  const { t } = useTranslation();
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

  // Route chunk prefetching on hover (#314)
  const prefetchedRoutes = useRef(new Set<string>());
  const prefetchRoute = useCallback((path: string) => {
    if (prefetchedRoutes.current.has(path)) return;
    prefetchedRoutes.current.add(path);
    const chunkMap: Record<string, () => Promise<unknown>> = {
      "/": () => import("../dashboard/dashboard"),
      "/inventory": () => import("../inventory"),
      "/account-service": () => import("../account-service"),
      "/deployment": () => import("../deployment"),
      "/compliance": () => import("../compliance"),
      "/sbom": () => import("../sbom"),
      "/analytics": () => import("../analytics"),
      "/telemetry": () => import("../telemetry/telemetry-heatmap-page"),
      "/incidents": () => import("../incidents/incident-response-page"),
      "/digital-twin": () => import("../digital-twin/digital-twin-page"),
      "/executive-summary": () => import("../executive/executive-summary-page"),
      "/user-management": () => import("../user-management"),
    };
    chunkMap[path]?.();
  }, []);

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  return (
    <aside
      className={cn(
        "h-full flex-col bg-card border-r border-border shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden",
        "hidden md:flex",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
      aria-label="Primary navigation"
    >
      {/* Logo + Toggle */}
      <div
        className={cn(
          "flex h-14 items-center shrink-0 border-b border-border/50",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        {collapsed ? (
          <button
            onClick={onToggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label={t("app.expandSidebar")}
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-snug tracking-tight text-foreground">
                IMS <span className="text-accent-text">Gen2</span>
              </span>
              <span className="text-[12px] leading-snug text-muted-foreground">
                {t("app.subtitle")}
              </span>
            </div>
            <button
              onClick={onToggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              aria-label={t("app.collapseSidebar")}
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
          <div key={group.labelKey} className={cn(groupIdx > 0 && "mt-4")}>
            {groupIdx > 0 && <div className="mx-2 mb-3 border-t border-border/50" />}
            {!collapsed && (
              <div className="mb-1.5 px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t(group.labelKey)}
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
                      title={collapsed ? t(item.labelKey) : undefined}
                      aria-label={t(item.labelKey)}
                      aria-current={isActive ? "page" : undefined}
                      onMouseEnter={() => prefetchRoute(item.path)}
                      className={cn(
                        "group relative flex cursor-pointer items-center gap-3 rounded-lg text-[14px] font-medium",
                        collapsed ? "h-[40px] justify-center px-0" : "h-[40px] px-3",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0",
                        isActive
                          ? "bg-high-bg font-semibold text-foreground dark:text-high-text"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                      )}
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isActive
                            ? "text-accent-text"
                            : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
                      {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className={cn("border-t border-border/50 py-3", collapsed ? "px-2" : "px-3")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-white"
              title={`${displayName} (${roleBadge})`}
            >
              {initials}
            </div>
            <button
              onClick={handleSignOut}
              title={t("auth.signOut")}
              aria-label={t("auth.signOut")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 px-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium leading-snug text-foreground">
                  {displayName}
                </div>
                <div className="truncate text-[13px] leading-snug text-muted-foreground">
                  {displayEmail || roleBadge}
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className={cn(
                "mt-2 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-[14px] font-medium text-muted-foreground",
                "hover:bg-muted hover:text-foreground",
              )}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              {t("auth.signOut")}
            </button>
          </>
        )}
      </div>

      {/* App version */}
      <div className={cn("border-t border-border/40 px-3 py-2", collapsed ? "text-center" : "")}>
        <AppVersionBadge compact={collapsed} />
      </div>
    </aside>
  );
}
