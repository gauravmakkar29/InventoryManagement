import { Skeleton } from "../../components/skeleton";

/**
 * Page-level loading skeleton shown during lazy route transitions.
 * Matches the content area layout for a smooth visual experience.
 */
export function PageLoader() {
  return (
    <div className="space-y-5 animate-in fade-in duration-200" aria-busy="true">
      <span className="sr-only" aria-live="polite">
        Loading page...
      </span>
      {/* Header area */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      {/* Content cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-elevated p-5 space-y-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        ))}
      </div>
      {/* Table area */}
      <div className="card-elevated overflow-hidden">
        <div className="px-5 py-4">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-gray-100 px-5 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
