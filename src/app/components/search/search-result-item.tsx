import { Server, Package, ClipboardList, Shield, AlertTriangle } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { GlobalSearchResult, SearchEntityType } from "../../../lib/opensearch-types";

// =============================================================================
// Story 18.2 — SearchResultItem
// Individual result row in the command palette with entity icon, highlighted
// title, subtitle, and entity type badge.
// =============================================================================

const ENTITY_CONFIG: Record<
  SearchEntityType,
  { icon: typeof Server; label: string; badgeBg: string; badgeText: string }
> = {
  Device: {
    icon: Server,
    label: "Device",
    badgeBg: "bg-blue-50 dark:bg-blue-950",
    badgeText: "text-blue-700 dark:text-blue-300",
  },
  Firmware: {
    icon: Package,
    label: "Firmware",
    badgeBg: "bg-purple-50 dark:bg-purple-950",
    badgeText: "text-purple-700 dark:text-purple-300",
  },
  ServiceOrder: {
    icon: ClipboardList,
    label: "Service Order",
    badgeBg: "bg-amber-50 dark:bg-amber-950",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
  Compliance: {
    icon: Shield,
    label: "Compliance",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
  Vulnerability: {
    icon: AlertTriangle,
    label: "Vulnerability",
    badgeBg: "bg-red-50 dark:bg-red-950",
    badgeText: "text-red-700 dark:text-red-300",
  },
};

interface SearchResultItemProps {
  result: GlobalSearchResult;
  isSelected: boolean;
  onClick: () => void;
}

export function SearchResultItem({ result, isSelected, onClick }: SearchResultItemProps) {
  const config = ENTITY_CONFIG[result.entityType];
  const Icon = config.icon;

  // Use highlighted title if available, otherwise plain title
  const highlightedTitle =
    result._highlights && Object.values(result._highlights).length > 0
      ? Object.values(result._highlights)[0]?.[0]
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer",
        isSelected ? "bg-accent/10 dark:bg-accent/20" : "hover:bg-muted/50",
      )}
      role="option"
      aria-selected={isSelected}
    >
      {/* Entity icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Title + subtitle */}
      <div className="min-w-0 flex-1">
        {highlightedTitle ? (
          <div
            className="truncate text-[14px] font-medium text-foreground [&_mark]:bg-amber-200 [&_mark]:px-0.5 [&_mark]:rounded-sm dark:[&_mark]:bg-amber-800"
            dangerouslySetInnerHTML={{ __html: highlightedTitle }}
          />
        ) : (
          <div className="truncate text-[14px] font-medium text-foreground">{result.title}</div>
        )}
        <div className="truncate text-[13px] text-muted-foreground">{result.subtitle}</div>
      </div>

      {/* Entity type badge */}
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium",
          config.badgeBg,
          config.badgeText,
        )}
      >
        {config.label}
      </span>
    </button>
  );
}
