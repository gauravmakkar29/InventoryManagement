import { QueryClient } from "@tanstack/react-query";

/**
 * Global QueryClient with enterprise defaults.
 *
 * - staleTime: 5 min — data considered fresh, no background refetch
 * - gcTime: 30 min — unused cache entries garbage collected
 * - retry: 2 attempts with exponential backoff
 * - refetchOnWindowFocus: true — data stays fresh across tab switches
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
