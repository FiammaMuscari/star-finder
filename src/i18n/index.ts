import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(HttpBackend) // Load translations using http (default public/locales)
  .use(LanguageDetector) // Detect language from browser
  .use(initReactI18next) // Pass to react-i18next
  .init({
    fallbackLng: ["es", "en"],
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  });

export default i18n;
