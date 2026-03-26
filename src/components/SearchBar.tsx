import React, { memo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SearchBarProps } from "../types";

export const SearchBar: React.FC<SearchBarProps> = memo(
  ({ value, onChange, onSearch }) => {
    const { t } = useTranslation();

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

    return (
      <div className="relative mx-auto mb-6 flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("search")}
          className="w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-base text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 sm:text-lg"
        />
        <button
          type="button"
          onClick={onSearch}
          className="w-full rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 transition-colors duration-200 hover:bg-cyan-200 sm:w-auto"
        >
          {t("search.button")}
        </button>
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";
