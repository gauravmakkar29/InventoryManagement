import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enUS from "../locales/en-US.json";
import esES from "../locales/es-ES.json";

/** Supported locales with display labels */
export const SUPPORTED_LOCALES = [
  { code: "en-US", label: "English", dir: "ltr" as const },
  { code: "es-ES", label: "Espa\u00f1ol", dir: "ltr" as const },
] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]["code"];

const resources = {
  "en-US": { translation: enUS },
  "es-ES": { translation: esES },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en-US",
    supportedLngs: SUPPORTED_LOCALES.map((l) => l.code),
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "ims-locale",
      caches: ["localStorage"],
    },
  });

/** Update the document dir attribute when locale changes */
function updateDocumentDirection(lng: string): void {
  const locale = SUPPORTED_LOCALES.find((l) => l.code === lng);
  const dir = locale?.dir ?? "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
}

// Set initial direction
updateDocumentDirection(i18n.language);

// Update direction on language change
i18n.on("languageChanged", updateDocumentDirection);

export default i18n;
