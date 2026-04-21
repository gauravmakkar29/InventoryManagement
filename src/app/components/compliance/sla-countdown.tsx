/**
 * <SlaCountdown /> — pill showing time-remaining for a conditional-approval
 * condition, with severity-driven coloring (Story 28.4 AC9).
 *
 * Re-renders once per minute via an internal 60s ticker so the text stays
 * current without triggering upstream query refetches.
 */

import { AlertTriangle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

import type { SlaCondition } from "@/lib/compliance/approval";
import { evaluateSlaSeverity, formatRemaining, type SlaSeverity } from "@/lib/compliance/approval";
import { cn } from "@/lib/utils";

export interface SlaCountdownProps {
  readonly condition: SlaCondition;
  readonly className?: string;
}

const CLASS_BY_SEVERITY: Record<SlaSeverity, string> = {
  safe: "border-muted-foreground/30 bg-muted text-muted-foreground",
  warn: "border-amber-300 bg-amber-50 text-amber-900",
  urgent: "border-red-300 bg-red-50 text-red-800",
  breached: "border-red-600 bg-red-600 text-white",
};

export function SlaCountdown({ condition, className }: SlaCountdownProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const h = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(h);
  }, []);

  const severity = evaluateSlaSeverity(condition, now);
  const text = formatRemaining(condition, now);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        CLASS_BY_SEVERITY[severity],
        className,
      )}
      title={`Due ${new Date(condition.dueAt).toLocaleString()}`}
    >
      {severity === "breached" ? (
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Clock className="h-3 w-3" aria-hidden="true" />
      )}
      {text}
    </span>
  );
}
