import { Bell, Search, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "../../../lib/use-auth";
import { cn } from "../../../lib/utils";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { email, signOut } = useAuth();

  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4"
      )}
    >
      {/* Left: search */}
      <button
        className={cn(
          "flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground",
          "hover:border-accent/50 hover:text-foreground",
          "w-64"
        )}
        aria-label="Open search (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          Ctrl+K
        </kbd>
      </button>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {/* Notification bell */}
        <button
          className="relative rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
            3
          </span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Separator */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* User */}
        <span className="text-xs text-muted-foreground">{email}</span>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="rounded-sm p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
