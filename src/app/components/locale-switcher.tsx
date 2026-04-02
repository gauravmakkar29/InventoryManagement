import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  compact?: boolean;
}

export function LocaleSwitcher({ compact = false }: LocaleSwitcherProps) {
  const { i18n } = useTranslation();

  const currentLocale =
    SUPPORTED_LOCALES.find((l) => l.code === i18n.language) ?? SUPPORTED_LOCALES[0];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    i18n.changeLanguage(e.target.value);
  }

  return (
    <select
      value={currentLocale.code}
      onChange={handleChange}
      aria-label="Select language"
      className={cn(
        "rounded-md border border-border bg-card text-foreground text-[13px] font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "cursor-pointer hover:bg-muted transition-colors duration-150",
        compact ? "w-full px-1 py-1 text-center" : "w-full px-2 py-1.5",
      )}
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <option key={locale.code} value={locale.code}>
          {compact ? locale.code.split("-")[0]!.toUpperCase() : locale.label}
        </option>
      ))}
    </select>
  );
}
