import React from "react";
import type { SearchBarProps } from "../types";

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };
  return (
    <div className="flex justify-center items-center w-full max-w-md mx-auto">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search repositories..."
        className="border border-gray-300 rounded-lg p-2 flex-grow max-w-full"
      />
      <button
        onClick={onSearch}
        className="ml-2 bg-blue-500 text-white rounded-lg px-4 py-2"
      >
        Search
      </button>
    </div>
  );
};
