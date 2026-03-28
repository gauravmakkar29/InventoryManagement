import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../../lib/use-auth";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Skeleton } from "../../../components/skeleton";

function LayoutSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar skeleton */}
      <div className="flex w-14 flex-col bg-[#0f172a]">
        <div className="flex h-12 items-center justify-center border-b border-slate-700/50 px-3">
          <Skeleton className="h-4 w-8 rounded bg-slate-700" />
        </div>
        <div className="flex-1 space-y-2 px-2 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded bg-slate-700/60" />
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header skeleton */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <Skeleton className="h-4 w-28" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-6 overflow-hidden p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LayoutSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto scroll-smooth p-6" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
