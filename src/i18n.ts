import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      search: "Search repositories...",
      "search.button": "Search",
      language: "Language",
      timeRange: "Time Range",
      created: "Created ",
      updated: "Updated",
      loading: "Loading...",
      error: "An error occurred",
      noResults: "No repositories found",
      stars: "stars",
      forks: "forks",
      lastUpdated: "Last updated",
      viewOnGithub: "View on GitHub",
      week: "week",
      month: "month",
      months: "months",
      year: "year",
      sinceGithub: "Since GitHub",
      discoverTitle: "Trending repositories",
      discoverSubtitle:
        "Browse popular projects without getting trapped in endless scrolling.",
      showingResults: "{{shown}} of {{total}} repositories",
      loadMore: "Load more repositories",
      endOfResults: "You reached the end. The footer is right below.",
      repoDescriptionFallback:
        "This repository does not include a description yet.",
      adPreview: "Ad preview",
      adInfo:
        "If this area stays empty in production, the most common causes are ad blockers, an unapproved domain, or AdSense not serving on localhost.",
      sponsored: "Sponsored",
    },
  },
  es: {
    translation: {
      search: "Buscar repositorios...",
      "search.button": "Buscar",
      language: "Lenguaje",
      timeRange: "Rango de tiempo",
      created: "Creado ",
      updated: "Actualizado",
      loading: "Cargando...",
      error: "Ocurrio un error",
      noResults: "No se encontraron repositorios",
      stars: "estrellas",
      forks: "forks",
      lastUpdated: "Ultima actualizacion",
      viewOnGithub: "Ver en GitHub",
      week: "semana",
      month: "mes",
      months: "meses",
      year: "año",
      sinceGithub: "Desde GitHub",
      discoverTitle: "Repositorios en tendencia",
      discoverSubtitle:
        "Explora proyectos populares sin quedar atrapado en un scroll infinito.",
      showingResults: "{{shown}} de {{total}} repositorios",
      loadMore: "Cargar mas repositorios",
      endOfResults: "Llegaste al final. El footer esta justo abajo.",
      repoDescriptionFallback:
        "Este repositorio todavia no tiene descripcion.",
      adPreview: "Vista previa del anuncio",
      adInfo:
        "Si este espacio sigue vacio en produccion, lo mas comun es un bloqueador, un dominio sin aprobar o que AdSense no sirva anuncios en localhost.",
      sponsored: "Patrocinado",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "es",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
