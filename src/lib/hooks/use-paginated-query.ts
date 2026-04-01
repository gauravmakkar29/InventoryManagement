/**
 * IMS Gen 2 — Pagination Abstractions
 *
 * Cloud-agnostic hooks for offset and cursor-based pagination.
 * Works with any API provider that returns PaginatedResponse<T>.
 *
 * @see Story #183 — Pagination abstractions
 */

import { useCallback, useMemo, useState } from "react";
import { useQuery, useInfiniteQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { PaginatedResponse } from "../types";

// =============================================================================
// Offset-based pagination
// =============================================================================

export interface UsePaginatedQueryOptions<T> {
  /** TanStack Query key prefix (e.g., ["devices"]) */
  queryKey: readonly unknown[];
  /** Fetch function — receives page and pageSize */
  queryFn: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>;
  /** Items per page (default: 10) */
  pageSize?: number;
  /** Initial page (default: 1) */
  initialPage?: number;
  /** Additional TanStack Query options */
  queryOptions?: Omit<UseQueryOptions<PaginatedResponse<T>>, "queryKey" | "queryFn">;
}

export interface PaginatedQueryResult<T> {
  /** Current page items */
  items: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more pages after current */
  hasMore: boolean;
  /** Whether the query is loading */
  isLoading: boolean;
  /** Whether the query is fetching (includes background refetch) */
  isFetching: boolean;
  /** Error if the query failed */
  error: Error | null;
  /** Go to a specific page */
  goToPage: (page: number) => void;
  /** Go to the next page */
  nextPage: () => void;
  /** Go to the previous page */
  prevPage: () => void;
  /** Change page size (resets to page 1) */
  setPageSize: (size: number) => void;
}

export function usePaginatedQuery<T>(
  options: UsePaginatedQueryOptions<T>,
): PaginatedQueryResult<T> {
  const {
    queryKey,
    queryFn,
    pageSize: initialPageSize = 10,
    initialPage = 1,
    queryOptions,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const query = useQuery({
    queryKey: [...queryKey, { page, pageSize }],
    queryFn: () => queryFn(page, pageSize),
    placeholderData: (prev) => prev,
    ...queryOptions,
  });

  const data = query.data;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goToPage = useCallback(
    (p: number) => setPage(Math.max(1, Math.min(p, totalPages))),
    [totalPages],
  );

  const nextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  return {
    items: data?.items ?? [],
    total,
    page,
    pageSize,
    totalPages,
    hasMore: data?.hasMore ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
  };
}

// =============================================================================
// Cursor-based infinite scroll
// =============================================================================

export interface UseCursorPaginatedOptions<T> {
  /** TanStack Query key prefix */
  queryKey: readonly unknown[];
  /** Fetch function — receives cursor (undefined for first page) and pageSize */
  queryFn: (
    cursor: string | undefined,
    pageSize: number,
  ) => Promise<{ items: T[]; nextCursor: string | null }>;
  /** Items per page (default: 20) */
  pageSize?: number;
}

export interface CursorPaginatedResult<T> {
  /** All loaded items (flattened across pages) */
  items: T[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Whether the next page is being fetched */
  isFetchingNextPage: boolean;
  /** Whether there are more pages to load */
  hasNextPage: boolean;
  /** Error if the query failed */
  error: Error | null;
  /** Load the next page (for infinite scroll trigger) */
  fetchNextPage: () => void;
}

export function useCursorPaginated<T>(
  options: UseCursorPaginatedOptions<T>,
): CursorPaginatedResult<T> {
  const { queryKey, queryFn, pageSize = 20 } = options;

  type Page = { items: T[]; nextCursor: string | null };

  const query = useInfiniteQuery<
    Page,
    Error,
    { pages: Page[] },
    readonly unknown[],
    string | undefined
  >({
    queryKey: [...queryKey, { pageSize }],
    queryFn: ({ pageParam }) => queryFn(pageParam, pageSize),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    error: query.error,
    fetchNextPage: () => query.fetchNextPage(),
  };
}
