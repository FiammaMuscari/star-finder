import React from "react";
import type { SearchBarProps } from "../types";

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
}) => {
  return (
    <div className="flex items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search repositories..."
        className="border border-gray-300 rounded-lg p-2 flex-grow"
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