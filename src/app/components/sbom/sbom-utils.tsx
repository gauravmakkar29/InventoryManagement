import { useState, useCallback } from "react";
import { cn } from "../../../lib/utils";
import { PAGE_SIZE } from "./sbom-constants";

// =============================================================================
// Helper: pagination
// =============================================================================

export function usePagination<T>(items: T[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  return { currentPage, totalPages, pageItems, goToPage, total: items.length };
}

// =============================================================================
// Pagination Controls
// =============================================================================

export function PaginationControls({
  pagination,
}: {
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    goToPage: (p: number) => void;
  };
}) {
  return (
    <div className="mt-4 flex items-center justify-between text-[14px] text-muted-foreground">
      <span>
        Showing {(pagination.currentPage - 1) * PAGE_SIZE + 1} -{" "}
        {Math.min(pagination.currentPage * PAGE_SIZE, pagination.total)} of {pagination.total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => pagination.goToPage(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
          className={cn(
            "rounded-lg px-2.5 py-1 cursor-pointer",
            pagination.currentPage === 1
              ? "text-muted-foreground cursor-not-allowed"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Previous
        </button>
        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => pagination.goToPage(page)}
            className={cn(
              "h-9 w-9 rounded-lg text-center cursor-pointer",
              page === pagination.currentPage
                ? "bg-accent text-white font-medium"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => pagination.goToPage(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
          className={cn(
            "rounded-lg px-2.5 py-1 cursor-pointer",
            pagination.currentPage === pagination.totalPages
              ? "text-muted-foreground cursor-not-allowed"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
