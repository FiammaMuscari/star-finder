import React from "react";
import { LANGUAGES } from "../constants";
import type { LanguageFilterProps } from "../types";

export const LanguageFilter: React.FC<LanguageFilterProps> = ({
  selectedLanguage,
  onLanguageChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => onLanguageChange(lang)}
          className={`px-4 py-2 rounded-full transition-all ${
            selectedLanguage === lang
              ? "bg-blue-100 text-blue-800 border-2 border-blue-500"
              : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
};
