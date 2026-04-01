import { SearchX } from "lucide-react";

// =============================================================================
// Story 18.2 — SearchEmptyState
// "No results found" with search suggestions.
// =============================================================================

interface SearchEmptyStateProps {
  query: string;
}

export function SearchEmptyState({ query }: SearchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-[15px] font-medium text-foreground mb-1">
        No results found for &ldquo;{query}&rdquo;
      </p>
      <p className="text-[14px] text-muted-foreground max-w-xs">
        Try searching by device name, serial number, firmware version, CVE ID, or service order
        title.
      </p>
    </div>
  );
}
