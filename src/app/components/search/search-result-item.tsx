import { memo, type ReactNode } from "react";
import { Server, Package, ClipboardList, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlobalSearchResult, SearchEntityType } from "@/lib/opensearch-types";

/**
 * Safely renders OpenSearch highlight markup by splitting on <mark>...</mark>
 * tags and rendering them as React elements. All other content (including any
 * injected HTML tags) is rendered as plain text, auto-escaped by React.
 *
 * Enforces NIST SI-3 (Malicious Code Protection) by eliminating
 * dangerouslySetInnerHTML usage for user-facing search output.
 */
export function renderHighlight(text: string): ReactNode {
  const MARK_PATTERN = /<mark>(.*?)<\/mark>/gi;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIndex = 0;
  let hasMarks = false;

  while ((match = MARK_PATTERN.exec(text)) !== null) {
    hasMarks = true;
    // Add any text before this <mark> as a plain string (auto-escaped by React)
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Render the matched content inside a safe React <mark> element
    parts.push(
      <mark key={keyIndex++} className="bg-warning-bg px-0.5 rounded-sm">
        {match[1]}
      </mark>,
    );
    lastIndex = MARK_PATTERN.lastIndex;
  }

  // If no marks were found, return the plain string directly
  if (!hasMarks) return text;

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

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
    badgeBg: "bg-info-bg",
    badgeText: "text-info-text",
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
    badgeBg: "bg-warning-bg",
    badgeText: "text-warning-text",
  },
  Compliance: {
    icon: Shield,
    label: "Compliance",
    badgeBg: "bg-success-bg",
    badgeText: "text-success-text",
  },
  Vulnerability: {
    icon: AlertTriangle,
    label: "Vulnerability",
    badgeBg: "bg-danger-bg",
    badgeText: "text-danger-text",
  },
};

interface SearchResultItemProps {
  result: GlobalSearchResult;
  isSelected: boolean;
  onClick: () => void;
}

/** Memoized — rendered in .map() loop inside search palette (#311) */
export const SearchResultItem = memo(function SearchResultItem({
  result,
  isSelected,
  onClick,
}: SearchResultItemProps) {
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
          <div className="truncate text-[14px] font-medium text-foreground">
            {renderHighlight(highlightedTitle)}
          </div>
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
});
