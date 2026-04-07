// =============================================================================
// CustomerListPage — Story #389
// /customers — searchable customer table
// =============================================================================

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search, Mail, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiProvider } from "@/lib/providers/registry";
import { queryKeys } from "@/lib/query-keys";
import type { Customer } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ComplianceBadge({ score }: { score: number }) {
  const className =
    score >= 90
      ? "bg-success-bg text-success-text"
      : score >= 70
        ? "bg-warning-bg text-warning-text"
        : "bg-danger-bg text-danger-text";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums",
        className,
      )}
    >
      {score}%
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="space-y-2" role="status" aria-label="Loading customers">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 rounded-lg border border-border p-4">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-44 animate-pulse rounded bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CustomerListPage() {
  const api = useApiProvider();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.customers.list({ search }),
    queryFn: () => api.listCustomers(1, 50, search || undefined),
  });

  const customers = data?.items ?? [];

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const handleRowClick = useCallback(
    (customer: Customer) => {
      navigate(`/customers/${customer.id}`);
    },
    [navigate],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-foreground">Customers</h1>
          <p className="text-[14px] text-muted-foreground">
            Manage customer accounts, sites, and firmware deployments
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by name, code, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            "w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4",
            "text-[14px] text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring",
          )}
          aria-label="Search customers"
        />
      </div>

      {/* Loading */}
      {isLoading && <TableSkeleton />}

      {/* Empty state */}
      {!isLoading && filteredCustomers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-[14px] font-medium text-foreground">
            {search ? "No customers match your search" : "No customers"}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {search
              ? "Try adjusting your search criteria."
              : "Customer accounts will appear here once created."}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && filteredCustomers.length > 0 && (
        <div className="card-elevated overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left" role="table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Code
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Contact
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Devices
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Compliance
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Orders
                  </th>
                  <th className="px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Created
                  </th>
                  <th className="w-10 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => handleRowClick(customer)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowClick(customer);
                      }
                    }}
                    tabIndex={0}
                    role="row"
                    className="cursor-pointer border-t border-border transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Building2
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="text-[14px] font-medium text-foreground">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[12px] font-mono text-foreground">
                        {customer.code}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 text-[14px] text-muted-foreground">
                        <Mail className="h-3 w-3" aria-hidden="true" />
                        {customer.contactEmail}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[14px] tabular-nums text-foreground">
                      {customer.deviceCount}
                    </td>
                    <td className="px-5 py-3">
                      <ComplianceBadge score={customer.complianceScore} />
                    </td>
                    <td className="px-5 py-3 text-[14px] tabular-nums text-foreground">
                      {customer.activeServiceOrders}
                    </td>
                    <td className="px-5 py-3 text-[14px] text-muted-foreground">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
