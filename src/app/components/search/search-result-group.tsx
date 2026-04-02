import { Server, Package, ClipboardList, Shield, AlertTriangle } from "lucide-react";
import type { GlobalSearchResult, SearchEntityType } from "@/lib/opensearch-types";
import { SearchResultItem } from "./search-result-item";

// =============================================================================
// Story 18.2 — SearchResultGroup
// Groups results by entity type with section headers showing icon + count.
// =============================================================================

const ENTITY_ICONS: Record<SearchEntityType, typeof Server> = {
  Device: Server,
  Firmware: Package,
  ServiceOrder: ClipboardList,
  Compliance: Shield,
  Vulnerability: AlertTriangle,
};

interface SearchResultGroupProps {
  entityType: SearchEntityType;
  results: GlobalSearchResult[];
  selectedIndex: number;
  globalOffset: number;
  onSelect: (result: GlobalSearchResult) => void;
}

export function SearchResultGroup({
  entityType,
  results,
  selectedIndex,
  globalOffset,
  onSelect,
}: SearchResultGroupProps) {
  const Icon = ENTITY_ICONS[entityType];

  return (
    <div role="group" aria-label={`${entityType} results`}>
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-border first:border-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          {entityType === "ServiceOrder" ? "Service Orders" : `${entityType}s`} ({results.length})
        </span>
      </div>

      {/* Results */}
      {results.map((result, idx) => (
        <SearchResultItem
          key={result.id}
          result={result}
          isSelected={selectedIndex === globalOffset + idx}
          onClick={() => onSelect(result)}
        />
      ))}
    </div>
  );
}
