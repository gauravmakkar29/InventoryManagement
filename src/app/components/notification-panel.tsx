import { useState, useCallback, useEffect } from "react";
import { X, AlertTriangle, Info, AlertCircle, CheckCircle, Bell } from "lucide-react";
import { cn } from "../../lib/utils";

export type NotificationSeverity = "critical" | "warning" | "info" | "success";

export interface Notification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  sourceUrl?: string;
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

const MOCK_NOTIFICATIONS: Notification[] = [
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

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

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

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden="true" />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-[360px] flex-col bg-white shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-gray-100 px-5">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[12px] font-medium text-[#FF7900] hover:text-[#e66d00] cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
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
              <Bell className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-[14px] text-gray-500">No notifications</p>
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
                      "flex gap-3 border-b border-gray-50 px-5 py-3.5 hover:bg-gray-50 transition-colors",
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
                            "text-[13px] leading-tight",
                            notification.read
                              ? "font-medium text-gray-700"
                              : "font-semibold text-gray-900",
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#FF7900]" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] leading-snug text-gray-500 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">{notification.timestamp}</p>
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

/** Returns mock unread count for header badge. */
export function useNotificationCount(): number {
  return MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
}
