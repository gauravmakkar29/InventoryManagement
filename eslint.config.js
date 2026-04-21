import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "infra", "e2e"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Accessibility: jsx-a11y recommended ruleset (WCAG 2.1 AA enforcement)
      ...jsxA11y.configs.recommended.rules,
      // Pragmatic overrides — warn instead of error for rules that need
      // incremental adoption across existing components
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/label-has-associated-control": [
        "warn",
        {
          labelComponents: ["Label"],
          controlComponents: ["Input", "Select", "Textarea"],
          assert: "either",
          depth: 3,
        },
      ],
      // Code quality
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  // Epic 28 — compliance library must remain domain-agnostic.
  // The primitives under src/lib/compliance/** must not import from any
  // feature folder; keeping this enforced is what lets the library be
  // re-used by template consumers in other domains.
  {
    files: ["src/lib/compliance/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/lib/firmware/**",
                "**/lib/device*",
                "**/lib/sbom*",
                "**/lib/customer*",
                "**/app/components/firmware/**",
                "**/app/components/inventory/**",
                "**/app/components/deployment/**",
                "**/app/components/sbom/**",
                "**/app/components/analytics/**",
              ],
              message:
                "Compliance primitives must remain domain-agnostic (Epic 28). Import only generic utilities and @tanstack/react-query / lucide-react / @/lib/rbac / @/lib/audit / @/lib/query-keys / @/lib/feature-flags.",
            },
          ],
        },
      ],
    },
  },
);
