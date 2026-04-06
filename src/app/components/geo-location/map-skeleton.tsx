import { MapPin } from "lucide-react";
import { Skeleton } from "../../../components/skeleton";

// ---------------------------------------------------------------------------
// MapSkeleton
// ---------------------------------------------------------------------------

/** Skeleton placeholder while map loads */
export function MapSkeleton() {
  return (
    <div className="relative h-[450px] w-full rounded-lg overflow-hidden">
      <Skeleton className="h-full w-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <MapPin className="h-8 w-8 text-muted-foreground animate-pulse" />
          <span className="text-[14px] text-muted-foreground">Loading map...</span>
        </div>
      </div>
    </div>
  );
}
