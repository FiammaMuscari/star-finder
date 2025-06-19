import React, { useCallback, memo, useEffect } from "react";
import type { SearchBarProps } from "../types";

export const SearchBar: React.FC<SearchBarProps> = memo(
  ({ value, onChange, onSearch }) => {
    // Efecto para resetear cuando el campo esté vacío
    useEffect(() => {
      if (value.trim() === "") {
        onSearch();
      }
    }, [value, onSearch]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          onSearch();
        }
      },
      [onSearch]
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    const handleButtonClick = useCallback(() => {
      onSearch();
    }, [onSearch]);

    return (
      <div className="flex justify-center items-center w-full max-w-md mx-auto">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search repositories..."
          className="border border-gray-300 rounded-lg p-2 flex-grow max-w-full"
        />
        <button
          onClick={handleButtonClick}
          className="ml-2 bg-blue-500 text-white rounded-lg px-4 py-2"
        >
          Search
        </button>
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";
