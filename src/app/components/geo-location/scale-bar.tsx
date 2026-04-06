// ---------------------------------------------------------------------------
// ScaleBar (Story 10.1)
// ---------------------------------------------------------------------------

export function ScaleBar({ zoom }: { zoom: number }) {
  return (
    <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 rounded bg-card/80 px-2 py-1 backdrop-blur-sm">
      <div className="h-[2px] w-12 bg-muted-foreground" />
      <span className="text-[12px] text-muted-foreground font-medium">
        {zoom >= 4 ? "100km" : zoom >= 2 ? "500km" : "1000km"}
      </span>
    </div>
  );
}
