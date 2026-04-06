/**
 * Mock query function wrapper for TanStack Query.
 *
 * Wraps static mock data in an async function with simulated latency,
 * giving hooks realistic loading states while keeping mock data.
 * Replace queryFn with real API calls when backends are connected.
 */

const MOCK_LATENCY_MS = 300;

/**
 * Creates a queryFn that returns mock data after a simulated delay.
 * Use as: `useQuery({ queryKey, queryFn: mockQueryFn(MOCK_DATA) })`
 */
export function mockQueryFn<T>(data: T, delayMs = MOCK_LATENCY_MS): () => Promise<T> {
  return () => new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}
