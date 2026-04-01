/**
 * IMS Gen 2 — Optimistic Mutation Pattern
 *
 * Reusable hook wrapping TanStack Query useMutation with:
 * - Optimistic cache updates (instant UI feedback)
 * - Automatic rollback on server error
 * - Toast notification on rollback
 * - Query invalidation on success
 *
 * @see Story #184 — Optimistic updates with rollback
 *
 * @example Device status change:
 * ```ts
 * const mutation = useOptimisticMutation({
 *   mutationFn: (vars) => api.updateDevice(vars.id, { status: vars.status }),
 *   queryKey: ["devices"],
 *   updater: (old, vars) => ({
 *     ...old,
 *     items: old.items.map(d =>
 *       d.id === vars.id ? { ...d, status: vars.status } : d
 *     ),
 *   }),
 * });
 * ```
 *
 * @example Service order kanban move:
 * ```ts
 * const mutation = useOptimisticMutation({
 *   mutationFn: (vars) => api.updateServiceOrder(vars.id, { status: vars.status }),
 *   queryKey: ["serviceOrders"],
 *   updater: (old, vars) => ({
 *     ...old,
 *     items: old.items.map(o =>
 *       o.id === vars.id ? { ...o, status: vars.status } : o
 *     ),
 *   }),
 *   rollbackMessage: "Could not move order — reverted to previous status",
 * });
 * ```
 */

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

export interface UseOptimisticMutationOptions<TData, TVars> {
  /** The mutation function that calls the API */
  mutationFn: (variables: TVars) => Promise<TData>;
  /** Query key to optimistically update */
  queryKey: QueryKey;
  /** Produce the optimistic cache state from the previous data + mutation variables */
  updater: (previousData: TData, variables: TVars) => TData;
  /** Toast message on rollback (default: "Action failed — changes reverted") */
  rollbackMessage?: string;
  /** Toast message on success (optional — no toast if omitted) */
  successMessage?: string;
  /** Additional query keys to invalidate on success */
  invalidateKeys?: QueryKey[];
  /** Called on success with the server response */
  onSuccess?: (data: TData, variables: TVars) => void;
}

export function useOptimisticMutation<TData, TVars>(
  options: UseOptimisticMutationOptions<TData, TVars>,
) {
  const queryClient = useQueryClient();
  const {
    mutationFn,
    queryKey,
    updater,
    rollbackMessage = "Action failed — changes reverted",
    successMessage,
    invalidateKeys = [],
    onSuccess,
  } = options;

  return useMutation({
    mutationFn,

    onMutate: async (variables: TVars) => {
      // Cancel in-flight queries so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update the cache
      if (previousData) {
        queryClient.setQueryData<TData>(queryKey, updater(previousData, variables));
      }

      return { previousData };
    },

    onError: (_error, _variables, context) => {
      // Rollback to the previous value
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(rollbackMessage);
    },

    onSuccess: (data, variables) => {
      if (successMessage) {
        toast.success(successMessage);
      }
      onSuccess?.(data, variables);
    },

    onSettled: () => {
      // Refetch to ensure server state is in sync
      queryClient.invalidateQueries({ queryKey });
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
