import { Clock } from "lucide-react";

// =============================================================================
// Story 18.2 — SearchRecentList
// Shows recent searches when palette is opened with empty query.
// =============================================================================

interface SearchRecentListProps {
  searches: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
}

export function SearchRecentList({ searches, onSelect, onClear }: SearchRecentListProps) {
  if (searches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <p className="text-[14px] text-muted-foreground">
          Type to search across devices, firmware, service orders, compliance, and vulnerabilities.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Searches
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Clear all
        </button>
      </div>
      {searches.map((search) => (
        <button
          key={search}
          type="button"
          onClick={() => onSelect(search)}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-[14px] text-foreground truncate">{search}</span>
        </button>
      ))}
    </div>
  );
}
