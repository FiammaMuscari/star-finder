import React, { memo, useCallback } from "react";
import { LANGUAGE_COLORS, LANGUAGES } from "../constants";
import type { LanguageFilterProps } from "../types";

export const LanguageFilter: React.FC<LanguageFilterProps> = memo(
  ({ selectedLanguage, onLanguageChange }) => {
    const handleLanguageClick = useCallback(
      (language: string) => {
        onLanguageChange(language);
      },
      [onLanguageChange]
    );

    return (
      <div className="mx-auto my-4 flex w-full max-w-5xl flex-wrap justify-center gap-2 rounded-[28px] border border-white/10 bg-slate-950/35 p-3 backdrop-blur-md">
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang;

          return (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageClick(lang)}
              className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${LANGUAGE_COLORS[lang]} ${
                isSelected ? "scale-105 bg-opacity-35 shadow-lg" : "bg-opacity-10"
              }`}
            >
              {lang}
            </button>
          );
        })}
      </div>
    );
  }
);

LanguageFilter.displayName = "LanguageFilter";
