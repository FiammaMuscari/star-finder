import React from "react";
import { LANGUAGES, LANGUAGE_COLORS } from "../constants";
import type { LanguageFilterProps } from "../types";

export const LanguageFilter: React.FC<LanguageFilterProps> = ({
  selectedLanguage,
  onLanguageChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {LANGUAGES.map((lang) => {
        const isSelected = selectedLanguage === lang;

        return (
          <button
            key={lang}
            onClick={() => onLanguageChange(lang)}
            className={`px-4 py-2 my-4 rounded-full border transition-all
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
};
