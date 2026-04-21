/**
 * <ImpactQueryTable /> — paginated + filterable table of consumers bound to
 * a specific (resource, version) pair (Story 28.7 AC10-AC11). CSV export
 * iterates all pages via `listAllConsumers`.
 */

import { useState } from "react";
import { Download } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ComplianceActor } from "@/lib/compliance/types";
import {
  listAllConsumers,
  useInverseDependency,
  type Consumer,
  type IDependencyGraph,
} from "@/lib/compliance/impact";

export interface ImpactQueryTableProps<TMeta = unknown> {
  readonly driver: IDependencyGraph;
  readonly actor: ComplianceActor;
  readonly resourceId: string;
  readonly version: string;
  readonly scopeOptions?: readonly string[];
  readonly stateOptions?: readonly string[];
  readonly limit?: number;
  readonly renderMeta?: (consumer: Consumer<TMeta>) => React.ReactNode;
  readonly className?: string;
}

export function ImpactQueryTable<TMeta>({
  driver,
  actor,
  resourceId,
  version,
  scopeOptions = [],
  stateOptions = [],
  limit = 50,
  renderMeta,
  className,
}: ImpactQueryTableProps<TMeta>) {
  const [scope, setScope] = useState<string[]>([]);
  const [state, setState] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const q = useInverseDependency({
    driver,
    actor,
    resourceId,
    version,
    options: {
      scope: scope.length ? scope : undefined,
      state: state.length ? state : undefined,
      cursor,
      limit,
    },
  });

  const onExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const rows = await listAllConsumers(driver, actor, resourceId, version, {
        scope: scope.length ? scope : undefined,
        state: state.length ? state : undefined,
      });
      const csv = toCsv(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `impact-${resourceId}-${version}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError((e as Error).message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[14px] font-semibold text-foreground">
            Impact: {resourceId} @ {version}
          </h3>
          {scopeOptions.length > 0 && (
            <MultiChipSelect
              label="Scope"
              options={scopeOptions}
              value={scope}
              onChange={setScope}
            />
          )}
          {stateOptions.length > 0 && (
            <MultiChipSelect
              label="State"
              options={stateOptions}
              value={state}
              onChange={setState}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => void onExport()}
          disabled={exporting}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-foreground hover:bg-muted disabled:opacity-50"
        >
          <Download className="h-3 w-3" aria-hidden="true" />
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </header>

      {exportError && (
        <p
          role="alert"
          className="border-b border-border bg-red-50 px-4 py-2 text-[12px] text-red-800"
        >
          {exportError}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-muted/40 text-left text-muted-foreground">
              <th className="px-3 py-2">Consumer</th>
              <th className="px-3 py-2">Scope</th>
              <th className="px-3 py-2">State</th>
              <th className="px-3 py-2">Updated</th>
              {renderMeta && <th className="px-3 py-2">Details</th>}
            </tr>
          </thead>
          <tbody>
            {q.isLoading && (
              <tr>
                <td colSpan={renderMeta ? 5 : 4} className="px-3 py-4 text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {q.data?.items.length === 0 && (
              <tr>
                <td colSpan={renderMeta ? 5 : 4} className="px-3 py-4 text-muted-foreground">
                  No consumers on this version.
                </td>
              </tr>
            )}
            {q.data?.items.map((c) => (
              <tr key={c.consumerId} className="border-t border-border">
                <td className="px-3 py-2 font-medium text-foreground">{c.consumerId}</td>
                <td className="px-3 py-2">
                  {c.scope.map((s) => (
                    <span
                      key={s}
                      className="mr-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px]"
                    >
                      {s}
                    </span>
                  ))}
                </td>
                <td className="px-3 py-2">{c.state}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(c.updatedAt).toLocaleString()}
                </td>
                {renderMeta && (
                  <td className="px-3 py-2 text-muted-foreground">
                    {renderMeta(c as Consumer<TMeta>)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        <span>{q.data?.items.length ?? 0} shown</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCursor(undefined)}
            disabled={!cursor}
            className="rounded-md border border-border px-2 py-1 text-foreground hover:bg-muted disabled:opacity-50"
          >
            First
          </button>
          <button
            type="button"
            onClick={() => q.data?.nextCursor && setCursor(q.data.nextCursor)}
            disabled={!q.data?.nextCursor}
            className="rounded-md border border-border px-2 py-1 text-foreground hover:bg-muted disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}

function MultiChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  readonly label: string;
  readonly options: readonly string[];
  readonly value: readonly string[];
  readonly onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex items-center gap-1 text-[11px]">
      <span className="text-muted-foreground">{label}:</span>
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? value.filter((v) => v !== opt) : [...value, opt])}
            className={cn(
              "rounded-full border px-2 py-0.5",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function toCsv(rows: readonly Consumer[]): string {
  const header = [
    "consumerId",
    "consumerType",
    "resourceId",
    "version",
    "scope",
    "state",
    "updatedAt",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.consumerId),
        csvEscape(r.consumerType),
        csvEscape(r.resourceId),
        csvEscape(r.version),
        csvEscape(r.scope.join("|")),
        csvEscape(r.state),
        csvEscape(r.updatedAt),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
