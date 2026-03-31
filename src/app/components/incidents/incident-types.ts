/**
 * IMS Gen 2 — Epic 14: Incident Response & Quarantine Management
 * Local types and constants for incident page components.
 */
import { AlertTriangle, Lock, MapPin, BookOpen, BarChart3 } from "lucide-react";

// ---------------------------------------------------------------------------
// Tab Navigation
// ---------------------------------------------------------------------------
export type TabId = "incidents" | "isolated" | "quarantine" | "playbooks" | "dashboard";

export const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "incidents", label: "Incidents", icon: AlertTriangle },
  { id: "isolated", label: "Isolated Devices", icon: Lock },
  { id: "quarantine", label: "Quarantine Zones", icon: MapPin },
  { id: "playbooks", label: "Playbooks", icon: BookOpen },
  { id: "dashboard", label: "Metrics", icon: BarChart3 },
];
