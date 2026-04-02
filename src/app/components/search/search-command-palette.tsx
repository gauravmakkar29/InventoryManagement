import { useEffect, useRef, useCallback } from "react";
import { Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlobalSearchResult, SearchEntityType } from "@/lib/opensearch-types";
import type { UseGlobalSearchReturn } from "./use-global-search";
import { SearchResultGroup } from "./search-result-group";
import { SearchEmptyState } from "./search-empty-state";
import { SearchRecentList } from "./search-recent-list";

// =============================================================================
// Story 18.2 — SearchCommandPalette
// Centered modal overlay (640px wide, max 480px tall) with dark backdrop.
// Keyboard navigation: Arrow Up/Down, Enter, Escape.
// =============================================================================

const ENTITY_TYPE_ORDER: SearchEntityType[] = [
  "Device",
  "Firmware",
  "ServiceOrder",
  "Compliance",
  "Vulnerability",
];

/** Route mapping for entity type navigation */
function getEntityRoute(result: GlobalSearchResult): string {
  switch (result.entityType) {
    case "Device":
      return `/inventory?device=${result.id}`;
    case "Firmware":
      return `/deployment?firmware=${result.id}`;
    case "ServiceOrder":
      return `/account-service?order=${result.id}`;
    case "Compliance":
      return `/compliance?record=${result.id}`;
    case "Vulnerability":
      return `/compliance?tab=vulnerabilities&vuln=${result.id}`;
    default:
      return "/";
  }
}

interface SearchCommandPaletteProps {
  search: UseGlobalSearchReturn;
}

export function SearchCommandPalette({ search }: SearchCommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus input when palette opens
  useEffect(() => {
    if (search.isOpen) {
      // Slight delay to ensure DOM is ready
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [search.isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          search.selectNext();
          break;
        case "ArrowUp":
          e.preventDefault();
          search.selectPrev();
          break;
        case "Enter": {
          e.preventDefault();
          const selected = search.flatResults[search.selectedIndex];
          if (selected) {
            search.addRecentSearch(search.query);
            search.setOpen(false);
            // Navigate — in production use router.push
            window.location.hash = getEntityRoute(selected);
          }
          break;
        }
        case "Escape":
          e.preventDefault();
          search.setOpen(false);
          break;
      }
    },
    [search],
  );

  const handleResultSelect = useCallback(
    (result: GlobalSearchResult) => {
      search.addRecentSearch(search.query);
      search.setOpen(false);
      window.location.hash = getEntityRoute(result);
    },
    [search],
  );

  const handleRecentSelect = useCallback(
    (q: string) => {
      search.setQuery(q);
    },
    [search],
  );

  if (!search.isOpen) return null;

  // Build ordered groups
  const orderedGroups = ENTITY_TYPE_ORDER.filter(
    (type) => search.groupedResults[type] && search.groupedResults[type]!.length > 0,
  );

  // Calculate global offsets for keyboard navigation
  let runningOffset = 0;
  const groupOffsets: Record<string, number> = {};
  for (const type of orderedGroups) {
    groupOffsets[type] = runningOffset;
    runningOffset += search.groupedResults[type]!.length;
  }

  const hasQuery = search.query.length >= 2;
  const hasResults = search.results.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => search.setOpen(false)}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        ref={panelRef}
        className={cn(
          "fixed left-1/2 top-[20%] z-50 w-full max-w-[640px] -translate-x-1/2",
          "rounded-xl border border-border bg-card shadow-2xl",
          "flex flex-col overflow-hidden",
          "animate-in fade-in-0 zoom-in-95 duration-150",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          {search.isLoading ? (
            <Loader2 className="h-5 w-5 text-muted-foreground shrink-0 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            placeholder="Search devices, firmware, service orders, compliance, CVEs..."
            className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Global search"
            autoComplete="off"
            spellCheck={false}
          />
          {search.query && (
            <button
              type="button"
              onClick={() => search.setQuery("")}
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[12px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results area */}
        <div className="max-h-[380px] overflow-y-auto" role="listbox" aria-label="Search results">
          {!hasQuery && (
            <SearchRecentList
              searches={search.recentSearches}
              onSelect={handleRecentSelect}
              onClear={search.clearRecentSearches}
            />
          )}

          {hasQuery && !search.isLoading && !hasResults && (
            <SearchEmptyState query={search.query} />
          )}

          {hasQuery && search.isLoading && (
            <div className="space-y-1 p-4" aria-busy="true">
              <span className="sr-only" aria-live="polite">
                Searching...
              </span>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {hasQuery && !search.isLoading && hasResults && (
            <>
              {orderedGroups.map((type) => (
                <SearchResultGroup
                  key={type}
                  entityType={type}
                  results={search.groupedResults[type]!}
                  selectedIndex={search.selectedIndex}
                  globalOffset={groupOffsets[type]!}
                  onSelect={handleResultSelect}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-border px-1 text-[12px] font-medium">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-border px-1 text-[12px] font-medium">
                ↵
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-border px-1 text-[12px] font-medium">
                esc
              </kbd>
              Close
            </span>
          </div>
          {hasQuery && hasResults && (
            <span className="text-[13px] text-muted-foreground">
              {search.results.length} result{search.results.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
