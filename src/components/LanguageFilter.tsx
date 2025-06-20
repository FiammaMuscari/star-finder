import React, { useCallback, memo } from "react";
import { LANGUAGES, LANGUAGE_COLORS } from "../constants";
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
      <div className="flex flex-wrap justify-center max-w-4xl m-auto rounded-md my-4 bg-[#434343a2] w-full gap-2">
        {LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang;

          return (
            <button
              key={lang}
              onClick={() => handleLanguageClick(lang)}
              className={`px-4 py-2 my-4 rounded-full border-2 transition-all
              ${LANGUAGE_COLORS[lang]} 
              ${isSelected ? "bg-opacity-40" : "bg-opacity-10"}
            `}
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
