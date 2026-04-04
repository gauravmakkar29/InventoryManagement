import { useState, useCallback, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ArrowUpDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortDirection = "asc" | "desc";

interface SortState {
  field: string;
  direction: SortDirection;
}

export interface DataTableColumn<T> {
  /** Unique key for this column — used for sort field matching */
  key: string;
  /** Header label */
  header: string;
  /** Render the cell content for a row */
  cell: (row: T, index: number) => ReactNode;
  /** Enable sorting on this column */
  sortable?: boolean;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Custom header className */
  headerClassName?: string;
  /** Custom cell className */
  cellClassName?: string;
}

interface EmptyConfig {
  icon: LucideIcon;
  title: string;
  description?: string;
}

interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Row data */
  data: T[];
  /** Unique key extractor for each row */
  keyExtractor: (row: T, index: number) => string;
  /** Accessible table caption (required for a11y) */
  caption: string;
  /** Sort configuration */
  sort?: SortState;
  /** Called when a sortable column header is clicked */
  onSortChange?: (sort: SortState) => void;
  /** Empty state configuration */
  empty?: EmptyConfig;
  /** Enable alternating row stripes (default: true) */
  striped?: boolean;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Render expandable content for a row — return null to disable for that row */
  renderExpanded?: (row: T) => ReactNode | null;
  /** Additional className on the wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// SortableHeader (internal)
// ---------------------------------------------------------------------------

function SortableHeader({
  label,
  field,
  active,
  direction,
  align,
  onClick,
  className,
}: {
  label: string;
  field: string;
  active: boolean;
  direction: SortDirection;
  align?: "left" | "center" | "right";
  onClick: (field: string) => void;
  className?: string;
}) {
  return (
    <th
      scope="col"
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : undefined}
      className={cn(
        "px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-muted-foreground",
        "cursor-pointer select-none hover:text-foreground bg-table-header",
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
        className,
      )}
      onClick={() => onClick(field)}
    >
      <div
        className={cn(
          "flex items-center gap-1",
          align === "right" && "justify-end",
          align === "center" && "justify-center",
        )}
      >
        {label}
        {active ? (
          direction === "asc" ? (
            <ChevronUp className="h-3 w-3 text-accent-text" />
          ) : (
            <ChevronDown className="h-3 w-3 text-accent-text" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    </th>
  );
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

/**
 * Shared data table — consistent table rendering across the application.
 * Standardizes: header styling, row height (44px), cell padding (px-4 py-2.5),
 * alternating stripes, sort UI, expandable rows, empty states, and a11y.
 *
 * @see Story 23.1 (#299) — consolidates 6+ table implementations
 */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  caption,
  sort,
  onSortChange,
  empty,
  striped = true,
  onRowClick,
  renderExpanded,
  className,
}: DataTableProps<T>) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const handleSort = useCallback(
    (field: string) => {
      if (!onSortChange) return;
      if (sort?.field === field) {
        onSortChange({ field, direction: sort.direction === "asc" ? "desc" : "asc" });
      } else {
        onSortChange({ field, direction: "asc" });
      }
    },
    [sort, onSortChange],
  );

  const toggleExpanded = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const totalColumns = columns.length + (renderExpanded ? 1 : 0);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b-2 border-border">
            {renderExpanded && (
              <th scope="col" className="w-10 bg-table-header px-2 py-2.5">
                <span className="sr-only">Expand</span>
              </th>
            )}
            {columns.map((col) =>
              col.sortable && onSortChange ? (
                <SortableHeader
                  key={col.key}
                  label={col.header}
                  field={col.key}
                  active={sort?.field === col.key}
                  direction={sort?.direction ?? "asc"}
                  align={col.align}
                  onClick={handleSort}
                  className={col.headerClassName}
                />
              ) : (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-2.5 text-[13px] font-bold uppercase tracking-wider text-muted-foreground bg-table-header",
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left",
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && empty ? (
            <tr>
              <td colSpan={totalColumns}>
                <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
              const key = keyExtractor(row, i);
              const isExpanded = expandedKeys.has(key);
              const expandedContent = renderExpanded?.(row);
              const canExpand = !!expandedContent;

              return (
                <TableRow
                  key={key}
                  row={row}
                  index={i}
                  rowKey={key}
                  columns={columns}
                  striped={striped}
                  isExpanded={isExpanded}
                  canExpand={canExpand}
                  hasExpandColumn={!!renderExpanded}
                  onRowClick={onRowClick}
                  onToggleExpand={toggleExpanded}
                  expandedContent={expandedContent}
                  totalColumns={totalColumns}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TableRow (internal — extracted for React.memo readiness)
// ---------------------------------------------------------------------------

function TableRow<T>({
  row,
  index,
  rowKey,
  columns,
  striped,
  isExpanded,
  canExpand,
  hasExpandColumn,
  onRowClick,
  onToggleExpand,
  expandedContent,
  totalColumns,
}: {
  row: T;
  index: number;
  rowKey: string;
  columns: DataTableColumn<T>[];
  striped: boolean;
  isExpanded: boolean;
  canExpand: boolean;
  hasExpandColumn: boolean;
  onRowClick?: (row: T, index: number) => void;
  onToggleExpand: (key: string) => void;
  expandedContent: ReactNode | null;
  totalColumns: number;
}) {
  return (
    <>
      <tr
        className={cn(
          "h-[44px] border-b border-border/30 last:border-0 transition-colors",
          striped && index % 2 === 1 && "bg-muted/30",
          onRowClick && "cursor-pointer",
          "hover:bg-muted/50",
          isExpanded && "bg-muted/80",
        )}
        onClick={onRowClick ? () => onRowClick(row, index) : undefined}
      >
        {hasExpandColumn && (
          <td className="w-10 px-2 py-2.5 text-center">
            {canExpand && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(rowKey);
                }}
                className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Collapse row" : "Expand row"}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-150",
                    isExpanded && "rotate-90",
                  )}
                />
              </button>
            )}
          </td>
        )}
        {columns.map((col) => (
          <td
            key={col.key}
            className={cn(
              "px-4 py-2.5",
              col.align === "right"
                ? "text-right"
                : col.align === "center"
                  ? "text-center"
                  : "text-left",
              col.cellClassName,
            )}
          >
            {col.cell(row, index)}
          </td>
        ))}
      </tr>
      {isExpanded && expandedContent && (
        <tr className="bg-muted/40">
          <td colSpan={totalColumns} className="px-4 py-3">
            {expandedContent}
          </td>
        </tr>
      )}
    </>
  );
}
