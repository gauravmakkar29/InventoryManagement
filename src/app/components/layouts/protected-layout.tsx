import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../../lib/use-auth";
import { useUIStore } from "../../../stores/ui-store";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Breadcrumbs } from "./breadcrumbs";
import { SkipToContent } from "./skip-to-content";
import { CommandPalette } from "./command-palette";
import { ConnectivityStatusBar } from "../connectivity/connectivity-status-bar";
import { useConnectivityMonitor } from "../connectivity/use-connectivity-monitor";
import { Skeleton } from "../../../components/skeleton";

function LayoutSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background" aria-busy="true">
      <span className="sr-only" aria-live="polite">
        Loading application...
      </span>
      {/* Sidebar skeleton */}
      <div className="flex w-[240px] shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center px-5">
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex-1 px-3 py-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header skeleton */}
        <div className="flex h-14 shrink-0 items-center justify-between bg-card px-5 border-b border-border">
          <Skeleton className="h-5 w-28" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[240px] rounded-full" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="mx-1 h-6 w-px bg-border" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="hidden md:flex flex-col gap-1">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 overflow-hidden p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-3.5 w-72" />
            </div>
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-elevated p-5 space-y-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const connectivity = useConnectivityMonitor();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  if (isLoading) {
    return <LayoutSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <SkipToContent />
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <ConnectivityStatusBar connectivity={connectivity} />
          <main
            id="main-content"
            className="page-enter flex-1 overflow-y-auto scroll-smooth px-4 py-5 sm:px-5 md:px-6 lg:p-6"
            role="main"
            tabIndex={-1}
          >
            <Breadcrumbs />
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette />
    </>
  );
}
