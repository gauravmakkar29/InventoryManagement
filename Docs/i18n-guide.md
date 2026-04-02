# Internationalization (i18n) Guide

This project uses **react-i18next** for internationalization. This document covers how to add new locales, extract strings, and follow naming conventions.

## Architecture

- **Library:** `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- **Configuration:** `src/lib/i18n.ts`
- **Locale files:** `src/locales/{locale-code}.json`
- **Locale switcher:** `src/app/components/locale-switcher.tsx`
- **Initialization:** Imported in `src/main.tsx` (side-effect import)

## Supported Locales

| Code    | Language | Status                      |
| ------- | -------- | --------------------------- |
| `en-US` | English  | Complete                    |
| `es-ES` | Spanish  | Proof-of-concept (~80 keys) |

## How to Add a New Locale

1. **Create the locale file** at `src/locales/{code}.json` (e.g., `src/locales/fr-FR.json`). Copy `en-US.json` as a starting point and translate all values.

2. **Register the locale** in `src/lib/i18n.ts`:

   ```typescript
   import frFR from "../locales/fr-FR.json";

   // Add to SUPPORTED_LOCALES
   export const SUPPORTED_LOCALES = [
     { code: "en-US", label: "English", dir: "ltr" as const },
     { code: "es-ES", label: "Espanol", dir: "ltr" as const },
     { code: "fr-FR", label: "Francais", dir: "ltr" as const },
   ] as const;

   // Add to resources
   const resources = {
     "en-US": { translation: enUS },
     "es-ES": { translation: esES },
     "fr-FR": { translation: frFR },
   };
   ```

3. **For RTL locales** (e.g., Arabic), set `dir: "rtl"`. The framework automatically sets `document.documentElement.dir` on language change.

## How to Extract and Use Strings

### In Components

```typescript
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t("devices.title")}</h1>;
}
```

### With Interpolation

```json
{
  "devices": {
    "countLabel": "{{count}} devices found"
  }
}
```

```typescript
t("devices.countLabel", { count: 42 });
// => "42 devices found"
```

### Outside React Components

```typescript
import i18n from "../lib/i18n";
const label = i18n.t("common.save");
```

## Translation Key Naming Conventions

Keys are nested by feature area using dot notation:

| Prefix         | Usage                             |
| -------------- | --------------------------------- |
| `common.*`     | Shared buttons, labels, actions   |
| `nav.*`        | Sidebar navigation labels         |
| `auth.*`       | Authentication-related strings    |
| `devices.*`    | Hardware inventory page           |
| `deployment.*` | Firmware deployment page          |
| `compliance.*` | Compliance and vulnerability page |
| `app.*`        | App-level chrome (title, sidebar) |

### Rules

- Use **camelCase** for key segments: `nav.serviceOrders`, not `nav.service-orders`
- Group related strings under a common parent: `devices.status.active`
- Keep keys descriptive but concise
- Always add new keys to `en-US.json` first (it is the source of truth)
- Nest status/enum values: `deployment.status.pending`

## Date and Number Formatting

Use the built-in `Intl` APIs for locale-aware formatting rather than translation strings:

```typescript
import { useTranslation } from "react-i18next";

function FormattedDate({ date }: { date: Date }) {
  const { i18n } = useTranslation();
  const formatted = new Intl.DateTimeFormat(i18n.language, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
  return <span>{formatted}</span>;
}

function FormattedNumber({ value }: { value: number }) {
  const { i18n } = useTranslation();
  const formatted = new Intl.NumberFormat(i18n.language).format(value);
  return <span>{formatted}</span>;
}
```

## RTL Support

- The `dir` attribute on `<html>` is automatically updated when the locale changes
- Tailwind CSS supports logical properties (e.g., `ms-4` instead of `ml-4` for start margin)
- When adding new layouts, prefer logical properties (`start`/`end`) over physical (`left`/`right`)
- RTL locales are configured via the `dir` field in `SUPPORTED_LOCALES`

## Language Detection

The browser language detector checks (in order):

1. `localStorage` key `ims-locale` (persisted user preference)
2. Browser `navigator.language`

Fallback is always `en-US`.

## Testing

When writing tests for i18n components, mock the `useTranslation` hook:

```typescript
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en-US", changeLanguage: vi.fn() },
  }),
}));
```

Or use the real i18n setup by importing `src/lib/i18n` in your test setup file.
