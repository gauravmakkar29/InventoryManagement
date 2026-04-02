/**
 * IMS Gen 2 — useRealtimeNotifications Hook
 *
 * Connects to the real-time notification provider on mount,
 * dispatches events to the Zustand notification store, and
 * invalidates relevant TanStack Query caches.
 *
 * @see Story #193 — Real-time notifications
 */

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  INotificationProvider,
  NotificationEvent,
} from "@/lib/providers/notification-provider";
import { useNotificationStore, type StoredNotification } from "@/stores/notification-store";
import { queryKeys } from "@/lib/query-keys";

// =============================================================================
// Hook Return Type
// =============================================================================

interface UseRealtimeNotificationsReturn {
  notifications: StoredNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

// =============================================================================
// Query Invalidation Map
// =============================================================================

/**
 * Maps notification event types to the TanStack Query keys that should be
 * invalidated when that event type arrives.
 */
const INVALIDATION_MAP: Record<string, readonly (readonly string[])[]> = {
  device_status: [queryKeys.devices.all, queryKeys.dashboard.all, queryKeys.telemetry.all],
  firmware_approval: [queryKeys.firmware.all, queryKeys.dashboard.all],
  alert: [queryKeys.vulnerabilities.all, queryKeys.compliance.all],
  system: [queryKeys.dashboard.all],
};

// =============================================================================
// Hook
// =============================================================================

export function useRealtimeNotifications(
  provider: INotificationProvider | null,
): UseRealtimeNotificationsReturn {
  const queryClient = useQueryClient();
  const providerRef = useRef(provider);
  providerRef.current = provider;

  const { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll } =
    useNotificationStore();

  const handleEvent = useCallback(
    (event: NotificationEvent) => {
      // Add to store
      addNotification(event);

      // Invalidate relevant queries
      const keysToInvalidate = INVALIDATION_MAP[event.type];
      if (keysToInvalidate) {
        for (const queryKey of keysToInvalidate) {
          queryClient.invalidateQueries({ queryKey });
        }
      }
    },
    [addNotification, queryClient],
  );

  useEffect(() => {
    const p = providerRef.current;
    if (!p) return;

    p.connect();
    const unsub = p.onMessage(handleEvent);

    return () => {
      unsub();
      p.disconnect();
    };
  }, [provider, handleEvent]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
