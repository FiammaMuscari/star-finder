import React, { useCallback, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SearchBar } from "./components/SearchBar";
import { LanguageFilter } from "./components/LanguageFilter";
import { TimeRangeFilter } from "./components/TimeRangeFilter";
import { RepositoryList } from "./components/RepositoryList";
import { Header } from "./components/Header";
import { useGithubSearch } from "./hooks/useGithubSearch";
import type { FilterState } from "./types";
import { BgEffect } from "./components/ParticlesBackground";
import ScrollToTopButton from "./components/ScrollToTopButton";

const App: React.FC = () => {
  // Move i18n to the top level
  const { i18n } = useTranslation();

  const [filterState, setFilterState] = useState<FilterState>({
    language: "",
    timeRange: "30d",
    filterMode: "created",
    searchQuery: "",
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const { repositories, loading, error } = useGithubSearch(filterState);

  // Language toggle handler
  const toggleLanguage = useCallback(() => {
    const newLang = i18n.language === "es" ? "en" : "es";
    i18n.changeLanguage(newLang);
  }, [i18n]);

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
      searchQuery: searchQuery,
    }));
  }, [searchQuery]);

  // Memoize the search bar props to prevent unnecessary re-renders
  const searchBarProps = useMemo(
    () => ({
      value: searchQuery,
      onChange: handleSearchChange,
      onSearch: handleSearchSubmit,
    }),
    [searchQuery, handleSearchChange, handleSearchSubmit]
  );

  // Memoize the language filter props
  const languageFilterProps = useMemo(
    () => ({
      selectedLanguage: filterState.language,
      onLanguageChange: handleLanguageChange,
    }),
    [filterState.language, handleLanguageChange]
  );

  // Memoize the time range filter props
  const timeRangeFilterProps = useMemo(
    () => ({
      selectedRange: filterState.timeRange,
      filterMode: filterState.filterMode,
      onRangeSelect: handleRangeSelect,
      onModeToggle: handleModeToggle,
    }),
    [
      filterState.timeRange,
      filterState.filterMode,
      handleRangeSelect,
      handleModeToggle,
    ]
  );

  // Memoize the repository list props
  const repositoryListProps = useMemo(
    () => ({
      repositories,
      loading,
    }),
    [repositories, loading]
  );

  // Memoize the error display
  const errorDisplay = useMemo(() => {
    if (!error) return null;
    return <div className="text-red-500">{error}</div>;
  }, [error]);

  return (
    <div className="relative min-h-screen">
      <BgEffect />

      <Header
        currentLanguage={i18n.language}
        onToggleLanguage={toggleLanguage}
      />

      <div className="relative z-10 p-2 sm:p-4 flex flex-col w-full justify-center">
        <section className="w-full flex flex-col m-auto justify-center z-20">
          <div className="relative flex justify-center items-center mb-6">
            <div className="absolute bg-white opacity-30 rounded-full w-24 h-24 sm:w-40 sm:h-40 z-20 animate-pulseVibration"></div>
            {!imageLoaded && (
              <div className="h-24 w-24 sm:h-40 sm:w-40 flex items-center justify-center relative z-40">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-white"></div>
              </div>
            )}
            <img
              src="/octocat.png"
              alt="octocat"
              className={`h-24 w-24 sm:h-40 sm:w-40 p-2 sm:p-4 flex m-auto relative z-40 transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          <SearchBar {...searchBarProps} />
          <LanguageFilter {...languageFilterProps} />
          <TimeRangeFilter {...timeRangeFilterProps} />
        </section>
        <RepositoryList {...repositoryListProps} />
        {errorDisplay}
        <ScrollToTopButton />
      </div>

      <footer className="relative z-10 text-center py-4 text-white/70 text-sm">
        Powered by Fiamy {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
