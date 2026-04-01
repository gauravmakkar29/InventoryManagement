import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  Rocket,
  Shield,
  FileBox,
  ClipboardList,
  BarChart3,
  Users,
  Thermometer,
  ShieldAlert,
  Fingerprint,
  FileText,
} from "lucide-react";
import { cn } from "../../../lib/utils";

/**
 * Story 16.5: Command Palette (Cmd+K / Ctrl+K)
 *
 * Quick navigation overlay triggered by keyboard shortcut.
 * Grouped results, keyboard navigable (arrow keys, Enter, Escape).
 */

interface PaletteItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, group: "Pages" },
  { label: "Inventory", path: "/inventory", icon: Package, group: "Pages" },
  { label: "Deployment", path: "/deployment", icon: Rocket, group: "Pages" },
  { label: "Compliance", path: "/compliance", icon: Shield, group: "Pages" },
  { label: "SBOM", path: "/sbom", icon: FileBox, group: "Pages" },
  { label: "Service Orders", path: "/account-service", icon: ClipboardList, group: "Pages" },
  { label: "Analytics", path: "/analytics", icon: BarChart3, group: "Pages" },
  { label: "Telemetry", path: "/telemetry", icon: Thermometer, group: "Pages" },
  { label: "Incidents", path: "/incidents", icon: ShieldAlert, group: "Pages" },
  { label: "Digital Twin", path: "/digital-twin", icon: Fingerprint, group: "Pages" },
  { label: "Executive Summary", path: "/executive-summary", icon: FileText, group: "Pages" },
  { label: "User Management", path: "/user-management", icon: Users, group: "Admin" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const filtered = PALETTE_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path);
      close();
    },
    [navigate, close],
  );

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex].path);
        }
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
    }
  };

  if (!open) return null;

  // Group items
  const groups = new Map<string, PaletteItem[]>();
  for (const item of filtered) {
    const group = groups.get(item.group) ?? [];
    group.push(item);
    groups.set(item.group, group);
  }

  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={close}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      {/* Palette */}
      <div
        className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-border px-4">
          <svg
            className="h-4 w-4 shrink-0 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="h-12 flex-1 bg-transparent px-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
            aria-label="Search pages"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[12px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-[14px] text-muted-foreground">No results found</p>
          )}
          {Array.from(groups.entries()).map(([group, items]) => (
            <div key={group}>
              <p className="px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </p>
              {items.map((item) => {
                const Icon = item.icon;
                const idx = flatIndex++;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item.path)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[14px]",
                      idx === selectedIndex
                        ? "bg-accent/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    role="option"
                    aria-selected={idx === selectedIndex}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
