import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      search: "Search repositories...",
      "search.button": "Search",
      language: "Language",
      timeRange: "Time Range",
      created: "Created",
      updated: "Updated",
      loading: "Loading...",
      error: "An error occurred",
      noResults: "No repositories found",
      stars: "stars",
      forks: "forks",
      lastUpdated: "Last updated",
      viewOnGithub: "View on GitHub",
      // Agrega más traducciones según necesites
    },
  },
  es: {
    translation: {
      search: "Buscar repositorios...",
      "search.button": "Buscar",
      language: "Lenguaje",
      timeRange: "Rango de tiempo",
      created: "Creado",
      updated: "Actualizado",
      loading: "Cargando...",
      error: "Ocurrió un error",
      noResults: "No se encontraron repositorios",
      stars: "estrellas",
      forks: "forks",
      lastUpdated: "Última actualización",
      viewOnGithub: "Ver en GitHub",
      // Agrega más traducciones según necesites
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "es", // idioma por defecto
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
