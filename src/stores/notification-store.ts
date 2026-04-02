/**
 * IMS Gen 2 — Notification Store (Zustand)
 *
 * Manages real-time and historical notification state.
 * Fed by the useRealtimeNotifications hook via the notification provider.
 *
 * @see Story #193 — Real-time notifications
 */

import { create } from "zustand";
import type { NotificationEvent } from "@/lib/providers/notification-provider";

// =============================================================================
// Store Shape
// =============================================================================

export interface StoredNotification extends NotificationEvent {
  read: boolean;
}

interface NotificationState {
  notifications: StoredNotification[];
  unreadCount: number;

  /** Add a new real-time notification (unread by default). */
  addNotification: (event: NotificationEvent) => void;

  /** Mark a single notification as read. */
  markAsRead: (id: string) => void;

  /** Mark all notifications as read. */
  markAllAsRead: () => void;

  /** Remove all notifications. */
  clearAll: () => void;
}

// =============================================================================
// Constants
// =============================================================================

/** Maximum notifications to keep in store to prevent memory growth. */
const MAX_NOTIFICATIONS = 100;

// =============================================================================
// Store
// =============================================================================

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (event) =>
    set((state) => {
      const newNotification: StoredNotification = { ...event, read: false };
      const updated = [newNotification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
