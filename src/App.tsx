import React, { useState } from "react";
import { SearchBar } from "./components/SearchBar";
import { LanguageFilter } from "./components/LanguageFilter";
import { TimeRangeFilter } from "./components/TimeRangeFilter";
import { RepositoryList } from "./components/RepositoryList";
import { useGithubSearch } from "./hooks/useGithubSearch";
import type { FilterState } from "./types";
import { BgEffect } from "./components/ParticlesBackground";
import ScrollToTopButton from "./components/ScrollToTopButton"; // Importa el botón

const App: React.FC = () => {
  const [filterState, setFilterState] = useState<FilterState>({
    language: "",
    timeRange: "30d",
    filterMode: "created",
    searchQuery: "",
  });

  const { repositories, loading, error } = useGithubSearch(filterState);

  const handleLanguageChange = (language: string) => {
    setFilterState({
      ...filterState,
      language,
    });
  };

  const handleRangeSelect = (range: string) => {
    setFilterState({
      ...filterState,
      timeRange: range,
    });
  };

  const handleModeToggle = () => {
    setFilterState({
      ...filterState,
      filterMode: filterState.filterMode === "created" ? "updated" : "created",
    });
  };

  const handleSearchChange = (query: string) => {
    setFilterState({
      ...filterState,
      searchQuery: query,
    });
  };

  const handleSearchSubmit = () => {
    setFilterState({ ...filterState });
  };

  return (
    <div className="relative z-10 p-4 flex flex-col w-full justify-center">
      {/* Fondo de partículas */}
      <BgEffect />

      {/* Contenido principal */}
      <section className="w-full flex flex-col m-auto justify-center z-20">
        <SearchBar
          value={filterState.searchQuery}
          onChange={handleSearchChange}
          onSearch={handleSearchSubmit}
        />
        <LanguageFilter
          selectedLanguage={filterState.language}
          onLanguageChange={handleLanguageChange}
        />
        <TimeRangeFilter
          selectedRange={filterState.timeRange}
          filterMode={filterState.filterMode}
          onRangeSelect={handleRangeSelect}
          onModeToggle={handleModeToggle}
        />
      </section>
      <RepositoryList repositories={repositories} loading={loading} />
      {error && <div className="text-red-500">{error}</div>}
      <ScrollToTopButton />
    </div>
  );
};

export default App;
