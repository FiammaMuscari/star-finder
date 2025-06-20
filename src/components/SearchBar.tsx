import React, { useCallback, memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SearchBarProps } from "../types";

export const SearchBar: React.FC<SearchBarProps> = memo(
  ({ value, onChange, onSearch }) => {
    const { t } = useTranslation();

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
      <div className="relative flex w-full max-w-2xl mx-auto mb-6">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("search")}
          className="w-full px-4 py-3 text-lg bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
        />
        <button
          onClick={handleButtonClick}
          className="ml-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 transition-colors duration-200"
        >
          {t("search.button")}
        </button>
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";
