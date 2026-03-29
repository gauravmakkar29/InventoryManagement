import { useState, useCallback } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../../lib/use-auth";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Skeleton } from "../../../components/skeleton";

function LayoutSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6f8]">
      {/* Main area — no sidebar skeleton, it's a panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header skeleton */}
        <div
          className="flex h-14 shrink-0 items-center justify-between bg-white px-5"
          style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-[240px] rounded-full" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="mx-1 h-6 w-px bg-gray-200" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="hidden md:flex flex-col gap-1">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </div>

        {/* Content skeleton — realistic dashboard layout */}
        <div className="flex-1 overflow-hidden p-8 space-y-5">
          {/* Welcome row */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-3.5 w-72" />
            </div>
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>

          {/* 4 KPI stat cards */}
          <div className="grid grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-elevated p-5 space-y-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3.5 w-24" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>

          {/* Two-column — 60/40 split */}
          <div className="grid grid-cols-5 gap-5">
            <div className="col-span-3 card-elevated p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
              <div className="flex gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 flex-1 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="col-span-2 card-elevated p-5 flex flex-col items-center gap-4">
              <Skeleton className="h-[140px] w-[140px] rounded-full" />
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-2 gap-3 w-full">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  if (isLoading) {
    return <LayoutSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6f8]">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="page-enter flex-1 overflow-y-auto scroll-smooth p-8" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
