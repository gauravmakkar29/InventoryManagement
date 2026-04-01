import { useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useGlobalSearch } from "./use-global-search";
import { SearchCommandPalette } from "./search-command-palette";

// =============================================================================
// Story 18.2 — GlobalSearchBar
// Compact search input in the header with Ctrl+K / Cmd+K shortcut.
// Opens the SearchCommandPalette on click or keyboard shortcut.
// =============================================================================

export function GlobalSearchBar() {
  const search = useGlobalSearch();

  // Register Ctrl+K / Cmd+K global shortcut
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        search.setOpen(!search.isOpen);
      }
    },
    [search],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return (
    <>
      <button
        type="button"
        onClick={() => search.setOpen(true)}
        className={cn(
          "flex h-9 w-[220px] cursor-pointer items-center gap-2 rounded-full border border-border bg-muted px-3.5",
          "hover:border-muted-foreground/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
        )}
        aria-label="Search (Ctrl+K)"
        title="Search (Ctrl+K)"
      >
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-left text-[14px] text-muted-foreground">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-card px-1.5 text-[12px] font-medium text-muted-foreground">
          Ctrl+K
        </kbd>
      </button>

      <SearchCommandPalette search={search} />
    </>
  );
}
