import { ZoomIn, ZoomOut, Navigation } from "lucide-react";

// ---------------------------------------------------------------------------
// ZoomControls
// ---------------------------------------------------------------------------

export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onResetView,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}) {
  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
      <button
        onClick={onZoomIn}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted cursor-pointer"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
      <button
        onClick={onZoomOut}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted cursor-pointer"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      {/* Story 10.1: Compass / reset view */}
      <button
        onClick={onResetView}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted cursor-pointer mt-1"
        aria-label="Reset view"
      >
        <Navigation className="h-4 w-4" />
      </button>
    </div>
  );
}
