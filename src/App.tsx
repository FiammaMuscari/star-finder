import React, { useState } from "react";
import { SearchBar } from "./components/SearchBar";
import { LanguageFilter } from "./components/LanguageFilter";
import { TimeRangeFilter } from "./components/TimeRangeFilter";
import { RepositoryList } from "./components/RepositoryList";
import { useGithubSearch } from "./hooks/useGithubSearch";
import type { FilterState } from "./types";

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
    <div className="container mx-auto p-4">
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
      <RepositoryList repositories={repositories} loading={loading} />
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export default App;
