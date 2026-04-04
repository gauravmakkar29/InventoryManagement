/**
 * Firmware Version Lifecycle State Machine — Story 26.2 (#355)
 *
 * States: SCREENING → STAGED → ACTIVE → DEPRECATED | RECALLED
 * Enforces separation of duties (AC-5) and role-gated transitions (AC-3).
 */

import { useState, useCallback } from "react";
import {
  Shield,
  PackageCheck,
  Zap,
  Archive,
  AlertOctagon,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FirmwareLifecycleState } from "@/lib/types";
import type { Firmware } from "@/lib/types";
import type { Role } from "@/lib/rbac";
import { canPerformAction } from "@/lib/rbac";

// ---------------------------------------------------------------------------
// State configuration
// ---------------------------------------------------------------------------

interface StateConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof Shield;
}

const STATE_CONFIG: Record<FirmwareLifecycleState, StateConfig> = {
  [FirmwareLifecycleState.Screening]: {
    label: "Screening",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-200",
    icon: Shield,
  },
  [FirmwareLifecycleState.Staged]: {
    label: "Staged",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
    icon: PackageCheck,
  },
  [FirmwareLifecycleState.Active]: {
    label: "Active",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    borderColor: "border-emerald-200",
    icon: Zap,
  },
  [FirmwareLifecycleState.Deprecated]: {
    label: "Deprecated",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-200",
    icon: Archive,
  },
  [FirmwareLifecycleState.Recalled]: {
    label: "Recalled",
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
    icon: AlertOctagon,
  },
};

// ---------------------------------------------------------------------------
// Transition rules
// ---------------------------------------------------------------------------

interface Transition {
  to: FirmwareLifecycleState;
  label: string;
  requiredRole: "Admin" | "Admin|Manager";
  confirmMessage: string;
  destructive?: boolean;
}

const TRANSITIONS: Record<FirmwareLifecycleState, Transition[]> = {
  [FirmwareLifecycleState.Screening]: [
    {
      to: FirmwareLifecycleState.Staged,
      label: "Promote to Staged",
      requiredRole: "Admin",
      confirmMessage: "This firmware will be staged for deployment. Continue?",
    },
    {
      to: FirmwareLifecycleState.Recalled,
      label: "Recall",
      requiredRole: "Admin",
      confirmMessage: "Recalling will permanently block all downloads. This cannot be undone.",
      destructive: true,
    },
  ],
  [FirmwareLifecycleState.Staged]: [
    {
      to: FirmwareLifecycleState.Active,
      label: "Activate",
      requiredRole: "Admin",
      confirmMessage: "Activating will auto-deprecate the current active version. Continue?",
    },
    {
      to: FirmwareLifecycleState.Recalled,
      label: "Recall",
      requiredRole: "Admin",
      confirmMessage: "Recalling will permanently block all downloads. This cannot be undone.",
      destructive: true,
    },
  ],
  [FirmwareLifecycleState.Active]: [
    {
      to: FirmwareLifecycleState.Deprecated,
      label: "Deprecate",
      requiredRole: "Admin|Manager",
      confirmMessage: "Deprecating will stop new downloads but preserve existing tokens.",
    },
    {
      to: FirmwareLifecycleState.Recalled,
      label: "Recall",
      requiredRole: "Admin",
      confirmMessage:
        "Recalling will invalidate ALL outstanding download links. This cannot be undone.",
      destructive: true,
    },
  ],
  [FirmwareLifecycleState.Deprecated]: [
    {
      to: FirmwareLifecycleState.Active,
      label: "Re-activate",
      requiredRole: "Admin",
      confirmMessage: "Re-activating will auto-deprecate the current active version.",
    },
    {
      to: FirmwareLifecycleState.Recalled,
      label: "Recall",
      requiredRole: "Admin",
      confirmMessage: "Recalling will permanently block all downloads. This cannot be undone.",
      destructive: true,
    },
  ],
  [FirmwareLifecycleState.Recalled]: [], // Terminal state — no transitions
};

// ---------------------------------------------------------------------------
// State badge component
// ---------------------------------------------------------------------------

export function FirmwareStateBadge({ state }: { state: FirmwareLifecycleState }) {
  const config = STATE_CONFIG[state];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold",
        config.bgColor,
        config.color,
        config.borderColor,
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Visual state machine diagram
// ---------------------------------------------------------------------------

const STATE_ORDER: FirmwareLifecycleState[] = [
  FirmwareLifecycleState.Screening,
  FirmwareLifecycleState.Staged,
  FirmwareLifecycleState.Active,
  FirmwareLifecycleState.Deprecated,
];

export function FirmwareStateDiagram({ currentState }: { currentState: FirmwareLifecycleState }) {
  const isRecalled = currentState === FirmwareLifecycleState.Recalled;

  return (
    <div className="flex flex-col gap-3">
      {/* Main flow */}
      <div className="flex items-center gap-1">
        {STATE_ORDER.map((state, i) => {
          const config = STATE_CONFIG[state];
          const Icon = config.icon;
          const isCurrent = state === currentState;
          const isPast = STATE_ORDER.indexOf(currentState) > i;

          return (
            <div key={state} className="flex items-center gap-1">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all",
                  isCurrent
                    ? cn(
                        config.bgColor,
                        config.color,
                        config.borderColor,
                        "ring-2 ring-offset-1",
                        config.borderColor.replace("border-", "ring-"),
                      )
                    : isPast
                      ? "border-border bg-muted/50 text-muted-foreground"
                      : "border-border/50 bg-card text-muted-foreground/60",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
              </div>
              {i < STATE_ORDER.length - 1 && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isPast ? "text-muted-foreground" : "text-muted-foreground/30",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Recalled indicator */}
      {isRecalled && (
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-red-500" />
          <span className="text-[13px] font-semibold text-red-600">
            RECALLED — all downloads permanently blocked
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transition action panel
// ---------------------------------------------------------------------------

interface FirmwareTransitionPanelProps {
  firmware: Firmware;
  currentState: FirmwareLifecycleState;
  role: Role;
  currentUserId: string;
  onTransition: (firmwareId: string, toState: FirmwareLifecycleState, reason?: string) => void;
}

export function FirmwareTransitionPanel({
  firmware,
  currentState,
  role,
  currentUserId,
  onTransition,
}: FirmwareTransitionPanelProps) {
  const [confirmingTransition, setConfirmingTransition] = useState<Transition | null>(null);
  const [reason, setReason] = useState("");

  const transitions = TRANSITIONS[currentState];

  const canExecute = useCallback(
    (transition: Transition): { allowed: boolean; reason: string } => {
      // Check role
      const allowedRoles = transition.requiredRole.split("|");
      if (!allowedRoles.includes(role)) {
        return { allowed: false, reason: `Requires ${transition.requiredRole} role` };
      }

      // Check RBAC action
      if (!canPerformAction(role, "approve")) {
        return { allowed: false, reason: "Insufficient permissions" };
      }

      // Separation of duties: uploader cannot approve
      if (
        transition.to === FirmwareLifecycleState.Staged &&
        firmware.uploadedBy === currentUserId
      ) {
        return {
          allowed: false,
          reason: "Uploader cannot promote to Staged (separation of duties)",
        };
      }

      return { allowed: true, reason: "" };
    },
    [role, firmware.uploadedBy, currentUserId],
  );

  const handleConfirm = useCallback(() => {
    if (!confirmingTransition) return;
    onTransition(firmware.id, confirmingTransition.to, reason || undefined);
    toast.success(
      `Firmware ${firmware.name} transitioned to ${STATE_CONFIG[confirmingTransition.to].label}`,
    );
    setConfirmingTransition(null);
    setReason("");
  }, [confirmingTransition, firmware, onTransition, reason]);

  if (transitions.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground italic">
        No transitions available — this is a terminal state.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {confirmingTransition ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-[14px] font-medium text-foreground">
            {confirmingTransition.confirmMessage}
          </p>
          <div>
            <label
              htmlFor="transition-reason"
              className="block text-[13px] font-medium text-muted-foreground mb-1"
            >
              Reason (optional)
            </label>
            <input
              id="transition-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for this transition..."
              className="w-full rounded border border-border bg-card px-2.5 py-1.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[14px] font-medium text-white cursor-pointer",
                confirmingTransition.destructive
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-accent hover:bg-accent-hover",
              )}
            >
              Confirm {confirmingTransition.label}
            </button>
            <button
              onClick={() => {
                setConfirmingTransition(null);
                setReason("");
              }}
              className="rounded-lg px-3 py-1.5 text-[14px] font-medium text-muted-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {transitions.map((transition) => {
            const check = canExecute(transition);
            return (
              <button
                key={transition.to}
                onClick={() => setConfirmingTransition(transition)}
                disabled={!check.allowed}
                title={check.allowed ? transition.label : check.reason}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors cursor-pointer",
                  transition.destructive
                    ? "border border-red-200 text-red-600 hover:bg-red-50"
                    : "border border-border text-foreground hover:bg-muted",
                  !check.allowed && "opacity-50 cursor-not-allowed",
                )}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                {transition.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
