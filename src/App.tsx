import React, { useState } from "react";
import { SearchBar } from "./components/SearchBar";
import { LanguageFilter } from "./components/LanguageFilter";
import { TimeRangeFilter } from "./components/TimeRangeFilter";
import { RepositoryList } from "./components/RepositoryList";
import { useGithubSearch } from "./hooks/useGithubSearch";
import type { FilterState } from "./types";
import { BgEffect } from "./components/ParticlesBackground";
import ScrollToTopButton from "./components/ScrollToTopButton";

const App: React.FC = () => {
  const [filterState, setFilterState] = useState<FilterState>({
    language: "",
    timeRange: "30d",
    filterMode: "created",
    searchQuery: "",
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { repositories, loading, error } = useGithubSearch(filterState);

  const handleLanguageChange = (language: string) => {
    setFilterState((prev) => ({
      ...prev,
      language,
    }));
  };

  const handleRangeSelect = (range: string) => {
    setFilterState((prev) => ({
      ...prev,
      timeRange: range,
    }));
  };

  const handleModeToggle = () => {
    setFilterState((prev) => ({
      ...prev,
      filterMode: prev.filterMode === "created" ? "updated" : "created",
    }));
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchSubmit = () => {
    setFilterState((prev) => ({
      ...prev,
      searchQuery: searchQuery,
    }));
  };
  return (
    <div className="relative z-10 p-2 sm:p-4 flex flex-col w-full justify-center">
      <BgEffect />

      <section className="w-full flex flex-col m-auto justify-center z-20">
        <div className="relative flex justify-center items-center mb-6">
          <div className="absolute bg-white opacity-30 rounded-full w-24 h-24 sm:w-40 sm:h-40 z-20 animate-pulseVibration"></div>
          <img
            src="/octocat.png"
            alt="octocat"
            className="h-24 w-24 sm:h-40 sm:w-40 p-2 sm:p-4 flex m-auto relative z-40"
          />
        </div>
        <SearchBar
          value={searchQuery}
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
