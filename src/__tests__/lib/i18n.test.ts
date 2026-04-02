import { describe, it, expect, afterEach } from "vitest";
import i18n, { SUPPORTED_LOCALES } from "@/lib/i18n";

describe("i18n configuration", () => {
  afterEach(async () => {
    // Reset to default language after each test
    await i18n.changeLanguage("en-US");
  });

  it("initializes with en-US as default language", () => {
    expect(i18n.language).toBe("en-US");
  });

  it("has en-US as fallback language", () => {
    expect(i18n.options.fallbackLng).toEqual(["en-US"]);
  });

  it("resolves English translation keys", () => {
    expect(i18n.t("common.save")).toBe("Save");
    expect(i18n.t("nav.dashboard")).toBe("Dashboard");
    expect(i18n.t("auth.signIn")).toBe("Sign In");
  });

  it("switches to Spanish locale", async () => {
    await i18n.changeLanguage("es-ES");
    expect(i18n.language).toBe("es-ES");
    expect(i18n.t("common.save")).toBe("Guardar");
    expect(i18n.t("nav.dashboard")).toBe("Panel");
    expect(i18n.t("auth.signIn")).toBe("Iniciar Sesi\u00f3n");
  });

  it("falls back to en-US for missing keys in other locales", async () => {
    await i18n.changeLanguage("es-ES");
    // All keys should resolve (either translated or fallback)
    // A completely missing key returns the key itself
    const result = i18n.t("nonexistent.key");
    expect(result).toBe("nonexistent.key");
  });

  it("exports supported locales with required fields", () => {
    expect(SUPPORTED_LOCALES.length).toBeGreaterThanOrEqual(2);
    for (const locale of SUPPORTED_LOCALES) {
      expect(locale).toHaveProperty("code");
      expect(locale).toHaveProperty("label");
      expect(locale).toHaveProperty("dir");
      expect(["ltr", "rtl"]).toContain(locale.dir);
    }
  });

  it("supports nested translation keys", () => {
    expect(i18n.t("devices.status.active")).toBe("Active");
    expect(i18n.t("deployment.status.pending")).toBe("Pending");
    expect(i18n.t("compliance.severity.critical")).toBe("Critical");
  });
});
