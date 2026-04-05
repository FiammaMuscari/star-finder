import React, { useCallback, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { LanguageFilter } from "./components/LanguageFilter";
import { TimeRangeFilter } from "./components/TimeRangeFilter";
import { RepositoryList } from "./components/RepositoryList";
import { BgEffect } from "./components/ParticlesBackground";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { LanguageToggle } from "./components/LanguageToggle";
import { AdBanner } from "./components/AdBanner";
import { TrendingPreviewSection } from "./components/TrendingPreviewSection";
import { useGithubSearch } from "./hooks/useGithubSearch";
import { usePageMeta } from "./hooks/usePageMeta";
import type { FilterState } from "./types";
import { useTranslation } from "react-i18next";

const App: React.FC = () => {
  const { t } = useTranslation();
  const [filterState, setFilterState] = useState<FilterState>({
    language: "",
    timeRange: "30d",
    filterMode: "created",
    searchQuery: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const {
    repositories,
    loading,
    error,
    loadMore,
    hasMore,
    totalCount,
    prefetchSearch,
  } =
    useGithubSearch(filterState);

  usePageMeta({
    title: "Star Finder | Discover trending GitHub repositories",
    description:
      "Star Finder helps developers discover trending GitHub repositories by language, recency, and activity without endless scrolling.",
  });

  const handleLanguageChange = useCallback((language: string) => {
    setFilterState((prev) => ({
      ...prev,
      language,
    }));
  }, []);

  const handleRangeSelect = useCallback((range: string) => {
    setFilterState((prev) => ({
      ...prev,
      timeRange: range,
    }));
  }, []);

  const handleModeToggle = useCallback(() => {
    setFilterState((prev) => ({
      ...prev,
      filterMode: prev.filterMode === "created" ? "updated" : "created",
    }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setFilterState((prev) => ({
      ...prev,
      searchQuery,
    }));
  }, [searchQuery]);

  const handleLanguagePrefetch = useCallback(
    (language: string) => {
      if (language === filterState.language) {
        return;
      }

      prefetchSearch({
        ...filterState,
        language,
      });
    },
    [filterState, prefetchSearch]
  );

  const handleRangePrefetch = useCallback(
    (timeRange: string) => {
      if (timeRange === filterState.timeRange) {
        return;
      }

      prefetchSearch({
        ...filterState,
        timeRange,
      });
    },
    [filterState, prefetchSearch]
  );

  const handleModePrefetch = useCallback(
    (filterMode: FilterState["filterMode"]) => {
      if (filterMode === filterState.filterMode) {
        return;
      }

      prefetchSearch({
        ...filterState,
        filterMode,
      });
    },
    [filterState, prefetchSearch]
  );

  const searchBarProps = useMemo(
    () => ({
      value: searchQuery,
      onChange: handleSearchChange,
      onSearch: handleSearchSubmit,
    }),
    [handleSearchChange, handleSearchSubmit, searchQuery]
  );

  const languageFilterProps = useMemo(
    () => ({
      selectedLanguage: filterState.language,
      onLanguageChange: handleLanguageChange,
      onLanguagePrefetch: handleLanguagePrefetch,
    }),
    [filterState.language, handleLanguageChange, handleLanguagePrefetch]
  );

  const timeRangeFilterProps = useMemo(
    () => ({
      selectedRange: filterState.timeRange,
      filterMode: filterState.filterMode,
      onRangeSelect: handleRangeSelect,
      onModeToggle: handleModeToggle,
      onRangePrefetch: handleRangePrefetch,
      onModePrefetch: handleModePrefetch,
    }),
    [
      filterState.filterMode,
      filterState.timeRange,
      handleModeToggle,
      handleModePrefetch,
      handleRangePrefetch,
      handleRangeSelect,
    ]
  );

  const repositoryListProps = useMemo(
    () => ({
      repositories,
      loading,
      loadMore,
      hasMore,
      totalCount,
    }),
    [repositories, loading, loadMore, hasMore, totalCount]
  );

  const errorDisplay = useMemo(() => {
    if (!error) {
      return null;
    }

    return (
      <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }, [error]);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top,#133353_0%,#091320_42%,#050a13_100%)]">
      <BgEffect />
      <LanguageToggle />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 sm:px-6 lg:px-8">
        <Header />

        <main className="relative flex flex-1 flex-col gap-8">
          <section className="relative z-10 w-full px-0 py-6">
            <div className="relative mb-6 grid place-items-center">
              <div className="absolute h-24 w-24 rounded-full bg-cyan-200/25 blur-xl sm:h-40 sm:w-40" />
              <div className="absolute z-20 h-24 w-24 rounded-full bg-white/10 sm:h-40 sm:w-40" />
              {!imageLoaded && (
                <div className="relative z-30 col-start-1 row-start-1 flex h-24 w-24 items-center justify-center sm:h-40 sm:w-40">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white sm:h-12 sm:w-12" />
                </div>
              )}
              <img
                src="/octocat.png"
                alt="octocat"
                className={`relative z-40 col-start-1 row-start-1 m-auto flex h-24 w-24 p-2 transition-opacity duration-300 sm:h-40 sm:w-40 sm:p-4 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
              />
            </div>

            <SearchBar {...searchBarProps} />
            <LanguageFilter {...languageFilterProps} />
            <TimeRangeFilter {...timeRangeFilterProps} />
          </section>

          <TrendingPreviewSection selectedLanguage={filterState.language} />
          {errorDisplay}
          <RepositoryList {...repositoryListProps} />
        </main>

        <AdBanner />

        <footer className="relative z-10 py-6 text-center text-sm text-white/70">
          {t("poweredBy")}{" "}
          <a
            href="https://github.com/FiammaMuscari"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-white"
          >
            Fiamy
          </a>
        </footer>

        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default App;
