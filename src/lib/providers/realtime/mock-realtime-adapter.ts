/**
 * IMS Gen 2 — Mock Real-time Notification Adapter
 *
 * Implements INotificationProvider with simulated events on a configurable interval.
 * Generates realistic device status, firmware approval, alert, and system events.
 * Used for local development without a real WebSocket/SSE backend.
 *
 * @see Story #193 — Real-time notifications
 */

import type {
  INotificationProvider,
  NotificationEvent,
  NotificationEventType,
  ConnectionState,
} from "../notification-provider";

// =============================================================================
// Configuration
// =============================================================================

interface MockRealtimeConfig {
  /** Interval between simulated events in ms. Default: 30000 (30s) */
  intervalMs?: number;
  /** Whether to emit an initial event on connect. Default: true */
  emitOnConnect?: boolean;
}

const DEFAULT_INTERVAL = 30_000;

// =============================================================================
// Event Templates
// =============================================================================

interface EventTemplate {
  type: NotificationEventType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: "device_status",
    title: "Device Status Changed",
    message: "Device SN-7291 at Denver DC transitioned from Online to Maintenance.",
    metadata: { deviceId: "d-7291", previousStatus: "online", newStatus: "maintenance" },
  },
  {
    type: "device_status",
    title: "Device Offline Alert",
    message: "Device SN-3847 at Shanghai HQ has gone offline. Last heartbeat 5 minutes ago.",
    metadata: { deviceId: "d-3847", previousStatus: "online", newStatus: "offline" },
  },
  {
    type: "device_status",
    title: "Device Back Online",
    message: "Device SN-5012 at Munich Office is back online after scheduled maintenance.",
    metadata: { deviceId: "d-5012", previousStatus: "maintenance", newStatus: "online" },
  },
  {
    type: "firmware_approval",
    title: "Firmware Approval Requested",
    message: "Firmware v4.3.0 (build 2026.03.28) requires testing approval before deployment.",
    metadata: { firmwareId: "fw-430", stage: "testing", version: "4.3.0" },
  },
  {
    type: "firmware_approval",
    title: "Firmware Approved for Deployment",
    message: "Firmware v4.2.1 has passed all approval stages and is ready for rollout.",
    metadata: { firmwareId: "fw-421", stage: "approved", version: "4.2.1" },
  },
  {
    type: "firmware_approval",
    title: "Firmware Rejected",
    message: "Firmware v4.3.0-rc2 was rejected during testing — stability issues found.",
    metadata: { firmwareId: "fw-430rc2", stage: "rejected", version: "4.3.0-rc2" },
  },
  {
    type: "alert",
    title: "Critical Vulnerability Detected",
    message: "CVE-2026-4821 (CVSS 9.8) affects 23 devices running firmware v3.9.x.",
    metadata: { cveId: "CVE-2026-4821", cvss: 9.8, affectedCount: 23 },
  },
  {
    type: "alert",
    title: "Compliance Audit Due",
    message: "NIST 800-53 quarterly compliance review is due in 7 days.",
    metadata: { auditType: "NIST 800-53", daysRemaining: 7 },
  },
  {
    type: "alert",
    title: "Service Order Overdue",
    message: "Service order SO-2891 for Tokyo Office maintenance is 2 days overdue.",
    metadata: { serviceOrderId: "SO-2891", daysOverdue: 2 },
  },
  {
    type: "system",
    title: "Scheduled Maintenance Window",
    message: "System maintenance scheduled for Sunday 02:00-04:00 UTC. Expect brief downtime.",
    metadata: { maintenanceWindow: "2026-04-05T02:00:00Z" },
  },
  {
    type: "system",
    title: "Platform Update Available",
    message: "IMS Gen 2 v2.4.0 is available with improved telemetry dashboards.",
    metadata: { version: "2.4.0" },
  },
  {
    type: "system",
    title: "Backup Completed",
    message: "Nightly backup completed successfully. 2.3 GB archived.",
    metadata: { sizeGb: 2.3, status: "success" },
  },
];

// =============================================================================
// Adapter
// =============================================================================

type MessageCallback = (event: NotificationEvent) => void;

export class MockRealtimeAdapter implements INotificationProvider {
  private readonly intervalMs: number;
  private readonly emitOnConnect: boolean;
  private state: ConnectionState = "disconnected";
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private templateIndex = 0;

  /** Channel-specific subscribers: channel -> Set<callback> */
  private channelSubs = new Map<string, Set<MessageCallback>>();

  /** Global message subscribers */
  private globalSubs = new Set<MessageCallback>();

  constructor(config?: MockRealtimeConfig) {
    this.intervalMs = config?.intervalMs ?? DEFAULT_INTERVAL;
    this.emitOnConnect = config?.emitOnConnect ?? true;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  connect(): void {
    if (this.state === "connected") return;

    this.state = "connected";

    if (this.emitOnConnect) {
      // Emit first event after a short delay to let subscribers attach
      setTimeout(() => {
        if (this.state === "connected") {
          this.emitNextEvent();
        }
      }, 500);
    }

    this.intervalTimer = setInterval(() => {
      this.emitNextEvent();
    }, this.intervalMs);
  }

  disconnect(): void {
    this.state = "disconnected";
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  subscribe(channel: string, callback: MessageCallback): () => void {
    let subs = this.channelSubs.get(channel);
    if (!subs) {
      subs = new Set();
      this.channelSubs.set(channel, subs);
    }
    subs.add(callback);

    return () => {
      subs?.delete(callback);
      if (subs?.size === 0) {
        this.channelSubs.delete(channel);
      }
    };
  }

  onMessage(callback: MessageCallback): () => void {
    this.globalSubs.add(callback);
    return () => {
      this.globalSubs.delete(callback);
    };
  }

  /** Expose current connection state for diagnostics. */
  getState(): ConnectionState {
    return this.state;
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private emitNextEvent(): void {
    const template = EVENT_TEMPLATES[this.templateIndex % EVENT_TEMPLATES.length]!;
    this.templateIndex++;

    const event: NotificationEvent = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: template.type,
      title: template.title,
      message: template.message,
      timestamp: new Date().toISOString(),
      metadata: template.metadata,
    };

    this.dispatch(event);
  }

  private dispatch(event: NotificationEvent): void {
    // Global subscribers
    for (const cb of this.globalSubs) {
      cb(event);
    }

    // Channel subscribers
    const subs = this.channelSubs.get(event.type);
    if (subs) {
      for (const cb of subs) {
        cb(event);
      }
    }
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createMockRealtimeAdapter(config?: MockRealtimeConfig): INotificationProvider {
  return new MockRealtimeAdapter(config);
}
