import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Theme toggle button — Sun/Moon icon switch.
 * Story 16.1: Dual-Theme System (Light & Dark Mode)
 *
 * - Persists preference via next-themes (localStorage)
 * - Respects OS system preference when no user choice
 * - Keyboard accessible: Enter/Space to toggle
 * - ARIA role="switch" with aria-checked
 * - 150ms transition, respects prefers-reduced-motion
 */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const toggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg",
        "text-foreground/60 hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
      )}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}
