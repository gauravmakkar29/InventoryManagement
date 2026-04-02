import { useEffect, useMemo } from "react";
import { X, AlertTriangle, Info, AlertCircle, CheckCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationStore, type StoredNotification } from "@/stores/notification-store";
import type { NotificationEventType } from "@/lib/providers/notification-provider";

export type NotificationSeverity = "critical" | "warning" | "info" | "success";

/**
 * Map real-time event types to UI severity for consistent icon/color rendering.
 */
function eventTypeToSeverity(type: NotificationEventType): NotificationSeverity {
  switch (type) {
    case "alert":
      return "critical";
    case "firmware_approval":
      return "warning";
    case "device_status":
      return "info";
    case "system":
      return "success";
    default:
      return "info";
  }
}

/** Shape used for rendering — merges stored notifications and legacy format. */
interface DisplayNotification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  sourceUrl?: string;
}

/**
 * Map event type to a default source URL for navigation.
 */
function eventTypeToSourceUrl(type: NotificationEventType): string | undefined {
  switch (type) {
    case "device_status":
      return "/inventory";
    case "firmware_approval":
      return "/deployment";
    case "alert":
      return "/compliance";
    default:
      return undefined;
  }
}

/**
 * Format an ISO timestamp into a human-readable relative string.
 */
function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now();
  const then = new Date(isoTimestamp).getTime();
  if (isNaN(then)) return isoTimestamp;
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

const SEVERITY_CONFIG: Record<
  NotificationSeverity,
  { icon: typeof AlertTriangle; iconColor: string; bgColor: string }
> = {
  critical: { icon: AlertCircle, iconColor: "text-red-500", bgColor: "bg-red-50" },
  warning: { icon: AlertTriangle, iconColor: "text-amber-500", bgColor: "bg-amber-50" },
  info: { icon: Info, iconColor: "text-blue-500", bgColor: "bg-blue-50" },
  success: { icon: CheckCircle, iconColor: "text-emerald-500", bgColor: "bg-emerald-50" },
};

/** Default seed notifications shown when the store is empty (before real-time kicks in). */
const SEED_NOTIFICATIONS: DisplayNotification[] = [
  {
    id: "n1",
    severity: "critical",
    title: "Critical CVE Detected",
    message: "CVE-2026-1234 affects 42 devices in Denver DC cluster. Immediate patching required.",
    timestamp: "5m ago",
    read: false,
    sourceUrl: "/compliance",
  },
  {
    id: "n2",
    severity: "warning",
    title: "Firmware Approval Pending",
    message: "Firmware v4.2.0 has been waiting for approval for 48 hours.",
    timestamp: "1h ago",
    read: false,
    sourceUrl: "/deployment",
  },
  {
    id: "n3",
    severity: "info",
    title: "Deployment Completed",
    message: "Firmware v4.1.2 successfully deployed to 18 devices in Shanghai HQ.",
    timestamp: "2h ago",
    read: false,
    sourceUrl: "/deployment",
  },
  {
    id: "n4",
    severity: "success",
    title: "Compliance Audit Passed",
    message: "NIST 800-53 quarterly audit completed with zero findings.",
    timestamp: "4h ago",
    read: true,
    sourceUrl: "/compliance",
  },
  {
    id: "n5",
    severity: "warning",
    title: "Device Offline",
    message: "Device SN-4892 at Denver DC has been offline for 30 minutes.",
    timestamp: "30m ago",
    read: false,
    sourceUrl: "/inventory",
  },
  {
    id: "n6",
    severity: "info",
    title: "Service Order Created",
    message: "New service order SO-2848 created for Munich Office maintenance.",
    timestamp: "3h ago",
    read: true,
    sourceUrl: "/account-service",
  },
  {
    id: "n7",
    severity: "info",
    title: "User Invited",
    message: "New user invitation sent to t.nakamura@company.com.",
    timestamp: "5h ago",
    read: true,
    sourceUrl: "/user-management",
  },
];

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Convert stored real-time notifications to display format, merging with seed data.
 */
function useDisplayNotifications(): DisplayNotification[] {
  const storeNotifications = useNotificationStore((s) => s.notifications);

  return useMemo(() => {
    const realtime: DisplayNotification[] = storeNotifications.map((n: StoredNotification) => ({
      id: n.id,
      severity: eventTypeToSeverity(n.type),
      title: n.title,
      message: n.message,
      timestamp: formatRelativeTime(n.timestamp),
      read: n.read,
      sourceUrl: eventTypeToSourceUrl(n.type),
    }));

    // If we have real-time notifications, show them first, then seed data
    if (realtime.length > 0) {
      return [...realtime, ...SEED_NOTIFICATIONS];
    }

    return SEED_NOTIFICATIONS;
  }, [storeNotifications]);
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const notifications = useDisplayNotifications();
  const { markAsRead: storeMarkAsRead, markAllAsRead: storeMarkAllAsRead } = useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const markAllRead = storeMarkAllAsRead;
  const markRead = storeMarkAsRead;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden="true" />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col bg-card shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/60 px-5">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[12px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[14px] font-medium text-accent-text hover:text-accent-text-hover cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-muted-foreground cursor-pointer"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-[15px] text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => {
                const config = SEVERITY_CONFIG[notification.severity];
                const Icon = config.icon;
                return (
                  <a
                    key={notification.id}
                    href={notification.sourceUrl ?? "#"}
                    onClick={() => markRead(notification.id)}
                    className={cn(
                      "flex gap-3 border-b border-border/30 px-5 py-3.5 hover:bg-muted transition-colors",
                      !notification.read && "bg-orange-50/30",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        config.bgColor,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", config.iconColor)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-[14px] leading-snug",
                            notification.read
                              ? "font-medium text-foreground/80"
                              : "font-semibold text-foreground",
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[14px] leading-snug text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {notification.timestamp}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Returns unread count from the notification store + seed data for header badge. */
export function useNotificationCount(): number {
  const storeUnread = useNotificationStore((s) => s.unreadCount);
  const seedUnread = SEED_NOTIFICATIONS.filter((n) => !n.read).length;
  return storeUnread + seedUnread;
}
